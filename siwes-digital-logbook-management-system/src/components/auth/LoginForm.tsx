/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  ShieldCheck,
  GraduationCap,
  Building2,
  CheckCircle2,
  Loader2,
  Info,
  ArrowLeft,
  KeyRound
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { isSupabaseConfigured } from '../../lib/supabase';
import { Card } from '../ui/Card';

interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { login, loginAsDemo, resetPassword, error, clearError, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Forgot Password modal / view state (Section 18)
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  const supabaseReady = isSupabaseConfigured();

  const validate = (): boolean => {
    setValidationError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setValidationError('Email is required.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setValidationError('Please enter a valid email address.');
      return false;
    }

    if (!password) {
      setValidationError('Password is required.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validate()) return;

    const result = await login({ email: email.trim(), password });
    if (result.success && onSuccess) {
      onSuccess();
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetMessage(null);

    const trimmed = resetEmail.trim();
    if (!trimmed) {
      setResetError('Email is required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setResetError('Please enter a valid email address.');
      return;
    }

    setResetLoading(true);
    const result = await resetPassword(trimmed);
    setResetLoading(false);

    if (result.success) {
      setResetMessage(result.message || 'Password reset email sent. Check your inbox.');
    } else {
      setResetError(result.error || 'Failed to dispatch password recovery email.');
    }
  };

  const handleQuickDemo = async (role: 'student' | 'admin') => {
    clearError();
    setValidationError(null);
    if (role === 'student') {
      setEmail('student@kasu.edu.ng');
      setPassword('password123');
    } else {
      setEmail('admin@kasu.edu.ng');
      setPassword('password123');
    }
    await loginAsDemo(role);
    if (onSuccess) {
      onSuccess();
    }
  };

  // If in Password Reset View
  if (isResetMode) {
    return (
      <div className="max-w-md w-full mx-auto">
        <Card className="shadow-xl border-slate-200/80 dark:border-slate-800">
          <div className="p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white mx-auto flex items-center justify-center shadow-md shadow-amber-600/20">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Reset Password
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Enter your institutional email to receive secure recovery instructions
              </p>
            </div>

            {resetError && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs sm:text-sm text-red-700 dark:text-red-300 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <span>{resetError}</span>
              </div>
            )}

            {resetMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>{resetMessage}</span>
              </div>
            )}

            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="reset-email"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
                >
                  Institutional Email
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="reset-email"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="e.g., student@siwes.edu.ng"
                    disabled={resetLoading}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={resetLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {resetLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Dispatching Link...</span>
                  </>
                ) : (
                  <span>Send Reset Instructions</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsResetMode(false);
                  setResetError(null);
                  setResetMessage(null);
                }}
                className="w-full py-2 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Login</span>
              </button>
            </form>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full mx-auto">
      <Card className="shadow-xl border-slate-200/80 dark:border-slate-800">
        <div className="p-6 sm:p-8 space-y-6">
          {/* Form Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white mx-auto flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              SIWES Digital Logbook
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Sign in to your student logbook or administrator portal
            </p>
          </div>

          {/* Validation & Auth Error Banners */}
          {(validationError || error) && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs sm:text-sm text-red-700 dark:text-red-300 flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-snug">
                <span>{validationError || error}</span>
              </div>
            </div>
          )}

          {/* Supabase Connection Status Advisory */}
          {!supabaseReady && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 text-xs text-amber-800 dark:text-amber-300 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Supabase Sandbox Testing Mode</span>
              </div>
              <p className="text-[11px] text-amber-700/90 dark:text-amber-400/90 leading-relaxed">
                Connect your Supabase URL &amp; Anon Key in <code>.env</code> for live PostgreSQL auth. For testing now, use the instant demo buttons below!
              </p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="siwes-email"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
              >
                Email
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="siwes-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  placeholder="e.g., student@kasu.edu.ng or admin@kasu.edu.ng"
                  disabled={isLoading}
                  autoComplete="email"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all disabled:opacity-60"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="siwes-password"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsResetMode(true);
                    setResetEmail(email);
                  }}
                  className="text-xs text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 font-medium cursor-pointer transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="siwes-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  placeholder="Enter your account password"
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </>
              )}
            </button>
          </form>

          {/* Institutional Provisioning Notice (NO PUBLIC REGISTRATION) */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Managed Accounts Policy</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Public registration is disabled. Under SIWES regulatory requirements, student logbook accounts are provisioned exclusively by designated institutional coordinators.
              </p>
            </div>
          </div>

          {/* Quick Demo Logins for Evaluation */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Quick KASU Identities</span>
              <span className="text-[10px] text-emerald-600 font-mono">1-Click Login</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickDemo('student')}
                disabled={isLoading}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 hover:border-emerald-500 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600">
                  <GraduationCap className="w-4 h-4 text-emerald-600" />
                  <span>Student (KASU)</span>
                </div>
                <p className="text-[10px] text-slate-700 dark:text-slate-300 mt-1 font-mono truncate">
                  student@kasu.edu.ng
                </p>
                <p className="text-[9px] text-slate-400 font-mono truncate">
                  UID: d4930092...
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                disabled={isLoading}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 hover:border-sky-500 hover:bg-sky-50/30 dark:hover:bg-sky-950/20 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-white group-hover:text-sky-600">
                  <Building2 className="w-4 h-4 text-sky-600" />
                  <span>Admin (KASU)</span>
                </div>
                <p className="text-[10px] text-slate-700 dark:text-slate-300 mt-1 font-mono truncate">
                  admin@kasu.edu.ng
                </p>
                <p className="text-[9px] text-slate-400 font-mono truncate">
                  UID: dce626bd...
                </p>
              </button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
