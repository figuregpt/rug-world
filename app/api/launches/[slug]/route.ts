import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PatchBody = {
  supply?: number;
  status?: "minting" | "finished" | "abandoned";
  phases?: Array<{
    name: string;
    price: string;
    supply: string;
    maxPerWallet: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
  }>;
};

/**
 * GET /api/launches/[slug]
 * Returns a single launched collection plus its phases and a light
 * summary of the metadata pool (claimed count, not the full list).
 */
export async function GET(
  _: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const col = await prisma.launchedCollection.findUnique({
    where: { slug },
    include: {
      phases: { orderBy: { orderIndex: "asc" } },
      _count: { select: { assets: true } },
    },
  });
  if (!col) return NextResponse.json({ error: "not found" }, { status: 404 });

  const claimedCount = await prisma.collectionAsset.count({
    where: { collectionId: col.id, claimed: true },
  });

  return NextResponse.json({
    collection: {
      ...col,
      assetsTotal: col._count.assets,
      assetsClaimed: claimedCount,
    },
  });
}

/**
 * PATCH /api/launches/[slug]
 * Admin-only endpoint (auth TODO) - updates supply, phases, status.
 * Replaces the whole phases array when `phases` is provided.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = (await req.json()) as PatchBody;

    const existing = await prisma.launchedCollection.findUnique({
      where: { slug },
      select: { id: true, minted: true, supply: true },
    });
    if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

    // Supply cannot drop below already-minted count
    if (body.supply !== undefined && body.supply < existing.minted) {
      return NextResponse.json(
        { error: `supply cannot drop below minted count (${existing.minted})` },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (body.phases) {
        await tx.phase.deleteMany({ where: { collectionId: existing.id } });
        await tx.phase.createMany({
          data: body.phases.map((p, i) => ({
            collectionId: existing.id,
            orderIndex: i,
            name: p.name,
            price: p.price,
            supply: p.supply,
            maxPerWallet: p.maxPerWallet,
            startDate: p.startDate,
            startTime: p.startTime,
            endDate: p.endDate,
            endTime: p.endTime,
          })),
        });
      }
      return tx.launchedCollection.update({
        where: { id: existing.id },
        data: {
          supply: body.supply,
          status: body.status,
        },
        include: { phases: { orderBy: { orderIndex: "asc" } } },
      });
    });

    return NextResponse.json({ ok: true, collection: updated });
  } catch (err) {
    console.error("[/api/launches PATCH]", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
