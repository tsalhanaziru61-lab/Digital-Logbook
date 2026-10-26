/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Building2,
  Users,
  ClipboardList,
  MessageSquare,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  Lock,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface AdminPortalLandingProps {
  onTestStudentGuard?: () => void;
}

export const AdminPortalLanding: React.FC<AdminPortalLandingProps> = ({
  onTestStudentGuard,
}) => {
  const { profile } = useAuth();

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-sky-900 via-indigo-900 to-slate-900 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info" size="sm" className="bg-sky-500/20 text-sky-200 border-sky-500/40">
              <Building2 className="w-3.5 h-3.5 mr-1" />
              Authenticated Administrator Session
            </Badge>
            <span className="text-xs text-sky-300">
              Institutional Supervisor Privileges
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Institutional Coordinator Portal
          </h2>

          <p className="text-sm text-sky-100/90 max-w-2xl leading-relaxed">
            Welcome, <strong>{profile?.full_name || 'Coordinator'}</strong>. As an authorized institutional administrator, you manage student cohort enrollments, audit weekly 5-day logbook submissions, and deliver formal supervisor remarks.
          </p>

          <div className="pt-2 flex flex-wrap gap-4 text-xs font-mono">
            <div className="bg-black/25 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/10">
              Department: <span className="font-bold text-sky-300">{profile?.department || 'Directorate of Industrial Training & SIWES'}</span>
            </div>
            <div className="bg-black/25 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/10">
              Institution: <span className="font-bold text-sky-300">{profile?.institution || 'Federal University of Technology'}</span>
            </div>
            <div className="bg-black/25 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/10">
              Registration Mode: <span className="font-bold text-emerald-400">Admin Managed (No Public Signup)</span>
            </div>
          </div>
        </div>

        {/* Decorative blur */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-80 h-80 rounded-full bg-sky-400/10 blur-3xl pointer-events-none" />
      </div>

      {/* Grid: Administrator Privileges & Upcoming Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Admin Identity Details */}
        <Card className="lg:col-span-1">
          <CardHeader
            title="Administrator Credentials"
            subtitle="Verified coordinator profile"
            icon={<ShieldCheck className="w-5 h-5 text-sky-600" />}
          />
          <dl className="space-y-3.5 text-xs sm:text-sm">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <dt className="text-slate-500">Coordinator Name</dt>
              <dd className="font-semibold text-slate-900 dark:text-white">{profile?.full_name}</dd>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <dt className="text-slate-500">Email Address</dt>
              <dd className="font-mono text-xs text-slate-800 dark:text-slate-300 truncate max-w-[170px]">{profile?.email}</dd>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <dt className="text-slate-500">Department</dt>
              <dd className="font-medium text-slate-900 dark:text-white">{profile?.department || 'Directorate of Industrial Training'}</dd>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <dt className="text-slate-500">Assigned Role</dt>
              <dd>
                <Badge variant="info" size="sm">
                  ADMINISTRATOR
                </Badge>
              </dd>
            </div>
            <div className="flex justify-between py-1.5">
              <dt className="text-slate-500">Authorization Scope</dt>
              <dd className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                Full Institutional Audit
              </dd>
            </div>
          </dl>
        </Card>

        {/* Right Column: Upcoming Admin Modules */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader
              title="Admin Portal Modules in Progression"
              subtitle="Milestones to be implemented in upcoming modules"
              icon={<ClipboardList className="w-5 h-5 text-sky-600" />}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-sky-600" />
                    <span>Module 09: Admin Dashboard</span>
                  </span>
                  <Badge variant="purple" size="sm">Upcoming</Badge>
                </div>
                <p className="text-slate-500 text-xs">
                  Cohort metrics, submission completion rates, pending reviews count, and departmental rosters.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-sky-600" />
                    <span>Module 10: Student Accounts (CRUD)</span>
                  </span>
                  <Badge variant="purple" size="sm">Upcoming</Badge>
                </div>
                <p className="text-slate-500 text-xs">
                  Direct student account provisioning, matriculation number validation, and placement assignment.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ClipboardList className="w-4 h-4 text-sky-600" />
                    <span>Module 11: Admin Report Review</span>
                  </span>
                  <Badge variant="purple" size="sm">Upcoming</Badge>
                </div>
                <p className="text-slate-500 text-xs">
                  Detailed day-by-day activity auditing, work diagram inspection, and week verification workflows.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-sky-600" />
                    <span>Module 12: Remarks &amp; Feedback</span>
                  </span>
                  <Badge variant="purple" size="sm">Upcoming</Badge>
                </div>
                <p className="text-slate-500 text-xs">
                  Supervisor comments, grading &amp; scoring, revision requests, and historical remark tracking.
                </p>
              </div>
            </div>
          </Card>

          {/* Interactive Role Security Test */}
          {onTestStudentGuard && (
            <div className="p-4 rounded-xl border border-sky-200 dark:border-sky-800/80 bg-sky-50/60 dark:bg-sky-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="font-semibold text-sky-900 dark:text-sky-200 text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-sky-600" />
                  <span>Verify Role Isolation (RBAC)</span>
                </h4>
                <p className="text-xs text-sky-800 dark:text-sky-300/90 leading-relaxed">
                  Verify how the system isolates roles by testing a student-only view from your current <strong>Administrator</strong> session.
                </p>
              </div>
              <button
                onClick={onTestStudentGuard}
                className="shrink-0 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Test Student Route Guard</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
