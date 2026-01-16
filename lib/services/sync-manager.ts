import type { SyncOperation } from '@/lib/types/sync';
import type { CreateNoteInput, UpdateNoteInput } from '@/lib/types/note';
import * as noteAPI from './note-api';
import { detectAndResolveConflict, formatConflictMessage, type Conflict } from './conflict-resolver';
import { isOnline } from './note-utils';
import { getErrorMessage } from '@/lib/utils/error-handler';
import {
  saveSyncOperation,
  getSyncOperations,
  deleteSyncOperation,
  getSyncOperationCount,
  saveNote,
  getSyncOperationById,
} from '@/lib/db/indexeddb';

const MAX_RETRY_ATTEMPTS = 3;

const BASE_RETRY_DELAY_MS = 1000;

const SYNC_TAG = 'sync-notes';


function isBackgroundSyncSupported(): boolean {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }
  try {
    const registration = navigator.serviceWorker.ready;
    return 'sync' in ServiceWorkerRegistration.prototype;
  } catch {
    return false;
  }
}


function calculateBackoffDelay(retryCount: number): number {
  return BASE_RETRY_DELAY_MS * Math.pow(2, retryCount);
}

/**
 * Queues a sync operation to IndexedDB and registers Background Sync.
 * Prevents duplicate operations for the same noteId and type.
 * 
 * @param operation - The sync operation to queue
 * @returns Promise resolving when operation is queued
 */
export async function queueSyncOperation(operation: SyncOperation): Promise<void> {
  if (operation.noteId) {
    const existingOperations = await getSyncOperations();
    const duplicate = existingOperations.find(
      (op) =>
        op.noteId === operation.noteId &&
        op.type === operation.type &&
        (op.status === 'pending' || op.status === 'syncing')
    );
    
    if (duplicate) {
      return;
    }
  }
  
  await saveSyncOperation(operation);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sync-operation-queued'));
  }

  if (isBackgroundSyncSupported()) {
    try {
      const registration = await navigator.serviceWorker.ready;
      const syncManager = (registration as unknown as { sync?: { register: (tag: string) => Promise<void> } }).sync;
      if (syncManager) {
        await syncManager.register(SYNC_TAG);
      }
    } catch (error) {
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
  if (operation.status !== 'syncing') {
    operation.status = 'syncing';
    await saveSyncOperation(operation);
  }

  try {
    switch (operation.type) {
      case 'create': {
        const input = operation.noteData as CreateNoteInput;
        const syncedNote = await noteAPI.createNote(input);
        
        if (operation.noteId && operation.noteId !== syncedNote.id) {
          const { deleteNote: deleteNoteFromDB } = await import('@/lib/db/indexeddb');
          await deleteNoteFromDB(operation.noteId).catch(() => {
            // Ignore errors when cleaning up old note
          });
        }
        
        await saveNote(syncedNote);
        break;
      }
      case 'update': {
        if (!operation.noteId) {
          throw new Error('Update operation missing noteId');
        }
        const updates = operation.noteData as UpdateNoteInput;
        
        try {
          const syncedNote = await noteAPI.updateNote(operation.noteId, userId, updates);
          await saveNote(syncedNote);
        } catch (error) {
          const conflict = await detectAndResolveConflict(operation.noteId, userId);
          if (conflict) {
            await saveNote(conflict.resolvedNote);
            throw new Error(`Conflict resolved: ${formatConflictMessage(conflict)}`);
          }
          throw error;
        }
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

    operation.status = 'synced';
    await deleteSyncOperation(operation.id);
  } catch (error) {
    operation.retryCount++;
    operation.status = 'failed';
    operation.error = getErrorMessage(error);

    if (operation.retryCount >= MAX_RETRY_ATTEMPTS) {
      await saveSyncOperation(operation);
      throw new Error(`Operation failed after ${MAX_RETRY_ATTEMPTS} attempts: ${operation.error}`);
    } else {
      operation.status = 'pending';
      await saveSyncOperation(operation);
      
      const delay = calculateBackoffDelay(operation.retryCount);
      setTimeout(() => {
        processSyncOperation(operation, userId).catch(() => {
          // Ignore errors - will retry on next sync
        });
      }, delay);
      
      throw error;
    }
  }
}


let isProcessingQueue = false;

export async function processSyncQueue(userId: string): Promise<{
  syncedCount: number;
  conflicts: Conflict[];
}> {
  if (!isOnline()) {
    return { syncedCount: 0, conflicts: [] };
  }

  if (isProcessingQueue) {
    return { syncedCount: 0, conflicts: [] };
  }

  isProcessingQueue = true;

  try {
    const pendingOperations = await getSyncOperations('pending');
    
    if (pendingOperations.length === 0) {
      return { syncedCount: 0, conflicts: [] };
    }

    for (const operation of pendingOperations) {
      operation.status = 'syncing';
      await saveSyncOperation(operation);
    }

    let syncedCount = 0;
    const errors: Error[] = [];
    const conflicts: Conflict[] = [];

    for (const operation of pendingOperations) {
      try {
        await processSyncOperation(operation, userId);
      syncedCount++;
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sync-operation-completed'));
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      
      if (err.message.includes('Conflict resolved')) {
        const conflict = await detectAndResolveConflict(operation.noteId || '', userId);
        if (conflict) {
          conflicts.push(conflict);
          syncedCount++;
          
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('sync-operation-completed'));
          }
          continue;
        }
      }
      
      errors.push(err);
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sync-operation-failed'));
      }
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sync-queue-processed'));
  }

    return { syncedCount, conflicts };
  } finally {
    isProcessingQueue = false;
  }
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

  operation.status = 'pending';
  operation.retryCount = 0;
  operation.error = undefined;
  await saveSyncOperation(operation);

  await processSyncOperation(operation, userId);
}

/**
 * Clears all synced operations from the queue.
 * 
 * @returns Promise resolving to the number of cleared operations
 */
export async function clearSyncedOperations(): Promise<number> {
  const syncedOperations = await getSyncOperations('synced');
  const count = syncedOperations.length;
  
  await Promise.all(syncedOperations.map(op => deleteSyncOperation(op.id)));
  
  return count;
}

