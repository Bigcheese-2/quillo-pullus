"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { NoteListPanel } from "@/components/note-list-panel";
import { NoteListPanelDesktop } from "@/components/note-list-panel-desktop";
import { EditorCanvas } from "@/components/editor-canvas";
import { NoteDialog } from "@/components/notes/note-dialog";
import { DeleteConfirmDialog } from "@/components/notes/delete-confirm-dialog";
import { OfflineIndicator } from "@/components/sync/offline-indicator";
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote } from "@/hooks/use-notes";
import { useNotesView } from "@/hooks/use-notes-view";
import { useNoteCounts } from "@/hooks/use-note-counts";
import { useNoteSearch } from "@/hooks/use-note-search";
import { useArchiveNote, useUnarchiveNote, useTrashNote, useRestoreNote, useDeleteNotePermanently, useBulkArchiveNotes, useBulkTrashNotes, useBulkRestoreNotes, useBulkDeleteNotesPermanently } from "@/hooks/use-note-actions";
import { useMultiSelect } from "@/hooks/use-multi-select";
import { SelectionToolbar } from "@/components/notes/selection-toolbar";
import { Note, NoteView } from "@/lib/types/note";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getUserId } from "@/lib/config/env";

export default function Home() {
  const [currentView, setCurrentView] = useState<NoteView>('all');

  const { data: notes = [], isLoading, error, refetch } = useNotesView(currentView);
  const noteCounts = useNoteCounts();
  const createNoteMutation = useCreateNote();
  const updateNoteMutation = useUpdateNote();
  const deleteNoteMutation = useDeleteNote();
  const archiveNoteMutation = useArchiveNote();
  const unarchiveNoteMutation = useUnarchiveNote();
  const trashNoteMutation = useTrashNote();
  const restoreNoteMutation = useRestoreNote();
  const deletePermanentlyMutation = useDeleteNotePermanently();
  
  // Bulk operations
  const bulkArchiveMutation = useBulkArchiveNotes();
  const bulkTrashMutation = useBulkTrashNotes();
  const bulkRestoreMutation = useBulkRestoreNotes();
  const bulkDeletePermanentlyMutation = useBulkDeleteNotesPermanently();
  
  // Multi-selection
  const multiSelect = useMultiSelect<string>();
  const { clearSelection } = multiSelect;
  
  const handleEnableSelectionMode = () => {
    multiSelect.enableSelectionMode();
    if (selectedNoteId) {
      setSelectedNoteId(undefined);
    }
  };

  const { searchQuery, setSearchQuery, filteredNotes } = useNoteSearch(notes);

  const [selectedNoteId, setSelectedNoteId] = useState<string | undefined>(undefined);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | undefined>(undefined);
  const [deletingNote, setDeletingNote] = useState<Note | undefined>(undefined);

  const selectedNote = filteredNotes.find((note) => note.id === selectedNoteId);

  useEffect(() => {
    if (filteredNotes.length === 0 && selectedNoteId) {
      setSelectedNoteId(undefined);
    }
  }, [filteredNotes.length, selectedNoteId]);

  useEffect(() => {
    setSelectedNoteId(undefined);
    clearSelection();
  }, [currentView, clearSelection]);
  
  // Keyboard shortcuts for multi-selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + A to select all
      if ((e.metaKey || e.ctrlKey) && e.key === 'a' && !multiSelect.isSelectionMode) {
        e.preventDefault();
        handleEnableSelectionMode();
        multiSelect.selectAll(filteredNotes.map(n => n.id));
      }
      // Escape to clear selection
      if (e.key === 'Escape' && multiSelect.hasSelection) {
        multiSelect.clearSelection();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredNotes, multiSelect]);

  const handleCreateNote = () => {
    if (currentView !== 'all') {
      setCurrentView('all');
    }
    setEditingNote(undefined);
    setNoteDialogOpen(true);
    setSidebarOpen(false);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setNoteDialogOpen(true);
  };

  const handleDeleteNote = (note: Note) => {
    if (currentView === 'trash') {
      setDeletingNote(note);
      setDeleteDialogOpen(true);
    } else {
      trashNoteMutation.mutate(note.id);
      if (selectedNoteId === note.id) {
        setSelectedNoteId(undefined);
      }
    }
  };

  const handleArchiveNote = (note: Note) => {
    if (note.archived) {
      unarchiveNoteMutation.mutate(note.id);
    } else {
      archiveNoteMutation.mutate(note.id);
    }
    if (selectedNoteId === note.id) {
      setSelectedNoteId(undefined);
    }
  };

  const handleRestoreNote = (note: Note) => {
    restoreNoteMutation.mutate(note.id);
    if (selectedNoteId === note.id) {
      setSelectedNoteId(undefined);
    }
  };

  const handleNoteSubmit = async (data: { title: string; content: string }) => {
    const userId = getUserId();

    if (editingNote) {
      try {
        await updateNoteMutation.mutateAsync({
          id: editingNote.id,
          updates: {
            title: data.title,
            content: data.content,
          },
        });
        setNoteDialogOpen(false);
        setEditingNote(undefined);
        toast.success("Note updated successfully", {
          description: "Your changes have been saved locally and will sync when online.",
        });
      } catch (error) {
        toast.error("Failed to update note", {
          description: error instanceof Error ? error.message : "An unknown error occurred",
        });
      }
    } else {
      try {
        const newNote = await createNoteMutation.mutateAsync({
          user_id: userId,
          title: data.title,
          content: data.content,
        });
        setNoteDialogOpen(false);
        setSelectedNoteId(newNote.id);
        toast.success("Note created successfully", {
          description: "Your new note has been saved locally and will sync when online.",
        });
      } catch (error) {
        toast.error("Failed to create note", {
          description: error instanceof Error ? error.message : "An unknown error occurred",
        });
      }
    }
  };

  const handleDeleteConfirm = async () => {
    if (deletingNote) {
      try {
        await deletePermanentlyMutation.mutateAsync(deletingNote.id);
        setDeleteDialogOpen(false);
        if (selectedNoteId === deletingNote.id) {
          setSelectedNoteId(undefined);
        }
        setDeletingNote(undefined);
      } catch (error) {
      }
    }
  };

  const handleNoteSelect = (noteId: string, e?: React.MouseEvent) => {
    if (multiSelect.isSelectionMode) {
      const noteIndex = filteredNotes.findIndex(n => n.id === noteId);
      if (e?.shiftKey && multiSelect.lastSelectedIndex !== null && noteIndex !== -1) {
        // Range selection with Shift+Click
        const noteIds = filteredNotes.map(n => n.id);
        multiSelect.selectRange(noteIds, multiSelect.lastSelectedIndex, noteIndex);
        multiSelect.setLastSelectedIndex(noteIndex);
      } else {
        // Single selection
        multiSelect.toggleSelection(noteId);
        if (noteIndex !== -1) {
          multiSelect.setLastSelectedIndex(noteIndex);
        }
      }
    } else {
    setSelectedNoteId(noteId);
    setSidebarOpen(false);
    }
  };
  
  const handleBulkArchive = async () => {
    const ids = Array.from(multiSelect.selectedIds);
    try {
      await bulkArchiveMutation.mutateAsync(ids);
      multiSelect.clearSelection();
      if (selectedNoteId && ids.includes(selectedNoteId)) {
        setSelectedNoteId(undefined);
      }
    } catch (error) {
      // Error is handled by the mutation
    }
  };
  
  const handleBulkTrash = async () => {
    const ids = Array.from(multiSelect.selectedIds);
    try {
      await bulkTrashMutation.mutateAsync(ids);
      multiSelect.clearSelection();
      if (selectedNoteId && ids.includes(selectedNoteId)) {
        setSelectedNoteId(undefined);
      }
    } catch (error) {
      // Error is handled by the mutation
    }
  };
  
  const handleBulkRestore = async () => {
    const ids = Array.from(multiSelect.selectedIds);
    try {
      await bulkRestoreMutation.mutateAsync(ids);
      multiSelect.clearSelection();
      if (selectedNoteId && ids.includes(selectedNoteId)) {
        setSelectedNoteId(undefined);
      }
    } catch (error) {
    }
  };
  
  const handleBulkDeletePermanently = async () => {
    const ids = Array.from(multiSelect.selectedIds);
    try {
      await bulkDeletePermanentlyMutation.mutateAsync(ids);
      multiSelect.clearSelection();
      if (selectedNoteId && ids.includes(selectedNoteId)) {
        setSelectedNoteId(undefined);
      }
    } catch (error) {
    }
  };

  if (isLoading && notes.length === 0 && !error) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <p className="text-accent text-3xl tracking-wider md:text-4xl lg:text-5xl">Quillo.</p>
        </div>
      </div>
    );
  }

  if (error && notes.length === 0) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    const isNetworkError = errorMessage.includes("Network error") || errorMessage.includes("Unable to connect");

    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md px-6">
          <p className="text-destructive font-semibold text-lg">Error loading notes</p>
          <p className="text-sm text-muted-foreground">
            {errorMessage}
          </p>
          {isNetworkError && (
            <p className="text-xs text-muted-foreground mt-2">
              Don&apos;t worry - your notes are saved locally. They will sync when you&apos;re back online.
            </p>
          )}
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (

    <div className="flex flex-col bg-muted lg:p-4 lg:gap-4 xl:gap-5 xl:p-5 h-screen 2xl:max-w-[1440px] 2xl:mx-auto">
      <OfflineIndicator position="top" />

      <div className="flex flex-1 overflow-hidden gap-4 xl:gap-5">
      <AppSidebar
        onNewNote={handleCreateNote}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentView={currentView}
        onViewChange={setCurrentView}
        counts={noteCounts}
      />

      <div
        className={cn(
          "flex-1 flex flex-col overflow-hidden lg:rounded-xl  bg-background transition-transform duration-250 ease-out will-change-transform",
          "lg:ml-0 lg:translate-x-0",
          sidebarOpen ? "translate-x-64" : "translate-x-0"
        )}
      >
        <div className="border-b border-border">
          <div className="px-3 sm:px-4 py-4">
            <AppHeader
              onMenuClick={() => setSidebarOpen((prev) => !prev)}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onEnableSelectionMode={handleEnableSelectionMode}
              isSelectionMode={multiSelect.isSelectionMode}
            />
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden rounded-xl flex-col">
          <div className="flex-1 flex overflow-hidden">
          {!selectedNoteId ? (
            <NoteListPanel
              notes={filteredNotes}
              selectedNoteId={selectedNoteId}
              onNoteSelect={handleNoteSelect}
              onNewNote={handleCreateNote}
              searchQuery={searchQuery}
                isMultiSelectMode={multiSelect.isSelectionMode}
                multiSelectedIds={multiSelect.selectedIds}
                onMultiSelectToggle={(noteId, e) => handleNoteSelect(noteId, e)}
                onEnableSelectionMode={multiSelect.enableSelectionMode}
            />
          ) : (
            <div className="md:hidden flex-1">
              <EditorCanvas
                selectedNote={selectedNote}
                onEdit={handleEditNote}
                onDelete={handleDeleteNote}
                onArchive={handleArchiveNote}
                onRestore={handleRestoreNote}
                onBack={() => setSelectedNoteId(undefined)}
                hasNotes={filteredNotes.length > 0}
                onNewNote={handleCreateNote}
                view={currentView}
              />
            </div>
          )}

          <NoteListPanelDesktop
            notes={filteredNotes}
            selectedNoteId={selectedNoteId}
            onNoteSelect={handleNoteSelect}
            onNewNote={handleCreateNote}
            searchQuery={searchQuery}
            view={currentView}
            onArchive={handleArchiveNote}
            onTrash={handleDeleteNote}
            onRestore={handleRestoreNote}
              isMultiSelectMode={multiSelect.isSelectionMode}
              multiSelectedIds={multiSelect.selectedIds}
              onMultiSelectToggle={(noteId, e) => handleNoteSelect(noteId, e)}
              onEnableSelectionMode={multiSelect.enableSelectionMode}
          />

          <div className="hidden md:flex flex-1">
            <EditorCanvas
              selectedNote={selectedNote}
              onEdit={handleEditNote}
              onDelete={handleDeleteNote}
              onArchive={handleArchiveNote}
              onRestore={handleRestoreNote}
              hasNotes={filteredNotes.length > 0}
              onNewNote={handleCreateNote}
              view={currentView}
            />
          </div>
          </div>
          
          {multiSelect.hasSelection && (
            <SelectionToolbar
              selectedCount={multiSelect.selectedCount}
              totalCount={filteredNotes.length}
              onClearSelection={multiSelect.clearSelection}
              onSelectAll={() => multiSelect.toggleSelectAll(filteredNotes.map(n => n.id))}
              onArchive={currentView !== 'trash' ? handleBulkArchive : undefined}
              onDelete={currentView === 'trash' ? handleBulkDeletePermanently : handleBulkTrash}
              onRestore={currentView === 'trash' ? handleBulkRestore : undefined}
              view={currentView}
            />
          )}
        </div>

        {currentView === 'all' && (
          <Button
            onClick={handleCreateNote}
            className="lg:hidden fixed bottom-6 right-6 h-14 w-14 rounded-full bg-accent hover:bg-accent/90 text-white shadow-lg shadow-black/20 z-50 flex items-center justify-center p-0"
            aria-label="New Note"
          >
            <Plus className="w-6 h-6" />
          </Button>
        )}
        </div>
      </div>

      <NoteDialog
        open={noteDialogOpen}
        onOpenChange={(open) => {
          setNoteDialogOpen(open);
          if (!open) {
            setEditingNote(undefined);
          }
        }}
        note={editingNote}
        onSubmit={handleNoteSubmit}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setDeletingNote(undefined);
          }
        }}
        noteTitle={deletingNote?.title || "Untitled"}
        onConfirm={handleDeleteConfirm}
        isPermanent={currentView === 'trash'}
      />
    </div>

  );
}
