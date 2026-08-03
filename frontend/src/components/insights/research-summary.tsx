"use client";

/**
 * Research Summary — rendered entirely from research_summary_gwo.json via
 * JsonView. No fixed schema assumed.
 */
import { JsonView } from "@/components/insights/json-view";

export function ResearchSummaryPanel({ summary }: { summary: Record<string, unknown> }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
      <JsonView data={summary} />
    </div>
  );
}