/**
 * Checks if the application is currently online.
 * Always checks navigator.onLine directly to ensure accuracy.
 * This is the source of truth - no caching or state management needed.
 * 
 * @returns true if online, false if offline
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

export function deduplicateNotes<T extends { id: string }>(notes: T[]): T[] {
  const seenIds = new Set<string>();
  return notes.filter((note) => {
    if (seenIds.has(note.id)) return false;
    seenIds.add(note.id);
    return true;
  });
}