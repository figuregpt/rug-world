import { createGenericFile, type Umi } from "@metaplex-foundation/umi";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";

/**
 * Attach the Irys uploader plugin to the Umi instance.
 * Uses the Irys devnet node when we're on Solana devnet - files uploaded
 * there are pinned for ~60 days (enough for testing).
 * Switch `address` to https://node1.irys.xyz (mainnet) when ready.
 */
export function withIrys(umi: Umi, cluster: "devnet" | "mainnet-beta" = "devnet"): Umi {
  return umi.use(
    irysUploader({
      address: cluster === "devnet" ? "https://devnet.irys.xyz" : "https://node1.irys.xyz",
      // For devnet Irys the signer needs devnet SOL to fund uploads (usually cheap).
    })
  );
}

/**
 * Flatten an array of image URLs (layer PNGs, bottom-first visually)
 * into a single PNG. Returns the encoded bytes + mime type.
 */
export async function flattenLayersToPng(imageUrls: string[], size = 1024): Promise<Uint8Array> {
  if (typeof window === "undefined") {
    throw new Error("flattenLayersToPng must run in the browser");
  }

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas not supported");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  for (const url of imageUrls) {
    if (!url) continue;
    const img = await loadImage(url);
    ctx.drawImage(img, 0, 0, size, size);
  }

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/png")
  );
  if (!blob) throw new Error("Failed to encode PNG");
  const buf = await blob.arrayBuffer();
  return new Uint8Array(buf);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export type AssetMetadata = {
  name: string;
  description?: string;
  image: string; // arweave URI
  attributes?: Array<{ trait_type: string; value: string }>;
  external_url?: string;
  properties?: {
    category?: string;
    files?: Array<{ uri: string; type: string }>;
  };
};

/**
 * Upload a PNG + JSON metadata to Arweave via Irys. Returns the metadata URI
 * that should be passed to Metaplex Core.
 */
export async function uploadAsset(
  umi: Umi,
  params: {
    imageBytes: Uint8Array;
    name: string;
    description?: string;
    attributes?: Array<{ trait_type: string; value: string }>;
    externalUrl?: string;
  }
): Promise<{ imageUri: string; metadataUri: string }> {
  const imageFile = createGenericFile(params.imageBytes, `${sanitize(params.name)}.png`, {
    contentType: "image/png",
  });
  const [imageUri] = await umi.uploader.upload([imageFile]);

  const metadata: AssetMetadata = {
    name: params.name,
    description: params.description,
    image: imageUri,
    external_url: params.externalUrl,
    attributes: params.attributes,
    properties: {
      category: "image",
      files: [{ uri: imageUri, type: "image/png" }],
    },
  };

  const metadataUri = await umi.uploader.uploadJson(metadata);

  return { imageUri, metadataUri };
}

/**
 * Upload JSON metadata for a collection (no image or uses a supplied cover).
 */
export async function uploadCollectionMetadata(
  umi: Umi,
  params: {
    name: string;
    description?: string;
    coverImageUri?: string;
    externalUrl?: string;
  }
): Promise<string> {
  const metadata: AssetMetadata = {
    name: params.name,
    description: params.description,
    image: params.coverImageUri || "",
    external_url: params.externalUrl,
  };
  return await umi.uploader.uploadJson(metadata);
}

function sanitize(s: string): string {
  return s.replace(/[^a-z0-9_-]+/gi, "_").slice(0, 48) || "asset";
}
