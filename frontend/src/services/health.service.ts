/**
 * Health service — /api/v1/health (API + database + AI model status).
 * Consumed by the navbar status indicators with polling.
 */
import { apiClient } from "@/lib/api/client";
import type { HealthResponse } from "@/lib/api/types";

export const healthService = {
  async getHealth(): Promise<HealthResponse> {
    const { data } = await apiClient.get<HealthResponse>("/api/v1/health", {
      timeout: 5_000, // status probe must fail fast, not hang for 60s
    });
    return data;
  },
} as const;