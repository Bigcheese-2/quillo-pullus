"use client";

import { Note } from "@/lib/types/note";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface NoteCardProps {
  note: Note;
  isSelected?: boolean;
  onClick?: () => void;
}

export function NoteCard({ note, isSelected = false, onClick }: NoteCardProps) {
  // Truncate content to create a snippet (first ~100 chars)
  const snippet = note.content.length > 100
    ? note.content.substring(0, 100) + "..."
    : note.content;

  // Format timestamp as relative time
  const timeAgo = formatDistanceToNow(new Date(note.modified_at), {
    addSuffix: true,
  });

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-3 md:p-4 rounded-lg transition-colors active:bg-muted/70",
        "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "touch-manipulation", // Better touch handling on mobile
        isSelected && "bg-muted"
      )}
    >
      <div className="space-y-2">
        {/* Title */}
        <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2">
          {note.title || "Untitled"}
        </h3>

        {/* Snippet */}
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {snippet || "No content"}
        </p>

        {/* Timestamp */}
        <p className="text-xs text-muted-foreground">{timeAgo}</p>
      </div>
    </button>
  );
}

