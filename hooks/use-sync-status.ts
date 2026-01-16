'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { getSyncStatus, processSyncQueue } from '@/lib/services/sync-manager';
import { formatConflictMessage } from '@/lib/services/conflict-resolver';
import type { SyncState } from '@/lib/types/sync';
import { getUserId } from '@/lib/config/env';
import { getErrorMessage } from '@/lib/utils/error-handler';

const SYNC_STATUS_POLL_INTERVAL = 2000;

export function useSyncStatus() {
  const [syncState, setSyncState] = useState<SyncState>({
    status: 'synced',
    pendingCount: 0,
    failedCount: 0,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const isSyncingRef = useRef(isSyncing);

  useEffect(() => {
    isSyncingRef.current = isSyncing;
  }, [isSyncing]);

  const updateSyncState = useCallback(async () => {
    try {
      const status = await getSyncStatus();
      
      let overallStatus: SyncState['status'] = 'synced';
      if (status.pendingCount > 0 || status.failedCount > 0) {
        overallStatus = isSyncingRef.current ? 'syncing' : status.failedCount > 0 ? 'failed' : 'pending';
      }

      setSyncState({
        status: overallStatus,
        pendingCount: status.pendingCount,
        failedCount: status.failedCount,
        isOnline: status.isOnline,
        lastSyncedAt: status.lastSyncedAt,
      });
    } catch (error) {
      setLastError(getErrorMessage(error));
    }
  }, []);

  const triggerSync = useCallback(async (): Promise<number> => {
    if (isSyncingRef.current) {
      return 0;
    }

    setIsSyncing(true);
    setLastError(null);

    try {
      const userId = getUserId();
      const result = await processSyncQueue(userId);
      
      if (result.conflicts.length > 0) {
        result.conflicts.forEach((conflict) => {
          toast.info(formatConflictMessage(conflict), {
            duration: 5000,
          });
        });
      }
      
      await updateSyncState();
      
      return result.syncedCount;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setLastError(errorMessage);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [updateSyncState]);

  useEffect(() => {
    updateSyncState();

    const interval = setInterval(updateSyncState, SYNC_STATUS_POLL_INTERVAL);

    const handleSyncQueued = () => {
      updateSyncState();
    };

    const handleSyncCompleted = () => {
      updateSyncState();
    };

    const handleSyncFailed = () => {
      updateSyncState();
    };

    const handleQueueProcessed = () => {
      updateSyncState();
    };

    const handleOnline = async () => {
      await updateSyncState();
     
      const status = await getSyncStatus();
      if (status.pendingCount > 0) {
        triggerSync().catch(() => {
        });
      }
    };

    const handleOffline = () => {
      updateSyncState();
    };

    window.addEventListener('sync-operation-queued', handleSyncQueued);
    window.addEventListener('sync-operation-completed', handleSyncCompleted);
    window.addEventListener('sync-operation-failed', handleSyncFailed);
    window.addEventListener('sync-queue-processed', handleQueueProcessed);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('sync-operation-queued', handleSyncQueued);
      window.removeEventListener('sync-operation-completed', handleSyncCompleted);
      window.removeEventListener('sync-operation-failed', handleSyncFailed);
      window.removeEventListener('sync-queue-processed', handleQueueProcessed);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [updateSyncState, triggerSync]);

  return {
    syncState,
    isSyncing,
    lastError,
    triggerSync,
    refresh: updateSyncState,
  };
}

