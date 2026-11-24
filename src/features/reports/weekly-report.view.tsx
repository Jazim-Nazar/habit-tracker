import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  FileText, Target, Dumbbell, 
  CheckCircle, AlertTriangle, Moon, Clock, ChevronLeft, ChevronRight, Trash2
} from 'lucide-react';
import { useDatabase } from '../../context/database.context';
import { WeeklyGoals } from '../../lib/db/db.types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

// --- Local Date Helpers (Zero UTC drift, strictly Local Machine Time) ---
export const formatLocalDate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseLocalDate = (dateStr: string): Date => {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date();
  }
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0); // Noon to prevent daylight/midnight drift
};

export const getMondayOfWeek = (d: Date): Date => {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);
  const day = date.getDay(); // 0 = Sun, 1 = Mon, ...
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when Sunday
  date.setDate(diff);
  return date;
};

export const addDays = (d: Date, days: number): Date => {
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
};

export const WeeklyReport: React.FC = () => {
  const { 
    timetableBlocks = [], 
    lectures = [], 
    modules = [], 
    subjects = [], 
    categories = [],
    weeklyGoals, 
    loadWeeklyGoals, 
    saveWeeklyGoals 
  } = useDatabase();

  // Initialize synchronously with today's Monday using local machine time
  const [currentMondayStr, setCurrentMondayStr] = useState<string>(() => {
    return formatLocalDate(getMondayOfWeek(new Date()));
  });
  
  const [weeklyNotes, setWeeklyNotes] = useState('');

  // Synchronously compute Sunday from Monday
  const sundayStr = useMemo(() => {
    if (!currentMondayStr) return '';
    const monDate = parseLocalDate(currentMondayStr);
    return formatLocalDate(addDays(monDate, 6));
  }, [currentMondayStr]);

  // Load goals and reflections whenever Monday date changes
  useEffect(() => {
    let isMounted = true;
    if (currentMondayStr && loadWeeklyGoals) {
      loadWeeklyGoals(currentMondayStr).catch((err) => {
        console.error('Failed to load weekly goals:', err);
      });
      const savedNotes = localStorage.getItem(`lifeos_weekly_notes_${currentMondayStr}`) || '';
      if (isMounted) setWeeklyNotes(savedNotes);
    }
    return () => {
      isMounted = false;
    };
  }, [currentMondayStr, loadWeeklyGoals]);

  // Week navigation (Monday +/- 7 days)
  const handlePrevWeek = useCallback(() => {
    const d = parseLocalDate(currentMondayStr);
    setCurrentMondayStr(formatLocalDate(addDays(d, -7)));
  }, [currentMondayStr]);

  const handleNextWeek = useCallback(() => {
    const d = parseLocalDate(currentMondayStr);
    setCurrentMondayStr(formatLocalDate(addDays(d, 7)));
  }, [currentMondayStr]);

  // Filter timetable blocks for this week safely
  const weekBlocks = useMemo(() => {
    if (!currentMondayStr || !sundayStr) return [];
    return timetableBlocks.filter(b => {
      if (!b || !b.date) return false;
      return b.date >= currentMondayStr && b.date <= sundayStr;
    });
  }, [timetableBlocks, currentMondayStr, sundayStr]);

  // Safe category matcher (handles deleted categories and nulls)
  const isBlockInCategory = useCallback((blockCategoryId?: string | null, targetName?: string): boolean => {
    if (!blockCategoryId || !targetName) return false;
    const cat = categories.find(c => c && c.id === blockCategoryId);
    return Boolean(cat && cat.name && cat.name.trim().toLowerCase() === targetName.toLowerCase());
  }, [categories]);

  // Filter study blocks
  const studyBlocks = useMemo(() => {
    return weekBlocks.filter(b => isBlockInCategory(b.category_id, 'Study'));
  }, [weekBlocks, isBlockInCategory]);

  const completedStudyBlocks = useMemo(() => {
    return studyBlocks.filter(b => b.completed);
  }, [studyBlocks]);

  const studyBlocksPct = useMemo(() => {
    if (studyBlocks.length === 0) return 0;
    return Math.round((completedStudyBlocks.length / studyBlocks.length) * 100);
  }, [completedStudyBlocks.length, studyBlocks.length]);

  // Safe duration calculator (handles empty, malformed times and midnight crossovers)
  const calculateHours = useCallback((blocksList: typeof weekBlocks): number => {
    if (!Array.isArray(blocksList) || blocksList.length === 0) return 0;
    let totalMinutes = 0;
    
    blocksList.forEach(b => {
      if (!b.start_time || !b.end_time || typeof b.start_time !== 'string' || typeof b.end_time !== 'string') return;
      const startParts = b.start_time.split(':').map(Number);
      const endParts = b.end_time.split(':').map(Number);
      
      const sh = startParts[0] ?? 0;
      const sm = startParts[1] ?? 0;
      const eh = endParts[0] ?? 0;
      const em = endParts[1] ?? 0;
      
      if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return;

      let duration = (eh * 60 + em) - (sh * 60 + sm);
      if (duration < 0) duration += 24 * 60; // wraps overnight
      totalMinutes += duration;
    });

    return Math.round((totalMinutes / 60) * 10) / 10;
  }, []);

  const actualStudyHours = useMemo(() => calculateHours(completedStudyBlocks), [calculateHours, completedStudyBlocks]);
  const plannedStudyHours = useMemo(() => calculateHours(studyBlocks), [calculateHours, studyBlocks]);

  // Category counts
  const getCategoryCompletionCount = useCallback((catName: string): number => {
    return weekBlocks.filter(b => isBlockInCategory(b.category_id, catName) && b.completed).length;
  }, [weekBlocks, isBlockInCategory]);

  const gymSessions = useMemo(() => getCategoryCompletionCount('Gym'), [getCategoryCompletionCount]);
  const kalariSessions = useMemo(() => getCategoryCompletionCount('Kalari'), [getCategoryCompletionCount]);
  const sleepSessions = useMemo(() => getCategoryCompletionCount('Sleep'), [getCategoryCompletionCount]);
  const revisionSessions = useMemo(() => getCategoryCompletionCount('Revision'), [getCategoryCompletionCount]);
  const mockSessions = useMemo(() => getCategoryCompletionCount('Mock Test'), [getCategoryCompletionCount]);

  // Lectures completed this week
  const lecsCompletedThisWeek = useMemo(() => {
    if (!currentMondayStr || !sundayStr) return [];
    return lectures.filter(l => {
      if (!l || !l.completed_date) return false;
      const dateStr = l.completed_date.split('T')[0];
      return dateStr >= currentMondayStr && dateStr <= sundayStr;
    });
  }, [lectures, currentMondayStr, sundayStr]);

  // Modules completed this week
  const modulesCompletedThisWeek = useMemo(() => {
    if (!currentMondayStr || !sundayStr) return [];
    return modules.filter(m => {
      const modLecs = lectures.filter(l => l && l.module_id === m.id);
      if (modLecs.length === 0) return false;
      const allCompleted = modLecs.every(l => l.status === 'Completed');
      if (!allCompleted) return false;
      
      const completedDates = modLecs.map(l => l.completed_date).filter(Boolean) as string[];
      if (completedDates.length === 0) return false;
      
      const lastCompletedDate = [...completedDates].sort().pop()?.split('T')[0];
      return Boolean(lastCompletedDate && lastCompletedDate >= currentMondayStr && lastCompletedDate <= sundayStr);
    });
  }, [modules, lectures, currentMondayStr, sundayStr]);

  const subjectsStudiedThisWeek = useMemo(() => {
    return subjects.filter(s => {
      return weekBlocks.some(b => b.study_subject_id === s.id && b.completed);
    });
  }, [subjects, weekBlocks]);

  // Backlogs
  const backlogs = useMemo(() => {
    const todayStr = formatLocalDate(new Date());
    return studyBlocks.filter(b => !b.completed && b.date && b.date < todayStr).length;
  }, [studyBlocks]);

  // Recharts Chart Data (7 days Monday - Sunday)
  const barChartData = useMemo(() => {
    if (!currentMondayStr) return [];
    const monDate = parseLocalDate(currentMondayStr);
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return days.map((dayName, idx) => {
      const currentDayStr = formatLocalDate(addDays(monDate, idx));
      const dayBlocks = weekBlocks.filter(b => {
        return b.date === currentDayStr && isBlockInCategory(b.category_id, 'Study') && b.completed;
      });
      return {
        name: dayName,
        hours: calculateHours(dayBlocks)
      };
    });
  }, [currentMondayStr, weekBlocks, isBlockInCategory, calculateHours]);

  // Goal update handlers with null guards
  const handleUpdateGoalField = async (field: keyof WeeklyGoals['goals'], value: number) => {
    if (!weeklyGoals) return;
    const safeValue = isNaN(value) ? 0 : Math.max(0, value);
    const updatedGoals: WeeklyGoals = {
      ...weeklyGoals,
      goals: {
        ...weeklyGoals.goals,
        [field]: safeValue
      }
    };
    await saveWeeklyGoals(updatedGoals);
  };

  const handleAddCustomGoal = async (text: string, target: number) => {
    if (!weeklyGoals || !text.trim()) return;
    const existingCustom = Array.isArray(weeklyGoals.goals?.custom) ? weeklyGoals.goals.custom : [];
    const updatedGoals: WeeklyGoals = {
      ...weeklyGoals,
      goals: {
        ...weeklyGoals.goals,
        custom: [
          ...existingCustom,
          {
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
            text: text.trim(),
            target: isNaN(target) ? 1 : Math.max(1, target),
            current: 0,
            completed: false
          }
        ]
      }
    };
    await saveWeeklyGoals(updatedGoals);
  };

  const handleToggleCustomGoal = async (id: string) => {
    if (!weeklyGoals || !Array.isArray(weeklyGoals.goals?.custom)) return;
    const custom = weeklyGoals.goals.custom.map(g => {
      if (g.id === id) {
        const nextCompleted = !g.completed;
        return { ...g, completed: nextCompleted, current: nextCompleted ? g.target : 0 };
      }
      return g;
    });
    await saveWeeklyGoals({
      ...weeklyGoals,
      goals: { ...weeklyGoals.goals, custom }
    });
  };

  const handleDeleteCustomGoal = async (id: string) => {
    if (!weeklyGoals || !Array.isArray(weeklyGoals.goals?.custom)) return;
    const custom = weeklyGoals.goals.custom.filter(g => g.id !== id);
    await saveWeeklyGoals({
      ...weeklyGoals,
      goals: { ...weeklyGoals.goals, custom }
    });
  };

  const handleSaveNotes = () => {
    if (!currentMondayStr) return;
    localStorage.setItem(`lifeos_weekly_notes_${currentMondayStr}`, weeklyNotes);
  };

  return (
    <div className="space-y-6">
      {/* Date Switcher Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-2xl glass">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="text-primary" />
            Weekly Planner & Report
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5 font-medium">Set weekly goals and review your automatically compiled performance metrics.</p>
        </div>

        <div className="flex items-center gap-3 bg-secondary/50 border border-border/40 px-4 py-2 rounded-xl">
          <button 
            onClick={handlePrevWeek} 
            aria-label="Previous week"
            className="text-muted-foreground hover:text-white transition"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-bold text-white font-mono">{currentMondayStr || '...'} to {sundayStr || '...'}</span>
          <button 
            onClick={handleNextWeek} 
            aria-label="Next week"
            className="text-muted-foreground hover:text-white transition"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Weekly Planner Goals */}
        <div className="p-6 rounded-2xl glass space-y-5">
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Target className="text-primary" size={18} />
            Weekly Goals Planner
          </h3>

          <div className="space-y-4">
            {/* Counter goal inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-secondary/20 border border-border/30 rounded-xl">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Lectures Target</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs font-mono font-bold text-emerald-400">Done: {lecsCompletedThisWeek.length}</span>
                  <input
                    type="number"
                    min="0"
                    value={weeklyGoals?.goals?.lectures ?? 0}
                    onChange={(e) => handleUpdateGoalField('lectures', Number(e.target.value))}
                    className="w-12 bg-secondary text-center text-xs font-semibold text-white rounded p-1 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-secondary/20 border border-border/30 rounded-xl">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Modules Target</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs font-mono font-bold text-emerald-400">Done: {modulesCompletedThisWeek.length}</span>
                  <input
                    type="number"
                    min="0"
                    value={weeklyGoals?.goals?.modules ?? 0}
                    onChange={(e) => handleUpdateGoalField('modules', Number(e.target.value))}
                    className="w-12 bg-secondary text-center text-xs font-semibold text-white rounded p-1 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-secondary/20 border border-border/30 rounded-xl">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Gym Sessions</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs font-mono font-bold text-emerald-400">Done: {gymSessions}</span>
                  <input
                    type="number"
                    min="0"
                    value={weeklyGoals?.goals?.gym ?? 0}
                    onChange={(e) => handleUpdateGoalField('gym', Number(e.target.value))}
                    className="w-12 bg-secondary text-center text-xs font-semibold text-white rounded p-1 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-secondary/20 border border-border/30 rounded-xl">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Kalari Practice</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs font-mono font-bold text-emerald-400">Done: {kalariSessions}</span>
                  <input
                    type="number"
                    min="0"
                    value={weeklyGoals?.goals?.kalari ?? 0}
                    onChange={(e) => handleUpdateGoalField('kalari', Number(e.target.value))}
                    className="w-12 bg-secondary text-center text-xs font-semibold text-white rounded p-1 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-secondary/20 border border-border/30 rounded-xl">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Revisions</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs font-mono font-bold text-emerald-400">Done: {revisionSessions}</span>
                  <input
                    type="number"
                    min="0"
                    value={weeklyGoals?.goals?.revision ?? 0}
                    onChange={(e) => handleUpdateGoalField('revision', Number(e.target.value))}
                    className="w-12 bg-secondary text-center text-xs font-semibold text-white rounded p-1 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-secondary/20 border border-border/30 rounded-xl">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Mock Exams</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs font-mono font-bold text-emerald-400">Done: {mockSessions}</span>
                  <input
                    type="number"
                    min="0"
                    value={weeklyGoals?.goals?.mocks ?? 0}
                    onChange={(e) => handleUpdateGoalField('mocks', Number(e.target.value))}
                    className="w-12 bg-secondary text-center text-xs font-semibold text-white rounded p-1 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Custom dynamic weekly goals checklist */}
            <div className="border-t border-border/20 pt-4 space-y-3">
              <span className="text-xs font-bold text-muted-foreground uppercase">Custom Checklist Goals</span>
              
              {weeklyGoals?.goals?.custom && weeklyGoals.goals.custom.length > 0 ? (
                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                  {weeklyGoals.goals.custom.map((g) => (
                    <div 
                      key={g.id}
                      className="flex items-center justify-between p-2 rounded bg-secondary/30 border border-border/20"
                    >
                      <label className="flex items-center gap-2 text-xs text-white cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={g.completed}
                          onChange={() => handleToggleCustomGoal(g.id)}
                          className="rounded border-border/60 text-primary bg-secondary focus:ring-0 w-3.5 h-3.5"
                        />
                        <span className={g.completed ? 'line-through text-muted-foreground' : ''}>{g.text}</span>
                      </label>

                      <button 
                        onClick={() => handleDeleteCustomGoal(g.id)}
                        className="text-red-400 hover:text-red-300 transition"
                        title="Delete goal"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground italic">No custom goals added for this week.</p>
              )}

              {/* Custom Goal Inline Form */}
              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                <input
                  type="text"
                  id="new-weekly-custom-goal"
                  placeholder="e.g. Finish guitar course"
                  className="flex-1 bg-secondary text-xs text-white border border-border/30 rounded p-1.5 focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const inp = e.currentTarget;
                      if (inp.value.trim()) {
                        handleAddCustomGoal(inp.value, 1);
                        inp.value = '';
                      }
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const inp = document.getElementById('new-weekly-custom-goal') as HTMLInputElement;
                    if (inp && inp.value.trim()) {
                      handleAddCustomGoal(inp.value, 1);
                      inp.value = '';
                    }
                  }}
                  className="bg-primary text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Weekly Report */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl glass space-y-5">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <CheckCircle className="text-primary" size={18} />
              Weekly Performance Summary
            </h3>

            {/* Progress bars & metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Academic report card */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Curriculum Progression</h4>
                
                <div className="space-y-3.5">
                  {/* Study blocks */}
                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1.5">
                      <span className="text-white">Study Blocks Completion</span>
                      <span className="text-primary font-bold">{studyBlocksPct}% ({completedStudyBlocks.length}/{studyBlocks.length})</span>
                    </div>
                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                      <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, studyBlocksPct))}%` }} />
                    </div>
                  </div>

                  {/* Lectures */}
                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1.5">
                      <span className="text-white">Lectures Completed</span>
                      <span className="text-emerald-400 font-bold">{lecsCompletedThisWeek.length} Completed</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground font-semibold">
                      Subjects Studied: {subjectsStudiedThisWeek.map(s => s.name).join(', ') || 'None'}
                    </div>
                  </div>

                  {/* Modules */}
                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1.5">
                      <span className="text-white">Modules Finished</span>
                      <span className="text-sky-400 font-bold">{modulesCompletedThisWeek.length} Modules</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Routine Habits Rollup */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Habit & Routine Rollup</h4>
                
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between p-2.5 rounded bg-secondary/15 border border-border/10">
                    <span className="text-muted-foreground flex items-center gap-1.5"><Dumbbell size={14} className="text-rose-400" /> Gym Attendance</span>
                    <span className="font-semibold text-white font-mono">{gymSessions} Sessions</span>
                  </div>

                  <div className="flex justify-between p-2.5 rounded bg-secondary/15 border border-border/10">
                    <span className="text-muted-foreground flex items-center gap-1.5"><Target size={14} className="text-amber-400" /> Kalari Sessions</span>
                    <span className="font-semibold text-white font-mono">{kalariSessions} Sessions</span>
                  </div>

                  <div className="flex justify-between p-2.5 rounded bg-secondary/15 border border-border/10">
                    <span className="text-muted-foreground flex items-center gap-1.5"><Moon size={14} className="text-indigo-400" /> Sleep Blocks completed</span>
                    <span className="font-semibold text-white font-mono">{sleepSessions} Blocks</span>
                  </div>

                  <div className="flex justify-between p-2.5 rounded bg-secondary/15 border border-border/10">
                    <span className="text-muted-foreground flex items-center gap-1.5"><Clock size={14} className="text-primary" /> Study Duration</span>
                    <span className="font-semibold text-white font-mono">{actualStudyHours} hrs / {plannedStudyHours} planned</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Study Hours Graph */}
            <div className="border-t border-border/20 pt-5">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Daily Study hours</h4>
              <div className="h-44 w-full min-h-[176px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis dataKey="name" stroke="#888" tickLine={false} style={{ fontSize: 11 }} />
                    <YAxis stroke="#888" tickLine={false} style={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#222', borderRadius: 8 }} />
                    <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Backlogs & Reflection Notes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-border/20 pt-5">
              <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 flex items-center gap-3">
                <AlertTriangle className="text-red-400 shrink-0" size={20} />
                <div>
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase">Pending Backlogs</span>
                  <p className="text-md font-bold text-white mt-0.5">{backlogs} study blocks missed</p>
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <span className="text-xs font-bold text-muted-foreground uppercase">Weekly Review & Notes</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Reflect on this week's progress..."
                    value={weeklyNotes}
                    onChange={(e) => setWeeklyNotes(e.target.value)}
                    className="flex-1 bg-secondary text-xs text-white border border-border/30 rounded px-2.5 py-1.5 focus:outline-none"
                  />
                  <button
                    onClick={handleSaveNotes}
                    className="bg-primary text-white text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0 hover:opacity-90 transition"
                  >
                    Save Reflection
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
