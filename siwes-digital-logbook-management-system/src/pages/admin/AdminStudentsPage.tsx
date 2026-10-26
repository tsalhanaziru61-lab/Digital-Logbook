/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  GraduationCap,
  Building,
  CheckCircle2,
  Clock,
  Info,
  X,
  ChevronRight,
  ChevronLeft,
  Eye,
  Edit2,
  Trash2,
  ShieldAlert,
  RefreshCw,
  AlertCircle,
  Calendar,
  Mail,
  Phone,
  Briefcase,
  Key,
  Check,
  Copy,
  Lock,
  UserCheck,
  UserX,
  RotateCcw,
  BookOpen
} from 'lucide-react';
import { PageHeader } from '../../components/navigation/PageHeader';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../../hooks/useAuth';
import { adminService } from '../../services/admin.service';
import { studentService } from '../../services/student.service';
import {
  StudentWithLogbookStats,
  StudentAccountCreationInput,
} from '../../types/student';
import { UserProfile } from '../../types/auth';

export const AdminStudentsPage: React.FC = () => {
  const { user, profile, isAdmin } = useAuth();

  // Component state
  const [students, setStudents] = useState<StudentWithLogbookStats[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedInstitution, setSelectedInstitution] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Filter options derived from database/cohort
  const [departmentsList, setDepartmentsList] = useState<string[]>([]);
  const [institutionsList, setInstitutionsList] = useState<string[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 8;

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [selectedStudentForView, setSelectedStudentForView] = useState<StudentWithLogbookStats | null>(null);
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState<StudentWithLogbookStats | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<StudentWithLogbookStats | null>(null);

  // Success toast / feedback alert
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load students & filter lists asynchronously on filter/trigger change
  useEffect(() => {
    let isMounted = true;

    const fetchStudents = async () => {
      try {
        const [studentsRes, filterOptions] = await Promise.all([
          adminService.getStudents({
            search: searchQuery,
            department: selectedDept,
            institution: selectedInstitution,
            status: selectedStatus,
          }),
          adminService.getFilterOptions(),
        ]);

        if (!isMounted) return;

        if (studentsRes.success && studentsRes.data) {
          setStudents(studentsRes.data.students);
        } else {
          setError(studentsRes.error?.message || 'Failed to load students.');
        }

        setDepartmentsList(filterOptions.departments);
        setInstitutionsList(filterOptions.institutions);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Unexpected error loading students.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void fetchStudents();

    return () => {
      isMounted = false;
    };
  }, [searchQuery, selectedDept, selectedInstitution, selectedStatus, refreshTrigger]);

  // Dismiss feedback after 6 seconds
  useEffect(() => {
    if (feedbackMessage) {
      const timer = setTimeout(() => {
        setFeedbackMessage(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMessage]);

  // Compute KPI summaries from loaded students
  const kpiStats = useMemo(() => {
    const total = students.length;
    const activeCount = students.filter((s) => s.is_active).length;
    const depts = new Set(students.map((s) => s.department).filter(Boolean)).size;
    const totalAwaitingReview = students.reduce(
      (acc, s) => acc + (s.logbookStats?.submittedWeeks || 0),
      0
    );
    const totalApprovedWeeks = students.reduce(
      (acc, s) => acc + (s.logbookStats?.approvedWeeks || 0),
      0
    );

    return {
      total,
      activeCount,
      depts,
      totalAwaitingReview,
      totalApprovedWeeks,
    };
  }, [students]);

  // Pagination slice
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return students.slice(startIndex, startIndex + pageSize);
  }, [students, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(students.length / pageSize));

  // Clear filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedDept('all');
    setSelectedInstitution('all');
    setSelectedStatus('all');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    Boolean(searchQuery) ||
    selectedDept !== 'all' ||
    selectedInstitution !== 'all' ||
    selectedStatus !== 'all';

  // Toggle student active status
  const handleToggleStatus = async (student: StudentWithLogbookStats) => {
    const nextStatus = !student.is_active;
    const result = await adminService.toggleStudentStatus(student.id, nextStatus);
    if (result.success) {
      setFeedbackMessage({
        type: 'success',
        text: `Student ${student.full_name} has been marked as ${nextStatus ? 'Active' : 'Inactive'}.`,
      });
      setRefreshTrigger((prev) => prev + 1);
    } else {
      setFeedbackMessage({
        type: 'error',
        text: result.error?.message || 'Failed to update student status.',
      });
    }
  };

  // Delete student
  const handleConfirmDelete = async () => {
    if (!studentToDelete) return;
    const studentName = studentToDelete.full_name;
    const result = await adminService.deleteStudent(studentToDelete.id);
    setStudentToDelete(null);
    if (result.success) {
      setFeedbackMessage({
        type: 'success',
        text: `Student account for ${studentName} was successfully removed.`,
      });
      setRefreshTrigger((prev) => prev + 1);
    } else {
      setFeedbackMessage({
        type: 'error',
        text: result.error?.message || 'Failed to delete student account.',
      });
    }
  };

  // Authorization Guard: Strictly enforce admin role
  if (!isAdmin && profile?.role !== 'admin') {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/50 shadow-sm">
        <div className="w-14 h-14 bg-rose-50 dark:bg-rose-950/60 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-7 h-7 text-rose-600 dark:text-rose-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Administrator Authorization Required
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
          Access to student cohort records, account provisioning, and institutional data is restricted to authenticated SIWES administrators.
        </p>
        <div className="mt-6 flex justify-center">
          <a
            href="/student/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-colors"
          >
            <span>Return to Student Dashboard</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Students Directory & Cohorts"
        subtitle="Provision student accounts, oversee placement cohorts, inspect weekly logbook status, and update institutional profiles."
        icon={Users}
        breadcrumbs={[
          { label: 'Admin Portal' },
          { label: 'Students' },
        ]}
        actions={
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setRefreshTrigger((prev) => prev + 1)}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-medium transition-colors"
              title="Refresh students cohort"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-emerald-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Student</span>
            </button>
          </div>
        }
      />

      {/* Feedback Toast Banner */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-xs sm:text-sm animate-in fade-in duration-200 ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {kpiStats.total}
            </div>
            <div className="text-xs text-slate-500 font-medium">Enrolled Students</div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-950/60 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {kpiStats.activeCount}
            </div>
            <div className="text-xs text-slate-500 font-medium">Active Attachments</div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {kpiStats.totalAwaitingReview}
            </div>
            <div className="text-xs text-slate-500 font-medium">Weeks Awaiting Review</div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {kpiStats.depts}
            </div>
            <div className="text-xs text-slate-500 font-medium">Departments</div>
          </div>
        </div>
      </div>

      {/* Main Student Management Card */}
      <Card>
        {/* Search & Filter Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search name, email, matric no, or organisation..."
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns & Status Tabs */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Department Dropdown */}
              <select
                value={selectedDept}
                onChange={(e) => {
                  setSelectedDept(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Departments</option>
                {departmentsList.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>

              {/* Institution Dropdown */}
              <select
                value={selectedInstitution}
                onChange={(e) => {
                  setSelectedInstitution(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 max-w-[200px] truncate"
              >
                <option value="all">All Institutions</option>
                {institutionsList.map((inst) => (
                  <option key={inst} value={inst}>
                    {inst}
                  </option>
                ))}
              </select>

              {/* Status Segmented Control */}
              <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                {(['all', 'active', 'inactive'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      setSelectedStatus(st);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                      selectedStatus === st
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Clear filters shortcut */}
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Clear all active filters"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Status Line */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <div>
              Showing <strong className="text-slate-900 dark:text-white">{students.length}</strong> enrolled student
              {students.length === 1 ? '' : 's'}
              {hasActiveFilters && ' (filtered)'}
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Active Account
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                Inactive
              </span>
            </div>
          </div>
        </div>

        {/* Table Content */}
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
                  <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded w-1/3" />
                </div>
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20" />
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-28" />
                <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-16" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-12 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <div className="font-semibold text-slate-900 dark:text-white text-base">Error Loading Students</div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">{error}</p>
            <button
              onClick={() => {
                setIsLoading(true);
                setError(null);
                setRefreshTrigger((prev) => prev + 1);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
            <div className="font-semibold text-slate-900 dark:text-white text-base">No Students Found</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {hasActiveFilters
                ? 'No students matched the active search and filter criteria. Try adjusting your search query or reset filters.'
                : 'No student accounts are currently enrolled in the directory. You can provision your first student account now.'}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Reset Filter Criteria
              </button>
            ) : (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add First Student</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 font-semibold">Student &amp; Email</th>
                  <th className="px-4 py-3 font-semibold">Matric No</th>
                  <th className="px-4 py-3 font-semibold">Department &amp; Institution</th>
                  <th className="px-4 py-3 font-semibold">Placement Organisation</th>
                  <th className="px-4 py-3 font-semibold">SIWES Period</th>
                  <th className="px-4 py-3 font-semibold">Logbook</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {paginatedStudents.map((st) => {
                  const matric = st.matric_number || st.matric_no || 'Pending';
                  const org = st.organisation || st.company_name || 'Not Assigned';
                  const initials = st.full_name
                    ? st.full_name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()
                    : 'ST';

                  const stats = st.logbookStats;
                  const totalW = stats?.totalWeeks || 0;
                  const approvedW = stats?.approvedWeeks || 0;
                  const submittedW = stats?.submittedWeeks || 0;

                  return (
                    <tr
                      key={st.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      {/* Student Identity */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-semibold text-xs flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 dark:text-white truncate">
                              {st.full_name}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                              <Mail className="w-3 h-3 shrink-0" />
                              <span>{st.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Matric No */}
                      <td className="px-4 py-3.5 font-mono text-xs font-medium text-slate-900 dark:text-slate-200 tabular-nums whitespace-nowrap">
                        {matric}
                      </td>

                      {/* Department & Institution */}
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-800 dark:text-slate-200 line-clamp-1">
                          {st.department || 'Not Assigned'}
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">
                          {st.institution || 'Institutional attachment'}
                        </div>
                      </td>

                      {/* Organisation */}
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-800 dark:text-slate-200 line-clamp-1">
                          {org}
                        </div>
                        {st.supervisor_name && (
                          <div className="text-[11px] text-slate-500 line-clamp-1">
                            Sup: {st.supervisor_name}
                          </div>
                        )}
                      </td>

                      {/* SIWES Period */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {st.siwes_start_date ? (
                          <div className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-400">
                            {st.siwes_start_date}
                            <span className="text-slate-400 mx-1">→</span>
                            {st.siwes_end_date || 'Ongoing'}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Not scheduled</span>
                        )}
                      </td>

                      {/* Logbook Activity Stats */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="text-xs">
                          <span className="font-semibold font-mono tabular-nums text-slate-900 dark:text-white">
                            {approvedW}/{totalW}
                          </span>{' '}
                          <span className="text-slate-500 text-[11px]">approved</span>
                          {submittedW > 0 && (
                            <span className="ml-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                              ({submittedW} pending)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Account Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(st)}
                          title={`Click to ${st.is_active ? 'deactivate' : 'activate'} student`}
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors cursor-pointer hover:opacity-80"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              st.is_active ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          <span className={st.is_active ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-slate-500'}>
                            {st.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedStudentForView(st)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="View student dossier & logbook stats"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSelectedStudentForEdit(st)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors"
                            title="Edit student information"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setStudentToDelete(st)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Delete student account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!isLoading && !error && students.length > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Showing{' '}
              <strong className="text-slate-900 dark:text-white">
                {(currentPage - 1) * pageSize + 1}
              </strong>{' '}
              to{' '}
              <strong className="text-slate-900 dark:text-white">
                {Math.min(currentPage * pageSize, students.length)}
              </strong>{' '}
              of <strong className="text-slate-900 dark:text-white">{students.length}</strong> students
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 font-mono font-medium text-slate-900 dark:text-white">
                Page {currentPage} of {totalPages}
              </span>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* MODAL 1: ADD STUDENT (PROVISION ACCOUNT) */}
      {isAddModalOpen && (
        <AddStudentModal
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={(createdStudent) => {
            setIsAddModalOpen(false);
            setFeedbackMessage({
              type: 'success',
              text: `Student account for ${createdStudent.full_name} (${createdStudent.matric_number}) has been provisioned.`,
            });
            setRefreshTrigger((prev) => prev + 1);
          }}
        />
      )}

      {/* MODAL 2: STUDENT DETAILS DOSSIER */}
      {selectedStudentForView && (
        <StudentDetailsModal
          student={selectedStudentForView}
          onClose={() => setSelectedStudentForView(null)}
          onEdit={() => {
            const current = selectedStudentForView;
            setSelectedStudentForView(null);
            setSelectedStudentForEdit(current);
          }}
          onToggleStatus={() => {
            handleToggleStatus(selectedStudentForView);
            setSelectedStudentForView(null);
          }}
        />
      )}

      {/* MODAL 3: EDIT STUDENT MODAL */}
      {selectedStudentForEdit && (
        <EditStudentModal
          student={selectedStudentForEdit}
          onClose={() => setSelectedStudentForEdit(null)}
          onSuccess={(updatedStudent) => {
            setSelectedStudentForEdit(null);
            setFeedbackMessage({
              type: 'success',
              text: `Student details for ${updatedStudent.full_name} updated successfully.`,
            });
            setRefreshTrigger((prev) => prev + 1);
          }}
        />
      )}

      {/* MODAL 4: CONFIRM DELETE MODAL */}
      {studentToDelete && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Delete Student Account?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to delete the student account for{' '}
                <strong className="text-slate-900 dark:text-white">
                  {studentToDelete.full_name}
                </strong>{' '}
                ({studentToDelete.matric_number || studentToDelete.matric_no})?
              </p>
              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium pt-1">
                This action is permanent and removes all associated weekly logbook entries and daily reports.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * ==============================================================================
 * SUB-COMPONENT: AddStudentModal
 * Module 08 — Provision Student Account Workflow
 * ==============================================================================
 */
interface AddStudentModalProps {
  onClose: () => void;
  onSuccess: (student: UserProfile) => void;
}

const AddStudentModal: React.FC<AddStudentModalProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState<StudentAccountCreationInput>({
    full_name: '',
    email: '',
    password: 'StudentPass2026!',
    matric_number: '',
    institution: 'Federal University of Technology, Akure',
    department: 'Computer Science',
    organisation: '',
    phone_number: '',
    siwes_start_date: '2026-03-02',
    siwes_end_date: '2026-08-28',
    supervisor_name: '',
    supervisor_phone: '',
    supervisor_email: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const generateSecurePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pass = 'Std!';
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password: pass }));
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.full_name.trim()) errors.full_name = 'Full name is required.';
    else if (formData.full_name.trim().length < 2) errors.full_name = 'Name must be at least 2 characters.';

    if (!formData.email.trim()) errors.email = 'Email address is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) errors.email = 'Enter a valid email address.';

    if (!formData.matric_number.trim()) errors.matric_number = 'Matriculation number is required.';
    if (!formData.department.trim()) errors.department = 'Department is required.';
    if (!formData.institution.trim()) errors.institution = 'Institution is required.';
    if (!formData.organisation.trim()) errors.organisation = 'SIWES Placement firm / organisation is required.';

    if (formData.password && formData.password.length < 6) {
      errors.password = 'Initial password must be at least 6 characters.';
    }

    if (formData.siwes_start_date && formData.siwes_end_date) {
      const s = new Date(formData.siwes_start_date);
      const e = new Date(formData.siwes_end_date);
      if (s > e) {
        errors.siwes_end_date = 'End date cannot be earlier than start date.';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const res = await adminService.createStudent(formData);
      if (res.success && res.data) {
        onSuccess(res.data);
      } else {
        setServerError(res.error?.message || 'Failed to create student account.');
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Provision Student Account
              </h3>
              <p className="text-xs text-slate-500">
                Create Auth credentials and associate student placement profile.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Security Notice */}
          <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 flex items-start gap-3 text-xs text-sky-800 dark:text-sky-300">
            <Lock className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold text-sky-900 dark:text-sky-200">
                Secure Account Provisioning
              </strong>
              <p className="mt-0.5 leading-relaxed">
                The role is locked to <code>student</code>. Auth creation is processed through the server endpoint without exposing the Supabase service-role key to the browser.
              </p>
            </div>
          </div>

          {serverError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Section A: Student Identity */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              1. Student Identity &amp; Auth
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Babajide Aminu"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {formErrors.full_name && (
                  <p className="text-[11px] text-rose-500 mt-1">{formErrors.full_name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. b.aminu@siwes.edu.ng"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {formErrors.email && (
                  <p className="text-[11px] text-rose-500 mt-1">{formErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Matriculation Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CSC/2021/1042"
                  value={formData.matric_number}
                  onChange={(e) => setFormData({ ...formData, matric_number: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white uppercase font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {formErrors.matric_number && (
                  <p className="text-[11px] text-rose-500 mt-1">{formErrors.matric_number}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +234 803 123 4567"
                  value={formData.phone_number || ''}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Initial Student Password <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={generateSecurePassword}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                  >
                    Generate Strong Password
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 pr-20 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="text-[11px] text-rose-500 mt-1">{formErrors.password}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section B: Academic & Department */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              2. Academic Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Institution <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Federal University of Technology, Akure"
                  value={formData.institution}
                  onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Department <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Science"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section C: SIWES Placement & Schedule */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              3. Industrial Placement Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Organisation / Placement Firm <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. National Information Technology Development Agency (NITDA)"
                  value={formData.organisation}
                  onChange={(e) => setFormData({ ...formData, organisation: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  SIWES Start Date
                </label>
                <input
                  type="date"
                  value={formData.siwes_start_date || ''}
                  onChange={(e) => setFormData({ ...formData, siwes_start_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  SIWES End Date
                </label>
                <input
                  type="date"
                  value={formData.siwes_end_date || ''}
                  onChange={(e) => setFormData({ ...formData, siwes_end_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {formErrors.siwes_end_date && (
                  <p className="text-[11px] text-rose-500 mt-1">{formErrors.siwes_end_date}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section D: Industry Supervisor */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              4. Industry Supervisor Contact (Optional)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Supervisor Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Engr. D. Adeleke"
                  value={formData.supervisor_name || ''}
                  onChange={(e) => setFormData({ ...formData, supervisor_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Supervisor Phone
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +234 802 333 4455"
                  value={formData.supervisor_phone || ''}
                  onChange={(e) => setFormData({ ...formData, supervisor_phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Supervisor Email
                </label>
                <input
                  type="email"
                  placeholder="e.g. d.adeleke@nitda.gov.ng"
                  value={formData.supervisor_email || ''}
                  onChange={(e) => setFormData({ ...formData, supervisor_email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Provisioning Account...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Provision Student</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * ==============================================================================
 * SUB-COMPONENT: StudentDetailsModal (Dossier)
 * ==============================================================================
 */
interface StudentDetailsModalProps {
  student: StudentWithLogbookStats;
  onClose: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
}

const StudentDetailsModal: React.FC<StudentDetailsModalProps> = ({
  student,
  onClose,
  onEdit,
  onToggleStatus,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const progress = studentService.calculatePlacementProgress(
    student.siwes_start_date,
    student.siwes_end_date
  );

  const stats = student.logbookStats;
  const initials = student.full_name
    ? student.full_name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'ST';

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white font-bold text-lg flex items-center justify-center shadow-sm">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  {student.full_name}
                </h3>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    student.is_active
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      student.is_active ? 'bg-emerald-500' : 'bg-slate-400'
                    }`}
                  />
                  {student.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="text-xs text-slate-500 font-mono mt-0.5">
                Matric: {student.matric_number || student.matric_no || 'Pending'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Logbook Progression Strip */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
              <span>Logbook Submissions Summary</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                {stats?.totalWeeks || 0} Total Weeks Recorded
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                <div className="text-lg font-bold font-mono text-emerald-600">
                  {stats?.approvedWeeks || 0}
                </div>
                <div className="text-[11px] text-slate-500">Approved</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                <div className="text-lg font-bold font-mono text-amber-600">
                  {stats?.submittedWeeks || 0}
                </div>
                <div className="text-[11px] text-slate-500">Awaiting Review</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                <div className="text-lg font-bold font-mono text-rose-600">
                  {stats?.returnedWeeks || 0}
                </div>
                <div className="text-[11px] text-slate-500">Returned</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                <div className="text-lg font-bold font-mono text-slate-600 dark:text-slate-400">
                  {stats?.draftWeeks || 0}
                </div>
                <div className="text-[11px] text-slate-500">Draft</div>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Identity & Academic */}
            <div className="space-y-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-emerald-600" />
                <span>Academic &amp; Contact</span>
              </h4>
              <div className="space-y-2 text-slate-600 dark:text-slate-300">
                <div>
                  <span className="text-slate-400 block text-[11px]">Email:</span>
                  <div className="flex items-center justify-between font-medium">
                    <span>{student.email}</span>
                    <button
                      onClick={() => handleCopy(student.email, 'email')}
                      className="text-slate-400 hover:text-slate-600"
                      title="Copy email"
                    >
                      {copiedField === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Phone:</span>
                  <span className="font-medium">{student.phone_number || 'None provided'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Institution:</span>
                  <span className="font-medium">{student.institution || 'Institutional attachment'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Department:</span>
                  <span className="font-medium">{student.department || 'Not specified'}</span>
                </div>
              </div>
            </div>

            {/* Industrial Placement */}
            <div className="space-y-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-sky-600" />
                <span>Industrial Placement</span>
              </h4>
              <div className="space-y-2 text-slate-600 dark:text-slate-300">
                <div>
                  <span className="text-slate-400 block text-[11px]">Firm / Company:</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {student.organisation || student.company_name || 'Not Assigned'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Schedule:</span>
                  <span className="font-mono tabular-nums">
                    {student.siwes_start_date ? `${student.siwes_start_date} to ${student.siwes_end_date || 'TBD'}` : 'Not set'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Timeline Progress:</span>
                  <div className="space-y-1 mt-0.5">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span>{progress.formattedDuration}</span>
                      <span>{progress.percentComplete}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${progress.percentComplete}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Supervisor Info */}
            <div className="sm:col-span-2 space-y-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-600" />
                <span>Industry Supervisor Contact</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-600 dark:text-slate-300">
                <div>
                  <span className="text-slate-400 block text-[11px]">Supervisor Name:</span>
                  <span className="font-medium">{student.supervisor_name || 'Pending assignment'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Supervisor Phone:</span>
                  <span className="font-medium">{student.supervisor_phone || 'None'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Supervisor Email:</span>
                  <span className="font-medium">{student.supervisor_email || 'None'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={onToggleStatus}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            {student.is_active ? <UserX className="w-4 h-4 text-slate-500" /> : <UserCheck className="w-4 h-4 text-emerald-500" />}
            <span>{student.is_active ? 'Deactivate Student Account' : 'Activate Student Account'}</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Close
            </button>
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * ==============================================================================
 * SUB-COMPONENT: EditStudentModal
 * ==============================================================================
 */
interface EditStudentModalProps {
  student: StudentWithLogbookStats;
  onClose: () => void;
  onSuccess: (student: UserProfile) => void;
}

const EditStudentModal: React.FC<EditStudentModalProps> = ({ student, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    full_name: student.full_name || '',
    phone_number: student.phone_number || '',
    matric_number: student.matric_number || student.matric_no || '',
    institution: student.institution || '',
    department: student.department || '',
    organisation: student.organisation || student.company_name || '',
    siwes_start_date: student.siwes_start_date || '',
    siwes_end_date: student.siwes_end_date || '',
    supervisor_name: student.supervisor_name || '',
    supervisor_phone: student.supervisor_phone || '',
    supervisor_email: student.supervisor_email || '',
    is_active: student.is_active,
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!formData.full_name.trim()) {
      setError('Full name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await adminService.updateStudent(student.id, formData);
      if (res.success && res.data) {
        onSuccess(res.data);
      } else {
        setError(res.error?.message || 'Failed to update student.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error saving edits.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <Edit2 className="w-5 h-5 text-sky-600" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Edit Student Information
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Matric Number
              </label>
              <input
                type="text"
                value={formData.matric_number}
                onChange={(e) => setFormData({ ...formData, matric_number: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm uppercase font-mono text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Institution
              </label>
              <input
                type="text"
                value={formData.institution}
                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Placement Organisation
              </label>
              <input
                type="text"
                value={formData.organisation}
                onChange={(e) => setFormData({ ...formData, organisation: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                SIWES Start Date
              </label>
              <input
                type="date"
                value={formData.siwes_start_date}
                onChange={(e) => setFormData({ ...formData, siwes_start_date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                SIWES End Date
              </label>
              <input
                type="date"
                value={formData.siwes_end_date}
                onChange={(e) => setFormData({ ...formData, siwes_end_date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Account Status
              </label>
              <select
                value={formData.is_active ? 'active' : 'inactive'}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
