/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  LogbookWeek,
  DailyActivity,
  DayOfWeek,
  DAYS_OF_WEEK,
  SaveWeeklyActivitiesInput,
  WeekValidationResult,
} from '../types/logbook';
import { ServiceResponse } from '../types';
import { INITIAL_DEMO_WEEKS } from '../constants/databaseSchema';
import { notificationService } from './notificationService';

const DEMO_WEEKS_STORAGE_PREFIX = 'siwes_demo_weeks_';
const DEFAULT_FALLBACK_START_DATE = '2026-03-02'; // A Monday

/**
 * Service managing Student Weekly Logbook and Daily Activity operations.
 * Module 06 — Student Daily Activity & Weekly Logbook.
 *
 * Implements:
 * 1. Safe retrieval and creation of SIWES weeks and 5 working days (Mon-Fri).
 * 2. Editing restrictions based on status:
 *    - Editable only when status is 'draft' or 'returned'.
 *    - Strictly locked / read-only when status is 'submitted' or 'approved'.
 * 3. Validation before submission ensuring all 5 days are populated.
 * 4. Dual operation: connects to Supabase PostgreSQL with RLS, or local storage demo fallback.
 */
class LogbookService {
  /**
   * Calculate dates for Monday through Friday of a specific week number
   * based on the student's SIWES start date.
   */
  calculateWeekDates(
    weekNumber: number,
    siwesStartDateStr?: string | null
  ): {
    startDate: string; // Monday
    endDate: string;   // Friday
    dayDates: Record<DayOfWeek, string>;
  } {
    const rawStart = siwesStartDateStr ? new Date(siwesStartDateStr) : new Date(DEFAULT_FALLBACK_START_DATE);
    const validStart = isNaN(rawStart.getTime()) ? new Date(DEFAULT_FALLBACK_START_DATE) : rawStart;

    // Align to the Monday of the starting week
    // getDay(): 0 is Sunday, 1 is Monday, ..., 6 is Saturday
    const dayOfWeek = validStart.getDay();
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const baseMonday = new Date(validStart);
    baseMonday.setDate(validStart.getDate() + distanceToMonday);

    // Target Monday = baseMonday + (weekNumber - 1) * 7 days
    const targetMonday = new Date(baseMonday);
    targetMonday.setDate(baseMonday.getDate() + (weekNumber - 1) * 7);

    const formatDate = (d: Date): string => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const mon = new Date(targetMonday);
    const tue = new Date(targetMonday);
    tue.setDate(mon.getDate() + 1);
    const wed = new Date(targetMonday);
    wed.setDate(mon.getDate() + 2);
    const thu = new Date(targetMonday);
    thu.setDate(mon.getDate() + 3);
    const fri = new Date(targetMonday);
    fri.setDate(mon.getDate() + 4);

    return {
      startDate: formatDate(mon),
      endDate: formatDate(fri),
      dayDates: {
        Monday: formatDate(mon),
        Tuesday: formatDate(tue),
        Wednesday: formatDate(wed),
        Thursday: formatDate(thu),
        Friday: formatDate(fri),
      },
    };
  }

  /**
   * Retrieves all weeks for a student.
   */
  async getWeeksForStudent(
    studentId: string,
    siwesStartDateStr?: string | null,
    totalWeeksExpected: number = 24
  ): Promise<ServiceResponse<LogbookWeek[]>> {
    // 1. In demo mode or if Supabase is unconfigured, return demo / stored weeks
    if (!isSupabaseConfigured() || studentId.startsWith('demo-')) {
      const weeks = this.getStoredDemoWeeks(studentId, siwesStartDateStr, totalWeeksExpected);
      return {
        data: weeks,
        error: null,
        success: true,
      };
    }

    try {
      const { data, error } = await supabase
        .from('logbook_weeks')
        .select(`
          *,
          daily_activities(*)
        `)
        .eq('student_id', studentId)
        .order('week_number', { ascending: true });

      if (error) {
        // Fallback to stored weeks if remote logbook_weeks table is not yet migrated in Supabase
        const weeks = this.getStoredDemoWeeks(studentId, siwesStartDateStr, totalWeeksExpected);
        return {
          data: weeks,
          error: null,
          success: true,
        };
      }

      const weeks = (data as LogbookWeek[]) || [];
      return {
        data: weeks,
        error: null,
        success: true,
      };
    } catch (err) {
      return {
        data: null,
        error: {
          message: err instanceof Error ? err.message : 'Unexpected error loading logbook weeks.',
        },
        success: false,
      };
    }
  }

  /**
   * Retrieves or initializes a specific week for a student, ensuring all 5 days exist.
   */
  async getOrCreateWeek(
    studentId: string,
    weekNumber: number,
    siwesStartDateStr?: string | null
  ): Promise<ServiceResponse<LogbookWeek>> {
    const { startDate, endDate, dayDates } = this.calculateWeekDates(weekNumber, siwesStartDateStr);

    // 1. Demo Mode or Local Storage
    if (!isSupabaseConfigured() || studentId.startsWith('demo-')) {
      const storedWeeks = this.getStoredDemoWeeks(studentId, siwesStartDateStr, 24);
      let week = storedWeeks.find((w) => w.week_number === weekNumber);

      if (!week) {
        // Initialize as new draft week
        const newWeekId = `demo-week-${studentId}-${weekNumber}-${Date.now()}`;
        const newActivities: DailyActivity[] = DAYS_OF_WEEK.map((day, idx) => ({
          id: `demo-act-${newWeekId}-${idx + 1}`,
          week_id: newWeekId,
          student_id: studentId,
          day_of_week: day,
          date: dayDates[day],
          title: '',
          activity: '',
          tools_used: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        week = {
          id: newWeekId,
          student_id: studentId,
          week_number: weekNumber,
          start_date: startDate,
          end_date: endDate,
          status: 'draft',
          submitted_at: null,
          reviewed_at: null,
          reviewer_id: null,
          reviewer_remarks: null,
          supervisor_grade: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          daily_activities: newActivities,
        };

        storedWeeks.push(week);
        this.saveStoredDemoWeeks(studentId, storedWeeks);
      } else {
        // Ensure all 5 days exist in this week
        const existingDays = new Set((week.daily_activities || []).map((a) => a.day_of_week));
        const missingDays = DAYS_OF_WEEK.filter((d) => !existingDays.has(d));

        if (missingDays.length > 0) {
          const filledActivities: DailyActivity[] = [
            ...(week.daily_activities || []),
            ...missingDays.map((day, idx) => ({
              id: `demo-act-${week!.id}-${Date.now()}-${idx}`,
              week_id: week!.id,
              student_id: studentId,
              day_of_week: day,
              date: dayDates[day],
              title: '',
              activity: '',
              tools_used: '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })),
          ];

          // Sort Mon-Fri
          filledActivities.sort(
            (a, b) => DAYS_OF_WEEK.indexOf(a.day_of_week) - DAYS_OF_WEEK.indexOf(b.day_of_week)
          );

          week.daily_activities = filledActivities;
          this.saveStoredDemoWeeks(studentId, storedWeeks);
        }
      }

      return {
        data: week,
        error: null,
        success: true,
      };
    }

    // 2. Real Supabase Database Operation
    try {
      // Check if week exists
      const { data: existingWeek, error: fetchErr } = await supabase
        .from('logbook_weeks')
        .select(`
          *,
          daily_activities(*)
        `)
        .eq('student_id', studentId)
        .eq('week_number', weekNumber)
        .maybeSingle();

      if (fetchErr) {
        // Fallback to stored weeks if remote logbook_weeks table is not yet migrated in Supabase
        const storedWeeks = this.getStoredDemoWeeks(studentId, siwesStartDateStr, 24);
        const week = storedWeeks.find((w) => w.week_number === weekNumber);
        if (week) {
          return {
            data: week,
            error: null,
            success: true,
          };
        }

        return {
          data: null,
          error: {
            message: fetchErr.message || 'Error querying weekly logbook.',
            code: fetchErr.code,
          },
          success: false,
        };
      }

      if (existingWeek) {
        const week = existingWeek as LogbookWeek;
        const currentActivities = week.daily_activities || [];
        const existingDayNames = new Set(currentActivities.map((a) => a.day_of_week));
        const missing = DAYS_OF_WEEK.filter((d) => !existingDayNames.has(d));

        if (missing.length > 0) {
          // Insert missing daily records
          const toInsert = missing.map((d) => ({
            week_id: week.id,
            student_id: studentId,
            day_of_week: d,
            date: dayDates[d],
            title: '',
            activity: '',
            tools_used: '',
          }));

          await supabase.from('daily_activities').insert(toInsert);

          // Re-fetch
          const { data: refreshed } = await supabase
            .from('logbook_weeks')
            .select(`
              *,
              daily_activities(*)
            `)
            .eq('id', week.id)
            .single();

          return {
            data: refreshed as LogbookWeek,
            error: null,
            success: true,
          };
        }

        // Sort activities Monday to Friday
        currentActivities.sort(
          (a, b) => DAYS_OF_WEEK.indexOf(a.day_of_week) - DAYS_OF_WEEK.indexOf(b.day_of_week)
        );
        week.daily_activities = currentActivities;

        return {
          data: week,
          error: null,
          success: true,
        };
      }

      // If week doesn't exist, create it as a draft
      const { data: createdWeek, error: createWeekErr } = await supabase
        .from('logbook_weeks')
        .insert({
          student_id: studentId,
          week_number: weekNumber,
          start_date: startDate,
          end_date: endDate,
          status: 'draft',
        })
        .select('*')
        .single();

      if (createWeekErr) {
        return {
          data: null,
          error: {
            message: createWeekErr.message || 'Failed to initialize week logbook.',
            code: createWeekErr.code,
          },
          success: false,
        };
      }

      // Initialize all 5 weekdays
      const activitiesToInsert = DAYS_OF_WEEK.map((day) => ({
        week_id: createdWeek.id,
        student_id: studentId,
        day_of_week: day,
        date: dayDates[day],
        title: '',
        activity: '',
        tools_used: '',
      }));

      const { data: createdActivities } = await supabase
        .from('daily_activities')
        .insert(activitiesToInsert)
        .select('*');

      const fullWeek: LogbookWeek = {
        ...(createdWeek as LogbookWeek),
        daily_activities: (createdActivities as DailyActivity[]) || [],
      };

      return {
        data: fullWeek,
        error: null,
        success: true,
      };
    } catch (err) {
      return {
        data: null,
        error: {
          message: err instanceof Error ? err.message : 'Unexpected database error opening week.',
        },
        success: false,
      };
    }
  }

  /**
   * Saves daily activity entries as a draft.
   * Enforces security: only allows edits if week is 'draft' or 'returned'.
   */
  async saveActivitiesDraft(
    input: SaveWeeklyActivitiesInput
  ): Promise<ServiceResponse<LogbookWeek>> {
    const { week_id, student_id, week_number, activities } = input;

    // 1. In demo mode or local storage
    if (!isSupabaseConfigured() || student_id.startsWith('demo-')) {
      const storedWeeks = this.getStoredDemoWeeks(student_id);
      const weekIndex = storedWeeks.findIndex((w) => w.id === week_id || w.week_number === week_number);

      if (weekIndex === -1) {
        return {
          data: null,
          error: { message: 'Logbook week not found.', code: 'WEEK_NOT_FOUND' },
          success: false,
        };
      }

      const week = storedWeeks[weekIndex];

      // Security check: Must be draft or returned
      if (week.status !== 'draft' && week.status !== 'returned') {
        return {
          data: null,
          error: {
            message: `Cannot edit this week because its current status is '${week.status}'. Edits are strictly allowed on draft or returned weeks only.`,
            code: 'WEEK_LOCKED',
          },
          success: false,
        };
      }

      // Update daily activities
      const updatedActivities: DailyActivity[] = activities.map((act) => {
        const existing = (week.daily_activities || []).find((a) => a.day_of_week === act.day_of_week);
        return {
          id: existing?.id || `demo-act-${week.id}-${act.day_of_week}`,
          week_id: week.id,
          student_id,
          day_of_week: act.day_of_week,
          date: act.date,
          title: act.title,
          activity: act.activity,
          tools_used: act.tools_used || null,
          created_at: existing?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      });

      week.daily_activities = updatedActivities;
      week.updated_at = new Date().toISOString();
      storedWeeks[weekIndex] = week;
      this.saveStoredDemoWeeks(student_id, storedWeeks);

      return {
        data: week,
        error: null,
        success: true,
      };
    }

    // 2. Real Supabase Database Operation
    try {
      // Verify week status and ownership
      const { data: weekData, error: weekErr } = await supabase
        .from('logbook_weeks')
        .select('*')
        .eq('id', week_id)
        .eq('student_id', student_id)
        .single();

      if (weekErr || !weekData) {
        return {
          data: null,
          error: { message: 'Logbook week not found or access denied.', code: 'FORBIDDEN' },
          success: false,
        };
      }

      if (weekData.status !== 'draft' && weekData.status !== 'returned') {
        return {
          data: null,
          error: {
            message: `Edits rejected. This logbook week is '${weekData.status}' and is currently locked from student edits.`,
            code: 'WEEK_LOCKED',
          },
          success: false,
        };
      }

      // Upsert daily activities
      for (const act of activities) {
        await supabase
          .from('daily_activities')
          .upsert(
            {
              week_id,
              student_id,
              day_of_week: act.day_of_week,
              date: act.date,
              title: act.title.trim(),
              activity: act.activity.trim(),
              tools_used: act.tools_used?.trim() || null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'week_id,day_of_week' }
          );
      }

      // Touch week updated_at
      await supabase
        .from('logbook_weeks')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', week_id);

      // Re-fetch updated full record
      const { data: refreshed, error: refErr } = await supabase
        .from('logbook_weeks')
        .select(`
          *,
          daily_activities(*)
        `)
        .eq('id', week_id)
        .single();

      if (refErr) {
        return {
          data: null,
          error: { message: refErr.message },
          success: false,
        };
      }

      return {
        data: refreshed as LogbookWeek,
        error: null,
        success: true,
      };
    } catch (err) {
      return {
        data: null,
        error: {
          message: err instanceof Error ? err.message : 'Error saving draft activities.',
        },
        success: false,
      };
    }
  }

  /**
   * Validates if all 5 working days have adequate content for submission.
   */
  validateWeekForSubmission(activities: Array<{ day_of_week: DayOfWeek; title: string; activity: string }>): WeekValidationResult {
    const missingDays: DayOfWeek[] = [];
    const missingFieldErrors: Record<DayOfWeek, { title?: string; activity?: string }> = {
      Monday: {},
      Tuesday: {},
      Wednesday: {},
      Thursday: {},
      Friday: {},
    };

    const actMap = new Map(activities.map((a) => [a.day_of_week, a]));

    for (const day of DAYS_OF_WEEK) {
      const entry = actMap.get(day);
      if (!entry) {
        missingDays.push(day);
        missingFieldErrors[day] = {
          title: `${day} title is required.`,
          activity: `${day} work description is required.`,
        };
        continue;
      }

      const hasTitle = Boolean(entry.title && entry.title.trim().length >= 3);
      const hasActivity = Boolean(entry.activity && entry.activity.trim().length >= 10);

      if (!hasTitle || !hasActivity) {
        missingDays.push(day);
        missingFieldErrors[day] = {
          title: !hasTitle ? 'Title must be at least 3 characters long.' : undefined,
          activity: !hasActivity ? 'Work description must be at least 10 characters long.' : undefined,
        };
      }
    }

    return {
      isValidForSubmission: missingDays.length === 0,
      missingDays,
      missingFieldErrors,
    };
  }

  /**
   * Submits a completed 5-day week to the administrator / coordinator.
   * Locks the week by switching status to 'submitted'.
   */
  async submitWeek(weekId: string, studentId: string): Promise<ServiceResponse<LogbookWeek>> {
    // 1. In demo mode or local storage
    if (!isSupabaseConfigured() || studentId.startsWith('demo-')) {
      const storedWeeks = this.getStoredDemoWeeks(studentId);
      const weekIndex = storedWeeks.findIndex((w) => w.id === weekId);

      if (weekIndex === -1) {
        return {
          data: null,
          error: { message: 'Week not found.', code: 'WEEK_NOT_FOUND' },
          success: false,
        };
      }

      const week = storedWeeks[weekIndex];

      if (week.status !== 'draft' && week.status !== 'returned') {
        return {
          data: null,
          error: {
            message: `Week cannot be submitted because it is already '${week.status}'.`,
            code: 'INVALID_STATUS',
          },
          success: false,
        };
      }

      const validation = this.validateWeekForSubmission(week.daily_activities || []);
      if (!validation.isValidForSubmission) {
        return {
          data: null,
          error: {
            message: `Cannot submit week. All 5 working days (Monday–Friday) must be completed. Incomplete days: ${validation.missingDays.join(', ')}.`,
            code: 'INCOMPLETE_WEEK',
          },
          success: false,
        };
      }

      const wasReturned = week.status === 'returned';

      week.status = 'submitted';
      week.submitted_at = new Date().toISOString();
      week.updated_at = new Date().toISOString();

      // If resubmitting after return, clear current review fields so old review does not appear as current
      if (wasReturned) {
        week.reviewed_at = null;
        week.reviewed_by = null;
        week.reviewer_id = null;
        week.reviewer_remarks = null;
        week.admin_remark = null;
        week.supervisor_grade = null;
      }

      storedWeeks[weekIndex] = week;
      this.saveStoredDemoWeeks(studentId, storedWeeks);

      // Dispatch notification to administrator (Module 11)
      await notificationService.createNotification({
        recipient_id: 'demo-admin-uuid-002',
        title: wasReturned ? 'Weekly Report Resubmitted' : 'New Weekly Report Submitted',
        message: wasReturned
          ? `A student has resubmitted their Week ${week.week_number} report for review.`
          : `A student has submitted Week ${week.week_number} report for review.`,
        type: wasReturned ? 'report_resubmitted' : 'report_submitted',
        related_id: week.id,
        week_number: week.week_number,
        action_url: '/admin/reports',
      });

      return {
        data: week,
        error: null,
        success: true,
      };
    }

    // 2. Real Supabase Database Operation
    try {
      const { data: weekData, error: fetchErr } = await supabase
        .from('logbook_weeks')
        .select(`
          *,
          daily_activities(*)
        `)
        .eq('id', weekId)
        .eq('student_id', studentId)
        .single();

      if (fetchErr || !weekData) {
        return {
          data: null,
          error: { message: 'Logbook week not found or access denied.' },
          success: false,
        };
      }

      if (weekData.status !== 'draft' && weekData.status !== 'returned') {
        return {
          data: null,
          error: {
            message: `This week is already '${weekData.status}' and cannot be submitted again.`,
            code: 'INVALID_STATUS',
          },
          success: false,
        };
      }

      const activities = (weekData.daily_activities as DailyActivity[]) || [];
      const validation = this.validateWeekForSubmission(activities);
      if (!validation.isValidForSubmission) {
        return {
          data: null,
          error: {
            message: `All 5 working days (Monday–Friday) must be logged before submitting. Incomplete days: ${validation.missingDays.join(', ')}.`,
            code: 'INCOMPLETE_WEEK',
          },
          success: false,
        };
      }

      const wasReturned = weekData.status === 'returned';

      const updatePayload: Record<string, unknown> = {
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (wasReturned) {
        updatePayload.reviewed_at = null;
        updatePayload.reviewed_by = null;
        updatePayload.reviewer_id = null;
        updatePayload.admin_remark = null;
        updatePayload.reviewer_remarks = null;
        updatePayload.supervisor_grade = null;
      }

      const { data: updated, error: updateErr } = await supabase
        .from('logbook_weeks')
        .update(updatePayload)
        .eq('id', weekId)
        .select(`
          *,
          daily_activities(*)
        `)
        .single();

      if (updateErr) {
        return {
          data: null,
          error: { message: updateErr.message || 'Failed to submit weekly report.' },
          success: false,
        };
      }

      // Dispatch notification to administrator (Module 11)
      await notificationService.createNotification({
        recipient_id: 'demo-admin-uuid-002',
        title: wasReturned ? 'Weekly Report Resubmitted' : 'New Weekly Report Submitted',
        message: wasReturned
          ? `A student has resubmitted their Week ${weekData.week_number} report for review.`
          : `A student has submitted Week ${weekData.week_number} report for review.`,
        type: wasReturned ? 'report_resubmitted' : 'report_submitted',
        related_id: weekId,
        week_number: weekData.week_number,
        action_url: '/admin/reports',
      });

      return {
        data: updated as LogbookWeek,
        error: null,
        success: true,
      };
    } catch (err) {
      return {
        data: null,
        error: {
          message: err instanceof Error ? err.message : 'Unexpected error submitting week.',
        },
        success: false,
      };
    }
  }

  /**
   * Helper: Retrieve stored demo weeks from localStorage or initialize with seed.
   */
  private getStoredDemoWeeks(
    studentId: string,
    siwesStartDateStr?: string | null,
    totalWeeksExpected: number = 24
  ): LogbookWeek[] {
    const key = `${DEMO_WEEKS_STORAGE_PREFIX}${studentId}`;
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed as LogbookWeek[];
        }
      }
    } catch {
      // Ignore parse errors
    }

    // Default to INITIAL_DEMO_WEEKS deep clone
    const seededWeeks: LogbookWeek[] = JSON.parse(JSON.stringify(INITIAL_DEMO_WEEKS));

    // Ensure all 24 weeks exist as available placeholders
    const existingWeekNumbers = new Set(seededWeeks.map((w) => w.week_number));
    for (let w = 1; w <= totalWeeksExpected; w++) {
      if (!existingWeekNumbers.has(w)) {
        const { startDate, endDate, dayDates } = this.calculateWeekDates(w, siwesStartDateStr);
        const weekId = `demo-week-std-${w}`;
        const activities: DailyActivity[] = DAYS_OF_WEEK.map((day, idx) => ({
          id: `demo-act-${weekId}-${idx + 1}`,
          week_id: weekId,
          student_id: studentId,
          day_of_week: day,
          date: dayDates[day],
          title: '',
          activity: '',
          tools_used: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        seededWeeks.push({
          id: weekId,
          student_id: studentId,
          week_number: w,
          start_date: startDate,
          end_date: endDate,
          status: 'draft',
          submitted_at: null,
          reviewed_at: null,
          reviewer_id: null,
          reviewer_remarks: null,
          supervisor_grade: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          daily_activities: activities,
        });
      }
    }

    seededWeeks.sort((a, b) => a.week_number - b.week_number);
    this.saveStoredDemoWeeks(studentId, seededWeeks);
    return seededWeeks;
  }

  /**
   * Helper: Save demo weeks to localStorage.
   */
  private saveStoredDemoWeeks(studentId: string, weeks: LogbookWeek[]): void {
    const key = `${DEMO_WEEKS_STORAGE_PREFIX}${studentId}`;
    try {
      localStorage.setItem(key, JSON.stringify(weeks));
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Reset demo weeks back to initial seed data (useful for demonstration & testing).
   */
  resetDemoWeeks(studentId: string): LogbookWeek[] {
    const key = `${DEMO_WEEKS_STORAGE_PREFIX}${studentId}`;
    localStorage.removeItem(key);
    return this.getStoredDemoWeeks(studentId);
  }
}

export const logbookService = new LogbookService();
