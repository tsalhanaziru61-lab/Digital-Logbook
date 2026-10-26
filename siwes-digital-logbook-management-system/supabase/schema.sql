-- ==============================================================================
-- SIWES DIGITAL LOGBOOK MANAGEMENT SYSTEM — PROFILES SCHEMA & RLS
-- Module 02 & Module 03: User Profile & Role-Based Access Control
-- ==============================================================================

-- 1. Create User Role Enum
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

-- ==============================================================================
-- Module 11: Internal Notifications & Review Feedback System
-- ==============================================================================

-- 7. Create Notifications Table
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

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own notification read state" ON public.notifications;
CREATE POLICY "Users can update own notification read state"
  ON public.notifications FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;
CREATE POLICY "Admins can insert notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread ON public.notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- 8. Atomic PostgreSQL Function: Approve report and create notification
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

-- 9. Atomic PostgreSQL Function: Return report and create notification
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
