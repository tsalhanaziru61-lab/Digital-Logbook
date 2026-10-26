/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CalendarCheck,
  Calendar,
  Clock,
  Save,
  Send,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Lock,
  Unlock,
  Check,
  RotateCcw,
  BookOpen,
  Filter,
  Layers,
  Sparkles,
  Info,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { PageHeader } from '../../components/navigation/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge, BadgeVariant } from '../../components/ui/Badge';
import {
  LogbookWeek,
  DailyActivity,
  DayOfWeek,
  DAYS_OF_WEEK,
  LogbookWeekStatus,
} from '../../types/logbook';
import { logbookService } from '../../services/logbook.service';
import { studentService } from '../../services/student.service';

interface DayFormState {
  title: string;
  activity: string;
  tools_used: string;
}

export interface StudentDailyActivityPageProps {
  initialWeekNumber?: number;
  onSelectWeek?: (weekNumber: number) => void;
}

export const StudentDailyActivityPage: React.FC<StudentDailyActivityPageProps> = ({
  initialWeekNumber,
  onSelectWeek,
}) => {
  const { user, profile } = useAuth();
  const studentProfile = profile;
  const studentId = user?.id || profile?.id || 'demo-student-uuid-001';

  // Overall weeks list & active selection
  const [weeks, setWeeks] = useState<LogbookWeek[]>([]);
  const [selectedWeekNumber, setSelectedWeekNumber] = useState<number>(initialWeekNumber || 5); // Default to initialWeekNumber or Week 5
  const [currentWeek, setCurrentWeek] = useState<LogbookWeek | null>(null);

  // Daily activities form state: mapped by DayOfWeek
  const [dayForms, setDayForms] = useState<Record<DayOfWeek, DayFormState>>({
    Monday: { title: '', activity: '', tools_used: '' },
    Tuesday: { title: '', activity: '', tools_used: '' },
    Wednesday: { title: '', activity: '', tools_used: '' },
    Thursday: { title: '', activity: '', tools_used: '' },
    Friday: { title: '', activity: '', tools_used: '' },
  });

  // UI States
  const [activeTabDay, setActiveTabDay] = useState<DayOfWeek>('Monday');
  const [viewMode, setViewMode] = useState<'sheet' | 'tabs'>('sheet');
  const [statusFilter, setStatusFilter] = useState<'all' | LogbookWeekStatus>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Validation & Submit Confirmation Modal
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [submissionErrors, setSubmissionErrors] = useState<Record<DayOfWeek, { title?: string; activity?: string }>>({
    Monday: {},
    Tuesday: {},
    Wednesday: {},
    Thursday: {},
    Friday: {},
  });

  const siwesStartDate = studentProfile?.siwes_start_date;
  const siwesEndDate = studentProfile?.siwes_end_date;

  // Placement progress
  const placementProgress = useMemo(() => {
    return studentService.calculatePlacementProgress(siwesStartDate, siwesEndDate);
  }, [siwesStartDate, siwesEndDate]);

  const totalWeeks = placementProgress.totalWeeks || 24;

  // 1. Load or initialize specific week
  const loadWeekDetails = useCallback(
    async (weekNum: number, existingWeeksList?: LogbookWeek[]) => {
      try {
        const res = await logbookService.getOrCreateWeek(studentId, weekNum, siwesStartDate);
        if (res.success && res.data) {
          const week = res.data;
          setCurrentWeek(week);
          setSelectedWeekNumber(weekNum);

          // Populate day forms
          const newFormState: Record<DayOfWeek, DayFormState> = {
            Monday: { title: '', activity: '', tools_used: '' },
            Tuesday: { title: '', activity: '', tools_used: '' },
            Wednesday: { title: '', activity: '', tools_used: '' },
            Thursday: { title: '', activity: '', tools_used: '' },
            Friday: { title: '', activity: '', tools_used: '' },
          };

          (week.daily_activities || []).forEach((act) => {
            if (newFormState[act.day_of_week]) {
              newFormState[act.day_of_week] = {
                title: act.title || '',
                activity: act.activity || '',
                tools_used: act.tools_used || '',
              };
            }
          });

          setDayForms(newFormState);
          setHasUnsavedChanges(false);
          setSubmissionErrors({
            Monday: {},
            Tuesday: {},
            Wednesday: {},
            Thursday: {},
            Friday: {},
          });

          // Update in weeks list if present
          if (existingWeeksList) {
            setWeeks((prev) =>
              prev.map((w) => (w.week_number === weekNum ? week : w))
            );
          }
        } else {
          setErrorMessage(res.error?.message || 'Failed to open week.');
        }
      } catch {
        setErrorMessage('Unexpected error loading week details.');
      }
    },
    [studentId, siwesStartDate]
  );

  // 2. Load all weeks for student
  const loadAllWeeks = useCallback(
    async (preferredWeekNum?: number) => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const res = await logbookService.getWeeksForStudent(studentId, siwesStartDate, totalWeeks);
        if (res.success && res.data) {
          setWeeks(res.data);
          const targetWeekNum = preferredWeekNum ?? selectedWeekNumber;
          await loadWeekDetails(targetWeekNum, res.data);
        } else {
          setErrorMessage(res.error?.message || 'Failed to load logbook schedule.');
        }
      } catch {
        setErrorMessage('Unexpected connection error loading logbook schedule.');
      } finally {
        setIsLoading(false);
      }
    },
    [studentId, siwesStartDate, totalWeeks, selectedWeekNumber, loadWeekDetails]
  );

  useEffect(() => {
    let isCancelled = false;
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        const res = await logbookService.getWeeksForStudent(studentId, siwesStartDate, totalWeeks);
        if (!isCancelled) {
          if (res.success && res.data) {
            setWeeks(res.data);
            await loadWeekDetails(selectedWeekNumber, res.data);
          } else {
            setErrorMessage(res.error?.message || 'Failed to load logbook schedule.');
          }
        }
      } catch {
        if (!isCancelled) {
          setErrorMessage('Unexpected connection error loading logbook schedule.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void fetchInitialData();
    return () => {
      isCancelled = true;
    };
  }, [studentId, siwesStartDate, totalWeeks, loadWeekDetails, selectedWeekNumber]);

  // Lock status check
  const isReadOnly = useMemo(() => {
    if (!currentWeek) return true;
    return currentWeek.status === 'submitted' || currentWeek.status === 'approved';
  }, [currentWeek]);

  // Handle Input Changes
  const handleDayFieldChange = (day: DayOfWeek, field: keyof DayFormState, value: string) => {
    if (isReadOnly) return;
    setDayForms((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
    setHasUnsavedChanges(true);
    setSaveSuccessMsg(null);

    // Clear submission errors for this day when user types
    if (submissionErrors[day]?.[field as 'title' | 'activity']) {
      setSubmissionErrors((prev) => ({
        ...prev,
        [day]: {
          ...prev[day],
          [field]: undefined,
        },
      }));
    }
  };

  // Switch Week Handler
  const handleSelectWeek = async (weekNum: number) => {
    if (weekNum === selectedWeekNumber) return;
    if (hasUnsavedChanges) {
      const confirmSwitch = window.confirm(
        'You have unsaved changes in the current week. Do you want to switch weeks without saving?'
      );
      if (!confirmSwitch) return;
    }
    setSaveSuccessMsg(null);
    setErrorMessage(null);
    onSelectWeek?.(weekNum);
    await loadWeekDetails(weekNum, weeks);
  };


  // Previous & Next navigation
  const handlePrevWeek = () => {
    if (selectedWeekNumber > 1) {
      handleSelectWeek(selectedWeekNumber - 1);
    }
  };

  const handleNextWeek = () => {
    if (selectedWeekNumber < totalWeeks) {
      handleSelectWeek(selectedWeekNumber + 1);
    }
  };

  // Save Draft Action
  const handleSaveDraft = async () => {
    if (!currentWeek || isReadOnly) return;

    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccessMsg(null);

    const activitiesToSave = DAYS_OF_WEEK.map((day) => {
      const existing = (currentWeek.daily_activities || []).find((a) => a.day_of_week === day);
      return {
        day_of_week: day,
        date: existing?.date || currentWeek.start_date,
        title: dayForms[day].title,
        activity: dayForms[day].activity,
        tools_used: dayForms[day].tools_used,
      };
    });

    try {
      const res = await logbookService.saveActivitiesDraft({
        week_id: currentWeek.id,
        student_id: studentId,
        week_number: currentWeek.week_number,
        activities: activitiesToSave,
      });

      if (res.success && res.data) {
        setCurrentWeek(res.data);
        setHasUnsavedChanges(false);
        setSaveSuccessMsg('Weekly draft activities saved successfully.');
        // Update in weeks list
        setWeeks((prev) =>
          prev.map((w) => (w.id === res.data!.id ? res.data! : w))
        );
      } else {
        setErrorMessage(res.error?.message || 'Failed to save draft.');
      }
    } catch {
      setErrorMessage('Unexpected connection error saving draft.');
    } finally {
      setIsSaving(false);
    }
  };

  // Initiate Submission: Validate First
  const handleInitiateSubmit = () => {
    if (!currentWeek || isReadOnly) return;

    // Validate 5 working days
    const activitiesToValidate = DAYS_OF_WEEK.map((day) => ({
      day_of_week: day,
      title: dayForms[day].title,
      activity: dayForms[day].activity,
    }));

    const validation = logbookService.validateWeekForSubmission(activitiesToValidate);

    if (!validation.isValidForSubmission) {
      setSubmissionErrors(validation.missingFieldErrors);
      setErrorMessage(
        `Cannot submit week. All 5 working days (Monday through Friday) must be completed. Incomplete days: ${validation.missingDays.join(', ')}.`
      );
      // Auto-switch to first incomplete day if in tab mode
      if (validation.missingDays.length > 0) {
        setActiveTabDay(validation.missingDays[0]);
      }
      return;
    }

    setSubmissionErrors({
      Monday: {},
      Tuesday: {},
      Wednesday: {},
      Thursday: {},
      Friday: {},
    });
    setErrorMessage(null);
    setShowSubmitModal(true);
  };

  // Confirm Final Submission
  const handleConfirmSubmit = async () => {
    if (!currentWeek) return;

    // Save current content first if modified
    if (hasUnsavedChanges) {
      await handleSaveDraft();
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await logbookService.submitWeek(currentWeek.id, studentId);
      if (res.success && res.data) {
        setCurrentWeek(res.data);
        setHasUnsavedChanges(false);
        setShowSubmitModal(false);
        setSaveSuccessMsg('Weekly report submitted to coordinator successfully! Editing is now locked.');
        // Update in weeks list
        setWeeks((prev) =>
          prev.map((w) => (w.id === res.data!.id ? res.data! : w))
        );
      } else {
        setErrorMessage(res.error?.message || 'Failed to submit report.');
        setShowSubmitModal(false);
      }
    } catch {
      setErrorMessage('Unexpected connection error during submission.');
      setShowSubmitModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset Demo Weeks helper
  const handleResetDemo = () => {
    if (window.confirm('Reset all demo weeks back to initial state?')) {
      logbookService.resetDemoWeeks(studentId);
      loadAllWeeks(5);
    }
  };

  // Helper for status badge styling
  const getStatusBadge = (status: LogbookWeekStatus) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'submitted':
        return <Badge variant="info">Submitted / Under Review</Badge>;
      case 'returned':
        return <Badge variant="danger">Returned for Revisions</Badge>;
      case 'draft':
      default:
        return <Badge variant="warning">Draft</Badge>;
    }
  };

  // Filtered weeks
  const filteredWeeks = useMemo(() => {
    if (statusFilter === 'all') return weeks;
    return weeks.filter((w) => w.status === statusFilter);
  }, [weeks, statusFilter]);

  // Calculate day completion stats for current week
  const dayCompletionCount = useMemo(() => {
    let count = 0;
    DAYS_OF_WEEK.forEach((d) => {
      if (dayForms[d].title.trim().length >= 3 && dayForms[d].activity.trim().length >= 10) {
        count++;
      }
    });
    return count;
  }, [dayForms]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Weekly Logbook & Daily Activities"
        subtitle="Record daily work tasks, machinery utilized, and submit compiled five-day reports for supervisor endorsement."
        icon={CalendarCheck}
        badge={
          currentWeek ? (
            getStatusBadge(currentWeek.status)
          ) : (
            <Badge variant="neutral">Loading...</Badge>
          )
        }
        breadcrumbs={[
          { label: 'Student Portal' },
          { label: 'Daily Activity' },
          { label: `Week ${selectedWeekNumber}` }
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Save Draft Button */}
            {!isReadOnly && (
              <button
                onClick={handleSaveDraft}
                disabled={isSaving || isSubmitting}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4 text-slate-500" />
                <span>{isSaving ? 'Saving Draft...' : 'Save Draft'}</span>
              </button>
            )}

            {/* Submit Week Button */}
            {!isReadOnly && (
              <button
                onClick={handleInitiateSubmit}
                disabled={isSaving || isSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{currentWeek?.status === 'returned' ? 'Update & Resubmit' : 'Submit Week Report'}</span>
              </button>
            )}

            {/* Locked Indicator for Submitted / Approved */}
            {isReadOnly && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Locked ({currentWeek?.status})</span>
              </div>
            )}
          </div>
        }
      />

      {/* Global Notifications: Success / Error */}
      {saveSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs sm:text-sm text-emerald-800 dark:text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
          <button
            onClick={() => setSaveSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center justify-between text-xs sm:text-sm text-rose-800 dark:text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-700 hover:text-rose-900 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Status Alert Banner & Review Feedback Section (Module 11) */}
      {currentWeek && currentWeek.status === 'returned' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/90 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-800 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-rose-900 dark:text-rose-200 text-sm sm:text-base">
                    Weekly Report Returned for Correction
                  </h4>
                  <Badge variant="danger">Status: Returned</Badge>
                </div>
                {currentWeek.reviewed_at && (
                  <span className="text-xs text-rose-700 dark:text-rose-400">
                    Reviewed: {new Date(currentWeek.reviewed_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                )}
              </div>

              {/* Administrator Remark */}
              <div className="text-xs sm:text-sm text-rose-900 dark:text-rose-200">
                <strong>Administrator Remark:</strong>{' '}
                <span className="px-2 py-0.5 rounded-md bg-rose-200 dark:bg-rose-900/60 font-semibold text-rose-900 dark:text-rose-200 ml-1">
                  {currentWeek.admin_remark || currentWeek.reviewer_remarks || 'Needs Improvement'}
                </span>
              </div>

              {/* Administrator Feedback */}
              {(currentWeek.admin_feedback || currentWeek.reviewer_remarks) && (
                <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-rose-200 dark:border-rose-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                  <p className="font-bold text-rose-800 dark:text-rose-300 text-xs uppercase tracking-wider mb-1">
                    Coordinator Correction Instructions:
                  </p>
                  <p className="leading-relaxed whitespace-pre-wrap">
                    {currentWeek.admin_feedback || currentWeek.reviewer_remarks}
                  </p>
                </div>
              )}

              <p className="text-rose-700 dark:text-rose-300 text-xs pt-1">
                Editing is active for this week. Modify your daily logs below based on the feedback, then click <strong>&ldquo;Update & Resubmit&rdquo;</strong> to send the updated logbook back for review.
              </p>
            </div>
          </div>
        </div>
      )}

      {currentWeek && currentWeek.status === 'submitted' && (
        <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 flex items-start gap-3">
          <Clock className="w-5 h-5 text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs sm:text-sm flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sky-900 dark:text-sky-200">
                Report Submitted &amp; Awaiting Review
              </h4>
              <Badge variant="info">Status: Submitted</Badge>
            </div>
            <p className="text-sky-800 dark:text-sky-300 leading-relaxed">
              This five-day weekly report was submitted on{' '}
              {currentWeek.submitted_at
                ? new Date(currentWeek.submitted_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Friday'}.
              Entries are currently locked in read-only mode while your institutional coordinator inspects your submitted daily logs.
            </p>
          </div>
        </div>
      )}

      {currentWeek && currentWeek.status === 'approved' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/40 border-2 border-emerald-300 dark:border-emerald-800 space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-emerald-900 dark:text-emerald-200 text-sm sm:text-base">
                    Official Supervisor Endorsement Granted
                  </h4>
                  <Badge variant="success">Status: Approved</Badge>
                </div>
                {currentWeek.reviewed_at && (
                  <span className="text-xs text-emerald-700 dark:text-emerald-400">
                    Reviewed: {new Date(currentWeek.reviewed_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                )}
              </div>

              {/* Administrative Remark & Grade */}
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-emerald-900 dark:text-emerald-200">
                <span><strong>Administrator Remark:</strong></span>
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-200 dark:bg-emerald-900/60 font-bold text-emerald-900 dark:text-emerald-200">
                  {currentWeek.admin_remark || currentWeek.reviewer_remarks || 'Excellent'}
                </span>
                {currentWeek.supervisor_grade && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-100 font-bold text-xs">
                    Grade: {currentWeek.supervisor_grade}
                  </span>
                )}
              </div>

              {/* Administrator Feedback */}
              {(currentWeek.admin_feedback || currentWeek.reviewer_remarks) && (
                <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-emerald-200 dark:border-emerald-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                  <p className="font-bold text-emerald-800 dark:text-emerald-300 text-xs uppercase tracking-wider mb-1">
                    Coordinator Endorsement Notes:
                  </p>
                  <p className="leading-relaxed whitespace-pre-wrap">
                    {currentWeek.admin_feedback || currentWeek.reviewer_remarks}
                  </p>
                </div>
              )}

              <p className="text-emerald-700 dark:text-emerald-400 text-xs">
                This week is locked in read-only mode as an approved official record.
              </p>
            </div>
          </div>
        </div>
      )}

      {currentWeek && currentWeek.status === 'draft' && (
        <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-200">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              <strong>Draft Mode:</strong> You can enter and save daily logs individually. All 5 days ({dayCompletionCount}/5 completed) must be filled before submitting to your coordinator.
            </span>
          </div>
          {hasUnsavedChanges && (
            <span className="text-xs text-amber-700 dark:text-amber-300 font-semibold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/40">
              Unsaved changes
            </span>
          )}
        </div>
      )}

      {/* Week Selection Card */}
      <Card>
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Week Info & Navigation Controls */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Week {selectedWeekNumber} of {totalWeeks}
                </h3>
                {currentWeek && getStatusBadge(currentWeek.status)}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {currentWeek
                  ? `${currentWeek.start_date} (Monday) — ${currentWeek.end_date} (Friday)`
                  : 'Calculating dates...'}
              </p>
            </div>
          </div>

          {/* Stepper Buttons and View Toggle */}
          <div className="flex items-center gap-2">
            {/* View switcher */}
            <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5 text-xs">
              <button
                onClick={() => setViewMode('sheet')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  viewMode === 'sheet'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                5-Day Sheet
              </button>
              <button
                onClick={() => setViewMode('tabs')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  viewMode === 'tabs'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Focused Tabs
              </button>
            </div>

            {/* Stepper */}
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevWeek}
                disabled={selectedWeekNumber <= 1}
                title="Previous Week"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <select
                value={selectedWeekNumber}
                onChange={(e) => handleSelectWeek(Number(e.target.value))}
                className="px-2 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
              >
                {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((num) => {
                  const matchingWeek = weeks.find((w) => w.week_number === num);
                  const statusLabel = matchingWeek ? `[${matchingWeek.status}]` : '[draft]';
                  return (
                    <option key={num} value={num}>
                      Week {num} {statusLabel}
                    </option>
                  );
                })}
              </select>

              <button
                onClick={handleNextWeek}
                disabled={selectedWeekNumber >= totalWeeks}
                title="Next Week"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Week Quick Strip */}
        <div className="p-3 bg-slate-50/70 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              Attachment Schedule (24 Weeks)
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {(['all', 'approved', 'submitted', 'returned', 'draft'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer capitalize ${
                    statusFilter === st
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {filteredWeeks.length === 0 ? (
              <span className="text-xs text-slate-400 py-1">No weeks matching status &apos;{statusFilter}&apos;.</span>
            ) : (
              filteredWeeks.map((w) => {
                const weekNum = w.week_number;
                const status = w.status;
                const isSelected = weekNum === selectedWeekNumber;

                let dotColor = 'bg-slate-300 dark:bg-slate-600';
                if (status === 'approved') dotColor = 'bg-emerald-500';
                else if (status === 'submitted') dotColor = 'bg-sky-500';
                else if (status === 'returned') dotColor = 'bg-rose-500';

                return (
                  <button
                    key={weekNum}
                    type="button"
                    onClick={() => handleSelectWeek(weekNum)}
                    className={`flex-shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs font-bold'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : dotColor}`} />
                    <span>W{String(weekNum).padStart(2, '0')}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* 5 Working Days: Tab Navigation Strip (shown in both or tab mode) */}
        <div className="grid grid-cols-5 border-b border-slate-200 dark:border-slate-800 text-center">
          {DAYS_OF_WEEK.map((day) => {
            const hasTitle = dayForms[day].title.trim().length >= 3;
            const hasActivity = dayForms[day].activity.trim().length >= 10;
            const isCompleted = hasTitle && hasActivity;
            const hasError = Boolean(submissionErrors[day]?.title || submissionErrors[day]?.activity);
            const actRecord = (currentWeek?.daily_activities || []).find((a) => a.day_of_week === day);

            return (
              <button
                key={day}
                onClick={() => {
                  setActiveTabDay(day);
                  if (viewMode === 'sheet') {
                    // Smooth scroll to the specific day row
                    const el = document.getElementById(`day-section-${day}`);
                    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }}
                className={`p-3 text-xs sm:text-sm font-medium border-b-2 transition-all cursor-pointer relative ${
                  activeTabDay === day
                    ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20 font-bold'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="font-semibold">{day}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {actRecord ? actRecord.date : '—'}
                </div>
                <div className="mt-1 flex items-center justify-center gap-1">
                  {hasError ? (
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-rose-600 font-bold">
                      <AlertCircle className="w-3 h-3" /> Incomplete
                    </span>
                  ) : isCompleted ? (
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3 h-3" /> Logged
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-mono">Pending</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Content Area: View Mode (5-Day Sheet vs Focused Tabs) */}
        {viewMode === 'sheet' ? (
          /* =========================================================================
           * 5-DAY STRUCTURED SHEET VIEW:
           * | DAY | DATE | TITLE | ACTIVITY |
           * Displays Monday through Friday stacked with direct input & textarea.
           * ========================================================================= */
          <div className="p-4 sm:p-6 space-y-6">
            <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Five-Day Daily Activity Log Entries
              </span>
              <span>
                Completed: <strong className="text-emerald-600">{dayCompletionCount}</strong> / 5 days
              </span>
            </div>

            <div className="space-y-6">
              {DAYS_OF_WEEK.map((day, index) => {
                const actRecord = (currentWeek?.daily_activities || []).find((a) => a.day_of_week === day);
                const dayDate = actRecord?.date || '—';
                const hasErrorTitle = submissionErrors[day]?.title;
                const hasErrorActivity = submissionErrors[day]?.activity;
                const isDayFilled = dayForms[day].title.trim().length >= 3 && dayForms[day].activity.trim().length >= 10;

                return (
                  <div
                    key={day}
                    id={`day-section-${day}`}
                    className={`rounded-xl border transition-all ${
                      hasErrorTitle || hasErrorActivity
                        ? 'border-rose-300 dark:border-rose-800 bg-rose-50/20'
                        : isDayFilled
                        ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/20'
                    }`}
                  >
                    {/* Day Banner Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-100/70 dark:bg-slate-800/60 rounded-t-xl border-b border-slate-200 dark:border-slate-700/60 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-[10px]">
                          {index + 1}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {day}
                        </span>
                        <span className="font-mono text-slate-500 dark:text-slate-400">
                          ({dayDate})
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isDayFilled ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <Check className="w-3.5 h-3.5" /> Completed
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-mono">
                            Pending Entry
                          </span>
                        )}
                        {isReadOnly && (
                          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Read-only
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Inputs Area */}
                    <div className="p-4 sm:p-5 space-y-4">
                      {/* Title Row */}
                      <div>
                        <label
                          htmlFor={`title-${day}`}
                          className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1"
                        >
                          Work Title / Task Summary <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id={`title-${day}`}
                          type="text"
                          disabled={isReadOnly}
                          value={dayForms[day].title}
                          onChange={(e) => handleDayFieldChange(day, 'title', e.target.value)}
                          placeholder={`e.g., ${
                            day === 'Monday'
                              ? 'Server Room Cable Patching & Switch Firmware Upgrade'
                              : day === 'Tuesday'
                              ? 'Configuring Corporate VLANs & Testing Inter-VLAN Routing'
                              : day === 'Wednesday'
                              ? 'Linux Server Hardening & SSH Key Setup'
                              : day === 'Thursday'
                              ? 'PostgreSQL Replication & Database Performance Tuning'
                              : 'System Maintenance & Departmental Weekly Debrief'
                          }`}
                          className={`w-full px-3.5 py-2.5 rounded-lg text-xs sm:text-sm border transition-colors ${
                            hasErrorTitle
                              ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/20 text-rose-900'
                              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-emerald-500'
                          } disabled:bg-slate-100 disabled:text-slate-600 dark:disabled:bg-slate-800/80 dark:disabled:text-slate-400 disabled:cursor-not-allowed`}
                        />
                        {hasErrorTitle && (
                          <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {hasErrorTitle}
                          </p>
                        )}
                      </div>

                      {/* Activity Textarea Row */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label
                            htmlFor={`activity-${day}`}
                            className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                          >
                            Detailed Technical Activity &amp; Procedures <span className="text-rose-500">*</span>
                          </label>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {dayForms[day].activity.length} characters (min 10)
                          </span>
                        </div>
                        <textarea
                          id={`activity-${day}`}
                          rows={4}
                          disabled={isReadOnly}
                          value={dayForms[day].activity}
                          onChange={(e) => handleDayFieldChange(day, 'activity', e.target.value)}
                          placeholder="Describe the specific industrial tasks carried out, operational difficulties encountered, and competencies gained during this work day..."
                          className={`w-full px-3.5 py-2.5 rounded-lg text-xs sm:text-sm border leading-relaxed transition-colors ${
                            hasErrorActivity
                              ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/20 text-rose-900'
                              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-emerald-500'
                          } disabled:bg-slate-100 disabled:text-slate-600 dark:disabled:bg-slate-800/80 dark:disabled:text-slate-400 disabled:cursor-not-allowed`}
                        />
                        {hasErrorActivity && (
                          <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {hasErrorActivity}
                          </p>
                        )}
                      </div>

                      {/* Tools & Equipment Utilized */}
                      <div>
                        <label
                          htmlFor={`tools-${day}`}
                          className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1"
                        >
                          Tools, Machinery &amp; Equipment Utilized (Optional)
                        </label>
                        <input
                          id={`tools-${day}`}
                          type="text"
                          disabled={isReadOnly}
                          value={dayForms[day].tools_used}
                          onChange={(e) => handleDayFieldChange(day, 'tools_used', e.target.value)}
                          placeholder="e.g., Cisco Catalyst 2960, Fluke cable tester, PuTTY, Wireshark"
                          className="w-full px-3 py-1.5 rounded-lg text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 disabled:bg-slate-100 dark:disabled:bg-slate-800/80 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* =========================================================================
           * FOCUSED TAB VIEW:
           * Focus on one day at a time with rapid Previous / Next Day buttons.
           * ========================================================================= */
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {activeTabDay} Log Entry
                </h3>
                <p className="text-xs text-slate-500">
                  {currentWeek?.daily_activities?.find((a) => a.day_of_week === activeTabDay)?.date || '—'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const currentIndex = DAYS_OF_WEEK.indexOf(activeTabDay);
                    if (currentIndex > 0) setActiveTabDay(DAYS_OF_WEEK[currentIndex - 1]);
                  }}
                  disabled={DAYS_OF_WEEK.indexOf(activeTabDay) === 0}
                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 cursor-pointer"
                >
                  ← Prev Day
                </button>
                <button
                  onClick={() => {
                    const currentIndex = DAYS_OF_WEEK.indexOf(activeTabDay);
                    if (currentIndex < DAYS_OF_WEEK.length - 1) setActiveTabDay(DAYS_OF_WEEK[currentIndex + 1]);
                  }}
                  disabled={DAYS_OF_WEEK.indexOf(activeTabDay) === DAYS_OF_WEEK.length - 1}
                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 cursor-pointer"
                >
                  Next Day →
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Task Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={dayForms[activeTabDay].title}
                  onChange={(e) => handleDayFieldChange(activeTabDay, 'title', e.target.value)}
                  placeholder="Task title or summary"
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
                {submissionErrors[activeTabDay]?.title && (
                  <p className="text-xs text-rose-600 mt-1">{submissionErrors[activeTabDay]?.title}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Activity Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={6}
                  disabled={isReadOnly}
                  value={dayForms[activeTabDay].activity}
                  onChange={(e) => handleDayFieldChange(activeTabDay, 'activity', e.target.value)}
                  placeholder="Comprehensive description of operations performed..."
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
                {submissionErrors[activeTabDay]?.activity && (
                  <p className="text-xs text-rose-600 mt-1">{submissionErrors[activeTabDay]?.activity}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Tools, Machinery &amp; Equipment
                </label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={dayForms[activeTabDay].tools_used}
                  onChange={(e) => handleDayFieldChange(activeTabDay, 'tools_used', e.target.value)}
                  placeholder="Hardware/software utilized..."
                  className="w-full px-3 py-2 rounded-lg text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        )}

        {/* Bottom Submission Bar */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 rounded-b-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {isReadOnly ? (
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                This week is locked from student modification ({currentWeek?.status}).
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <strong>{dayCompletionCount} of 5 working days</strong> have valid title and description entries.
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {!isReadOnly && (
              <>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isSaving || isSubmitting}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4 text-slate-500" />
                  <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleInitiateSubmit}
                  disabled={isSaving || isSubmitting}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{currentWeek?.status === 'returned' ? 'Update & Resubmit' : 'Submit 5-Day Report'}</span>
                </button>
              </>
            )}

            {/* Helper link for demo sandbox */}
            {studentId.startsWith('demo-') && (
              <button
                type="button"
                onClick={handleResetDemo}
                className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline cursor-pointer ml-auto"
                title="Reset demo weeks to default seed values"
              >
                Reset Demo Weeks
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* SUBMISSION CONFIRMATION MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-slate-50/70 dark:bg-slate-800/40">
              <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Submit Week {selectedWeekNumber} Logbook Report
                </h3>
                <p className="text-xs text-slate-500">
                  {currentWeek?.start_date} to {currentWeek?.end_date}
                </p>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs sm:text-sm">
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                You are about to officially submit this weekly logbook to your industrial training coordinator and supervisor for review.
              </p>

              {/* 5-day Checklist */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Five-Day Completion Checklist
                </span>
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day} className="flex items-center justify-between py-1 text-xs border-b border-slate-200/50 dark:border-slate-700/40 last:border-0">
                    <span className="font-medium text-slate-800 dark:text-slate-200">{day}:</span>
                    <span className="text-slate-600 dark:text-slate-400 truncate max-w-[240px] text-right font-mono">
                      {dayForms[day].title || '—'}
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 ml-2" />
                  </div>
                ))}
              </div>

              {/* Lock Warning */}
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                <Lock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Important:</strong> Once submitted, the entries for Week {selectedWeekNumber} will be locked. You will not be able to edit them unless your supervisor returns the report for revision.
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel &amp; Continue Editing
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Submitting to Coordinator...' : 'Confirm Submission'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
