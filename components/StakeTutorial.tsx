"use client";

import { TutorialPlayer, type TutorialScene } from "./TutorialPlayer";

const KF = `
@keyframes st-fade-up    { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes st-fade-in    { from { opacity: 0; } to { opacity: 1; } }
@keyframes st-pop        { 0% { opacity: 0; transform: scale(0.55); } 60% { opacity: 1; transform: scale(1.12); } 100% { opacity: 1; transform: scale(1); } }
@keyframes st-pulse-btn  { 0%, 100% { box-shadow: 0 0 0 0 rgba(201,98,101,0.55); } 50% { box-shadow: 0 0 0 12px rgba(201,98,101,0); } }
@keyframes st-row-highlight {
  0%   { background: transparent; border-color: var(--border); }
  100% { background: var(--accent-soft); border-color: var(--accent-line); }
}
@keyframes st-cursor-stake {
  0%   { opacity: 0; left: 560px; top: 270px; transform: scale(1); }
  20%  { opacity: 1; }
  35%  { opacity: 1; left: 417px; top: 162px; transform: scale(1); }
  43%  { transform: scale(0.85); }
  50%  { transform: scale(1); }
  75%  { opacity: 1; left: 417px; top: 245px; transform: scale(1); }
  82%  { transform: scale(0.85); }
  90%  { transform: scale(1); }
  100% { opacity: 0; left: 417px; top: 245px; transform: scale(1); }
}
@keyframes st-fade-out {
  from { opacity: 1; }
  to   { opacity: 0; }
}
@keyframes st-coin-arc {
  0%   { opacity: 0; left: 425px; top: 70px; transform: scale(0.5); }
  15%  { opacity: 1; transform: scale(1); }
  100% { opacity: 0; left: 175px; top: 175px; transform: scale(0.6); }
}
@keyframes st-trade-flash {
  0%   { opacity: 0; transform: translateY(-6px); }
  20%  { opacity: 1; transform: translateY(0); }
  85%  { opacity: 1; }
  100% { opacity: 0.55; }
}
@keyframes st-tick-show {
  0%   { opacity: 0; transform: translateY(6px); }
  18%  { opacity: 1; transform: translateY(0); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes st-cursor-claim {
  0%   { opacity: 0; left: 510px; top: 270px; transform: scale(1); }
  20%  { opacity: 1; }
  60%  { opacity: 1; left: 317px; top: 153px; transform: scale(1); }
  68%  { transform: scale(0.82); }
  78%  { transform: scale(1); }
  100% { opacity: 0; left: 317px; top: 153px; transform: scale(1); }
}
@keyframes st-coin-claim {
  0%   { opacity: 0; left: 280px; top: 130px; transform: scale(0.5); }
  18%  { opacity: 1; transform: scale(1); }
  100% { opacity: 0; left: 540px; top: 40px; transform: scale(0.6); }
}
`;

const LOCK_OPTIONS = [
  { period: "No lock", mult: "1.0x", desc: "Anytime" },
  { period: "1 week", mult: "1.1x", desc: "7-day" },
  { period: "1 month", mult: "1.3x", desc: "30-day" },
  { period: "Lifetime", mult: "2.0x", desc: "Permanent" },
];
const PICKED_INDEX = 2; // "1 month"

/* ── Scene 1: Pick a lock period & stake ── */
const Stake = () => (
  <>
    <style>{KF}</style>

    {/* NFT card (left) */}
    <div
      className="card"
      style={{
        position: "absolute",
        left: 60,
        top: 35,
        width: 170,
        padding: 0,
        opacity: 0,
        animation: "st-fade-up 0.4s ease-out 0.1s forwards",
        overflow: "hidden",
      }}
    >
      <div style={{ width: "100%", aspectRatio: "1/1", overflow: "hidden", position: "relative" }}>
        <img src="/sneak1.png" alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        {/* Lock overlay (appears after stake) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(12,10,8,0.42)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0,
            animation: "st-fade-in 0.35s ease-out 4.2s forwards",
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F2E9C8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="11" width="16" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
        </div>
      </div>
      <div className="hstack" style={{ padding: "8px 10px", gap: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 600 }}>BOIS</span>
        <span className="mono text-micro" style={{ fontSize: 10 }}>#142</span>
        <div className="spacer" />
        {/* Pre-stake label swaps to post-stake pill at the same spot */}
        <div style={{ position: "relative", height: 18, minWidth: 88 }}>
          <span
            className="mono text-micro"
            style={{
              position: "absolute",
              right: 0,
              top: 3,
              fontSize: 9,
              animation: "st-fade-out 0.25s ease-in 4.1s forwards",
            }}
          >
            unstaked
          </span>
          <span
            className="pill verified"
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              fontSize: 9,
              padding: "2px 8px",
              opacity: 0,
              animation: "st-pop 0.4s ease-out 4.3s forwards",
            }}
          >
            STAKED · 1mo
          </span>
        </div>
      </div>
    </div>

    {/* Lock options panel (right) */}
    <div
      className="card"
      style={{
        position: "absolute",
        left: 260,
        top: 35,
        width: 320,
        padding: 14,
        opacity: 0,
        animation: "st-fade-up 0.4s ease-out 0.2s forwards",
      }}
    >
      <div className="eyebrow" style={{ fontSize: 10, marginBottom: 10 }}>
        Lock period
      </div>
      <div style={{ display: "grid", gap: 6 }}>
        {LOCK_OPTIONS.map((l, i) => (
          <div
            key={l.period}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "7px 10px",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
              animation:
                i === PICKED_INDEX ? "st-row-highlight 0.3s ease-out 1.9s forwards" : undefined,
            }}
          >
            <div>
              <span style={{ fontWeight: 600, color: "var(--text)" }}>{l.period}</span>
              <span style={{ color: "var(--text-3)", marginLeft: 8, fontSize: 11 }}>{l.desc}</span>
            </div>
            <span className="mono" style={{ color: "var(--accent)", fontWeight: 700, fontSize: 12 }}>
              {l.mult}
            </span>
          </div>
        ))}
      </div>

      <div
        className="btn-primary"
        style={{
          marginTop: 10,
          height: 30,
          fontSize: 12,
          justifyContent: "center",
          display: "flex",
          alignItems: "center",
          gap: 6,
          animation: "st-pulse-btn 1.4s ease-in-out 2.6s 2",
        }}
      >
        Stake with 1.3x lock
      </div>
    </div>

    {/* Cursor */}
    <div
      style={{
        position: "absolute",
        animation: "st-cursor-stake 4.0s ease-in-out 0.6s forwards",
        opacity: 0,
        pointerEvents: "none",
      }}
    >
      <svg width="18" height="20" viewBox="0 0 24 26">
        <path
          d="M3 3l7 18 3-7 7-3z"
          fill="#F2E9C8"
          stroke="#1A1714"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  </>
);

/* ── Scene 2: Royalties accrue ── */
const Earn = () => (
  <>
    <style>{KF}</style>

    {/* Frozen NFT badge (small, upper left) */}
    <div
      style={{
        position: "absolute",
        left: 60,
        top: 35,
        width: 70,
        height: 70,
        borderRadius: 10,
        overflow: "hidden",
        border: "1px solid var(--border)",
      }}
    >
      <img src="/sneak1.png" alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      <div style={{ position: "absolute", inset: 0, background: "rgba(12,10,8,0.42)" }} />
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#F2E9C8"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
      >
        <rect x="4" y="11" width="16" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </svg>
    </div>
    <div
      className="pill verified"
      style={{
        position: "absolute",
        left: 60,
        top: 110,
        fontSize: 9,
        padding: "2px 8px",
      }}
    >
      LOCKED 1mo · 1.3x
    </div>

    {/* Your share card */}
    <div
      className="card"
      style={{
        position: "absolute",
        left: 60,
        top: 140,
        width: 220,
        padding: 14,
        opacity: 0,
        animation: "st-fade-up 0.4s ease-out 0.1s forwards",
      }}
    >
      <div className="hstack" style={{ marginBottom: 6 }}>
        <div className="eyebrow" style={{ fontSize: 10 }}>
          Your share
        </div>
        <div className="spacer" />
      </div>
      <div style={{ position: "relative", height: 32 }}>
        {(() => {
          const ticks = [
            { val: "0.00", at: 0.4 },
            { val: "0.16", at: 1.7 },
            { val: "0.26", at: 3.1 },
            { val: "0.58", at: 4.5 },
          ];
          return ticks.map((s, i) => {
            const next = ticks[i + 1];
            const anim = next
              ? `st-tick-show 0.35s ease-out ${s.at}s forwards, st-fade-out 0.25s ease-in ${(
                  next.at - 0.2
                ).toFixed(2)}s forwards`
              : `st-tick-show 0.35s ease-out ${s.at}s forwards`;
            return (
              <div
                key={i}
                className="serif"
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  fontSize: 26,
                  lineHeight: 1,
                  opacity: 0,
                  color: i === 0 ? "var(--text)" : "var(--gold)",
                  animation: anim,
                }}
              >
                {s.val}
                <span className="mono" style={{ fontSize: 12, color: "var(--text-3)", marginLeft: 6 }}>
                  SOL
                </span>
              </div>
            );
          });
        })()}
      </div>
      <div className="text-micro" style={{ fontSize: 11, marginTop: 4 }}>
        royalty share, weighted by lock
      </div>
    </div>

    {/* Trade ticker */}
    <div style={{ position: "absolute", right: 50, top: 35, width: 230 }}>
      <div className="eyebrow" style={{ fontSize: 10, marginBottom: 8 }}>
        Recent sales
      </div>
      {[
        { sol: "1.20", at: 0.5 },
        { sol: "0.80", at: 1.9 },
        { sol: "2.50", at: 3.3 },
      ].map((t, i) => (
        <div
          key={i}
          className="card"
          style={{
            padding: "8px 12px",
            marginBottom: 6,
            opacity: 0,
            animation: `st-trade-flash 1.6s ease-in-out ${t.at}s forwards`,
          }}
        >
          <div className="hstack" style={{ gap: 8 }}>
            <span className="pill live" style={{ fontSize: 9, padding: "1px 7px" }}>
              Sale
            </span>
            <div className="spacer" />
            <span className="mono" style={{ fontSize: 12 }}>
              ◎ {t.sol}
            </span>
            <span className="mono text-accent" style={{ fontSize: 10 }}>
              +10%
            </span>
          </div>
        </div>
      ))}
    </div>

    {/* Coin arcs from trades to share counter */}
    {[1.2, 2.6, 4.0].map((delay, i) => (
      <div
        key={i}
        style={{
          position: "absolute",
          width: 18,
          height: 18,
          borderRadius: 999,
          background: "var(--gold)",
          color: "#1A1714",
          fontSize: 10,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: 0,
          animation: `st-coin-arc 1.0s cubic-bezier(0.5,0,0.7,1) ${delay}s forwards`,
          boxShadow: "0 0 8px rgba(222,168,49,0.4)",
        }}
      >
        S
      </div>
    ))}
  </>
);

/* ── Scene 3: Claim ── */
const Claim = () => (
  <>
    <style>{KF}</style>

    {/* Your share card centered */}
    <div
      className="card"
      style={{
        position: "absolute",
        left: 200,
        top: 40,
        width: 240,
        padding: 16,
        opacity: 0,
        animation: "st-fade-up 0.4s ease-out 0.1s forwards",
      }}
    >
      <div className="hstack" style={{ marginBottom: 8 }}>
        <div className="eyebrow" style={{ fontSize: 10 }}>
          Your share
        </div>
        <div className="spacer" />
        <span className="pill verified" style={{ fontSize: 9, padding: "1px 7px" }}>
          1mo · 1.3x
        </span>
      </div>

      <div className="serif" style={{ fontSize: 30, lineHeight: 1, marginBottom: 4 }}>
        0.45
        <span className="mono" style={{ fontSize: 13, color: "var(--text-3)", marginLeft: 6 }}>
          SOL
        </span>
      </div>
      <div className="text-micro" style={{ fontSize: 11, marginBottom: 10 }}>
        ready to withdraw
      </div>

      <div
        className="btn-primary"
        style={{
          height: 32,
          fontSize: 12,
          justifyContent: "center",
          display: "flex",
          alignItems: "center",
          gap: 6,
          animation: "st-pulse-btn 1.4s ease-in-out 1.5s infinite",
        }}
      >
        Claim 0.45 SOL
      </div>
    </div>

    {/* Wallet pill */}
    <div
      style={{
        position: "absolute",
        right: 50,
        top: 28,
        padding: "8px 12px",
        borderRadius: 10,
        border: "1.5px solid var(--border-strong)",
        background: "var(--bg-elev)",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <div className="text-micro mono" style={{ fontSize: 9 }}>
        WALLET
      </div>
      <span
        className="serif"
        style={{
          fontSize: 16,
          opacity: 0,
          display: "inline-block",
          animation: "st-pop 0.45s ease-out 4.2s forwards",
          color: "var(--gold)",
        }}
      >
        + 0.45
      </span>
      <span className="mono text-micro" style={{ fontSize: 9 }}>
        SOL
      </span>
    </div>

    {/* Cursor */}
    <div
      style={{
        position: "absolute",
        animation: "st-cursor-claim 3.6s ease-out 0.4s forwards",
        opacity: 0,
        pointerEvents: "none",
      }}
    >
      <svg width="18" height="20" viewBox="0 0 24 26">
        <path
          d="M3 3l7 18 3-7 7-3z"
          fill="#F2E9C8"
          stroke="#1A1714"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>

    {/* Coins to wallet */}
    {[3.8, 4.05, 4.3].map((delay, i) => (
      <div
        key={i}
        style={{
          position: "absolute",
          width: 20,
          height: 20,
          borderRadius: 999,
          background: "var(--gold)",
          color: "#1A1714",
          fontSize: 10,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: 0,
          animation: `st-coin-claim 1.2s cubic-bezier(0.4,0,0.4,1) ${delay}s forwards`,
          boxShadow: "0 0 10px rgba(222,168,49,0.5)",
        }}
      >
        S
      </div>
    ))}
  </>
);

const SCENES: TutorialScene[] = [
  {
    id: "stake",
    title: "Pick a lock, stake",
    caption: "Longer locks earn a higher multiplier. NFT stays in your wallet — frozen, non-transferable.",
    render: () => <Stake />,
  },
  {
    id: "earn",
    title: "Royalties accrue",
    caption: "10% of every secondary sale streams to stakers, weighted by lock multiplier",
    render: () => <Earn />,
  },
  {
    id: "claim",
    title: "Claim in SOL",
    caption: "Withdraw anytime. Unstake later, unclaimed rewards stay yours.",
    render: () => <Claim />,
  },
];

export default function StakeTutorial() {
  return <TutorialPlayer eyebrow="How staking works" scenes={SCENES} sceneMs={6500} />;
}
