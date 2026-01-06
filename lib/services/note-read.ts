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
  try {
    if (isOnline()) {
      try {
        await syncFromServer(userId);
        const syncedNotes = await getNotesByUserId(userId, false, false);
        return syncedNotes;
      } catch (syncError) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Failed to sync from server, using local data:', syncError);
        }
        const localNotes = await getNotesByUserId(userId, false, false);
        return localNotes;
      }
    } else {
      const localNotes = await getNotesByUserId(userId, false, false);
      return localNotes;
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to get notes:', error);
    }
    return [];
  }
}

export async function getArchivedNotes(userId: string): Promise<Note[]> {
  try {
    const notes = await getArchivedNotesFromDB(userId);
    return notes;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to get archived notes:', error);
    }
    return [];
  }
}

export async function getDeletedNotes(userId: string): Promise<Note[]> {
  try {
    return await getDeletedNotesFromDB(userId);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to get deleted notes:', error);
    }
    return [];
  }
}

export async function getNote(id: string, userId: string): Promise<Note | undefined> {
  const localNote = await getNoteById(id);

  if (isOnline() && localNote) {
    syncFromServer(userId).catch((error) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Background sync failed:', error);
      }
    });
  }

  return localNote;
}

