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

