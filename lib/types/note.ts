export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  modified_at: string;
}

export type CreateNoteInput = Omit<Note, 'id' | 'created_at' | 'modified_at'>;

export type UpdateNoteInput = Partial<Pick<Note, 'title' | 'content'>>;

