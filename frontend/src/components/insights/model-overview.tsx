"use client";

/**
 * Model Overview — the model's specification, entirely from metadata.
 * Only renders the fields that are present (null-tolerant).
 */
import type { ModelOverview as Overview } from "@/lib/api/types";

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 py-2.5 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="numeric font-mono text-xs font-medium">{value}</span>
    </div>
  );
}

export function ModelOverviewPanel({ overview }: { overview: Overview }) {
  const rows: { label: string; value: string }[] = [];
  if (overview.architecture) rows.push({ label: "Architecture", value: overview.architecture });
  if (overview.framework) rows.push({ label: "Framework", value: overview.framework });
  if (overview.version) rows.push({ label: "Version", value: `v${overview.version}` });
  if (overview.input_size)
    rows.push({ label: "Input size", value: `${overview.input_size} × ${overview.input_size}` });
  if (overview.classes?.length)
    rows.push({ label: "Classes", value: overview.classes.join(" · ") });
  if (overview.threshold != null)
    rows.push({ label: "Decision threshold", value: overview.threshold.toFixed(2) });
  if (overview.task) rows.push({ label: "Task", value: overview.task });

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
      {rows.length > 0 ? (
        <div className="grid gap-x-8 sm:grid-cols-2">
          {rows.map((r) => (
            <Spec key={r.label} label={r.label} value={r.value} />
          ))}
        </div>
      ) : (
        <p className="text-sm italic text-muted-foreground">Model metadata is unavailable.</p>
      )}
    </div>
  );
}