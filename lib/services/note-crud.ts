import type { Note, CreateNoteInput, UpdateNoteInput } from '@/lib/types/note';
import * as noteAPI from './note-api';
import {
  getNoteById,
  saveNote,
  deleteNote as deleteNoteFromDB,
} from '@/lib/db/indexeddb';
import { queueSyncOperation as queueSyncOp } from './sync-manager';
import { isOnline, generateSyncId, generateUUID } from './note-utils';

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
    noteAPI.createNote(input)
      .then(async (syncedNote) => {
        await deleteNoteFromDB(newNote.id);
        await saveNote(syncedNote);
      })
      .catch(async (error) => {
        await queueSyncOp({
          id: generateSyncId(),
          type: 'create',
          noteId: newNote.id,
          noteData: input,
          status: 'pending',
          queuedAt: now,
          retryCount: 0,
        });
      });
    return newNote;
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
    noteAPI.updateNote(id, userId, updates)
      .then(async (syncedNote) => {
        await saveNote(syncedNote);
      })
      .catch(async (error) => {
        await queueSyncOp({
          id: generateSyncId(),
          type: 'update',
          noteId: id,
          noteData: updates,
          status: 'pending',
          queuedAt: new Date().toISOString(),
          retryCount: 0,
        });
      });
    return updatedNote;
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

