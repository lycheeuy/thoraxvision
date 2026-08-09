/**
 * Generous, consistent content well. Wide max-width plus large vertical
 * rhythm — the layout should breathe rather than fill.
 */
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PageContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="ambient-canvas min-h-full">
      <div className={cn("mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10", className)}>{children}</div>
    </div>
  );
}