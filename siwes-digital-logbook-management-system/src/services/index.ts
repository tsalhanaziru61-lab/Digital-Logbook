/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Service Layer Foundation
 *
 * This directory will contain modular domain services for data communication:
 * - `auth.service.ts`: Sign-in, sign-up, sign-out, session tracking (Module 03).
 * - `student.service.ts`: Student profile and enrollment operations (Module 05).
 * - `logbook.service.ts`: Daily activity CRUD and draft saves (Module 07).
 * - `report.service.ts`: Weekly report aggregation and submissions (Module 08).
 * - `admin.service.ts`: Coordinator inspection, grading, remarks (Module 09-12).
 *
 * All service functions will interact with Supabase via `src/lib/supabase.ts`.
 */

export * from '../lib/supabase';
export * from './auth.service';
export * from './student.service';
export * from './logbook.service';
export * from './admin.service';
export * from './reportReviewService';
export * from './notificationService';
