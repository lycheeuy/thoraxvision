"use client";

/**
 * Status primitives shared by the navbar, dashboard and prediction result.
 *
 * Colour language (deliberate, and consistent everywhere):
 *   blue  = healthy / no finding / ready
 *   cyan  = AI activity in progress
 *   amber = degraded, connecting
 *   rose  = offline, or a positive TB finding
 * Green is never used — it reads as a generic dashboard, not a diagnostic tool.
 */
import { cn } from "@/lib/utils";

export type SystemState = "online" | "connecting" | "offline";

const DOT_TONE: Record<SystemState, string> = {
  online: "bg-primary",
  connecting: "bg-warning",
  offline: "bg-destructive",
};

/** Small live dot with a halo that only animates while something is pending. */
export function StatusDot({ state, className }: { state: SystemState; className?: string }) {
  return (
    <span className={cn("relative flex h-2 w-2 shrink-0", className)}>
      {state !== "offline" && (
        <span
          className={cn(
            "absolute inline-flex h-full w-full rounded-full opacity-60",
            DOT_TONE[state],
            state === "connecting" ? "animate-ping" : "animate-pulse-ring",
          )}
        />
      )}
      <span className={cn("relative inline-flex h-2 w-2 rounded-full", DOT_TONE[state])} />
    </span>
  );
}

/** Compact pill: dot + label + value. Used for API / Model status in the navbar. */
export function StatusPill({
  state,
  label,
  value,
  className,
}: {
  state: SystemState;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-1.5 shadow-soft backdrop-blur",
        className,
      )}
      title={`${label}: ${value}`}
    >
      <StatusDot state={state} />
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="numeric text-xs font-semibold">{value}</span>
    </div>
  );
}