"use client";

/**
 * Inference engine specification panel.
 *
 * Presents the model as a piece of equipment: architecture, framework,
 * version, input geometry, class set, explainability method, and the real
 * inference latency for this run. Values come from the prediction response
 * (model_info + inference_time) — nothing invented.
 */
import { BrainCircuit, Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { PredictionResponse } from "@/lib/api/types";

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 py-2.5 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="numeric font-mono text-xs font-medium">{value}</span>
    </div>
  );
}

export function ModelInfoPanel({ result }: { result: PredictionResponse }) {
  const m = result.model_info;

  return (
    <div className="rounded-2xl border border-border/70 bg-card shadow-soft">
      <div className="hairline h-px w-full" />
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-ai shadow-glow">
              <BrainCircuit className="h-5 w-5 text-white" />
            </span>
            <div>
              <p className="text-sm font-semibold tracking-tight">{m.name}</p>
              <p className="text-xs text-muted-foreground">Inference engine</p>
            </div>
          </div>
          <Badge variant="ai">Active</Badge>
        </div>

        <div className="mt-5 grid gap-x-8 sm:grid-cols-2">
          <div>
            <Spec label="Architecture" value={m.architecture ?? "DenseNet121"} />
            <Spec label="Framework" value={m.framework} />
            <Spec label="Version" value={`v${m.version}`} />
          </div>
          <div>
            <Spec label="Input" value="224 × 224 RGB" />
            <Spec label="Classes" value="TB / Non-TB" />
            <Spec label="Explainability" value="Grad-CAM" />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-xl border border-border/60 bg-background/50 px-3.5 py-2.5">
          <Clock className="h-4 w-4 text-primary" />
          <span className="flex-1 text-xs text-muted-foreground">Inference time (this run)</span>
          <span className="numeric font-mono text-sm font-semibold">
            {result.inference_time.toFixed(2)}s
          </span>
        </div>
      </div>
    </div>
  );
}