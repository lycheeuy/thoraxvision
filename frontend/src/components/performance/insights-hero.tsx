import { BrainCircuit } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export interface InsightsHeroProps {
  modelName: string | null;
  architecture: string | null;
  version: string | null;
}

function buildSubtitle(architecture: string | null, version: string | null): string {
  const versionLabel = version ? `v${version}` : null;
  const parts = [architecture, versionLabel].filter((part): part is string => Boolean(part));
  if (parts.length === 0) return "Model information unavailable.";
  return parts.join(" • ");
}

export function InsightsHero({ modelName, architecture, version }: InsightsHeroProps) {
  const subtitle = buildSubtitle(architecture, version);

  return (
    <Card>
      <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3">
          <Badge className="border-slate-200 bg-slate-50 text-slate-600">Model Insights</Badge>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {modelName ?? "—"}
          </h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <div className="shrink-0">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700">
            <BrainCircuit className="h-8 w-8" aria-hidden />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}