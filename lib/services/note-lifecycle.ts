import type { Note } from '@/lib/types/note';
import {
  getNoteById,
  saveNote,
  deleteNote as deleteNoteFromDB,
} from '@/lib/db/indexeddb';
import * as noteAPI from './note-api';
import { queueSyncOperation as queueSyncOp } from './sync-manager';
import { isOnline, generateSyncId } from './note-utils';

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

// Bulk operations
export async function archiveNotes(ids: string[], userId: string): Promise<Note[]> {
  const results = await Promise.allSettled(
    ids.map((id) => archiveNote(id, userId))
  );
  
  const archived: Note[] = [];
  const errors: Error[] = [];
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      archived.push(result.value);
    } else {
      errors.push(new Error(`Failed to archive note ${ids[index]}: ${result.reason.message}`));
    }
  });
  
  if (errors.length > 0 && archived.length === 0) {
    throw new Error(`Failed to archive notes: ${errors.map(e => e.message).join(', ')}`);
  }
  
  return archived;
}

export async function trashNotes(ids: string[], userId: string): Promise<Note[]> {
  const results = await Promise.allSettled(
    ids.map((id) => trashNote(id, userId))
  );
  
  const trashed: Note[] = [];
  const errors: Error[] = [];
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      trashed.push(result.value);
    } else {
      errors.push(new Error(`Failed to trash note ${ids[index]}: ${result.reason.message}`));
    }
  });
  
  if (errors.length > 0 && trashed.length === 0) {
    throw new Error(`Failed to trash notes: ${errors.map(e => e.message).join(', ')}`);
  }
  
  return trashed;
}

export async function restoreNotes(ids: string[], userId: string): Promise<Note[]> {
  const results = await Promise.allSettled(
    ids.map((id) => restoreNote(id, userId))
  );
  
  const restored: Note[] = [];
  const errors: Error[] = [];
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      restored.push(result.value);
    } else {
      errors.push(new Error(`Failed to restore note ${ids[index]}: ${result.reason.message}`));
    }
  });
  
  if (errors.length > 0 && restored.length === 0) {
    throw new Error(`Failed to restore notes: ${errors.map(e => e.message).join(', ')}`);
  }
  
  return restored;
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

