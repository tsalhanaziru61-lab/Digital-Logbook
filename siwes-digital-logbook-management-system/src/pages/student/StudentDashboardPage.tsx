/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LayoutDashboard,
  CalendarCheck,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Building,
  GraduationCap,
  User,
  FileText,
  FileEdit,
  Send,
  Eye,
  RefreshCw,
  BookOpen,
  Briefcase,
  Check,
  Layers,
  ChevronRight,
  Award
} from 'lucide-react';
import { PageHeader } from '../../components/navigation/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';
import { logbookService } from '../../services/logbook.service';
import { studentService } from '../../services/student.service';
import {
  LogbookWeek,
  DailyActivity,
  DayOfWeek,
  DAYS_OF_WEEK,
  LogbookWeekStatus
} from '../../types/logbook';

export interface StudentDashboardPageProps {
  onNavigateToActivity?: (weekNumber?: number) => void;
  onNavigateToProfile?: () => void;
}

interface RecentActivityItem {
  id: string;
  weekId: string;
  weekNumber: number;
  weekStatus: LogbookWeekStatus;
  dayOfWeek: DayOfWeek;
  date: string;
  title: string;
  activity: string;
  toolsUsed?: string | null;
  updatedAt: string;
}

export const StudentDashboardPage: React.FC<StudentDashboardPageProps> = ({
  onNavigateToActivity,
  onNavigateToProfile
}) => {
  const { profile, user } = useAuth();
  const studentId = user?.id || profile?.id || 'demo-student-uuid-001';
  const siwesStartDate = profile?.siwes_start_date;
  const siwesEndDate = profile?.siwes_end_date;

  // Data states
  const [weeks, setWeeks] = useState<LogbookWeek[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // SIWES calendar placement progress
  const placementProgress = useMemo(() => {
    return studentService.calculatePlacementProgress(siwesStartDate, siwesEndDate);
  }, [siwesStartDate, siwesEndDate]);

  const totalWeeks = placementProgress.totalWeeks || 24;

  // Load weeks from Supabase / LogbookService
  const loadDashboardData = useCallback(async (isSilentRefresh = false) => {
    if (!isSilentRefresh) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setErrorMessage(null);

    try {
      const res = await logbookService.getWeeksForStudent(studentId, siwesStartDate, totalWeeks);
      if (res.success && res.data) {
        setWeeks(res.data);
      } else {
        setErrorMessage(res.error?.message || 'Unable to retrieve your logbook progress.');
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unexpected connection error loading dashboard.'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [studentId, siwesStartDate, totalWeeks]);

  useEffect(() => {
    let isCancelled = false;
    const fetch = async () => {
      if (!isCancelled) {
        await loadDashboardData();
      }
    };
    void fetch();
    return () => {
      isCancelled = true;
    };
  }, [loadDashboardData]);

  // Summary Metrics calculated directly from the database logbook_weeks data
  const summaryMetrics = useMemo(() => {
    const total = weeks.length;
    let draftCount = 0;
    let submittedCount = 0;
    let approvedCount = 0;
    let returnedCount = 0;

    weeks.forEach((w) => {
      if (w.status === 'draft') draftCount++;
      else if (w.status === 'submitted') submittedCount++;
      else if (w.status === 'approved') approvedCount++;
      else if (w.status === 'returned') returnedCount++;
    });

    // Count total working days logged across all weeks
    let totalDaysLogged = 0;
    weeks.forEach((w) => {
      (w.daily_activities || []).forEach((act) => {
        if (act.title?.trim().length >= 3 && act.activity?.trim().length >= 10) {
          totalDaysLogged++;
        }
      });
    });

    return {
      totalWeeks: total,
      draftCount,
      submittedCount,
      approvedCount,
      returnedCount,
      totalDaysLogged,
    };
  }, [weeks]);

  // Current or Most Relevant Week Selection
  const currentWeek = useMemo<LogbookWeek | null>(() => {
    if (weeks.length === 0) return null;

    // 1. Prioritize any returned week because it requires urgent student attention
    const returnedWeek = weeks.find((w) => w.status === 'returned');
    if (returnedWeek) return returnedWeek;

    // 2. Check if today falls in any week's calendar span
    const todayStr = new Date().toISOString().split('T')[0];
    const calendarWeek = weeks.find((w) => {
      if (!w.start_date || !w.end_date) return false;
      return todayStr >= w.start_date && todayStr <= w.end_date;
    });
    if (calendarWeek) return calendarWeek;

    // 3. First draft week (in-progress)
    const draftWeek = weeks.find((w) => w.status === 'draft');
    if (draftWeek) return draftWeek;

    // 4. Default to latest available week
    return weeks[weeks.length - 1] || weeks[0];
  }, [weeks]);

  // Completion calculation for a single week's 5 working days
  const isDayComplete = (activity?: DailyActivity | null): boolean => {
    if (!activity) return false;
    return Boolean(
      activity.title &&
      activity.title.trim().length >= 3 &&
      activity.activity &&
      activity.activity.trim().length >= 10
    );
  };

  const currentWeekCompletedDays = useMemo(() => {
    if (!currentWeek || !currentWeek.daily_activities) return 0;
    return currentWeek.daily_activities.filter(isDayComplete).length;
  }, [currentWeek]);

  // Extract recent daily activities from actual database records
  const recentActivities = useMemo<RecentActivityItem[]>(() => {
    const list: RecentActivityItem[] = [];

    weeks.forEach((w) => {
      (w.daily_activities || []).forEach((act) => {
        if (act.title?.trim() || act.activity?.trim()) {
          list.push({
            id: act.id,
            weekId: w.id,
            weekNumber: w.week_number,
            weekStatus: w.status,
            dayOfWeek: act.day_of_week,
            date: act.date,
            title: act.title?.trim() || 'Untitled Day Entry',
            activity: act.activity?.trim() || 'No description provided.',
            toolsUsed: act.tools_used,
            updatedAt: act.updated_at || act.created_at || act.date,
          });
        }
      });
    });

    // Sort by date descending, then updated timestamp
    return list.sort((a, b) => {
      const timeA = new Date(a.date).getTime() || 0;
      const timeB = new Date(b.date).getTime() || 0;
      if (timeB !== timeA) return timeB - timeA;
      return (b.updatedAt || '').localeCompare(a.updatedAt || '');
    }).slice(0, 5); // Limit to top 5
  }, [weeks]);

  // Format date helper
  const formatDateDisplay = (dateStr?: string | null): string => {
    if (!dateStr) return 'Not scheduled';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Status Badge with icon for visual accessibility
  const renderStatusBadge = (status: LogbookWeekStatus, size: 'sm' | 'md' = 'md') => {
    switch (status) {
      case 'approved':
        return (
          <Badge variant="success" size={size} className="gap-1 inline-flex items-center">
            <CheckCircle2 className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
            <span>Approved</span>
          </Badge>
        );
      case 'submitted':
        return (
          <Badge variant="info" size={size} className="gap-1 inline-flex items-center">
            <Send className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
            <span>Submitted</span>
          </Badge>
        );
      case 'returned':
        return (
          <Badge variant="danger" size={size} className="gap-1 inline-flex items-center">
            <AlertTriangle className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
            <span>Returned</span>
          </Badge>
        );
      case 'draft':
      default:
        return (
          <Badge variant="warning" size={size} className="gap-1 inline-flex items-center">
            <FileEdit className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
            <span>Draft</span>
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Student Logbook Dashboard"
        subtitle="Real-time monitoring of your SIWES industrial training timeline, weekly submissions, and supervisor reviews."
        icon={LayoutDashboard}
        badge={
          <Badge variant="success">
            Active Industrial Attachment
          </Badge>
        }
        breadcrumbs={[
          { label: 'Student Portal' },
          { label: 'Dashboard' }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => void loadDashboardData(true)}
              disabled={isRefreshing || isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh live Supabase database metrics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={() => onNavigateToActivity?.(currentWeek?.week_number || 1)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Go to Daily Activity</span>
            </button>
          </div>
        }
      />

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center justify-between text-xs sm:text-sm text-rose-800 dark:text-rose-300">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <div>
              <p className="font-semibold">Unable to fetch current logbook data</p>
              <p className="text-xs text-rose-700 dark:text-rose-400 mt-0.5">{errorMessage}</p>
            </div>
          </div>
          <button
            onClick={() => void loadDashboardData()}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* 1. Student Welcome Section */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                SIWES Logbook Profile
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {profile?.matric_number || profile?.matric_no || 'RUN/CMP/21/10492'}
              </span>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Welcome back, {profile?.full_name || 'Student Intern'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Track your five-day daily activities, compile weekly logbook records, and ensure timely submissions to your institution coordinator.
              </p>
            </div>

            {/* Academic & Industrial Meta Pills */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="font-semibold text-slate-900 dark:text-white">
                  {profile?.institution || 'Babcock University'}
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500">{profile?.department || 'Computer Science'}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <Building className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="font-semibold text-slate-900 dark:text-white">
                  {profile?.organisation || profile?.company_name || 'National Information Technology Development Agency (NITDA)'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 font-mono">
                <Calendar className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>
                  {formatDateDisplay(siwesStartDate)} — {formatDateDisplay(siwesEndDate)}
                </span>
                <span className="text-slate-400">({totalWeeks} wks)</span>
              </div>
            </div>
          </div>

          {/* Quick Action Button in Welcome */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
            <button
              onClick={onNavigateToProfile}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <User className="w-4 h-4 text-slate-500" />
              <span>View &amp; Edit Profile</span>
            </button>
            {currentWeek && (
              <button
                onClick={() => onNavigateToActivity?.(currentWeek.week_number)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <FileEdit className="w-4 h-4" />
                <span>
                  {currentWeek.status === 'draft' || currentWeek.status === 'returned'
                    ? `Continue Week ${currentWeek.week_number}`
                    : `View Week ${currentWeek.week_number}`}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Logbook Progress Summary Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>Weekly Logbook Summary</span>
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Computed from real Supabase database records
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* Total Weeks */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs transition-all hover:border-slate-300 dark:hover:border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Weeks</span>
              <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {isLoading ? '...' : summaryMetrics.totalWeeks}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Target: {totalWeeks} Training Weeks
            </p>
          </div>

          {/* Draft Weeks */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/40 shadow-xs transition-all hover:border-amber-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Draft Weeks</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <FileEdit className="w-4 h-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
              {isLoading ? '...' : summaryMetrics.draftCount}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Editable / In progress
            </p>
          </div>

          {/* Submitted Weeks */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-sky-200/80 dark:border-sky-900/40 shadow-xs transition-all hover:border-sky-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-sky-700 dark:text-sky-400">Submitted</span>
              <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <Send className="w-4 h-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-sky-600 dark:text-sky-400">
              {isLoading ? '...' : summaryMetrics.submittedCount}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Locked / Under Review
            </p>
          </div>

          {/* Approved Weeks */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-900/40 shadow-xs transition-all hover:border-emerald-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Approved</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {isLoading ? '...' : summaryMetrics.approvedCount}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Endorsed by supervisor
            </p>
          </div>

          {/* Returned Weeks */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-rose-900/40 shadow-xs transition-all hover:border-rose-300 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">Returned</span>
              <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">
              {isLoading ? '...' : summaryMetrics.returnedCount}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {summaryMetrics.returnedCount > 0 ? 'Requires student revision' : 'No revisions required'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Current Week & Weekly Completion vs Recent Logbook Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 3 & 4. Current/Latest Week & Weekly Completion Progress (2 columns on lg) */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader
              title={
                currentWeek
                  ? `Active Week Focus: Week ${currentWeek.week_number}`
                  : 'Current Active Week'
              }
              subtitle={
                currentWeek
                  ? `${formatDateDisplay(currentWeek.start_date)} — ${formatDateDisplay(currentWeek.end_date)}`
                  : 'No active week schedule loaded'
              }
              icon={<CalendarCheck className="w-5 h-5 text-emerald-600" />}
              action={
                currentWeek ? (
                  renderStatusBadge(currentWeek.status)
                ) : (
                  <Badge variant="neutral">Pending</Badge>
                )
              }
            />

            {isLoading ? (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600" />
                <p className="text-xs">Loading active week records from database...</p>
              </div>
            ) : currentWeek ? (
              <div className="space-y-5">
                {/* Returned Warning if week is returned */}
                {currentWeek.status === 'returned' && (
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs">
                      <h4 className="font-bold text-rose-900 dark:text-rose-200">
                        Attention Required: Report Returned by Coordinator
                      </h4>
                      <p className="text-rose-800 dark:text-rose-300">
                        {currentWeek.reviewer_remarks
                          ? `Supervisor Remark: "${currentWeek.reviewer_remarks}"`
                          : 'Please revise and resubmit your 5 working day activities.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Supervisor Feedback Callout if Approved with remarks */}
                {currentWeek.status === 'approved' && currentWeek.reviewer_remarks && (
                  <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
                    <Award className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-emerald-900 dark:text-emerald-200">
                          Supervisor Endorsement
                        </h4>
                        {currentWeek.supervisor_grade && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 font-bold text-[10px]">
                            Grade: {currentWeek.supervisor_grade}
                          </span>
                        )}
                      </div>
                      <p className="text-emerald-800 dark:text-emerald-300 italic">
                        &ldquo;{currentWeek.reviewer_remarks}&rdquo;
                      </p>
                    </div>
                  </div>
                )}

                {/* 4. Weekly Completion Progress Box */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                        Weekly Completion Progress
                      </span>
                      <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                        {currentWeekCompletedDays} / 5 days completed
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shadow-2xs">
                      {Math.round((currentWeekCompletedDays / 5) * 100)}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        currentWeekCompletedDays === 5
                          ? 'bg-emerald-500'
                          : currentWeekCompletedDays >= 3
                          ? 'bg-teal-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${(currentWeekCompletedDays / 5) * 100}%` }}
                    />
                  </div>

                  {/* 5 Working Days Pill Matrix */}
                  <div className="grid grid-cols-5 gap-2 pt-1">
                    {DAYS_OF_WEEK.map((day) => {
                      const act = (currentWeek.daily_activities || []).find((a) => a.day_of_week === day);
                      const isComplete = isDayComplete(act);
                      return (
                        <div
                          key={day}
                          className={`p-2 rounded-lg border text-center transition-all ${
                            isComplete
                              ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500'
                          }`}
                        >
                          <div className="flex items-center justify-center mb-1">
                            {isComplete ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </div>
                          <span className="text-[11px] font-bold block">{day.slice(0, 3)}</span>
                          <span className="text-[10px] block mt-0.5 opacity-80">
                            {isComplete ? 'Logged' : 'Empty'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Guidance text */}
                  <p className="text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                    {currentWeekCompletedDays === 5 ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        ✓ All 5 working days are fully logged. Ready for submission.
                      </span>
                    ) : (
                      <span>
                        {5 - currentWeekCompletedDays} day(s) remaining with title &amp; description before submission.
                      </span>
                    )}
                  </p>
                </div>

                {/* Card Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      Status: <strong className="uppercase">{currentWeek.status}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {currentWeek.status === 'draft' || currentWeek.status === 'returned' ? (
                      <button
                        onClick={() => onNavigateToActivity?.(currentWeek.week_number)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
                      >
                        <FileEdit className="w-4 h-4" />
                        <span>{currentWeek.status === 'returned' ? 'Revise & Resubmit Report' : 'Continue Report'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onNavigateToActivity?.(currentWeek.week_number)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Locked Report</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 space-y-3">
                <Calendar className="w-10 h-10 mx-auto text-slate-400" />
                <h4 className="font-semibold text-slate-800 dark:text-slate-200">No Logbook Weeks Found</h4>
                <p className="text-xs max-w-sm mx-auto">
                  You have not initialized any weekly logbook entries yet. Click below to start your first week.
                </p>
                <button
                  onClick={() => onNavigateToActivity?.(1)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
                >
                  Start Week 1 Logbook
                </button>
              </div>
            )}
          </Card>

          {/* 24-Week Interactive Progression Matrix */}
          <Card>
            <CardHeader
              title="24-Week SIWES Timeline & Submissions"
              subtitle="Quick navigation across all training weeks and submission milestones"
              icon={<BookOpen className="w-5 h-5 text-emerald-600" />}
            />
            <div className="space-y-3">
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {Array.from({ length: totalWeeks }, (_, idx) => idx + 1).map((wNum) => {
                  const matchingWeek = weeks.find((w) => w.week_number === wNum);
                  const status: LogbookWeekStatus = matchingWeek?.status || 'draft';
                  const isCurrent = currentWeek?.week_number === wNum;

                  // Completion count for this week
                  const completedDays = matchingWeek
                    ? (matchingWeek.daily_activities || []).filter(isDayComplete).length
                    : 0;

                  return (
                    <button
                      key={wNum}
                      onClick={() => onNavigateToActivity?.(wNum)}
                      title={`Week ${wNum} [${status.toUpperCase()}] - ${completedDays}/5 days complete`}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer relative ${
                        isCurrent
                          ? 'ring-2 ring-emerald-500 border-emerald-400'
                          : 'hover:border-slate-300 dark:hover:border-slate-600'
                      } ${
                        status === 'approved'
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                          : status === 'submitted'
                          ? 'bg-sky-50/70 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800'
                          : status === 'returned'
                          ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
                          : completedDays > 0
                          ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-900 dark:text-white">
                          Wk {wNum}
                        </span>
                        {status === 'approved' && (
                          <Check className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                        )}
                        {status === 'submitted' && (
                          <Send className="w-2.5 h-2.5 text-sky-600 flex-shrink-0" />
                        )}
                        {status === 'returned' && (
                          <AlertTriangle className="w-3 h-3 text-rose-600 flex-shrink-0" />
                        )}
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                        <span>{completedDays}/5</span>
                        <span className="uppercase text-[9px] font-semibold">{status.slice(0, 3)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Status Legend */}
              <div className="flex flex-wrap items-center gap-4 pt-2 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Legend:</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Approved</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                  <span>Submitted</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Draft In-Progress</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>Returned</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <span>Upcoming</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* 5 & 6. Right Column: Recent Logbook Activity & Quick Actions */}
        <div className="space-y-6">
          {/* 5. Recent Logbook Activity Feed */}
          <Card>
            <CardHeader
              title="Recent Logbook Activity"
              subtitle="Latest work records across all weekly entries"
              icon={<Clock className="w-5 h-5 text-emerald-600" />}
              action={
                <button
                  onClick={() => onNavigateToActivity?.()}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              }
            />

            {isLoading ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-600 mb-2" />
                <span>Loading recent activities...</span>
              </div>
            ) : recentActivities.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 -mx-4 -mb-4">
                {recentActivities.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onNavigateToActivity?.(item.weekNumber)}
                    className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                          Wk {item.weekNumber}
                        </span>
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                          {item.dayOfWeek}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {formatDateDisplay(item.date)}
                        </span>
                      </div>
                      {renderStatusBadge(item.weekStatus, 'sm')}
                    </div>

                    <h5 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-emerald-600 transition-colors">
                      {item.title}
                    </h5>

                    <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {item.activity}
                    </p>

                    {item.toolsUsed && (
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Briefcase className="w-3 h-3 text-slate-400" />
                        <span className="line-clamp-1">Tools: {item.toolsUsed}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500 space-y-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                    No Daily Activities Logged Yet
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                    Record your daily industrial training tasks and machinery used to build your SIWES logbook.
                  </p>
                </div>
                <button
                  onClick={() => onNavigateToActivity?.(1)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors"
                >
                  Start First Logbook Entry
                </button>
              </div>
            )}
          </Card>

          {/* 6. Quick Actions Card */}
          <Card>
            <CardHeader
              title="Quick Shortcuts"
              subtitle="Frequent tasks and navigations"
              icon={<Sparkles className="w-5 h-5 text-emerald-600" />}
            />
            <div className="space-y-2 text-xs">
              <button
                onClick={() => onNavigateToActivity?.(currentWeek?.week_number || 1)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                      Daily Activity &amp; Weekly Logbook
                    </p>
                    <p className="text-[11px] text-slate-500">Record Monday–Friday tasks &amp; draft submissions</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={onNavigateToProfile}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white group-hover:text-teal-600 transition-colors">
                      Student Attachment Profile
                    </p>
                    <p className="text-[11px] text-slate-500">Verify placement organisation &amp; supervisor</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => void loadDashboardData(true)}
                disabled={isRefreshing}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center">
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white group-hover:text-sky-600 transition-colors">
                      Sync Database Status
                    </p>
                    <p className="text-[11px] text-slate-500">Recheck coordinator approvals and comments</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
