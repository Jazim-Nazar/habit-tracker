import React, { useState } from 'react';
import { 
  Plus, Copy, Trash2, Edit2, 
  Check, Calendar, ArrowRight, Settings as SettingsIcon,
  FolderPlus, Save, AlertCircle, Sparkles
} from 'lucide-react';
import { useDatabase } from '../../context/database.context';
import { TimetableBlock, Category, StudyGoalType } from '../../lib/db/db.types';

export const Planner: React.FC = () => {
  const {
    categories, addCategory,
    subjects, modules, lectures,
    templates, addTemplate, updateTemplate, deleteTemplate, duplicateTemplate, setActiveTemplate,
    timetableBlocks, addTimetableBlock, updateTimetableBlock, deleteTimetableBlock, copyTimetableToDay
  } = useDatabase();

  const [activeTabDay, setActiveTabDay] = useState<number>(1); // 1 = Monday
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  
  // Modals state
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [editingBlock, setEditingBlock] = useState<TimetableBlock | null>(null);
  
  // Template modal state
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [duplicatingTplId, setDuplicatingTplId] = useState<string | null>(null);

  // Block Form State
  const [blockTitle, setBlockTitle] = useState('');
  const [blockStart, setBlockStart] = useState('09:00');
  const [blockEnd, setBlockEnd] = useState('10:00');
  const [blockCategory, setBlockCategory] = useState('');
  const [blockNotes, setBlockNotes] = useState('');
  
  // Study-specific Form State
  const [studySubjectId, setStudySubjectId] = useState('');
  const [studyModuleId, setStudyModuleId] = useState('');
  const [studyLectureId, setStudyLectureId] = useState('');
  const [studyGoalType, setStudyGoalType] = useState<StudyGoalType>('Lecture');

  // Copy schedule state
  const [copyTargetDay, setCopyTargetDay] = useState<number>(2);

  // Custom Category inline creation state
  const [showCustomCatInput, setShowCustomCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#8b5cf6');
  const [newCatIcon, setNewCatIcon] = useState('BookOpen');

  // Resolve template active
  const activeTemplate = templates.find(t => t.is_active) || templates[0];
  const currentTemplateId = selectedTemplateId || activeTemplate?.id || '';

  // Get blocks for currently selected template and day of week
  const filteredBlocks = timetableBlocks.filter(b => 
    b.template_id === currentTemplateId && b.day_of_week === activeTabDay
  ).sort((a, b) => a.start_time.localeCompare(b.start_time));

  // Day list
  const daysOfWeek = [
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
    { value: 0, label: 'Sunday' }
  ];

  const handleOpenBlockModal = (block?: TimetableBlock) => {
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
    setShowBlockModal(true);
  };

  const handleSaveBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTemplateId) {
      alert("Please select or create a routine template first.");
      return;
    }

    const blockData = {
      template_id: currentTemplateId,
      day_of_week: activeTabDay,
      date: null,
      title: blockTitle,
      start_time: blockStart,
      end_time: blockEnd,
      category_id: blockCategory || null,
      notes: blockNotes,
      completed: false,
      study_subject_id: studySubjectId || null,
      study_module_id: studyModuleId || null,
      study_lecture_id: studyLectureId || null,
      study_goal_type: (blockCategory === 'cat-study' || categories.find(c => c.id === blockCategory)?.name === 'Study') ? studyGoalType : null
    };

    if (editingBlock) {
      await updateTimetableBlock(editingBlock.id, blockData);
    } else {
      await addTimetableBlock(blockData);
    }
    
    setShowBlockModal(false);
  };

  const handleDeleteBlock = async (id: string) => {
    if (confirm("Delete this block?")) {
      await deleteTimetableBlock(id);
    }
  };

  const handleDuplicateBlock = async (block: TimetableBlock) => {
    const { id, ...copiedData } = block;
    await addTimetableBlock({
      ...copiedData,
      title: `${block.title} (Copy)`
    });
  };

  const handleCopyDay = async () => {
    if (!currentTemplateId) return;
    await copyTimetableToDay(activeTabDay, copyTargetDay, currentTemplateId);
    alert(`Copied schedule from ${daysOfWeek.find(d => d.value === activeTabDay)?.label} to ${daysOfWeek.find(d => d.value === copyTargetDay)?.label}!`);
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) return;

    if (duplicatingTplId) {
      await duplicateTemplate(duplicatingTplId, newTemplateName);
    } else {
      const newTpl = await addTemplate({ name: newTemplateName, is_active: false });
      setSelectedTemplateId(newTpl.id);
    }
    
    setNewTemplateName('');
    setDuplicatingTplId(null);
    setShowTemplateModal(false);
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    const newCat = await addCategory({
      name: newCatName,
      color: newCatColor,
      icon: newCatIcon,
      is_custom: true
    });
    setBlockCategory(newCat.id);
    setNewCatName('');
    setShowCustomCatInput(false);
  };

  return (
    <div className="space-y-6">
      {/* Header and Template Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6 rounded-2xl glass">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Calendar className="text-primary" />
            Timetable Builder
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Design daily schedules, duplicate block structures, and copy routines.</p>
        </div>

        {/* Templates Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-semibold">Active Routine:</span>
            <select
              value={currentTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="bg-secondary/60 border border-border/60 text-sm text-white rounded-xl px-3 py-2 focus:ring-1 focus:ring-primary focus:outline-none"
            >
              {templates.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.is_active ? '★' : ''}
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={() => {
              setDuplicatingTplId(null);
              setShowTemplateModal(true);
            }}
            className="flex items-center gap-1.5 bg-primary/25 border border-primary/40 hover:bg-primary/45 text-primary text-xs font-semibold px-3 py-2 rounded-xl transition"
          >
            <Plus size={14} /> New
          </button>

          {currentTemplateId && (
            <>
              <button
                onClick={() => {
                  setDuplicatingTplId(currentTemplateId);
                  setNewTemplateName(`${templates.find(t => t.id === currentTemplateId)?.name} Copy`);
                  setShowTemplateModal(true);
                }}
                className="bg-secondary/40 border border-border/60 hover:bg-secondary/70 text-white text-xs font-semibold px-3 py-2 rounded-xl transition"
              >
                Duplicate
              </button>
              
              {!templates.find(t => t.id === currentTemplateId)?.is_active && (
                <button
                  onClick={async () => {
                    await setActiveTemplate(currentTemplateId);
                    alert("Routine activated!");
                  }}
                  className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold px-3 py-2 rounded-xl transition"
                >
                  Activate
                </button>
              )}
              
              {templates.length > 1 && (
                <button
                  onClick={async () => {
                    if (confirm("Delete this template? All blocks inside will be deleted.")) {
                      await deleteTemplate(currentTemplateId);
                      setSelectedTemplateId('');
                    }
                  }}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 p-2 rounded-xl transition"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Weekday navigation & Copy Schedule Tool */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Days Tab Menu */}
        <div className="lg:col-span-3 space-y-4">
          {/* Day Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {daysOfWeek.map(day => (
              <button
                key={day.value}
                onClick={() => setActiveTabDay(day.value)}
                className={`
                  px-4 py-2 text-sm font-semibold rounded-xl transition-all whitespace-nowrap
                  ${activeTabDay === day.value 
                    ? 'bg-primary text-white shadow-md shadow-primary/10' 
                    : 'bg-secondary/30 border border-border/40 text-muted-foreground hover:text-white hover:bg-secondary/50'
                  }
                `}
              >
                {day.label}
              </button>
            ))}
          </div>

          {/* Schedule List */}
          <div className="p-6 rounded-2xl glass space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white tracking-tight">
                {daysOfWeek.find(d => d.value === activeTabDay)?.label}'s Blocks
              </h3>
              <button
                onClick={() => handleOpenBlockModal()}
                className="flex items-center gap-1 bg-primary hover:bg-primary/90 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-lg shadow-primary/15 transition"
              >
                <Plus size={14} /> Add Block
              </button>
            </div>

            {filteredBlocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border/60 rounded-2xl bg-secondary/10">
                <AlertCircle size={32} className="text-muted-foreground/50 mb-2" />
                <p className="text-sm font-medium text-muted-foreground">No blocks designed for this day.</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Start by adding a new block or copy from another day.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBlocks.map((block) => {
                  const blockCat = categories.find(c => c.id === block.category_id);
                  return (
                    <div 
                      key={block.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-secondary/10 border border-border/30 hover:border-border/60 transition group"
                    >
                      <div className="flex items-center gap-4">
                        {/* Time Block Indicator */}
                        <div 
                          className="w-1.5 h-10 rounded-full" 
                          style={{ backgroundColor: blockCat?.color || '#a1a1aa' }} 
                        />
                        <div>
                          <h4 className="text-sm font-semibold text-white">{block.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground font-mono font-medium">
                              {block.start_time} - {block.end_time}
                            </span>
                            {blockCat && (
                              <span 
                                className="text-[10px] px-2 py-0.5 rounded font-bold"
                                style={{ backgroundColor: `${blockCat.color}15`, color: blockCat.color }}
                              >
                                {blockCat.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => handleOpenBlockModal(block)}
                          className="p-1.5 rounded-lg bg-secondary/40 text-muted-foreground hover:text-white hover:bg-secondary/80 transition"
                          title="Edit"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDuplicateBlock(block)}
                          className="p-1.5 rounded-lg bg-secondary/40 text-muted-foreground hover:text-white hover:bg-secondary/80 transition"
                          title="Duplicate"
                        >
                          <Sparkles size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteBlock(block.id)}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:text-red-300 hover:bg-red-500/20 transition"
                          title="Delete"
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
        </div>

        {/* Copy Schedule Tool sidebar widget */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl glass space-y-4">
            <h3 className="text-md font-bold text-white tracking-tight flex items-center gap-2">
              <Copy size={16} className="text-primary" />
              Copy Schedule
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Quickly copy all timetable blocks of <strong>{daysOfWeek.find(d => d.value === activeTabDay)?.label}</strong> to another day.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Destination Day</label>
                <select
                  value={copyTargetDay}
                  onChange={(e) => setCopyTargetDay(Number(e.target.value))}
                  className="w-full mt-1.5 bg-secondary/50 border border-border/40 text-sm text-white rounded-xl px-3 py-2 focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  {daysOfWeek
                    .filter(d => d.value !== activeTabDay)
                    .map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                </select>
              </div>

              <button
                onClick={handleCopyDay}
                disabled={filteredBlocks.length === 0}
                className="w-full flex items-center justify-center gap-2 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-primary/10"
              >
                Copy Day Schedule <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Block Editor Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-card border border-border/80 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-border/30 pb-3">
              <h3 className="text-lg font-bold text-white">{editingBlock ? 'Edit Time Block' : 'Add Time Block'}</h3>
              <button 
                onClick={() => setShowBlockModal(false)}
                className="text-muted-foreground hover:text-white transition"
              >
                ✕
              </button>
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
                  placeholder="e.g. Study Session, Cardio, Lunch"
                  value={blockTitle}
                  onChange={(e) => setBlockTitle(e.target.value)}
                  className="w-full mt-1 bg-secondary/40 border border-border/40 text-sm text-white rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <label className="text-xs text-muted-foreground font-semibold">Category</label>
                  <button
                    type="button"
                    onClick={() => setShowCustomCatInput(!showCustomCatInput)}
                    className="text-[10px] text-primary font-bold hover:underline"
                  >
                    {showCustomCatInput ? 'Cancel' : '+ Custom Category'}
                  </button>
                </div>

                {showCustomCatInput ? (
                  <div className="mt-2 p-3 rounded-xl bg-secondary/20 border border-border/30 flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Category Name"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="flex-1 bg-secondary/40 border border-border/40 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none"
                    />
                    <input
                      type="color"
                      value={newCatColor}
                      onChange={(e) => setNewCatColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <button
                      type="button"
                      onClick={handleCreateCategory}
                      className="bg-primary text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <select
                    value={blockCategory}
                    onChange={(e) => setBlockCategory(e.target.value)}
                    className="w-full mt-1 bg-secondary/40 border border-border/40 text-sm text-white rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                )}
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
                  placeholder="Notes, links, details for this block..."
                  value={blockNotes}
                  onChange={(e) => setBlockNotes(e.target.value)}
                  className="w-full mt-1 bg-secondary/40 border border-border/40 text-sm text-white rounded-xl px-3 py-2 focus:ring-1 focus:ring-primary focus:outline-none h-20"
                />
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-border/30">
                <button
                  type="button"
                  onClick={() => setShowBlockModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-secondary/40 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1 bg-primary hover:bg-primary/90 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
                >
                  <Save size={14} /> Save Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Template Name Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-card border border-border/80 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">
              {duplicatingTplId ? 'Duplicate Routine Template' : 'New Routine Template'}
            </h3>
            
            <form onSubmit={handleCreateTemplate} className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground font-semibold">Template Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Exam Grind, Lite Days"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  className="w-full mt-1 bg-secondary/40 border border-border/40 text-sm text-white rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setDuplicatingTplId(null);
                    setShowTemplateModal(false);
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-secondary/40 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary/95 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

