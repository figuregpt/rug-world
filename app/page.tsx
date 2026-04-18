"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/* ── Mock data from design spec ── */
const STATS = { tvl: 48291, collections: 42, stakers: 14820, royaltiesPaid: 3840 };

const MOCK_COLLECTIONS = [
  { id: "ottoman-echoes", name: "Ottoman Echoes", creator: "atelier.sol", status: "Live", supply: 5000, minted: 3247, price: 0.5, floor: 0.68, vol24: 142.3, chg: 12.4, share: 80, v: 1, verified: true },
  { id: "kilim-society", name: "Kilim Society", creator: "nomad.dao", status: "Live", supply: 3333, minted: 2901, price: 0.8, floor: 1.21, vol24: 98.7, chg: -3.1, share: 75, v: 2, verified: true },
  { id: "anatolia-gen", name: "Anatolia Genesis", creator: "loom.labs", status: "Live", supply: 2222, minted: 1456, price: 1.2, floor: 1.55, vol24: 76.2, chg: 22.0, share: 90, v: 3, verified: true },
  { id: "thread-count", name: "Thread Count", creator: "warp.studio", status: "Live", supply: 7500, minted: 6210, price: 0.25, floor: 0.31, vol24: 54.1, chg: 4.2, share: 70, v: 4, verified: false },
  { id: "dye-room", name: "The Dye Room", creator: "indigo.art", status: "Live", supply: 1000, minted: 994, price: 2.5, floor: 3.40, vol24: 210.0, chg: 38.5, share: 85, v: 5, verified: true },
  { id: "medallion-v2", name: "Medallion, Vol. II", creator: "atelier.sol", status: "Upcoming", supply: 3000, minted: 0, price: 0.9, floor: 0, vol24: 0, chg: 0, share: 80, v: 2, verified: true, inTime: "2d 14h" },
  { id: "prayer-rug", name: "Prayer Rug", creator: "minbar.dao", status: "Upcoming", supply: 1111, minted: 0, price: 1.5, floor: 0, vol24: 0, chg: 0, share: 100, v: 3, verified: true, inTime: "5d 2h" },
  { id: "caravan", name: "Caravan", creator: "silkroad.sol", status: "Ended", supply: 2000, minted: 2000, price: 0.7, floor: 1.08, vol24: 12.3, chg: 1.1, share: 80, v: 5, verified: true },
];

const ACTIVITY = [
  { kind: "Mint", col: "The Dye Room", user: "4pZ...9uKm", price: 2.5, time: "12s ago" },
  { kind: "Sale", col: "Anatolia Genesis", user: "9qE...B8fa", price: 1.84, time: "38s ago" },
  { kind: "Stake", col: "Kilim Society", user: "GkT...3mLp", price: null, time: "1m ago" },
  { kind: "Sale", col: "Ottoman Echoes", user: "2vB...pE7z", price: 0.92, time: "2m ago" },
  { kind: "Claim", col: "Thread Count", user: "Rx4...YnCd", price: 0.042, time: "3m ago" },
  { kind: "Mint", col: "Ottoman Echoes", user: "6pK...qWjL", price: 0.5, time: "4m ago" },
  { kind: "Stake", col: "The Dye Room", user: "AaZ...11fh", price: null, time: "6m ago" },
];

type Collection = typeof MOCK_COLLECTIONS[0];

/* ── Components ── */

function RugTile({ variant = 1, glyph }: { variant?: number; glyph?: string }) {
  const vClass = variant > 1 ? `v${variant}` : "";
  return (
    <div className={`rug-tile ${vClass}`}>
      {glyph && <span className="glyph">{glyph}</span>}
    </div>
  );
}

function Pill({ kind, children }: { kind: "live" | "upcoming" | "ended"; children: React.ReactNode }) {
  return <span className={`pill ${kind}`}>{children}</span>;
}

function CollectionCard({ c }: { c: Collection }) {
  const pct = c.supply > 0 ? Math.round((c.minted / c.supply) * 100) : 0;
  return (
    <div className="card" style={{ padding: 0, cursor: "pointer" }}>
      <RugTile variant={c.v} glyph={c.name[0]} />
      <div style={{ padding: 14 }}>
        <div className="hstack" style={{ gap: 6, marginBottom: 4 }}>
          <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>{c.name}</div>
          {c.verified && <span className="text-accent" style={{ fontSize: 12 }}>&#10003;</span>}
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
          <span className="mono">{c.floor ? `◎ ${c.floor}` : "---"}</span>
        </div>
        <div className="hstack" style={{ justifyContent: "space-between", fontSize: 12, marginBottom: 8 }}>
          <span style={{ color: "var(--text-3)" }}>24h vol</span>
          <span className="mono">
            {c.vol24 ? `◎ ${c.vol24.toFixed(1)}` : "---"}
            {c.chg !== 0 && (
              <span style={{ marginLeft: 6, color: c.chg > 0 ? "var(--success)" : "var(--accent)", fontSize: 11 }}>
                {c.chg > 0 ? "+" : ""}{c.chg}%
              </span>
            )}
          </span>
        </div>
        {c.status === "Ended" ? (
          <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--text-3)" }} />
            <span className="mono" style={{ fontSize: 11, color: "var(--text-2)", letterSpacing: "0.04em" }}>SOLD OUT</span>
          </div>
        ) : (
          <>
            <div className="progress" style={{ marginTop: 10 }}>
              <span style={{ width: `${pct}%` }} />
            </div>
            <div className="hstack" style={{ justifyContent: "space-between", marginTop: 4 }}>
              <span className="mono" style={{ fontSize: 10, color: "var(--text-3)" }}>
                {c.minted.toLocaleString()}/{c.supply.toLocaleString()}
              </span>
              <span className="mono" style={{ fontSize: 10, color: "var(--accent)" }}>
                {c.share}% to stakers
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function KindBadge({ kind }: { kind: string }) {
  const colors: Record<string, { bg: string; fg: string }> = {
    Mint: { bg: "var(--accent-soft)", fg: "var(--accent)" },
    Sale: { bg: "var(--surface)", fg: "var(--text-2)" },
    Stake: { bg: "rgba(175,194,131,0.14)", fg: "var(--success)" },
    Claim: { bg: "rgba(222,168,49,0.14)", fg: "var(--warn)" },
  };
  const c = colors[kind] || colors.Sale;
  return (
    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: c.bg, color: c.fg, fontWeight: 600 }}>
      {kind}
    </span>
  );
}

/* ── Page ── */

export default function Home() {
  const live = MOCK_COLLECTIONS.filter((c) => c.status === "Live");
  const upcoming = MOCK_COLLECTIONS.filter((c) => c.status === "Upcoming");
  const featured = live[0];

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
                Launch a collection
              </Link>
              <Link href="/launchpad" className="btn-ghost lg">
                Explore drops
              </Link>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <RugTile variant={1} />
            <RugTile variant={2} glyph="R" />
            <RugTile variant={3} glyph="W" />
            <RugTile variant={4} />
          </div>
        </div>

        {/* Stats strip */}
        <div className="stats-row" style={{ marginTop: 40 }}>
          <div className="stat-cell">
            <div className="stat-label">Total value locked</div>
            <div className="stat-value">◎ {STATS.tvl.toLocaleString()}</div>
            <div className="stat-delta">+8.4% 7d</div>
          </div>
          <div className="stat-cell">
            <div className="stat-label">Collections launched</div>
            <div className="stat-value">{STATS.collections}</div>
            <div className="stat-delta">+3 this week</div>
          </div>
          <div className="stat-cell">
            <div className="stat-label">Stakers earning</div>
            <div className="stat-value">{STATS.stakers.toLocaleString()}</div>
            <div className="stat-delta">+214 24h</div>
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
          <div style={{ padding: 36 }}>
            <RugTile variant={featured.v} glyph={featured.name[0]} />
          </div>
          <div style={{ padding: "36px 36px 36px 12px", display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="hstack" style={{ gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 999, background: "var(--accent-soft)", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>
                {featured.creator[0].toUpperCase()}
              </div>
              <span style={{ fontSize: 13, color: "var(--text-2)" }}>{featured.creator}</span>
              {featured.verified && <span className="text-accent" style={{ fontSize: 14 }}>&#10003;</span>}
            </div>
            <h2 className="h1 serif" style={{ fontWeight: 400 }}>{featured.name}</h2>
            <p style={{ color: "var(--text-2)", fontSize: 14.5, lineHeight: 1.6, maxWidth: 520 }}>
              {featured.supply.toLocaleString()} pieces; {featured.share}% of royalties routed to stakers.
            </p>

            <div className="rw-info-4" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0, marginTop: 8, border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "14px 16px", borderRight: "1px solid var(--border)" }}>
                <div className="text-micro mono" style={{ marginBottom: 4 }}>PRICE</div>
                <div className="serif" style={{ fontSize: 17, letterSpacing: "-0.01em" }}>◎ {featured.price}</div>
              </div>
              <div style={{ padding: "14px 16px", borderRight: "1px solid var(--border)" }}>
                <div className="text-micro mono" style={{ marginBottom: 4 }}>MINTED</div>
                <div className="serif" style={{ fontSize: 17, letterSpacing: "-0.01em" }}>
                  {featured.minted.toLocaleString()} <span style={{ color: "var(--text-3)", fontSize: 13 }}>/ {featured.supply.toLocaleString()}</span>
                </div>
              </div>
              <div style={{ padding: "14px 16px" }}>
                <div className="text-micro mono" style={{ marginBottom: 4 }}>STAKERS EARN</div>
                <div className="serif text-accent" style={{ fontSize: 17 }}>{featured.share}% of royalty</div>
              </div>
            </div>

            <div style={{ marginTop: 4 }}>
              <div className="progress"><span style={{ width: `${(featured.minted / featured.supply) * 100}%` }} /></div>
              <div className="hstack" style={{ justifyContent: "space-between", marginTop: 6, fontSize: 11 }}>
                <span className="mono" style={{ color: "var(--text-3)" }}>{Math.round((featured.minted / featured.supply) * 100)}% minted</span>
                <span className="mono" style={{ color: "var(--text-3)" }}>{(featured.supply - featured.minted).toLocaleString()} left</span>
              </div>
            </div>

            <div className="hstack" style={{ marginTop: 10, gap: 10 }}>
              <button className="btn-primary">Mint now · ◎ {featured.price}</button>
              <button className="btn-ghost">Details</button>
            </div>
          </div>
        </div>
      </section>

      {/* LIVE DROPS */}
      <section style={{ paddingBottom: 56 }}>
        <div className="hstack" style={{ marginBottom: 20 }}>
          <div>
            <div className="eyebrow">Live drops</div>
            <h3 className="h2 serif" style={{ fontWeight: 400, marginTop: 6 }}>Minting right now</h3>
          </div>
          <div className="spacer" />
          <Link href="/launchpad" className="chip-btn ghost">
            See all
          </Link>
        </div>
        <div className="grid-collections">
          {live.slice(1, 5).map((c) => (
            <CollectionCard key={c.id} c={c} />
          ))}
        </div>
      </section>

      {/* ACTIVITY + UPCOMING */}
      <section className="rw-activity-grid" style={{ paddingBottom: 60, display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 24 }}>
        {/* Activity feed */}
        <div className="card" style={{ padding: 0 }}>
          <div className="hstack" style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)" }}>
            <div className="eyebrow">Live feed</div>
            <div className="spacer" />
            <Pill kind="live">realtime</Pill>
          </div>
          <table className="rw-table">
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
              {ACTIVITY.map((a, i) => (
                <tr key={i}>
                  <td style={{ paddingLeft: 22 }}><KindBadge kind={a.kind} /></td>
                  <td>{a.col}</td>
                  <td className="mono" style={{ color: "var(--text-2)", fontSize: 12 }}>{a.user}</td>
                  <td className="mono" style={{ textAlign: "right", paddingRight: 22 }}>{a.price != null ? `◎ ${a.price}` : "---"}</td>
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
          </div>
          <div style={{ padding: "8px 0" }}>
            {upcoming.map((c) => (
              <div key={c.id} className="hstack" style={{ padding: "14px 22px", borderBottom: "1px solid var(--border)", gap: 14, cursor: "pointer" }}>
                <div style={{ width: 52, height: 52, borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
                  <RugTile variant={c.v} glyph={c.name[0]} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="hstack" style={{ gap: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</span>
                    {c.verified && <span className="text-accent" style={{ fontSize: 12 }}>&#10003;</span>}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 2 }}>{c.creator} · {c.supply.toLocaleString()} supply</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="mono" style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>{c.inTime}</div>
                  <div className="mono" style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>◎ {c.price}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ paddingBottom: 60 }}>
        <div className="eyebrow">How it works</div>
        <h3 className="h2 serif" style={{ fontWeight: 400, marginTop: 6, marginBottom: 28 }}>From launch to earning.</h3>
        <div className="rw-steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {[
            { n: "01", t: "Launch", d: "Anyone can launch a collection. Build your art in Studio, set phases, and go live." },
            { n: "02", t: "Mint", d: "Buyers mint from your drops. Every collection has the royalty share system built in." },
            { n: "03", t: "Stake", d: "Holders stake their NFTs into the collection pool to start earning." },
            { n: "04", t: "Earn", d: "Every secondary trade generates royalties. 100% flows to stakers." },
          ].map((s) => (
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
