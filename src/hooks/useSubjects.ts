import { useState, useEffect } from 'react';
import { Subject, SubjectCategory } from '../types';
import { SubjectService } from '../services/subjects';
import { useAuth } from './useAuth';

export const useSubjects = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [categories, setCategories] = useState<SubjectCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSubjectsAndCategories();
    }
  }, [user]);

  const loadSubjectsAndCategories = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get subjects and categories based on user's cycle and option
      const userSubjects = SubjectService.getSubjectsByCycleAndOption(user.cycle, user.option);
      const userCategories = SubjectService.getCategoriesByCycleAndOption(user.cycle, user.option);

      setSubjects(userSubjects);
      setCategories(userCategories);
    } catch (error) {
      console.error('Error loading subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSubjectsByCategory = (category: string): Subject[] => {
    if (!user) return [];
    return SubjectService.getSubjectsByCategory(category, user.cycle, user.option);
  };

  const getSubjectById = (id: string): Subject | null => {
    return SubjectService.getSubjectById(id);
  };

  const getCategoryById = (id: string): SubjectCategory | null => {
    return SubjectService.getCategoryById(id);
  };

  return {
    subjects,
    categories,
    loading,
    getSubjectsByCategory,
    getSubjectById,
    getCategoryById,
    refresh: loadSubjectsAndCategories,
  };
};
