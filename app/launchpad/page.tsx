"use client";

import Link from "next/link";

export default function LaunchpadPage() {
  return (
    <div className="page-content">
      <div style={{ marginBottom: 8 }}>
        <div className="eyebrow">Launchpad</div>
        <h1 className="h1 serif" style={{ fontWeight: 400, marginTop: 8, fontSize: 44 }}>Coming soon.</h1>
        <p className="text-muted" style={{ marginTop: 10, maxWidth: 560, lineHeight: 1.6, fontSize: 15 }}>
          Campfire is a curated launchpad. We review every collection before it goes live. When we launch, approved projects will appear here with built-in royalty sharing for holders.
        </p>
      </div>

      <div className="card pad-lg" style={{ marginTop: 32, textAlign: "center", padding: "80px 40px" }}>
        <div className="serif" style={{ fontSize: 32, letterSpacing: "-0.01em", marginBottom: 16 }}>
          Launchpad opening soon.
        </div>
        <p style={{ color: "var(--text-2)", fontSize: 15, lineHeight: 1.6, maxWidth: 480, margin: "0 auto", marginBottom: 24 }}>
          Want to launch your collection on Campfire? Apply now and we'll review your project.
        </p>
        <div className="hstack" style={{ justifyContent: "center", gap: 10 }}>
          <Link href="https://x.com/" target="_blank" className="btn-primary lg">Apply for launch</Link>
          <Link href="/docs" className="btn-ghost lg">How it works</Link>
        </div>
      </div>
    </div>
  );
}
