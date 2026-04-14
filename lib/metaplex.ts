import {
  createUmi,
} from "@metaplex-foundation/umi-bundle-defaults";
import {
  generateSigner,
  publicKey,
  sol,
  transactionBuilder,
  type Umi,
} from "@metaplex-foundation/umi";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import {
  createCollection,
  create,
  fetchCollection,
  mplCore,
  ruleSet,
  type CollectionV1,
} from "@metaplex-foundation/mpl-core";

/**
 * fetchCollection often races against RPC propagation right after a launch
 * tx is "confirmed". The collection account exists on-chain but the RPC node
 * hasn't indexed it yet, so the SDK throws AccountNotFoundError. Retry with
 * a short exponential backoff before giving up.
 */
async function fetchCollectionWithRetry(
  umi: Umi,
  address: ReturnType<typeof publicKey>,
  attempts = 8
): Promise<CollectionV1> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fetchCollection(umi, address);
    } catch (err) {
      lastErr = err;
      const delayMs = 500 * Math.pow(1.5, i); // 500ms, 750, 1125, ... up to ~6.4s
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new Error("fetchCollection exhausted retries");
}
import { transferSol } from "@metaplex-foundation/mpl-toolbox";
import type { WalletContextState } from "@solana/wallet-adapter-react";

export const DEVNET_RPC = "https://api.devnet.solana.com";

// Rug.World treasury wallet that receives launch + marketplace fees.
export const RUG_WORLD_TREASURY = "A5rBeqfX7rYfxvCyGyikPNXbozCfHYwBSVHzZfD2hrJa";

// Operator wallet (the server's signer). Exposed via NEXT_PUBLIC_OPERATOR_PUBKEY
// so the client can set it as admin during launch — required for the server to
// be able to mint assets into the collection later.
export const OPERATOR_PUBKEY = process.env.NEXT_PUBLIC_OPERATOR_PUBKEY || "";

export const LAUNCH_FEE_SOL = 1;
export const MARKETPLACE_FEE_BPS = 250; // 2.5%
export const ROYALTY_BPS = 1000; // 10% to stakers (enforced royalties)

export function buildUmi(wallet: WalletContextState, withUploader = false): Umi {
  let umi = createUmi(DEVNET_RPC).use(mplCore());
  if (wallet.publicKey && wallet.signTransaction) {
    umi.use(walletAdapterIdentity(wallet));
  }
  if (withUploader) {
    // dynamic require to avoid bundling Irys when not needed
    // (caller must import withIrys instead, this is just a marker)
  }
  return umi;
}

export type LaunchParams = {
  name: string;
  uri: string;
  stakersVault: string; // wallet receiving 10% royalty (for now, creator itself)
  adminAuthority?: string; // rug.world admin wallet, defaults to creator
};

export type LaunchResult = {
  collectionAddress: string;
  signature: string;
};

/**
 * Launch a collection:
 * 1) Transfer the 1 SOL launch fee to the Rug.World treasury
 * 2) Create a Metaplex Core collection with:
 *    - Royalties plugin (10%) pointing to the stakers vault
 *    - UpdateDelegate plugin (admin authority) so Rug.World can modify
 *      mint-phase metadata mid-launch.
 *
 * We do NOT attach PermanentFreezeDelegate to the collection because a
 * "frozen: true" freeze delegate at the collection level rejects new asset
 * creates under that collection (mpl-core 0x1a: "Neither the asset or any
 * plugins have approved this operation"). Instead we attach a per-asset
 * FreezeDelegate at mint time with the admin wallet as authority, which
 * lets Rug.World freeze/unfreeze individual assets for staking later.
 */
export async function launchCollection(
  wallet: WalletContextState,
  params: LaunchParams
): Promise<LaunchResult> {
  if (!wallet.publicKey) throw new Error("Wallet not connected");
  const umi = buildUmi(wallet);

  const collectionSigner = generateSigner(umi);
  const adminKey = publicKey(params.adminAuthority || wallet.publicKey.toString());
  const stakersKey = publicKey(params.stakersVault);

  let builder = transactionBuilder();

  // 1. Launch fee payment to treasury
  if (LAUNCH_FEE_SOL > 0) {
    builder = builder.add(
      transferSol(umi, {
        destination: publicKey(RUG_WORLD_TREASURY),
        amount: sol(LAUNCH_FEE_SOL),
      })
    );
  }

  // 2. Create the collection
  builder = builder.add(
    createCollection(umi, {
      collection: collectionSigner,
      name: params.name,
      uri: params.uri,
      plugins: [
        {
          type: "Royalties",
          basisPoints: ROYALTY_BPS,
          creators: [
            {
              address: stakersKey,
              percentage: 100,
            },
          ],
          ruleSet: ruleSet("None"),
        },
        {
          type: "UpdateDelegate",
          additionalDelegates: [adminKey],
          authority: {
            type: "Address",
            address: adminKey,
          },
        },
      ],
    })
  );

  const result = await builder.sendAndConfirm(umi, {
    confirm: { commitment: "confirmed" },
  });

  return {
    collectionAddress: collectionSigner.publicKey.toString(),
    signature: Buffer.from(result.signature).toString("base64"),
  };
}

/**
 * Pre-mint N NFTs to the creator's wallet.
 * Used right after launch when the creator asked for a founder allocation.
 * Each NFT is frozen on arrival (inherited from the collection's PermanentFreezeDelegate).
 *
 * Sends one transaction per NFT to stay under the compute/size budget.
 * Returns an array of asset addresses and signatures.
 */
/**
 * Pre-mint a single NFT to the creator's wallet with a fully-prepared metadata URI.
 * Attaches a per-asset FreezeDelegate set to frozen=true so the NFT arrives locked.
 * The authority is the wallet signer (creator/admin) so it can unfreeze for staking.
 */
export async function preMintOne(
  wallet: WalletContextState,
  params: {
    collectionAddress: string;
    name: string;
    uri: string;
  }
): Promise<{ assetAddress: string; signature: string }> {
  if (!wallet.publicKey) throw new Error("Wallet not connected");
  const umi = buildUmi(wallet);

  const collection = await fetchCollectionWithRetry(
    umi,
    publicKey(params.collectionAddress)
  );

  const assetSigner = generateSigner(umi);
  const adminKey = publicKey(wallet.publicKey.toString());

  const tx = await create(umi, {
    asset: assetSigner,
    collection,
    name: params.name,
    uri: params.uri,
    plugins: [
      {
        type: "FreezeDelegate",
        frozen: true,
        authority: { type: "Address", address: adminKey },
      },
    ],
  }).sendAndConfirm(umi, {
    confirm: { commitment: "confirmed" },
  });

  return {
    assetAddress: assetSigner.publicKey.toString(),
    signature: Buffer.from(tx.signature).toString("base64"),
  };
}

/**
 * Bulk pre-mint: batches multiple NFT creates into a few transactions.
 * Solana tx size cap is ~1232 bytes; a Metaplex Core `create` instruction
 * is roughly 200-300 bytes once you include the new asset signer + collection
 * reference, so we conservatively pack 4 per transaction.
 *
 * The user signs ONE transaction per batch (so 100 NFTs -> ~25 signatures
 * instead of 100). Each signature creates 4 NFTs at once.
 */
export const BULK_BATCH_SIZE = 4;

export async function bulkPreMint(
  wallet: WalletContextState,
  params: {
    collectionAddress: string;
    items: Array<{ name: string; uri: string }>;
    batchSize?: number;
    onBatch?: (info: { batchIndex: number; totalBatches: number; minted: number; total: number }) => void;
  }
): Promise<Array<{ assetAddress: string; signature: string }>> {
  if (!wallet.publicKey) throw new Error("Wallet not connected");
  if (params.items.length === 0) return [];
  const umi = buildUmi(wallet);

  const collection = await fetchCollectionWithRetry(
    umi,
    publicKey(params.collectionAddress)
  );

  const adminKey = publicKey(wallet.publicKey.toString());
  const batchSize = Math.max(1, params.batchSize ?? BULK_BATCH_SIZE);
  const totalBatches = Math.ceil(params.items.length / batchSize);
  const results: Array<{ assetAddress: string; signature: string }> = [];

  for (let b = 0; b < totalBatches; b++) {
    const slice = params.items.slice(b * batchSize, (b + 1) * batchSize);
    let builder = transactionBuilder();
    const signers: ReturnType<typeof generateSigner>[] = [];

    for (const item of slice) {
      const s = generateSigner(umi);
      signers.push(s);
      builder = builder.add(
        create(umi, {
          asset: s,
          collection,
          name: item.name,
          uri: item.uri,
          plugins: [
            {
              type: "FreezeDelegate",
              frozen: true,
              authority: { type: "Address", address: adminKey },
            },
          ],
        })
      );
    }

    const tx = await builder.sendAndConfirm(umi, {
      confirm: { commitment: "confirmed" },
    });
    const sig = Buffer.from(tx.signature).toString("base64");

    for (const s of signers) {
      results.push({ assetAddress: s.publicKey.toString(), signature: sig });
    }

    params.onBatch?.({
      batchIndex: b + 1,
      totalBatches,
      minted: results.length,
      total: params.items.length,
    });
  }

  return results;
}

/**
 * Lazy mint: buyer pays mint price + marketplace fee, a single NFT is minted to them.
 * Runs in one transaction:
 *   1) transfer mint price to creator wallet
 *   2) transfer marketplace fee (2.5% of price) to Rug.World treasury
 *   3) create asset under the collection, owned by buyer, frozen
 */
export async function lazyMintToBuyer(
  wallet: WalletContextState,
  params: {
    collectionAddress: string;
    creatorWallet: string;
    priceSol: number;
    name: string;
    uri: string;
  }
): Promise<{ assetAddress: string; signature: string }> {
  if (!wallet.publicKey) throw new Error("Wallet not connected");
  const umi = buildUmi(wallet);

  const collection = await fetchCollectionWithRetry(
    umi,
    publicKey(params.collectionAddress)
  );

  const assetSigner = generateSigner(umi);
  const marketplaceCut = (params.priceSol * MARKETPLACE_FEE_BPS) / 10000;
  const toCreator = params.priceSol - marketplaceCut;

  let builder = transactionBuilder();

  // 1. Mint price to creator
  if (toCreator > 0) {
    builder = builder.add(
      transferSol(umi, {
        destination: publicKey(params.creatorWallet),
        amount: sol(toCreator),
      })
    );
  }

  // 2. Marketplace fee to treasury
  if (marketplaceCut > 0) {
    builder = builder.add(
      transferSol(umi, {
        destination: publicKey(RUG_WORLD_TREASURY),
        amount: sol(marketplaceCut),
      })
    );
  }

  // 3. Mint the NFT to the buyer, frozen, with the creator as freeze authority
  //    (so the buyer cannot unfreeze and dump; only creator/admin/staking
  //    program can toggle).
  const freezeAuthority = publicKey(params.creatorWallet);
  builder = builder.add(
    create(umi, {
      asset: assetSigner,
      collection,
      name: params.name,
      uri: params.uri,
      plugins: [
        {
          type: "FreezeDelegate",
          frozen: true,
          authority: { type: "Address", address: freezeAuthority },
        },
      ],
      // owner defaults to signer (buyer)
    })
  );

  const result = await builder.sendAndConfirm(umi, {
    confirm: { commitment: "confirmed" },
  });

  return {
    assetAddress: assetSigner.publicKey.toString(),
    signature: Buffer.from(result.signature).toString("base64"),
  };
}

/**
 * Admin-only: toggle a single asset's FreezeDelegate.
 * Used by the staking program / admin to unfreeze for staking release
 * or re-freeze for staking entry. Only callable by the freeze authority
 * set on that asset (creator/admin during mint).
 */
export async function setAssetFrozen(
  wallet: WalletContextState,
  params: { assetAddress: string; collectionAddress: string; frozen: boolean }
): Promise<string> {
  if (!wallet.publicKey) throw new Error("Wallet not connected");
  const umi = buildUmi(wallet);

  // Note: would normally use updatePluginV1 against the asset.
  // Left as TODO until the staking flow is wired up.
  void params;
  void umi;
  throw new Error("setAssetFrozen not yet implemented");
}

export type FetchedCollection = CollectionV1;

export async function fetchCollectionState(
  wallet: WalletContextState,
  address: string
): Promise<FetchedCollection> {
  const umi = buildUmi(wallet);
  return await fetchCollection(umi, publicKey(address));
}

const MEMO_PROGRAM_ID = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";

/**
 * Buyer-side: send a single payment transaction based on an intent from
 * `/api/mint/intent`. The tx contains:
 *   - transferSol(creatorRecipient, creatorAmountSol)
 *   - transferSol(treasuryRecipient, treasuryAmountSol)
 *   - memo instruction with the intent's memo text (binds payment to intent)
 *
 * Returns the confirmed tx signature (base58) for `/api/mint/execute`.
 */
export async function sendPaymentForIntent(
  wallet: WalletContextState,
  intent: {
    memo: string;
    creatorRecipient: string;
    creatorAmountSol: number;
    treasuryRecipient: string;
    treasuryAmountSol: number;
  }
): Promise<{ signature: string }> {
  if (!wallet.publicKey) throw new Error("Wallet not connected");
  const umi = buildUmi(wallet);

  let builder = transactionBuilder();

  if (intent.creatorAmountSol > 0) {
    builder = builder.add(
      transferSol(umi, {
        destination: publicKey(intent.creatorRecipient),
        amount: sol(intent.creatorAmountSol),
      })
    );
  }
  if (intent.treasuryAmountSol > 0) {
    builder = builder.add(
      transferSol(umi, {
        destination: publicKey(intent.treasuryRecipient),
        amount: sol(intent.treasuryAmountSol),
      })
    );
  }

  // Add memo instruction - plain UTF-8 bytes, no accounts, Memo program id
  builder = builder.add({
    instruction: {
      programId: publicKey(MEMO_PROGRAM_ID),
      keys: [],
      data: new TextEncoder().encode(intent.memo),
    },
    signers: [],
    bytesCreatedOnChain: 0,
  });

  const result = await builder.sendAndConfirm(umi, {
    confirm: { commitment: "confirmed" },
  });

  const { base58 } = await import("@metaplex-foundation/umi/serializers");
  const sig = base58.deserialize(result.signature)[0];

  return { signature: sig };
}

// Helper to convert a signed tx signature back to the base58 form used by explorers
export function explorerUrl(signature: string, cluster: "devnet" | "mainnet-beta" = "devnet") {
  return `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`;
}

export function accountExplorerUrl(address: string, cluster: "devnet" | "mainnet-beta" = "devnet") {
  return `https://explorer.solana.com/address/${address}?cluster=${cluster}`;
}
