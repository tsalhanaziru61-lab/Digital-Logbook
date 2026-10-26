/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen, ShieldCheck } from 'lucide-react';
import { APP_NAME, APP_TAGLINE } from '../constants';

export interface AuthLayoutProps {
  children: React.ReactNode;
  subtitle?: string;
  badge?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  subtitle = 'Digital Logbook Management System',
  badge = 'Institutional Portal'
}) => {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md">
          <BookOpen className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          {APP_NAME}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          {subtitle}
        </p>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] font-medium text-emerald-800 dark:text-emerald-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>{badge}</span>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        {children}
      </div>

      <footer className="mt-12 text-center text-xs text-slate-400 dark:text-slate-500">
        <p>© {new Date().getFullYear()} {APP_TAGLINE}</p>
      </footer>
    </div>
  );
};
