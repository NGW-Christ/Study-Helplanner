// User types
export interface User {
  id: string;
  email: string;
  cycle: 'O_LEVEL' | 'A_LEVEL';
  option: 'SCIENCE' | 'ARTS';
  created_at: string;
}

// Subject types
export interface Subject {
  id: string;
  name: string;
  category: string;
  cycle: 'O_LEVEL' | 'A_LEVEL';
  option: 'SCIENCE' | 'ARTS';
  description?: string;
  icon?: string;
  color?: string;
  order?: number;
}

// Subject Category types
export interface SubjectCategory {
  id: string;
  name: string;
  cycle: 'O_LEVEL' | 'A_LEVEL';
  option: 'SCIENCE' | 'ARTS';
  order: number;
  color?: string;
  icon?: string;
}

// Study Content types (for future use)
export interface StudyMaterial {
  id: string;
  subject_id: string;
  title: string;
  type: 'summary' | 'notes' | 'hints' | 'plan';
  content: string;
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  created_at: string;
  updated_at: string;
}

// Navigation types
export type RootStackParamList = {
  auth: undefined;
  onboarding: undefined;
  'select-option': { cycle: 'O_LEVEL' | 'A_LEVEL' };
  '(tabs)': undefined;
  focus: undefined;
};
