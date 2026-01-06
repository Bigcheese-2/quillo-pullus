'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  archiveNote,
  unarchiveNote,
  trashNote,
  restoreNote,
  deleteNotePermanently,
  archiveNotes,
  trashNotes,
  restoreNotes,
  deleteNotesPermanently,
} from '@/lib/services/note-service';
import type { Note } from '@/lib/types/note';

const NOTES_QUERY_KEY = 'notes';
const ARCHIVED_QUERY_KEY = 'archived-notes';
const DELETED_QUERY_KEY = 'deleted-notes';

function getUserId(): string {
  const userId = process.env.NEXT_PUBLIC_USER_ID;
  if (!userId) {
    throw new Error('NEXT_PUBLIC_USER_ID is not set in environment variables');
  }
  return userId;
}

export function useArchiveNote() {
  const queryClient = useQueryClient();
  const userId = getUserId();

  return useMutation({
    mutationFn: (id: string) => {
      return archiveNote(id, userId);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [NOTES_QUERY_KEY, userId] });
      await queryClient.cancelQueries({ queryKey: [ARCHIVED_QUERY_KEY, userId] });

      const previousNotes = queryClient.getQueryData<Note[]>([NOTES_QUERY_KEY, userId]);
      const previousArchived = queryClient.getQueryData<Note[]>([ARCHIVED_QUERY_KEY, userId]);

      if (previousNotes) {
        const note = previousNotes.find(n => n.id === id);
        queryClient.setQueryData(
          [NOTES_QUERY_KEY, userId],
          previousNotes.filter((note) => note.id !== id)
        );
        
        if (note) {
          const archivedNote = { ...note, archived: true };
          queryClient.setQueryData(
            [ARCHIVED_QUERY_KEY, userId],
            previousArchived ? [archivedNote, ...previousArchived] : [archivedNote]
          );
        }
      }

      return { previousNotes, previousArchived };
    },
    onSuccess: async (archivedNote) => {
      await queryClient.invalidateQueries({ queryKey: [NOTES_QUERY_KEY, userId] });
      
      // Ensure the archived note is in the cache
      const currentArchived = queryClient.getQueryData<Note[]>([ARCHIVED_QUERY_KEY, userId]) ?? [];
      const existsInCache = currentArchived.some(n => n.id === archivedNote.id);
      if (!existsInCache) {
        queryClient.setQueryData(
          [ARCHIVED_QUERY_KEY, userId],
          [archivedNote, ...currentArchived]
        );
      }
      
      await queryClient.refetchQueries({ queryKey: [ARCHIVED_QUERY_KEY, userId] });
      toast.success('Note archived', {
        description: 'The note has been moved to archive.',
      });
    },
    onError: (error, id, context) => {
      if (context?.previousNotes) {
        queryClient.setQueryData([NOTES_QUERY_KEY, userId], context.previousNotes);
      }
      if (context?.previousArchived) {
        queryClient.setQueryData([ARCHIVED_QUERY_KEY, userId], context.previousArchived);
      }
      toast.error('Failed to archive note', {
        description: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    },
  });
}

export function useUnarchiveNote() {
  const queryClient = useQueryClient();
  const userId = getUserId();

  return useMutation({
    mutationFn: (id: string) => unarchiveNote(id, userId),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [NOTES_QUERY_KEY, userId] });
      await queryClient.cancelQueries({ queryKey: [ARCHIVED_QUERY_KEY, userId] });

      const previousNotes = queryClient.getQueryData<Note[]>([NOTES_QUERY_KEY, userId]);
      const previousArchived = queryClient.getQueryData<Note[]>([ARCHIVED_QUERY_KEY, userId]);

      if (previousArchived) {
        const note = previousArchived.find(n => n.id === id);
        queryClient.setQueryData(
          [ARCHIVED_QUERY_KEY, userId],
          previousArchived.filter((note) => note.id !== id)
        );
        
        if (note) {
          const unarchivedNote = { ...note, archived: false };
          queryClient.setQueryData(
            [NOTES_QUERY_KEY, userId],
            previousNotes ? [unarchivedNote, ...previousNotes] : [unarchivedNote]
          );
        }
      }

      return { previousNotes, previousArchived };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTES_QUERY_KEY, userId] });
      queryClient.invalidateQueries({ queryKey: [ARCHIVED_QUERY_KEY, userId] });
      toast.success('Note unarchived', {
        description: 'The note has been restored from archive.',
      });
    },
    onError: (error, id, context) => {
      if (context?.previousNotes) {
        queryClient.setQueryData([NOTES_QUERY_KEY, userId], context.previousNotes);
      }
      if (context?.previousArchived) {
        queryClient.setQueryData([ARCHIVED_QUERY_KEY, userId], context.previousArchived);
      }
      toast.error('Failed to unarchive note', {
        description: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    },
  });
}

export function useTrashNote() {
  const queryClient = useQueryClient();
  const userId = getUserId();

  return useMutation({
    mutationFn: (id: string) => trashNote(id, userId),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [NOTES_QUERY_KEY, userId] });
      await queryClient.cancelQueries({ queryKey: [ARCHIVED_QUERY_KEY, userId] });

      const previousNotes = queryClient.getQueryData<Note[]>([NOTES_QUERY_KEY, userId]);
      const previousArchived = queryClient.getQueryData<Note[]>([ARCHIVED_QUERY_KEY, userId]);

      if (previousNotes) {
        queryClient.setQueryData(
          [NOTES_QUERY_KEY, userId],
          previousNotes.filter((note) => note.id !== id)
        );
      }

      if (previousArchived) {
        queryClient.setQueryData(
          [ARCHIVED_QUERY_KEY, userId],
          previousArchived.filter((note) => note.id !== id)
        );
      }

      return { previousNotes, previousArchived };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DELETED_QUERY_KEY, userId] });
      toast.success('Note moved to trash', {
        description: 'The note has been moved to trash.',
      });
    },
    onError: (error, id, context) => {
      if (context?.previousNotes) {
        queryClient.setQueryData([NOTES_QUERY_KEY, userId], context.previousNotes);
      }
      if (context?.previousArchived) {
        queryClient.setQueryData([ARCHIVED_QUERY_KEY, userId], context.previousArchived);
      }
      toast.error('Failed to move note to trash', {
        description: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    },
  });
}

export function useRestoreNote() {
  const queryClient = useQueryClient();
  const userId = getUserId();

  return useMutation({
    mutationFn: (id: string) => restoreNote(id, userId),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [NOTES_QUERY_KEY, userId] });
      await queryClient.cancelQueries({ queryKey: [DELETED_QUERY_KEY, userId] });

      const previousNotes = queryClient.getQueryData<Note[]>([NOTES_QUERY_KEY, userId]);
      const previousDeleted = queryClient.getQueryData<Note[]>([DELETED_QUERY_KEY, userId]);

      if (previousDeleted) {
        const note = previousDeleted.find(n => n.id === id);
        queryClient.setQueryData(
          [DELETED_QUERY_KEY, userId],
          previousDeleted.filter((note) => note.id !== id)
        );
        
        if (note) {
          const restoredNote = { ...note, deleted: false };
          queryClient.setQueryData(
            [NOTES_QUERY_KEY, userId],
            previousNotes ? [restoredNote, ...previousNotes] : [restoredNote]
          );
        }
      }

      return { previousNotes, previousDeleted };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTES_QUERY_KEY, userId] });
      queryClient.invalidateQueries({ queryKey: [DELETED_QUERY_KEY, userId] });
      toast.success('Note restored', {
        description: 'The note has been restored from trash.',
      });
    },
    onError: (error, id, context) => {
      if (context?.previousNotes) {
        queryClient.setQueryData([NOTES_QUERY_KEY, userId], context.previousNotes);
      }
      if (context?.previousDeleted) {
        queryClient.setQueryData([DELETED_QUERY_KEY, userId], context.previousDeleted);
      }
      toast.error('Failed to restore note', {
        description: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    },
  });
}

export function useDeleteNotePermanently() {
  const queryClient = useQueryClient();
  const userId = getUserId();

  return useMutation({
    mutationFn: (id: string) => deleteNotePermanently(id, userId),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [DELETED_QUERY_KEY, userId] });

      const previousDeleted = queryClient.getQueryData<Note[]>([DELETED_QUERY_KEY, userId]);

      if (previousDeleted) {
        queryClient.setQueryData(
          [DELETED_QUERY_KEY, userId],
          previousDeleted.filter((note) => note.id !== id)
        );
      }

      return { previousDeleted };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DELETED_QUERY_KEY, userId] });
      toast.success('Note deleted permanently', {
        description: 'The note has been permanently deleted.',
      });
    },
    onError: (error, id, context) => {
      if (context?.previousDeleted) {
        queryClient.setQueryData([DELETED_QUERY_KEY, userId], context.previousDeleted);
      }
      toast.error('Failed to delete note', {
        description: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    },
  });
}

// Bulk operations hooks
export function useBulkArchiveNotes() {
  const queryClient = useQueryClient();
  const userId = getUserId();

  return useMutation({
    mutationFn: (ids: string[]) => archiveNotes(ids, userId),
    onSuccess: (archivedNotes, ids) => {
      queryClient.invalidateQueries({ queryKey: [NOTES_QUERY_KEY, userId] });
      queryClient.invalidateQueries({ queryKey: [ARCHIVED_QUERY_KEY, userId] });
      toast.success(`${archivedNotes.length} note${archivedNotes.length === 1 ? '' : 's'} archived`, {
        description: archivedNotes.length < ids.length 
          ? `Some notes could not be archived.`
          : 'The notes have been moved to archive.',
      });
    },
    onError: (error) => {
      toast.error('Failed to archive notes', {
        description: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    },
  });
}

export function useBulkTrashNotes() {
  const queryClient = useQueryClient();
  const userId = getUserId();

  return useMutation({
    mutationFn: (ids: string[]) => trashNotes(ids, userId),
    onSuccess: (trashedNotes, ids) => {
      queryClient.invalidateQueries({ queryKey: [NOTES_QUERY_KEY, userId] });
      queryClient.invalidateQueries({ queryKey: [ARCHIVED_QUERY_KEY, userId] });
      queryClient.invalidateQueries({ queryKey: [DELETED_QUERY_KEY, userId] });
      toast.success(`${trashedNotes.length} note${trashedNotes.length === 1 ? '' : 's'} moved to trash`, {
        description: trashedNotes.length < ids.length 
          ? `Some notes could not be moved to trash.`
          : 'The notes have been moved to trash.',
      });
    },
    onError: (error) => {
      toast.error('Failed to move notes to trash', {
        description: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    },
  });
}

export function useBulkRestoreNotes() {
  const queryClient = useQueryClient();
  const userId = getUserId();

  return useMutation({
    mutationFn: (ids: string[]) => restoreNotes(ids, userId),
    onSuccess: (restoredNotes, ids) => {
      queryClient.invalidateQueries({ queryKey: [NOTES_QUERY_KEY, userId] });
      queryClient.invalidateQueries({ queryKey: [DELETED_QUERY_KEY, userId] });
      toast.success(`${restoredNotes.length} note${restoredNotes.length === 1 ? '' : 's'} restored`, {
        description: restoredNotes.length < ids.length 
          ? `Some notes could not be restored.`
          : 'The notes have been restored from trash.',
      });
    },
    onError: (error) => {
      toast.error('Failed to restore notes', {
        description: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    },
  });
}

export function useBulkDeleteNotesPermanently() {
  const queryClient = useQueryClient();
  const userId = getUserId();

  return useMutation({
    mutationFn: (ids: string[]) => deleteNotesPermanently(ids, userId),
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: [DELETED_QUERY_KEY, userId] });
      toast.success(`${ids.length} note${ids.length === 1 ? '' : 's'} deleted permanently`, {
        description: 'The notes have been permanently deleted.',
      });
    },
    onError: (error) => {
      toast.error('Failed to delete notes', {
        description: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    },
  });
}

