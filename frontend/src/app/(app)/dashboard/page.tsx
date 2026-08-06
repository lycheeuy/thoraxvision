"use client";

/**
 * Overview — the workflow-oriented dashboard, now backed by the aggregated
 * /api/v1/dashboard endpoint. It answers, in order:
 *   1. What do I do here?              -> hero with the primary action
 *   2. What has been happening?        -> statistics + recent studies
 *   3. What will an analysis do?       -> the three-stage pipeline
 *   4. What is running, and is it up?  -> engine + system panels
 *
 * All data comes from a single dashboard response; each card receives its
 * slice directly, with no transformation here.
 */
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  ScanLine,
  Sparkles,
  Waves,
} from "lucide-react";

import { RecentStudiesCard } from "@/components/dashboard/recent-studies-card";
import { StatisticsCards } from "@/components/dashboard/statistics-cards";
import { SystemStatusCard } from "@/components/dashboard/system-status-card";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { ErrorState } from "@/components/common/error-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { extractApiError } from "@/lib/api/client";
import { dashboardService } from "@/services/dashboard.service";
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
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: dashboardService.get,
    refetchInterval: 30_000,
    retry: false,
  });

  if (isError) {
    const apiError = extractApiError(error);
    return (
      <div className="ambient-canvas min-h-full">
        <div className="mx-auto w-full max-w-7xl px-6 py-10">
          <ErrorState
            title="Couldn't load dashboard"
            message={apiError.message}
            detail={apiError.detail}
            onRetry={() => refetch()}
          />
        </div>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="ambient-canvas min-h-full">
        <DashboardSkeleton />
      </div>
    );
  }

  const firstName = (user?.full_name ?? user?.username ?? "").split(" ")[0];
  const model = data.model;
  const modelReady = model.loaded;

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
              <Link href="/insights">
                Model insights <ArrowRight />
              </Link>
            </Button>
          </div>
        </section>

        {/* --------------------- Statistics --------------------- */}
        <section>
          <StatisticsCards statistics={data.statistics} />
        </section>

        {/* --------------- Recent studies + System --------------- */}
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <RecentStudiesCard studies={data.recent_studies} />
          <SystemStatusCard system={data.system} />
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

                <div className="hairline absolute inset-x-0 bottom-0 h-px opacity-0 transition-opacity group-hover:opacity-100" />
              </Card>
            ))}
          </div>
        </section>

        {/* ---------------------- Engine ---------------------- */}
        <section>
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
                      {model.name ?? "ThoraxVision-DenseNet121"}
                    </p>
                  </div>
                </div>

                <Badge variant={modelReady ? "ai" : "neutral"}>
                  {modelReady ? "Ready" : "Standby"}
                </Badge>
              </div>

              <div className="mt-6 grid gap-x-8 sm:grid-cols-2">
                <div>
                  <SpecRow label="Architecture" value={model.architecture ?? "—"} />
                  <SpecRow label="Framework" value={model.framework ?? "—"} />
                  <SpecRow label="Version" value={model.version ? `v${model.version}` : "—"} />
                </div>
                <div>
                  <SpecRow
                    label="Input"
                    value={model.input_size ? `${model.input_size} × ${model.input_size}` : "—"}
                  />
                  <SpecRow
                    label="Classes"
                    value={model.classes && model.classes.length > 0 ? model.classes.join(" / ") : "—"}
                  />
                  <SpecRow label="Device" value={model.device ?? "—"} />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}