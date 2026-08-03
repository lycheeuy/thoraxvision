"use client";

/**
 * Section frame for the insights page — consistent index, icon, title and
 * an optional "unavailable" affordance so a missing artifact reads as an
 * intentional empty state rather than a broken panel.
 */
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function InsightsSection({
  title,
  icon: Icon,
  description,
  available = true,
  unavailableHint = "This artifact hasn't been generated yet.",
  children,
  className,
}: {
  title: string;
  icon?: LucideIcon;
  description?: string;
  available?: boolean;
  unavailableHint?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex items-start gap-2.5">
        {Icon && <Icon className="mt-0.5 h-4 w-4 text-primary" aria-hidden />}
        <div>
          <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>

      {available ? (
        children
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-6 text-center text-sm text-muted-foreground">
          {unavailableHint}
        </div>
      )}
    </section>
  );
}