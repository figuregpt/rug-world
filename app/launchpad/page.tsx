"use client";

import Link from "next/link";

export default function LaunchpadPage() {
  return (
    <div className="page-content">
      <div style={{ marginBottom: 8 }}>
        <div className="eyebrow">Launchpad</div>
        <h1 className="h1 serif" style={{ fontWeight: 400, marginTop: 8, fontSize: 44 }}>Drops</h1>
        <p className="text-muted" style={{ marginTop: 10, maxWidth: 560, lineHeight: 1.6, fontSize: 15 }}>
          Curated collections with built-in royalty sharing for holders.
        </p>
      </div>

      {/* BOIS */}
      <Link href="/launchpad/bois" className="card" style={{ padding: 0, display: "grid", gridTemplateColumns: "auto 1fr", gap: 0, textDecoration: "none", color: "inherit", marginTop: 28, cursor: "pointer" }}>
        <div style={{ width: 140, height: 140, overflow: "hidden", borderRadius: "14px 0 0 14px" }}>
          <img src="/sneak1.png" alt="BOIS" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}>
          <div className="hstack" style={{ gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 18 }}>BOIS</span>
            <span className="text-accent" style={{ fontSize: 13 }}>&#10003;</span>
            <div className="spacer" />
            <span className="pill upcoming">Mint not started</span>
          </div>
          <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.5 }}>
            The first collection on Campfire. 1,000 supply. 10% royalty, all to stakers. 50% of Campfire revenue to BOIS holders.
          </p>
          <div className="hstack" style={{ gap: 16, fontSize: 12 }}>
            <span><span className="mono" style={{ color: "var(--text)" }}>1,000</span> <span style={{ color: "var(--text-3)" }}>supply</span></span>
            <span><span className="mono text-accent">100%</span> <span style={{ color: "var(--text-3)" }}>to stakers</span></span>
            <span><span className="mono" style={{ color: "var(--text)" }}>10%</span> <span style={{ color: "var(--text-3)" }}>royalty</span></span>
          </div>
        </div>
      </Link>

      {/* More coming */}
      <div className="card pad-lg" style={{ marginTop: 16, textAlign: "center", padding: "48px 40px" }}>
        <div className="serif" style={{ fontSize: 22, letterSpacing: "-0.01em", marginBottom: 8 }}>
          More collections coming.
        </div>
        <p style={{ color: "var(--text-2)", fontSize: 14, lineHeight: 1.6, maxWidth: 420, margin: "0 auto", marginBottom: 18 }}>
          Apply to launch your collection on Campfire with built-in royalty sharing.
        </p>
        <div className="hstack" style={{ justifyContent: "center", gap: 10 }}>
          <Link href="https://x.com/" target="_blank" className="btn-primary">Apply for launch</Link>
          <Link href="/docs" className="btn-ghost">How it works</Link>
        </div>
      </div>
    </div>
  );
}
