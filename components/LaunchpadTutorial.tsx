"use client";

import { TutorialPlayer, type TutorialScene } from "./TutorialPlayer";

const KF = `
@keyframes lt-card-drop {
  0%   { opacity: 0; transform: translateY(-22px) scale(0.96); }
  60%  { opacity: 1; transform: translateY(3px) scale(1.005); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes lt-fade-in    { from { opacity: 0; } to { opacity: 1; } }
@keyframes lt-fade-up    { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes lt-pop        { 0% { opacity: 0; transform: scale(0.55); } 60% { opacity: 1; transform: scale(1.12); } 100% { opacity: 1; transform: scale(1); } }
@keyframes lt-pulse-btn  { 0%, 100% { box-shadow: 0 0 0 0 rgba(201,98,101,0.55); } 50% { box-shadow: 0 0 0 12px rgba(201,98,101,0); } }
@keyframes lt-cursor-hover {
  0%   { opacity: 0; left: 540px; top: 230px; }
  20%  { opacity: 1; }
  85%  { opacity: 1; left: 320px; top: 145px; }
  100% { opacity: 1; left: 320px; top: 145px; }
}
@keyframes lt-card-hover {
  0%, 55% { box-shadow: 0 4px 12px rgba(0,0,0,0.18); transform: translateY(0); }
  100%    { box-shadow: 0 16px 36px rgba(0,0,0,0.32); transform: translateY(-2px); }
}
@keyframes lt-cursor-mint {
  0%   { opacity: 0; left: 540px; top: 260px; transform: scale(1); }
  18%  { opacity: 1; }
  55%  { opacity: 1; left: 425px; top: 152px; transform: scale(1); }
  62%  { transform: scale(0.82); }
  72%  { transform: scale(1); }
  100% { opacity: 0; left: 425px; top: 152px; transform: scale(1); }
}
@keyframes lt-token-fly {
  0%   { opacity: 0; left: 110px; top: 95px; transform: scale(0.5); }
  16%  { opacity: 1; transform: scale(1.15); }
  28%  { transform: scale(1); }
  100% { opacity: 0; left: 700px; top: -60px; transform: scale(0.4) rotate(18deg); }
}
@keyframes lt-progress-grow {
  0%   { width: 24%; }
  100% { width: 27.4%; }
}
@keyframes lt-spark {
  0%   { opacity: 0; transform: translate(0, 0) scale(0); }
  40%  { opacity: 1; transform: translate(var(--dx), var(--dy)) scale(1); }
  100% { opacity: 0; transform: translate(calc(var(--dx) * 1.4), calc(var(--dy) * 1.4)) scale(0.4); }
}
@keyframes lt-card-pop-in {
  0%   { opacity: 0; transform: scale(0.7); }
  60%  { opacity: 1; transform: scale(1.04); }
  100% { opacity: 1; transform: scale(1); }
}
`;

/* ── Scene 1: Browse drops ── */
const Browse = () => (
  <>
    <style>{KF}</style>

    <div
      style={{
        position: "absolute",
        left: 100,
        top: 32,
        opacity: 0,
        animation: "lt-fade-up 0.4s ease-out 0.1s forwards",
      }}
    >
      <div className="eyebrow" style={{ fontSize: 10 }}>
        Launchpad
      </div>
      <div className="serif" style={{ fontSize: 26, fontWeight: 400, marginTop: 4 }}>
        Drops
      </div>
    </div>

    <div
      className="card"
      style={{
        position: "absolute",
        left: 100,
        top: 100,
        width: 440,
        padding: 0,
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        gap: 0,
        opacity: 0,
        overflow: "hidden",
        animation:
          "lt-card-drop 0.55s cubic-bezier(0.2,0.7,0.3,1) 0.4s forwards, lt-card-hover 0.4s ease-out 1.8s forwards",
      }}
    >
      <div style={{ width: 110, height: 110, overflow: "hidden", borderRadius: "12px 0 0 12px" }}>
        <img src="/sneak1.png" alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 6 }}>
        <div className="hstack" style={{ gap: 6 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>BOIS</span>
          <span className="text-accent" style={{ fontSize: 11 }}>&#10003;</span>
          <div className="spacer" />
          <span className="pill upcoming" style={{ fontSize: 9, padding: "2px 8px" }}>
            Mint not started
          </span>
        </div>
        <p style={{ fontSize: 11.5, color: "var(--text-2)", lineHeight: 1.45 }}>
          The first collection on Campfire. 1,000 supply. 10% royalty, all to stakers.
        </p>
        <div className="hstack" style={{ gap: 14, fontSize: 11 }}>
          <span>
            <span className="mono">1,000</span>{" "}
            <span style={{ color: "var(--text-3)" }}>supply</span>
          </span>
          <span>
            <span className="mono text-accent">100%</span>{" "}
            <span style={{ color: "var(--text-3)" }}>to stakers</span>
          </span>
          <span>
            <span className="mono">10%</span>{" "}
            <span style={{ color: "var(--text-3)" }}>royalty</span>
          </span>
        </div>
      </div>
    </div>

    <div
      style={{
        position: "absolute",
        animation: "lt-cursor-hover 1.6s ease-out 0.5s forwards",
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

/* ── Scene 2: Mint with phases ── */
const PHASES = [
  { name: "Allowlist", state: "done", count: "100/100" },
  { name: "Public", state: "live", count: "247/900" },
  { name: "Sold out", state: "future", count: "" },
];

const Mint = () => (
  <>
    <style>{KF}</style>

    {/* Left: image */}
    <div
      className="card"
      style={{
        position: "absolute",
        left: 50,
        top: 35,
        width: 130,
        height: 130,
        padding: 0,
        overflow: "hidden",
        opacity: 0,
        animation: "lt-fade-up 0.4s ease-out 0.1s forwards",
      }}
    >
      <img src="/sneak1.png" alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </div>

    {/* Right: mint widget with phases */}
    <div
      className="card"
      style={{
        position: "absolute",
        left: 200,
        top: 28,
        width: 380,
        padding: 14,
        opacity: 0,
        animation: "lt-fade-up 0.4s ease-out 0.25s forwards",
      }}
    >
      <div className="hstack" style={{ gap: 8 }}>
        <span style={{ fontSize: 16, fontWeight: 700 }}>BOIS</span>
        <span className="pill live" style={{ fontSize: 9, padding: "2px 7px" }}>
          Minting now
        </span>
        <div className="spacer" />
        <span className="mono text-micro" style={{ fontSize: 9 }}>
          ◎ 0.8 each
        </span>
      </div>

      {/* Phase chips */}
      <div className="hstack" style={{ gap: 4, marginTop: 10, flexWrap: "wrap" }}>
        {PHASES.map((p) => {
          const styles =
            p.state === "done"
              ? {
                  background: "var(--surface)",
                  color: "var(--text-3)",
                  border: "1px solid var(--border)",
                }
              : p.state === "live"
              ? {
                  background: "var(--accent-soft)",
                  color: "var(--accent)",
                  border: "1px solid var(--accent-line)",
                }
              : {
                  background: "transparent",
                  color: "var(--text-3)",
                  border: "1px dashed var(--border)",
                };
          return (
            <div
              key={p.name}
              style={{
                padding: "3px 9px",
                borderRadius: 6,
                fontSize: 10,
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                ...styles,
              }}
            >
              {p.state === "done" && <span style={{ fontSize: 9 }}>✓</span>}
              {p.state === "live" && (
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 999,
                    background: "var(--accent)",
                    boxShadow: "0 0 0 3px rgba(201,98,101,0.25)",
                  }}
                />
              )}
              <span>{p.name}</span>
              {p.count && (
                <span
                  className="mono"
                  style={{ fontSize: 9, opacity: 0.7, fontWeight: 500 }}
                >
                  {p.count}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress */}
      <div style={{ marginTop: 10 }}>
        <div className="progress">
          <span style={{ width: "27.4%", animation: "lt-progress-grow 4.5s ease-out forwards" }} />
        </div>
        <div className="hstack" style={{ justifyContent: "space-between", marginTop: 6 }}>
          <span className="mono" style={{ fontSize: 11 }}>
            247 / 900 minted
          </span>
          <span className="mono text-accent" style={{ fontSize: 11 }}>
            27.4%
          </span>
        </div>
      </div>

      {/* Qty + Mint */}
      <div className="hstack" style={{ gap: 8, marginTop: 12 }}>
        <div
          className="hstack"
          style={{
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: 1,
            gap: 0,
          }}
        >
          <span className="mono" style={{ width: 22, height: 26, display: "grid", placeItems: "center", fontSize: 12, color: "var(--text-3)" }}>
            −
          </span>
          <span
            className="mono"
            style={{ width: 28, height: 26, display: "grid", placeItems: "center", fontSize: 12 }}
          >
            1
          </span>
          <span className="mono" style={{ width: 22, height: 26, display: "grid", placeItems: "center", fontSize: 12, color: "var(--text-3)" }}>
            +
          </span>
        </div>
        <div
          className="btn-primary"
          style={{
            flex: 1,
            height: 32,
            fontSize: 12,
            justifyContent: "center",
            display: "flex",
            alignItems: "center",
            gap: 6,
            animation: "lt-pulse-btn 1.4s ease-in-out 2.2s infinite",
          }}
        >
          Mint 1 for ◎ 0.8
        </div>
      </div>
    </div>

    {/* Cursor */}
    <div
      style={{
        position: "absolute",
        animation: "lt-cursor-mint 3.2s ease-out 0.4s forwards",
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

    {/* Token flies to wallet */}
    <div
      style={{
        position: "absolute",
        width: 36,
        height: 36,
        borderRadius: 8,
        overflow: "hidden",
        border: "1px solid rgba(237,227,188,0.18)",
        opacity: 0,
        boxShadow: "0 0 22px rgba(201,98,101,0.55)",
        animation: "lt-token-fly 1.6s cubic-bezier(0.4,0,0.4,1) 3.3s forwards",
      }}
    >
      <img src="/sneak1.png" alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </div>
  </>
);

/* ── Scene 3: Just minted (owned in wallet) ── */
const Owned = () => {
  // Sparks around the freshly-minted card
  const sparks = [
    { dx: -60, dy: -40, delay: 0.85 },
    { dx: 70, dy: -30, delay: 0.95 },
    { dx: -50, dy: 60, delay: 1.0 },
    { dx: 80, dy: 50, delay: 1.1 },
    { dx: 0, dy: -70, delay: 1.05 },
    { dx: 30, dy: 80, delay: 1.2 },
  ];

  return (
    <>
      <style>{KF}</style>

      {/* Wallet header bar */}
      <div
        style={{
          position: "absolute",
          left: 60,
          right: 60,
          top: 22,
          opacity: 0,
          animation: "lt-fade-up 0.4s ease-out 0.15s forwards",
        }}
      >
        <div className="hstack">
          <div className="eyebrow" style={{ fontSize: 10 }}>
            Your wallet
          </div>
          <div className="spacer" />
          <span className="mono text-micro" style={{ fontSize: 10 }}>
            1 BOIS held
          </span>
        </div>
      </div>

      {/* Centered freshly-minted card */}
      <div
        className="card"
        style={{
          position: "absolute",
          left: 245,
          top: 25,
          width: 150,
          padding: 0,
          overflow: "hidden",
          opacity: 0,
          animation: "lt-card-pop-in 0.55s cubic-bezier(0.2,0.7,0.3,1) 0.5s forwards",
          boxShadow: "0 18px 40px rgba(0,0,0,0.32), 0 0 0 1px var(--accent-line)",
        }}
      >
        <div style={{ width: "100%", aspectRatio: "1/1", overflow: "hidden" }}>
          <img src="/sneak1.png" alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </div>
        <div className="hstack" style={{ padding: "8px 10px", gap: 6 }}>
          <span style={{ fontWeight: 600, fontSize: 12 }}>BOIS</span>
          <span className="mono text-micro" style={{ fontSize: 9 }}>
            #247
          </span>
          <div className="spacer" />
          <span
            className="pill verified"
            style={{
              fontSize: 8,
              padding: "2px 7px",
              opacity: 0,
              animation: "lt-pop 0.45s ease-out 1.0s forwards",
            }}
          >
            JUST MINTED
          </span>
        </div>
      </div>

      {/* Sparks */}
      <div style={{ position: "absolute", left: 320, top: 100 }}>
        {sparks.map((s, i) => (
          <div
            key={i}
            style={
              {
                position: "absolute",
                width: 6,
                height: 6,
                borderRadius: 999,
                background: "var(--gold)",
                boxShadow: "0 0 8px rgba(222,168,49,0.6)",
                opacity: 0,
                "--dx": `${s.dx}px`,
                "--dy": `${s.dy}px`,
                animation: `lt-spark 1.3s ease-out ${s.delay}s forwards`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

    </>
  );
};

const SCENES: TutorialScene[] = [
  {
    id: "browse",
    title: "Browse drops",
    caption: "Each collection has its own page on the launchpad",
    ms: 3500,
    render: () => <Browse />,
  },
  {
    id: "mint",
    title: "Mint",
    caption: "Phases tick through (Allowlist → Public). Choose qty, hit mint.",
    ms: 6500,
    render: () => <Mint />,
  },
  {
    id: "owned",
    title: "It's in your wallet",
    caption: "Hold or stake to earn royalties from secondary sales",
    ms: 4500,
    render: () => <Owned />,
  },
];

export default function LaunchpadTutorial() {
  return <TutorialPlayer eyebrow="How the launchpad works" scenes={SCENES} />;
}
