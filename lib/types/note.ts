export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  modified_at: string;
  archived?: boolean;
  deleted?: boolean;
}

export type CreateNoteInput = Omit<Note, 'id' | 'created_at' | 'modified_at' | 'archived' | 'deleted'>;

export type UpdateNoteInput = Partial<Pick<Note, 'title' | 'content' | 'archived' | 'deleted'>>;

export type NoteView = 'all' | 'archived' | 'trash';

