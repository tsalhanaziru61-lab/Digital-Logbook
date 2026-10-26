/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ModuleMilestone } from '../types';

/**
 * Application Core Constants
 */
export const APP_NAME = 'SIWES Digital Logbook';
export const APP_FULL_NAME = 'SIWES Digital Logbook Management System';
export const APP_ACRONYM = 'SIWES-DLMS';
export const APP_TAGLINE = 'Digitally replacing physical student industrial work experience logbooks';
export const APP_VERSION = '1.0.0-production';

/**
 * Institutional and SIWES standard domain constants.
 * SIWES (Students Industrial Work Experience Scheme) logbooks standardly operate
 * on 5 working days per week (Monday through Friday).
 */
export const SIWES_CONFIG = {
  DAYS_PER_WEEK: 5,
  WORKING_DAYS: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const,
  DEFAULT_ATTACHMENT_WEEKS: 24, // Standard 6-month SIWES attachment period
  MIN_HOURS_PER_DAY: 6,
  MAX_HOURS_PER_DAY: 10,
} as const;

/**
 * User Roles
 */
export const USER_ROLES = {
  STUDENT: 'student',
  ADMIN: 'admin',
} as const;

/**
 * System Local Storage keys for persistent client preferences.
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'siwes_auth_token',
  THEME: 'siwes_ui_theme',
  DRAFT_LOG_PREFIX: 'siwes_draft_log_',
} as const;

/**
 * Project Implementation Roadmap across all 12 modules.
 * This establishes clear visibility of progress and architectural readiness.
 */
export const MODULE_ROADMAP: ModuleMilestone[] = [
  {
    id: 1,
    code: 'MODULE 01',
    title: 'Project Foundation & Environment',
    description: 'Vite, React, TypeScript strict mode, Tailwind CSS, Supabase client foundation, and ESLint configuration.',
    status: 'completed',
    category: 'Foundation',
  },
  {
    id: 2,
    code: 'MODULE 02',
    title: 'Supabase Database Architecture',
    description: 'PostgreSQL relational schemas, foreign keys, constraints, profiles table, and Row Level Security (RLS) policies.',
    status: 'completed',
    category: 'Backend & Auth',
  },
  {
    id: 3,
    code: 'MODULE 03',
    title: 'Authentication & Role-Based Access',
    description: 'Supabase Auth login, session persistence, profiles integration, and RBAC routing (Student vs Admin).',
    status: 'completed',
    category: 'Backend & Auth',
  },
  {
    id: 4,
    code: 'MODULE 04',
    title: 'Application Layout & Navigation',
    description: 'Responsive shell, sidebar navigation, top bar, user status, and role-aware navigation menus.',
    status: 'completed',
    category: 'Student Experience',
  },
  {
    id: 5,
    code: 'MODULE 05',
    title: 'Student Profile Management',
    description: 'Institutional details, matriculation number, department, industry placement location, and supervisor name.',
    status: 'completed',
    category: 'Student Experience',
  },
  {
    id: 6,
    code: 'MODULE 06',
    title: 'Student Daily Activity & Weekly Logbook',
    description: 'Complete 5-day Monday to Friday activity records, save drafts, status tracking, and submission locking.',
    status: 'completed',
    category: 'Student Experience',
  },
  {
    id: 7,
    code: 'MODULE 07',
    title: 'Student Dashboard & Logbook Progress',
    description: 'Welcome banner, live database summary counters, active week completion progress, recent activities, and quick actions.',
    status: 'completed',
    category: 'Student Experience',
  },
  {
    id: 8,
    code: 'MODULE 08',
    title: 'Admin Student Management',
    description: 'Administrator student directory, secure account provisioning, profile editing, status toggling, search, and department filtering.',
    status: 'completed',
    category: 'Admin Experience',
  },
  {
    id: 9,
    code: 'MODULE 09',
    title: 'Admin Weekly Report Review & Remarks',
    description: 'Weekly reports review queue, 5-day daily activity inspection, administrative remark selection, constructive feedback, and approval/return-for-correction workflows.',
    status: 'completed',
    category: 'Admin Experience',
  },
  {
    id: 10,
    code: 'MODULE 10',
    title: 'Admin Dashboard & SIWES Overview',
    description: 'Operational overview, real-time metrics, student counts, report statuses, urgent review queue, and institution-wide statistics.',
    status: 'completed',
    category: 'Admin Experience',
  },
  {
    id: 11,
    code: 'MODULE 11',
    title: 'Notifications & Review Feedback',
    description: 'Internal database-driven notification feeds, student report approval/return notices, coordinator resubmission alerts, and transactional review synchronization.',
    status: 'completed',
    category: 'Student Experience',
  },
  {
    id: 12,
    code: 'MODULE 12',
    title: 'Finalization, Security Audit & Deployment Preparation',
    description: 'Complete codebase audit, zero dead code, production build verification, strict RLS validation, environment documentation, and Vercel/Supabase deployment configuration.',
    status: 'completed',
    category: 'Production Readiness',
  },
];
