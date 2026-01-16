import type { Note } from '@/lib/types/note';
import {
  saveNote,
  deleteNote as deleteNoteFromDB,
} from '@/lib/db/indexeddb';
import * as noteAPI from './note-api';
import { isOnline } from './note-utils';
import { queueSyncOperationHelper, validateNoteAccess } from './note-helpers';

/**
 * Executes a bulk operation on multiple notes with consistent error handling.
 * @param ids - Array of note IDs to process
 * @param operation - Function to execute for each note ID
 * @param operationName - Name of the operation for error messages
 * @returns Array of successfully processed notes
 * @throws Error if all operations fail
 */
async function executeBulkOperation<T>(
  ids: string[],
  operation: (id: string) => Promise<T>,
  operationName: string
): Promise<T[]> {
  const results = await Promise.allSettled(
    ids.map((id) => operation(id))
  );
  
  const successful: T[] = [];
  const errors: Error[] = [];
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      successful.push(result.value);
    } else {
      errors.push(new Error(`Failed to ${operationName} note ${ids[index]}: ${result.reason.message}`));
    }
  });
  
  if (errors.length > 0 && successful.length === 0) {
    throw new Error(`Failed to ${operationName} notes: ${errors.map(e => e.message).join(', ')}`);
  }
  
  return successful;
}

export async function archiveNote(id: string, userId: string): Promise<Note> {
  const existingNote = await validateNoteAccess(id, userId);

  const archivedNote: Note = {
    ...existingNote,
    archived: true,
    modified_at: new Date().toISOString(),
  };

  await saveNote(archivedNote);
  return archivedNote;
}

export async function unarchiveNote(id: string, userId: string): Promise<Note> {
  const existingNote = await validateNoteAccess(id, userId);

  const unarchivedNote: Note = {
    ...existingNote,
    archived: false,
    modified_at: new Date().toISOString(),
  };

  await saveNote(unarchivedNote);
  return unarchivedNote;
}

export async function trashNote(id: string, userId: string): Promise<Note> {
  const existingNote = await validateNoteAccess(id, userId);

  const trashedNote: Note = {
    ...existingNote,
    deleted: true,
    archived: false,
    modified_at: new Date().toISOString(),
  };

  await saveNote(trashedNote);
  return trashedNote;
}

export async function restoreNote(id: string, userId: string): Promise<Note> {
  const existingNote = await validateNoteAccess(id, userId);

  const restoredNote: Note = {
    ...existingNote,
    deleted: false,
    modified_at: new Date().toISOString(),
  };

  await saveNote(restoredNote);
  return restoredNote;
}

export async function deleteNotePermanently(id: string, userId: string): Promise<void> {
  await validateNoteAccess(id, userId);

  await deleteNoteFromDB(id);

  if (isOnline()) {
    try {
      await noteAPI.deleteNote(id, userId);
    } catch (error) {
      await queueSyncOperationHelper('delete', id);
    }
  } else {
    await queueSyncOperationHelper('delete', id);
  }
}

export async function archiveNotes(ids: string[], userId: string): Promise<Note[]> {
  return executeBulkOperation(ids, (id) => archiveNote(id, userId), 'archive');
}

export async function trashNotes(ids: string[], userId: string): Promise<Note[]> {
  return executeBulkOperation(ids, (id) => trashNote(id, userId), 'trash');
}

export async function restoreNotes(ids: string[], userId: string): Promise<Note[]> {
  return executeBulkOperation(ids, (id) => restoreNote(id, userId), 'restore');
}

export async function deleteNotesPermanently(ids: string[], userId: string): Promise<void> {
  const results = await Promise.allSettled(
    ids.map((id) => deleteNotePermanently(id, userId))
  );
  
  const errors: Error[] = [];
  
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      errors.push(new Error(`Failed to delete note ${ids[index]}: ${result.reason.message}`));
    }
  });
  
  if (errors.length > 0) {
    throw new Error(`Failed to delete notes: ${errors.map(e => e.message).join(', ')}`);
  }
}

