"use client";

/**
 * Representational AI workflow timeline.
 *
 * IMPORTANT: the backend returns one response when the whole thing is done —
 * there is no per-stage progress stream. So this timeline does NOT fake
 * backend progress. It shows the stages that genuinely occur and animates
 * them sequentially *while the request is pending*, purely as an affordance
 * that work is happening. When the result arrives, every stage is marked done
 * and the single real figure — inference_time — is shown on the inference step.
 */
import { Brain, CheckCircle2, ImageDown, ScanLine, Sparkles, Waves } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export type WorkflowState = "idle" | "running" | "done";

const STAGES = [
  { key: "upload", icon: ImageDown, label: "Study received", hint: "Image loaded" },
  { key: "preprocess", icon: ScanLine, label: "Preprocessing", hint: "Resize · normalise" },
  { key: "inference", icon: Brain, label: "Inference", hint: "DenseNet121 forward pass" },
  { key: "gradcam", icon: Waves, label: "Grad-CAM", hint: "Localising evidence" },
  { key: "complete", icon: Sparkles, label: "Complete", hint: "Assembling result" },
] as const;

export function WorkflowTimeline({
  state,
  inferenceTime,
}: {
  state: WorkflowState;
  inferenceTime?: number; // seconds, real value from backend when done
}) {
  // While running, advance a highlight through the stages on a loop so the
  // panel feels alive. This is cosmetic pacing, not a progress measurement.
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (state !== "running") return;
    setActive(0);
    const id = setInterval(() => {
      setActive((a) => (a + 1) % STAGES.length);
    }, 700);
    return () => clearInterval(id);
  }, [state]);

  return (
    <ol className="relative space-y-1">
      {STAGES.map((stage, i) => {
        const Icon = stage.icon;

        const done = state === "done";
        const running = state === "running";
        const isActive = running && i === active;
        const isPast = running && i < active;

        const stageDone = done || isPast;

        return (
          <li key={stage.key} className="flex items-center gap-3.5">
            {/* node + connector */}
            <div className="relative flex flex-col items-center">
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-300",
                  stageDone
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : isActive
                      ? "border-ai/40 bg-ai/10 text-ai shadow-glow"
                      : "border-border bg-card text-muted-foreground",
                )}
              >
                {stageDone ? (
                  <CheckCircle2 className="h-[18px] w-[18px]" />
                ) : (
                  <Icon className={cn("h-[18px] w-[18px]", isActive && "animate-pulse")} />
                )}
              </span>
              {i < STAGES.length - 1 && (
                <span
                  className={cn(
                    "my-0.5 h-5 w-px transition-colors",
                    stageDone ? "bg-primary/30" : "bg-border",
                  )}
                />
              )}
            </div>

            {/* label */}
            <div className="flex min-w-0 flex-1 items-center justify-between pb-3">
              <div className="min-w-0">
                <p
                  className={cn(
                    "text-sm font-medium transition-colors",
                    stageDone || isActive ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {stage.label}
                </p>
                <p className="truncate text-xs text-muted-foreground">{stage.hint}</p>
              </div>

              {/* Only real datum shown: inference_time on the inference stage */}
              {done && stage.key === "inference" && inferenceTime != null && (
                <span className="numeric shrink-0 font-mono text-xs font-medium text-primary">
                  {inferenceTime.toFixed(2)}s
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}