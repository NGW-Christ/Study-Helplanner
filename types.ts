
export enum Cycle {
  O_LEVEL = 'O Level (Form 5)',
  A_LEVEL = 'A Level',
}

export enum Option {
  SCIENCE = 'Science',
  ARTS = 'Arts',
}

export interface UserPreferences {
  darkMode: boolean;
  language: 'en' | 'fr';
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  cycle: Cycle;
  option: Option;
  created_at?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  cycle: Cycle | null;
  option: Option | null;
  subjects: string[];
  plan_tier: 'free' | 'premium';
  preferences: UserPreferences;
  daily_ai_count: number;
  last_ai_usage_date: string;
  onboarding_completed: boolean;
  created_at?: string;
  updated_at?: string;
}

export enum AppView {
  DASHBOARD = 'Dashboard',
  PLANNER = 'Planner',
  NOTES = 'Notes',
  SUBJECT = 'Subject',
  STATISTICS = 'Statistics',
}

export enum SubjectActionType {
  SUMMARY = 'summary',
  REVISE = 'revise',
  HINTS = 'hints',
  FLASHCARDS = 'flashcards',
  QUIZ = 'quiz',
  RESOURCES = 'resources',
}

export interface SubjectAction {
  type: SubjectActionType;
  label: string;
  description: string;
  iconName: string;
  promptPlaceholder?: string;
}

export interface FlashcardData {
  question: string;
  answer: string;
  explanation: string;
}

export interface QuizData {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface FocusSessionConfig {
  durationMinutes: number;
}

export interface StudyPlan {
  id: string;
  user_id: string;
  subject: string;
  task_description: string;
  planned_date: string;
  is_completed: boolean;
}
