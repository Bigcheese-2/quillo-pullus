"use client";

import { Note, NoteView } from "@/lib/types/note";
import { NoteCard } from "./note-card";
import { NoteSkeletons } from "./note-skeleton";
import { usePendingNotes } from "@/hooks/use-pending-notes";
import { cn } from "@/lib/utils";
import { FileText, Plus, Archive, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NoteListProps {
  notes: Note[];
  selectedNoteId?: string;
  onNoteSelect?: (noteId: string, e?: React.MouseEvent) => void;
  onNewNote?: () => void;
  className?: string;
  isLoading?: boolean;
  searchQuery?: string;
  isMultiSelectMode?: boolean;
  multiSelectedIds?: Set<string>;
  onMultiSelectToggle?: (noteId: string, e?: React.MouseEvent) => void;
  view?: NoteView;
}

export function NoteList({
  notes,
  selectedNoteId,
  onNoteSelect,
  onNewNote,
  className,
  isLoading = false,
  searchQuery,
  isMultiSelectMode = false,
  multiSelectedIds = new Set(),
  onMultiSelectToggle,
  view = 'all',
}: NoteListProps) {
  const pendingNoteIds = usePendingNotes();

  if (isLoading) {
    return (
      <div className={cn("space-y-1", className)}>
        <NoteSkeletons count={5} />
      </div>
    );
  }

  if (notes.length === 0) {
    const getEmptyStateContent = () => {
      if (searchQuery) {
        return {
          icon: FileText,
          title: 'No notes found',
          message: `No notes match "${searchQuery}". Try a different search term.`,
          showButton: false,
        };
      }

      switch (view) {
        case 'trash':
          return {
            icon: Trash2,
            title: 'Trash is empty',
            message: 'Notes you delete will appear here. You can restore them or delete them permanently.',
            showButton: false,
          };
        case 'archived':
          return {
            icon: Archive,
            title: 'No archived notes',
            message: 'Notes you archive will appear here. Archived notes are hidden from your main notes list.',
            showButton: false,
          };
        default:
          return {
            icon: FileText,
            title: 'No notes yet',
            message: 'Get started by creating your first note. Capture your thoughts, ideas, and reminders all in one place.',
            showButton: true,
          };
      }
    };

    const emptyState = getEmptyStateContent();
    const EmptyIcon = emptyState.icon;

    return (
      <div className={cn("flex items-center justify-center h-full p-6", className)}>
        <div className="text-center space-y-6 max-w-sm">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
              <EmptyIcon className="w-10 h-10 text-muted-foreground" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              {emptyState.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {emptyState.message}
            </p>
          </div>
          {emptyState.showButton && onNewNote && (
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
      {notes.map((note, index) => (
        <NoteCard
          key={note.id}
          note={note}
          isSelected={selectedNoteId === note.id}
          onClick={(e) => onNoteSelect?.(note.id, e)}
          index={index}
          isPending={pendingNoteIds.has(note.id)}
          isMultiSelectMode={isMultiSelectMode}
          isMultiSelected={multiSelectedIds.has(note.id)}
          onMultiSelectToggle={(e) => onMultiSelectToggle?.(note.id, e)}
        />
      ))}
    </div>
  );
}

