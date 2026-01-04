/**
 * Sync status types for tracking synchronization state
 * 
 * - synced: Successfully synchronized with server
 * - syncing: Currently synchronizing
 * - pending: Waiting to be synchronized (queued)
 * - failed: Synchronization failed (will retry)
 */
export type SyncStatus = 'synced' | 'syncing' | 'pending' | 'failed';

/**
 * Represents a pending sync operation in the queue
 */
export interface SyncOperation {
  /** Unique identifier for this sync operation */
  id: string;
  
  /** Type of operation (create, update, delete) */
  type: 'create' | 'update' | 'delete';
  
  /** The note ID (for update/delete operations) */
  noteId?: string;
  
  /** The note data (for create/update operations) */
  noteData?: unknown;
  
  /** Current status of this sync operation */
  status: SyncStatus;
  
  /** Timestamp when the operation was queued */
  queuedAt: string;
  
  /** Number of retry attempts */
  retryCount: number;
  
  /** Error message if sync failed */
  error?: string;
}

/**
 * Overall sync state for the application
 */
export interface SyncState {
  /** Current overall sync status */
  status: SyncStatus;
  
  /** Number of pending operations */
  pendingCount: number;
  
  /** Number of failed operations */
  failedCount: number;
  
  /** Whether the app is currently online */
  isOnline: boolean;
  
  /** Last successful sync timestamp */
  lastSyncedAt?: string;
}

