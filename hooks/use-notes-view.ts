'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getAllNotes, getArchivedNotes, getDeletedNotes } from '@/lib/services/note-service';
import type { NoteView } from '@/lib/types/note';

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

export function useNotesView(view: NoteView = 'all') {
  const userId = getUserId();

  const activeQuery = useQuery({
    queryKey: [NOTES_QUERY_KEY, userId],
    queryFn: async () => {
      try {
        return await getAllNotes(userId);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Failed to get notes, trying local storage:', error);
        }
        try {
          const { getNotesByUserId } = await import('@/lib/db/indexeddb');
          return await getNotesByUserId(userId, false, false);
        } catch (dbError) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Failed to get notes from IndexedDB:', dbError);
          }
          return [];
        }
      }
    },
    enabled: view === 'all',
    staleTime: 2 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: true,
    placeholderData: (previousData) => previousData,
    throwOnError: false,
  });

  // Listen for sync completion events and refetch
  useEffect(() => {
    if (view !== 'all') return;

    const handleSyncComplete = (event: CustomEvent) => {
      if (event.detail?.userId === userId) {
        // Refetch after a short delay to ensure IndexedDB is updated
        setTimeout(() => {
          activeQuery.refetch();
        }, 100);
      }
    };

    window.addEventListener('notes-synced', handleSyncComplete as EventListener);
    return () => {
      window.removeEventListener('notes-synced', handleSyncComplete as EventListener);
    };
  }, [view, userId, activeQuery]);

  const archivedQuery = useQuery({
    queryKey: [ARCHIVED_QUERY_KEY, userId],
    queryFn: async () => {
      try {
        const notes = await getArchivedNotes(userId);
        return notes;
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to get archived notes:', error);
        }
        return [];
      }
    },
    enabled: true,
    staleTime: 0,
    gcTime: 24 * 60 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    throwOnError: false,
  });

  useEffect(() => {
    if (view === 'archived') {
      archivedQuery.refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const deletedQuery = useQuery({
    queryKey: [DELETED_QUERY_KEY, userId],
    queryFn: async () => {
      try {
        return await getDeletedNotes(userId);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to get deleted notes:', error);
        }
        return [];
      }
    },
    enabled: true,
    staleTime: 0,
    gcTime: 24 * 60 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    throwOnError: false,
  });

  useEffect(() => {
    if (view === 'trash') {
      deletedQuery.refetch().catch(() => {
        // Silently handle refetch errors
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  switch (view) {
    case 'archived':
      return {
        data: archivedQuery.data ?? [],
        isLoading: archivedQuery.isLoading,
        error: archivedQuery.error,
        refetch: archivedQuery.refetch,
      };
    case 'trash':
      return {
        data: deletedQuery.data ?? [],
        isLoading: deletedQuery.isLoading,
        error: deletedQuery.error,
        refetch: deletedQuery.refetch,
      };
    default:
      return {
        data: activeQuery.data ?? [],
        isLoading: activeQuery.isLoading,
        error: activeQuery.error,
        refetch: activeQuery.refetch,
      };
  }
}
