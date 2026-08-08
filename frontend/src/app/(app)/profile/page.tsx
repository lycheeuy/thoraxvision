"use client";

/**
 * Profile — view and edit the current user's account.
 *
 * Reads the profile from GET /api/v1/users/me and exposes two mutations:
 * update profile (full_name / email) and change password. Profile edits
 * invalidate the profile query; password changes do not, since they don't
 * alter the returned user. All feedback goes through the shared sonner toast.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { PersonalInformationCard } from "@/components/profile/personal-information-card";
import { ProfileHeader } from "@/components/profile/profile-header";
import { SecurityCard } from "@/components/profile/security-card";
import { PageContainer } from "@/components/layout/page-container";
import { PageSkeleton } from "@/components/common/loading";
import { ErrorState } from "@/components/common/error-state";
import { extractApiError } from "@/lib/api/client";
import { profileService } from "@/services/profile.service";
import type {
  ChangePasswordRequest,
  UpdateUserRequest,
} from "@/lib/api/types";

const PROFILE_QUERY_KEY = ["profile"];

export default function ProfilePage() {
  const queryClient = useQueryClient();

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: profileService.getProfile,
    retry: false,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateUserRequest) => profileService.updateProfile(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
      toast.success("Profile updated");
    },
    onError: (err: unknown) => {
      const apiError = extractApiError(err);
      toast.error("Couldn't update profile", { description: apiError.message });
    },
  });

  const passwordMutation = useMutation({
    mutationFn: (payload: ChangePasswordRequest) => profileService.changePassword(payload),
    onSuccess: () => {
      toast.success("Password changed");
    },
    onError: (err: unknown) => {
      const apiError = extractApiError(err);
      toast.error("Couldn't change password", { description: apiError.message });
    },
  });

  const handleUpdateProfile = async (payload: UpdateUserRequest): Promise<void> => {
    await updateMutation.mutateAsync(payload);
  };

  const handleChangePassword = async (payload: ChangePasswordRequest): Promise<void> => {
    await passwordMutation.mutateAsync(payload);
  };

  if (isError) {
    const apiError = extractApiError(error);
    return (
      <PageContainer>
        <ErrorState
          title="Couldn't load profile"
          message={apiError.message}
          detail={apiError.detail}
          onRetry={() => refetch()}
        />
      </PageContainer>
    );
  }

  if (isPending) {
    return (
      <PageContainer>
        <PageSkeleton />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mx-auto w-full max-w-[900px] space-y-6">
        <ProfileHeader user={data} />
        <PersonalInformationCard
          user={data}
          onSave={handleUpdateProfile}
          saving={updateMutation.isPending}
        />
        <SecurityCard
          onChangePassword={handleChangePassword}
          saving={passwordMutation.isPending}
        />
      </div>
    </PageContainer>
  );
}