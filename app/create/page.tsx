"use client";

import { useState } from "react";

/* ── Icons ── */
function I({ name, size = 16 }: { name: string; size?: number }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "rocket": return <svg {...p}><path d="M14 4c4 0 6 2 6 6l-8 8-3-3 8-8c-4 0-6-2-6-3z"/><path d="M7 14l-3 3 3 3 3-3"/><circle cx="15" cy="9" r="1.2"/></svg>;
    case "arrow-right": return <svg {...p}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
    case "check": return <svg {...p}><path d="M4 12l5 5 11-12"/></svg>;
    case "palette": return <svg {...p}><path d="M12 3a9 9 0 1 0 0 18 3 3 0 0 0 0-6h-1a3 3 0 0 1 0-6h3a6 6 0 0 0-2-6z"/><circle cx="7.5" cy="10.5" r="1"/><circle cx="12" cy="7.5" r="1"/><circle cx="16.5" cy="10.5" r="1"/></svg>;
    case "upload": return <svg {...p}><path d="M12 16V4M6 10l6-6 6 6M4 20h16"/></svg>;
    case "plus": return <svg {...p}><path d="M12 5v14M5 12h14"/></svg>;
    case "clock": return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    default: return null;
  }
}

function RugTile({ v = 1, glyph }: { v?: number; glyph?: string }) {
  return <div className={`rug-tile ${v > 1 ? `v${v}` : ""}`}>{glyph && <span className="glyph">{glyph}</span>}</div>;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>{label}</div>
      {children}
      {hint && <div className="text-micro" style={{ marginTop: 6 }}>{hint}</div>}
    </div>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "11px 14px", color: "var(--text)", fontSize: 13.5, fontFamily: "inherit", outline: "none", ...((props.style as object) || {}) }} />;
}

/* ── Steps ── */
function Step1() {
  return (
    <>
      <div className="h2 serif" style={{ fontWeight: 400, marginBottom: 18 }}>Collection details</div>
      <Field label="Name"><TextInput defaultValue="Serpent Garden" /></Field>
      <Field label="Symbol" hint="3-6 letters. On-chain ticker for this collection."><TextInput defaultValue="SERP" /></Field>
      <Field label="Creator handle"><TextInput defaultValue="sultan.eth" /></Field>
      <Field label="Description">
        <textarea defaultValue="A meditation on the knotted geometry of Ottoman prayer rugs." rows={3} style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "11px 14px", color: "var(--text)", fontSize: 13.5, fontFamily: "inherit", outline: "none", resize: "vertical" }} />
      </Field>
    </>
  );
}

function Step2() {
  return (
    <>
      <div className="h2 serif" style={{ fontWeight: 400, marginBottom: 18 }}>Supply &amp; traits</div>
      <Field label="Total supply"><TextInput type="number" defaultValue="3333" /></Field>
      <Field label="Art source" hint="Generate unique outputs in Studio, or upload a ZIP of ready images.">
        <div className="hstack" style={{ gap: 10 }}>
          <button className="chip-btn" style={{ flex: 1, justifyContent: "center" }}><I name="palette" size={14} />Use Studio (6 layers)</button>
          <button className="chip-btn ghost" style={{ flex: 1, justifyContent: "center" }}><I name="upload" size={14} />Upload ZIP</button>
        </div>
      </Field>
      <Field label="1/1 reserved slots" hint="Special pieces you'll mint yourself before public sale."><TextInput type="number" defaultValue="5" /></Field>
    </>
  );
}

function Step3() {
  return (
    <>
      <div className="h2 serif" style={{ fontWeight: 400, marginBottom: 18 }}>Mint phases</div>
      {[
        { name: "Pre-mint", pr: "0.3", when: "Apr 22 15:00 UTC", tag: "Allowlist" },
        { name: "Public", pr: "0.5", when: "Apr 24 18:00 UTC", tag: "Open" },
      ].map((ph, i) => (
        <div key={i} className="card pad" style={{ marginBottom: 10, padding: 16 }}>
          <div className="hstack">
            <I name="clock" size={14} />
            <span style={{ fontWeight: 600, fontSize: 14 }}>{ph.name}</span>
            <span className="pill upcoming" style={{ marginLeft: 8 }}>{ph.tag}</span>
            <div className="spacer" />
            <span className="mono" style={{ fontSize: 12 }}>◎ {ph.pr}</span>
          </div>
          <div className="text-micro mono" style={{ marginTop: 6 }}>{ph.when}</div>
        </div>
      ))}
      <button className="chip-btn ghost" style={{ width: "100%", justifyContent: "center" }}><I name="plus" size={14} />Add phase</button>
    </>
  );
}

function Step4() {
  const [share, setShare] = useState(80);
  return (
    <>
      <div className="h2 serif" style={{ fontWeight: 400, marginBottom: 18 }}>Royalty split</div>
      <Field label="Total royalty on secondary sales"><TextInput defaultValue="10%" /></Field>
      <Field label={`Stakers receive ${share}%`} hint="The rest goes to the creator. Campfire keeps 2% platform fee.">
        <input type="range" min={0} max={98} value={share} onChange={(e) => setShare(+e.target.value)} style={{ width: "100%", accentColor: "var(--accent)" }} />
        <div className="hstack" style={{ justifyContent: "space-between", fontSize: 12, color: "var(--text-2)", marginTop: 10 }}>
          <span><span style={{ width: 10, height: 10, background: "var(--accent)", display: "inline-block", marginRight: 6, borderRadius: 2 }} />Stakers {share}%</span>
          <span>Creator {98 - share}%</span>
          <span>Platform 2%</span>
        </div>
      </Field>
    </>
  );
}

function Step5() {
  return (
    <>
      <div className="h2 serif" style={{ fontWeight: 400, marginBottom: 18 }}>Review &amp; launch</div>
      {[
        { k: "Collection", v: "Serpent Garden · SERP" },
        { k: "Supply", v: "3,333 (5 reserved 1/1s)" },
        { k: "Public mint", v: "◎ 0.5 · Apr 24 18:00 UTC" },
        { k: "Royalty", v: "10% · 80% to stakers / 18% creator / 2% platform" },
        { k: "Launch fee", v: "1 ◎ to treasury" },
      ].map((r) => (
        <div key={r.k} className="hstack" style={{ padding: "12px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
          <span style={{ color: "var(--text-3)", width: 140 }}>{r.k}</span>
          <span>{r.v}</span>
        </div>
      ))}
    </>
  );
}

/* ── Page ── */
export default function CreatePage() {
  const [step, setStep] = useState(1);
  const steps = ["Collection", "Supply & Traits", "Mint phases", "Royalties", "Review & Launch"];

  return (
    <div className="page-content">
      <div className="eyebrow">Create a launch</div>
      <h1 className="h-display" style={{ fontSize: 56, marginTop: 8 }}>Launch your collection.</h1>
      <p className="text-muted" style={{ marginTop: 10, maxWidth: 520, lineHeight: 1.6 }}>
        Permissionless. 1 SOL launch fee. Royalty-share vault is attached automatically.
      </p>

      {/* Stepper */}
      <div className="hstack" style={{ gap: 0, marginTop: 36, marginBottom: 28, border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
        {steps.map((s, i) => {
          const n = i + 1;
          const done = n < step;
          const active = n === step;
          return (
            <button key={s} onClick={() => setStep(n)}
              style={{ flex: 1, padding: "14px 18px", textAlign: "left", background: active ? "var(--surface)" : "transparent", borderRight: i < steps.length - 1 ? "1px solid var(--border)" : "none", color: active ? "var(--text)" : done ? "var(--text-2)" : "var(--text-3)", border: "none", cursor: "pointer" }}>
              <div className="hstack" style={{ gap: 10 }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: done ? "var(--accent)" : active ? "transparent" : "var(--surface)", border: active ? "1.5px solid var(--accent)" : "none", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 600, fontFamily: "JetBrains Mono", color: done ? "#fff" : active ? "var(--accent)" : "var(--text-3)" }}>
                  {done ? <I name="check" size={12} /> : n}
                </div>
                <span style={{ fontSize: 13, fontWeight: active ? 600 : 500 }}>{s}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 28 }}>
        <div className="card pad-lg">
          {step === 1 && <Step1 />}
          {step === 2 && <Step2 />}
          {step === 3 && <Step3 />}
          {step === 4 && <Step4 />}
          {step === 5 && <Step5 />}

          <div className="hstack" style={{ marginTop: 28, paddingTop: 18, borderTop: "1px solid var(--border)" }}>
            <button className="btn-ghost" disabled={step === 1} style={{ opacity: step === 1 ? 0.4 : 1 }} onClick={() => setStep(Math.max(1, step - 1))}>Back</button>
            <div className="spacer" />
            {step < steps.length ? (
              <button className="btn-primary" onClick={() => setStep(step + 1)}>Continue <I name="arrow-right" size={14} /></button>
            ) : (
              <button className="btn-primary"><I name="rocket" size={14} />Launch collection · 1 SOL</button>
            )}
          </div>
        </div>

        {/* Live preview */}
        <div style={{ position: "sticky", top: 24, alignSelf: "start" }}>
          <div className="text-micro mono" style={{ marginBottom: 10 }}>LIVE PREVIEW</div>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <RugTile v={3} glyph="N" />
            <div style={{ padding: 18 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>New Collection</div>
              <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 2 }}>by you.sol</div>
              <div className="hstack" style={{ marginTop: 12, fontSize: 12, justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-3)" }}>Price</span><span className="mono">◎ 0.5</span>
              </div>
              <div className="hstack" style={{ marginTop: 6, fontSize: 12, justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-3)" }}>Supply</span><span className="mono">3,333</span>
              </div>
              <div className="hstack" style={{ marginTop: 6, fontSize: 12, justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-3)" }}>Stakers share</span><span className="mono text-accent">80%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
