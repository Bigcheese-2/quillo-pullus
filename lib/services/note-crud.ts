import type { Note, CreateNoteInput, UpdateNoteInput } from '@/lib/types/note';
import * as noteAPI from './note-api';
import {
  saveNote,
  deleteNote as deleteNoteFromDB,
} from '@/lib/db/indexeddb';
import { isOnline, generateUUID } from './note-utils';
import { queueSyncOperationHelper, validateNoteAccess } from './note-helpers';

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

      if (newNote.id !== syncedNote.id) {
        await deleteNoteFromDB(newNote.id);
      }

      return syncedNote;
    } catch (error) {
      await queueSyncOperationHelper('create', newNote.id, input, now);
      return newNote;
    }
  } else {
    await queueSyncOperationHelper('create', newNote.id, input, now);
    return newNote;
  }
}

export async function updateNote(
  id: string,
  userId: string,
  updates: UpdateNoteInput
): Promise<Note> {
  const existingNote = await validateNoteAccess(id, userId);

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
      await queueSyncOperationHelper('update', id, updates);
      return updatedNote;
    }
  } else {
    await queueSyncOperationHelper('update', id, updates);
    return updatedNote;
  }
}

export async function deleteNote(id: string, userId: string): Promise<void> {
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

