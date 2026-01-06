import type { SyncOperation } from '@/lib/types/sync';
import type { CreateNoteInput, UpdateNoteInput } from '@/lib/types/note';
import * as noteAPI from './note-api';
import {
  saveSyncOperation,
  getSyncOperations,
  deleteSyncOperation,
  getSyncOperationCount,
  saveNote,
} from '@/lib/db/indexeddb';

/**
 * Maximum number of retry attempts before giving up on a sync operation.
 */
const MAX_RETRY_ATTEMPTS = 3;

/**
 * Base delay in milliseconds for exponential backoff.
 */
const BASE_RETRY_DELAY_MS = 1000;

/**
 * Background Sync tag used to register sync events.
 */
const SYNC_TAG = 'sync-notes';

/**
 * Checks if the browser is currently online.
 * 
 * @returns true if online, false if offline
 */
function isOnline(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }
  return navigator.onLine;
}

/**
 * Checks if Background Sync API is supported.
 * 
 * @returns true if Background Sync is supported
 */
function isBackgroundSyncSupported(): boolean {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }
  // Check if sync property exists on ServiceWorkerRegistration
  try {
    const registration = navigator.serviceWorker.ready;
    return 'sync' in ServiceWorkerRegistration.prototype;
  } catch {
    return false;
  }
}

/**
 * Calculates exponential backoff delay based on retry count.
 * 
 * @param retryCount - Number of previous retry attempts
 * @returns Delay in milliseconds
 */
function calculateBackoffDelay(retryCount: number): number {
  return BASE_RETRY_DELAY_MS * Math.pow(2, retryCount);
}

/**
 * Queues a sync operation to IndexedDB and registers Background Sync if supported.
 * 
 * @param operation - The sync operation to queue
 * @returns Promise resolving when operation is queued
 */
export async function queueSyncOperation(operation: SyncOperation): Promise<void> {
  // Save to IndexedDB for persistence
  await saveSyncOperation(operation);

  // Register Background Sync if supported
  // Note: Background Sync works even when offline - it will trigger when connection is restored
  if (isBackgroundSyncSupported()) {
    try {
      const registration = await navigator.serviceWorker.ready;
      // TypeScript doesn't know about the sync property, so we need to cast
      const syncManager = (registration as unknown as { sync?: { register: (tag: string) => Promise<void> } }).sync;
      if (syncManager) {
        await syncManager.register(SYNC_TAG);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to register background sync:', error);
      }
      // Continue anyway - we'll process the queue manually when online
    }
  }
}

/**
 * Processes a single sync operation.
 * 
 * @param operation - The sync operation to process
 * @param userId - The user's email address
 * @returns Promise resolving when operation is complete
 * @throws Error if operation fails
 */
async function processSyncOperation(
  operation: SyncOperation,
  userId: string
): Promise<void> {
  // Update status to syncing
  operation.status = 'syncing';
  await saveSyncOperation(operation);

  try {
    switch (operation.type) {
      case 'create': {
        const input = operation.noteData as CreateNoteInput;
        const syncedNote = await noteAPI.createNote(input);
        await saveNote(syncedNote);
        break;
      }
      case 'update': {
        if (!operation.noteId) {
          throw new Error('Update operation missing noteId');
        }
        const updates = operation.noteData as UpdateNoteInput;
        const syncedNote = await noteAPI.updateNote(operation.noteId, userId, updates);
        await saveNote(syncedNote);
        break;
      }
      case 'delete': {
        if (!operation.noteId) {
          throw new Error('Delete operation missing noteId');
        }
        await noteAPI.deleteNote(operation.noteId, userId);
        break;
      }
      default:
        throw new Error(`Unknown sync operation type: ${operation.type}`);
    }

    // Mark as synced and remove from queue
    operation.status = 'synced';
    await deleteSyncOperation(operation.id);
  } catch (error) {
    // Operation failed - update retry count and status
    operation.retryCount++;
    operation.status = 'failed';
    operation.error = error instanceof Error ? error.message : 'Unknown error';

    if (operation.retryCount >= MAX_RETRY_ATTEMPTS) {
      // Max retries exceeded - keep in queue but mark as failed
      await saveSyncOperation(operation);
      throw new Error(`Operation failed after ${MAX_RETRY_ATTEMPTS} attempts: ${operation.error}`);
    } else {
      // Retry later with exponential backoff
      operation.status = 'pending';
      await saveSyncOperation(operation);
      
      // Schedule retry with exponential backoff
      const delay = calculateBackoffDelay(operation.retryCount);
      setTimeout(() => {
        processSyncOperation(operation, userId).catch((err) => {
          if (process.env.NODE_ENV === 'development') {
            console.error('Retry failed:', err);
          }
        });
      }, delay);
      
      throw error;
    }
  }
}

/**
 * Processes all pending sync operations.
 * This is called when the app comes online or when Background Sync is triggered.
 * 
 * @param userId - The user's email address
 * @returns Promise resolving to the number of successfully synced operations
 */
export async function processSyncQueue(userId: string): Promise<number> {
  if (!isOnline()) {
    return 0;
  }

  // Get all pending operations
  const pendingOperations = await getSyncOperations('pending');
  
  if (pendingOperations.length === 0) {
    return 0;
  }

  let syncedCount = 0;
  const errors: Error[] = [];

  // Process operations sequentially to avoid overwhelming the server
  for (const operation of pendingOperations) {
    try {
      await processSyncOperation(operation, userId);
      syncedCount++;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      errors.push(err);
      // Continue processing other operations even if one fails
    }
  }

  // Log any errors
  if (errors.length > 0) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`${errors.length} sync operations failed:`, errors);
    }
  }

  return syncedCount;
}

/**
 * Gets the current sync status.
 * 
 * @returns Promise resolving to sync status information
 */
export async function getSyncStatus(): Promise<{
  pendingCount: number;
  failedCount: number;
  isOnline: boolean;
  lastSyncedAt?: string;
}> {
  const pendingCount = await getSyncOperationCount('pending');
  const failedCount = await getSyncOperationCount('failed');
  
  // Get the most recently synced operation to find last sync time
  const allOperations = await getSyncOperations();
  const syncedOperations = allOperations.filter(op => op.status === 'synced');
  const lastSynced = syncedOperations.sort((a, b) => 
    new Date(b.queuedAt).getTime() - new Date(a.queuedAt).getTime()
  )[0];

  return {
    pendingCount,
    failedCount,
    isOnline: isOnline(),
    lastSyncedAt: lastSynced?.queuedAt,
  };
}

/**
 * Gets all pending sync operations.
 * Useful for debugging or displaying sync status to users.
 * 
 * @returns Promise resolving to an array of pending operations
 */
export async function getPendingSyncOperations(): Promise<SyncOperation[]> {
  return await getSyncOperations('pending');
}

/**
 * Gets all failed sync operations.
 * 
 * @returns Promise resolving to an array of failed operations
 */
export async function getFailedSyncOperations(): Promise<SyncOperation[]> {
  return await getSyncOperations('failed');
}

/**
 * Retries a failed sync operation.
 * 
 * @param operationId - The ID of the operation to retry
 * @param userId - The user's email address
 * @returns Promise resolving when retry is complete
 * @throws Error if operation is not found or retry fails
 */
export async function retrySyncOperation(
  operationId: string,
  userId: string
): Promise<void> {
  const operations = await getSyncOperations();
  const operation = operations.find(op => op.id === operationId);

  if (!operation) {
    throw new Error(`Sync operation with id ${operationId} not found`);
  }

  if (operation.status !== 'failed') {
    throw new Error(`Operation ${operationId} is not in failed state`);
  }

  // Reset operation to pending and retry
  operation.status = 'pending';
  operation.retryCount = 0;
  operation.error = undefined;
  await saveSyncOperation(operation);

  await processSyncOperation(operation, userId);
}

/**
 * Clears all synced operations from the queue.
 * This removes operations that have been successfully synced.
 * 
 * @returns Promise resolving to the number of cleared operations
 */
export async function clearSyncedOperations(): Promise<number> {
  const syncedOperations = await getSyncOperations('synced');
  const count = syncedOperations.length;
  
  await Promise.all(syncedOperations.map(op => deleteSyncOperation(op.id)));
  
  return count;
}

