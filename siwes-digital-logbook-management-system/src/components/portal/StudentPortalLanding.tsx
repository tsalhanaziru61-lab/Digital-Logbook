/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  GraduationCap,
  Calendar,
  BookOpen,
  FileCheck,
  Building,
  User,
  Shield,
  ArrowRight,
  Sparkles,
  Lock,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { SIWES_CONFIG } from '../../constants';

interface StudentPortalLandingProps {
  onTestAdminGuard?: () => void;
}

export const StudentPortalLanding: React.FC<StudentPortalLandingProps> = ({
  onTestAdminGuard,
}) => {
  const { profile } = useAuth();
  const [selectedMockWeek, setSelectedMockWeek] = useState(1);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="success" size="sm" className="bg-emerald-500/20 text-emerald-200 border-emerald-500/40">
              <GraduationCap className="w-3.5 h-3.5 mr-1" />
              Authenticated Student Session
            </Badge>
            <span className="text-xs text-emerald-300">
              Session Persistent across refreshes
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {profile?.full_name || 'Student'}!
          </h2>

          <p className="text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
            Your SIWES digital logbook profile is active. Daily activity logs are grouped into {SIWES_CONFIG.DAYS_PER_WEEK}-day working cycles (Monday to Friday) for weekly coordinator endorsement.
          </p>

          <div className="pt-2 flex flex-wrap gap-4 text-xs font-mono">
            <div className="bg-black/25 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/10">
              Matric No: <span className="font-bold text-emerald-300">{profile?.matric_number || 'CSC/2021/1042'}</span>
            </div>
            <div className="bg-black/25 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/10">
              Department: <span className="font-bold text-emerald-300">{profile?.department || 'Computer Science'}</span>
            </div>
            <div className="bg-black/25 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/10">
              Duration: <span className="font-bold text-emerald-300">{SIWES_CONFIG.DEFAULT_ATTACHMENT_WEEKS} Weeks (6 Months)</span>
            </div>
          </div>
        </div>

        {/* Decorative blur */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-80 h-80 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
      </div>

      {/* Grid: Student Profile Card & Upcoming Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Student Attachment Credentials */}
        <Card className="lg:col-span-1">
          <CardHeader
            title="Attachment Details"
            subtitle="Extracted from Supabase profiles"
            icon={<User className="w-5 h-5 text-emerald-600" />}
          />
          <dl className="space-y-3.5 text-xs sm:text-sm">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <dt className="text-slate-500">Student Name</dt>
              <dd className="font-semibold text-slate-900 dark:text-white">{profile?.full_name}</dd>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <dt className="text-slate-500">Institutional Email</dt>
              <dd className="font-mono text-xs text-slate-800 dark:text-slate-300 truncate max-w-[170px]">{profile?.email}</dd>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <dt className="text-slate-500">Matriculation No</dt>
              <dd className="font-semibold font-mono text-emerald-600 dark:text-emerald-400">{profile?.matric_number || 'CSC/2021/1042'}</dd>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <dt className="text-slate-500">Department</dt>
              <dd className="font-medium text-slate-900 dark:text-white">{profile?.department || 'Computer Science'}</dd>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <dt className="text-slate-500">Institution</dt>
              <dd className="font-medium text-slate-900 dark:text-white">{profile?.institution || 'Federal University of Technology'}</dd>
            </div>
            <div className="flex justify-between py-1.5">
              <dt className="text-slate-500">Account Role</dt>
              <dd>
                <Badge variant="success" size="sm">
                  {profile?.role.toUpperCase()}
                </Badge>
              </dd>
            </div>
          </dl>
        </Card>

        {/* Right Column: Next Modules for Student Experience */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader
              title="Student Portal Modules in Progression"
              subtitle="Milestones to be implemented in upcoming modules"
              icon={<BookOpen className="w-5 h-5 text-emerald-600" />}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-emerald-600" />
                    <span>Module 05: Profile &amp; Placement</span>
                  </span>
                  <Badge variant="purple" size="sm">Upcoming</Badge>
                </div>
                <p className="text-slate-500 text-xs">
                  Industry placement records, company address, and industry-based supervisor details.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>Module 06: Student Dashboard</span>
                  </span>
                  <Badge variant="purple" size="sm">Upcoming</Badge>
                </div>
                <p className="text-slate-500 text-xs">
                  Overview metrics, active week progress, submission statuses, and supervisor remarks notifications.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    <span>Module 07: Daily Logbook</span>
                  </span>
                  <Badge variant="purple" size="sm">Upcoming</Badge>
                </div>
                <p className="text-slate-500 text-xs">
                  Daily activity editor (Mon-Fri) with auto-saving drafts and visual work attachments.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    <span>Module 08: Weekly Submission</span>
                  </span>
                  <Badge variant="purple" size="sm">Upcoming</Badge>
                </div>
                <p className="text-slate-500 text-xs">
                  5-day weekly report aggregation and submission workflow for coordinator verification.
                </p>
              </div>
            </div>
          </Card>

          {/* Interactive Role Security Test */}
          {onTestAdminGuard && (
            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-800/80 bg-amber-50/60 dark:bg-amber-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="font-semibold text-amber-900 dark:text-amber-200 text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-600" />
                  <span>Verify Role-Based Access Control (RBAC)</span>
                </h4>
                <p className="text-xs text-amber-800 dark:text-amber-300/90 leading-relaxed">
                  Test that your current <strong>Student</strong> account is correctly rejected when attempting to access the Admin Coordinator portal.
                </p>
              </div>
              <button
                onClick={onTestAdminGuard}
                className="shrink-0 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Test Admin Route Guard</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
