/**
 * Utility functions for note operations.
 */

export function isOnline(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }
  return navigator.onLine;
}

export function generateSyncId(): string {
  return `sync-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

