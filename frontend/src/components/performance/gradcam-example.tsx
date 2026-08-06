import { ImageOff } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface GradcamExampleProps {
  imageUrl: string | null;
}

const EXPLANATION =
  "Grad-CAM highlights image regions that contribute most to the model's prediction. Warmer colors indicate areas with higher influence during inference.";

export function GradcamExample({ imageUrl }: GradcamExampleProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold tracking-tight">
          Grad-CAM Visualization
        </CardTitle>
      </CardHeader>
      <CardContent>
        {imageUrl ? (
          <div>
            <div className="flex items-center justify-center rounded-lg border border-border/70 bg-slate-950/[0.02] p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Grad-CAM visualization example"
                className="h-[360px] w-full rounded-lg object-contain"
              />
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{EXPLANATION}</p>
          </div>
        ) : (
          <div className="flex h-[360px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-muted-foreground/50">
            <ImageOff className="h-8 w-8" aria-hidden />
            <span className="text-sm">No Grad-CAM example available.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}