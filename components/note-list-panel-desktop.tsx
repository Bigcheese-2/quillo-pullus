"use client";

import { NoteList } from "@/components/notes/note-list";
import { SyncStatusBadge } from "@/components/sync";
import { Note, NoteView } from "@/lib/types/note";

interface NoteListPanelDesktopProps {
  notes: Note[];
  selectedNoteId?: string;
  onNoteSelect?: (noteId: string, e?: React.MouseEvent) => void;
  onNewNote?: () => void;
  searchQuery?: string;
  view?: NoteView;
  onArchive?: (note: Note) => void;
  onTrash?: (note: Note) => void;
  onRestore?: (note: Note) => void;
  isMultiSelectMode?: boolean;
  multiSelectedIds?: Set<string>;
  onMultiSelectToggle?: (noteId: string, e?: React.MouseEvent) => void;
  onEnableSelectionMode?: () => void;
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
  isMultiSelectMode = false,
  multiSelectedIds = new Set(),
  onMultiSelectToggle,
  onEnableSelectionMode,
}: NoteListPanelDesktopProps) {
  return (
    <div className="hidden md:flex w-80 bg-background flex-col h-full overflow-hidden border-r border-border">
      <div className="border-b border-border">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-bold text-foreground">Notes</h2>
            <SyncStatusBadge showCounts={true} />
          </div>
          {!isMultiSelectMode && (
            <p className="text-[11px] hidden lg:block text-muted-foreground mt-3">
              Tip: Press <kbd className="px-1.5 py-0.5 text-[11px] font-semibold text-foreground bg-muted border border-border rounded">⌘</kbd> + <kbd className="px-1.5 py-0.5 text-[11px] font-semibold text-foreground bg-muted border border-border rounded">A</kbd> or <kbd className="px-1.5 py-0.5 text-[11px] font-semibold text-foreground bg-muted border border-border rounded">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 text-[11px] font-semibold text-foreground bg-muted border border-border rounded">A</kbd> to select notes
            </p>
          )}
        </div>
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

