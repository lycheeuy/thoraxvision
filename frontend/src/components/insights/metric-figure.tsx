"use client";

/**
 * Reusable research figure — confusion matrix, ROC curve, training curves,
 * or any single evaluation image. Accepts a title, image URL, caption and
 * description; degrades gracefully when the image is null or fails to load.
 */
import { ImageOff } from "lucide-react";
import { useState } from "react";

export function MetricFigure({
  title,
  imageUrl,
  caption,
  description,
}: {
  title: string;
  imageUrl: string | null;
  caption?: string;
  description?: string;
}) {
  const [failed, setFailed] = useState(false);
  const missing = !imageUrl || failed;

  return (
    <figure className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
      <figcaption className="border-b border-border/60 px-5 py-3">
        <p className="text-sm font-semibold tracking-tight">{title}</p>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </figcaption>

      <div className="flex items-center justify-center bg-slate-950/[0.02] p-4">
        {missing ? (
          <div className="flex h-56 w-full flex-col items-center justify-center gap-2 text-muted-foreground/50">
            <ImageOff className="h-8 w-8" />
            <span className="text-xs">Figure not available</span>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={title}
            className="max-h-[420px] w-auto max-w-full object-contain"
            onError={() => setFailed(true)}
          />
        )}
      </div>

      {caption && !missing && (
        <p className="border-t border-border/60 px-5 py-2.5 text-xs text-muted-foreground">
          {caption}
        </p>
      )}
    </figure>
  );
}