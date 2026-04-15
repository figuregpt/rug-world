"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  launchCollection,
  bulkPreMint,
  accountExplorerUrl,
  LAUNCH_FEE_SOL,
  BULK_BATCH_SIZE,
  OPERATOR_PUBKEY,
} from "@/lib/metaplex";
import { flattenLayersToPng } from "@/lib/uploader";
import { slugify } from "@/lib/launched";
import { idbGet, idbDelete, DRAFT_ASSETS_KEY } from "@/lib/draft-store";

type Phase = {
  id: string;
  name: string;
  price: string;
  supply: string;
  maxPerWallet: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
};

const MAX_TOTAL_DURATION_HOURS = 120;

type CollectionInfo = {
  name: string;
  tagline: string;
  description: string;
  supply: number;
  generatedCount: number;
  oneOfOneCount: number;
  layerCount: number;
  traitCount: number;
  createdAt: string;
  draftOwner?: string;
};

type StoredTrait = { layerName: string; traitName: string; imageUrl?: string };
type StoredNFT = {
  tokenId: number;
  dna: string;
  isOneOfOne: boolean;
  customImage?: string;
  customName?: string;
  traits: StoredTrait[];
};

const LAUNCH_FEE = LAUNCH_FEE_SOL;
const METAPLEX_FEE_PER_MINT = 0.012; // SOL estimate per mint (Metaplex + network)
const MARKETPLACE_FEE = 2.5; // % from every sale


function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/** A tiny placeholder PNG for the collection cover when we don't have
 *  a dedicated cover image. Renders the initials on a canvas. */
async function createPlaceholderCoverPng(name: string): Promise<string> {
  if (typeof window === "undefined") return "";
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.fillStyle = "#2F2B28";
  ctx.fillRect(0, 0, 512, 512);
  ctx.fillStyle = "#A64C4F";
  ctx.font = "bold 200px system-ui, -apple-system, Satoshi, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const initials = name
    .split(" ")
    .map((w) => w[0] || "")
    .join("")
    .slice(0, 3)
    .toUpperCase() || "RW";
  ctx.fillText(initials, 256, 256);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/png")
  );
  if (!blob) return "";
  const buf = await blob.arrayBuffer();
  return bytesToBase64(new Uint8Array(buf));
}

type LaunchState =
  | { stage: "idle" }
  | { stage: "uploading-collection"; step: string }
  | { stage: "uploading-assets"; done: number; total: number }
  | { stage: "launching"; step: string }
  | { stage: "pre-minting"; batch: number; totalBatches: number; minted: number; total: number }
  | { stage: "done"; collectionAddress: string; txSignature: string; mintsMinted: number; collectionUri: string }
  | { stage: "error"; message: string };

type LoadState =
  | { kind: "loading" }
  | { kind: "needs-wallet" }
  | { kind: "no-draft" } // will redirect to /studio
  | { kind: "already-launched"; slug: string } // will redirect to /launchpad/[slug]
  | { kind: "ready" };

export default function CreatePage() {
  const wallet = useWallet();
  const router = useRouter();
  const [loadState, setLoadState] = useState<LoadState>({ kind: "loading" });
  const [info, setInfo] = useState<CollectionInfo | null>(null);
  const [storedNFTs, setStoredNFTs] = useState<StoredNFT[]>([]);
  const [preMint, setPreMint] = useState("0");
  const [launchState, setLaunchState] = useState<LaunchState>({ stage: "idle" });
  const [phases, setPhases] = useState<Phase[]>([
    { id: makeId(), name: "OG", price: "0.3", supply: "500", maxPerWallet: "3", startDate: "", startTime: "", endDate: "", endTime: "" },
    { id: makeId(), name: "Whitelist", price: "0.4", supply: "1500", maxPerWallet: "5", startDate: "", startTime: "", endDate: "", endTime: "" },
    { id: makeId(), name: "Public", price: "0.5", supply: "0", maxPerWallet: "10", startDate: "", startTime: "", endDate: "", endTime: "" },
  ]);
  const [showLaunchModal, setShowLaunchModal] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Wallet is required to do anything on this page.
    if (!wallet.publicKey) {
      setInfo(null);
      setStoredNFTs([]);
      setLoadState({ kind: "needs-wallet" });
      return;
    }

    // 2. Look for a draft.
    const raw = localStorage.getItem("rugworld:collection");
    if (!raw) {
      setLoadState({ kind: "no-draft" });
      return;
    }

    let parsed: CollectionInfo | null = null;
    try {
      parsed = JSON.parse(raw) as CollectionInfo;
    } catch {
      localStorage.removeItem("rugworld:collection");
      localStorage.removeItem("rugworld:generated");
      setLoadState({ kind: "no-draft" });
      return;
    }

    // 3. Drafts must belong to the connected wallet.
    //    Legacy drafts without `draftOwner` are treated as no-draft so other
    //    wallets in the same browser don't inherit them.
    const currentWallet = wallet.publicKey.toString();
    if (!parsed.draftOwner || parsed.draftOwner !== currentWallet) {
      setLoadState({ kind: "no-draft" });
      return;
    }

    // 4. If a launch with this slug already exists in the backend, this draft
    //    is stale — clean it up and send the user to the live collection.
    const slug = slugify(parsed.name);
    fetch(`/api/launches/${slug}`)
      .then(async (r) => {
        if (r.ok) {
          localStorage.removeItem("rugworld:collection");
          localStorage.removeItem("rugworld:generated");
          await idbDelete(DRAFT_ASSETS_KEY).catch(() => undefined);
          setLoadState({ kind: "already-launched", slug });
          return null;
        }
        return parsed;
      })
      .then(async (draft) => {
        if (!draft) return;
        setInfo(draft);
        // Assets live in IndexedDB now. Fall back to the old localStorage
        // location so existing drafts from a previous session still work.
        const fromIdb = await idbGet<StoredNFT[]>(DRAFT_ASSETS_KEY).catch(() => null);
        if (fromIdb) {
          setStoredNFTs(fromIdb);
        } else {
          const rawGen = localStorage.getItem("rugworld:generated");
          if (rawGen) {
            try {
              setStoredNFTs(JSON.parse(rawGen));
            } catch {}
          }
        }
        setLoadState({ kind: "ready" });
      })
      .catch(async () => {
        setInfo(parsed);
        const fromIdb = await idbGet<StoredNFT[]>(DRAFT_ASSETS_KEY).catch(() => null);
        if (fromIdb) {
          setStoredNFTs(fromIdb);
        } else {
          const rawGen = localStorage.getItem("rugworld:generated");
          if (rawGen) {
            try {
              setStoredNFTs(JSON.parse(rawGen));
            } catch {}
          }
        }
        setLoadState({ kind: "ready" });
      });
  }, [wallet.publicKey]);

  // Auto-redirect when the load state demands it.
  useEffect(() => {
    if (loadState.kind === "no-draft") {
      router.replace("/studio");
    } else if (loadState.kind === "already-launched") {
      router.replace(`/launchpad/${loadState.slug}`);
    }
  }, [loadState, router]);

  const addPhase = () => {
    setPhases([
      ...phases,
      { id: makeId(), name: "", price: "", supply: "", maxPerWallet: "", startDate: "", startTime: "", endDate: "", endTime: "" },
    ]);
  };

  const removePhase = (id: string) => {
    setPhases(phases.filter((p) => p.id !== id));
  };

  const updatePhase = (id: string, field: keyof Phase, value: string) => {
    setPhases(phases.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const preMintNum = parseInt(preMint) || 0;
  const preMintFee = +(preMintNum * METAPLEX_FEE_PER_MINT).toFixed(3);
  const totalLaunchCost = +(LAUNCH_FEE + preMintFee).toFixed(3);

  // ===== Validation =====
  // 0 supply on a phase = "remaining" (auto-fills with whatever's left)
  // 0 perWallet = unlimited
  const phaseSupplySum = phases.reduce(
    (s, p) => s + (parseInt(p.supply) || 0),
    0
  );
  const collectionSupply = info?.supply || 0;
  const supplyOver = phaseSupplySum > collectionSupply;
  const supplyRemaining = Math.max(0, collectionSupply - phaseSupplySum);

  function phaseStart(p: Phase): Date | null {
    if (!p.startDate) return null;
    const t = p.startTime || "00:00";
    return new Date(`${p.startDate}T${t}`);
  }
  function phaseEnd(p: Phase): Date | null {
    if (!p.endDate) return null;
    const t = p.endTime || "23:59";
    return new Date(`${p.endDate}T${t}`);
  }

  let totalDurationHours = 0;
  let durationOver = false;
  let phaseTimeError: string | null = null;
  for (const p of phases) {
    const s = phaseStart(p);
    const e = phaseEnd(p);
    if (s && e) {
      if (e <= s) {
        phaseTimeError = `${p.name || "phase"}: end must be after start`;
        continue;
      }
      const diffH = (e.getTime() - s.getTime()) / (1000 * 60 * 60);
      totalDurationHours += diffH;
    }
  }
  totalDurationHours = +totalDurationHours.toFixed(1);
  if (totalDurationHours > MAX_TOTAL_DURATION_HOURS) durationOver = true;

  const validationErrors: string[] = [];
  if (supplyOver)
    validationErrors.push(
      `Phase supplies (${phaseSupplySum.toLocaleString()}) exceed collection supply (${collectionSupply.toLocaleString()}).`
    );
  if (durationOver)
    validationErrors.push(
      `Total mint duration is ${totalDurationHours}h. Max allowed is ${MAX_TOTAL_DURATION_HOURS}h.`
    );
  if (phaseTimeError) validationErrors.push(phaseTimeError);

  // Approval count estimate for the launch flow
  const preMintBatches =
    preMintNum > 0 ? Math.ceil(preMintNum / BULK_BATCH_SIZE) : 0;
  const totalApprovals = 1 + preMintBatches; // 1 collection + N bulk-mint batches
  const estimatedSeconds = preMintNum * 8 + 15; // rough: 8s per upload + 15s baseline

  const handleLaunch = async () => {
    if (!info) return;
    if (!wallet.connected || !wallet.publicKey) {
      setLaunchState({ stage: "error", message: "Connect your wallet first." });
      return;
    }

    try {
      // 1. Upload collection-level metadata via the backend (operator wallet
      //    pays Irys, no creator signature needed).
      setLaunchState({
        stage: "uploading-collection",
        step: "Uploading collection metadata...",
      });
      const collectionUploadRes = await fetch("/api/launches/upload-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [
            {
              name: info.name,
              description: info.description,
              imageBase64: await createPlaceholderCoverPng(info.name),
            },
          ],
        }),
      });
      const collectionUploadJson = await collectionUploadRes.json();
      if (!collectionUploadRes.ok || !collectionUploadJson.results?.[0]) {
        throw new Error(
          collectionUploadJson.error || "Failed to upload collection metadata"
        );
      }
      const collectionUri = collectionUploadJson.results[0].metadataUri;

      // 2. Flatten + batch-upload every NFT via the backend. The creator
      //    signs ZERO upload transactions; the operator wallet handles all
      //    Irys uploads from server-side. We chunk requests to stay under
      //    the JSON body limit.
      const UPLOAD_BATCH_SIZE = 5;
      const assetManifest: Array<{
        tokenId: number;
        metadataUri: string;
        imageUri: string;
        name: string;
        attributes: Array<{ trait_type: string; value: string }>;
        isOneOfOne: boolean;
      }> = [];

      if (storedNFTs.length > 0) {
        setLaunchState({ stage: "uploading-assets", done: 0, total: storedNFTs.length });

        for (let i = 0; i < storedNFTs.length; i += UPLOAD_BATCH_SIZE) {
          const slice = storedNFTs.slice(i, i + UPLOAD_BATCH_SIZE);

          // Flatten each NFT's layers locally (canvas, no signing).
          const items = await Promise.all(
            slice.map(async (nft) => {
              let imageBytes: Uint8Array;
              if (nft.isOneOfOne && nft.customImage) {
                imageBytes = await flattenLayersToPng([nft.customImage]);
              } else {
                const urls = nft.traits.map((t) => t.imageUrl).filter((u): u is string => !!u);
                if (urls.length === 0) {
                  throw new Error(
                    `NFT #${nft.tokenId} has no trait images. Re-open Studio in this tab to reload blob URLs.`
                  );
                }
                imageBytes = await flattenLayersToPng(urls);
              }
              const attributes = nft.traits.map((t) => ({
                trait_type: t.layerName,
                value: t.traitName,
              }));
              return {
                _nft: nft,
                _attributes: attributes,
                payload: {
                  name: nft.customName || `${info.name} #${nft.tokenId}`,
                  description: info.description,
                  attributes,
                  imageBase64: bytesToBase64(imageBytes),
                },
              };
            })
          );

          const res = await fetch("/api/launches/upload-batch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: items.map((x) => x.payload) }),
          });
          const json = await res.json();
          if (!res.ok || !json.results) {
            throw new Error(json.error || `upload batch failed at #${i}`);
          }

          json.results.forEach(
            (r: { imageUri: string; metadataUri: string }, idx: number) => {
              const ctx = items[idx];
              assetManifest.push({
                tokenId: ctx._nft.tokenId,
                metadataUri: r.metadataUri,
                imageUri: r.imageUri,
                name: ctx.payload.name,
                attributes: ctx._attributes,
                isOneOfOne: ctx._nft.isOneOfOne,
              });
            }
          );

          setLaunchState({
            stage: "uploading-assets",
            done: Math.min(i + UPLOAD_BATCH_SIZE, storedNFTs.length),
            total: storedNFTs.length,
          });
        }
      }

      // Slice out the first N for the pre-mint. Rest stay in the pool.
      const preMintUris = assetManifest.slice(0, preMintNum).map((a) => a.metadataUri);
      const preMintList = assetManifest.slice(0, preMintNum);

      // 4. Create the collection on-chain (launch fee + Metaplex Core collection)
      setLaunchState({
        stage: "launching",
        step: "Creating collection on Solana devnet...",
      });

      const adminAuthority = OPERATOR_PUBKEY || wallet.publicKey.toString();
      const result = await launchCollection(wallet, {
        name: info.name,
        uri: collectionUri,
        stakersVault: wallet.publicKey.toString(), // TODO: per-collection royalty vault
        adminAuthority, // Rug.World operator wallet (server) so it can mint into this collection
      });

      // 5. Bulk pre-mint to creator (4 NFTs per transaction)
      const preMintAssetAddresses: string[] = [];
      let mintsMinted = 0;
      if (preMintList.length > 0) {
        const totalBatches = Math.ceil(preMintList.length / BULK_BATCH_SIZE);
        setLaunchState({
          stage: "pre-minting",
          batch: 0,
          totalBatches,
          minted: 0,
          total: preMintList.length,
        });
        const results = await bulkPreMint(wallet, {
          collectionAddress: result.collectionAddress,
          items: preMintList.map((nft, i) => ({
            name: nft.name,
            uri: preMintUris[i],
          })),
          onBatch: ({ batchIndex, totalBatches: tb, minted, total }) => {
            setLaunchState({
              stage: "pre-minting",
              batch: batchIndex,
              totalBatches: tb,
              minted,
              total,
            });
          },
        });
        for (const r of results) preMintAssetAddresses.push(r.assetAddress);
        mintsMinted = preMintList.length;
      }

      // 6. POST the full manifest to the backend so the mint pool is live.
      const buyerWallet = wallet.publicKey.toString();
      const launchRes = await fetch("/api/launches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectionAddress: result.collectionAddress,
          collectionUri,
          creatorWallet: buyerWallet,
          txSignature: result.signature,
          network: "devnet",
          slug: slugify(info.name),
          name: info.name,
          tagline: info.tagline,
          description: info.description,
          supply: info.supply,
          preMintCount: mintsMinted,
          royaltyFee: 10,
          holderShare: 100,
          teamShare: 0,
          phases: phases.map((p) => ({
            name: p.name,
            price: p.price,
            supply: p.supply,
            maxPerWallet: p.maxPerWallet,
            startDate: p.startDate,
            startTime: p.startTime,
            endDate: p.endDate,
            endTime: p.endTime,
          })),
          assets: assetManifest.map((a, idx) => ({
            tokenIndex: a.tokenId,
            metadataUri: a.metadataUri,
            imageUri: a.imageUri,
            name: a.name,
            attributes: a.attributes,
            isOneOfOne: a.isOneOfOne,
            // mark pre-mints as claimed so they don't show up in the mint pool
            claimed: idx < preMintList.length,
            claimedBy: idx < preMintList.length ? buyerWallet : undefined,
            assetAddress: idx < preMintList.length ? preMintAssetAddresses[idx] : undefined,
          })),
        }),
      });
      if (!launchRes.ok) {
        const err = await launchRes.json().catch(() => ({}));
        console.error("Failed to register launch in backend", err);
        throw new Error(`backend registration failed: ${err.error || launchRes.status}`);
      }

      // Clear the Studio draft now that this collection is live on-chain +
      // indexed in the backend. Subsequent visits to /create (by any wallet)
      // won't see leftover draft data.
      if (typeof window !== "undefined") {
        localStorage.removeItem("rugworld:collection");
        localStorage.removeItem("rugworld:generated");
        await idbDelete(DRAFT_ASSETS_KEY).catch(() => undefined);
      }

      setLaunchState({
        stage: "done",
        collectionAddress: result.collectionAddress,
        txSignature: result.signature,
        mintsMinted,
        collectionUri,
      });
    } catch (err) {
      console.error("Launch failed", err);
      let message: string;
      if (err instanceof Error) {
        message = err.message || err.name || "Launch failed (no message)";
      } else if (err && typeof err === "object") {
        // DOM Event objects (e.g. image load failure) have no useful message;
        // surface type so we can tell why.
        const asEvent = err as { type?: string; target?: unknown };
        if (asEvent.type) {
          const tgt =
            (asEvent.target as { src?: string; tagName?: string })?.src ||
            (asEvent.target as { tagName?: string })?.tagName ||
            "target";
          message = `DOM ${asEvent.type} error on ${String(tgt).slice(0, 80)}`;
        } else {
          try {
            message = JSON.stringify(err);
          } catch {
            message = String(err);
          }
        }
      } else {
        message = String(err);
      }
      setLaunchState({ stage: "error", message });
    }
  };

  const isBusy =
    launchState.stage === "launching" ||
    launchState.stage === "pre-minting" ||
    launchState.stage === "uploading-collection" ||
    launchState.stage === "uploading-assets";

  // Test-mint UI removed: the real buyer-facing mint flow lives on
  // /launchpad/[slug] now and goes through /api/mint/intent + /api/mint/execute.

  const input = "w-full px-3 py-2 bg-[#EDE3BC] border border-[#C4B99A] text-[14px] text-[#2F2B28] placeholder:text-[#8A8480] focus:border-[#A64C4F] outline-none transition-colors";
  const label = "block text-[11px] font-mono text-[#826D62] uppercase tracking-wider mb-1";

  // Wallet-gated + redirect flow
  if (loadState.kind === "loading" || !info) {
    return (
      <div className="pt-[72px] min-h-screen">
        <div className="container-main py-[clamp(40px,5vw,64px)]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-[560px]"
          >
            <h1 className="text-[clamp(36px,5vw,56px)] font-black text-[#2F2B28] leading-[1] mb-3">
              Launch Flow
            </h1>
            {loadState.kind === "needs-wallet" ? (
              <>
                <p className="text-[clamp(15px,1.2vw,17px)] text-[#826D62] mb-6">
                  Connect your wallet to continue. Drafts are saved per wallet and you&apos;ll sign the launch transactions from that wallet.
                </p>
                <p className="text-[12px] text-[#8A8480]">
                  Use the Connect Wallet button in the top right.
                </p>
              </>
            ) : loadState.kind === "no-draft" ? (
              <p className="text-[clamp(15px,1.2vw,17px)] text-[#826D62] mb-6">
                No draft found for this wallet. Redirecting you to the Studio to start a new collection...
              </p>
            ) : loadState.kind === "already-launched" ? (
              <p className="text-[clamp(15px,1.2vw,17px)] text-[#826D62] mb-6">
                That draft was already launched. Redirecting to the collection page...
              </p>
            ) : (
              <p className="text-[clamp(15px,1.2vw,17px)] text-[#826D62]">Loading...</p>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-[72px] min-h-screen">
      <div className="container-main py-[clamp(40px,5vw,64px)]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10 max-w-[720px]"
        >
          <div className="flex items-center gap-2 text-[13px] mb-5">
            <Link href="/studio" className="text-[#826D62] hover:text-[#A64C4F] transition-colors">
              Studio
            </Link>
            <span className="text-[#8A8480]">/</span>
            <span className="text-[#2F2B28] font-medium">Launch</span>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-[clamp(36px,5vw,56px)] font-black text-[#2F2B28] leading-[1]">
              Launch Collection
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-[#2F2B28] text-[#EDE3BC]">
              Off-chain
            </span>
          </div>
          <p className="text-[clamp(15px,1.2vw,17px)] text-[#826D62]">
            Final step. Set your mint phases with timing, pre-mint to the founder wallet if you want, and confirm the launch fee.
          </p>
          <button
            onClick={async () => {
              if (!confirm("Discard this draft and go back to Studio?")) return;
              if (typeof window !== "undefined") {
                localStorage.removeItem("rugworld:collection");
                localStorage.removeItem("rugworld:generated");
                await idbDelete(DRAFT_ASSETS_KEY).catch(() => undefined);
              }
              setInfo(null);
              setStoredNFTs([]);
            }}
            className="mt-4 text-[12px] text-[#826D62] hover:text-[#A64C4F] transition-colors"
          >
            Discard draft and start over
          </button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 lg:gap-12">
          {/* Form */}
          <div className="space-y-10">
            {/* Collection summary (read-only from studio) */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="border-b border-[#C4B99A] mb-5 pb-3 flex items-center justify-between">
                <div>
                  <span className="block text-[12px] font-mono text-[#A64C4F]">01</span>
                  <span className="text-[15px] font-semibold text-[#2F2B28]">Collection Summary</span>
                </div>
                <Link href="/studio" className="text-[12px] text-[#A64C4F] hover:underline">
                  Edit in Studio
                </Link>
              </div>

              <div className="border border-[#C4B99A] p-5 space-y-3">
                <div>
                  <span className="block text-[11px] font-mono text-[#826D62] uppercase tracking-wider mb-1">Name</span>
                  <span className="text-[18px] font-bold text-[#2F2B28]">{info.name}</span>
                </div>
                {info.tagline && (
                  <div>
                    <span className="block text-[11px] font-mono text-[#826D62] uppercase tracking-wider mb-1">Tagline</span>
                    <span className="text-[14px] text-[#A64C4F]">{info.tagline}</span>
                  </div>
                )}
                {info.description && (
                  <div>
                    <span className="block text-[11px] font-mono text-[#826D62] uppercase tracking-wider mb-1">Description</span>
                    <p className="text-[13px] text-[#826D62] leading-[1.6]">{info.description}</p>
                  </div>
                )}
                <div className="pt-3 border-t border-[#C4B99A] grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="block text-[11px] text-[#826D62]">Supply</span>
                    <span className="text-[15px] font-bold text-[#2F2B28]">{info.supply.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-[#826D62]">Generated</span>
                    <span className="text-[15px] font-bold text-[#2F2B28]">{info.generatedCount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-[#826D62]">1/1 Pieces</span>
                    <span className="text-[15px] font-bold text-[#DEA831]">{info.oneOfOneCount}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-[#826D62]">Layers</span>
                    <span className="text-[15px] font-bold text-[#2F2B28]">{info.layerCount}</span>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Royalty info */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
            >
              <div className="border-b border-[#C4B99A] mb-5 pb-3">
                <span className="block text-[12px] font-mono text-[#A64C4F]">02</span>
                <span className="text-[15px] font-semibold text-[#2F2B28]">Royalty &amp; Fees</span>
              </div>

              <div className="space-y-3">
                <div className="border border-[#A64C4F]/25 bg-[#A64C4F]/[0.03] p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-[15px] font-bold text-[#2F2B28]">10% Royalty to Stakers</p>
                      <p className="text-[12px] text-[#826D62] mt-0.5">
                        Every secondary sale pays a 10% royalty. All of it goes to people staking your NFTs.
                      </p>
                    </div>
                    <span className="text-[32px] font-black text-[#A64C4F]">10%</span>
                  </div>
                  <div className="pt-3 border-t border-[#A64C4F]/15 flex items-center gap-2 text-[12px]">
                    <span className="w-2 h-2 bg-[#A64C4F]" />
                    <span className="text-[#2F2B28] font-medium">Stakers</span>
                    <span className="ml-auto font-mono text-[#A64C4F]">10% of sale</span>
                  </div>
                </div>

                <div className="border border-[#C4B99A] p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[14px] font-semibold text-[#2F2B28]">Platform Fee</p>
                      <p className="text-[12px] text-[#826D62] mt-0.5">
                        Rug.World takes {MARKETPLACE_FEE}% on top of mint price from the buyer, and another {MARKETPLACE_FEE}% from the creator&apos;s share of each mint.
                      </p>
                    </div>
                    <span className="text-[22px] font-bold text-[#826D62]">{MARKETPLACE_FEE * 2}%</span>
                  </div>
                  <div className="pt-3 border-t border-[#C4B99A] space-y-1 text-[12px]">
                    <div className="flex justify-between">
                      <span className="text-[#826D62]">Added to buyer&apos;s cost</span>
                      <span className="font-mono text-[#2F2B28]">+{MARKETPLACE_FEE}% on top</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#826D62]">Cut from creator&apos;s share</span>
                      <span className="font-mono text-[#2F2B28]">-{MARKETPLACE_FEE}% of mint price</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-[#C4B99A]">
                      <span className="text-[#826D62]">Example: 1 SOL mint</span>
                      <span className="font-mono text-[#2F2B28]">
                        buyer pays 1.025, you get 0.975
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Pre-mint */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <div className="border-b border-[#C4B99A] mb-5 pb-3">
                <span className="block text-[12px] font-mono text-[#A64C4F]">03</span>
                <span className="text-[15px] font-semibold text-[#2F2B28]">Founder Pre-Mint</span>
              </div>

              <div className="border border-[#C4B99A] p-5">
                <p className="text-[13px] text-[#826D62] leading-[1.6] mb-4">
                  Want some NFTs minted to your wallet before public mint? These are minted upfront, frozen, and sent to your wallet. Free for you as the founder, you only pay Metaplex network fees (~{METAPLEX_FEE_PER_MINT} SOL per NFT). All other NFTs are lazy-minted when buyers pay.
                </p>

                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <label className={label}>Pre-mint amount</label>
                    <input
                      className={input}
                      type="number"
                      min={0}
                      max={info.supply}
                      value={preMint}
                      onChange={(e) => setPreMint(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="text-right">
                    <span className="block text-[11px] text-[#826D62]">Max</span>
                    <span className="text-[15px] font-bold text-[#2F2B28]">{info.supply.toLocaleString()}</span>
                  </div>
                </div>

                {preMintNum > 0 && (
                  <div className="mt-4 pt-4 border-t border-[#C4B99A]">
                    <div className="flex items-center justify-between text-[13px] mb-2">
                      <span className="text-[#826D62]">Network fees ({preMintNum} × {METAPLEX_FEE_PER_MINT} SOL)</span>
                      <span className="font-mono font-bold text-[#2F2B28]">{preMintFee} SOL</span>
                    </div>
                    <p className="text-[11px] text-[#8A8480] leading-[1.4]">
                      {preMintNum.toLocaleString()} NFTs will be minted to your wallet. Remaining {(info.supply - preMintNum).toLocaleString()} go to public mint phases.
                    </p>
                  </div>
                )}
              </div>
            </motion.section>

            {/* Phases */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
            >
              <div className="border-b border-[#C4B99A] mb-5 pb-3 flex items-center justify-between">
                <div>
                  <span className="block text-[12px] font-mono text-[#A64C4F]">04</span>
                  <span className="text-[15px] font-semibold text-[#2F2B28]">Mint Phases</span>
                </div>
                <button onClick={addPhase} className="text-[13px] text-[#A64C4F] hover:underline font-medium">
                  + Add Phase
                </button>
              </div>

              {/* Supply summary */}
              <div className={`border p-3 mb-3 text-[12px] flex items-center justify-between ${
                supplyOver
                  ? "border-[#A64C4F] bg-[#A64C4F]/[0.05] text-[#A64C4F]"
                  : "border-[#C4B99A] bg-[#C4B99A]/15 text-[#826D62]"
              }`}>
                <span>
                  Phase total: <span className="font-mono font-bold">{phaseSupplySum.toLocaleString()}</span> / <span className="font-mono">{collectionSupply.toLocaleString()}</span>
                </span>
                {!supplyOver && (
                  <span className="text-[#826D62]">
                    Remaining: <span className="font-mono font-bold text-[#2F2B28]">{supplyRemaining.toLocaleString()}</span>
                  </span>
                )}
                {supplyOver && (
                  <span>Over by {(phaseSupplySum - collectionSupply).toLocaleString()}</span>
                )}
              </div>

              {/* Duration summary */}
              <div className={`border p-3 mb-3 text-[12px] flex items-center justify-between ${
                durationOver
                  ? "border-[#A64C4F] bg-[#A64C4F]/[0.05] text-[#A64C4F]"
                  : "border-[#C4B99A] bg-[#C4B99A]/15 text-[#826D62]"
              }`}>
                <span>
                  Total mint duration: <span className="font-mono font-bold">{totalDurationHours}h</span> / max {MAX_TOTAL_DURATION_HOURS}h
                </span>
                {durationOver && <span>Over by {(totalDurationHours - MAX_TOTAL_DURATION_HOURS).toFixed(1)}h</span>}
              </div>

              <div className="space-y-3">
                {phases.map((phase, i) => {
                  const phaseSupplyNum = parseInt(phase.supply) || 0;
                  const phasePerWallet = parseInt(phase.maxPerWallet) || 0;
                  return (
                    <div key={phase.id} className="border border-[#C4B99A] p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-mono text-[#826D62]">0{i + 1}</span>
                        {phases.length > 1 && (
                          <button onClick={() => removePhase(phase.id)} className="text-[12px] text-[#8A8480] hover:text-[#A64C4F] transition-colors">
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                        <div>
                          <label className={label}>Name</label>
                          <input className={input} placeholder="OG" value={phase.name} onChange={(e) => updatePhase(phase.id, "name", e.target.value)} />
                        </div>
                        <div>
                          <label className={label}>Price (SOL)</label>
                          <input className={input} type="number" min={0} step={0.01} placeholder="0.3" value={phase.price} onChange={(e) => updatePhase(phase.id, "price", e.target.value)} />
                        </div>
                        <div>
                          <label className={label}>Supply</label>
                          <input
                            className={input}
                            type="number"
                            min={0}
                            max={collectionSupply}
                            placeholder="500"
                            value={phase.supply}
                            onChange={(e) => updatePhase(phase.id, "supply", e.target.value)}
                          />
                          {phaseSupplyNum === 0 && (
                            <p className="text-[10px] text-[#8A8480] mt-1">0 = uses remaining</p>
                          )}
                        </div>
                        <div>
                          <label className={label}>Per Wallet</label>
                          <input
                            className={input}
                            type="number"
                            min={0}
                            placeholder="3"
                            value={phase.maxPerWallet}
                            onChange={(e) => updatePhase(phase.id, "maxPerWallet", e.target.value)}
                          />
                          {phasePerWallet === 0 && (
                            <p className="text-[10px] text-[#A64C4F] mt-1 font-medium">Unlimited</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <label className={label}>Start Date</label>
                          <input
                            className={input}
                            type="date"
                            value={phase.startDate}
                            onChange={(e) => updatePhase(phase.id, "startDate", e.target.value)}
                          />
                        </div>
                        <div>
                          <label className={label}>Start Time</label>
                          <input
                            className={input}
                            type="time"
                            value={phase.startTime}
                            onChange={(e) => updatePhase(phase.id, "startTime", e.target.value)}
                          />
                        </div>
                        <div>
                          <label className={label}>End Date</label>
                          <input
                            className={input}
                            type="date"
                            value={phase.endDate}
                            onChange={(e) => updatePhase(phase.id, "endDate", e.target.value)}
                          />
                        </div>
                        <div>
                          <label className={label}>End Time</label>
                          <input
                            className={input}
                            type="time"
                            value={phase.endTime}
                            onChange={(e) => updatePhase(phase.id, "endTime", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.section>

            {/* Launch */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="pt-4 border-t border-[#C4B99A]"
            >
              <div className="border border-[#A64C4F]/25 bg-[#A64C4F]/[0.03] p-5 mb-4">
                <p className="text-[13px] font-semibold text-[#2F2B28] mb-3">Launch Cost Breakdown</p>
                <div className="space-y-2 text-[13px]">
                  <div className="flex justify-between">
                    <span className="text-[#826D62]">Launch fee (flat)</span>
                    <span className="font-mono text-[#2F2B28]">{LAUNCH_FEE} SOL</span>
                  </div>
                  {preMintNum > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[#826D62]">Pre-mint network fees ({preMintNum} NFTs)</span>
                      <span className="font-mono text-[#2F2B28]">{preMintFee} SOL</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-[#A64C4F]/15 flex justify-between">
                    <span className="font-bold text-[#2F2B28]">Total due now</span>
                    <span className="font-mono font-bold text-[#A64C4F] text-[15px]">{totalLaunchCost} SOL</span>
                  </div>
                </div>
              </div>

              <div className="border border-[#C4B99A] bg-[#C4B99A]/15 p-4 mb-4">
                <p className="text-[12px] font-semibold text-[#2F2B28] mb-2">Post-launch controls</p>
                <p className="text-[11px] text-[#826D62] leading-[1.5]">
                  After launch, Rug.World admin can adjust the collection mid-flight: cut supply, change mint price, extend or shorten phase timings. You as the creator cannot change these directly. Reach out to our team if you need changes.
                </p>
              </div>

              {validationErrors.length > 0 && (
                <div className="border border-[#A64C4F] bg-[#A64C4F]/[0.05] p-4 mb-4">
                  <p className="text-[13px] font-semibold text-[#A64C4F] mb-2">Fix before launching</p>
                  <ul className="text-[12px] text-[#A64C4F] space-y-1 list-disc list-inside">
                    {validationErrors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div>
                  <p className="text-[12px] text-[#826D62]">
                    Solana <span className="font-mono text-[#A64C4F] font-bold">devnet</span>. Lazy mint via Metaplex Core.
                  </p>
                  {!wallet.connected && (
                    <p className="text-[11px] text-[#DEA831] mt-1">
                      Connect your wallet to launch.
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setShowLaunchModal(true)}
                  disabled={!wallet.connected || isBusy || validationErrors.length > 0}
                  className="px-8 py-4 text-[15px] font-bold text-[#EDE3BC] bg-[#A64C4F] hover:bg-[#8a3d40] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isBusy
                    ? "Launching..."
                    : `Launch Now . ${totalLaunchCost} SOL`}
                </button>
              </div>

              {/* Launch status */}
              <AnimatePresence>
                {launchState.stage !== "idle" && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mt-4"
                  >
                    {launchState.stage === "uploading-collection" && (
                      <div className="border border-[#A64C4F]/30 bg-[#A64C4F]/[0.04] p-4">
                        <div className="flex items-center gap-3">
                          <span className="w-2 h-2 bg-[#A64C4F] animate-pulse" />
                          <p className="text-[13px] text-[#2F2B28] font-medium">
                            {launchState.step}
                          </p>
                        </div>
                        <p className="text-[11px] text-[#826D62] mt-2">
                          Pinning to Arweave via Irys. This runs off-chain.
                        </p>
                      </div>
                    )}

                    {launchState.stage === "uploading-assets" && (
                      <div className="border border-[#A64C4F]/30 bg-[#A64C4F]/[0.04] p-4">
                        <div className="flex items-center justify-between text-[13px] mb-2">
                          <span className="text-[#2F2B28] font-medium">
                            Uploading asset images + metadata
                          </span>
                          <span className="font-mono text-[#A64C4F] font-bold">
                            {launchState.done} / {launchState.total}
                          </span>
                        </div>
                        <div className="h-[4px] bg-[#C4B99A]/60 overflow-hidden">
                          <div
                            className="h-full bg-[#A64C4F] transition-all"
                            style={{
                              width: `${(launchState.done / Math.max(1, launchState.total)) * 100}%`,
                            }}
                          />
                        </div>
                        <p className="text-[11px] text-[#826D62] mt-2">
                          Flattening layers to PNG and pinning to Arweave.
                        </p>
                      </div>
                    )}

                    {launchState.stage === "launching" && (
                      <div className="border border-[#A64C4F]/30 bg-[#A64C4F]/[0.04] p-4">
                        <div className="flex items-center gap-3">
                          <span className="w-2 h-2 bg-[#A64C4F] animate-pulse" />
                          <p className="text-[13px] text-[#2F2B28] font-medium">
                            {launchState.step}
                          </p>
                        </div>
                        <p className="text-[11px] text-[#826D62] mt-2">
                          Approve the transaction in your wallet.
                        </p>
                      </div>
                    )}

                    {launchState.stage === "pre-minting" && (
                      <div className="border border-[#A64C4F]/30 bg-[#A64C4F]/[0.04] p-4">
                        <div className="flex items-center justify-between text-[13px] mb-2">
                          <span className="text-[#2F2B28] font-medium">
                            Bulk pre-minting ({BULK_BATCH_SIZE} NFTs per tx)
                          </span>
                          <span className="font-mono text-[#A64C4F] font-bold">
                            {launchState.minted} / {launchState.total}
                          </span>
                        </div>
                        <div className="h-[4px] bg-[#C4B99A]/60 overflow-hidden mb-2">
                          <div
                            className="h-full bg-[#A64C4F] transition-all"
                            style={{
                              width: `${(launchState.minted / Math.max(1, launchState.total)) * 100}%`,
                            }}
                          />
                        </div>
                        <p className="text-[11px] text-[#826D62]">
                          Batch {launchState.batch} of {launchState.totalBatches}. Keep approving in your wallet.
                        </p>
                      </div>
                    )}

                    {launchState.stage === "done" && (
                      <div className="border border-[#A64C4F]/30 bg-[#A64C4F]/[0.04] p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#A64C4F" strokeWidth="2.5">
                            <path d="M3 8 L6.5 11.5 L13 4.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <p className="text-[14px] font-bold text-[#2F2B28]">
                            Collection launched on devnet
                          </p>
                        </div>

                        <div className="space-y-1.5 text-[12px]">
                          <div className="flex justify-between gap-3">
                            <span className="text-[#826D62]">Collection address</span>
                            <a
                              href={accountExplorerUrl(launchState.collectionAddress)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-[#A64C4F] hover:underline truncate max-w-[260px]"
                            >
                              {launchState.collectionAddress.slice(0, 8)}...
                              {launchState.collectionAddress.slice(-6)}
                            </a>
                          </div>
                          <div className="flex justify-between gap-3">
                            <span className="text-[#826D62]">Pre-minted</span>
                            <span className="font-mono text-[#2F2B28] font-medium">
                              {launchState.mintsMinted} NFT{launchState.mintsMinted === 1 ? "" : "s"}
                            </span>
                          </div>
                          <div className="flex justify-between gap-3">
                            <span className="text-[#826D62]">Plugins</span>
                            <span className="text-[#2F2B28]">
                              Royalty 10% . Permanent Freeze . Update Delegate
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-[#A64C4F]/20 flex items-center gap-3 flex-wrap">
                          <a
                            href={accountExplorerUrl(launchState.collectionAddress)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[12px] text-[#A64C4F] hover:underline font-medium"
                          >
                            View collection →
                          </a>
                        </div>
                      </div>
                    )}

                    {launchState.stage === "error" && (
                      <div className="border border-[#A64C4F] bg-[#A64C4F]/[0.05] p-4">
                        <p className="text-[13px] font-semibold text-[#A64C4F] mb-1">
                          Launch failed
                        </p>
                        <p className="text-[12px] text-[#826D62] break-words">
                          {launchState.message}
                        </p>
                        <button
                          onClick={() => setLaunchState({ stage: "idle" })}
                          className="text-[12px] text-[#A64C4F] hover:underline mt-2"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Sidebar */}
          <motion.aside
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="lg:sticky lg:top-[88px] self-start space-y-4"
          >
            {/* How it works */}
            <div className="border border-[#C4B99A] bg-[#EDE3BC] p-4">
              <p className="text-[12px] font-semibold text-[#2F2B28] mb-3">How the launch works</p>
              <ol className="text-[12px] text-[#826D62] leading-[1.7] space-y-2 list-decimal list-inside">
                <li>You pay the launch fee + any pre-mint cost</li>
                <li>Your art is hosted off-chain by Rug.World</li>
                <li>Pre-mint goes straight to your wallet (frozen)</li>
                <li>Mint phases open on the scheduled dates</li>
                <li>When a buyer pays the mint price, that specific NFT gets minted to their wallet (frozen)</li>
                <li>No upfront bulk mint, supply can be adjusted mid-launch</li>
              </ol>
            </div>

            {/* Lazy mint note */}
            <div className="border border-[#DEA831]/30 bg-[#DEA831]/5 p-4">
              <p className="text-[12px] font-semibold text-[#2F2B28] mb-2">Lazy mint</p>
              <p className="text-[11px] text-[#826D62] leading-[1.5]">
                NFTs aren&apos;t minted upfront. They&apos;re minted on-demand when someone buys. This means Rug.World can adjust supply, price, and phase timing mid-launch if needed.
              </p>
            </div>

            {/* Fees summary */}
            <div className="border border-[#C4B99A] bg-[#C4B99A]/15 p-4">
              <p className="text-[12px] font-semibold text-[#2F2B28] mb-3">Platform fees (per mint)</p>
              <div className="space-y-2 text-[12px]">
                <div className="flex justify-between">
                  <span className="text-[#826D62]">Added to buyer&apos;s cost</span>
                  <span className="font-mono text-[#2F2B28] font-bold">+{MARKETPLACE_FEE}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#826D62]">Cut from your share</span>
                  <span className="font-mono text-[#2F2B28] font-bold">-{MARKETPLACE_FEE}%</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#C4B99A]">
                  <span className="text-[#826D62]">Secondary royalty (stakers)</span>
                  <span className="font-mono text-[#A64C4F] font-bold">10%</span>
                </div>
              </div>
              <p className="text-[11px] text-[#8A8480] mt-3 leading-[1.4]">
                For a 1 SOL mint: buyer pays 1.025 SOL, you receive 0.975 SOL per NFT.
              </p>
            </div>
          </motion.aside>
        </div>
      </div>

      {/* Launch confirmation modal */}
      <AnimatePresence>
        {showLaunchModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLaunchModal(false)}
            className="fixed inset-0 z-[200] bg-[#2F2B28]/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#EDE3BC] border border-[#C4B99A] max-w-[520px] w-full"
            >
              <div className="p-5 border-b border-[#C4B99A] flex items-center justify-between">
                <div>
                  <h3 className="text-[18px] font-bold text-[#2F2B28]">Confirm launch</h3>
                  <p className="text-[11px] text-[#826D62] mt-0.5">
                    Please keep this tab open until the flow finishes
                  </p>
                </div>
                <button
                  onClick={() => setShowLaunchModal(false)}
                  className="w-8 h-8 flex items-center justify-center text-[#826D62] hover:text-[#A64C4F] text-[18px]"
                >
                  ×
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="border border-[#A64C4F]/25 bg-[#A64C4F]/[0.04] p-4">
                  <p className="text-[13px] font-semibold text-[#2F2B28] mb-1">
                    You will approve <span className="text-[#A64C4F]">{totalApprovals}</span> transaction{totalApprovals === 1 ? "" : "s"} in your wallet.
                  </p>
                  <p className="text-[11px] text-[#826D62] leading-[1.5]">
                    1 for collection create + launch fee{preMintBatches > 0 ? `, ${preMintBatches} for bulk pre-mint (${BULK_BATCH_SIZE} NFTs per tx)` : ""}.
                  </p>
                </div>

                <div className="space-y-2 text-[13px]">
                  <div className="flex justify-between">
                    <span className="text-[#826D62]">Asset uploads (silent, Arweave)</span>
                    <span className="font-mono text-[#2F2B28]">{preMintNum}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#826D62]">Wallet approvals needed</span>
                    <span className="font-mono font-bold text-[#A64C4F]">{totalApprovals}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#826D62]">Estimated time</span>
                    <span className="font-mono text-[#2F2B28]">~{Math.ceil(estimatedSeconds / 60)} min</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[#C4B99A]">
                    <span className="text-[#826D62]">Total cost</span>
                    <span className="font-mono font-bold text-[#2F2B28]">{totalLaunchCost} SOL</span>
                  </div>
                </div>

                <div className="border border-[#C4B99A] bg-[#C4B99A]/15 p-3">
                  <p className="text-[11px] text-[#826D62] leading-[1.5]">
                    Each approval pops up automatically. Don&apos;t refresh or close the tab, and don&apos;t disconnect your wallet mid-flight.
                  </p>
                </div>

                {validationErrors.length > 0 && (
                  <div className="border border-[#A64C4F] bg-[#A64C4F]/[0.05] p-3">
                    <p className="text-[11px] font-semibold text-[#A64C4F] mb-1">
                      Resolve these before continuing:
                    </p>
                    <ul className="text-[11px] text-[#A64C4F] space-y-0.5 list-disc list-inside">
                      {validationErrors.map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="p-5 border-t border-[#C4B99A] flex justify-end gap-2">
                <button
                  onClick={() => setShowLaunchModal(false)}
                  className="px-5 py-2.5 text-[13px] font-semibold text-[#2F2B28] border border-[#C4B99A] hover:border-[#A64C4F] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowLaunchModal(false);
                    handleLaunch();
                  }}
                  disabled={validationErrors.length > 0}
                  className="px-5 py-2.5 text-[13px] font-bold text-[#EDE3BC] bg-[#A64C4F] hover:bg-[#8a3d40] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Start launch →
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
