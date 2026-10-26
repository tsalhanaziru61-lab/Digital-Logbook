/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserProfile } from './auth';

/**
 * Fields that a student is explicitly permitted to update.
 * Privileged fields (id, role, email, matric_number, institution, department)
 * are strictly immutable for students and controlled by administrators.
 */
export interface StudentProfileEditableInput {
  full_name?: string;
  phone_number?: string | null;
  organisation?: string | null;
  company_name?: string | null;
  siwes_start_date?: string | null;
  siwes_end_date?: string | null;
  supervisor_name?: string | null;
  supervisor_phone?: string | null;
  supervisor_email?: string | null;
}

/**
 * Structured form state for the Student Profile Management page.
 */
export interface StudentProfileFormState {
  full_name: string;
  phone_number: string;
  organisation: string;
  siwes_start_date: string;
  siwes_end_date: string;
  supervisor_name: string;
  supervisor_phone: string;
  supervisor_email: string;
}

/**
 * Field-level validation error messages.
 */
export type StudentProfileFormErrors = Partial<Record<keyof StudentProfileFormState, string>>;

/**
 * Calculation of SIWES placement duration and calendar progress.
 */
export interface PlacementProgress {
  totalWeeks: number;
  completedWeeks: number;
  remainingWeeks: number;
  percentComplete: number;
  status: 'not_started' | 'active' | 'completed' | 'not_set';
  formattedDuration: string;
}

/**
 * Payload submitted by an administrator to provision a new student account.
 * Module 08 — Admin Student Management.
 */
export interface StudentAccountCreationInput {
  full_name: string;
  email: string;
  password?: string;
  matric_number: string;
  institution: string;
  department: string;
  organisation: string;
  phone_number?: string;
  siwes_start_date?: string;
  siwes_end_date?: string;
  supervisor_name?: string;
  supervisor_phone?: string;
  supervisor_email?: string;
}

/**
 * Student logbook progression metrics aggregated from logbook_weeks.
 */
export interface StudentLogbookStats {
  totalWeeks: number;
  draftWeeks: number;
  submittedWeeks: number;
  approvedWeeks: number;
  returnedWeeks: number;
  lastActiveDate?: string | null;
}

/**
 * Enriched student profile including aggregated logbook statistics.
 */
export interface StudentWithLogbookStats extends UserProfile {
  logbookStats?: StudentLogbookStats;
}

/**
 * Query filter parameters for searching and filtering students.
 */
export interface AdminStudentQueryFilters {
  search?: string;
  department?: string;
  institution?: string;
  status?: 'all' | 'active' | 'inactive';
  page?: number;
  pageSize?: number;
}

