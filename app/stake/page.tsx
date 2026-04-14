"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import type { LaunchedCollection } from "@/lib/launched";

function StakeCard({ col, i }: { col: LaunchedCollection; i: number }) {
  const [expanded, setExpanded] = useState(false);
  const stakerCut = (col.royaltyFee * col.holderShare) / 100;
  // For now there's no real staking program yet, so these are placeholders
  // (0) until the stake program + indexer go live.
  const totalStaked = 0;
  const royaltyPool = "0 SOL";
  const userStaked = 0;
  const earned = "0 SOL";
  const stakePct = col.supply > 0 ? Math.round((totalStaked / col.supply) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: i * 0.06 }}
      className="border border-[#C4B99A] bg-[#EDE3BC] overflow-hidden"
    >
      <div
        className="p-5 cursor-pointer hover:bg-[#2F2B28]/[0.02] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#2F2B28]/[0.04] flex items-center justify-center flex-shrink-0">
            <span className="text-[20px] font-black text-[#2F2B28]/10">
              {col.name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 3)}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[16px] font-bold text-[#2F2B28] truncate">{col.name}</h3>
              <span className="text-[13px] font-mono text-[#A64C4F] font-medium ml-2 flex-shrink-0">
                {stakerCut}% royalty
              </span>
            </div>
            <div className="flex items-center gap-3 text-[12px] text-[#826D62] flex-wrap">
              <span>{totalStaked.toLocaleString()} staked</span>
              <span className="text-[#8A8480]">|</span>
              <span>Pool: {royaltyPool}</span>
              <span className="text-[#8A8480]">|</span>
              <span className="font-mono text-[10px] text-[#8A8480]">
                {col.collectionAddress.slice(0, 6)}...{col.collectionAddress.slice(-4)}
              </span>
            </div>
          </div>

          <svg
            className={`w-4 h-4 text-[#826D62] transition-transform flex-shrink-0 ${expanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        <div className="mt-3">
          <div className="h-[3px] bg-[#2F2B28]/6 overflow-hidden">
            <div className="h-full bg-[#A64C4F]" style={{ width: `${stakePct}%` }} />
          </div>
          <p className="text-[11px] font-mono text-[#8A8480] mt-1">
            {stakePct}% of supply staked
          </p>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-[#C4B99A] pt-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                <div>
                  <span className="block text-[11px] text-[#826D62] uppercase tracking-wider mb-1">Total Staked</span>
                  <span className="text-[16px] font-bold text-[#2F2B28]">{totalStaked.toLocaleString()}</span>
                </div>
                <div>
                  <span className="block text-[11px] text-[#826D62] uppercase tracking-wider mb-1">Royalty Pool</span>
                  <span className="text-[16px] font-bold text-[#2F2B28]">{royaltyPool}</span>
                </div>
                <div>
                  <span className="block text-[11px] text-[#826D62] uppercase tracking-wider mb-1">Your Staked</span>
                  <span className="text-[16px] font-bold text-[#2F2B28]">{userStaked}</span>
                </div>
                <div>
                  <span className="block text-[11px] text-[#826D62] uppercase tracking-wider mb-1">Earned</span>
                  <span className="text-[16px] font-bold text-[#A64C4F]">{earned}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  disabled
                  className="flex-1 min-w-[140px] py-3 text-[13px] font-semibold text-[#EDE3BC] bg-[#A64C4F] opacity-50 cursor-not-allowed transition-colors"
                >
                  Stake NFT
                </button>
                <button
                  disabled
                  className="flex-1 min-w-[140px] py-3 text-[13px] font-semibold text-[#2F2B28] border border-[#C4B99A] opacity-50 cursor-not-allowed transition-colors"
                >
                  Unstake
                </button>
                <button
                  disabled
                  className="flex-1 min-w-[140px] py-3 text-[13px] font-semibold text-[#A64C4F] border border-[#A64C4F]/20 opacity-50 cursor-not-allowed transition-colors"
                >
                  Claim Rewards
                </button>
              </div>

              <p className="text-[11px] text-[#8A8480] mt-3 leading-[1.4]">
                Staking program not deployed yet. These controls light up once the on-chain stake program goes live.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function StakePage() {
  const [collections, setCollections] = useState<LaunchedCollection[]>([]);

  useEffect(() => {
    fetch("/api/launches")
      .then((r) => r.json())
      .then((data) => {
        if (!data.collections) return;
        const normalized: LaunchedCollection[] = data.collections.map((c: {
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
          phases: LaunchedCollection["phases"];
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
        }));
        setCollections(normalized);
      })
      .catch((e) => console.error("Failed to load launches", e));
  }, []);

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
            Staking
          </h1>
          <p className="mt-3 text-[clamp(15px,1.2vw,17px)] text-[#826D62] max-w-[520px]">
            Stake your NFTs to earn royalties from secondary sales. Each collection has its own pool.
          </p>
        </motion.div>

        {collections.length === 0 ? (
          <div className="border border-[#C4B99A] bg-[#EDE3BC] p-12 text-center">
            <p className="text-[15px] font-semibold text-[#2F2B28] mb-2">
              No stakeable collections yet
            </p>
            <p className="text-[13px] text-[#826D62] mb-6 max-w-[420px] mx-auto">
              Launch a collection to create its staking pool. Once minters hold NFTs, they can stake here to earn royalty share.
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
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10"
            >
              {[
                { label: "Total Collections", value: collections.length.toString() },
                { label: "Total NFTs Staked", value: "0" },
                { label: "Total Royalty Pools", value: "0 SOL" },
                { label: "Your Earned", value: "0 SOL" },
              ].map((stat) => (
                <div key={stat.label} className="border border-[#C4B99A] p-4 bg-[#EDE3BC]">
                  <span className="block text-[11px] text-[#826D62] uppercase tracking-wider mb-1">
                    {stat.label}
                  </span>
                  <span className="text-[22px] font-bold text-[#2F2B28]">{stat.value}</span>
                </div>
              ))}
            </motion.div>

            <div className="space-y-3">
              {collections.map((col, i) => (
                <StakeCard key={col.collectionAddress} col={col} i={i} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
