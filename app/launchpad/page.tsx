"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import type { LaunchedCollection } from "@/lib/launched";

type Tab = "minting" | "finished";

function parseActivePhase(col: LaunchedCollection): LaunchedCollection["phases"][number] | undefined {
  const now = Date.now();
  for (const p of col.phases) {
    if (!p.startDate) continue;
    const start = new Date(`${p.startDate}T${p.startTime || "00:00"}`).getTime();
    const end = p.endDate
      ? new Date(`${p.endDate}T${p.endTime || "23:59"}`).getTime()
      : Infinity;
    if (start <= now && now < end) return p;
  }
  return undefined;
}

function CollectionCard({ col, i }: { col: LaunchedCollection; i: number }) {
  const pct = col.supply > 0 ? Math.round((col.minted / col.supply) * 100) : 0;
  const isMinting = col.status === "minting";
  const activePhase = parseActivePhase(col);
  const stakerCut = (col.royaltyFee * col.holderShare) / 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: i * 0.06 }}
    >
      <Link
        href={`/launchpad/${col.slug}`}
        className="block border border-[#C4B99A] bg-[#EDE3BC] hover:border-[#A64C4F]/25 transition-all group"
      >
        <div className="aspect-square bg-[#2F2B28]/[0.03] flex items-center justify-center relative overflow-hidden">
          <span className="text-[56px] font-black text-[#2F2B28]/[0.06] group-hover:text-[#A64C4F]/10 transition-colors">
            {col.name
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 3)}
          </span>
          <span
            className={`absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 ${
              isMinting
                ? "bg-[#A64C4F] text-[#EDE3BC]"
                : "bg-[#C4B99A]/60 text-[#826D62]"
            }`}
          >
            {isMinting ? "Minting" : "Sold Out"}
          </span>
          <span className="absolute top-3 left-3 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#2F2B28] text-[#EDE3BC]">
            {col.network}
          </span>
        </div>

        <div className="p-5">
          <h3 className="text-[17px] font-bold text-[#2F2B28] mb-1">{col.name}</h3>
          <p className="text-[13px] text-[#826D62] mb-3 line-clamp-1">
            {col.tagline || " "}
          </p>

          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-[13px]">
              <span className="text-[#826D62]">Supply</span>
              <span className="text-[#2F2B28] font-medium">
                {col.supply.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-[#826D62]">Minted</span>
              <span className="text-[#2F2B28] font-medium">
                {col.minted.toLocaleString()}
              </span>
            </div>
            {activePhase && (
              <div className="flex justify-between text-[13px]">
                <span className="text-[#826D62]">{activePhase.name} Price</span>
                <span className="text-[#A64C4F] font-medium">
                  {activePhase.price} SOL
                </span>
              </div>
            )}
            <div className="flex justify-between text-[13px]">
              <span className="text-[#826D62]">To Stakers</span>
              <span className="text-[#A64C4F] font-medium">
                {stakerCut}% of sale
              </span>
            </div>
          </div>

          <div className="mb-3">
            <div className="h-[3px] bg-[#2F2B28]/6 overflow-hidden">
              <div
                className="h-full bg-[#A64C4F]"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[11px] font-mono text-[#826D62]">
                {pct}% minted
              </span>
              <span className="text-[11px] font-mono text-[#8A8480]">
                {col.minted.toLocaleString()}/{col.supply.toLocaleString()}
              </span>
            </div>
          </div>

          <div
            className={`w-full py-3 text-[13px] font-semibold text-center transition-colors mt-2 ${
              isMinting
                ? "text-[#EDE3BC] bg-[#A64C4F] group-hover:bg-[#8a3d40]"
                : "text-[#2F2B28] bg-[#2F2B28]/6"
            }`}
          >
            {isMinting ? "View & Mint" : "View Collection"}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

const tabConfig: { key: Tab; label: string }[] = [
  { key: "minting", label: "Minting Now" },
  { key: "finished", label: "Finished" },
];

export default function LaunchpadPage() {
  const [tab, setTab] = useState<Tab>("minting");
  const [collections, setCollections] = useState<LaunchedCollection[]>([]);

  useEffect(() => {
    fetch("/api/launches")
      .then((r) => r.json())
      .then((data) => {
        if (data.collections) {
          // API returns DB rows which have `phases` nested, normalize field names
          const normalized: LaunchedCollection[] = data.collections.map(
            (c: {
              collectionAddress: string;
              collectionUri: string;
              creatorWallet: string;
              txSignature: string;
              network: string;
              slug: string;
              name: string;
              tagline?: string;
              description?: string;
              supply: number;
              preMintCount: number;
              royaltyFee: number;
              holderShare: number;
              teamShare: number;
              minted: number;
              status: string;
              launchedAt: string;
              phases: Array<{
                name: string;
                price: string;
                supply: string;
                maxPerWallet: string;
                startDate: string;
                startTime: string;
                endDate: string;
                endTime: string;
              }>;
            }) => ({
              collectionAddress: c.collectionAddress,
              collectionUri: c.collectionUri,
              creatorWallet: c.creatorWallet,
              txSignature: c.txSignature,
              network: c.network as "devnet" | "mainnet-beta",
              cluster: c.network as "devnet" | "mainnet-beta",
              slug: c.slug,
              name: c.name,
              tagline: c.tagline || "",
              description: c.description || "",
              supply: c.supply,
              preMintCount: c.preMintCount,
              royaltyFee: c.royaltyFee,
              holderShare: c.holderShare,
              teamShare: c.teamShare,
              minted: c.minted,
              phases: c.phases,
              status: c.status as "minting" | "finished" | "abandoned",
              launchedAt: c.launchedAt,
            })
          );
          setCollections(normalized);
        }
      })
      .catch((e) => console.error("Failed to load launches", e));
  }, []);

  const filtered = collections.filter((c) => c.status === tab);
  const mintingCount = collections.filter((c) => c.status === "minting").length;
  const finishedCount = collections.filter((c) => c.status === "finished").length;
  const counts: Record<Tab, number> = {
    minting: mintingCount,
    finished: finishedCount,
  };

  return (
    <div className="pt-[72px] min-h-screen">
      <div className="container-main py-[clamp(40px,5vw,64px)]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <h1 className="text-[clamp(36px,5vw,56px)] font-black text-[#2F2B28] leading-[1]">
            Launchpad
          </h1>
          <p className="mt-3 text-[clamp(15px,1.2vw,17px)] text-[#826D62] max-w-[520px]">
            Collections launched on Rug.World. {mintingCount} minting now, {finishedCount} sold out.
          </p>
        </motion.div>

        {collections.length === 0 ? (
          <div className="border border-[#C4B99A] bg-[#EDE3BC] p-12 text-center">
            <p className="text-[15px] font-semibold text-[#2F2B28] mb-2">
              No collections launched yet
            </p>
            <p className="text-[13px] text-[#826D62] mb-6 max-w-[420px] mx-auto">
              Be the first. Head to the Studio to build your traits, then launch your collection.
            </p>
            <Link
              href="/studio"
              className="inline-flex px-6 py-3 text-[14px] font-bold text-[#EDE3BC] bg-[#A64C4F] hover:bg-[#8a3d40] transition-colors"
            >
              Open Studio
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-1 mb-8 border-b border-[#C4B99A]">
              {tabConfig.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`px-5 py-3 text-[14px] font-medium transition-colors relative ${
                    tab === key
                      ? "text-[#A64C4F]"
                      : "text-[#826D62] hover:text-[#2F2B28]"
                  }`}
                >
                  {label}
                  <span className="ml-2 text-[12px] font-mono text-[#8A8480]">
                    {counts[key]}
                  </span>
                  {tab === key && (
                    <motion.div
                      layoutId="launchpad-tab"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#A64C4F]"
                    />
                  )}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
              >
                {filtered.map((col, i) => (
                  <CollectionCard key={col.collectionAddress} col={col} i={i} />
                ))}
              </motion.div>
            </AnimatePresence>

            {filtered.length === 0 && (
              <div className="text-center py-20">
                <p className="text-[#826D62]">No {tab === "minting" ? "active" : "finished"} collections yet.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
