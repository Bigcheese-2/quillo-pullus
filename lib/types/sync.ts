export type SyncStatus = 'synced' | 'syncing' | 'pending' | 'failed';

export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  noteId?: string;
  noteData?: unknown;
  status: SyncStatus;
  queuedAt: string;
  retryCount: number;
  error?: string;
}

export interface SyncState {
  status: SyncStatus;
  pendingCount: number;
  failedCount: number;
  isOnline: boolean;
  lastSyncedAt?: string;
}

