"use client";

/**
 * Circular confidence gauge (SVG).
 *
 * A single arc from 0–100%, drawn with a blue→cyan gradient, with the figure
 * in the centre in tabular mono. The gauge shape communicates "how sure" at a
 * glance in a way a bare number can't; the verdict colour stays on the badge,
 * not here, so the gauge reads consistently for TB and Non-TB alike.
 */
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export function ConfidenceGauge({
  value,
  size = 176,
  label = "Confidence",
}: {
  value: number; // 0–100
  size?: number;
  label?: string;
}) {
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));

  // Animate the arc from 0 to value on mount.
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(clamped));
    return () => cancelAnimationFrame(id);
  }, [clamped]);

  const offset = circumference - (shown / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--accent-ai))" />
          </linearGradient>
        </defs>

        {/* track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={stroke}
        />
        {/* value arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#gauge-gradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)" }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("numeric font-mono text-4xl font-bold tracking-tight")}>
          {clamped.toFixed(1)}
          <span className="text-lg font-medium text-muted-foreground">%</span>
        </span>
        <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </span>
      </div>
    </div>
  );
}