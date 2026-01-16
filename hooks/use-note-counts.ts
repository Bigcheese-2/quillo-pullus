'use client';

import { useQuery } from '@tanstack/react-query';
import { getAllNotes, getArchivedNotes, getDeletedNotes } from '@/lib/services/note-service';
import { getUserId } from '@/lib/config/env';
import { NOTES_QUERY_KEY, ARCHIVED_QUERY_KEY, DELETED_QUERY_KEY } from './query-keys';

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
  });

  return {
    all: allNotesQuery.data?.length ?? 0,
    archived: archivedQuery.data?.length ?? 0,
    trash: deletedQuery.data?.length ?? 0,
    isLoading: allNotesQuery.isLoading || archivedQuery.isLoading || deletedQuery.isLoading,
  };
}
