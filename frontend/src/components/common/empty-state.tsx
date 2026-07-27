/**
 * Empty state — a prompt, not an apology.
 *
 * Every empty surface in the product says what the space is for and offers
 * the single next action, instead of the usual grey "No data available".
 */
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-16 text-center",
        className,
      )}
    >
      <div className="relative mb-5">
        {/* soft halo */}
        <span className="absolute inset-0 -m-3 rounded-2xl bg-gradient-to-br from-primary/10 to-ai/10 blur-xl" />
        <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-border/70 bg-card shadow-soft">
          <Icon className="h-6 w-6 text-primary" aria-hidden />
        </span>
      </div>

      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}