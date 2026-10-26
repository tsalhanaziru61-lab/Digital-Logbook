/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Production-ready PostgreSQL DDL and Row Level Security (RLS) policies
 * for the Supabase `profiles` table utilized by Module 02 & Module 03.
 *
 * This SQL script can be executed in the Supabase Dashboard -> SQL Editor
 * to provision or verify the table structure and access control policies.
 */
export const PROFILES_SQL_SCHEMA = `-- ==============================================================================
-- SIWES DIGITAL LOGBOOK MANAGEMENT SYSTEM — PROFILES SCHEMA & RLS
-- Module 02 & Module 03: User Profile & Role-Based Access Control
-- ==============================================================================

-- 1. Create User Role Enum (or constraint)
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('student', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Create the Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  matric_number TEXT,
  department TEXT,
  institution TEXT,
  phone_number TEXT,
  avatar_url TEXT,
  company_name TEXT,
  organisation TEXT,
  siwes_start_date DATE,
  siwes_end_date DATE,
  supervisor_name TEXT,
  supervisor_phone TEXT,
  supervisor_email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies

-- Policy A: Users can view their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy B: Admins can view all student and administrator profiles
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Policy C: Users can update their own personal details (excluding role)
DROP POLICY IF EXISTS "Users can update own details" ON public.profiles;
CREATE POLICY "Users can update own details"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Ensure role cannot be elevated by user
    AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
  );

-- Policy D: Admins can create and modify any profile
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 5. Auto-sync trigger from auth.users (When an account is created via Admin)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, matric_number, department, institution)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'student'::user_role),
    new.raw_user_meta_data->>'matric_number',
    new.raw_user_meta_data->>'department',
    new.raw_user_meta_data->>'institution'
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Updated_at auto-refresh trigger
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
`;

/**
 * Pre-defined mock profile fixtures used for:
 * 1. Testing role guards in sandbox/development environments.
 * 2. Allowing instant evaluation of student and admin portals without waiting for remote DB seeding.
 * 3. Graceful fallback when Supabase connection parameters are pending in .env.
 */
export const DEMO_PROFILES = {
  student: {
    id: 'd4930092-0a64-41d7-af79-16dd85a4b68f',
    email: 'student@kasu.edu.ng',
    full_name: 'Sadiq Abubakar',
    role: 'student' as const,
    matric_number: 'KASU/21/CSC/1042',
    matric_no: 'KASU/21/CSC/1042',
    department: 'Computer Science',
    institution: 'Kaduna State University (KASU)',
    company_name: 'Kaduna State Bureau of Technology & Innovation',
    organisation: 'Kaduna State Bureau of Technology & Innovation',
    siwes_start_date: '2026-03-02',
    siwes_end_date: '2026-08-28',
    phone_number: '+234 803 456 7890',
    supervisor_name: 'Engr. Ibrahim Bello',
    supervisor_phone: '+234 802 111 2233',
    supervisor_email: 'ibrahim.bello@kdsg.gov.ng',
    avatar_url: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  admin: {
    id: 'dce626bd-3eba-4aef-97ce-45621dbf05f2',
    email: 'admin@kasu.edu.ng',
    full_name: 'Dr. Farouk Umar',
    role: 'admin' as const,
    matric_number: null,
    matric_no: null,
    department: 'Directorate of SIWES & Industrial Training',
    institution: 'Kaduna State University (KASU)',
    company_name: null,
    organisation: null,
    siwes_start_date: null,
    siwes_end_date: null,
    phone_number: '+234 802 345 6789',
    supervisor_name: null,
    supervisor_phone: null,
    supervisor_email: null,
    avatar_url: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
} as const;

/**
 * Initial demo cohort students for Administrator Student Management (Module 08).
 * Provides diverse departmental cohorts, SIWES organizations, and placement timelines.
 */
export const INITIAL_DEMO_STUDENTS = [
  {
    id: 'd4930092-0a64-41d7-af79-16dd85a4b68f',
    email: 'student@kasu.edu.ng',
    full_name: 'Sadiq Abubakar',
    role: 'student' as const,
    matric_number: 'KASU/21/CSC/1042',
    matric_no: 'KASU/21/CSC/1042',
    department: 'Computer Science',
    institution: 'Kaduna State University (KASU)',
    company_name: 'Kaduna State Bureau of Technology & Innovation',
    organisation: 'Kaduna State Bureau of Technology & Innovation',
    siwes_start_date: '2026-03-02',
    siwes_end_date: '2026-08-28',
    phone_number: '+234 803 456 7890',
    supervisor_name: 'Engr. Ibrahim Bello',
    supervisor_phone: '+234 802 111 2233',
    supervisor_email: 'ibrahim.bello@kdsg.gov.ng',
    avatar_url: null,
    is_active: true,
    created_at: '2026-02-15T09:00:00.000Z',
    updated_at: '2026-03-30T10:00:00.000Z',
  },
  {
    id: 'demo-student-uuid-002',
    email: 'chidinma.okeke@siwes.edu.ng',
    full_name: 'Chidinma Okeke',
    role: 'student' as const,
    matric_number: 'EEE/2021/0831',
    matric_no: 'EEE/2021/0831',
    department: 'Electrical & Electronics Engineering',
    institution: 'University of Lagos',
    company_name: 'Eko Electricity Distribution Company (EKEDC)',
    organisation: 'Eko Electricity Distribution Company (EKEDC)',
    siwes_start_date: '2026-03-02',
    siwes_end_date: '2026-08-28',
    phone_number: '+234 805 234 5678',
    supervisor_name: 'Engr. B. Fashola',
    supervisor_phone: '+234 803 444 7788',
    supervisor_email: 'b.fashola@ekedc.com',
    avatar_url: null,
    is_active: true,
    created_at: '2026-02-16T11:30:00.000Z',
    updated_at: '2026-03-28T14:20:00.000Z',
  },
  {
    id: 'demo-student-uuid-003',
    email: 'ibrahim.musa@siwes.edu.ng',
    full_name: 'Ibrahim Musa',
    role: 'student' as const,
    matric_number: 'MEE/2021/0914',
    matric_no: 'MEE/2021/0914',
    department: 'Mechanical Engineering',
    institution: 'Ahmadu Bello University, Zaria',
    company_name: 'Dangote Petroleum Refinery & Petrochemicals',
    organisation: 'Dangote Petroleum Refinery & Petrochemicals',
    siwes_start_date: '2026-02-23',
    siwes_end_date: '2026-08-21',
    phone_number: '+234 809 345 6789',
    supervisor_name: 'Engr. K. Al-Hassan',
    supervisor_phone: '+234 806 555 1234',
    supervisor_email: 'k.alhassan@dangote.com',
    avatar_url: null,
    is_active: true,
    created_at: '2026-02-18T08:15:00.000Z',
    updated_at: '2026-03-25T16:45:00.000Z',
  },
  {
    id: 'demo-student-uuid-004',
    email: 'blessing.emmanuel@siwes.edu.ng',
    full_name: 'Blessing Emmanuel',
    role: 'student' as const,
    matric_number: 'MIS/2021/1102',
    matric_no: 'MIS/2021/1102',
    department: 'Management Information Systems',
    institution: 'Covenant University, Ota',
    company_name: 'Interswitch Group',
    organisation: 'Interswitch Group',
    siwes_start_date: '2026-03-09',
    siwes_end_date: '2026-09-04',
    phone_number: '+234 812 456 7890',
    supervisor_name: 'Mr. T. Balogun',
    supervisor_phone: '+234 802 777 9900',
    supervisor_email: 't.balogun@interswitchgroup.com',
    avatar_url: null,
    is_active: true,
    created_at: '2026-02-20T14:00:00.000Z',
    updated_at: '2026-03-29T11:10:00.000Z',
  },
  {
    id: 'demo-student-uuid-005',
    email: 'folashade.adebayo@siwes.edu.ng',
    full_name: 'Folashade Adebayo',
    role: 'student' as const,
    matric_number: 'CYS/2021/0455',
    matric_no: 'CYS/2021/0455',
    department: 'Cyber Security',
    institution: 'Federal University of Technology, Akure',
    company_name: 'Flutterwave Technologies',
    organisation: 'Flutterwave Technologies',
    siwes_start_date: '2026-03-02',
    siwes_end_date: '2026-08-28',
    phone_number: '+234 814 567 8901',
    supervisor_name: 'Dr. C. Nwosu',
    supervisor_phone: '+234 803 888 2211',
    supervisor_email: 'c.nwosu@flutterwavego.com',
    avatar_url: null,
    is_active: true,
    created_at: '2026-02-22T10:00:00.000Z',
    updated_at: '2026-03-27T09:30:00.000Z',
  },
  {
    id: 'demo-student-uuid-006',
    email: 'tunde.bakare@siwes.edu.ng',
    full_name: 'Tunde Bakare',
    role: 'student' as const,
    matric_number: 'CVE/2021/0723',
    matric_no: 'CVE/2021/0723',
    department: 'Civil Engineering',
    institution: 'University of Ibadan',
    company_name: 'Julius Berger Nigeria Plc',
    organisation: 'Julius Berger Nigeria Plc',
    siwes_start_date: '2026-02-16',
    siwes_end_date: '2026-08-14',
    phone_number: '+234 816 678 9012',
    supervisor_name: 'Engr. M. Schmidt',
    supervisor_phone: '+234 809 111 3344',
    supervisor_email: 'm.schmidt@julius-berger.com',
    avatar_url: null,
    is_active: false, // Inactive student for testing filters and activation
    created_at: '2026-02-10T16:20:00.000Z',
    updated_at: '2026-03-15T12:00:00.000Z',
  },
];


/**
 * SQL Schema for Logbook Weeks and Daily Activities (Module 06)
 */
export const LOGBOOK_SQL_SCHEMA = `-- ==============================================================================
-- SIWES DIGITAL LOGBOOK MANAGEMENT SYSTEM — LOGBOOK WEEKS & DAILY ACTIVITIES
-- Module 06: Student Daily Activity & Weekly Logbook
-- ==============================================================================

-- 1. Create Logbook Week Status Enum
DO $$ BEGIN
  CREATE TYPE logbook_week_status AS ENUM ('draft', 'submitted', 'approved', 'returned');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Create Logbook Weeks Table
CREATE TABLE IF NOT EXISTS public.logbook_weeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL CHECK (week_number > 0),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status logbook_week_status NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewer_id UUID REFERENCES public.profiles(id),
  admin_remark TEXT,
  reviewer_remarks TEXT,
  admin_feedback TEXT,
  supervisor_grade TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_student_week UNIQUE (student_id, week_number)
);

-- 3. Create Daily Activities Table
CREATE TABLE IF NOT EXISTS public.daily_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id UUID NOT NULL REFERENCES public.logbook_weeks(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday')),
  date DATE NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  activity TEXT NOT NULL DEFAULT '',
  tools_used TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_week_day UNIQUE (week_id, day_of_week)
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.logbook_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_activities ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for logbook_weeks
DROP POLICY IF EXISTS "Students can view own logbook weeks" ON public.logbook_weeks;
CREATE POLICY "Students can view own logbook weeks"
  ON public.logbook_weeks FOR SELECT TO authenticated
  USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all logbook weeks" ON public.logbook_weeks;
CREATE POLICY "Admins can view all logbook weeks"
  ON public.logbook_weeks FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Students can insert own logbook weeks" ON public.logbook_weeks;
CREATE POLICY "Students can insert own logbook weeks"
  ON public.logbook_weeks FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "Students can update own draft or returned weeks" ON public.logbook_weeks;
CREATE POLICY "Students can update own draft or returned weeks"
  ON public.logbook_weeks FOR UPDATE TO authenticated
  USING (student_id = auth.uid() AND status IN ('draft', 'returned'))
  WITH CHECK (student_id = auth.uid() AND status IN ('draft', 'submitted'));

DROP POLICY IF EXISTS "Admins can update review status and remarks" ON public.logbook_weeks;
CREATE POLICY "Admins can update review status and remarks"
  ON public.logbook_weeks FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 6. RLS Policies for daily_activities
DROP POLICY IF EXISTS "Students can view own daily activities" ON public.daily_activities;
CREATE POLICY "Students can view own daily activities"
  ON public.daily_activities FOR SELECT TO authenticated
  USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all daily activities" ON public.daily_activities;
CREATE POLICY "Admins can view all daily activities"
  ON public.daily_activities FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Students can insert own daily activities" ON public.daily_activities;
CREATE POLICY "Students can insert own daily activities"
  ON public.daily_activities FOR INSERT TO authenticated
  WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.logbook_weeks w WHERE w.id = week_id AND w.status IN ('draft', 'returned'))
  );

DROP POLICY IF EXISTS "Students can update own daily activities in editable weeks" ON public.daily_activities;
CREATE POLICY "Students can update own daily activities in editable weeks"
  ON public.daily_activities FOR UPDATE TO authenticated
  USING (
    student_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.logbook_weeks w WHERE w.id = week_id AND w.status IN ('draft', 'returned'))
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_logbook_weeks_student_week ON public.logbook_weeks(student_id, week_number);
CREATE INDEX IF NOT EXISTS idx_daily_activities_week_id ON public.daily_activities(week_id);
CREATE INDEX IF NOT EXISTS idx_daily_activities_student ON public.daily_activities(student_id);
`;

/**
 * PostgreSQL DDL, RLS Policies, and Atomic Functions for Module 11 — Notifications & Review Feedback.
 */
export const NOTIFICATIONS_SQL_SCHEMA = `-- ==============================================================================
-- SIWES DIGITAL LOGBOOK MANAGEMENT SYSTEM — NOTIFICATIONS SCHEMA & RLS
-- Module 11: Internal Notifications & Review Feedback System
-- ==============================================================================

-- 1. Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('report_approved', 'report_returned', 'report_resubmitted', 'report_submitted', 'general')),
  related_id UUID REFERENCES public.logbook_weeks(id) ON DELETE SET NULL,
  week_number INTEGER,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  action_url TEXT,
  sender_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Users can view their own notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (recipient_id = auth.uid());

-- Users can update only the read state of their own notifications
DROP POLICY IF EXISTS "Users can update own notification read state" ON public.notifications;
CREATE POLICY "Users can update own notification read state"
  ON public.notifications FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- Admins can insert notifications
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;
CREATE POLICY "Admins can insert notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread ON public.notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- 4. Atomic PostgreSQL Function: Approve report and create notification
CREATE OR REPLACE FUNCTION public.approve_weekly_report(
  p_week_id UUID,
  p_admin_id UUID,
  p_remark TEXT,
  p_feedback TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_student_id UUID;
  v_week_num INT;
  v_res JSONB;
BEGIN
  SELECT student_id, week_number INTO v_student_id, v_week_num
  FROM public.logbook_weeks
  WHERE id = p_week_id AND status = 'submitted'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Report not found or not in submitted status';
  END IF;

  UPDATE public.logbook_weeks
  SET status = 'approved',
      admin_remark = p_remark,
      reviewer_remarks = p_remark,
      admin_feedback = p_feedback,
      reviewed_at = timezone('utc'::text, now()),
      reviewed_by = p_admin_id,
      reviewer_id = p_admin_id,
      updated_at = timezone('utc'::text, now())
  WHERE id = p_week_id;

  INSERT INTO public.notifications (
    recipient_id, title, message, type, related_id, week_number, action_url, sender_name
  ) VALUES (
    v_student_id,
    'Weekly Report Approved',
    'Your Week ' || v_week_num || ' SIWES report has been approved.',
    'report_approved',
    p_week_id,
    v_week_num,
    '/student/activity',
    'Institutional Coordinator'
  );

  SELECT to_jsonb(w.*) INTO v_res FROM public.logbook_weeks w WHERE w.id = p_week_id;
  RETURN v_res;
END;
$$;

-- 5. Atomic PostgreSQL Function: Return report and create notification
CREATE OR REPLACE FUNCTION public.return_weekly_report(
  p_week_id UUID,
  p_admin_id UUID,
  p_remark TEXT,
  p_feedback TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_student_id UUID;
  v_week_num INT;
  v_res JSONB;
BEGIN
  SELECT student_id, week_number INTO v_student_id, v_week_num
  FROM public.logbook_weeks
  WHERE id = p_week_id AND status = 'submitted'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Report not found or not in submitted status';
  END IF;

  UPDATE public.logbook_weeks
  SET status = 'returned',
      admin_remark = p_remark,
      reviewer_remarks = p_remark,
      admin_feedback = p_feedback,
      reviewed_at = timezone('utc'::text, now()),
      reviewed_by = p_admin_id,
      reviewer_id = p_admin_id,
      updated_at = timezone('utc'::text, now())
  WHERE id = p_week_id;

  INSERT INTO public.notifications (
    recipient_id, title, message, type, related_id, week_number, action_url, sender_name
  ) VALUES (
    v_student_id,
    'Weekly Report Returned',
    'Your Week ' || v_week_num || ' report has been returned for correction. Please review the administrator''s feedback.',
    'report_returned',
    p_week_id,
    v_week_num,
    '/student/activity',
    'Institutional Coordinator'
  );

  SELECT to_jsonb(w.*) INTO v_res FROM public.logbook_weeks w WHERE w.id = p_week_id;
  RETURN v_res;
END;
$$;
`;

/**
 * Seed demo weeks with realistic data covering all four workflow states:
 * - Approved (Week 1, Week 2)
 * - Submitted (Week 3)
 * - Returned (Week 4 - allows student to edit & resubmit with supervisor feedback)
 * - Draft (Week 5 - active week in progress)
 */
export const INITIAL_DEMO_WEEKS = [
  {
    id: 'demo-week-001',
    student_id: 'd4930092-0a64-41d7-af79-16dd85a4b68f',
    week_number: 1,
    start_date: '2026-03-02',
    end_date: '2026-03-06',
    status: 'approved' as const,
    submitted_at: '2026-03-06T17:00:00.000Z',
    reviewed_at: '2026-03-09T09:30:00.000Z',
    reviewer_id: 'dce626bd-3eba-4aef-97ce-45621dbf05f2',
    reviewer_remarks: 'Excellent start to your industrial training. Detailed records of network cabling, safety protocols, and switch configurations.',
    supervisor_grade: 'A',
    daily_activities: [
      {
        id: 'demo-act-1-1',
        week_id: 'demo-week-001',
        student_id: 'd4930092-0a64-41d7-af79-16dd85a4b68f',
        day_of_week: 'Monday' as const,
        date: '2026-03-02',
        title: 'Workplace Orientation and Safety Induction',
        activity: 'Attended the official NITDA IT Infrastructure department onboarding. Received standard operating procedure documents, security badges, and workplace safety guidelines. Introduced to the systems operations team and unit head.',
        tools_used: 'IT Safety Manual, Workstation setup, Access control keycard',
      },
      {
        id: 'demo-act-1-2',
        week_id: 'demo-week-001',
        student_id: 'd4930092-0a64-41d7-af79-16dd85a4b68f',
        day_of_week: 'Tuesday' as const,
        date: '2026-03-03',
        title: 'Local Area Network Architecture Inspection',
        activity: 'Shadowed the senior network engineer during server room walk-through. Inspected rack layouts, patch panels, distribution switches, and main distribution frame (MDF). Documented port mappings and network topology.',
        tools_used: 'Visio network diagrams, Cable toner, Fluke network tester',
      },
      {
        id: 'demo-act-1-3',
        week_id: 'demo-week-001',
        student_id: 'd4930092-0a64-41d7-af79-16dd85a4b68f',
        day_of_week: 'Wednesday' as const,
        date: '2026-03-04',
        title: 'Ethernet Cable Crimping and Continuity Testing',
        activity: 'Fabricated 12 Cat6 UTP patch cables using T568B standard color code. Crimped RJ-45 connectors and verified pin continuity, wire map, and signal integrity with a digital cable tester.',
        tools_used: 'Cat6 cable spool, RJ-45 modular plugs, crimping tool, wire stripper, continuity tester',
      },
      {
        id: 'demo-act-1-4',
        week_id: 'demo-week-001',
        student_id: 'd4930092-0a64-41d7-af79-16dd85a4b68f',
        day_of_week: 'Thursday' as const,
        date: '2026-03-05',
        title: 'Workstation OS Installation & Baseline Configuration',
        activity: 'Installed Ubuntu 24.04 LTS and Windows 11 Enterprise across 4 newly requisitioned workstations. Configured static IP addresses, corporate DNS, local administrative policies, and endpoint security agents.',
        tools_used: 'Bootable USB flash drives, Ventoy, Rufus, PowerShell, Bash scripting',
      },
      {
        id: 'demo-act-1-5',
        week_id: 'demo-week-001',
        student_id: 'd4930092-0a64-41d7-af79-16dd85a4b68f',
        day_of_week: 'Friday' as const,
        date: '2026-03-06',
        title: 'Weekly Maintenance Checklist & Departmental Debrief',
        activity: 'Conducted routine server room environmental monitoring (checking temperature, humidity, and UPS battery backup voltage). Prepared weekly SIWES summary report and reviewed findings with industry supervisor.',
        tools_used: 'UPS Management console, Environmental sensors, Google Docs',
      },
    ],
  },
  {
    id: 'demo-week-002',
    student_id: 'd4930092-0a64-41d7-af79-16dd85a4b68f',
    week_number: 2,
    start_date: '2026-03-09',
    end_date: '2026-03-13',
    status: 'approved' as const,
    submitted_at: '2026-03-13T16:45:00.000Z',
    reviewed_at: '2026-03-16T11:00:00.000Z',
    reviewer_id: 'dce626bd-3eba-4aef-97ce-45621dbf05f2',
    reviewer_remarks: 'Very thorough understanding of VLAN segmentation and switch CLI configuration demonstrated. Keep up the high standard.',
    supervisor_grade: 'A',
    daily_activities: [
      {
        id: 'demo-act-2-1',
        week_id: 'demo-week-002',
        student_id: 'd4930092-0a64-41d7-af79-16dd85a4b68f',
        day_of_week: 'Monday' as const,
        date: '2026-03-09',
        title: 'Cisco IOS Command-Line Configuration',
        activity: 'Accessed Cisco Catalyst 2960 switch via RS-232 serial console cable using PuTTY terminal emulator. Configured hostname, enable secret password, SSH v2 remote management, and console timeout parameters.',
        tools_used: 'Cisco Catalyst 2960 switch, RS-232 console cable, PuTTY',
      },
      {
        id: 'demo-act-2-2',
        week_id: 'demo-week-002',
        student_id: 'd4930092-0a64-41d7-af79-16dd85a4b68f',
        day_of_week: 'Tuesday' as const,
        date: '2026-03-10',
        title: 'Virtual LAN (VLAN) Segmentation',
        activity: 'Created VLAN 10 (Management), VLAN 20 (Staff), and VLAN 30 (Guests). Assigned access switchports to appropriate broadcast domains and verified isolation between subnets.',
        tools_used: 'Cisco IOS CLI, Wireshark, Ping/Traceroute',
      },
      {
        id: 'demo-act-2-3',
        week_id: 'demo-week-002',
        student_id: 'd4930092-0a64-41d7-af79-16dd85a4b68f',
        day_of_week: 'Wednesday' as const,
        date: '2026-03-11',
        title: '802.1Q Trunk Link Configuration',
        activity: 'Configured GigabitEthernet trunk ports connecting core switch to access switches using IEEE 802.1Q encapsulation. Configured allowed VLAN lists and verified trunk negotiation using show interfaces trunk.',
        tools_used: 'Cisco CLI, show interfaces trunk, Spanning Tree Protocol (STP)',
      },
      {
        id: 'demo-act-2-4',
        week_id: 'demo-week-002',
        student_id: 'd4930092-0a64-41d7-af79-16dd85a4b68f',
        day_of_week: 'Thursday' as const,
        date: '2026-03-12',
        title: 'DHCP Pool Configuration on Layer 3 Switch',
        activity: 'Configured DHCP server pools for each VLAN scope with default router, subnet mask, domain name, and DNS server options. Configured DHCP excluded-addresses for static network appliances.',
        tools_used: 'Layer 3 Cisco Switch, DHCP snooping, ipconfig /release /renew',
      },
      {
        id: 'demo-act-2-5',
        week_id: 'demo-week-002',
        student_id: 'd4930092-0a64-41d7-af79-16dd85a4b68f',
        day_of_week: 'Friday' as const,
        date: '2026-03-13',
        title: 'Network Performance Benchmarking & Log Documentation',
        activity: 'Conducted iperf3 throughput tests between workstations across different VLANs to measure routing latency. Documented results in the weekly logbook and submitted report for supervisor evaluation.',
        tools_used: 'iperf3, Wireshark, Excel analysis sheet',
      },
    ],
  },
  {
    id: 'demo-week-003',
    student_id: 'd4930092-0a64-41d7-af79-16dd85a4b68f',
    week_number: 3,
    start_date: '2026-03-16',
    end_date: '2026-03-20',
    status: 'submitted' as const,
    submitted_at: '2026-03-20T16:30:00.000Z',
    reviewed_at: null,
    reviewer_id: null,
    reviewer_remarks: null,
    supervisor_grade: null,
    daily_activities: [
      {
        id: 'demo-act-3-1',
        week_id: 'demo-week-003',
        student_id: 'd4930092-0a64-41d7-af79-16dd85a4b68f',
        day_of_week: 'Monday' as const,
        date: '2026-03-16',
        title: 'Linux Server Hardening and SSH Key Authentication',
        activity: 'Decommissioned password authentication on production Ubuntu servers in favor of Ed25519 public key cryptography. Configured UFW firewall to allow only necessary ingress ports (22, 80, 443).',
        tools_used: 'ssh-keygen, /etc/ssh/sshd_config, ufw, fail2ban',
      },
      {
        id: 'demo-act-3-2',
        week_id: 'demo-week-003',
        student_id: 'd4930092-0a64-41d7-af79-16dd85a4b68f',
        day_of_week: 'Tuesday' as const,
        date: '2026-03-17',
        title: 'Nginx Reverse Proxy & SSL/TLS Certificate Provisioning',
        activity: 'Deployed Nginx reverse proxy server to route incoming HTTPS traffic to internal microservices. Generated Let’s Encrypt certificates using Certbot and configured automated renewal crontabs.',
        tools_used: 'Nginx, Certbot, OpenSSL, curl, crontab',
      },
      {
        id: 'demo-act-3-3',
        week_id: 'demo-week-003',
        student_id: 'd4930092-0a64-41d7-af79-16dd85a4b68f',
        day_of_week: 'Wednesday' as const,
        date: '2026-03-18',
        title: 'Docker Containerization of Internal Portals',
        activity: 'Wrote multi-stage Dockerfiles for internal staff attendance application. Optimized image layers to reduce total footprint from 850MB to 120MB. Configured container restart policies and environment variables.',
        tools_used: 'Docker CLI, Dockerfile, Alpine Linux base images',
      },
      {
        id: 'demo-act-3-4',
        week_id: 'demo-week-003',
        student_id: 'd4930092-0a64-41d7-af79-16dd85a4b68f',
        day_of_week: 'Thursday' as const,
        date: '2026-03-19',
        title: 'Docker Compose Orchestration and Volume Persistence',
        activity: 'Authored docker-compose.yml orchestrating PostgreSQL database, Redis caching service, and Node.js backend. Configured named Docker volumes for persistent database storage across container restarts.',
        tools_used: 'docker-compose, PostgreSQL container, Redis container',
      },
      {
        id: 'demo-act-3-5',
        week_id: 'demo-week-003',
        student_id: 'd4930092-0a64-41d7-af79-16dd85a4b68f',
        day_of_week: 'Friday' as const,
        date: '2026-03-20',
        title: 'System Health Monitoring with Prometheus & Node Exporter',
        activity: 'Installed Node Exporter agent on host nodes and configured Prometheus metrics scraper. Set up alerts for high CPU utilization, disk space exhaustion, and out-of-memory events.',
        tools_used: 'Prometheus, Node Exporter, systemd service units',
      },
    ],
  },
  {
    id: 'demo-week-004',
    student_id: 'd4930092-0a64-41d7-af79-16dd85a4b68f',
    week_number: 4,
    start_date: '2026-03-23',
    end_date: '2026-03-27',
    status: 'returned' as const,
    submitted_at: '2026-03-27T17:15:00.000Z',
    reviewed_at: '2026-03-30T10:00:00.000Z',
    reviewer_id: 'dce626bd-3eba-4aef-97ce-45621dbf05f2',
    reviewer_remarks: 'Please elaborate on the Thursday entry regarding database replication and failover test procedures. State which commands were run to verify replica synchronization.',
    supervisor_grade: null,
    daily_activities: [
      {
        id: 'demo-act-4-1',
        week_id: 'demo-week-004',
        student_id: 'd4930092-0a64-41d7-af79-16dd85a4b68f',
        day_of_week: 'Monday' as const,
        date: '2026-03-23',
        title: 'PostgreSQL Relational Database Schema Design',
        activity: 'Designed relational database schemas for institutional record tracking. Defined foreign keys, unique indexes, and audit logging triggers using PL/pgSQL.',
        tools_used: 'PostgreSQL 16, pgAdmin 4, DBeaver',
      },
      {
        id: 'demo-act-4-2',
        week_id: 'demo-week-004',
        student_id: 'd4930092-0a64-41d7-af79-16dd85a4b68f',
        day_of_week: 'Tuesday' as const,
        date: '2026-03-24',
        title: 'Database Query Optimization and Index Tuning',
        activity: 'Analyzed slow SQL queries using EXPLAIN ANALYZE. Replaced sequential table scans with B-Tree composite indexes on filter and sorting columns, reducing query latency from 450ms to 8ms.',
        tools_used: 'EXPLAIN ANALYZE, pg_stat_statements, psql',
      },
      {
        id: 'demo-act-4-3',
        week_id: 'demo-week-004',
        student_id: 'd4930092-0a64-41d7-af79-16dd85a4b68f',
        day_of_week: 'Wednesday' as const,
        date: '2026-03-25',
        title: 'Automated Database Backup and Point-in-Time Recovery',
        activity: 'Wrote shell script to execute pg_dump logical backups nightly with gzip compression. Configured Write-Ahead Logging (WAL) archiving to remote storage for disaster recovery point-in-time restoration.',
        tools_used: 'pg_dump, WAL archiving, rsync, Bash, crontab',
      },
      {
        id: 'demo-act-4-4',
        week_id: 'demo-week-004',
        student_id: 'd4930092-0a64-41d7-af79-16dd85a4b68f',
        day_of_week: 'Thursday' as const,
        date: '2026-03-26',
        title: 'Database Replication Setup',
        activity: 'Configured streaming replication between primary and standby database nodes.',
        tools_used: 'PostgreSQL standby mode, pg_basebackup',
      },
      {
        id: 'demo-act-4-5',
        week_id: 'demo-week-004',
        student_id: 'd4930092-0a64-41d7-af79-16dd85a4b68f',
        day_of_week: 'Friday' as const,
        date: '2026-03-27',
        title: 'Connection Pooling with PgBouncer',
        activity: 'Installed and configured PgBouncer connection pooler in transaction pooling mode. Tested concurrent client connections to evaluate connection memory overhead.',
        tools_used: 'PgBouncer, pgbench benchmark tool',
      },
    ],
  },
  {
    id: 'demo-week-005',
    student_id: 'd4930092-0a64-41d7-af79-16dd85a4b68f',
    week_number: 5,
    start_date: '2026-03-30',
    end_date: '2026-04-03',
    status: 'draft' as const,
    submitted_at: null,
    reviewed_at: null,
    reviewer_id: null,
    reviewer_remarks: null,
    supervisor_grade: null,
    daily_activities: [
      {
        id: 'demo-act-5-1',
        week_id: 'demo-week-005',
        student_id: 'd4930092-0a64-41d7-af79-16dd85a4b68f',
        day_of_week: 'Monday' as const,
        date: '2026-03-30',
        title: 'API Gateway Integration and Routing',
        activity: 'Configured API Gateway routing rules for backend service endpoints. Implemented rate limiting and token bucket throttling policies to prevent DDoS attacks.',
        tools_used: 'Kong Gateway, Postman, curl',
      },
      {
        id: 'demo-act-5-2',
        week_id: 'demo-week-005',
        student_id: 'd4930092-0a64-41d7-af79-16dd85a4b68f',
        day_of_week: 'Tuesday' as const,
        date: '2026-03-31',
        title: 'JWT Authentication Middleware Implementation',
        activity: 'Implemented JWT token verification middleware in TypeScript. Handled access token validation, claims decoding, and automatic refresh token rotation flow.',
        tools_used: 'TypeScript, jsonwebtoken, Postman API test runner',
      },
      {
        id: 'demo-act-5-3',
        week_id: 'demo-week-005',
        student_id: 'd4930092-0a64-41d7-af79-16dd85a4b68f',
        day_of_week: 'Wednesday' as const,
        date: '2026-04-01',
        title: '',
        activity: '',
        tools_used: '',
      },
      {
        id: 'demo-act-5-4',
        week_id: 'demo-week-005',
        student_id: 'd4930092-0a64-41d7-af79-16dd85a4b68f',
        day_of_week: 'Thursday' as const,
        date: '2026-04-02',
        title: '',
        activity: '',
        tools_used: '',
      },
      {
        id: 'demo-act-5-5',
        week_id: 'demo-week-005',
        student_id: 'd4930092-0a64-41d7-af79-16dd85a4b68f',
        day_of_week: 'Friday' as const,
        date: '2026-04-03',
        title: '',
        activity: '',
        tools_used: '',
      },
    ],
  },
];

