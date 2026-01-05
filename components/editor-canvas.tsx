"use client";

import { FileText, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { Note } from "@/lib/types/note";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";

interface EditorCanvasProps {
  selectedNote?: Note;
  onEdit?: (note: Note) => void;
  onDelete?: (note: Note) => void;
  onBack?: () => void;
}

interface EditorCanvasProps {
  selectedNote?: Note;
  onEdit?: (note: Note) => void;
  onDelete?: (note: Note) => void;
  onBack?: () => void;
  hasNotes?: boolean;
  onNewNote?: () => void;
}

export function EditorCanvas({
  selectedNote,
  onEdit,
  onDelete,
  onBack,
  hasNotes = true,
  onNewNote,
}: EditorCanvasProps) {
  if (!selectedNote) {
    return (
      <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
        {/* Empty State */}
        <div className="flex-1 flex items-center justify-center overflow-y-auto">
          <div className="text-center space-y-4 max-w-md px-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">
                {hasNotes ? "No note selected" : "No notes yet"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {hasNotes
                  ? "Select a note from the list to view or edit it, or create a new note to get started."
                  : "Get started by creating your first note. Capture your thoughts, ideas, and reminders all in one place."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const timeAgo = formatDistanceToNow(new Date(selectedNote.modified_at), {
    addSuffix: true,
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      {/* Header with Actions */}
      <div className="border-b border-border px-4 md:px-8 py-4">
        <div className="max-w-3xl mx-auto space-y-3">
          {/* Mobile: Back button */}
          {onBack && (
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="rounded-lg -ml-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Last updated {timeAgo}</p>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit?.(selectedNote)}
                className="rounded-lg flex-1 sm:flex-initial"
              >
                <Pencil className="w-4 h-4 sm:mr-2" />
                <span className="sm:inline">Edit</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete?.(selectedNote)}
                className="rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10 flex-1 sm:flex-initial"
              >
                <Trash2 className="w-4 h-4 sm:mr-2" />
                <span className="sm:inline">Delete</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Note Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-6 md:mb-8">
            {selectedNote.title || "Untitled"}
          </h1>

          <div className="text-foreground whitespace-pre-wrap leading-relaxed text-sm md:text-base">
            {selectedNote.content || (
              <span className="text-muted-foreground italic">No content</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

