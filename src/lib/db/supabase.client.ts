import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  LifeOSDatabase, Category, Subject, Module, Lecture, 
  TimetableTemplate, TimetableBlock, WeeklyGoals, MockTest, UserSettings 
} from './db.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return supabaseUrl.trim() !== '' && supabaseAnonKey.trim() !== '';
};

export class SupabaseLifeOSDatabase implements LifeOSDatabase {
  private client: SupabaseClient;

  constructor() {
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.");
    }
    this.client = createClient(supabaseUrl, supabaseAnonKey);
  }

  // Helper to fetch user ID
  private async getUserId(): Promise<string | null> {
    const { data: { user } } = await this.client.auth.getUser();
    return user ? user.id : null;
  }

  // --- Categories ---
  async getCategories(): Promise<Category[]> {
    const { data, error } = await this.client
      .from('categories')
      .select('*')
      .order('is_custom', { ascending: true })
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }
  async addCategory(category: Omit<Category, 'id'>): Promise<Category> {
    const userId = await this.getUserId();
    const { data, error } = await this.client
      .from('categories')
      .insert([{ ...category, user_id: userId }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  async updateCategory(id: string, category: Partial<Category>): Promise<Category> {
    const { data, error } = await this.client
      .from('categories')
      .update(category)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  async deleteCategory(id: string): Promise<void> {
    const { error } = await this.client
      .from('categories')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // --- Subjects ---
  async getSubjects(): Promise<Subject[]> {
    const { data, error } = await this.client
      .from('subjects')
      .select('*')
      .order('is_archived', { ascending: true })
      .order('priority', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
  async addSubject(subject: Omit<Subject, 'id'>): Promise<Subject> {
    const userId = await this.getUserId();
    const { data, error } = await this.client
      .from('subjects')
      .insert([{ ...subject, user_id: userId }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  async updateSubject(id: string, subject: Partial<Subject>): Promise<Subject> {
    const { data, error } = await this.client
      .from('subjects')
      .update(subject)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  async deleteSubject(id: string): Promise<void> {
    const { error } = await this.client
      .from('subjects')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
  async duplicateSubject(id: string): Promise<Subject> {
    // Rely on an RPC function in Supabase database OR handle on client
    const { data: sub, error: subErr } = await this.client
      .from('subjects')
      .select('*')
      .eq('id', id)
      .single();
    if (subErr) throw subErr;

    const newSub = await this.addSubject({
      name: `${sub.name} (Copy)`,
      color: sub.color,
      priority: sub.priority,
      status: 'Not Started',
      target_completion_date: sub.target_completion_date,
      remarks: sub.remarks,
      is_archived: false
    });

    const { data: modules, error: modErr } = await this.client
      .from('modules')
      .select('*')
      .eq('subject_id', id);
    if (modErr) throw modErr;

    for (const mod of modules || []) {
      const newMod = await this.addModule({
        subject_id: newSub.id,
        name: mod.name,
        lecture_count: mod.lecture_count,
        current_lecture: 0,
        status: 'Not Started',
        pyqs_completed: false,
        revision_completed: false
      });

      const { data: lectures, error: lecErr } = await this.client
        .from('lectures')
        .select('*')
        .eq('module_id', mod.id);
      if (lecErr) throw lecErr;

      for (const lec of lectures || []) {
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
    let query = this.client.from('modules').select('*');
    if (subjectId) {
      query = query.eq('subject_id', subjectId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
  async addModule(module: Omit<Module, 'id'>): Promise<Module> {
    const { data, error } = await this.client
      .from('modules')
      .insert([module])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  async updateModule(id: string, module: Partial<Module>): Promise<Module> {
    const { data, error } = await this.client
      .from('modules')
      .update(module)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  async deleteModule(id: string): Promise<void> {
    const { error } = await this.client
      .from('modules')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // --- Lectures ---
  async getLectures(moduleId?: string): Promise<Lecture[]> {
    let query = this.client.from('lectures').select('*').order('lecture_number', { ascending: true });
    if (moduleId) {
      query = query.eq('module_id', moduleId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
  async addLecture(lecture: Omit<Lecture, 'id'>): Promise<Lecture> {
    const { data, error } = await this.client
      .from('lectures')
      .insert([lecture])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  async updateLecture(id: string, lecture: Partial<Lecture>): Promise<Lecture> {
    const { data, error } = await this.client
      .from('lectures')
      .update(lecture)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  async deleteLecture(id: string): Promise<void> {
    const { error } = await this.client
      .from('lectures')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // --- Timetable Templates ---
  async getTimetableTemplates(): Promise<TimetableTemplate[]> {
    const { data, error } = await this.client
      .from('timetable_templates')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }
  async addTimetableTemplate(template: Omit<TimetableTemplate, 'id'>): Promise<TimetableTemplate> {
    const userId = await this.getUserId();
    const { data, error } = await this.client
      .from('timetable_templates')
      .insert([{ ...template, user_id: userId }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  async updateTimetableTemplate(id: string, template: Partial<TimetableTemplate>): Promise<TimetableTemplate> {
    const { data, error } = await this.client
      .from('timetable_templates')
      .update(template)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  async deleteTimetableTemplate(id: string): Promise<void> {
    const { error } = await this.client
      .from('timetable_templates')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
  async duplicateTimetableTemplate(id: string, newName: string): Promise<TimetableTemplate> {
    const newTpl = await this.addTimetableTemplate({ name: newName, is_active: false });
    const blocks = await this.getTimetableBlocks({ template_id: id });
    
    const userId = await this.getUserId();
    const duplicateBlocks = blocks.map(b => ({
      template_id: newTpl.id,
      user_id: userId,
      day_of_week: b.day_of_week,
      start_time: b.start_time,
      end_time: b.end_time,
      title: b.title,
      category_id: b.category_id,
      color: b.color,
      icon: b.icon,
      notes: b.notes,
      study_subject_id: b.study_subject_id,
      study_module_id: b.study_module_id,
      study_lecture_id: b.study_lecture_id,
      study_goal_type: b.study_goal_type,
      remarks: b.remarks
    }));

    if (duplicateBlocks.length > 0) {
      const { error } = await this.client.from('timetable_blocks').insert(duplicateBlocks);
      if (error) throw error;
    }

    return newTpl;
  }
  async setActiveTemplate(id: string | null): Promise<void> {
    const userId = await this.getUserId();
    // Transaction-like updates
    const { error: resetError } = await this.client
      .from('timetable_templates')
      .update({ is_active: false })
      .eq('user_id', userId);
    if (resetError) throw resetError;

    if (id) {
      const { error: setError } = await this.client
        .from('timetable_templates')
        .update({ is_active: true })
        .eq('id', id);
      if (setError) throw setError;
    }
  }

  // --- Timetable Blocks ---
  async getTimetableBlocks(filter?: { template_id?: string | null; day_of_week?: number | null; date?: string | null }): Promise<TimetableBlock[]> {
    let query = this.client.from('timetable_blocks').select('*');
    
    if (filter) {
      if (filter.template_id !== undefined) {
        if (filter.template_id === null) {
          query = query.is('template_id', null);
        } else {
          query = query.eq('template_id', filter.template_id);
        }
      }
      if (filter.day_of_week !== undefined && filter.day_of_week !== null) {
        query = query.eq('day_of_week', filter.day_of_week);
      }
      if (filter.date !== undefined && filter.date !== null) {
        query = query.eq('date', filter.date);
      }
    }

    const { data, error } = await query.order('start_time', { ascending: true });
    if (error) throw error;
    return data || [];
  }
  async addTimetableBlock(block: Omit<TimetableBlock, 'id'>): Promise<TimetableBlock> {
    const userId = await this.getUserId();
    const { data, error } = await this.client
      .from('timetable_blocks')
      .insert([{ ...block, user_id: userId }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  async updateTimetableBlock(id: string, block: Partial<TimetableBlock>): Promise<TimetableBlock> {
    const { data, error } = await this.client
      .from('timetable_blocks')
      .update(block)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  async deleteTimetableBlock(id: string): Promise<void> {
    const { error } = await this.client
      .from('timetable_blocks')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
  async copyTimetableToDay(fromDay: number, toDay: number, templateId: string): Promise<void> {
    const blocks = await this.getTimetableBlocks({ template_id: templateId, day_of_week: fromDay });
    const userId = await this.getUserId();
    
    // Clear toDay blocks in template
    const { error: deleteErr } = await this.client
      .from('timetable_blocks')
      .delete()
      .eq('template_id', templateId)
      .eq('day_of_week', toDay);
    if (deleteErr) throw deleteErr;

    const copyBlocks = blocks.map(b => ({
      template_id: templateId,
      user_id: userId,
      day_of_week: toDay,
      start_time: b.start_time,
      end_time: b.end_time,
      title: b.title,
      category_id: b.category_id,
      color: b.color,
      icon: b.icon,
      notes: b.notes,
      study_subject_id: b.study_subject_id,
      study_module_id: b.study_module_id,
      study_lecture_id: b.study_lecture_id,
      study_goal_type: b.study_goal_type,
      remarks: b.remarks
    }));

    if (copyBlocks.length > 0) {
      const { error: insertErr } = await this.client
        .from('timetable_blocks')
        .insert(copyBlocks);
      if (insertErr) throw insertErr;
    }
  }
  async generateDayFromActiveTemplate(dateStr: string): Promise<void> {
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();
    
    // Check if blocks exist for this date
    const existing = await this.getTimetableBlocks({ date: dateStr });
    if (existing.length > 0) return;

    // Get active template
    const templates = await this.getTimetableTemplates();
    const active = templates.find(t => t.is_active);
    if (!active) return;

    // Get active blocks for dayOfWeek
    const blocks = await this.getTimetableBlocks({ template_id: active.id, day_of_week: dayOfWeek });
    const userId = await this.getUserId();

    const insertBlocks = blocks.map(b => ({
      user_id: userId,
      date: dateStr,
      template_id: null,
      day_of_week: null,
      start_time: b.start_time,
      end_time: b.end_time,
      title: b.title,
      category_id: b.category_id,
      color: b.color,
      icon: b.icon,
      notes: b.notes,
      study_subject_id: b.study_subject_id,
      study_module_id: b.study_module_id,
      study_lecture_id: b.study_lecture_id,
      study_goal_type: b.study_goal_type,
      remarks: b.remarks,
      completed: false
    }));

    if (insertBlocks.length > 0) {
      const { error } = await this.client.from('timetable_blocks').insert(insertBlocks);
      if (error) throw error;
    }
  }

  // --- Weekly Goals ---
  async getWeeklyGoals(startDateStr: string): Promise<WeeklyGoals> {
    const { data, error } = await this.client
      .from('weekly_goals')
      .select('*')
      .eq('start_date', startDateStr)
      .maybeSingle();

    if (error) throw error;
    if (data) return data;

    // Seeding empty weekly goal
    const userId = await this.getUserId();
    const date = new Date(startDateStr);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 6);
    
    const newGoals = {
      user_id: userId,
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

    const { data: inserted, error: insertError } = await this.client
      .from('weekly_goals')
      .insert([newGoals])
      .select()
      .single();

    if (insertError) throw insertError;
    return inserted;
  }
  async saveWeeklyGoals(goals: WeeklyGoals): Promise<WeeklyGoals> {
    const userId = await this.getUserId();
    const { data, error } = await this.client
      .from('weekly_goals')
      .upsert({ ...goals, user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // --- Mock Tests ---
  async getMockTests(): Promise<MockTest[]> {
    const { data, error } = await this.client
      .from('mock_tests')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  }
  async addMockTest(test: Omit<MockTest, 'id'>): Promise<MockTest> {
    const userId = await this.getUserId();
    const { data, error } = await this.client
      .from('mock_tests')
      .insert([{ ...test, user_id: userId }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
  async updateMockTest(id: string, test: Partial<MockTest>): Promise<MockTest> {
    const { data, error } = await this.client
      .from('mock_tests')
      .update(test)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
  async deleteMockTest(id: string): Promise<void> {
    const { error } = await this.client
      .from('mock_tests')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // --- User Settings ---
  async getSettings(): Promise<UserSettings> {
    const userId = await this.getUserId();
    const { data, error } = await this.client
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    if (data) return data;

    // Seeding default settings
    const defaultSettings = {
      user_id: userId,
      target_date: '2027-02-01',
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

    const { data: inserted, error: insertError } = await this.client
      .from('user_settings')
      .insert([defaultSettings])
      .select()
      .single();

    if (insertError) throw insertError;
    return inserted;
  }
  async updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    const userId = await this.getUserId();
    const { data, error } = await this.client
      .from('user_settings')
      .update(settings)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
