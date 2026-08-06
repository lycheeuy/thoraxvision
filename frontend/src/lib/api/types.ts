/**
 * TypeScript mirrors of the backend Pydantic schemas.
 *
 * Keep field names in sync with backend/app/domain/schemas/*.py — these are
 * the single source of truth for what the API actually returns.
 */

// ---- Auth (schemas/auth.py, schemas/user.py) ---------------------------
export type Role = "admin" | "student" | "supervisor" | "examiner";

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  full_name: string | null;
  role: Role;
  is_active: boolean;
  last_login: string | null; // ISO datetime
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: "bearer";
  expires_in: number; // seconds
  user: UserResponse;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

// ---- Prediction (schemas/prediction.py) --------------------------------
export interface ModelMetadata {
  name: string;
  version: string;
  framework: string;
  architecture: string | null;
}

export interface PredictionResponse {
  success: true;
  prediction: string;
  class_id: 0 | 1;
  confidence: number; // percentage 0-100
  probabilities: Record<string, number>;
  original_image_url: string;
  gradcam_url: string;
  thumbnail_url: string;
  prediction_id: number;
  inference_time: number; // seconds
  model_info: ModelMetadata;
  created_at: string;
}

// ---- Health (schemas/common.py) ----------------------------------------
export interface HealthResponse {
  status: "ok" | "degraded";
  app: string;
  phase: number;
  database: "connected" | "disconnected";
  model: "loaded" | "not_loaded" | "unavailable";
  model_info: { name: string; version: string; framework: string } | null;
}

// ---- Error envelope (schemas/common.py) --------------------------------
export interface ErrorDetail {
  code: string;
  message: string;
  detail: string | null;
}

export interface ErrorResponse {
  success: false;
  error: ErrorDetail;
}

/** Type guard: is this response body the standardized error envelope? */
export function isErrorResponse(body: unknown): body is ErrorResponse {
  return (
    typeof body === "object" &&
    body !== null &&
    "success" in body &&
    (body as { success: unknown }).success === false &&
    "error" in body
  );
}
/** Studies / History (schemas/history.py, Phase 8A) */

export type SortOption =
  | "newest"
  | "oldest"
  | "highest_confidence"
  | "lowest_confidence";

export interface HistoryItem {
  prediction_id: number;
  predicted_label: string;
  confidence: number;
  thumbnail_url: string | null;
  created_at: string;
}

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

export interface HistoryDetailResponse {
  success: true;
  prediction_id: number;
  predicted_label: string;
  confidence: number;
  probabilities: Record<string, number>;
  original_image_url: string | null;
  gradcam_url: string | null;
  thumbnail_url: string | null;
  inference_time: number | null;
  notes: string | null;
  model_info: HistoryModelInfo | null;
  created_at: string;
}

export interface StudiesQuery {
  page?: number;
  limit?: number;
  sort?: SortOption;
  search?: string;
  label?: string;
  date_from?: string;
  date_to?: string;
  min_confidence?: number;
}

// ---- Model Insights (schemas/model_insights.py, Phase 9) ---------------

export interface ModelOverview {
  name: string | null;
  version: string | null;
  framework: string | null;
  architecture: string | null;
  task: string | null;
  input_size: number | null;
  threshold: number | null;
  classes: string[] | null;
}

export interface ClassificationRow {
  label: string;
  precision: number | null;
  recall: number | null;
  f1_score: number | null;
  support: number | null;
}

export interface ClassificationReport {
  per_class: ClassificationRow[];
  accuracy: number | null;
  macro_avg: ClassificationRow | null;
  weighted_avg: ClassificationRow | null;
}

export interface PerformanceMetrics {
  accuracy: number | null;
  precision: number | null;
  recall: number | null;
  f1_score: number | null;
}

export interface ArtifactInfo {
  available: boolean;
  url: string | null;
  size_bytes: number | null;
  modified_at: string | null;
}

export type ArtifactKey =
  | "classification_report"
  | "confusion_matrix"
  | "roc_curve"
  | "training_curves"
  | "gradcam_example"
  | "gwo_log"
  | "research_summary";

export interface ModelInsightsResponse {
  success: true;
  overview: ModelOverview;
  metrics: PerformanceMetrics | null;
  classification_report: ClassificationReport | null;
  confusion_matrix_url: string | null;
  roc_curve_url: string | null;
  training_curves_url: string | null;
  gradcam_example_url: string | null;
  gwo: Record<string, unknown> | null;
  research_summary: Record<string, unknown> | null;
  artifacts: Record<ArtifactKey, ArtifactInfo>;
}

// ---- Dashboard (schemas/dashboard.py, Phase 10) ------------------------

export interface Statistics {
  total_studies: number;
  today_studies: number;
  tb_detected: number;
  normal_detected: number;
}

export interface RecentStudy {
  prediction_id: number;
  predicted_label: string;
  confidence: number; // percentage, 0-100
  thumbnail_url: string | null;
  created_at: string; // ISO 8601
}

export interface ModelStatus {
  name: string | null;
  architecture: string | null;
  framework: string | null;
  version: string | null;
  threshold: number | null;
  input_size: number | null;
  classes: string[] | null;
  device: string | null;
  loaded: boolean;
}

export interface SystemStatus {
  backend: boolean;
  database: boolean;
  ai_model: boolean;
  storage: boolean;
}

export interface DashboardResponse {
  statistics: Statistics;
  recent_studies: RecentStudy[];
  model: ModelStatus;
  system: SystemStatus;
}