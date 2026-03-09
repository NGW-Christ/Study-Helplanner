import { useState, useEffect } from 'react';
import { NotesService, Note } from '../services/notes';

export const useNotes = (subjectId?: string) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotes();
  }, [subjectId]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const notesData = await NotesService.getUserNotes(subjectId);
      setNotes(notesData);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNote = async (noteData: Omit<Note, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const newNote = await NotesService.createNote(noteData);
      
      if (newNote) {
        setNotes(prev => [newNote, ...prev]);
        return newNote;
      }
      return null;
    } catch (error) {
      console.error('Error creating note:', error);
      return null;
    }
  };

  const updateNote = async (noteId: string, updates: Partial<Note>) => {
    try {
      const updatedNote = await NotesService.updateNote(noteId, updates);
      
      if (updatedNote) {
        setNotes(prev => 
          prev.map(note => 
            note.id === noteId ? updatedNote : note
          )
        );
        return updatedNote;
      }
      return null;
    } catch (error) {
      console.error('Error updating note:', error);
      return null;
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const success = await NotesService.deleteNote(noteId);
      
      if (success) {
        setNotes(prev => prev.filter(note => note.id !== noteId));
      }
      return success;
    } catch (error) {
      console.error('Error deleting note:', error);
      return false;
    }
  };

  const searchNotes = async (searchTerm: string) => {
    try {
      const searchResults = await NotesService.searchNotes(searchTerm, subjectId);
      return searchResults;
    } catch (error) {
      console.error('Error searching notes:', error);
      return [];
    }
  };

  const getNotesByTopic = async (topic: string) => {
    try {
      const topicNotes = await NotesService.getNotesByTopic(topic, subjectId);
      return topicNotes;
    } catch (error) {
      console.error('Error getting notes by topic:', error);
      return [];
    }
  };

  return {
    notes,
    loading,
    createNote,
    updateNote,
    deleteNote,
    searchNotes,
    getNotesByTopic,
    refreshNotes: loadNotes,
  };
};
