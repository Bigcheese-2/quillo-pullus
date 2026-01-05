"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAllNotes,
  fetchNoteById,
  createNote,
  updateNote,
  deleteNote,
} from "@/lib/services/note-api";
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
 * Notes are automatically cached and refetched when the cache is invalidated.
 * 
 * @returns React Query result with notes array, loading state, and error state
 */
export function useNotes() {
  const userId = getUserId();

  return useQuery({
    queryKey: [NOTES_QUERY_KEY, userId],
    queryFn: () => fetchAllNotes(userId),
  });
}

/**
 * React Query hook to fetch a single note by ID.
 * Only runs when an ID is provided (enabled: !!id).
 * 
 * @param id - The note's unique identifier (UUID)
 * @returns React Query result with note object, loading state, and error state
 */
export function useNote(id: string) {
  const userId = getUserId();

  return useQuery({
    queryKey: [NOTE_QUERY_KEY, id, userId],
    queryFn: () => fetchNoteById(id, userId),
    enabled: !!id,
  });
}

/**
 * React Query mutation hook to create a new note.
 * Automatically invalidates the notes list cache on success.
 * 
 * @returns Mutation object with mutate/mutateAsync functions
 */
export function useCreateNote() {
  const queryClient = useQueryClient();
  const userId = getUserId();

  return useMutation({
    mutationFn: (note: CreateNoteInput) => createNote(note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTES_QUERY_KEY, userId] });
    },
  });
}

/**
 * React Query mutation hook to update an existing note.
 * Automatically invalidates both the notes list and individual note cache on success.
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [NOTES_QUERY_KEY, userId] });
      queryClient.invalidateQueries({
        queryKey: [NOTE_QUERY_KEY, data.id, userId],
      });
    },
  });
}

/**
 * React Query mutation hook to delete a note.
 * Automatically invalidates the notes list cache on success.
 * 
 * @returns Mutation object with mutate/mutateAsync functions
 */
export function useDeleteNote() {
  const queryClient = useQueryClient();
  const userId = getUserId();

  return useMutation({
    mutationFn: (id: string) => deleteNote(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTES_QUERY_KEY, userId] });
    },
  });
}


