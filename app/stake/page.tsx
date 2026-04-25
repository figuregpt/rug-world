"use client";

import Link from "next/link";
import StakeTutorial from "@/components/StakeTutorial";

export default function StakePage() {
  return (
    <div className="page-content">
      <div style={{ marginBottom: 28 }}>
        <div className="eyebrow">Stake</div>
        <h1 className="h-display" style={{ fontSize: 56, marginTop: 8 }}>Earn from every trade.</h1>
        <p className="text-muted" style={{ marginTop: 10, maxWidth: 560, lineHeight: 1.6 }}>
          Stake your NFTs into their collection's vault. Every secondary sale pays royalties to stakers. Coming when the launchpad opens.
        </p>
      </div>

      <StakeTutorial />

      <div className="card pad-lg" style={{ marginTop: 0, textAlign: "center", padding: "80px 40px" }}>
        <div className="serif" style={{ fontSize: 28, letterSpacing: "-0.01em", marginBottom: 12 }}>
          Staking opening with the launchpad.
        </div>
        <p style={{ color: "var(--text-2)", fontSize: 15, lineHeight: 1.6, maxWidth: 480, margin: "0 auto", marginBottom: 24 }}>
          When collections launch on Campfire, each one gets its own staking pool. Hold and stake to earn a share of every secondary sale.
        </p>
        <div className="hstack" style={{ justifyContent: "center", gap: 10 }}>
          <Link href="/docs" className="btn-ghost lg">Learn how staking works</Link>
        </div>
      </div>
    </div>
  );
}
