"use client";

/**
 * AI Analysis Workspace — the primary feature of ThoraxVision.
 *
 * Layout: 40 (intake) : 60 (analysis). The analysis column is the visually
 * dominant surface. It always holds one of three states — idle, running,
 * complete — so the answer always appears in the same place.
 *
 * Everything here composes existing pieces and the existing predictionService.
 * No backend, API, service or routing change.
 */
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import {
  Activity,
  BrainCircuit,
  FileImage,
  History,
  ListChecks,
  RotateCcw,
  ScanEye,
  Sparkles,
  Trash2,
  Workflow,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { Spinner } from "@/components/common/loading";
import { StatusDot, type SystemState } from "@/components/common/status-badge";
import { ClassificationSummary } from "@/components/prediction/classification-summary";
import { ConfidenceGauge } from "@/components/prediction/confidence-gauge";
import { ModelInfoPanel } from "@/components/prediction/model-info-panel";
import { ResearchDisclaimer } from "@/components/prediction/research-disclaimer";
import { UploadDropzone, type SelectedImage } from "@/components/prediction/upload-dropzone";
import { WorkflowTimeline, type WorkflowState } from "@/components/prediction/workflow-timeline";
import { WorkspaceSection } from "@/components/prediction/workspace-section";
import { XrayViewer } from "@/components/prediction/xray-viewer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { extractApiError } from "@/lib/api/client";
import type { ErrorDetail, PredictionResponse } from "@/lib/api/types";
import { healthService } from "@/services/health.service";
import { predictionService } from "@/services/prediction.service";

function WorkspaceHeader() {
  const { data, isPending, isError } = useQuery({
    queryKey: ["health"],
    queryFn: healthService.getHealth,
    refetchInterval: 30_000,
    retry: false,
  });
  const state: SystemState = isPending ? "connecting" : isError ? "offline" : "online";
  const ready = data?.model === "loaded";

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-ai shadow-glow">
          <ScanEye className="h-5 w-5 text-white" />
        </span>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">AI Analysis Workspace</h1>
          <p className="text-xs text-muted-foreground">
            Chest X-ray tuberculosis screening · DenseNet121 · Grad-CAM
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3.5 py-1.5 shadow-soft backdrop-blur">
        <BrainCircuit className={cn("h-4 w-4", ready ? "text-ai" : "text-muted-foreground")} />
        <span className="text-xs font-medium">
          {state === "offline" ? "Engine offline" : ready ? "Engine ready" : "Engine standby"}
        </span>
        <StatusDot state={state === "online" && !ready ? "connecting" : state} />
      </div>
    </div>
  );
}

export default function PredictionPage() {
  const [image, setImage] = useState<SelectedImage | null>(null);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState<ErrorDetail | null>(null);

  const { mutate: analyse, isPending } = useMutation({
    mutationFn: (file: File) => predictionService.predict(file),
    onMutate: () => {
      setResult(null);
      setError(null);
    },
    onSuccess: (data) => {
      setResult(data);
      toast.success("Analysis complete", {
        description: `${data.prediction} · ${data.confidence.toFixed(1)}% confidence`,
      });
    },
    onError: (err) => {
      const detail = extractApiError(err);
      setError(detail);
      toast.error("Analysis failed", { description: detail.message });
    },
  });

  function reset() {
    if (image) URL.revokeObjectURL(image.previewUrl);
    setImage(null);
    setResult(null);
    setError(null);
  }

  const workflowState: WorkflowState = isPending ? "running" : result ? "done" : "idle";

  return (
    <div className="ambient-canvas min-h-full">
      <div className="mx-auto w-full max-w-[1400px] px-6 py-8">
        <WorkspaceHeader />

        {/* 40 : 60 — intake vs analysis */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          {/* ============== INTAKE (40) ============== */}
          <div className="space-y-8 lg:sticky lg:top-24 lg:self-start">
            <WorkspaceSection index="01" title="Upload study" icon={FileImage}
              action={
                image && !isPending ? (
                  <Button variant="ghost" size="sm" onClick={reset}>
                    <Trash2 /> Clear
                  </Button>
                ) : null
              }
            >
              <UploadDropzone value={image} onSelect={setImage} onClear={reset} disabled={isPending} />

              <Button
                variant="ai"
                size="lg"
                className="mt-4 w-full"
                disabled={!image || isPending}
                onClick={() => image && analyse(image.file)}
              >
                {isPending ? (
                  <>
                    <Spinner className="h-4 w-4" /> Analysing…
                  </>
                ) : (
                  <>
                    <Sparkles /> Run AI analysis
                  </>
                )}
              </Button>
            </WorkspaceSection>

            {/* Workflow timeline — visible once there's something to narrate */}
            {(isPending || result) && (
              <WorkspaceSection index="02" title="AI workflow" icon={Workflow}>
                <Card>
                  <CardContent className="p-5">
                    <WorkflowTimeline
                      state={workflowState}
                      inferenceTime={result?.inference_time}
                    />
                  </CardContent>
                </Card>
              </WorkspaceSection>
            )}
          </div>

          {/* ============== ANALYSIS (60) — dominant ============== */}
          <div className="min-w-0">
            {/* idle */}
            {!isPending && !error && !result && (
              <div className="flex min-h-[560px] items-center justify-center rounded-2xl border border-dashed border-border bg-card/40">
                <EmptyState
                  icon={ScanEye}
                  title="Awaiting a study"
                  description="Upload a frontal chest X-ray and run the model. The verdict, confidence gauge, Grad-CAM evidence and full model report will appear here."
                />
              </div>
            )}

            {/* running */}
            {isPending && (
              <div className="flex min-h-[560px] flex-col items-center justify-center rounded-2xl border border-border/70 bg-card/60 backdrop-blur">
                <div className="relative h-44 w-44 overflow-hidden rounded-2xl border border-border/70 bg-slate-950">
                  {image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image.previewUrl} alt="" className="h-full w-full object-contain opacity-70" />
                  )}
                  <div className="absolute inset-x-0 top-0 h-12 animate-scanline bg-gradient-to-b from-transparent via-ai/40 to-transparent" />
                </div>
                <p className="mt-6 text-sm font-semibold tracking-tight">Running inference</p>
                <p className="mt-1 max-w-xs text-center text-xs text-muted-foreground">
                  Preprocessing · forward pass · Grad-CAM. The first run of a session also loads
                  the network into memory.
                </p>
              </div>
            )}

            {/* error */}
            {!isPending && error && (
              <ErrorState
                title="Analysis failed"
                message={error.message}
                detail={error.detail}
                code={error.code}
                onRetry={() => image && analyse(image.file)}
                className="min-h-[560px] justify-center"
              />
            )}

            {/* complete — subtle fade + scale */}
            {!isPending && !error && result && (
              <div
                className="space-y-8"
                style={{ animation: "fade-up 0.5s cubic-bezier(0.16,1,0.3,1) both" }}
              >
                {/* Verdict + gauge */}
                <Card className={cn("overflow-hidden border-2", result.class_id === 1 ? "border-destructive/30" : "border-primary/30")}>
                  <div className={cn("h-1 w-full", result.class_id === 1 ? "bg-destructive" : "bg-gradient-to-r from-primary to-ai")} />
                  <CardContent className="flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-center sm:gap-8">
                    <ConfidenceGauge value={result.confidence} />
                    <div className="min-w-0 flex-1">
                      <WorkspaceSection index="03" title="Analysis result" icon={ListChecks}>
                        <ClassificationSummary result={result} />
                      </WorkspaceSection>
                    </div>
                  </CardContent>
                </Card>

                {/* Imaging evidence */}
                <WorkspaceSection index="04" title="Imaging & Grad-CAM" icon={ScanEye}>
                  <XrayViewer
                    originalSrc={predictionService.toAbsoluteUrl(result.original_image_url)}
                    gradcamSrc={predictionService.toAbsoluteUrl(result.gradcam_url)}
                  />
                </WorkspaceSection>

                {/* Model report */}
                <WorkspaceSection index="05" title="Model information" icon={Activity}>
                  <ModelInfoPanel result={result} />
                </WorkspaceSection>

                {/* Post-result actions */}
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="outline" asChild>
                    <Link href="/studies">
                        <History /> View studies
                    </Link>
                  </Button>
                  <Button variant="ghost" onClick={reset}>
                    <RotateCcw /> New analysis
                  </Button>
                </div>

                <ResearchDisclaimer />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}