"use client";

/**
 * Overview — organised around the AI workflow, not around counters.
 *
 * The screen answers three questions in order:
 *   1. What do I do here?        -> hero with the single primary action
 *   2. What will happen?         -> the three-stage pipeline
 *   3. What is running, and is it up? -> engine + system panels
 */
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  Database,
  Layers,
  ScanLine,
  Server,
  Sparkles,
  Target,
  Waves,
} from "lucide-react";

import { StatusDot, type SystemState } from "@/components/common/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { healthService } from "@/services/health.service";
import { useAuth } from "@/providers/auth-provider";

const PIPELINE = [
  {
    icon: ScanLine,
    step: "01",
    title: "Load study",
    body: "Drop a frontal chest radiograph. Resized to 224×224 and normalised exactly as in training.",
  },
  {
    icon: BrainCircuit,
    step: "02",
    title: "Inference",
    body: "DenseNet121 with a tuned classifier head returns calibrated class probabilities.",
  },
  {
    icon: Waves,
    step: "03",
    title: "Explain",
    body: "Grad-CAM over the final dense block shows which regions drove the decision.",
  },
] as const;

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 py-2 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="numeric font-mono text-xs font-medium">{value}</span>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: health, isPending, isError } = useQuery({
    queryKey: ["health"],
    queryFn: healthService.getHealth,
    refetchInterval: 30_000,
    retry: false,
  });

  const apiState: SystemState = isPending ? "connecting" : isError ? "offline" : "online";
  const dbUp = health?.database === "connected";
  const modelReady = health?.model === "loaded";
  const firstName = (user?.full_name ?? user?.username ?? "").split(" ")[0];

  return (
    <div className="ambient-canvas min-h-full">
      <div className="mx-auto w-full max-w-7xl space-y-10 px-6 py-10">
        {/* ------------------------- Hero ------------------------- */}
        <section className="animate-fade-up">
          <Badge variant="ai" className="mb-5">
            <Sparkles className="h-3 w-3" />
            DenseNet121 · Grad-CAM
          </Badge>

          <h1 className="max-w-2xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
            {firstName ? `Welcome back, ${firstName}.` : "Welcome back."}
            <br />
            <span className="text-gradient-ai">Analyse a chest X-ray.</span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
            Upload a frontal radiograph and the model returns a tuberculosis
            assessment with a Grad-CAM overlay showing the evidence behind it.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button variant="ai" size="lg" asChild>
              <Link href="/prediction">
                <ScanLine /> Start new analysis
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/performance">
                Model metrics <ArrowRight />
              </Link>
            </Button>
          </div>
        </section>

        {/* ---------------------- Pipeline ---------------------- */}
        <section>
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            How an analysis runs
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            {PIPELINE.map(({ icon: Icon, step, title, body }, i) => (
              <Card
                key={step}
                className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elevated"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-border/70 bg-card shadow-soft transition-colors group-hover:border-primary/30">
                      <Icon className="h-5 w-5 text-primary" />
                    </span>
                    <span className="numeric font-mono text-2xl font-bold text-muted-foreground/20">
                      {step}
                    </span>
                  </div>

                  <h3 className="mt-5 text-sm font-semibold tracking-tight">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
                </CardContent>

                {/* hairline that lights up on hover */}
                <div className="hairline absolute inset-x-0 bottom-0 h-px opacity-0 transition-opacity group-hover:opacity-100" />
              </Card>
            ))}
          </div>
        </section>

        {/* ------------------ Engine + System ------------------ */}
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          {/* Engine */}
          <Card className="overflow-hidden">
            <div className="hairline h-px w-full" />
            <CardContent className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-ai shadow-glow">
                    <BrainCircuit className="h-5 w-5 text-white" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold tracking-tight">Inference engine</h3>
                    <p className="text-xs text-muted-foreground">
                      {health?.model_info?.name ?? "ThoraxVision-DenseNet121"}
                    </p>
                  </div>
                </div>

                <Badge variant={modelReady ? "ai" : "neutral"}>
                  {modelReady ? "Ready" : apiState === "offline" ? "Unreachable" : "Standby"}
                </Badge>
              </div>

              <div className="mt-6 grid gap-x-8 sm:grid-cols-2">
                <div>
                  <SpecRow label="Architecture" value="DenseNet121" />
                  <SpecRow label="Framework" value={health?.model_info?.framework ?? "PyTorch"} />
                  <SpecRow label="Version" value={`v${health?.model_info?.version ?? "—"}`} />
                </div>
                <div>
                  <SpecRow label="Input" value="224 × 224 RGB" />
                  <SpecRow label="Classes" value="TB / Non-TB" />
                  <SpecRow label="Explainability" value="Grad-CAM" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold tracking-tight">System</h3>
              </div>

              <div className="mt-5 space-y-3">
                {[
                  {
                    icon: Server,
                    label: "Inference API",
                    value: apiState === "online" ? "Online" : apiState === "connecting" ? "Connecting" : "Offline",
                    state: apiState,
                  },
                  {
                    icon: Database,
                    label: "Database",
                    value: apiState !== "online" ? "—" : dbUp ? "Connected" : "Disconnected",
                    state: (apiState !== "online" ? "connecting" : dbUp ? "online" : "offline") as SystemState,
                  },
                  {
                    icon: Layers,
                    label: "Model weights",
                    value: apiState !== "online" ? "—" : modelReady ? "Loaded" : "Standby",
                    state: (apiState !== "online" ? "connecting" : modelReady ? "online" : "connecting") as SystemState,
                  },
                ].map(({ icon: Icon, label, value, state }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/40 px-3.5 py-2.5"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 text-xs">{label}</span>
                    <span
                      className={cn(
                        "numeric font-mono text-xs font-medium",
                        state === "offline" && "text-destructive",
                      )}
                    >
                      {value}
                    </span>
                    <StatusDot state={state} />
                  </div>
                ))}
              </div>

              <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
                Status refreshes automatically every 30 seconds.
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}