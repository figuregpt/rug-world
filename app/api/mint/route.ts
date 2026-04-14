import { NextResponse } from "next/server";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  serverMintToBuyer,
  uploadAssetServer,
  verifyPayment,
} from "@/lib/server-metaplex";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MintRequestItem = {
  name: string;
  description?: string;
  attributes?: Array<{ trait_type: string; value: string }>;
  // Either provide a fully-prepared metadata URI, OR provide image bytes to upload
  uri?: string;
  imageBase64?: string; // data URI or raw base64
};

type MintRequestBody = {
  collectionAddress: string;
  buyerAddress: string;
  paymentSignature: string;
  expectedSol: number; // total amount buyer should have paid (mint price + 2.5% + upload buffer)
  freezeAuthority: string; // typically the creator wallet
  items: MintRequestItem[]; // one per NFT to mint
};

function decodeBase64Image(src: string): Uint8Array {
  // strip "data:image/png;base64," if present
  const idx = src.indexOf(",");
  const b64 = idx >= 0 ? src.slice(idx + 1) : src;
  return Uint8Array.from(Buffer.from(b64, "base64"));
}

/**
 * POST /api/mint
 *
 * Flow:
 *  1. Buyer signs ONE payment transaction (mint price + 2.5% fee + upload buffer)
 *     to the creator wallet / treasury. Sends the signature here.
 *  2. Server verifies the buyer paid at least `expectedSol`.
 *  3. For each item, server uploads image + metadata to Irys (server-funded).
 *  4. For each item, server mints an NFT to the buyer, frozen, with the creator
 *     as freeze authority.
 *  5. Returns the list of asset addresses.
 *
 * This removes individual Solana approvals from the buyer. They sign once (the
 * payment) and the server does the rest.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as MintRequestBody;
    const {
      collectionAddress,
      buyerAddress,
      paymentSignature,
      expectedSol,
      freezeAuthority,
      items,
    } = body;

    if (
      !collectionAddress ||
      !buyerAddress ||
      !paymentSignature ||
      typeof expectedSol !== "number" ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    // 1. Verify the buyer actually paid
    const minLamports = Math.floor(expectedSol * LAMPORTS_PER_SOL * 0.99); // allow 1% slack for rounding
    const check = await verifyPayment({
      signature: paymentSignature,
      buyer: buyerAddress,
      minLamports,
    });
    if (!check.ok) {
      return NextResponse.json(
        { error: `Payment verification failed: ${check.reason}` },
        { status: 402 }
      );
    }

    // 2. For each item: upload (if needed) + mint
    const results: Array<{ assetAddress: string; signature: string; metadataUri: string }> = [];

    for (const item of items) {
      let metadataUri = item.uri;
      if (!metadataUri) {
        if (!item.imageBase64) {
          return NextResponse.json(
            { error: "Each item needs either `uri` or `imageBase64`" },
            { status: 400 }
          );
        }
        const bytes = decodeBase64Image(item.imageBase64);
        const uploaded = await uploadAssetServer({
          imageBytes: bytes,
          name: item.name,
          description: item.description,
          attributes: item.attributes,
          externalUrl: "https://rug.world",
        });
        metadataUri = uploaded.metadataUri;
      }

      const minted = await serverMintToBuyer({
        collectionAddress,
        buyer: buyerAddress,
        name: item.name,
        uri: metadataUri,
        freezeAuthority,
      });

      results.push({
        assetAddress: minted.assetAddress,
        signature: minted.signature,
        metadataUri,
      });
    }

    return NextResponse.json({ ok: true, results });
  } catch (err) {
    console.error("[/api/mint] error", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
