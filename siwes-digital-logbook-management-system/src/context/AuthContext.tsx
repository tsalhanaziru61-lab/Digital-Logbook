/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import {
  AuthState,
  LoginCredentials,
  UserProfile,
  UserRole,
  ProfileStatus
} from '../types/auth';
import { authService } from '../services/auth.service';
import { studentService } from '../services/student.service';
import { AuthContext } from './auth-context';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    role: null,
    session: null,
    profileStatus: null,
    isLoading: true,
    isAuthenticated: false,
    isAdmin: false,
    isStudent: false,
    isDemoSession: false,
    error: null,
  });

  // Initialize session on mount
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const sessionData = await authService.getInitialSession();
        if (!isMounted) return;

        if (sessionData) {
          const isRoleValid = sessionData.profileStatus === 'valid' && sessionData.profile;
          const assignedRole: UserRole | null = isRoleValid ? sessionData.profile!.role : null;

          let authError: string | null = null;
          if (sessionData.profileStatus === 'missing') {
            authError = 'Profile Missing: No institutional student or administrator record found. Please contact your coordinator.';
          } else if (sessionData.profileStatus === 'invalid_role') {
            authError = 'Invalid Account Role: Your account profile holds an unsupported role. Please contact support.';
          }

          setState({
            user: sessionData.user,
            profile: sessionData.profile,
            role: assignedRole,
            session: sessionData.session,
            profileStatus: sessionData.profileStatus,
            isLoading: false,
            isAuthenticated: true,
            isAdmin: assignedRole === 'admin',
            isStudent: assignedRole === 'student',
            isDemoSession: sessionData.isDemo,
            error: authError,
          });
        } else {
          setState((prev) => ({
            ...prev,
            user: null,
            profile: null,
            role: null,
            session: null,
            profileStatus: null,
            isLoading: false,
            isAuthenticated: false,
            isAdmin: false,
            isStudent: false,
            isDemoSession: false,
            error: null,
          }));
        }
      } catch (err) {
        if (!isMounted) return;
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: err instanceof Error ? err.message : 'Failed to initialize authentication',
        }));
      }
    };

    initAuth();

    // Subscribe to Supabase auth events
    const { data: authListener } = authService.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;

      if (event === 'SIGNED_OUT' || !newSession) {
        setState((prev) => {
          if (prev.isDemoSession) return prev;
          return {
            user: null,
            profile: null,
            role: null,
            session: null,
            profileStatus: null,
            isLoading: false,
            isAuthenticated: false,
            isAdmin: false,
            isStudent: false,
            isDemoSession: false,
            error: null,
          };
        });
      } else if (newSession && newSession.user) {
        const userProfile = await authService.getUserProfile(newSession.user.id);

        let status: ProfileStatus = 'valid';
        let assignedRole: UserRole | null = null;
        let errorMessage: string | null = null;

        if (!userProfile) {
          status = 'missing';
          errorMessage = 'Profile Missing: No student or coordinator profile record found. Access restricted.';
        } else if (userProfile.role !== 'student' && userProfile.role !== 'admin') {
          status = 'invalid_role';
          errorMessage = 'Invalid Role: Unrecognized authorization role on this profile.';
        } else {
          assignedRole = userProfile.role;
        }

        setState({
          user: newSession.user,
          profile: userProfile,
          role: assignedRole,
          session: newSession,
          profileStatus: status,
          isLoading: false,
          isAuthenticated: true,
          isAdmin: assignedRole === 'admin',
          isStudent: assignedRole === 'student',
          isDemoSession: false,
          error: errorMessage,
        });
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    const response = await authService.signInWithEmail(credentials);

    if (response.success && response.data) {
      const { user, session, profile, profileStatus, isDemo } = response.data;

      const isRoleValid = Boolean(profileStatus === 'valid' && profile);
      const assignedRole: UserRole | null = isRoleValid && profile ? profile.role : null;

      let authError: string | null = null;
      if (profileStatus === 'missing') {
        authError = 'Profile Missing: Authenticated with Supabase Auth, but no application profile exists in the profiles table. Access is restricted.';
      } else if (profileStatus === 'invalid_role') {
        authError = 'Invalid Account Role: Your profile role is not permitted for application access.';
      }

      setState({
        user,
        profile,
        role: assignedRole,
        session,
        profileStatus,
        isLoading: false,
        isAuthenticated: true,
        isAdmin: assignedRole === 'admin',
        isStudent: assignedRole === 'student',
        isDemoSession: isDemo,
        error: authError,
      });

      return {
        success: isRoleValid,
        error: authError || undefined,
      };
    } else {
      const errorMessage = response.error?.message || 'Invalid email or password.';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    await authService.signOut();
    setState({
      user: null,
      profile: null,
      role: null,
      session: null,
      profileStatus: null,
      isLoading: false,
      isAuthenticated: false,
      isAdmin: false,
      isStudent: false,
      isDemoSession: false,
      error: null,
    });
  }, []);

  const loginAsDemo = useCallback(async (role: UserRole) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    const response = authService.createDemoSession(role);

    if (response.success && response.data) {
      const { user, session, profile, profileStatus, isDemo } = response.data;
      setState({
        user,
        profile,
        role: profile ? profile.role : null,
        session,
        profileStatus,
        isLoading: false,
        isAuthenticated: true,
        isAdmin: profile?.role === 'admin',
        isStudent: profile?.role === 'student',
        isDemoSession: isDemo,
        error: null,
      });
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    return await authService.sendPasswordResetEmail(email);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!state.user) return;
    // Prefer studentService which handles both Supabase and demo sessions
    const res = await studentService.getProfile(state.user.id);
    const profile = res.data || (await authService.getUserProfile(state.user.id));
    if (profile) {
      const isRoleValid = profile.role === 'student' || profile.role === 'admin';
      setState((prev) => ({
        ...prev,
        profile,
        role: isRoleValid ? profile.role : null,
        profileStatus: isRoleValid ? 'valid' : 'invalid_role',
        isAdmin: profile.role === 'admin',
        isStudent: profile.role === 'student',
      }));
    }
  }, [state.user]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!state.user) {
      return { success: false, error: 'No active session found.' };
    }

    const res = await studentService.updateProfile(state.user.id, updates);
    if (res.success && res.data) {
      setState((prev) => ({
        ...prev,
        profile: res.data,
      }));
      return { success: true, profile: res.data };
    }
    return { success: false, error: res.error?.message || 'Failed to update profile.' };
  }, [state.user]);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        isDemo: state.isDemoSession,
        login,
        logout,
        signOut: logout,
        loginAsDemo,
        resetPassword,
        refreshProfile,
        updateProfile,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
