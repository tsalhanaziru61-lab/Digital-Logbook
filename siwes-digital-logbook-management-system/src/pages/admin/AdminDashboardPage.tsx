/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  CheckCircle2,
  AlertCircle,
  Building2,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { PageHeader } from '../../components/navigation/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';
import { reportReviewService } from '../../services/reportReviewService';
import { adminService } from '../../services/admin.service';
import { ReviewStatsSummary } from '../../types/logbook';

interface AdminDashboardPageProps {
  onNavigateToStudents?: () => void;
  onNavigateToReports?: () => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  onNavigateToStudents,
  onNavigateToReports
}) => {
  const { profile } = useAuth();
  const [stats, setStats] = useState<ReviewStatsSummary>({
    total: 0,
    submitted: 0,
    approved: 0,
    returned: 0,
    draft: 0,
  });
  const [enrolledStudentsCount, setEnrolledStudentsCount] = useState<number>(6);

  useEffect(() => {
    let isMounted = true;
    const fetchDashboardStats = async () => {
      try {
        const [reviewStats, studentsRes] = await Promise.all([
          reportReviewService.getReviewStats(),
          adminService.getStudents(),
        ]);

        if (isMounted) {
          setStats(reviewStats);
          if (studentsRes.success && studentsRes.data) {
            setEnrolledStudentsCount(studentsRes.data.totalCount);
          }
        }
      } catch {
        // Fallback gracefully
      }
    };

    void fetchDashboardStats();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="SIWES Coordinator Dashboard"
        subtitle="Institutional overview of student industrial training cohorts, weekly log submissions, and verification queues."
        icon={LayoutDashboard}
        badge={<Badge variant="info">Coordinator Oversight</Badge>}
        breadcrumbs={[
          { label: 'Admin Portal' },
          { label: 'Dashboard' }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateToReports}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Review Reports ({stats.submitted})</span>
            </button>
            <button
              onClick={onNavigateToStudents}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>Students Directory ({enrolledStudentsCount})</span>
            </button>
          </div>
        }
      />

      {/* Coordinator KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Enrolled Students</span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{enrolledStudentsCount}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Active industrial trainees
          </p>
        </div>

        <div
          onClick={onNavigateToReports}
          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer hover:border-amber-400 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400 font-semibold">
              Pending Review
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.submitted}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Weekly reports awaiting endorsement
          </p>
        </div>

        <div
          onClick={onNavigateToReports}
          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer hover:border-emerald-400 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 font-semibold">
              Endorsed Reports
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{stats.approved}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Graded &amp; approved this session
          </p>
        </div>

        <div
          onClick={onNavigateToReports}
          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer hover:border-rose-400 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-600 dark:text-rose-400 font-semibold">
              Returned for Revision
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{stats.returned}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Awaiting student corrections
          </p>
        </div>
      </div>


      {/* Module 04 Architecture Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Admin Portal Layout Shell (Module 04)"
              subtitle="Role-aware administration architecture"
              icon={<ShieldCheck className="w-5 h-5 text-sky-600" />}
            />
            <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sky-900 dark:text-sky-200">
                    Admin Navigation &amp; Layout Active
                  </h4>
                  <p className="text-sky-800 dark:text-sky-300 text-xs mt-1 leading-relaxed">
                    The administrator layout provides dedicated navigation paths for <strong>Dashboard</strong>, <strong>Students</strong>, <strong>Reports</strong>, <strong>Profile</strong>, and <strong>Logout</strong>, with isolated access boundaries enforced by Supabase Row Level Security and role guards.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Upcoming Module 08</span>
                  <p className="font-semibold text-slate-900 dark:text-white">Admin Student Provisioning</p>
                  <p className="text-xs text-slate-500">Secure administrator creation of student accounts without public self-registration.</p>
                </div>

                <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Upcoming Module 09/10</span>
                  <p className="font-semibold text-slate-900 dark:text-white">Report Review &amp; Grading</p>
                  <p className="text-xs text-slate-500">Supervisory feedback, grading rubric, and digital signature sign-offs.</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader
              title="Coordinator Details"
              subtitle="Active admin credentials"
              icon={<Building2 className="w-5 h-5 text-sky-600" />}
            />
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 space-y-1">
                <span className="text-[11px] text-slate-400 uppercase font-mono">Coordinator</span>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {profile?.full_name || 'Dr. O. Babatunde'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 space-y-1">
                <span className="text-[11px] text-slate-400 uppercase font-mono">Department / Unit</span>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {profile?.department || 'SIWES Directorate / Computer Science'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 space-y-1">
                <span className="text-[11px] text-slate-400 uppercase font-mono">Institutional Role</span>
                <p className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  Institutional SIWES Supervisor
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
