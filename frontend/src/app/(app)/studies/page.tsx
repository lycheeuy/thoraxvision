"use client";

/**
 * Studies — history management for previous AI analyses.
 *
 * Owns the query state (filters + page), fetches via studiesService with
 * React Query (keepPreviousData for smooth paging), and renders one of four
 * states: loading, error, empty, or the table. The toolbar and pagination
 * are controlled children; this page is the single source of truth.
 */
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { FolderClosed } from "lucide-react";
import { useState } from "react";

import { AnalysisSkeleton } from "@/components/common/loading";
import { ErrorState } from "@/components/common/error-state";
import { StudiesEmpty } from "@/components/studies/studies-empty";
import { StudiesPagination } from "@/components/studies/studies-pagination";
import { StudiesTable } from "@/components/studies/studies-table";
import { StudiesToolbar, type StudiesFilters } from "@/components/studies/studies-toolbar";
import { extractApiError } from "@/lib/api/client";
import type { StudiesQuery } from "@/lib/api/types";
import { studiesService } from "@/services/studies.service";

const PAGE_LIMIT = 20;

export default function StudiesPage() {
  const [filters, setFilters] = useState<StudiesFilters>({ sort: "newest" });
  const [page, setPage] = useState(1);

  const query: StudiesQuery = { ...filters, page, limit: PAGE_LIMIT };

  const { data, isPending, isError, error, isFetching, refetch } = useQuery({
    queryKey: ["studies", query],
    queryFn: () => studiesService.list(query),
    placeholderData: keepPreviousData,
  });

  // Changing filters resets to page 1; changing page keeps filters.
  function handleFilters(next: StudiesFilters) {
    setFilters(next);
    setPage(1);
  }

  const hasActiveFilters =
    Boolean(filters.search) ||
    Boolean(filters.label) ||
    Boolean(filters.date_from) ||
    Boolean(filters.date_to) ||
    filters.min_confidence != null;

  return (
    <div className="ambient-canvas min-h-full">
      <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border/60 pb-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-ai shadow-glow">
            <FolderClosed className="h-5 w-5 text-white" />
          </span>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Studies</h1>
            <p className="text-xs text-muted-foreground">
              Review, search and filter your previous AI analyses
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="mt-6">
          <StudiesToolbar value={filters} onChange={handleFilters} />
        </div>

        {/* Body */}
        <div className="mt-6 space-y-4">
          {isError ? (
            <ErrorState
              title="Couldn't load studies"
              message={extractApiError(error).message}
              detail={extractApiError(error).detail}
              onRetry={() => refetch()}
            />
          ) : isPending ? (
            <AnalysisSkeleton />
          ) : data.items.length === 0 ? (
            <StudiesEmpty
              filtered={hasActiveFilters}
              onClear={() => handleFilters({ sort: filters.sort })}
            />
          ) : (
            <div className={isFetching ? "opacity-60 transition-opacity" : "transition-opacity"}>
              <StudiesTable items={data.items} />
              <div className="mt-4">
                <StudiesPagination
                  page={data.page}
                  totalPages={data.total_pages}
                  total={data.total}
                  limit={data.limit}
                  onPageChange={setPage}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}