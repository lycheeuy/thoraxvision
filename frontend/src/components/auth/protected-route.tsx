"use client";

/**
 * Client-side route guard for everything under (app).
 *
 * - isLoading (token still being validated) -> full-page loader, NO redirect
 *   yet: redirecting during hydration would bounce logged-in users to /login
 *   on every refresh.
 * - not authenticated -> replace to /login.
 * - authenticated -> render children.
 */
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { FullPageLoader } from "@/components/common/loading";
import { useAuth } from "@/providers/auth-provider";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) return <FullPageLoader label="Checking session..." />;
  if (!isAuthenticated) return <FullPageLoader label="Redirecting to login..." />;
  return <>{children}</>;
}