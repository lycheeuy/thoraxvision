/**
 * Auth service — business calls for /api/v1/auth/*.
 * Components never call apiClient directly; they use these functions
 * (usually through TanStack Query / AuthProvider).
 */
import { apiClient } from "@/lib/api/client";
import type { LoginResponse, LogoutResponse, UserResponse } from "@/lib/api/types";

export const authService = {
  /** Backend expects OAuth2 FORM fields (username, password) — not JSON. */
  async login(username: string, password: string): Promise<LoginResponse> {
    const form = new URLSearchParams();
    form.set("username", username);
    form.set("password", password);
    const { data } = await apiClient.post<LoginResponse>("/api/v1/auth/login", form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    return data;
  },

  async me(): Promise<UserResponse> {
    const { data } = await apiClient.get<UserResponse>("/api/v1/auth/me");
    return data;
  },

  async logout(): Promise<LogoutResponse> {
    const { data } = await apiClient.post<LogoutResponse>("/api/v1/auth/logout");
    return data;
  },
} as const;