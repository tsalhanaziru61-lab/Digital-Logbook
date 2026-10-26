/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  WeeklyReportWithStudent,
  ReportQueryFilters,
  ReviewStatsSummary,
  ApproveReportPayload,
  ReturnReportPayload,
  LogbookWeek,
  DailyActivity,
  StudentReportSummary,
} from '../types/logbook';
import { ServiceResponse } from '../types';
import { INITIAL_DEMO_STUDENTS, INITIAL_DEMO_WEEKS } from '../constants/databaseSchema';
import { notificationService } from './notificationService';

const DEMO_WEEKS_STORAGE_PREFIX = 'siwes_demo_weeks_';

/**
 * Service managing Administrator Weekly Report Review & Remarks.
 * Module 09 — Admin Weekly Report Review & Remarks
 *
 * Implements:
 * 1. Filtering and prioritizing submitted weekly reports awaiting review.
 * 2. Detailed inspection of student 5-day daily activities (Mon–Fri).
 * 3. Formal approval workflow with administrative remarks and optional feedback.
 * 4. Return-for-correction workflow with mandatory feedback explaining required revisions.
 * 5. Strict security: only submitted reports can be reviewed; students cannot self-approve or edit locked records.
 */
class ReportReviewService {
  /**
   * Helper to retrieve all stored demo weeks for a given student from localStorage.
   */
  private getStoredWeeksForStudent(studentId: string): LogbookWeek[] {
    try {
      const stored = localStorage.getItem(`${DEMO_WEEKS_STORAGE_PREFIX}${studentId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Ignore
    }

    if (studentId === 'd4930092-0a64-41d7-af79-16dd85a4b68f' || studentId === 'demo-student-uuid-001') {
      return JSON.parse(JSON.stringify(INITIAL_DEMO_WEEKS));
    }

    // Default generated realistic weeks for other demo cohort students
    return this.generateSeedWeeksForCohort(studentId);
  }

  /**
   * Generates realistic seeded weeks for students in the cohort so the administrator
   * has a rich queue across all states (submitted, approved, returned, draft).
   */
  private generateSeedWeeksForCohort(studentId: string): LogbookWeek[] {
    const student = INITIAL_DEMO_STUDENTS.find((s) => s.id === studentId);
    const dept = student?.department || 'Engineering';

    const weeks: LogbookWeek[] = [
      {
        id: `demo-week-${studentId}-1`,
        student_id: studentId,
        week_number: 1,
        start_date: '2026-03-02',
        end_date: '2026-03-06',
        status: 'approved',
        submitted_at: '2026-03-06T17:00:00.000Z',
        reviewed_at: '2026-03-09T09:15:00.000Z',
        reviewed_by: 'demo-admin-uuid-002',
        reviewer_id: 'demo-admin-uuid-002',
        admin_remark: 'Excellent',
        reviewer_remarks: 'Excellent',
        admin_feedback: 'Clear documentation of industrial equipment onboarding and safety orientation.',
        supervisor_grade: 'A',
        daily_activities: [
          {
            id: `act-${studentId}-1-1`,
            week_id: `demo-week-${studentId}-1`,
            student_id: studentId,
            day_of_week: 'Monday',
            date: '2026-03-02',
            title: 'Facility Orientation & Induction',
            activity: `Underwent SIWES orientation in the ${dept} department. Briefed on industrial hazards, PPE requirements, and team structure.`,
            tools_used: 'Safety boots, Induction manual, Badge',
          },
          {
            id: `act-${studentId}-1-2`,
            week_id: `demo-week-${studentId}-1`,
            student_id: studentId,
            day_of_week: 'Tuesday',
            date: '2026-03-03',
            title: 'Equipment & Tooling Familiarization',
            activity: 'Inspected departmental hardware inventory, test benches, and standard calibration tools under supervisor guidance.',
            tools_used: 'Digital multimeters, Diagnostic probes, Calibration log',
          },
          {
            id: `act-${studentId}-1-3`,
            week_id: `demo-week-${studentId}-1`,
            student_id: studentId,
            day_of_week: 'Wednesday',
            date: '2026-03-04',
            title: 'Routine Preventative Maintenance',
            activity: 'Participated in scheduled preventative maintenance of industrial workstations and backup power units.',
            tools_used: 'Screwdriver kit, Air compressor, Thermal scanner',
          },
          {
            id: `act-${studentId}-1-4`,
            week_id: `demo-week-${studentId}-1`,
            student_id: studentId,
            day_of_week: 'Thursday',
            date: '2026-03-05',
            title: 'System Diagnostics & Log Verification',
            activity: 'Monitored real-time system metrics, operational logs, and flag anomalies across test nodes.',
            tools_used: 'Log analysis tool, Wireshark, Terminal console',
          },
          {
            id: `act-${studentId}-1-5`,
            week_id: `demo-week-${studentId}-1`,
            student_id: studentId,
            day_of_week: 'Friday',
            date: '2026-03-06',
            title: 'Weekly Technical Summary & Review',
            activity: 'Prepared weekly progress log and reviewed operational tasks with the workplace industry supervisor.',
            tools_used: 'Weekly report sheet, Industrial documentation',
          },
        ],
      },
      {
        id: `demo-week-${studentId}-2`,
        student_id: studentId,
        week_number: 2,
        start_date: '2026-03-09',
        end_date: '2026-03-13',
        status: 'submitted', // Awaiting Admin Review!
        submitted_at: '2026-03-13T16:45:00.000Z',
        reviewed_at: null,
        reviewed_by: null,
        reviewer_id: null,
        admin_remark: null,
        reviewer_remarks: null,
        admin_feedback: null,
        supervisor_grade: null,
        daily_activities: [
          {
            id: `act-${studentId}-2-1`,
            week_id: `demo-week-${studentId}-2`,
            student_id: studentId,
            day_of_week: 'Monday',
            date: '2026-03-09',
            title: 'Industrial Circuitry & Signal Routing',
            activity: 'Conducted signal continuity tracing and verified industrial circuit breaker ratings according to IEEE specs.',
            tools_used: 'Oscilloscope, Digital multimeter, Schematic diagrams',
          },
          {
            id: `act-${studentId}-2-2`,
            week_id: `demo-week-${studentId}-2`,
            student_id: studentId,
            day_of_week: 'Tuesday',
            date: '2026-03-10',
            title: 'Firmware Upgrades & Component Validation',
            activity: 'Assisted senior engineer with flashing updated microcode onto peripheral control modules and verifying boot logs.',
            tools_used: 'FTDI USB-UART cable, Minicom serial console, Flash programmer',
          },
          {
            id: `act-${studentId}-2-3`,
            week_id: `demo-week-${studentId}-2`,
            student_id: studentId,
            day_of_week: 'Wednesday',
            date: '2026-03-11',
            title: 'Environmental Stress Testing',
            activity: 'Monitored thermal dissipation and voltage drop across high-load nodes inside the climate-controlled chamber.',
            tools_used: 'Thermocouple sensors, Data logger, Python analysis script',
          },
          {
            id: `act-${studentId}-2-4`,
            week_id: `demo-week-${studentId}-2`,
            student_id: studentId,
            day_of_week: 'Thursday',
            date: '2026-03-12',
            title: 'Automated Fault Injection & Recovery Run',
            activity: 'Simulated power bus disruptions to evaluate automatic switchover latency and failover alarms.',
            tools_used: 'Programmable DC power supply, Alarm monitor',
          },
          {
            id: `act-${studentId}-2-5`,
            week_id: `demo-week-${studentId}-2`,
            student_id: studentId,
            day_of_week: 'Friday',
            date: '2026-03-13',
            title: 'Test Bench Clean-down & Weekly Submission',
            activity: 'Compiled data sheets from stress tests, organized bench apparatus, and submitted 5-day logbook report for coordinator approval.',
            tools_used: 'SIWES Digital Logbook, Bench instruments',
          },
        ],
      },
    ];

    try {
      localStorage.setItem(`${DEMO_WEEKS_STORAGE_PREFIX}${studentId}`, JSON.stringify(weeks));
    } catch {
      // Ignore
    }

    return weeks;
  }

  /**
   * Helper: Save student demo weeks.
   */
  private saveStoredWeeksForStudent(studentId: string, weeks: LogbookWeek[]): void {
    try {
      localStorage.setItem(`${DEMO_WEEKS_STORAGE_PREFIX}${studentId}`, JSON.stringify(weeks));
    } catch {
      // Ignore
    }
  }

  /**
   * Retrieves all weekly reports across all students, joined with student information.
   * Priority: Submitted/unreviewed reports are sorted to the top.
   */
  async getReports(
    filters?: ReportQueryFilters
  ): Promise<
    ServiceResponse<{
      reports: WeeklyReportWithStudent[];
      totalCount: number;
      stats: ReviewStatsSummary;
    }>
  > {
    const statusFilter = filters?.status || 'all';
    const studentFilter = filters?.studentId || '';
    const weekFilter = filters?.weekNumber || 'all';
    const search = filters?.search?.trim().toLowerCase() || '';

    // 1. In Demo Mode or if Supabase is unconfigured / tables missing
    if (!isSupabaseConfigured()) {
      return this.getReportsFromDemoStorage(statusFilter, studentFilter, weekFilter, search);
    }

    // 2. Real Supabase Database Query
    try {
      // Attempt query with relational joins
      let query = supabase
        .from('logbook_weeks')
        .select(`
          *,
          daily_activities(*),
          student:profiles!student_id(
            id, full_name, email, matric_number, department, institution, organisation, company_name, supervisor_name
          ),
          reviewer:profiles!reviewer_id(
            id, full_name, email
          )
        `);

      if (studentFilter && studentFilter !== 'all') {
        query = query.eq('student_id', studentFilter);
      }

      if (weekFilter !== 'all' && typeof weekFilter === 'number') {
        query = query.eq('week_number', weekFilter);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('[ReportReviewService] Supabase query failed, falling back to demo storage:', error.message);
        return this.getReportsFromDemoStorage(statusFilter, studentFilter, weekFilter, search);
      }

      if (!data || data.length === 0) {
        // If DB has no records, fallback to demo cohort for demonstration
        return this.getReportsFromDemoStorage(statusFilter, studentFilter, weekFilter, search);
      }

      const rawReports = data as Array<
        LogbookWeek & {
          student?: StudentReportSummary;
          reviewer?: { id: string; full_name: string; email?: string } | null;
        }
      >;

      // Map and normalize reports
      let reports: WeeklyReportWithStudent[] = rawReports.map((row) => ({
        ...row,
        student: row.student || {
          id: row.student_id,
          full_name: 'Unknown Student',
          email: '',
          matric_number: 'N/A',
        },
        reviewer: row.reviewer || null,
        admin_remark: row.admin_remark || row.reviewer_remarks || null,
        admin_feedback: row.admin_feedback || null,
        reviewed_by: row.reviewed_by || row.reviewer_id || null,
      }));

      // Calculate global counts
      const stats: ReviewStatsSummary = {
        total: reports.length,
        submitted: reports.filter((r) => r.status === 'submitted').length,
        approved: reports.filter((r) => r.status === 'approved').length,
        returned: reports.filter((r) => r.status === 'returned').length,
        draft: reports.filter((r) => r.status === 'draft').length,
      };

      // Search filtering
      if (search) {
        reports = reports.filter((r) => {
          const studentName = r.student.full_name?.toLowerCase() || '';
          const matric = (r.student.matric_number || r.student.matric_no || '').toLowerCase();
          const weekStr = `week ${r.week_number}`;
          const weekNum = String(r.week_number);
          const dept = (r.student.department || '').toLowerCase();
          const org = (r.student.organisation || r.student.company_name || '').toLowerCase();
          return (
            studentName.includes(search) ||
            matric.includes(search) ||
            weekStr.includes(search) ||
            weekNum === search ||
            dept.includes(search) ||
            org.includes(search)
          );
        });
      }

      // Prioritize submitted reports at the top
      reports.sort((a, b) => {
        const priorityOrder: Record<string, number> = {
          submitted: 1,
          returned: 2,
          approved: 3,
          draft: 4,
        };
        const pA = priorityOrder[a.status] || 99;
        const pB = priorityOrder[b.status] || 99;
        if (pA !== pB) return pA - pB;

        // Within same status, sort by submitted_at desc or week_number desc
        if (a.submitted_at && b.submitted_at) {
          return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
        }
        return b.week_number - a.week_number;
      });

      return {
        data: {
          reports,
          totalCount: reports.length,
          stats,
        },
        error: null,
        success: true,
      };
    } catch (err) {
      console.warn('[ReportReviewService] Unexpected error, returning fallback demo data:', err);
      return this.getReportsFromDemoStorage(statusFilter, studentFilter, weekFilter, search);
    }
  }

  /**
   * Helper that collects and filters reports from local demo storage.
   */
  private getReportsFromDemoStorage(
    statusFilter: string,
    studentFilter: string,
    weekFilter: number | 'all',
    search: string
  ): ServiceResponse<{
    reports: WeeklyReportWithStudent[];
    totalCount: number;
    stats: ReviewStatsSummary;
  }> {
    const allReports: WeeklyReportWithStudent[] = [];

    // Collect from all students in INITIAL_DEMO_STUDENTS
    INITIAL_DEMO_STUDENTS.forEach((student) => {
      const studentSummary: StudentReportSummary = {
        id: student.id,
        full_name: student.full_name,
        email: student.email,
        matric_number: student.matric_number || student.matric_no || 'N/A',
        matric_no: student.matric_no,
        institution: student.institution,
        department: student.department,
        organisation: student.organisation || student.company_name,
        company_name: student.company_name,
        supervisor_name: student.supervisor_name,
      };

      const weeks = this.getStoredWeeksForStudent(student.id);

      weeks.forEach((w) => {
        allReports.push({
          ...w,
          student: studentSummary,
          admin_remark: w.admin_remark || w.reviewer_remarks || null,
          admin_feedback: w.admin_feedback || null,
          reviewed_by: w.reviewed_by || w.reviewer_id || null,
          reviewer:
            w.reviewed_by || w.reviewer_id
              ? {
                  id: (w.reviewed_by || w.reviewer_id) as string,
                  full_name: 'Dr. Elizabeth Nnamani',
                  email: 'admin@siwes.edu.ng',
                }
              : null,
        });
      });
    });

    // Compute stats across all non-draft reports (or including drafts if desired)
    const stats: ReviewStatsSummary = {
      total: allReports.length,
      submitted: allReports.filter((r) => r.status === 'submitted').length,
      approved: allReports.filter((r) => r.status === 'approved').length,
      returned: allReports.filter((r) => r.status === 'returned').length,
      draft: allReports.filter((r) => r.status === 'draft').length,
    };

    let filtered = [...allReports];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    // Student filter
    if (studentFilter && studentFilter !== 'all') {
      filtered = filtered.filter((r) => r.student_id === studentFilter);
    }

    // Week filter
    if (weekFilter !== 'all' && typeof weekFilter === 'number') {
      filtered = filtered.filter((r) => r.week_number === weekFilter);
    }

    // Search filter
    if (search) {
      filtered = filtered.filter((r) => {
        const studentName = r.student.full_name?.toLowerCase() || '';
        const matric = (r.student.matric_number || r.student.matric_no || '').toLowerCase();
        const weekStr = `week ${r.week_number}`;
        const weekNum = String(r.week_number);
        const dept = (r.student.department || '').toLowerCase();
        const org = (r.student.organisation || r.student.company_name || '').toLowerCase();
        return (
          studentName.includes(search) ||
          matric.includes(search) ||
          weekStr.includes(search) ||
          weekNum === search ||
          dept.includes(search) ||
          org.includes(search)
        );
      });
    }

    // Sort order: Submitted first, then Returned, then Approved, then Draft
    filtered.sort((a, b) => {
      const priorityOrder: Record<string, number> = {
        submitted: 1,
        returned: 2,
        approved: 3,
        draft: 4,
      };
      const pA = priorityOrder[a.status] || 99;
      const pB = priorityOrder[b.status] || 99;
      if (pA !== pB) return pA - pB;

      if (a.submitted_at && b.submitted_at) {
        return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
      }
      return b.week_number - a.week_number;
    });

    return {
      data: {
        reports: filtered,
        totalCount: filtered.length,
        stats,
      },
      error: null,
      success: true,
    };
  }

  /**
   * Retrieves a single weekly report with complete student and daily activity details.
   */
  async getReportById(weekId: string): Promise<ServiceResponse<WeeklyReportWithStudent>> {
    // 1. In Demo Mode or fallback
    if (!isSupabaseConfigured() || weekId.startsWith('demo-')) {
      // Find across all demo students
      for (const student of INITIAL_DEMO_STUDENTS) {
        const weeks = this.getStoredWeeksForStudent(student.id);
        const found = weeks.find((w) => w.id === weekId);
        if (found) {
          const report: WeeklyReportWithStudent = {
            ...found,
            student: {
              id: student.id,
              full_name: student.full_name,
              email: student.email,
              matric_number: student.matric_number || student.matric_no || 'N/A',
              matric_no: student.matric_no,
              institution: student.institution,
              department: student.department,
              organisation: student.organisation || student.company_name,
              company_name: student.company_name,
              supervisor_name: student.supervisor_name,
            },
            admin_remark: found.admin_remark || found.reviewer_remarks || null,
            admin_feedback: found.admin_feedback || null,
            reviewed_by: found.reviewed_by || found.reviewer_id || null,
            reviewer:
              found.reviewed_by || found.reviewer_id
                ? {
                    id: (found.reviewed_by || found.reviewer_id) as string,
                    full_name: 'Dr. Elizabeth Nnamani',
                    email: 'admin@siwes.edu.ng',
                  }
                : null,
          };
          return { data: report, error: null, success: true };
        }
      }

      return {
        data: null,
        error: { message: 'Weekly report record not found.', code: 'NOT_FOUND' },
        success: false,
      };
    }

    // 2. Real Supabase Database Retrieval
    try {
      const { data, error } = await supabase
        .from('logbook_weeks')
        .select(`
          *,
          daily_activities(*),
          student:profiles!student_id(
            id, full_name, email, matric_number, department, institution, organisation, company_name, supervisor_name
          ),
          reviewer:profiles!reviewer_id(
            id, full_name, email
          )
        `)
        .eq('id', weekId)
        .single();

      if (error || !data) {
        return {
          data: null,
          error: { message: error?.message || 'Report not found.', code: error?.code },
          success: false,
        };
      }

      const row = data as LogbookWeek & {
        student?: StudentReportSummary;
        reviewer?: { id: string; full_name: string; email?: string } | null;
      };

      const sortedActivities = (row.daily_activities || []).sort((a, b) => {
        const order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        return order.indexOf(a.day_of_week) - order.indexOf(b.day_of_week);
      });

      const report: WeeklyReportWithStudent = {
        ...row,
        daily_activities: sortedActivities,
        student: row.student || {
          id: row.student_id,
          full_name: 'Student',
          email: '',
          matric_number: 'N/A',
        },
        reviewer: row.reviewer || null,
        admin_remark: row.admin_remark || row.reviewer_remarks || null,
        admin_feedback: row.admin_feedback || null,
        reviewed_by: row.reviewed_by || row.reviewer_id || null,
      };

      return { data: report, error: null, success: true };
    } catch (err) {
      return {
        data: null,
        error: {
          message: err instanceof Error ? err.message : 'Error retrieving weekly report details.',
        },
        success: false,
      };
    }
  }

  /**
   * Approves a submitted weekly report.
   *
   * SECURITY & WORKFLOW ENFORCEMENTS:
   * 1. Requires authenticated administrator ID.
   * 2. Verifies the report is currently in 'submitted' status (draft or approved reports cannot be approved).
   * 3. Sets status to 'approved', stamps reviewed_at, and links reviewed_by to the authenticated admin.
   * 4. Updates administrative remarks and optional feedback.
   * 5. The student will be unable to edit the report following approval.
   */
  async approveReport(payload: ApproveReportPayload): Promise<ServiceResponse<WeeklyReportWithStudent>> {
    const { weekId, adminId, adminRemark, adminFeedback } = payload;

    // Validation
    if (!adminId) {
      return {
        data: null,
        error: { message: 'Authentication required. Missing administrator ID.', code: 'UNAUTHORIZED' },
        success: false,
      };
    }

    const trimmedRemark = adminRemark?.trim();
    if (!trimmedRemark) {
      return {
        data: null,
        error: { message: 'Administrative remark is required to approve the report.', code: 'VALIDATION_ERROR' },
        success: false,
      };
    }

    const trimmedFeedback = adminFeedback?.trim() || null;
    const reviewedAt = new Date().toISOString();

    // 1. Demo Mode or Local Storage Fallback
    if (!isSupabaseConfigured() || weekId.startsWith('demo-')) {
      for (const student of INITIAL_DEMO_STUDENTS) {
        const weeks = this.getStoredWeeksForStudent(student.id);
        const index = weeks.findIndex((w) => w.id === weekId);
        if (index !== -1) {
          const week = weeks[index];

          // State transition check
          if (week.status !== 'submitted') {
            return {
              data: null,
              error: {
                message: `Cannot approve report. Only 'submitted' reports can be approved. Current status is '${week.status}'.`,
                code: 'INVALID_STATUS_TRANSITION',
              },
              success: false,
            };
          }

          week.status = 'approved';
          week.admin_remark = trimmedRemark;
          week.reviewer_remarks = trimmedRemark;
          week.admin_feedback = trimmedFeedback;
          week.reviewed_at = reviewedAt;
          week.reviewed_by = adminId;
          week.reviewer_id = adminId;
          week.updated_at = reviewedAt;

          weeks[index] = week;
          this.saveStoredWeeksForStudent(student.id, weeks);

          const updatedReport: WeeklyReportWithStudent = {
            ...week,
            student: {
              id: student.id,
              full_name: student.full_name,
              email: student.email,
              matric_number: student.matric_number || student.matric_no || 'N/A',
              matric_no: student.matric_no,
              institution: student.institution,
              department: student.department,
              organisation: student.organisation || student.company_name,
              company_name: student.company_name,
            },
            reviewer: {
              id: adminId,
              full_name: 'Dr. Elizabeth Nnamani',
              email: 'admin@siwes.edu.ng',
            },
          };

          // Dispatch student notification for approved report (Module 11)
          await notificationService.createNotification({
            recipient_id: student.id,
            title: 'Weekly Report Approved',
            message: `Your Week ${week.week_number} SIWES report has been approved.`,
            type: 'report_approved',
            related_id: week.id,
            week_number: week.week_number,
            action_url: '/student/activity',
            sender_name: 'Dr. Elizabeth Nnamani',
          });

          return { data: updatedReport, error: null, success: true };
        }
      }

      return {
        data: null,
        error: { message: 'Report record not found.', code: 'NOT_FOUND' },
        success: false,
      };
    }

    // 2. Real Supabase Database Execution
    try {
      // First verify status is submitted
      const { data: existing, error: fetchErr } = await supabase
        .from('logbook_weeks')
        .select('id, status, student_id')
        .eq('id', weekId)
        .single();

      if (fetchErr || !existing) {
        return {
          data: null,
          error: { message: 'Report not found.', code: 'NOT_FOUND' },
          success: false,
        };
      }

      if (existing.status !== 'submitted') {
        return {
          data: null,
          error: {
            message: `Only reports in 'submitted' status can be approved. Current status is '${existing.status}'.`,
            code: 'INVALID_STATUS',
          },
          success: false,
        };
      }

      // Update strictly the required approval fields
      const { data: updated, error: updateErr } = await supabase
        .from('logbook_weeks')
        .update({
          status: 'approved',
          admin_remark: trimmedRemark,
          reviewer_remarks: trimmedRemark,
          admin_feedback: trimmedFeedback,
          reviewed_at: reviewedAt,
          reviewed_by: adminId,
          reviewer_id: adminId,
          updated_at: reviewedAt,
        })
        .eq('id', weekId)
        .eq('status', 'submitted') // Concurrency safeguard
        .select(`
          *,
          daily_activities(*),
          student:profiles!student_id(
            id, full_name, email, matric_number, department, institution, organisation, company_name
          ),
          reviewer:profiles!reviewer_id(
            id, full_name, email
          )
        `)
        .single();

      if (updateErr) {
        return {
          data: null,
          error: { message: updateErr.message || 'Failed to approve report.', code: updateErr.code },
          success: false,
        };
      }

      const row = updated as LogbookWeek & {
        student?: StudentReportSummary;
        reviewer?: { id: string; full_name: string; email?: string } | null;
      };

      const result: WeeklyReportWithStudent = {
        ...row,
        student: row.student || {
          id: row.student_id,
          full_name: 'Student',
          email: '',
          matric_number: 'N/A',
        },
        reviewer: row.reviewer || null,
        admin_remark: row.admin_remark || row.reviewer_remarks || null,
        admin_feedback: row.admin_feedback || null,
      };

      // Dispatch student notification for approved report (Module 11)
      await notificationService.createNotification({
        recipient_id: result.student_id,
        title: 'Weekly Report Approved',
        message: `Your Week ${result.week_number} SIWES report has been approved.`,
        type: 'report_approved',
        related_id: result.id,
        week_number: result.week_number,
        action_url: '/student/activity',
        sender_name: 'Institutional Coordinator',
      });

      return { data: result, error: null, success: true };
    } catch (err) {
      return {
        data: null,
        error: {
          message: err instanceof Error ? err.message : 'Unexpected error during approval.',
        },
        success: false,
      };
    }
  }

  /**
   * Returns a submitted weekly report to the student for corrections.
   *
   * SECURITY & WORKFLOW ENFORCEMENTS:
   * 1. Requires authenticated administrator ID.
   * 2. Mandates constructive feedback explaining what requires correction (minimum 5 characters).
   * 3. Sets status to 'returned', preserving all 5 daily activities.
   * 4. The student can now unlock and edit the returned report in Module 06 and resubmit.
   */
  async returnReport(payload: ReturnReportPayload): Promise<ServiceResponse<WeeklyReportWithStudent>> {
    const { weekId, adminId, adminRemark, adminFeedback } = payload;

    // Validation
    if (!adminId) {
      return {
        data: null,
        error: { message: 'Authentication required. Missing administrator ID.', code: 'UNAUTHORIZED' },
        success: false,
      };
    }

    const trimmedFeedback = adminFeedback?.trim();
    if (!trimmedFeedback || trimmedFeedback.length < 5) {
      return {
        data: null,
        error: {
          message: 'Constructive feedback explaining what requires correction is mandatory when returning a report (at least 5 characters).',
          code: 'VALIDATION_ERROR',
        },
        success: false,
      };
    }

    const trimmedRemark = adminRemark?.trim() || 'Needs Improvement';
    const reviewedAt = new Date().toISOString();

    // 1. Demo Mode or Local Storage Fallback
    if (!isSupabaseConfigured() || weekId.startsWith('demo-')) {
      for (const student of INITIAL_DEMO_STUDENTS) {
        const weeks = this.getStoredWeeksForStudent(student.id);
        const index = weeks.findIndex((w) => w.id === weekId);
        if (index !== -1) {
          const week = weeks[index];

          // State transition check
          if (week.status !== 'submitted') {
            return {
              data: null,
              error: {
                message: `Cannot return report. Only 'submitted' reports can be returned for correction. Current status is '${week.status}'.`,
                code: 'INVALID_STATUS_TRANSITION',
              },
              success: false,
            };
          }

          week.status = 'returned';
          week.admin_remark = trimmedRemark;
          week.reviewer_remarks = trimmedRemark;
          week.admin_feedback = trimmedFeedback;
          week.reviewed_at = reviewedAt;
          week.reviewed_by = adminId;
          week.reviewer_id = adminId;
          week.updated_at = reviewedAt;

          weeks[index] = week;
          this.saveStoredWeeksForStudent(student.id, weeks);

          const updatedReport: WeeklyReportWithStudent = {
            ...week,
            student: {
              id: student.id,
              full_name: student.full_name,
              email: student.email,
              matric_number: student.matric_number || student.matric_no || 'N/A',
              matric_no: student.matric_no,
              institution: student.institution,
              department: student.department,
              organisation: student.organisation || student.company_name,
              company_name: student.company_name,
            },
            reviewer: {
              id: adminId,
              full_name: 'Dr. Elizabeth Nnamani',
              email: 'admin@siwes.edu.ng',
            },
          };

          // Dispatch student notification for returned report (Module 11)
          await notificationService.createNotification({
            recipient_id: student.id,
            title: 'Weekly Report Returned',
            message: `Your Week ${week.week_number} report has been returned for correction. Please review the administrator's feedback.`,
            type: 'report_returned',
            related_id: week.id,
            week_number: week.week_number,
            action_url: '/student/activity',
            sender_name: 'Dr. Elizabeth Nnamani',
          });

          return { data: updatedReport, error: null, success: true };
        }
      }

      return {
        data: null,
        error: { message: 'Report record not found.', code: 'NOT_FOUND' },
        success: false,
      };
    }

    // 2. Real Supabase Database Execution
    try {
      const { data: existing, error: fetchErr } = await supabase
        .from('logbook_weeks')
        .select('id, status, student_id')
        .eq('id', weekId)
        .single();

      if (fetchErr || !existing) {
        return {
          data: null,
          error: { message: 'Report not found.', code: 'NOT_FOUND' },
          success: false,
        };
      }

      if (existing.status !== 'submitted') {
        return {
          data: null,
          error: {
            message: `Only reports in 'submitted' status can be returned. Current status is '${existing.status}'.`,
            code: 'INVALID_STATUS',
          },
          success: false,
        };
      }

      const { data: updated, error: updateErr } = await supabase
        .from('logbook_weeks')
        .update({
          status: 'returned',
          admin_remark: trimmedRemark,
          reviewer_remarks: trimmedRemark,
          admin_feedback: trimmedFeedback,
          reviewed_at: reviewedAt,
          reviewed_by: adminId,
          reviewer_id: adminId,
          updated_at: reviewedAt,
        })
        .eq('id', weekId)
        .eq('status', 'submitted')
        .select(`
          *,
          daily_activities(*),
          student:profiles!student_id(
            id, full_name, email, matric_number, department, institution, organisation, company_name
          ),
          reviewer:profiles!reviewer_id(
            id, full_name, email
          )
        `)
        .single();

      if (updateErr) {
        return {
          data: null,
          error: { message: updateErr.message || 'Failed to return report.', code: updateErr.code },
          success: false,
        };
      }

      const row = updated as LogbookWeek & {
        student?: StudentReportSummary;
        reviewer?: { id: string; full_name: string; email?: string } | null;
      };

      const result: WeeklyReportWithStudent = {
        ...row,
        student: row.student || {
          id: row.student_id,
          full_name: 'Student',
          email: '',
          matric_number: 'N/A',
        },
        reviewer: row.reviewer || null,
        admin_remark: row.admin_remark || row.reviewer_remarks || null,
        admin_feedback: row.admin_feedback || null,
      };

      // Dispatch student notification for returned report (Module 11)
      await notificationService.createNotification({
        recipient_id: result.student_id,
        title: 'Weekly Report Returned',
        message: `Your Week ${result.week_number} report has been returned for correction. Please review the administrator's feedback.`,
        type: 'report_returned',
        related_id: result.id,
        week_number: result.week_number,
        action_url: '/student/activity',
        sender_name: 'Institutional Coordinator',
      });

      return { data: result, error: null, success: true };
    } catch (err) {
      return {
        data: null,
        error: {
          message: err instanceof Error ? err.message : 'Unexpected error returning report.',
        },
        success: false,
      };
    }
  }

  /**
   * Retrieves high-level review statistics for coordinator overview badges.
   */
  async getReviewStats(): Promise<ReviewStatsSummary> {
    const res = await this.getReports({ status: 'all' });
    if (res.success && res.data) {
      return res.data.stats;
    }
    return {
      total: 0,
      submitted: 0,
      approved: 0,
      returned: 0,
      draft: 0,
    };
  }
}

export const reportReviewService = new ReportReviewService();
