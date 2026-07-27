/**
 * ThoraxVision identity mark.
 *
 * The mark is a scan aperture: concentric rounded square + centred pulse,
 * rendered in the blue→cyan brand gradient. `collapsed` drops the wordmark
 * for the narrow sidebar.
 */
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-ai shadow-glow",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white">
        {/* aperture corners */}
        <path
          d="M4 8.5V6a2 2 0 0 1 2-2h2.5M15.5 4H18a2 2 0 0 1 2 2v2.5M20 15.5V18a2 2 0 0 1-2 2h-2.5M8.5 20H6a2 2 0 0 1-2-2v-2.5"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
        {/* thoracic pulse */}
        <path
          d="M7.5 12h2l1.4-3 2.2 6 1.4-3h2"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function Logo({
  collapsed = false,
  showTagline = false,
  className,
}: {
  collapsed?: boolean;
  showTagline?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <LogoMark />
      {!collapsed && (
        <div className="min-w-0 leading-none">
          <p className="text-[15px] font-semibold tracking-tight">
            Thorax<span className="text-gradient-ai">Vision</span>
          </p>
          {showTagline && (
            <p className="mt-1 truncate text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              AI Chest X-Ray Analysis
            </p>
          )}
        </div>
      )}
    </div>
  );
}