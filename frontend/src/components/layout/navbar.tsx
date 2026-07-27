"use client";

/**
 * Top bar — glass over the scrolling canvas.
 *
 * Left : contextual page title + one-line purpose.
 * Right: API status, Model status, theme, account.
 * Status is polled every 30s so the operator always knows whether the
 * inference service is actually reachable before uploading a study.
 */
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { LogOut, Menu, Moon, Sun, UserRound } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";

import { Logo } from "@/components/common/logo";
import { StatusPill, type SystemState } from "@/components/common/status-badge";
import { NAV_ITEMS, SidebarNav } from "@/components/layout/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { healthService } from "@/services/health.service";
import { useAuth } from "@/providers/auth-provider";

const PAGE_SUBTITLE: Record<string, string> = {
  "/dashboard": "Your analysis workspace",
  "/prediction": "Upload a chest X-ray for AI analysis",
  "/history": "Previously analysed studies",
  "/performance": "Model evaluation and metrics",
  "/profile": "Account details",
};

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { setTheme, resolvedTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: health, isPending, isError } = useQuery({
    queryKey: ["health"],
    queryFn: healthService.getHealth,
    refetchInterval: 30_000,
    retry: false,
  });

  const apiState: SystemState = isPending ? "connecting" : isError ? "offline" : "online";
  const modelReady = health?.model === "loaded";
  const modelState: SystemState = isError ? "offline" : isPending ? "connecting" : modelReady ? "online" : "connecting";

  const active = NAV_ITEMS.find((i) => pathname.startsWith(i.href));
  const title = active?.label ?? "ThoraxVision";
  const subtitle = PAGE_SUBTITLE[active?.href ?? ""] ?? "AI chest X-ray analysis";

  const initials = (user?.full_name ?? user?.username ?? "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <header className="glass sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border/60 px-4 md:px-6">
      {/* Mobile navigation */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation">
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[264px] p-0">
          <div className="flex h-16 items-center border-b border-border/60 px-5">
            <Logo showTagline />
          </div>
          <div className="py-4">
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <div className="min-w-0">
        <h1 className="truncate text-[15px] font-semibold tracking-tight">{title}</h1>
        <p className="hidden truncate text-xs text-muted-foreground sm:block">{subtitle}</p>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden items-center gap-2 lg:flex">
          <StatusPill
            state={apiState}
            label="API"
            value={apiState === "online" ? "Online" : apiState === "connecting" ? "Connecting" : "Offline"}
          />
          <StatusPill
            state={modelState}
            label="Model"
            value={
              apiState !== "online"
                ? "—"
                : modelReady
                  ? `v${health?.model_info?.version ?? "1.0.0"}`
                  : "Standby"
            }
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle theme"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          <Sun className="rotate-0 scale-100 transition-transform duration-300 dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute rotate-90 scale-0 transition-transform duration-300 dark:rotate-0 dark:scale-100" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center rounded-full outline-none ring-offset-2 ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Account menu"
            >
              <Avatar className="h-9 w-9 ring-2 ring-primary/20 transition hover:ring-primary/40">
                <AvatarFallback className="bg-gradient-to-br from-primary to-ai text-xs font-semibold text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-60 rounded-xl p-1.5">
            <DropdownMenuLabel className="px-2.5 py-2">
              <p className="truncate text-sm font-medium">{user?.full_name ?? user?.username}</p>
              <p className="truncate text-xs font-normal text-muted-foreground">{user?.email}</p>
              <span className="mt-1.5 inline-flex rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent-foreground">
                {user?.role}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="rounded-lg" onClick={() => router.push("/profile")}>
              <UserRound className="h-4 w-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="rounded-lg text-destructive focus:bg-destructive/10 focus:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}