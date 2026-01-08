import type { Note } from '@/lib/types/note';
import {
  getNotesByUserId,
  getNoteById,
  getArchivedNotes as getArchivedNotesFromDB,
  getDeletedNotes as getDeletedNotesFromDB,
} from '@/lib/db/indexeddb';
import { syncFromServer } from './note-sync';
import { isOnline } from './note-utils';

export async function getAllNotes(userId: string): Promise<Note[]> {
  // Check online status FIRST
  const online = isOnline();
  
  if (online) {
    try {
      // If online, ALWAYS fetch from backend first to get latest data
      // This is critical for:
      // 1. New browsers where IndexedDB is empty
      // 2. Getting latest changes from other devices
      // This will make the API call to Supabase
      await syncFromServer(userId);
      // After sync, get notes from IndexedDB (which now has latest data)
      const syncedNotes = await getNotesByUserId(userId, false, false);
      return syncedNotes;
    } catch (error) {
      // If backend fails, fallback to IndexedDB
      // This handles cases where API is down but user has local data
      try {
        const localNotes = await getNotesByUserId(userId, false, false);
        return localNotes;
      } catch (dbError) {
        // Both backend and IndexedDB failed - return empty array
        // This is fine for new users with no data yet
        return [];
      }
    }
  } else {
    // If offline, load from IndexedDB
    // For new browsers offline, this will return empty array (expected)
    try {
      const localNotes = await getNotesByUserId(userId, false, false);
      return localNotes;
    } catch (error) {
      return [];
    }
  }
}

export async function getArchivedNotes(userId: string): Promise<Note[]> {
  try {
    const notes = await getArchivedNotesFromDB(userId);
    return notes;
  } catch (error) {
    return [];
  }
}

export async function getDeletedNotes(userId: string): Promise<Note[]> {
  try {
    return await getDeletedNotesFromDB(userId);
  } catch (error) {
    return [];
  }
}

export async function getNote(id: string, userId: string): Promise<Note | undefined> {
  const localNote = await getNoteById(id);

  if (isOnline() && localNote) {
    syncFromServer(userId).catch(() => {
    });
  }

  return localNote;
}


