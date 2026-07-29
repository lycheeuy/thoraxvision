/**
 * Studies service — read model for previous AI analyses (History API).
 *
 * Wraps the Phase 8A endpoints:
 *   GET /api/v1/history        → paginated list (list)
 *   GET /api/v1/history/{id}   → full detail    (getById)
 *
 * The backend route is still /history; the product surface is "Studies".
 * Only defined query params are sent, so the URL stays clean when filters
 * are unset. Image URL absolutisation mirrors predictionService exactly.
 */
import { apiClient } from "@/lib/api/client";
import { env } from "@/lib/env";
import type {
  HistoryDetailResponse,
  HistoryListResponse,
  StudiesQuery,
} from "@/lib/api/types";

export const studiesService = {
  async list(query: StudiesQuery = {}): Promise<HistoryListResponse> {
    // Drop undefined / empty values so they don't appear in the querystring.
    const params: Record<string, string | number> = {};
    if (query.page != null) params.page = query.page;
    if (query.limit != null) params.limit = query.limit;
    if (query.sort) params.sort = query.sort;
    if (query.search) params.search = query.search;
    if (query.label) params.label = query.label;
    if (query.date_from) params.date_from = query.date_from;
    if (query.date_to) params.date_to = query.date_to;
    if (query.min_confidence != null) params.min_confidence = query.min_confidence;

    const { data } = await apiClient.get<HistoryListResponse>("/api/v1/history", {
      params,
    });
    return data;
  },

  async getById(id: number): Promise<HistoryDetailResponse> {
    const { data } = await apiClient.get<HistoryDetailResponse>(
      `/api/v1/history/${id}`,
    );
    return data;
  },

  /** Backend returns relative URLs (/static/uploads/...) — make them absolute. */
  toAbsoluteUrl(relativeUrl: string | null): string | null {
    if (!relativeUrl) return null;
    return relativeUrl.startsWith("http") ? relativeUrl : `${env.apiUrl}${relativeUrl}`;
  },
} as const;