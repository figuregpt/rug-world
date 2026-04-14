"use client";

import { useEffect, useState, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import type { LaunchedCollection, LaunchedPhase } from "@/lib/launched";
import { sendPaymentForIntent, accountExplorerUrl } from "@/lib/metaplex";

function phaseRuntimeStatus(p: LaunchedPhase, nowMs: number): "active" | "upcoming" | "ended" {
  if (!p.startDate) return "upcoming";
  const start = new Date(`${p.startDate}T${p.startTime || "00:00"}`).getTime();
  const end = p.endDate
    ? new Date(`${p.endDate}T${p.endTime || "23:59"}`).getTime()
    : Infinity;
  if (nowMs < start) return "upcoming";
  if (nowMs >= end) return "ended";
  return "active";
}

function phaseStartMs(p: LaunchedPhase): number | null {
  if (!p.startDate) return null;
  return new Date(`${p.startDate}T${p.startTime || "00:00"}`).getTime();
}

function phaseEndMs(p: LaunchedPhase): number | null {
  if (!p.endDate) return null;
  return new Date(`${p.endDate}T${p.endTime || "23:59"}`).getTime();
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "0s";
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

function PhaseRow({ phase, index, nowMs }: { phase: LaunchedPhase; index: number; nowMs: number }) {
  const status = phaseRuntimeStatus(phase, nowMs);
  const startMs = phaseStartMs(phase);
  const endMs = phaseEndMs(phase);
  let countdownLabel: string | null = null;
  if (status === "upcoming" && startMs !== null) {
    countdownLabel = `Starts in ${formatCountdown(startMs - nowMs)}`;
  } else if (status === "active" && endMs !== null) {
    countdownLabel = `Ends in ${formatCountdown(endMs - nowMs)}`;
  }
  const statusColor = {
    active: "bg-[#A64C4F] text-[#EDE3BC]",
    upcoming: "bg-[#DEA831]/15 text-[#DEA831]",
    ended: "bg-[#C4B99A]/60 text-[#826D62]",
  }[status];
  const isActive = status === "active";
  const supplyLabel =
    !phase.supply || phase.supply === "0" ? "Remaining" : phase.supply;
  const walletLabel =
    !phase.maxPerWallet || phase.maxPerWallet === "0" ? "Unlimited" : phase.maxPerWallet;

  return (
    <div
      className={`border p-4 transition-all ${
        isActive ? "border-[#A64C4F]/30 bg-[#A64C4F]/[0.03]" : "border-[#C4B99A]"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-[#826D62]">0{index + 1}</span>
          <h4 className="text-[14px] font-bold text-[#2F2B28]">{phase.name || "Phase"}</h4>
        </div>
        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 ${statusColor}`}>
          {status}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[12px]">
        <div className="flex justify-between">
          <span className="text-[#826D62]">Price</span>
          <span className="text-[#2F2B28] font-medium">{phase.price} SOL</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#826D62]">Per Wallet</span>
          <span className="text-[#2F2B28] font-medium">{walletLabel}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#826D62]">Supply</span>
          <span className="text-[#2F2B28] font-medium">{supplyLabel}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#826D62]">Start</span>
          <span className="text-[#2F2B28] font-medium">
            {phase.startDate ? `${phase.startDate} ${phase.startTime}` : "TBD"}
          </span>
        </div>
        {phase.endDate && (
          <div className="flex justify-between col-span-2">
            <span className="text-[#826D62]">End</span>
            <span className="text-[#2F2B28] font-medium">
              {phase.endDate} {phase.endTime}
            </span>
          </div>
        )}
      </div>
      {countdownLabel && (
        <div className={`mt-3 pt-3 border-t border-[#C4B99A] flex items-center justify-between text-[11px] ${
          status === "active" ? "text-[#A64C4F]" : "text-[#DEA831]"
        }`}>
          <span className="font-mono font-semibold tracking-wider uppercase">
            {status === "active" ? "Live" : "Upcoming"}
          </span>
          <span className="font-mono font-bold">{countdownLabel}</span>
        </div>
      )}
    </div>
  );
}

type MintState =
  | { stage: "idle" }
  | { stage: "intent" }
  | { stage: "paying"; totalSol: number }
  | { stage: "server-minting"; step: string }
  | { stage: "done"; assetAddresses: string[] }
  | { stage: "error"; message: string };

export default function MintPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const wallet = useWallet();
  const [col, setCol] = useState<LaunchedCollection | null | undefined>(undefined);
  const [mintQty, setMintQty] = useState(1);
  const [mintState, setMintState] = useState<MintState>({ stage: "idle" });
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    fetch(`/api/launches/${slug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.collection) {
          setCol(null);
          return;
        }
        const c = data.collection;
        setCol({
          collectionAddress: c.collectionAddress,
          collectionUri: c.collectionUri,
          creatorWallet: c.creatorWallet,
          txSignature: c.txSignature,
          network: c.network,
          cluster: c.network,
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
          status: c.status,
          launchedAt: c.launchedAt,
        });
      })
      .catch(() => setCol(null));
  }, [slug]);

  // Tick every second so countdowns update live
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Loading state
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
            This collection doesn&apos;t exist in your browser. If you launched it, reload this page in the same tab you used for the launch.
          </p>
          <Link
            href="/launchpad"
            className="text-[14px] text-[#A64C4F] hover:underline font-medium"
          >
            ← Back to Launchpad
          </Link>
        </div>
      </div>
    );
  }

  const mintPct = col.supply > 0 ? Math.round((col.minted / col.supply) * 100) : 0;
  const isMinting = col.status === "minting";
  const activePhase = col.phases.find(
    (p) => phaseRuntimeStatus(p, nowMs) === "active"
  );
  const stakerCut = (col.royaltyFee * col.holderShare) / 100;
  const activePrice = activePhase ? parseFloat(activePhase.price) || 0 : 0;
  const activeMax = activePhase
    ? parseInt(activePhase.maxPerWallet) || 0
    : 0;
  const activeWalletLabel = activeMax === 0 ? "Unlimited" : `Max ${activeMax}`;

  const explorerUrl = `https://explorer.solana.com/address/${col.collectionAddress}?cluster=${col.cluster}`;

  const handleMint = async () => {
    if (!col || !activePhase) return;
    if (!wallet.connected || !wallet.publicKey) {
      setMintState({ stage: "error", message: "Connect your wallet first." });
      return;
    }
    if (col.minted + mintQty > col.supply) {
      setMintState({ stage: "error", message: "Not enough supply remaining." });
      return;
    }

    try {
      // 1. Ask the server to create a mint intent (computes expected amount,
      //    returns a nonce + memo to bind our payment to this intent).
      setMintState({ stage: "intent" });
      const intentRes = await fetch("/api/mint/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          buyerWallet: wallet.publicKey.toString(),
          qty: mintQty,
        }),
      });
      const intent = await intentRes.json();
      if (!intentRes.ok) {
        throw new Error(intent.error || `intent error ${intentRes.status}`);
      }

      // 2. Buyer signs ONE payment tx (transfers + memo).
      setMintState({ stage: "paying", totalSol: intent.totalSol });
      const payment = await sendPaymentForIntent(wallet, {
        memo: intent.memo,
        creatorRecipient: intent.creatorRecipient,
        creatorAmountSol: intent.creatorAmountSol,
        treasuryRecipient: intent.treasuryRecipient,
        treasuryAmountSol: intent.treasuryAmountSol,
      });

      // 3. Server verifies + mints.
      setMintState({
        stage: "server-minting",
        step: "Verifying payment and minting...",
      });
      const execRes = await fetch("/api/mint/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intentId: intent.intentId,
          paymentSignature: payment.signature,
        }),
      });
      const exec = await execRes.json();
      if (!execRes.ok || !exec.ok) {
        throw new Error(exec.error || `execute error ${execRes.status}`);
      }

      const addresses: string[] = exec.assetAddresses;

      const newMinted = col.minted + mintQty;
      setCol({
        ...col,
        minted: newMinted,
        status: newMinted >= col.supply ? "finished" : col.status,
      });
      setMintState({ stage: "done", assetAddresses: addresses });
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Unknown error";
      setMintState({ stage: "error", message });
    }
  };

  const isMintBusy =
    mintState.stage === "intent" ||
    mintState.stage === "paying" ||
    mintState.stage === "server-minting";

  return (
    <div className="pt-[72px] min-h-screen">
      <div className="container-main py-[clamp(32px,4vw,56px)]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-[13px] mb-8"
        >
          <Link href="/launchpad" className="text-[#826D62] hover:text-[#A64C4F] transition-colors">
            Launchpad
          </Link>
          <span className="text-[#8A8480]">/</span>
          <span className="text-[#2F2B28] font-medium">{col.name}</span>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-8 lg:gap-12 mb-16">
          {/* Left: image placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="aspect-square bg-[#2F2B28]/[0.03] border border-[#C4B99A] flex items-center justify-center overflow-hidden">
              <span className="text-[120px] font-black text-[#2F2B28]/[0.04]">
                {col.name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 3)}
              </span>
            </div>
          </motion.div>

          {/* Right: mint panel */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 ${
                isMinting
                  ? "bg-[#A64C4F] text-[#EDE3BC]"
                  : "bg-[#C4B99A]/60 text-[#826D62]"
              }`}>
                {isMinting ? "Minting" : "Sold Out"}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#2F2B28] text-[#EDE3BC]">
                {col.network}
              </span>
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] text-[#826D62] hover:text-[#A64C4F] transition-colors font-mono"
              >
                {col.collectionAddress.slice(0, 6)}...{col.collectionAddress.slice(-4)} →
              </a>
            </div>

            <h1 className="text-[clamp(28px,3.5vw,42px)] font-black text-[#2F2B28] leading-[1.05] mb-1">
              {col.name}
            </h1>
            {col.tagline && (
              <p className="text-[15px] text-[#A64C4F] font-medium mb-5">{col.tagline}</p>
            )}

            <div className="border border-[#C4B99A] p-5 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] text-[#826D62]">Mint Progress</span>
                <span className="text-[13px] font-mono font-bold text-[#2F2B28]">{mintPct}%</span>
              </div>
              <div className="h-[6px] bg-[#2F2B28]/6 overflow-hidden mb-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${mintPct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full bg-[#A64C4F]"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-mono text-[#8A8480]">
                  {col.minted.toLocaleString()} / {col.supply.toLocaleString()}
                </span>
                <span className="text-[12px] font-mono text-[#826D62]">
                  {(col.supply - col.minted).toLocaleString()} remaining
                </span>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <p className="text-[12px] font-mono text-[#826D62] uppercase tracking-wider mb-1">Mint Phases</p>
              {col.phases.length === 0 ? (
                <p className="text-[13px] text-[#826D62] italic p-4 border border-[#C4B99A]">
                  No phases configured.
                </p>
              ) : (
                col.phases.map((phase, i) => (
                  <PhaseRow key={i} phase={phase} index={i} nowMs={nowMs} />
                ))
              )}
            </div>

            {isMinting && activePhase ? (
              <div className="border border-[#A64C4F]/25 bg-[#A64C4F]/[0.02] p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[13px] font-semibold text-[#2F2B28]">
                    {activePhase.name} · {activePhase.price} SOL
                  </span>
                  <span className="text-[11px] text-[#826D62]">{activeWalletLabel}</span>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <button
                    onClick={() => setMintQty(Math.max(1, mintQty - 1))}
                    className="w-10 h-10 border border-[#C4B99A] flex items-center justify-center text-[#2F2B28] hover:border-[#A0937E] transition-colors text-[18px] font-medium"
                  >
                    -
                  </button>
                  <span className="text-[20px] font-bold text-[#2F2B28] w-12 text-center">{mintQty}</span>
                  <button
                    onClick={() =>
                      setMintQty(
                        activeMax === 0
                          ? mintQty + 1
                          : Math.min(activeMax, mintQty + 1)
                      )
                    }
                    className="w-10 h-10 border border-[#C4B99A] flex items-center justify-center text-[#2F2B28] hover:border-[#A0937E] transition-colors text-[18px] font-medium"
                  >
                    +
                  </button>
                  <span className="text-[13px] text-[#826D62] ml-auto">
                    Total: <span className="font-bold text-[#2F2B28]">{(activePrice * mintQty).toFixed(2)} SOL</span>
                  </span>
                </div>
                <button
                  onClick={handleMint}
                  disabled={!wallet.connected || isMintBusy}
                  className="w-full py-4 text-[15px] font-bold text-[#EDE3BC] bg-[#A64C4F] hover:bg-[#8a3d40] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {mintState.stage === "intent"
                    ? "Preparing intent..."
                    : mintState.stage === "paying"
                    ? `Waiting for payment (${mintState.totalSol.toFixed(4)} SOL)...`
                    : mintState.stage === "server-minting"
                    ? "Server minting NFTs..."
                    : `Mint ${mintQty} · ${(activePrice * mintQty).toFixed(2)} SOL`}
                </button>
                <p className="text-[11px] text-[#8A8480] mt-2 leading-[1.4]">
                  You sign one payment. Rug.World handles the upload and delivers the NFT to your wallet.
                </p>
                {!wallet.connected && (
                  <p className="text-[11px] text-[#DEA831] mt-2">Connect your wallet to mint.</p>
                )}

                <AnimatePresence>
                  {mintState.stage === "paying" && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-3 border border-[#A64C4F]/30 bg-[#A64C4F]/[0.04] p-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-[#A64C4F] animate-pulse" />
                        <p className="text-[12px] text-[#2F2B28] font-medium">
                          Approve the payment in your wallet
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {mintState.stage === "server-minting" && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-3 border border-[#A64C4F]/30 bg-[#A64C4F]/[0.04] p-3"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 bg-[#A64C4F] animate-pulse" />
                        <p className="text-[12px] text-[#2F2B28] font-medium">
                          {mintState.step}
                        </p>
                      </div>
                      <p className="text-[10px] text-[#826D62]">
                        Rug.World is uploading metadata and minting {mintQty} NFT{mintQty === 1 ? "" : "s"} to your wallet. No more wallet pop-ups needed.
                      </p>
                    </motion.div>
                  )}

                  {mintState.stage === "done" && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-3 border border-[#A64C4F]/30 bg-[#A64C4F]/[0.04] p-3"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#A64C4F" strokeWidth="2.5">
                          <path d="M3 7 L6 10 L11 4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="text-[13px] font-bold text-[#2F2B28]">
                          Minted {mintState.assetAddresses.length} NFT{mintState.assetAddresses.length === 1 ? "" : "s"}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {mintState.assetAddresses.map((addr) => (
                          <a
                            key={addr}
                            href={accountExplorerUrl(addr)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-[10px] font-mono text-[#A64C4F] hover:underline truncate"
                          >
                            {addr.slice(0, 10)}...{addr.slice(-6)} →
                          </a>
                        ))}
                      </div>
                      <button
                        onClick={() => setMintState({ stage: "idle" })}
                        className="text-[11px] text-[#826D62] hover:text-[#A64C4F] mt-2"
                      >
                        Close
                      </button>
                    </motion.div>
                  )}

                  {mintState.stage === "error" && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-3 border border-[#A64C4F] bg-[#A64C4F]/[0.05] p-3"
                    >
                      <p className="text-[12px] font-semibold text-[#A64C4F] mb-1">Mint failed</p>
                      <p className="text-[11px] text-[#826D62] break-words">{mintState.message}</p>
                      <button
                        onClick={() => setMintState({ stage: "idle" })}
                        className="text-[11px] text-[#A64C4F] hover:underline mt-2"
                      >
                        Dismiss
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="border border-[#C4B99A] bg-[#C4B99A]/20 p-5 text-center">
                <p className="text-[15px] font-semibold text-[#826D62]">
                  {isMinting ? "No active phase right now" : "Mint Complete"}
                </p>
                <p className="text-[12px] text-[#8A8480] mt-1">
                  {isMinting
                    ? "Check the phase schedule above."
                    : "This collection is sold out. Check secondary markets."}
                </p>
              </div>
            )}

            <div className="border border-[#C4B99A] p-4 mt-4">
              <p className="text-[11px] font-mono text-[#A64C4F] uppercase tracking-wider mb-3">
                Royalty · {col.royaltyFee}%
              </p>
              <div className="flex h-7 overflow-hidden mb-2 text-[10px] font-bold">
                <div
                  className="bg-[#A64C4F] flex items-center justify-center text-[#EDE3BC]"
                  style={{ width: `${col.holderShare}%` }}
                >
                  {stakerCut}%
                </div>
                {col.teamShare > 0 && (
                  <div
                    className="bg-[#2F2B28] flex items-center justify-center text-[#EDE3BC]"
                    style={{ width: `${col.teamShare}%` }}
                  >
                    {(col.royaltyFee * col.teamShare) / 100}%
                  </div>
                )}
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#A64C4F]" />
                    <span className="text-[#2F2B28] font-medium">Stakers</span>
                  </span>
                  <span className="font-mono text-[#A64C4F]">{stakerCut}%</span>
                </div>
                {col.teamShare > 0 && (
                  <div className="flex justify-between">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-[#2F2B28]" />
                      <span className="text-[#826D62]">Team</span>
                    </span>
                    <span className="font-mono text-[#826D62]">
                      {(col.royaltyFee * col.teamShare) / 100}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* About */}
        {col.description && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mb-16"
          >
            <div className="border-b border-[#C4B99A] mb-6 pb-3">
              <span className="text-[15px] font-semibold text-[#2F2B28]">About</span>
            </div>
            <p className="text-[clamp(15px,1.2vw,17px)] text-[#826D62] leading-[1.8] max-w-[720px]">
              {col.description}
            </p>
          </motion.div>
        )}

        {/* On-chain details */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="mb-16"
        >
          <div className="border-b border-[#C4B99A] mb-6 pb-3">
            <span className="text-[15px] font-semibold text-[#2F2B28]">On-chain</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-[960px]">
            <div className="border border-[#C4B99A] p-4">
              <span className="block text-[11px] text-[#826D62] uppercase tracking-wider mb-1">Network</span>
              <span className="text-[14px] font-medium text-[#2F2B28] capitalize">{col.network}</span>
            </div>
            <div className="border border-[#C4B99A] p-4">
              <span className="block text-[11px] text-[#826D62] uppercase tracking-wider mb-1">Supply</span>
              <span className="text-[14px] font-medium text-[#2F2B28]">{col.supply.toLocaleString()}</span>
            </div>
            <div className="border border-[#C4B99A] p-4">
              <span className="block text-[11px] text-[#826D62] uppercase tracking-wider mb-1">Pre-minted</span>
              <span className="text-[14px] font-medium text-[#2F2B28]">{col.preMintCount.toLocaleString()}</span>
            </div>
            <div className="border border-[#C4B99A] p-4">
              <span className="block text-[11px] text-[#826D62] uppercase tracking-wider mb-1">Launched</span>
              <span className="text-[14px] font-medium text-[#2F2B28]">
                {new Date(col.launchedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </motion.div>

        <div className="border-t border-[#C4B99A] pt-6">
          <Link
            href="/launchpad"
            className="text-[14px] text-[#A64C4F] hover:text-[#8a3d40] font-medium transition-colors"
          >
            ← Back to Launchpad
          </Link>
        </div>
      </div>
    </div>
  );
}
