"use client";

import { NoteList } from "@/components/notes/note-list";
import { SyncStatusBadge } from "@/components/sync";
import { Note } from "@/lib/types/note";

interface NoteListPanelProps {
  notes: Note[];
  selectedNoteId?: string;
  onNoteSelect?: (noteId: string) => void;
  onNewNote?: () => void;
  searchQuery?: string;
}

export function NoteListPanel({
  notes,
  selectedNoteId,
  onNoteSelect,
  onNewNote,
  searchQuery,
}: NoteListPanelProps) {
  return (
    <div className="md:hidden flex-1 flex flex-col h-full overflow-hidden data-[hidden=true]:hidden">
      
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-foreground">Notes</h2>
          <SyncStatusBadge showCounts={true} />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <NoteList
          notes={notes}
          selectedNoteId={selectedNoteId}
          onNoteSelect={onNoteSelect}
          onNewNote={onNewNote}
          searchQuery={searchQuery}
        />
      </div>
    </div>
  );
}

