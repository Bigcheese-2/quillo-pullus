import * as noteAPI from './note-api';
import {
  getNoteById,
  saveNotes,
} from '@/lib/db/indexeddb';
import { processSyncQueue } from './sync-manager';

export async function syncFromServer(userId: string): Promise<import('./conflict-resolver').Conflict[]> {
  try {
    const serverNotes = await noteAPI.fetchAllNotes(userId);
    
    const { detectAndResolveAllConflictsWithNotes } = await import('./conflict-resolver');
    const conflicts = await detectAndResolveAllConflictsWithNotes(userId, serverNotes);
    
    const notesToSave = await Promise.all(serverNotes.map(async (serverNote) => {
      const localNote = await getNoteById(serverNote.id);
      if (localNote) {
        return {
          ...serverNote,
          archived: localNote.archived ?? false,
          deleted: localNote.deleted ?? false,
        };
      }
      return {
        ...serverNote,
        archived: serverNote.archived ?? false,
        deleted: serverNote.deleted ?? false,
      };
    }));
    await saveNotes(notesToSave);
    
    return conflicts;
  } catch (error) {
    throw error; 
  }
}

export async function syncPendingOperations(userId: string): Promise<number> {
  const result = await processSyncQueue(userId);
  return result.syncedCount;
}

