import * as noteAPI from './note-api';
import {
  getNoteById,
  saveNotes,
} from '@/lib/db/indexeddb';
import { processSyncQueue } from './sync-manager';

export async function syncFromServer(userId: string): Promise<import('./conflict-resolver').Conflict[]> {
  try {
    const { detectAndResolveAllConflicts } = await import('./conflict-resolver');
    const conflicts = await detectAndResolveAllConflicts(userId);
    
    const serverNotes = await noteAPI.fetchAllNotes(userId);
    if (serverNotes.length > 0) {
      // Preserve local archived/deleted values when syncing from server
      // (archive/trash are frontend-only features)
      const notesToSave = await Promise.all(serverNotes.map(async (serverNote) => {
        const localNote = await getNoteById(serverNote.id);
        if (localNote) {
          // Merge server data with local archived/deleted values
          return {
            ...serverNote,
            archived: localNote.archived ?? false,
            deleted: localNote.deleted ?? false,
          };
        }
        // New note from server - ensure fields are set
        return {
          ...serverNote,
          archived: serverNote.archived ?? false,
          deleted: serverNote.deleted ?? false,
        };
      }));
      await saveNotes(notesToSave);
    }
    
    return conflicts;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Failed to sync from server:', error);
    }
    return [];
  }
}

export async function syncPendingOperations(userId: string): Promise<number> {
  const result = await processSyncQueue(userId);
  return result.syncedCount;
}

