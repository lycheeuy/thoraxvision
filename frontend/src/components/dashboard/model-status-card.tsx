import { Fragment } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { ModelStatus } from "@/lib/api/types";

export interface ModelStatusCardProps {
  model: ModelStatus;
}

const PLACEHOLDER = "—";

function text(value: string | null): string {
  return value && value.trim() !== "" ? value : PLACEHOLDER;
}

function formatThreshold(value: number | null): string {
  return value == null ? PLACEHOLDER : value.toFixed(2);
}

function formatInputSize(value: number | null): string {
  return value == null ? PLACEHOLDER : `${value} × ${value}`;
}

function formatClasses(value: string[] | null): string {
  return value && value.length > 0 ? value.join(", ") : PLACEHOLDER;
}

export function ModelStatusCard({ model }: ModelStatusCardProps) {
  const rows: { label: string; value: string }[] = [
    { label: "Model Name", value: text(model.name) },
    { label: "Architecture", value: text(model.architecture) },
    { label: "Framework", value: text(model.framework) },
    { label: "Version", value: text(model.version) },
    { label: "Input Size", value: formatInputSize(model.input_size) },
    { label: "Threshold", value: formatThreshold(model.threshold) },
    { label: "Classes", value: formatClasses(model.classes) },
    { label: "Device", value: text(model.device) },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold tracking-tight">AI Model</CardTitle>
        <Badge
          className={cn(
            "gap-1.5",
            model.loaded
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700",
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              model.loaded ? "bg-emerald-500" : "bg-rose-500",
            )}
            aria-hidden
          />
          {model.loaded ? "Loaded" : "Not Loaded"}
        </Badge>
      </CardHeader>

      <CardContent>
        {rows.map((row, index) => (
          <Fragment key={row.label}>
            {index > 0 && <Separator />}
            <div className="flex items-center justify-between gap-4 py-2.5">
              <span className="text-xs text-muted-foreground">{row.label}</span>
              <span className="numeric truncate text-right font-mono text-xs font-medium">
                {row.value}
              </span>
            </div>
          </Fragment>
        ))}
      </CardContent>
    </Card>
  );
}