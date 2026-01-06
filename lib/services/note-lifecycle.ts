import type { Note } from '@/lib/types/note';
import {
  getNoteById,
  saveNote,
  deleteNote as deleteNoteFromDB,
} from '@/lib/db/indexeddb';
import * as noteAPI from './note-api';
import { queueSyncOperation as queueSyncOp } from './sync-manager';
import { isOnline, generateSyncId } from './note-utils';

/**
 * Archives a note (soft delete - moves to archive).
 * Updates IndexedDB immediately, does not sync to server.
 * 
 * @param id - The note's unique identifier
 * @param userId - The user's email address
 * @returns Promise resolving to the archived note
 * @throws Error if note is not found locally
 */
export async function archiveNote(id: string, userId: string): Promise<Note> {
  const existingNote = await getNoteById(id);
  if (!existingNote) {
    throw new Error(`Note with id ${id} not found`);
  }

  if (existingNote.user_id !== userId) {
    throw new Error(`Note with id ${id} does not belong to user ${userId}`);
  }

  const archivedNote: Note = {
    ...existingNote,
    archived: true,
    modified_at: new Date().toISOString(),
  };

  await saveNote(archivedNote);
  return archivedNote;
}

/**
 * Unarchives a note (restores from archive).
 * Updates IndexedDB immediately, does not sync to server.
 * 
 * @param id - The note's unique identifier
 * @param userId - The user's email address
 * @returns Promise resolving to the unarchived note
 * @throws Error if note is not found locally
 */
export async function unarchiveNote(id: string, userId: string): Promise<Note> {
  const existingNote = await getNoteById(id);
  if (!existingNote) {
    throw new Error(`Note with id ${id} not found`);
  }

  if (existingNote.user_id !== userId) {
    throw new Error(`Note with id ${id} does not belong to user ${userId}`);
  }

  const unarchivedNote: Note = {
    ...existingNote,
    archived: false,
    modified_at: new Date().toISOString(),
  };

  await saveNote(unarchivedNote);
  return unarchivedNote;
}

/**
 * Moves a note to trash (soft delete).
 * Updates IndexedDB immediately, does not sync to server.
 * 
 * @param id - The note's unique identifier
 * @param userId - The user's email address
 * @returns Promise resolving to the trashed note
 * @throws Error if note is not found locally
 */
export async function trashNote(id: string, userId: string): Promise<Note> {
  const existingNote = await getNoteById(id);
  if (!existingNote) {
    throw new Error(`Note with id ${id} not found`);
  }

  if (existingNote.user_id !== userId) {
    throw new Error(`Note with id ${id} does not belong to user ${userId}`);
  }

  const trashedNote: Note = {
    ...existingNote,
    deleted: true,
    archived: false,
    modified_at: new Date().toISOString(),
  };

  await saveNote(trashedNote);
  return trashedNote;
}

/**
 * Restores a note from trash.
 * Updates IndexedDB immediately, does not sync to server.
 * 
 * @param id - The note's unique identifier
 * @param userId - The user's email address
 * @returns Promise resolving to the restored note
 * @throws Error if note is not found locally
 */
export async function restoreNote(id: string, userId: string): Promise<Note> {
  const existingNote = await getNoteById(id);
  if (!existingNote) {
    throw new Error(`Note with id ${id} not found`);
  }

  if (existingNote.user_id !== userId) {
    throw new Error(`Note with id ${id} does not belong to user ${userId}`);
  }

  const restoredNote: Note = {
    ...existingNote,
    deleted: false,
    modified_at: new Date().toISOString(),
  };

  await saveNote(restoredNote);
  return restoredNote;
}

/**
 * Permanently deletes a note.
 * Deletes from IndexedDB immediately, then syncs with server if online.
 * If offline, queues the operation for later sync.
 * 
 * @param id - The note's unique identifier
 * @param userId - The user's email address
 * @returns Promise resolving to void on success
 * @throws Error if note is not found locally
 */
export async function deleteNotePermanently(id: string, userId: string): Promise<void> {
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

