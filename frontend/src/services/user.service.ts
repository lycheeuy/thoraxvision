/**
 * User service — user-centric calls.
 * Today this wraps /auth/me for the profile page; user management endpoints
 * (admin CRUD) land here in a later phase without touching components.
 */
import { authService } from "@/services/auth.service";
import type { UserResponse } from "@/lib/api/types";

export const userService = {
  async getProfile(): Promise<UserResponse> {
    return authService.me();
  },
} as const;