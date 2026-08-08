import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";

export interface PageHeaderProps {
  badge?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ badge, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-2">
        {badge && (
          <Badge className="border-slate-200 bg-slate-50 text-slate-600">{badge}</Badge>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {description && (
          <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}