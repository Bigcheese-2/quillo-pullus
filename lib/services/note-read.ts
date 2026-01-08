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
  const online = isOnline();
  
  if (online) {
    try {
      await syncFromServer(userId);
      const syncedNotes = await getNotesByUserId(userId, false, false);
      return syncedNotes;
    } catch (error) {
      try {
        const localNotes = await getNotesByUserId(userId, false, false);
        return localNotes;
      } catch (dbError) {
        return [];
      }
    }
  } else {
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


