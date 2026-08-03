"use client";

/**
 * Performance Metrics — accuracy / precision / recall / F1 as cards, each
 * with a lightweight qualitative label (Excellent / High / Good / Moderate)
 * derived from the value. The thresholds are presentation only; the numbers
 * themselves come straight from the parsed report.
 */
import type { PerformanceMetrics } from "@/lib/api/types";
import { cn } from "@/lib/utils";

/** Map a 0–1 score to a short qualitative label + tone. */
function qualify(score: number): { label: string; tone: string } {
  if (score >= 0.95) return { label: "Excellent", tone: "text-ai" };
  if (score >= 0.9) return { label: "High", tone: "text-primary" };
  if (score >= 0.8) return { label: "Good", tone: "text-primary" };
  if (score >= 0.7) return { label: "Moderate", tone: "text-amber-500" };
  return { label: "Fair", tone: "text-muted-foreground" };
}

function MetricCard({ label, value }: { label: string; value: number | null }) {
  if (value == null) {
    return (
      <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-2 text-sm italic text-muted-foreground">—</p>
      </div>
    );
  }
  const pct = value <= 1 ? value * 100 : value;
  const q = qualify(value <= 1 ? value : value / 100);
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="numeric mt-2 font-mono text-3xl font-bold tracking-tight">
        {pct.toFixed(1)}
        <span className="text-lg font-medium text-muted-foreground">%</span>
      </p>
      <p className={cn("mt-1 text-xs font-semibold", q.tone)}>{q.label}</p>
    </div>
  );
}

export function PerformanceMetricsPanel({ metrics }: { metrics: PerformanceMetrics }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard label="Accuracy" value={metrics.accuracy} />
      <MetricCard label="Precision" value={metrics.precision} />
      <MetricCard label="Recall" value={metrics.recall} />
      <MetricCard label="F1 Score" value={metrics.f1_score} />
    </div>
  );
}