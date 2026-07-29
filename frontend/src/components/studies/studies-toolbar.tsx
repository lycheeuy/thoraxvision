"use client";

/**
 * Studies toolbar — search (debounced), label filter, date range,
 * minimum confidence, and sort. Controlled by the page.
 */
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { SortOption, StudiesQuery } from "@/lib/api/types";

const SORTS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "highest_confidence", label: "Highest confidence" },
  { value: "lowest_confidence", label: "Lowest confidence" },
];

const LABELS = [
  { value: "", label: "All results" },
  { value: "Tuberculosis", label: "Finding (TB)" },
  { value: "Non Tuberculosis", label: "Clear (Non-TB)" },
];

export type StudiesFilters = Pick<
  StudiesQuery,
  "search" | "label" | "date_from" | "date_to" | "min_confidence" | "sort"
>;

export function StudiesToolbar({
  value,
  onChange,
}: {
  value: StudiesFilters;
  onChange: (next: StudiesFilters) => void;
}) {
  const [search, setSearch] = useState(value.search ?? "");
  const [showFilters, setShowFilters] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if ((value.search ?? "") !== search) {
        onChange({ ...value, search: search || undefined });
      }
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const activeFilterCount =
    (value.label ? 1 : 0) +
    (value.date_from ? 1 : 0) +
    (value.date_to ? 1 : 0) +
    (value.min_confidence != null ? 1 : 0);

  function patch(p: Partial<StudiesFilters>) {
    onChange({ ...value, ...p });
  }

  function clearFilters() {
    setSearch("");
    onChange({ sort: value.sort });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search label or notes…"
            className="h-10 w-full rounded-xl border border-border/70 bg-card pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary/50"
          />
        </div>

        <select
          value={value.sort ?? "newest"}
          onChange={(e) => patch({ sort: e.target.value as SortOption })}
          className="h-10 rounded-xl border border-border/70 bg-card px-3 text-sm outline-none transition-colors focus:border-primary/50"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <Button
          variant={showFilters ? "secondary" : "outline"}
          onClick={() => setShowFilters((s) => !s)}
        >
          <SlidersHorizontal />
          Filters
          {activeFilterCount > 0 && (
            <span className="numeric ml-1 rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {showFilters && (
        <div className="grid gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-soft sm:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Result</span>
            <select
              value={value.label ?? ""}
              onChange={(e) => patch({ label: e.target.value || undefined })}
              className="h-9 w-full rounded-lg border border-border/70 bg-background px-2.5 text-sm outline-none focus:border-primary/50"
            >
              {LABELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">From</span>
            <input
              type="date"
              value={value.date_from?.slice(0, 10) ?? ""}
              onChange={(e) =>
                patch({ date_from: e.target.value ? `${e.target.value}T00:00:00` : undefined })
              }
              className="h-9 w-full rounded-lg border border-border/70 bg-background px-2.5 text-sm outline-none focus:border-primary/50"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">To</span>
            <input
              type="date"
              value={value.date_to?.slice(0, 10) ?? ""}
              onChange={(e) =>
                patch({ date_to: e.target.value ? `${e.target.value}T23:59:59` : undefined })
              }
              className="h-9 w-full rounded-lg border border-border/70 bg-background px-2.5 text-sm outline-none focus:border-primary/50"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Min. confidence{value.min_confidence != null ? ` — ${value.min_confidence}%` : ""}
            </span>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={value.min_confidence ?? 0}
              onChange={(e) =>
                patch({
                  min_confidence: Number(e.target.value) === 0 ? undefined : Number(e.target.value),
                })
              }
              className="h-9 w-full accent-[hsl(var(--primary))]"
            />
          </label>

          {activeFilterCount > 0 && (
            <div className="sm:col-span-2 lg:col-span-4">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X /> Clear filters
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}