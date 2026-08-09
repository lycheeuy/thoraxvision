"use client";

/**
 * Generic JSON renderer — used by the GWO panel and Research Summary so
 * neither assumes a fixed schema. Renders whatever shape the file has:
 *
 *   - object   → labelled rows, recursing into each value
 *   - array of scalars → inline chips; long numeric arrays are summarised
 *     (count + min/max) instead of dumping hundreds of values
 *   - array of objects → each item recursed, indented
 *   - scalar   → formatted value
 *
 * Keys are humanised (snake_case / camelCase → Title Case) for display only.
 */
import { useState } from "react";

import { cn } from "@/lib/utils";

function humanize(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function isScalar(v: unknown): v is string | number | boolean | null {
  return v === null || ["string", "number", "boolean"].includes(typeof v);
}

function formatScalar(v: string | number | boolean | null): string {
  if (v === null) return "—";
  if (typeof v === "number") {
    // Keep integers clean; trim long floats to 4 dp.
    return Number.isInteger(v) ? String(v) : String(Math.round(v * 10000) / 10000);
  }
  return String(v);
}

function NumericArraySummary({ values }: { values: number[] }) {
  const [expanded, setExpanded] = useState(false);
  const min = Math.min(...values);
  const max = Math.max(...values);

  if (values.length <= 12 || expanded) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {values.map((n, i) => (
          <span
            key={i}
            className="numeric rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
          >
            {formatScalar(n)}
          </span>
        ))}
        {expanded && values.length > 12 && (
          <button
            onClick={() => setExpanded(false)}
            className="text-[11px] font-medium text-primary hover:underline"
          >
            Show less
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <span className="numeric font-mono">{values.length} values</span>
      <span className="text-muted-foreground/50">·</span>
      <span className="numeric font-mono">min {formatScalar(min)}</span>
      <span className="numeric font-mono">max {formatScalar(max)}</span>
      <button
        onClick={() => setExpanded(true)}
        className="text-[11px] font-medium text-primary hover:underline"
      >
        Show all
      </button>
    </div>
  );
}

function ValueView({ value }: { value: unknown }) {
  if (isScalar(value)) {
    return <span className="numeric break-words font-mono text-sm text-foreground">{formatScalar(value)}</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-sm text-muted-foreground">—</span>;
    }
    if (value.every((v) => typeof v === "number")) {
      return <NumericArraySummary values={value as number[]} />;
    }
    if (value.every(isScalar)) {
      return (
        <div className="flex flex-wrap gap-1.5">
          {value.map((v, i) => (
            <span
              key={i}
              className="break-words rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
            >
              {formatScalar(v as string | number | boolean | null)}
            </span>
          ))}
        </div>
      );
    }
    return (
      <div className="space-y-2">
        {value.map((item, i) => (
          <div key={i} className="rounded-lg border border-border/60 p-2.5">
            <JsonView data={item} />
          </div>
        ))}
      </div>
    );
  }

  // object
  return <JsonView data={value} />;
}

export function JsonView({ data }: { data: unknown }) {
  if (isScalar(data)) {
    return <ValueView value={data} />;
  }
  if (Array.isArray(data)) {
    return <ValueView value={data} />;
  }

  const entries = Object.entries(data as Record<string, unknown>);
  if (entries.length === 0) {
    return <p className="text-sm italic text-muted-foreground">No data.</p>;
  }

  return (
    <dl className="space-y-2.5">
      {entries.map(([key, value]) => {
        const nested = !isScalar(value);
        return (
          <div
            key={key}
            className={cn(
              nested
                ? "space-y-1.5"
                : "flex items-baseline justify-between gap-4 border-b border-border/40 pb-2 last:border-0",
            )}
          >
            <dt className="shrink-0 text-xs font-medium text-muted-foreground">{humanize(key)}</dt>
            <dd className={cn("min-w-0", nested ? "" : "text-right")}>
              <ValueView value={value} />
            </dd>
          </div>
        );
      })}
    </dl>
  );
}