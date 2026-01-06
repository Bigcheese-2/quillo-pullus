import type { Note } from '@/lib/types/note';
import {
  getNotesByUserId,
  getNoteById,
  getArchivedNotes as getArchivedNotesFromDB,
  getDeletedNotes as getDeletedNotesFromDB,
} from '@/lib/db/indexeddb';
import { syncFromServer } from './note-sync';
import { isOnline } from './note-utils';

/**
 * Retrieves all notes for a user (excluding archived and deleted).
 * Reads from IndexedDB immediately, then syncs with server in background if online.
 * 
 * @param userId - The user's email address
 * @returns Promise resolving to an array of active notes
 */
export async function getAllNotes(userId: string): Promise<Note[]> {
  try {
    const localNotes = await getNotesByUserId(userId, false, false);

    if (isOnline()) {
      syncFromServer(userId).catch((error) => {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Background sync failed:', error);
        }
      });
    }

    return localNotes;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to get notes from IndexedDB:', error);
    }
    return [];
  }
}

/**
 * Retrieves archived notes for a user.
 * 
 * @param userId - The user's email address
 * @returns Promise resolving to an array of archived notes
 */
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

/**
 * Retrieves deleted (trash) notes for a user.
 * 
 * @param userId - The user's email address
 * @returns Promise resolving to an array of deleted notes
 */
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

/**
 * Retrieves a single note by ID.
 * Reads from IndexedDB first, then syncs with server if online.
 * 
 * @param id - The note's unique identifier
 * @param userId - The user's email address
 * @returns Promise resolving to the note, or undefined if not found
 */
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

