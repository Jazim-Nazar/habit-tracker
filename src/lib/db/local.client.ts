import { 
  LifeOSDatabase, Category, Subject, Module, Lecture, 
  TimetableTemplate, TimetableBlock, WeeklyGoals, MockTest, UserSettings 
} from './db.types';

// Helper to generate IDs
export const generateId = () => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Seed Data
const defaultCategories: Category[] = [
  { id: 'cat-study', name: 'Study', color: '#8b5cf6', icon: 'BookOpen', is_custom: false },
  { id: 'cat-gym', name: 'Gym', color: '#ef4444', icon: 'Dumbbell', is_custom: false },
  { id: 'cat-kalari', name: 'Kalari', color: '#f59e0b', icon: 'Shield', is_custom: false },
  { id: 'cat-revision', name: 'Revision', color: '#10b981', icon: 'RefreshCw', is_custom: false },
  { id: 'cat-sleep', name: 'Sleep', color: '#3b82f6', icon: 'Moon', is_custom: false },
  { id: 'cat-break', name: 'Break', color: '#6b7280', icon: 'Coffee', is_custom: false },
  { id: 'cat-workout', name: 'Workout', color: '#ec4899', icon: 'Zap', is_custom: false },
  { id: 'cat-reading', name: 'Reading', color: '#14b8a6', icon: 'Book', is_custom: false },
  { id: 'cat-mock', name: 'Mock Test', color: '#f97316', icon: 'FileText', is_custom: false },
  { id: 'cat-meals', name: 'Meals', color: '#84cc16', icon: 'Utensils', is_custom: false },
];

const defaultSubjects: Subject[] = [
  { id: 'sub-math', name: 'Engineering Mathematics', color: '#8b5cf6', priority: 'medium', status: 'In Progress', target_completion_date: '2026-10-31', remarks: 'Crucial for scoring. Focus on PYQs.', is_archived: false },
  { id: 'sub-cn', name: 'Computer Networks', color: '#3b82f6', priority: 'high', status: 'In Progress', target_completion_date: '2026-09-15', remarks: 'Finish theory by end of August.', is_archived: false },
];

const defaultModules: Module[] = [
  { id: 'mod-la', subject_id: 'sub-math', name: 'Linear Algebra', lecture_count: 5, current_lecture: 3, status: 'In Progress', pyqs_completed: true, revision_completed: false },
  { id: 'mod-calc', subject_id: 'sub-math', name: 'Calculus', lecture_count: 8, current_lecture: 0, status: 'Not Started', pyqs_completed: false, revision_completed: false },
  { id: 'mod-ip', subject_id: 'sub-cn', name: 'IP Routing & Protocols', lecture_count: 10, current_lecture: 2, status: 'In Progress', pyqs_completed: false, revision_completed: false }
];

const defaultLectures: Lecture[] = [
  { id: 'lec-la-1', module_id: 'mod-la', lecture_number: 1, title: 'Matrices and Determinants', status: 'Completed', completed_date: '2026-07-01T12:00:00Z', notes_done: true, practice_done: true, pyqs_done: true, revision_done: true, remarks: 'Strong command on properties.' },
  { id: 'lec-la-2', module_id: 'mod-la', lecture_number: 2, title: 'Systems of Linear Equations', status: 'Completed', completed_date: '2026-07-03T14:30:00Z', notes_done: true, practice_done: true, pyqs_done: true, revision_done: false, remarks: 'Revise Cramer\'s rule.' },
  { id: 'lec-la-3', module_id: 'mod-la', lecture_number: 3, title: 'Eigenvalues and Eigenvectors', status: 'In Progress', notes_done: true, practice_done: false, pyqs_done: false, revision_done: false, remarks: 'Solve remaining 15 PYQs.' },
  { id: 'lec-la-4', module_id: 'mod-la', lecture_number: 4, title: 'Vector Spaces & Subspaces', status: 'Not Started', notes_done: false, practice_done: false, pyqs_done: false, revision_done: false },
  { id: 'lec-la-5', module_id: 'mod-la', lecture_number: 5, title: 'Linear Transformations', status: 'Not Started', notes_done: false, practice_done: false, pyqs_done: false, revision_done: false },
  
  { id: 'lec-ip-1', module_id: 'mod-ip', lecture_number: 1, title: 'Introduction to Routing', status: 'Completed', completed_date: '2026-07-05T18:00:00Z', notes_done: true, practice_done: false, pyqs_done: false, revision_done: false },
  { id: 'lec-ip-2', module_id: 'mod-ip', lecture_number: 2, title: 'Link State Routing (OSPF)', status: 'In Progress', notes_done: false, practice_done: false, pyqs_done: false, revision_done: false },
];

const defaultTemplates: TimetableTemplate[] = [
  { id: 'tpl-grind', name: 'Grind Routine', is_active: true }
];

const defaultBlocks: TimetableBlock[] = [
  // Monday to Friday blocks
  ...[1, 2, 3, 4, 5].flatMap(day => [
    { id: generateId(), template_id: 'tpl-grind', day_of_week: day, start_time: '06:00', end_time: '07:30', title: 'Sleep/Wakeup', category_id: 'cat-sleep', completed: false },
    { id: generateId(), template_id: 'tpl-grind', day_of_week: day, start_time: '07:30', end_time: '08:30', title: 'Kalari Practice', category_id: 'cat-kalari', completed: false },
    { id: generateId(), template_id: 'tpl-grind', day_of_week: day, start_time: '09:00', end_time: '11:00', title: 'Mathematics Theory', category_id: 'cat-study', study_subject_id: 'sub-math', study_module_id: 'mod-la', study_lecture_id: 'lec-la-3', study_goal_type: 'Lecture' as const, completed: false },
    { id: generateId(), template_id: 'tpl-grind', day_of_week: day, start_time: '11:00', end_time: '11:30', title: 'Coffee Break', category_id: 'cat-break', completed: false },
    { id: generateId(), template_id: 'tpl-grind', day_of_week: day, start_time: '11:30', end_time: '13:00', title: 'IP Routing PYQs', category_id: 'cat-study', study_subject_id: 'sub-cn', study_module_id: 'mod-ip', study_lecture_id: 'lec-ip-2', study_goal_type: 'PYQs' as const, completed: false },
    { id: generateId(), template_id: 'tpl-grind', day_of_week: day, start_time: '13:00', end_time: '14:00', title: 'Lunch & Break', category_id: 'cat-meals', completed: false },
    { id: generateId(), template_id: 'tpl-grind', day_of_week: day, start_time: '14:30', end_time: '16:30', title: 'CN Problem Practice', category_id: 'cat-study', study_subject_id: 'sub-cn', study_module_id: 'mod-ip', study_goal_type: 'Practice' as const, completed: false },
    { id: generateId(), template_id: 'tpl-grind', day_of_week: day, start_time: '17:00', end_time: '18:30', title: 'Strength Training', category_id: 'cat-gym', completed: false },
    { id: generateId(), template_id: 'tpl-grind', day_of_week: day, start_time: '19:30', end_time: '21:00', title: 'General Revision', category_id: 'cat-revision', study_goal_type: 'Revision' as const, completed: false },
    { id: generateId(), template_id: 'tpl-grind', day_of_week: day, start_time: '21:30', end_time: '06:00', title: 'Deep Sleep', category_id: 'cat-sleep', completed: false }
  ]),
  // Saturday & Sunday blocks
  ...[0, 6].flatMap(day => [
    { id: generateId(), template_id: 'tpl-grind', day_of_week: day, start_time: '07:00', end_time: '08:30', title: 'Sleep/Wakeup', category_id: 'cat-sleep', completed: false },
    { id: generateId(), template_id: 'tpl-grind', day_of_week: day, start_time: '09:00', end_time: '12:00', title: 'Weekend Mock Test', category_id: 'cat-mock', study_goal_type: 'Mock' as const, completed: false },
    { id: generateId(), template_id: 'tpl-grind', day_of_week: day, start_time: '13:00', end_time: '14:00', title: 'Lunch & Break', category_id: 'cat-meals', completed: false },
    { id: generateId(), template_id: 'tpl-grind', day_of_week: day, start_time: '15:00', end_time: '17:00', title: 'Mock Test Review', category_id: 'cat-study', study_goal_type: 'Practice' as const, completed: false },
    { id: generateId(), template_id: 'tpl-grind', day_of_week: day, start_time: '18:00', end_time: '20:00', title: 'Non-Fiction Reading', category_id: 'cat-reading', completed: false },
    { id: generateId(), template_id: 'tpl-grind', day_of_week: day, start_time: '21:30', end_time: '07:00', title: 'Deep Sleep', category_id: 'cat-sleep', completed: false }
  ])
];

const defaultSettings: UserSettings = {
  id: 'settings-default',
  target_date: '2027-02-01', // Target Exam Date (e.g. GATE 2027)
  theme: 'dark',
  accent_color: 'violet',
  widgets_config: {
    showCountdown: true,
    showStreak: true,
    showDailyTracker: true,
    showQuickActions: true,
    showUpcomingDeadlines: true,
    showRecentActivity: true
  }
};

const defaultMockTests: MockTest[] = [
  { id: 'mock-1', name: 'Full Test 1 (Math + CN)', date: '2026-07-05', subject_id: null, score: 62, total_marks: 100, accuracy: 78, time_taken_minutes: 165, weak_areas: 'Linear algebra sub-spaces theory questions, IP subnetting calculations', remarks: 'Good speed, silly mistakes in calculus.', action_plan: 'Solve 20 subnetting questions and reread vector spaces theory before the next mock.' }
];

export class LocalLifeOSDatabase implements LifeOSDatabase {
  private initStore<T>(key: string, defaultVal: T): T {
    const val = localStorage.getItem(`lifeos_${key}`);
    if (!val) {
      localStorage.setItem(`lifeos_${key}`, JSON.stringify(defaultVal));
      return defaultVal;
    }
    return JSON.parse(val);
  }

  private saveStore<T>(key: string, data: T): void {
    localStorage.setItem(`lifeos_${key}`, JSON.stringify(data));
  }

  // Generic helpers
  private getTable<T>(name: string, defaults: T[]): T[] {
    return this.initStore<T[]>(name, defaults);
  }

  private saveTable<T>(name: string, data: T[]): void {
    this.saveStore<T[]>(name, data);
  }

  // --- Categories ---
  async getCategories(): Promise<Category[]> {
    return this.getTable('categories', defaultCategories);
  }
  async addCategory(category: Omit<Category, 'id'>): Promise<Category> {
    const table = await this.getCategories();
    const newCat = { ...category, id: generateId() };
    table.push(newCat);
    this.saveTable('categories', table);
    return newCat;
  }
  async updateCategory(id: string, category: Partial<Category>): Promise<Category> {
    const table = await this.getCategories();
    const idx = table.findIndex(x => x.id === id);
    if (idx === -1) throw new Error("Category not found");
    table[idx] = { ...table[idx], ...category };
    this.saveTable('categories', table);
    return table[idx];
  }
  async deleteCategory(id: string): Promise<void> {
    const table = await this.getCategories();
    const filtered = table.filter(x => x.id !== id);
    this.saveTable('categories', filtered);
  }

  // --- Subjects ---
  async getSubjects(): Promise<Subject[]> {
    return this.getTable('subjects', defaultSubjects);
  }
  async addSubject(subject: Omit<Subject, 'id'>): Promise<Subject> {
    const table = await this.getSubjects();
    const newSub = { ...subject, id: generateId(), is_archived: false };
    table.push(newSub);
    this.saveTable('subjects', table);
    return newSub;
  }
  async updateSubject(id: string, subject: Partial<Subject>): Promise<Subject> {
    const table = await this.getSubjects();
    const idx = table.findIndex(x => x.id === id);
    if (idx === -1) throw new Error("Subject not found");
    table[idx] = { ...table[idx], ...subject };
    this.saveTable('subjects', table);
    return table[idx];
  }
  async deleteSubject(id: string): Promise<void> {
    const table = await this.getSubjects();
    const filtered = table.filter(x => x.id !== id);
    this.saveTable('subjects', filtered);
    
    // Cascading delete for modules
    const modules = this.getTable('modules', defaultModules);
    const filteredModules = modules.filter(m => m.subject_id !== id);
    this.saveTable('modules', filteredModules);
  }
  async duplicateSubject(id: string): Promise<Subject> {
    const subjects = await this.getSubjects();
    const sub = subjects.find(x => x.id === id);
    if (!sub) throw new Error("Subject not found");
    
    const newSub = await this.addSubject({
      name: `${sub.name} (Copy)`,
      color: sub.color,
      priority: sub.priority,
      status: 'Not Started',
      target_completion_date: sub.target_completion_date,
      remarks: sub.remarks,
      is_archived: false
    });

    // Duplicate modules as well
    const modules = await this.getModules(id);
    for (const mod of modules) {
      const newMod = await this.addModule({
        subject_id: newSub.id,
        name: mod.name,
        lecture_count: mod.lecture_count,
        current_lecture: 0,
        status: 'Not Started',
        pyqs_completed: false,
        revision_completed: false
      });

      // Duplicate lectures
      const lectures = await this.getLectures(mod.id);
      for (const lec of lectures) {
        await this.addLecture({
          module_id: newMod.id,
          lecture_number: lec.lecture_number,
          title: lec.title,
          status: 'Not Started',
          notes_done: false,
          practice_done: false,
          pyqs_done: false,
          revision_done: false,
          remarks: lec.remarks
        });
      }
    }
    
    return newSub;
  }

  // --- Modules ---
  async getModules(subjectId?: string): Promise<Module[]> {
    const list = this.getTable('modules', defaultModules);
    return subjectId ? list.filter(m => m.subject_id === subjectId) : list;
  }
  async addModule(module: Omit<Module, 'id'>): Promise<Module> {
    const table = this.getTable('modules', defaultModules);
    const newMod = { ...module, id: generateId() };
    table.push(newMod);
    this.saveTable('modules', table);
    return newMod;
  }
  async updateModule(id: string, module: Partial<Module>): Promise<Module> {
    const table = this.getTable('modules', defaultModules);
    const idx = table.findIndex(x => x.id === id);
    if (idx === -1) throw new Error("Module not found");
    table[idx] = { ...table[idx], ...module };
    this.saveTable('modules', table);
    return table[idx];
  }
  async deleteModule(id: string): Promise<void> {
    const table = this.getTable('modules', defaultModules);
    const filtered = table.filter(x => x.id !== id);
    this.saveTable('modules', filtered);
    
    // Cascade delete lectures
    const lectures = this.getTable('lectures', defaultLectures);
    const filteredLectures = lectures.filter(l => l.module_id !== id);
    this.saveTable('lectures', filteredLectures);
  }

  // --- Lectures ---
  async getLectures(moduleId?: string): Promise<Lecture[]> {
    const list = this.getTable('lectures', defaultLectures);
    return moduleId ? list.filter(l => l.module_id === moduleId) : list;
  }
  async addLecture(lecture: Omit<Lecture, 'id'>): Promise<Lecture> {
    const table = this.getTable('lectures', defaultLectures);
    const newLec = { ...lecture, id: generateId() };
    table.push(newLec);
    this.saveTable('lectures', table);
    return newLec;
  }
  async updateLecture(id: string, lecture: Partial<Lecture>): Promise<Lecture> {
    const table = this.getTable('lectures', defaultLectures);
    const idx = table.findIndex(x => x.id === id);
    if (idx === -1) throw new Error("Lecture not found");
    table[idx] = { ...table[idx], ...lecture };
    this.saveTable('lectures', table);
    return table[idx];
  }
  async deleteLecture(id: string): Promise<void> {
    const table = this.getTable('lectures', defaultLectures);
    const filtered = table.filter(x => x.id !== id);
    this.saveTable('lectures', filtered);
  }

  // --- Timetable Templates ---
  async getTimetableTemplates(): Promise<TimetableTemplate[]> {
    return this.getTable('templates', defaultTemplates);
  }
  async addTimetableTemplate(template: Omit<TimetableTemplate, 'id'>): Promise<TimetableTemplate> {
    const table = await this.getTimetableTemplates();
    const newTpl = { ...template, id: generateId(), is_active: false };
    table.push(newTpl);
    this.saveTable('templates', table);
    return newTpl;
  }
  async updateTimetableTemplate(id: string, template: Partial<TimetableTemplate>): Promise<TimetableTemplate> {
    const table = await this.getTimetableTemplates();
    const idx = table.findIndex(x => x.id === id);
    if (idx === -1) throw new Error("Template not found");
    table[idx] = { ...table[idx], ...template };
    this.saveTable('templates', table);
    return table[idx];
  }
  async deleteTimetableTemplate(id: string): Promise<void> {
    const table = await this.getTimetableTemplates();
    const filtered = table.filter(x => x.id !== id);
    this.saveTable('templates', filtered);
    
    // Cascade delete blocks
    const blocks = this.getTable('timetable_blocks', defaultBlocks);
    const filteredBlocks = blocks.filter(b => b.template_id !== id);
    this.saveTable('timetable_blocks', filteredBlocks);
  }
  async duplicateTimetableTemplate(id: string, newName: string): Promise<TimetableTemplate> {
    const newTpl = await this.addTimetableTemplate({ name: newName, is_active: false });
    const blocks = await this.getTimetableBlocks({ template_id: id });
    for (const b of blocks) {
      const { id: _, ...blockWithoutId } = b;
      await this.addTimetableBlock({
        ...blockWithoutId,
        template_id: newTpl.id,
        date: null,
        completed: false,
        completion_time: undefined
      });
    }
    return newTpl;
  }
  async setActiveTemplate(id: string | null): Promise<void> {
    const table = await this.getTimetableTemplates();
    const updated = table.map(t => ({ ...t, is_active: t.id === id }));
    this.saveTable('templates', updated);
  }

  // --- Timetable Blocks ---
  async getTimetableBlocks(filter?: { template_id?: string | null; day_of_week?: number | null; date?: string | null }): Promise<TimetableBlock[]> {
    const list = this.getTable('timetable_blocks', defaultBlocks);
    if (!filter) return list;
    
    return list.filter(b => {
      let match = true;
      if (filter.template_id !== undefined) match = match && b.template_id === filter.template_id;
      if (filter.day_of_week !== undefined) match = match && b.day_of_week === filter.day_of_week;
      if (filter.date !== undefined) match = match && b.date === filter.date;
      return match;
    });
  }
  async addTimetableBlock(block: Omit<TimetableBlock, 'id'>): Promise<TimetableBlock> {
    const table = this.getTable('timetable_blocks', defaultBlocks);
    const newBlock = { ...block, id: generateId() };
    table.push(newBlock);
    this.saveTable('timetable_blocks', table);
    return newBlock;
  }
  async updateTimetableBlock(id: string, block: Partial<TimetableBlock>): Promise<TimetableBlock> {
    const table = this.getTable('timetable_blocks', defaultBlocks);
    const idx = table.findIndex(x => x.id === id);
    if (idx === -1) throw new Error("Timetable block not found");
    table[idx] = { ...table[idx], ...block };
    this.saveTable('timetable_blocks', table);
    return table[idx];
  }
  async deleteTimetableBlock(id: string): Promise<void> {
    const table = this.getTable('timetable_blocks', defaultBlocks);
    const filtered = table.filter(x => x.id !== id);
    this.saveTable('timetable_blocks', filtered);
  }
  async copyTimetableToDay(fromDay: number, toDay: number, templateId: string): Promise<void> {
    const table = this.getTable('timetable_blocks', defaultBlocks);
    const fromBlocks = table.filter(x => x.template_id === templateId && x.day_of_week === fromDay);
    
    // Clear existing blocks for toDay in this template
    const cleanTable = table.filter(x => !(x.template_id === templateId && x.day_of_week === toDay));
    
    // Duplicate the blocks
    const duplicated = fromBlocks.map(b => ({
      ...b,
      id: generateId(),
      day_of_week: toDay,
      completed: false,
      completion_time: undefined
    }));
    
    cleanTable.push(...duplicated);
    this.saveTable('timetable_blocks', cleanTable);
  }
  async generateDayFromActiveTemplate(dateStr: string): Promise<void> {
    // Determine the day of the week (0 = Sun, 1 = Mon, etc.)
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();
    
    const activeTemplates = await this.getTimetableTemplates();
    const active = activeTemplates.find(t => t.is_active);
    if (!active) return;
    
    // Fetch template blocks for this day of week
    const tplBlocks = await this.getTimetableBlocks({ template_id: active.id, day_of_week: dayOfWeek });
    
    // Check if we already have manual blocks generated for this specific date
    const existingDateBlocks = await this.getTimetableBlocks({ date: dateStr });
    if (existingDateBlocks.length > 0) return; // already generated
    
    // Duplicate template blocks into specific date blocks
    for (const b of tplBlocks) {
      const { id: _, ...blockWithoutId } = b;
      await this.addTimetableBlock({
        ...blockWithoutId,
        template_id: null,
        day_of_week: null,
        date: dateStr,
        completed: false,
        completion_time: undefined
      });
    }
  }

  // --- Weekly Goals ---
  async getWeeklyGoals(startDateStr: string): Promise<WeeklyGoals> {
    const list = this.getTable<WeeklyGoals>('weekly_goals', []);
    let goals = list.find(g => g.start_date === startDateStr);
    if (!goals) {
      // Create empty goals for this week
      const date = new Date(startDateStr);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 6);
      
      const newGoals: WeeklyGoals = {
        id: generateId(),
        start_date: startDateStr,
        end_date: endDate.toISOString().split('T')[0],
        goals: {
          lectures: 10,
          modules: 2,
          gym: 4,
          kalari: 3,
          revision: 4,
          mocks: 1,
          custom: []
        }
      };
      
      list.push(newGoals);
      this.saveTable('weekly_goals', list);
      return newGoals;
    }
    return goals;
  }
  async saveWeeklyGoals(goals: WeeklyGoals): Promise<WeeklyGoals> {
    const list = this.getTable<WeeklyGoals>('weekly_goals', []);
    const idx = list.findIndex(x => x.id === goals.id || x.start_date === goals.start_date);
    if (idx !== -1) {
      list[idx] = goals;
    } else {
      list.push(goals);
    }
    this.saveTable('weekly_goals', list);
    return goals;
  }

  // --- Mock Tests ---
  async getMockTests(): Promise<MockTest[]> {
    return this.getTable('mocks', defaultMockTests);
  }
  async addMockTest(test: Omit<MockTest, 'id'>): Promise<MockTest> {
    const table = await this.getMockTests();
    const newTest = { ...test, id: generateId() };
    table.push(newTest);
    this.saveTable('mocks', table);
    return newTest;
  }
  async updateMockTest(id: string, test: Partial<MockTest>): Promise<MockTest> {
    const table = await this.getMockTests();
    const idx = table.findIndex(x => x.id === id);
    if (idx === -1) throw new Error("Mock test not found");
    table[idx] = { ...table[idx], ...test };
    this.saveTable('mocks', table);
    return table[idx];
  }
  async deleteMockTest(id: string): Promise<void> {
    const table = await this.getMockTests();
    const filtered = table.filter(x => x.id !== id);
    this.saveTable('mocks', filtered);
  }

  // --- User Settings ---
  async getSettings(): Promise<UserSettings> {
    return this.initStore<UserSettings>('settings', defaultSettings);
  }
  async updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    this.saveStore('settings', updated);
    return updated;
  }
}
