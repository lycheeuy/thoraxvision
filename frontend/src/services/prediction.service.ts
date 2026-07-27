/**
 * Prediction service — /api/v1/predict.
 * The prediction PAGE arrives in a later phase; the service is ready now so
 * that phase only adds UI.
 */
import { apiClient } from "@/lib/api/client";
import { env } from "@/lib/env";
import type { PredictionResponse } from "@/lib/api/types";

export const predictionService = {
  async predict(imageFile: File): Promise<PredictionResponse> {
    const form = new FormData();
    form.append("image", imageFile);
    const { data } = await apiClient.post<PredictionResponse>("/api/v1/predict", form);
    return data;
  },

  /** Backend returns relative URLs (/static/uploads/...) — make them absolute. */
  toAbsoluteUrl(relativeUrl: string): string {
    return relativeUrl.startsWith("http") ? relativeUrl : `${env.apiUrl}${relativeUrl}`;
  },
} as const;