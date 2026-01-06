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
import { Note } from "@/lib/types/note";
import { cn } from "@/lib/utils";

export default function Home() {
  const { data: notes = [], isLoading, error, refetch } = useNotes();
  const createNoteMutation = useCreateNote();
  const updateNoteMutation = useUpdateNote();
  const deleteNoteMutation = useDeleteNote();

  const [selectedNoteId, setSelectedNoteId] = useState<string | undefined>(undefined);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | undefined>(undefined);
  const [deletingNote, setDeletingNote] = useState<Note | undefined>(undefined);

  const selectedNote = notes.find((note) => note.id === selectedNoteId);

  useEffect(() => {
    if (notes.length > 0 && !selectedNoteId) {
      setSelectedNoteId(notes[0].id);
    }
  }, [notes, selectedNoteId]);

  const handleCreateNote = () => {
    setEditingNote(undefined);
    setNoteDialogOpen(true);
    setSidebarOpen(false);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setNoteDialogOpen(true);
  };

  // Handle delete note
  const handleDeleteNote = (note: Note) => {
    setDeletingNote(note);
    setDeleteDialogOpen(true);
  };

  const handleNoteSubmit = async (data: { title: string; content: string }) => {
    const userId = process.env.NEXT_PUBLIC_USER_ID;
    
    if (!userId) {
      toast.error("Configuration Error", {
        description: "User ID is not configured.",
      });
      return;
    }

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
        if (process.env.NODE_ENV === 'development') {
          console.error("Failed to update note:", error);
        }
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
        if (process.env.NODE_ENV === 'development') {
          console.error("Failed to create note:", error);
        }
        toast.error("Failed to create note", {
          description: error instanceof Error ? error.message : "An unknown error occurred",
        });
      }
    }
  };

  const handleDeleteConfirm = async () => {
    if (deletingNote) {
      const noteTitle = deletingNote.title || "Untitled";
      try {
        await deleteNoteMutation.mutateAsync(deletingNote.id);
        setDeleteDialogOpen(false);
        if (selectedNoteId === deletingNote.id) {
          const remainingNotes = notes.filter((note) => note.id !== deletingNote.id);
          setSelectedNoteId(remainingNotes[0]?.id);
        }
        setDeletingNote(undefined);
        toast.success("Note deleted", {
          description: `"${noteTitle}" has been permanently deleted.`,
        });
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error("Failed to delete note:", error);
        }
        toast.error("Failed to delete note", {
          description: error instanceof Error ? error.message : "An unknown error occurred",
        });
      }
    }
  };

  const handleNoteSelect = (noteId: string) => {
    setSelectedNoteId(noteId);
    setSidebarOpen(false);
  };

  if (isLoading && notes.length === 0 && !error) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">Loading notes...</p>
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
    <div className="flex h-screen overflow-hidden bg-background">
      <OfflineIndicator position="top" />
      
      <AppSidebar
        onNewNote={handleCreateNote}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div
        className={cn(
          "flex-1 flex flex-col overflow-hidden transition-transform duration-250 ease-out will-change-transform",
          "lg:ml-0 lg:translate-x-0",
          sidebarOpen ? "translate-x-64" : "translate-x-0"
        )}
      >
        <div className="p-4 border-b border-border">
          <AppHeader
            onMenuClick={() => setSidebarOpen((prev) => !prev)}
            onNewNote={handleCreateNote}
          />
        </div>

        <div className="flex-1 flex overflow-hidden">
          {!selectedNoteId ? (
            <NoteListPanel
              notes={notes}
              selectedNoteId={selectedNoteId}
              onNoteSelect={handleNoteSelect}
              onNewNote={handleCreateNote}
            />
          ) : (
            <div className="md:hidden flex-1">
              <EditorCanvas
                selectedNote={selectedNote}
                onEdit={handleEditNote}
                onDelete={handleDeleteNote}
                onBack={() => setSelectedNoteId(undefined)}
                hasNotes={notes.length > 0}
                onNewNote={handleCreateNote}
              />
            </div>
          )}

          <NoteListPanelDesktop
            notes={notes}
            selectedNoteId={selectedNoteId}
            onNoteSelect={handleNoteSelect}
            onNewNote={handleCreateNote}
          />

          <div className="hidden md:flex flex-1">
            <EditorCanvas
              selectedNote={selectedNote}
              onEdit={handleEditNote}
              onDelete={handleDeleteNote}
              hasNotes={notes.length > 0}
              onNewNote={handleCreateNote}
            />
          </div>
        </div>
      </div>

      <NoteDialog
        open={noteDialogOpen}
        onOpenChange={(open) => {
          setNoteDialogOpen(open);
          if (!open) {
            // Clear editing note when dialog closes
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
      />
    </div>
  );
}
