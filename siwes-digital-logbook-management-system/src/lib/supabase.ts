/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfigStatus } from '../types';

/**
 * Vite environment variables for Supabase integration.
 * In Vite, variables exposed to the client must begin with the `VITE_` prefix.
 */
const rawSupabaseUrl: string | undefined = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey: string | undefined = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Normalizes a Supabase URL, supporting both full URLs and raw project ref IDs (e.g. 'ikbqxhoyigzcaueydzsd').
 */
export const normalizeSupabaseUrl = (url?: string): string | null => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed || trimmed.includes('your-project-id.supabase.co')) return null;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}.supabase.co`;
};

const normalizedUrl = normalizeSupabaseUrl(rawSupabaseUrl);

/**
 * Evaluates whether valid Supabase credentials have been configured in the environment.
 * Checks for presence and ensures placeholder strings from .env.example are not being used.
 */
export const isSupabaseConfigured = (): boolean => {
  const isUrlValid = Boolean(normalizedUrl);
  const isKeyValid = Boolean(
    supabaseAnonKey &&
    supabaseAnonKey.trim() !== '' &&
    !supabaseAnonKey.includes('your-anon-public-key-here')
  );

  return isUrlValid && isKeyValid;
};

/**
 * Returns a comprehensive status report of the Supabase environment setup.
 * Used by the system foundation dashboard (Module 01) and setup diagnostics.
 */
export const getSupabaseConfigStatus = (): SupabaseConfigStatus => {
  const hasUrl = Boolean(normalizedUrl);

  const hasAnonKey = Boolean(
    supabaseAnonKey &&
    supabaseAnonKey.trim() !== '' &&
    !supabaseAnonKey.includes('your-anon-public-key-here')
  );

  const isConfigured = hasUrl && hasAnonKey;

  let message = 'Supabase client is configured and ready.';
  if (!hasUrl && !hasAnonKey) {
    message = 'Missing VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in environment variables.';
  } else if (!hasUrl) {
    message = 'Missing or invalid VITE_SUPABASE_URL in environment variables.';
  } else if (!hasAnonKey) {
    message = 'Missing or invalid VITE_SUPABASE_ANON_KEY in environment variables.';
  }

  return {
    isConfigured,
    hasUrl,
    hasAnonKey,
    message,
  };
};

/**
 * Fallback URL and Key used when environment variables are not yet provided.
 * This guarantees the Supabase client can instantiate safely during local bootstrapping
 * without crashing the React application lifecycle.
 */
const FALLBACK_URL = 'https://placeholder-project.supabase.co';
const FALLBACK_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';

/**
 * Singleton Supabase Client instance for the application.
 *
 * SECURITY NOTE:
 * - Uses the anonymous public key (`anon`), which is safe for client-side execution.
 * - All table-level and row-level operations are subject to PostgreSQL Row Level Security (RLS).
 * - NEVER import or reference the Supabase `service_role` key in frontend code.
 */
export const supabase: SupabaseClient = (() => {
  const targetUrl = normalizedUrl || FALLBACK_URL;
  const targetKey = supabaseAnonKey && supabaseAnonKey.length > 20 ? supabaseAnonKey : FALLBACK_ANON_KEY;

  try {
    return createClient(targetUrl, targetKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (err) {
    console.warn('[Supabase Client] Failed initialization, reverting to fallback:', err);
    return createClient(FALLBACK_URL, FALLBACK_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
})();
