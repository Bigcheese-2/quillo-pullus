'use client';

import { useState, useEffect } from 'react';
import { getPendingSyncOperations, getFailedSyncOperations } from '@/lib/services/sync-manager';
import type { SyncOperation } from '@/lib/types/sync';

/**
 * Hook to get a set of note IDs that have pending or failed sync operations.
 * 
 * @returns Set of note IDs with pending/failed sync operations
 */
export function usePendingNotes(): Set<string> {
  const [pendingNoteIds, setPendingNoteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let mounted = true;

    async function fetchPendingNotes() {
      try {
        const [pendingOps, failedOps] = await Promise.all([
          getPendingSyncOperations(),
          getFailedSyncOperations(),
        ]);
        
        if (!mounted) return;

        const noteIds = new Set<string>();
        
        [...pendingOps, ...failedOps].forEach((op: SyncOperation) => {
          if (op.noteId) {
            noteIds.add(op.noteId);
          } else if (op.type === 'create' && op.noteData) {
            const noteData = op.noteData as { id?: string };
            if (noteData.id) {
              noteIds.add(noteData.id);
            }
          }
        });

        setPendingNoteIds(noteIds);
      } catch (error) {
      }
    }

    fetchPendingNotes();

    const handleSyncQueued = () => {
      if (mounted) {
        fetchPendingNotes();
      }
    };

    const handleSyncCompleted = () => {
      if (mounted) {
        fetchPendingNotes();
      }
    };

    const handleSyncFailed = () => {
      if (mounted) {
        fetchPendingNotes();
      }
    };

    window.addEventListener('sync-operation-queued', handleSyncQueued);
    window.addEventListener('sync-operation-completed', handleSyncCompleted);
    window.addEventListener('sync-operation-failed', handleSyncFailed);

    const interval = setInterval(fetchPendingNotes, 2000);

    return () => {
      mounted = false;
      clearInterval(interval);
      window.removeEventListener('sync-operation-queued', handleSyncQueued);
      window.removeEventListener('sync-operation-completed', handleSyncCompleted);
      window.removeEventListener('sync-operation-failed', handleSyncFailed);
    };
  }, []);

  return pendingNoteIds;
}
