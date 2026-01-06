'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { getSyncStatus, processSyncQueue } from '@/lib/services/sync-manager';
import { formatConflictMessage } from '@/lib/services/conflict-resolver';
import type { SyncState } from '@/lib/types/sync';

const SYNC_STATUS_POLL_INTERVAL = 2000;

function getUserId(): string {
  if (typeof window === 'undefined') {
    return 'user@example.com';
  }
  return process.env.NEXT_PUBLIC_USER_ID || 'user@example.com';
}

export function useSyncStatus() {
  const [syncState, setSyncState] = useState<SyncState>({
    status: 'synced',
    pendingCount: 0,
    failedCount: 0,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const updateSyncState = useCallback(async () => {
    try {
      const status = await getSyncStatus();
      
      let overallStatus: SyncState['status'] = 'synced';
      if (status.pendingCount > 0 || status.failedCount > 0) {
        overallStatus = isSyncing ? 'syncing' : status.failedCount > 0 ? 'failed' : 'pending';
      }

      setSyncState({
        status: overallStatus,
        pendingCount: status.pendingCount,
        failedCount: status.failedCount,
        isOnline: status.isOnline,
        lastSyncedAt: status.lastSyncedAt,
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to update sync state:', error);
      }
      setLastError(error instanceof Error ? error.message : 'Unknown error');
    }
  }, [isSyncing]);

  const triggerSync = useCallback(async (): Promise<number> => {
    if (isSyncing) {
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setLastError(errorMessage);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, updateSyncState]);

  useEffect(() => {
    updateSyncState();

    const interval = setInterval(updateSyncState, SYNC_STATUS_POLL_INTERVAL);

    const handleOnline = async () => {
      await updateSyncState();
     
      const status = await getSyncStatus();
      if (status.pendingCount > 0) {
        triggerSync().catch((error) => {
          if (process.env.NODE_ENV === 'development') {
            console.error('Auto-sync failed:', error);
          }
        });
      }
    };

    const handleOffline = () => {
      updateSyncState();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
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

