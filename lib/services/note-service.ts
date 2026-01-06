import type { Note, CreateNoteInput, UpdateNoteInput } from '@/lib/types/note';
import type { SyncOperation } from '@/lib/types/sync';
import * as noteAPI from './note-api';
import {
  getNotesByUserId,
  getNoteById,
  saveNote,
  saveNotes,
  deleteNote as deleteNoteFromDB,
} from '@/lib/db/indexeddb';
import { queueSyncOperation as queueSyncOp, processSyncQueue } from './sync-manager';

/**
 * Checks if the browser is currently online.
 * Uses navigator.onLine and attempts a lightweight network check.
 * 
 * @returns true if online, false if offline
 */
function isOnline(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }
  return navigator.onLine;
}

/**
 * Generates a unique ID for sync operations.
 * 
 * @returns A unique string ID
 */
function generateSyncId(): string {
  return `sync-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generates a UUID for new notes.
 * Simple UUID v4 implementation.
 * 
 * @returns A UUID string
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}


/**
 * Retrieves all notes for a user.
 * Reads from IndexedDB immediately, then syncs with server in background if online.
 * 
 * @param userId - The user's email address
 * @returns Promise resolving to an array of notes
 */
export async function getAllNotes(userId: string): Promise<Note[]> {
  try {
    const localNotes = await getNotesByUserId(userId);

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

/**
 * Creates a new note.
 * Saves to IndexedDB immediately, then syncs with server if online.
 * If offline, queues the operation for later sync.
 * 
 * @param input - Note data (user_id, title, content)
 * @returns Promise resolving to the created note
 */
export async function createNote(input: CreateNoteInput): Promise<Note> {
  const now = new Date().toISOString();
  const newNote: Note = {
    id: generateUUID(),
    user_id: input.user_id,
    title: input.title,
    content: input.content,
    created_at: now,
    modified_at: now,
  };

  await saveNote(newNote);

  if (isOnline()) {
    try {
      const syncedNote = await noteAPI.createNote(input);
      await saveNote(syncedNote);
      return syncedNote;
    } catch (error) {
      await queueSyncOp({
        id: generateSyncId(),
        type: 'create',
        noteId: newNote.id,
        noteData: input,
        status: 'pending',
        queuedAt: now,
        retryCount: 0,
      });
      return newNote;
    }
  } else {
    await queueSyncOp({
      id: generateSyncId(),
      type: 'create',
      noteId: newNote.id,
      noteData: input,
      status: 'pending',
      queuedAt: now,
      retryCount: 0,
    });
    return newNote;
  }
}

/**
 * Updates an existing note.
 * Updates IndexedDB immediately, then syncs with server if online.
 * If offline, queues the operation for later sync.
 * 
 * @param id - The note's unique identifier
 * @param userId - The user's email address
 * @param updates - Partial note data to update
 * @returns Promise resolving to the updated note
 * @throws Error if note is not found locally
 */
export async function updateNote(
  id: string,
  userId: string,
  updates: UpdateNoteInput
): Promise<Note> {
  const existingNote = await getNoteById(id);
  if (!existingNote) {
    throw new Error(`Note with id ${id} not found`);
  }

  if (existingNote.user_id !== userId) {
    throw new Error(`Note with id ${id} does not belong to user ${userId}`);
  }

  const updatedNote: Note = {
    ...existingNote,
    ...updates,
    modified_at: new Date().toISOString(),
  };

  await saveNote(updatedNote);

  if (isOnline()) {
    try {
      const syncedNote = await noteAPI.updateNote(id, userId, updates);
      await saveNote(syncedNote);
      return syncedNote;
    } catch (error) {
      await queueSyncOp({
        id: generateSyncId(),
        type: 'update',
        noteId: id,
        noteData: updates,
        status: 'pending',
        queuedAt: new Date().toISOString(),
        retryCount: 0,
      });
      return updatedNote;
    }
  } else {
    await queueSyncOp({
      id: generateSyncId(),
      type: 'update',
      noteId: id,
      noteData: updates,
      status: 'pending',
      queuedAt: new Date().toISOString(),
      retryCount: 0,
    });
    return updatedNote;
  }
}

/**
 * Deletes a note.
 * Deletes from IndexedDB immediately, then syncs with server if online.
 * If offline, queues the operation for later sync.
 * 
 * @param id - The note's unique identifier
 * @param userId - The user's email address
 * @returns Promise resolving to void on success
 * @throws Error if note is not found locally
 */
export async function deleteNote(id: string, userId: string): Promise<void> {
  const existingNote = await getNoteById(id);
  if (!existingNote) {
    throw new Error(`Note with id ${id} not found`);
  }

  if (existingNote.user_id !== userId) {
    throw new Error(`Note with id ${id} does not belong to user ${userId}`);
  }

  await deleteNoteFromDB(id);

  if (isOnline()) {
    try {
      await noteAPI.deleteNote(id, userId);
    } catch (error) {
      await queueSyncOp({
        id: generateSyncId(),
        type: 'delete',
        noteId: id,
        noteData: undefined,
        status: 'pending',
        queuedAt: new Date().toISOString(),
        retryCount: 0,
      });
    }
  } else {
    await queueSyncOp({
      id: generateSyncId(),
      type: 'delete',
      noteId: id,
      noteData: undefined,
      status: 'pending',
      queuedAt: new Date().toISOString(),
      retryCount: 0,
    });
  }
}

/**
 * Syncs notes from server to IndexedDB.
 * Fetches all notes from server and updates local storage.
 * 
 * @param userId - The user's email address
 */
async function syncFromServer(userId: string): Promise<void> {
  try {
    const serverNotes = await noteAPI.fetchAllNotes(userId);
    
    if (serverNotes.length > 0) {
      await saveNotes(serverNotes);
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Failed to sync from server:', error);
    }
  }
}

/**
 * Processes all pending sync operations.
 * Delegates to sync-manager which handles Background Sync API.
 * 
 * @param userId - The user's email address
 * @returns Promise resolving to the number of successfully synced operations
 */
export async function syncPendingOperations(userId: string): Promise<number> {
  return await processSyncQueue(userId);
}

// Re-export sync manager functions for convenience
export { getSyncStatus, getPendingSyncOperations } from './sync-manager';

