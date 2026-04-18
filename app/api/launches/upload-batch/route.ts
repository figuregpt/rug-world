import { NextResponse } from "next/server";
import { uploadAssetServer } from "@/lib/server-metaplex";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Larger body limit for base64-encoded image batches
export const maxDuration = 300;

type Item = {
  name: string;
  description?: string;
  attributes?: Array<{ trait_type: string; value: string }>;
  imageBase64: string; // PNG bytes as base64 (data URI OK, prefix will be stripped)
};

type Body = {
  items: Item[];
};

function decodeBase64Image(src: string): Uint8Array {
  const idx = src.indexOf(",");
  const b64 = idx >= 0 ? src.slice(idx + 1) : src;
  return Uint8Array.from(Buffer.from(b64, "base64"));
}

/**
 * POST /api/launches/upload-batch
 *
 * Accepts a small batch of pre-flattened PNGs + their metadata and pins them
 * to Arweave (via Irys) using the operator wallet. Returns parallel arrays of
 * image + metadata URIs.
 *
 * Client-side Irys would need the creator wallet to sign every single upload,
 * so a 5000-piece collection would require 5000 signatures. Moving the upload
 * to the backend means the creator signs nothing for uploads; the operator
 * wallet (funded by Campfire + the per-mint upload buffer) pays the Irys
 * fee directly.
 *
 * Batch size should stay small (5-10) to keep request bodies under the
 * Next.js body parser limits. The client drives many requests in sequence
 * and shows progress.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "items required" }, { status: 400 });
    }
    if (body.items.length > 10) {
      return NextResponse.json(
        { error: "batch too large; max 10 items per request" },
        { status: 400 }
      );
    }

    const results: Array<{ imageUri: string; metadataUri: string }> = [];
    for (const item of body.items) {
      if (!item.imageBase64 || !item.name) {
        return NextResponse.json(
          { error: "each item needs imageBase64 and name" },
          { status: 400 }
        );
      }
      const bytes = decodeBase64Image(item.imageBase64);
      const uploaded = await uploadAssetServer({
        imageBytes: bytes,
        name: item.name,
        description: item.description,
        attributes: item.attributes,
        externalUrl: "https://campfire.world",
      });
      results.push({
        imageUri: uploaded.imageUri,
        metadataUri: uploaded.metadataUri,
      });
    }

    return NextResponse.json({ ok: true, results });
  } catch (err) {
    console.error("[/api/launches/upload-batch]", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
