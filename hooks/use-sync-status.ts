'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSyncStatus, processSyncQueue } from '@/lib/services/sync-manager';
import type { SyncState } from '@/lib/types/sync';

/**
 * Polling interval in milliseconds for checking sync status.
 * Updates every 2 seconds to keep UI responsive.
 */
const SYNC_STATUS_POLL_INTERVAL = 2000;

/**
 * Gets the user ID from environment or returns default.
 * 
 * @returns User ID string
 */
function getUserId(): string {
  if (typeof window === 'undefined') {
    return 'user@example.com';
  }
  return process.env.NEXT_PUBLIC_USER_ID || 'user@example.com';
}

/**
 * React hook to track sync status and provide sync functionality.
 * 
 * Automatically polls for sync status updates and provides:
 * - Current sync state (pending, failed, online status)
 * - Manual sync trigger function
 * - Loading state for sync operations
 * 
 * @returns Object with sync state and sync functions
 */
export function useSyncStatus() {
  const [syncState, setSyncState] = useState<SyncState>({
    status: 'synced',
    pendingCount: 0,
    failedCount: 0,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  /**
   * Updates the sync state by fetching current status.
   */
  const updateSyncState = useCallback(async () => {
    try {
      const status = await getSyncStatus();
      
      // Determine overall sync status
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

  /**
   * Manually triggers sync of pending operations.
   * 
   * @returns Promise resolving to the number of synced operations
   */
  const triggerSync = useCallback(async (): Promise<number> => {
    if (isSyncing) {
      return 0;
    }

    setIsSyncing(true);
    setLastError(null);

    try {
      const userId = getUserId();
      const syncedCount = await processSyncQueue(userId);
      
      // Update state after sync
      await updateSyncState();
      
      return syncedCount;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setLastError(errorMessage);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, updateSyncState]);

  // Update sync state on mount and when online status changes
  useEffect(() => {
    updateSyncState();

    // Poll for sync status updates
    const interval = setInterval(updateSyncState, SYNC_STATUS_POLL_INTERVAL);

    // Listen for online/offline events
    const handleOnline = async () => {
      await updateSyncState();
      // Automatically trigger sync when coming online
      // Check pending count after state update
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

