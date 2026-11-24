import { useState } from 'react';
import { DatabaseProvider, useDatabase } from './context/database.context';
import { Sidebar } from './components/sidebar/sidebar.component';
import { Dashboard } from './features/dashboard/dashboard.view';
import { Planner } from './features/planner/planner.view';
import { Tracker } from './features/tracker/tracker.view';
import { Subjects } from './features/subjects/subjects.view';
import { MockTests } from './features/mock-tests/mock-tests.view';
import { WeeklyReport } from './features/reports/weekly-report.view';
import { MonthlyReport } from './features/reports/monthly-report.view';
import { ProgressPage } from './features/analytics/progress.view';
import { Analytics } from './features/analytics/analytics.view';
import { Settings } from './features/settings/settings.view';
import { ViewType } from './types/app.types';
import { Menu, Activity } from 'lucide-react';

function AppContent() {
  const { loading } = useDatabase();
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':      return <Dashboard onViewChange={setCurrentView} />;
      case 'planner':        return <Planner />;
      case 'tracker':        return <Tracker />;
      case 'subjects':       return <Subjects />;
      case 'mocks':          return <MockTests />;
      case 'weekly_report':  return <WeeklyReport />;
      case 'monthly_report': return <MonthlyReport />;
      case 'progress':       return <ProgressPage />;
      case 'analytics':      return <Analytics />;
      case 'settings':       return <Settings />;
      default:               return <Dashboard onViewChange={setCurrentView} />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground space-y-4">
        <div className="flex items-center gap-3">
          <Activity className="text-primary animate-pulse" size={24} />
          <h1 className="text-xl font-bold tracking-tight text-white">Loading LifeOS...</h1>
        </div>
        <div className="w-48 h-1 bg-secondary rounded-full overflow-hidden">
          <div className="bg-primary h-full rounded-full animate-pulse-slow" style={{ width: '60%' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between h-16 px-6 border-b border-border/80 glass sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary/40 hover:text-white transition"
          >
            <Menu size={20} />
          </button>
          <span className="font-semibold text-white tracking-tight">LifeOS Dashboard</span>
          <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs">
            L
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 md:p-8 lg:p-10 max-w-[1500px] w-full mx-auto">
          {renderView()}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <DatabaseProvider>
      <AppContent />
    </DatabaseProvider>
  );
}

export default App;
