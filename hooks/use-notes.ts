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
import { getUserId } from "@/lib/config/env";
import { deduplicateNotes } from "@/lib/services/note-utils";
import { NOTES_QUERY_KEY, NOTE_QUERY_KEY } from "./query-keys";

export function useNotes() {

  const userId = getUserId();
  return useQuery({
    queryKey: [NOTES_QUERY_KEY, userId],
    queryFn: async () => {
      try {
        return await getAllNotes(userId);
      } catch (error) {
        try {
          const { getNotesByUserId } = await import('@/lib/db/indexeddb');
          return await getNotesByUserId(userId);
        } catch (dbError) {
          return [];
        }
      }
    },
    placeholderData: (previousData) => previousData,
  });
}

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
      queryClient.cancelQueries({ queryKey: [NOTES_QUERY_KEY, userId] });
      
      const currentData = queryClient.getQueryData<Note[]>([NOTES_QUERY_KEY, userId]);
      
      let newData: Note[];
      if (!currentData || currentData.length === 0) {
        newData = [data];
      } else {
        const filtered = currentData.filter((note) => !note.id.startsWith('temp-'));
        const deduplicated = deduplicateNotes([data, ...filtered]);
        newData = deduplicated;
      }
      
      queryClient.setQueryData([NOTES_QUERY_KEY, userId], newData);
    },
    onError: (error, variables, context) => {
      if (context?.previousNotes) {
        queryClient.setQueryData([NOTES_QUERY_KEY, userId], context.previousNotes);
      }
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
      queryClient.cancelQueries({ queryKey: [NOTES_QUERY_KEY, userId] });
      queryClient.cancelQueries({ queryKey: [NOTE_QUERY_KEY, data.id, userId] });
      
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
      queryClient.invalidateQueries({ queryKey: [NOTES_QUERY_KEY, userId] });
    },
  });
}

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
      queryClient.invalidateQueries({ queryKey: [NOTES_QUERY_KEY, userId] });
    },
  });
}


