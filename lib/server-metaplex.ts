import "server-only";
import {
  createUmi,
} from "@metaplex-foundation/umi-bundle-defaults";
import {
  generateSigner,
  keypairIdentity,
  publicKey,
  createGenericFile,
  type Umi,
} from "@metaplex-foundation/umi";
import {
  create,
  fetchCollection,
  mplCore,
} from "@metaplex-foundation/mpl-core";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import { Connection, clusterApiUrl } from "@solana/web3.js";

const RPC = process.env.SOLANA_RPC || "https://api.devnet.solana.com";
const IRYS_NODE = process.env.IRYS_NODE || "https://devnet.irys.xyz";
const CLUSTER: "devnet" | "mainnet-beta" =
  (process.env.SOLANA_CLUSTER as "devnet" | "mainnet-beta") || "devnet";

/**
 * Parse the operator's private key from env. Supports two formats:
 *   - JSON array of bytes (output of `solana-keygen new`): `[1,2,3,...]`
 *   - base58 string (Phantom / Solflare export, `solana-keygen grind` etc.)
 */
function parseSecretKey(envValue: string): Uint8Array {
  const trimmed = envValue.trim();
  if (trimmed.startsWith("[")) {
    return Uint8Array.from(JSON.parse(trimmed));
  }
  // base58 fallback
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const bs58 = require("bs58");
  const decoder = bs58.default ?? bs58;
  const decoded: Uint8Array = decoder.decode(trimmed);
  if (decoded.length !== 64) {
    throw new Error(
      `OPERATOR_PRIVATE_KEY base58 must decode to 64 bytes, got ${decoded.length}`
    );
  }
  return decoded;
}

let cachedUmi: Umi | null = null;

/**
 * Get a Umi instance signed by the server's operator wallet.
 * The operator wallet:
 *   - Is set as the collection admin during launch (see NEXT_PUBLIC_OPERATOR_PUBKEY)
 *   - Pays network fees for all server-driven mints
 *   - Pays Irys upload fees for metadata
 *   - Must be funded with devnet SOL (`solana airdrop 5`)
 */
export function getServerUmi(): Umi {
  if (cachedUmi) return cachedUmi;

  const env = process.env.OPERATOR_PRIVATE_KEY;
  if (!env) {
    throw new Error(
      "OPERATOR_PRIVATE_KEY not set. See .env.example for setup."
    );
  }
  const secret = parseSecretKey(env);

  const umi = createUmi(RPC).use(mplCore()).use(
    irysUploader({ address: IRYS_NODE })
  );
  const operatorKeypair = umi.eddsa.createKeypairFromSecretKey(secret);
  umi.use(keypairIdentity(operatorKeypair));
  cachedUmi = umi;
  return umi;
}

export function getOperatorPublicKey(): string {
  return getServerUmi().identity.publicKey.toString();
}

/**
 * Verify a Solana tx paid at least `minLamports` from `buyer` to any recipient.
 * Used to confirm buyer actually paid before minting their NFT server-side.
 */
export async function verifyPayment(params: {
  signature: string;
  buyer: string;
  minLamports: number;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const conn = new Connection(RPC, "confirmed");

  // Poll briefly in case the tx just landed and hasn't propagated
  let tx = null;
  for (let i = 0; i < 6; i++) {
    tx = await conn.getTransaction(params.signature, {
      maxSupportedTransactionVersion: 0,
      commitment: "confirmed",
    });
    if (tx) break;
    await new Promise((r) => setTimeout(r, 1000));
  }
  if (!tx) return { ok: false, reason: "payment tx not found" };
  if (tx.meta?.err) return { ok: false, reason: "payment tx failed" };

  const accountKeys = tx.transaction.message.getAccountKeys
    ? tx.transaction.message.getAccountKeys().staticAccountKeys
    : [];
  const buyerIdx = accountKeys.findIndex((k) => k.toBase58() === params.buyer);
  if (buyerIdx < 0) return { ok: false, reason: "buyer not in tx" };

  const pre = tx.meta?.preBalances?.[buyerIdx] ?? 0;
  const post = tx.meta?.postBalances?.[buyerIdx] ?? 0;
  const movedFromBuyer = pre - post;
  if (movedFromBuyer < params.minLamports) {
    return {
      ok: false,
      reason: `buyer paid ${movedFromBuyer} lamports, need ${params.minLamports}`,
    };
  }
  return { ok: true };
}

function sanitize(s: string): string {
  return s.replace(/[^a-z0-9_-]+/gi, "_").slice(0, 48) || "asset";
}

/**
 * Upload a raw PNG + metadata JSON to Arweave via Irys. Returns the metadata URI.
 * Called server-side only; the operator wallet pays the upload.
 */
export async function uploadAssetServer(params: {
  imageBytes: Uint8Array;
  name: string;
  description?: string;
  attributes?: Array<{ trait_type: string; value: string }>;
  externalUrl?: string;
}): Promise<{ imageUri: string; metadataUri: string }> {
  const umi = getServerUmi();
  const imgFile = createGenericFile(
    params.imageBytes,
    `${sanitize(params.name)}.png`,
    { contentType: "image/png" }
  );
  const [imageUri] = await umi.uploader.upload([imgFile]);
  const metadataUri = await umi.uploader.uploadJson({
    name: params.name,
    description: params.description,
    image: imageUri,
    external_url: params.externalUrl,
    attributes: params.attributes,
    properties: {
      category: "image",
      files: [{ uri: imageUri, type: "image/png" }],
    },
  });
  return { imageUri, metadataUri };
}

async function fetchCollectionWithRetryServer(
  umi: Umi,
  address: ReturnType<typeof publicKey>,
  attempts = 8
) {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fetchCollection(umi, address);
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 500 * Math.pow(1.5, i)));
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new Error("fetchCollection exhausted retries");
}

/**
 * Mint a single NFT under `collectionAddress` to the buyer's wallet.
 * Server signs. FreezeDelegate attached with the configured freeze authority.
 */
export async function serverMintToBuyer(params: {
  collectionAddress: string;
  buyer: string;
  name: string;
  uri: string;
  freezeAuthority: string;
}): Promise<{ assetAddress: string; signature: string }> {
  const umi = getServerUmi();
  const collection = await fetchCollectionWithRetryServer(
    umi,
    publicKey(params.collectionAddress)
  );
  const assetSigner = generateSigner(umi);

  const tx = await create(umi, {
    asset: assetSigner,
    collection,
    name: params.name,
    uri: params.uri,
    owner: publicKey(params.buyer),
    plugins: [
      {
        type: "FreezeDelegate",
        frozen: true,
        authority: {
          type: "Address",
          address: publicKey(params.freezeAuthority),
        },
      },
    ],
  }).sendAndConfirm(umi, { confirm: { commitment: "confirmed" } });

  return {
    assetAddress: assetSigner.publicKey.toString(),
    signature: Buffer.from(tx.signature).toString("base64"),
  };
}

export const SERVER_CLUSTER = CLUSTER;
export const SERVER_RPC = RPC;
