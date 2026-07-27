"use client";

/**
 * Root route: send the visitor wherever they belong.
 * Authenticated -> /dashboard, otherwise -> /login.
 */
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { FullPageLoader } from "@/components/common/loading";
import { useAuth } from "@/providers/auth-provider";

export default function RootPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    router.replace(isAuthenticated ? "/prediction" : "/login");
  }, [isAuthenticated, isLoading, router]);

  return <FullPageLoader label="Loading ThoraxVision..." />;
}