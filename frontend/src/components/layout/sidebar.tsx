"use client";

/**
 * Primary navigation.
 *
 * Structure: identity → navigation → model card → collapse control.
 * The model card is the point: every screen states which network is loaded,
 * so the product reads as an AI instrument rather than an admin panel.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  BrainCircuit,
  History,
  LayoutGrid,
  PanelLeftClose,
  PanelLeftOpen,
  ScanLine,
  UserRound,
} from "lucide-react";
import { useState } from "react";

import { Logo } from "@/components/common/logo";
import { StatusDot } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { healthService } from "@/services/health.service";
import { useAuth } from "@/providers/auth-provider";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid, hint: "Workspace" },
  { href: "/prediction", label: "New Analysis", icon: ScanLine, hint: "Run the model" },
  { href: "/studies", label: "Studies", icon: History, hint: "Past analyses" },
  { href: "/performance", label: "Model Metrics", icon: Activity, hint: "Evaluation" },
  { href: "/profile", label: "Account", icon: UserRound, hint: "Your profile" },
] as const;

export function SidebarNav({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-3">
      {!collapsed && (
        <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
          Workspace
        </p>
      )}

      {NAV_ITEMS.map(({ href, label, icon: Icon, hint }) => {
        const active = pathname.startsWith(href);

        const link = (
          <Link
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              active
                ? "bg-accent text-accent-foreground shadow-soft"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              collapsed && "justify-center px-2",
            )}
          >
            {/* active rail */}
            <span
              className={cn(
                "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-primary to-ai transition-opacity",
                active ? "opacity-100" : "opacity-0",
              )}
            />
            <Icon
              className={cn(
                "h-[18px] w-[18px] shrink-0 transition-colors",
                active ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
              )}
            />
            {!collapsed && <span className="truncate">{label}</span>}
          </Link>
        );

        if (!collapsed) return <div key={href}>{link}</div>;

        return (
          <Tooltip key={href}>
            <TooltipTrigger asChild>{link}</TooltipTrigger>
            <TooltipContent side="right" className="flex items-center gap-2">
              <span className="font-medium">{label}</span>
              <span className="text-primary-foreground/60">{hint}</span>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </nav>
  );
}

/** Always-visible statement of what the engine is and whether it is ready. */
function ModelCard({ collapsed }: { collapsed: boolean }) {
  const { data, isPending, isError } = useQuery({
    queryKey: ["health"],
    queryFn: healthService.getHealth,
    refetchInterval: 30_000,
    retry: false,
  });

  const state = isPending ? "connecting" : isError ? "offline" : "online";
  const ready = data?.model === "loaded";

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-card shadow-soft">
            <BrainCircuit className={cn("h-[18px] w-[18px]", ready ? "text-ai" : "text-muted-foreground")} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          DenseNet121 · {ready ? "Ready" : "Not loaded"}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="mx-3 mb-3 overflow-hidden rounded-xl border border-border/70 bg-card shadow-soft">
      <div className="hairline h-px w-full" />
      <div className="p-3.5">
        <div className="flex items-center gap-2">
          <BrainCircuit className={cn("h-4 w-4", ready ? "text-ai" : "text-muted-foreground")} />
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Inference Engine
          </span>
        </div>

        <p className="mt-2 text-sm font-semibold tracking-tight">DenseNet121</p>
        <p className="numeric mt-0.5 font-mono text-[11px] text-muted-foreground">
          PyTorch · 224×224 · v{data?.model_info?.version ?? "—"}
        </p>

        <div className="mt-3 flex items-center gap-2 border-t border-border/60 pt-2.5">
          <StatusDot state={state} />
          <span className="text-xs text-muted-foreground">
            {state === "offline" ? "API offline" : ready ? "Model ready" : "Standby"}
          </span>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, role } = useAuth();

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "hidden h-screen shrink-0 flex-col border-r border-border/70 bg-card/40 backdrop-blur-sm transition-[width] duration-300 ease-out md:flex",
          collapsed ? "w-[76px]" : "w-[264px]",
        )}
      >
        <div className={cn("flex h-16 items-center px-5", collapsed && "justify-center px-3")}>
          <Logo collapsed={collapsed} showTagline />
        </div>

        <div className="flex-1 overflow-y-auto py-3">
          <SidebarNav collapsed={collapsed} />
        </div>

        <ModelCard collapsed={collapsed} />

        <div className={cn("flex items-center gap-2 border-t border-border/60 p-3", collapsed && "justify-center")}>
          {!collapsed && user && (
            <div className="min-w-0 flex-1 px-1">
              <p className="truncate text-xs font-medium">{user.full_name ?? user.username}</p>
              <p className="text-[11px] capitalize text-muted-foreground">{role}</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}