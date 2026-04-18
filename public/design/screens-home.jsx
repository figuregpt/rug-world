// screens-home.jsx — Home/landing and Launchpad detail

const { Icon, RugTile, Pill, Avatar } = window;

function HomeScreen({ setRoute, openCollection }) {
  const { COLLECTIONS, STATS, ACTIVITY } = window.DATA;
  const live = COLLECTIONS.filter(c => c.status === "Live");
  const upcoming = COLLECTIONS.filter(c => c.status === "Upcoming");
  const featured = live[0];

  return (
    <div className="screen page">
      {/* HERO */}
      <section style={{ paddingTop: 20, paddingBottom: 56, borderBottom: "1px solid var(--border)" }}>
        <div className="rw-two-col" style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 48, alignItems: "end" }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 22 }}>Solana · Royalty-share launchpad</div>
            <h1 className="h-display">
              Launch collections.<br/>
              <em>Share royalties</em> with holders.
            </h1>
            <p style={{ marginTop: 22, fontSize: 16, lineHeight: 1.6, color: "var(--text-2)", maxWidth: 520 }}>
              Curated NFT drops with a built-in royalty vault. When your collection trades,
              the people who hold and stake get paid — not just the team.
            </p>
            <div className="hstack" style={{ marginTop: 30, gap: 12 }}>
              <button className="btn-primary lg" onClick={() => setRoute("create")}>
                <Icon name="rocket" size={16} />Launch a collection
              </button>
              <button className="btn-ghost lg" onClick={() => setRoute("launchpad")}>
                Explore drops <Icon name="arrow-right" size={15} />
              </button>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <RugTile v={1} />
            <RugTile v={2} glyph="R" />
            <RugTile v={3} glyph="W" />
            <RugTile v={5} />
          </div>
        </div>

        {/* Stats strip */}
        <div className="stats-row" style={{ marginTop: 40 }}>
          <div className="stat-cell">
            <div className="stat-label">Total value locked</div>
            <div className="stat-value">◎ {STATS.tvl.toLocaleString()}</div>
            <div className="stat-delta">+8.4% · 7d</div>
          </div>
          <div className="stat-cell">
            <div className="stat-label">Collections launched</div>
            <div className="stat-value">{STATS.collections}</div>
            <div className="stat-delta">+3 this week</div>
          </div>
          <div className="stat-cell">
            <div className="stat-label">Stakers earning</div>
            <div className="stat-value">{STATS.stakers.toLocaleString()}</div>
            <div className="stat-delta">+214 · 24h</div>
          </div>
          <div className="stat-cell">
            <div className="stat-label">Royalties paid out</div>
            <div className="stat-value">◎ {STATS.royaltiesPaid.toLocaleString()}</div>
            <div className="stat-delta">lifetime</div>
          </div>
        </div>
      </section>

      {/* FEATURED DROP */}
      <section style={{ padding: "56px 0" }}>
        <div className="hstack" style={{ marginBottom: 20 }}>
          <div className="eyebrow">Featured Drop</div>
          <div className="spacer" />
          <Pill kind="live">Minting now</Pill>
        </div>
        <div className="card rw-feature-grid" style={{ padding: 0, display: "grid", gridTemplateColumns: "1.1fr 1fr" }}>
          <div style={{ padding: 36, position: "relative" }}>
            <RugTile v={featured.v} glyph={featured.name[0]} />
          </div>
          <div style={{ padding: "36px 36px 36px 12px", display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="hstack" style={{ gap: 10 }}>
              <Avatar seed={featured.creator} />
              <span style={{ fontSize: 13, color: "var(--text-2)" }}>{featured.creator}</span>
              {featured.verified && <Icon name="verified" size={14} style={{ color: "var(--accent)" }} />}
            </div>
            <h2 className="h1 serif" style={{ fontWeight: 400 }}>{featured.name}</h2>
            <p style={{ color: "var(--text-2)", fontSize: 14.5, lineHeight: 1.6, maxWidth: 520 }}>
              A meditation on the geometry of Anatolian rugs, rebuilt trait-by-trait.
              {featured.supply.toLocaleString()} pieces; {featured.share}% of royalties routed to stakers.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0, marginTop: 8, border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "14px 16px", borderRight: "1px solid var(--border)" }}>
                <div className="micro mono" style={{ marginBottom: 4 }}>PRICE</div>
                <div style={{ fontSize: 17, fontFamily: "Fraunces", letterSpacing: "-0.01em" }}>◎ {featured.price}</div>
              </div>
              <div style={{ padding: "14px 16px", borderRight: "1px solid var(--border)" }}>
                <div className="micro mono" style={{ marginBottom: 4 }}>MINTED</div>
                <div style={{ fontSize: 17, fontFamily: "Fraunces", letterSpacing: "-0.01em" }}>
                  {featured.minted.toLocaleString()} <span style={{ color: "var(--text-3)", fontSize: 13 }}>/ {featured.supply.toLocaleString()}</span>
                </div>
              </div>
              <div style={{ padding: "14px 16px" }}>
                <div className="micro mono" style={{ marginBottom: 4 }}>STAKERS EARN</div>
                <div style={{ fontSize: 17, fontFamily: "Fraunces", color: "var(--accent)" }}>{featured.share}% of royalty</div>
              </div>
            </div>

            <div style={{ marginTop: 4 }}>
              <div className="progress"><span style={{ width: `${(featured.minted / featured.supply) * 100}%` }} /></div>
              <div className="hstack" style={{ justifyContent: "space-between", marginTop: 6, fontSize: 11 }}>
                <span className="mono" style={{ color: "var(--text-3)" }}>{Math.round(featured.minted / featured.supply * 100)}% minted</span>
                <span className="mono" style={{ color: "var(--text-3)" }}>{(featured.supply - featured.minted).toLocaleString()} left</span>
              </div>
            </div>

            <div className="hstack" style={{ marginTop: 10, gap: 10 }}>
              <button className="btn-primary" onClick={() => openCollection(featured.id)}>Mint now · ◎ {featured.price}</button>
              <button className="btn-ghost" onClick={() => openCollection(featured.id)}>Details</button>
            </div>
          </div>
        </div>
      </section>

      {/* LIVE + UPCOMING split */}
      <section style={{ paddingBottom: 56 }}>
        <div className="hstack" style={{ marginBottom: 20 }}>
          <div>
            <div className="eyebrow">Live drops</div>
            <h3 className="h1 serif" style={{ fontWeight: 400, marginTop: 6, fontSize: 28 }}>Minting right now</h3>
          </div>
          <div className="spacer" />
          <button className="chip-btn ghost" onClick={() => setRoute("launchpad")}>See all <Icon name="arrow-right" size={14} /></button>
        </div>
        <div className="grid-collections">
          {live.slice(1, 5).map(c => <CollectionCard key={c.id} c={c} onOpen={() => openCollection(c.id)} />)}
        </div>
      </section>

      {/* Activity + upcoming */}
      <section className="rw-two-col" style={{ paddingBottom: 60, display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 24 }}>
        {/* Activity */}
        <div className="card" style={{ padding: 0 }}>
          <div className="hstack" style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)" }}>
            <div className="eyebrow">Live feed</div>
            <div className="spacer" />
            <span className="pill live">realtime</span>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th style={{ paddingLeft: 22 }}>Event</th>
                <th>Collection</th>
                <th>Account</th>
                <th style={{ textAlign: "right", paddingRight: 22 }}>Price</th>
                <th style={{ textAlign: "right", paddingRight: 22 }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {window.DATA.ACTIVITY.map((a, i) => (
                <tr key={i}>
                  <td style={{ paddingLeft: 22 }}>
                    <span style={{
                      fontSize: 11, padding: "2px 8px", borderRadius: 999,
                      background: a.kind === "Mint" ? "var(--accent-soft)" : a.kind === "Stake" ? "rgba(175, 194, 131, 0.14)" : "var(--surface)",
                      color: a.kind === "Mint" ? "var(--accent)" : a.kind === "Stake" ? "var(--success)" : "var(--text-2)",
                      fontWeight: 600,
                    }}>{a.kind}</span>
                  </td>
                  <td>{a.col}</td>
                  <td className="mono" style={{ color: "var(--text-2)", fontSize: 12 }}>{a.user}</td>
                  <td className="mono" style={{ textAlign: "right", paddingRight: 22 }}>{a.price != null ? `◎ ${a.price}` : "—"}</td>
                  <td className="mono" style={{ textAlign: "right", paddingRight: 22, color: "var(--text-3)", fontSize: 12 }}>{a.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Upcoming */}
        <div className="card" style={{ padding: 0 }}>
          <div className="hstack" style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)" }}>
            <div className="eyebrow">Upcoming</div>
            <div className="spacer" />
            <Icon name="clock" size={14} style={{ color: "var(--text-3)" }} />
          </div>
          <div style={{ padding: "8px 0" }}>
            {upcoming.map(c => (
              <div key={c.id} className="hstack" style={{ padding: "14px 22px", borderBottom: "1px solid var(--border)", gap: 14, cursor: "pointer" }} onClick={() => openCollection(c.id)}>
                <div style={{ width: 52, height: 52, borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
                  <RugTile v={c.v} glyph={c.name[0]} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="hstack" style={{ gap: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</span>
                    {c.verified && <Icon name="verified" size={12} style={{ color: "var(--accent)" }} />}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 2 }}>{c.creator} · {c.supply.toLocaleString()} supply</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="mono" style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>{c.in}</div>
                  <div className="mono" style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>◎ {c.price}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ paddingBottom: 60 }}>
        <div className="eyebrow">How it works</div>
        <h3 className="h1 serif" style={{ fontWeight: 400, marginTop: 6, marginBottom: 28 }}>From launch to earning — four steps.</h3>
        <div className="rw-feature-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {[
            { n: "01", t: "Curated Launch",  d: "Only approved collections drop on Rug.World. Each project is vetted by our team." },
            { n: "02", t: "Mint & Collect",  d: "Every collection inherits the Royalty Share system from day one." },
            { n: "03", t: "Stake Your NFTs", d: "Each collection has its own staking pool. Stake to start earning." },
            { n: "04", t: "Earn Royalties",  d: "Every secondary sale generates royalties. Distributed to stakers." },
          ].map(s => (
            <div key={s.n} className="card pad" style={{ padding: 22 }}>
              <div className="mono" style={{ fontSize: 11, color: "var(--accent)", letterSpacing: "0.1em" }}>{s.n}</div>
              <div style={{ fontWeight: 600, marginTop: 16, fontSize: 15 }}>{s.t}</div>
              <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 8, lineHeight: 1.6 }}>{s.d}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function CollectionCard({ c, onOpen }) {
  return (
    <div className="card" style={{ padding: 0, cursor: "pointer" }} onClick={onOpen}>
      <RugTile v={c.v} glyph={c.name[0]} />
      <div style={{ padding: 14 }}>
        <div className="hstack" style={{ gap: 6, marginBottom: 4 }}>
          <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>{c.name}</div>
          {c.verified && <Icon name="verified" size={13} style={{ color: "var(--accent)" }} />}
        </div>
        <div className="hstack" style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 10 }}>
          <span>{c.creator}</span>
          <div className="spacer" />
          {c.status === "Live" && <Pill kind="live">Live</Pill>}
          {c.status === "Upcoming" && <Pill kind="upcoming">Soon</Pill>}
          {c.status === "Ended" && <Pill kind="ended">Ended</Pill>}
        </div>
        <div className="hstack" style={{ justifyContent: "space-between", fontSize: 12, marginBottom: 8 }}>
          <span style={{ color: "var(--text-3)" }}>Floor</span>
          <span className="mono">{c.floor ? `◎ ${c.floor}` : "—"}</span>
        </div>
        <div className="hstack" style={{ justifyContent: "space-between", fontSize: 12, marginBottom: 8 }}>
          <span style={{ color: "var(--text-3)" }}>24h vol</span>
          <span className="mono">
            {c.vol24 ? `◎ ${c.vol24.toFixed(1)}` : "—"}
            {c.chg !== 0 && <span style={{ marginLeft: 6, color: c.chg > 0 ? "var(--success)" : "var(--accent)", fontSize: 11 }}>{c.chg > 0 ? "+" : ""}{c.chg}%</span>}
          </span>
        </div>
        {c.status === "Ended" ? (
          <div style={{
            marginTop: 10, padding: "10px 12px", borderRadius: 10,
            background: "var(--surface)", border: "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--text-3)" }} />
            <span className="mono" style={{ fontSize: 11, color: "var(--text-2)", letterSpacing: "0.04em" }}>SOLD OUT</span>
          </div>
        ) : (
          <>
            <div className="progress" style={{ marginTop: 10 }}>
              <span style={{ width: c.supply ? `${(c.minted / c.supply) * 100}%` : "0%" }} />
            </div>
            <div className="hstack" style={{ justifyContent: "space-between", marginTop: 4 }}>
              <span className="mono" style={{ fontSize: 10, color: "var(--text-3)" }}>
                {c.minted.toLocaleString()}/{c.supply.toLocaleString()}
              </span>
              <span className="mono" style={{ fontSize: 10, color: "var(--accent)" }}>
                {c.share}% → stakers
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

window.HomeScreen = HomeScreen;
window.CollectionCard = CollectionCard;
