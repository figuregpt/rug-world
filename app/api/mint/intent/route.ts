import { NextResponse } from "next/server";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { prisma } from "@/lib/db";
import { randomBytes } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 2.5% added on top of the mint price - paid by the buyer
const BUYER_FEE_BPS = 250;
// 2.5% deducted from the creator's share of the mint price
const CREATOR_FEE_BPS = 250;
// Small per-mint buffer that lands in the treasury and is later used to fund
// the operator wallet (Irys uploads, network fees, etc.)
const UPLOAD_BUFFER_PER_MINT_SOL = 0.004;
const INTENT_TTL_MS = 5 * 60 * 1000; // 5 min
const RUG_WORLD_TREASURY = "A5rBeqfX7rYfxvCyGyikPNXbozCfHYwBSVHzZfD2hrJa";

const MAX_QTY_PER_INTENT = 10;

type IntentBody = {
  slug: string;
  buyerWallet: string;
  qty: number;
};

function nowMs(): number {
  return Date.now();
}

// Empty startDate = active immediately; empty endDate = never expires.
function parsePhaseStart(p: { startDate: string; startTime: string }): number {
  if (!p.startDate) return -Infinity;
  return new Date(`${p.startDate}T${p.startTime || "00:00"}`).getTime();
}
function parsePhaseEnd(p: { endDate: string; endTime: string }): number {
  if (!p.endDate) return Infinity;
  return new Date(`${p.endDate}T${p.endTime || "23:59"}`).getTime();
}

/**
 * POST /api/mint/intent
 *
 * Creates a short-lived mint intent for a buyer. The buyer must then sign ONE
 * payment transaction that:
 *   1. transfers `creatorAmount` SOL to `creatorRecipient`
 *   2. transfers `treasuryAmount` SOL to `treasuryRecipient`
 *   3. contains a memo instruction with text === `memo`
 *
 * The expected amount is computed server-side from the active phase's price,
 * so a tampered client cannot reduce what gets paid. The memo binds the
 * payment to this specific intent so random SOL senders cannot claim mints.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as IntentBody;

    if (!body.slug || !body.buyerWallet || !body.qty) {
      return NextResponse.json({ error: "invalid body" }, { status: 400 });
    }
    if (body.qty < 1 || body.qty > MAX_QTY_PER_INTENT) {
      return NextResponse.json(
        { error: `qty must be 1..${MAX_QTY_PER_INTENT}` },
        { status: 400 }
      );
    }

    const col = await prisma.launchedCollection.findUnique({
      where: { slug: body.slug },
      include: { phases: { orderBy: { orderIndex: "asc" } } },
    });
    if (!col) return NextResponse.json({ error: "collection not found" }, { status: 404 });

    if (col.status !== "minting") {
      return NextResponse.json({ error: "collection is not minting" }, { status: 409 });
    }

    // Find the currently active phase
    const now = nowMs();
    const activePhase = col.phases.find((p) => {
      const start = parsePhaseStart(p);
      const end = parsePhaseEnd(p);
      if (now < start) return false;
      if (now >= end) return false;
      return true;
    });
    if (!activePhase) {
      return NextResponse.json({ error: "no active phase right now" }, { status: 409 });
    }

    // Enforce per-wallet limit for the active phase
    const phaseMaxPerWallet = parseInt(activePhase.maxPerWallet) || 0;
    if (phaseMaxPerWallet > 0) {
      const already = await prisma.mintIntent.count({
        where: {
          collectionId: col.id,
          buyerWallet: body.buyerWallet,
          phaseName: activePhase.name,
          status: { in: ["completed", "minting", "paid"] },
        },
      });
      if (already + body.qty > phaseMaxPerWallet) {
        return NextResponse.json(
          {
            error: `per-wallet limit reached for ${activePhase.name} (max ${phaseMaxPerWallet}, already minted ${already})`,
          },
          { status: 409 }
        );
      }
    }

    // Cap by remaining supply in the metadata pool
    const available = await prisma.collectionAsset.count({
      where: { collectionId: col.id, claimed: false },
    });
    if (available < body.qty) {
      return NextResponse.json(
        { error: `only ${available} NFTs left, requested ${body.qty}` },
        { status: 409 }
      );
    }

    // Rate-limit: kill older pending intents from this wallet for this collection
    await prisma.mintIntent.updateMany({
      where: {
        collectionId: col.id,
        buyerWallet: body.buyerWallet,
        status: { in: ["pending", "paying"] },
      },
      data: { status: "expired" },
    });

    // Server-computed amounts (untamperable).
    // Fee model:
    //   buyer pays: basePrice + 2.5% buyer fee + per-mint buffer
    //   creator receives: basePrice - 2.5% creator cut
    //   treasury receives: 2.5% buyer fee + 2.5% creator cut + buffer
    const priceSol = parseFloat(activePhase.price) || 0;
    const baseTotalSol = priceSol * body.qty;
    const buyerFeeSol = (baseTotalSol * BUYER_FEE_BPS) / 10000;
    const creatorFeeSol = (baseTotalSol * CREATOR_FEE_BPS) / 10000;
    const bufferSol = UPLOAD_BUFFER_PER_MINT_SOL * body.qty;

    const toCreatorSol = baseTotalSol - creatorFeeSol;
    const toTreasurySol = buyerFeeSol + creatorFeeSol + bufferSol;
    const totalSol = toCreatorSol + toTreasurySol; // == baseTotalSol + buyerFeeSol + bufferSol
    const expectedLamports = BigInt(Math.floor(totalSol * LAMPORTS_PER_SOL));

    const nonce = randomBytes(16).toString("hex");
    const memo = `rugworld:mint:${nonce}`;
    const expiresAt = new Date(now + INTENT_TTL_MS);

    const intent = await prisma.mintIntent.create({
      data: {
        collectionId: col.id,
        buyerWallet: body.buyerWallet,
        qty: body.qty,
        priceSol: activePhase.price,
        expectedLamports,
        creatorRecipient: col.creatorWallet,
        treasuryRecipient: RUG_WORLD_TREASURY,
        phaseName: activePhase.name,
        nonce,
        memo,
        status: "pending",
        expiresAt,
      },
    });

    return NextResponse.json({
      intentId: intent.id,
      memo,
      creatorRecipient: col.creatorWallet,
      creatorAmountSol: +toCreatorSol.toFixed(6),
      treasuryRecipient: RUG_WORLD_TREASURY,
      treasuryAmountSol: +toTreasurySol.toFixed(6),
      totalSol: +totalSol.toFixed(6),
      expiresAt: expiresAt.toISOString(),
      phase: activePhase.name,
    });
  } catch (err) {
    console.error("[/api/mint/intent]", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
