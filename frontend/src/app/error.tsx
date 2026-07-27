"use client";

/**
 * Global error boundary (App Router convention). Receives the thrown error
 * and a reset() to retry rendering the segment.
 */
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

import { Logo } from "@/components/common/logo";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled UI error:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
      <Logo />
      <AlertTriangle className="h-12 w-12 text-destructive" aria-hidden />
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          An unexpected error occurred while rendering this page.
        </p>
        {error.digest ? (
          <p className="text-xs text-muted-foreground/70">Error ID: {error.digest}</p>
        ) : null}
      </div>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}