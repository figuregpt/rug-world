"use client";

import { useState, useMemo, useEffect } from "react";

/* ── Shared icon helper ── */
function I({ name, size = 16 }: { name: string; size?: number }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "download": return <svg {...p}><path d="M12 4v12M6 10l6 6 6-6M4 20h16"/></svg>;
    case "verified": return <svg {...p}><path d="M12 2l2 2 3-1 1 3 3 1-1 3 2 2-2 2 1 3-3 1-1 3-3-1-2 2-2-2-3 1-1-3-3-1 1-3-2-2 2-2-1-3 3-1 1-3 3 1z"/><path d="M8 12l3 3 5-6" strokeWidth={1.8}/></svg>;
    case "external": return <svg {...p}><path d="M14 4h6v6M20 4L10 14M18 14v6H4V6h6"/></svg>;
    case "shield": return <svg {...p}><path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6l8-3z"/></svg>;
    case "arrow-right": return <svg {...p}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
    case "sparkle": return <svg {...p}><path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/></svg>;
    case "x": return <svg {...p}><path d="M6 6l12 12M18 6L6 18"/></svg>;
    default: return null;
  }
}

function RugTile({ v = 1, glyph }: { v?: number; glyph?: string }) {
  return <div className={`rug-tile ${v > 1 ? `v${v}` : ""}`}>{glyph && <span className="glyph">{glyph}</span>}</div>;
}

/* ── Mock data ── */
const COLLECTIONS = [
  { id: "ottoman-echoes", name: "Ottoman Echoes", creator: "atelier.sol", supply: 5000, minted: 3247, vol24: 142.3, chg: 12.4, stakers: 1843, royalty: 10, share: 80, v: 1, verified: true },
  { id: "kilim-society", name: "Kilim Society", creator: "nomad.dao", supply: 3333, minted: 2901, vol24: 98.7, chg: -3.1, stakers: 1207, royalty: 10, share: 75, v: 2, verified: true },
  { id: "anatolia-gen", name: "Anatolia Genesis", creator: "loom.labs", supply: 2222, minted: 1456, vol24: 76.2, chg: 22.0, stakers: 812, royalty: 12, share: 90, v: 3, verified: true },
  { id: "thread-count", name: "Thread Count", creator: "warp.studio", supply: 7500, minted: 6210, vol24: 54.1, chg: 4.2, stakers: 2112, royalty: 8, share: 70, v: 4, verified: false },
  { id: "dye-room", name: "The Dye Room", creator: "indigo.art", supply: 1000, minted: 994, vol24: 210.0, chg: 38.5, stakers: 620, royalty: 15, share: 85, v: 5, verified: true },
  { id: "serpent-garden", name: "Serpent Garden", creator: "sultan.eth", supply: 4000, minted: 1820, vol24: 33.4, chg: -8.2, stakers: 441, royalty: 10, share: 80, v: 6, verified: false },
  { id: "caravan", name: "Caravan", creator: "silkroad.sol", supply: 2000, minted: 2000, vol24: 12.3, chg: 1.1, stakers: 1450, royalty: 10, share: 80, v: 5, verified: true },
  { id: "warp-weft", name: "Warp & Weft", creator: "loom.labs", supply: 1500, minted: 1500, vol24: 44.2, chg: 9.4, stakers: 900, royalty: 10, share: 85, v: 1, verified: true },
];

type Col = typeof COLLECTIONS[0];

const MY_POSITIONS = [
  { col: COLLECTIONS[0], staked: 3, earned: 0.412, apy: 18.4 },
  { col: COLLECTIONS[2], staked: 1, earned: 0.087, apy: 22.1 },
  { col: COLLECTIONS[4], staked: 2, earned: 1.204, apy: 31.6 },
];

const CLAIM_HISTORY = [
  { d: "Apr 16, 2026", col: "Kilim Society", tx: "3Kp9...8vBr", amt: 0.084 },
  { d: "Apr 12, 2026", col: "The Dye Room", tx: "9qTx...2mLa", amt: 1.204 },
  { d: "Apr 04, 2026", col: "Ottoman Echoes", tx: "Fp7N...aBcD", amt: 0.312 },
  { d: "Mar 28, 2026", col: "Anatolia Genesis", tx: "2zRv...p9Kx", amt: 0.076 },
  { d: "Mar 21, 2026", col: "Ottoman Echoes", tx: "Lm4H...Qr7n", amt: 0.218 },
];

const LOCK_OPTIONS = [
  { id: "none", label: "No lock", sub: "Unstake anytime", mult: 1.0, days: 0 },
  { id: "week", label: "1 week lock", sub: "7-day commitment", mult: 1.1, days: 7 },
  { id: "month", label: "1 month lock", sub: "30-day commitment", mult: 1.3, days: 30 },
  { id: "life", label: "Life-time lock", sub: "Permanent, highest yield", mult: 2.0, days: -1 },
];

const totalEarned = MY_POSITIONS.reduce((s, p) => s + p.earned, 0);

/* ── Cell helper ── */
function Cell({ label, value, accent, success }: { label: string; value: string; accent?: boolean; success?: boolean }) {
  return (
    <div>
      <div className="text-micro mono">{label.toUpperCase()}</div>
      <div className="serif" style={{ fontSize: 18, marginTop: 4, color: accent ? "var(--accent)" : success ? "var(--success)" : "var(--text)" }}>{value}</div>
    </div>
  );
}

/* ── Stake Modal ── */
function StakeModal({ c, onClose }: { c: Col; onClose: () => void }) {
  const inventory = useMemo(() =>
    Array.from({ length: 8 }).map((_, i) => ({
      id: `${c.id}-${String(i + 1).padStart(4, "0")}`,
      num: Math.floor(Math.random() * c.supply),
      rarity: ["Common", "Common", "Uncommon", "Rare", "Epic"][Math.floor(Math.random() * 5)],
      staked: i < 2,
    }))
  , [c.id, c.supply]);

  const selectable = inventory.filter((n) => !n.staked);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [lock, setLock] = useState("none");
  const [step, setStep] = useState(1);
  const toggle = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };
  const count = selected.size;
  const lockOpt = LOCK_OPTIONS.find((l) => l.id === lock)!;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div onClick={onClose} className="stake-modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(12,10,8,0.72)", backdropFilter: "blur(8px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} className="card stake-modal" style={{ width: "min(720px, 100%)", maxHeight: "88vh", overflow: "hidden", padding: 0, display: "flex", flexDirection: "column", background: "var(--bg)", boxShadow: "0 30px 80px rgba(0,0,0,0.4)" }}>
        {/* Header */}
        <div className="hstack" style={{ padding: "22px 26px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ width: 42, height: 42, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}><RugTile v={c.v} glyph={c.name[0]} /></div>
          <div style={{ marginLeft: 14 }}>
            <div className="eyebrow">Stake into vault</div>
            <div className="hstack" style={{ gap: 6, marginTop: 4 }}>
              <span className="serif" style={{ fontSize: 20, letterSpacing: "-0.01em" }}>{c.name}</span>
              {c.verified && <I name="verified" size={13} />}
            </div>
          </div>
          <div className="spacer" />
          <button className="icon-btn" onClick={onClose}><I name="x" size={14} /></button>
        </div>

        {/* Stepper */}
        <div className="hstack" style={{ padding: "14px 26px", borderBottom: "1px solid var(--border)", gap: 18, fontSize: 12 }}>
          {[{ n: 1, t: "Select NFTs" }, { n: 2, t: "Choose lock" }, { n: 3, t: "Confirm" }].map((s, i, arr) => (
            <div key={s.n} className="hstack" style={{ gap: 8, opacity: step >= s.n ? 1 : 0.45, flex: i < arr.length - 1 ? 1 : undefined }}>
              <div style={{ width: 22, height: 22, borderRadius: 999, background: step >= s.n ? "var(--accent)" : "var(--surface)", color: step >= s.n ? "#fff" : "var(--text-3)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "JetBrains Mono", fontSize: 11, fontWeight: 600 }}>
                {step > s.n ? "✓" : s.n}
              </div>
              <span style={{ fontWeight: step === s.n ? 600 : 400, color: step >= s.n ? "var(--text)" : "var(--text-3)" }}>{s.t}</span>
              {i < arr.length - 1 && <div style={{ flex: 1, height: 1, background: "var(--border)" }} />}
            </div>
          ))}
        </div>

        {/* Body */}
        <div style={{ padding: "22px 26px", overflowY: "auto", flex: 1 }}>
          {step === 1 && (
            <>
              <div className="hstack" style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 13, color: "var(--text-2)" }}>
                  <strong style={{ color: "var(--text)" }}>{selectable.length}</strong> NFTs available to stake
                </div>
                <div className="spacer" />
                <button className="chip-btn ghost" style={{ height: 28, fontSize: 11 }} onClick={() => selected.size === selectable.length ? setSelected(new Set()) : setSelected(new Set(selectable.map((n) => n.id)))}>
                  {selected.size === selectable.length ? "Deselect all" : "Select all"}
                </button>
              </div>
              <div className="nft-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                {inventory.map((n) => {
                  const isSel = selected.has(n.id);
                  return (
                    <button key={n.id} disabled={n.staked} onClick={() => !n.staked && toggle(n.id)}
                      style={{ position: "relative", padding: 0, background: "transparent", border: `2px solid ${isSel ? "var(--accent)" : "var(--border)"}`, borderRadius: 10, overflow: "hidden", cursor: n.staked ? "not-allowed" : "pointer", opacity: n.staked ? 0.38 : 1, textAlign: "left", transition: "border-color 120ms, transform 120ms", transform: isSel ? "scale(0.97)" : "scale(1)" }}>
                      <div style={{ aspectRatio: "1/1" }}><RugTile v={(parseInt(n.id.slice(-2), 16) % 6) + 1} glyph={c.name[0]} /></div>
                      <div style={{ padding: "8px 10px", background: "var(--bg)" }}>
                        <div className="mono" style={{ fontSize: 11, color: "var(--text-2)" }}>#{n.num}</div>
                        <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 2 }}>{n.rarity}</div>
                      </div>
                      {isSel && <div style={{ position: "absolute", top: 8, right: 8, width: 22, height: 22, borderRadius: 999, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "JetBrains Mono", fontSize: 12, fontWeight: 700 }}>✓</div>}
                      {n.staked && <div style={{ position: "absolute", top: 8, left: 8, padding: "2px 7px", borderRadius: 999, background: "var(--surface)", border: "1px solid var(--border)", fontFamily: "JetBrains Mono", fontSize: 9, color: "var(--text-2)", letterSpacing: "0.04em" }}>STAKED</div>}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 16 }}>
                Longer locks earn a higher share of the royalty pool. Your {count} NFTs will be bound for the chosen period.
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {LOCK_OPTIONS.map((opt) => {
                  const sel = lock === opt.id;
                  return (
                    <button key={opt.id} onClick={() => setLock(opt.id)} className="lock-option"
                      style={{ padding: "16px 18px", background: sel ? "var(--accent)" : "transparent", border: `1.5px solid ${sel ? "var(--accent)" : "var(--border)"}`, borderRadius: 12, cursor: "pointer", textAlign: "left", display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: 18, color: sel ? "#fff" : "var(--text)" }}>
                      <div style={{ width: 18, height: 18, borderRadius: 999, border: `2px solid ${sel ? "#fff" : "var(--text-3)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {sel && <div style={{ width: 8, height: 8, borderRadius: 999, background: "#fff" }} />}
                      </div>
                      <div>
                        <div className="serif" style={{ fontSize: 17, letterSpacing: "-0.005em" }}>{opt.label}</div>
                        <div style={{ fontSize: 12, color: sel ? "rgba(255,255,255,0.75)" : "var(--text-3)", marginTop: 2 }}>{opt.sub}</div>
                      </div>
                      <div className="mono" style={{ padding: "8px 14px", borderRadius: 999, background: sel ? "rgba(255,255,255,0.18)" : "var(--surface)", fontWeight: 700, fontSize: 13, minWidth: 52, textAlign: "center" }}>{opt.mult.toFixed(1)}x</div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="summary-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                {[
                  { label: "NFTs to stake", value: `${count}`, sub: `from ${c.name}` },
                  { label: "Lock period", value: lockOpt.label, sub: lockOpt.sub },
                  { label: "Yield multiplier", value: `${lockOpt.mult.toFixed(1)}x`, sub: "on royalty share", accent: true },
                ].map((s) => (
                  <div key={s.label} style={{ padding: 16, border: "1px solid var(--border)", borderRadius: 12 }}>
                    <div className="text-micro mono">{s.label.toUpperCase()}</div>
                    <div className="serif" style={{ fontSize: 22, letterSpacing: "-0.01em", marginTop: 6, color: s.accent ? "var(--accent)" : "var(--text)" }}>{s.value}</div>
                    <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 4 }}>{s.sub}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 18, padding: 16, borderRadius: 12, background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div className="hstack" style={{ gap: 8, marginBottom: 8 }}>
                  <I name="shield" size={13} />
                  <span style={{ fontWeight: 600, fontSize: 13 }}>What happens on sign</span>
                </div>
                <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.65 }}>
                  Your NFTs stay in your wallet but are flagged non-transferable for the lock duration. Royalties begin flowing immediately.
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="hstack" style={{ padding: "16px 26px", borderTop: "1px solid var(--border)", gap: 10 }}>
          <div style={{ fontSize: 13, color: "var(--text-2)" }}>
            {step === 1 && <><strong style={{ color: "var(--text)" }}>{count}</strong> of {selectable.length} selected</>}
            {step === 2 && <>Lock: <strong style={{ color: "var(--text)" }}>{lockOpt.label}</strong> · <strong className="text-accent">{lockOpt.mult.toFixed(1)}x</strong></>}
            {step === 3 && <>Ready to sign</>}
          </div>
          <div className="spacer" />
          {step > 1 && <button className="chip-btn ghost" onClick={() => setStep(step - 1)}>Back</button>}
          {step < 3 ? (
            <button className="btn-primary" disabled={step === 1 && count === 0} style={{ opacity: step === 1 && count === 0 ? 0.4 : 1 }} onClick={() => setStep(step + 1)}>
              Continue <I name="arrow-right" size={14} />
            </button>
          ) : (
            <button className="btn-primary" onClick={onClose}>
              <I name="sparkle" size={14} />Stake {count} NFTs
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Page ── */
export default function StakePage() {
  const [tab, setTab] = useState<"pools" | "mine" | "claim">("pools");
  const [stakeTarget, setStakeTarget] = useState<Col | null>(null);
  const pools = COLLECTIONS.filter((c) => c.stakers > 0);

  return (
    <div className="page-content">
      <div className="hstack">
        <div>
          <div className="eyebrow">Stake · Royalty vaults</div>
          <h1 className="h-display" style={{ fontSize: 56, marginTop: 8 }}>Earn from every trade.</h1>
          <p className="text-muted" style={{ marginTop: 10, maxWidth: 560, lineHeight: 1.6 }}>
            Stake NFTs into their collection's vault. Every secondary sale pays royalties. Your share flows in, claimable any time.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-row" style={{ marginTop: 30 }}>
        <div className="stat-cell">
          <div className="stat-label">Your total staked</div>
          <div className="stat-value">6 NFTs</div>
          <div className="stat-delta">across 3 collections</div>
        </div>
        <div className="stat-cell">
          <div className="stat-label">Claimable rewards</div>
          <div className="stat-value text-accent">◎ {totalEarned.toFixed(3)}</div>
          <div className="stat-delta">≈ $324.12</div>
        </div>
        <div className="stat-cell">
          <div className="stat-label">Avg APY</div>
          <div className="stat-value">24.0%</div>
          <div className="stat-delta">7-day trailing</div>
        </div>
        <div className="stat-cell">
          <div className="stat-label">Lifetime earned</div>
          <div className="stat-value">◎ 4.82</div>
          <div className="stat-delta">since Jan 2026</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="hstack" style={{ marginTop: 32, marginBottom: 18 }}>
        <div className="tabs">
          <button className={`tab ${tab === "pools" ? "active" : ""}`} onClick={() => setTab("pools")}>All pools <span className="tab-count">{pools.length}</span></button>
          <button className={`tab ${tab === "mine" ? "active" : ""}`} onClick={() => setTab("mine")}>My positions <span className="tab-count">{MY_POSITIONS.length}</span></button>
          <button className={`tab ${tab === "claim" ? "active" : ""}`} onClick={() => setTab("claim")}>Claim history</button>
        </div>
        <div className="spacer" />
        <button className="btn-primary"><I name="download" size={14} /> Claim all · ◎ {totalEarned.toFixed(3)}</button>
      </div>

      {/* All pools */}
      {tab === "pools" && (
        <div className="card" style={{ padding: 0 }}>
          <table className="rw-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: 22 }}>Pool</th>
                <th style={{ textAlign: "right" }}>Stakers</th>
                <th style={{ textAlign: "right" }}>Total staked</th>
                <th style={{ textAlign: "right" }}>24h royalties</th>
                <th style={{ textAlign: "right" }}>Share</th>
                <th style={{ paddingRight: 22 }}></th>
              </tr>
            </thead>
            <tbody>
              {pools.map((c) => {
                const staked = Math.floor(c.minted * 0.6);
                const royalty24 = (c.vol24 * c.royalty * c.share) / 10000;
                return (
                  <tr key={c.id}>
                    <td style={{ paddingLeft: 22 }}>
                      <div className="hstack" style={{ gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 8, overflow: "hidden" }}><RugTile v={c.v} glyph={c.name[0]} /></div>
                        <div className="hstack" style={{ gap: 5 }}>
                          <span style={{ fontWeight: 600 }}>{c.name}</span>
                          {c.verified && <I name="verified" size={12} />}
                        </div>
                      </div>
                    </td>
                    <td className="mono" style={{ textAlign: "right" }}>{c.stakers.toLocaleString()}</td>
                    <td className="mono" style={{ textAlign: "right" }}>{staked.toLocaleString()} / {c.supply.toLocaleString()}</td>
                    <td className="mono" style={{ textAlign: "right" }}>◎ {royalty24.toFixed(2)}</td>
                    <td className="mono" style={{ textAlign: "right", color: "var(--accent)" }}>{c.share}%</td>
                    <td style={{ paddingRight: 22, textAlign: "right" }}>
                      <button className="chip-btn" style={{ height: 30, padding: "0 12px", fontSize: 12 }} onClick={() => setStakeTarget(c)}>Stake</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* My positions */}
      {tab === "mine" && (
        <div style={{ display: "grid", gap: 14 }}>
          {MY_POSITIONS.map((p) => (
            <div key={p.col.id} className="card rw-position-row" style={{ padding: "18px 22px", display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 20, alignItems: "center" }}>
              <div style={{ width: 72, height: 72, borderRadius: 10, overflow: "hidden" }}><RugTile v={p.col.v} glyph={p.col.name[0]} /></div>
              <div className="rw-position-inner" style={{ display: "grid", gridTemplateColumns: "1.4fr repeat(4, 1fr)", gap: 20, alignItems: "center" }}>
                <div>
                  <div className="hstack" style={{ gap: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{p.col.name}</span>
                    {p.col.verified && <I name="verified" size={13} />}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>{p.col.creator}</div>
                </div>
                <Cell label="Staked" value={`${p.staked} NFTs`} />
                <Cell label="Earned" value={`◎ ${p.earned}`} accent />
                <Cell label="APY" value={`${p.apy}%`} success />
                <Cell label="Share" value={`${p.col.share}%`} />
              </div>
              <div className="hstack" style={{ gap: 8 }}>
                <button className="chip-btn ghost">Unstake</button>
                <button className="chip-btn ghost" onClick={() => setStakeTarget(p.col)}>Stake more</button>
                <button className="chip-btn">Claim ◎ {p.earned}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Claim history */}
      {tab === "claim" && (
        <div className="card" style={{ padding: 0 }}>
          <table className="rw-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: 22 }}>Date</th>
                <th>Collection</th>
                <th>Tx</th>
                <th style={{ textAlign: "right", paddingRight: 22 }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {CLAIM_HISTORY.map((r, i) => (
                <tr key={i}>
                  <td className="mono" style={{ paddingLeft: 22, fontSize: 12, color: "var(--text-2)" }}>{r.d}</td>
                  <td>{r.col}</td>
                  <td className="mono" style={{ color: "var(--text-2)", fontSize: 12 }}>{r.tx} <I name="external" size={11} /></td>
                  <td className="mono" style={{ textAlign: "right", paddingRight: 22, color: "var(--success)" }}>+ ◎ {r.amt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {stakeTarget && <StakeModal c={stakeTarget} onClose={() => setStakeTarget(null)} />}
    </div>
  );
}
