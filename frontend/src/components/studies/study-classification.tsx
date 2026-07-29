"use client";

/**
 * Classification summary for a stored study — mirrors the workspace one but
 * reads a HistoryDetailResponse (probabilities reconstructed server-side).
 */
import { cn } from "@/lib/utils";
import type { HistoryDetailResponse } from "@/lib/api/types";

export function StudyClassification({ study }: { study: HistoryDetailResponse }) {
  const isFinding = study.predicted_label === "Tuberculosis";
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Class probabilities
      </p>
      {Object.entries(study.probabilities)
        .sort(([, a], [, b]) => b - a)
        .map(([label, val]) => {
          const winner = label === study.predicted_label;
          return (
            <div key={label} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className={cn("truncate text-sm", winner ? "font-semibold" : "text-muted-foreground")}>
                  {label}
                </span>
                <span
                  className={cn(
                    "numeric shrink-0 font-mono text-sm",
                    winner ? "font-semibold text-foreground" : "text-muted-foreground",
                  )}
                >
                  {val.toFixed(2)}%
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full",
                    winner
                      ? isFinding
                        ? "bg-destructive"
                        : "bg-gradient-to-r from-primary to-ai"
                      : "bg-muted-foreground/30",
                  )}
                  style={{ width: `${Math.max(val, 1.5)}%` }}
                />
              </div>
            </div>
          );
        })}
    </div>
  );
}