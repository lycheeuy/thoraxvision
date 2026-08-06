import { ImageOff } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface MetricFigureProps {
  title: string;
  imageUrl: string | null;
  caption?: string;
}

export function MetricFigure({ title, imageUrl, caption }: MetricFigureProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold tracking-tight">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {imageUrl ? (
          <div className="flex items-center justify-center rounded-lg border border-border/70 bg-slate-950/[0.02] p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={title}
              className="h-[320px] max-h-[380px] w-full rounded-md object-contain"
            />
          </div>
        ) : (
          <div className="flex h-[320px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-muted-foreground/50">
            <ImageOff className="h-8 w-8" aria-hidden />
            <span className="text-sm">No figure available.</span>
          </div>
        )}

        {caption && (
          <p className="mt-3 text-xs text-muted-foreground">{caption}</p>
        )}
      </CardContent>
    </Card>
  );
}