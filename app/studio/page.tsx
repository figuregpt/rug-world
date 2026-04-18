"use client";

import { useState, useRef, useCallback, type DragEvent, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";

/* ── Icons (from design spec) ── */
function I({ name, size = 16, style }: { name: string; size?: number; style?: React.CSSProperties }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, style };
  switch (name) {
    case "layers": return <svg {...p}><path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5M3 18l9 5 9-5"/></svg>;
    case "image": return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 16l-5-5-8 8"/></svg>;
    case "plus": return <svg {...p}><path d="M12 5v14M5 12h14"/></svg>;
    case "upload": return <svg {...p}><path d="M12 16V4M6 10l6-6 6 6M4 20h16"/></svg>;
    case "download": return <svg {...p}><path d="M12 4v12M6 10l6 6 6-6M4 20h16"/></svg>;
    case "sparkle": return <svg {...p}><path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/></svg>;
    case "settings": return <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>;
    case "x": return <svg {...p}><path d="M6 6l12 12M18 6L6 18"/></svg>;
    case "rocket": return <svg {...p}><path d="M14 4c4 0 6 2 6 6l-8 8-3-3 8-8c-4 0-6-2-6-3z"/><path d="M7 14l-3 3 3 3 3-3"/><circle cx="15" cy="9" r="1.2"/></svg>;
    case "trash": return <svg {...p}><path d="M3 6h18M8 6V4h8v2M5 6v14h14V6"/><path d="M10 10v6M14 10v6"/></svg>;
    default: return null;
  }
}

function RugTile({ v = 1, glyph }: { v?: number; glyph?: string }) {
  return <div className={`rug-tile ${v > 1 ? `v${v}` : ""}`}>{glyph && <span className="glyph">{glyph}</span>}</div>;
}

/* ── Types ── */
type Trait = { id: string; name: string; weight: number; imageUrl?: string };
type Layer = { id: string; name: string; traits: Trait[] };
type GenNFT = { tokenId: number; dna: string; traitPicks: { layerName: string; traitName: string; imageUrl?: string }[] };

function uid() { return Math.random().toString(36).slice(2, 10); }

function hashDNA(parts: string[]): string {
  const s = parts.join("|");
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, "0");
}

function pickWeighted(traits: Trait[]): Trait {
  const total = traits.reduce((s, t) => s + t.weight, 0);
  if (total <= 0) return traits[Math.floor(Math.random() * traits.length)];
  let r = Math.random() * total;
  for (const t of traits) { r -= t.weight; if (r <= 0) return t; }
  return traits[traits.length - 1];
}

export default function StudioPage() {
  const wallet = useWallet();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [layers, setLayers] = useState<Layer[]>([]);
  const [selected, setSelected] = useState<number>(0);
  const [newLayerName, setNewLayerName] = useState("");
  const [supply, setSupply] = useState(5000);
  const [generated, setGenerated] = useState<GenNFT[]>([]);
  const [generating, setGenerating] = useState(false);
  const [collisionCount, setCollisionCount] = useState(0);
  const [colName, setColName] = useState("");
  const [rarityMode, setRarityMode] = useState<"pct" | "exact">("pct");

  const currentLayer = layers[selected] || null;
  const totalTraits = layers.reduce((s, l) => s + l.traits.length, 0);
  const maxCombos = layers.length === 0 ? 0 : layers.reduce((p, l) => p * (l.traits.length || 1), 1);
  const canGenerate = layers.length > 0 && layers.every((l) => l.traits.length > 0);

  const addLayer = () => {
    const name = newLayerName.trim();
    if (!name) return;
    setLayers([...layers, { id: uid(), name, traits: [] }]);
    setSelected(layers.length);
    setNewLayerName("");
  };

  const removeLayer = (idx: number) => {
    setLayers(layers.filter((_, i) => i !== idx));
    if (selected >= layers.length - 1) setSelected(Math.max(0, layers.length - 2));
  };

  const addTraitsFromFiles = (files: FileList | File[]) => {
    if (!currentLayer) return;
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    const newTraits: Trait[] = list.map((file) => ({
      id: uid(),
      name: file.name.replace(/\.[^.]+$/, ""),
      weight: Math.round(100 / (currentLayer.traits.length + list.length)),
      imageUrl: URL.createObjectURL(file),
    }));
    setLayers(layers.map((l, i) => i === selected ? { ...l, traits: [...l.traits, ...newTraits] } : l));
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) { addTraitsFromFiles(e.target.files); e.target.value = ""; }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) addTraitsFromFiles(e.dataTransfer.files);
  };

  const removeTrait = (traitId: string) => {
    setLayers(layers.map((l, i) => i === selected ? { ...l, traits: l.traits.filter((t) => t.id !== traitId) } : l));
  };

  const updateWeight = (traitId: string, val: number) => {
    setLayers(layers.map((l, i) => i === selected ? { ...l, traits: l.traits.map((t) => t.id === traitId ? { ...t, weight: val } : t) } : l));
  };

  const equalizeWeights = () => {
    if (!currentLayer || !currentLayer.traits.length) return;
    const w = +(100 / currentLayer.traits.length).toFixed(1);
    setLayers(layers.map((l, i) => i === selected ? { ...l, traits: l.traits.map((t) => ({ ...t, weight: w })) } : l));
  };

  const runGeneration = useCallback(async () => {
    if (!canGenerate) return;
    setGenerating(true); setGenerated([]); setCollisionCount(0);
    const target = Math.min(supply, maxCombos);
    const seen = new Set<string>();
    const out: GenNFT[] = [];
    let col = 0;
    for (let att = 0; att < target * 30 && out.length < target; att++) {
      const picks = layers.map((l) => pickWeighted(l.traits));
      const dna = hashDNA(picks.map((p) => p.id));
      if (seen.has(dna)) { col++; continue; }
      seen.add(dna);
      out.push({ tokenId: out.length + 1, dna, traitPicks: layers.map((l, i) => ({ layerName: l.name, traitName: picks[i].name, imageUrl: picks[i].imageUrl })) });
      if (out.length % 100 === 0) { setGenerated([...out]); setCollisionCount(col); await new Promise((r) => setTimeout(r, 0)); }
    }
    setGenerated(out); setCollisionCount(col); setGenerating(false);
  }, [canGenerate, supply, maxCombos, layers]);

  const handleLaunch = async () => {
    if (!colName.trim() || !wallet.publicKey) return;
    const payload = {
      name: colName, tagline: "", description: "", supply: generated.length,
      generatedCount: generated.length, oneOfOneCount: 0,
      layerCount: layers.length, traitCount: totalTraits,
      draftOwner: wallet.publicKey.toString(), createdAt: new Date().toISOString(),
    };
    localStorage.setItem("rugworld:collection", JSON.stringify(payload));
    const { idbSet, DRAFT_ASSETS_KEY } = await import("@/lib/draft-store");
    await idbSet(DRAFT_ASSETS_KEY, generated.map((nft) => ({
      tokenId: nft.tokenId, dna: nft.dna, isOneOfOne: false,
      traits: nft.traitPicks.map((t) => ({ layerName: t.layerName, traitName: t.traitName, imageUrl: t.imageUrl })),
    }))).catch(console.error);
    router.push("/create");
  };

  // Wallet gate
  if (!wallet.publicKey) {
    return (
      <div className="page-content" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center", maxWidth: 420 }}>
          <h2 className="h1 serif" style={{ fontWeight: 400, marginBottom: 12 }}>Connect your wallet</h2>
          <p className="text-muted" style={{ lineHeight: 1.6 }}>Connect your wallet to start building a collection.</p>
        </div>
      </div>
    );
  }

  // Compute rarity display values
  const totalWeight = currentLayer?.traits.reduce((s, t) => s + t.weight, 0) || 0;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "320px 1fr 320px", height: "100%" }}>
      <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleFileInput} />

      {/* ═══ LEFT: Layers ═══ */}
      <aside style={{ borderRight: "1px solid var(--border)", overflowY: "auto", padding: "22px 18px" }}>
        <div className="hstack" style={{ marginBottom: 14 }}>
          <I name="layers" size={16} />
          <span style={{ fontWeight: 600, fontSize: 14 }}>Layers</span>
          <div className="spacer" />
          <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => { if (newLayerName.trim()) addLayer(); else document.getElementById("new-layer-input")?.focus(); }}>
            <I name="plus" size={13} />
          </button>
        </div>

        {/* New layer input */}
        <div className="hstack" style={{ gap: 6, marginBottom: 14 }}>
          <input
            id="new-layer-input"
            value={newLayerName}
            onChange={(e) => setNewLayerName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addLayer()}
            placeholder="New layer name..."
            style={{ flex: 1, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px", color: "var(--text)", fontSize: 12, outline: "none" }}
          />
        </div>

        {layers.length === 0 && (
          <div style={{ padding: "32px 0", textAlign: "center" }}>
            <p className="text-micro">No layers yet. Type a name above and press enter.</p>
          </div>
        )}

        {layers.map((l, i) => (
          <div key={l.id} style={{ marginBottom: 4 }}>
            <button className={`nav-item ${selected === i ? "active" : ""}`} onClick={() => setSelected(i)} style={{ padding: "8px 10px" }}>
              <I name="image" size={14} />
              <span>{l.name}</span>
              <span className="badge">{l.traits.length}</span>
            </button>
            {selected === i && (
              <div style={{ marginLeft: 18, marginTop: 4, paddingLeft: 10, borderLeft: "1px solid var(--border)" }}>
                {l.traits.map((t) => {
                  const pctValue = totalWeight > 0 ? ((t.weight / totalWeight) * 100).toFixed(1) : "0";
                  const exactValue = totalWeight > 0 ? Math.round((t.weight / totalWeight) * supply) : 0;
                  return (
                    <div key={t.id} className="hstack" style={{ padding: "5px 6px", fontSize: 12, color: "var(--text-2)", gap: 6 }}>
                      {t.imageUrl && <img src={t.imageUrl} alt="" style={{ width: 20, height: 20, borderRadius: 4, objectFit: "cover", flexShrink: 0 }} />}
                      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</span>
                      <input
                        type="number" min={0}
                        value={rarityMode === "pct" ? t.weight : exactValue}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value) || 0;
                          if (rarityMode === "exact") {
                            // convert exact count back to weight
                            updateWeight(t.id, supply > 0 ? (v / supply) * 100 : 0);
                          } else {
                            updateWeight(t.id, v);
                          }
                        }}
                        className="mono"
                        style={{ width: 44, background: "transparent", border: "none", borderBottom: "1px solid var(--border)", padding: "2px 0", color: "var(--text-3)", fontSize: 11, textAlign: "right", outline: "none" }}
                      />
                      <span className="mono" style={{ color: "var(--text-3)", fontSize: 10, width: 14 }}>{rarityMode === "pct" ? "%" : "#"}</span>
                      <button onClick={() => removeTrait(t.id)} style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", padding: 0, lineHeight: 0, opacity: 0.5 }}>
                        <I name="x" size={10} />
                      </button>
                    </div>
                  );
                })}
                <div className="hstack" style={{ gap: 4, marginTop: 6 }}>
                  <button className="chip-btn ghost" style={{ flex: 1, justifyContent: "center", height: 28, fontSize: 11 }} onClick={() => fileInputRef.current?.click()}>
                    <I name="upload" size={11} />Add traits
                  </button>
                  <button className="chip-btn ghost" style={{ height: 28, fontSize: 11, padding: "0 8px" }} onClick={equalizeWeights} title="Equalize weights">
                    =
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {layers.length > 0 && (
          <>
            <div className="divider" />

            {/* Rarity mode toggle */}
            <div className="hstack" style={{ marginBottom: 10, gap: 4 }}>
              <span className="text-micro" style={{ marginRight: "auto" }}>Rarity display</span>
              <button className={`chip-btn ${rarityMode === "pct" ? "" : "ghost"}`} style={{ height: 24, padding: "0 8px", fontSize: 10 }} onClick={() => setRarityMode("pct")}>%</button>
              <button className={`chip-btn ${rarityMode === "exact" ? "" : "ghost"}`} style={{ height: 24, padding: "0 8px", fontSize: 10 }} onClick={() => setRarityMode("exact")}>#</button>
            </div>

            {/* Collection name */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 4 }}>Collection name</div>
              <input
                value={colName} onChange={(e) => setColName(e.target.value)}
                placeholder="e.g. Ottoman Echoes"
                style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px", color: "var(--text)", fontSize: 13, outline: "none" }}
              />
            </div>

            <div className="card pad" style={{ padding: 14 }}>
              <div className="text-micro mono">MAX COMBINATIONS</div>
              <div className="serif" style={{ fontSize: 24, marginTop: 6 }}>{maxCombos.toLocaleString()}</div>
              <div className="text-micro" style={{ marginTop: 4 }}>from {totalTraits} traits across {layers.length} layers</div>
            </div>

            {/* Delete layer */}
            {currentLayer && (
              <button
                className="chip-btn ghost" style={{ width: "100%", justifyContent: "center", marginTop: 10, height: 30, fontSize: 11, color: "var(--accent)" }}
                onClick={() => { if (confirm(`Delete layer "${currentLayer.name}"?`)) removeLayer(selected); }}
              >
                <I name="trash" size={12} />Delete "{currentLayer.name}"
              </button>
            )}
          </>
        )}
      </aside>

      {/* ═══ CENTER: Preview grid / upload ═══ */}
      <div style={{ overflowY: "auto", background: "var(--bg-elev)", padding: 28 }}>
        {currentLayer && currentLayer.traits.length === 0 ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "var(--accent)"; }}
            onDragLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; }}
            onDrop={(e) => { handleDrop(e); e.currentTarget.style.borderColor = "var(--border-strong)"; }}
            style={{ border: "2px dashed var(--border-strong)", borderRadius: 14, padding: "80px 40px", textAlign: "center", cursor: "pointer", transition: "border-color 0.15s" }}
          >
            <I name="upload" size={28} style={{ color: "var(--text-3)", margin: "0 auto 12px", display: "block" }} />
            <div style={{ fontWeight: 600, fontSize: 14 }}>Drop trait images for "{currentLayer.name}"</div>
            <div className="text-micro" style={{ marginTop: 6 }}>PNG transparent. Same dimensions across layers.</div>
          </div>
        ) : generated.length > 0 ? (
          <>
            <div className="hstack" style={{ marginBottom: 16 }}>
              <div className="eyebrow">Preview grid</div>
              <div className="spacer" />
              <div className="hstack" style={{ gap: 6 }}>
                <button className="chip-btn" onClick={runGeneration} disabled={generating}>
                  <I name="sparkle" size={14} />{generating ? "Generating..." : "Regenerate"}
                </button>
                <button className="chip-btn ghost"><I name="download" size={14} />Export samples</button>
              </div>
            </div>
            {collisionCount > 0 && (
              <div className="text-micro mono" style={{ marginBottom: 10 }}>{collisionCount.toLocaleString()} duplicate DNAs rejected</div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 24 }}>
              {generated.slice(0, 16).map((nft) => (
                <div key={nft.tokenId} className="card" style={{ padding: 0, overflow: "hidden" }}>
                  <div style={{ aspectRatio: "1/1", position: "relative", background: "var(--bg-elev-2)" }}>
                    {nft.traitPicks.map((t, i) =>
                      t.imageUrl ? <img key={i} src={t.imageUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} /> : null
                    )}
                    {nft.traitPicks.every((t) => !t.imageUrl) && <RugTile v={(nft.tokenId % 6) + 1} glyph={nft.traitPicks[0]?.traitName?.[0]} />}
                  </div>
                  <div style={{ padding: "8px 10px" }}>
                    <div className="mono" style={{ fontSize: 10, color: "var(--text-3)" }}>#{String(nft.tokenId).padStart(4, "0")}</div>
                    <div className="mono" style={{ fontSize: 11, color: "var(--text-2)", marginTop: 2 }}>
                      {nft.traitPicks.length} traits
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {generated.length > 16 && (
              <div className="text-micro" style={{ textAlign: "center" }}>Showing 16 of {generated.length.toLocaleString()} generated</div>
            )}
          </>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", opacity: 0.4 }}>
            <div style={{ textAlign: "center" }}>
              <I name="sparkle" size={28} style={{ color: "var(--text-3)", margin: "0 auto 12px", display: "block" }} />
              <div style={{ fontSize: 14, color: "var(--text-2)" }}>
                {layers.length === 0 ? "Add layers and traits to get started" : canGenerate ? "Hit Generate to preview your collection" : "Add traits to all layers first"}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══ RIGHT: Generation ═══ */}
      <aside style={{ borderLeft: "1px solid var(--border)", overflowY: "auto", padding: "22px 18px" }}>
        <div className="hstack" style={{ marginBottom: 14 }}>
          <I name="settings" size={15} />
          <span style={{ fontWeight: 600, fontSize: 14 }}>Generation</span>
        </div>

        <div style={{ fontSize: 12, color: "var(--text-2)" }}>Collection size</div>
        <input
          type="number" min={1} max={100000} value={supply}
          onChange={(e) => setSupply(Math.max(1, parseInt(e.target.value) || 1))}
          className="serif"
          style={{ width: "100%", fontSize: 28, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 14px", color: "var(--text)", outline: "none", fontFamily: "Fraunces, serif", letterSpacing: "-0.015em", margin: "6px 0 4px" }}
        />
        <input type="range" min={100} max={10000} step={100} value={Math.min(supply, 10000)} onChange={(e) => setSupply(+e.target.value)} style={{ width: "100%", accentColor: "var(--accent)", marginTop: 4 }} />
        <div className="hstack" style={{ justifyContent: "space-between", fontSize: 11, color: "var(--text-3)" }}>
          <span className="mono">100</span><span className="mono">10,000+</span>
        </div>

        {maxCombos > 0 && maxCombos < supply && (
          <div style={{ marginTop: 8, padding: 8, borderRadius: 8, background: "var(--accent-soft)", fontSize: 11, color: "var(--accent)" }}>
            Only {maxCombos.toLocaleString()} unique combos possible with current traits.
          </div>
        )}

        <div className="divider" />

        <div style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 8 }}>DNA uniqueness</div>
        <label className="filter-check"><input type="checkbox" defaultChecked />No duplicate combinations</label>
        <label className="filter-check"><input type="checkbox" defaultChecked />Exclude incompatible pairs</label>

        <div className="divider" />

        <div className="card pad" style={{ padding: 14, background: canGenerate ? "var(--accent-soft)" : "var(--surface)", border: `1px solid ${canGenerate ? "var(--accent-line)" : "var(--border)"}` }}>
          <div className="hstack" style={{ gap: 8, marginBottom: 6 }}>
            <I name="sparkle" size={14} style={{ color: canGenerate ? "var(--accent)" : "var(--text-3)" }} />
            <span style={{ fontWeight: 600, fontSize: 13 }}>{canGenerate ? "Ready to generate" : "Add traits to all layers"}</span>
          </div>
          {canGenerate && <div className="text-micro" style={{ marginBottom: 10 }}>~{Math.min(supply, maxCombos).toLocaleString()} unique NFTs</div>}
          <button className="btn-primary" disabled={!canGenerate || generating} style={{ width: "100%", justifyContent: "center", opacity: canGenerate ? 1 : 0.4 }} onClick={runGeneration}>
            <I name="sparkle" size={14} />{generating ? "Generating..." : `Generate ${Math.min(supply, maxCombos).toLocaleString()} NFTs`}
          </button>
        </div>

        {generated.length > 0 && (
          <>
            <div className="divider" />
            <button
              className="btn-primary lg"
              disabled={!colName.trim()}
              style={{ width: "100%", justifyContent: "center", opacity: colName.trim() ? 1 : 0.4 }}
              onClick={handleLaunch}
            >
              <I name="rocket" size={14} />Launch "{colName || "..."}"
            </button>
            {!colName.trim() && <div className="text-micro" style={{ marginTop: 6, textAlign: "center" }}>Enter a collection name in the left panel</div>}
          </>
        )}
      </aside>
    </div>
  );
}
