import { Crosshair, Percent, Target, TrendingUp, type LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export interface PerformanceMetricsProps {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
}

interface MetricItem {
  label: string;
  value: number;
  icon: LucideIcon;
}

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

function MetricCard({ label, value, icon: Icon }: MetricItem) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="rounded-xl border border-border/70 bg-card p-4 shadow-soft">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>

      <p className="numeric mt-3 font-mono text-2xl font-bold tracking-tight tabular-nums">
        {formatPercent(value)}
      </p>

      <Progress value={clamped} className="mt-3 h-2" />
    </div>
  );
}

export function PerformanceMetrics({
  accuracy,
  precision,
  recall,
  f1Score,
}: PerformanceMetricsProps) {
  const metrics: MetricItem[] = [
    { label: "Accuracy", value: accuracy, icon: Target },
    { label: "Precision", value: precision, icon: Crosshair },
    { label: "Recall", value: recall, icon: Percent },
    { label: "F1-Score", value: f1Score, icon: TrendingUp },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold tracking-tight">Performance Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}