import { Cycle, Option, SubjectAction, SubjectActionType } from './types';

export const SUBJECTS_CONFIG = {
  [Cycle.O_LEVEL]: {
    [Option.SCIENCE]: [
      'Mathematics',
      'Additional Mathematics',
      'Biology',
      'Physics',
      'Chemistry',
      'Economics',
      'Geography',
      'English',
      'French',
      'Human Biology',
      'Food and Nutrition',
      'Computer Science',
    ],
    [Option.ARTS]: [
      'Mathematics',
      'Economics',
      'Geography',
      'English',
      'French',
      'Philosophy',
      'Literature',
      'Commerce',
      'Geology',
      'Logic',
      'History',
      'Citizenship',
    ],
  },
  [Cycle.A_LEVEL]: {
    [Option.SCIENCE]: [
      'Mathematics',
      'Further Mathematics',
      'Physics',
      'Biology',
      'Food Science',
      'ICT',
      'Computer Science',
      'Chemistry',
    ],
    [Option.ARTS]: [
      'Mathematics',
      'History',
      'Literature',
      'Philosophy',
      'French',
      'Economics',
      'Geography',
      'Geology',
    ],
  },
};

export const SUBJECT_ACTIONS: SubjectAction[] = [
  {
    type: SubjectActionType.SUMMARY,
    label: 'Quick Summary',
    description: 'Get a concise overview of a specific topic.',
    iconName: 'Zap',
    promptPlaceholder: 'Enter the topic name (e.g., Photosynthesis)...',
  },
  {
    type: SubjectActionType.REVISE,
    label: 'Revise Topic',
    description: 'Deep dive into a concept with exam focus.',
    iconName: 'BookOpen',
    promptPlaceholder: 'What specific concept do you want to revise?',
  },
  {
    type: SubjectActionType.HINTS,
    label: 'Exercise Hints',
    description: 'Get unstuck on a problem without the full answer.',
    iconName: 'HelpCircle',
    promptPlaceholder: 'Describe the problem you are stuck on...',
  },
  {
    type: SubjectActionType.FLASHCARDS,
    label: 'Flashcards',
    description: 'Generate interactive cards to test your memory.',
    iconName: 'Layers',
    promptPlaceholder: 'Topic or context for flashcards...',
  },
  {
    type: SubjectActionType.QUIZ,
    label: 'Practice Quiz',
    description: 'Test your knowledge with multiple choice questions.',
    iconName: 'CheckSquare',
    promptPlaceholder: 'What should the quiz cover?',
  },
  {
    type: SubjectActionType.RESOURCES,
    label: 'Resources',
    description: 'View all saved notes and imported materials for this subject.',
    iconName: 'Book',
  },
];

export const FOCUS_DURATIONS = [25, 30, 45, 60];