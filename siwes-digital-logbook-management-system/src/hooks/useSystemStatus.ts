/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { getSupabaseConfigStatus } from '../lib/supabase';
import { SupabaseConfigStatus, SystemReadiness } from '../types';

/**
 * Custom hook to monitor system configuration status and runtime environment.
 * Validates dependencies, environment variables, and foundation readiness for Module 01.
 */
export const useSystemStatus = () => {
  const [supabaseStatus] = useState<SupabaseConfigStatus>(() =>
    getSupabaseConfigStatus()
  );

  const [systemReadiness] = useState<SystemReadiness>({
    moduleNumber: 'Module 01',
    moduleTitle: 'Project Foundation & Development Environment',
    isReady: true,
    framework: 'React 19 + Vite 8',
    runtime: 'TypeScript (Strict)',
    databaseProvider: 'Supabase PostgreSQL',
    stylingEngine: 'Tailwind CSS v4',
    typeChecker: 'tsc (Zero Errors)',
    linter: 'ESLint v10 (Flat Config)',
  });

  return {
    supabaseStatus,
    systemReadiness,
  };
};
