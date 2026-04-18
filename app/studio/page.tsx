"use client";

import { useState, useRef, useCallback, useEffect, type DragEvent, type ChangeEvent } from "react";
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
    case "download": return <svg {...p}><path d="M12 4v12M6 10l6 6 6-6M4 20h16"/></svg>;
    case "sparkle": return <svg {...p}><path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/></svg>;
    case "settings": return <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>;
    case "x": return <svg {...p}><path d="M6 6l12 12M18 6L6 18"/></svg>;
    case "rocket": return <svg {...p}><path d="M14 4c4 0 6 2 6 6l-8 8-3-3 8-8c-4 0-6-2-6-3z"/><path d="M7 14l-3 3 3 3 3-3"/><circle cx="15" cy="9" r="1.2"/></svg>;
    case "trash": return <svg {...p}><path d="M3 6h18M8 6V4h8v2M5 6v14h14V6"/><path d="M10 10v6M14 10v6"/></svg>;
    case "chevron-up": return <svg {...p}><path d="M18 15l-6-6-6 6"/></svg>;
    case "chevron-down": return <svg {...p}><path d="M6 9l6 6 6-6"/></svg>;
    case "shuffle": return <svg {...p}><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>;
    case "check": return <svg {...p}><path d="M4 12l5 5 11-12"/></svg>;
    default: return null;
  }
}

function RugTile({ v = 1, glyph }: { v?: number; glyph?: string }) {
  return <div className={`rug-tile ${v > 1 ? `v${v}` : ""}`}>{glyph && <span className="glyph">{glyph}</span>}</div>;
}

/* ── Types ── */
type Trait = { id: string; name: string; weight: number; imageUrl?: string };
type Layer = { id: string; name: string; traits: Trait[] };
type GenNFT = { tokenId: number; dna: string; isOneOfOne?: boolean; customImage?: string; customName?: string; traitPicks: { layerId: string; layerName: string; traitId: string; traitName: string; imageUrl?: string }[] };

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
  const oneOfOneFileRef = useRef<HTMLInputElement>(null);

  const [layers, setLayers] = useState<Layer[]>([]);
  const [selected, setSelected] = useState(0);
  const [newLayerName, setNewLayerName] = useState("");
  const [supply, setSupply] = useState(5000);
  const [generated, setGenerated] = useState<GenNFT[]>([]);
  const [generating, setGenerating] = useState(false);
  const [collisionCount, setCollisionCount] = useState(0);
  const [colName, setColName] = useState("");
  const [rarityMode, setRarityMode] = useState<"pct" | "exact">("pct");

  // Edit modal
  const [editId, setEditId] = useState<number | null>(null);

  // Selection/delete
  const [selectMode, setSelectMode] = useState(false);
  const [selectedNfts, setSelectedNfts] = useState<Set<number>>(new Set());

  // Swap
  const [swapA, setSwapA] = useState("");
  const [swapB, setSwapB] = useState("");

  // 1/1
  const [addingOne, setAddingOne] = useState(false);
  const [oneName, setOneName] = useState("");
  const [oneImage, setOneImage] = useState<string | null>(null);

  const currentLayer = layers[selected] || null;
  const totalTraits = layers.reduce((s, l) => s + l.traits.length, 0);
  const maxCombos = layers.length === 0 ? 0 : layers.reduce((p, l) => p * (l.traits.length || 1), 1);
  const canGenerate = layers.length > 0 && layers.every((l) => l.traits.length > 0);
  const totalWeight = currentLayer?.traits.reduce((s, t) => s + t.weight, 0) || 0;

  /* ── Layer management ── */
  const addLayer = () => { const n = newLayerName.trim(); if (!n) return; setLayers([...layers, { id: uid(), name: n, traits: [] }]); setSelected(layers.length); setNewLayerName(""); };
  const removeLayer = (idx: number) => { setLayers(layers.filter((_, i) => i !== idx)); if (selected >= layers.length - 1) setSelected(Math.max(0, layers.length - 2)); };
  const moveLayer = (idx: number, dir: -1 | 1) => { const t = idx + dir; if (t < 0 || t >= layers.length) return; const n = [...layers]; [n[idx], n[t]] = [n[t], n[idx]]; setLayers(n); setSelected(t); };

  /* ── Trait management ── */
  const addTraitsFromFiles = (files: FileList | File[]) => {
    if (!currentLayer) return;
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    const w = Math.round(100 / (currentLayer.traits.length + list.length));
    const newT: Trait[] = list.map((f) => ({ id: uid(), name: f.name.replace(/\.[^.]+$/, ""), weight: w, imageUrl: URL.createObjectURL(f) }));
    setLayers(layers.map((l, i) => i === selected ? { ...l, traits: [...l.traits, ...newT] } : l));
  };
  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => { if (e.target.files) { addTraitsFromFiles(e.target.files); e.target.value = ""; } };
  const handleDrop = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); if (e.dataTransfer.files) addTraitsFromFiles(e.dataTransfer.files); };
  const removeTrait = (tid: string) => setLayers(layers.map((l, i) => i === selected ? { ...l, traits: l.traits.filter((t) => t.id !== tid) } : l));
  const updateWeight = (tid: string, v: number) => setLayers(layers.map((l, i) => i === selected ? { ...l, traits: l.traits.map((t) => t.id === tid ? { ...t, weight: v } : t) } : l));
  const equalizeWeights = () => { if (!currentLayer?.traits.length) return; const w = +(100 / currentLayer.traits.length).toFixed(1); setLayers(layers.map((l, i) => i === selected ? { ...l, traits: l.traits.map((t) => ({ ...t, weight: w })) } : l)); };

  /* ── Generation ── */
  const runGeneration = useCallback(async () => {
    if (!canGenerate) return;
    setGenerating(true); setGenerated([]); setCollisionCount(0);
    const target = Math.min(supply, maxCombos);
    const seen = new Set<string>(); const out: GenNFT[] = []; let col = 0;
    for (let att = 0; att < target * 30 && out.length < target; att++) {
      const picks = layers.map((l) => pickWeighted(l.traits));
      const dna = hashDNA(picks.map((p) => p.id));
      if (seen.has(dna)) { col++; continue; }
      seen.add(dna);
      out.push({ tokenId: out.length + 1, dna, traitPicks: layers.map((l, i) => ({ layerId: l.id, layerName: l.name, traitId: picks[i].id, traitName: picks[i].name, imageUrl: picks[i].imageUrl })) });
      if (out.length % 200 === 0) { setGenerated([...out]); setCollisionCount(col); await new Promise((r) => setTimeout(r, 0)); }
    }
    setGenerated(out); setCollisionCount(col); setGenerating(false);
  }, [canGenerate, supply, maxCombos, layers]);

  /* ── NFT operations ── */
  const deleteNFT = (tokenId: number) => {
    setGenerated((g) => g.filter((n) => n.tokenId !== tokenId).map((n, i) => ({ ...n, tokenId: i + 1 })));
    setSelectedNfts((s) => { const n = new Set(s); n.delete(tokenId); return n; });
    if (editId === tokenId) setEditId(null);
  };
  const deleteSelected = () => {
    if (selectedNfts.size === 0) return;
    setGenerated((g) => g.filter((n) => !selectedNfts.has(n.tokenId)).map((n, i) => ({ ...n, tokenId: i + 1 })));
    setSelectedNfts(new Set()); setSelectMode(false);
  };
  const shuffleAll = () => {
    const s = [...generated]; for (let i = s.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [s[i], s[j]] = [s[j], s[i]]; }
    setGenerated(s.map((n, i) => ({ ...n, tokenId: i + 1 })));
  };
  const swapTokens = () => {
    const a = parseInt(swapA), b = parseInt(swapB);
    if (!a || !b || a === b) return;
    const ia = generated.findIndex((g) => g.tokenId === a), ib = generated.findIndex((g) => g.tokenId === b);
    if (ia < 0 || ib < 0) return;
    const n = [...generated]; [n[ia], n[ib]] = [n[ib], n[ia]];
    setGenerated(n.map((x, i) => ({ ...x, tokenId: i + 1 }))); setSwapA(""); setSwapB("");
  };
  const regenerateOne = (tokenId: number) => {
    const seen = new Set(generated.filter((g) => g.tokenId !== tokenId).map((g) => g.dna));
    for (let att = 0; att < 1000; att++) {
      const picks = layers.map((l) => pickWeighted(l.traits));
      const dna = hashDNA(picks.map((p) => p.id));
      if (seen.has(dna)) continue;
      setGenerated(generated.map((g) => g.tokenId === tokenId ? { ...g, dna, traitPicks: layers.map((l, i) => ({ layerId: l.id, layerName: l.name, traitId: picks[i].id, traitName: picks[i].name, imageUrl: picks[i].imageUrl })) } : g));
      return;
    }
  };
  const setTraitOnNFT = (tokenId: number, layerId: string, newTraitId: string): boolean => {
    const target = generated.find((g) => g.tokenId === tokenId); if (!target) return false;
    const newTraits = target.traitPicks.map((t) => {
      if (t.layerId !== layerId) return t;
      const layer = layers.find((l) => l.id === layerId)!;
      const trait = layer.traits.find((tr) => tr.id === newTraitId)!;
      return { layerId, layerName: layer.name, traitId: trait.id, traitName: trait.name, imageUrl: trait.imageUrl };
    });
    const newDNA = hashDNA(newTraits.map((t) => t.traitId));
    if (generated.some((g) => g.tokenId !== tokenId && g.dna === newDNA)) return false;
    setGenerated(generated.map((g) => g.tokenId === tokenId ? { ...g, dna: newDNA, traitPicks: newTraits } : g));
    return true;
  };

  /* ── 1/1 ── */
  const handleOneFile = (e: ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) { setOneImage(URL.createObjectURL(f)); e.target.value = ""; } };
  const addOneOfOne = () => {
    if (!oneImage || !oneName.trim()) return;
    const nft: GenNFT = { tokenId: generated.length + 1, dna: "1of1-" + uid(), isOneOfOne: true, customImage: oneImage, customName: oneName.trim(), traitPicks: [] };
    setGenerated([...generated, nft]); setAddingOne(false); setOneName(""); setOneImage(null);
  };

  /* ── Launch ── */
  const handleLaunch = async () => {
    if (!colName.trim() || !wallet.publicKey) return;
    localStorage.setItem("rugworld:collection", JSON.stringify({ name: colName, tagline: "", description: "", supply: generated.length, generatedCount: generated.filter((g) => !g.isOneOfOne).length, oneOfOneCount: generated.filter((g) => g.isOneOfOne).length, layerCount: layers.length, traitCount: totalTraits, draftOwner: wallet.publicKey.toString(), createdAt: new Date().toISOString() }));
    const { idbSet, DRAFT_ASSETS_KEY } = await import("@/lib/draft-store");
    await idbSet(DRAFT_ASSETS_KEY, generated.map((nft) => ({ tokenId: nft.tokenId, dna: nft.dna, isOneOfOne: nft.isOneOfOne || false, customImage: nft.customImage, customName: nft.customName, traits: nft.traitPicks.map((t) => ({ layerName: t.layerName, traitName: t.traitName, imageUrl: t.imageUrl })) }))).catch(console.error);
    router.push("/create");
  };

  // Wallet gate
  if (!wallet.publicKey) {
    return (
      <div className="page-content" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center", maxWidth: 420 }}>
          <h2 className="h1 serif" style={{ fontWeight: 400, marginBottom: 12 }}>Connect your wallet</h2>
          <p className="text-muted" style={{ lineHeight: 1.6 }}>Connect to start building a collection.</p>
        </div>
      </div>
    );
  }

  const editNft = editId !== null ? generated.find((g) => g.tokenId === editId) : null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "320px 1fr 320px", height: "100%" }}>
      <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleFileInput} />
      <input ref={oneOfOneFileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleOneFile} />

      {/* ═══ LEFT: Layers ═══ */}
      <aside style={{ borderRight: "1px solid var(--border)", overflowY: "auto", padding: "22px 18px" }}>
        <div className="hstack" style={{ marginBottom: 14 }}>
          <I name="layers" size={16} />
          <span style={{ fontWeight: 600, fontSize: 14 }}>Layers</span>
          <div className="spacer" />
        </div>

        <div className="hstack" style={{ gap: 6, marginBottom: 14 }}>
          <input id="new-layer-input" value={newLayerName} onChange={(e) => setNewLayerName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addLayer()} placeholder="New layer name..." style={{ flex: 1, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px", color: "var(--text)", fontSize: 12, outline: "none" }} />
          <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={addLayer} disabled={!newLayerName.trim()}><I name="plus" size={13} /></button>
        </div>

        {layers.length === 0 && <p className="text-micro" style={{ textAlign: "center", padding: "32px 0" }}>No layers yet.</p>}

        {layers.map((l, i) => (
          <div key={l.id} style={{ marginBottom: 4 }}>
            <div className="hstack" style={{ gap: 0 }}>
              {/* Reorder arrows */}
              <div style={{ display: "flex", flexDirection: "column", marginRight: 2, opacity: 0.5 }}>
                <button onClick={() => moveLayer(i, -1)} disabled={i === 0} style={{ background: "none", border: "none", color: "var(--text-3)", cursor: i === 0 ? "default" : "pointer", padding: 0, lineHeight: 0, opacity: i === 0 ? 0.3 : 1 }}><I name="chevron-up" size={12} /></button>
                <button onClick={() => moveLayer(i, 1)} disabled={i === layers.length - 1} style={{ background: "none", border: "none", color: "var(--text-3)", cursor: i === layers.length - 1 ? "default" : "pointer", padding: 0, lineHeight: 0, opacity: i === layers.length - 1 ? 0.3 : 1 }}><I name="chevron-down" size={12} /></button>
              </div>
              <button className={`nav-item ${selected === i ? "active" : ""}`} onClick={() => setSelected(i)} style={{ padding: "8px 10px", flex: 1 }}>
                <I name="image" size={14} />
                <span>{l.name}</span>
                <span className="badge">{l.traits.length}</span>
              </button>
            </div>
            {selected === i && (
              <div style={{ marginLeft: 28, marginTop: 4, paddingLeft: 10, borderLeft: "1px solid var(--border)" }}>
                {l.traits.map((t) => {
                  const exactVal = totalWeight > 0 ? Math.round((t.weight / totalWeight) * supply) : 0;
                  return (
                    <div key={t.id} className="hstack" style={{ padding: "5px 4px", fontSize: 12, color: "var(--text-2)", gap: 6 }}>
                      {t.imageUrl && <img src={t.imageUrl} alt="" style={{ width: 20, height: 20, borderRadius: 4, objectFit: "cover", flexShrink: 0 }} />}
                      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</span>
                      <input type="number" min={0} value={rarityMode === "pct" ? t.weight : exactVal} onChange={(e) => { const v = parseFloat(e.target.value) || 0; updateWeight(t.id, rarityMode === "exact" && supply > 0 ? (v / supply) * 100 : v); }} className="mono" style={{ width: 40, background: "transparent", border: "none", borderBottom: "1px solid var(--border)", padding: "2px 0", color: "var(--text-3)", fontSize: 11, textAlign: "right", outline: "none" }} />
                      <span className="mono" style={{ color: "var(--text-3)", fontSize: 10, width: 12 }}>{rarityMode === "pct" ? "%" : "#"}</span>
                      <button onClick={() => removeTrait(t.id)} style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", padding: 0, opacity: 0.5, lineHeight: 0 }}><I name="x" size={10} /></button>
                    </div>
                  );
                })}
                <div className="hstack" style={{ gap: 4, marginTop: 6 }}>
                  <button className="chip-btn ghost" style={{ flex: 1, justifyContent: "center", height: 28, fontSize: 11 }} onClick={() => fileInputRef.current?.click()}><I name="upload" size={11} />Add traits</button>
                  <button className="chip-btn ghost" style={{ height: 28, fontSize: 11, padding: "0 8px" }} onClick={equalizeWeights} title="Equalize">=</button>
                  <button className="chip-btn ghost" style={{ height: 28, fontSize: 11, padding: "0 8px" }} onClick={() => { if (confirm(`Delete "${l.name}"?`)) removeLayer(i); }} title="Delete"><I name="trash" size={11} /></button>
                </div>
              </div>
            )}
          </div>
        ))}

        {layers.length > 0 && (
          <>
            <div className="divider" />
            <div className="hstack" style={{ marginBottom: 8, gap: 4 }}>
              <span className="text-micro" style={{ marginRight: "auto" }}>Rarity</span>
              <button className={`chip-btn ${rarityMode === "pct" ? "" : "ghost"}`} style={{ height: 22, padding: "0 7px", fontSize: 10 }} onClick={() => setRarityMode("pct")}>%</button>
              <button className={`chip-btn ${rarityMode === "exact" ? "" : "ghost"}`} style={{ height: 22, padding: "0 7px", fontSize: 10 }} onClick={() => setRarityMode("exact")}>#</button>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 4 }}>Collection name</div>
              <input value={colName} onChange={(e) => setColName(e.target.value)} placeholder="e.g. Ottoman Echoes" style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px", color: "var(--text)", fontSize: 13, outline: "none" }} />
            </div>
            <div className="card pad" style={{ padding: 14 }}>
              <div className="text-micro mono">MAX COMBINATIONS</div>
              <div className="serif" style={{ fontSize: 24, marginTop: 6 }}>{maxCombos.toLocaleString()}</div>
              <div className="text-micro" style={{ marginTop: 4 }}>{totalTraits} traits / {layers.length} layers</div>
            </div>
          </>
        )}
      </aside>

      {/* ═══ CENTER: Grid ═══ */}
      <div style={{ overflowY: "auto", background: "var(--bg-elev)", padding: 28 }}>
        {currentLayer && currentLayer.traits.length === 0 ? (
          <div onClick={() => fileInputRef.current?.click()} onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "var(--accent)"; }} onDragLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; }} onDrop={(e) => { handleDrop(e); e.currentTarget.style.borderColor = "var(--border-strong)"; }} style={{ border: "2px dashed var(--border-strong)", borderRadius: 14, padding: "80px 40px", textAlign: "center", cursor: "pointer" }}>
            <I name="upload" size={28} style={{ color: "var(--text-3)", margin: "0 auto 12px", display: "block" }} />
            <div style={{ fontWeight: 600, fontSize: 14 }}>Drop trait images for "{currentLayer.name}"</div>
            <div className="text-micro" style={{ marginTop: 6 }}>PNG transparent. Same dimensions across layers.</div>
          </div>
        ) : generated.length > 0 ? (
          <>
            {/* Toolbar */}
            <div className="hstack" style={{ marginBottom: 12, gap: 6, flexWrap: "wrap" }}>
              <div className="eyebrow">{generated.length.toLocaleString()} generated</div>
              <div className="spacer" />
              {selectMode ? (
                <>
                  <span className="text-micro">{selectedNfts.size} selected</span>
                  <button className="chip-btn" style={{ height: 28, fontSize: 11 }} onClick={() => setSelectedNfts(new Set(generated.map((g) => g.tokenId)))}>All</button>
                  <button className="chip-btn" style={{ height: 28, fontSize: 11 }} disabled={selectedNfts.size === 0} onClick={() => { if (confirm(`Delete ${selectedNfts.size}?`)) deleteSelected(); }}>Delete</button>
                  <button className="chip-btn ghost" style={{ height: 28, fontSize: 11 }} onClick={() => { setSelectMode(false); setSelectedNfts(new Set()); }}>Cancel</button>
                </>
              ) : (
                <>
                  <button className="chip-btn ghost" style={{ height: 28, fontSize: 11 }} onClick={() => setSelectMode(true)}>Select</button>
                  <button className="chip-btn ghost" style={{ height: 28, fontSize: 11 }} onClick={shuffleAll}><I name="shuffle" size={12} />Shuffle</button>
                  <button className="chip-btn ghost" style={{ height: 28, fontSize: 11 }} onClick={() => setAddingOne(true)}>+ 1/1</button>
                  <button className="chip-btn" style={{ height: 28, fontSize: 11 }} onClick={runGeneration} disabled={generating}><I name="sparkle" size={12} />Regenerate</button>
                </>
              )}
            </div>

            {/* Swap row */}
            {!selectMode && (
              <div className="hstack" style={{ gap: 6, marginBottom: 12, fontSize: 12 }}>
                <span className="text-micro">Swap</span>
                <input type="number" placeholder="#" value={swapA} onChange={(e) => setSwapA(e.target.value)} style={{ width: 52, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", color: "var(--text)", fontSize: 12, outline: "none" }} />
                <span className="text-micro">↔</span>
                <input type="number" placeholder="#" value={swapB} onChange={(e) => setSwapB(e.target.value)} style={{ width: 52, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", color: "var(--text)", fontSize: 12, outline: "none" }} />
                <button className="chip-btn" style={{ height: 26, fontSize: 11, padding: "0 10px" }} onClick={swapTokens} disabled={!swapA || !swapB}>Swap</button>
              </div>
            )}

            {collisionCount > 0 && <div className="text-micro mono" style={{ marginBottom: 8 }}>{collisionCount.toLocaleString()} duplicate DNAs rejected</div>}

            {/* Full scrollable grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {generated.map((nft) => {
                const isSel = selectedNfts.has(nft.tokenId);
                return (
                  <div key={nft.tokenId} onClick={() => selectMode ? setSelectedNfts((s) => { const n = new Set(s); n.has(nft.tokenId) ? n.delete(nft.tokenId) : n.add(nft.tokenId); return n; }) : setEditId(nft.tokenId)} className="card" style={{ padding: 0, overflow: "hidden", cursor: "pointer", position: "relative", outline: isSel ? "2px solid var(--accent)" : "none", outlineOffset: -2 }}>
                    {nft.isOneOfOne && <span style={{ position: "absolute", top: 6, right: 6, zIndex: 2, fontSize: 9, fontWeight: 700, padding: "2px 6px", background: "var(--warn)", color: "#000", borderRadius: 999 }}>1/1</span>}
                    {selectMode && isSel && <div style={{ position: "absolute", top: 6, left: 6, zIndex: 2, width: 20, height: 20, borderRadius: 999, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11 }}>✓</div>}
                    {!selectMode && (
                      <button onClick={(e) => { e.stopPropagation(); if (confirm(`Delete #${nft.tokenId}?`)) deleteNFT(nft.tokenId); }} style={{ position: "absolute", top: 6, left: 6, zIndex: 2, width: 22, height: 22, borderRadius: 6, background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", cursor: "pointer", display: "none", alignItems: "center", justifyContent: "center" }} className="nft-del-btn"><I name="x" size={10} /></button>
                    )}
                    <div style={{ aspectRatio: "1/1", position: "relative", background: "var(--bg-elev-2)" }}>
                      {nft.isOneOfOne && nft.customImage ? (
                        <img src={nft.customImage} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        nft.traitPicks.map((t, i) => t.imageUrl ? <img key={i} src={t.imageUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} /> : null)
                      )}
                      {!nft.isOneOfOne && nft.traitPicks.every((t) => !t.imageUrl) && <RugTile v={(nft.tokenId % 6) + 1} glyph={nft.traitPicks[0]?.traitName?.[0]} />}
                    </div>
                    <div style={{ padding: "6px 10px" }}>
                      <span className="mono" style={{ fontSize: 11, color: "var(--text)" }}>#{nft.tokenId}</span>
                      {nft.isOneOfOne && nft.customName && <span className="text-micro" style={{ marginLeft: 6 }}>{nft.customName}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", opacity: 0.4 }}>
            <div style={{ textAlign: "center" }}>
              <I name="sparkle" size={28} style={{ color: "var(--text-3)", margin: "0 auto 12px", display: "block" }} />
              <div style={{ fontSize: 14, color: "var(--text-2)" }}>{layers.length === 0 ? "Add layers and traits to get started" : canGenerate ? "Hit Generate to preview your collection" : "Add traits to all layers first"}</div>
            </div>
          </div>
        )}
      </div>

      {/* ═══ RIGHT: Generation ═══ */}
      <aside style={{ borderLeft: "1px solid var(--border)", overflowY: "auto", padding: "22px 18px" }}>
        <div className="hstack" style={{ marginBottom: 14 }}><I name="settings" size={15} /><span style={{ fontWeight: 600, fontSize: 14 }}>Generation</span></div>

        <div style={{ fontSize: 12, color: "var(--text-2)" }}>Collection size</div>
        <input type="number" min={1} max={100000} value={supply} onChange={(e) => setSupply(Math.max(1, parseInt(e.target.value) || 1))} className="serif" style={{ width: "100%", fontSize: 28, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 14px", color: "var(--text)", outline: "none", fontFamily: "Fraunces, serif", letterSpacing: "-0.015em", margin: "6px 0 4px" }} />
        <input type="range" min={100} max={10000} step={100} value={Math.min(supply, 10000)} onChange={(e) => setSupply(+e.target.value)} style={{ width: "100%", accentColor: "var(--accent)", marginTop: 4 }} />

        {maxCombos > 0 && maxCombos < supply && <div style={{ marginTop: 8, padding: 8, borderRadius: 8, background: "var(--accent-soft)", fontSize: 11, color: "var(--accent)" }}>Only {maxCombos.toLocaleString()} unique combos possible.</div>}

        <div className="divider" />
        <div style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 8 }}>DNA uniqueness</div>
        <label className="filter-check"><input type="checkbox" defaultChecked />No duplicates</label>
        <label className="filter-check"><input type="checkbox" defaultChecked />Exclude incompatible</label>

        <div className="divider" />
        <div className="card pad" style={{ padding: 14, background: canGenerate ? "var(--accent-soft)" : "var(--surface)", border: `1px solid ${canGenerate ? "var(--accent-line)" : "var(--border)"}` }}>
          <div className="hstack" style={{ gap: 8, marginBottom: 6 }}><I name="sparkle" size={14} style={{ color: canGenerate ? "var(--accent)" : "var(--text-3)" }} /><span style={{ fontWeight: 600, fontSize: 13 }}>{canGenerate ? "Ready" : "Add traits to all layers"}</span></div>
          <button className="btn-primary" disabled={!canGenerate || generating} style={{ width: "100%", justifyContent: "center", opacity: canGenerate ? 1 : 0.4 }} onClick={runGeneration}><I name="sparkle" size={14} />{generating ? "Generating..." : `Generate ${Math.min(supply, maxCombos).toLocaleString()}`}</button>
        </div>

        {generated.length > 0 && (
          <><div className="divider" /><button className="btn-primary lg" disabled={!colName.trim()} style={{ width: "100%", justifyContent: "center", opacity: colName.trim() ? 1 : 0.4 }} onClick={handleLaunch}><I name="rocket" size={14} />Launch "{colName || "..."}"</button>{!colName.trim() && <div className="text-micro" style={{ marginTop: 6, textAlign: "center" }}>Enter a collection name first</div>}</>
        )}
      </aside>

      {/* ═══ EDIT MODAL ═══ */}
      {editNft && (
        <div onClick={() => setEditId(null)} style={{ position: "fixed", inset: 0, background: "rgba(12,10,8,0.72)", backdropFilter: "blur(8px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: "min(600px,100%)", maxHeight: "85vh", overflow: "auto", padding: 0, background: "var(--bg)", boxShadow: "0 30px 80px rgba(0,0,0,0.4)" }}>
            <div className="hstack" style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)" }}>
              <div><div className="eyebrow">Edit #{editNft.tokenId}</div><div className="mono" style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>DNA {editNft.dna}</div></div>
              <div className="spacer" />
              <button className="icon-btn" onClick={() => setEditId(null)}><I name="x" size={14} /></button>
            </div>
            <div style={{ padding: "18px 22px" }}>
              {editNft.isOneOfOne ? (
                <div style={{ textAlign: "center", padding: 20 }}>
                  {editNft.customImage && <img src={editNft.customImage} alt="" style={{ width: 160, height: 160, objectFit: "cover", borderRadius: 10, margin: "0 auto 12px" }} />}
                  <div className="serif" style={{ fontSize: 20 }}>{editNft.customName}</div>
                  <div className="text-micro" style={{ marginTop: 4 }}>1/1 piece</div>
                </div>
              ) : (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 20 }}>
                    <div style={{ aspectRatio: "1/1", position: "relative", background: "var(--bg-elev-2)", borderRadius: 10, overflow: "hidden" }}>
                      {editNft.traitPicks.map((t, i) => t.imageUrl ? <img key={i} src={t.imageUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} /> : null)}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 8 }}>Traits</div>
                      {editNft.traitPicks.map((t) => {
                        const layer = layers.find((l) => l.id === t.layerId);
                        if (!layer) return null;
                        return (
                          <div key={t.layerId} style={{ marginBottom: 8 }}>
                            <div className="text-micro" style={{ marginBottom: 3 }}>{t.layerName}</div>
                            <select value={t.traitId} onChange={(e) => { if (!setTraitOnNFT(editNft.tokenId, t.layerId, e.target.value)) alert("That combination already exists."); }} style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "7px 10px", color: "var(--text)", fontSize: 13, outline: "none" }}>
                              {layer.traits.map((tr) => <option key={tr.id} value={tr.id}>{tr.name}</option>)}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <button className="chip-btn" style={{ marginTop: 12 }} onClick={() => regenerateOne(editNft.tokenId)}><I name="sparkle" size={12} />Randomize</button>
                </>
              )}
            </div>
            <div className="hstack" style={{ padding: "14px 22px", borderTop: "1px solid var(--border)" }}>
              <button className="chip-btn ghost" style={{ color: "var(--accent)" }} onClick={() => { if (confirm(`Delete #${editNft.tokenId}?`)) deleteNFT(editNft.tokenId); }}><I name="trash" size={12} />Delete</button>
              <div className="spacer" />
              <button className="chip-btn" onClick={() => setEditId(null)}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ ADD 1/1 MODAL ═══ */}
      {addingOne && (
        <div onClick={() => { setAddingOne(false); setOneName(""); setOneImage(null); }} style={{ position: "fixed", inset: 0, background: "rgba(12,10,8,0.72)", backdropFilter: "blur(8px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: "min(420px,100%)", padding: 0, background: "var(--bg)", boxShadow: "0 30px 80px rgba(0,0,0,0.4)" }}>
            <div className="hstack" style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)" }}>
              <div><div className="eyebrow">Add 1/1</div></div>
              <div className="spacer" />
              <button className="icon-btn" onClick={() => { setAddingOne(false); setOneName(""); setOneImage(null); }}><I name="x" size={14} /></button>
            </div>
            <div style={{ padding: "18px 22px" }}>
              <div onClick={() => oneOfOneFileRef.current?.click()} style={{ aspectRatio: "1/1", border: "2px dashed var(--border-strong)", borderRadius: 10, cursor: "pointer", overflow: "hidden", position: "relative", marginBottom: 14 }}>
                {oneImage ? <img src={oneImage} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}><I name="upload" size={28} style={{ color: "var(--text-3)" }} /></div>}
              </div>
              <input value={oneName} onChange={(e) => setOneName(e.target.value)} placeholder="Name this 1/1" style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", color: "var(--text)", fontSize: 14, outline: "none" }} />
            </div>
            <div className="hstack" style={{ padding: "14px 22px", borderTop: "1px solid var(--border)", justifyContent: "flex-end", gap: 8 }}>
              <button className="chip-btn ghost" onClick={() => { setAddingOne(false); setOneName(""); setOneImage(null); }}>Cancel</button>
              <button className="btn-primary" disabled={!oneImage || !oneName.trim()} onClick={addOneOfOne}>Add 1/1</button>
            </div>
          </div>
        </div>
      )}

      <style>{`.card:hover .nft-del-btn { display: flex !important; }`}</style>
    </div>
  );
}
