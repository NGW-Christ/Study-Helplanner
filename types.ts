
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

export interface UserProfile {
  full_name: string;
  cycle: Cycle;
  option: Option;
  subjects: string[];
  plan_tier: 'free' | 'premium';
  preferences: UserPreferences;
  daily_ai_count: number;
  last_ai_usage_date: string;
}

export enum AppView {
  DASHBOARD = 'Dashboard',
  PLANNER = 'Planner',
  PAPERS = 'Papers',
  NOTES = 'Notes',
  SUBJECT = 'Subject',
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