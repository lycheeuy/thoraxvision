import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface ClassificationRow {
  label: string;
  precision: number;
  recall: number;
  f1_score: number;
  support: number;
}

export interface ClassificationReportTableProps {
  rows: ClassificationRow[];
}

function toPercent(value: number): string {
  // Report values arrive in 0–1; anything already >1 is treated as a percent.
  const pct = value <= 1 ? value * 100 : value;
  return `${pct.toFixed(2)}%`;
}

export function ClassificationReportTable({ rows }: ClassificationReportTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold tracking-tight">
          Classification Report
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <div className="flex items-center justify-center py-10 text-center">
            <p className="text-sm text-muted-foreground">No classification data available.</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <Table className="w-full border-collapse">
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/40">
                  <TableHead className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Class
                  </TableHead>
                  {["Precision", "Recall", "F1-Score", "Support"].map((head) => (
                    <TableHead
                      key={head}
                      className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
                    >
                      {head}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.label} className="border-b border-border/50 last:border-0">
                    <TableCell className="px-4 py-2.5 text-sm font-medium">{row.label}</TableCell>
                    <TableCell className="numeric px-4 py-2.5 text-right font-mono text-sm tabular-nums">
                      {toPercent(row.precision)}
                    </TableCell>
                    <TableCell className="numeric px-4 py-2.5 text-right font-mono text-sm tabular-nums">
                      {toPercent(row.recall)}
                    </TableCell>
                    <TableCell className="numeric px-4 py-2.5 text-right font-mono text-sm tabular-nums">
                      {toPercent(row.f1_score)}
                    </TableCell>
                    <TableCell className="numeric px-4 py-2.5 text-right font-mono text-sm text-muted-foreground tabular-nums">
                      {row.support}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}