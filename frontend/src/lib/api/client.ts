/**
 * Axios instance — ALL HTTP traffic to the backend goes through here.
 *
 * Request interceptor : attaches the Bearer token (via tokenStorage).
 * Response interceptor: on 401, clears the token and redirects to /login
 *                       (except when the failing call IS the login attempt —
 *                       the form must show "invalid credentials" instead).
 */
import axios, { AxiosError } from "axios";

import { env } from "@/lib/env";
import { tokenStorage } from "@/lib/token-storage";
import { isErrorResponse, type ErrorDetail } from "@/lib/api/types";

export const apiClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 60_000, // first prediction includes model load — keep generous
});

apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    const isLoginCall = error.config?.url?.includes("/auth/login") ?? false;

    if (status === 401 && !isLoginCall && typeof window !== "undefined") {
      tokenStorage.clear();
      // Hard redirect: also clears all in-memory state.
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

/**
 * Extract the backend's standardized ErrorDetail from any thrown error.
 * Falls back to a generic message for network failures / non-envelope bodies.
 */
export function extractApiError(err: unknown): ErrorDetail {
  if (axios.isAxiosError(err)) {
    const body = err.response?.data;
    if (isErrorResponse(body)) return body.error;
    if (err.code === "ECONNABORTED") {
      return { code: "timeout", message: "Server took too long to respond.", detail: null };
    }
    if (!err.response) {
      return { code: "network_error", message: "Cannot reach the server.", detail: null };
    }
  }
  return { code: "unknown_error", message: "Something went wrong.", detail: null };
}