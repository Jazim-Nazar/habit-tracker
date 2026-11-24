import React, { useState } from 'react';
import { 
  TrendingUp, BookOpen, Layers, CheckCircle2, 
  HelpCircle, RefreshCw, FileCheck
} from 'lucide-react';
import { useDatabase } from '../../context/database.context';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const ProgressPage: React.FC = () => {
  const { subjects, modules, lectures } = useDatabase();

  const [activeSubId, setActiveSubId] = useState<string>('');

  // 1. Overall stats
  const totalLectures = lectures.length;
  const completedLectures = lectures.filter(l => l.status === 'Completed').length;
  const overallLecPct = totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0;

  const totalModules = modules.length;
  const completedModules = modules.filter(m => m.status === 'Completed').length;
  const overallModPct = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  const totalSubjects = subjects.length;
  const completedSubjects = subjects.filter(s => s.status === 'Completed').length;
  const overallSubPct = totalSubjects > 0 ? Math.round((completedSubjects / totalSubjects) * 100) : 0;

  // 2. Revision Stats
  const notesCount = lectures.filter(l => l.notes_done).length;
  const practiceCount = lectures.filter(l => l.practice_done).length;
  const pyqsCount = lectures.filter(l => l.pyqs_done).length;
  const revisionCount = lectures.filter(l => l.revision_done).length;

  const notesPct = totalLectures > 0 ? Math.round((notesCount / totalLectures) * 100) : 0;
  const practicePct = totalLectures > 0 ? Math.round((practiceCount / totalLectures) * 100) : 0;
  const pyqsPct = totalLectures > 0 ? Math.round((pyqsCount / totalLectures) * 100) : 0;
  const revisionPct = totalLectures > 0 ? Math.round((revisionCount / totalLectures) * 100) : 0;

  // 3. Subject-wise progress chart data
  const subjectChartData = subjects.map(sub => {
    const sMods = modules.filter(m => m.subject_id === sub.id);
    const sModsIds = sMods.map(m => m.id);
    const sLecs = lectures.filter(l => sModsIds.includes(l.module_id));
    const comp = sLecs.filter(l => l.status === 'Completed').length;
    
    return {
      name: sub.name.substring(0, 15) + (sub.name.length > 15 ? '..' : ''),
      progress: sLecs.length > 0 ? Math.round((comp / sLecs.length) * 100) : 0,
      color: sub.color
    };
  });

  const selectedSubject = subjects.find(s => s.id === activeSubId) || subjects[0];
  const activeSubModules = selectedSubject ? modules.filter(m => m.subject_id === selectedSubject.id) : [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="p-6 rounded-2xl glass">
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <TrendingUp className="text-primary" />
          Overall Progression Dashboard
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5 font-medium">Aggregated visual statistics of curriculum completions and micro-checklists.</p>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl glass space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><BookOpen size={14} /> Subject Completion</span>
            <span className="text-sm font-extrabold text-primary font-mono">{completedSubjects}/{totalSubjects}</span>
          </div>
          <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
            <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${overallSubPct}%` }} />
          </div>
          <p className="text-[10px] text-muted-foreground font-semibold">{overallSubPct}% of enrolled subject curriculums fully completed</p>
        </div>

        <div className="p-6 rounded-2xl glass space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Layers size={14} /> Module Completion</span>
            <span className="text-sm font-extrabold text-sky-400 font-mono">{completedModules}/{totalModules}</span>
          </div>
          <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
            <div className="bg-sky-400 h-full rounded-full transition-all duration-500" style={{ width: `${overallModPct}%` }} />
          </div>
          <p className="text-[10px] text-muted-foreground font-semibold">{overallModPct}% of chapters/modules completed</p>
        </div>

        <div className="p-6 rounded-2xl glass space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><CheckCircle2 size={14} /> Lecture Completion</span>
            <span className="text-sm font-extrabold text-emerald-400 font-mono">{completedLectures}/{totalLectures}</span>
          </div>
          <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
            <div className="bg-emerald-400 h-full rounded-full transition-all duration-500" style={{ width: `${overallLecPct}%` }} />
          </div>
          <p className="text-[10px] text-muted-foreground font-semibold">{overallLecPct}% of all lectures checked off</p>
        </div>
      </div>

      {/* Revision Milestones Progress Bars */}
      <div className="p-6 rounded-2xl glass space-y-5">
        <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <RefreshCw size={18} className="text-primary" />
          Revision & Output Milestones
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-4 bg-secondary/10 border border-border/20 rounded-xl space-y-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Lecture Notes Made</span>
            <p className="text-2xl font-black text-white font-mono">{notesPct}%</p>
            <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-400 h-full rounded-full" style={{ width: `${notesPct}%` }} />
            </div>
            <span className="text-[9px] text-muted-foreground">{notesCount}/{totalLectures} lectures done</span>
          </div>

          <div className="p-4 bg-secondary/10 border border-border/20 rounded-xl space-y-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Practice Sets Solved</span>
            <p className="text-2xl font-black text-white font-mono">{practicePct}%</p>
            <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
              <div className="bg-rose-400 h-full rounded-full" style={{ width: `${practicePct}%` }} />
            </div>
            <span className="text-[9px] text-muted-foreground">{practiceCount}/{totalLectures} lectures done</span>
          </div>

          <div className="p-4 bg-secondary/10 border border-border/20 rounded-xl space-y-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">PYQ Sets Completed</span>
            <p className="text-2xl font-black text-white font-mono">{pyqsPct}%</p>
            <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
              <div className="bg-amber-400 h-full rounded-full" style={{ width: `${pyqsPct}%` }} />
            </div>
            <span className="text-[9px] text-muted-foreground">{pyqsCount}/{totalLectures} lectures done</span>
          </div>

          <div className="p-4 bg-secondary/10 border border-border/20 rounded-xl space-y-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Revision Loops Closed</span>
            <p className="text-2xl font-black text-white font-mono">{revisionPct}%</p>
            <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${revisionPct}%` }} />
            </div>
            <span className="text-[9px] text-muted-foreground">{revisionCount}/{totalLectures} lectures done</span>
          </div>
        </div>
      </div>

      {/* Grid: Subjects chart & Module breakdown selector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subjects Progression Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl glass space-y-4">
          <h3 className="text-lg font-bold text-white tracking-tight">Subject Completion Comparison</h3>
          {subjectChartData.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">No subjects created yet.</p>
          ) : (
            <div className="h-60 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectChartData} layout="vertical" margin={{ left: -10, right: 10, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis type="number" domain={[0, 100]} stroke="#888" style={{ fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" stroke="#888" style={{ fontSize: 10 }} width={80} />
                  <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
                  <Bar dataKey="progress" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Modules breakdown finder */}
        <div className="p-6 rounded-2xl glass space-y-4">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Module Progress Lookup</span>
            <select
              value={activeSubId}
              onChange={(e) => setActiveSubId(e.target.value)}
              className="w-full bg-secondary/60 border border-border/40 text-xs text-white rounded-xl px-3 py-2 focus:outline-none"
            >
              <option value="">Select Subject</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
            {activeSubModules.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">Select a subject with modules to show details.</p>
            ) : (
              activeSubModules.map(mod => {
                const modLecs = lectures.filter(l => l.module_id === mod.id);
                const comp = modLecs.filter(l => l.status === 'Completed').length;
                const tot = modLecs.length;
                const modPct = tot > 0 ? Math.round((comp / tot) * 100) : 0;

                return (
                  <div key={mod.id} className="p-3 bg-secondary/15 border border-border/20 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-white truncate max-w-[150px]">{mod.name}</span>
                      <span className="text-muted-foreground font-mono">{comp}/{tot} ({modPct}%)</span>
                    </div>
                    <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                      <div className="bg-primary h-full rounded-full" style={{ width: `${modPct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

