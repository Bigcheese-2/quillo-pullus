import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Note } from '@/lib/types/note';
import type { SyncOperation } from '@/lib/types/sync';

interface NotesDBSchema extends DBSchema {
  notes: {
    key: string;
    value: Note;
    indexes: {
      'user_id': string;
      'modified_at': string;
    };
  };
  sync_operations: {
    key: string;
    value: SyncOperation;
    indexes: {
      'status': string;
      'queuedAt': string;
    };
  };
}

const DB_NAME = 'notes-db';
const DB_VERSION = 3;
const STORE_NAME = 'notes';
const SYNC_STORE_NAME = 'sync_operations';

let dbInstance: IDBPDatabase<NotesDBSchema> | null = null;

function validateNonEmptyString(value: unknown, fieldName: string): asserts value is string {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Invalid ${fieldName}: must be a non-empty string`);
  }
}

async function getDB(): Promise<IDBPDatabase<NotesDBSchema>> {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    dbInstance = await openDB<NotesDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const notesStore = db.createObjectStore(STORE_NAME, {
            keyPath: 'id',
          });
          notesStore.createIndex('user_id', 'user_id', { unique: false });
          notesStore.createIndex('modified_at', 'modified_at', { unique: false });
        }

        if (oldVersion < 2 && !db.objectStoreNames.contains(SYNC_STORE_NAME)) {
          const syncStore = db.createObjectStore(SYNC_STORE_NAME, {
            keyPath: 'id',
          });
          syncStore.createIndex('status', 'status', { unique: false });
          syncStore.createIndex('queuedAt', 'queuedAt', { unique: false });
        }

        // Migration for version 3: Initialize archived/deleted fields
        // Migration is handled at runtime in getArchivedNotes and saveNote functions
      },
    });

    return dbInstance;
  } catch (error) {
    dbInstance = null;
    
    if (error instanceof DOMException) {
      if (error.name === 'QuotaExceededError') {
        throw new Error('Database storage quota exceeded. Please free up space.');
      }
      if (error.name === 'UnknownError') {
        throw new Error('Database access blocked. Please check browser permissions.');
      }
    }
    
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to open database: ${message}`);
  }
}

export async function closeDB(): Promise<void> {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

/**
 * Retrieves all notes from IndexedDB.
 * 
 * @returns Promise resolving to an array of all notes (empty array if none exist)
 * @throws Error if database operation fails
 */
export async function getAllNotes(): Promise<Note[]> {
  try {
    const db = await getDB();
    const notes = await db.getAll(STORE_NAME);
    return notes;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to get all notes: ${message}`);
  }
}

/**
 * Retrieves all notes for a specific user, sorted by modification date (newest first).
 * Uses the user_id index for efficient querying.
 * 
 * @param userId - The user's email address (must not be empty)
 * @param includeArchived - Whether to include archived notes (default: false)
 * @param includeDeleted - Whether to include deleted notes (default: false)
 * @returns Promise resolving to an array of notes for the user (empty array if none found)
 * @throws Error if userId is invalid or database operation fails
 */
export async function getNotesByUserId(
  userId: string,
  includeArchived = false,
  includeDeleted = false
): Promise<Note[]> {
  validateNonEmptyString(userId, 'userId');

  try {
    const db = await getDB();
    const notes = await db.getAllFromIndex(STORE_NAME, 'user_id', userId);
    
    const filtered = notes.filter((note) => {
      if (!includeDeleted && note.deleted === true) return false;
      if (!includeArchived && note.archived === true && note.deleted !== true) return false;
      return true;
    });
    
    filtered.sort((a, b) => {
      const dateA = new Date(a.modified_at).getTime();
      const dateB = new Date(b.modified_at).getTime();
      return dateB - dateA;
    });
    
    return filtered;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to get notes for user: ${message}`);
  }
}

/**
 * Retrieves archived notes for a specific user.
 * 
 * @param userId - The user's email address
 * @returns Promise resolving to an array of archived notes
 */
export async function getArchivedNotes(userId: string): Promise<Note[]> {
  validateNonEmptyString(userId, 'userId');

  try {
    const db = await getDB();
    const notes = await db.getAllFromIndex(STORE_NAME, 'user_id', userId);
    
    for (const note of notes) {
      if (note.archived === undefined) {
        note.archived = false;
      }
      if (note.deleted === undefined) {
        note.deleted = false;
      }
    }
    
    const archived = notes.filter((note) => {
      const archivedValue = note.archived === true;
      const notDeleted = note.deleted !== true;
      return archivedValue && notDeleted;
    });
    
    archived.sort((a, b) => {
      const dateA = new Date(a.modified_at).getTime();
      const dateB = new Date(b.modified_at).getTime();
      return dateB - dateA;
    });
    
    return archived;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to get archived notes: ${message}`);
  }
}

/**
 * Retrieves deleted (trash) notes for a specific user.
 * 
 * @param userId - The user's email address
 * @returns Promise resolving to an array of deleted notes
 */
export async function getDeletedNotes(userId: string): Promise<Note[]> {
  validateNonEmptyString(userId, 'userId');

  try {
    const db = await getDB();
    const notes = await db.getAllFromIndex(STORE_NAME, 'user_id', userId);
    
    const deleted = notes.filter((note) => note.deleted);
    
    deleted.sort((a, b) => {
      const dateA = new Date(a.modified_at).getTime();
      const dateB = new Date(b.modified_at).getTime();
      return dateB - dateA;
    });
    
    return deleted;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to get deleted notes: ${message}`);
  }
}

/**
 * Retrieves a single note by its ID.
 * 
 * @param id - The note's unique identifier (must not be empty)
 * @returns Promise resolving to the note, or undefined if not found
 * @throws Error if id is invalid or database operation fails
 */
export async function getNoteById(id: string): Promise<Note | undefined> {
  validateNonEmptyString(id, 'id');

  try {
    const db = await getDB();
    const note = await db.get(STORE_NAME, id);
    return note;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to get note by id: ${message}`);
  }
}

/**
 * Saves a note to IndexedDB.
 * If a note with the same ID exists, it will be updated (upsert operation).
 * 
 * @param note - The note object to save (must have valid id, user_id, title, content)
 * @returns Promise resolving to the saved note
 * @throws Error if note is invalid or database operation fails
 */
export async function saveNote(note: Note): Promise<Note> {
  if (!note || typeof note !== 'object') {
    throw new Error('Invalid note: must be an object');
  }
  validateNonEmptyString(note.id, 'note.id');
  validateNonEmptyString(note.user_id, 'note.user_id');

  // Ensure archived and deleted fields are always set
  if (note.archived === undefined) {
    note.archived = false;
  }
  if (note.deleted === undefined) {
    note.deleted = false;
  }

  try {
    const db = await getDB();
    await db.put(STORE_NAME, note);
    return note;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to save note: ${message}`);
  }
}

/**
 * Saves multiple notes to IndexedDB in a single transaction.
 * This is more efficient than saving notes one by one.
 * 
 * @param notes - Array of notes to save (empty array returns immediately)
 * @returns Promise resolving to the saved notes
 * @throws Error if any note is invalid or database operation fails
 */
export async function saveNotes(notes: Note[]): Promise<Note[]> {
  if (!Array.isArray(notes)) {
    throw new Error('Invalid input: notes must be an array');
  }
  if (notes.length === 0) {
    return [];
  }

  for (const note of notes) {
    if (!note || typeof note !== 'object') {
      throw new Error('Invalid note in array: must be an object');
    }
    validateNonEmptyString(note.id, 'note.id in array');
    
    // Ensure archived and deleted fields are always set (preserve existing values)
    if (note.archived === undefined) {
      note.archived = false;
    }
    if (note.deleted === undefined) {
      note.deleted = false;
    }
  }

  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    await Promise.all(notes.map(note => tx.store.put(note)));
    await tx.done;

    return notes;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to save notes: ${message}`);
  }
}

/**
 * Deletes a note from IndexedDB by its ID.
 * 
 * @param id - The note's unique identifier (must not be empty)
 * @returns Promise resolving to void on success
 * @throws Error if id is invalid or database operation fails
 */
export async function deleteNote(id: string): Promise<void> {
  validateNonEmptyString(id, 'id');

  try {
    const db = await getDB();
    await db.delete(STORE_NAME, id);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to delete note: ${message}`);
  }
}

/**
 * Deletes all notes from IndexedDB.
 * ⚠️ WARNING: This operation cannot be undone.
 * 
 * @returns Promise resolving to void on success
 * @throws Error if database operation fails
 */
export async function deleteAllNotes(): Promise<void> {
  try {
    const db = await getDB();
    await db.clear(STORE_NAME);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to delete all notes: ${message}`);
  }
}

/**
 * Deletes all notes for a specific user.
 * 
 * @param userId - The user's email address (must not be empty)
 * @returns Promise resolving to void on success
 * @throws Error if userId is invalid or database operation fails
 */
export async function deleteNotesByUserId(userId: string): Promise<void> {
  validateNonEmptyString(userId, 'userId');

  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const index = tx.store.index('user_id');
    const keys = await index.getAllKeys(userId);
    
    if (keys.length === 0) {
      await tx.done;
      return;
    }
    
    await Promise.all(keys.map(key => tx.store.delete(key)));
    await tx.done;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to delete notes for user: ${message}`);
  }
}

/**
 * Gets the total count of notes in the database.
 * 
 * @returns Promise resolving to the number of notes (0 if database is empty)
 * @throws Error if database operation fails
 */
export async function getNoteCount(): Promise<number> {
  try {
    const db = await getDB();
    const count = await db.count(STORE_NAME);
    return count;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to get note count: ${message}`);
  }
}


/**
 * Saves a sync operation to IndexedDB.
 * 
 * @param operation - The sync operation to save
 * @returns Promise resolving to the saved operation
 * @throws Error if database operation fails
 */
export async function saveSyncOperation(operation: SyncOperation): Promise<SyncOperation> {
  try {
    const db = await getDB();
    await db.put(SYNC_STORE_NAME, operation);
    return operation;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to save sync operation: ${message}`);
  }
}

/**
 * Gets all sync operations, optionally filtered by status.
 * 
 * @param status - Optional status filter
 * @returns Promise resolving to an array of sync operations
 * @throws Error if database operation fails
 */
export async function getSyncOperations(status?: SyncOperation['status']): Promise<SyncOperation[]> {
  try {
    const db = await getDB();
    
    if (status) {
      return await db.getAllFromIndex(SYNC_STORE_NAME, 'status', status);
    }
    
    return await db.getAll(SYNC_STORE_NAME);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to get sync operations: ${message}`);
  }
}

/**
 * Gets a single sync operation by ID.
 * 
 * @param id - The sync operation's unique identifier
 * @returns Promise resolving to the operation, or undefined if not found
 * @throws Error if database operation fails
 */
export async function getSyncOperationById(id: string): Promise<SyncOperation | undefined> {
  try {
    const db = await getDB();
    return await db.get(SYNC_STORE_NAME, id);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to get sync operation: ${message}`);
  }
}

/**
 * Deletes a sync operation from IndexedDB.
 * 
 * @param id - The sync operation's unique identifier
 * @returns Promise resolving to void on success
 * @throws Error if database operation fails
 */
export async function deleteSyncOperation(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete(SYNC_STORE_NAME, id);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to delete sync operation: ${message}`);
  }
}

/**
 * Deletes all sync operations with a specific status.
 * 
 * @param status - The status to filter by
 * @returns Promise resolving to void on success
 * @throws Error if database operation fails
 */
export async function deleteSyncOperationsByStatus(status: SyncOperation['status']): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(SYNC_STORE_NAME, 'readwrite');
    const index = tx.store.index('status');
    const keys = await index.getAllKeys(status);
    await Promise.all(keys.map(key => tx.store.delete(key)));
    await tx.done;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to delete sync operations: ${message}`);
  }
}

/**
 * Gets the count of sync operations, optionally filtered by status.
 * 
 * @param status - Optional status filter
 * @returns Promise resolving to the count
 * @throws Error if database operation fails
 */
export async function getSyncOperationCount(status?: SyncOperation['status']): Promise<number> {
  try {
    const db = await getDB();
    
    if (status) {
      const operations = await db.getAllFromIndex(SYNC_STORE_NAME, 'status', status);
      return operations.length;
    }
    
    return await db.count(SYNC_STORE_NAME);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to get sync operation count: ${message}`);
  }
}

