"use client";

/**
 * Classification summary.
 *
 * The verdict line (badge + label) plus per-class probability bars with the
 * numeric value shown alongside each bar. The winning class is emphasised;
 * its bar takes the verdict colour — rose for a TB finding, blue→cyan for
 * a clear read. Never green.
 */
import { ShieldAlert, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PredictionResponse } from "@/lib/api/types";

export function ClassificationSummary({ result }: { result: PredictionResponse }) {
  const isFinding = result.class_id === 1;

  return (
    <div className="space-y-5">
      {/* verdict line */}
      <div className="flex items-center gap-4">
        <span
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-soft",
            isFinding
              ? "border-destructive/25 bg-destructive/10"
              : "border-primary/25 bg-primary/10",
          )}
        >
          {isFinding ? (
            <ShieldAlert className="h-6 w-6 text-destructive" />
          ) : (
            <ShieldCheck className="h-6 w-6 text-primary" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <Badge variant={isFinding ? "finding" : "clear"}>
              {isFinding ? "Finding detected" : "No finding"}
            </Badge>
            <Badge variant="neutral">Study #{result.prediction_id}</Badge>
          </div>
          <p className="text-xl font-semibold tracking-tight">{result.prediction}</p>
        </div>
      </div>

      {/* per-class probabilities with numeric values */}
      <div className="space-y-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Class probabilities
        </p>

        {Object.entries(result.probabilities)
          .sort(([, a], [, b]) => b - a)
          .map(([label, value]) => {
            const winner = label === result.prediction;
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
                    {value.toFixed(2)}%
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-[width] duration-700 ease-out",
                      winner
                        ? isFinding
                          ? "bg-destructive"
                          : "bg-gradient-to-r from-primary to-ai"
                        : "bg-muted-foreground/30",
                    )}
                    style={{ width: `${Math.max(value, 1.5)}%` }}
                  />
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}