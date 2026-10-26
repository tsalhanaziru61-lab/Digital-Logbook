/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type LogbookWeekStatus = 'draft' | 'submitted' | 'approved' | 'returned';

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

export const DAYS_OF_WEEK: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export interface DailyActivity {
  id: string;
  week_id: string;
  student_id: string;
  day_of_week: DayOfWeek;
  date: string; // YYYY-MM-DD
  title: string;
  activity: string;
  tools_used?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface LogbookWeek {
  id: string;
  student_id: string;
  week_number: number;
  start_date: string; // YYYY-MM-DD (Monday)
  end_date: string;   // YYYY-MM-DD (Friday)
  status: LogbookWeekStatus;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  reviewer_id?: string | null;
  reviewer_name?: string | null;
  admin_remark?: string | null;
  reviewer_remarks?: string | null;
  admin_feedback?: string | null;
  supervisor_grade?: string | null;
  created_at?: string;
  updated_at?: string;
  daily_activities?: DailyActivity[];
}

export type AdminRemarkPreset =
  | 'Excellent'
  | 'Very Good'
  | 'Good'
  | 'Satisfactory'
  | 'Needs Improvement'
  | 'Poor';

export const ADMIN_REMARK_OPTIONS: AdminRemarkPreset[] = [
  'Excellent',
  'Very Good',
  'Good',
  'Satisfactory',
  'Needs Improvement',
  'Poor',
];

export interface StudentReportSummary {
  id: string;
  full_name: string;
  email: string;
  matric_number: string;
  matric_no?: string;
  institution?: string | null;
  department?: string | null;
  organisation?: string | null;
  company_name?: string | null;
  supervisor_name?: string | null;
}

export interface WeeklyReportWithStudent extends LogbookWeek {
  student: StudentReportSummary;
  reviewer?: {
    id: string;
    full_name: string;
    email?: string;
  } | null;
}

export type ReportFilterStatus = 'all' | 'submitted' | 'approved' | 'returned' | 'draft';

export interface ReportQueryFilters {
  status?: ReportFilterStatus;
  studentId?: string;
  weekNumber?: number | 'all';
  search?: string;
}

export interface ReviewStatsSummary {
  total: number;
  submitted: number;
  approved: number;
  returned: number;
  draft: number;
}

export interface ApproveReportPayload {
  weekId: string;
  adminId: string;
  adminRemark: string;
  adminFeedback?: string;
}

export interface ReturnReportPayload {
  weekId: string;
  adminId: string;
  adminRemark: string;
  adminFeedback: string;
}

export interface DailyActivityDraftInput {
  day_of_week: DayOfWeek;
  date: string;
  title: string;
  activity: string;
  tools_used?: string | null;
}

export interface SaveWeeklyActivitiesInput {
  week_id: string;
  student_id: string;
  week_number: number;
  activities: DailyActivityDraftInput[];
}

export interface WeekValidationResult {
  isValidForSubmission: boolean;
  missingDays: DayOfWeek[];
  missingFieldErrors: Record<DayOfWeek, { title?: string; activity?: string }>;
}

