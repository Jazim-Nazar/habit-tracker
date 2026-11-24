import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, Calendar as CalendarIcon, Clock, 
  BookOpen, Plus, Trash2, Edit2, AlertCircle, Save
} from 'lucide-react';
import { useDatabase } from '../../context/database.context';
import { TimetableBlock, StudyGoalType } from '../../lib/db/db.types';

export const Tracker: React.FC = () => {
  const {
    subjects, modules, lectures, categories,
    timetableBlocks, generateDayFromActiveTemplate,
    updateTimetableBlock, addTimetableBlock, deleteTimetableBlock
  } = useDatabase();

  const [selectedDate, setSelectedDate] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBlock, setEditingBlock] = useState<TimetableBlock | null>(null);

  // Form states for one-off blocks
  const [blockTitle, setBlockTitle] = useState('');
  const [blockStart, setBlockStart] = useState('09:00');
  const [blockEnd, setBlockEnd] = useState('10:00');
  const [blockCategory, setBlockCategory] = useState('');
  const [blockNotes, setBlockNotes] = useState('');
  const [studySubjectId, setStudySubjectId] = useState('');
  const [studyModuleId, setStudyModuleId] = useState('');
  const [studyLectureId, setStudyLectureId] = useState('');
  const [studyGoalType, setStudyGoalType] = useState<StudyGoalType>('Lecture');

  // Set today by default
  useEffect(() => {
    const today = new Date();
    const tzOffset = today.getTimezoneOffset() * 60000;
    const localDateStr = new Date(today.getTime() - tzOffset).toISOString().split('T')[0];
    setSelectedDate(localDateStr);
  }, []);

  // Generate blocks on date select
  useEffect(() => {
    if (selectedDate) {
      generateDayFromActiveTemplate(selectedDate);
    }
  }, [selectedDate]);

  // Get blocks for selected date
  const dateBlocks = timetableBlocks
    .filter(b => b.date === selectedDate)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const handleToggleComplete = async (block: TimetableBlock) => {
    const isNowCompleted = !block.completed;
    await updateTimetableBlock(block.id, {
      completed: isNowCompleted,
      completion_time: isNowCompleted ? new Date().toISOString() : undefined
    });
  };

  const handleOpenAddModal = (block?: TimetableBlock) => {
    if (block) {
      setEditingBlock(block);
      setBlockTitle(block.title);
      setBlockStart(block.start_time);
      setBlockEnd(block.end_time);
      setBlockCategory(block.category_id || '');
      setBlockNotes(block.notes || '');
      setStudySubjectId(block.study_subject_id || '');
      setStudyModuleId(block.study_module_id || '');
      setStudyLectureId(block.study_lecture_id || '');
      setStudyGoalType(block.study_goal_type || 'Lecture');
    } else {
      setEditingBlock(null);
      setBlockTitle('');
      setBlockStart('09:00');
      setBlockEnd('10:00');
      setBlockCategory(categories[0]?.id || '');
      setBlockNotes('');
      setStudySubjectId('');
      setStudyModuleId('');
      setStudyLectureId('');
      setStudyGoalType('Lecture');
    }
    setShowAddModal(true);
  };

  const handleSaveBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      date: selectedDate,
      template_id: null,
      day_of_week: null,
      title: blockTitle,
      start_time: blockStart,
      end_time: blockEnd,
      category_id: blockCategory || null,
      notes: blockNotes,
      completed: editingBlock ? editingBlock.completed : false,
      completion_time: editingBlock ? editingBlock.completion_time : undefined,
      study_subject_id: studySubjectId || null,
      study_module_id: studyModuleId || null,
      study_lecture_id: studyLectureId || null,
      study_goal_type: (blockCategory === 'cat-study' || categories.find(c => c.id === blockCategory)?.name === 'Study') ? studyGoalType : null
    };

    if (editingBlock) {
      await updateTimetableBlock(editingBlock.id, data);
    } else {
      await addTimetableBlock(data);
    }
    setShowAddModal(false);
  };

  const handleDeleteBlock = async (id: string) => {
    if (confirm("Delete this event from today's schedule?")) {
      await deleteTimetableBlock(id);
    }
  };

  // Calculations for display
  const totalCount = dateBlocks.length;
  const completedCount = dateBlocks.filter(b => b.completed).length;
  const rate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Date Selector Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-2xl glass">
        <div className="flex items-center gap-3">
          <CheckSquare className="text-primary" size={24} />
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Daily Execution Tracker</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Track, complete, and update study goals dynamically.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center bg-secondary/50 border border-border/40 px-3 py-1.5 rounded-xl">
            <CalendarIcon size={16} className="text-muted-foreground mr-2" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-sm text-white focus:outline-none cursor-pointer scheme-dark"
            />
          </div>

          <button
            onClick={() => handleOpenAddModal()}
            className="flex items-center gap-1.5 bg-primary hover:bg-primary/95 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-primary/20 transition"
          >
            <Plus size={14} /> Add One-off Block
          </button>
        </div>
      </div>

      {/* Completion Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl glass border border-border/30">
          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Scheduled Tasks</span>
          <p className="text-3xl font-extrabold text-white mt-1.5 font-mono">{totalCount}</p>
        </div>
        <div className="p-5 rounded-2xl glass border border-border/30">
          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Completed Tasks</span>
          <p className="text-3xl font-extrabold text-emerald-400 mt-1.5 font-mono">{completedCount}</p>
        </div>
        <div className="p-5 rounded-2xl glass border border-border/30">
          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Daily Success Rate</span>
          <div className="flex items-baseline gap-2 mt-1.5">
            <p className="text-3xl font-extrabold text-primary font-mono">{rate}%</p>
            <span className="text-xs text-muted-foreground font-medium">completion</span>
          </div>
        </div>
      </div>

      {/* Daily schedule blocks tracker */}
      <div className="p-6 rounded-2xl glass space-y-4">
        <h3 className="text-lg font-bold text-white tracking-tight">Timeline logs</h3>

        {dateBlocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border/60 rounded-xl bg-secondary/10">
            <AlertCircle size={32} className="text-muted-foreground/50 mb-2" />
            <p className="text-sm font-semibold text-muted-foreground">No timetable blocks registered for this date.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Configure your active timetable templates in the Planner view to pre-populate dates.</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {dateBlocks.map((block) => {
              const cat = categories.find(c => c.id === block.category_id);
              const sub = subjects.find(s => s.id === block.study_subject_id);
              const mod = modules.find(m => m.id === block.study_module_id);
              const lec = lectures.find(l => l.id === block.study_lecture_id);

              return (
                <div
                  key={block.id}
                  className={`
                    flex flex-col md:flex-row md:items-center md:justify-between p-4 rounded-xl border transition-all duration-200 gap-4
                    ${block.completed 
                      ? 'bg-emerald-950/5 border-emerald-900/30' 
                      : 'bg-secondary/10 border-border/30 hover:border-border/60'
                    }
                  `}
                >
                  <div className="flex items-start gap-4">
                    {/* Completion checkbox */}
                    <button
                      onClick={() => handleToggleComplete(block)}
                      className={`
                        w-6 h-6 rounded-lg border mt-1 flex items-center justify-center transition shrink-0
                        ${block.completed
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-muted-foreground/40 hover:border-primary bg-secondary/40'
                        }
                      `}
                    >
                      {block.completed && <CheckSquare size={14} className="text-white" />}
                    </button>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className={`text-sm font-semibold ${block.completed ? 'text-white/40 line-through' : 'text-white'}`}>
                          {block.title}
                        </h4>
                        {cat && (
                          <span
                            className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                            style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                          >
                            {cat.name}
                          </span>
                        )}
                        {block.completed && block.completion_time && (
                          <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono">
                            Done at {new Date(block.completion_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock size={12} />
                        <span className="font-mono">{block.start_time} - {block.end_time}</span>
                        {block.notes && <span className="text-muted-foreground/60">• {block.notes}</span>}
                      </div>

                      {/* Study Mapping Meta Details */}
                      {(sub || mod || lec) && (
                        <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-border/10">
                          <BookOpen size={10} className="text-primary" />
                          {sub && (
                            <span className="text-[10px] text-white/80 font-medium">
                              {sub.name}
                            </span>
                          )}
                          {mod && (
                            <span className="text-[10px] text-muted-foreground">
                              → {mod.name}
                            </span>
                          )}
                          {lec && (
                            <span className="text-[10px] text-muted-foreground">
                              → L{lec.lecture_number}: {lec.title}
                            </span>
                          )}
                          {block.study_goal_type && (
                            <span className="text-[9px] bg-primary/10 border border-primary/20 text-primary px-1.5 py-0.5 rounded ml-2">
                              {block.study_goal_type}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions column */}
                  <div className="flex items-center gap-2 self-end md:self-center ml-10 md:ml-0">
                    <button
                      onClick={() => handleOpenAddModal(block)}
                      className="p-1.5 rounded-lg bg-secondary/40 text-muted-foreground hover:text-white hover:bg-secondary/70 transition"
                      title="Edit Mapping / Notes"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteBlock(block.id)}
                      className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:text-red-300 hover:bg-red-500/20 transition"
                      title="Delete Block"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Custom tracker block modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-card border border-border/80 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-border/30 pb-3">
              <h3 className="text-lg font-bold text-white">{editingBlock ? 'Edit Block Details' : 'Add One-off Block'}</h3>
              <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-white transition">✕</button>
            </div>

            <form onSubmit={handleSaveBlock} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground font-semibold">Start Time</label>
                  <input
                    type="time"
                    required
                    value={blockStart}
                    onChange={(e) => setBlockStart(e.target.value)}
                    className="w-full mt-1 bg-secondary/40 border border-border/40 text-sm text-white rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-semibold">End Time</label>
                  <input
                    type="time"
                    required
                    value={blockEnd}
                    onChange={(e) => setBlockEnd(e.target.value)}
                    className="w-full mt-1 bg-secondary/40 border border-border/40 text-sm text-white rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-semibold">Block Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Extra Revision, Workout Session"
                  value={blockTitle}
                  onChange={(e) => setBlockTitle(e.target.value)}
                  className="w-full mt-1 bg-secondary/40 border border-border/40 text-sm text-white rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-semibold">Category</label>
                <select
                  value={blockCategory}
                  onChange={(e) => setBlockCategory(e.target.value)}
                  className="w-full mt-1 bg-secondary/40 border border-border/40 text-sm text-white rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Study specific fields */}
              {(blockCategory === 'cat-study' || categories.find(c => c.id === blockCategory)?.name === 'Study') && (
                <div className="p-4 rounded-xl bg-secondary/20 border border-border/40 space-y-3">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Study Mapping</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-muted-foreground font-semibold">Subject</label>
                      <select
                        value={studySubjectId}
                        onChange={(e) => {
                          setStudySubjectId(e.target.value);
                          setStudyModuleId('');
                          setStudyLectureId('');
                        }}
                        className="w-full mt-1 bg-secondary/40 border border-border/40 text-xs text-white rounded-lg p-2 focus:outline-none"
                      >
                        <option value="">Select Subject</option>
                        {subjects.filter(s => !s.is_archived).map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-muted-foreground font-semibold">Module</label>
                      <select
                        value={studyModuleId}
                        disabled={!studySubjectId}
                        onChange={(e) => {
                          setStudyModuleId(e.target.value);
                          setStudyLectureId('');
                        }}
                        className="w-full mt-1 bg-secondary/40 border border-border/40 text-xs text-white rounded-lg p-2 focus:outline-none disabled:opacity-50"
                      >
                        <option value="">Select Module</option>
                        {modules.filter(m => m.subject_id === studySubjectId).map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-muted-foreground font-semibold">Lecture</label>
                      <select
                        value={studyLectureId}
                        disabled={!studyModuleId}
                        onChange={(e) => setStudyLectureId(e.target.value)}
                        className="w-full mt-1 bg-secondary/40 border border-border/40 text-xs text-white rounded-lg p-2 focus:outline-none disabled:opacity-50"
                      >
                        <option value="">Select Lecture</option>
                        {lectures.filter(l => l.module_id === studyModuleId).map(l => (
                          <option key={l.id} value={l.id}>L{l.lecture_number}: {l.title}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-muted-foreground font-semibold">Goal Type</label>
                      <select
                        value={studyGoalType}
                        onChange={(e) => setStudyGoalType(e.target.value as StudyGoalType)}
                        className="w-full mt-1 bg-secondary/40 border border-border/40 text-xs text-white rounded-lg p-2 focus:outline-none"
                      >
                        <option value="Lecture">Lecture</option>
                        <option value="Practice">Practice</option>
                        <option value="Module Practice">Module Practice</option>
                        <option value="PYQs">PYQs</option>
                        <option value="Revision">Revision</option>
                        <option value="Mock">Mock Test</option>
                        <option value="Assignment">Assignment</option>
                        <option value="Custom">Custom</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-muted-foreground font-semibold">Remarks / Notes</label>
                <textarea
                  placeholder="Notes, links, details for this task block..."
                  value={blockNotes}
                  onChange={(e) => setBlockNotes(e.target.value)}
                  className="w-full mt-1 bg-secondary/40 border border-border/40 text-sm text-white rounded-xl px-3 py-2 focus:ring-1 focus:ring-primary focus:outline-none h-20"
                />
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-border/30">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-secondary/40 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1 bg-primary hover:bg-primary/95 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
                >
                  <Save size={14} /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

