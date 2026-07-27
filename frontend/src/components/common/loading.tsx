/**
 * Loading primitives.
 *
 * Skeletons use a moving sheen rather than a flat pulse: on a dark medical
 * canvas a static pulse reads as a broken image, a sweep reads as "working".
 */
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/common/logo";

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent",
        className,
      )}
      role="status"
      aria-label="Loading"
    />
  );
}

/** Shimmering block — the base unit of every skeleton below. */
export function Shimmer({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-lg bg-muted/70", className)}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-foreground/[0.06] to-transparent" />
    </div>
  );
}

export function FullPageLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="ambient-canvas flex min-h-screen flex-col items-center justify-center gap-5">
      <div className="relative">
        <span className="absolute inset-0 animate-pulse-ring rounded-xl bg-primary/30" />
        <LogoMark className="relative h-11 w-11" />
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner className="h-3.5 w-3.5 text-primary" />
        {label}
      </div>
    </div>
  );
}

/** Generic page skeleton: header block + content panels. */
export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Shimmer className="h-7 w-64" />
        <Shimmer className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Shimmer className="h-40 rounded-2xl lg:col-span-2" />
        <Shimmer className="h-40 rounded-2xl" />
      </div>
      <Shimmer className="h-64 rounded-2xl" />
    </div>
  );
}

/** Skeleton shaped like the analysis result, so the layout doesn't jump. */
export function AnalysisSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Shimmer className="aspect-square rounded-2xl" />
        <Shimmer className="aspect-square rounded-2xl" />
      </div>
      <Shimmer className="h-24 rounded-2xl" />
      <div className="grid gap-3 sm:grid-cols-3">
        <Shimmer className="h-16 rounded-xl" />
        <Shimmer className="h-16 rounded-xl" />
        <Shimmer className="h-16 rounded-xl" />
      </div>
    </div>
  );
}