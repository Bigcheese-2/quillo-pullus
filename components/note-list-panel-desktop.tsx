"use client";

import { NoteList } from "@/components/notes/note-list";
import { Note } from "@/lib/types/note";

interface NoteListPanelDesktopProps {
  notes: Note[];
  selectedNoteId?: string;
  onNoteSelect?: (noteId: string) => void;
  onNewNote?: () => void;
}

export function NoteListPanelDesktop({
  notes,
  selectedNoteId,
  onNoteSelect,
  onNewNote,
}: NoteListPanelDesktopProps) {
  return (
    <div className="hidden md:flex w-80 border-r border-border bg-background flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <h2 className="text-2xl font-bold text-foreground">Notes</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        <NoteList
          notes={notes}
          selectedNoteId={selectedNoteId}
          onNoteSelect={onNoteSelect}
          onNewNote={onNewNote}
        />
      </div>
    </div>
  );
}

