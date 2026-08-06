/**
 * Dashboard service — reads the aggregated overview endpoint.
 *
 *   GET /api/v1/dashboard  → statistics, recent studies, model & system status.
 *
 * Read-only. Uses the shared axios client; URL absolutisation mirrors the
 * other services (predictionService, studiesService, modelInsightsService).
 */
import { apiClient } from "@/lib/api/client";
import { env } from "@/lib/env";
import type { DashboardResponse } from "@/lib/api/types";

export const dashboardService = {
  async get(): Promise<DashboardResponse> {
    const { data } = await apiClient.get<DashboardResponse>("/api/v1/dashboard");
    return data;
  },

  toAbsoluteUrl(relativeUrl: string | null | undefined): string | null {
    if (!relativeUrl) return null;
    return relativeUrl.startsWith("http") ? relativeUrl : `${env.apiUrl}${relativeUrl}`;
  },
} as const;