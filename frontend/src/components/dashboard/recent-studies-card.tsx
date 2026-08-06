import { ChevronRight, FolderOpen, ImageOff } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { RecentStudy } from "@/lib/api/types";

export interface RecentStudiesCardProps {
  studies: RecentStudy[];
}

const MAX_ROWS = 5;

function formatConfidence(confidence: number): string {
  return `${confidence.toFixed(2)}%`;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RecentStudiesCard({ studies }: RecentStudiesCardProps) {
  const rows = studies.slice(0, MAX_ROWS);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold tracking-tight">Recent Studies</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/studies">View All</Link>
        </Button>
      </CardHeader>

      <CardContent>
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <FolderOpen className="h-8 w-8 text-muted-foreground/50" aria-hidden />
            <p className="text-sm text-muted-foreground">No recent studies.</p>
          </div>
        ) : (
          <div>
            {rows.map((study, index) => (
              <Fragment key={study.prediction_id}>
                {index > 0 && <Separator />}
                <Link
                  href={`/studies/${study.prediction_id}`}
                  className="flex items-center gap-4 rounded-lg py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                    {study.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={study.thumbnail_url}
                        alt={study.predicted_label}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                        <ImageOff className="h-5 w-5" aria-hidden />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{study.predicted_label}</p>
                    <p className="numeric mt-0.5 font-mono text-xs text-muted-foreground tabular-nums">
                      {formatConfidence(study.confidence)}
                    </p>
                  </div>

                  <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                    {formatDate(study.created_at)}
                  </span>

                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </Fragment>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}