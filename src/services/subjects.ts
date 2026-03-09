import { supabase } from './supabase';
import { Subject, SubjectCategory } from '../types';
import { SUBJECTS, SUBJECT_CATEGORIES } from '../constants/subjects';

// Local subject service - uses local data initially
export class SubjectService {
  // Get subjects based on user's cycle and option
  static getSubjectsByCycleAndOption(cycle: 'O_LEVEL' | 'A_LEVEL', option: 'SCIENCE' | 'ARTS'): Subject[] {
    return SUBJECTS.filter(subject => subject.cycle === cycle && subject.option === option)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  // Get categories based on user's cycle and option
  static getCategoriesByCycleAndOption(cycle: 'O_LEVEL' | 'A_LEVEL', option: 'SCIENCE' | 'ARTS'): SubjectCategory[] {
    return SUBJECT_CATEGORIES.filter(category => category.cycle === cycle && category.option === option)
      .sort((a, b) => a.order - b.order);
  }

  // Get subjects by category
  static getSubjectsByCategory(category: string, cycle: 'O_LEVEL' | 'A_LEVEL', option: 'SCIENCE' | 'ARTS'): Subject[] {
    return SUBJECTS.filter(subject => 
      subject.category === category && 
      subject.cycle === cycle && 
      subject.option === option
    ).sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  // Get subject by ID
  static getSubjectById(id: string): Subject | null {
    return SUBJECTS.find(subject => subject.id === id) || null;
  }

  // Get category by ID
  static getCategoryById(id: string): SubjectCategory | null {
    return SUBJECT_CATEGORIES.find(category => category.id === id) || null;
  }

  // Future Supabase integration methods (for when we need cloud storage)
  static async syncSubjectsToSupabase(): Promise<{ error: Error | null }> {
    try {
      // This would sync local subjects to Supabase
      // Implementation for future use when we need cloud storage
      
      // Example implementation:
      // const { error } = await supabase.from('subjects').upsert(SUBJECTS);
      // if (error) throw error;
      
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  static async syncCategoriesToSupabase(): Promise<{ error: Error | null }> {
    try {
      // This would sync local categories to Supabase
      // Implementation for future use when we need cloud storage
      
      // Example implementation:
      // const { error } = await supabase.from('subject_categories').upsert(SUBJECT_CATEGORIES);
      // if (error) throw error;
      
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  // Get subjects from Supabase (for future use)
  static async getSubjectsFromSupabase(cycle: 'O_LEVEL' | 'A_LEVEL', option: 'SCIENCE' | 'ARTS'): Promise<{ subjects: Subject[]; error: Error | null }> {
    try {
      // Future implementation for fetching from Supabase
      // const { data, error } = await supabase
      //   .from('subjects')
      //   .select('*')
      //   .eq('cycle', cycle)
      //   .eq('option', option)
      //   .order('order');
      
      // if (error) throw error;
      
      // For now, return local data
      const subjects = this.getSubjectsByCycleAndOption(cycle, option);
      return { subjects, error: null };
    } catch (error) {
      return { subjects: [], error: error as Error };
    }
  }
}
