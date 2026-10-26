/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Loader2, Lock, UserX, AlertTriangle, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback,
}) => {
  const { isAuthenticated, isLoading, profileStatus, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Checking authentication...
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Verifying Supabase authentication state and application profile...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800/60">
          <Lock className="w-7 h-7" />
        </div>
        <div className="space-y-1.5 max-w-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Authentication Required
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            You must be logged in to view this section of the SIWES Digital Logbook.
          </p>
        </div>
      </div>
    );
  }

  // Section 16: Safe missing profile handling
  if (profileStatus === 'missing') {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800/60">
          <UserX className="w-7 h-7" />
        </div>
        <div className="space-y-2 max-w-md">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Application Profile Missing
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Your Supabase Auth account is verified, but no matching institutional profile record exists in the <code>profiles</code> table. Privileged access has been securely denied.
          </p>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300">
            Please contact your institutional SIWES coordinator to initialize your student or administrator profile record.
          </div>
          <button
            onClick={() => logout()}
            className="mt-4 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold flex items-center gap-1.5 mx-auto cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    );
  }

  // Section 17: Safe invalid role handling
  if (profileStatus === 'invalid_role') {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center border border-red-200 dark:border-red-800/60">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <div className="space-y-2 max-w-md">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Invalid Authorization Role
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Your account profile contains an unsupported or unrecognized role. Supported roles are strictly <code>student</code> or <code>admin</code>.
          </p>
          <button
            onClick={() => logout()}
            className="mt-4 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-1.5 mx-auto cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
