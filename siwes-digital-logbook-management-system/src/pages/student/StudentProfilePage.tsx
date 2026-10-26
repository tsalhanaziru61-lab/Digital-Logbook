/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useId } from 'react';
import {
  User,
  GraduationCap,
  Building2,
  Mail,
  Phone,
  Calendar,
  Lock,
  Edit3,
  Save,
  X,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Briefcase,
  UserCheck,
  Clock,
  ShieldCheck,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { PageHeader } from '../../components/navigation/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { useAuth } from '../../hooks/useAuth';
import { studentService } from '../../services/student.service';
import { StudentProfileFormState, StudentProfileFormErrors } from '../../types/student';

export const StudentProfilePage: React.FC = () => {
  const { profile, user, updateProfile, refreshProfile } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [copiedMatric, setCopiedMatric] = useState(false);

  // Form input IDs for accessible label associations
  const fullNameId = useId();
  const phoneId = useId();
  const emailId = useId();
  const orgId = useId();
  const startDateId = useId();
  const endDateId = useId();
  const supNameId = useId();
  const supPhoneId = useId();
  const supEmailId = useId();

  // Form State initialized from current profile
  const [formData, setFormData] = useState<StudentProfileFormState>(() => ({
    full_name: profile?.full_name || '',
    phone_number: profile?.phone_number || '',
    organisation: profile?.organisation || profile?.company_name || '',
    siwes_start_date: profile?.siwes_start_date || '',
    siwes_end_date: profile?.siwes_end_date || '',
    supervisor_name: profile?.supervisor_name || '',
    supervisor_phone: profile?.supervisor_phone || '',
    supervisor_email: profile?.supervisor_email || '',
  }));

  const [formErrors, setFormErrors] = useState<StudentProfileFormErrors>({});

  const handleStartEditing = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone_number: profile.phone_number || '',
        organisation: profile.organisation || profile.company_name || '',
        siwes_start_date: profile.siwes_start_date || '',
        siwes_end_date: profile.siwes_end_date || '',
        supervisor_name: profile.supervisor_name || '',
        supervisor_phone: profile.supervisor_phone || '',
        supervisor_email: profile.supervisor_email || '',
      });
    }
    setFormErrors({});
    setIsEditing(true);
  };

  const handleCopyMatric = async () => {
    const matric = profile?.matric_number || profile?.matric_no || 'CSC/2021/1042';
    try {
      await navigator.clipboard.writeText(matric);
      setCopiedMatric(true);
      setTimeout(() => setCopiedMatric(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setSaveSuccessMessage(null);
    setSaveErrorMessage(null);
    try {
      await refreshProfile();
      setSaveSuccessMessage('Profile data refreshed from database.');
      setTimeout(() => setSaveSuccessMessage(null), 3000);
    } catch {
      setSaveErrorMessage('Could not refresh profile. Please check your connection.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Validation function
  const validateForm = (): boolean => {
    const errors: StudentProfileFormErrors = {};

    if (!formData.full_name.trim()) {
      errors.full_name = 'Full name is required.';
    } else if (formData.full_name.trim().length < 3) {
      errors.full_name = 'Full name must be at least 3 characters.';
    }

    if (formData.phone_number.trim()) {
      // Clean phone check: allow +, digits, spaces, hyphens (minimum 7 digits)
      const digitsOnly = formData.phone_number.replace(/\D/g, '');
      if (digitsOnly.length < 8 || digitsOnly.length > 15) {
        errors.phone_number = 'Please enter a valid phone number (8–15 digits).';
      }
    }

    if (formData.siwes_start_date && formData.siwes_end_date) {
      const start = new Date(formData.siwes_start_date);
      const end = new Date(formData.siwes_end_date);
      if (isNaN(start.getTime())) {
        errors.siwes_start_date = 'Invalid start date.';
      }
      if (isNaN(end.getTime())) {
        errors.siwes_end_date = 'Invalid end date.';
      }
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start > end) {
        errors.siwes_end_date = 'End date must be on or after start date.';
      }
    }

    if (formData.supervisor_email?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.supervisor_email.trim())) {
        errors.supervisor_email = 'Please enter a valid supervisor email.';
      }
    }

    if (formData.supervisor_phone?.trim()) {
      const digitsOnly = formData.supervisor_phone.replace(/\D/g, '');
      if (digitsOnly.length < 8 || digitsOnly.length > 15) {
        errors.supervisor_phone = 'Please enter a valid phone number.';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccessMessage(null);
    setSaveErrorMessage(null);

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      const result = await updateProfile({
        full_name: formData.full_name.trim(),
        phone_number: formData.phone_number.trim() || null,
        organisation: formData.organisation.trim() || null,
        company_name: formData.organisation.trim() || null,
        siwes_start_date: formData.siwes_start_date || null,
        siwes_end_date: formData.siwes_end_date || null,
        supervisor_name: formData.supervisor_name.trim() || null,
        supervisor_phone: formData.supervisor_phone.trim() || null,
        supervisor_email: formData.supervisor_email.trim() || null,
      });

      if (result.success) {
        setSaveSuccessMessage('Your student profile was updated successfully.');
        setIsEditing(false);
        setTimeout(() => setSaveSuccessMessage(null), 4000);
      } else {
        setSaveErrorMessage(result.error || 'Failed to update profile. Please try again.');
      }
    } catch (err) {
      setSaveErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone_number: profile.phone_number || '',
        organisation: profile.organisation || profile.company_name || '',
        siwes_start_date: profile.siwes_start_date || '',
        siwes_end_date: profile.siwes_end_date || '',
        supervisor_name: profile.supervisor_name || '',
        supervisor_phone: profile.supervisor_phone || '',
        supervisor_email: profile.supervisor_email || '',
      });
    }
    setFormErrors({});
    setIsEditing(false);
    setSaveErrorMessage(null);
  };

  // Calculate calendar placement progress
  const progress = studentService.calculatePlacementProgress(
    profile?.siwes_start_date || formData.siwes_start_date,
    profile?.siwes_end_date || formData.siwes_end_date
  );

  const matricDisplay = profile?.matric_number || profile?.matric_no || 'CSC/2021/1042';
  const institutionDisplay = profile?.institution || 'Federal University of Technology';
  const departmentDisplay = profile?.department || 'Computer Science';
  const emailDisplay = profile?.email || user?.email || 'student@siwes.edu.ng';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header with breadcrumbs and actions */}
      <PageHeader
        title="Student Profile"
        subtitle="Manage your contact information, view verified academic credentials, and configure your SIWES industrial placement details."
        icon={User}
        breadcrumbs={[
          { label: 'Student Portal' },
          { label: 'Profile' }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing || isSaving}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              title="Refresh profile from database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {!isEditing ? (
              <button
                type="button"
                onClick={handleStartEditing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg transition-colors shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            )}
          </div>
        }
      />

      {/* Success Notification */}
      {saveSuccessMessage && (
        <div
          role="status"
          aria-live="polite"
          className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3 transition-all"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-emerald-900 dark:text-emerald-200">{saveSuccessMessage}</p>
          </div>
        </div>
      )}

      {/* Error Notification */}
      {saveErrorMessage && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-3 transition-all"
        >
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-rose-900 dark:text-rose-200">Unable to update profile</p>
            <p className="text-rose-700 dark:text-rose-300 mt-0.5">{saveErrorMessage}</p>
          </div>
        </div>
      )}

      {/* Placement Timeline Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-slate-900 dark:text-white text-base">
                SIWES Industrial Attachment Schedule
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                · {progress.formattedDuration}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Standard 24-week industrial training attachment under ITF (Industrial Training Fund) guidelines.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
            <div className="text-right">
              <span className="text-[11px] text-slate-400 font-mono uppercase block">Progress</span>
              <span className="font-semibold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                {progress.percentComplete}%
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 font-mono uppercase block">Remaining</span>
              <span className="font-semibold font-mono tabular-nums text-slate-900 dark:text-white">
                {progress.remainingWeeks} wks
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress.percentComplete}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2 font-mono">
            <span>
              Start: {profile?.siwes_start_date ? new Date(profile.siwes_start_date).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Not configured'}
            </span>
            <span>
              End: {profile?.siwes_end_date ? new Date(profile.siwes_end_date).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Not configured'}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Personal Information (Student Editable) */}
          <Card>
            <CardHeader
              title="Personal Information"
              subtitle="Contact and student identity details"
              icon={<User className="w-5 h-5 text-emerald-600" />}
              action={
                <span className="text-xs text-slate-400 font-mono">
                  {isEditing ? 'Editing enabled' : 'Student editable'}
                </span>
              }
            />

            <div className="space-y-4 text-xs sm:text-sm">
              {/* Full Name */}
              <div>
                <label htmlFor={fullNameId} className="block text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                {isEditing ? (
                  <div>
                    <input
                      id={fullNameId}
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="e.g. Babajide Aminu"
                      className={`w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-slate-800 border ${
                        formErrors.full_name
                          ? 'border-rose-500 focus:ring-rose-500'
                          : 'border-slate-300 dark:border-slate-700 focus:ring-emerald-500'
                      } text-slate-900 dark:text-white focus:outline-none focus:ring-1`}
                    />
                    {formErrors.full_name && (
                      <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{formErrors.full_name}</p>
                    )}
                  </div>
                ) : (
                  <p className="font-semibold text-slate-900 dark:text-white text-base">
                    {profile?.full_name || 'Babajide Aminu'}
                  </p>
                )}
              </div>

              {/* Email Address (Auth bound - Read Only) */}
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor={emailId} className="block text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                    <Lock className="w-3 h-3" /> Auth Bound
                  </span>
                </div>
                {isEditing ? (
                  <div>
                    <input
                      id={emailId}
                      type="email"
                      value={emailDisplay}
                      disabled
                      className="w-full px-3 py-2 rounded-lg text-sm bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed font-mono"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Account email is linked to Supabase Authentication credentials and cannot be edited directly here.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <p className="font-mono text-slate-700 dark:text-slate-300">
                      {emailDisplay}
                    </p>
                  </div>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor={phoneId} className="block text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                {isEditing ? (
                  <div>
                    <input
                      id={phoneId}
                      type="tel"
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      placeholder="e.g. +234 803 123 4567"
                      className={`w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-slate-800 border ${
                        formErrors.phone_number
                          ? 'border-rose-500 focus:ring-rose-500'
                          : 'border-slate-300 dark:border-slate-700 focus:ring-emerald-500'
                      } text-slate-900 dark:text-white focus:outline-none focus:ring-1`}
                    />
                    {formErrors.phone_number && (
                      <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{formErrors.phone_number}</p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <p className="font-mono tabular-nums text-slate-800 dark:text-slate-200">
                      {profile?.phone_number || 'Not provided'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Card 2: Academic Information (Institutional / Read Only) */}
          <Card>
            <CardHeader
              title="Academic Information"
              subtitle="Verified university enrollment and department records"
              icon={<GraduationCap className="w-5 h-5 text-teal-600" />}
              action={
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  <Lock className="w-3 h-3 text-slate-400" />
                  Admin Controlled
                </span>
              }
            />

            <div className="space-y-4 text-xs sm:text-sm">
              {/* Matriculation Number */}
              <div>
                <span className="block text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Matriculation Number
                </span>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-sm tracking-wide">
                    {matricDisplay}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyMatric}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors"
                    title="Copy Matric Number"
                  >
                    {copiedMatric ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Institution */}
              <div>
                <span className="block text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Institution
                </span>
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  {institutionDisplay}
                </p>
              </div>

              {/* Department */}
              <div>
                <span className="block text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Department
                </span>
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  {departmentDisplay}
                </p>
              </div>

              {/* System Role & Security Notice */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <div className="flex items-start gap-2 text-slate-500 dark:text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    Official academic records and matric numbers are provisioned directly by the Institutional SIWES Coordinator. For credential amendments, contact the Directorate of SIWES.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Card 3: SIWES Industrial Placement Information */}
          <Card className="lg:col-span-2">
            <CardHeader
              title="SIWES Industrial Placement Details"
              subtitle="Registered training establishment, attachment dates, and industry supervisor"
              icon={<Building2 className="w-5 h-5 text-indigo-600" />}
              action={
                <span className="text-xs text-slate-400 font-mono">
                  {isEditing ? 'Editing enabled' : 'Student editable'}
                </span>
              }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm">
              {/* Left Column: Organisation and Dates */}
              <div className="space-y-4">
                {/* Organisation */}
                <div>
                  <label htmlFor={orgId} className="block text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    SIWES Organisation / Company Name
                  </label>
                  {isEditing ? (
                    <div>
                      <input
                        id={orgId}
                        type="text"
                        value={formData.organisation}
                        onChange={(e) => setFormData({ ...formData, organisation: e.target.value })}
                        placeholder="e.g. National Information Technology Development Agency (NITDA)"
                        className="w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <Briefcase className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">
                          {profile?.organisation || profile?.company_name || 'Not yet assigned'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Date Range: Start and End Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor={startDateId} className="block text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      SIWES Start Date
                    </label>
                    {isEditing ? (
                      <div>
                        <input
                          id={startDateId}
                          type="date"
                          value={formData.siwes_start_date}
                          onChange={(e) => setFormData({ ...formData, siwes_start_date: e.target.value })}
                          className={`w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-slate-800 border ${
                            formErrors.siwes_start_date
                              ? 'border-rose-500 focus:ring-rose-500'
                              : 'border-slate-300 dark:border-slate-700 focus:ring-emerald-500'
                          } text-slate-900 dark:text-white focus:outline-none focus:ring-1 font-mono`}
                        />
                        {formErrors.siwes_start_date && (
                          <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{formErrors.siwes_start_date}</p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="font-mono text-slate-800 dark:text-slate-200">
                          {profile?.siwes_start_date || 'Not set'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor={endDateId} className="block text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      SIWES End Date
                    </label>
                    {isEditing ? (
                      <div>
                        <input
                          id={endDateId}
                          type="date"
                          value={formData.siwes_end_date}
                          onChange={(e) => setFormData({ ...formData, siwes_end_date: e.target.value })}
                          className={`w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-slate-800 border ${
                            formErrors.siwes_end_date
                              ? 'border-rose-500 focus:ring-rose-500'
                              : 'border-slate-300 dark:border-slate-700 focus:ring-emerald-500'
                          } text-slate-900 dark:text-white focus:outline-none focus:ring-1 font-mono`}
                        />
                        {formErrors.siwes_end_date && (
                          <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{formErrors.siwes_end_date}</p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="font-mono text-slate-800 dark:text-slate-200">
                          {profile?.siwes_end_date || 'Not set'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Industry Supervisor */}
              <div className="space-y-4">
                <div>
                  <label htmlFor={supNameId} className="block text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Industry Supervisor Name
                  </label>
                  {isEditing ? (
                    <input
                      id={supNameId}
                      type="text"
                      value={formData.supervisor_name}
                      onChange={(e) => setFormData({ ...formData, supervisor_name: e.target.value })}
                      placeholder="e.g. Engr. D. Adeleke"
                      className="w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-slate-400" />
                      <p className="font-medium text-slate-900 dark:text-white">
                        {profile?.supervisor_name || 'Engr. D. Adeleke'}
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor={supPhoneId} className="block text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Supervisor Phone
                    </label>
                    {isEditing ? (
                      <div>
                        <input
                          id={supPhoneId}
                          type="tel"
                          value={formData.supervisor_phone}
                          onChange={(e) => setFormData({ ...formData, supervisor_phone: e.target.value })}
                          placeholder="e.g. +234 802 333 4455"
                          className="w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                        />
                        {formErrors.supervisor_phone && (
                          <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{formErrors.supervisor_phone}</p>
                        )}
                      </div>
                    ) : (
                      <p className="font-mono tabular-nums text-slate-800 dark:text-slate-200">
                        {profile?.supervisor_phone || '+234 802 333 4455'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor={supEmailId} className="block text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Supervisor Email
                    </label>
                    {isEditing ? (
                      <div>
                        <input
                          id={supEmailId}
                          type="email"
                          value={formData.supervisor_email}
                          onChange={(e) => setFormData({ ...formData, supervisor_email: e.target.value })}
                          placeholder="e.g. supervisor@company.com"
                          className="w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                        />
                        {formErrors.supervisor_email && (
                          <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{formErrors.supervisor_email}</p>
                        )}
                      </div>
                    ) : (
                      <p className="font-mono text-slate-800 dark:text-slate-200 truncate">
                        {profile?.supervisor_email || 'd.adeleke@nitda.gov.ng'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions Bar (shown when in Edit mode) */}
            {isEditing && (
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg transition-colors shadow-xs disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving to Database...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Profile Changes</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </Card>
        </div>
      </form>
    </div>
  );
};
