"use client";

/**
 * GradCAM Example — a static example image from the training artifacts, with
 * a short note on how to read the heatmap. Explanatory only.
 */
import { MetricFigure } from "@/components/insights/metric-figure";

export function GradcamExample({ imageUrl }: { imageUrl: string | null }) {
  return (
    <MetricFigure
      title="Grad-CAM example"
      imageUrl={imageUrl}
      description="Where the model looked when forming its decision."
      caption="Warmer regions indicate stronger contribution to the predicted class. This is a representative example from evaluation, not a live inference."
    />
  );
}