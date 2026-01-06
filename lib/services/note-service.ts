

// Read operations
export {
  getAllNotes,
  getArchivedNotes,
  getDeletedNotes,
  getNote,
} from './note-read';

export {
  createNote,
  updateNote,
  deleteNote,
} from './note-crud';

export {
  archiveNote,
  unarchiveNote,
  trashNote,
  restoreNote,
  deleteNotePermanently,
} from './note-lifecycle';

export {
  syncFromServer,
  syncPendingOperations,
} from './note-sync';

export {
  getSyncStatus,
  getPendingSyncOperations,
  getFailedSyncOperations,
} from './sync-manager';
