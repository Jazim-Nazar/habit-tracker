import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../lib/db';
import {
  Category, Subject, Module, Lecture,
  TimetableTemplate, TimetableBlock, WeeklyGoals, MockTest, UserSettings
} from '../lib/db/db.types';

interface DatabaseContextType {
  loading: boolean;
  settings: UserSettings | null;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  categories: Category[];
  addCategory: (category: Omit<Category, 'id'>) => Promise<Category>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  subjects: Subject[];
  addSubject: (subject: Omit<Subject, 'id'>) => Promise<Subject>;
  updateSubject: (id: string, subject: Partial<Subject>) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  duplicateSubject: (id: string) => Promise<void>;
  modules: Module[];
  addModule: (module: Omit<Module, 'id'>) => Promise<Module>;
  updateModule: (id: string, module: Partial<Module>) => Promise<void>;
  deleteModule: (id: string) => Promise<void>;
  lectures: Lecture[];
  addLecture: (lecture: Omit<Lecture, 'id'>) => Promise<Lecture>;
  updateLecture: (id: string, lecture: Partial<Lecture>) => Promise<void>;
  deleteLecture: (id: string) => Promise<void>;
  templates: TimetableTemplate[];
  addTemplate: (template: Omit<TimetableTemplate, 'id'>) => Promise<TimetableTemplate>;
  updateTemplate: (id: string, template: Partial<TimetableTemplate>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  duplicateTemplate: (id: string, name: string) => Promise<void>;
  setActiveTemplate: (id: string | null) => Promise<void>;
  timetableBlocks: TimetableBlock[];
  loadTimetableBlocks: (dateStr?: string, templateId?: string | null) => Promise<void>;
  addTimetableBlock: (block: Omit<TimetableBlock, 'id'>) => Promise<TimetableBlock>;
  updateTimetableBlock: (id: string, block: Partial<TimetableBlock>) => Promise<void>;
  deleteTimetableBlock: (id: string) => Promise<void>;
  copyTimetableToDay: (fromDay: number, toDay: number, templateId: string) => Promise<void>;
  generateDayFromActiveTemplate: (dateStr: string) => Promise<void>;
  weeklyGoals: WeeklyGoals | null;
  loadWeeklyGoals: (startDateStr: string) => Promise<void>;
  saveWeeklyGoals: (goals: WeeklyGoals) => Promise<void>;
  mockTests: MockTest[];
  addMockTest: (test: Omit<MockTest, 'id'>) => Promise<MockTest>;
  updateMockTest: (id: string, test: Partial<MockTest>) => Promise<void>;
  deleteMockTest: (id: string) => Promise<void>;
  refreshAll: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [templates, setTemplates] = useState<TimetableTemplate[]>([]);
  const [timetableBlocks, setTimetableBlocks] = useState<TimetableBlock[]>([]);
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoals | null>(null);
  const [mockTests, setMockTests] = useState<MockTest[]>([]);

  const refreshAll = async () => {
    try {
      setLoading(true);
      const [cats, subs, mods, lecs, tpls, mocks, setts] = await Promise.all([
        db.getCategories(),
        db.getSubjects(),
        db.getModules(),
        db.getLectures(),
        db.getTimetableTemplates(),
        db.getMockTests(),
        db.getSettings()
      ]);
      setCategories(cats);
      setSubjects(subs);
      setModules(mods);
      setLectures(lecs);
      setTemplates(tpls);
      setMockTests(mocks);
      setSettings(setts);

      if (setts?.accent_color) applyAccentColor(setts.accent_color);
      if (setts?.theme) applyTheme(setts.theme);
    } catch (e) {
      console.error('Error loading LifeOS database:', e);
    } finally {
      setLoading(false);
    }
  };

  const applyAccentColor = (colorName: string) => {
    const root = document.documentElement;
    const colors: Record<string, string> = {
      violet: '263 70% 50%',
      emerald: '142 71% 45%',
      indigo: '239 84% 50%',
      rose: '346 84% 55%',
      amber: '38 92% 50%',
      sky: '199 89% 48%',
      crimson: '348 83% 47%'
    };
    const activeColor = colors[colorName] || colors.violet;
    root.style.setProperty('--primary', activeColor);
    root.style.setProperty('--ring', activeColor);
  };

  const applyTheme = (theme: 'dark' | 'light') => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  };

  useEffect(() => { refreshAll(); }, []);

  // --- Settings ---
  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    const updated = await db.updateSettings(newSettings);
    setSettings(updated);
    if (updated.accent_color) applyAccentColor(updated.accent_color);
    if (updated.theme) applyTheme(updated.theme);
  };

  // --- Categories ---
  const addCategory = async (cat: Omit<Category, 'id'>) => {
    const res = await db.addCategory(cat);
    setCategories(prev => [...prev, res]);
    return res;
  };
  const updateCategory = async (id: string, cat: Partial<Category>) => {
    const res = await db.updateCategory(id, cat);
    setCategories(prev => prev.map(x => x.id === id ? res : x));
  };
  const deleteCategory = async (id: string) => {
    await db.deleteCategory(id);
    setCategories(prev => prev.filter(x => x.id !== id));
  };

  // --- Subjects ---
  const addSubject = async (sub: Omit<Subject, 'id'>) => {
    const res = await db.addSubject(sub);
    setSubjects(prev => [...prev, res]);
    return res;
  };
  const updateSubject = async (id: string, sub: Partial<Subject>) => {
    const res = await db.updateSubject(id, sub);
    setSubjects(prev => prev.map(x => x.id === id ? res : x));
    const [mods, lecs] = await Promise.all([db.getModules(), db.getLectures()]);
    setModules(mods);
    setLectures(lecs);
  };
  const deleteSubject = async (id: string) => {
    await db.deleteSubject(id);
    setSubjects(prev => prev.filter(x => x.id !== id));
    const [mods, lecs] = await Promise.all([db.getModules(), db.getLectures()]);
    setModules(mods);
    setLectures(lecs);
  };
  const duplicateSubject = async (id: string) => {
    await db.duplicateSubject(id);
    const [subs, mods, lecs] = await Promise.all([db.getSubjects(), db.getModules(), db.getLectures()]);
    setSubjects(subs);
    setModules(mods);
    setLectures(lecs);
  };

  // --- Modules ---
  const addModule = async (mod: Omit<Module, 'id'>) => {
    const res = await db.addModule(mod);
    setModules(prev => [...prev, res]);
    return res;
  };
  const updateModule = async (id: string, mod: Partial<Module>) => {
    const res = await db.updateModule(id, mod);
    setModules(prev => prev.map(x => x.id === id ? res : x));
    const subjectId = res.subject_id;
    const subjectModules = await db.getModules(subjectId);
    const allCompleted = subjectModules.every(m => m.status === 'Completed');
    const allNotStarted = subjectModules.every(m => m.status === 'Not Started');
    let targetStatus: Subject['status'] = 'In Progress';
    if (allCompleted) targetStatus = 'Completed';
    else if (allNotStarted) targetStatus = 'Not Started';
    await db.updateSubject(subjectId, { status: targetStatus });
    const [subs, lecs] = await Promise.all([db.getSubjects(), db.getLectures()]);
    setSubjects(subs);
    setLectures(lecs);
  };
  const deleteModule = async (id: string) => {
    await db.deleteModule(id);
    setModules(prev => prev.filter(x => x.id !== id));
    const lecs = await db.getLectures();
    setLectures(lecs);
  };

  // --- Lectures ---
  const addLecture = async (lec: Omit<Lecture, 'id'>) => {
    const res = await db.addLecture(lec);
    setLectures(prev => [...prev, res]);
    return res;
  };
  const updateLecture = async (id: string, lec: Partial<Lecture>) => {
    const res = await db.updateLecture(id, lec);
    setLectures(prev => prev.map(x => x.id === id ? res : x));
    const moduleId = res.module_id;
    const moduleLectures = await db.getLectures(moduleId);
    const completedLectures = moduleLectures.filter(l => l.status === 'Completed');
    const allLecCompleted = moduleLectures.every(l => l.status === 'Completed');
    const allLecNotStarted = moduleLectures.every(l => l.status === 'Not Started');
    let targetStatus: Module['status'] = 'In Progress';
    if (allLecCompleted) targetStatus = 'Completed';
    else if (allLecNotStarted) targetStatus = 'Not Started';
    const maxCompletedLecNum = completedLectures.length > 0
      ? Math.max(...completedLectures.map(l => l.lecture_number))
      : 0;
    await db.updateModule(moduleId, { current_lecture: maxCompletedLecNum, status: targetStatus });
    const [subs, mods] = await Promise.all([db.getSubjects(), db.getModules()]);
    setSubjects(subs);
    setModules(mods);
  };
  const deleteLecture = async (id: string) => {
    await db.deleteLecture(id);
    setLectures(prev => prev.filter(x => x.id !== id));
  };

  // --- Templates ---
  const addTemplate = async (tpl: Omit<TimetableTemplate, 'id'>) => {
    const res = await db.addTimetableTemplate(tpl);
    setTemplates(prev => [...prev, res]);
    return res;
  };
  const updateTemplate = async (id: string, tpl: Partial<TimetableTemplate>) => {
    const res = await db.updateTimetableTemplate(id, tpl);
    setTemplates(prev => prev.map(x => x.id === id ? res : x));
  };
  const deleteTemplate = async (id: string) => {
    await db.deleteTimetableTemplate(id);
    setTemplates(prev => prev.filter(x => x.id !== id));
  };
  const duplicateTemplate = async (id: string, name: string) => {
    await db.duplicateTimetableTemplate(id, name);
    const tpls = await db.getTimetableTemplates();
    setTemplates(tpls);
  };
  const setActiveTemplate = async (id: string | null) => {
    await db.setActiveTemplate(id);
    const tpls = await db.getTimetableTemplates();
    setTemplates(tpls);
  };

  // --- Timetable Blocks ---
  const loadTimetableBlocks = async (dateStr?: string, templateId?: string | null) => {
    const filter: { date?: string; template_id?: string | null } = {};
    if (dateStr !== undefined) filter.date = dateStr;
    if (templateId !== undefined) filter.template_id = templateId;
    const blocks = await db.getTimetableBlocks(filter);
    setTimetableBlocks(blocks);
  };
  const addTimetableBlock = async (block: Omit<TimetableBlock, 'id'>) => {
    const res = await db.addTimetableBlock(block);
    setTimetableBlocks(prev => [...prev, res].sort((a, b) => a.start_time.localeCompare(b.start_time)));
    return res;
  };
  const updateTimetableBlock = async (id: string, block: Partial<TimetableBlock>) => {
    const res = await db.updateTimetableBlock(id, block);
    setTimetableBlocks(prev => prev.map(x => x.id === id ? res : x).sort((a, b) => a.start_time.localeCompare(b.start_time)));
  };
  const deleteTimetableBlock = async (id: string) => {
    await db.deleteTimetableBlock(id);
    setTimetableBlocks(prev => prev.filter(x => x.id !== id));
  };
  const copyTimetableToDay = async (fromDay: number, toDay: number, templateId: string) => {
    await db.copyTimetableToDay(fromDay, toDay, templateId);
  };
  const generateDayFromActiveTemplate = async (dateStr: string) => {
    await db.generateDayFromActiveTemplate(dateStr);
    await loadTimetableBlocks(dateStr);
  };

  // --- Weekly Goals ---
  const loadWeeklyGoals = async (startDateStr: string) => {
    const res = await db.getWeeklyGoals(startDateStr);
    setWeeklyGoals(res);
  };
  const saveWeeklyGoals = async (goals: WeeklyGoals) => {
    const res = await db.saveWeeklyGoals(goals);
    setWeeklyGoals(res);
  };

  // --- Mock Tests ---
  const addMockTest = async (test: Omit<MockTest, 'id'>) => {
    const res = await db.addMockTest(test);
    setMockTests(prev => [res, ...prev]);
    return res;
  };
  const updateMockTest = async (id: string, test: Partial<MockTest>) => {
    const res = await db.updateMockTest(id, test);
    setMockTests(prev => prev.map(x => x.id === id ? res : x));
  };
  const deleteMockTest = async (id: string) => {
    await db.deleteMockTest(id);
    setMockTests(prev => prev.filter(x => x.id !== id));
  };

  return (
    <DatabaseContext.Provider value={{
      loading, settings, updateSettings,
      categories, addCategory, updateCategory, deleteCategory,
      subjects, addSubject, updateSubject, deleteSubject, duplicateSubject,
      modules, addModule, updateModule, deleteModule,
      lectures, addLecture, updateLecture, deleteLecture,
      templates, addTemplate, updateTemplate, deleteTemplate, duplicateTemplate, setActiveTemplate,
      timetableBlocks, loadTimetableBlocks, addTimetableBlock, updateTimetableBlock, deleteTimetableBlock, copyTimetableToDay, generateDayFromActiveTemplate,
      weeklyGoals, loadWeeklyGoals, saveWeeklyGoals,
      mockTests, addMockTest, updateMockTest, deleteMockTest,
      refreshAll
    }}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};
