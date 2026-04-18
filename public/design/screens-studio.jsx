// screens-studio.jsx — Studio art generator + Create launch wizard

const { Icon, RugTile } = window;

function StudioScreen() {
  const [layers, setLayers] = React.useState([
    { name: "Background", traits: [{n:"Indigo", w: 40},{n:"Rust", w: 30},{n:"Oat", w: 30}], open: true },
    { name: "Field",      traits: [{n:"Serpent", w: 20},{n:"Lattice", w: 35},{n:"Plain", w: 45}], open: true },
    { name: "Border",     traits: [{n:"Meander", w: 25},{n:"Key", w: 30},{n:"Scroll", w: 45}], open: false },
    { name: "Medallion",  traits: [{n:"Double star", w: 15},{n:"Quatrefoil", w: 35},{n:"Sunburst", w: 50}], open: false },
    { name: "Corners",    traits: [{n:"Tulip", w: 20},{n:"Knot", w: 30},{n:"None", w: 50}], open: false },
    { name: "Fringe",     traits: [{n:"Gilded", w: 15},{n:"Plain", w: 85}], open: false },
  ]);
  const [selected, setSelected] = React.useState(0);
  const [supply, setSupply] = React.useState(5000);
  const total = layers.reduce((a, l) => a * l.traits.length, 1);

  return (
    <div className="screen" style={{ display: "grid", gridTemplateColumns: "320px 1fr 320px", height: "100%" }}>
      {/* Left: Layers */}
      <aside style={{ borderRight: "1px solid var(--border)", overflowY: "auto", padding: "22px 18px" }}>
        <div className="hstack" style={{ marginBottom: 14 }}>
          <Icon name="layers" size={16} />
          <span style={{ fontWeight: 600, fontSize: 14 }}>Layers</span>
          <div className="spacer" />
          <button className="icon-btn" style={{ width: 28, height: 28 }}><Icon name="plus" size={13} /></button>
        </div>

        {layers.map((l, i) => (
          <div key={l.name} style={{ marginBottom: 6 }}>
            <button className={`nav-item ${selected === i ? "active" : ""}`} onClick={() => setSelected(i)} style={{ padding: "8px 10px" }}>
              <Icon name="image" size={14} />
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
                  <Icon name="upload" size={12} />Add traits
                </button>
              </div>
            )}
          </div>
        ))}

        <div className="divider" />

        <div className="card pad" style={{ padding: 14 }}>
          <div className="micro mono">MAX COMBINATIONS</div>
          <div style={{ fontFamily: "Fraunces", fontSize: 24, marginTop: 6 }}>{total.toLocaleString()}</div>
          <div className="micro" style={{ marginTop: 4 }}>from {layers.reduce((a, l) => a + l.traits.length, 0)} traits across {layers.length} layers</div>
        </div>
      </aside>

      {/* Canvas */}
      <div style={{ overflowY: "auto", background: "var(--bg-elev)", padding: 28 }}>
        <div className="hstack" style={{ marginBottom: 16 }}>
          <div className="eyebrow">Preview grid</div>
          <div className="spacer" />
          <div className="hstack" style={{ gap: 6 }}>
            <button className="chip-btn"><Icon name="sparkle" size={14} />Regenerate</button>
            <button className="chip-btn ghost"><Icon name="download" size={14} />Export samples</button>
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

      {/* Right: Properties / Generate */}
      <aside style={{ borderLeft: "1px solid var(--border)", overflowY: "auto", padding: "22px 18px" }}>
        <div className="hstack" style={{ marginBottom: 14 }}>
          <Icon name="settings" size={15} />
          <span style={{ fontWeight: 600, fontSize: 14 }}>Generation</span>
        </div>

        <div style={{ fontSize: 12, color: "var(--text-2)" }}>Collection size</div>
        <div style={{ fontFamily: "Fraunces", fontSize: 32, margin: "6px 0 4px" }}>{supply.toLocaleString()}</div>
        <input type="range" min={100} max={10000} step={100} value={supply} onChange={e => setSupply(+e.target.value)} style={{ width: "100%", accentColor: "var(--accent)" }} />
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
              <div style={{ fontFamily: "Fraunces", fontSize: 18 }}>3 of 5</div>
              <div className="micro">reserved slots</div>
            </div>
            <div className="spacer" />
            <button className="chip-btn"><Icon name="plus" size={13} />Add</button>
          </div>
        </div>

        <div className="divider" />

        <div className="card pad" style={{ padding: 14, background: "var(--accent-soft)", border: "1px solid var(--accent-line)" }}>
          <div className="hstack" style={{ gap: 8, marginBottom: 6 }}>
            <Icon name="sparkle" size={14} style={{ color: "var(--accent)" }} />
            <span style={{ fontWeight: 600, fontSize: 13 }}>Ready to generate</span>
          </div>
          <div className="micro" style={{ marginBottom: 10 }}>Estimated time: 42s · Upload: ~0.18 ◎</div>
          <button className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
            <Icon name="sparkle" size={14} />Generate {supply.toLocaleString()} NFTs
          </button>
        </div>
      </aside>
    </div>
  );
}

function CreateScreen() {
  const [step, setStep] = React.useState(1);
  const steps = ["Collection", "Supply & Traits", "Mint phases", "Royalties", "Review & Launch"];

  return (
    <div className="screen page">
      <div className="eyebrow">Create a launch</div>
      <h1 className="h-display" style={{ fontSize: 56, marginTop: 8 }}>Launch your collection.</h1>
      <p className="muted" style={{ marginTop: 10, maxWidth: 520, lineHeight: 1.6 }}>
        Permissionless. 1 ◎ launch fee. Royalty-share vault is attached automatically.
      </p>

      {/* Stepper */}
      <div className="hstack" style={{ gap: 0, marginTop: 36, marginBottom: 28, border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
        {steps.map((s, i) => {
          const n = i + 1;
          const done = n < step, active = n === step;
          return (
            <button key={s} onClick={() => setStep(n)}
              style={{ flex: 1, padding: "14px 18px", textAlign: "left", background: active ? "var(--surface)" : "transparent", borderRight: i < steps.length - 1 ? "1px solid var(--border)" : "none", color: active ? "var(--text)" : done ? "var(--text-2)" : "var(--text-3)", border: "none", cursor: "pointer" }}>
              <div className="hstack" style={{ gap: 10 }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: done ? "var(--accent)" : active ? "transparent" : "var(--surface)", border: active ? "1.5px solid var(--accent)" : "none", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 600, fontFamily: "JetBrains Mono", color: done ? "#fff" : active ? "var(--accent)" : "var(--text-3)" }}>
                  {done ? <Icon name="check" size={12} /> : n}
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
            <button className="btn-ghost" disabled={step === 1} onClick={() => setStep(Math.max(1, step - 1))}>Back</button>
            <div className="spacer" />
            {step < steps.length
              ? <button className="btn-primary" onClick={() => setStep(step + 1)}>Continue<Icon name="arrow-right" size={14} /></button>
              : <button className="btn-primary"><Icon name="rocket" size={14} />Launch collection · 1 ◎</button>}
          </div>
        </div>

        {/* Live preview */}
        <div style={{ position: "sticky", top: 24, alignSelf: "start" }}>
          <div className="micro mono" style={{ marginBottom: 10 }}>LIVE PREVIEW</div>
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
                <span style={{ color: "var(--text-3)" }}>Stakers share</span><span className="mono" style={{ color: "var(--accent)" }}>80%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>{label}</div>
      {children}
      {hint && <div className="micro" style={{ marginTop: 6 }}>{hint}</div>}
    </div>
  );
}
function TextInput(props) {
  return <input {...props} style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "11px 14px", color: "var(--text)", fontSize: 13.5, fontFamily: "inherit", outline: "none", ...(props.style || {}) }} />;
}
function Step1() {
  return (
    <>
      <div className="h2 serif" style={{ fontWeight: 400, marginBottom: 18 }}>Collection details</div>
      <Field label="Name"><TextInput defaultValue="Serpent Garden" /></Field>
      <Field label="Symbol" hint="3–6 letters. On-chain ticker for this collection."><TextInput defaultValue="SERP" /></Field>
      <Field label="Creator handle"><TextInput defaultValue="sultan.eth" /></Field>
      <Field label="Description"><textarea defaultValue="A meditation on the knotted geometry of Ottoman prayer rugs." rows={3} style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "11px 14px", color: "var(--text)", fontSize: 13.5, fontFamily: "inherit", outline: "none", resize: "vertical" }} /></Field>
    </>
  );
}
function Step2() {
  return (
    <>
      <div className="h2 serif" style={{ fontWeight: 400, marginBottom: 18 }}>Supply & traits</div>
      <Field label="Total supply"><TextInput type="number" defaultValue="3333" /></Field>
      <Field label="Art source" hint="Generate unique outputs in Studio, or upload a ZIP of ready images.">
        <div className="hstack" style={{ gap: 10 }}>
          <button className="chip-btn" style={{ flex: 1, justifyContent: "center" }}><Icon name="palette" size={14} />Use Studio (6 layers)</button>
          <button className="chip-btn ghost" style={{ flex: 1, justifyContent: "center" }}><Icon name="upload" size={14} />Upload ZIP</button>
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
        { name: "Pre-mint", pr: "0.3", when: "Apr 22 · 15:00 UTC", tag: "Allowlist" },
        { name: "Public",   pr: "0.5", when: "Apr 24 · 18:00 UTC", tag: "Open" },
      ].map((p, i) => (
        <div key={i} className="card pad" style={{ marginBottom: 10, padding: 16 }}>
          <div className="hstack">
            <Icon name="clock" size={14} />
            <span style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</span>
            <span className="pill upcoming" style={{ marginLeft: 8 }}>{p.tag}</span>
            <div className="spacer" />
            <span className="mono" style={{ fontSize: 12 }}>◎ {p.pr}</span>
          </div>
          <div className="micro mono" style={{ marginTop: 6 }}>{p.when}</div>
        </div>
      ))}
      <button className="chip-btn ghost" style={{ width: "100%", justifyContent: "center" }}><Icon name="plus" size={14} />Add phase</button>
    </>
  );
}
function Step4() {
  const [share, setShare] = React.useState(80);
  return (
    <>
      <div className="h2 serif" style={{ fontWeight: 400, marginBottom: 18 }}>Royalty split</div>
      <Field label="Total royalty on secondary sales"><TextInput defaultValue="10%" /></Field>
      <Field label={`Stakers receive ${share}%`} hint="The rest goes to the creator. Rug.World keeps 2% platform fee.">
        <input type="range" min={0} max={98} value={share} onChange={e => setShare(+e.target.value)} style={{ width: "100%", accentColor: "var(--accent)" }} />
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
      <div className="h2 serif" style={{ fontWeight: 400, marginBottom: 18 }}>Review & launch</div>
      {[
        { k: "Collection", v: "Serpent Garden · SERP" },
        { k: "Supply",     v: "3,333 (5 reserved 1/1s)" },
        { k: "Public mint",v: "◎ 0.5 · Apr 24 18:00 UTC" },
        { k: "Royalty",    v: "10% · 80% to stakers / 18% creator / 2% platform" },
        { k: "Launch fee", v: "1 ◎ to treasury" },
      ].map(r => (
        <div key={r.k} className="hstack" style={{ padding: "12px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
          <span style={{ color: "var(--text-3)", width: 140 }}>{r.k}</span>
          <span>{r.v}</span>
        </div>
      ))}
    </>
  );
}

Object.assign(window, { StudioScreen, CreateScreen });
