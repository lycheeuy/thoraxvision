"use client";

/**
 * Classification Report — the per-class precision/recall/F1/support table
 * plus the aggregate rows (accuracy, macro avg, weighted avg). Values come
 * from the parsed scikit-learn report; nothing is computed here.
 */
import type { ClassificationReport, ClassificationRow } from "@/lib/api/types";
import { cn } from "@/lib/utils";

function fmt(n: number | null): string {
  return n == null ? "—" : n.toFixed(3);
}

function Row({
  label,
  row,
  emphasis = false,
}: {
  label: string;
  row: Pick<ClassificationRow, "precision" | "recall" | "f1_score" | "support"> | null;
  emphasis?: boolean;
}) {
  return (
    <tr className={cn("border-b border-border/50 last:border-0", emphasis && "bg-muted/30")}>
      <td className={cn("px-4 py-2.5 text-sm", emphasis ? "font-semibold" : "font-medium")}>
        {label}
      </td>
      <td className="numeric px-4 py-2.5 text-right font-mono text-sm">{fmt(row?.precision ?? null)}</td>
      <td className="numeric px-4 py-2.5 text-right font-mono text-sm">{fmt(row?.recall ?? null)}</td>
      <td className="numeric px-4 py-2.5 text-right font-mono text-sm">{fmt(row?.f1_score ?? null)}</td>
      <td className="numeric px-4 py-2.5 text-right font-mono text-sm text-muted-foreground">
        {row?.support ?? "—"}
      </td>
    </tr>
  );
}

export function ClassificationReportTable({ report }: { report: ClassificationReport }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Class
            </th>
            {["Precision", "Recall", "F1-score", "Support"].map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {report.per_class.map((c) => (
            <Row key={c.label} label={c.label} row={c} />
          ))}

          {report.accuracy != null && (
            <tr className="border-b border-border/50 bg-muted/30">
              <td className="px-4 py-2.5 text-sm font-semibold">Accuracy</td>
              <td className="px-4 py-2.5" />
              <td className="px-4 py-2.5" />
              <td className="numeric px-4 py-2.5 text-right font-mono text-sm font-semibold">
                {report.accuracy.toFixed(3)}
              </td>
              <td className="px-4 py-2.5" />
            </tr>
          )}
          {report.macro_avg && <Row label="Macro avg" row={report.macro_avg} emphasis />}
          {report.weighted_avg && <Row label="Weighted avg" row={report.weighted_avg} emphasis />}
        </tbody>
      </table>
    </div>
  );
}