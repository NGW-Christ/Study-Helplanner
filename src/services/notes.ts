import { supabase } from './supabase';

export interface Note {
  id: string;
  user_id: string;
  subject_id: string;
  title: string;
  content: string;
  topic?: string;
  created_at?: string;
  updated_at?: string;
}

export class NotesService {
  // Create a new note
  static async createNote(noteData: Omit<Note, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Note | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('study_materials')
        .insert({
          user_id: user.id,
          type: 'note',
          title: noteData.title,
          content: noteData.content,
          subject_id: noteData.subject_id,
          metadata: noteData.topic ? { topic: noteData.topic } : null,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating note:', error);
      return null;
    }
  }

  // Get user's notes
  static async getUserNotes(subjectId?: string): Promise<Note[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('study_materials')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'note');

      if (subjectId) {
        query = query.eq('subject_id', subjectId);
      }

      const { data, error } = await query
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching notes:', error);
      return [];
    }
  }

  // Update a note
  static async updateNote(noteId: string, updates: Partial<Note>): Promise<Note | null> {
    try {
      const updateData: any = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      if (updates.topic) {
        updateData.metadata = { topic: updates.topic };
        delete updateData.topic;
      }

      const { data, error } = await supabase
        .from('study_materials')
        .update(updateData)
        .eq('id', noteId)
        .eq('type', 'note')
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating note:', error);
      return null;
    }
  }

  // Delete a note
  static async deleteNote(noteId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('study_materials')
        .delete()
        .eq('id', noteId)
        .eq('type', 'note');

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting note:', error);
      return false;
    }
  }

  // Search notes
  static async searchNotes(searchTerm: string, subjectId?: string): Promise<Note[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('study_materials')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'note')
        .or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);

      if (subjectId) {
        query = query.eq('subject_id', subjectId);
      }

      const { data, error } = await query
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching notes:', error);
      return [];
    }
  }

  // Get notes by topic
  static async getNotesByTopic(topic: string, subjectId?: string): Promise<Note[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('study_materials')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'note')
        .eq('metadata->>topic', topic);

      if (subjectId) {
        query = query.eq('subject_id', subjectId);
      }

      const { data, error } = await query
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching notes by topic:', error);
      return [];
    }
  }
}
