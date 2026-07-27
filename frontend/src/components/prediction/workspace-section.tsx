/**
 * Numbered section frame — the organising unit of the analysis workspace.
 *
 * Gives every part of the radiology workstation the same rhythm: a small
 * index, a title with optional icon, an optional right-aligned action, then
 * the content. Keeps nine disparate panels reading as one instrument.
 */
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function WorkspaceSection({
  index,
  title,
  icon: Icon,
  action,
  children,
  className,
}: {
  index?: string;
  title: string;
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2.5">
        {index && (
          <span className="numeric font-mono text-[11px] font-semibold text-muted-foreground/50">
            {index}
          </span>
        )}
        {Icon && <Icon className="h-4 w-4 text-primary" aria-hidden />}
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        {action && <div className="ml-auto">{action}</div>}
      </div>
      {children}
    </section>
  );
}