import { Subject, SubjectCategory } from '../types';

// Subject Categories
export const SUBJECT_CATEGORIES: SubjectCategory[] = [
  // O Level - Science Categories
  {
    id: 'cat_1',
    name: 'Mathematics',
    cycle: 'O_LEVEL',
    option: 'SCIENCE',
    order: 1,
    color: '#3498DB',
    icon: 'calculator',
  },
  {
    id: 'cat_2',
    name: 'Sciences',
    cycle: 'O_LEVEL',
    option: 'SCIENCE',
    order: 2,
    color: '#27AE60',
    icon: 'flask',
  },
  {
    id: 'cat_3',
    name: 'Social Sciences',
    cycle: 'O_LEVEL',
    option: 'SCIENCE',
    order: 3,
    color: '#E67E22',
    icon: 'globe',
  },
  {
    id: 'cat_4',
    name: 'Languages',
    cycle: 'O_LEVEL',
    option: 'SCIENCE',
    order: 4,
    color: '#9B59B6',
    icon: 'book',
  },
  {
    id: 'cat_5',
    name: 'Applied Sciences',
    cycle: 'O_LEVEL',
    option: 'SCIENCE',
    order: 5,
    color: '#E74C3C',
    icon: 'microscope',
  },
  {
    id: 'cat_6',
    name: 'Technology & Applied Sciences',
    cycle: 'O_LEVEL',
    option: 'SCIENCE',
    order: 6,
    color: '#34495E',
    icon: 'laptop',
  },

  // O Level - Arts Categories
  {
    id: 'cat_7',
    name: 'Mathematics',
    cycle: 'O_LEVEL',
    option: 'ARTS',
    order: 1,
    color: '#3498DB',
    icon: 'calculator',
  },
  {
    id: 'cat_8',
    name: 'Social Sciences',
    cycle: 'O_LEVEL',
    option: 'ARTS',
    order: 2,
    color: '#E67E22',
    icon: 'globe',
  },
  {
    id: 'cat_9',
    name: 'Languages',
    cycle: 'O_LEVEL',
    option: 'ARTS',
    order: 3,
    color: '#9B59B6',
    icon: 'book',
  },
  {
    id: 'cat_10',
    name: 'Humanities',
    cycle: 'O_LEVEL',
    option: 'ARTS',
    order: 4,
    color: '#16A085',
    icon: 'scroll',
  },
  {
    id: 'cat_11',
    name: 'Sciences',
    cycle: 'O_LEVEL',
    option: 'ARTS',
    order: 5,
    color: '#27AE60',
    icon: 'flask',
  },

  // A Level - Science Categories
  {
    id: 'cat_12',
    name: 'Mathematics',
    cycle: 'A_LEVEL',
    option: 'SCIENCE',
    order: 1,
    color: '#3498DB',
    icon: 'calculator',
  },
  {
    id: 'cat_13',
    name: 'Sciences',
    cycle: 'A_LEVEL',
    option: 'SCIENCE',
    order: 2,
    color: '#27AE60',
    icon: 'flask',
  },
  {
    id: 'cat_14',
    name: 'Applied Sciences',
    cycle: 'A_LEVEL',
    option: 'SCIENCE',
    order: 3,
    color: '#E74C3C',
    icon: 'microscope',
  },
  {
    id: 'cat_15',
    name: 'Technology & Applied Sciences',
    cycle: 'A_LEVEL',
    option: 'SCIENCE',
    order: 4,
    color: '#34495E',
    icon: 'laptop',
  },

  // A Level - Arts Categories
  {
    id: 'cat_16',
    name: 'Mathematics',
    cycle: 'A_LEVEL',
    option: 'ARTS',
    order: 1,
    color: '#3498DB',
    icon: 'calculator',
  },
  {
    id: 'cat_17',
    name: 'Humanities',
    cycle: 'A_LEVEL',
    option: 'ARTS',
    order: 2,
    color: '#16A085',
    icon: 'scroll',
  },
  {
    id: 'cat_18',
    name: 'Languages',
    cycle: 'A_LEVEL',
    option: 'ARTS',
    order: 3,
    color: '#9B59B6',
    icon: 'book',
  },
  {
    id: 'cat_19',
    name: 'Social Sciences',
    cycle: 'A_LEVEL',
    option: 'ARTS',
    order: 4,
    color: '#E67E22',
    icon: 'globe',
  },
  {
    id: 'cat_20',
    name: 'Sciences',
    cycle: 'A_LEVEL',
    option: 'ARTS',
    order: 5,
    color: '#27AE60',
    icon: 'flask',
  },
];

// Subjects Data
export const SUBJECTS: Subject[] = [
  // O Level - Science Subjects
  { id: 'sub_1', name: 'Mathematics', category: 'Mathematics', cycle: 'O_LEVEL', option: 'SCIENCE', description: 'Core mathematics including algebra, geometry, and trigonometry', order: 1 },
  { id: 'sub_2', name: 'Additional Mathematics', category: 'Mathematics', cycle: 'O_LEVEL', option: 'SCIENCE', description: 'Advanced mathematics topics', order: 2 },
  { id: 'sub_3', name: 'Biology', category: 'Sciences', cycle: 'O_LEVEL', option: 'SCIENCE', description: 'Study of living organisms', order: 1 },
  { id: 'sub_4', name: 'Physics', category: 'Sciences', cycle: 'O_LEVEL', option: 'SCIENCE', description: 'Study of matter, energy, and their interactions', order: 2 },
  { id: 'sub_5', name: 'Chemistry', category: 'Sciences', cycle: 'O_LEVEL', option: 'SCIENCE', description: 'Study of substances and their properties', order: 3 },
  { id: 'sub_6', name: 'Economics', category: 'Social Sciences', cycle: 'O_LEVEL', option: 'SCIENCE', description: 'Study of economic systems and principles', order: 1 },
  { id: 'sub_7', name: 'Geography', category: 'Social Sciences', cycle: 'O_LEVEL', option: 'SCIENCE', description: 'Study of Earth\'s physical features and human activity', order: 2 },
  { id: 'sub_8', name: 'English', category: 'Languages', cycle: 'O_LEVEL', option: 'SCIENCE', description: 'English language and literature', order: 1 },
  { id: 'sub_9', name: 'French', category: 'Languages', cycle: 'O_LEVEL', option: 'SCIENCE', description: 'French language and culture', order: 2 },
  { id: 'sub_10', name: 'Human Biology', category: 'Sciences', cycle: 'O_LEVEL', option: 'SCIENCE', description: 'Study of human body systems', order: 4 },
  { id: 'sub_11', name: 'Food and Nutrition', category: 'Applied Sciences', cycle: 'O_LEVEL', option: 'SCIENCE', description: 'Study of food science and nutrition', order: 1 },
  { id: 'sub_12', name: 'Computer Science', category: 'Technology & Applied Sciences', cycle: 'O_LEVEL', option: 'SCIENCE', description: 'Introduction to computer programming and concepts', order: 1 },

  // O Level - Arts Subjects
  { id: 'sub_13', name: 'Mathematics', category: 'Mathematics', cycle: 'O_LEVEL', option: 'ARTS', description: 'Core mathematics for arts students', order: 1 },
  { id: 'sub_14', name: 'Economics', category: 'Social Sciences', cycle: 'O_LEVEL', option: 'ARTS', description: 'Economic principles and systems', order: 1 },
  { id: 'sub_15', name: 'Geography', category: 'Social Sciences', cycle: 'O_LEVEL', option: 'ARTS', description: 'Physical and human geography', order: 2 },
  { id: 'sub_16', name: 'English', category: 'Languages', cycle: 'O_LEVEL', option: 'ARTS', description: 'English language and literature', order: 1 },
  { id: 'sub_17', name: 'French', category: 'Languages', cycle: 'O_LEVEL', option: 'ARTS', description: 'French language studies', order: 2 },
  { id: 'sub_18', name: 'Philosophy', category: 'Humanities', cycle: 'O_LEVEL', option: 'ARTS', description: 'Introduction to philosophical concepts', order: 1 },
  { id: 'sub_19', name: 'Literature', category: 'Humanities', cycle: 'O_LEVEL', option: 'ARTS', description: 'English and world literature', order: 2 },
  { id: 'sub_20', name: 'Commerce', category: 'Social Sciences', cycle: 'O_LEVEL', option: 'ARTS', description: 'Business and commercial studies', order: 3 },
  { id: 'sub_21', name: 'Geology', category: 'Sciences', cycle: 'O_LEVEL', option: 'ARTS', description: 'Study of Earth\'s structure and processes', order: 1 },
  { id: 'sub_22', name: 'Logic', category: 'Humanities', cycle: 'O_LEVEL', option: 'ARTS', description: 'Principles of logical reasoning', order: 3 },
  { id: 'sub_23', name: 'History', category: 'Humanities', cycle: 'O_LEVEL', option: 'ARTS', description: 'World and regional history', order: 4 },
  { id: 'sub_24', name: 'Citizenship', category: 'Social Sciences', cycle: 'O_LEVEL', option: 'ARTS', description: 'Civic education and citizenship', order: 4 },

  // A Level - Science Subjects
  { id: 'sub_25', name: 'Mathematics', category: 'Mathematics', cycle: 'A_LEVEL', option: 'SCIENCE', description: 'Advanced mathematics including calculus', order: 1 },
  { id: 'sub_26', name: 'Further Mathematics', category: 'Mathematics', cycle: 'A_LEVEL', option: 'SCIENCE', description: 'Higher level mathematical concepts', order: 2 },
  { id: 'sub_27', name: 'Physics', category: 'Sciences', cycle: 'A_LEVEL', option: 'SCIENCE', description: 'Advanced physics concepts and applications', order: 1 },
  { id: 'sub_28', name: 'Biology', category: 'Sciences', cycle: 'A_LEVEL', option: 'SCIENCE', description: 'Advanced biological sciences', order: 2 },
  { id: 'sub_29', name: 'Food Science', category: 'Applied Sciences', cycle: 'A_LEVEL', option: 'SCIENCE', description: 'Scientific study of food and nutrition', order: 1 },
  { id: 'sub_30', name: 'ICT', category: 'Technology & Applied Sciences', cycle: 'A_LEVEL', option: 'SCIENCE', description: 'Information and Communication Technology', order: 1 },
  { id: 'sub_31', name: 'Computer Science', category: 'Technology & Applied Sciences', cycle: 'A_LEVEL', option: 'SCIENCE', description: 'Advanced computer science concepts', order: 2 },
  { id: 'sub_32', name: 'Chemistry', category: 'Sciences', cycle: 'A_LEVEL', option: 'SCIENCE', description: 'Advanced chemical principles', order: 3 },

  // A Level - Arts Subjects
  { id: 'sub_33', name: 'Mathematics', category: 'Mathematics', cycle: 'A_LEVEL', option: 'ARTS', description: 'Mathematics for arts students', order: 1 },
  { id: 'sub_34', name: 'History', category: 'Humanities', cycle: 'A_LEVEL', option: 'ARTS', description: 'Advanced historical studies', order: 1 },
  { id: 'sub_35', name: 'Literature', category: 'Humanities', cycle: 'A_LEVEL', option: 'ARTS', description: 'Advanced literary analysis', order: 2 },
  { id: 'sub_36', name: 'Philosophy', category: 'Humanities', cycle: 'A_LEVEL', option: 'ARTS', description: 'Advanced philosophical studies', order: 3 },
  { id: 'sub_37', name: 'French', category: 'Languages', cycle: 'A_LEVEL', option: 'ARTS', description: 'Advanced French language and literature', order: 1 },
  { id: 'sub_38', name: 'Economics', category: 'Social Sciences', cycle: 'A_LEVEL', option: 'ARTS', description: 'Advanced economic theory', order: 1 },
  { id: 'sub_39', name: 'Geography', category: 'Social Sciences', cycle: 'A_LEVEL', option: 'ARTS', description: 'Advanced geographical studies', order: 2 },
  { id: 'sub_40', name: 'Geology', category: 'Sciences', cycle: 'A_LEVEL', option: 'ARTS', description: 'Advanced geological sciences', order: 1 },
];

// Helper functions
export const getSubjectsByCycleAndOption = (cycle: 'O_LEVEL' | 'A_LEVEL', option: 'SCIENCE' | 'ARTS'): Subject[] => {
  return SUBJECTS.filter(subject => subject.cycle === cycle && subject.option === option)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
};

export const getCategoriesByCycleAndOption = (cycle: 'O_LEVEL' | 'A_LEVEL', option: 'SCIENCE' | 'ARTS'): SubjectCategory[] => {
  return SUBJECT_CATEGORIES.filter(category => category.cycle === cycle && category.option === option)
    .sort((a, b) => a.order - b.order);
};

export const getSubjectsByCategory = (category: string, cycle: 'O_LEVEL' | 'A_LEVEL', option: 'SCIENCE' | 'ARTS'): Subject[] => {
  return SUBJECTS.filter(subject => 
    subject.category === category && 
    subject.cycle === cycle && 
    subject.option === option
  ).sort((a, b) => (a.order || 0) - (b.order || 0));
};
