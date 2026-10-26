/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldAlert, ArrowLeft, LogOut, ArrowRight } from 'lucide-react';
import { UserRole } from '../../types/auth';
import { useAuth } from '../../hooks/useAuth';

interface AccessDeniedProps {
  requiredRole?: UserRole | UserRole[];
  onNavigateHome?: () => void;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  requiredRole,
  onNavigateHome,
}) => {
  const { role, profile, logout, loginAsDemo } = useAuth();

  const formattedRequired = Array.isArray(requiredRole)
    ? requiredRole.join(' or ')
    : requiredRole || 'different role';

  return (
    <div className="min-h-[450px] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900/60 p-6 sm:p-8 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center border border-red-200 dark:border-red-800">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">
            HTTP 403 — Forbidden
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Access Restricted
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            This section is restricted to accounts with the{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-200 uppercase">
              {formattedRequired}
            </span>{' '}
            role.
          </p>
        </div>

        {/* Current Identity Box */}
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700/60 text-xs text-left space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Signed in as:</span>
            <span className="font-medium text-slate-900 dark:text-slate-200 truncate max-w-[200px]">
              {profile?.full_name || profile?.email || 'Active User'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Current Assigned Role:</span>
            <span className="font-mono font-bold uppercase text-amber-600 dark:text-amber-400">
              {role || 'Unknown'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Permitted Portal</span>
            </button>
          )}

          {/* Quick Demo Switch helper if reviewing */}
          <button
            onClick={() => {
              const target = role === 'student' ? 'admin' : 'student';
              loginAsDemo(target);
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <span>Switch Role to {role === 'student' ? 'Administrator' : 'Student'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => logout()}
            className="w-full py-2 px-4 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
