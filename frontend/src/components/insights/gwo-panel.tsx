"use client";

/**
 * Optimization Information (GWO) — renders gwo_log.json generically via
 * JsonView, making no assumption about its schema.
 */
import { JsonView } from "@/components/insights/json-view";

export function GwoPanel({ gwo }: { gwo: Record<string, unknown> }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
      <JsonView data={gwo} />
    </div>
  );
}