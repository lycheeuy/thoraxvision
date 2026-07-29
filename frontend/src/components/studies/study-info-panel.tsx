"use client";

/**
 * Study Information — the provenance panel for a stored study: id, capture
 * date/time, inference latency, model name/version, and the result status.
 * Values come straight from the history detail response.
 */
import { Calendar, Clock, Cpu, Hash, Activity } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { HistoryDetailResponse } from "@/lib/api/types";

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: (p: { className?: string }) => any;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 py-2.5 last:border-0">
      <span className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <span className="numeric font-mono text-xs font-medium">{value}</span>
    </div>
  );
}

export function StudyInfoPanel({ study }: { study: HistoryDetailResponse }) {
  const created = new Date(study.created_at);
  const isFinding = study.predicted_label === "Tuberculosis";

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
      <h3 className="mb-3 text-sm font-semibold tracking-tight">Study information</h3>
      <div>
        <Row icon={Hash} label="Study ID" value={`#${study.prediction_id}`} />
        <Row
          icon={Calendar}
          label="Date"
          value={created.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        />
        <Row
          icon={Clock}
          label="Time"
          value={created.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          })}
        />
        {study.inference_time != null && (
          <Row icon={Activity} label="Inference" value={`${study.inference_time.toFixed(2)}s`} />
        )}
        {study.model_info?.name && (
          <Row icon={Cpu} label="Model" value={study.model_info.name} />
        )}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Result</span>
        <Badge variant={isFinding ? "finding" : "clear"}>
          {isFinding ? "Finding" : "Clear"}
        </Badge>
      </div>
    </div>
  );
}