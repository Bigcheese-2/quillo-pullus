import type { Note, CreateNoteInput, UpdateNoteInput } from '@/lib/types/note';
import * as noteAPI from './note-api';
import {
  getNoteById,
  saveNote,
  deleteNote as deleteNoteFromDB,
} from '@/lib/db/indexeddb';
import { isOnline, generateUUID } from './note-utils';
import { queueSyncOperationHelper } from './note-helpers';

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

  await queueSyncOperationHelper('create', newNote.id, input, now);

  if (isOnline()) {
    noteAPI.createNote(input)
      .then(async (syncedNote) => {
        const { getSyncOperations, deleteSyncOperation } = await import('@/lib/db/indexeddb');
        const operations = await getSyncOperations();
        const queuedOp = operations.find(op => op.noteId === newNote.id && op.type === 'create' && (op.status === 'pending' || op.status === 'syncing'));
        if (queuedOp) {
          await deleteSyncOperation(queuedOp.id);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('sync-operation-completed'));
          }
        }
        await deleteNoteFromDB(newNote.id);
        await saveNote(syncedNote);
      })
      .catch(() => {
        // Ignore errors - operation is queued for retry
      });
  }
  
  return newNote;
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
        await queueSyncOperationHelper('update', id, updates);
      });
    return updatedNote;
  } else {
    await queueSyncOperationHelper('update', id, updates);
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
      await queueSyncOperationHelper('delete', id);
    }
  } else {
    await queueSyncOperationHelper('delete', id);
  }
}

