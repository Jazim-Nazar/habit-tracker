import React from 'react';
import {
  LayoutDashboard, Calendar, BookOpen, CheckSquare,
  TrendingUp, BarChart3, Settings as SettingsIcon, FileText,
  X, Award
} from 'lucide-react';
import { useDatabase } from '../../context/database.context';
import { ViewType } from '../../types/app.types';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const menuItems: { id: ViewType; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard',      label: 'Dashboard',      icon: LayoutDashboard },
  { id: 'planner',        label: 'Planner',         icon: Calendar },
  { id: 'tracker',        label: 'Daily Tracker',   icon: CheckSquare },
  { id: 'subjects',       label: 'Subjects',        icon: BookOpen },
  { id: 'mocks',          label: 'Mock Tests',      icon: Award },
  { id: 'weekly_report',  label: 'Weekly Report',   icon: FileText },
  { id: 'monthly_report', label: 'Monthly Report',  icon: FileText },
  { id: 'progress',       label: 'Progress',        icon: TrendingUp },
  { id: 'analytics',      label: 'Analytics',       icon: BarChart3 },
  { id: 'settings',       label: 'Settings',        icon: SettingsIcon },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, isOpen, setIsOpen }) => {
  const { settings } = useDatabase();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 flex flex-col w-64 glass border-r border-border/80 transition-transform duration-300 ease-in-out
        lg:static lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white shadow-lg shadow-primary/30">
              <span className="font-bold text-sm tracking-widest">L</span>
            </div>
            <div>
              <h1 className="font-semibold text-white tracking-tight">LifeOS</h1>
              <p className="text-[10px] text-muted-foreground font-medium">Plan once. Execute daily.</p>
            </div>
          </div>
          <button
            className="p-1 rounded-lg text-muted-foreground hover:bg-secondary/40 lg:hidden"
            onClick={() => setIsOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { onViewChange(item.id); setIsOpen(false); }}
                className={`
                  flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive
                    ? 'bg-primary text-white shadow-md shadow-primary/10'
                    : 'text-muted-foreground hover:bg-secondary/60 hover:text-white'
                  }
                `}
              >
                <Icon size={18} className={isActive ? 'text-white' : 'text-muted-foreground'} />
                <span>{item.label}</span>
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white ml-auto" />}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border/40">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border/20">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-slow" />
            <div className="text-[11px] text-muted-foreground font-medium">
              Mode: <span className="text-white capitalize">{settings?.theme || 'dark'}</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
