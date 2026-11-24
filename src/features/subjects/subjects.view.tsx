import React, { useState } from 'react';
import { 
  Plus, Edit2, Trash2, Copy, Archive, BookOpen, 
  ChevronDown, ChevronRight, CheckCircle2, Circle, 
  Play, Check, Calendar, ArrowUpRight, HelpCircle
} from 'lucide-react';
import { useDatabase } from '../../context/database.context';
import { Subject, Module, Lecture, SubjectPriority, SubjectStatus } from '../../lib/db/db.types';

export const Subjects: React.FC = () => {
  const {
    subjects, addSubject, updateSubject, deleteSubject, duplicateSubject,
    modules, addModule, updateModule, deleteModule,
    lectures, addLecture, updateLecture, deleteLecture
  } = useDatabase();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [showArchived, setShowArchived] = useState(false);
  const [expandedModuleIds, setExpandedModuleIds] = useState<Record<string, boolean>>({});

  // Modals state
  const [showSubModal, setShowSubModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  
  const [showModModal, setShowModModal] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  
  const [showLecModal, setShowLecModal] = useState(false);
  const [editingLecture, setEditingLecture] = useState<Lecture | null>(null);

  // Subject Form State
  const [subName, setSubName] = useState('');
  const [subColor, setSubColor] = useState('#8b5cf6');
  const [subPriority, setSubPriority] = useState<SubjectPriority>('medium');
  const [subStatus, setSubStatus] = useState<SubjectStatus>('Not Started');
  const [subTargetDate, setSubTargetDate] = useState('');
  const [subRemarks, setSubRemarks] = useState('');

  // Module Form State
  const [modName, setModName] = useState('');
  const [modLectureCount, setModLectureCount] = useState(5);

  // Lecture Form State
  const [lecTitle, setLecTitle] = useState('');
  const [lecNumber, setLecNumber] = useState(1);
  const [lecStatus, setLecStatus] = useState<Lecture['status']>('Not Started');
  const [lecRemarks, setLecRemarks] = useState('');

  // Filtering
  const filteredSubjects = subjects.filter(s => s.is_archived === showArchived);
  const activeSubject = subjects.find(s => s.id === selectedSubjectId) || filteredSubjects[0];

  // Set default selection
  React.useEffect(() => {
    if (activeSubject && !selectedSubjectId) {
      setSelectedSubjectId(activeSubject.id);
    }
  }, [activeSubject, selectedSubjectId]);

  // Toggle module expansion
  const toggleModuleExpand = (modId: string) => {
    setExpandedModuleIds(prev => ({
      ...prev,
      [modId]: !prev[modId]
    }));
  };

  // --- SUBJECT CRUD ---
  const handleOpenSubjectModal = (sub?: Subject) => {
    if (sub) {
      setEditingSubject(sub);
      setSubName(sub.name);
      setSubColor(sub.color);
      setSubPriority(sub.priority);
      setSubStatus(sub.status);
      setSubTargetDate(sub.target_completion_date || '');
      setSubRemarks(sub.remarks || '');
    } else {
      setEditingSubject(null);
      setSubName('');
      setSubColor('#8b5cf6');
      setSubPriority('medium');
      setSubStatus('Not Started');
      setSubTargetDate('');
      setSubRemarks('');
    }
    setShowSubModal(true);
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: subName,
      color: subColor,
      priority: subPriority,
      status: subStatus,
      target_completion_date: subTargetDate || undefined,
      remarks: subRemarks,
      is_archived: editingSubject ? editingSubject.is_archived : false
    };

    if (editingSubject) {
      await updateSubject(editingSubject.id, data);
    } else {
      const res = await addSubject(data);
      setSelectedSubjectId(res.id);
    }
    setShowSubModal(false);
  };

  const handleDeleteSubject = async (id: string) => {
    if (confirm("Delete this subject and all its modules and lectures? This cannot be undone.")) {
      await deleteSubject(id);
      setSelectedSubjectId('');
    }
  };

  const handleDuplicateSubject = async (id: string) => {
    await duplicateSubject(id);
    alert("Subject duplicated successfully!");
  };

  // --- MODULE CRUD ---
  const handleOpenModuleModal = (mod?: Module) => {
    if (mod) {
      setEditingModule(mod);
      setModName(mod.name);
      setModLectureCount(mod.lecture_count);
    } else {
      setEditingModule(null);
      setModName('');
      const currentModules = modules.filter(m => m.subject_id === activeSubject?.id);
      setModLectureCount(5);
    }
    setShowModModal(true);
  };

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubject) return;

    if (editingModule) {
      await updateModule(editingModule.id, {
        name: modName,
        lecture_count: modLectureCount
      });
    } else {
      const newMod = await addModule({
        subject_id: activeSubject.id,
        name: modName,
        lecture_count: modLectureCount,
        current_lecture: 0,
        status: 'Not Started',
        pyqs_completed: false,
        revision_completed: false
      });
      // Auto-create blank lectures matching modLectureCount
      for (let i = 1; i <= modLectureCount; i++) {
        await addLecture({
          module_id: newMod.id,
          lecture_number: i,
          title: `Lecture ${i}`,
          status: 'Not Started',
          notes_done: false,
          practice_done: false,
          pyqs_done: false,
          revision_done: false
        });
      }
    }
    setShowModModal(false);
  };

  const handleDeleteModule = async (id: string) => {
    if (confirm("Delete this module and all its lectures?")) {
      await deleteModule(id);
    }
  };

  // --- LECTURE CRUD ---
  const handleOpenLectureModal = (lec: Lecture) => {
    setEditingLecture(lec);
    setLecTitle(lec.title);
    setLecNumber(lec.lecture_number);
    setLecStatus(lec.status);
    setLecRemarks(lec.remarks || '');
    setShowLecModal(true);
  };

  const handleSaveLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLecture) return;

    await updateLecture(editingLecture.id, {
      title: lecTitle,
      lecture_number: lecNumber,
      status: lecStatus,
      remarks: lecRemarks,
      completed_date: lecStatus === 'Completed' ? new Date().toISOString() : undefined
    });
    
    setShowLecModal(false);
  };

  const handleToggleLecCheck = async (lec: Lecture, field: 'notes_done' | 'practice_done' | 'pyqs_done' | 'revision_done') => {
    const updatedVal = !lec[field];
    await updateLecture(lec.id, { [field]: updatedVal });
  };

  // Stats calculation
  const subModules = activeSubject ? modules.filter(m => m.subject_id === activeSubject.id) : [];
  const moduleIds = subModules.map(m => m.id);
  const subLectures = lectures.filter(l => moduleIds.includes(l.module_id));
  
  const completedLecCount = subLectures.filter(l => l.status === 'Completed').length;
  const totalLecCount = subLectures.length;
  const progressPercent = totalLecCount > 0 ? Math.round((completedLecCount / totalLecCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex justify-between items-center p-6 rounded-2xl glass">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="text-primary" />
            Curriculum Builder
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5 font-medium">Manage subjects, modules, and track micro-lecture completions.</p>
        </div>
        <button
          onClick={() => handleOpenSubjectModal()}
          className="flex items-center gap-1 bg-primary hover:bg-primary/95 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-primary/20 transition"
        >
          <Plus size={14} /> Add Subject
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side: Subjects Navigation Panel */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-secondary/20 border border-border/40 flex justify-between items-center">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Subjects</span>
            <button
              onClick={() => {
                setShowArchived(!showArchived);
                setSelectedSubjectId('');
              }}
              className="text-[10px] text-primary hover:underline font-semibold"
            >
              {showArchived ? 'View Active' : 'View Archived'}
            </button>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredSubjects.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No subjects found.</p>
            ) : (
              filteredSubjects.map(sub => {
                const subMods = modules.filter(m => m.subject_id === sub.id);
                const subModsIds = subMods.map(m => m.id);
                const subLecs = lectures.filter(l => subModsIds.includes(l.module_id));
                const comp = subLecs.filter(l => l.status === 'Completed').length;
                const tot = subLecs.length;
                const subPct = tot > 0 ? Math.round((comp / tot) * 100) : 0;

                const isSelected = activeSubject?.id === sub.id;

                return (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedSubjectId(sub.id)}
                    className={`
                      w-full text-left p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between gap-3
                      ${isSelected 
                        ? 'bg-secondary/40 border-primary shadow-lg shadow-primary/5' 
                        : 'bg-secondary/10 border-border/30 hover:border-border/60'
                      }
                    `}
                  >
                    <div className="flex justify-between items-start w-full">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sub.color }} />
                        <span className="text-sm font-semibold text-white truncate max-w-[130px]">{sub.name}</span>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                        sub.priority === 'high' 
                          ? 'bg-red-500/10 text-red-400' 
                          : sub.priority === 'medium' 
                            ? 'bg-amber-500/10 text-amber-400' 
                            : 'bg-blue-500/10 text-blue-400'
                      }`}>
                        {sub.priority}
                      </span>
                    </div>
                    
                    <div className="w-full">
                      <div className="flex justify-between text-[10px] text-muted-foreground mb-1 font-medium">
                        <span>Progress</span>
                        <span>{subPct}%</span>
                      </div>
                      <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all" 
                          style={{ width: `${subPct}%`, backgroundColor: sub.color }}
                        />
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Active Subject detail and nested checklist */}
        <div className="lg:col-span-3 space-y-6">
          {activeSubject ? (
            <div className="space-y-6">
              {/* Subject Detail header */}
              <div className="p-6 rounded-2xl glass border border-border/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: activeSubject.color }} />
                    <h3 className="text-xl font-bold text-white tracking-tight">{activeSubject.name}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 max-w-xl">{activeSubject.remarks || 'No remarks added.'}</p>
                  
                  {activeSubject.target_completion_date && (
                    <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground font-semibold">
                      <Calendar size={12} />
                      Target Date: <span className="text-white">{activeSubject.target_completion_date}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => handleOpenSubjectModal(activeSubject)}
                    className="p-2.5 rounded-xl bg-secondary/40 border border-border/60 hover:bg-secondary/70 text-muted-foreground hover:text-white transition"
                    title="Edit Subject Info"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDuplicateSubject(activeSubject.id)}
                    className="p-2.5 rounded-xl bg-secondary/40 border border-border/60 hover:bg-secondary/70 text-muted-foreground hover:text-white transition"
                    title="Duplicate Subject Structure"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={async () => {
                      await updateSubject(activeSubject.id, { is_archived: !activeSubject.is_archived });
                      alert(activeSubject.is_archived ? "Subject unarchived!" : "Subject archived!");
                      setSelectedSubjectId('');
                    }}
                    className="p-2.5 rounded-xl bg-secondary/40 border border-border/60 hover:bg-secondary/70 text-muted-foreground hover:text-white transition"
                    title={activeSubject.is_archived ? 'Activate' : 'Archive'}
                  >
                    <Archive size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteSubject(activeSubject.id)}
                    className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 transition"
                    title="Delete Subject"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Modules List Accordion */}
              <div className="p-6 rounded-2xl glass space-y-4">
                <div className="flex justify-between items-center border-b border-border/30 pb-3">
                  <h4 className="text-md font-bold text-white tracking-tight">Modules & Lectures</h4>
                  <button
                    onClick={() => handleOpenModuleModal()}
                    className="flex items-center gap-1 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20 text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                  >
                    <Plus size={12} /> Add Module
                  </button>
                </div>

                {subModules.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground text-xs">
                    No modules created in this subject. Click "Add Module" to start.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {subModules.map(mod => {
                      const modLecs = lectures.filter(l => l.module_id === mod.id);
                      const modComp = modLecs.filter(l => l.status === 'Completed').length;
                      const modTotal = modLecs.length;
                      const modPct = modTotal > 0 ? Math.round((modComp / modTotal) * 100) : 0;
                      
                      const isExpanded = !!expandedModuleIds[mod.id];

                      return (
                        <div 
                          key={mod.id} 
                          className="border border-border/40 rounded-xl overflow-hidden bg-secondary/5"
                        >
                          {/* Module Header Row */}
                          <div 
                            className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-secondary/10 border-b border-border/20 gap-3 cursor-pointer hover:bg-secondary/20 transition-all"
                            onClick={() => toggleModuleExpand(mod.id)}
                          >
                            <div className="flex items-center gap-3">
                              {isExpanded ? <ChevronDown size={16} className="text-muted-foreground" /> : <ChevronRight size={16} className="text-muted-foreground" />}
                              <div>
                                <h5 className="text-sm font-semibold text-white">{mod.name}</h5>
                                <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                                  Lectures completed: {modComp}/{modTotal} ({modPct}%)
                                </p>
                              </div>
                            </div>

                            {/* Checkboxes & status rollup */}
                            <div className="flex items-center gap-4 flex-wrap ml-7 md:ml-0" onClick={e => e.stopPropagation()}>
                              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={mod.pyqs_completed}
                                  onChange={async () => await updateModule(mod.id, { pyqs_completed: !mod.pyqs_completed })}
                                  className="rounded border-border/60 bg-secondary/50 text-primary focus:ring-0 focus:ring-offset-0 cursor-pointer h-3.5 w-3.5"
                                />
                                <span>PYQs Done</span>
                              </label>

                              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={mod.revision_completed}
                                  onChange={async () => await updateModule(mod.id, { revision_completed: !mod.revision_completed })}
                                  className="rounded border-border/60 bg-secondary/50 text-primary focus:ring-0 focus:ring-offset-0 cursor-pointer h-3.5 w-3.5"
                                />
                                <span>Revision</span>
                              </label>

                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                mod.status === 'Completed' 
                                  ? 'bg-emerald-500/10 text-emerald-400' 
                                  : mod.status === 'In Progress' 
                                    ? 'bg-primary/10 text-primary' 
                                    : 'bg-muted/40 text-muted-foreground'
                              }`}>
                                {mod.status}
                              </span>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleOpenModuleModal(mod)}
                                  className="p-1 rounded text-muted-foreground hover:text-white hover:bg-secondary transition"
                                  title="Edit Module"
                                >
                                  <Edit2 size={11} />
                                </button>
                                <button
                                  onClick={() => handleDeleteModule(mod.id)}
                                  className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-500/10 transition"
                                  title="Delete Module"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Expanded Lectures Tree */}
                          {isExpanded && (
                            <div className="p-4 space-y-2 bg-secondary/5">
                              {modLecs.length === 0 ? (
                                <p className="text-[11px] text-muted-foreground text-center py-4">No lectures in this module.</p>
                              ) : (
                                <div className="space-y-1.5">
                                  {modLecs.map(lec => (
                                    <div 
                                      key={lec.id}
                                      className="flex flex-col md:flex-row md:items-center justify-between p-3 rounded-lg bg-secondary/20 border border-border/20 hover:border-border/40 transition gap-2"
                                    >
                                      {/* Lecture Title/Num */}
                                      <div className="flex items-center gap-2.5">
                                        <span className="font-mono text-xs font-bold text-primary">L{lec.lecture_number}</span>
                                        <span className="text-xs text-white font-medium">{lec.title}</span>
                                        {lec.remarks && (
                                          <span className="text-[10px] text-muted-foreground italic truncate max-w-[150px]">
                                            ({lec.remarks})
                                          </span>
                                        )}
                                      </div>

                                      {/* Completeness tasks */}
                                      <div className="flex items-center gap-3.5 flex-wrap ml-6 md:ml-0">
                                        {/* Notes Done */}
                                        <label className="flex items-center gap-1 text-[11px] text-muted-foreground cursor-pointer select-none">
                                          <input
                                            type="checkbox"
                                            checked={lec.notes_done}
                                            onChange={() => handleToggleLecCheck(lec, 'notes_done')}
                                            className="rounded border-border/60 bg-secondary text-primary focus:ring-0 cursor-pointer h-3 w-3"
                                          />
                                          <span>Notes</span>
                                        </label>

                                        {/* Practice Done */}
                                        <label className="flex items-center gap-1 text-[11px] text-muted-foreground cursor-pointer select-none">
                                          <input
                                            type="checkbox"
                                            checked={lec.practice_done}
                                            onChange={() => handleToggleLecCheck(lec, 'practice_done')}
                                            className="rounded border-border/60 bg-secondary text-primary focus:ring-0 cursor-pointer h-3 w-3"
                                          />
                                          <span>Practice</span>
                                        </label>

                                        {/* PYQs Done */}
                                        <label className="flex items-center gap-1 text-[11px] text-muted-foreground cursor-pointer select-none">
                                          <input
                                            type="checkbox"
                                            checked={lec.pyqs_done}
                                            onChange={() => handleToggleLecCheck(lec, 'pyqs_done')}
                                            className="rounded border-border/60 bg-secondary text-primary focus:ring-0 cursor-pointer h-3 w-3"
                                          />
                                          <span>PYQs</span>
                                        </label>

                                        {/* Revision Done */}
                                        <label className="flex items-center gap-1 text-[11px] text-muted-foreground cursor-pointer select-none">
                                          <input
                                            type="checkbox"
                                            checked={lec.revision_done}
                                            onChange={() => handleToggleLecCheck(lec, 'revision_done')}
                                            className="rounded border-border/60 bg-secondary text-primary focus:ring-0 cursor-pointer h-3 w-3"
                                          />
                                          <span>Rev</span>
                                        </label>

                                        {/* Status Rollup Selector */}
                                        <select
                                          value={lec.status}
                                          onChange={async (e) => {
                                            const newStatus = e.target.value as Lecture['status'];
                                            await updateLecture(lec.id, { 
                                              status: newStatus,
                                              completed_date: newStatus === 'Completed' ? new Date().toISOString() : undefined
                                            });
                                          }}
                                          className="bg-secondary/80 border border-border/40 text-[10px] text-white rounded px-1.5 py-0.5 focus:outline-none cursor-pointer"
                                        >
                                          <option value="Not Started">Not Started</option>
                                          <option value="In Progress">In Progress</option>
                                          <option value="Completed">Completed</option>
                                        </select>

                                        <button
                                          onClick={() => handleOpenLectureModal(lec)}
                                          className="p-1 rounded text-muted-foreground hover:text-white hover:bg-secondary transition"
                                        >
                                          <Edit2 size={10} />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              <button
                                onClick={async () => {
                                  const nextNum = modLecs.length > 0 
                                    ? Math.max(...modLecs.map(l => l.lecture_number)) + 1 
                                    : 1;
                                  await addLecture({
                                    module_id: mod.id,
                                    lecture_number: nextNum,
                                    title: `Lecture ${nextNum}`,
                                    status: 'Not Started',
                                    notes_done: false,
                                    practice_done: false,
                                    pyqs_done: false,
                                    revision_done: false
                                  });
                                }}
                                className="mt-3 w-full border border-dashed border-border/40 hover:border-border/80 text-muted-foreground hover:text-white text-[11px] py-1.5 rounded-lg transition"
                              >
                                + Add Lecture
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center glass rounded-2xl min-h-[300px]">
              <BookOpen size={36} className="text-muted-foreground/40 mb-3" />
              <p className="text-sm font-semibold text-muted-foreground">No active subjects created.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Design your curriculum by adding a subject at the top right.</p>
            </div>
          )}
        </div>
      </div>

      {/* Subject Form Modal */}
      {showSubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card border border-border/80 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">{editingSubject ? 'Edit Subject' : 'New Subject'}</h3>
            <form onSubmit={handleSaveSubject} className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground font-semibold">Subject Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Engineering Mathematics, Fitness, Guitar"
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  className="w-full mt-1 bg-secondary/40 border border-border/40 text-sm text-white rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground font-semibold">Priority</label>
                  <select
                    value={subPriority}
                    onChange={(e) => setSubPriority(e.target.value as SubjectPriority)}
                    className="w-full mt-1 bg-secondary/40 border border-border/40 text-sm text-white rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground font-semibold">Color</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={subColor}
                      onChange={(e) => setSubColor(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span className="font-mono text-xs text-white">{subColor}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground font-semibold">Status</label>
                  <select
                    value={subStatus}
                    onChange={(e) => setSubStatus(e.target.value as SubjectStatus)}
                    className="w-full mt-1 bg-secondary/40 border border-border/40 text-sm text-white rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground font-semibold">Target Completion</label>
                  <input
                    type="date"
                    value={subTargetDate}
                    onChange={(e) => setSubTargetDate(e.target.value)}
                    className="w-full mt-1 bg-secondary/40 border border-border/40 text-sm text-white rounded-xl px-3 py-2 focus:ring-1 focus:ring-primary focus:outline-none scheme-dark"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-semibold">Remarks</label>
                <textarea
                  placeholder="Notes, study tips, or details about exam weighting..."
                  value={subRemarks}
                  onChange={(e) => setSubRemarks(e.target.value)}
                  className="w-full mt-1 bg-secondary/40 border border-border/40 text-sm text-white rounded-xl px-3 py-2 focus:ring-1 focus:ring-primary focus:outline-none h-20"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t border-border/30">
                <button
                  type="button"
                  onClick={() => setShowSubModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-secondary/40 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary/95 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Module Form Modal */}
      {showModModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-card border border-border/80 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">{editingModule ? 'Edit Module' : 'New Module'}</h3>
            <form onSubmit={handleSaveModule} className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground font-semibold">Module Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chapter 1: Limits & Continuity"
                  value={modName}
                  onChange={(e) => setModName(e.target.value)}
                  className="w-full mt-1 bg-secondary/40 border border-border/40 text-sm text-white rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              {!editingModule && (
                <div>
                  <label className="text-xs text-muted-foreground font-semibold">Initial Lectures Count</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    required
                    value={modLectureCount}
                    onChange={(e) => setModLectureCount(Number(e.target.value))}
                    className="w-full mt-1 bg-secondary/40 border border-border/40 text-sm text-white rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1.5">This will automatically scaffold this number of placeholder lectures.</p>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowModModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-secondary/40 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary/95 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
                >
                  Save Module
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lecture Form Modal */}
      {showLecModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-card border border-border/80 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Edit Lecture Details</h3>
            <form onSubmit={handleSaveLecture} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="text-xs text-muted-foreground font-semibold">Lec #</label>
                  <input
                    type="number"
                    required
                    value={lecNumber}
                    onChange={(e) => setLecNumber(Number(e.target.value))}
                    className="w-full mt-1 bg-secondary/40 border border-border/40 text-sm text-white rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground font-semibold">Lecture Title</label>
                  <input
                    type="text"
                    required
                    placeholder="Lecture Topic"
                    value={lecTitle}
                    onChange={(e) => setLecTitle(e.target.value)}
                    className="w-full mt-1 bg-secondary/40 border border-border/40 text-sm text-white rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-semibold">Status</label>
                <select
                  value={lecStatus}
                  onChange={(e) => setLecStatus(e.target.value as Lecture['status'])}
                  className="w-full mt-1 bg-secondary/40 border border-border/40 text-sm text-white rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-semibold">Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Tricky formulas, re-watch section"
                  value={lecRemarks}
                  onChange={(e) => setLecRemarks(e.target.value)}
                  className="w-full mt-1 bg-secondary/40 border border-border/40 text-sm text-white rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowLecModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-secondary/40 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary/95 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
                >
                  Save Lecture
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

