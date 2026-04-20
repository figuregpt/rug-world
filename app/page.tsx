"use client";

import Link from "next/link";

function RugTile({ variant = 1, glyph }: { variant?: number; glyph?: string }) {
  return (
    <div className={`rug-tile ${variant > 1 ? `v${variant}` : ""}`}>
      {glyph && <span className="glyph">{glyph}</span>}
    </div>
  );
}

export default function Home() {
  return (
    <div className="page-content">
      {/* HERO */}
      <section style={{ paddingTop: 20, paddingBottom: 56, borderBottom: "1px solid var(--border)" }}>
        <div className="rw-hero-grid" style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 48, alignItems: "end" }}>
          <div>
            <div style={{ marginBottom: 22 }} />
            <h1 className="h-display">
              Launch collections.<br />
              <em>Share royalties</em> with holders.
            </h1>
            <p style={{ marginTop: 22, fontSize: 16, lineHeight: 1.6, color: "var(--text-2)", maxWidth: 520 }}>
              NFT drops with a built-in royalty vault. When your collection trades, the people who hold and stake get paid.
            </p>
            <div className="hstack" style={{ marginTop: 30, gap: 12 }}>
              <Link href="/studio" className="btn-primary lg">
                Try Art Studio
              </Link>
              <Link href="/docs" className="btn-ghost lg">
                Learn more
              </Link>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <RugTile variant={1} />
            <RugTile variant={2} glyph="C" />
            <RugTile variant={3} glyph="F" />
            <RugTile variant={4} />
          </div>
        </div>
      </section>

      {/* FEATURED COLLECTION - BOIS */}
      <section style={{ padding: "56px 0" }}>
        <div className="hstack" style={{ marginBottom: 20 }}>
          <div className="eyebrow">Featured Collection</div>
          <div className="spacer" />
          <span className="pill live">First drop</span>
        </div>
        <div className="card rw-feature-grid" style={{ padding: 0, display: "grid", gridTemplateColumns: "1.1fr 1fr" }}>
          <div style={{ padding: 36, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-elev-2)", borderRadius: "14px 0 0 14px" }}>
            <img src="/bois-logo.png" alt="BOIS" style={{ width: "70%", maxWidth: 240, filter: "invert(1) brightness(0.85)", opacity: 0.9 }} />
          </div>
          <div style={{ padding: "36px 36px 36px 12px", display: "flex", flexDirection: "column", gap: 14 }}>
            <h2 className="h1 serif" style={{ fontWeight: 400 }}>BOIS</h2>
            <p style={{ color: "var(--text-2)", fontSize: 14.5, lineHeight: 1.6, maxWidth: 520 }}>
              The first collection on Campfire. A crew born from the streets, each with their own story. Every boi has a soul. BOIS holders earn from every trade across the entire Campfire platform.
            </p>

            <div className="rw-info-4" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0, marginTop: 8, border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "14px 16px", borderRight: "1px solid var(--border)" }}>
                <div className="text-micro mono" style={{ marginBottom: 4 }}>STATUS</div>
                <div className="serif" style={{ fontSize: 17, color: "var(--accent)" }}>Coming soon</div>
              </div>
              <div style={{ padding: "14px 16px", borderRight: "1px solid var(--border)" }}>
                <div className="text-micro mono" style={{ marginBottom: 4 }}>ROYALTY</div>
                <div className="serif" style={{ fontSize: 17 }}>10%</div>
              </div>
              <div style={{ padding: "14px 16px" }}>
                <div className="text-micro mono" style={{ marginBottom: 4 }}>STAKERS EARN</div>
                <div className="serif" style={{ fontSize: 17, color: "var(--accent)" }}>100%</div>
              </div>
            </div>

            <div className="hstack" style={{ marginTop: 10, gap: 10 }}>
              <Link href="/launchpad/bois" className="btn-primary">Mint BOIS</Link>
              <Link href="https://x.com/boisxyz" target="_blank" className="btn-ghost">Follow BOIS</Link>
            </div>
          </div>
        </div>
      </section>

      {/* LAUNCHPAD - BOIS + COMING SOON */}
      <section style={{ padding: "56px 0" }}>
        <div className="hstack" style={{ marginBottom: 20 }}>
          <div className="eyebrow">Launchpad</div>
          <div className="spacer" />
          <span className="pill upcoming">Coming Soon</span>
        </div>

        {/* BOIS as first drop */}
        <Link href="/launchpad/bois" className="card" style={{ padding: 0, display: "grid", gridTemplateColumns: "auto 1fr", gap: 0, textDecoration: "none", color: "inherit", marginBottom: 16, cursor: "pointer" }}>
          <div style={{ width: 120, height: 120, overflow: "hidden", borderRadius: "14px 0 0 14px" }}>
            <img src="/sneak1.png" alt="BOIS" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 6 }}>
            <div className="hstack" style={{ gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 16 }}>BOIS</span>
              <span className="text-accent" style={{ fontSize: 13 }}>&#10003;</span>
              <div className="spacer" />
              <span className="pill upcoming">Mint not started</span>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>
              1,000 supply. 10% royalty, all to stakers. 50% of Campfire revenue to BOIS holders.
            </p>
            <div className="hstack" style={{ gap: 16, fontSize: 12 }}>
              <span><span className="mono" style={{ color: "var(--text)" }}>1,000</span> <span style={{ color: "var(--text-3)" }}>supply</span></span>
              <span><span className="mono text-accent">100%</span> <span style={{ color: "var(--text-3)" }}>to stakers</span></span>
            </div>
          </div>
        </Link>

        {/* More collections coming */}
        <div className="card pad-lg" style={{ textAlign: "center", padding: "40px 40px" }}>
          <div className="serif" style={{ fontSize: 22, letterSpacing: "-0.01em", marginBottom: 8 }}>
            More collections coming.
          </div>
          <p style={{ color: "var(--text-2)", fontSize: 14, lineHeight: 1.6, maxWidth: 420, margin: "0 auto" }}>
            Campfire is curated. Apply to launch your collection with built-in royalty sharing.
          </p>
          <div className="hstack" style={{ justifyContent: "center", marginTop: 18, gap: 10 }}>
            <Link href="https://x.com/" target="_blank" className="btn-primary">Apply for launch</Link>
            <Link href="/docs" className="btn-ghost">Read the docs</Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ paddingBottom: 60 }}>
        <div className="eyebrow">How it works</div>
        <h3 className="h2 serif" style={{ fontWeight: 400, marginTop: 6, marginBottom: 28 }}>Built for holders.</h3>
        <div className="rw-steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {[
            { n: "01", t: "Apply", d: "Submit your collection for review. We curate every project that launches on Campfire." },
            { n: "02", t: "Build", d: "Use the Art Studio to mix your traits and generate unique NFTs. Download your art, ready to go." },
            { n: "03", t: "Launch", d: "Approved collections go live with the royalty-share vault built in from day one." },
            { n: "04", t: "Earn", d: "Holders stake their NFTs. Every secondary trade generates royalties that flow to stakers." },
          ].map((s) => (
            <div key={s.n} className="card pad" style={{ padding: 22 }}>
              <div className="mono" style={{ fontSize: 11, color: "var(--accent)", letterSpacing: "0.1em" }}>{s.n}</div>
              <div style={{ fontWeight: 600, marginTop: 16, fontSize: 15 }}>{s.t}</div>
              <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 8, lineHeight: 1.6 }}>{s.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ART STUDIO PROMO */}
      <section style={{ paddingBottom: 60 }}>
        <div className="card rw-feature-grid" style={{ padding: 0, display: "grid", gridTemplateColumns: "1.1fr 1fr" }}>
          <div style={{ padding: 36 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[1, 2, 3, 4].map((n) => (
                <div key={n} style={{ borderRadius: 10, overflow: "hidden" }}>
                  <img src={`/sneak${n}.png`} alt="" style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", display: "block" }} />
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding: "36px 36px 36px 12px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 14 }}>
            <div className="eyebrow">Art Studio</div>
            <h2 className="h1 serif" style={{ fontWeight: 400 }}>Mix your art. Download your collection.</h2>
            <p style={{ color: "var(--text-2)", fontSize: 14.5, lineHeight: 1.6, maxWidth: 420 }}>
              Upload trait layers, set rarity weights, and generate thousands of unique NFTs. Every piece gets a unique DNA hash. Download when you're done.
            </p>
            <div className="hstack" style={{ marginTop: 10, gap: 10 }}>
              <Link href="/studio" className="btn-primary">Open Studio</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
