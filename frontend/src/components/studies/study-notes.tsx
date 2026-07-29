"use client";

/**
 * Notes — read-only. The predictions table has a notes column but no write
 * endpoint yet, so this only displays. When empty, it says so explicitly
 * rather than rendering a blank card.
 */
import { StickyNote } from "lucide-react";

export function StudyNotes({ notes }: { notes: string | null }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-tight">
        <StickyNote className="h-4 w-4 text-primary" />
        Notes
      </h3>
      {notes ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{notes}</p>
      ) : (
        <p className="text-sm italic text-muted-foreground">No notes available.</p>
      )}
    </div>
  );
}