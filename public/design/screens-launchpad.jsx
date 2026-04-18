// screens-launchpad.jsx — Launchpad explore + Collection detail

const { Icon, RugTile, Pill, Avatar, CollectionCard } = window;

function RoyaltyShareSlider() {
  const [range, setRange] = React.useState([0, 100]);
  const snap = (v) => Math.round(v / 10) * 10;
  return (
    <div className="filter-group">
      <h4>Royalty share to stakers</h4>
      <div className="hstack" style={{ justifyContent: "space-between", marginBottom: 10 }}>
        <span className="mono" style={{ fontSize: 12, color: "var(--accent)" }}>{range[0]}%</span>
        <span className="mono" style={{ fontSize: 11, color: "var(--text-3)" }}>–</span>
        <span className="mono" style={{ fontSize: 12, color: "var(--accent)" }}>{range[1]}%</span>
      </div>
      <div style={{ position: "relative", height: 28 }}>
        <div style={{ position: "absolute", inset: "12px 0", background: "var(--surface)", borderRadius: 999 }} />
        <div style={{ position: "absolute", top: 12, bottom: 12, left: `${range[0]}%`, right: `${100 - range[1]}%`, background: "var(--accent)", borderRadius: 999 }} />
        <input type="range" min={0} max={100} step={10} value={range[0]}
          onChange={e => setRange([Math.min(snap(+e.target.value), range[1] - 10), range[1]])}
          style={{ position: "absolute", inset: 0, width: "100%", background: "transparent", pointerEvents: "auto", accentColor: "var(--accent)" }} />
        <input type="range" min={0} max={100} step={10} value={range[1]}
          onChange={e => setRange([range[0], Math.max(snap(+e.target.value), range[0] + 10)])}
          style={{ position: "absolute", inset: 0, width: "100%", background: "transparent", pointerEvents: "auto", accentColor: "var(--accent)" }} />
      </div>
      <div className="hstack" style={{ justifyContent: "space-between", marginTop: 6 }}>
        <span className="mono" style={{ fontSize: 10, color: "var(--text-3)" }}>0</span>
        <span className="mono" style={{ fontSize: 10, color: "var(--text-3)" }}>50</span>
        <span className="mono" style={{ fontSize: 10, color: "var(--text-3)" }}>100</span>
      </div>
    </div>
  );
}

function LaunchpadScreen({ openCollection }) {
  const { COLLECTIONS } = window.DATA;
  const [tab, setTab] = React.useState("Live");
  const [view, setView] = React.useState("grid");
  const [filters, setFilters] = React.useState({ verified: false, royalty: [], chain: ["Solana"] });

  const filtered = COLLECTIONS.filter(c => c.status === tab)
    .filter(c => !filters.verified || c.verified);

  const counts = {
    Live: COLLECTIONS.filter(c => c.status === "Live").length,
    Upcoming: COLLECTIONS.filter(c => c.status === "Upcoming").length,
    Ended: COLLECTIONS.filter(c => c.status === "Ended").length,
  };

  return (
    <div className="screen" style={{ display: "flex", height: "100%" }}>
      {/* Filter rail */}
      <aside className="filter-rail">
        <div className="hstack" style={{ marginBottom: 12 }}>
          <Icon name="filter" size={16} />
          <span style={{ fontWeight: 600, fontSize: 14 }}>Filters</span>
          <div className="spacer" />
          <button className="micro" style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer" }}>Clear</button>
        </div>

        <div className="filter-group">
          <h4>Status</h4>
          {["Minting now", "Upcoming", "Recently ended"].map(s => (
            <label key={s} className="filter-check"><input type="checkbox" defaultChecked={s === "Minting now"} />{s}<span className="count">12</span></label>
          ))}
        </div>

        <RoyaltyShareSlider />

        <div className="filter-group">
          <h4>Price range · ◎ SOL</h4>
          <div className="hstack" style={{ gap: 6, marginTop: 6 }}>
            <input placeholder="Min" className="chip-btn" style={{ background: "transparent", fontSize: 12, height: 32, width: "100%" }} />
            <span className="micro">—</span>
            <input placeholder="Max" className="chip-btn" style={{ background: "transparent", fontSize: 12, height: 32, width: "100%" }} />
          </div>
        </div>
      </aside>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div className="page" style={{ paddingTop: 28 }}>
          <div style={{ marginBottom: 8 }}>
            <div className="eyebrow">Launchpad</div>
            <h1 className="h1 serif" style={{ fontWeight: 400, marginTop: 8, fontSize: 44 }}>Discover curated drops</h1>
            <p className="muted" style={{ marginTop: 10, maxWidth: 560, lineHeight: 1.6 }}>
              Every collection on Rug.World inherits the royalty-share vault. Hold, stake, earn — across every
              drop below.
            </p>
          </div>

          <button
            className="chip-btn"
            onClick={() => document.body.classList.toggle("filter-open")}
            style={{ marginTop: 16, display: "none" }}
            id="__mobile-filter-toggle"
          >
            <Icon name="filter" size={14} />Filters
          </button>

          <div className="hstack rw-section-head" style={{ marginTop: 24, marginBottom: 18 }}>
            <div className="tabs">
              {["Live","Upcoming","Ended"].map(t => (
                <button key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
                  {t === "Live" ? "Minting now" : t} <span className="tab-count">{counts[t]}</span>
                </button>
              ))}
            </div>
            <div className="spacer" />
            <div className="hstack" style={{ gap: 6 }}>
              <button className={`icon-btn ${view === "grid" ? "active" : ""}`} onClick={() => setView("grid")} style={{ color: view === "grid" ? "var(--text)" : "var(--text-3)" }}>
                <Icon name="grid" size={16} />
              </button>
              <button className={`icon-btn ${view === "list" ? "active" : ""}`} onClick={() => setView("list")} style={{ color: view === "list" ? "var(--text)" : "var(--text-3)" }}>
                <Icon name="list" size={16} />
              </button>
              <button className="chip-btn ghost" style={{ marginLeft: 8 }}>
                <Icon name="sliders" size={14} />Sort · Trending <Icon name="chevron-down" size={14} />
              </button>
            </div>
          </div>

          {view === "grid" ? (
            <div className="grid-collections">
              {filtered.map(c => <CollectionCard key={c.id} c={c} onOpen={() => openCollection(c.id)} />)}
            </div>
          ) : (
            <div className="card" style={{ padding: 0 }}>
              <table className="table">
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
                    <tr key={c.id} onClick={() => openCollection(c.id)} style={{ cursor: "pointer" }}>
                      <td style={{ paddingLeft: 22, color: "var(--text-3)", fontFamily: "JetBrains Mono", fontSize: 12 }}>{String(i+1).padStart(2,"0")}</td>
                      <td>
                        <div className="hstack" style={{ gap: 12 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
                            <RugTile v={c.v} glyph={c.name[0]} />
                          </div>
                          <div>
                            <div className="hstack" style={{ gap: 5 }}>
                              <span style={{ fontWeight: 600 }}>{c.name}</span>
                              {c.verified && <Icon name="verified" size={12} style={{ color: "var(--accent)" }} />}
                            </div>
                            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{c.creator}</div>
                          </div>
                        </div>
                      </td>
                      <td className="mono" style={{ textAlign: "right" }}>◎ {c.price}</td>
                      <td className="mono" style={{ textAlign: "right" }}>{c.floor ? `◎ ${c.floor}` : "—"}</td>
                      <td className="mono" style={{ textAlign: "right" }}>◎ {c.vol24.toFixed(1)}</td>
                      <td className="mono" style={{ textAlign: "right", color: c.chg > 0 ? "var(--success)" : c.chg < 0 ? "var(--accent)" : "var(--text-3)" }}>
                        {c.chg > 0 ? "+" : ""}{c.chg}%
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end", gap: 4, minWidth: 90 }}>
                          <span className="mono" style={{ fontSize: 12 }}>{Math.round(c.minted/c.supply*100)}%</span>
                          <div className="progress" style={{ width: 80 }}><span style={{ width: `${(c.minted/c.supply)*100}%` }} /></div>
                        </div>
                      </td>
                      <td className="mono" style={{ textAlign: "right" }}>{c.stakers.toLocaleString()}</td>
                      <td className="mono" style={{ textAlign: "right", color: "var(--accent)" }}>{c.share}%</td>
                      <td style={{ paddingRight: 22, textAlign: "right" }}><Icon name="chevron-right" size={14} style={{ color: "var(--text-3)" }} /></td>
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

function CollectionScreen({ id, setRoute }) {
  const c = window.DATA.COLLECTIONS.find(x => x.id === id) || window.DATA.COLLECTIONS[0];
  const [qty, setQty] = React.useState(1);
  const pct = c.supply ? (c.minted / c.supply) * 100 : 0;

  return (
    <div className="screen page">
      <div className="hstack" style={{ marginBottom: 22, fontSize: 13, color: "var(--text-2)" }}>
        <button onClick={() => setRoute("launchpad")} style={{ background: "none", border: "none", color: "var(--text-2)", cursor: "pointer", fontSize: 13 }}>Launchpad</button>
        <Icon name="chevron-right" size={13} style={{ color: "var(--text-3)" }} />
        <span style={{ color: "var(--text)" }}>{c.name}</span>
      </div>

      <div className="rw-detail-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
        {/* Left: art gallery */}
        <div>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <RugTile v={c.v} glyph={c.name[0]} />
          </div>
          <div className="rw-gallery-thumbs" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 8 }}>
            {[2,3,4,5].map(v => (
              <div key={v} className="card" style={{ padding: 0, overflow: "hidden", cursor: "pointer" }}>
                <RugTile v={v} />
              </div>
            ))}
          </div>
        </div>

        {/* Right: info */}
        <div>
          <div className="hstack" style={{ gap: 10, marginBottom: 10 }}>
            <Avatar seed={c.creator} />
            <span style={{ fontSize: 13, color: "var(--text-2)" }}>{c.creator}</span>
            {c.verified && <Icon name="verified" size={14} style={{ color: "var(--accent)" }} />}
            <div className="spacer" />
            {c.status === "Live" ? <Pill kind="live">Minting now</Pill> : c.status === "Ended" ? <Pill kind="ended">Sold out</Pill> : <Pill kind="upcoming">In {c.in}</Pill>}
          </div>
          <h1 className="h-display" style={{ fontSize: 56 }}>{c.name}</h1>

          <p style={{ marginTop: 18, color: "var(--text-2)", fontSize: 15, lineHeight: 1.65 }}>
            A study in the rhythm of warp and weft. {c.supply.toLocaleString()} hand-traited pieces on Solana,
            with {c.share}% of every secondary royalty flowing into the {c.name} staker vault.
          </p>

          <div className="rw-info-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, border: "1px solid var(--border)", borderRadius: 12, marginTop: 24, overflow: "hidden" }}>
            <InfoCell label="Price" value={`◎ ${c.price}`} />
            <InfoCell label="Floor" value={c.floor ? `◎ ${c.floor}` : "—"} />
            <InfoCell label="24h vol" value={`◎ ${c.vol24.toFixed(1)}`} delta={`${c.chg > 0 ? "+" : ""}${c.chg}%`} deltaDown={c.chg < 0} />
            <InfoCell label="Stakers" value={c.stakers.toLocaleString()} last />
          </div>

          {/* Mint widget */}
          <div className="card pad-lg" style={{ marginTop: 20 }}>
            <div className="hstack" style={{ justifyContent: "space-between" }}>
              <div className="eyebrow">{c.status === "Ended" ? "Mint closed" : "Mint"}</div>
              <div className="mono micro">{c.status === "Ended" ? "Phase: Secondary" : "Phase: Public"}</div>
            </div>
            <div style={{ marginTop: 12, marginBottom: 10 }}>
              <div className="progress"><span style={{ width: `${pct}%` }} /></div>
              <div className="hstack" style={{ justifyContent: "space-between", marginTop: 8 }}>
                <span className="mono" style={{ fontSize: 12 }}>{c.minted.toLocaleString()} / {c.supply.toLocaleString()} minted</span>
                <span className="mono" style={{ fontSize: 12, color: "var(--accent)" }}>{pct.toFixed(1)}%</span>
              </div>
            </div>

            {c.status === "Ended" ? (
              <div style={{ marginTop: 20 }}>
                <div style={{
                  padding: "22px 20px", borderRadius: 12,
                  background: "var(--surface)", border: "1px dashed var(--border)",
                  textAlign: "center",
                }}>
                  <div style={{ fontFamily: "Fraunces", fontSize: 22, letterSpacing: "-0.01em" }}>Sold out</div>
                  <div className="mono" style={{ fontSize: 11, color: "var(--text-3)", marginTop: 6, letterSpacing: "0.04em" }}>
                    ALL {c.supply.toLocaleString()} PIECES MINTED · TRADE ON SECONDARY
                  </div>
                </div>
                <div className="hstack" style={{ gap: 10, marginTop: 12 }}>
                  <button className="btn-primary lg" style={{ flex: 1 }}>
                    <Icon name="sparkle" size={14} />Buy on secondary · floor ◎ {c.floor}
                  </button>
                </div>
              </div>
            ) : (
              <div className="hstack" style={{ gap: 10, marginTop: 20 }}>
                <div className="hstack" style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 2 }}>
                  <button className="icon-btn" style={{ border: "none", background: "transparent", width: 36, height: 36 }} onClick={() => setQty(Math.max(1, qty - 1))}><Icon name="x" size={12} style={{ transform: "rotate(45deg)" }} /></button>
                  <div style={{ minWidth: 42, textAlign: "center", fontFamily: "JetBrains Mono" }}>{qty}</div>
                  <button className="icon-btn" style={{ border: "none", background: "transparent", width: 36, height: 36 }} onClick={() => setQty(Math.min(10, qty + 1))}><Icon name="plus" size={12} /></button>
                </div>
                <button className="btn-primary lg" style={{ flex: 1 }}>
                  <Icon name="sparkle" size={14} />Mint {qty} for ◎ {(c.price * qty).toFixed(2)}
                </button>
              </div>
            )}

            <div style={{ marginTop: 16, padding: 14, borderRadius: 10, background: "var(--surface)", fontSize: 12, color: "var(--text-2)", lineHeight: 1.6 }}>
              <div className="hstack" style={{ gap: 8, marginBottom: 6 }}>
                <Icon name="shield" size={13} style={{ color: "var(--accent)" }} />
                <span style={{ fontWeight: 600, color: "var(--text)" }}>Royalty share guarantee</span>
              </div>
              {c.share}% of every secondary royalty routes to stakers. Unstake any time — unclaimed rewards stay yours.
            </div>
          </div>

          <div className="hstack" style={{ marginTop: 20, gap: 10, flexWrap: "wrap" }}>
            <button className="chip-btn ghost"><Icon name="twitter" size={14} />Twitter</button>
            <button className="chip-btn ghost"><Icon name="discord" size={14} />Discord</button>
            <button className="chip-btn ghost"><Icon name="external" size={14} />Explorer</button>
            <button className="chip-btn ghost"><Icon name="copy" size={14} />Gx4v...2p9L</button>
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
              <Split color="var(--accent)"    label="Stakers"  pct={c.share} amount={(c.royalty * c.share / 100).toFixed(1)} />
              <Split color="var(--text-2)"    label="Creator"  pct={100 - c.share - 2} amount={(c.royalty * (100 - c.share - 2) / 100).toFixed(1)} />
              <Split color="var(--text-3)"    label="Rug.World" pct={2} amount={(c.royalty * 0.02).toFixed(2)} last />
            </div>
          </div>

          <div style={{ marginTop: 22, padding: 14, background: "var(--surface)", borderRadius: 10, fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.6 }}>
            A trade at the current floor (◎ {c.floor || c.price}) pays ◎ {((c.floor || c.price) * c.royalty / 100).toFixed(3)} in royalty.
            Stakers collectively earn ◎ {((c.floor || c.price) * c.royalty / 100 * c.share / 100).toFixed(3)} per sale.
          </div>
        </div>
      </div>

      {/* Long project description */}
      <ProjectDescription c={c} />
    </div>
  );
}

function ProjectDescription({ c }) {
  return (
    <div className="rw-desc-grid" style={{ marginTop: 56, display: "grid", gridTemplateColumns: "1fr 2fr", gap: 48, paddingTop: 48, borderTop: "1px solid var(--border)" }}>
      <div>
        <div className="eyebrow">About the project</div>
        <h3 className="h2 serif" style={{ fontWeight: 400, marginTop: 10, fontSize: 32, lineHeight: 1.15 }}>
          A living archive of {c.name.toLowerCase()}, reimagined on-chain.
        </h3>
        <div className="hstack" style={{ gap: 10, marginTop: 20, flexWrap: "wrap" }}>
          <div style={{ padding: "6px 12px", border: "1px solid var(--border)", borderRadius: 999, fontSize: 11, fontFamily: "JetBrains Mono", color: "var(--text-2)", letterSpacing: "0.04em" }}>GENERATIVE</div>
          <div style={{ padding: "6px 12px", border: "1px solid var(--border)", borderRadius: 999, fontSize: 11, fontFamily: "JetBrains Mono", color: "var(--text-2)", letterSpacing: "0.04em" }}>SOLANA</div>
          <div style={{ padding: "6px 12px", border: "1px solid var(--border)", borderRadius: 999, fontSize: 11, fontFamily: "JetBrains Mono", color: "var(--text-2)", letterSpacing: "0.04em" }}>ROYALTY-SHARED</div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 18, fontSize: 15, lineHeight: 1.75, color: "var(--text-2)" }}>
        <p>
          {c.name} is a collection of {c.supply.toLocaleString()} generative pieces that translate centuries of woven
          tradition into an on-chain archive. Every rug is assembled from a library of motifs — field patterns,
          medallions, borders, corner anchors, and fringe treatments — rendered as a single deterministic artwork
          minted directly on Solana.
        </p>
        <p>
          The collection is the flagship drop from <strong style={{ color: "var(--text)" }}>{c.creator}</strong>, built in partnership with
          Rug.World to pilot a new economic model for digital collectibles. Rather than a one-time mint fee, the
          project is structured around a perpetual royalty stream: {c.royalty}% of every secondary trade is
          redistributed, with <strong style={{ color: "var(--accent)" }}>{c.share}%</strong> flowing back to holders
          who stake their piece into the collection vault.
        </p>
        <p>
          Staking is non-custodial and reversible at any time. A staked rug continues to live in the holder's wallet;
          the pool simply indexes it as an eligible receiver of pro-rata royalty flow. Rewards accrue continuously
          and can be claimed or compounded, and unstaking takes a single signature with no cooldown period — the
          unclaimed balance stays with the original staker even after the NFT is transferred.
        </p>
        <p>
          Beyond the economics, {c.name} is designed as a cultural object. The source motifs were commissioned from
          working studio weavers and encoded as SVG primitives, meaning each piece is fully on-chain, reproducible,
          and printable at any scale. Holders receive a print-ready file and commercial license for their specific
          rug, and the underlying motif library will remain public-domain after the drop concludes — a deliberate
          gesture toward open craft, rather than closed IP.
        </p>
        <p>
          The roadmap is intentionally small. Phase one: mint. Phase two: activate the staking vault and route
          royalty flow. Phase three: physical fulfillment for holders who want their rug woven by the originating
          studio, redeemable against a burn of the NFT or held indefinitely as a companion piece. No season two,
          no dilution, no governance token.
        </p>
      </div>
    </div>
  );
}

function InfoCell({ label, value, delta, deltaDown, last }) {
  return (
    <div style={{ padding: "18px 20px", borderRight: last ? "none" : "1px solid var(--border)" }}>
      <div className="micro mono">{label.toUpperCase()}</div>
      <div style={{ fontFamily: "Fraunces", fontSize: 22, marginTop: 6, letterSpacing: "-0.015em" }}>{value}</div>
      {delta && <div className="mono" style={{ fontSize: 11, marginTop: 4, color: deltaDown ? "var(--accent)" : "var(--success)" }}>{delta}</div>}
    </div>
  );
}

function RoyaltyDonut({ share }) {
  const size = 120, stroke = 18, r = (size - stroke) / 2, cx = size/2, cy = size/2;
  const circ = 2 * Math.PI * r;
  const a = circ * share / 100;
  return (
    <svg width={size} height={size}>
      <g transform={`rotate(-90 ${cx} ${cy})`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface)" strokeWidth={stroke} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--accent)" strokeWidth={stroke}
          strokeDasharray={`${a} ${circ - a}`} />
      </g>
      <text x={cx} y={cy - 2} textAnchor="middle" fill="var(--text)" fontFamily="Fraunces" fontSize="20" fontWeight="500">{share}%</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="var(--text-3)" fontFamily="JetBrains Mono" fontSize="9">TO STAKERS</text>
    </svg>
  );
}

function Split({ color, label, pct, amount, last }) {
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

Object.assign(window, { LaunchpadScreen, CollectionScreen });
