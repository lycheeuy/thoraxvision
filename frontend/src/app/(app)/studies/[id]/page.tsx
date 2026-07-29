"use client";

/**
 * Study detail — one previous analysis in full.
 *
 * Breadcrumb → study header (id · prediction · confidence · date) → imaging
 * (reused XrayViewer) alongside the confidence gauge, then classification,
 * model info, study information and read-only notes.
 *
 * Reuses Phase 7 presentation (XrayViewer, ConfidenceGauge, WorkspaceSection)
 * where the shapes line up; history-specific panels cover the rest.
 */
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronRight,
  ArrowLeft,
  ScanEye,
  ListChecks,
  Info,
} from "lucide-react";

import { ConfidenceGauge } from "@/components/prediction/confidence-gauge";
import { WorkspaceSection } from "@/components/prediction/workspace-section";
import { XrayViewer } from "@/components/prediction/xray-viewer";
import { StudyClassification } from "@/components/studies/study-classification";
import { StudyInfoPanel } from "@/components/studies/study-info-panel";
import { StudyNotes } from "@/components/studies/study-notes";
import { AnalysisSkeleton } from "@/components/common/loading";
import { ErrorState } from "@/components/common/error-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { extractApiError } from "@/lib/api/client";
import { studiesService } from "@/services/studies.service";

export default function StudyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const idParam = Array.isArray(params.id) ? params.id[0] : params.id;
  const id = Number(idParam);
  const validId = Number.isFinite(id) && id > 0;

  const { data: study, isPending, isError, error, refetch } = useQuery({
    queryKey: ["study", id],
    queryFn: () => studiesService.getById(id),
    enabled: validId,
    placeholderData: keepPreviousData,
    retry: false,
  });

  const isFinding = study?.predicted_label === "Tuberculosis";

  return (
    <div className="ambient-canvas min-h-full">
      <div className="mx-auto w-full max-w-[1200px] px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/studies" className="transition-colors hover:text-foreground">
            Studies
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="numeric font-mono text-foreground">
            {validId ? `#${id}` : "—"}
          </span>
        </nav>

        {isError || !validId ? (
          <div className="mt-8">
            <ErrorState
              title="Study not found"
              message={
                !validId
                  ? "That study id is not valid."
                  : extractApiError(error).message
              }
              detail={validId ? extractApiError(error).detail : undefined}
              onRetry={validId ? () => refetch() : undefined}
            />
            <div className="mt-4">
              <Button variant="ghost" onClick={() => router.push("/studies")}>
                <ArrowLeft /> Back to studies
              </Button>
            </div>
          </div>
        ) : isPending ? (
          <div className="mt-8">
            <AnalysisSkeleton />
          </div>
        ) : (
          <>
            {/* Study header */}
            <div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-b border-border/60 pb-6">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Badge variant={isFinding ? "finding" : "clear"}>
                    {isFinding ? "Finding" : "Clear"}
                  </Badge>
                  <span className="numeric font-mono text-xs text-muted-foreground">
                    Study #{study.prediction_id}
                  </span>
                </div>
                <h1 className="text-2xl font-semibold tracking-tight">{study.predicted_label}</h1>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(study.created_at).toLocaleString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Confidence
                  </p>
                  <p className="numeric font-mono text-2xl font-bold">
                    {study.confidence.toFixed(1)}%
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <Link href="/studies">
                    <ArrowLeft /> Back
                  </Link>
                </Button>
              </div>
            </div>

            {/* Body: imaging + gauge, then panels */}
            <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
              {/* Left: imaging */}
              <div className="space-y-8">
                <WorkspaceSection title="Imaging & Grad-CAM" icon={ScanEye}>
                  {study.original_image_url && study.gradcam_url ? (
                    <XrayViewer
                      originalSrc={studiesService.toAbsoluteUrl(study.original_image_url)!}
                      gradcamSrc={studiesService.toAbsoluteUrl(study.gradcam_url)!}
                    />
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
                      Images are no longer available for this study.
                    </div>
                  )}
                </WorkspaceSection>

                <WorkspaceSection title="Classification summary" icon={ListChecks}>
                  <StudyClassification study={study} />
                </WorkspaceSection>
              </div>

              {/* Right: gauge + info + notes */}
              <div className="space-y-6">
                <Card className={cn("overflow-hidden border-2", isFinding ? "border-destructive/30" : "border-primary/30")}>
                  <div className={cn("h-1 w-full", isFinding ? "bg-destructive" : "bg-gradient-to-r from-primary to-ai")} />
                  <CardContent className="flex flex-col items-center gap-2 p-6">
                    <ConfidenceGauge value={study.confidence} />
                  </CardContent>
                </Card>

                <StudyInfoPanel study={study} />
                <StudyNotes notes={study.notes} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}