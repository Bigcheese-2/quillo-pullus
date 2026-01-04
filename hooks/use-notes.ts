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

// React Query cache keys for invalidation
const NOTES_QUERY_KEY = "notes";
const NOTE_QUERY_KEY = "note";

// Get user ID from environment (required for all API operations)
function getUserId(): string {
  const userId = process.env.NEXT_PUBLIC_USER_ID;
  if (!userId) {
    throw new Error("NEXT_PUBLIC_USER_ID is not set in environment variables");
  }
  return userId;
}

export function useNotes() {
  const userId = getUserId();

  return useQuery({
    queryKey: [NOTES_QUERY_KEY, userId],
    queryFn: () => fetchAllNotes(userId),
  });
}

export function useNote(id: string) {
  const userId = getUserId();

  return useQuery({
    queryKey: [NOTE_QUERY_KEY, id, userId],
    queryFn: () => fetchNoteById(id, userId),
    enabled: !!id,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  const userId = getUserId();

  return useMutation({
    mutationFn: (note: CreateNoteInput) => createNote(note),
    // Invalidate notes list to refetch after creation
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTES_QUERY_KEY, userId] });
    },
  });
}

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
    // Invalidate both list and individual note cache
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [NOTES_QUERY_KEY, userId] });
      queryClient.invalidateQueries({
        queryKey: [NOTE_QUERY_KEY, data.id, userId],
      });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  const userId = getUserId();

  return useMutation({
    mutationFn: (id: string) => deleteNote(id, userId),
    // Invalidate notes list to remove deleted note from UI
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTES_QUERY_KEY, userId] });
    },
  });
}


