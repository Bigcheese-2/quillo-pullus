import type { Note } from '@/lib/types/note';
import { getNoteById, saveNote } from '@/lib/db/indexeddb';
import * as noteAPI from './note-api';

export interface Conflict {
  noteId: string;
  localNote: Note;
  serverNote: Note;
  resolution: 'local' | 'server' | 'merged';
  resolvedNote: Note;
}

/**
 * Resolves conflicts between local and server versions of notes using Last-Write-Wins strategy.
 * The note with the most recent modified_at timestamp updates.
 * 
 * @param localNote - The note from local storage (IndexedDB)
 * @param serverNote - The note from the server (Supabase)
 * @returns The resolved note (winner based on modified_at timestamp)
 */
export function resolveConflict(localNote: Note, serverNote: Note): Note {
  const localTime = new Date(localNote.modified_at).getTime();
  const serverTime = new Date(serverNote.modified_at).getTime();

  if (localTime > serverTime) {
    return localNote;
  } else if (serverTime > localTime) {
    return serverNote;
  } else {
    return serverNote;
  }
}

/**
 * checks for conflicts and resolves conflicts for a single note.
 * Compares local and server versions, resolves using LWW, and saves the winner.
 * 
 * @param noteId - The ID of the note to check for conflicts
 * @param userId - The user's email address
 * @returns Conflict object if conflict was detected and resolved, null otherwise
 * @throws Error if note cannot be fetched or conflict cannot be resolved
 */
export async function detectAndResolveConflict(
  noteId: string,
  userId: string
): Promise<Conflict | null> {
  const localNote = await getNoteById(noteId);
  
  if (!localNote) {
    return null;
  }

  try {
    const serverNote = await noteAPI.fetchNoteById(noteId, userId);
    
    const localTime = new Date(localNote.modified_at).getTime();
    const serverTime = new Date(serverNote.modified_at).getTime();

    if (localTime === serverTime) {
      return null;
    }

    const resolvedNote = resolveConflict(localNote, serverNote);
    const resolution: Conflict['resolution'] = 
      resolvedNote.modified_at === localNote.modified_at ? 'local' : 'server';

    const finalResolvedNote: Note = {
      ...resolvedNote,
      archived: localNote.archived ?? false,
      deleted: localNote.deleted ?? false,
    };

    await saveNote(finalResolvedNote);

    return {
      noteId,
      localNote,
      serverNote,
      resolution,
      resolvedNote,
    };
  } catch (error) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Detects and resolves conflicts using pre-fetched server notes.
 * This avoids duplicate API calls when server notes are already fetched.
 * 
 * @param userId - The user's email address
 * @param serverNotes - Pre-fetched notes from the server
 * @returns Array of resolved conflicts
 */
export async function detectAndResolveAllConflictsWithNotes(
  userId: string,
  serverNotes: Note[]
): Promise<Conflict[]> {
  try {
    const conflicts: Conflict[] = [];

    for (const serverNote of serverNotes) {
      const localNote = await getNoteById(serverNote.id);
      
      if (!localNote) {
        continue;
      }

      const localTime = new Date(localNote.modified_at).getTime();
      const serverTime = new Date(serverNote.modified_at).getTime();

      if (localTime !== serverTime) {
        const resolvedNote = resolveConflict(localNote, serverNote);
        const resolution: Conflict['resolution'] = 
          resolvedNote.modified_at === localNote.modified_at ? 'local' : 'server';

        const finalResolvedNote: Note = {
          ...resolvedNote,
          archived: localNote.archived ?? false,
          deleted: localNote.deleted ?? false,
        };

        await saveNote(finalResolvedNote);

        conflicts.push({
          noteId: serverNote.id,
          localNote,
          serverNote,
          resolution,
          resolvedNote: finalResolvedNote,
        });
      }
    }

    return conflicts;
  } catch (error) {
    return [];
  }
}

export function formatConflictMessage(conflict: Conflict): string {
  const noteTitle = conflict.localNote.title || 'Untitled Note';
  const resolutionText = conflict.resolution === 'local' 
    ? 'Your local version was kept' 
    : 'Server version was used';
  
  return `Conflict resolved for "${noteTitle}": ${resolutionText} (Last-Write-Wins)`;
}

