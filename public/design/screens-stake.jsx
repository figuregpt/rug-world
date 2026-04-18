// screens-stake.jsx — Stake dashboard

const { Icon, RugTile, Pill, Avatar } = window;

const LOCK_OPTIONS = [
  { id: "none",  label: "No lock",         sub: "Unstake anytime",       mult: 1.0, days: 0 },
  { id: "week",  label: "1 week lock",     sub: "7-day commitment",      mult: 1.1, days: 7 },
  { id: "month", label: "1 month lock",    sub: "30-day commitment",     mult: 1.3, days: 30 },
  { id: "life",  label: "Life-time lock",  sub: "Permanent \u2014 highest yield", mult: 2.0, days: -1 },
];

function StakeScreen() {
  const { COLLECTIONS } = window.DATA;
  const [tab, setTab] = React.useState("pools");
  const [stakeTarget, setStakeTarget] = React.useState(null);

  const myPositions = [
    { col: COLLECTIONS[0], staked: 3, earned: 0.412, apy: 18.4 },
    { col: COLLECTIONS[2], staked: 1, earned: 0.087, apy: 22.1 },
    { col: COLLECTIONS[4], staked: 2, earned: 1.204, apy: 31.6 },
  ];
  const totalEarned = myPositions.reduce((s, p) => s + p.earned, 0);

  return (
    <div className="screen page">
      <div className="hstack">
        <div>
          <div className="eyebrow">Stake · Royalty vaults</div>
          <h1 className="h-display" style={{ fontSize: 56, marginTop: 8 }}>Earn from every trade.</h1>
          <p className="muted" style={{ marginTop: 10, maxWidth: 560, lineHeight: 1.6 }}>
            Stake NFTs into their collection's vault. Every secondary sale pays royalties —
            your share flows in, claimable any time.
          </p>
        </div>
        <div className="spacer" />
      </div>

      {/* Portfolio strip */}
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

      <div className="hstack" style={{ marginTop: 32, marginBottom: 18 }}>
        <div className="tabs">
          <button className={`tab ${tab === "pools" ? "active" : ""}`} onClick={() => setTab("pools")}>All pools <span className="tab-count">{COLLECTIONS.filter(c => c.stakers > 0).length}</span></button>
          <button className={`tab ${tab === "mine" ? "active" : ""}`} onClick={() => setTab("mine")}>My positions <span className="tab-count">{myPositions.length}</span></button>
          <button className={`tab ${tab === "claim" ? "active" : ""}`} onClick={() => setTab("claim")}>Claim history</button>
        </div>
        <div className="spacer" />
        <button className="btn-primary"><Icon name="download" size={14} />Claim all · ◎ {totalEarned.toFixed(3)}</button>
      </div>

      {tab === "pools" && (
        <div className="card" style={{ padding: 0 }}>
          <table className="table">
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
              {COLLECTIONS.filter(c => c.stakers > 0).map(c => {
                const apy = 15 + (c.chg * 0.8) + Math.random() * 10;
                const staked = Math.floor(c.minted * 0.6);
                const royalty24 = c.vol24 * c.royalty / 100 * c.share / 100;
                return (
                  <tr key={c.id}>
                    <td style={{ paddingLeft: 22 }}>
                      <div className="hstack" style={{ gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 8, overflow: "hidden" }}><RugTile v={c.v} glyph={c.name[0]} /></div>
                        <div className="hstack" style={{ gap: 5 }}>
                          <span style={{ fontWeight: 600 }}>{c.name}</span>
                          {c.verified && <Icon name="verified" size={12} style={{ color: "var(--accent)" }} />}
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

      {tab === "mine" && (
        <div style={{ display: "grid", gap: 14 }}>
          {myPositions.map(p => (
            <div key={p.col.id} className="card rw-position-row" style={{ padding: 0, display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 20, alignItems: "center", padding: "18px 22px" }}>
              <div style={{ width: 72, height: 72, borderRadius: 10, overflow: "hidden" }}><RugTile v={p.col.v} glyph={p.col.name[0]} /></div>
              <div className="rw-position-inner" style={{ display: "grid", gridTemplateColumns: "1.4fr repeat(4, 1fr)", gap: 20, alignItems: "center" }}>
                <div>
                  <div className="hstack" style={{ gap: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{p.col.name}</span>
                    {p.col.verified && <Icon name="verified" size={13} style={{ color: "var(--accent)" }} />}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>{p.col.creator}</div>
                </div>
                <Cell label="Staked" value={`${p.staked} NFT${p.staked > 1 ? "s" : ""}`} />
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

      {tab === "claim" && (
        <div className="card" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th style={{ paddingLeft: 22 }}>Date</th>
                <th>Collection</th>
                <th>Tx</th>
                <th style={{ textAlign: "right", paddingRight: 22 }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {[
                { d: "Apr 16, 2026", col: "Kilim Society", tx: "3Kp9...8vBr", amt: 0.084 },
                { d: "Apr 12, 2026", col: "The Dye Room",  tx: "9qTx...2mLa", amt: 1.204 },
                { d: "Apr 04, 2026", col: "Ottoman Echoes", tx: "Fp7N...aBcD", amt: 0.312 },
                { d: "Mar 28, 2026", col: "Anatolia Genesis", tx: "2zRv...p9Kx", amt: 0.076 },
                { d: "Mar 21, 2026", col: "Ottoman Echoes", tx: "Lm4H...Qr7n", amt: 0.218 },
              ].map((r, i) => (
                <tr key={i}>
                  <td className="mono" style={{ paddingLeft: 22, fontSize: 12, color: "var(--text-2)" }}>{r.d}</td>
                  <td>{r.col}</td>
                  <td className="mono" style={{ color: "var(--text-2)", fontSize: 12 }}>{r.tx} <Icon name="external" size={11} style={{ color: "var(--text-3)", marginLeft: 4 }} /></td>
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

function Cell({ label, value, accent, success }) {
  return (
    <div>
      <div className="micro mono">{label.toUpperCase()}</div>
      <div style={{ fontFamily: "Fraunces", fontSize: 18, marginTop: 4, color: accent ? "var(--accent)" : success ? "var(--success)" : "var(--text)" }}>{value}</div>
    </div>
  );
}

// ---------- Stake modal ----------

function StakeModal({ c, onClose }) {
  // Fake holder inventory: 8 NFTs in this collection
  const inventory = React.useMemo(() => (
    Array.from({ length: 8 }).map((_, i) => ({
      id: `${c.id}-${String(i + 1).padStart(4, "0")}`,
      num: Math.floor(Math.random() * c.supply),
      rarity: ["Common", "Common", "Uncommon", "Rare", "Epic"][Math.floor(Math.random() * 5)],
      staked: i < 2, // first two are already staked
    }))
  ), [c.id, c.supply]);

  const selectable = inventory.filter(n => !n.staked);

  const [selected, setSelected] = React.useState(new Set());
  const [lock, setLock] = React.useState("none");
  const [step, setStep] = React.useState(1); // 1 = pick NFTs, 2 = pick lock, 3 = confirm

  const toggle = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };
  const selectAll = () => setSelected(new Set(selectable.map(n => n.id)));
  const clearAll = () => setSelected(new Set());

  const lockOpt = LOCK_OPTIONS.find(l => l.id === lock);
  const count = selected.size;

  // lock on Escape + scroll freeze
  React.useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div onClick={onClose} className="stake-modal-overlay" style={{
      position: "fixed", inset: 0, background: "rgba(12, 10, 8, 0.72)",
      backdropFilter: "blur(8px)", zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div onClick={(e) => e.stopPropagation()} className="card stake-modal" style={{
        width: "min(720px, 100%)", maxHeight: "88vh", overflow: "hidden",
        padding: 0, display: "flex", flexDirection: "column",
        background: "var(--bg)", boxShadow: "0 30px 80px rgba(0,0,0,0.4)",
      }}>
        {/* Header */}
        <div className="hstack" style={{ padding: "22px 26px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ width: 42, height: 42, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
            <RugTile v={c.v} glyph={c.name[0]} />
          </div>
          <div style={{ marginLeft: 14 }}>
            <div className="eyebrow">Stake into vault</div>
            <div className="hstack" style={{ gap: 6, marginTop: 4 }}>
              <span style={{ fontFamily: "Fraunces", fontSize: 20, letterSpacing: "-0.01em" }}>{c.name}</span>
              {c.verified && <Icon name="verified" size={13} style={{ color: "var(--accent)" }} />}
            </div>
          </div>
          <div className="spacer" />
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={14} /></button>
        </div>

        {/* Stepper */}
        <div className="hstack" style={{ padding: "14px 26px", borderBottom: "1px solid var(--border)", gap: 18, fontSize: 12 }}>
          {[{ n: 1, t: "Select NFTs" }, { n: 2, t: "Choose lock" }, { n: 3, t: "Confirm" }].map((s, i, arr) => (
            <React.Fragment key={s.n}>
              <div className="hstack" style={{ gap: 8, opacity: step >= s.n ? 1 : 0.45 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 999,
                  background: step >= s.n ? "var(--accent)" : "var(--surface)",
                  color: step >= s.n ? "#fff" : "var(--text-3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "JetBrains Mono", fontSize: 11, fontWeight: 600,
                }}>{step > s.n ? "✓" : s.n}</div>
                <span style={{ fontWeight: step === s.n ? 600 : 400, color: step >= s.n ? "var(--text)" : "var(--text-3)" }}>{s.t}</span>
              </div>
              {i < arr.length - 1 && <div style={{ flex: 1, height: 1, background: "var(--border)" }} />}
            </React.Fragment>
          ))}
        </div>

        {/* Body */}
        <div style={{ padding: "22px 26px", overflowY: "auto", flex: 1 }}>
          {step === 1 && (
            <>
              <div className="hstack" style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 13, color: "var(--text-2)" }}>
                  <strong style={{ color: "var(--text)" }}>{selectable.length}</strong> NFT{selectable.length !== 1 ? "s" : ""} available to stake from your wallet
                </div>
                <div className="spacer" />
                <button className="chip-btn ghost" style={{ height: 28, fontSize: 11 }} onClick={selectable.length === selected.size ? clearAll : selectAll}>
                  {selectable.length === selected.size ? "Deselect all" : "Select all"}
                </button>
              </div>

              <div className="nft-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                {inventory.map(n => {
                  const isSel = selected.has(n.id);
                  const disabled = n.staked;
                  return (
                    <button
                      key={n.id}
                      disabled={disabled}
                      onClick={() => !disabled && toggle(n.id)}
                      style={{
                        position: "relative", padding: 0, background: "transparent",
                        border: `2px solid ${isSel ? "var(--accent)" : "var(--border)"}`,
                        borderRadius: 10, overflow: "hidden", cursor: disabled ? "not-allowed" : "pointer",
                        opacity: disabled ? 0.38 : 1, textAlign: "left",
                        transition: "border-color 120ms, transform 120ms",
                        transform: isSel ? "scale(0.97)" : "scale(1)",
                      }}
                    >
                      <div style={{ aspectRatio: "1 / 1" }}><RugTile v={(parseInt(n.id.slice(-2), 16) % 6) + 1} glyph={c.name[0]} /></div>
                      <div style={{ padding: "8px 10px", background: "var(--bg)" }}>
                        <div className="mono" style={{ fontSize: 11, color: "var(--text-2)" }}>#{n.num}</div>
                        <div className="hstack" style={{ gap: 4, marginTop: 2 }}>
                          <span style={{ fontSize: 10, color: "var(--text-3)" }}>{n.rarity}</span>
                        </div>
                      </div>
                      {isSel && (
                        <div style={{
                          position: "absolute", top: 8, right: 8,
                          width: 22, height: 22, borderRadius: 999, background: "var(--accent)",
                          display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
                          fontFamily: "JetBrains Mono", fontSize: 12, fontWeight: 700,
                        }}>✓</div>
                      )}
                      {disabled && (
                        <div style={{
                          position: "absolute", top: 8, left: 8,
                          padding: "2px 7px", borderRadius: 999,
                          background: "var(--surface)", border: "1px solid var(--border)",
                          fontFamily: "JetBrains Mono", fontSize: 9, color: "var(--text-2)", letterSpacing: "0.04em",
                        }}>STAKED</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 16 }}>
                Longer locks earn a higher share of the royalty pool. Your {count} NFT{count !== 1 ? "s" : ""} will be bound for the chosen period — unstaking before expiry isn't possible.
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                {LOCK_OPTIONS.map(opt => {
                  const sel = lock === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setLock(opt.id)}
                      className="lock-option"
                      style={{
                        padding: "16px 18px",
                        background: sel ? "var(--accent)" : "transparent",
                        border: `1.5px solid ${sel ? "var(--accent)" : "var(--border)"}`,
                        borderRadius: 12, cursor: "pointer", textAlign: "left",
                        display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: 18,
                        transition: "all 120ms",
                        color: sel ? "#fff" : "var(--text)",
                      }}
                    >
                      <div style={{
                        width: 18, height: 18, borderRadius: 999,
                        border: `2px solid ${sel ? "#fff" : "var(--text-3)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {sel && <div style={{ width: 8, height: 8, borderRadius: 999, background: "#fff" }} />}
                      </div>
                      <div>
                        <div style={{ fontFamily: "Fraunces", fontSize: 17, letterSpacing: "-0.005em", color: "inherit" }}>{opt.label}</div>
                        <div style={{ fontSize: 12, color: sel ? "rgba(255,255,255,0.75)" : "var(--text-3)", marginTop: 2 }}>{opt.sub}</div>
                      </div>
                      <div style={{
                        padding: "8px 14px", borderRadius: 999,
                        background: sel ? "rgba(255,255,255,0.18)" : "var(--surface)",
                        color: "inherit",
                        fontFamily: "JetBrains Mono", fontSize: 13, fontWeight: 700,
                        minWidth: 52, textAlign: "center",
                      }}>
                        {opt.mult.toFixed(1)}×
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="summary-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                <Summary label="NFTs to stake" value={`${count}`} sub={`from ${c.name}`} />
                <Summary label="Lock period" value={lockOpt.label} sub={lockOpt.sub} />
                <Summary label="Yield multiplier" value={`${lockOpt.mult.toFixed(1)}×`} sub="on royalty share" accent />
              </div>

              <div style={{ marginTop: 18, padding: 16, borderRadius: 12, background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div className="hstack" style={{ gap: 8, marginBottom: 8 }}>
                  <Icon name="shield" size={13} style={{ color: "var(--accent)" }} />
                  <span style={{ fontWeight: 600, fontSize: 13 }}>What happens on sign</span>
                </div>
                <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.65 }}>
                  Your {count} NFT{count !== 1 ? "s" : ""} stay in your wallet but are flagged non-transferable for the lock duration.
                  Royalties from every secondary trade in {c.name} begin flowing into your claimable balance immediately.
                  {lock === "life" && " Life-time lock is irreversible — the NFT becomes permanently soulbound to this vault."}
                  {lock !== "none" && lock !== "life" && ` You'll be able to unstake after ${lockOpt.days} days.`}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="hstack" style={{ padding: "16px 26px", borderTop: "1px solid var(--border)", gap: 10 }}>
          <div style={{ fontSize: 13, color: "var(--text-2)" }}>
            {step === 1 && <><strong style={{ color: "var(--text)" }}>{count}</strong> of {selectable.length} selected</>}
            {step === 2 && <>Lock: <strong style={{ color: "var(--text)" }}>{lockOpt.label}</strong> · multiplier <strong style={{ color: "var(--accent)" }}>{lockOpt.mult.toFixed(1)}×</strong></>}
            {step === 3 && <>Ready to sign transaction in your wallet</>}
          </div>
          <div className="spacer" />
          {step > 1 && (
            <button className="chip-btn ghost" onClick={() => setStep(step - 1)}>Back</button>
          )}
          {step < 3 ? (
            <button
              className="btn-primary"
              disabled={step === 1 && count === 0}
              style={{ opacity: step === 1 && count === 0 ? 0.4 : 1, cursor: step === 1 && count === 0 ? "not-allowed" : "pointer" }}
              onClick={() => setStep(step + 1)}
            >
              Continue <Icon name="arrow-right" size={14} />
            </button>
          ) : (
            <button className="btn-primary" onClick={onClose}>
              <Icon name="sparkle" size={14} />Stake {count} NFT{count !== 1 ? "s" : ""}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Summary({ label, value, sub, accent, success }) {
  return (
    <div style={{ padding: 16, border: "1px solid var(--border)", borderRadius: 12 }}>
      <div className="micro mono">{label.toUpperCase()}</div>
      <div style={{
        fontFamily: "Fraunces", fontSize: 22, letterSpacing: "-0.01em", marginTop: 6,
        color: accent ? "var(--accent)" : success ? "var(--success)" : "var(--text)",
      }}>{value}</div>
      <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 4 }}>{sub}</div>
    </div>
  );
}

window.StakeScreen = StakeScreen;
