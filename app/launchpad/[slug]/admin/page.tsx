"use client";

import { useEffect, useState, use } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { getLaunched, updateLaunched, type LaunchedCollection } from "@/lib/launched";

export default function AdminPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [col, setCol] = useState<LaunchedCollection | null | undefined>(undefined);
  const [supply, setSupply] = useState(0);
  const [phases, setPhases] = useState<Array<{
    name: string;
    price: string;
    status: "active" | "upcoming" | "ended";
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    supply: string;
    maxPerWallet: string;
  }>>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetched = getLaunched(slug) || null;
    setCol(fetched);
    if (fetched) {
      setSupply(fetched.supply);
      setPhases(
        fetched.phases.map((p) => ({
          name: p.name,
          price: p.price,
          status: "upcoming",
          startDate: p.startDate,
          startTime: p.startTime || "00:00",
          endDate: p.endDate,
          endTime: p.endTime || "23:59",
          supply: p.supply,
          maxPerWallet: p.maxPerWallet,
        }))
      );
    }
  }, [slug]);

  if (col === undefined) {
    return (
      <div className="pt-[72px] min-h-screen">
        <div className="container-main py-16">
          <p className="text-[#826D62]">Loading...</p>
        </div>
      </div>
    );
  }

  if (col === null) {
    return (
      <div className="pt-[72px] min-h-screen">
        <div className="container-main py-16 max-w-[520px]">
          <h1 className="text-[clamp(28px,4vw,42px)] font-black text-[#2F2B28] leading-[1] mb-3">
            Collection not found
          </h1>
          <p className="text-[14px] text-[#826D62] mb-6">
            No launched collection at this slug.
          </p>
          <Link href="/launchpad" className="text-[14px] text-[#A64C4F] hover:underline font-medium">
            ← Back to Launchpad
          </Link>
        </div>
      </div>
    );
  }

  const updatePhase = (i: number, field: string, value: string) => {
    setPhases(phases.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)));
  };

  const saveChanges = () => {
    if (!col) return;
    updateLaunched(col.collectionAddress, {
      supply,
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
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const label = "block text-[11px] font-mono text-[#826D62] uppercase tracking-wider mb-1";
  const input = "w-full px-3 py-2 bg-[#EDE3BC] border border-[#C4B99A] text-[14px] text-[#2F2B28] focus:border-[#A64C4F] outline-none transition-colors";

  const supplyDelta = supply - col.supply;

  return (
    <div className="pt-[72px] min-h-screen">
      <div className="container-main py-[clamp(32px,4vw,56px)]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-[13px] mb-6"
        >
          <Link href="/launchpad" className="text-[#826D62] hover:text-[#A64C4F] transition-colors">
            Launchpad
          </Link>
          <span className="text-[#8A8480]">/</span>
          <Link href={`/launchpad/${col.slug}`} className="text-[#826D62] hover:text-[#A64C4F] transition-colors">
            {col.name}
          </Link>
          <span className="text-[#8A8480]">/</span>
          <span className="text-[#2F2B28] font-medium">Admin</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-[clamp(32px,4vw,48px)] font-black text-[#2F2B28] leading-[1]">
              Admin Controls
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-[#A64C4F] text-[#EDE3BC]">
              Rug.World team only
            </span>
          </div>
          <p className="text-[clamp(14px,1.1vw,16px)] text-[#826D62] max-w-[640px]">
            Adjust supply, mint prices, and phase timings mid-launch. The creator cannot access this page. Changes apply to the lazy-mint pool immediately.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          <div className="space-y-10">
            {/* Live stats */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <div className="border-b border-[#C4B99A] mb-5 pb-3">
                <span className="block text-[12px] font-mono text-[#A64C4F]">Live</span>
                <span className="text-[15px] font-semibold text-[#2F2B28]">Current Status</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="border border-[#C4B99A] p-4">
                  <span className="block text-[11px] text-[#826D62] uppercase tracking-wider mb-1">Minted</span>
                  <span className="text-[20px] font-bold text-[#2F2B28]">{col.minted.toLocaleString()}</span>
                </div>
                <div className="border border-[#C4B99A] p-4">
                  <span className="block text-[11px] text-[#826D62] uppercase tracking-wider mb-1">Remaining</span>
                  <span className="text-[20px] font-bold text-[#2F2B28]">{(col.supply - col.minted).toLocaleString()}</span>
                </div>
                <div className="border border-[#C4B99A] p-4">
                  <span className="block text-[11px] text-[#826D62] uppercase tracking-wider mb-1">Active Phase</span>
                  <span className="text-[20px] font-bold text-[#A64C4F]">
                    {phases.find((p) => p.status === "active")?.name || "None"}
                  </span>
                </div>
                <div className="border border-[#C4B99A] p-4">
                  <span className="block text-[11px] text-[#826D62] uppercase tracking-wider mb-1">Status</span>
                  <span className="text-[20px] font-bold text-[#2F2B28] capitalize">{col.status}</span>
                </div>
              </div>
            </motion.section>

            {/* Supply control */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="border-b border-[#C4B99A] mb-5 pb-3">
                <span className="block text-[12px] font-mono text-[#A64C4F]">01</span>
                <span className="text-[15px] font-semibold text-[#2F2B28]">Total Supply</span>
              </div>

              <div className="border border-[#C4B99A] p-5">
                <div className="flex items-end gap-4 mb-3">
                  <div className="flex-1">
                    <label className={label}>New supply</label>
                    <input
                      className={input}
                      type="number"
                      min={col.minted}
                      value={supply}
                      onChange={(e) => setSupply(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="text-right">
                    <span className="block text-[11px] text-[#826D62]">Currently minted</span>
                    <span className="text-[15px] font-bold text-[#2F2B28]">{col.minted.toLocaleString()}</span>
                  </div>
                </div>

                {supplyDelta !== 0 && (
                  <div className={`text-[12px] ${supplyDelta < 0 ? "text-[#A64C4F]" : "text-[#2F2B28]"}`}>
                    {supplyDelta > 0
                      ? `Adding ${supplyDelta.toLocaleString()} to the mint pool`
                      : `Cutting supply by ${Math.abs(supplyDelta).toLocaleString()}. Cannot go below minted (${col.minted.toLocaleString()}).`}
                  </div>
                )}

                <p className="text-[11px] text-[#8A8480] mt-3 leading-[1.4]">
                  Supply can only be cut down to the number already minted. Remaining NFTs are lazy-minted as buyers purchase.
                </p>
              </div>
            </motion.section>

            {/* Phases control */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div className="border-b border-[#C4B99A] mb-5 pb-3">
                <span className="block text-[12px] font-mono text-[#A64C4F]">02</span>
                <span className="text-[15px] font-semibold text-[#2F2B28]">Mint Phases</span>
              </div>

              <div className="space-y-3">
                {phases.map((phase, i) => (
                  <div key={i} className="border border-[#C4B99A] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-mono text-[#826D62]">0{i + 1}</span>
                        <span className="text-[14px] font-bold text-[#2F2B28]">{phase.name}</span>
                      </div>
                      <select
                        value={phase.status}
                        onChange={(e) => updatePhase(i, "status", e.target.value)}
                        className="px-2 py-1 text-[11px] bg-[#EDE3BC] border border-[#C4B99A] text-[#2F2B28] focus:border-[#A64C4F] outline-none"
                      >
                        <option value="upcoming">Upcoming</option>
                        <option value="active">Active</option>
                        <option value="ended">Ended</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                      <div>
                        <label className={label}>Price (SOL)</label>
                        <input className={input} value={phase.price} onChange={(e) => updatePhase(i, "price", e.target.value)} />
                      </div>
                      <div>
                        <label className={label}>Supply</label>
                        <input className={input} value={phase.supply} onChange={(e) => updatePhase(i, "supply", e.target.value)} />
                      </div>
                      <div>
                        <label className={label}>Per Wallet</label>
                        <input className={input} value={phase.maxPerWallet} onChange={(e) => updatePhase(i, "maxPerWallet", e.target.value)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={label}>Start Date</label>
                        <input className={input} type="date" value={phase.startDate} onChange={(e) => updatePhase(i, "startDate", e.target.value)} />
                      </div>
                      <div>
                        <label className={label}>Start Time</label>
                        <input className={input} type="time" value={phase.startTime} onChange={(e) => updatePhase(i, "startTime", e.target.value)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* Save */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="pt-4 border-t border-[#C4B99A] flex items-center justify-between gap-3"
            >
              <div>
                {saved ? (
                  <p className="text-[13px] text-[#A64C4F] font-semibold">
                    Changes saved. Lazy-mint pool updated.
                  </p>
                ) : (
                  <p className="text-[12px] text-[#826D62]">
                    Changes take effect immediately. Already-minted NFTs are unaffected.
                  </p>
                )}
              </div>
              <button
                onClick={saveChanges}
                className="px-6 py-3 text-[14px] font-bold text-[#EDE3BC] bg-[#A64C4F] hover:bg-[#8a3d40] transition-colors"
              >
                Save Changes
              </button>
            </motion.div>
          </div>

          {/* Sidebar */}
          <motion.aside
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:sticky lg:top-[88px] self-start space-y-4"
          >
            <div className="border border-[#A64C4F]/25 bg-[#A64C4F]/[0.03] p-4">
              <p className="text-[12px] font-semibold text-[#2F2B28] mb-2">Restricted access</p>
              <p className="text-[11px] text-[#826D62] leading-[1.5]">
                This page is only accessible to Rug.World team members. Collection creators cannot modify their launch parameters directly to prevent mid-flight rug pulls.
              </p>
            </div>

            <div className="border border-[#C4B99A] bg-[#C4B99A]/15 p-4">
              <p className="text-[12px] font-semibold text-[#2F2B28] mb-3">What can be changed</p>
              <ul className="text-[12px] text-[#826D62] leading-[1.7] space-y-1 list-disc list-inside">
                <li>Supply (cut down only)</li>
                <li>Mint price per phase</li>
                <li>Phase supply allocation</li>
                <li>Phase dates and times</li>
                <li>Phase status (upcoming / active / ended)</li>
                <li>Max per wallet</li>
              </ul>
            </div>

            <div className="border border-[#C4B99A] p-4">
              <p className="text-[12px] font-semibold text-[#2F2B28] mb-3">What cannot change</p>
              <ul className="text-[12px] text-[#826D62] leading-[1.7] space-y-1 list-disc list-inside">
                <li>Art itself</li>
                <li>Royalty percentage (10%)</li>
                <li>Marketplace fee (2.5%)</li>
                <li>Already-minted NFTs</li>
              </ul>
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}
