"use client";

/**
 * Profile — the only placeholder that already shows real data, proving the
 * whole auth chain works end to end (token -> /auth/me -> context).
 */
import { CalendarClock, Mail, Shield, UserRound } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { PageSkeleton } from "@/components/common/loading";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/providers/auth-provider";

function Row({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="w-32 text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <PageContainer>
        <PageSkeleton />
      </PageContainer>
    );
  }

  const initials = (user.full_name ?? user.username)
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <PageContainer className="max-w-2xl">
      <Card>
        <CardHeader className="flex-row items-center gap-4 space-y-0">
          <Avatar className="h-14 w-14">
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{user.full_name ?? user.username}</CardTitle>
            <p className="text-sm capitalize text-muted-foreground">{user.role}</p>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4">
          <Row icon={UserRound} label="Username" value={user.username} />
          <Row icon={Mail} label="Email" value={user.email} />
          <Row icon={Shield} label="Role" value={user.role} />
          <Row
            icon={CalendarClock}
            label="Last login"
            value={user.last_login ? new Date(user.last_login).toLocaleString() : "—"}
          />
        </CardContent>
      </Card>
    </PageContainer>
  );
}