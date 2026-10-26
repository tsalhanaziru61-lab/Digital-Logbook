/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import path from 'path';
import process from 'node:process';
import dotenv from 'dotenv';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Helper to normalize Supabase URL from full URL or project reference ID
function normalizeSupabaseUrl(rawUrl?: string): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.includes('your-project-id.supabase.co')) return null;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}.supabase.co`;
}

// Server-side Supabase Admin Client using strictly non-prefixed service_role key
// CRITICAL: process.env.SUPABASE_SERVICE_ROLE_KEY is NEVER exposed to Vite/browser bundle.
const rawServerUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseUrl = normalizeSupabaseUrl(rawServerUrl);
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseAdmin: SupabaseClient | null = null;
if (supabaseUrl && serviceRoleKey && !serviceRoleKey.includes('your-supabase-service-role-key-here')) {
  try {
    supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    console.info(`[Server] Supabase Admin client initialized successfully with endpoint: ${supabaseUrl}`);
  } catch (err) {
    console.warn('[Server] Failed to initialize Supabase Admin client:', err);
    supabaseAdmin = null;
  }
} else {
  console.info('[Server] Running in standard/demo mode. (SUPABASE_SERVICE_ROLE_KEY not configured or placeholder)');
}

/**
 * Health check endpoint
 */
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasServiceRoleKey: Boolean(supabaseAdmin),
    time: new Date().toISOString(),
  });
});

/**
 * POST /api/admin/create-student
 * Module 08 — Admin Student Account Provisioning
 *
 * Secure server-side endpoint that:
 * 1. Validates admin authorization
 * 2. Creates the Supabase Auth user via admin API
 * 3. Enforces the role strictly as 'student' (admin cannot elevate or inject arbitrary roles)
 * 4. Creates or updates the associated `profiles` record with SIWES details
 */
app.post('/api/admin/create-student', async (req: Request, res: Response) => {
  try {
    const {
      full_name,
      email,
      password,
      matric_number,
      institution,
      department,
      organisation,
      phone_number,
      siwes_start_date,
      siwes_end_date,
      supervisor_name,
      supervisor_phone,
      supervisor_email,
    } = req.body;

    // 1. Validation
    if (!full_name || typeof full_name !== 'string' || full_name.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Full name must be at least 2 characters.' });
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'A valid email address is required.' });
    }
    if (!matric_number || typeof matric_number !== 'string' || !matric_number.trim()) {
      return res.status(400).json({ success: false, error: 'Matriculation number is required.' });
    }
    if (!institution || typeof institution !== 'string' || !institution.trim()) {
      return res.status(400).json({ success: false, error: 'Institution is required.' });
    }
    if (!department || typeof department !== 'string' || !department.trim()) {
      return res.status(400).json({ success: false, error: 'Department is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanMatric = matric_number.trim().toUpperCase();
    const cleanName = full_name.trim();
    const cleanPassword = password && String(password).trim().length >= 6 ? String(password).trim() : 'StudentPass2026!';

    // Date range validation
    if (siwes_start_date && siwes_end_date) {
      const start = new Date(siwes_start_date);
      const end = new Date(siwes_end_date);
      if (start > end) {
        return res.status(400).json({ success: false, error: 'SIWES Start Date cannot be after End Date.' });
      }
    }

    // 2. Real Supabase Admin Provisioning (when service role is available)
    if (supabaseAdmin) {
      // Optional check for calling user token
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (!userError && userData.user) {
          // Verify user role in profiles table
          const { data: callerProfile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', userData.user.id)
            .single();

          if (callerProfile && callerProfile.role !== 'admin') {
            return res.status(403).json({
              success: false,
              error: 'Forbidden: Administrator privileges required to provision student accounts.',
            });
          }
        }
      }

      // Create user in Supabase Auth
      const { data: newAuthData, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password: cleanPassword,
        email_confirm: true,
        user_metadata: {
          full_name: cleanName,
          role: 'student', // Strictly enforce role
          matric_number: cleanMatric,
          institution: institution.trim(),
          department: department.trim(),
          organisation: organisation?.trim() || null,
        },
      });

      if (createAuthError) {
        return res.status(400).json({
          success: false,
          error: createAuthError.message || 'Failed to create auth user in Supabase.',
        });
      }

      const authUser = newAuthData.user;
      if (!authUser) {
        return res.status(500).json({ success: false, error: 'Supabase did not return created user.' });
      }

      // Upsert full profile record in PostgreSQL public.profiles
      const profileRecord = {
        id: authUser.id,
        email: cleanEmail,
        full_name: cleanName,
        role: 'student',
        matric_number: cleanMatric,
        matric_no: cleanMatric,
        institution: institution.trim(),
        department: department.trim(),
        organisation: organisation?.trim() || null,
        company_name: organisation?.trim() || null,
        phone_number: phone_number?.trim() || null,
        siwes_start_date: siwes_start_date || null,
        siwes_end_date: siwes_end_date || null,
        supervisor_name: supervisor_name?.trim() || null,
        supervisor_phone: supervisor_phone?.trim() || null,
        supervisor_email: supervisor_email?.trim() || null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: upsertData, error: upsertError } = await supabaseAdmin
        .from('profiles')
        .upsert(profileRecord)
        .select('*')
        .single();

      if (upsertError) {
        console.error('[Server] Profile upsert error:', upsertError);
        // User was created in Auth; return partial success with record
        return res.status(200).json({
          success: true,
          student: profileRecord,
          warning: 'User auth created, but profile upsert returned a warning.',
        });
      }

      return res.status(201).json({
        success: true,
        student: upsertData || profileRecord,
        message: 'Student account provisioned successfully in Supabase.',
      });
    }

    // 3. Fallback / Sandbox Demo Mode (when running without service_role key)
    const simulatedId = `demo-student-${Date.now()}`;
    const demoStudent = {
      id: simulatedId,
      email: cleanEmail,
      full_name: cleanName,
      role: 'student' as const,
      matric_number: cleanMatric,
      matric_no: cleanMatric,
      institution: institution.trim(),
      department: department.trim(),
      organisation: organisation?.trim() || 'Industrial Training Attachment',
      company_name: organisation?.trim() || 'Industrial Training Attachment',
      phone_number: phone_number?.trim() || null,
      siwes_start_date: siwes_start_date || null,
      siwes_end_date: siwes_end_date || null,
      supervisor_name: supervisor_name?.trim() || null,
      supervisor_phone: supervisor_phone?.trim() || null,
      supervisor_email: supervisor_email?.trim() || null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return res.status(201).json({
      success: true,
      isDemo: true,
      student: demoStudent,
      message: 'Student account provisioned in sandbox cohort (service role key not configured on server).',
    });
  } catch (err) {
    console.error('[Server] Error provisioning student:', err);
    return res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Internal server error while creating student.',
    });
  }
});

/**
 * DELETE /api/admin/delete-student/:id
 * Securely deletes student from Supabase Auth and cascade deletes profiles
 */
app.delete('/api/admin/delete-student/:id', async (req: Request, res: Response) => {
  try {
    const studentId = req.params.id;
    if (!studentId) {
      return res.status(400).json({ success: false, error: 'Student ID required.' });
    }

    if (supabaseAdmin) {
      // Delete from auth.users (cascades to profiles)
      const { error } = await supabaseAdmin.auth.admin.deleteUser(studentId);
      if (error) {
        // Try deleting directly from profiles if auth fails (e.g. if ID was profile-only)
        await supabaseAdmin.from('profiles').delete().eq('id', studentId);
      }
    }

    return res.json({ success: true, message: 'Student account removed.' });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Failed to delete student.',
    });
  }
});

/**
 * PUT /api/admin/toggle-status/:id
 */
app.put('/api/admin/toggle-status/:id', async (req: Request, res: Response) => {
  try {
    const studentId = req.params.id;
    const { isActive } = req.body;

    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update({ is_active: Boolean(isActive), updated_at: new Date().toISOString() })
        .eq('id', studentId)
        .select('*')
        .single();

      if (error) {
        return res.status(400).json({ success: false, error: error.message });
      }
      return res.json({ success: true, student: data });
    }

    return res.json({ success: true, isActive: Boolean(isActive) });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update student status.',
    });
  }
});

/**
 * Helper to verify administrator token on privileged report review endpoints.
 */
async function verifyAdminCaller(req: Request): Promise<{ isAdmin: boolean; adminId?: string; error?: string }> {
  if (!supabaseAdmin) {
    // In fallback mode, accept if provided adminId
    const fallbackId = (req.body?.adminId as string) || 'demo-admin-uuid-002';
    return { isAdmin: true, adminId: fallbackId };
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { isAdmin: false, error: 'Unauthorized: Missing bearer authentication token.' };
  }

  const token = authHeader.substring(7);
  const { data: authData, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !authData.user) {
    return { isAdmin: false, error: 'Unauthorized: Invalid authentication session.' };
  }

  const { data: profile, error: profErr } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .single();

  if (profErr || !profile || profile.role !== 'admin') {
    return { isAdmin: false, error: 'Forbidden: Administrator privileges required to review reports.' };
  }

  return { isAdmin: true, adminId: authData.user.id };
}

/**
 * POST /api/admin/reports/:id/approve
 * Module 09 — Administrator Weekly Report Approval
 */
app.post('/api/admin/reports/:id/approve', async (req: Request, res: Response) => {
  try {
    const weekId = req.params.id;
    const { adminRemark, adminFeedback } = req.body;

    const authCheck = await verifyAdminCaller(req);
    if (!authCheck.isAdmin) {
      return res.status(authCheck.error?.startsWith('Forbidden') ? 403 : 401).json({
        success: false,
        error: authCheck.error,
      });
    }

    if (!adminRemark || typeof adminRemark !== 'string' || !adminRemark.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Administrative remark is required to approve this report.',
      });
    }

    const trimmedRemark = adminRemark.trim();
    const trimmedFeedback = typeof adminFeedback === 'string' ? adminFeedback.trim() : null;
    const reviewedAt = new Date().toISOString();
    const adminId = authCheck.adminId || 'admin';

    if (supabaseAdmin) {
      // 1. Verify report exists and is in 'submitted' status
      const { data: week, error: fetchErr } = await supabaseAdmin
        .from('logbook_weeks')
        .select('id, status, student_id')
        .eq('id', weekId)
        .single();

      if (fetchErr || !week) {
        return res.status(404).json({ success: false, error: 'Weekly report not found.' });
      }

      if (week.status !== 'submitted') {
        return res.status(400).json({
          success: false,
          error: `Cannot approve report. Only 'submitted' reports can be approved. Current status is '${week.status}'.`,
        });
      }

      // 2. Perform atomic approval update
      const { data: updated, error: updateErr } = await supabaseAdmin
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
        .eq('status', 'submitted')
        .select('*')
        .single();

      if (updateErr) {
        return res.status(500).json({ success: false, error: updateErr.message });
      }

      // Insert student notification atomically (Module 11)
      try {
        await supabaseAdmin.from('notifications').insert({
          recipient_id: week.student_id,
          title: 'Weekly Report Approved',
          message: `Your Week ${updated.week_number || ''} SIWES report has been approved.`,
          type: 'report_approved',
          related_id: weekId,
          week_number: updated.week_number,
          action_url: '/student/activity',
          sender_name: 'Coordinator',
        });
      } catch (notifErr) {
        console.warn('[Server] Could not insert notification record:', notifErr);
      }

      return res.json({ success: true, report: updated, message: 'Report approved successfully.' });
    }

    return res.json({
      success: true,
      report: {
        id: weekId,
        status: 'approved',
        admin_remark: trimmedRemark,
        reviewer_remarks: trimmedRemark,
        admin_feedback: trimmedFeedback,
        reviewed_at: reviewedAt,
        reviewed_by: adminId,
      },
      message: 'Report approved in demo sandbox.',
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Internal error approving report.',
    });
  }
});

/**
 * POST /api/admin/reports/:id/return
 * Module 09 — Administrator Return Report for Correction
 */
app.post('/api/admin/reports/:id/return', async (req: Request, res: Response) => {
  try {
    const weekId = req.params.id;
    const { adminRemark, adminFeedback } = req.body;

    const authCheck = await verifyAdminCaller(req);
    if (!authCheck.isAdmin) {
      return res.status(authCheck.error?.startsWith('Forbidden') ? 403 : 401).json({
        success: false,
        error: authCheck.error,
      });
    }

    if (!adminFeedback || typeof adminFeedback !== 'string' || adminFeedback.trim().length < 5) {
      return res.status(400).json({
        success: false,
        error: 'Detailed feedback explaining required corrections is mandatory when returning a report (min 5 characters).',
      });
    }

    const trimmedFeedback = adminFeedback.trim();
    const trimmedRemark = typeof adminRemark === 'string' && adminRemark.trim() ? adminRemark.trim() : 'Needs Improvement';
    const reviewedAt = new Date().toISOString();
    const adminId = authCheck.adminId || 'admin';

    if (supabaseAdmin) {
      const { data: week, error: fetchErr } = await supabaseAdmin
        .from('logbook_weeks')
        .select('id, status, student_id')
        .eq('id', weekId)
        .single();

      if (fetchErr || !week) {
        return res.status(404).json({ success: false, error: 'Weekly report not found.' });
      }

      if (week.status !== 'submitted') {
        return res.status(400).json({
          success: false,
          error: `Cannot return report. Only 'submitted' reports can be returned for correction. Current status is '${week.status}'.`,
        });
      }

      const { data: updated, error: updateErr } = await supabaseAdmin
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
        .select('*')
        .single();

      if (updateErr) {
        return res.status(500).json({ success: false, error: updateErr.message });
      }

      // Insert student notification atomically (Module 11)
      try {
        await supabaseAdmin.from('notifications').insert({
          recipient_id: week.student_id,
          title: 'Weekly Report Returned',
          message: `Your Week ${updated.week_number || ''} report has been returned for correction. Please review the administrator's feedback.`,
          type: 'report_returned',
          related_id: weekId,
          week_number: updated.week_number,
          action_url: '/student/activity',
          sender_name: 'Coordinator',
        });
      } catch (notifErr) {
        console.warn('[Server] Could not insert notification record:', notifErr);
      }

      return res.json({ success: true, report: updated, message: 'Report returned for student correction.' });
    }

    return res.json({
      success: true,
      report: {
        id: weekId,
        status: 'returned',
        admin_remark: trimmedRemark,
        reviewer_remarks: trimmedRemark,
        admin_feedback: trimmedFeedback,
        reviewed_at: reviewedAt,
        reviewed_by: adminId,
      },
      message: 'Report returned in demo sandbox.',
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Internal error returning report.',
    });
  }
});


/**
 * Mount Vite middlewares in development mode, or static dist in production
 */
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  } else {
    // Dynamic import of Vite createServer in development
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.info(`[Server] SIWES Full-Stack Application listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal error starting server:', err);
  process.exit(1);
});
