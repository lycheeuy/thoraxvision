"use client";

/**
 * Model Insights — research dashboard explaining the AI model, for examiners.
 *
 * Consumes only GET /api/v1/model-insights via modelInsightsService. Each
 * section renders from its slice of the response; the `artifacts` map decides
 * which figures are available. No data is transformed beyond the mapping
 * needed to feed presentational components, and no values are hardcoded.
 */
import { useQuery } from "@tanstack/react-query";

import { ClassificationReportTable } from "@/components/performance/classification-report-table";
import { GradcamExample } from "@/components/performance/gradcam-example";
import { InsightsHero } from "@/components/performance/insights-hero";
import { MetricFigure } from "@/components/performance/metric-figure";
import { ModelOverview } from "@/components/performance/model-overview";
import { PerformanceMetrics } from "@/components/performance/performance-metrics";
import { ResearchSummary } from "@/components/performance/research-summary";
import { ResearchDisclaimer } from "@/components/prediction/research-disclaimer";
import { AnalysisSkeleton } from "@/components/common/loading";
import { ErrorState } from "@/components/common/error-state";
import { extractApiError } from "@/lib/api/client";
import { modelInsightsService } from "@/services/model-insights.service";
import type { ClassificationRow } from "@/lib/api/types";

export default function InsightsPage() {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["model-insights"],
    queryFn: modelInsightsService.get,
    retry: false,
  });

  if (isError) {
    const apiError = extractApiError(error);
    return (
      <div className="ambient-canvas min-h-full">
        <div className="mx-auto w-full max-w-[1100px] px-6 py-8">
          <ErrorState
            title="Couldn't load model insights"
            message={apiError.message}
            detail={apiError.detail}
            onRetry={() => refetch()}
          />
        </div>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="ambient-canvas min-h-full">
        <div className="mx-auto w-full max-w-[1100px] px-6 py-8">
          <AnalysisSkeleton />
        </div>
      </div>
    );
  }

  const { overview, metrics, classification_report, research_summary, artifacts } = data;
  const abs = modelInsightsService.toAbsoluteUrl;

  return (
    <div className="ambient-canvas min-h-full">
      <div className="mx-auto w-full max-w-[1100px] space-y-8 px-6 py-8">
        {/* 1. Hero */}
        <InsightsHero
          modelName={overview.name}
          architecture={overview.architecture}
          version={overview.version}
        />

        {/* 2. Model overview */}
        <ModelOverview
          name={overview.name}
          architecture={overview.architecture}
          framework={overview.framework}
          version={overview.version}
          threshold={overview.threshold}
          inputSize={overview.input_size}
          classes={overview.classes}
          device={null}
        />

        {/* 3. Performance metrics */}
        {metrics && (
          <PerformanceMetrics
            accuracy={metrics.accuracy ?? 0}
            precision={metrics.precision ?? 0}
            recall={metrics.recall ?? 0}
            f1Score={metrics.f1_score ?? 0}
          />
        )}

        {/* 4. Classification report */}
        {classification_report && (
          <ClassificationReportTable
            rows={classification_report.per_class.map((row: ClassificationRow) => ({
              label: row.label,
              precision: row.precision ?? 0,
              recall: row.recall ?? 0,
              f1_score: row.f1_score ?? 0,
              support: row.support ?? 0,
            }))}
          />
        )}

        {/* 5. Confusion matrix */}
        {artifacts.confusion_matrix.available && (
          <MetricFigure
            title="Confusion Matrix"
            imageUrl={abs(data.confusion_matrix_url)}
            caption="Predicted versus actual labels across the two classes."
          />
        )}

        {/* 6. ROC curve */}
        {artifacts.roc_curve.available && (
          <MetricFigure
            title="ROC Curve"
            imageUrl={abs(data.roc_curve_url)}
            caption="True-positive rate against false-positive rate."
          />
        )}

        {/* 7. Training curves */}
        {artifacts.training_curves.available && (
          <MetricFigure
            title="Training Curves"
            imageUrl={abs(data.training_curves_url)}
            caption="Loss and accuracy across training epochs."
          />
        )}

        {/* 8. Grad-CAM example */}
        <GradcamExample imageUrl={abs(data.gradcam_example_url)} />

        {/* 9. Research summary */}
        {research_summary && <ResearchSummary data={research_summary} />}

        {/* 10. Disclaimer */}
        <ResearchDisclaimer />
      </div>
    </div>
  );
}