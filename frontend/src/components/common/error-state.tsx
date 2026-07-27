"use client";

/**
 * Error surface — the visual counterpart of the backend's error envelope.
 * Feed it the output of extractApiError().
 */
import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  message: string;
  detail?: string | null;
  code?: string | null;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  detail,
  code,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/[0.04] px-6 py-12 text-center",
        className,
      )}
    >
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-destructive/20 bg-card shadow-soft">
        <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden />
      </span>

      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">{message}</p>

      {detail ? (
        <p className="mt-2 max-w-md font-mono text-[11px] leading-relaxed text-muted-foreground/70">
          {detail}
        </p>
      ) : null}

      {code ? (
        <span className="mt-3 rounded-full border border-border bg-card px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {code}
        </span>
      ) : null}

      {onRetry ? (
        <Button variant="outline" size="sm" className="mt-6" onClick={onRetry}>
          <RotateCcw /> Try again
        </Button>
      ) : null}
    </div>
  );
}