/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Supported user roles in the SIWES Digital Logbook Management System.
 * - `student`: Undergraduate student undergoing industrial attachment. Records daily logs, submits weekly reports.
 * - `admin`: Institutional supervisor / SIWES coordinator. Reviews weekly submissions, enters remarks and grades.
 */
export * from './auth';
export * from './student';
export * from './logbook';
export * from './notification';

/**
 * Represents the configuration and connectivity status of the Supabase integration.
 */
export interface SupabaseConfigStatus {
  isConfigured: boolean;
  hasUrl: boolean;
  hasAnonKey: boolean;
  message: string;
}

/**
 * System diagnostic and foundation readiness state for Module 01.
 */
export interface SystemReadiness {
  moduleNumber: string;
  moduleTitle: string;
  isReady: boolean;
  framework: string;
  runtime: string;
  databaseProvider: string;
  stylingEngine: string;
  typeChecker: string;
  linter: string;
}

/**
 * Standard structured API result interface for upcoming service layers (Module 02+).
 */
export interface ServiceResponse<T = unknown> {
  data: T | null;
  error: {
    message: string;
    details?: string;
    code?: string;
  } | null;
  success: boolean;
}

/**
 * Module metadata for tracking architectural milestones.
 */
export interface ModuleMilestone {
  id: number;
  code: string;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'upcoming';
  category: 'Foundation' | 'Backend & Auth' | 'Student Experience' | 'Admin Experience' | 'Production Readiness';
}
