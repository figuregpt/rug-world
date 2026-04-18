"use client";

import { useState } from "react";

/* ── Icons ── */
function I({ name, size = 16 }: { name: string; size?: number }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "layers": return <svg {...p}><path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5M3 18l9 5 9-5"/></svg>;
    case "image": return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 16l-5-5-8 8"/></svg>;
    case "plus": return <svg {...p}><path d="M12 5v14M5 12h14"/></svg>;
    case "upload": return <svg {...p}><path d="M12 16V4M6 10l6-6 6 6M4 20h16"/></svg>;
    case "download": return <svg {...p}><path d="M12 4v12M6 10l6 6 6-6M4 20h16"/></svg>;
    case "sparkle": return <svg {...p}><path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/></svg>;
    case "settings": return <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>;
    case "palette": return <svg {...p}><path d="M12 3a9 9 0 1 0 0 18 3 3 0 0 0 0-6h-1a3 3 0 0 1 0-6h3a6 6 0 0 0-2-6z"/><circle cx="7.5" cy="10.5" r="1"/><circle cx="12" cy="7.5" r="1"/><circle cx="16.5" cy="10.5" r="1"/></svg>;
    case "rocket": return <svg {...p}><path d="M14 4c4 0 6 2 6 6l-8 8-3-3 8-8c-4 0-6-2-6-3z"/><path d="M7 14l-3 3 3 3 3-3"/><circle cx="15" cy="9" r="1.2"/></svg>;
    case "arrow-right": return <svg {...p}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
    case "clock": return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    case "check": return <svg {...p}><path d="M4 12l5 5 11-12"/></svg>;
    default: return null;
  }
}

function RugTile({ v = 1, glyph }: { v?: number; glyph?: string }) {
  return <div className={`rug-tile ${v > 1 ? `v${v}` : ""}`}>{glyph && <span className="glyph">{glyph}</span>}</div>;
}

/* ── Studio page ── */
export default function StudioPage() {
  const [layers] = useState([
    { name: "Background", traits: [{ n: "Indigo", w: 40 }, { n: "Rust", w: 30 }, { n: "Oat", w: 30 }] },
    { name: "Field", traits: [{ n: "Serpent", w: 20 }, { n: "Lattice", w: 35 }, { n: "Plain", w: 45 }] },
    { name: "Border", traits: [{ n: "Meander", w: 25 }, { n: "Key", w: 30 }, { n: "Scroll", w: 45 }] },
    { name: "Medallion", traits: [{ n: "Double star", w: 15 }, { n: "Quatrefoil", w: 35 }, { n: "Sunburst", w: 50 }] },
    { name: "Corners", traits: [{ n: "Tulip", w: 20 }, { n: "Knot", w: 30 }, { n: "None", w: 50 }] },
    { name: "Fringe", traits: [{ n: "Gilded", w: 15 }, { n: "Plain", w: 85 }] },
  ]);
  const [selected, setSelected] = useState(0);
  const [supply, setSupply] = useState(5000);
  const total = layers.reduce((a, l) => a * l.traits.length, 1);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "320px 1fr 320px", height: "100%" }}>
      {/* Left: Layers */}
      <aside style={{ borderRight: "1px solid var(--border)", overflowY: "auto", padding: "22px 18px" }}>
        <div className="hstack" style={{ marginBottom: 14 }}>
          <I name="layers" size={16} />
          <span style={{ fontWeight: 600, fontSize: 14 }}>Layers</span>
          <div className="spacer" />
          <button className="icon-btn" style={{ width: 28, height: 28 }}><I name="plus" size={13} /></button>
        </div>

        {layers.map((l, i) => (
          <div key={l.name} style={{ marginBottom: 6 }}>
            <button className={`nav-item ${selected === i ? "active" : ""}`} onClick={() => setSelected(i)} style={{ padding: "8px 10px" }}>
              <I name="image" size={14} />
              <span>{l.name}</span>
              <span className="badge">{l.traits.length}</span>
            </button>
            {selected === i && (
              <div style={{ marginLeft: 18, marginTop: 6, paddingLeft: 10, borderLeft: "1px solid var(--border)" }}>
                {l.traits.map((t, j) => (
                  <div key={j} className="hstack" style={{ padding: "6px 8px", fontSize: 12, color: "var(--text-2)" }}>
                    <span style={{ flex: 1 }}>{t.n}</span>
                    <span className="mono" style={{ color: "var(--text-3)" }}>{t.w}%</span>
                  </div>
                ))}
                <button className="chip-btn ghost" style={{ marginTop: 6, width: "100%", justifyContent: "center", height: 30, fontSize: 12 }}>
                  <I name="upload" size={12} />Add traits
                </button>
              </div>
            )}
          </div>
        ))}

        <div className="divider" />

        <div className="card pad" style={{ padding: 14 }}>
          <div className="text-micro mono">MAX COMBINATIONS</div>
          <div className="serif" style={{ fontSize: 24, marginTop: 6 }}>{total.toLocaleString()}</div>
          <div className="text-micro" style={{ marginTop: 4 }}>from {layers.reduce((a, l) => a + l.traits.length, 0)} traits across {layers.length} layers</div>
        </div>
      </aside>

      {/* Center: Preview canvas */}
      <div style={{ overflowY: "auto", background: "var(--bg-elev)", padding: 28 }}>
        <div className="hstack" style={{ marginBottom: 16 }}>
          <div className="eyebrow">Preview grid</div>
          <div className="spacer" />
          <div className="hstack" style={{ gap: 6 }}>
            <button className="chip-btn"><I name="sparkle" size={14} />Regenerate</button>
            <button className="chip-btn ghost"><I name="download" size={14} />Export samples</button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 24 }}>
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="card" style={{ padding: 0, overflow: "hidden" }}>
              <RugTile v={(i % 6) + 1} glyph={i < 4 ? String.fromCharCode(65 + i) : undefined} />
              <div style={{ padding: "8px 10px" }}>
                <div className="mono" style={{ fontSize: 10, color: "var(--text-3)" }}>#{String(i + 1).padStart(4, "0")}</div>
                <div className="mono" style={{ fontSize: 11, color: "var(--text-2)", marginTop: 2 }}>rarity {(Math.random() * 20 + 2).toFixed(1)}%</div>
              </div>
            </div>
          ))}
        </div>

        <button className="chip-btn ghost" style={{ width: "100%", justifyContent: "center", height: 42 }}>Load 16 more</button>
      </div>

      {/* Right: Generation settings */}
      <aside style={{ borderLeft: "1px solid var(--border)", overflowY: "auto", padding: "22px 18px" }}>
        <div className="hstack" style={{ marginBottom: 14 }}>
          <I name="settings" size={15} />
          <span style={{ fontWeight: 600, fontSize: 14 }}>Generation</span>
        </div>

        <div style={{ fontSize: 12, color: "var(--text-2)" }}>Collection size</div>
        <div className="serif" style={{ fontSize: 32, margin: "6px 0 4px" }}>{supply.toLocaleString()}</div>
        <input type="range" min={100} max={10000} step={100} value={supply} onChange={(e) => setSupply(+e.target.value)} style={{ width: "100%", accentColor: "var(--accent)" }} />
        <div className="hstack" style={{ justifyContent: "space-between", fontSize: 11, color: "var(--text-3)" }}>
          <span className="mono">100</span><span className="mono">10,000</span>
        </div>

        <div className="divider" />

        <div style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 8 }}>DNA uniqueness</div>
        <label className="filter-check"><input type="checkbox" defaultChecked />No duplicate combinations</label>
        <label className="filter-check"><input type="checkbox" />Enforce rarity floors</label>
        <label className="filter-check"><input type="checkbox" defaultChecked />Exclude incompatible pairs</label>

        <div className="divider" />

        <div style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 8 }}>One-of-ones</div>
        <div className="card pad" style={{ padding: 12 }}>
          <div className="hstack">
            <div>
              <div className="serif" style={{ fontSize: 18 }}>3 of 5</div>
              <div className="text-micro">reserved slots</div>
            </div>
            <div className="spacer" />
            <button className="chip-btn"><I name="plus" size={13} />Add</button>
          </div>
        </div>

        <div className="divider" />

        <div className="card pad" style={{ padding: 14, background: "var(--accent-soft)", border: "1px solid var(--accent-line)" }}>
          <div className="hstack" style={{ gap: 8, marginBottom: 6 }}>
            <I name="sparkle" size={14} />
            <span style={{ fontWeight: 600, fontSize: 13 }}>Ready to generate</span>
          </div>
          <div className="text-micro" style={{ marginBottom: 10 }}>Estimated time: 42s. Upload: ~0.18 SOL</div>
          <button className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
            <I name="sparkle" size={14} />Generate {supply.toLocaleString()} NFTs
          </button>
        </div>
      </aside>
    </div>
  );
}
