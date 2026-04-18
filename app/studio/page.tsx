"use client";

import { useState, useRef, useCallback, type DragEvent, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";

/* ── Icons ── */
function I({ name, size = 16, style, className }: { name: string; size?: number; style?: React.CSSProperties; className?: string }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, style, className };
  switch (name) {
    case "layers": return <svg {...p}><path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5M3 18l9 5 9-5"/></svg>;
    case "image": return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 16l-5-5-8 8"/></svg>;
    case "plus": return <svg {...p}><path d="M12 5v14M5 12h14"/></svg>;
    case "upload": return <svg {...p}><path d="M12 16V4M6 10l6-6 6 6M4 20h16"/></svg>;
    case "sparkle": return <svg {...p}><path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/></svg>;
    case "settings": return <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>;
    case "x": return <svg {...p}><path d="M6 6l12 12M18 6L6 18"/></svg>;
    case "rocket": return <svg {...p}><path d="M14 4c4 0 6 2 6 6l-8 8-3-3 8-8c-4 0-6-2-6-3z"/><path d="M7 14l-3 3 3 3 3-3"/><circle cx="15" cy="9" r="1.2"/></svg>;
    case "trash": return <svg {...p}><path d="M3 6h18M8 6V4h8v2M5 6v14h14V6"/><path d="M10 10v6M14 10v6"/></svg>;
    case "chevron-up": return <svg {...p}><path d="M18 15l-6-6-6 6"/></svg>;
    case "chevron-down": return <svg {...p}><path d="M6 9l6 6 6-6"/></svg>;
    case "chevron-right": return <svg {...p}><path d="M9 6l6 6-6 6"/></svg>;
    case "shuffle": return <svg {...p}><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>;
    default: return null;
  }
}

function RugTile({ v = 1, glyph }: { v?: number; glyph?: string }) {
  return <div className={`rug-tile ${v > 1 ? `v${v}` : ""}`}>{glyph && <span className="glyph">{glyph}</span>}</div>;
}

/* ── Types ── */
type Trait = { id: string; name: string; weight: number; imageUrl?: string };
type Layer = { id: string; name: string; traits: Trait[]; open: boolean };
type GenNFT = { tokenId: number; dna: string; isOneOfOne?: boolean; customImage?: string; customName?: string; traitPicks: { layerId: string; layerName: string; traitId: string; traitName: string; imageUrl?: string }[] };

function uid() { return Math.random().toString(36).slice(2, 10); }
function hashDNA(parts: string[]): string {
  const s = parts.join("|"); let h = 0x811c9dc5;
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
  const oneOfOneRef = useRef<HTMLInputElement>(null);
  const [uploadTargetLayer, setUploadTargetLayer] = useState<number | null>(null);

  const [layers, setLayers] = useState<Layer[]>([]);
  const [newLayerName, setNewLayerName] = useState("");
  const [supply, setSupply] = useState(5000);
  const [noDuplicates, setNoDuplicates] = useState(true);
  const [generated, setGenerated] = useState<GenNFT[]>([]);
  const [generating, setGenerating] = useState(false);
  const [collisionCount, setCollisionCount] = useState(0);
  const [colName, setColName] = useState("");
  const [rarityMode, setRarityMode] = useState<"pct" | "exact">("pct");

  // Edit modal
  const [editId, setEditId] = useState<number | null>(null);
  // Selection
  const [selectMode, setSelectMode] = useState(false);
  const [selectedNfts, setSelectedNfts] = useState<Set<number>>(new Set());
  // Swap
  const [swapA, setSwapA] = useState("");
  const [swapB, setSwapB] = useState("");
  // 1/1
  const [addingOne, setAddingOne] = useState(false);
  const [oneName, setOneName] = useState("");
  const [oneImage, setOneImage] = useState<string | null>(null);

  const totalTraits = layers.reduce((s, l) => s + l.traits.length, 0);
  const maxCombos = layers.length === 0 ? 0 : layers.reduce((p, l) => p * (l.traits.length || 1), 1);
  const canGenerate = layers.length > 0 && layers.every((l) => l.traits.length > 0);

  // ── Layer ops ──
  const addLayer = () => { const n = newLayerName.trim(); if (!n) return; setLayers([...layers, { id: uid(), name: n, traits: [], open: true }]); setNewLayerName(""); };
  const removeLayer = (idx: number) => setLayers(layers.filter((_, i) => i !== idx));
  const moveLayer = (idx: number, dir: -1 | 1) => { const t = idx + dir; if (t < 0 || t >= layers.length) return; const n = [...layers]; [n[idx], n[t]] = [n[t], n[idx]]; setLayers(n); };
  const toggleLayer = (idx: number) => setLayers(layers.map((l, i) => i === idx ? { ...l, open: !l.open } : l));
  const renameLayer = (idx: number, name: string) => setLayers(layers.map((l, i) => i === idx ? { ...l, name } : l));

  // ── Trait ops ──
  const addTraitsFromFiles = (layerIdx: number, files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    const layer = layers[layerIdx];
    const w = Math.round(100 / (layer.traits.length + list.length));
    const newT: Trait[] = list.map((f) => ({ id: uid(), name: f.name.replace(/\.[^.]+$/, ""), weight: w, imageUrl: URL.createObjectURL(f) }));
    setLayers(layers.map((l, i) => i === layerIdx ? { ...l, traits: [...l.traits, ...newT], open: true } : l));
  };
  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => { if (e.target.files && uploadTargetLayer !== null) { addTraitsFromFiles(uploadTargetLayer, e.target.files); e.target.value = ""; } };
  const removeTrait = (layerIdx: number, tid: string) => setLayers(layers.map((l, i) => i === layerIdx ? { ...l, traits: l.traits.filter((t) => t.id !== tid) } : l));
  const updateWeight = (layerIdx: number, tid: string, v: number) => setLayers(layers.map((l, i) => i === layerIdx ? { ...l, traits: l.traits.map((t) => t.id === tid ? { ...t, weight: v } : t) } : l));
  const equalizeWeights = (layerIdx: number) => { const layer = layers[layerIdx]; if (!layer?.traits.length) return; const w = +(100 / layer.traits.length).toFixed(1); setLayers(layers.map((l, i) => i === layerIdx ? { ...l, traits: l.traits.map((t) => ({ ...t, weight: w })) } : l)); };

  // ── Generation ──
  const runGeneration = useCallback(async () => {
    if (!canGenerate) return;
    setGenerating(true); setGenerated([]); setCollisionCount(0);
    const target = Math.min(supply, noDuplicates ? maxCombos : supply);
    const seen = new Set<string>(); const out: GenNFT[] = []; let col = 0;
    const maxAttempts = noDuplicates ? target * 30 : target;
    for (let att = 0; att < maxAttempts && out.length < target; att++) {
      const picks = layers.map((l) => pickWeighted(l.traits));
      const dna = hashDNA(picks.map((p) => p.id));
      if (noDuplicates && seen.has(dna)) { col++; continue; }
      seen.add(dna);
      out.push({ tokenId: out.length + 1, dna, traitPicks: layers.map((l, i) => ({ layerId: l.id, layerName: l.name, traitId: picks[i].id, traitName: picks[i].name, imageUrl: picks[i].imageUrl })) });
      if (out.length % 200 === 0) { setGenerated([...out]); setCollisionCount(col); await new Promise((r) => setTimeout(r, 0)); }
    }
    setGenerated(out); setCollisionCount(col); setGenerating(false);
  }, [canGenerate, supply, maxCombos, layers, noDuplicates]);

  // ── NFT ops ──
  const deleteNFT = (id: number) => { setGenerated((g) => g.filter((n) => n.tokenId !== id).map((n, i) => ({ ...n, tokenId: i + 1 }))); if (editId === id) setEditId(null); };
  const deleteSelected = () => { setGenerated((g) => g.filter((n) => !selectedNfts.has(n.tokenId)).map((n, i) => ({ ...n, tokenId: i + 1 }))); setSelectedNfts(new Set()); setSelectMode(false); };
  const shuffleAll = () => { const s = [...generated]; for (let i = s.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [s[i], s[j]] = [s[j], s[i]]; } setGenerated(s.map((n, i) => ({ ...n, tokenId: i + 1 }))); };
  const swapTokens = () => { const a = parseInt(swapA), b = parseInt(swapB); if (!a || !b || a === b) return; const ia = generated.findIndex((g) => g.tokenId === a), ib = generated.findIndex((g) => g.tokenId === b); if (ia < 0 || ib < 0) return; const n = [...generated]; [n[ia], n[ib]] = [n[ib], n[ia]]; setGenerated(n.map((x, i) => ({ ...x, tokenId: i + 1 }))); setSwapA(""); setSwapB(""); };
  const regenerateOne = (id: number) => { const seen = new Set(generated.filter((g) => g.tokenId !== id).map((g) => g.dna)); for (let att = 0; att < 1000; att++) { const picks = layers.map((l) => pickWeighted(l.traits)); const dna = hashDNA(picks.map((p) => p.id)); if (seen.has(dna)) continue; setGenerated(generated.map((g) => g.tokenId === id ? { ...g, dna, traitPicks: layers.map((l, i) => ({ layerId: l.id, layerName: l.name, traitId: picks[i].id, traitName: picks[i].name, imageUrl: picks[i].imageUrl })) } : g)); return; } };
  const setTraitOnNFT = (tokenId: number, layerId: string, newTraitId: string): boolean => { const target = generated.find((g) => g.tokenId === tokenId); if (!target) return false; const newTraits = target.traitPicks.map((t) => { if (t.layerId !== layerId) return t; const layer = layers.find((l) => l.id === layerId)!; const trait = layer.traits.find((tr) => tr.id === newTraitId)!; return { layerId, layerName: layer.name, traitId: trait.id, traitName: trait.name, imageUrl: trait.imageUrl }; }); const newDNA = hashDNA(newTraits.map((t) => t.traitId)); if (generated.some((g) => g.tokenId !== tokenId && g.dna === newDNA)) return false; setGenerated(generated.map((g) => g.tokenId === tokenId ? { ...g, dna: newDNA, traitPicks: newTraits } : g)); return true; };

  // ── 1/1 ──
  const handleOneFile = (e: ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) { setOneImage(URL.createObjectURL(f)); e.target.value = ""; } };
  const addOneOfOne = () => { if (!oneImage || !oneName.trim()) return; setGenerated([...generated, { tokenId: generated.length + 1, dna: "1of1-" + uid(), isOneOfOne: true, customImage: oneImage, customName: oneName.trim(), traitPicks: [] }]); setAddingOne(false); setOneName(""); setOneImage(null); };

  // ── Launch ──
  const handleLaunch = async () => {
    if (!colName.trim() || !wallet.publicKey) return;
    localStorage.setItem("rugworld:collection", JSON.stringify({ name: colName, tagline: "", description: "", supply: generated.length, generatedCount: generated.filter((g) => !g.isOneOfOne).length, oneOfOneCount: generated.filter((g) => g.isOneOfOne).length, layerCount: layers.length, traitCount: totalTraits, draftOwner: wallet.publicKey.toString(), createdAt: new Date().toISOString() }));
    const { idbSet, DRAFT_ASSETS_KEY } = await import("@/lib/draft-store");
    await idbSet(DRAFT_ASSETS_KEY, generated.map((nft) => ({ tokenId: nft.tokenId, dna: nft.dna, isOneOfOne: nft.isOneOfOne || false, customImage: nft.customImage, customName: nft.customName, traits: nft.traitPicks.map((t) => ({ layerName: t.layerName, traitName: t.traitName, imageUrl: t.imageUrl })) }))).catch(console.error);
    router.push("/create");
  };

  if (!wallet.publicKey) {
    return <div className="page-content" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}><div style={{ textAlign: "center", maxWidth: 420 }}><h2 className="h1 serif" style={{ fontWeight: 400, marginBottom: 12 }}>Connect your wallet</h2><p className="text-muted" style={{ lineHeight: 1.6 }}>Connect to start building a collection.</p></div></div>;
  }

  const editNft = editId !== null ? generated.find((g) => g.tokenId === editId) : null;

  return (
    <div className="page-content" style={{ paddingBottom: 40 }}>
      <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleFileInput} />
      <input ref={oneOfOneRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleOneFile} />

      {/* ═══ HEADER ═══ */}
      <div style={{ marginBottom: 28 }}>
        <div className="eyebrow">Art Studio</div>
        <h1 className="h1 serif" style={{ fontWeight: 400, marginTop: 6, fontSize: 38 }}>Build your collection</h1>
      </div>

      {/* ═══ TOP: Settings row ═══ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
        <div className="card pad" style={{ padding: 16 }}>
          <div className="text-micro mono" style={{ marginBottom: 6 }}>COLLECTION NAME</div>
          <input value={colName} onChange={(e) => setColName(e.target.value)} placeholder="e.g. Ottoman Echoes" style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px", color: "var(--text)", fontSize: 14, outline: "none", fontWeight: 600 }} />
        </div>
        <div className="card pad" style={{ padding: 16 }}>
          <div className="text-micro mono" style={{ marginBottom: 6 }}>COLLECTION SIZE</div>
          <input type="number" min={1} max={100000} value={supply} onChange={(e) => setSupply(Math.max(1, parseInt(e.target.value) || 1))} className="serif" style={{ width: "100%", fontSize: 24, background: "transparent", border: "none", color: "var(--text)", outline: "none", fontFamily: "Fraunces, serif" }} />
          <input type="range" min={100} max={10000} step={100} value={Math.min(supply, 10000)} onChange={(e) => setSupply(+e.target.value)} style={{ width: "100%", accentColor: "var(--accent)", marginTop: 4 }} />
        </div>
        <div className="card pad" style={{ padding: 16 }}>
          <div className="text-micro mono" style={{ marginBottom: 6 }}>MAX COMBINATIONS</div>
          <div className="serif" style={{ fontSize: 24 }}>{maxCombos.toLocaleString()}</div>
          <div className="text-micro" style={{ marginTop: 4 }}>{totalTraits} traits / {layers.length} layers</div>
          {maxCombos > 0 && maxCombos < supply && <div style={{ marginTop: 6, fontSize: 11, color: "var(--accent)" }}>Not enough for {supply.toLocaleString()}</div>}
        </div>
        <div className="card pad" style={{ padding: 16 }}>
          <div className="text-micro mono" style={{ marginBottom: 6 }}>OPTIONS</div>
          <label className="filter-check" style={{ fontSize: 12 }}><input type="checkbox" checked={noDuplicates} onChange={(e) => setNoDuplicates(e.target.checked)} />No duplicates (DNA)</label>
          <div className="hstack" style={{ marginTop: 8, gap: 4 }}>
            <span className="text-micro">Rarity</span>
            <div className="spacer" />
            <button className={`chip-btn ${rarityMode === "pct" ? "" : "ghost"}`} style={{ height: 22, padding: "0 7px", fontSize: 10 }} onClick={() => setRarityMode("pct")}>%</button>
            <button className={`chip-btn ${rarityMode === "exact" ? "" : "ghost"}`} style={{ height: 22, padding: "0 7px", fontSize: 10 }} onClick={() => setRarityMode("exact")}>#</button>
          </div>
        </div>
      </div>

      {/* ═══ LAYERS ═══ */}
      <div style={{ marginBottom: 24 }}>
        <div className="hstack" style={{ marginBottom: 12 }}>
          <I name="layers" size={16} />
          <span style={{ fontWeight: 600, fontSize: 15 }}>Layers</span>
          <span className="text-micro" style={{ marginLeft: 6 }}>({layers.length})</span>
          <div className="spacer" />
          <div className="hstack" style={{ gap: 6 }}>
            <input value={newLayerName} onChange={(e) => setNewLayerName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addLayer()} placeholder="New layer..." style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 10px", color: "var(--text)", fontSize: 12, outline: "none", width: 140 }} />
            <button className="chip-btn" style={{ height: 30, fontSize: 12 }} onClick={addLayer} disabled={!newLayerName.trim()}><I name="plus" size={12} />Add</button>
          </div>
        </div>

        {layers.length === 0 && <div className="card pad" style={{ padding: 20, textAlign: "center" }}><p className="text-micro">No layers yet. Add your first layer (e.g. Background, Body, Eyes).</p></div>}

        <div style={{ display: "grid", gap: 8 }}>
          {layers.map((l, i) => {
            const tw = l.traits.reduce((s, t) => s + t.weight, 0);
            return (
              <div key={l.id} className="card" style={{ padding: 0 }}>
                {/* Layer header */}
                <div className="hstack" style={{ padding: "10px 14px", cursor: "pointer", gap: 8 }} onClick={() => toggleLayer(i)}>
                  <I name={l.open ? "chevron-down" : "chevron-right"} size={14} style={{ color: "var(--text-3)", flexShrink: 0 }} />
                  <I name="image" size={14} style={{ flexShrink: 0 }} />
                  <span style={{ fontWeight: 600, fontSize: 13, flex: 1 }}>{l.name}</span>
                  <span className="mono text-micro" style={{ fontSize: 11 }}>{l.traits.length} traits</span>
                  {l.traits.length > 0 && tw !== 100 && <span className="mono" style={{ fontSize: 10, color: "var(--warn)" }}>{tw.toFixed(0)}%</span>}
                  {/* Move buttons */}
                  <button onClick={(e) => { e.stopPropagation(); moveLayer(i, -1); }} disabled={i === 0} style={{ background: "none", border: "none", color: "var(--text-3)", cursor: i === 0 ? "default" : "pointer", padding: 0, opacity: i === 0 ? 0.3 : 0.7, lineHeight: 0 }}><I name="chevron-up" size={14} /></button>
                  <button onClick={(e) => { e.stopPropagation(); moveLayer(i, 1); }} disabled={i === layers.length - 1} style={{ background: "none", border: "none", color: "var(--text-3)", cursor: i === layers.length - 1 ? "default" : "pointer", padding: 0, opacity: i === layers.length - 1 ? 0.3 : 0.7, lineHeight: 0 }}><I name="chevron-down" size={14} /></button>
                </div>

                {/* Expanded traits */}
                {l.open && (
                  <div style={{ padding: "0 14px 12px", borderTop: "1px solid var(--border)" }}>
                    {l.traits.length === 0 ? (
                      <div onClick={() => { setUploadTargetLayer(i); fileInputRef.current?.click(); }}
                        onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "var(--accent)"; }}
                        onDragLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
                        onDrop={(e) => { e.preventDefault(); addTraitsFromFiles(i, e.dataTransfer.files); e.currentTarget.style.borderColor = "var(--border)"; }}
                        style={{ margin: "10px 0", border: "1.5px dashed var(--border)", borderRadius: 10, padding: "24px 16px", textAlign: "center", cursor: "pointer" }}>
                        <I name="upload" size={18} style={{ color: "var(--text-3)", margin: "0 auto 6px", display: "block" }} />
                        <div style={{ fontSize: 12, fontWeight: 500 }}>Drop PNGs or click to browse</div>
                      </div>
                    ) : (
                      <>
                        {/* Trait table */}
                        <div style={{ marginTop: 8 }}>
                          <div className="hstack" style={{ padding: "4px 0", fontSize: 10, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
                            <span style={{ width: 28 }}></span>
                            <span style={{ flex: 1 }}>Trait</span>
                            <span style={{ width: 60, textAlign: "right" }}>{rarityMode === "pct" ? "Weight" : "Count"}</span>
                            <span style={{ width: 50, textAlign: "right" }}>% of supply</span>
                            <span style={{ width: 20 }}></span>
                          </div>
                          {l.traits.map((t) => {
                            const pct = tw > 0 ? (t.weight / tw * 100) : 0;
                            const exactCount = tw > 0 ? Math.round((t.weight / tw) * supply) : 0;
                            return (
                              <div key={t.id} className="hstack" style={{ padding: "5px 0", fontSize: 12, color: "var(--text-2)", gap: 0, borderBottom: "1px solid var(--border)" }}>
                                {t.imageUrl ? <img src={t.imageUrl} alt="" style={{ width: 24, height: 24, borderRadius: 4, objectFit: "cover", flexShrink: 0, marginRight: 4 }} /> : <span style={{ width: 28 }} />}
                                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</span>
                                <input type="number" min={0} value={rarityMode === "pct" ? t.weight : exactCount}
                                  onChange={(e) => { const v = parseFloat(e.target.value) || 0; updateWeight(i, t.id, rarityMode === "exact" && supply > 0 ? (v / supply) * (tw || 100) : v); }}
                                  className="mono" style={{ width: 56, background: "transparent", border: "none", borderBottom: "1px solid var(--border)", padding: "2px 4px", color: "var(--text)", fontSize: 12, textAlign: "right", outline: "none" }} />
                                <span className="mono" style={{ width: 50, textAlign: "right", color: "var(--text-3)", fontSize: 11 }}>{pct.toFixed(1)}%</span>
                                <button onClick={() => removeTrait(i, t.id)} style={{ width: 20, background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", padding: 0, opacity: 0.5, lineHeight: 0 }}><I name="x" size={10} /></button>
                              </div>
                            );
                          })}
                        </div>
                        {/* Actions row */}
                        <div className="hstack" style={{ marginTop: 8, gap: 6 }}>
                          <button className="chip-btn ghost" style={{ height: 26, fontSize: 11 }} onClick={() => { setUploadTargetLayer(i); fileInputRef.current?.click(); }}><I name="upload" size={11} />Add</button>
                          <button className="chip-btn ghost" style={{ height: 26, fontSize: 11 }} onClick={() => equalizeWeights(i)}>=</button>
                          <div className="spacer" />
                          <span className="mono text-micro">{tw.toFixed(0)}% total</span>
                          <button className="chip-btn ghost" style={{ height: 26, fontSize: 11, color: "var(--accent)" }} onClick={() => { if (confirm(`Delete "${l.name}"?`)) removeLayer(i); }}><I name="trash" size={11} /></button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ GENERATE BUTTON ═══ */}
      <div className="hstack" style={{ marginBottom: 20, gap: 10 }}>
        <button className="btn-primary lg" disabled={!canGenerate || generating} style={{ opacity: canGenerate ? 1 : 0.4 }} onClick={runGeneration}>
          <I name="sparkle" size={14} />{generating ? "Generating..." : `Generate ${Math.min(supply, noDuplicates ? maxCombos : supply).toLocaleString()} NFTs`}
        </button>
        {generated.length > 0 && (
          <>
            <button className="btn-ghost" onClick={shuffleAll}><I name="shuffle" size={14} />Shuffle</button>
            <button className="btn-ghost" onClick={() => setAddingOne(true)}><I name="plus" size={14} />Add 1/1</button>
            <button className="btn-ghost" onClick={() => setSelectMode(!selectMode)}>{selectMode ? "Cancel select" : "Select"}</button>
            {selectMode && selectedNfts.size > 0 && <button className="btn-ghost" style={{ color: "var(--accent)" }} onClick={() => { if (confirm(`Delete ${selectedNfts.size}?`)) deleteSelected(); }}><I name="trash" size={14} />Delete {selectedNfts.size}</button>}
            <div className="spacer" />
            <button className="btn-primary lg" disabled={!colName.trim()} style={{ opacity: colName.trim() ? 1 : 0.4 }} onClick={handleLaunch}><I name="rocket" size={14} />Launch</button>
          </>
        )}
      </div>

      {/* ═══ GENERATED GRID (scrollable box) ═══ */}
      {generated.length > 0 ? (
        <div className="card" style={{ padding: 0 }}>
          {/* Grid header */}
          <div className="hstack" style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
            <div className="eyebrow">{generated.length.toLocaleString()} NFTs</div>
            {collisionCount > 0 && <span className="text-micro mono" style={{ marginLeft: 8 }}>{collisionCount.toLocaleString()} collisions rejected</span>}
            <div className="spacer" />
            {/* Swap */}
            <div className="hstack" style={{ gap: 4, fontSize: 12 }}>
              <span className="text-micro">Swap</span>
              <input type="number" placeholder="#" value={swapA} onChange={(e) => setSwapA(e.target.value)} style={{ width: 46, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, padding: "3px 6px", color: "var(--text)", fontSize: 11, outline: "none" }} />
              <span className="text-micro">↔</span>
              <input type="number" placeholder="#" value={swapB} onChange={(e) => setSwapB(e.target.value)} style={{ width: 46, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, padding: "3px 6px", color: "var(--text)", fontSize: 11, outline: "none" }} />
              <button className="chip-btn" style={{ height: 24, fontSize: 10, padding: "0 8px" }} onClick={swapTokens} disabled={!swapA || !swapB}>Go</button>
            </div>
          </div>
          {/* Scrollable grid */}
          <div style={{ maxHeight: "60vh", overflowY: "auto", padding: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
              {generated.map((nft) => {
                const isSel = selectedNfts.has(nft.tokenId);
                return (
                  <div key={nft.tokenId} onClick={() => selectMode ? setSelectedNfts((s) => { const n = new Set(s); n.has(nft.tokenId) ? n.delete(nft.tokenId) : n.add(nft.tokenId); return n; }) : setEditId(nft.tokenId)} style={{ position: "relative", cursor: "pointer", border: `1.5px solid ${isSel ? "var(--accent)" : "var(--border)"}`, borderRadius: 10, overflow: "hidden", background: "var(--bg-elev)", transition: "border-color 0.1s" }}>
                    {nft.isOneOfOne && <span style={{ position: "absolute", top: 4, right: 4, zIndex: 2, fontSize: 9, fontWeight: 700, padding: "1px 5px", background: "var(--warn)", color: "#000", borderRadius: 999 }}>1/1</span>}
                    {selectMode && isSel && <div style={{ position: "absolute", top: 4, left: 4, zIndex: 2, width: 18, height: 18, borderRadius: 999, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10 }}>✓</div>}
                    <div style={{ aspectRatio: "1/1", position: "relative", background: "var(--bg-elev-2)" }}>
                      {nft.isOneOfOne && nft.customImage ? <img src={nft.customImage} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} /> : nft.traitPicks.map((t, i) => t.imageUrl ? <img key={i} src={t.imageUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} /> : null)}
                      {!nft.isOneOfOne && nft.traitPicks.every((t) => !t.imageUrl) && <RugTile v={(nft.tokenId % 6) + 1} />}
                    </div>
                    <div style={{ padding: "5px 8px" }}>
                      <span className="mono" style={{ fontSize: 11 }}>#{nft.tokenId}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : !generating && layers.length > 0 && canGenerate ? (
        <div className="card pad" style={{ padding: 40, textAlign: "center" }}>
          <I name="sparkle" size={28} style={{ color: "var(--text-3)", margin: "0 auto 10px", display: "block" }} />
          <div className="text-muted">Hit Generate to create your collection</div>
        </div>
      ) : null}

      {/* ═══ EDIT MODAL ═══ */}
      {editNft && (
        <div onClick={() => setEditId(null)} style={{ position: "fixed", inset: 0, background: "rgba(12,10,8,0.72)", backdropFilter: "blur(8px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: "min(560px,100%)", maxHeight: "85vh", overflow: "auto", padding: 0, background: "var(--bg)", boxShadow: "0 30px 80px rgba(0,0,0,0.4)" }}>
            <div className="hstack" style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
              <div><span style={{ fontWeight: 600 }}>Edit #{editNft.tokenId}</span><span className="mono text-micro" style={{ marginLeft: 8 }}>DNA {editNft.dna}</span></div>
              <div className="spacer" />
              <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => setEditId(null)}><I name="x" size={14} /></button>
            </div>
            <div style={{ padding: "16px 20px" }}>
              {editNft.isOneOfOne ? (
                <div style={{ textAlign: "center", padding: 16 }}>
                  {editNft.customImage && <img src={editNft.customImage} alt="" style={{ width: 140, height: 140, objectFit: "cover", borderRadius: 10, margin: "0 auto 10px" }} />}
                  <div className="serif" style={{ fontSize: 18 }}>{editNft.customName}</div>
                  <div className="text-micro">1/1 piece</div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 16 }}>
                  <div style={{ aspectRatio: "1/1", position: "relative", background: "var(--bg-elev-2)", borderRadius: 10, overflow: "hidden" }}>
                    {editNft.traitPicks.map((t, i) => t.imageUrl ? <img key={i} src={t.imageUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} /> : null)}
                  </div>
                  <div>
                    {editNft.traitPicks.map((t) => { const layer = layers.find((l) => l.id === t.layerId); if (!layer) return null; return (
                      <div key={t.layerId} style={{ marginBottom: 8 }}>
                        <div className="text-micro" style={{ marginBottom: 3 }}>{t.layerName}</div>
                        <select value={t.traitId} onChange={(e) => { if (!setTraitOnNFT(editNft.tokenId, t.layerId, e.target.value)) alert("That combo already exists."); }} style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "7px 10px", color: "var(--text)", fontSize: 13, outline: "none" }}>
                          {layer.traits.map((tr) => <option key={tr.id} value={tr.id}>{tr.name}</option>)}
                        </select>
                      </div>
                    ); })}
                    <button className="chip-btn" style={{ marginTop: 4 }} onClick={() => regenerateOne(editNft.tokenId)}><I name="sparkle" size={12} />Randomize</button>
                  </div>
                </div>
              )}
            </div>
            <div className="hstack" style={{ padding: "12px 20px", borderTop: "1px solid var(--border)" }}>
              <button className="chip-btn ghost" style={{ color: "var(--accent)" }} onClick={() => { if (confirm(`Delete #${editNft.tokenId}?`)) deleteNFT(editNft.tokenId); }}><I name="trash" size={12} />Delete</button>
              <div className="spacer" />
              <button className="chip-btn" onClick={() => setEditId(null)}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ 1/1 MODAL ═══ */}
      {addingOne && (
        <div onClick={() => { setAddingOne(false); setOneName(""); setOneImage(null); }} style={{ position: "fixed", inset: 0, background: "rgba(12,10,8,0.72)", backdropFilter: "blur(8px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: "min(380px,100%)", padding: 0, background: "var(--bg)", boxShadow: "0 30px 80px rgba(0,0,0,0.4)" }}>
            <div className="hstack" style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontWeight: 600 }}>Add 1/1</span><div className="spacer" />
              <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => { setAddingOne(false); setOneName(""); setOneImage(null); }}><I name="x" size={14} /></button>
            </div>
            <div style={{ padding: "14px 20px" }}>
              <div onClick={() => oneOfOneRef.current?.click()} style={{ aspectRatio: "1/1", border: "2px dashed var(--border-strong)", borderRadius: 10, cursor: "pointer", overflow: "hidden", position: "relative", marginBottom: 12 }}>
                {oneImage ? <img src={oneImage} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}><I name="upload" size={24} style={{ color: "var(--text-3)" }} /></div>}
              </div>
              <input value={oneName} onChange={(e) => setOneName(e.target.value)} placeholder="Name" style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px", color: "var(--text)", fontSize: 14, outline: "none" }} />
            </div>
            <div className="hstack" style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", justifyContent: "flex-end", gap: 8 }}>
              <button className="chip-btn ghost" onClick={() => { setAddingOne(false); setOneName(""); setOneImage(null); }}>Cancel</button>
              <button className="btn-primary" disabled={!oneImage || !oneName.trim()} onClick={addOneOfOne}>Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
