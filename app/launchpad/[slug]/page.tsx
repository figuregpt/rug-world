"use client";

import { useState, use } from "react";
import Link from "next/link";

/* ── Icons ── */
function I({ name, size = 16 }: { name: string; size?: number }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "chevron-right": return <svg {...p}><path d="M9 6l6 6-6 6"/></svg>;
    case "verified": return <svg {...p}><path d="M12 2l2 2 3-1 1 3 3 1-1 3 2 2-2 2 1 3-3 1-1 3-3-1-2 2-2-2-3 1-1-3-3-1 1-3-2-2 2-2-1-3 3-1 1-3 3 1z"/><path d="M8 12l3 3 5-6" strokeWidth={1.8}/></svg>;
    case "sparkle": return <svg {...p}><path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/></svg>;
    case "shield": return <svg {...p}><path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6l8-3z"/></svg>;
    case "plus": return <svg {...p}><path d="M12 5v14M5 12h14"/></svg>;
    case "x": return <svg {...p}><path d="M6 6l12 12M18 6L6 18"/></svg>;
    case "twitter": return <svg {...p}><path d="M4 4l7.5 10L4 20h3l6-6 4 6h4l-7.5-10L20 4h-3l-5 5-3.5-5z" fill="currentColor" stroke="none"/></svg>;
    case "discord": return <svg {...p}><path d="M8 7a12 12 0 0 1 8 0M7 10c-1 2-1 5 0 9 1 1 3 1 4 0M17 10c1 2 1 5 0 9-1 1-3 1-4 0"/><circle cx="9.5" cy="13.5" r="1"/><circle cx="14.5" cy="13.5" r="1"/></svg>;
    case "external": return <svg {...p}><path d="M14 4h6v6M20 4L10 14M18 14v6H4V6h6"/></svg>;
    case "copy": return <svg {...p}><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>;
    default: return null;
  }
}

function RugTile({ v = 1, glyph }: { v?: number; glyph?: string }) {
  return <div className={`rug-tile ${v > 1 ? `v${v}` : ""}`}>{glyph && <span className="glyph">{glyph}</span>}</div>;
}

function Avatar({ seed = "x", size = 22 }: { seed?: string; size?: number }) {
  const hue = (seed.charCodeAt(0) * 37) % 360;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `hsl(${hue} 40% 50%)`, display: "grid", placeItems: "center", color: "#fff", fontSize: size * 0.42, fontWeight: 700, flexShrink: 0 }}>
      {seed[0]?.toUpperCase()}
    </div>
  );
}

/* ── Mock data ── */
const MOCK: Record<string, { id: string; name: string; creator: string; status: string; supply: number; minted: number; price: number; floor: number; vol24: number; chg: number; stakers: number; royalty: number; share: number; v: number; verified: boolean }> = {
  "ottoman-echoes": { id: "ottoman-echoes", name: "Ottoman Echoes", creator: "atelier.sol", status: "Live", supply: 5000, minted: 3247, price: 0.5, floor: 0.68, vol24: 142.3, chg: 12.4, stakers: 1843, royalty: 10, share: 80, v: 1, verified: true },
  "kilim-society": { id: "kilim-society", name: "Kilim Society", creator: "nomad.dao", status: "Live", supply: 3333, minted: 2901, price: 0.8, floor: 1.21, vol24: 98.7, chg: -3.1, stakers: 1207, royalty: 10, share: 75, v: 2, verified: true },
  "anatolia-gen": { id: "anatolia-gen", name: "Anatolia Genesis", creator: "loom.labs", status: "Live", supply: 2222, minted: 1456, price: 1.2, floor: 1.55, vol24: 76.2, chg: 22.0, stakers: 812, royalty: 12, share: 90, v: 3, verified: true },
  "thread-count": { id: "thread-count", name: "Thread Count", creator: "warp.studio", status: "Live", supply: 7500, minted: 6210, price: 0.25, floor: 0.31, vol24: 54.1, chg: 4.2, stakers: 2112, royalty: 8, share: 70, v: 4, verified: false },
  "dye-room": { id: "dye-room", name: "The Dye Room", creator: "indigo.art", status: "Live", supply: 1000, minted: 994, price: 2.5, floor: 3.40, vol24: 210.0, chg: 38.5, stakers: 620, royalty: 15, share: 85, v: 5, verified: true },
  "serpent-garden": { id: "serpent-garden", name: "Serpent Garden", creator: "sultan.eth", status: "Live", supply: 4000, minted: 1820, price: 0.6, floor: 0.72, vol24: 33.4, chg: -8.2, stakers: 441, royalty: 10, share: 80, v: 6, verified: false },
  "caravan": { id: "caravan", name: "Caravan", creator: "silkroad.sol", status: "Ended", supply: 2000, minted: 2000, price: 0.7, floor: 1.08, vol24: 12.3, chg: 1.1, stakers: 1450, royalty: 10, share: 80, v: 5, verified: true },
  "turkish-delight": { id: "turkish-delight", name: "Turkish Delight", creator: "bazaar.sol", status: "Ended", supply: 5555, minted: 5555, price: 0.3, floor: 0.44, vol24: 8.7, chg: -0.8, stakers: 3200, royalty: 10, share: 80, v: 6, verified: false },
  "warp-weft": { id: "warp-weft", name: "Warp & Weft", creator: "loom.labs", status: "Ended", supply: 1500, minted: 1500, price: 1.0, floor: 1.88, vol24: 44.2, chg: 9.4, stakers: 900, royalty: 10, share: 85, v: 1, verified: true },
};

function RoyaltyDonut({ share }: { share: number }) {
  const size = 120, stroke = 18, r = (size - stroke) / 2, cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const a = (circ * share) / 100;
  return (
    <svg width={size} height={size}>
      <g transform={`rotate(-90 ${cx} ${cy})`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface)" strokeWidth={stroke} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--accent)" strokeWidth={stroke} strokeDasharray={`${a} ${circ - a}`} />
      </g>
      <text x={cx} y={cy - 2} textAnchor="middle" fill="var(--text)" fontFamily="Fraunces" fontSize="20" fontWeight="500">{share}%</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="var(--text-3)" fontFamily="JetBrains Mono" fontSize="9">TO STAKERS</text>
    </svg>
  );
}

function Split({ color, label, pct, amount, last }: { color: string; label: string; pct: number; amount: string; last?: boolean }) {
  return (
    <div style={{ padding: "10px 0", borderBottom: last ? "none" : "1px solid var(--border)" }}>
      <div className="hstack" style={{ gap: 10 }}>
        <span style={{ width: 10, height: 10, background: color, borderRadius: 2 }} />
        <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
        <div className="spacer" />
        <span className="mono" style={{ fontSize: 12 }}>{pct}%</span>
      </div>
      <div className="mono" style={{ fontSize: 11, color: "var(--text-3)", marginLeft: 20, marginTop: 2 }}>{amount}% of sale</div>
    </div>
  );
}

export default function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const c = MOCK[slug] || Object.values(MOCK)[0];
  const [qty, setQty] = useState(1);
  const pct = c.supply ? (c.minted / c.supply) * 100 : 0;

  return (
    <div className="page-content">
      {/* Breadcrumb */}
      <div className="hstack" style={{ marginBottom: 22, fontSize: 13, color: "var(--text-2)" }}>
        <Link href="/launchpad" style={{ background: "none", border: "none", color: "var(--text-2)", cursor: "pointer", fontSize: 13, textDecoration: "none" }}>Launchpad</Link>
        <I name="chevron-right" size={13} />
        <span style={{ color: "var(--text)" }}>{c.name}</span>
      </div>

      <div className="rw-detail-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "start" }}>
        {/* Left: gallery */}
        <div>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <RugTile v={c.v} glyph={c.name[0]} />
          </div>
          <div className="rw-gallery-thumbs" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 8 }}>
            {[2, 3, 4, 5].map((v) => (
              <div key={v} className="card" style={{ padding: 0, overflow: "hidden", cursor: "pointer" }}>
                <RugTile v={v} />
              </div>
            ))}
          </div>
        </div>

        {/* Right: info */}
        <div>
          <div className="hstack" style={{ gap: 10, marginBottom: 10 }}>
            <Avatar seed={c.creator} size={28} />
            <span style={{ fontSize: 13, color: "var(--text-2)" }}>{c.creator}</span>
            {c.verified && <I name="verified" size={14} />}
            <div className="spacer" />
            {c.status === "Live" ? <span className="pill live">Minting now</span> : c.status === "Ended" ? <span className="pill ended">Sold out</span> : <span className="pill upcoming">Upcoming</span>}
          </div>
          <h1 className="h-display" style={{ fontSize: 56 }}>{c.name}</h1>
          <p style={{ marginTop: 18, color: "var(--text-2)", fontSize: 15, lineHeight: 1.65 }}>
            {c.supply.toLocaleString()} hand-traited pieces on Solana, with {c.share}% of every secondary royalty flowing into the {c.name} staker vault.
          </p>

          {/* Info grid */}
          <div className="rw-info-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, border: "1px solid var(--border)", borderRadius: 12, marginTop: 24, overflow: "hidden" }}>
            {[
              { label: "PRICE", value: `◎ ${c.price}` },
              { label: "FLOOR", value: c.floor ? `◎ ${c.floor}` : "---" },
              { label: "24H VOL", value: `◎ ${c.vol24.toFixed(1)}`, delta: `${c.chg > 0 ? "+" : ""}${c.chg}%`, deltaDown: c.chg < 0 },
              { label: "STAKERS", value: c.stakers.toLocaleString(), last: true },
            ].map((cell) => (
              <div key={cell.label} style={{ padding: "18px 20px", borderRight: cell.last ? "none" : "1px solid var(--border)" }}>
                <div className="text-micro mono">{cell.label}</div>
                <div className="serif" style={{ fontSize: 22, marginTop: 6, letterSpacing: "-0.015em" }}>{cell.value}</div>
                {cell.delta && <div className="mono" style={{ fontSize: 11, marginTop: 4, color: cell.deltaDown ? "var(--accent)" : "var(--success)" }}>{cell.delta}</div>}
              </div>
            ))}
          </div>

          {/* Mint widget */}
          <div className="card pad-lg" style={{ marginTop: 20 }}>
            <div className="hstack" style={{ justifyContent: "space-between" }}>
              <div className="eyebrow">{c.status === "Ended" ? "Mint closed" : "Mint"}</div>
              <div className="mono text-micro">{c.status === "Ended" ? "Phase: Secondary" : "Phase: Public"}</div>
            </div>
            <div style={{ marginTop: 12, marginBottom: 10 }}>
              <div className="progress"><span style={{ width: `${pct}%` }} /></div>
              <div className="hstack" style={{ justifyContent: "space-between", marginTop: 8 }}>
                <span className="mono" style={{ fontSize: 12 }}>{c.minted.toLocaleString()} / {c.supply.toLocaleString()} minted</span>
                <span className="mono text-accent" style={{ fontSize: 12 }}>{pct.toFixed(1)}%</span>
              </div>
            </div>

            {c.status === "Ended" ? (
              <div style={{ marginTop: 20 }}>
                <div style={{ padding: "22px 20px", borderRadius: 12, background: "var(--surface)", border: "1px dashed var(--border)", textAlign: "center" }}>
                  <div className="serif" style={{ fontSize: 22, letterSpacing: "-0.01em" }}>Sold out</div>
                  <div className="mono" style={{ fontSize: 11, color: "var(--text-3)", marginTop: 6, letterSpacing: "0.04em" }}>
                    ALL {c.supply.toLocaleString()} PIECES MINTED
                  </div>
                </div>
                <div className="hstack" style={{ gap: 10, marginTop: 12 }}>
                  <button className="btn-primary lg" style={{ flex: 1 }}>
                    <I name="sparkle" size={14} />Buy on secondary · floor ◎ {c.floor}
                  </button>
                </div>
              </div>
            ) : (
              <div className="hstack" style={{ gap: 10, marginTop: 20 }}>
                <div className="hstack" style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 2 }}>
                  <button className="icon-btn" style={{ border: "none", background: "transparent", width: 36, height: 36 }} onClick={() => setQty(Math.max(1, qty - 1))}>
                    <I name="x" size={12} />
                  </button>
                  <div className="mono" style={{ minWidth: 42, textAlign: "center" }}>{qty}</div>
                  <button className="icon-btn" style={{ border: "none", background: "transparent", width: 36, height: 36 }} onClick={() => setQty(Math.min(10, qty + 1))}>
                    <I name="plus" size={12} />
                  </button>
                </div>
                <button className="btn-primary lg" style={{ flex: 1 }}>
                  <I name="sparkle" size={14} />Mint {qty} for ◎ {(c.price * qty).toFixed(2)}
                </button>
              </div>
            )}

            <div style={{ marginTop: 16, padding: 14, borderRadius: 10, background: "var(--surface)", fontSize: 12, color: "var(--text-2)", lineHeight: 1.6 }}>
              <div className="hstack" style={{ gap: 8, marginBottom: 6 }}>
                <I name="shield" size={13} />
                <span style={{ fontWeight: 600, color: "var(--text)" }}>Royalty share guarantee</span>
              </div>
              {c.share}% of every secondary royalty routes to stakers. Unstake any time, unclaimed rewards stay yours.
            </div>
          </div>

          {/* Social links */}
          <div className="hstack" style={{ marginTop: 20, gap: 10, flexWrap: "wrap" }}>
            <button className="chip-btn ghost"><I name="twitter" size={14} />Twitter</button>
            <button className="chip-btn ghost"><I name="discord" size={14} />Discord</button>
            <button className="chip-btn ghost"><I name="external" size={14} />Explorer</button>
            <button className="chip-btn ghost"><I name="copy" size={14} />Gx4v...2p9L</button>
          </div>
        </div>
      </div>

      {/* Royalty info */}
      <div style={{ marginTop: 48 }}>
        <div className="card pad-lg">
          <div className="eyebrow">Royalty split</div>
          <h3 className="h2 serif" style={{ fontWeight: 400, marginTop: 8, marginBottom: 22 }}>{c.royalty}% on every trade</h3>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 36, alignItems: "center" }}>
            <RoyaltyDonut share={c.share} />
            <div>
              <Split color="var(--accent)" label="Stakers" pct={c.share} amount={(c.royalty * c.share / 100).toFixed(1)} />
              <Split color="var(--text-2)" label="Creator" pct={100 - c.share - 2} amount={(c.royalty * (100 - c.share - 2) / 100).toFixed(1)} />
              <Split color="var(--text-3)" label="Campfire" pct={2} amount={(c.royalty * 0.02).toFixed(2)} last />
            </div>
          </div>
          <div style={{ marginTop: 22, padding: 14, background: "var(--surface)", borderRadius: 10, fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.6 }}>
            A trade at the current floor (◎ {c.floor || c.price}) pays ◎ {((c.floor || c.price) * c.royalty / 100).toFixed(3)} in royalty.
            Stakers collectively earn ◎ {((c.floor || c.price) * c.royalty / 100 * c.share / 100).toFixed(3)} per sale.
          </div>
        </div>
      </div>

      {/* Project description */}
      <div className="rw-desc-grid" style={{ marginTop: 56, display: "grid", gridTemplateColumns: "1fr 2fr", gap: 48, paddingTop: 48, borderTop: "1px solid var(--border)" }}>
        <div>
          <div className="eyebrow">About the project</div>
          <h3 className="h2 serif" style={{ fontWeight: 400, marginTop: 10, fontSize: 32, lineHeight: 1.15 }}>
            A living archive of {c.name.toLowerCase()}, reimagined on-chain.
          </h3>
          <div className="hstack" style={{ gap: 10, marginTop: 20, flexWrap: "wrap" }}>
            {["GENERATIVE", "SOLANA", "ROYALTY-SHARED"].map((tag) => (
              <div key={tag} style={{ padding: "6px 12px", border: "1px solid var(--border)", borderRadius: 999, fontSize: 11, fontFamily: "JetBrains Mono", color: "var(--text-2)", letterSpacing: "0.04em" }}>{tag}</div>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gap: 18, fontSize: 15, lineHeight: 1.75, color: "var(--text-2)" }}>
          <p>
            {c.name} is a collection of {c.supply.toLocaleString()} generative pieces that translate centuries of woven tradition into an on-chain archive. Every rug is assembled from a library of motifs, rendered as a single deterministic artwork minted directly on Solana.
          </p>
          <p>
            The collection is the flagship drop from <strong style={{ color: "var(--text)" }}>{c.creator}</strong>, built in partnership with Campfire. {c.royalty}% of every secondary trade is redistributed, with <strong className="text-accent">{c.share}%</strong> flowing back to holders who stake their piece into the collection vault.
          </p>
          <p>
            Staking is non-custodial and reversible at any time. A staked piece continues to live in the holder's wallet; the pool simply indexes it as an eligible receiver of pro-rata royalty flow. Rewards accrue continuously and can be claimed or compounded.
          </p>
        </div>
      </div>
    </div>
  );
}
