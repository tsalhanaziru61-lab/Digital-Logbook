/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  CheckCircle2,
  Database,
  Code2,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  FileCode2,
  TerminalSquare,
  Lock,
  GraduationCap,
  Building2,
  Copy,
  Check,
  KeyRound,
  Layout,
  Menu,
  Eye,
  LogOut
} from 'lucide-react';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { Card, CardHeader } from './components/ui/Card';
import { Badge } from './components/ui/Badge';
import { useSystemStatus } from './hooks/useSystemStatus';
import { APP_FULL_NAME, APP_TAGLINE, MODULE_ROADMAP } from './constants';
import { PROFILES_SQL_SCHEMA, LOGBOOK_SQL_SCHEMA } from './constants/databaseSchema';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import { LoginForm } from './components/auth/LoginForm';
import { RoleGuardDemo } from './components/auth/RoleGuardDemo';
import { NavItemId, NavItemConfig } from './components/navigation/navigationConfig';
import { StudentLayout } from './layouts/StudentLayout';
import { AdminLayout } from './layouts/AdminLayout';
import {
  StudentDashboardPage,
  StudentProfilePage,
  StudentDailyActivityPage,
  StudentNotificationsPage,
  AdminDashboardPage,
  AdminStudentsPage,
  AdminReportsPage,
  AdminNotificationsPage,
  AdminProfilePage
} from './pages';


function AuthenticatedApp() {
  const { role } = useAuth();
  const [activeNavId, setActiveNavId] = useState<NavItemId>(() => {
    const path = window.location.pathname;
    if (path.includes('/notifications')) return 'notifications';
    if (path.includes('/profile')) return 'profile';
    if (path.includes('/daily-activity') || path.includes('/activity')) return 'daily-activity';
    if (path.includes('/students')) return 'students';
    if (path.includes('/reports')) return 'reports';
    return 'dashboard';
  });

  // Sync browser back/forward buttons
  React.useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.includes('/notifications')) setActiveNavId('notifications');
      else if (path.includes('/profile')) setActiveNavId('profile');
      else if (path.includes('/daily-activity') || path.includes('/activity')) setActiveNavId('daily-activity');
      else if (path.includes('/students')) setActiveNavId('students');
      else if (path.includes('/reports')) setActiveNavId('reports');
      else setActiveNavId('dashboard');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (item: NavItemConfig) => {
    setActiveNavId(item.id);
    if (window.history.pushState) {
      window.history.pushState(null, '', item.path);
    }
  };

  // Selected week for student daily activity navigation
  const [selectedActivityWeek, setSelectedActivityWeek] = useState<number>(5);

  // Render Student Pages
  const renderStudentPage = () => {
    switch (activeNavId) {
      case 'dashboard':
        return (
          <StudentDashboardPage
            onNavigateToActivity={(weekNum?: number) => {
              if (weekNum) {
                setSelectedActivityWeek(weekNum);
              }
              setActiveNavId('daily-activity');
            }}
            onNavigateToProfile={() => setActiveNavId('profile')}
          />
        );
      case 'profile':
        return <StudentProfilePage />;
      case 'daily-activity':
        return (
          <StudentDailyActivityPage
            key={selectedActivityWeek}
            initialWeekNumber={selectedActivityWeek}
            onSelectWeek={(w) => setSelectedActivityWeek(w)}
          />
        );
      case 'notifications':
        return (
          <StudentNotificationsPage
            onNavigateToActivity={(weekNum?: number) => {
              if (weekNum) {
                setSelectedActivityWeek(weekNum);
              }
              setActiveNavId('daily-activity');
            }}
          />
        );
      default:
        return (
          <StudentDashboardPage
            onNavigateToActivity={(weekNum?: number) => {
              if (weekNum) {
                setSelectedActivityWeek(weekNum);
              }
              setActiveNavId('daily-activity');
            }}
            onNavigateToProfile={() => setActiveNavId('profile')}
          />
        );
    }
  };

  // Render Admin Pages
  const renderAdminPage = () => {
    switch (activeNavId) {
      case 'dashboard':
        return (
          <AdminDashboardPage
            onNavigateToStudents={() => setActiveNavId('students')}
            onNavigateToReports={() => setActiveNavId('reports')}
          />
        );
      case 'students':
        return <AdminStudentsPage />;
      case 'reports':
        return <AdminReportsPage />;
      case 'notifications':
        return (
          <AdminNotificationsPage
            onNavigateToReports={() => setActiveNavId('reports')}
          />
        );
      case 'profile':
        return <AdminProfilePage />;
      default:
        return (
          <AdminDashboardPage
            onNavigateToStudents={() => setActiveNavId('students')}
            onNavigateToReports={() => setActiveNavId('reports')}
          />
        );
    }
  };

  const pageContent = role === 'admin' ? renderAdminPage() : renderStudentPage();

  return (
    <div className="relative min-h-screen">
      {/* Render Appropriate Role-Aware Layout */}
      {role === 'admin' ? (
        <AdminLayout
          activeNavId={activeNavId}
          onNavigate={handleNavigate}
        >
          {pageContent}
        </AdminLayout>
      ) : (
        <StudentLayout
          activeNavId={activeNavId}
          onNavigate={handleNavigate}
        >
          {pageContent}
        </StudentLayout>
      )}
    </div>
  );
}

function UnauthenticatedApp() {
  const { supabaseStatus } = useSystemStatus();
  const [activeTab, setActiveTab] = useState<'login' | 'guard-test' | 'schema' | 'roadmap'>('login');
  const [copiedSchema, setCopiedSchema] = useState(false);

  const handleCopySchema = async () => {
    try {
      await navigator.clipboard.writeText(PROFILES_SQL_SCHEMA);
      setCopiedSchema(true);
      setTimeout(() => setCopiedSchema(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased">
      {/* App Header with Auth & Supabase Status */}
      <Header
        isSupabaseConfigured={supabaseStatus.isConfigured}
        onOpenLogin={() => setActiveTab('login')}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Module 04 Milestone Banner */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6 sm:p-10 shadow-lg">
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs sm:text-sm font-medium border border-emerald-500/30">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Module 04 Active — Application Layout &amp; Navigation Shell</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              {APP_FULL_NAME}
            </h2>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              {APP_TAGLINE}. Complete with responsive desktop and mobile sidebars, top breadcrumb navigation, role-isolated portals for Students and Administrators, and protected routes.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs sm:text-sm">
              <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Layout Shells &amp; Navigation Active
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300">
                Sign in with institutional credentials or test using quick demo accounts below.
              </span>
            </div>
          </div>

          <div className="absolute right-0 top-0 -mt-10 -mr-10 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        </section>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-6 text-sm font-medium overflow-x-auto">
          <button
            onClick={() => setActiveTab('login')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'login'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Sign In to Experience Portals</span>
          </button>

          <button
            onClick={() => setActiveTab('guard-test')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'guard-test'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>RBAC Guard Playground</span>
          </button>

          <button
            onClick={() => setActiveTab('schema')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'schema'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Profiles Schema &amp; Setup</span>
          </button>

          <button
            onClick={() => setActiveTab('roadmap')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'roadmap'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>12-Module System Roadmap</span>
          </button>
        </div>

        {/* Tab 1: Login Form & Architecture Info */}
        {activeTab === 'login' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-6 w-full">
              <LoginForm />
            </div>

            <div className="lg:col-span-6 space-y-6">
              <Card>
                <CardHeader
                  title="Module 04 Navigation Shells"
                  subtitle="Dedicated Student and Coordinator Layout Architecture"
                  icon={<Layout className="w-5 h-5 text-emerald-600" />}
                />
                <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                      <GraduationCap className="w-4 h-4 text-emerald-600" />
                      <span>Student Portal Navigation</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Equipped with dedicated navigation items: <strong>Dashboard</strong>, <strong>Profile</strong>, <strong>Daily Activity</strong>, and <strong>Logout</strong>. Tailored for industrial trainees recording Monday-to-Friday log entries and viewing supervisor remarks.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                      <Building2 className="w-4 h-4 text-sky-600" />
                      <span>Admin Coordinator Navigation</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Equipped with dedicated navigation items: <strong>Dashboard</strong>, <strong>Students</strong>, <strong>Reports</strong>, <strong>Profile</strong>, and <strong>Logout</strong>. Tailored for SIWES directors managing student accounts and endorsing weekly logbooks.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                      <Menu className="w-4 h-4 text-teal-600" />
                      <span>Responsive Mobile Drawer</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      On mobile and tablet viewports, sidebars collapse cleanly into a backdrop-enabled slide-over drawer with full accessibility, keyboard dismissal (Esc), and touch support.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Tab 2: RBAC Guard Playground */}
        {activeTab === 'guard-test' && <RoleGuardDemo />}

        {/* Tab 3: Database Profiles & Logbook Schema */}
        {activeTab === 'schema' && (
          <div className="space-y-6">
            <Card>
              <CardHeader
                title="PostgreSQL Schema & Row Level Security (RLS)"
                subtitle="Production DDL and RLS policies for profiles, logbook_weeks, and daily_activities"
                icon={<Database className="w-5 h-5 text-emerald-600" />}
              />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">
                    File: <code>supabase/schema.sql</code> (Modules 02–06)
                  </span>
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(`${PROFILES_SQL_SCHEMA}\n\n${LOGBOOK_SQL_SCHEMA}`);
                        setCopiedSchema(true);
                        setTimeout(() => setCopiedSchema(false), 2000);
                      } catch {
                        setCopiedSchema(false);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors cursor-pointer"
                  >
                    {copiedSchema ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSchema ? 'All SQL Copied!' : 'Copy Full SQL Schema'}</span>
                  </button>
                </div>
                <pre className="p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto max-h-[460px] leading-relaxed border border-slate-800">
                  {PROFILES_SQL_SCHEMA}

{LOGBOOK_SQL_SCHEMA}
                </pre>
              </div>
            </Card>
          </div>
        )}

        {/* Tab 4: 13-Module Roadmap */}
        {activeTab === 'roadmap' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {MODULE_ROADMAP.map((mod) => (
                <div
                  key={mod.id}
                  className={`p-4 rounded-xl border transition-all ${
                    mod.status === 'completed'
                      ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-500">
                        {mod.code}
                      </span>
                      {mod.status === 'completed' && (
                        <Badge variant="success" size="sm">
                          Completed
                        </Badge>
                      )}
                    </div>
                    <span className="text-[11px] font-medium text-slate-400">
                      {mod.category}
                    </span>
                  </div>

                  <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                    {mod.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {mod.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

function MainContent() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <AuthenticatedApp />;
  }

  return <UnauthenticatedApp />;
}

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
