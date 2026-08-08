import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { UserResponse } from "@/lib/api/types";

export interface ProfileHeaderProps {
  user: UserResponse;
}

function getInitials(user: UserResponse): string {
  const source = user.full_name?.trim() || user.username.trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const initials = getInitials(user);
  const displayName = user.full_name?.trim() || user.username;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Profile
          </p>
          <p className="text-sm text-muted-foreground">
            Manage your personal information and account settings.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-lg font-semibold text-slate-700">
            {initials}
          </span>

          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-bold tracking-tight text-slate-900">
                {displayName}
              </h1>
              <Badge className="border-slate-200 bg-slate-50 text-slate-600">{user.role}</Badge>
            </div>
            <p className="truncate text-sm text-muted-foreground">@{user.username}</p>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}