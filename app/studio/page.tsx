"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

type Trait = {
  id: string;
  name: string;
  rarity: number;
  imageUrl?: string;
};

type Layer = {
  id: string;
  name: string;
  traits: Trait[];
};

type GeneratedTraitRef = {
  layerId: string;
  layerName: string;
  traitId: string;
  traitName: string;
  imageUrl?: string;
};

type GeneratedNFT = {
  tokenId: number;
  dna: string;
  traits: GeneratedTraitRef[];
  isOneOfOne?: boolean;
  customImage?: string;
  customName?: string;
};

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function hashDNA(parts: string[]): string {
  // Simple deterministic hash for DNA fingerprint
  const s = parts.join("|");
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

function pickWeighted(traits: Trait[]): Trait | undefined {
  if (traits.length === 0) return undefined;
  const total = traits.reduce((s, t) => s + t.rarity, 0);
  if (total <= 0) return traits[Math.floor(Math.random() * traits.length)];
  let r = Math.random() * total;
  for (const t of traits) {
    r -= t.rarity;
    if (r <= 0) return t;
  }
  return traits[traits.length - 1];
}

export default function StudioPage() {
  const router = useRouter();
  const [collectionName, setCollectionName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [targetSupply, setTargetSupply] = useState("5000");
  const [generated, setGenerated] = useState<GeneratedNFT[]>([]);
  const [collisions, setCollisions] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [newLayerName, setNewLayerName] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [editingTokenId, setEditingTokenId] = useState<number | null>(null);
  const [filters, setFilters] = useState<Record<string, Set<string>>>({});
  const [oneOfOneFilter, setOneOfOneFilter] = useState<"all" | "generated" | "oneOfOne">("all");
  const [swapA, setSwapA] = useState("");
  const [swapB, setSwapB] = useState("");
  const [addingOneOfOne, setAddingOneOfOne] = useState(false);
  const [newOneName, setNewOneName] = useState("");
  const [newOneImage, setNewOneImage] = useState<string | null>(null);
  const [newOnePosition, setNewOnePosition] = useState<"end" | "custom">("end");
  const [newOneSlot, setNewOneSlot] = useState("");
  const [openFilterSections, setOpenFilterSections] = useState<Record<string, boolean>>({ type: true });
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [launchOpen, setLaunchOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const oneOfOneFileRef = useRef<HTMLInputElement>(null);

  const selectedLayer = layers.find((l) => l.id === selectedLayerId) || null;
  const totalTraits = layers.reduce((sum, l) => sum + l.traits.length, 0);
  const maxCombinations = layers.length === 0
    ? 0
    : layers.reduce((prod, l) => prod * (l.traits.length || 1), 1);

  const addLayer = () => {
    const name = newLayerName.trim();
    if (!name) return;
    const newLayer: Layer = { id: makeId(), name, traits: [] };
    setLayers([...layers, newLayer]);
    setSelectedLayerId(newLayer.id);
    setNewLayerName("");
  };

  const removeLayer = (id: string) => {
    const idx = layers.findIndex((l) => l.id === id);
    const newLayers = layers.filter((l) => l.id !== id);
    setLayers(newLayers);
    if (selectedLayerId === id) {
      setSelectedLayerId(newLayers[Math.max(0, idx - 1)]?.id || null);
    }
  };

  const moveLayerTo = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const fromIdx = layers.findIndex((l) => l.id === fromId);
    const toIdx = layers.findIndex((l) => l.id === toId);
    if (fromIdx < 0 || toIdx < 0) return;
    const next = [...layers];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setLayers(next);
  };

  const updateLayerName = (id: string, name: string) => {
    setLayers(layers.map((l) => (l.id === id ? { ...l, name } : l)));
  };

  const addTraitsFromFiles = (files: FileList | File[]) => {
    if (!selectedLayer) return;
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) return;

    const newTraits: Trait[] = list.map((file) => ({
      id: makeId(),
      name: file.name.replace(/\.[^.]+$/, ""),
      rarity: Math.round(100 / (selectedLayer.traits.length + list.length)),
      imageUrl: URL.createObjectURL(file),
    }));

    setLayers(layers.map((l) =>
      l.id === selectedLayer.id ? { ...l, traits: [...l.traits, ...newTraits] } : l
    ));
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addTraitsFromFiles(e.target.files);
      e.target.value = "";
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      addTraitsFromFiles(e.dataTransfer.files);
    }
  };

  const addManualTrait = () => {
    if (!selectedLayer) return;
    setLayers(layers.map((l) =>
      l.id === selectedLayer.id
        ? { ...l, traits: [...l.traits, { id: makeId(), name: "New Trait", rarity: 10 }] }
        : l
    ));
  };

  const removeTrait = (layerId: string, traitId: string) => {
    setLayers(layers.map((l) =>
      l.id === layerId ? { ...l, traits: l.traits.filter((t) => t.id !== traitId) } : l
    ));
  };

  const updateTrait = (layerId: string, traitId: string, field: keyof Trait, value: string | number) => {
    setLayers(layers.map((l) =>
      l.id === layerId
        ? { ...l, traits: l.traits.map((t) => (t.id === traitId ? { ...t, [field]: value } : t)) }
        : l
    ));
  };

  const runGeneration = async () => {
    const target = parseInt(targetSupply) || 0;
    if (target <= 0 || layers.length === 0 || totalTraits === 0) return;

    setGenerating(true);
    setGenerated([]);
    setCollisions(0);

    const seenDNA = new Set<string>();
    const out: GeneratedNFT[] = [];
    let collided = 0;
    let attempts = 0;
    const maxAttempts = target * 30;

    while (out.length < target && out.length < maxCombinations && attempts < maxAttempts) {
      attempts++;
      const picks = layers.map((l) => pickWeighted(l.traits));
      if (picks.some((p) => !p)) break;
      const dnaParts = picks.map((p) => p!.id);
      const dna = hashDNA(dnaParts);
      if (seenDNA.has(dna)) {
        collided++;
        continue;
      }
      seenDNA.add(dna);
      out.push({
        tokenId: out.length + 1,
        dna,
        traits: layers.map((l, i) => ({
          layerId: l.id,
          layerName: l.name,
          traitId: picks[i]!.id,
          traitName: picks[i]!.name,
          imageUrl: picks[i]!.imageUrl,
        })),
      });

      if (out.length % 50 === 0) {
        setGenerated([...out]);
        setCollisions(collided);
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    setGenerated(out);
    setCollisions(collided);
    setGenerating(false);
  };

  // Regenerate a single NFT: pick new random traits ensuring DNA uniqueness
  const regenerateOne = (tokenId: number) => {
    const seen = new Set(generated.filter((g) => g.tokenId !== tokenId).map((g) => g.dna));
    for (let attempt = 0; attempt < 1000; attempt++) {
      const picks = layers.map((l) => pickWeighted(l.traits));
      if (picks.some((p) => !p)) return;
      const dna = hashDNA(picks.map((p) => p!.id));
      if (seen.has(dna)) continue;
      setGenerated(generated.map((g) =>
        g.tokenId === tokenId
          ? {
              ...g,
              dna,
              traits: layers.map((l, i) => ({
                layerId: l.id,
                layerName: l.name,
                traitId: picks[i]!.id,
                traitName: picks[i]!.name,
                imageUrl: picks[i]!.imageUrl,
              })),
            }
          : g
      ));
      return;
    }
  };

  // Manually change a single trait on a generated NFT. Rejects if it creates a DNA collision.
  const setTraitOnNFT = (tokenId: number, layerId: string, newTraitId: string): boolean => {
    const target = generated.find((g) => g.tokenId === tokenId);
    if (!target) return false;
    const newTraits = target.traits.map((t) =>
      t.layerId === layerId
        ? (() => {
            const layer = layers.find((l) => l.id === layerId)!;
            const trait = layer.traits.find((tr) => tr.id === newTraitId)!;
            return { layerId, layerName: layer.name, traitId: trait.id, traitName: trait.name, imageUrl: trait.imageUrl };
          })()
        : t
    );
    const newDNA = hashDNA(newTraits.map((t) => t.traitId));
    const exists = generated.some((g) => g.tokenId !== tokenId && g.dna === newDNA);
    if (exists) return false;
    setGenerated(generated.map((g) =>
      g.tokenId === tokenId ? { ...g, dna: newDNA, traits: newTraits } : g
    ));
    return true;
  };

  const equalizeRarity = (layerId: string) => {
    const layer = layers.find((l) => l.id === layerId);
    if (!layer || layer.traits.length === 0) return;
    const equal = +(100 / layer.traits.length).toFixed(2);
    setLayers(layers.map((l) =>
      l.id === layerId
        ? { ...l, traits: l.traits.map((t) => ({ ...t, rarity: equal })) }
        : l
    ));
  };

  // Shuffle: randomly reassign token IDs across all NFTs
  const shuffleGenerated = () => {
    if (generated.length === 0) return;
    const shuffled = [...generated];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    // Reassign tokenIds sequentially based on new order
    setGenerated(shuffled.map((nft, i) => ({ ...nft, tokenId: i + 1 })));
  };

  // Swap: exchange positions of two token IDs
  const swapTokens = () => {
    const a = parseInt(swapA);
    const b = parseInt(swapB);
    if (!a || !b || a === b) return;
    const idxA = generated.findIndex((g) => g.tokenId === a);
    const idxB = generated.findIndex((g) => g.tokenId === b);
    if (idxA < 0 || idxB < 0) {
      alert("Token not found");
      return;
    }
    const next = [...generated];
    [next[idxA], next[idxB]] = [next[idxB], next[idxA]];
    // Keep tokenIds intact so the NFTs swap positions but keep their IDs? User said swap positions.
    // Rewrite tokenIds based on new array order
    setGenerated(next.map((nft, i) => ({ ...nft, tokenId: i + 1 })));
    setSwapA("");
    setSwapB("");
  };

  // Add a 1/1 NFT with custom image
  const addOneOfOne = () => {
    if (!newOneImage || !newOneName.trim()) return;
    const newNFT: GeneratedNFT = {
      tokenId: 0, // will be assigned below
      dna: "1of1-" + makeId(),
      traits: [],
      isOneOfOne: true,
      customImage: newOneImage,
      customName: newOneName.trim(),
    };

    let next: GeneratedNFT[];
    if (newOnePosition === "custom") {
      const slot = parseInt(newOneSlot);
      if (!slot || slot < 1) {
        alert("Pick a valid position.");
        return;
      }
      const insertIdx = Math.min(slot - 1, generated.length);
      next = [...generated.slice(0, insertIdx), newNFT, ...generated.slice(insertIdx)];
    } else {
      next = [...generated, newNFT];
    }
    // Reassign sequential tokenIds
    setGenerated(next.map((nft, i) => ({ ...nft, tokenId: i + 1 })));

    setAddingOneOfOne(false);
    setNewOneName("");
    setNewOneImage(null);
    setNewOnePosition("end");
    setNewOneSlot("");
  };

  const handleOneOfOneFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewOneImage(URL.createObjectURL(file));
    e.target.value = "";
  };

  const toggleFilter = (layerId: string, traitId: string) => {
    setFilters((f) => {
      const next = { ...f };
      const current = new Set(next[layerId] || []);
      if (current.has(traitId)) current.delete(traitId);
      else current.add(traitId);
      if (current.size === 0) delete next[layerId];
      else next[layerId] = current;
      return next;
    });
  };

  const clearFilters = () => {
    setFilters({});
    setOneOfOneFilter("all");
  };

  // Apply filters
  const filteredGenerated = generated.filter((nft) => {
    if (oneOfOneFilter === "oneOfOne" && !nft.isOneOfOne) return false;
    if (oneOfOneFilter === "generated" && nft.isOneOfOne) return false;
    for (const [layerId, traitSet] of Object.entries(filters)) {
      if (nft.isOneOfOne) return false; // 1/1s have no traits, can't match
      const match = nft.traits.find((t) => t.layerId === layerId);
      if (!match || !traitSet.has(match.traitId)) return false;
    }
    return true;
  });

  const hasActiveFilters = Object.keys(filters).length > 0 || oneOfOneFilter !== "all";

  // Delete a single NFT (and renumber)
  const deleteNFT = (tokenId: number) => {
    const next = generated.filter((g) => g.tokenId !== tokenId);
    setGenerated(next.map((nft, i) => ({ ...nft, tokenId: i + 1 })));
    setSelected((s) => {
      const n = new Set(s);
      n.delete(tokenId);
      return n;
    });
    if (editingTokenId === tokenId) setEditingTokenId(null);
  };

  const toggleSelect = (tokenId: number) => {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(tokenId)) n.delete(tokenId);
      else n.add(tokenId);
      return n;
    });
  };

  const selectAllFiltered = () => {
    setSelected(new Set(filteredGenerated.map((g) => g.tokenId)));
  };

  const clearSelection = () => {
    setSelected(new Set());
  };

  const deleteSelected = () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} NFT${selected.size === 1 ? "" : "s"}?`)) return;
    const next = generated.filter((g) => !selected.has(g.tokenId));
    setGenerated(next.map((nft, i) => ({ ...nft, tokenId: i + 1 })));
    setSelected(new Set());
    setSelectionMode(false);
  };

  // Save collection data to localStorage and navigate to /create
  const confirmLaunch = () => {
    const payload = {
      name: collectionName,
      tagline,
      description,
      supply: generated.length,
      generatedCount: generated.filter((g) => !g.isOneOfOne).length,
      oneOfOneCount: generated.filter((g) => g.isOneOfOne).length,
      layerCount: layers.length,
      traitCount: totalTraits,
      createdAt: new Date().toISOString(),
    };
    if (typeof window !== "undefined") {
      localStorage.setItem("rugworld:collection", JSON.stringify(payload));
      // Persist generated NFT list for the launch/upload step.
      // imageUrl values are blob: URLs valid only while this tab stays open.
      const minimal = generated.map((nft) => ({
        tokenId: nft.tokenId,
        dna: nft.dna,
        isOneOfOne: nft.isOneOfOne || false,
        customImage: nft.customImage,
        customName: nft.customName,
        traits: nft.traits.map((t) => ({
          layerName: t.layerName,
          traitName: t.traitName,
          imageUrl: t.imageUrl,
        })),
      }));
      try {
        localStorage.setItem("rugworld:generated", JSON.stringify(minimal));
      } catch {
        console.warn("localStorage full; generated list not persisted");
      }
    }
    router.push("/create");
  };

  const canLaunch = collectionName.trim().length > 0 && generated.length > 0;

  const input = "px-3 py-1.5 bg-[#EDE3BC] border border-[#C4B99A] text-[13px] text-[#2F2B28] focus:border-[#A64C4F] outline-none transition-colors";
  const totalRarity = selectedLayer?.traits.reduce((s, t) => s + t.rarity, 0) || 0;
  const canGenerate = layers.length > 0 && layers.every((l) => l.traits.length > 0);

  return (
    <div className="pt-[72px] min-h-screen bg-[#EDE3BC]">
      <div className="container-main py-[clamp(32px,4vw,56px)]">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileInput}
        />

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-[clamp(32px,4vw,48px)] font-black text-[#2F2B28] leading-[1]">
                  Art Studio
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-[#2F2B28] text-[#EDE3BC]">
                  Off-chain
                </span>
              </div>
              <p className="text-[clamp(14px,1.2vw,16px)] text-[#826D62] max-w-[560px]">
                Add collection details, build layers, upload traits, generate unique NFTs. Everything runs off-chain until you launch.
              </p>
            </div>
            <div className="flex items-center gap-6 text-right">
              <div>
                <span className="block text-[11px] font-mono text-[#826D62] uppercase tracking-wider">Layers</span>
                <span className="block text-[20px] font-bold text-[#2F2B28]">{layers.length}</span>
              </div>
              <div>
                <span className="block text-[11px] font-mono text-[#826D62] uppercase tracking-wider">Traits</span>
                <span className="block text-[20px] font-bold text-[#2F2B28]">{totalTraits}</span>
              </div>
              <div>
                <span className="block text-[11px] font-mono text-[#826D62] uppercase tracking-wider">Max Combos</span>
                <span className="block text-[20px] font-bold text-[#A64C4F]">{maxCombinations.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Collection basics */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="border border-[#C4B99A] bg-[#EDE3BC] p-5 mb-8"
        >
          <div className="border-b border-[#C4B99A] mb-4 pb-3 flex items-center justify-between">
            <div>
              <span className="block text-[12px] font-mono text-[#A64C4F]">01</span>
              <span className="text-[15px] font-semibold text-[#2F2B28]">Collection Details</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono text-[#826D62] uppercase tracking-wider mb-1">Collection Name *</label>
              <input
                className="w-full px-3 py-2 bg-[#EDE3BC] border border-[#C4B99A] text-[14px] text-[#2F2B28] focus:border-[#A64C4F] outline-none"
                placeholder="e.g. Shadow Ronin"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-[#826D62] uppercase tracking-wider mb-1">Tagline</label>
              <input
                className="w-full px-3 py-2 bg-[#EDE3BC] border border-[#C4B99A] text-[14px] text-[#2F2B28] focus:border-[#A64C4F] outline-none"
                placeholder="One-liner that captures your collection"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
              />
            </div>
            <div className="lg:col-span-2">
              <label className="block text-[11px] font-mono text-[#826D62] uppercase tracking-wider mb-1">Description</label>
              <textarea
                className="w-full px-3 py-2 bg-[#EDE3BC] border border-[#C4B99A] text-[14px] text-[#2F2B28] focus:border-[#A64C4F] outline-none min-h-[96px] resize-y"
                placeholder="Tell the world what your collection is about"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        </motion.section>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-5">
          {/* Layers sidebar */}
          <motion.aside
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="border border-[#C4B99A] bg-[#EDE3BC] p-4 self-start"
          >
            <div className="mb-3">
              <span className="text-[12px] font-mono text-[#826D62] uppercase tracking-wider">Layers</span>
              <p className="text-[11px] text-[#8A8480] mt-1 leading-[1.4]">
                Top renders behind, bottom on top. Drag to reorder.
              </p>
            </div>

            {/* Add layer */}
            <div className="flex items-center gap-2 mb-4">
              <input
                className={input + " flex-1"}
                placeholder="Layer name"
                value={newLayerName}
                onChange={(e) => setNewLayerName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addLayer()}
              />
              <button
                onClick={addLayer}
                disabled={!newLayerName.trim()}
                className="px-3 py-1.5 text-[12px] font-semibold text-[#EDE3BC] bg-[#A64C4F] hover:bg-[#8a3d40] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                +
              </button>
            </div>

            {layers.length === 0 ? (
              <p className="text-[12px] text-[#8A8480] italic py-6 text-center">
                No layers yet. Add your first layer (e.g. Background).
              </p>
            ) : (
              <div className="space-y-1">
                {layers.map((layer, i) => {
                  const isSelected = selectedLayerId === layer.id;
                  const isDragging = draggingId === layer.id;
                  const isOver = dragOverId === layer.id && draggingId !== layer.id;
                  return (
                    <div
                      key={layer.id}
                      draggable
                      onDragStart={(e) => {
                        setDraggingId(layer.id);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        setDragOverId(layer.id);
                      }}
                      onDragLeave={() => setDragOverId(null)}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggingId) moveLayerTo(draggingId, layer.id);
                        setDraggingId(null);
                        setDragOverId(null);
                      }}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setDragOverId(null);
                      }}
                      className={`relative flex items-center transition-all ${
                        isSelected ? "bg-[#A64C4F] text-[#EDE3BC]" : "hover:bg-[#C4B99A]/30"
                      } ${isDragging ? "opacity-40" : ""} ${isOver ? "ring-2 ring-[#A64C4F] ring-inset" : ""}`}
                    >
                      {/* Grip handle */}
                      <div
                        className={`px-2 py-2.5 cursor-grab active:cursor-grabbing flex items-center justify-center ${
                          isSelected ? "text-[#EDE3BC]/70" : "text-[#8A8480] hover:text-[#2F2B28]"
                        }`}
                        aria-label="Drag to reorder"
                      >
                        <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
                          <circle cx="2" cy="3" r="1.3" />
                          <circle cx="8" cy="3" r="1.3" />
                          <circle cx="2" cy="8" r="1.3" />
                          <circle cx="8" cy="8" r="1.3" />
                          <circle cx="2" cy="13" r="1.3" />
                          <circle cx="8" cy="13" r="1.3" />
                        </svg>
                      </div>

                      <button
                        onClick={() => setSelectedLayerId(layer.id)}
                        className="flex-1 text-left pr-3 py-2.5 flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2">
                          <span className={`text-[10px] font-mono ${isSelected ? "text-[#EDE3BC]/60" : "text-[#8A8480]"}`}>
                            0{i + 1}
                          </span>
                          <span className="text-[13px] font-medium truncate">{layer.name}</span>
                        </span>
                        <span className={`text-[11px] font-mono ${isSelected ? "text-[#EDE3BC]/70" : "text-[#8A8480]"}`}>
                          {layer.traits.length}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.aside>

          {/* Main trait editor */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="border border-[#C4B99A] bg-[#EDE3BC]"
          >
            {!selectedLayer ? (
              <div className="p-16 text-center">
                <p className="text-[14px] text-[#826D62] mb-2">No layer selected</p>
                <p className="text-[12px] text-[#8A8480]">
                  {layers.length === 0 ? "Add your first layer on the left to get started." : "Pick a layer from the left."}
                </p>
              </div>
            ) : (
              <>
                <div className="p-5 border-b border-[#C4B99A] flex items-center gap-3 flex-wrap">
                  <input
                    className="text-[18px] font-bold text-[#2F2B28] bg-transparent border-none outline-none flex-1 min-w-[120px]"
                    value={selectedLayer.name}
                    onChange={(e) => updateLayerName(selectedLayer.id, e.target.value)}
                  />
                  {selectedLayer.traits.length > 0 && (
                    <button
                      onClick={() => equalizeRarity(selectedLayer.id)}
                      className="px-3 py-1.5 text-[12px] font-semibold text-[#2F2B28] border border-[#C4B99A] hover:border-[#A64C4F] hover:text-[#A64C4F] transition-colors"
                    >
                      Equalize
                    </button>
                  )}
                  <button onClick={addManualTrait} className="px-3 py-1.5 text-[12px] font-semibold text-[#A64C4F] border border-[#A64C4F]/40 hover:bg-[#A64C4F]/5 transition-colors">
                    + Trait
                  </button>
                  <button onClick={() => removeLayer(selectedLayer.id)} className="px-3 py-1.5 text-[12px] text-[#826D62] border border-[#C4B99A] hover:border-[#A64C4F] hover:text-[#A64C4F] transition-colors">
                    Delete Layer
                  </button>
                </div>

                {/* Total weight at top */}
                {selectedLayer.traits.length > 0 && (
                  <div className="px-5 py-3 border-b border-[#C4B99A] bg-[#C4B99A]/15 flex items-center justify-between text-[12px]">
                    <span className="font-mono text-[#826D62] uppercase tracking-wider">Total Weight</span>
                    <span className={`font-mono font-bold ${
                      totalRarity === 100 ? "text-[#A64C4F]" : "text-[#DEA831]"
                    }`}>
                      {totalRarity}% {totalRarity !== 100 && "(will be normalized)"}
                    </span>
                  </div>
                )}

                {/* Upload zone */}
                <div className="p-5 border-b border-[#C4B99A]">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-[#A64C4F]"); }}
                    onDragLeave={(e) => e.currentTarget.classList.remove("border-[#A64C4F]")}
                    onDrop={(e) => { handleDrop(e); e.currentTarget.classList.remove("border-[#A64C4F]"); }}
                    className="border-2 border-dashed border-[#C4B99A] p-6 text-center hover:border-[#A64C4F]/50 transition-colors cursor-pointer"
                  >
                    <div className="w-10 h-10 bg-[#A64C4F]/8 mx-auto mb-3 flex items-center justify-center">
                      <span className="text-[16px] font-black text-[#A64C4F]">+</span>
                    </div>
                    <p className="text-[13px] font-semibold text-[#2F2B28]">Click or drop trait images</p>
                    <p className="text-[11px] text-[#8A8480] mt-1">
                      PNG transparent. Same dimensions across all layers. Up to 4K per file.
                    </p>
                  </div>
                </div>

                {/* Trait table */}
                <div className="divide-y divide-[#C4B99A]">
                  <div className="grid grid-cols-[60px_1fr_100px_100px_40px] gap-3 px-5 py-2.5 text-[10px] font-mono text-[#826D62] uppercase tracking-wider">
                    <span>Image</span>
                    <span>Name</span>
                    <span className="text-right">Rarity %</span>
                    <span>Est. Count</span>
                    <span></span>
                  </div>

                  {selectedLayer.traits.length === 0 ? (
                    <div className="px-5 py-10 text-center">
                      <p className="text-[13px] text-[#826D62]">No traits yet. Upload images or add one manually.</p>
                    </div>
                  ) : (
                    selectedLayer.traits.map((trait) => {
                      const supplyEst = Math.round(
                        ((parseInt(targetSupply) || 0) * trait.rarity) / Math.max(1, totalRarity)
                      );
                      return (
                        <div key={trait.id} className="grid grid-cols-[60px_1fr_100px_100px_40px] gap-3 px-5 py-2.5 items-center hover:bg-[#C4B99A]/10 transition-colors">
                          <div className="w-10 h-10 bg-[#2F2B28]/[0.04] flex items-center justify-center overflow-hidden">
                            {trait.imageUrl ? (
                              <img src={trait.imageUrl} alt={trait.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[14px] font-black text-[#2F2B28]/20">{trait.name[0] || "?"}</span>
                            )}
                          </div>
                          <input
                            className={input}
                            value={trait.name}
                            onChange={(e) => updateTrait(selectedLayer.id, trait.id, "name", e.target.value)}
                          />
                          <input
                            className={input + " text-right font-mono"}
                            type="number"
                            min={0}
                            max={100}
                            value={trait.rarity}
                            onChange={(e) => updateTrait(selectedLayer.id, trait.id, "rarity", parseFloat(e.target.value) || 0)}
                          />
                          <span className="text-[12px] font-mono text-[#826D62]">
                            ~{supplyEst.toLocaleString()}
                          </span>
                          <button
                            onClick={() => removeTrait(selectedLayer.id, trait.id)}
                            className="w-6 h-6 flex items-center justify-center text-[#8A8480] hover:text-[#A64C4F] transition-colors text-[14px]"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

              </>
            )}
          </motion.section>

          {/* Generation panel */}
          <motion.aside
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="space-y-4 lg:sticky lg:top-[88px] self-start"
          >
            {/* Sample preview */}
            <div className="border border-[#C4B99A] bg-[#EDE3BC]">
              <div className="aspect-square bg-[#2F2B28]/[0.03] relative overflow-hidden">
                {generated.length > 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[72px] font-black text-[#A64C4F]/30">
                      #{generated[generated.length - 1].tokenId}
                    </span>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[14px] text-[#8A8480]">No preview yet</span>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 flex gap-1.5">
                  {layers.map((_, i) => (
                    <span key={i} className="w-2 h-2 rounded-full bg-[#A64C4F]/40" />
                  ))}
                </div>
              </div>
              {generated.length > 0 && (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] font-mono text-[#826D62] uppercase tracking-wider">Latest Sample</p>
                    <p className="text-[10px] font-mono text-[#A64C4F]">
                      DNA {generated[generated.length - 1].dna}
                    </p>
                  </div>
                  <div className="space-y-1 text-[12px]">
                    {generated[generated.length - 1].traits.map((t, i) => (
                      <div key={i} className="flex justify-between">
                        <span className="text-[#826D62]">{t.layerName}</span>
                        <span className="text-[#2F2B28] font-medium">{t.traitName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Generate */}
            <div className="border border-[#C4B99A] bg-[#EDE3BC] p-4">
              <p className="text-[11px] font-mono text-[#826D62] uppercase tracking-wider mb-3">Generate Collection</p>

              <label className="block text-[11px] text-[#826D62] mb-1">Target Supply</label>
              <input
                className="w-full px-3 py-2 bg-[#EDE3BC] border border-[#C4B99A] text-[14px] text-[#2F2B28] focus:border-[#A64C4F] outline-none mb-3"
                type="number"
                value={targetSupply}
                onChange={(e) => setTargetSupply(e.target.value)}
              />

              {maxCombinations > 0 && maxCombinations < (parseInt(targetSupply) || 0) && (
                <p className="text-[11px] text-[#DEA831] mb-3">
                  Only {maxCombinations.toLocaleString()} unique DNAs possible. Add more traits for larger supply.
                </p>
              )}

              <AnimatePresence>
                {(generating || generated.length > 0) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mb-3"
                  >
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-[#826D62]">{generating ? "Generating" : "Generated"}</span>
                      <span className="font-mono text-[#2F2B28]">
                        {generated.length.toLocaleString()} / {parseInt(targetSupply).toLocaleString()}
                      </span>
                    </div>
                    <div className="h-[4px] bg-[#C4B99A]/50 overflow-hidden mb-1">
                      <div
                        className="h-full bg-[#A64C4F] transition-all"
                        style={{ width: `${(generated.length / (parseInt(targetSupply) || 1)) * 100}%` }}
                      />
                    </div>
                    {collisions > 0 && (
                      <p className="text-[10px] font-mono text-[#8A8480]">
                        {collisions.toLocaleString()} collision{collisions === 1 ? "" : "s"} rejected (duplicate DNA)
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={runGeneration}
                disabled={generating || !canGenerate}
                className="w-full py-3 text-[14px] font-bold text-[#EDE3BC] bg-[#A64C4F] hover:bg-[#8a3d40] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {generating ? "Generating..." : generated.length > 0 ? "Regenerate" : "Start Generation"}
              </button>

              {!canGenerate && (
                <p className="text-[11px] text-[#8A8480] mt-2">
                  Add at least one trait to every layer before generating.
                </p>
              )}

              <p className="text-[10px] text-[#8A8480] mt-2 leading-[1.4]">
                Each NFT gets a unique DNA hash from its trait combination. Assets stored on IPFS + Arweave, chunked for large collections.
              </p>
            </div>

            {/* Info */}
            <div className="border border-[#C4B99A] bg-[#C4B99A]/15 p-4">
              <p className="text-[12px] font-semibold text-[#2F2B28] mb-2">How DNA works</p>
              <p className="text-[11px] text-[#826D62] leading-[1.6]">
                Each NFT's DNA is a hash of its trait IDs. Two NFTs with the exact same trait combo produce the same DNA, so we reject duplicates and re-roll. This guarantees every piece in your collection is unique.
              </p>
            </div>
          </motion.aside>
        </div>

        {/* Gallery */}
        {generated.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="mt-10"
          >
            <div className="border-b border-[#C4B99A] mb-5 pb-3 flex items-end justify-between flex-wrap gap-3">
              <div>
                <span className="text-[15px] font-semibold text-[#2F2B28]">
                  Generated Collection
                </span>
                <p className="text-[12px] text-[#826D62] mt-1">
                  {filteredGenerated.length.toLocaleString()}{hasActiveFilters ? ` filtered` : ""} of {generated.length.toLocaleString()} total. Click any to edit.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {selectionMode ? (
                  <>
                    <span className="text-[12px] font-mono text-[#826D62]">
                      {selected.size} selected
                    </span>
                    <button
                      onClick={selectAllFiltered}
                      className="px-3 py-1.5 text-[12px] font-semibold text-[#2F2B28] border border-[#C4B99A] hover:border-[#A64C4F] transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      onClick={deleteSelected}
                      disabled={selected.size === 0}
                      className="px-3 py-1.5 text-[12px] font-semibold text-[#EDE3BC] bg-[#A64C4F] hover:bg-[#8a3d40] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Delete ({selected.size})
                    </button>
                    <button
                      onClick={() => { setSelectionMode(false); clearSelection(); }}
                      className="px-3 py-1.5 text-[12px] font-semibold text-[#826D62] border border-[#C4B99A] hover:border-[#A64C4F] hover:text-[#A64C4F] transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setSelectionMode(true)}
                      className="px-3 py-1.5 text-[12px] font-semibold text-[#2F2B28] border border-[#C4B99A] hover:border-[#A64C4F] hover:text-[#A64C4F] transition-colors"
                    >
                      Select
                    </button>
                    <button
                      onClick={shuffleGenerated}
                      className="px-3 py-1.5 text-[12px] font-semibold text-[#2F2B28] border border-[#C4B99A] hover:border-[#A64C4F] hover:text-[#A64C4F] transition-colors"
                    >
                      Shuffle All
                    </button>
                    <button
                      onClick={() => setAddingOneOfOne(true)}
                      className="px-3 py-1.5 text-[12px] font-semibold text-[#DEA831] border border-[#DEA831]/50 hover:bg-[#DEA831]/10 transition-colors"
                    >
                      + Add 1/1
                    </button>
                    <button
                      onClick={() => setLaunchOpen(true)}
                      disabled={!canLaunch}
                      className="px-4 py-1.5 text-[12px] font-bold text-[#EDE3BC] bg-[#A64C4F] hover:bg-[#8a3d40] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Launch Collection →
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5">
              {/* Filters sidebar */}
              <aside className="border border-[#C4B99A] bg-[#EDE3BC] self-start">
                <div className="p-4 border-b border-[#C4B99A] flex items-center justify-between">
                  <span className="text-[12px] font-mono text-[#826D62] uppercase tracking-wider">Filters</span>
                  {hasActiveFilters && (
                    <button onClick={clearFilters} className="text-[11px] text-[#A64C4F] hover:underline">Clear</button>
                  )}
                </div>

                <div className="max-h-[600px] overflow-y-auto">
                  {/* Type filter */}
                  <div className="border-b border-[#C4B99A]">
                    <button
                      onClick={() => setOpenFilterSections((s) => ({ ...s, type: !s.type }))}
                      className="w-full flex items-center justify-between p-4 hover:bg-[#C4B99A]/20 transition-colors"
                    >
                      <span className="text-[11px] font-semibold text-[#2F2B28]">Type</span>
                      <span className="flex items-center gap-2">
                        {oneOfOneFilter !== "all" && (
                          <span className="text-[10px] font-mono text-[#A64C4F]">active</span>
                        )}
                        <svg
                          width="10" height="10" viewBox="0 0 10 10"
                          className={`transition-transform ${openFilterSections.type ? "rotate-180" : ""}`}
                          fill="none" stroke="currentColor" strokeWidth="1.5"
                        >
                          <path d="M2 3.5 L5 6.5 L8 3.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </button>
                    {openFilterSections.type && (
                      <div className="px-4 pb-4 space-y-1">
                        {([
                          { key: "all", label: "All" },
                          { key: "generated", label: "Generated" },
                          { key: "oneOfOne", label: "1/1s" },
                        ] as const).map((opt) => (
                          <label key={opt.key} className="flex items-center gap-2 text-[12px] cursor-pointer">
                            <input
                              type="radio"
                              name="oneOfOneFilter"
                              checked={oneOfOneFilter === opt.key}
                              onChange={() => setOneOfOneFilter(opt.key)}
                              className="accent-[#A64C4F]"
                            />
                            <span className="text-[#2F2B28]">{opt.label}</span>
                            <span className="ml-auto text-[#8A8480] font-mono">
                              {opt.key === "all"
                                ? generated.length
                                : opt.key === "oneOfOne"
                                ? generated.filter((g) => g.isOneOfOne).length
                                : generated.filter((g) => !g.isOneOfOne).length}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Trait filters per layer */}
                  {layers.map((layer) => {
                    const isOpen = openFilterSections[layer.id] ?? false;
                    const activeCount = filters[layer.id]?.size ?? 0;
                    return (
                      <div key={layer.id} className="border-b border-[#C4B99A] last:border-b-0">
                        <button
                          onClick={() => setOpenFilterSections((s) => ({ ...s, [layer.id]: !isOpen }))}
                          className="w-full flex items-center justify-between p-4 hover:bg-[#C4B99A]/20 transition-colors"
                        >
                          <span className="text-[11px] font-semibold text-[#2F2B28]">{layer.name}</span>
                          <span className="flex items-center gap-2">
                            {activeCount > 0 && (
                              <span className="text-[10px] font-mono text-[#A64C4F]">{activeCount}</span>
                            )}
                            <svg
                              width="10" height="10" viewBox="0 0 10 10"
                              className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
                              fill="none" stroke="currentColor" strokeWidth="1.5"
                            >
                              <path d="M2 3.5 L5 6.5 L8 3.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-4 space-y-1">
                            {layer.traits.map((trait) => {
                              const active = filters[layer.id]?.has(trait.id) ?? false;
                              const count = generated.filter((g) =>
                                !g.isOneOfOne && g.traits.some((t) => t.layerId === layer.id && t.traitId === trait.id)
                              ).length;
                              return (
                                <label key={trait.id} className="flex items-center gap-2 text-[12px] cursor-pointer hover:text-[#A64C4F] transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={active}
                                    onChange={() => toggleFilter(layer.id, trait.id)}
                                    className="accent-[#A64C4F]"
                                  />
                                  <span className={active ? "text-[#A64C4F] font-medium" : "text-[#2F2B28]"}>{trait.name}</span>
                                  <span className="ml-auto text-[#8A8480] font-mono">{count}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </aside>

              {/* Gallery content */}
              <div>
                {/* Swap controls */}
                <div className="border border-[#C4B99A] bg-[#EDE3BC] p-4 mb-4 flex items-center gap-3 flex-wrap">
                  <span className="text-[12px] font-mono text-[#826D62] uppercase tracking-wider">Swap Positions</span>
                  <input
                    type="number"
                    placeholder="Token A"
                    value={swapA}
                    onChange={(e) => setSwapA(e.target.value)}
                    className="w-24 px-3 py-1.5 bg-[#EDE3BC] border border-[#C4B99A] text-[13px] text-[#2F2B28] focus:border-[#A64C4F] outline-none"
                  />
                  <span className="text-[#8A8480]">↔</span>
                  <input
                    type="number"
                    placeholder="Token B"
                    value={swapB}
                    onChange={(e) => setSwapB(e.target.value)}
                    className="w-24 px-3 py-1.5 bg-[#EDE3BC] border border-[#C4B99A] text-[13px] text-[#2F2B28] focus:border-[#A64C4F] outline-none"
                  />
                  <button
                    onClick={swapTokens}
                    disabled={!swapA || !swapB || swapA === swapB}
                    className="px-4 py-1.5 text-[13px] font-semibold text-[#EDE3BC] bg-[#A64C4F] hover:bg-[#8a3d40] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Swap
                  </button>
                  <p className="text-[11px] text-[#8A8480] ml-auto">
                    e.g. swap #4 with #555
                  </p>
                </div>

                {/* Scrollable grid */}
                <div className="border border-[#C4B99A] bg-[#EDE3BC] max-h-[70vh] overflow-y-auto p-3">
                  {filteredGenerated.length === 0 ? (
                    <div className="py-20 text-center">
                      <p className="text-[13px] text-[#826D62]">No NFTs match the current filters.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
                      {filteredGenerated.map((nft) => {
                        const isSelected = selected.has(nft.tokenId);
                        return (
                          <div
                            key={nft.tokenId}
                            onClick={() => selectionMode ? toggleSelect(nft.tokenId) : setEditingTokenId(nft.tokenId)}
                            className={`border bg-[#EDE3BC] cursor-pointer transition-all group relative ${
                              isSelected
                                ? "border-[#A64C4F] ring-2 ring-[#A64C4F]/30"
                                : "border-[#C4B99A] hover:border-[#A64C4F]"
                            }`}
                          >
                            {/* Selection checkbox */}
                            {selectionMode && (
                              <span className={`absolute top-1.5 left-1.5 z-10 w-5 h-5 flex items-center justify-center border-2 ${
                                isSelected
                                  ? "bg-[#A64C4F] border-[#A64C4F]"
                                  : "bg-[#EDE3BC] border-[#C4B99A]"
                              }`}>
                                {isSelected && (
                                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#EDE3BC" strokeWidth="2">
                                    <path d="M2 6.5 L5 9 L10 3" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </span>
                            )}

                            {nft.isOneOfOne && (
                              <span className="absolute top-1.5 right-1.5 z-10 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-[#DEA831] text-[#2F2B28]">
                                1/1
                              </span>
                            )}

                            {/* Quick delete button (only when not in selection mode) */}
                            {!selectionMode && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`Delete #${nft.tokenId}?`)) deleteNFT(nft.tokenId);
                                }}
                                className="absolute top-1.5 left-1.5 z-10 w-6 h-6 flex items-center justify-center bg-[#EDE3BC]/90 border border-[#C4B99A] opacity-0 group-hover:opacity-100 hover:border-[#A64C4F] hover:text-[#A64C4F] transition-all"
                                aria-label="Delete"
                              >
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                                  <path d="M2 2.5 L8 8.5 M8 2.5 L2 8.5" strokeLinecap="round" />
                                </svg>
                              </button>
                            )}

                            <div className="aspect-square bg-[#2F2B28]/[0.03] relative overflow-hidden">
                              {nft.isOneOfOne && nft.customImage ? (
                                <img src={nft.customImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
                              ) : (
                                nft.traits.map((t, i) =>
                                  t.imageUrl ? (
                                    <img
                                      key={i}
                                      src={t.imageUrl}
                                      alt=""
                                      className="absolute inset-0 w-full h-full object-cover"
                                    />
                                  ) : null
                                )
                              )}
                            </div>
                            <div className="px-2 py-1.5 flex items-center justify-between gap-2">
                              <span className="text-[11px] font-mono font-semibold text-[#2F2B28]">
                                #{nft.tokenId}
                              </span>
                              {nft.isOneOfOne && nft.customName && (
                                <span className="text-[10px] text-[#8A8480] truncate">
                                  {nft.customName}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </div>

      {/* Hidden 1/1 file input */}
      <input
        ref={oneOfOneFileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleOneOfOneFile}
      />

      {/* Add 1/1 modal */}
      <AnimatePresence>
        {addingOneOfOne && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-[#2F2B28]/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => { setAddingOneOfOne(false); setNewOneName(""); setNewOneImage(null); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#EDE3BC] border border-[#C4B99A] max-w-[480px] w-full"
            >
              <div className="p-5 border-b border-[#C4B99A] flex items-center justify-between">
                <div>
                  <h3 className="text-[18px] font-bold text-[#2F2B28]">Add 1/1</h3>
                  <p className="text-[11px] text-[#826D62] mt-0.5">Custom single piece, not generated from layers</p>
                </div>
                <button
                  onClick={() => { setAddingOneOfOne(false); setNewOneName(""); setNewOneImage(null); }}
                  className="w-8 h-8 flex items-center justify-center text-[#826D62] hover:text-[#A64C4F] text-[18px]"
                >
                  ×
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div
                  onClick={() => oneOfOneFileRef.current?.click()}
                  className="aspect-square border-2 border-dashed border-[#C4B99A] hover:border-[#A64C4F]/50 cursor-pointer transition-colors relative overflow-hidden"
                >
                  {newOneImage ? (
                    <img src={newOneImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="w-10 h-10 bg-[#DEA831]/15 mx-auto mb-3 flex items-center justify-center">
                        <span className="text-[16px] font-black text-[#DEA831]">+</span>
                      </div>
                      <p className="text-[13px] font-semibold text-[#2F2B28]">Click to upload 1/1 art</p>
                      <p className="text-[11px] text-[#8A8480] mt-1">Any image. Final piece.</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[#826D62] uppercase tracking-wider mb-1">Name</label>
                  <input
                    type="text"
                    value={newOneName}
                    onChange={(e) => setNewOneName(e.target.value)}
                    placeholder="e.g. The Founder"
                    className="w-full px-3 py-2 bg-[#EDE3BC] border border-[#C4B99A] text-[14px] text-[#2F2B28] focus:border-[#A64C4F] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[#826D62] uppercase tracking-wider mb-2">Position</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[13px] cursor-pointer">
                      <input
                        type="radio"
                        name="onePosition"
                        checked={newOnePosition === "end"}
                        onChange={() => setNewOnePosition("end")}
                        className="accent-[#A64C4F]"
                      />
                      <span className="text-[#2F2B28]">Add at the end</span>
                      {generated.length > 0 && (
                        <span className="text-[11px] text-[#8A8480] font-mono ml-1">
                          (#{generated.length + 1})
                        </span>
                      )}
                    </label>
                    <label className="flex items-center gap-2 text-[13px] cursor-pointer">
                      <input
                        type="radio"
                        name="onePosition"
                        checked={newOnePosition === "custom"}
                        onChange={() => setNewOnePosition("custom")}
                        className="accent-[#A64C4F]"
                      />
                      <span className="text-[#2F2B28]">Insert at position</span>
                      <input
                        type="number"
                        min={1}
                        max={generated.length + 1}
                        value={newOneSlot}
                        onChange={(e) => { setNewOneSlot(e.target.value); setNewOnePosition("custom"); }}
                        placeholder="#"
                        className="w-20 px-2 py-1 bg-[#EDE3BC] border border-[#C4B99A] text-[13px] text-[#2F2B28] focus:border-[#A64C4F] outline-none"
                      />
                    </label>
                    {newOnePosition === "custom" && newOneSlot && (
                      <p className="text-[11px] text-[#8A8480] pl-6">
                        Existing tokens at and after position {newOneSlot} shift up by one.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-[#C4B99A] flex justify-end gap-2">
                <button
                  onClick={() => { setAddingOneOfOne(false); setNewOneName(""); setNewOneImage(null); }}
                  className="px-5 py-2.5 text-[13px] font-semibold text-[#2F2B28] border border-[#C4B99A] hover:border-[#A64C4F] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addOneOfOne}
                  disabled={!newOneImage || !newOneName.trim()}
                  className="px-5 py-2.5 text-[13px] font-semibold text-[#EDE3BC] bg-[#A64C4F] hover:bg-[#8a3d40] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Add 1/1
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Launch confirmation modal */}
      <AnimatePresence>
        {launchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-[#2F2B28]/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setLaunchOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#EDE3BC] border border-[#C4B99A] max-w-[480px] w-full"
            >
              <div className="p-5 border-b border-[#C4B99A] flex items-center justify-between">
                <div>
                  <h3 className="text-[18px] font-bold text-[#2F2B28]">Ready to launch?</h3>
                  <p className="text-[11px] text-[#826D62] mt-0.5">
                    Review your collection before moving forward
                  </p>
                </div>
                <button
                  onClick={() => setLaunchOpen(false)}
                  className="w-8 h-8 flex items-center justify-center text-[#826D62] hover:text-[#A64C4F] text-[18px]"
                >
                  ×
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="border border-[#C4B99A] p-4 space-y-2 text-[13px]">
                  <div className="flex justify-between">
                    <span className="text-[#826D62]">Collection</span>
                    <span className="text-[#2F2B28] font-bold">{collectionName}</span>
                  </div>
                  {tagline && (
                    <div className="flex justify-between">
                      <span className="text-[#826D62]">Tagline</span>
                      <span className="text-[#2F2B28] font-medium truncate ml-3">{tagline}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-[#826D62]">Total NFTs</span>
                    <span className="text-[#2F2B28] font-bold">{generated.length.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#826D62]">1/1 Pieces</span>
                    <span className="text-[#DEA831] font-medium">{generated.filter((g) => g.isOneOfOne).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#826D62]">Layers</span>
                    <span className="text-[#2F2B28] font-medium">{layers.length}</span>
                  </div>
                </div>

                <div className="border border-[#C4B99A] bg-[#C4B99A]/15 p-3">
                  <p className="text-[12px] text-[#2F2B28] font-semibold mb-1">Next step</p>
                  <p className="text-[11px] text-[#826D62] leading-[1.5]">
                    Set your mint phases, pre-mint amount for founder wallet, and confirm launch fee. Everything is off-chain.
                  </p>
                </div>
              </div>

              <div className="p-5 border-t border-[#C4B99A] flex justify-end gap-2">
                <button
                  onClick={() => setLaunchOpen(false)}
                  className="px-5 py-2.5 text-[13px] font-semibold text-[#2F2B28] border border-[#C4B99A] hover:border-[#A64C4F] transition-colors"
                >
                  Keep Editing
                </button>
                <button
                  onClick={confirmLaunch}
                  className="px-5 py-2.5 text-[13px] font-bold text-[#EDE3BC] bg-[#A64C4F] hover:bg-[#8a3d40] transition-colors"
                >
                  Continue to Launch →
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit modal */}
      <AnimatePresence>
        {editingTokenId !== null && (() => {
          const nft = generated.find((g) => g.tokenId === editingTokenId);
          if (!nft) return null;
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-[#2F2B28]/70 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setEditingTokenId(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#EDE3BC] border border-[#C4B99A] max-w-[720px] w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="p-5 border-b border-[#C4B99A] flex items-center justify-between">
                  <div>
                    <h3 className="text-[18px] font-bold text-[#2F2B28]">Edit #{nft.tokenId}</h3>
                    <p className="text-[11px] font-mono text-[#A64C4F] mt-0.5">DNA {nft.dna}</p>
                  </div>
                  <button
                    onClick={() => setEditingTokenId(null)}
                    className="w-8 h-8 flex items-center justify-center text-[#826D62] hover:text-[#A64C4F] text-[18px]"
                  >
                    ×
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-5 p-5">
                  {/* Preview */}
                  <div>
                    <div className="aspect-square bg-[#2F2B28]/[0.03] border border-[#C4B99A] relative overflow-hidden mb-3">
                      {nft.isOneOfOne && nft.customImage ? (
                        <img src={nft.customImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        nft.traits.map((t, i) =>
                          t.imageUrl ? (
                            <img
                              key={i}
                              src={t.imageUrl}
                              alt=""
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          ) : null
                        )
                      )}
                      <div className="absolute bottom-2 left-2 text-[24px] font-black text-[#2F2B28]/20">
                        #{nft.tokenId}
                      </div>
                      {nft.isOneOfOne && (
                        <span className="absolute top-2 right-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#DEA831] text-[#2F2B28]">
                          1/1
                        </span>
                      )}
                    </div>
                    {!nft.isOneOfOne && (
                      <>
                        <button
                          onClick={() => regenerateOne(nft.tokenId)}
                          className="w-full py-2.5 text-[13px] font-semibold text-[#EDE3BC] bg-[#A64C4F] hover:bg-[#8a3d40] transition-colors"
                        >
                          Regenerate (new random)
                        </button>
                        <p className="text-[11px] text-[#8A8480] mt-2 leading-[1.4]">
                          Rolls new random traits. Guaranteed unique DNA.
                        </p>
                      </>
                    )}
                  </div>

                  {/* Traits editor */}
                  <div>
                    {nft.isOneOfOne ? (
                      <>
                        <p className="text-[11px] font-mono text-[#826D62] uppercase tracking-wider mb-3">1/1 Details</p>
                        <div className="border border-[#C4B99A] p-4 space-y-3">
                          <div>
                            <span className="block text-[11px] text-[#826D62] mb-0.5">Name</span>
                            <span className="text-[14px] font-medium text-[#2F2B28]">{nft.customName}</span>
                          </div>
                          <div>
                            <span className="block text-[11px] text-[#826D62] mb-0.5">Type</span>
                            <span className="text-[14px] font-medium text-[#DEA831]">One of One</span>
                          </div>
                          <p className="text-[11px] text-[#8A8480] pt-2 border-t border-[#C4B99A] leading-[1.4]">
                            1/1s are custom single pieces. They're not generated from layered traits.
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-[11px] font-mono text-[#826D62] uppercase tracking-wider mb-3">Traits</p>
                        <div className="space-y-3">
                          {nft.traits.map((t) => {
                            const layer = layers.find((l) => l.id === t.layerId);
                            if (!layer) return null;
                            return (
                              <div key={t.layerId}>
                                <label className="block text-[11px] text-[#826D62] mb-1">{t.layerName}</label>
                                <select
                                  value={t.traitId}
                                  onChange={(e) => {
                                    const ok = setTraitOnNFT(nft.tokenId, t.layerId, e.target.value);
                                    if (!ok) {
                                      alert("That combination already exists as another NFT. DNA must be unique.");
                                    }
                                  }}
                                  className="w-full px-3 py-2 bg-[#EDE3BC] border border-[#C4B99A] text-[13px] text-[#2F2B28] focus:border-[#A64C4F] outline-none"
                                >
                                  {layer.traits.map((tr) => (
                                    <option key={tr.id} value={tr.id}>
                                      {tr.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-5 border-t border-[#C4B99A] flex justify-between items-center">
                  <button
                    onClick={() => {
                      if (confirm(`Delete #${nft.tokenId}? This cannot be undone.`)) {
                        deleteNFT(nft.tokenId);
                      }
                    }}
                    className="px-4 py-2.5 text-[13px] font-semibold text-[#A64C4F] border border-[#A64C4F]/30 hover:bg-[#A64C4F]/5 transition-colors"
                  >
                    Delete NFT
                  </button>
                  <button
                    onClick={() => setEditingTokenId(null)}
                    className="px-5 py-2.5 text-[13px] font-semibold text-[#2F2B28] border border-[#C4B99A] hover:border-[#A64C4F] transition-colors"
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
