# SIWES Digital Logbook Management System

A production-grade web application digitally replacing the traditional physical Students Industrial Work Experience Scheme (SIWES) logbook.

The system empowers students to log daily technical tasks, organize them into weekly 5-day reports, and submit them directly to institutional administrators and industrial coordinators for verification, grading, and structured feedback.

---

## 📌 Project Status: **All 12 Modules Completed (Production Ready)**

> **Milestone Achieved**: The complete **SIWES Digital Logbook Management System** has been fully implemented, audited, and verified from **Module 01 to Module 12**.
> Both student and institutional administrator portals are fully operational with PostgreSQL Row Level Security (RLS), real-time notifications, 5-day daily activity tracking, 24-week timeline overviews, administrative report review queues, and zero build or lint warnings.

### Comprehensive 12-Module Implementation Matrix
- [x] **Module 01: Project Foundation & Development Environment** (Completed)
- [x] **Module 02: Supabase Database Architecture & Relational DDL** (Completed)
- [x] **Module 03: Authentication & Role-Based Access Control** (Completed)
- [x] **Module 04: Application Layout Shells & Responsive Navigation** (Completed)
- [x] **Module 05: Student Profile Management & Placement Details** (Completed)
- [x] **Module 06: Student Daily Activity & 5-Day Weekly Logbook** (Completed)
- [x] **Module 07: Student Dashboard & 24-Week SIWES Progress** (Completed)
- [x] **Module 08: Admin Student Management & Provisioning** (Completed)
- [x] **Module 09: Admin Weekly Report Review & Remarks** (Completed)
- [x] **Module 10: Admin Dashboard & Institution SIWES Overview** (Completed)
- [x] **Module 11: Internal Notifications & Review Feedback System** (Completed)
- [x] **Module 12: Finalization, Security Audit & Deployment Preparation** (Completed)


---

## 🔐 Authentication & Role-Based Access Control (Module 03)

### 1. Architectural Model
Authentication is governed by Supabase Auth with PostgreSQL Row Level Security (RLS) backing the `profiles` table:

```text
User signs in (Email & Password)
       ↓
Supabase Auth verifies credentials & issues JWT Session
       ↓
Application queries `profiles` table by user.id (UUID)
       ↓
Role retrieved ('student' | 'admin')
       ↓
RBAC Route Guards enforce clearance (ProtectedRoute / RoleRoute)
```

### 2. Supported Roles
The system strictly enforces two non-overlapping roles:
- **`student`**: Undergraduate student undergoing industrial attachment. Gains access to log daily activities (Mon–Fri), save local draft logs, compile weekly 5-day reports, and view coordinator remarks.
- **`admin`**: Institutional SIWES coordinator / university supervisor. Gains access to review submitted logs, enter remarks and grades, and provision student accounts.

### 3. Policy on Public Registration
> **Strict Requirement**: Public student registration is **disabled**.
Under SIWES institutional regulations, student accounts must be created and provisioned exclusively by authorized institutional administrators (handled in Module 10). Students receive their credentials directly from their institution.

### 4. Route Protection Hierarchy
- `ProtectedRoute` (`src/components/auth/ProtectedRoute.tsx`): Blocks unauthenticated access with accessible loading skeletons.
- `RoleRoute` (`src/components/auth/RoleRoute.tsx`): Validates whether the authenticated user has clearance for specific roles (`allowedRoles`).
- `AccessDenied` (`src/components/auth/AccessDenied.tsx`): Displays a clean HTTP 403 Forbidden screen detailing the user's role vs the required clearance, with an easy action to return to their permitted portal.

### 5. Missing Profile & Invalid Role Handling
- **Missing Profile**: If a user is authenticated via Supabase Auth but has no entry in the `profiles` table, privileged access is refused. The role is **never** defaulted to `admin`. The user is informed to contact their coordinator.
- **Invalid Role**: If a profile contains an unsupported role string, access is revoked with a 403 notice and sign-out option.

---

## 🛠️ Technology Stack

* **Frontend Framework**: React 19 (Functional Components & Hooks)
* **Language & Type System**: TypeScript 5 (Strict Mode)
* **Build System & Dev Server**: Vite 8
* **Styling**: Tailwind CSS v4
* **Backend & Database**: Supabase (PostgreSQL, Supabase Auth, RLS)
* **Code Quality**: ESLint (Flat Config) & `tsc` type-checking
* **Icons**: Lucide React
* **Deployment Target**: Vercel / Cloud Run ready

---

## ⚙️ Environment Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your Supabase project credentials:
   ```env
   VITE_SUPABASE_URL="https://your-project-id.supabase.co"
   VITE_SUPABASE_ANON_KEY="your-anon-public-key-here"
   VITE_APP_NAME="SIWES Digital Logbook Management System"
   ```

> ⚠️ **CRITICAL SECURITY NOTE**: Never place your Supabase `service_role` key in frontend code or `.env` files. In Vite, `VITE_*` variables are bundled into browser-accessible code. The `service_role` key bypasses all Row Level Security and must only reside in secure backend environments.

---

## 🗄️ Database Setup & Profiles DDL

To provision the `profiles` table with Row Level Security in Supabase:
1. Open your [Supabase Dashboard](https://supabase.com/dashboard) → **SQL Editor**.
2. Run the script located in `supabase/schema.sql`:

```sql
CREATE TYPE user_role AS ENUM ('student', 'admin');

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

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
```

---

## 🧑‍💼 Secure Initial Administrator Creation

To create the initial administrator securely without public signup:
1. In the Supabase Dashboard, go to **Authentication** → **Users** → **Add User**.
2. Enter the administrator's email and password (e.g., `admin@siwes.edu.ng`).
3. In the **SQL Editor**, insert the corresponding administrative profile:
   ```sql
   INSERT INTO public.profiles (id, email, full_name, role, department, institution)
   VALUES (
     '<USER_UUID_FROM_AUTH_USERS>',
     'admin@siwes.edu.ng',
     'Dr. Elizabeth Nnamani',
     'admin',
     'Directorate of Industrial Training & SIWES',
     'Federal University of Technology'
   );
   ```
4. The administrator can now sign in with full coordinator access.

---

## 🧪 Testing Scenarios (Module 03)

| # | Test Scenario | Expected Outcome |
|---|---------------|------------------|
| 1 | Student Login | Profile resolved, `role = 'student'`, Student Portal displayed. |
| 2 | Admin Login | Profile resolved, `role = 'admin'`, Admin Portal displayed. |
| 3 | Invalid Login | Form validation displays "Invalid email or password." |
| 4 | Protected Route (Anonymous) | Redirected or shown login prompt. |
| 5 | Student accesses Admin route | Blocked by `RoleRoute` with HTTP 403 Forbidden screen. |
| 6 | Admin accesses Student route | Blocked by `RoleRoute` with HTTP 403 Forbidden screen. |
| 7 | Logout | Session cleared, user redirected to Login form. |
| 8 | Page Refresh | Session re-hydrated from Supabase storage; user remains logged in. |
| 9 | Missing Profile | Access blocked with "Application Profile Missing" warning. |
| 10 | Password Reset | "Forgot password?" sends reset link to specified institutional email. |

---

## 📋 Admin Weekly Report Review & Remarks (Module 09)

### 1. Architectural Workflow
The administrator weekly report review system governs the institutional evaluation of submitted SIWES logbooks:

```text
Student Submits 5-Day Weekly Report (Status = 'submitted')
       ↓
Appears in Administrator Review Queue (/admin/reports, prioritized)
       ↓
Administrator opens report & inspects Monday–Friday activities
       ↓
Administrator selects Remark & enters Constructive Feedback
       ├── APPROVE ──► Status = 'approved', stamped with reviewed_at & reviewed_by (Report LOCKED)
       └── RETURN  ──► Status = 'returned', feedback saved, unlocked for student revision in Module 06
```

### 2. Status Transitions & Restrictions
- `draft`: Editable by student. **Cannot** be approved or returned by administrator.
- `submitted`: Locked from student editing. Fully reviewable by authenticated administrator.
- `approved`: Immutable. Both student and administrator can view. Locked from further editing.
- `returned`: Unlocked for student to revise their 5-day daily entries based on feedback. Resubmitting transitions status back to `submitted`.

### 3. Review Fields & Validation
- `admin_remark`: Controlled presets (`Excellent`, `Very Good`, `Good`, `Satisfactory`, `Needs Improvement`, `Poor`) or custom input. Mandatory for approval.
- `admin_feedback`: Textarea for constructive feedback. Mandatory (minimum 5 characters) when returning a report.
- `reviewed_at`: Server/database ISO timestamp recording the exact time of evaluation.
- `reviewed_by`: Authenticated administrator ID derived directly from the active session. Cannot be spoofed from client input.

### 4. Confirmation Safeguards
Workflow-changing actions are protected by modal confirmation dialogs:
- **Approval Modal**: Warns that the report will become permanently immutable for the student.
- **Return Modal**: Displays the exact constructive feedback the student will receive to guide their revisions.

### 5. Security & Authorization
- Route clearance enforced by `AdminLayout` and `useAuth` (`role === 'admin'`).
- Students attempting to access `/admin/reports` receive HTTP 403 Forbidden.
- Supabase RLS enforces that only users with `role = 'admin'` can update `status`, `admin_remark`, `admin_feedback`, `reviewed_at`, and `reviewed_by`.
- Daily activity records cannot be modified through the review interface.

---

## 🔔 Internal Notifications & Review Feedback System (Module 11)

### 1. Architecture Overview
Module 11 implements a native, database-driven internal notification and feedback loop between students and institutional administrators using Supabase:

```text
Student Submits Report (Module 06)
       │
       ▼
Admin Notification Created ('report_submitted' or 'report_resubmitted')
       │
       ▼
Admin Inspects 5-Day Daily Activities (Module 09)
       │
       ├── APPROVE ──► Report Status = 'approved' + Student Notification ('report_approved')
       └── RETURN  ──► Report Status = 'returned' + Student Notification ('report_returned')
                             │
                             ▼
              Student Receives Feedback in Daily Activity View
                             │
                             ▼
              Student Corrects 5-Day Logs & Resubmits
                             │
                             ▼
              Admin Notification Created ('report_resubmitted')
```

### 2. Controlled Notification Types
To prevent arbitrary input or uncontrolled client notification states, the system enforces controlled notification types:
- `report_approved`: Dispatched to student when their weekly report is officially endorsed.
- `report_returned`: Dispatched to student when their report is returned for correction, including coordinator remarks and instructions.
- `report_resubmitted`: Dispatched to coordinator when a student corrects and resubmits their returned report.
- `report_submitted`: Dispatched to coordinator when a new 5-day weekly report is submitted for review.
- `general`: System announcements and administrative notices.

### 3. Student & Admin Notification Views
- **Student Portal (`/student/notifications`)**:
  - Filter by `All`, `Unread`, and `Read` states, with notification type filtering.
  - Formatted relative and calendar timestamps (`2 hours ago`, `30 Sep 2026, 8:30 PM`).
  - Distinct unread indicators (bold text, emerald border, and "New" badge).
  - Direct **"View Report"** action that deep-links directly to the flagged week's 5-day log.
  - "Mark All as Read" action.
- **Coordinator Portal (`/admin/notifications`)**:
  - Operational queue of submissions and resubmissions.
  - Direct **"Review Report"** action that navigates to `/admin/reports` with review controls.
- **Top Navigation Bar (`Navbar.tsx`)**:
  - Real-time unread badge counter (`unreadCount > 9 ? '9+' : unreadCount`).
  - Accessible screen reader label (`"3 unread notifications"` or `"No unread notifications"`).
  - Instant synchronization via `notificationService.subscribe()`.

### 4. Transactional Consistency & PostgreSQL RPCs
To avoid desynchronization (e.g. report approved without a notification, or notification created without report status change), the system implements atomic PostgreSQL functions in `supabase/schema.sql`:
- `public.approve_weekly_report(p_week_id, p_admin_id, p_remark, p_feedback)`: Locks the report row, updates status to `approved`, stamps timestamps, and inserts the `report_approved` notification in a single transaction.
- `public.return_weekly_report(p_week_id, p_admin_id, p_remark, p_feedback)`: Locks the report row, updates status to `returned`, records mandatory feedback, and inserts the `report_returned` notification in a single transaction.
- Server-side Express endpoints (`/api/admin/reports/:id/approve` and `/api/admin/reports/:id/return`) execute atomic report and notification persistence.

### 5. Resubmission Workflow (Section 12)
- When a student resubmits a returned report, status transitions to `submitted`.
- Prior review information (`admin_remark`, `reviewed_at`, `reviewer_id`) is reset so old evaluation records do not appear as current reviews.
- Coordinator review controls become active again for the fresh review cycle.
- A `report_resubmitted` notification is automatically generated for administrators.

### 6. Row Level Security (RLS) Policies
- `SELECT`: `USING (recipient_id = auth.uid())` — Students can only view their own notifications; administrators only receive administrative alerts.
- `UPDATE`: `USING (recipient_id = auth.uid()) WITH CHECK (recipient_id = auth.uid())` — Users can only update their own notifications' read state.
- `INSERT`: Strictly restricted to authenticated administrators and security-definer database triggers/functions. Students cannot forge or send notifications to themselves or other students.

---

## 📊 Administrator Dashboard & SIWES Overview (Module 10)

The Admin Dashboard (`/admin/dashboard`) provides real-time oversight of the entire institution's SIWES programme:

- **Operational Metrics**:
  - **Total Registered Students**: Live count from `profiles` where `role = 'student'`.
  - **Reports Awaiting Review**: Reports with `status = 'submitted'` requiring urgent coordinator grading.
  - **Approved Reports**: Count of verified, completed weekly reports.
  - **Returned Reports**: Reports requiring student correction.
- **Priority Attention Queue**: Direct preview list of pending student submissions with matric numbers, submission timestamps, and direct "Review" deep-links.
- **Departmental Distribution**: Progress breakdown across Academic Departments (Computer Science, Mechanical Engineering, Electrical, etc.).
- **Recent Administrative Activity**: Live audit stream of reviews, approvals, returns, and student resubmissions.

---

## 🛡️ Security Audit & Production Hardening (Module 12)

### 1. Zero Secrets in Client Bundle
- Supabase anonymous key (`VITE_SUPABASE_ANON_KEY`) is strictly limited to public client actions guarded by Row Level Security.
- The high-privilege `SUPABASE_SERVICE_ROLE_KEY` is **never** loaded in browser client code or prefixed with `VITE_`.
- Administrative user provisioning runs on a dedicated secure Express route (`/api/admin/provision-student`) verifying admin credentials before invoking admin auth methods.

### 2. Row Level Security (RLS) Coverage Matrix
| Table | Role | SELECT | INSERT | UPDATE | DELETE |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`profiles`** | Student | Own profile (`auth.uid() = id`) | Server-only | Own profile | Prohibited |
| | Admin | All student & admin profiles | Server-only | All student profiles | Server-only |
| **`logbook_weeks`** | Student | Own logbook weeks | Own logbook weeks | Own draft / returned weeks | Prohibited |
| | Admin | All logbook weeks | Prohibited | Status & review remark fields | Prohibited |
| **`daily_activities`** | Student | Activities in own weeks | Activities in own weeks | Activities in own draft/returned weeks | Prohibited |
| | Admin | All activities | Prohibited | Prohibited (immutable logbook audit) | Prohibited |
| **`notifications`** | Student | Own notifications (`auth.uid() = recipient_id`) | Prohibited (via RPC) | Own notification `is_read` | Prohibited |
| | Admin | Admin notifications | Prohibited (via RPC) | Admin notification `is_read` | Prohibited |

### 3. Atomic Database Transactions
Weekly report approvals and returns are executed via PostgreSQL stored procedures (`approve_weekly_report` and `return_weekly_report`) inside `supabase/schema.sql`, guaranteeing atomic status updates and notification generation with zero orphan records.

---

## 🌐 Production Deployment Guide

### A. Supabase Database Setup
1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase Dashboard.
3. Copy the entire contents of `supabase/schema.sql`.
4. Run the SQL script to create all tables (`profiles`, `logbook_weeks`, `daily_activities`, `notifications`), triggers, RLS policies, and RPC functions.

### B. Vercel Deployment Setup
The project includes a ready-to-deploy `vercel.json` with SPA routing configuration.

1. Connect your repository to [Vercel](https://vercel.com).
2. Set the Framework Preset to **Vite**.
3. Configure the following Environment Variables in the Vercel Project Settings:
   - `VITE_SUPABASE_URL`: `https://<your-project-id>.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `<your-supabase-anon-key>`
   - `SUPABASE_SERVICE_ROLE_KEY`: `<your-supabase-service-role-key>` (Used for server-side provisioning)
4. Trigger deploy:
   ```bash
   vercel --prod
   ```

---

## 🚀 Available Commands

```bash
npm run dev        # Launch development server on port 3000
npm run lint       # Run ESLint analysis
npm run typecheck  # Run TypeScript strict type-checking
npm run build      # Compile production bundle with Vite into /dist
```

