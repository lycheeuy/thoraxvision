"use client";

/**
 * X-ray viewer with two modes.
 *
 *  side-by-side : original and Grad-CAM in adjacent panels (the default —
 *                 lets the eye compare freely).
 *  compare      : the two images stacked, with a draggable divider that wipes
 *                 between them, so a region can be checked against its heatmap
 *                 in exactly the same position.
 *
 * Pure presentation — both URLs are already absolute (predictionService).
 */
import { Columns2, SlidersHorizontal } from "lucide-react";
import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ViewMode = "side" | "compare";

function ModeToggle({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border border-border/70 bg-muted/50 p-0.5">
      <button
        onClick={() => onChange("side")}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
          mode === "side" ? "bg-card text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Columns2 className="h-3.5 w-3.5" /> Side by side
      </button>
      <button
        onClick={() => onChange("compare")}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
          mode === "compare" ? "bg-card text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <SlidersHorizontal className="h-3.5 w-3.5" /> Compare
      </button>
    </div>
  );
}

function Panel({ src, label, accent = false }: { src: string; label: string; accent?: boolean }) {
  return (
    <figure className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
      <div className="relative aspect-square bg-slate-950">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={label} className="h-full w-full object-contain" />
        <span
          className={cn(
            "absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider backdrop-blur",
            accent ? "bg-ai/85 text-white" : "bg-black/55 text-white",
          )}
        >
          {label}
        </span>
      </div>
    </figure>
  );
}

/** Draggable wipe: Grad-CAM revealed over the original by a vertical divider. */
function CompareView({ originalSrc, gradcamSrc }: { originalSrc: string; gradcamSrc: string }) {
  const [pos, setPos] = useState(50); // percent
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const setFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, pct)));
  }, []);

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setFromClientX(e.clientX);
  }
  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (dragging.current) setFromClientX(e.clientX);
  }
  function onPointerUp() {
    dragging.current = false;
  }

  return (
    <figure className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
      <div
        ref={containerRef}
        className="relative aspect-square cursor-ew-resize select-none bg-slate-950"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {/* base: original */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={originalSrc} alt="Original" className="pointer-events-none absolute inset-0 h-full w-full object-contain" />

        {/* overlay: gradcam, clipped to the divider */}
        <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={gradcamSrc}
            alt="Grad-CAM"
            className="pointer-events-none absolute inset-0 h-full object-contain"
            style={{ width: containerRef.current?.clientWidth ?? "100%", maxWidth: "none" }}
          />
        </div>

        {/* labels */}
        <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-ai/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur">
          Grad-CAM
        </span>
        <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur">
          Original
        </span>

        {/* divider handle */}
        <div className="pointer-events-none absolute inset-y-0" style={{ left: `${pos}%` }}>
          <div className="absolute inset-y-0 -ml-px w-0.5 bg-white/80 shadow-[0_0_8px_rgba(0,0,0,0.5)]" />
          <div className="absolute top-1/2 -ml-4 -translate-y-1/2 rounded-full border border-white/40 bg-black/60 p-1.5 backdrop-blur">
            <SlidersHorizontal className="h-4 w-4 text-white" />
          </div>
        </div>
      </div>
      <figcaption className="border-t border-border/60 px-4 py-2.5 text-xs text-muted-foreground">
        Drag to wipe between the radiograph and its Grad-CAM heatmap.
      </figcaption>
    </figure>
  );
}

export function XrayViewer({
  originalSrc,
  gradcamSrc,
}: {
  originalSrc: string;
  gradcamSrc: string;
}) {
  const [mode, setMode] = useState<ViewMode>("side");

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <ModeToggle mode={mode} onChange={setMode} />
      </div>

      {mode === "side" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Panel src={originalSrc} label="Original" />
          <Panel src={gradcamSrc} label="Grad-CAM" accent />
        </div>
      ) : (
        <CompareView originalSrc={originalSrc} gradcamSrc={gradcamSrc} />
      )}
    </div>
  );
}