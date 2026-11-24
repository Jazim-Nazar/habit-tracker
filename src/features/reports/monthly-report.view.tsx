import React, { useState, useEffect } from 'react';
import { 
  FileText, ChevronLeft, ChevronRight, Award, Dumbbell, 
  Target, Moon, Clock, Save, AlertCircle, TrendingUp
} from 'lucide-react';
import { useDatabase } from '../../context/database.context';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';

export const MonthlyReport: React.FC = () => {
  const { timetableBlocks, lectures, modules, subjects, categories } = useDatabase();

  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(7); // July (0-indexed base would be 6, but let's use 1-12)
  const [monthlyReflection, setMonthlyReflection] = useState('');

  // Sync today's month
  useEffect(() => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth() + 1);
  }, []);

  const monthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  // Load monthly reflections
  useEffect(() => {
    if (monthKey) {
      const savedReflection = localStorage.getItem(`lifeos_monthly_notes_${monthKey}`) || '';
      setMonthlyReflection(savedReflection);
    }
  }, [monthKey]);

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Filter timetable blocks for this month
  const monthBlocks = timetableBlocks.filter(b => {
    if (!b.date) return false;
    return b.date.startsWith(monthKey);
  });

  const completedBlocks = monthBlocks.filter(b => b.completed);
  const completionRate = monthBlocks.length > 0 ? Math.round((completedBlocks.length / monthBlocks.length) * 100) : 0;

  // Study blocks calculations
  const studyBlocks = monthBlocks.filter(b => {
    const cat = categories.find(c => c.id === b.category_id);
    return cat?.name === 'Study';
  });
  const completedStudyBlocks = studyBlocks.filter(b => b.completed);
  const studyCompletionPct = studyBlocks.length > 0 ? Math.round((completedStudyBlocks.length / studyBlocks.length) * 100) : 0;

  // Study hours calculation
  const calculateHours = (blocksList: typeof monthBlocks) => {
    let totalMinutes = 0;
    blocksList.forEach(b => {
      const [sh, sm] = b.start_time.split(':').map(Number);
      const [eh, em] = b.end_time.split(':').map(Number);
      let duration = (eh * 60 + em) - (sh * 60 + sm);
      if (duration < 0) duration += 24 * 60;
      totalMinutes += duration;
    });
    return Math.round((totalMinutes / 60) * 10) / 10;
  };

  const monthlyStudyHours = calculateHours(completedStudyBlocks);

  // Lectures completed this month
  const lecsCompletedThisMonth = lectures.filter(l => {
    if (!l.completed_date) return false;
    return l.completed_date.startsWith(monthKey);
  });

  // Modules completed this month
  const modulesCompletedThisMonth = modules.filter(m => {
    const modLecs = lectures.filter(l => l.module_id === m.id);
    if (modLecs.length === 0) return false;
    const allCompleted = modLecs.every(l => l.status === 'Completed');
    if (!allCompleted) return false;
    const completedDates = modLecs.map(l => l.completed_date).filter(Boolean) as string[];
    if (completedDates.length === 0) return false;
    const lastCompletedDate = [...completedDates].sort().pop();
    return lastCompletedDate && lastCompletedDate.startsWith(monthKey);
  });

  // Subjects completed this month
  const subjectsCompletedThisMonth = subjects.filter(s => {
    if (s.status !== 'Completed') return false;
    // Check if last lecture completed in this subject falls inside the month
    const sMods = modules.filter(m => m.subject_id === s.id);
    const sModsIds = sMods.map(m => m.id);
    const sLecs = lectures.filter(l => sModsIds.includes(l.module_id));
    if (sLecs.length === 0) return false;
    const completedDates = sLecs.map(l => l.completed_date).filter(Boolean) as string[];
    if (completedDates.length === 0) return false;
    const lastCompletedDate = [...completedDates].sort().pop();
    return lastCompletedDate && lastCompletedDate.startsWith(monthKey);
  });

  // Habit metrics counts
  const getCategoryCount = (name: string) => {
    return monthBlocks.filter(b => {
      const cat = categories.find(c => c.id === b.category_id);
      return cat?.name.toLowerCase() === name.toLowerCase() && b.completed;
    }).length;
  };

  const gymCount = getCategoryCount('gym');
  const kalariCount = getCategoryCount('kalari');
  const workoutCount = getCategoryCount('workout');
  const revisionCount = getCategoryCount('revision');
  const mockCount = getCategoryCount('mock test');

  const handleSaveReflection = () => {
    localStorage.setItem(`lifeos_monthly_notes_${monthKey}`, monthlyReflection);
    alert("Monthly reflection saved!");
  };

  // Recharts PIE CHART: Category distribution of completed blocks
  const categoryChartData = categories.map(cat => {
    const count = monthBlocks.filter(b => b.category_id === cat.id && b.completed).length;
    return { name: cat.name, value: count, color: cat.color };
  }).filter(c => c.value > 0);

  // Area Chart Data: Study Hours per day in the month
  const getDailyStudyHoursData = () => {
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const dataList = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayStudy = monthBlocks.filter(b => {
        const cat = categories.find(c => c.id === b.category_id);
        return b.date === dayStr && cat?.name === 'Study' && b.completed;
      });
      dataList.push({
        day: String(day),
        hours: calculateHours(dayStudy)
      });
    }
    return dataList;
  };

  const studyProgressionData = getDailyStudyHoursData();

  return (
    <div className="space-y-6">
      {/* Date Switcher Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-2xl glass">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="text-primary" />
            Monthly Executive Report
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5 font-medium">Automatic monthly aggregates, habit tallies, and category distribution maps.</p>
        </div>

        <div className="flex items-center gap-3 bg-secondary/50 border border-border/40 px-4 py-2 rounded-xl">
          <button onClick={handlePrevMonth} className="text-muted-foreground hover:text-white transition"><ChevronLeft size={16} /></button>
          <span className="text-xs font-bold text-white font-mono">{monthNames[currentMonth - 1]} {currentYear}</span>
          <button onClick={handleNextMonth} className="text-muted-foreground hover:text-white transition"><ChevronRight size={16} /></button>
        </div>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-5 rounded-2xl glass border border-border/30">
          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Completed Blocks</span>
          <p className="text-3xl font-extrabold text-white mt-1.5 font-mono">{completedBlocks.length}</p>
          <span className="text-[10px] text-muted-foreground">{monthBlocks.length} total blocks scheduled</span>
        </div>
        <div className="p-5 rounded-2xl glass border border-border/30">
          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Success Rate</span>
          <p className="text-3xl font-extrabold text-primary mt-1.5 font-mono">{completionRate}%</p>
          <span className="text-[10px] text-emerald-400 font-semibold">Average completion target 90%</span>
        </div>
        <div className="p-5 rounded-2xl glass border border-border/30">
          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Total Study Hours</span>
          <p className="text-3xl font-extrabold text-white mt-1.5 font-mono">{monthlyStudyHours}h</p>
          <span className="text-[10px] text-muted-foreground">Study blocks completion: {studyCompletionPct}%</span>
        </div>
        <div className="p-5 rounded-2xl glass border border-border/30">
          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Lectures Logged</span>
          <p className="text-3xl font-extrabold text-emerald-400 mt-1.5 font-mono">+{lecsCompletedThisMonth.length}</p>
          <span className="text-[10px] text-muted-foreground">{modulesCompletedThisMonth.length} modules completed</span>
        </div>
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Study Hours Progression */}
        <div className="lg:col-span-2 p-6 rounded-2xl glass space-y-4">
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Clock className="text-primary" size={18} />
            Study Progression (Hours per Day)
          </h3>
          <div className="h-60 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={studyProgressionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="monthStudyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="day" stroke="#888" tickLine={false} style={{ fontSize: 10 }} />
                <YAxis stroke="#888" tickLine={false} style={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
                <Area type="monotone" name="Hours" dataKey="hours" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#monthStudyGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category breakdown (Pie Chart) */}
        <div className="p-6 rounded-2xl glass space-y-4">
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="text-primary" size={18} />
            Completed Activities Map
          </h3>
          <div className="h-60 w-full mt-4 flex items-center justify-center">
            {categoryChartData.length === 0 ? (
              <p className="text-xs text-muted-foreground">No activities completed this month.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Routine Tallies & Reflections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Habit Tally table */}
        <div className="lg:col-span-1 p-6 rounded-2xl glass space-y-4">
          <h3 className="text-md font-bold text-white tracking-tight flex items-center gap-2">
            <Dumbbell className="text-primary" size={16} />
            Habit Tally Board
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center p-3 rounded bg-secondary/10 border border-border/20">
              <span className="text-muted-foreground font-medium">Gym Attendance</span>
              <span className="font-bold text-white font-mono">{gymCount} Sessions</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded bg-secondary/10 border border-border/20">
              <span className="text-muted-foreground font-medium">Kalari Practices</span>
              <span className="font-bold text-white font-mono">{kalariCount} Sessions</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded bg-secondary/10 border border-border/20">
              <span className="text-muted-foreground font-medium">Cardio/Workouts</span>
              <span className="font-bold text-white font-mono">{workoutCount} Sessions</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded bg-secondary/10 border border-border/20">
              <span className="text-muted-foreground font-medium">Revision Sessions</span>
              <span className="font-bold text-white font-mono">{revisionCount} Logs</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded bg-secondary/10 border border-border/20">
              <span className="text-muted-foreground font-medium">Subjects Finished</span>
              <span className="font-bold text-emerald-400 font-mono">+{subjectsCompletedThisMonth.length} Completed</span>
            </div>
          </div>
        </div>

        {/* Monthly reflections */}
        <div className="lg:col-span-2 p-6 rounded-2xl glass space-y-4">
          <h3 className="text-md font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="text-primary" size={16} />
            Monthly reflection log
          </h3>
          <textarea
            placeholder="Write down reflections, lessons learned, and routine corrections for this month..."
            value={monthlyReflection}
            onChange={(e) => setMonthlyReflection(e.target.value)}
            className="w-full bg-secondary/40 border border-border/40 text-sm text-white rounded-xl p-3 focus:ring-1 focus:ring-primary focus:outline-none h-32"
          />
          <div className="flex justify-end">
            <button
              onClick={handleSaveReflection}
              className="flex items-center gap-1 bg-primary hover:bg-primary/95 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow shadow-primary/20 transition"
            >
              <Save size={13} /> Save Reflection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

