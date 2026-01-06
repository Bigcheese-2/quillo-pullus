"use client";

import { NoteList } from "@/components/notes/note-list";
import { SyncStatusBadge } from "@/components/sync";
import { Note, NoteView } from "@/lib/types/note";

interface NoteListPanelDesktopProps {
  notes: Note[];
  selectedNoteId?: string;
  onNoteSelect?: (noteId: string) => void;
  onNewNote?: () => void;
  searchQuery?: string;
  view?: NoteView;
  onArchive?: (note: Note) => void;
  onTrash?: (note: Note) => void;
  onRestore?: (note: Note) => void;
}

export function NoteListPanelDesktop({
  notes,
  selectedNoteId,
  onNoteSelect,
  onNewNote,
  searchQuery,
  view,
  onArchive,
  onTrash,
  onRestore,
}: NoteListPanelDesktopProps) {
  return (
    <div className="hidden md:flex w-80 bg-background flex-col h-full overflow-hidden border-r border-border">
      {/* Header */}
      <div className="border-b border-border">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-bold text-foreground">Notes</h2>
            <SyncStatusBadge showCounts={true} />
          </div>
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

