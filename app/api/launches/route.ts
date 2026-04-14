import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PhaseInput = {
  name: string;
  price: string;
  supply: string;
  maxPerWallet: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
};

type AssetInput = {
  tokenIndex: number;
  metadataUri: string;
  imageUri?: string;
  name: string;
  attributes?: Array<{ trait_type: string; value: string }>;
  isOneOfOne?: boolean;
  // If already pre-minted to creator during launch, set these:
  claimed?: boolean;
  claimedBy?: string;
  assetAddress?: string;
  mintSignature?: string;
};

type CreateLaunchBody = {
  collectionAddress: string;
  collectionUri: string;
  creatorWallet: string;
  txSignature: string;
  network: "devnet" | "mainnet-beta";
  slug: string;
  name: string;
  tagline?: string;
  description?: string;
  supply: number;
  preMintCount: number;
  royaltyFee?: number;
  holderShare?: number;
  teamShare?: number;
  phases: PhaseInput[];
  assets: AssetInput[];
};

/**
 * GET /api/launches
 * List launched collections. Optional ?status=minting|finished|abandoned.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const status = url.searchParams.get("status");

  const collections = await prisma.launchedCollection.findMany({
    where: status ? { status } : undefined,
    include: { phases: { orderBy: { orderIndex: "asc" } } },
    orderBy: { launchedAt: "desc" },
  });

  return NextResponse.json({
    collections: collections.map((c) => ({
      ...c,
      minted: c.minted,
    })),
  });
}

/**
 * POST /api/launches
 * Called by the client right after an on-chain launch succeeds.
 * Saves the collection, its phases, and the full metadata pool (assets).
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateLaunchBody;

    if (
      !body.collectionAddress ||
      !body.creatorWallet ||
      !body.slug ||
      !body.name ||
      !Array.isArray(body.phases) ||
      !Array.isArray(body.assets)
    ) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const created = await prisma.launchedCollection.create({
      data: {
        collectionAddress: body.collectionAddress,
        collectionUri: body.collectionUri,
        creatorWallet: body.creatorWallet,
        txSignature: body.txSignature,
        network: body.network,
        slug: body.slug,
        name: body.name,
        tagline: body.tagline,
        description: body.description,
        supply: body.supply,
        preMintCount: body.preMintCount,
        royaltyFee: body.royaltyFee ?? 10,
        holderShare: body.holderShare ?? 100,
        teamShare: body.teamShare ?? 0,
        minted: body.preMintCount,
        status: "minting",
        phases: {
          create: body.phases.map((p, i) => ({
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
        },
        assets: {
          create: body.assets.map((a) => ({
            tokenIndex: a.tokenIndex,
            metadataUri: a.metadataUri,
            imageUri: a.imageUri,
            name: a.name,
            attributes: a.attributes ? JSON.stringify(a.attributes) : null,
            isOneOfOne: a.isOneOfOne ?? false,
            claimed: a.claimed ?? false,
            claimedBy: a.claimedBy,
            claimedAt: a.claimed ? new Date() : null,
            assetAddress: a.assetAddress,
            mintSignature: a.mintSignature,
          })),
        },
      },
      include: { phases: true },
    });

    return NextResponse.json({ ok: true, collection: created });
  } catch (err) {
    console.error("[/api/launches POST]", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
