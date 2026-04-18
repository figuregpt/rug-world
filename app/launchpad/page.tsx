"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/* ── Mock data from design spec (same as home) ── */
const MOCK = [
  { id: "ottoman-echoes", name: "Ottoman Echoes", creator: "atelier.sol", status: "Live", supply: 5000, minted: 3247, price: 0.5, floor: 0.68, vol24: 142.3, chg: 12.4, stakers: 1843, share: 80, v: 1, verified: true },
  { id: "kilim-society", name: "Kilim Society", creator: "nomad.dao", status: "Live", supply: 3333, minted: 2901, price: 0.8, floor: 1.21, vol24: 98.7, chg: -3.1, stakers: 1207, share: 75, v: 2, verified: true },
  { id: "anatolia-gen", name: "Anatolia Genesis", creator: "loom.labs", status: "Live", supply: 2222, minted: 1456, price: 1.2, floor: 1.55, vol24: 76.2, chg: 22.0, stakers: 812, share: 90, v: 3, verified: true },
  { id: "thread-count", name: "Thread Count", creator: "warp.studio", status: "Live", supply: 7500, minted: 6210, price: 0.25, floor: 0.31, vol24: 54.1, chg: 4.2, stakers: 2112, share: 70, v: 4, verified: false },
  { id: "dye-room", name: "The Dye Room", creator: "indigo.art", status: "Live", supply: 1000, minted: 994, price: 2.5, floor: 3.40, vol24: 210.0, chg: 38.5, stakers: 620, share: 85, v: 5, verified: true },
  { id: "serpent-garden", name: "Serpent Garden", creator: "sultan.eth", status: "Live", supply: 4000, minted: 1820, price: 0.6, floor: 0.72, vol24: 33.4, chg: -8.2, stakers: 441, share: 80, v: 6, verified: false },
  { id: "medallion-v2", name: "Medallion Vol. II", creator: "atelier.sol", status: "Upcoming", supply: 3000, minted: 0, price: 0.9, floor: 0, vol24: 0, chg: 0, stakers: 0, share: 80, v: 2, verified: true },
  { id: "prayer-rug", name: "Prayer Rug", creator: "minbar.dao", status: "Upcoming", supply: 1111, minted: 0, price: 1.5, floor: 0, vol24: 0, chg: 0, stakers: 0, share: 100, v: 3, verified: true },
  { id: "flatweave", name: "Flatweave", creator: "warp.studio", status: "Upcoming", supply: 2500, minted: 0, price: 0.4, floor: 0, vol24: 0, chg: 0, stakers: 0, share: 70, v: 4, verified: false },
  { id: "caravan", name: "Caravan", creator: "silkroad.sol", status: "Ended", supply: 2000, minted: 2000, price: 0.7, floor: 1.08, vol24: 12.3, chg: 1.1, stakers: 1450, share: 80, v: 5, verified: true },
  { id: "turkish-delight", name: "Turkish Delight", creator: "bazaar.sol", status: "Ended", supply: 5555, minted: 5555, price: 0.3, floor: 0.44, vol24: 8.7, chg: -0.8, stakers: 3200, share: 80, v: 6, verified: false },
  { id: "warp-weft", name: "Warp & Weft", creator: "loom.labs", status: "Ended", supply: 1500, minted: 1500, price: 1.0, floor: 1.88, vol24: 44.2, chg: 9.4, stakers: 900, share: 85, v: 1, verified: true },
];

type Col = typeof MOCK[0];
type Tab = "Live" | "Upcoming" | "Ended";

function RugTile({ v = 1, glyph }: { v?: number; glyph?: string }) {
  return (
    <div className={`rug-tile ${v > 1 ? `v${v}` : ""}`}>
      {glyph && <span className="glyph">{glyph}</span>}
    </div>
  );
}

function CollectionCard({ c }: { c: Col }) {
  const pct = c.supply > 0 ? Math.round((c.minted / c.supply) * 100) : 0;
  return (
    <Link href={`/launchpad/${c.id}`} className="card" style={{ padding: 0, cursor: "pointer", textDecoration: "none", color: "inherit" }}>
      <RugTile v={c.v} glyph={c.name[0]} />
      <div style={{ padding: 14 }}>
        <div className="hstack" style={{ gap: 6, marginBottom: 4 }}>
          <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>{c.name}</div>
          {c.verified && <span className="text-accent" style={{ fontSize: 12 }}>&#10003;</span>}
        </div>
        <div className="hstack" style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 10 }}>
          <span>{c.creator}</span>
          <div className="spacer" />
          {c.status === "Live" && <span className="pill live">Live</span>}
          {c.status === "Upcoming" && <span className="pill upcoming">Soon</span>}
          {c.status === "Ended" && <span className="pill ended">Ended</span>}
        </div>
        <div className="hstack" style={{ justifyContent: "space-between", fontSize: 12, marginBottom: 8 }}>
          <span style={{ color: "var(--text-3)" }}>Floor</span>
          <span className="mono">{c.floor ? `◎ ${c.floor}` : "---"}</span>
        </div>
        <div className="hstack" style={{ justifyContent: "space-between", fontSize: 12, marginBottom: 8 }}>
          <span style={{ color: "var(--text-3)" }}>24h vol</span>
          <span className="mono">
            {c.vol24 ? `◎ ${c.vol24.toFixed(1)}` : "---"}
            {c.chg !== 0 && <span style={{ marginLeft: 6, color: c.chg > 0 ? "var(--success)" : "var(--accent)", fontSize: 11 }}>{c.chg > 0 ? "+" : ""}{c.chg}%</span>}
          </span>
        </div>
        {c.status === "Ended" ? (
          <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--text-3)" }} />
            <span className="mono" style={{ fontSize: 11, color: "var(--text-2)", letterSpacing: "0.04em" }}>SOLD OUT</span>
          </div>
        ) : (
          <>
            <div className="progress" style={{ marginTop: 10 }}><span style={{ width: `${pct}%` }} /></div>
            <div className="hstack" style={{ justifyContent: "space-between", marginTop: 4 }}>
              <span className="mono" style={{ fontSize: 10, color: "var(--text-3)" }}>{c.minted.toLocaleString()}/{c.supply.toLocaleString()}</span>
              <span className="mono" style={{ fontSize: 10, color: "var(--accent)" }}>{c.share}% to stakers</span>
            </div>
          </>
        )}
      </div>
    </Link>
  );
}

/* ── Icons used on this page ── */
function SvgIcon({ name, size = 16 }: { name: string; size?: number }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "filter": return <svg {...p}><path d="M3 5h18M6 12h12M10 19h4"/></svg>;
    case "grid": return <svg {...p}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
    case "list": return <svg {...p}><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg>;
    case "sliders": return <svg {...p}><path d="M4 6h10M4 12h4M4 18h12"/><circle cx="17" cy="6" r="2"/><circle cx="11" cy="12" r="2"/><circle cx="19" cy="18" r="2"/></svg>;
    case "chevron-down": return <svg {...p}><path d="M6 9l6 6 6-6"/></svg>;
    case "chevron-right": return <svg {...p}><path d="M9 6l6 6-6 6"/></svg>;
    case "arrow-right": return <svg {...p}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
    case "verified": return <svg {...p}><path d="M12 2l2 2 3-1 1 3 3 1-1 3 2 2-2 2 1 3-3 1-1 3-3-1-2 2-2-2-3 1-1-3-3-1 1-3-2-2 2-2-1-3 3-1 1-3 3 1z"/><path d="M8 12l3 3 5-6" strokeWidth={1.8}/></svg>;
    default: return null;
  }
}

export default function LaunchpadPage() {
  const [tab, setTab] = useState<Tab>("Live");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const all = MOCK;
  const filtered = all.filter((c) => c.status === tab).filter((c) => !verifiedOnly || c.verified);
  const counts: Record<Tab, number> = {
    Live: all.filter((c) => c.status === "Live").length,
    Upcoming: all.filter((c) => c.status === "Upcoming").length,
    Ended: all.filter((c) => c.status === "Ended").length,
  };

  return (
    <div style={{ display: "flex", height: "100%" }}>
      {/* Filter rail */}
      <aside className="filter-rail">
        <div className="hstack" style={{ marginBottom: 12 }}>
          <SvgIcon name="filter" size={16} />
          <span style={{ fontWeight: 600, fontSize: 14 }}>Filters</span>
          <div className="spacer" />
          <button style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 12 }} onClick={() => setVerifiedOnly(false)}>Clear</button>
        </div>

        <div className="filter-group">
          <h4>Status</h4>
          {(["Minting now", "Upcoming", "Recently ended"] as const).map((s) => (
            <label key={s} className="filter-check">
              <input type="checkbox" defaultChecked={s === "Minting now"} />
              {s}
              <span className="count">{s === "Minting now" ? counts.Live : s === "Upcoming" ? counts.Upcoming : counts.Ended}</span>
            </label>
          ))}
        </div>

        <div className="filter-group">
          <h4>Royalty share to stakers</h4>
          <div className="hstack" style={{ justifyContent: "space-between", marginBottom: 10 }}>
            <span className="mono" style={{ fontSize: 12, color: "var(--accent)" }}>0%</span>
            <span className="mono" style={{ fontSize: 11, color: "var(--text-3)" }}>-</span>
            <span className="mono" style={{ fontSize: 12, color: "var(--accent)" }}>100%</span>
          </div>
          <input type="range" min={0} max={100} step={10} defaultValue={0} style={{ width: "100%", accentColor: "var(--accent)" }} />
        </div>

        <div className="filter-group">
          <h4>Price range · ◎ SOL</h4>
          <div className="hstack" style={{ gap: 6, marginTop: 6 }}>
            <input placeholder="Min" style={{ background: "transparent", fontSize: 12, height: 32, width: "100%", padding: "0 10px", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", outline: "none" }} />
            <span className="text-micro">-</span>
            <input placeholder="Max" style={{ background: "transparent", fontSize: 12, height: 32, width: "100%", padding: "0 10px", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", outline: "none" }} />
          </div>
        </div>

        <div className="filter-group">
          <label className="filter-check">
            <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} />
            Verified only
          </label>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div className="page-content" style={{ paddingTop: 28 }}>
          <div style={{ marginBottom: 8 }}>
            <div className="eyebrow">Launchpad</div>
            <h1 className="h1 serif" style={{ fontWeight: 400, marginTop: 8, fontSize: 44 }}>Discover curated drops</h1>
            <p className="text-muted" style={{ marginTop: 10, maxWidth: 560, lineHeight: 1.6, fontSize: 15 }}>
              Every collection on Rug.World inherits the royalty-share vault. Hold, stake, earn across every drop below.
            </p>
          </div>

          {/* Tabs + view toggle */}
          <div className="hstack rw-section-head" style={{ marginTop: 24, marginBottom: 18 }}>
            <div className="tabs">
              {(["Live", "Upcoming", "Ended"] as const).map((t) => (
                <button key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
                  {t === "Live" ? "Minting now" : t === "Ended" ? "Recently ended" : t}
                  <span className="tab-count">{counts[t]}</span>
                </button>
              ))}
            </div>
            <div className="spacer" />
            <div className="hstack" style={{ gap: 6 }}>
              <button className="icon-btn" onClick={() => setView("grid")} style={{ color: view === "grid" ? "var(--text)" : "var(--text-3)" }}>
                <SvgIcon name="grid" size={16} />
              </button>
              <button className="icon-btn" onClick={() => setView("list")} style={{ color: view === "list" ? "var(--text)" : "var(--text-3)" }}>
                <SvgIcon name="list" size={16} />
              </button>
              <button className="chip-btn ghost" style={{ marginLeft: 8 }}>
                <SvgIcon name="sliders" size={14} />Sort · Trending <SvgIcon name="chevron-down" size={14} />
              </button>
            </div>
          </div>

          {/* Grid or list */}
          {view === "grid" ? (
            <div className="grid-collections">
              {filtered.map((c) => <CollectionCard key={c.id} c={c} />)}
            </div>
          ) : (
            <div className="card" style={{ padding: 0 }}>
              <table className="rw-table">
                <thead>
                  <tr>
                    <th style={{ paddingLeft: 22 }}>#</th>
                    <th>Collection</th>
                    <th style={{ textAlign: "right" }}>Price</th>
                    <th style={{ textAlign: "right" }}>Floor</th>
                    <th style={{ textAlign: "right" }}>24h vol</th>
                    <th style={{ textAlign: "right" }}>24h %</th>
                    <th style={{ textAlign: "right" }}>Minted</th>
                    <th style={{ textAlign: "right" }}>Stakers</th>
                    <th style={{ textAlign: "right" }}>Share</th>
                    <th style={{ paddingRight: 22 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => (
                    <tr key={c.id} style={{ cursor: "pointer" }}>
                      <td style={{ paddingLeft: 22 }} className="mono text-micro">{String(i + 1).padStart(2, "0")}</td>
                      <td>
                        <div className="hstack" style={{ gap: 12 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
                            <RugTile v={c.v} glyph={c.name[0]} />
                          </div>
                          <div>
                            <div className="hstack" style={{ gap: 5 }}>
                              <span style={{ fontWeight: 600 }}>{c.name}</span>
                              {c.verified && <SvgIcon name="verified" size={12} />}
                            </div>
                            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{c.creator}</div>
                          </div>
                        </div>
                      </td>
                      <td className="mono" style={{ textAlign: "right" }}>◎ {c.price}</td>
                      <td className="mono" style={{ textAlign: "right" }}>{c.floor ? `◎ ${c.floor}` : "---"}</td>
                      <td className="mono" style={{ textAlign: "right" }}>◎ {c.vol24.toFixed(1)}</td>
                      <td className="mono" style={{ textAlign: "right", color: c.chg > 0 ? "var(--success)" : c.chg < 0 ? "var(--accent)" : "var(--text-3)" }}>
                        {c.chg > 0 ? "+" : ""}{c.chg}%
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end", gap: 4, minWidth: 90 }}>
                          <span className="mono" style={{ fontSize: 12 }}>{Math.round((c.minted / c.supply) * 100)}%</span>
                          <div className="progress" style={{ width: 80 }}><span style={{ width: `${(c.minted / c.supply) * 100}%` }} /></div>
                        </div>
                      </td>
                      <td className="mono" style={{ textAlign: "right" }}>{c.stakers.toLocaleString()}</td>
                      <td className="mono" style={{ textAlign: "right", color: "var(--accent)" }}>{c.share}%</td>
                      <td style={{ paddingRight: 22, textAlign: "right" }}><SvgIcon name="chevron-right" size={14} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
