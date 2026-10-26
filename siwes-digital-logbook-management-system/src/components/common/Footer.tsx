/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { APP_FULL_NAME } from '../../constants';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-xs text-slate-500 dark:text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-medium text-slate-700 dark:text-slate-300">
            {APP_FULL_NAME}
          </p>
          <p className="mt-0.5">
            Module 01: Project Foundation & Development Environment
          </p>
        </div>
        <div className="flex items-center gap-4 text-slate-400 dark:text-slate-500">
          <span>React 19</span>
          <span>•</span>
          <span>TypeScript 5</span>
          <span>•</span>
          <span>Tailwind CSS</span>
          <span>•</span>
          <span>Supabase</span>
          <span>•</span>
          <span>© {currentYear}</span>
        </div>
      </div>
    </footer>
  );
};
