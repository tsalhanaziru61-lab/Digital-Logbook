/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Shield,
  GraduationCap,
  Building2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Terminal,
  Lock,
  Unlock,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { RoleRoute } from './RoleRoute';

export const RoleGuardDemo: React.FC = () => {
  const { isAuthenticated, role, profile, loginAsDemo, logout, isDemoSession } = useAuth();
  const [testTarget, setTestTarget] = useState<'student-only' | 'admin-only'>('admin-only');

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Overview Card */}
      <Card>
        <CardHeader
          title="Role-Based Access Control (RBAC) Verification"
          subtitle="Module 03 live test bench for route and permission guards"
          icon={<Shield className="w-5 h-5 text-emerald-600" />}
          action={
            <Badge variant={isAuthenticated ? 'success' : 'warning'} size="sm">
              {isAuthenticated ? `Authenticated (${role?.toUpperCase()})` : 'Unauthenticated'}
            </Badge>
          }
        />

        <div className="space-y-4 text-xs sm:text-sm">
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            The SIWES system strictly enforces two isolated authorization tiers. Test how <code>RoleRoute</code> and <code>ProtectedRoute</code> prevent unauthorized access:
          </p>

          {/* Current State Diagnostic Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <span className="text-slate-400 block text-[10px] uppercase">Auth Status</span>
              <span className={`font-bold ${isAuthenticated ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {isAuthenticated ? 'AUTHENTICATED' : 'ANONYMOUS'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <span className="text-slate-400 block text-[10px] uppercase">Active Role</span>
              <span className="font-bold text-slate-900 dark:text-white uppercase">
                {role || 'None'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <span className="text-slate-400 block text-[10px] uppercase">Session Source</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {isDemoSession ? 'Local Sandbox (Demo)' : isAuthenticated ? 'Supabase Auth' : 'None'}
              </span>
            </div>
          </div>

          {/* Quick Identity Switcher for Testing */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mr-2">
              Switch Test Identity:
            </span>
            <button
              onClick={() => loginAsDemo('student')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                role === 'student'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Simulate Student</span>
            </button>

            <button
              onClick={() => loginAsDemo('admin')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                role === 'admin'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Simulate Administrator</span>
            </button>

            {isAuthenticated && (
              <button
                onClick={() => logout()}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/60 transition-colors cursor-pointer ml-auto"
              >
                Sign Out (Test Unauthenticated)
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Target Route Selector */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Simulated Destination Route:
        </span>
        <button
          onClick={() => setTestTarget('student-only')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
            testTarget === 'student-only'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>/portal/student (Student Only)</span>
        </button>

        <button
          onClick={() => setTestTarget('admin-only')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
            testTarget === 'admin-only'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>/portal/admin (Admin Only)</span>
        </button>
      </div>

      {/* Live Guard Execution Container */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-600" />
            <span className="font-mono">Route Guard Evaluation Output</span>
          </div>
          <span className="font-mono text-[11px]">
            Target: {testTarget === 'admin-only' ? 'allowedRoles=["admin"]' : 'allowedRoles=["student"]'}
          </span>
        </div>

        {testTarget === 'admin-only' ? (
          <RoleRoute
            allowedRoles={['admin']}
            onNavigateHome={() => setTestTarget('student-only')}
          >
            <div className="p-6 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 space-y-3">
              <div className="flex items-center gap-2 text-sky-800 dark:text-sky-300 font-bold">
                <CheckCircle2 className="w-5 h-5 text-sky-600" />
                <span>ACCESS PERMITTED — Administrator Clearance Verified</span>
              </div>
              <p className="text-xs text-sky-700 dark:text-sky-400 leading-relaxed">
                The current user session holds the <strong>admin</strong> role. Protected coordinator controls and confidential student cohort records are accessible.
              </p>
            </div>
          </RoleRoute>
        ) : (
          <RoleRoute
            allowedRoles={['student']}
            onNavigateHome={() => setTestTarget('admin-only')}
          >
            <div className="p-6 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>ACCESS PERMITTED — Student Clearance Verified</span>
              </div>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
                The current user session holds the <strong>student</strong> role. Student personal logbook entries and weekly submission draft tools are accessible.
              </p>
            </div>
          </RoleRoute>
        )}
      </div>
    </div>
  );
};
