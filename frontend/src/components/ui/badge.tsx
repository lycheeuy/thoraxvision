import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/10 text-primary",
        ai: "border-ai/20 bg-ai/10 text-ai",
        neutral: "border-border bg-muted/60 text-muted-foreground",
        outline: "border-border text-foreground",
        /* Diagnostic outcomes. Rose = finding present; blue = no finding.
           Green is intentionally absent from the whole system. */
        finding: "border-destructive/25 bg-destructive/10 text-destructive",
        clear: "border-primary/25 bg-primary/10 text-primary",
        warning: "border-warning/30 bg-warning/10 text-warning",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };