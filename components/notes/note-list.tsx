"use client";

import { Note } from "@/lib/types/note";
import { NoteCard } from "./note-card";
import { cn } from "@/lib/utils";
import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NoteListProps {
  notes: Note[];
  selectedNoteId?: string;
  onNoteSelect?: (noteId: string) => void;
  onNewNote?: () => void;
  className?: string;
}

export function NoteList({
  notes,
  selectedNoteId,
  onNoteSelect,
  onNewNote,
  className,
}: NoteListProps) {
  if (notes.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-full p-6", className)}>
        <div className="text-center space-y-6 max-w-sm">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
              <FileText className="w-10 h-10 text-muted-foreground" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              No notes yet
            </h3>
            <p className="text-sm text-muted-foreground">
              Get started by creating your first note. Capture your thoughts, ideas, and reminders all in one place.
            </p>
          </div>
          {onNewNote && (
            <Button
              onClick={onNewNote}
              className="bg-accent hover:bg-accent/90 text-white rounded-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Note
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          isSelected={selectedNoteId === note.id}
          onClick={() => onNoteSelect?.(note.id)}
        />
      ))}
    </div>
  );
}

