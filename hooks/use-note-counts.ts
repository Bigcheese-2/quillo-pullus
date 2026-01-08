'use client';

import { useQuery } from '@tanstack/react-query';
import { getAllNotes, getArchivedNotes, getDeletedNotes } from '@/lib/services/note-service';
import { getUserId } from '@/lib/config/env';

const NOTES_QUERY_KEY = 'notes';
const ARCHIVED_QUERY_KEY = 'archived-notes';
const DELETED_QUERY_KEY = 'deleted-notes';

export function useNoteCounts() {
  const userId = getUserId();

  const allNotesQuery = useQuery({
    queryKey: [NOTES_QUERY_KEY, userId],
    queryFn: async () => {
      try {
        return await getAllNotes(userId);
      } catch (error) {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    throwOnError: false,
  });

  const archivedQuery = useQuery({
    queryKey: [ARCHIVED_QUERY_KEY, userId],
    queryFn: async () => {
      try {
        return await getArchivedNotes(userId);
      } catch (error) {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    throwOnError: false,
  });

  const deletedQuery = useQuery({
    queryKey: [DELETED_QUERY_KEY, userId],
    queryFn: async () => {
      try {
        return await getDeletedNotes(userId);
      } catch (error) {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    throwOnError: false,
  });

  return {
    all: allNotesQuery.data?.length ?? 0,
    archived: archivedQuery.data?.length ?? 0,
    trash: deletedQuery.data?.length ?? 0,
    isLoading: allNotesQuery.isLoading || archivedQuery.isLoading || deletedQuery.isLoading,
  };
}
