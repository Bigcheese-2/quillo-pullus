"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
} from "@/lib/services/note-service";
import type { Note, CreateNoteInput, UpdateNoteInput } from "@/lib/types/note";

const NOTES_QUERY_KEY = "notes";
const NOTE_QUERY_KEY = "note";

function getUserId(): string {
  const userId = process.env.NEXT_PUBLIC_USER_ID;
  if (!userId) {
    throw new Error("NEXT_PUBLIC_USER_ID is not set in environment variables");
  }
  return userId;
}

/**
 * React Query hook to fetch all notes for the current user.
 * Uses offline-first service - reads from IndexedDB immediately, syncs in background.
 * Notes are automatically cached and refetched when the cache is invalidated.
 * 
 * @returns React Query result with notes array, loading state, and error state
 */
export function useNotes() {
  const userId = getUserId();

  return useQuery({
    queryKey: [NOTES_QUERY_KEY, userId],
    queryFn: async () => {
      try {
        return await getAllNotes(userId);
      } catch (error) {
        console.warn('Failed to get notes, trying local storage:', error);
        try {
          const { getNotesByUserId } = await import('@/lib/db/indexeddb');
          return await getNotesByUserId(userId);
        } catch (dbError) {
          console.error('Failed to get notes from IndexedDB:', dbError);
          return [];
        }
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    throwOnError: false,
    placeholderData: (previousData) => previousData,
  });
}

/**
 * React Query hook to fetch a single note by ID.
 * Uses offline-first service - reads from IndexedDB immediately.
 * Only runs when an ID is provided (enabled: !!id).
 * 
 * @param id - The note's unique identifier (UUID)
 * @returns React Query result with note object, loading state, and error state
 */
export function useNote(id: string) {
  const userId = getUserId();

  return useQuery({
    queryKey: [NOTE_QUERY_KEY, id, userId],
    queryFn: () => getNote(id, userId),
    enabled: !!id,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
  });
}

/**
 * React Query mutation hook to create a new note.
 * Uses offline-first service - saves to IndexedDB immediately, syncs in background.
 * Uses optimistic updates to show new note immediately in UI.
 * 
 * @returns Mutation object with mutate/mutateAsync functions
 */
export function useCreateNote() {
  const queryClient = useQueryClient();
  const userId = getUserId();

  return useMutation({
    mutationFn: (note: CreateNoteInput) => createNote(note),
    onMutate: async (newNote) => {
      await queryClient.cancelQueries({ queryKey: [NOTES_QUERY_KEY, userId] });

      const previousNotes = queryClient.getQueryData<Note[]>([NOTES_QUERY_KEY, userId]);

      const optimisticNote: Note = {
        id: `temp-${Date.now()}`,
        user_id: newNote.user_id,
        title: newNote.title,
        content: newNote.content,
        created_at: new Date().toISOString(),
        modified_at: new Date().toISOString(),
      };

      if (previousNotes) {
        queryClient.setQueryData([NOTES_QUERY_KEY, userId], [optimisticNote, ...previousNotes]);
      } else {
        queryClient.setQueryData([NOTES_QUERY_KEY, userId], [optimisticNote]);
      }

      return { previousNotes };
    },
    onSuccess: (data) => {
      queryClient.setQueryData([NOTES_QUERY_KEY, userId], (old: Note[] | undefined) => {
        if (!old) return [data];
        const filtered = old.filter((note) => !note.id.startsWith('temp-'));
        return [data, ...filtered];
      });
    },
    onError: (error, variables, context) => {
      if (context?.previousNotes) {
        queryClient.setQueryData([NOTES_QUERY_KEY, userId], context.previousNotes);
      }
      if (process.env.NODE_ENV === 'development') {
        console.error('Create note error (note is saved locally):', error);
      }
      queryClient.invalidateQueries({ queryKey: [NOTES_QUERY_KEY, userId] });
    },
  });
}

/**
 * React Query mutation hook to update an existing note.
 * Uses offline-first service - updates IndexedDB immediately, syncs in background.
 * Uses optimistic updates to show changes immediately in UI.
 * 
 * @returns Mutation object with mutate/mutateAsync functions
 */
export function useUpdateNote() {
  const queryClient = useQueryClient();
  const userId = getUserId();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: UpdateNoteInput;
    }) => updateNote(id, userId, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: [NOTES_QUERY_KEY, userId] });
      await queryClient.cancelQueries({ queryKey: [NOTE_QUERY_KEY, id, userId] });

      const previousNotes = queryClient.getQueryData<Note[]>([NOTES_QUERY_KEY, userId]);
      const previousNote = queryClient.getQueryData<Note>([NOTE_QUERY_KEY, id, userId]);

      if (previousNotes) {
        const optimisticNotes = previousNotes.map((note) =>
          note.id === id
            ? { ...note, ...updates, modified_at: new Date().toISOString() }
            : note
        );
        queryClient.setQueryData([NOTES_QUERY_KEY, userId], optimisticNotes);
      }

      if (previousNote) {
        const optimisticNote = {
          ...previousNote,
          ...updates,
          modified_at: new Date().toISOString(),
        };
        queryClient.setQueryData([NOTE_QUERY_KEY, id, userId], optimisticNote);
      }

      return { previousNotes, previousNote };
    },
    onSuccess: (data) => {
      queryClient.setQueryData([NOTES_QUERY_KEY, userId], (old: Note[] | undefined) => {
        if (!old) return [data];
        return old.map((note) => (note.id === data.id ? data : note));
      });
      queryClient.setQueryData([NOTE_QUERY_KEY, data.id, userId], data);
    },
    onError: (error, variables, context) => {
      if (context?.previousNotes) {
        queryClient.setQueryData([NOTES_QUERY_KEY, userId], context.previousNotes);
      }
      if (context?.previousNote) {
        queryClient.setQueryData([NOTE_QUERY_KEY, variables.id, userId], context.previousNote);
      }
      if (process.env.NODE_ENV === 'development') {
        console.error('Update note error (note is updated locally):', error);
      }
      queryClient.invalidateQueries({ queryKey: [NOTES_QUERY_KEY, userId] });
    },
  });
}

/**
 * React Query mutation hook to delete a note.
 * Uses offline-first service - deletes from IndexedDB immediately, syncs in background.
 * Uses optimistic updates to remove note immediately from UI.
 * 
 * @returns Mutation object with mutate/mutateAsync functions
 */
export function useDeleteNote() {
  const queryClient = useQueryClient();
  const userId = getUserId();

  return useMutation({
    mutationFn: (id: string) => deleteNote(id, userId),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [NOTES_QUERY_KEY, userId] });
      await queryClient.cancelQueries({ queryKey: [NOTE_QUERY_KEY, id, userId] });

      const previousNotes = queryClient.getQueryData<Note[]>([NOTES_QUERY_KEY, userId]);
      const previousNote = queryClient.getQueryData<Note>([NOTE_QUERY_KEY, id, userId]);

      if (previousNotes) {
        queryClient.setQueryData(
          [NOTES_QUERY_KEY, userId],
          previousNotes.filter((note) => note.id !== id)
        );
      }

      queryClient.removeQueries({ queryKey: [NOTE_QUERY_KEY, id, userId] });

      return { previousNotes, previousNote };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTES_QUERY_KEY, userId] });
    },
    onError: (error, id, context) => {
      if (context?.previousNotes) {
        queryClient.setQueryData([NOTES_QUERY_KEY, userId], context.previousNotes);
      }
      if (context?.previousNote) {
        queryClient.setQueryData([NOTE_QUERY_KEY, id, userId], context.previousNote);
      }
      if (process.env.NODE_ENV === 'development') {
        console.error('Delete note error (note is deleted locally):', error);
      }
      queryClient.invalidateQueries({ queryKey: [NOTES_QUERY_KEY, userId] });
    },
  });
}


