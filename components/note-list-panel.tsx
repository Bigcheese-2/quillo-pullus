"use client";

import { NoteList } from "@/components/notes/note-list";
import { Note } from "@/lib/types/note";

interface NoteListPanelProps {
  notes: Note[];
  selectedNoteId?: string;
  onNoteSelect?: (noteId: string) => void;
  onNewNote?: () => void;
}

export function NoteListPanel({
  notes,
  selectedNoteId,
  onNoteSelect,
  onNewNote,
}: NoteListPanelProps) {
  return (
    <div className="md:hidden flex-1 flex flex-col h-full overflow-hidden data-[hidden=true]:hidden">
      {/* Mobile: Show note list */}
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-xl font-bold text-foreground">Notes</h2>
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

