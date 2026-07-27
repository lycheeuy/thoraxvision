"use client";

/**
 * New Analysis — the core workflow screen.
 *
 * Two columns: intake on the left (sticky), result on the right. The result
 * column always holds one of three states — waiting, analysing, complete —
 * so the user's eye never has to hunt for where the answer will appear.
 */
import { useMutation } from "@tanstack/react-query";
import { ScanLine, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { Spinner } from "@/components/common/loading";
import { AnalysisResult } from "@/components/prediction/analysis-result";
import { UploadDropzone, type SelectedImage } from "@/components/prediction/upload-dropzone";
import { Button } from "@/components/ui/button";
import { extractApiError } from "@/lib/api/client";
import type { ErrorDetail, PredictionResponse } from "@/lib/api/types";
import { predictionService } from "@/services/prediction.service";

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

  return (
    <div className="ambient-canvas min-h-full">
      <div className="mx-auto w-full max-w-7xl px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
          {/* ---------------- Intake ---------------- */}
          <section className="lg:sticky lg:top-24 lg:self-start">
            <div className="mb-4 flex items-baseline justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Chest radiograph</h2>
                <p className="text-sm text-muted-foreground">Single frontal view, PA or AP</p>
              </div>
              {image && !isPending && (
                <Button variant="ghost" size="sm" onClick={reset}>
                  <Trash2 /> Clear
                </Button>
              )}
            </div>

            <UploadDropzone
              value={image}
              onSelect={setImage}
              onClear={reset}
              disabled={isPending}
            />

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

            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              DenseNet121 · Grad-CAM explainability · results are not a diagnosis
            </p>
          </section>

          {/* ---------------- Result ---------------- */}
          <section className="min-w-0">
            {isPending && (
              <div className="flex min-h-[460px] flex-col items-center justify-center rounded-2xl border border-border/70 bg-card/60 backdrop-blur">
                {/* scan sweep over the pending study */}
                <div className="relative h-40 w-40 overflow-hidden rounded-2xl border border-border/70 bg-slate-950">
                  {image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={image.previewUrl}
                      alt=""
                      className="h-full w-full object-contain opacity-70"
                    />
                  )}
                  <div className="absolute inset-x-0 top-0 h-10 animate-scanline bg-gradient-to-b from-transparent via-ai/40 to-transparent" />
                </div>

                <p className="mt-6 text-sm font-semibold tracking-tight">Running inference</p>
                <p className="mt-1 max-w-xs text-center text-xs text-muted-foreground">
                  Preprocessing · forward pass · Grad-CAM. The first run of a session also
                  loads the network into memory.
                </p>
              </div>
            )}

            {!isPending && error && (
              <ErrorState
                title="Analysis failed"
                message={error.message}
                detail={error.detail}
                code={error.code}
                onRetry={() => image && analyse(image.file)}
                className="min-h-[460px] justify-center"
              />
            )}

            {!isPending && !error && result && <AnalysisResult result={result} />}

            {!isPending && !error && !result && (
              <div className="flex min-h-[460px] items-center justify-center rounded-2xl border border-dashed border-border bg-card/40">
                <EmptyState
                  icon={ScanLine}
                  title="No analysis yet"
                  description="Load a chest X-ray on the left and run the model. The prediction, confidence and Grad-CAM overlay will appear here."
                />
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}