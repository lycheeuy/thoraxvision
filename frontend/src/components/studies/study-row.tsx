"use client";

/**
 * One row in the studies table.
 *
 * Thumbnail is locked to a consistent square aspect with a graceful fallback
 * (the backend may return thumbnail_url: null, or the image may 404). Status
 * is the prediction result — Finding (rose) for TB, Clear (blue) otherwise —
 * matching the verdict language used across the workspace.
 */
import Link from "next/link";
import { ImageOff, ArrowRight } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { HistoryItem } from "@/lib/api/types";

function Thumb({ src, alt }: { src: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);
  const showFallback = !src || failed;
  return (
    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border/70 bg-slate-950">
      {showFallback ? (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground/50">
          <ImageOff className="h-5 w-5" />
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

export function StudyRow({
  item,
  thumbnailUrl,
}: {
  item: HistoryItem;
  thumbnailUrl: string | null;
}) {
  const isFinding = item.predicted_label === "Tuberculosis";
  const date = new Date(item.created_at);

  return (
    <tr className="group border-b border-border/50 transition-colors hover:bg-muted/40">
      {/* Study ID */}
      <td className="px-4 py-3">
        <span className="numeric font-mono text-xs text-muted-foreground">
          #{item.prediction_id}
        </span>
      </td>

      {/* Thumbnail */}
      <td className="px-4 py-3">
        <Thumb src={thumbnailUrl} alt={`Study ${item.prediction_id}`} />
      </td>

      {/* Prediction */}
      <td className="px-4 py-3">
        <span className="text-sm font-medium">{item.predicted_label}</span>
      </td>

      {/* Confidence */}
      <td className="px-4 py-3">
        <span className="numeric font-mono text-sm">{item.confidence.toFixed(1)}%</span>
      </td>

      {/* Date */}
      <td className="px-4 py-3">
        <span className="text-sm text-muted-foreground">
          {date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
        </span>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <Badge variant={isFinding ? "finding" : "clear"}>
          {isFinding ? "Finding" : "Clear"}
        </Badge>
      </td>

      {/* Action */}
      <td className="px-4 py-3 text-right">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/studies/${item.prediction_id}`}>
            Open
            <ArrowRight className={cn("transition-transform group-hover:translate-x-0.5")} />
          </Link>
        </Button>
      </td>
    </tr>
  );
}