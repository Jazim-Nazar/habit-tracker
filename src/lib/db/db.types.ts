export interface Category {
  id: string;
  user_id?: string;
  name: string;
  color: string;
  icon: string;
  is_custom: boolean;
  created_at?: string;
}

export type SubjectStatus = 'Not Started' | 'In Progress' | 'Completed';
export type SubjectPriority = 'low' | 'medium' | 'high';

export interface Subject {
  id: string;
  user_id?: string;
  name: string;
  color: string;
  priority: SubjectPriority;
  status: SubjectStatus;
  target_completion_date?: string;
  remarks?: string;
  is_archived: boolean;
  created_at?: string;
}

export type ModuleStatus = 'Not Started' | 'In Progress' | 'Completed';

export interface Module {
  id: string;
  subject_id: string;
  name: string;
  lecture_count: number;
  current_lecture: number;
  status: ModuleStatus;
  pyqs_completed: boolean;
  revision_completed: boolean;
  created_at?: string;
}

export type LectureStatus = 'Not Started' | 'In Progress' | 'Completed';

export interface Lecture {
  id: string;
  module_id: string;
  lecture_number: number;
  title: string;
  status: LectureStatus;
  completed_date?: string;
  notes_done: boolean;
  practice_done: boolean;
  pyqs_done: boolean;
  revision_done: boolean;
  remarks?: string;
  created_at?: string;
}

export interface TimetableTemplate {
  id: string;
  user_id?: string;
  name: string;
  is_active: boolean;
  created_at?: string;
}

export type StudyGoalType = 
  | 'Lecture' 
  | 'Practice' 
  | 'Module Practice' 
  | 'PYQs' 
  | 'Revision' 
  | 'Mock' 
  | 'Assignment' 
  | 'Custom';

export interface TimetableBlock {
  id: string;
  user_id?: string;
  template_id?: string | null; // belongs to a template if set
  day_of_week?: number | null;  // 0 = Sunday, 1 = Monday, etc., null if manual override
  date?: string | null;         // YYYY-MM-DD, null if repeating template block
  start_time: string;           // "HH:MM"
  end_time: string;             // "HH:MM"
  title: string;
  category_id?: string | null;
  color?: string;
  icon?: string;
  notes?: string;
  completed: boolean;
  completion_time?: string;
  
  // Study relations
  study_subject_id?: string | null;
  study_module_id?: string | null;
  study_lecture_id?: string | null;
  study_goal_type?: StudyGoalType | null;
  remarks?: string;
  
  created_at?: string;
}

export interface WeeklyGoals {
  id: string;
  user_id?: string;
  start_date: string; // YYYY-MM-DD (Monday)
  end_date: string;   // YYYY-MM-DD (Sunday)
  goals: {
    lectures: number;
    modules: number;
    gym: number;
    kalari: number;
    revision: number;
    mocks: number;
    custom: Array<{ id: string; text: string; target: number; current: number; completed: boolean }>;
  };
  created_at?: string;
}

export interface MockTest {
  id: string;
  user_id?: string;
  name: string;
  date: string; // YYYY-MM-DD
  subject_id?: string | null;
  score: number;
  total_marks: number;
  accuracy?: number; // percentage
  time_taken_minutes?: number;
  weak_areas?: string;
  remarks?: string;
  action_plan?: string;
  created_at?: string;
}

export interface UserSettings {
  id: string;
  user_id?: string;
  target_date?: string; // YYYY-MM-DD count down
  theme: 'dark' | 'light';
  accent_color: string; // violet, emerald, indigo, rose, amber, sky etc.
  widgets_config?: {
    showCountdown: boolean;
    showStreak: boolean;
    showDailyTracker: boolean;
    showQuickActions: boolean;
    showUpcomingDeadlines: boolean;
    showRecentActivity: boolean;
  };
  created_at?: string;
}

// Relational queries custom models (for convenience in rendering)
export interface FullTimetableBlock extends TimetableBlock {
  category?: Category | null;
  subject?: Subject | null;
  module?: Module | null;
  lecture?: Lecture | null;
}

// Database client contract
export interface LifeOSDatabase {
  // Categories
  getCategories(): Promise<Category[]>;
  addCategory(category: Omit<Category, 'id'>): Promise<Category>;
  updateCategory(id: string, category: Partial<Category>): Promise<Category>;
  deleteCategory(id: string): Promise<void>;

  // Subjects
  getSubjects(): Promise<Subject[]>;
  addSubject(subject: Omit<Subject, 'id'>): Promise<Subject>;
  updateSubject(id: string, subject: Partial<Subject>): Promise<Subject>;
  deleteSubject(id: string): Promise<void>;
  duplicateSubject(id: string): Promise<Subject>;

  // Modules
  getModules(subjectId?: string): Promise<Module[]>;
  addModule(module: Omit<Module, 'id'>): Promise<Module>;
  updateModule(id: string, module: Partial<Module>): Promise<Module>;
  deleteModule(id: string): Promise<void>;

  // Lectures
  getLectures(moduleId?: string): Promise<Lecture[]>;
  addLecture(lecture: Omit<Lecture, 'id'>): Promise<Lecture>;
  updateLecture(id: string, lecture: Partial<Lecture>): Promise<Lecture>;
  deleteLecture(id: string): Promise<void>;

  // Timetable templates
  getTimetableTemplates(): Promise<TimetableTemplate[]>;
  addTimetableTemplate(template: Omit<TimetableTemplate, 'id'>): Promise<TimetableTemplate>;
  updateTimetableTemplate(id: string, template: Partial<TimetableTemplate>): Promise<TimetableTemplate>;
  deleteTimetableTemplate(id: string): Promise<void>;
  duplicateTimetableTemplate(id: string, newName: string): Promise<TimetableTemplate>;
  setActiveTemplate(id: string | null): Promise<void>;

  // Timetable blocks
  getTimetableBlocks(filter?: { template_id?: string | null; day_of_week?: number | null; date?: string | null }): Promise<TimetableBlock[]>;
  addTimetableBlock(block: Omit<TimetableBlock, 'id'>): Promise<TimetableBlock>;
  updateTimetableBlock(id: string, block: Partial<TimetableBlock>): Promise<TimetableBlock>;
  deleteTimetableBlock(id: string): Promise<void>;
  copyTimetableToDay(fromDay: number, toDay: number, templateId: string): Promise<void>;
  generateDayFromActiveTemplate(dateStr: string): Promise<void>;

  // Weekly Goals
  getWeeklyGoals(startDateStr: string): Promise<WeeklyGoals>;
  saveWeeklyGoals(goals: WeeklyGoals): Promise<WeeklyGoals>;

  // Mock Tests
  getMockTests(): Promise<MockTest[]>;
  addMockTest(test: Omit<MockTest, 'id'>): Promise<MockTest>;
  updateMockTest(id: string, test: Partial<MockTest>): Promise<MockTest>;
  deleteMockTest(id: string): Promise<void>;

  // User Settings
  getSettings(): Promise<UserSettings>;
  updateSettings(settings: Partial<UserSettings>): Promise<UserSettings>;
}
