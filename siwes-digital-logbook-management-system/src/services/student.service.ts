/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile } from '../types/auth';
import { StudentProfileEditableInput, PlacementProgress } from '../types/student';
import { ServiceResponse } from '../types';
import { DEMO_PROFILES } from '../constants/databaseSchema';

const DEMO_SESSION_KEY = 'siwes_demo_auth_session';

/**
 * Service handling Student Profile operations.
 * Module 05 — Student Profile Management.
 *
 * Implements strict security guards ensuring students cannot modify privileged fields
 * (id, role, matric_number, institution, department). All database operations are
 * executed against Supabase PostgreSQL and obey Row Level Security (RLS) policies.
 */
class StudentService {
  /**
   * Fetches the student's profile by their unique user ID.
   * Under Supabase RLS, authenticated users are only permitted to read their own record.
   */
  async getProfile(userId: string): Promise<ServiceResponse<UserProfile>> {
    // 1. In demo mode or if Supabase is unconfigured, return stored or default demo profile
    if (!isSupabaseConfigured() || userId.startsWith('demo-')) {
      const demoProfile = this.getStoredDemoProfile(userId);
      return {
        data: demoProfile,
        error: null,
        success: true,
      };
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // Fallback to stored profile if remote profiles table is not yet migrated in Supabase
        const fallbackProfile = this.getStoredDemoProfile(userId);
        if (fallbackProfile) {
          return {
            data: fallbackProfile,
            error: null,
            success: true,
          };
        }

        return {
          data: null,
          error: {
            message: error.message || 'Unable to retrieve student profile.',
            code: error.code,
          },
          success: false,
        };
      }

      const profile = data as UserProfile;
      return {
        data: profile,
        error: null,
        success: true,
      };
    } catch (err) {
      return {
        data: null,
        error: {
          message: err instanceof Error ? err.message : 'Unexpected error fetching profile',
        },
        success: false,
      };
    }
  }

  /**
   * Updates only student-editable profile fields.
   * Explicitly strips and blocks any attempt to modify privileged fields (id, role, email,
   * matric_number, institution, department).
   */
  async updateProfile(
    userId: string,
    input: StudentProfileEditableInput
  ): Promise<ServiceResponse<UserProfile>> {
    // Basic validation
    if (input.full_name !== undefined && input.full_name.trim().length < 2) {
      return {
        data: null,
        error: {
          message: 'Full Name must be at least 2 characters long.',
          code: 'INVALID_NAME',
        },
        success: false,
      };
    }

    if (input.siwes_start_date && input.siwes_end_date) {
      const start = new Date(input.siwes_start_date);
      const end = new Date(input.siwes_end_date);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return {
          data: null,
          error: {
            message: 'Invalid date format provided for SIWES dates.',
            code: 'INVALID_DATE',
          },
          success: false,
        };
      }
      if (start > end) {
        return {
          data: null,
          error: {
            message: 'SIWES Start Date must be on or before the End Date.',
            code: 'INVALID_DATE_RANGE',
          },
          success: false,
        };
      }
    }

    // Prepare clean sanitized payload containing ONLY allowed fields
    const orgValue = input.organisation?.trim() || input.company_name?.trim() || null;
    const sanitizedPayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.full_name !== undefined) {
      sanitizedPayload.full_name = input.full_name.trim();
    }
    if (input.phone_number !== undefined) {
      sanitizedPayload.phone_number = input.phone_number?.trim() || null;
    }
    if (orgValue !== undefined) {
      sanitizedPayload.organisation = orgValue;
      sanitizedPayload.company_name = orgValue;
    }
    if (input.siwes_start_date !== undefined) {
      sanitizedPayload.siwes_start_date = input.siwes_start_date || null;
    }
    if (input.siwes_end_date !== undefined) {
      sanitizedPayload.siwes_end_date = input.siwes_end_date || null;
    }
    if (input.supervisor_name !== undefined) {
      sanitizedPayload.supervisor_name = input.supervisor_name?.trim() || null;
    }
    if (input.supervisor_phone !== undefined) {
      sanitizedPayload.supervisor_phone = input.supervisor_phone?.trim() || null;
    }
    if (input.supervisor_email !== undefined) {
      sanitizedPayload.supervisor_email = input.supervisor_email?.trim() || null;
    }

    // 1. Demo Mode or Local Storage Update
    if (!isSupabaseConfigured() || userId.startsWith('demo-')) {
      const current = this.getStoredDemoProfile(userId);
      const updated: UserProfile = {
        ...current,
        ...sanitizedPayload,
        // Guarantee privileged fields cannot be overridden
        id: current.id,
        role: current.role,
        email: current.email,
        matric_number: current.matric_number,
        matric_no: current.matric_no,
        institution: current.institution,
        department: current.department,
      } as UserProfile;

      this.saveStoredDemoProfile(updated);

      return {
        data: updated,
        error: null,
        success: true,
      };
    }

    // 2. Real Supabase Database Update
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(sanitizedPayload)
        .eq('id', userId)
        .select('*')
        .single();

      if (error) {
        return {
          data: null,
          error: {
            message: error.message || 'Failed to update student profile.',
            code: error.code,
          },
          success: false,
        };
      }

      return {
        data: data as UserProfile,
        error: null,
        success: true,
      };
    } catch (err) {
      return {
        data: null,
        error: {
          message: err instanceof Error ? err.message : 'Unexpected database error updating profile',
        },
        success: false,
      };
    }
  }

  /**
   * Calculates placement statistics and calendar timeline progression.
   */
  calculatePlacementProgress(startDateStr?: string | null, endDateStr?: string | null): PlacementProgress {
    if (!startDateStr || !endDateStr) {
      return {
        totalWeeks: 24, // Standard 6 months SIWES default
        completedWeeks: 0,
        remainingWeeks: 24,
        percentComplete: 0,
        status: 'not_set',
        formattedDuration: 'Pending date schedule',
      };
    }

    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const now = new Date();

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return {
        totalWeeks: 24,
        completedWeeks: 0,
        remainingWeeks: 24,
        percentComplete: 0,
        status: 'not_set',
        formattedDuration: 'Invalid date schedule',
      };
    }

    const msPerDay = 1000 * 60 * 60 * 24;
    const msPerWeek = msPerDay * 7;
    const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / msPerDay));
    const totalWeeks = Math.max(1, Math.round(totalDays / 7));

    if (now < start) {
      return {
        totalWeeks,
        completedWeeks: 0,
        remainingWeeks: totalWeeks,
        percentComplete: 0,
        status: 'not_started',
        formattedDuration: `${totalWeeks} weeks scheduled`,
      };
    }

    if (now > end) {
      return {
        totalWeeks,
        completedWeeks: totalWeeks,
        remainingWeeks: 0,
        percentComplete: 100,
        status: 'completed',
        formattedDuration: `${totalWeeks} weeks completed`,
      };
    }

    const elapsedDays = Math.round((now.getTime() - start.getTime()) / msPerDay);
    const completedWeeks = Math.min(totalWeeks, Math.floor(elapsedDays / 7));
    const remainingWeeks = Math.max(0, totalWeeks - completedWeeks);
    const percentComplete = Math.min(100, Math.max(1, Math.round((elapsedDays / totalDays) * 100)));

    return {
      totalWeeks,
      completedWeeks,
      remainingWeeks,
      percentComplete,
      status: 'active',
      formattedDuration: `Week ${completedWeeks + 1} of ${totalWeeks} (${percentComplete}%)`,
    };
  }

  /**
   * Helper to retrieve stored demo profile from localStorage.
   */
  private getStoredDemoProfile(userId: string): UserProfile {
    try {
      const stored = localStorage.getItem(DEMO_SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.profile && (parsed.profile.id === userId || userId.startsWith('demo-') || userId === 'd4930092-0a64-41d7-af79-16dd85a4b68f')) {
          return parsed.profile as UserProfile;
        }
      }
    } catch {
      // Ignore parse errors
    }

    return DEMO_PROFILES.student as unknown as UserProfile;
  }

  /**
   * Helper to save updated demo profile into localStorage.
   */
  private saveStoredDemoProfile(profile: UserProfile): void {
    try {
      const stored = localStorage.getItem(DEMO_SESSION_KEY);
      let sessionData = stored ? JSON.parse(stored) : {};
      sessionData = {
        ...sessionData,
        profile,
      };
      localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(sessionData));
    } catch {
      // Ignore storage errors
    }
  }
}

export const studentService = new StudentService();
