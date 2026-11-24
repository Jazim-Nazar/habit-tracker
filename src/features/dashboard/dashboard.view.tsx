import React, { useState, useEffect } from 'react';
import { 
  Calendar, Flame, CheckCircle2, Clock, 
  ChevronRight, AlertCircle, Plus, BookOpen, 
  Award, Play, RefreshCw, Layers
} from 'lucide-react';
import { useDatabase } from '../../context/database.context';
import { FullTimetableBlock } from '../../lib/db/db.types';

export const Dashboard: React.FC<{ onViewChange: (view: any) => void }> = ({ onViewChange }) => {
  const { 
    subjects, 
    modules, 
    lectures, 
    categories, 
    settings, 
    timetableBlocks, 
    generateDayFromActiveTemplate,
    updateTimetableBlock,
    mockTests
  } = useDatabase();

  const [time, setTime] = useState(new Date());
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [todayStr, setTodayStr] = useState('');

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Set today date string YYYY-MM-DD
  useEffect(() => {
    const today = new Date();
    const tzOffset = today.getTimezoneOffset() * 60000;
    const localISODate = new Date(today.getTime() - tzOffset).toISOString().split('T')[0];
    setTodayStr(localISODate);
  }, []);

  // Auto-generate today's schedule from template
  useEffect(() => {
    if (todayStr) {
      generateDayFromActiveTemplate(todayStr);
    }
  }, [todayStr]);

  // Countdown calculations
  useEffect(() => {
    if (!settings?.target_date) return;
    
    const calculateCountdown = () => {
      const target = new Date(`${settings.target_date}T00:00:00`);
      const now = new Date();
      const diff = target.getTime() - now.getTime();
      
      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setCountdown({ days, hours, minutes, seconds });
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, [settings?.target_date]);

  // Fetch today's generated blocks
  const todayBlocks = timetableBlocks.filter(b => b.date === todayStr) || [];
  
  // Calculate today's progress
  const completedToday = todayBlocks.filter(b => b.completed).length;
  const totalToday = todayBlocks.length;
  const todayCompletionRate = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  // Streak Calculator
  const [streak, setStreak] = useState(0);
  useEffect(() => {
    // Basic streak calculation: count consecutive past days where at least one block was completed
    const calculateStreak = async () => {
      const allBlocks = timetableBlocks.filter(b => b.date && b.completed);
      if (allBlocks.length === 0) {
        setStreak(0);
        return;
      }

      const completedDatesSet = new Set(allBlocks.map(b => b.date));
      let currentStreak = 0;
      let checkDate = new Date(); // Start checking from today
      
      // If nothing completed today, check yesterday to keep streak alive
      const todayDateStr = checkDate.toISOString().split('T')[0];
      const hasToday = completedDatesSet.has(todayDateStr);
      
      let yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayDateStr = yesterday.toISOString().split('T')[0];
      const hasYesterday = completedDatesSet.has(yesterdayDateStr);

      if (!hasToday && !hasYesterday) {
        setStreak(0);
        return;
      }

      if (!hasToday && hasYesterday) {
        checkDate = yesterday;
      }

      while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (completedDatesSet.has(dateStr)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1); // move back one day
        } else {
          break;
        }
      }
      setStreak(currentStreak);
    };

    calculateStreak();
  }, [timetableBlocks]);

  // Overall Stats
  const totalLectures = lectures.length;
  const completedLectures = lectures.filter(l => l.status === 'Completed').length;
  const overallProgress = totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0;

  // Find current subject, module and lecture active
  const activeLecture = lectures.find(l => l.status === 'In Progress');
  let activeModuleName = 'N/A';
  let activeSubjectName = 'N/A';
  let activeSubjectColor = '#8b5cf6';
  
  if (activeLecture) {
    const parentModule = modules.find(m => m.id === activeLecture.module_id);
    if (parentModule) {
      activeModuleName = parentModule.name;
      const parentSubject = subjects.find(s => s.id === parentModule.subject_id);
      if (parentSubject) {
        activeSubjectName = parentSubject.name;
        activeSubjectColor = parentSubject.color;
      }
    }
  }

  // Format Date Options
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const handleToggleBlock = async (id: string, currentlyCompleted: boolean) => {
    await updateTimetableBlock(id, { 
      completed: !currentlyCompleted,
      completion_time: !currentlyCompleted ? new Date().toISOString() : undefined
    });
  };

  return (
    <div className="space-y-6">
      {/* Welcome & Time Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-6 rounded-2xl glass bg-gradient-to-r from-primary/10 to-transparent">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Welcome to LifeOS</h2>
          <p className="text-sm text-muted-foreground mt-1">{formatDate(time)}</p>
        </div>
        <div className="flex items-center gap-3 bg-secondary/40 border border-border/40 px-5 py-3 rounded-xl">
          <Clock size={20} className="text-primary animate-pulse-slow" />
          <span className="font-mono text-xl font-semibold text-white tabular-nums">{formatTime(time)}</span>
        </div>
      </div>

      {/* Countdown, Streak, Progress Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Countdown */}
        {settings?.widgets_config?.showCountdown && (
          <div className="p-6 rounded-2xl glass flex flex-col justify-between min-h-[160px] relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl transition-all group-hover:bg-primary/10" />
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Countdown to Target</p>
              <h3 className="text-sm text-white/60 font-medium mt-1">
                Target Date: {settings.target_date || 'Not Set'}
              </h3>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-4 text-center">
              <div className="bg-secondary/30 rounded-xl p-2 border border-border/20">
                <div className="text-2xl font-bold text-white font-mono">{String(countdown.days).padStart(2, '0')}</div>
                <div className="text-[10px] text-muted-foreground">Days</div>
              </div>
              <div className="bg-secondary/30 rounded-xl p-2 border border-border/20">
                <div className="text-2xl font-bold text-white font-mono">{String(countdown.hours).padStart(2, '0')}</div>
                <div className="text-[10px] text-muted-foreground">Hrs</div>
              </div>
              <div className="bg-secondary/30 rounded-xl p-2 border border-border/20">
                <div className="text-2xl font-bold text-white font-mono">{String(countdown.minutes).padStart(2, '0')}</div>
                <div className="text-[10px] text-muted-foreground">Mins</div>
              </div>
              <div className="bg-secondary/30 rounded-xl p-2 border border-border/20">
                <div className="text-2xl font-bold text-white font-mono">{String(countdown.seconds).padStart(2, '0')}</div>
                <div className="text-[10px] text-muted-foreground">Secs</div>
              </div>
            </div>
          </div>
        )}

        {/* Streak Widget */}
        {settings?.widgets_config?.showStreak && (
          <div className="p-6 rounded-2xl glass flex flex-col justify-between min-h-[160px] group relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl" />
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Daily Execution Streak</p>
                <h3 className="text-xl font-bold text-white mt-2">
                  {streak} {streak === 1 ? 'Day' : 'Days'} Active
                </h3>
              </div>
              <div className={`p-3 rounded-xl ${streak > 0 ? 'bg-amber-500/10 text-amber-500 animate-float' : 'bg-secondary/40 text-muted-foreground'}`}>
                <Flame size={24} fill={streak > 0 ? 'currentColor' : 'none'} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              {streak > 0 ? 'Awesome job! Keep the streak alive by completing blocks.' : 'Log your first completed block today to start a streak!'}
            </p>
          </div>
        )}

        {/* Overall Progress */}
        <div className="p-6 rounded-2xl glass flex flex-col justify-between min-h-[160px]">
          <div>
            <div className="flex justify-between items-center">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Overall Study Progress</p>
              <span className="text-sm font-bold text-primary">{overallProgress}%</span>
            </div>
            <div className="w-full bg-secondary/50 h-2.5 rounded-full mt-3 overflow-hidden">
              <div 
                className="bg-primary h-full rounded-full transition-all duration-500" 
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
          <div className="flex justify-between items-center text-xs text-muted-foreground mt-4 pt-2 border-t border-border/20">
            <span>Lectures completed:</span>
            <span className="font-semibold text-white">{completedLectures} / {totalLectures}</span>
          </div>
        </div>
      </div>

      {/* Current Study Status & Today's Timetable Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Timetable & Tracker */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl glass space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Today's Tracker</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Execution checklist for today</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs bg-secondary border border-border/40 text-muted-foreground px-2.5 py-1 rounded-lg">
                  {completedToday}/{totalToday} Completed
                </span>
                <span className="text-xs font-semibold text-primary">{todayCompletionRate}% Done</span>
              </div>
            </div>

            {/* Timetable List */}
            {todayBlocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-border/40 rounded-xl bg-secondary/10">
                <AlertCircle size={28} className="text-muted-foreground/60 mb-2" />
                <p className="text-sm text-muted-foreground">No timetable blocks scheduled for today.</p>
                <button 
                  onClick={() => onViewChange('planner')}
                  className="mt-3 text-xs bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 px-3 py-1.5 rounded-lg transition"
                >
                  Configure Timetable
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                {todayBlocks.map((block: any) => {
                  const blockCat = categories.find(c => c.id === block.category_id);
                  return (
                    <div 
                      key={block.id}
                      className={`
                        flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200
                        ${block.completed 
                          ? 'bg-emerald-950/10 border-emerald-900/30' 
                          : 'bg-secondary/20 border-border/30 hover:border-border/60'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3.5">
                        {/* Custom status toggle */}
                        <button 
                          onClick={() => handleToggleBlock(block.id, block.completed)}
                          className={`
                            w-5 h-5 rounded-md border flex items-center justify-center transition
                            ${block.completed 
                              ? 'bg-emerald-500 border-emerald-500 text-white' 
                              : 'border-muted-foreground/40 hover:border-primary'
                            }
                          `}
                        >
                          {block.completed && <CheckCircle2 size={12} fill="currentColor" className="text-background" />}
                        </button>
                        <div>
                          <p className={`text-sm font-medium ${block.completed ? 'text-white/40 line-through' : 'text-white'}`}>
                            {block.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {block.start_time} - {block.end_time}
                            </span>
                            {blockCat && (
                              <span 
                                className="text-[9px] px-1.5 py-0.5 rounded font-semibold text-white/90"
                                style={{ backgroundColor: `${blockCat.color}25`, border: `1px solid ${blockCat.color}35`, color: blockCat.color }}
                              >
                                {blockCat.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {block.study_goal_type && (
                        <div className="text-right">
                          <span className="text-[10px] bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
                            {block.study_goal_type}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active study Focus & Quick Actions */}
        <div className="space-y-6">
          {/* Active study focus */}
          <div className="p-6 rounded-2xl glass bg-gradient-to-br from-primary/5 to-transparent border border-primary/20 relative overflow-hidden group">
            <div className="absolute top-3 right-3 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </div>
            <h4 className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Play size={12} className="fill-current" />
              Active Study Focus
            </h4>

            {activeLecture ? (
              <div className="mt-4 space-y-3">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-mono font-bold tracking-tight">Subject</span>
                  <h5 className="text-md font-bold text-white flex items-center gap-2 mt-0.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeSubjectColor }} />
                    {activeSubjectName}
                  </h5>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-mono font-bold tracking-tight">Module</span>
                    <p className="text-sm font-semibold text-white mt-0.5 truncate">{activeModuleName}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-mono font-bold tracking-tight">Lecture</span>
                    <p className="text-sm font-semibold text-white mt-0.5 truncate">L{activeLecture.lecture_number}: {activeLecture.title}</p>
                  </div>
                </div>
                <button 
                  onClick={() => onViewChange('subjects')}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-2 bg-primary hover:bg-primary/95 text-white text-xs font-semibold rounded-xl shadow-lg shadow-primary/20 transition"
                >
                  <BookOpen size={14} />
                  Open Subject Curriculum
                </button>
              </div>
            ) : (
              <div className="mt-4 py-4 text-center">
                <Layers size={24} className="text-muted-foreground/60 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No active lecture in progress.</p>
                <button 
                  onClick={() => onViewChange('subjects')}
                  className="mt-3 text-[11px] bg-secondary/50 hover:bg-secondary/80 text-white border border-border/40 px-3 py-1.5 rounded-lg transition"
                >
                  Start a Subject
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="p-6 rounded-2xl glass space-y-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => onViewChange('planner')}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-secondary/20 border border-border/20 hover:border-primary/50 hover:bg-secondary/40 transition text-center"
              >
                <Calendar size={18} className="text-primary mb-2" />
                <span className="text-xs font-medium text-white">Edit Schedule</span>
              </button>
              <button 
                onClick={() => onViewChange('subjects')}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-secondary/20 border border-border/20 hover:border-primary/50 hover:bg-secondary/40 transition text-center"
              >
                <BookOpen size={18} className="text-emerald-500 mb-2" />
                <span className="text-xs font-medium text-white">Add Subject</span>
              </button>
              <button 
                onClick={() => onViewChange('mocks')}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-secondary/20 border border-border/20 hover:border-primary/50 hover:bg-secondary/40 transition text-center"
              >
                <Award size={18} className="text-amber-500 mb-2" />
                <span className="text-xs font-medium text-white">Log Mock Test</span>
              </button>
              <button 
                onClick={() => onViewChange('settings')}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-secondary/20 border border-border/20 hover:border-primary/50 hover:bg-secondary/40 transition text-center"
              >
                <RefreshCw size={18} className="text-sky-500 mb-2" />
                <span className="text-xs font-medium text-white">Configure Target</span>
              </button>
            </div>
          </div>

          {/* Upcoming Mock Exam/Mock list */}
          <div className="p-6 rounded-2xl glass space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Latest Mock Test</h4>
              <button 
                onClick={() => onViewChange('mocks')}
                className="text-[10px] text-primary hover:underline font-semibold flex items-center"
              >
                View All <ChevronRight size={12} />
              </button>
            </div>
            
            {mockTests.length > 0 ? (
              <div className="p-3.5 rounded-xl bg-secondary/20 border border-border/40 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-white truncate max-w-[140px]">{mockTests[0].name}</span>
                  <span className="text-xs font-mono font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                    Score: {mockTests[0].score}/{mockTests[0].total_marks}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Accuracy: {mockTests[0].accuracy}%</span>
                  <span>Date: {mockTests[0].date}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">No mock tests logged yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

