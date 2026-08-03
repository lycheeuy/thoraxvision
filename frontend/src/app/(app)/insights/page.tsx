"use client";

/**
 * Model Insights — an AI research dashboard explaining the model behind
 * ThoraxVision, aimed at thesis examiners.
 *
 * Consumes ONLY GET /api/v1/model-insights. Each section renders from its
 * slice of the response and uses the `artifacts` availability map to decide
 * whether to show content or an "unavailable" state. No research values are
 * hardcoded — everything comes from the endpoint.
 */
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  BarChart3,
  Brain,
  FlaskConical,
  Grid3x3,
  LineChart,
  ScanEye,
  Settings2,
  Table2,
} from "lucide-react";

import { AnalysisSkeleton } from "@/components/common/loading";
import { ErrorState } from "@/components/common/error-state";
import { ClassificationReportTable } from "@/components/insights/classification-report-table";
import { GradcamExample } from "@/components/insights/gradcam-example";
import { GwoPanel } from "@/components/insights/gwo-panel";
import { InsightsHero } from "@/components/insights/insights-hero";
import { InsightsSection } from "@/components/insights/insights-section";
import { MetricFigure } from "@/components/insights/metric-figure";
import { ModelOverviewPanel } from "@/components/insights/model-overview";
import { PerformanceMetricsPanel } from "@/components/insights/performance-metrics";
import { ResearchSummaryPanel } from "@/components/insights/research-summary";
import { ResearchDisclaimer } from "@/components/prediction/research-disclaimer";
import { extractApiError } from "@/lib/api/client";
import { modelInsightsService } from "@/services/model-insights.service";

export default function InsightsPage() {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["model-insights"],
    queryFn: modelInsightsService.get,
    retry: false,
  });

  if (isError) {
    return (
      <div className="ambient-canvas min-h-full">
        <div className="mx-auto w-full max-w-[1100px] px-6 py-8">
          <ErrorState
            title="Couldn't load model insights"
            message={extractApiError(error).message}
            detail={extractApiError(error).detail}
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

  const a = data.artifacts;
  const abs = modelInsightsService.toAbsoluteUrl;

  return (
    <div className="ambient-canvas min-h-full">
      <div className="mx-auto w-full max-w-[1100px] space-y-12 px-6 py-8">
        {/* Hero */}
        <InsightsHero overview={data.overview} />

        {/* Model Overview */}
        <InsightsSection title="Model overview" icon={Brain} description="Architecture and configuration">
          <ModelOverviewPanel overview={data.overview} />
        </InsightsSection>

        {/* Performance Metrics */}
        <InsightsSection
          title="Performance metrics"
          icon={Activity}
          description="Headline evaluation figures"
          available={data.metrics != null}
          unavailableHint="Metrics are unavailable — the classification report hasn't been added yet."
        >
          {data.metrics && <PerformanceMetricsPanel metrics={data.metrics} />}
        </InsightsSection>

        {/* Classification Report */}
        <InsightsSection
          title="Classification report"
          icon={Table2}
          description="Per-class precision, recall and F1"
          available={data.classification_report != null}
          unavailableHint="The classification report artifact hasn't been added yet."
        >
          {data.classification_report && (
            <ClassificationReportTable report={data.classification_report} />
          )}
        </InsightsSection>

        {/* Confusion Matrix */}
        <InsightsSection
          title="Confusion matrix"
          icon={Grid3x3}
          available={a.confusion_matrix.available}
          unavailableHint="The confusion matrix figure hasn't been added yet."
        >
          <MetricFigure
            title="Confusion matrix"
            imageUrl={abs(data.confusion_matrix_url)}
            description="Predicted vs. actual across the two classes."
          />
        </InsightsSection>

        {/* ROC Curve */}
        <InsightsSection
          title="ROC curve"
          icon={LineChart}
          available={a.roc_curve.available}
          unavailableHint="The ROC curve figure hasn't been added yet."
        >
          <MetricFigure
            title="ROC curve"
            imageUrl={abs(data.roc_curve_url)}
            description="True-positive rate against false-positive rate."
          />
        </InsightsSection>

        {/* Training Curves */}
        <InsightsSection
          title="Training curves"
          icon={BarChart3}
          available={a.training_curves.available}
          unavailableHint="Training curves haven't been added yet."
        >
          <MetricFigure
            title="Training curves"
            imageUrl={abs(data.training_curves_url)}
            description="Loss and accuracy across training epochs."
          />
        </InsightsSection>

        {/* GradCAM Example */}
        <InsightsSection
          title="Grad-CAM example"
          icon={ScanEye}
          available={a.gradcam_example.available}
          unavailableHint="No Grad-CAM example image has been added yet."
        >
          <GradcamExample imageUrl={abs(data.gradcam_example_url)} />
        </InsightsSection>

        {/* Optimization (GWO) */}
        <InsightsSection
          title="Optimization — Grey Wolf Optimizer"
          icon={Settings2}
          description="Hyperparameter optimization details"
          available={data.gwo != null}
          unavailableHint="No GWO optimization log has been added yet."
        >
          {data.gwo && <GwoPanel gwo={data.gwo} />}
        </InsightsSection>

        {/* Research Summary */}
        <InsightsSection
          title="Research summary"
          icon={FlaskConical}
          available={data.research_summary != null}
          unavailableHint="No research summary has been added yet."
        >
          {data.research_summary && <ResearchSummaryPanel summary={data.research_summary} />}
        </InsightsSection>

        {/* Disclaimer */}
        <ResearchDisclaimer />
      </div>
    </div>
  );
}