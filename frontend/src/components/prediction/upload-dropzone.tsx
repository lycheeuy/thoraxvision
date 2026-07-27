"use client";

/**
 * X-ray intake surface.
 *
 * Native drag & drop (no extra dependency). Client-side rules mirror the
 * backend contract exactly — jpg/jpeg/png, 10 MB — so an obvious rejection
 * never costs a round trip, while the server stays the real authority.
 */
import { FileImage, ImageUp, X } from "lucide-react";
import { useCallback, useRef, useState, type DragEvent } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ACCEPTED = ["image/jpeg", "image/jpg", "image/png"];
const MAX_BYTES = 10 * 1024 * 1024;

export interface SelectedImage {
  file: File;
  previewUrl: string;
}

export function UploadDropzone({
  value,
  onSelect,
  onClear,
  disabled = false,
}: {
  value: SelectedImage | null;
  onSelect: (image: SelectedImage) => void;
  onClear: () => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const accept = useCallback(
    (file: File) => {
      setLocalError(null);

      if (!ACCEPTED.includes(file.type.toLowerCase())) {
        setLocalError("Unsupported format. Use JPG, JPEG or PNG.");
        return;
      }
      if (file.size > MAX_BYTES) {
        setLocalError(`File is ${(file.size / 1_048_576).toFixed(1)} MB — the limit is 10 MB.`);
        return;
      }
      onSelect({ file, previewUrl: URL.createObjectURL(file) });
    },
    [onSelect],
  );

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) accept(file);
  }

  // ---- Selected: show the study with its metadata ------------------------
  if (value) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
        <div className="relative aspect-square w-full bg-slate-950">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value.previewUrl}
            alt="Selected chest X-ray"
            className="h-full w-full object-contain"
          />
          {!disabled && (
            <Button
              variant="outline"
              size="icon-sm"
              onClick={onClear}
              aria-label="Remove image"
              className="absolute right-3 top-3 border-white/20 bg-black/50 text-white backdrop-blur hover:bg-black/70"
            >
              <X />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-border/60 px-4 py-3">
          <FileImage className="h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{value.file.name}</p>
            <p className="numeric font-mono text-[11px] text-muted-foreground">
              {(value.file.size / 1024).toFixed(0)} KB
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ---- Empty: the intake target -----------------------------------------
  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        aria-disabled={disabled}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !disabled) inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "grid-field group relative flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-300",
          dragging
            ? "border-primary bg-accent/60 shadow-glow"
            : "border-border bg-card/50 hover:border-primary/40 hover:bg-accent/30",
          disabled && "pointer-events-none opacity-60",
        )}
      >
        <div className="relative mb-4">
          <span
            className={cn(
              "absolute inset-0 -m-2 rounded-2xl bg-gradient-to-br from-primary/20 to-ai/20 blur-lg transition-opacity",
              dragging ? "opacity-100" : "opacity-0 group-hover:opacity-100",
            )}
          />
          <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-border/70 bg-card shadow-soft">
            <ImageUp
              className={cn(
                "h-6 w-6 transition-colors",
                dragging ? "text-primary" : "text-muted-foreground group-hover:text-primary",
              )}
            />
          </span>
        </div>

        <p className="text-sm font-semibold tracking-tight">
          {dragging ? "Release to load the study" : "Drop a chest X-ray here"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          or <span className="font-medium text-primary">browse your files</span>
        </p>
        <p className="mt-5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
          JPG · PNG · max 10 MB
        </p>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) accept(file);
            e.target.value = ""; // allow re-selecting the same file
          }}
        />
      </div>

      {localError && (
        <p className="rounded-xl border border-destructive/20 bg-destructive/[0.06] px-3.5 py-2.5 text-xs text-destructive">
          {localError}
        </p>
      )}
    </div>
  );
}