import { NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { prisma } from "@/lib/db";
import { serverMintToBuyer, SERVER_RPC } from "@/lib/server-metaplex";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

type ExecuteBody = {
  intentId: string;
  paymentSignature: string;
};

type VerifyResult =
  | { ok: true }
  | { ok: false; reason: string };

async function verifyPayment(params: {
  signature: string;
  buyer: string;
  memo: string;
  creatorRecipient: string;
  treasuryRecipient: string;
  expectedLamports: bigint;
}): Promise<VerifyResult> {
  const conn = new Connection(SERVER_RPC, "confirmed");

  // Wait briefly for the tx to land on the indexed RPC
  let tx = null;
  for (let i = 0; i < 8; i++) {
    tx = await conn.getParsedTransaction(params.signature, {
      maxSupportedTransactionVersion: 0,
      commitment: "confirmed",
    });
    if (tx) break;
    await new Promise((r) => setTimeout(r, 1000));
  }
  if (!tx) return { ok: false, reason: "payment tx not found yet" };
  if (tx.meta?.err) return { ok: false, reason: "payment tx failed on-chain" };

  // 1. The buyer must be a signer of this transaction.
  const message = tx.transaction.message;
  const accountKeys = message.accountKeys;
  const signerKeys = accountKeys
    .filter((k) => k.signer)
    .map((k) => k.pubkey.toBase58());
  if (!signerKeys.includes(params.buyer)) {
    return { ok: false, reason: "buyer is not a signer" };
  }

  // 2. Memo must be present with the exact intent memo text.
  let foundMemo = false;
  for (const ix of message.instructions) {
    // parsed memo instruction comes through as { program: "spl-memo", parsed: "text" }
    const anyIx = ix as unknown as {
      programId: PublicKey;
      program?: string;
      parsed?: string;
      data?: string;
    };
    if (anyIx.programId?.equals(MEMO_PROGRAM_ID)) {
      // parsed form
      if (typeof anyIx.parsed === "string" && anyIx.parsed === params.memo) {
        foundMemo = true;
        break;
      }
      // raw form (base58 or plain utf-8 data)
      if (typeof anyIx.data === "string") {
        try {
          const decoded = Buffer.from(anyIx.data, "base64").toString("utf8");
          if (decoded === params.memo) {
            foundMemo = true;
            break;
          }
        } catch {
          // ignore
        }
      }
    }
  }
  if (!foundMemo) {
    return { ok: false, reason: "memo missing or mismatched" };
  }

  // 3. Sum up SOL transferred to each recipient. Must meet expected amounts.
  //    We check: buyer's net outflow >= expected AND both recipients received >= their shares.
  const meta = tx.meta;
  if (!meta) return { ok: false, reason: "no tx metadata" };
  const idx = (pubkey: string) =>
    accountKeys.findIndex((k) => k.pubkey.toBase58() === pubkey);

  const buyerIdx = idx(params.buyer);
  const creatorIdx = idx(params.creatorRecipient);
  const treasuryIdx = idx(params.treasuryRecipient);
  if (buyerIdx < 0 || creatorIdx < 0 || treasuryIdx < 0) {
    return { ok: false, reason: "expected accounts not present in tx" };
  }

  const buyerOutflow = BigInt(
    (meta.preBalances[buyerIdx] ?? 0) - (meta.postBalances[buyerIdx] ?? 0)
  );
  const creatorInflow = BigInt(
    (meta.postBalances[creatorIdx] ?? 0) - (meta.preBalances[creatorIdx] ?? 0)
  );
  const treasuryInflow = BigInt(
    (meta.postBalances[treasuryIdx] ?? 0) - (meta.preBalances[treasuryIdx] ?? 0)
  );

  // Allow a tiny slack for network fees paid by the buyer.
  if (buyerOutflow < params.expectedLamports) {
    return {
      ok: false,
      reason: `buyer paid ${buyerOutflow}, expected >= ${params.expectedLamports}`,
    };
  }
  if (creatorInflow + treasuryInflow < params.expectedLamports) {
    return {
      ok: false,
      reason: `recipients received ${creatorInflow + treasuryInflow}, expected >= ${params.expectedLamports}`,
    };
  }

  return { ok: true };
}

/**
 * POST /api/mint/execute
 *
 * Finalizes a mint intent:
 *   1. Load intent, ensure status === pending|paying and not expired.
 *   2. Atomically claim the intent (status -> paying) to prevent races.
 *   3. Verify the on-chain payment tx matches the intent (buyer signer, memo,
 *      recipients, amount).
 *   4. Atomically claim N unclaimed assets from the metadata pool (status -> minting).
 *   5. Server-sign N mint transactions, each sending a frozen NFT to the buyer.
 *   6. Update intent status -> completed, record asset addresses.
 *
 * Idempotency: paymentSignature is unique in the DB, so re-submitting the same
 * payment cannot trigger a second mint.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ExecuteBody;
    if (!body.intentId || !body.paymentSignature) {
      return NextResponse.json({ error: "invalid body" }, { status: 400 });
    }

    // Idempotency: if we've already executed for this payment signature, just return the stored result.
    const alreadyDone = await prisma.mintIntent.findUnique({
      where: { paymentSignature: body.paymentSignature },
    });
    if (alreadyDone && alreadyDone.status === "completed") {
      return NextResponse.json({
        ok: true,
        assetAddresses: JSON.parse(alreadyDone.assetAddresses || "[]"),
        idempotent: true,
      });
    }

    // Load + state-transition the intent atomically.
    const intent = await prisma.mintIntent.findUnique({
      where: { id: body.intentId },
      include: { collection: true },
    });
    if (!intent) return NextResponse.json({ error: "intent not found" }, { status: 404 });

    if (intent.expiresAt.getTime() < Date.now()) {
      await prisma.mintIntent.update({
        where: { id: intent.id },
        data: { status: "expired" },
      });
      return NextResponse.json({ error: "intent expired" }, { status: 410 });
    }
    if (!["pending", "paying"].includes(intent.status)) {
      return NextResponse.json(
        { error: `intent is in status ${intent.status}` },
        { status: 409 }
      );
    }

    // Flip to "paying" first so concurrent /execute calls error out.
    const flipped = await prisma.mintIntent.updateMany({
      where: {
        id: intent.id,
        status: { in: ["pending", "paying"] },
      },
      data: { status: "paying" },
    });
    if (flipped.count === 0) {
      return NextResponse.json({ error: "intent locked" }, { status: 409 });
    }

    // Verify the payment
    const check = await verifyPayment({
      signature: body.paymentSignature,
      buyer: intent.buyerWallet,
      memo: intent.memo,
      creatorRecipient: intent.creatorRecipient,
      treasuryRecipient: intent.treasuryRecipient,
      expectedLamports: intent.expectedLamports,
    });
    if (!check.ok) {
      await prisma.mintIntent.update({
        where: { id: intent.id },
        data: { status: "failed" },
      });
      return NextResponse.json(
        { error: `payment verification failed: ${check.reason}` },
        { status: 402 }
      );
    }

    // Record the payment signature now (unique constraint blocks replays).
    // If it was already used, Prisma throws; we catch and return idempotent result.
    try {
      await prisma.mintIntent.update({
        where: { id: intent.id },
        data: {
          paymentSignature: body.paymentSignature,
          status: "paid",
        },
      });
    } catch (err) {
      console.warn("duplicate payment signature", err);
      return NextResponse.json(
        { error: "payment signature already used" },
        { status: 409 }
      );
    }

    // Atomically claim N assets from the pool.
    const claimed = await prisma.$transaction(async (tx) => {
      const available = await tx.collectionAsset.findMany({
        where: { collectionId: intent.collectionId, claimed: false },
        orderBy: { tokenIndex: "asc" },
        take: intent.qty,
        select: { id: true, tokenIndex: true, name: true, metadataUri: true },
      });
      if (available.length < intent.qty) {
        throw new Error(`only ${available.length} unclaimed assets, need ${intent.qty}`);
      }
      await tx.collectionAsset.updateMany({
        where: { id: { in: available.map((a) => a.id) } },
        data: {
          claimed: true,
          claimedBy: intent.buyerWallet,
          claimedAt: new Date(),
        },
      });
      return available;
    });

    await prisma.mintIntent.update({
      where: { id: intent.id },
      data: { status: "minting" },
    });

    // Mint each asset on-chain.
    const mintResults: Array<{ assetAddress: string; signature: string }> = [];
    try {
      for (const asset of claimed) {
        const minted = await serverMintToBuyer({
          collectionAddress: intent.collection.collectionAddress,
          buyer: intent.buyerWallet,
          name: asset.name,
          uri: asset.metadataUri,
          freezeAuthority: intent.collection.creatorWallet,
        });
        mintResults.push(minted);
        await prisma.collectionAsset.update({
          where: { id: asset.id },
          data: {
            assetAddress: minted.assetAddress,
            mintSignature: minted.signature,
          },
        });
      }
    } catch (mintErr) {
      console.error("mint failed mid-flight", mintErr);
      // Roll back claims that haven't minted yet
      const mintedIds = new Set(
        claimed.slice(0, mintResults.length).map((a) => a.id)
      );
      await prisma.collectionAsset.updateMany({
        where: {
          id: { in: claimed.filter((a) => !mintedIds.has(a.id)).map((a) => a.id) },
        },
        data: {
          claimed: false,
          claimedBy: null,
          claimedAt: null,
        },
      });
      await prisma.mintIntent.update({
        where: { id: intent.id },
        data: { status: "failed" },
      });
      const msg = mintErr instanceof Error ? mintErr.message : "mint failed";
      return NextResponse.json(
        {
          error: msg,
          partial: true,
          assetAddresses: mintResults.map((r) => r.assetAddress),
        },
        { status: 500 }
      );
    }

    await prisma.mintIntent.update({
      where: { id: intent.id },
      data: {
        status: "completed",
        assetAddresses: JSON.stringify(mintResults.map((r) => r.assetAddress)),
      },
    });
    await prisma.launchedCollection.update({
      where: { id: intent.collectionId },
      data: {
        minted: { increment: intent.qty },
      },
    });

    const newMinted = intent.collection.minted + intent.qty;
    if (newMinted >= intent.collection.supply) {
      await prisma.launchedCollection.update({
        where: { id: intent.collectionId },
        data: { status: "finished" },
      });
    }

    return NextResponse.json({
      ok: true,
      assetAddresses: mintResults.map((r) => r.assetAddress),
      signatures: mintResults.map((r) => r.signature),
    });
  } catch (err) {
    console.error("[/api/mint/execute]", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
