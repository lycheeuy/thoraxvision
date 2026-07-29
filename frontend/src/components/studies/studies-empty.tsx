"use client";

/**
 * Empty state for the studies list. Two shades of empty:
 *  - no studies at all yet → invite the user to run an analysis
 *  - none match the active filters → invite them to clear filters
 */
import { FileScan, SearchX } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";

export function StudiesEmpty({
  filtered,
  onClear,
}: {
  filtered: boolean;
  onClear?: () => void;
}) {
  if (filtered) {
    return (
      <EmptyState
        icon={SearchX}
        title="No studies match your filters"
        description="Try widening the date range, lowering the minimum confidence, or clearing the search."
        action={
          onClear ? (
            <Button variant="outline" onClick={onClear}>
              Clear filters
            </Button>
          ) : undefined
        }
      />
    );
  }
  return (
    <EmptyState
      icon={FileScan}
      title="No studies yet"
      description="Your analysed chest X-rays will appear here. Run your first analysis to get started."
      action={
        <Button variant="ai" asChild>
          <Link href="/prediction">New analysis</Link>
        </Button>
      }
    />
  );
}