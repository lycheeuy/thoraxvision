"use client";

/**
 * Insights hero — built entirely from metadata.json (overview). Presents the
 * model as a research artifact: name, architecture, framework, version, and
 * an "Academic Research" badge marking this as a thesis research build.
 */
import { Microscope, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { ModelOverview } from "@/lib/api/types";

export function InsightsHero({ overview }: { overview: ModelOverview }) {
  return (
    <div className="ambient-canvas relative overflow-hidden rounded-3xl border border-border/70 bg-card p-8 shadow-elevated">
      <div className="hairline absolute inset-x-0 top-0 h-px" />

      <div className="flex items-center gap-2">
        <Badge variant="ai">
          <Microscope className="mr-1 h-3 w-3" />
          Academic Research
        </Badge>
        {overview.version && <Badge variant="neutral">v{overview.version}</Badge>}
      </div>

      <h1 className="mt-5 text-3xl font-bold tracking-tight text-gradient-ai">
        {overview.name ?? "Model Insights"}
      </h1>

      {(overview.architecture || overview.framework) && (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {overview.architecture}
          {overview.architecture && overview.framework ? " · " : ""}
          {overview.framework}
          {overview.task ? ` — ${overview.task}` : ""}
        </p>
      )}

      <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-ai" />
        Explaining the AI model behind ThoraxVision — metrics, evaluation and optimization.
      </div>
    </div>
  );
}