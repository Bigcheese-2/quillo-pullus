import type { CreateNoteInput, UpdateNoteInput, Note } from '@/lib/types/note';
import { queueSyncOperation } from './sync-manager';
import { generateSyncId } from './note-utils';
import { getNoteById } from '@/lib/db/indexeddb';

/**
 * Validates that a note exists and belongs to the specified user.
 * @throws Error if note not found or doesn't belong to user
 */
export async function validateNoteAccess(id: string, userId: string): Promise<Note> {
  const note = await getNoteById(id);
  if (!note) {
    throw new Error(`Note with id ${id} not found`);
  }
  if (note.user_id !== userId) {
    throw new Error(`Note with id ${id} does not belong to user ${userId}`);
  }
  return note;
}

/**
 * Queues a sync operation with standardized parameters.
 * This helper eliminates code duplication across note CRUD operations.
 * 
 * @param type - The type of sync operation ('create' | 'update' | 'delete')
 * @param noteId - The ID of the note (optional for create operations)
 * @param noteData - The note data to sync (optional for delete operations)
 * @param queuedAt - Optional timestamp (defaults to current time)
 */
export async function queueSyncOperationHelper(
  type: 'create' | 'update' | 'delete',
  noteId: string,
  noteData?: CreateNoteInput | UpdateNoteInput,
  queuedAt?: string
): Promise<void> {
  await queueSyncOperation({
    id: generateSyncId(),
    type,
    noteId,
    noteData,
    status: 'pending',
    queuedAt: queuedAt ?? new Date().toISOString(),
    retryCount: 0,
  });
}
