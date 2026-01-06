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
    const localNotes = await getNotesByUserId(userId, false, false);
    
    // If IndexedDB is empty and we're online, fetch from server (new browser case)
    if (localNotes.length === 0 && isOnline()) {
      try {
        await syncFromServer(userId);
        const syncedNotes = await getNotesByUserId(userId, false, false);
        
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('notes-synced', { detail: { userId } }));
        }
        
        return syncedNotes;
      } catch (syncError) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Failed to sync from server on initial load:', syncError);
        }
        return [];
      }
    }
    
    if (localNotes.length > 0 && isOnline()) {
      syncFromServer(userId)
        .then(() => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('notes-synced', { detail: { userId } }));
          }
        })
        .catch((syncError) => {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Background sync failed, using local data:', syncError);
          }
        });
    }
    
    return localNotes;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to get notes from IndexedDB:', error);
    }
    if (isOnline()) {
      try {
        await syncFromServer(userId);
        return await getNotesByUserId(userId, false, false);
      } catch (syncError) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Failed to sync from server as fallback:', syncError);
        }
      }
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


