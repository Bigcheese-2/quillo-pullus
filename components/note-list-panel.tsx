"use client";

import { NoteList } from "@/components/notes/note-list";
import { SyncStatusBadge } from "@/components/sync";
import { Note, NoteView } from "@/lib/types/note";

interface NoteListPanelProps {
  notes: Note[];
  selectedNoteId?: string;
  onNoteSelect?: (noteId: string, e?: React.MouseEvent) => void;
  onNewNote?: () => void;
  searchQuery?: string;
  isMultiSelectMode?: boolean;
  multiSelectedIds?: Set<string>;
  onMultiSelectToggle?: (noteId: string, e?: React.MouseEvent) => void;
  onEnableSelectionMode?: () => void;
  view?: NoteView;
}

export function NoteListPanel({
  notes,
  selectedNoteId,
  onNoteSelect,
  onNewNote,
  searchQuery,
  isMultiSelectMode = false,
  multiSelectedIds = new Set(),
  onMultiSelectToggle,
  onEnableSelectionMode,
  view = 'all',
}: NoteListPanelProps) {
  return (
    <div className="md:hidden flex-1 flex flex-col h-full overflow-hidden data-[hidden=true]:hidden">
      
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-foreground">Notes</h2>
          <SyncStatusBadge showCounts={true} />
        </div>
        {!isMultiSelectMode && (
          <p className="text-xs hidden lg:block   text-muted-foreground mt-2">
            Tip: Press <kbd className="px-1.5 py-0.5 text-xs font-semibold text-foreground bg-muted border border-border rounded">⌘</kbd> + <kbd className="px-1.5 py-0.5 text-xs font-semibold text-foreground bg-muted border border-border rounded">A</kbd> or <kbd className="px-1.5 py-0.5 text-xs font-semibold text-foreground bg-muted border border-border rounded">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 text-xs font-semibold text-foreground bg-muted border border-border rounded">A</kbd> to select multiple notes
          </p>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <NoteList
          notes={notes}
          selectedNoteId={selectedNoteId}
          onNoteSelect={onNoteSelect}
          onNewNote={onNewNote}
          searchQuery={searchQuery}
          isMultiSelectMode={isMultiSelectMode}
          multiSelectedIds={multiSelectedIds}
          onMultiSelectToggle={onMultiSelectToggle}
          view={view}
        />
      </div>
    </div>
  );
}

