'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { getAllNotes, getArchivedNotes, getDeletedNotes } from '@/lib/services/note-service';
import type { NoteView } from '@/lib/types/note';
import { getUserId } from '@/lib/config/env';

const NOTES_QUERY_KEY = 'notes';
const ARCHIVED_QUERY_KEY = 'archived-notes';
const DELETED_QUERY_KEY = 'deleted-notes';

export function useNotesView(view: NoteView = 'all') {
  const userId = getUserId();

  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const activeQuery = useQuery({
    queryKey: [NOTES_QUERY_KEY, userId],
    queryFn: async () => {
      const result = await getAllNotes(userId);
      const seenIds = new Set<string>();
      const deduplicated = result.filter((note) => {
        if (seenIds.has(note.id)) return false;
        seenIds.add(note.id);
        return true;
      });
      return deduplicated;
    },
    enabled: view === 'all',
    staleTime: isOnline ? 0 : 5 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: isOnline ? 'always' : false,
    throwOnError: false,
    placeholderData: (previousData) => !isOnline ? previousData : undefined,
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (view === 'all' && isOnline) {
      const timeoutId = setTimeout(() => {
        activeQuery.refetch({ cancelRefetch: false });
      }, 50);
      return () => clearTimeout(timeoutId);
    }
  }, []);

  const isRefetchingRef = useRef(false);

  useEffect(() => {
    if (view !== 'all') return;

    const handleOnline = () => {
      setIsOnline(true);
      if (!isRefetchingRef.current) {
        isRefetchingRef.current = true;
        setTimeout(() => {
          activeQuery.refetch({ cancelRefetch: false }).finally(() => {
            setTimeout(() => {
              isRefetchingRef.current = false;
            }, 1000);
          });
        }, 200);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [view, activeQuery]);

  useEffect(() => {
    if (view !== 'all') return;

    const handleSyncComplete = (event: CustomEvent) => {
      if (event.detail?.userId === userId && !isRefetchingRef.current) {
        isRefetchingRef.current = true;
        setTimeout(() => {
          activeQuery.refetch().finally(() => {
            setTimeout(() => {
              isRefetchingRef.current = false;
            }, 1000);
          });
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
  }, [view]);

  const deletedQuery = useQuery({
    queryKey: [DELETED_QUERY_KEY, userId],
    queryFn: async () => {
      try {
        return await getDeletedNotes(userId);
      } catch (error) {
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
      });
    }
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
