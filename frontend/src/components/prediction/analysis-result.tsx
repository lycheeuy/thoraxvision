"use client";

/**
 * Analysis result.
 *
 * Reading order is deliberate: the finding first, then the evidence
 * (Grad-CAM beside the original), then the numbers, then provenance.
 * A clinician should be able to stop reading at any point and still have
 * the most important thing.
 */
import { BrainCircuit, Clock, Layers, ShieldAlert, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PredictionResponse } from "@/lib/api/types";
import { predictionService } from "@/services/prediction.service";

function ImagePanel({
  src,
  label,
  caption,
  accent = false,
}: {
  src: string;
  label: string;
  caption: string;
  accent?: boolean;
}) {
  return (
    <figure className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
      <div className="relative aspect-square bg-slate-950">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={label} className="h-full w-full object-contain" />
        <span
          className={cn(
            "absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider backdrop-blur",
            accent ? "bg-ai/85 text-white" : "bg-black/55 text-white",
          )}
        >
          {label}
        </span>
      </div>
      <figcaption className="border-t border-border/60 px-4 py-2.5 text-xs text-muted-foreground">
        {caption}
      </figcaption>
    </figure>
  );
}

function MetaTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-card px-4 py-3 shadow-soft">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className="numeric mt-1 font-mono text-sm font-semibold">{value}</p>
    </div>
  );
}

export function AnalysisResult({ result }: { result: PredictionResponse }) {
  const isFinding = result.class_id === 1;

  return (
    <div className="animate-fade-up space-y-5">
      {/* ---- Verdict ---- */}
      <Card
        className={cn(
          "overflow-hidden border-2",
          isFinding ? "border-destructive/30" : "border-primary/30",
        )}
      >
        <div className={cn("h-1 w-full", isFinding ? "bg-destructive" : "bg-gradient-to-r from-primary to-ai")} />
        <CardContent className="flex flex-wrap items-center gap-5 p-6">
          <span
            className={cn(
              "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border shadow-soft",
              isFinding
                ? "border-destructive/25 bg-destructive/10"
                : "border-primary/25 bg-primary/10",
            )}
          >
            {isFinding ? (
              <ShieldAlert className="h-7 w-7 text-destructive" />
            ) : (
              <ShieldCheck className="h-7 w-7 text-primary" />
            )}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Badge variant={isFinding ? "finding" : "clear"}>
                {isFinding ? "Finding detected" : "No finding"}
              </Badge>
              <Badge variant="neutral">Study #{result.prediction_id}</Badge>
            </div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">{result.prediction}</h2>
          </div>

          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Confidence
            </p>
            <p
              className={cn(
                "numeric font-mono text-4xl font-bold tracking-tight",
                isFinding ? "text-destructive" : "text-primary",
              )}
            >
              {result.confidence.toFixed(1)}
              <span className="text-lg font-medium">%</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ---- Evidence ---- */}
      <div className="grid gap-4 sm:grid-cols-2">
        <ImagePanel
          src={predictionService.toAbsoluteUrl(result.original_image_url)}
          label="Original"
          caption="Uploaded chest radiograph"
        />
        <ImagePanel
          src={predictionService.toAbsoluteUrl(result.gradcam_url)}
          label="Grad-CAM"
          caption="Regions that drove the prediction"
          accent
        />
      </div>

      {/* ---- Class probabilities ---- */}
      <Card>
        <CardContent className="space-y-4 p-6">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Class probabilities
          </p>

          {Object.entries(result.probabilities).map(([label, value]) => {
            const winner = label === result.prediction;
            return (
              <div key={label} className="space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <span className={cn("text-sm", winner ? "font-semibold" : "text-muted-foreground")}>
                    {label}
                  </span>
                  <span className="numeric font-mono text-sm font-medium">{value.toFixed(2)}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
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
        </CardContent>
      </Card>

      {/* ---- Provenance ---- */}
      <div className="grid gap-3 sm:grid-cols-3">
        <MetaTile icon={BrainCircuit} label="Model" value={result.model_info.architecture ?? "DenseNet121"} />
        <MetaTile icon={Layers} label="Version" value={`v${result.model_info.version}`} />
        <MetaTile icon={Clock} label="Inference" value={`${result.inference_time.toFixed(2)}s`} />
      </div>

      <p className="px-1 text-xs leading-relaxed text-muted-foreground">
        Research decision-support output — not a clinical diagnosis. Findings must be
        confirmed by a qualified radiologist.
      </p>
    </div>
  );
}