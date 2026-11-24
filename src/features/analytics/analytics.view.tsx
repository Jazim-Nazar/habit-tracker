import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Flame, Clock, Award, AlertCircle, 
  TrendingUp, Calendar as CalendarIcon, CheckCircle2
} from 'lucide-react';
import { useDatabase } from '../../context/database.context';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const Analytics: React.FC = () => {
  const { timetableBlocks, subjects, categories } = useDatabase();
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(7); // July

  useEffect(() => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth() + 1);
  }, []);

  // --- 1. STREAK CALCULATIONS ---
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);

  useEffect(() => {
    const calculateStreaks = () => {
      const allCompletedBlocks = timetableBlocks.filter(b => b.date && b.completed);
      if (allCompletedBlocks.length === 0) {
        setStreak(0);
        setLongestStreak(0);
        return;
      }

      // Extract unique sorted dates
      const completedDates = Array.from(new Set(allCompletedBlocks.map(b => b.date as string)))
        .sort((a, b) => a.localeCompare(b));

      if (completedDates.length === 0) {
        setStreak(0);
        setLongestStreak(0);
        return;
      }

      // Calculate current streak
      let curStreak = 0;
      let checkDate = new Date();
      const todayStr = checkDate.toISOString().split('T')[0];
      
      let yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const datesSet = new Set(completedDates);
      const hasToday = datesSet.has(todayStr);
      const hasYesterday = datesSet.has(yesterdayStr);

      if (hasToday || hasYesterday) {
        if (!hasToday && hasYesterday) {
          checkDate = yesterday;
        }
        while (true) {
          const ds = checkDate.toISOString().split('T')[0];
          if (datesSet.has(ds)) {
            curStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
      }
      setStreak(curStreak);

      // Calculate longest streak historical
      let maxStreak = 0;
      let tempStreak = 0;
      let prevDateObj: Date | null = null;

      completedDates.forEach((dateStr) => {
        const currentDateObj = new Date(dateStr);
        if (prevDateObj === null) {
          tempStreak = 1;
        } else {
          const diffTime = Math.abs(currentDateObj.getTime() - prevDateObj.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            tempStreak++;
          } else if (diffDays > 1) {
            if (tempStreak > maxStreak) maxStreak = tempStreak;
            tempStreak = 1;
          }
        }
        prevDateObj = currentDateObj;
      });

      if (tempStreak > maxStreak) maxStreak = tempStreak;
      setLongestStreak(maxStreak);
    };

    calculateStreaks();
  }, [timetableBlocks]);

  // --- 2. MOST / LEAST STUDIED SUBJECT ---
  const [mostStudiedSub, setMostStudiedSub] = useState('N/A');
  const [leastStudiedSub, setLeastStudiedSub] = useState('N/A');

  useEffect(() => {
    const studyBlocks = timetableBlocks.filter(b => {
      const cat = categories.find(c => c.id === b.category_id);
      return cat?.name === 'Study' && b.completed && b.study_subject_id;
    });

    if (studyBlocks.length === 0) {
      setMostStudiedSub('N/A');
      setLeastStudiedSub('N/A');
      return;
    }

    const subjectMinutesMap: Record<string, number> = {};
    
    // Seed all active subjects with 0
    subjects.filter(s => !s.is_archived).forEach(s => {
      subjectMinutesMap[s.id] = 0;
    });

    studyBlocks.forEach(b => {
      const subId = b.study_subject_id!;
      const [sh, sm] = b.start_time.split(':').map(Number);
      const [eh, em] = b.end_time.split(':').map(Number);
      let duration = (eh * 60 + em) - (sh * 60 + sm);
      if (duration < 0) duration += 24 * 60;
      
      if (subjectMinutesMap[subId] !== undefined) {
        subjectMinutesMap[subId] += duration;
      } else {
        subjectMinutesMap[subId] = duration;
      }
    });

    const entries = Object.entries(subjectMinutesMap).filter(([_, mins]) => mins >= 0);
    if (entries.length === 0) return;

    entries.sort((a, b) => b[1] - a[1]);
    
    const mostId = entries[0][0];
    const mostName = subjects.find(s => s.id === mostId)?.name || 'N/A';
    setMostStudiedSub(mostName);

    // Filters only entries that actually had study duration logged
    const nonZeroEntries = entries.filter(e => e[1] > 0);
    if (nonZeroEntries.length > 0) {
      const leastId = nonZeroEntries[nonZeroEntries.length - 1][0];
      const leastName = subjects.find(s => s.id === leastId)?.name || 'N/A';
      setLeastStudiedSub(leastName);
    }
  }, [timetableBlocks, subjects]);

  // --- 3. AVERAGE STUDY DURATION ---
  const completedStudyBlocks = timetableBlocks.filter(b => {
    const cat = categories.find(c => c.id === b.category_id);
    return cat?.name === 'Study' && b.completed && b.date;
  });

  const uniqueStudyDays = Array.from(new Set(completedStudyBlocks.map(b => b.date)));
  
  let totalStudyMinutes = 0;
  completedStudyBlocks.forEach(b => {
    const [sh, sm] = b.start_time.split(':').map(Number);
    const [eh, em] = b.end_time.split(':').map(Number);
    let duration = (eh * 60 + em) - (sh * 60 + sm);
    if (duration < 0) duration += 24 * 60;
    totalStudyMinutes += duration;
  });

  const avgStudyHours = uniqueStudyDays.length > 0 
    ? Math.round((totalStudyMinutes / 60 / uniqueStudyDays.length) * 10) / 10 
    : 0;

  // --- 4. WEEKLY OVERVIEW CHART (Past 4 weeks) ---
  const getPastWeeksData = () => {
    const dataList = [];
    const today = new Date();
    for (let i = 3; i >= 0; i--) {
      const start = new Date(today);
      start.setDate(today.getDate() - (i * 7 + today.getDay() - 1));
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      
      const startStr = start.toISOString().split('T')[0];
      const endStr = end.toISOString().split('T')[0];
      
      const rangeBlocks = timetableBlocks.filter(b => b.date && b.date >= startStr && b.date <= endStr);
      const completed = rangeBlocks.filter(b => b.completed).length;
      const rate = rangeBlocks.length > 0 ? Math.round((completed / rangeBlocks.length) * 100) : 0;
      
      dataList.push({
        name: `Wk -${i}`,
        rate
      });
    }
    return dataList;
  };

  const pastWeeksChartData = getPastWeeksData();

  // --- 5. STUDY CALENDAR HEATMAP (Current Month Grid) ---
  const renderCalendarHeatmap = () => {
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const firstDayIndex = new Date(currentYear, currentMonth - 1, 1).getDay(); // 0 = Sun, 1 = Mon
    
    // Create pre-padding slots
    const slots = [];
    for (let i = 0; i < (firstDayIndex === 0 ? 6 : firstDayIndex - 1); i++) {
      slots.push({ isEmpty: true, day: 0, density: 0 });
    }

    // Populate actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      // Calculate completed study blocks for this day
      const dayStudyBlocks = timetableBlocks.filter(b => {
        const cat = categories.find(c => c.id === b.category_id);
        return b.date === dayStr && cat?.name === 'Study' && b.completed;
      });

      let density = 0;
      if (dayStudyBlocks.length > 0 && dayStudyBlocks.length <= 1) density = 1;
      else if (dayStudyBlocks.length > 1 && dayStudyBlocks.length <= 3) density = 2;
      else if (dayStudyBlocks.length > 3) density = 3;

      slots.push({
        isEmpty: false,
        day,
        density,
        count: dayStudyBlocks.length
      });
    }

    return slots;
  };

  const heatmapSlots = renderCalendarHeatmap();

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="p-6 rounded-2xl glass">
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <BarChart3 className="text-primary" />
          Analytics Dashboard
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5 font-medium">Identify routine anomalies, track streaks, and analyze your productivity heatmaps.</p>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-5 rounded-2xl glass border border-border/30 flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <Flame size={20} fill="currentColor" />
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Current Streak</span>
            <p className="text-xl font-extrabold text-white mt-0.5">{streak} Days</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl glass border border-border/30 flex items-center gap-4">
          <div className="p-3 bg-orange-500/10 text-orange-500 rounded-xl">
            <Award size={20} />
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Longest Streak</span>
            <p className="text-xl font-extrabold text-white mt-0.5">{longestStreak} Days</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl glass border border-border/30 flex items-center gap-4">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <Clock size={20} />
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Avg Study / Day</span>
            <p className="text-xl font-extrabold text-white mt-0.5">{avgStudyHours} hrs</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl glass border border-border/30 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <TrendingUp size={20} />
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Weekly Exec Rate</span>
            <p className="text-xl font-extrabold text-emerald-400 mt-0.5">
              {pastWeeksChartData[3]?.rate || 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Study Calendar Heatmap & Subject Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heatmap Calendar */}
        <div className="lg:col-span-2 p-6 rounded-2xl glass space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <CalendarIcon className="text-primary" size={18} />
              Study Heatmap (July 2026)
            </h3>
            <span className="text-xs text-muted-foreground font-semibold">Intensity: study blocks completed</span>
          </div>

          {/* Grid Headers */}
          <div className="grid grid-cols-7 gap-2.5 text-center text-xs font-semibold text-muted-foreground border-b border-border/20 pb-2">
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>

          {/* Heatmap Grid */}
          <div className="grid grid-cols-7 gap-2.5 pt-2">
            {heatmapSlots.map((slot, idx) => {
              if (slot.isEmpty) {
                return <div key={`empty-${idx}`} className="aspect-square" />;
              }

              // Define colors based on density
              const bgClasses = [
                'bg-secondary/20 hover:bg-secondary/40 border border-border/20 text-muted-foreground/50', // 0 blocks
                'bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary', // 1 block
                'bg-primary/50 hover:bg-primary/60 text-white shadow shadow-primary/10', // 2-3 blocks
                'bg-primary text-white font-extrabold shadow shadow-primary/30' // 4+ blocks
              ];

              return (
                <div 
                  key={`day-${slot.day}`} 
                  className={`
                    aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-medium cursor-pointer transition-all duration-200
                    ${bgClasses[slot.density]}
                  `}
                  title={`${slot.count ?? 0} study blocks completed`}
                >
                  <span>{slot.day}</span>
                  {(slot.count ?? 0) > 0 && <span className="text-[8px] opacity-75 font-mono">{slot.count}b</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Focus Ranking card */}
        <div className="p-6 rounded-2xl glass space-y-6">
          <h3 className="text-lg font-bold text-white tracking-tight">Subject Concentration</h3>
          
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-secondary/15 border border-border/20 space-y-1">
              <span className="text-[10px] text-primary font-bold uppercase tracking-wider">Most Studied Subject</span>
              <p className="text-sm font-semibold text-white mt-1 truncate">{mostStudiedSub}</p>
              <p className="text-[10px] text-muted-foreground">Most time spent in study blocks</p>
            </div>

            <div className="p-4 rounded-xl bg-secondary/15 border border-border/20 space-y-1">
              <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">Least Studied Subject</span>
              <p className="text-sm font-semibold text-white mt-1 truncate">{leastStudiedSub}</p>
              <p className="text-[10px] text-muted-foreground">Attention needed here to balance preparation</p>
            </div>
          </div>

          <div className="border-t border-border/10 pt-4">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Weekly execution rates</h4>
            <div className="h-28 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pastWeeksChartData}>
                  <XAxis dataKey="name" stroke="#888" tickLine={false} style={{ fontSize: 9 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
                  <Bar dataKey="rate" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

