import { ArrowRight, BrainCircuit, FolderOpen, ScanSearch, UserRound, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface QuickAction {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

const ACTIONS: readonly QuickAction[] = [
  {
    href: "/prediction",
    label: "New Analysis",
    description: "Upload an X-ray image",
    icon: ScanSearch,
  },
  {
    href: "/studies",
    label: "Studies",
    description: "View prediction history",
    icon: FolderOpen,
  },
  {
    href: "/insights",
    label: "Model Insights",
    description: "View research metrics",
    icon: BrainCircuit,
  },
  {
    href: "/profile",
    label: "Profile",
    description: "Account settings",
    icon: UserRound,
  },
] as const;

export function QuickActionsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold tracking-tight">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ACTIONS.map(({ href, label, description, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-elevated"
            >
              <div className="flex items-start justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <ArrowRight
                  className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-tight">{label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}