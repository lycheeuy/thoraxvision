/**
 * "Not built yet" surface for the routes that land in later phases.
 * Uses the same EmptyState language as the rest of the product, so an
 * unfinished screen still feels part of the system rather than a stub.
 */
import type { LucideIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/ui/badge";

export function PlaceholderPage({
  title,
  description,
  icon,
  phase,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  phase: string;
}) {
  return (
    <div className="ambient-canvas min-h-full">
      <div className="mx-auto w-full max-w-3xl px-6 py-16">
        <div className="rounded-2xl border border-dashed border-border bg-card/40 backdrop-blur">
          <EmptyState
            icon={icon}
            title={title}
            description={description}
            action={<Badge variant="neutral">Planned for {phase}</Badge>}
          />
        </div>
      </div>
    </div>
  );
}