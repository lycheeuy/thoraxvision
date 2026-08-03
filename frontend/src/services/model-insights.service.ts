/**
 * Model Insights service — reads the single aggregated research endpoint.
 *
 *   GET /api/v1/model-insights  → everything the insights page renders.
 *
 * Read-only. Image URL absolutisation mirrors the other services.
 */
import { apiClient } from "@/lib/api/client";
import { env } from "@/lib/env";
import type { ModelInsightsResponse } from "@/lib/api/types";

export const modelInsightsService = {
  async get(): Promise<ModelInsightsResponse> {
    const { data } = await apiClient.get<ModelInsightsResponse>("/api/v1/model-insights");
    return data;
  },

  toAbsoluteUrl(relativeUrl: string | null): string | null {
    if (!relativeUrl) return null;
    return relativeUrl.startsWith("http") ? relativeUrl : `${env.apiUrl}${relativeUrl}`;
  },
} as const;