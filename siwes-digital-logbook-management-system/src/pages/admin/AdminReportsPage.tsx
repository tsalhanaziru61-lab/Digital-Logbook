/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Filter,
  Search,
  Sparkles,
  Info,
  Calendar,
  Building2,
  GraduationCap,
  Mail,
  User,
  ArrowLeft,
  RotateCcw,
  Check,
  X,
  Send,
  MessageSquare,
  HelpCircle,
  ShieldCheck,
  Lock,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Wrench,
  ThumbsUp,
  Award
} from 'lucide-react';
import { PageHeader } from '../../components/navigation/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge, BadgeVariant } from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';
import { reportReviewService } from '../../services/reportReviewService';
import {
  WeeklyReportWithStudent,
  ReportFilterStatus,
  ReviewStatsSummary,
  ADMIN_REMARK_OPTIONS,
  AdminRemarkPreset,
  DAYS_OF_WEEK,
  DayOfWeek,
  DailyActivity
} from '../../types/logbook';

export const AdminReportsPage: React.FC = () => {
  const { user, profile, isAdmin } = useAuth();

  // Primary reports and stats state
  const [reports, setReports] = useState<WeeklyReportWithStudent[]>([]);
  const [stats, setStats] = useState<ReviewStatsSummary>({
    total: 0,
    submitted: 0,
    approved: 0,
    returned: 0,
    draft: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Search & Filters state (Default filter is 'submitted' to prioritize unreviewed reports)
  const [filterStatus, setFilterStatus] = useState<ReportFilterStatus>('submitted');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('all');
  const [selectedWeekNumber, setSelectedWeekNumber] = useState<number | 'all'>('all');

  // Active Report Details View state
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<WeeklyReportWithStudent | null>(null);
  const [isLoadingReportDetail, setIsLoadingReportDetail] = useState<boolean>(false);

  // Review Form state
  const [adminRemark, setAdminRemark] = useState<string>('Good');
  const [customRemark, setCustomRemark] = useState<string>('');
  const [isCustomRemarkMode, setIsCustomRemarkMode] = useState<boolean>(false);
  const [adminFeedback, setAdminFeedback] = useState<string>('');

  // Confirmation Modals state
  const [isApproveModalOpen, setIsApproveModalOpen] = useState<boolean>(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState<boolean>(false);
  const [isSubmittingAction, setIsSubmittingAction] = useState<boolean>(false);

  // Feedback toast banner
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch reports queue asynchronously on filter/trigger change
  useEffect(() => {
    let isMounted = true;

    const loadReports = async () => {
      try {
        const res = await reportReviewService.getReports({
          status: filterStatus,
          studentId: selectedStudentId !== 'all' ? selectedStudentId : undefined,
          weekNumber: selectedWeekNumber !== 'all' ? selectedWeekNumber : undefined,
          search: searchQuery,
        });

        if (isMounted) {
          if (res.success && res.data) {
            setReports(res.data.reports);
            setStats(res.data.stats);
            setError(null);
          } else {
            setError(res.error?.message || 'Failed to retrieve reports.');
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Error retrieving reports.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadReports();

    return () => {
      isMounted = false;
    };
  }, [filterStatus, selectedStudentId, selectedWeekNumber, searchQuery, refreshTrigger]);

  // Load single report details when opening
  useEffect(() => {
    if (!selectedReportId) return;

    let isMounted = true;

    const loadDetail = async () => {
      try {
        const res = await reportReviewService.getReportById(selectedReportId);
        if (isMounted) {
          if (res.success && res.data) {
            setSelectedReport(res.data);
            // Prepopulate form if existing remarks exist
            if (res.data.admin_remark) {
              if (ADMIN_REMARK_OPTIONS.includes(res.data.admin_remark as AdminRemarkPreset)) {
                setAdminRemark(res.data.admin_remark);
                setIsCustomRemarkMode(false);
                setCustomRemark('');
              } else {
                setAdminRemark('Custom');
                setIsCustomRemarkMode(true);
                setCustomRemark(res.data.admin_remark);
              }
            } else {
              setAdminRemark('Good');
              setIsCustomRemarkMode(false);
              setCustomRemark('');
            }

            if (res.data.admin_feedback) {
              setAdminFeedback(res.data.admin_feedback);
            } else {
              setAdminFeedback('');
            }
          } else {
            setToastMessage({ type: 'error', text: res.error?.message || 'Failed to load report details.' });
          }
        }
      } catch (err) {
        if (isMounted) {
          setToastMessage({
            type: 'error',
            text: err instanceof Error ? err.message : 'Failed to load report details.',
          });
        }
      } finally {
        if (isMounted) {
          setIsLoadingReportDetail(false);
        }
      }
    };

    void loadDetail();

    return () => {
      isMounted = false;
    };
  }, [selectedReportId]);


  // Unique students list for dropdown filter
  const uniqueStudents = useMemo(() => {
    const map = new Map<string, { id: string; name: string; matric: string }>();
    reports.forEach((r) => {
      if (r.student && !map.has(r.student.id)) {
        map.set(r.student.id, {
          id: r.student.id,
          name: r.student.full_name,
          matric: r.student.matric_number || r.student.matric_no || 'N/A',
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [reports]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Handle Approve Action
  const handleConfirmApproval = async () => {
    if (!selectedReport) return;
    const finalRemark = isCustomRemarkMode ? customRemark.trim() : adminRemark.trim();

    if (!finalRemark) {
      setToastMessage({ type: 'error', text: 'Please select or provide an administrative remark.' });
      return;
    }

    setIsSubmittingAction(true);
    try {
      const adminId = user?.id || profile?.id || 'demo-admin-uuid-002';
      const res = await reportReviewService.approveReport({
        weekId: selectedReport.id,
        adminId,
        adminRemark: finalRemark,
        adminFeedback: adminFeedback.trim(),
      });

      if (res.success && res.data) {
        setSelectedReport(res.data);
        setIsApproveModalOpen(false);
        setToastMessage({
          type: 'success',
          text: `Week ${res.data.week_number} report for ${res.data.student.full_name} has been approved successfully.`,
        });
        setRefreshTrigger((prev) => prev + 1);
      } else {
        setToastMessage({ type: 'error', text: res.error?.message || 'Failed to approve report.' });
      }
    } catch (err) {
      setToastMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error approving report.',
      });
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Handle Return for Correction Action
  const handleConfirmReturn = async () => {
    if (!selectedReport) return;
    const trimmedFeedback = adminFeedback.trim();
    if (!trimmedFeedback || trimmedFeedback.length < 5) {
      setToastMessage({
        type: 'error',
        text: 'Constructive feedback explaining what requires correction is mandatory (min 5 characters).',
      });
      return;
    }

    const finalRemark = isCustomRemarkMode ? customRemark.trim() : adminRemark.trim() || 'Needs Improvement';

    setIsSubmittingAction(true);
    try {
      const adminId = user?.id || profile?.id || 'demo-admin-uuid-002';
      const res = await reportReviewService.returnReport({
        weekId: selectedReport.id,
        adminId,
        adminRemark: finalRemark,
        adminFeedback: trimmedFeedback,
      });

      if (res.success && res.data) {
        setSelectedReport(res.data);
        setIsReturnModalOpen(false);
        setToastMessage({
          type: 'success',
          text: `Week ${res.data.week_number} report returned to ${res.data.student.full_name} for revisions.`,
        });
        setRefreshTrigger((prev) => prev + 1);
      } else {
        setToastMessage({ type: 'error', text: res.error?.message || 'Failed to return report.' });
      }
    } catch (err) {
      setToastMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error returning report.',
      });
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Helper for status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return (
          <Badge variant="warning" size="sm" className="gap-1 font-semibold">
            <Clock className="w-3 h-3" />
            <span>Awaiting Review</span>
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="success" size="sm" className="gap-1 font-semibold">
            <CheckCircle2 className="w-3 h-3" />
            <span>Approved</span>
          </Badge>
        );
      case 'returned':
        return (
          <Badge variant="danger" size="sm" className="gap-1 font-semibold">
            <RotateCcw className="w-3 h-3" />
            <span>Returned for Correction</span>
          </Badge>
        );
      case 'draft':
      default:
        return (
          <Badge variant="neutral" size="sm" className="gap-1">
            <span>Draft</span>
          </Badge>
        );
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return `${d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return dateStr;
    }
  };

  // =========================================================================
  // VIEW: DETAILED REPORT VIEW (Open Report)
  // =========================================================================
  if (selectedReportId && selectedReport) {
    const isSubmitted = selectedReport.status === 'submitted';
    const isApproved = selectedReport.status === 'approved';
    const isReturned = selectedReport.status === 'returned';
    const isDraft = selectedReport.status === 'draft';

    const activities = (selectedReport.daily_activities || []).sort((a, b) => {
      return DAYS_OF_WEEK.indexOf(a.day_of_week) - DAYS_OF_WEEK.indexOf(b.day_of_week);
    });

    return (
      <div className="space-y-6">
        {/* Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => {
              setSelectedReportId(null);
              setSelectedReport(null);
            }}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Reports Review Queue</span>
          </button>


          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Current Status:</span>
            {getStatusBadge(selectedReport.status)}
          </div>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs sm:text-sm animate-in fade-in duration-200 ${
              toastMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {toastMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
              )}
              <span>{toastMessage.text}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 1. Header Banner */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-700 to-slate-900 text-white shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-white/20 text-white text-xs font-mono font-bold uppercase tracking-wider">
                  Week {selectedReport.week_number} Logbook Report
                </span>
                <span className="text-xs text-amber-200">
                  {formatDate(selectedReport.start_date)} – {formatDate(selectedReport.end_date)}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mt-1.5">
                {selectedReport.student.full_name}
              </h2>
              <p className="text-xs sm:text-sm text-amber-100 mt-0.5 flex flex-wrap items-center gap-3">
                <span>Matric: <strong className="font-mono">{selectedReport.student.matric_number || selectedReport.student.matric_no}</strong></span>
                <span>•</span>
                <span>{selectedReport.student.department || 'Department N/A'}</span>
                <span>•</span>
                <span>{selectedReport.student.institution || 'Institution N/A'}</span>
              </p>
            </div>

            <div className="flex flex-col md:items-end justify-center shrink-0">
              <span className="text-[11px] uppercase tracking-wider text-amber-200 font-semibold">
                Submission Timestamp
              </span>
              <p className="text-sm font-medium mt-0.5">
                {formatDateTime(selectedReport.submitted_at)}
              </p>
              {selectedReport.reviewed_at && (
                <p className="text-xs text-emerald-200 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Reviewed {formatDate(selectedReport.reviewed_at)}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 2. Metadata Grid (Student Info & Weekly Details) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Student Info Card */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <GraduationCap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Student Placement Profile
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 font-medium block">Full Name:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {selectedReport.student.full_name}
                </p>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Email:</span>
                <p className="font-mono text-slate-700 dark:text-slate-300 mt-0.5 truncate">
                  {selectedReport.student.email || '—'}
                </p>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Matriculation No:</span>
                <p className="font-mono font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {selectedReport.student.matric_number || selectedReport.student.matric_no}
                </p>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Department:</span>
                <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                  {selectedReport.student.department || '—'}
                </p>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 font-medium block">Attachment Organisation:</span>
                <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{selectedReport.student.organisation || selectedReport.student.company_name || 'Not Specified'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Weekly Report Metadata Card */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Calendar className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Logbook Week Information
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 font-medium block">Week Number:</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  Week {selectedReport.week_number}
                </p>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Date Range:</span>
                <p className="font-medium text-slate-700 dark:text-slate-300 mt-0.5">
                  {formatDate(selectedReport.start_date)} – {formatDate(selectedReport.end_date)}
                </p>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Submitted Date:</span>
                <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                  {formatDateTime(selectedReport.submitted_at)}
                </p>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Reviewed Date:</span>
                <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                  {formatDateTime(selectedReport.reviewed_at)}
                </p>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 font-medium block">Reviewer Identity:</span>
                <p className="text-slate-700 dark:text-slate-300 mt-0.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{selectedReport.reviewer?.full_name || 'Dr. Elizabeth Nnamani (Institutional Coordinator)'}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Daily Activities Section (All 5 Days: Monday through Friday) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Five-Day Daily Activity Log (Monday – Friday)
              </h3>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Read-only inspection</span>
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {activities.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  No daily activity entries recorded for this week.
                </p>
              </div>
            ) : (
              activities.map((act) => (
                <div
                  key={act.id}
                  className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden"
                >
                  {/* Day Header */}
                  <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-1 rounded-md bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold uppercase tracking-wider">
                        {act.day_of_week}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {formatDate(act.date)}
                      </span>
                    </div>

                    {act.title && act.activity ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <Check className="w-3.5 h-3.5" />
                        <span>Logged</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Incomplete</span>
                      </span>
                    )}
                  </div>

                  {/* Day Content */}
                  <div className="p-4 space-y-3">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Task / Topic Title
                      </span>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-0.5">
                        {act.title || <em className="text-slate-400 font-normal">No title provided</em>}
                      </h4>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Detailed Description of Work Carried Out
                      </span>
                      <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-1 leading-relaxed whitespace-pre-line bg-slate-50/50 dark:bg-slate-800/30 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                        {act.activity || <em className="text-slate-400 font-normal">No activity description provided</em>}
                      </div>
                    </div>

                    {act.tools_used && (
                      <div className="pt-1 flex items-start gap-2">
                        <Wrench className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                        <div className="text-xs">
                          <span className="font-semibold text-slate-500">Tools / Equipment: </span>
                          <span className="text-slate-700 dark:text-slate-300 font-mono">{act.tools_used}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 4. Existing Review Information Banner (Requirement 15) */}
        {(selectedReport.admin_remark || selectedReport.admin_feedback || isApproved || isReturned) && (
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Recorded Administrative Review &amp; Remarks
                </h4>
              </div>
              <span className="text-xs text-slate-500">
                {selectedReport.reviewed_at ? `Evaluated ${formatDateTime(selectedReport.reviewed_at)}` : 'Review on file'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block font-medium">Administrative Remark:</span>
                <p className="font-bold text-amber-600 dark:text-amber-400 text-sm mt-1">
                  {selectedReport.admin_remark || selectedReport.reviewer_remarks || 'None'}
                </p>
              </div>

              <div className="sm:col-span-2 p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block font-medium">Constructive Feedback:</span>
                <p className="text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-line leading-relaxed">
                  {selectedReport.admin_feedback || 'No supplementary comments on record.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 5. Review Panel (Requirement 5, 6, 7, 8) */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-amber-200 dark:border-amber-900/60 shadow-lg space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  Administrative Review Panel
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isSubmitted
                    ? 'Evaluate the student’s weekly technical documentation and issue an approval or return for corrections.'
                    : isApproved
                    ? 'This weekly report has been formally endorsed. It is in an immutable state.'
                    : isReturned
                    ? 'This report has been returned to the student for corrections. Awaiting student revision.'
                    : 'This report is in draft mode and has not yet been submitted by the student.'}
                </p>
              </div>
            </div>

            {isSubmitted ? (
              <Badge variant="warning" size="sm">Action Required</Badge>
            ) : isApproved ? (
              <Badge variant="success" size="sm">Endorsed &amp; Locked</Badge>
            ) : (
              <Badge variant="neutral" size="sm">Read-Only</Badge>
            )}
          </div>

          {/* If Submitted: Interactive Review Form */}
          {isSubmitted ? (
            <div className="space-y-5">
              {/* Administrative Remark Presets */}
              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                  Administrative Remark <span className="text-rose-500">*</span>
                </label>
                <p className="text-xs text-slate-500">
                  Select a standard SIWES assessment rating or enter custom remarks:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {ADMIN_REMARK_OPTIONS.map((preset) => {
                    const isSelected = !isCustomRemarkMode && adminRemark === preset;
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setAdminRemark(preset);
                          setIsCustomRemarkMode(false);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                        }`}
                      >
                        {preset}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setIsCustomRemarkMode(true)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      isCustomRemarkMode
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                    }`}
                  >
                    Custom Remark...
                  </button>
                </div>

                {isCustomRemarkMode && (
                  <input
                    type="text"
                    value={customRemark}
                    onChange={(e) => setCustomRemark(e.target.value)}
                    placeholder="Enter custom administrative remark (e.g. Highly Commendable, Incomplete Logs)..."
                    className="w-full mt-2 px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                )}
              </div>

              {/* Constructive Admin Feedback */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                    Constructive Feedback &amp; Supervisor Observations
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {adminFeedback.trim().length} characters (Mandatory if returning)
                  </span>
                </div>
                <textarea
                  value={adminFeedback}
                  onChange={(e) => setAdminFeedback(e.target.value)}
                  rows={4}
                  placeholder="Provide detailed observations, suggestions for improvement, areas needing clarification, or constructive commendations..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed"
                />
                <p className="text-[11px] text-slate-400">
                  Note: If returning the report, explain specifically which daily activities or entries require revision so the student can rectify them.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(true)}
                  disabled={isSubmittingAction || !adminFeedback.trim() || adminFeedback.trim().length < 5}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  title={
                    adminFeedback.trim().length < 5
                      ? 'Please provide feedback explaining what to correct before returning.'
                      : 'Return report to student for corrections'
                  }
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Return for Correction</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsApproveModalOpen(true)}
                  disabled={isSubmittingAction || (isCustomRemarkMode ? !customRemark.trim() : !adminRemark.trim())}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve Weekly Report</span>
                </button>
              </div>
            </div>
          ) : (
            /* Non-submitted: Status Banner */
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm">
              {isApproved ? (
                <div className="flex items-start gap-3 text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold">Weekly Report Approved &amp; Endorsed</h5>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                      This logbook week has been verified by the institutional supervisor. The student has read-only access and cannot make further modifications.
                    </p>
                  </div>
                </div>
              ) : isReturned ? (
                <div className="flex items-start gap-3 text-amber-800 dark:text-amber-300">
                  <RotateCcw className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold">Returned to Student for Correction</h5>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                      The student has been unlocked to edit their 5-day daily activities based on your feedback. Once they resubmit, this report will reappear at the top of your review queue.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                  <Clock className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold">Student Draft Week</h5>
                    <p className="text-xs text-slate-500 mt-1">
                      This report has not yet been submitted by the student. Administrative approval and return actions are restricted to submitted reports only.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 6. Approve Confirmation Modal */}
        {isApproveModalOpen && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
            role="dialog"
            aria-modal="true"
          >
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Approve Weekly Report?
                  </h3>
                  <p className="text-xs text-slate-500">
                    Week {selectedReport.week_number} • {selectedReport.student.full_name}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs space-y-2 border border-slate-200 dark:border-slate-700">
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Are you sure you want to approve this weekly report? <strong>The student will no longer be able to edit it.</strong>
                </p>
                <div className="pt-1">
                  <span className="font-semibold text-slate-500">Selected Remark: </span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {isCustomRemarkMode ? customRemark : adminRemark}
                  </span>
                </div>
                {adminFeedback.trim() && (
                  <div>
                    <span className="font-semibold text-slate-500">Feedback: </span>
                    <span className="text-slate-700 dark:text-slate-300 italic">"{adminFeedback.trim()}"</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsApproveModalOpen(false)}
                  disabled={isSubmittingAction}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmApproval}
                  disabled={isSubmittingAction}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmittingAction && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Approval</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 7. Return Confirmation Modal */}
        {isReturnModalOpen && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
            role="dialog"
            aria-modal="true"
          >
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Return Report for Correction?
                  </h3>
                  <p className="text-xs text-slate-500">
                    Week {selectedReport.week_number} • {selectedReport.student.full_name}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs space-y-2 border border-slate-200 dark:border-slate-700">
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Return this report to the student for correction? The student will be allowed to modify their 5-day daily activities and resubmit.
                </p>
                <div className="pt-1">
                  <span className="font-semibold text-slate-500">Feedback for Student: </span>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 mt-1 italic border border-slate-200 dark:border-slate-800 whitespace-pre-line">
                    "{adminFeedback.trim()}"
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  disabled={isSubmittingAction}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReturn}
                  disabled={isSubmittingAction}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmittingAction && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Return</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW: REPORTS QUEUE (List / Management View)
  // =========================================================================
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Weekly Reports Review Queue"
        subtitle="Review student weekly logbook submissions, examine daily technical records, enter administrative remarks, and issue approvals or returns."
        icon={FileText}
        badge={<Badge variant="warning">Module 09 Verified</Badge>}
        breadcrumbs={[
          { label: 'Admin Portal' },
          { label: 'Reports Queue' }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setRefreshTrigger((prev) => prev + 1)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              title="Refresh queue"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        }
      />

      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs sm:text-sm animate-in fade-in duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Stats Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => setFilterStatus('submitted')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            filterStatus === 'submitted'
              ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 ring-2 ring-amber-500'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
              Awaiting Review
            </span>
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {stats.submitted}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Submitted student reports
          </p>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('approved')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            filterStatus === 'approved'
              ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 ring-2 ring-emerald-500'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              Approved
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {stats.approved}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Verified &amp; graded
          </p>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('returned')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            filterStatus === 'returned'
              ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 ring-2 ring-rose-500'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">
              Returned
            </span>
            <RotateCcw className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {stats.returned}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Awaiting student revision
          </p>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('all')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            filterStatus === 'all'
              ? 'bg-sky-50/80 dark:bg-sky-950/30 border-sky-300 dark:border-sky-800 ring-2 ring-sky-500'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-sky-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Total Reports
            </span>
            <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {stats.total}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Across active cohort
          </p>
        </button>
      </div>

      {/* Main Filter & Search Card */}
      <Card>
        {/* Status Tab Navigation */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setFilterStatus('submitted')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                filterStatus === 'submitted'
                  ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>Awaiting Review</span>
              <span className="px-1.5 py-0.2 rounded-full bg-amber-200 dark:bg-amber-800 text-[10px] font-bold">
                {stats.submitted}
              </span>
            </button>

            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                filterStatus === 'all'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>All Reports</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] font-bold">
                {stats.total}
              </span>
            </button>

            <button
              onClick={() => setFilterStatus('approved')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                filterStatus === 'approved'
                  ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>Approved</span>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-200 dark:bg-emerald-800 text-[10px] font-bold">
                {stats.approved}
              </span>
            </button>

            <button
              onClick={() => setFilterStatus('returned')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                filterStatus === 'returned'
                  ? 'bg-rose-100 text-rose-900 dark:bg-rose-900/60 dark:text-rose-200 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>Returned</span>
              <span className="px-1.5 py-0.2 rounded-full bg-rose-200 dark:bg-rose-800 text-[10px] font-bold">
                {stats.returned}
              </span>
            </button>

            <button
              onClick={() => setFilterStatus('draft')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                filterStatus === 'draft'
                  ? 'bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>Drafts</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-300 dark:bg-slate-600 text-[10px] font-bold">
                {stats.draft}
              </span>
            </button>
          </div>

          <div className="text-xs text-slate-500">
            Showing <strong>{reports.length}</strong> reports
          </div>
        </div>

        {/* Filter Bar: Search, Student Dropdown, Week Dropdown */}
        <div className="p-4 bg-slate-50/50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student, matric, or week..."
              className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Student Filter Dropdown */}
          <div className="relative">
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="all">All Students Cohort</option>
              {uniqueStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.matric})
                </option>
              ))}
            </select>
          </div>

          {/* Week Number Filter Dropdown */}
          <div className="relative">
            <select
              value={selectedWeekNumber}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedWeekNumber(val === 'all' ? 'all' : parseInt(val, 10));
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="all">All Weeks (1 – 24)</option>
              {Array.from({ length: 24 }, (_, i) => i + 1).map((w) => (
                <option key={w} value={w}>
                  Week {w}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Reports Table / Card List */}
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Loading weekly reports queue...
            </p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">{error}</p>
            <button
              onClick={() => setRefreshTrigger((prev) => prev + 1)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No weekly reports found
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {filterStatus === 'submitted'
                ? 'All submitted weekly reports have been evaluated. Check the Approved or Returned tabs.'
                : 'No reports matched your current filter criteria. Try resetting filters or search query.'}
            </p>
            {(searchQuery || selectedStudentId !== 'all' || selectedWeekNumber !== 'all' || filterStatus !== 'all') && (
              <button
                onClick={() => {
                  setFilterStatus('all');
                  setSearchQuery('');
                  setSelectedStudentId('all');
                  setSelectedWeekNumber('all');
                }}
                className="mt-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 text-white hover:bg-amber-700 cursor-pointer"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Week &amp; Period</th>
                  <th className="py-3 px-4">Submission Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Review Info</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {reports.map((report) => {
                  const isPending = report.status === 'submitted';
                  return (
                    <tr
                      key={report.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                        isPending ? 'bg-amber-50/20 dark:bg-amber-950/10' : ''
                      }`}
                    >
                      {/* Student Info */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900 dark:text-white">
                            {report.student.full_name}
                          </p>
                          <p className="font-mono text-xs text-slate-500">
                            {report.student.matric_number || report.student.matric_no}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
                            {report.student.organisation || report.student.company_name || report.student.department}
                          </p>
                        </div>
                      </td>

                      {/* Week & Period */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs">
                            Week {report.week_number}
                          </span>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            {formatDate(report.start_date)} – {formatDate(report.end_date)}
                          </p>
                        </div>
                      </td>

                      {/* Submission Date */}
                      <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400 font-medium">
                        {report.submitted_at ? (
                          formatDateTime(report.submitted_at)
                        ) : (
                          <span className="text-slate-400 italic">Not submitted</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {getStatusBadge(report.status)}
                      </td>

                      {/* Review Info */}
                      <td className="py-3.5 px-4 text-xs">
                        {report.reviewed_at ? (
                          <div className="space-y-0.5">
                            <span className="font-bold text-amber-600 dark:text-amber-400">
                              {report.admin_remark || report.reviewer_remarks || 'Reviewed'}
                            </span>
                            <p className="text-[11px] text-slate-500">
                              {formatDate(report.reviewed_at)}
                            </p>
                          </div>
                        ) : isPending ? (
                          <span className="text-amber-600 dark:text-amber-400 font-semibold text-[11px]">
                            Pending Coordinator
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedReportId(report.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            isPending
                              ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs font-bold'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{isPending ? 'Review Report' : 'Open Report'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
