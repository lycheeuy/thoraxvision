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