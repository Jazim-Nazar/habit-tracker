import React, { useState } from 'react';
import { 
  Award, Plus, Calendar, BookOpen, Clock, 
  Percent, AlertTriangle, FileText, Check, Save, Trash2, Edit2
} from 'lucide-react';
import { useDatabase } from '../../context/database.context';
import { MockTest } from '../../lib/db/db.types';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, CartesianGrid, Legend 
} from 'recharts';

export const MockTests: React.FC = () => {
  const { mockTests, subjects, addMockTest, updateMockTest, deleteMockTest } = useDatabase();

  const [showLogModal, setShowLogModal] = useState(false);
  const [editingMock, setEditingMock] = useState<MockTest | null>(null);

  // Form states
  const [mockName, setMockName] = useState('');
  const [mockDate, setMockDate] = useState('');
  const [mockSubjectId, setMockSubjectId] = useState('');
  const [mockScore, setMockScore] = useState(0);
  const [mockTotalMarks, setMockTotalMarks] = useState(100);
  const [mockAccuracy, setMockAccuracy] = useState(70);
  const [mockTimeTaken, setMockTimeTaken] = useState(180); // in minutes
  const [mockWeakAreas, setMockWeakAreas] = useState('');
  const [mockRemarks, setMockRemarks] = useState('');
  const [mockActionPlan, setMockActionPlan] = useState('');

  const handleOpenModal = (mock?: MockTest) => {
    if (mock) {
      setEditingMock(mock);
      setMockName(mock.name);
      setMockDate(mock.date);
      setMockSubjectId(mock.subject_id || '');
      setMockScore(mock.score);
      setMockTotalMarks(mock.total_marks);
      setMockAccuracy(mock.accuracy || 70);
      setMockTimeTaken(mock.time_taken_minutes || 180);
      setMockWeakAreas(mock.weak_areas || '');
      setMockRemarks(mock.remarks || '');
      setMockActionPlan(mock.action_plan || '');
    } else {
      setEditingMock(null);
      setMockName('');
      const today = new Date().toISOString().split('T')[0];
      setMockDate(today);
      setMockSubjectId('');
      setMockScore(0);
      setMockTotalMarks(100);
      setMockAccuracy(80);
      setMockTimeTaken(180);
      setMockWeakAreas('');
      setMockRemarks('');
      setMockActionPlan('');
    }
    setShowLogModal(true);
  };

  const handleSaveMock = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: mockName,
      date: mockDate,
      subject_id: mockSubjectId || null,
      score: Number(mockScore),
      total_marks: Number(mockTotalMarks),
      accuracy: Number(mockAccuracy),
      time_taken_minutes: Number(mockTimeTaken),
      weak_areas: mockWeakAreas,
      remarks: mockRemarks,
      action_plan: mockActionPlan
    };

    if (editingMock) {
      await updateMockTest(editingMock.id, data);
    } else {
      await addMockTest(data);
    }
    setShowLogModal(false);
  };

  const handleDeleteMock = async (id: string) => {
    if (confirm("Are you sure you want to delete this mock log?")) {
      await deleteMockTest(id);
    }
  };

  // Prepare chart data (sorted chronologically)
  const chartData = [...mockTests]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(m => ({
      date: m.date,
      percentage: Math.round((m.score / m.total_marks) * 100),
      accuracy: m.accuracy || 0,
      name: m.name
    }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center p-6 rounded-2xl glass">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Award className="text-primary" />
            Mock Exam Analytics
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5 font-medium">Log mock exams, analyze weak concepts, and monitor scores progression.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-1.5 bg-primary hover:bg-primary/95 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-primary/20 transition"
        >
          <Plus size={14} /> Log Mock Test
        </button>
      </div>

      {/* Analytics Graph */}
      {mockTests.length > 0 && (
        <div className="p-6 rounded-2xl glass space-y-4">
          <h3 className="text-lg font-bold text-white tracking-tight">Performance Chart</h3>
          <div className="h-72 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="accuracyColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e2e33" />
                <XAxis dataKey="date" stroke="#888" tickLine={false} style={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} stroke="#888" tickLine={false} style={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 15, 20, 0.9)', borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12 }} 
                  labelClassName="text-white font-bold font-mono text-xs"
                />
                <Legend style={{ fontSize: 12 }} />
                <Area 
                  type="monotone" 
                  name="Score %" 
                  dataKey="percentage" 
                  stroke="hsl(var(--primary))" 
                  fillOpacity={1} 
                  fill="url(#scoreColor)" 
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  name="Accuracy %" 
                  dataKey="accuracy" 
                  stroke="#10b981" 
                  fillOpacity={1} 
                  fill="url(#accuracyColor)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Mock Tests logs */}
      <div className="p-6 rounded-2xl glass space-y-4">
        <h3 className="text-lg font-bold text-white tracking-tight">Logged Mock Examinations</h3>

        {mockTests.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-xs">
            No mock tests logged yet. Click "Log Mock Test" to record your first score.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockTests.map((mock) => {
              const sub = subjects.find(s => s.id === mock.subject_id);
              const scorePct = Math.round((mock.score / mock.total_marks) * 100);

              return (
                <div 
                  key={mock.id}
                  className="p-5 rounded-xl bg-secondary/10 border border-border/30 hover:border-border/60 transition flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-white">{mock.name}</h4>
                        {sub && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sub.color }} />
                            <span className="text-[11px] text-muted-foreground font-semibold">{sub.name}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm font-extrabold text-white font-mono">{mock.score} / {mock.total_marks}</div>
                        <div className="text-[10px] text-primary font-bold">{scorePct}% Score</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-2 border-y border-border/10 text-center">
                      <div>
                        <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tight">Accuracy</span>
                        <p className="text-xs font-semibold text-emerald-400 mt-0.5">{mock.accuracy}%</p>
                      </div>
                      <div>
                        <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tight">Time Taken</span>
                        <p className="text-xs font-semibold text-white mt-0.5">{mock.time_taken_minutes}m</p>
                      </div>
                      <div>
                        <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tight">Exam Date</span>
                        <p className="text-xs font-semibold text-white mt-0.5 font-mono">{mock.date}</p>
                      </div>
                    </div>

                    {/* Weak Areas & Action plan */}
                    {mock.weak_areas && (
                      <div className="space-y-1">
                        <span className="text-[9px] text-red-400 font-bold uppercase flex items-center gap-1">
                          <AlertTriangle size={10} /> Weak Areas
                        </span>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">{mock.weak_areas}</p>
                      </div>
                    )}
                    
                    {mock.action_plan && (
                      <div className="space-y-1">
                        <span className="text-[9px] text-emerald-400 font-bold uppercase flex items-center gap-1">
                          <Check size={10} /> Action Plan
                        </span>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">{mock.action_plan}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions footer */}
                  <div className="flex justify-between items-center pt-3 border-t border-border/10 mt-auto">
                    {mock.remarks ? (
                      <p className="text-[10px] text-muted-foreground italic truncate max-w-[180px]">
                        "{mock.remarks}"
                      </p>
                    ) : (
                      <span />
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenModal(mock)}
                        className="p-1.5 rounded-lg bg-secondary/40 text-muted-foreground hover:text-white hover:bg-secondary/70 transition"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteMock(mock.id)}
                        className="p-1.5 rounded-lg bg-red-500/15 text-red-400 hover:text-red-300 hover:bg-red-500/25 transition"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Log Mock modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card border border-border/80 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-border/30 pb-3">
              <h3 className="text-lg font-bold text-white">{editingMock ? 'Edit Mock Log' : 'Log Mock Exam Performance'}</h3>
              <button onClick={() => setShowLogModal(false)} className="text-muted-foreground hover:text-white transition">✕</button>
            </div>

            <form onSubmit={handleSaveMock} className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground font-semibold">Mock Test Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. National Mock Test 4"
                  value={mockName}
                  onChange={(e) => setMockName(e.target.value)}
                  className="w-full mt-1 bg-secondary/40 border border-border/40 text-sm text-white rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground font-semibold">Subject / Tag</label>
                  <select
                    value={mockSubjectId}
                    onChange={(e) => setMockSubjectId(e.target.value)}
                    className="w-full mt-1 bg-secondary/40 border border-border/40 text-sm text-white rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <option value="">Select Subject (optional)</option>
                    {subjects.filter(s => !s.is_archived).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-xs text-muted-foreground font-semibold">Test Date</label>
                  <input
                    type="date"
                    required
                    value={mockDate}
                    onChange={(e) => setMockDate(e.target.value)}
                    className="w-full mt-1 bg-secondary/40 border border-border/40 text-sm text-white rounded-xl px-3 py-2 focus:ring-1 focus:ring-primary focus:outline-none scheme-dark"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground font-semibold">Your Score</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    required
                    value={mockScore}
                    onChange={(e) => setMockScore(Number(e.target.value))}
                    className="w-full mt-1 bg-secondary/40 border border-border/40 text-sm text-white rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-semibold">Total Marks</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={mockTotalMarks}
                    onChange={(e) => setMockTotalMarks(Number(e.target.value))}
                    className="w-full mt-1 bg-secondary/40 border border-border/40 text-sm text-white rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground font-semibold">Accuracy (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={mockAccuracy}
                    onChange={(e) => setMockAccuracy(Number(e.target.value))}
                    className="w-full mt-1 bg-secondary/40 border border-border/40 text-sm text-white rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-semibold">Time Taken (minutes)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={mockTimeTaken}
                    onChange={(e) => setMockTimeTaken(Number(e.target.value))}
                    className="w-full mt-1 bg-secondary/40 border border-border/40 text-sm text-white rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-semibold">Weak Areas</label>
                <textarea
                  placeholder="Which topics cost you marks? e.g. subnetting math, grammar rules"
                  value={mockWeakAreas}
                  onChange={(e) => setMockWeakAreas(e.target.value)}
                  className="w-full mt-1 bg-secondary/40 border border-border/40 text-sm text-white rounded-xl px-3 py-2 focus:ring-1 focus:ring-primary focus:outline-none h-16"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-semibold">Action Plan</label>
                <textarea
                  placeholder="Concrete steps to fix weak areas before the next exam..."
                  value={mockActionPlan}
                  onChange={(e) => setMockActionPlan(e.target.value)}
                  className="w-full mt-1 bg-secondary/40 border border-border/40 text-sm text-white rounded-xl px-3 py-2 focus:ring-1 focus:ring-primary focus:outline-none h-16"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-semibold">Remarks</label>
                <input
                  type="text"
                  placeholder="General notes or feelings about this mock..."
                  value={mockRemarks}
                  onChange={(e) => setMockRemarks(e.target.value)}
                  className="w-full mt-1 bg-secondary/40 border border-border/40 text-sm text-white rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-border/30">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-secondary/40 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1 bg-primary hover:bg-primary/95 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
                >
                  <Save size={14} /> Save Mock Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

