import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, Save, RefreshCw, Palette, 
  Layout, Eye, Sparkles, Check, Database, Trash2, Plus
} from 'lucide-react';
import { useDatabase } from '../../context/database.context';
import { isSupabaseConfigured } from '../../lib/db';

export const Settings: React.FC = () => {
  const { 
    settings, updateSettings, 
    categories, addCategory, deleteCategory 
  } = useDatabase();

  const [targetDate, setTargetDate] = useState(settings?.target_date || '2027-02-01');
  const [theme, setTheme] = useState(settings?.theme || 'dark');
  const [accentColor, setAccentColor] = useState(settings?.accent_color || 'violet');

  // Widget settings
  const [showCountdown, setShowCountdown] = useState(settings?.widgets_config?.showCountdown ?? true);
  const [showStreak, setShowStreak] = useState(settings?.widgets_config?.showStreak ?? true);
  const [showDailyTracker, setShowDailyTracker] = useState(settings?.widgets_config?.showDailyTracker ?? true);
  const [showQuickActions, setShowQuickActions] = useState(settings?.widgets_config?.showQuickActions ?? true);
  const [showUpcomingDeadlines, setShowUpcomingDeadlines] = useState(settings?.widgets_config?.showUpcomingDeadlines ?? true);
  const [showRecentActivity, setShowRecentActivity] = useState(settings?.widgets_config?.showRecentActivity ?? true);

  // New Category Form
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#8b5cf6');
  const [newCatIcon, setNewCatIcon] = useState('BookOpen');

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      target_date: targetDate,
      theme: theme as 'dark' | 'light',
      accent_color: accentColor,
      widgets_config: {
        showCountdown,
        showStreak,
        showDailyTracker,
        showQuickActions,
        showUpcomingDeadlines,
        showRecentActivity
      }
    });
    alert("Settings updated successfully!");
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    await addCategory({
      name: newCatName,
      color: newCatColor,
      icon: newCatIcon,
      is_custom: true
    });
    setNewCatName('');
    alert(`Category "${newCatName}" added!`);
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm("Delete this category? Dynamic blocks with this category will remain, but the name/color won't map.")) {
      await deleteCategory(id);
    }
  };

  const accentColors = [
    { name: 'violet', label: 'Violet', color: '#8b5cf6' },
    { name: 'emerald', label: 'Emerald', color: '#10b981' },
    { name: 'indigo', label: 'Indigo', color: '#6366f1' },
    { name: 'rose', label: 'Rose', color: '#f43f5e' },
    { name: 'amber', label: 'Amber', color: '#f59e0b' },
    { name: 'sky', label: 'Sky', color: '#0ea5e9' },
    { name: 'crimson', label: 'Crimson', color: '#dc2626' }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="p-6 rounded-2xl glass">
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <SettingsIcon className="text-primary" />
          Settings & Customizations
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5 font-medium">Re-tailor UI widgets, accent colors, target goals, and custom timetable categories.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: General Configuration & Accent Customizer */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl glass space-y-5">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Palette className="text-primary" size={18} />
              Theme & Style Customizer
            </h3>

            <form onSubmit={handleSaveGeneral} className="space-y-5">
              {/* Target Countdown Date */}
              <div>
                <label className="text-xs text-muted-foreground font-semibold">Target Exam / Goal Date (for Countdown widget)</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full mt-1.5 bg-secondary/40 border border-border/40 text-sm text-white rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-primary focus:outline-none scheme-dark"
                />
              </div>

              {/* Theme Selector */}
              <div>
                <label className="text-xs text-muted-foreground font-semibold">Theme Mode</label>
                <div className="grid grid-cols-2 gap-3 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`
                      py-2.5 rounded-xl border text-sm font-semibold transition
                      ${theme === 'dark' 
                        ? 'bg-primary text-white border-primary shadow shadow-primary/15' 
                        : 'bg-secondary/25 border-border/40 text-muted-foreground hover:text-white'
                      }
                    `}
                  >
                    Dark Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`
                      py-2.5 rounded-xl border text-sm font-semibold transition
                      ${theme === 'light' 
                        ? 'bg-primary text-white border-primary shadow shadow-primary/15' 
                        : 'bg-secondary/25 border-border/40 text-muted-foreground hover:text-white'
                      }
                    `}
                  >
                    Light Mode
                  </button>
                </div>
              </div>

              {/* Accent Color Palette */}
              <div>
                <label className="text-xs text-muted-foreground font-semibold">Accent Color (UI Highlights)</label>
                <div className="flex flex-wrap gap-2.5 mt-2">
                  {accentColors.map(color => {
                    const isSelected = accentColor === color.name;
                    return (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => setAccentColor(color.name)}
                        className={`
                          flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition
                          ${isSelected 
                            ? 'bg-secondary border-primary text-white shadow shadow-primary/10' 
                            : 'bg-secondary/20 border-border/20 text-muted-foreground hover:text-white'
                          }
                        `}
                      >
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color.color }} />
                        {color.label}
                        {isSelected && <Check size={10} className="text-primary ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dashboard Widgets control checkboxes */}
              <div className="border-t border-border/20 pt-4 space-y-3">
                <label className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                  <Layout size={14} /> Dashboard Widgets Configuration
                </label>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <label className="flex items-center gap-2 text-white cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showCountdown}
                      onChange={() => setShowCountdown(!showCountdown)}
                      className="rounded border-border/60 text-primary bg-secondary focus:ring-0 w-3.5 h-3.5"
                    />
                    <span>Countdown Widget</span>
                  </label>

                  <label className="flex items-center gap-2 text-white cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showStreak}
                      onChange={() => setShowStreak(!showStreak)}
                      className="rounded border-border/60 text-primary bg-secondary focus:ring-0 w-3.5 h-3.5"
                    />
                    <span>Streak Flame Widget</span>
                  </label>

                  <label className="flex items-center gap-2 text-white cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showDailyTracker}
                      onChange={() => setShowDailyTracker(!showDailyTracker)}
                      className="rounded border-border/60 text-primary bg-secondary focus:ring-0 w-3.5 h-3.5"
                    />
                    <span>Daily Schedule List</span>
                  </label>

                  <label className="flex items-center gap-2 text-white cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showQuickActions}
                      onChange={() => setShowQuickActions(!showQuickActions)}
                      className="rounded border-border/60 text-primary bg-secondary focus:ring-0 w-3.5 h-3.5"
                    />
                    <span>Quick Shortcuts Grid</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-border/20">
                <button
                  type="submit"
                  className="flex items-center gap-1 bg-primary hover:bg-primary/95 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow shadow-primary/20 transition"
                >
                  <Save size={14} /> Save Preferences
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Custom Categories Editor & Database status */}
        <div className="space-y-6">
          {/* Custom Category Builder */}
          <div className="p-6 rounded-2xl glass space-y-4">
            <h3 className="text-md font-bold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="text-primary" size={16} />
              Timetable Categories
            </h3>

            {/* Custom Category Add form */}
            <form onSubmit={handleCreateCategory} className="space-y-3.5 bg-secondary/10 p-3.5 border border-border/20 rounded-xl">
              <div>
                <label className="text-[10px] text-muted-foreground font-bold uppercase">New Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Travel, Kalari"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full mt-1 bg-secondary border border-border/30 text-xs text-white rounded-lg p-2 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <label className="text-[10px] text-muted-foreground font-bold uppercase block">Color</label>
                  <input
                    type="color"
                    value={newCatColor}
                    onChange={(e) => setNewCatColor(e.target.value)}
                    className="mt-1 w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                  />
                </div>

                <button
                  type="submit"
                  className="flex items-center gap-1 bg-primary hover:bg-primary/95 text-white text-[11px] font-semibold px-3 py-2 rounded-lg transition"
                >
                  <Plus size={12} /> Add Category
                </button>
              </div>
            </form>

            {/* Existing Categories list */}
            <div className="space-y-2">
              <span className="text-[10px] text-muted-foreground font-bold uppercase">Active Categories</span>
              <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                {categories.map(c => (
                  <div 
                    key={c.id}
                    className="flex justify-between items-center p-2 rounded bg-secondary/20 border border-border/10 text-xs font-semibold"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                      <span className="text-white">{c.name}</span>
                    </div>

                    {c.is_custom && (
                      <button
                        onClick={() => handleDeleteCategory(c.id)}
                        className="text-red-400 hover:text-red-300 transition"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Supabase Connection State */}
          <div className="p-6 rounded-2xl glass space-y-4">
            <h3 className="text-md font-bold text-white tracking-tight flex items-center gap-2">
              <Database className="text-primary" size={16} />
              Database Status
            </h3>
            
            <div className="p-3.5 rounded-xl border flex items-center gap-3.5 bg-secondary/10 border-border/30">
              <div className={`w-3 h-3 rounded-full shrink-0 ${isSupabaseConfigured() ? 'bg-emerald-500 animate-pulse-slow' : 'bg-amber-500'}`} />
              <div>
                <p className="text-xs font-bold text-white">
                  {isSupabaseConfigured() ? 'Connected to Supabase' : 'Running Offline'}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                  {isSupabaseConfigured() 
                    ? 'Syncing changes in real-time with your cloud database.' 
                    : 'Saving study progress locally to your browser (IndexedDB). Add environment keys in .env to link Supabase.'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

