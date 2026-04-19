"use client";

import Link from "next/link";

function Section({ id, tag, title, children }: { id: string; tag: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ paddingBottom: 48, borderBottom: "1px solid var(--border)", marginBottom: 48 }}>
      <div className="eyebrow">{tag}</div>
      <h2 className="h1 serif" style={{ fontWeight: 400, marginTop: 8, fontSize: 32, marginBottom: 18 }}>{title}</h2>
      <div style={{ fontSize: 15, lineHeight: 1.75, color: "var(--text-2)", maxWidth: 720 }}>
        {children}
      </div>
    </section>
  );
}

export default function DocsPage() {
  return (
    <div className="page-content" style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 48 }}>
        <div className="eyebrow">Documentation</div>
        <h1 className="h-display" style={{ fontSize: 48, marginTop: 8 }}>How Campfire works.</h1>
        <p className="text-muted" style={{ marginTop: 12, maxWidth: 560, lineHeight: 1.6 }}>
          Everything you need to know about the platform, the royalty model, the art studio, and launching a collection.
        </p>
      </div>

      {/* Quick nav */}
      <div className="card pad" style={{ marginBottom: 48 }}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>On this page</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 13 }}>
          {[
            { label: "What is Campfire", href: "#what" },
            { label: "Royalty model", href: "#royalty" },
            { label: "How staking works", href: "#staking" },
            { label: "Art Studio", href: "#studio" },
            { label: "Launching a collection", href: "#launching" },
            { label: "Platform fees", href: "#fees" },
            { label: "For holders", href: "#holders" },
            { label: "Community Takeover", href: "#cto" },
          ].map((item) => (
            <a key={item.href} href={item.href} style={{ color: "var(--accent)", textDecoration: "none", padding: "4px 0" }}>
              {item.label}
            </a>
          ))}
        </div>
      </div>

      <Section id="what" tag="01" title="What is Campfire?">
        <p>Campfire is a curated NFT launchpad on Solana. Collections go through an application process before they can launch. Once approved, every collection gets a built-in royalty-share vault that pays holders instead of creators.</p>
        <p style={{ marginTop: 12 }}>The platform also includes an Art Studio where anyone can upload trait layers, set rarity weights, and generate unique NFT collections. You can use the studio freely, download your art, and apply to launch when ready.</p>
      </Section>

      <Section id="royalty" tag="02" title="The royalty model.">
        <p>This is the core of Campfire. Every collection that launches here has a <strong style={{ color: "var(--text)" }}>10% royalty on secondary sales</strong>. All of that royalty goes to people who stake their NFTs from that collection.</p>
        <p style={{ marginTop: 12 }}>Creators earn from the primary mint sale. After that, the secondary market value flows back to the community. If a creator wants ongoing income, they can mint NFTs for themselves and stake them, earning like everyone else.</p>
        <div className="card pad" style={{ marginTop: 16 }}>
          <div className="mono text-micro" style={{ marginBottom: 8 }}>ROYALTY BREAKDOWN</div>
          <div className="hstack" style={{ justifyContent: "space-between", fontSize: 14, padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
            <span>Stakers</span>
            <span className="mono" style={{ color: "var(--accent)", fontWeight: 600 }}>10% of every sale</span>
          </div>
          <div className="hstack" style={{ justifyContent: "space-between", fontSize: 14, padding: "6px 0" }}>
            <span>Creator</span>
            <span className="mono">0% (earns from mint)</span>
          </div>
        </div>
      </Section>

      <Section id="staking" tag="03" title="How staking works.">
        <p>Each collection has its own staking pool. When you stake your NFT, you start earning a share of the 10% royalty on every secondary sale of that collection.</p>
        <p style={{ marginTop: 12 }}>Staking is non-custodial. Your NFT stays in your wallet but gets flagged as staked. You can unstake at any time and keep any unclaimed rewards. The longer you stake, the more you earn.</p>
        <p style={{ marginTop: 12 }}>Rewards are proportional. If you've staked 5 NFTs out of 1,000 total staked, you earn 0.5% of the royalty pool.</p>
      </Section>

      <Section id="studio" tag="04" title="Art Studio.">
        <p>The Art Studio is a free tool for creating generative NFT collections. Upload your trait images organized by layer (background, body, eyes, accessories, etc.), set rarity weights per trait, and the system generates unique combinations.</p>
        <p style={{ marginTop: 12 }}>Every generated NFT gets a unique DNA hash, so no two pieces are identical. You can preview the output, filter by attributes, swap positions, add 1/1 pieces, and download the full set when you're happy.</p>
        <p style={{ marginTop: 12 }}>The Studio handles collections of any size. 300 traits can produce thousands of unique NFTs.</p>
        <div style={{ marginTop: 16 }}>
          <Link href="/studio" className="btn-primary">Open Studio</Link>
        </div>
      </Section>

      <Section id="launching" tag="05" title="Launching a collection.">
        <p>Campfire is curated. To launch a collection, you need to apply. We review the art quality, the team, and the project plan. If approved, your collection goes live on the launchpad with the royalty-share vault attached automatically.</p>
        <p style={{ marginTop: 12 }}>The launch process:</p>
        <ol style={{ marginTop: 8, paddingLeft: 20, lineHeight: 2 }}>
          <li>Build your art in the Studio (or bring your own)</li>
          <li>Apply via our social channels</li>
          <li>If approved, configure mint phases, pricing, and supply</li>
          <li>Pay the 1 SOL launch fee</li>
          <li>Your collection goes live</li>
        </ol>
      </Section>

      <Section id="fees" tag="06" title="Platform fees.">
        <p>Campfire takes a small cut on primary mints to sustain the platform. No fees are taken from the secondary royalty pool.</p>
        <div className="card pad" style={{ marginTop: 16 }}>
          <div className="mono text-micro" style={{ marginBottom: 8 }}>FEE STRUCTURE</div>
          <div style={{ fontSize: 14, lineHeight: 2 }}>
            <div className="hstack" style={{ justifyContent: "space-between", borderBottom: "1px solid var(--border)", padding: "4px 0" }}>
              <span>Launch fee</span><span className="mono">1 SOL (one-time)</span>
            </div>
            <div className="hstack" style={{ justifyContent: "space-between", borderBottom: "1px solid var(--border)", padding: "4px 0" }}>
              <span>Buyer fee (on mint)</span><span className="mono">+2.5% on top of mint price</span>
            </div>
            <div className="hstack" style={{ justifyContent: "space-between", borderBottom: "1px solid var(--border)", padding: "4px 0" }}>
              <span>Creator fee (on mint)</span><span className="mono">-2.5% from creator's share</span>
            </div>
            <div className="hstack" style={{ justifyContent: "space-between", padding: "4px 0" }}>
              <span>Secondary royalty fee</span><span className="mono">0% (all to stakers)</span>
            </div>
          </div>
        </div>
        <p style={{ marginTop: 12 }}>For a 1 SOL mint: the buyer pays 1.025 SOL, the creator receives 0.975 SOL, and Campfire gets 0.05 SOL.</p>
      </Section>

      <Section id="holders" tag="07" title="For holders.">
        <p>As a holder, your job is simple: mint or buy an NFT from a Campfire collection, then stake it. Every time that collection trades on the secondary market, 10% of the sale price flows into the staking pool. Your share depends on how many NFTs you've staked relative to the total.</p>
        <p style={{ marginTop: 12 }}>You can claim your rewards at any time. Unstaking is instant with no cooldown. Unclaimed rewards stay yours even after unstaking.</p>
      </Section>

      <Section id="cto" tag="08" title="Community Takeover (CTO).">
        <p>If a project team abandons their collection, the community can take over. Anyone can apply to become the new lead by contacting the Campfire team. If approved, the collection transfers to new leadership. The art stays, the community stays, the royalties keep flowing.</p>
      </Section>
    </div>
  );
}
