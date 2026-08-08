import { apiClient } from "@/lib/api/client";
import type {
  ChangePasswordRequest,
  MessageResponse,
  UpdateUserRequest,
  UserResponse,
} from "@/lib/api/types";

class ProfileService {
  async getProfile(): Promise<UserResponse> {
    const { data } = await apiClient.get<UserResponse>("/api/v1/users/me");
    return data;
  }

  async updateProfile(data: UpdateUserRequest): Promise<UserResponse> {
    const { data: user } = await apiClient.put<UserResponse>("/api/v1/users/me", data);
    return user;
  }

  async changePassword(data: ChangePasswordRequest): Promise<MessageResponse> {
    const { data: message } = await apiClient.put<MessageResponse>(
      "/api/v1/users/me/password",
      data,
    );
    return message;
  }
}

export const profileService = new ProfileService();