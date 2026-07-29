"use client";

/**
 * Root route: send the visitor wherever they belong.
 * Authenticated -> /dashboard, otherwise -> /login.
 */
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { FullPageLoader } from "@/components/common/loading";
import { useAuth } from "@/providers/auth-provider";

export default function RootPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    router.replace(isAuthenticated ? "/prediction" : "/login");
  }, [isAuthenticated, isLoading, router]);

  return <FullPageLoader label="Loading ThoraxVision..." />;
}
// ---- Studies / History (schemas/history.py, Phase 8A) ------------------

export type SortOption =
  | "newest"
  | "oldest"
  | "highest_confidence"
  | "lowest_confidence";

/** One row in the paginated studies list (compact). */
export interface HistoryItem {
  prediction_id: number;
  predicted_label: string;
  confidence: number; // percentage 0-100
  thumbnail_url: string | null;
  created_at: string;
}
/** Paginated envelope returned by GET /api/v1/history. */
export interface HistoryListResponse {
  success: true;
  items: HistoryItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface HistoryModelInfo {
  name: string | null;
  version: string | null;
  framework: string | null;
  architecture: string | null;
}

/** Full detail returned by GET /api/v1/history/{id}. */
export interface HistoryDetailResponse {
  success: true;
  prediction_id: number;
  predicted_label: string;
  confidence: number; // percentage 0-100
  probabilities: Record<string, number>;
  original_image_url: string | null;
  gradcam_url: string | null;
  thumbnail_url: string | null;
  inference_time: number | null; // seconds
  notes: string | null;
  model_info: HistoryModelInfo | null;
  created_at: string;
}

/** Query params accepted by the studies list (all optional). */
export interface StudiesQuery {
  page?: number;
  limit?: number;
  sort?: SortOption;
  search?: string;
  label?: string;
  date_from?: string; // ISO datetime
  date_to?: string; // ISO datetime
  min_confidence?: number; // 0-100
}