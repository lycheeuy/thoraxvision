"use client";

/**
 * Studies table shell — columns + rows. Purely presentational: it receives
 * the already-fetched page of items and a URL resolver, and renders rows.
 * Loading / empty / error states are handled by the page, not here.
 */
import { studiesService } from "@/services/studies.service";
import { StudyRow } from "@/components/studies/study-row";
import type { HistoryItem } from "@/lib/api/types";

const COLUMNS = [
  "ID",
  "Thumbnail",
  "Prediction",
  "Confidence",
  "Date",
  "Status",
  "",
] as const;

export function StudiesTable({ items }: { items: HistoryItem[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            {COLUMNS.map((c, i) => (
              <th
                key={c || i}
                className={
                  "px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground " +
                  (i === COLUMNS.length - 1 ? "text-right" : "text-left")
                }
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <StudyRow
              key={item.prediction_id}
              item={item}
              thumbnailUrl={studiesService.toAbsoluteUrl(item.thumbnail_url)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}