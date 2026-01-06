import type { Note, CreateNoteInput, UpdateNoteInput } from '@/lib/types/note';
import * as noteAPI from './note-api';
import {
  getNoteById,
  saveNote,
  deleteNote as deleteNoteFromDB,
} from '@/lib/db/indexeddb';
import { queueSyncOperation as queueSyncOp } from './sync-manager';
import { isOnline, generateSyncId, generateUUID } from './note-utils';

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
      await deleteNoteFromDB(newNote.id);
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

