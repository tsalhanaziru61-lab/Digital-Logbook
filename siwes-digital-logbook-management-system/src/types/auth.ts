/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Session } from '@supabase/supabase-js';

/**
 * System user roles strictly enforced by the SIWES application.
 * - `student`: Undergraduate student undergoing industrial attachment. Records daily logs, submits weekly reports.
 * - `admin`: SIWES coordinator / institutional supervisor. Provisions student accounts, inspects reports, adds remarks.
 */
export type UserRole = 'student' | 'admin';

/**
 * Application profile model corresponding to the Supabase PostgreSQL `profiles` table.
 * Created in Module 02 and leveraged by Module 03 for Role-Based Access Control (RBAC).
 */
export interface UserProfile {
  id: string; // Foreign key referencing auth.users(id)
  email: string;
  full_name: string;
  role: UserRole;
  matric_number?: string | null;
  matric_no?: string | null; // Alias for matric_number
  department?: string | null;
  institution?: string | null;
  phone_number?: string | null;
  avatar_url?: string | null;
  company_name?: string | null; // Student SIWES placement organization
  organisation?: string | null; // SIWES Organisation alias
  siwes_start_date?: string | null; // YYYY-MM-DD
  siwes_end_date?: string | null; // YYYY-MM-DD
  supervisor_name?: string | null;
  supervisor_phone?: string | null;
  supervisor_email?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Payload for signing in with email and password.
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Profile verification state (Sections 16 & 17 of Module 03 requirements)
 */
export type ProfileStatus = 'valid' | 'missing' | 'invalid_role' | null;

/**
 * Structure of the authentication state stored in AuthContext.
 */
export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  role: UserRole | null;
  session: Session | null;
  profileStatus: ProfileStatus;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isStudent: boolean;
  isDemoSession: boolean;
  isDemo?: boolean;
  error: string | null;
}

/**
 * Authentication context methods and properties exposed through useAuth.
 */
export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
  loginAsDemo: (role: UserRole) => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string; profile?: UserProfile }>;
  clearError: () => void;
}

/**
 * Auth result wrapper for service functions.
 */
export interface AuthResponse<T = unknown> {
  data: T | null;
  error: {
    message: string;
    code?: string;
  } | null;
  success: boolean;
}
