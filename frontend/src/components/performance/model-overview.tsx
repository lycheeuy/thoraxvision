import { Fragment } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export interface ModelOverviewProps {
  name: string | null;
  architecture: string | null;
  framework: string | null;
  version: string | null;
  threshold: number | null;
  inputSize: number | null;
  classes: string[] | null;
  device: string | null;
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

export function ModelOverview({
  name,
  architecture,
  framework,
  version,
  threshold,
  inputSize,
  classes,
  device,
}: ModelOverviewProps) {
  const rows: { label: string; value: string }[] = [
    { label: "Model Name", value: text(name) },
    { label: "Architecture", value: text(architecture) },
    { label: "Framework", value: text(framework) },
    { label: "Version", value: version ? `v${version}` : PLACEHOLDER },
    { label: "Input Size", value: formatInputSize(inputSize) },
    { label: "Threshold", value: formatThreshold(threshold) },
    { label: "Classes", value: formatClasses(classes) },
    { label: "Device", value: text(device) },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold tracking-tight">Model Overview</CardTitle>
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