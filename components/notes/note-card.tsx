"use client";

import { Note } from "@/lib/types/note";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Clock, Check } from "lucide-react";

interface NoteCardProps {
  note: Note;
  isSelected?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  searchQuery?: string;
  index?: number;
  isPending?: boolean;
  isMultiSelectMode?: boolean;
  isMultiSelected?: boolean;
  onMultiSelectToggle?: (e: React.MouseEvent) => void;
}

export function NoteCard({ 
  note, 
  isSelected = false, 
  onClick, 
  searchQuery, 
  index = 0, 
  isPending = false,
  isMultiSelectMode = false,
  isMultiSelected = false,
  onMultiSelectToggle,
}: NoteCardProps) {
  const snippet = note.content.length > 100
    ? note.content.substring(0, 100) + "..."
    : note.content;

  const timeAgo = formatDistanceToNow(new Date(note.modified_at), {
    addSuffix: true,
  });

  const handleClick = (e: React.MouseEvent) => {
    if (isMultiSelectMode && onMultiSelectToggle) {
      onMultiSelectToggle(e);
    } else if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full text-left px-3 py-2.5 sm:p-3 md:p-4 rounded-lg transition-all duration-200",
        "active:bg-muted/70 hover:bg-muted/50 hover:scale-[1.01] active:scale-[0.99]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "touch-manipulation animate-in fade-in slide-in-from-bottom-2 relative border-b border-muted",
        isSelected && !isMultiSelectMode && "bg-muted ring-2 ring-accent/50",
        isMultiSelectMode && isMultiSelected && "bg-muted/70"
      )}
      style={{
        animationDelay: `${index * 30}ms`,
      }}
    >
      <div className="flex items-start gap-3">
        {isMultiSelectMode && (
          <div
            className={cn(
              "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors",
              isMultiSelected
                ? "border-accent bg-accent"
                : "border-muted-foreground/30 bg-background"
            )}
            onClick={(e) => {
              e.stopPropagation();
              onMultiSelectToggle?.(e);
            }}
          >
            {isMultiSelected && (
              <Check className="h-3 w-3 text-white" />
            )}
          </div>
        )}
        <div className="flex-1 space-y-2 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2 flex-1">
            {note.title || "Untitled"}
          </h3>
          {isPending && (
            <div className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-700 rounded px-1.5 py-0.5 shrink-0">
              <Clock className="h-3 w-3" />
              <span className="text-[10px] font-medium">Pending</span>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {snippet || "No content"}
        </p>

        <p className="text-xs text-muted-foreground">{timeAgo}</p>
        </div>
      </div>
    </button>
  );
}

