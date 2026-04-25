"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export type TutorialScene = {
  id: string;
  title: string;
  caption: string;
  /** Override sceneMs for this scene only (e.g. quick scenes vs long ones). */
  ms?: number;
  render: () => ReactNode;
};

type Props = {
  eyebrow: string;
  scenes: TutorialScene[];
  sceneMs?: number;
  /** Inner stage dimensions — all scene positions are absolute against this. */
  stageWidth?: number;
  stageHeight?: number;
};

export function TutorialPlayer({
  eyebrow,
  scenes,
  sceneMs = 6000,
  stageWidth = 640,
  stageHeight = 320,
}: Props) {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);

  // Re-arm a setTimeout each time idx changes; clean up on unmount or pause.
  useEffect(() => {
    if (!playing) return;
    const ms = scenes[idx]?.ms ?? sceneMs;
    const t = window.setTimeout(
      () => setIdx((i) => (i + 1) % scenes.length),
      ms,
    );
    return () => window.clearTimeout(t);
  }, [idx, playing, sceneMs, scenes]);

  // Responsive scale: fit the fixed inner stage to whatever width the card lands at.
  // Allow upscale so the tutorial fills the available space on wide screens too.
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / stageWidth);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [stageWidth]);

  const scene = scenes[idx];
  const currentMs = scene?.ms ?? sceneMs;
  const aspect = `${stageWidth} / ${stageHeight}`;

  return (
    <div
      className="card"
      style={{
        padding: 0,
        marginBottom: 28,
        marginLeft: "auto",
        marginRight: "auto",
        maxWidth: 820,
        overflow: "hidden",
      }}
    >
      <div
        ref={containerRef}
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: aspect,
          background: "linear-gradient(180deg, var(--bg-elev), var(--bg-elev-2))",
          overflow: "hidden",
        }}
      >
        {/* Scaled stage — scene contents live here, no overlays on top */}
        <div
          key={scene.id}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: stageWidth,
            height: stageHeight,
            transformOrigin: "top left",
            transform: `scale(${scale})`,
          }}
        >
          {scene.render()}
        </div>
      </div>

      {/* Caption strip — its own row, never collides with the scene */}
      <div
        style={{
          padding: "12px 16px 10px",
          borderTop: "1px solid var(--border)",
        }}
      >
        <div className="eyebrow" style={{ fontSize: 9 }}>
          {eyebrow}
        </div>
        <div
          className="serif"
          style={{ fontSize: 17, fontWeight: 400, marginTop: 2, letterSpacing: "-0.01em" }}
        >
          {scene.title}
        </div>
        <div className="text-muted" style={{ fontSize: 11.5, marginTop: 1, lineHeight: 1.4 }}>
          {scene.caption}
        </div>
      </div>

      <div
        className="hstack"
        style={{ padding: "10px 14px", borderTop: "1px solid var(--border)", gap: 10 }}
      >
        <button
          className="chip-btn ghost"
          style={{ height: 26, fontSize: 11, padding: "0 10px", gap: 6 }}
          onClick={() => setPlaying((p) => !p)}
        >
          <span style={{ fontSize: 13, lineHeight: 1 }}>{playing ? "⏸" : "▶"}</span>
          {playing ? "Pause" : "Play"}
        </button>
        <span className="text-micro mono">
          {idx + 1} / {scenes.length} · auto
        </span>
        <div className="spacer" />
        <div className="hstack" style={{ gap: 5 }}>
          {scenes.map((s, i) => {
            const active = i === idx;
            return (
              <button
                key={s.id}
                onClick={() => setIdx(i)}
                aria-label={s.title}
                title={s.title}
                style={{
                  width: active ? 36 : 8,
                  height: 4,
                  borderRadius: 2,
                  border: "none",
                  background: "var(--border-strong)",
                  cursor: "pointer",
                  padding: 0,
                  transition: "width 0.25s ease",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {active && (
                  <span
                    key={`${idx}-${playing}`}
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "var(--accent)",
                      transformOrigin: "left",
                      animation: playing
                        ? `tp-fill ${currentMs}ms linear forwards`
                        : undefined,
                      transform: playing ? undefined : "scaleX(1)",
                      display: "block",
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
      <style>{`@keyframes tp-fill { from { transform: scaleX(0); } to { transform: scaleX(1); } }`}</style>
    </div>
  );
}
