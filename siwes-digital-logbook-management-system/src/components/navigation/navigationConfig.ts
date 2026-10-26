/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  LayoutDashboard,
  User,
  CalendarCheck,
  Users,
  FileText,
  LogOut,
  Bell,
  LucideIcon
} from 'lucide-react';
import { UserRole } from '../../types/auth';

export type NavItemId =
  | 'dashboard'
  | 'profile'
  | 'daily-activity'
  | 'notifications'
  | 'students'
  | 'reports'
  | 'logout';

export interface NavItemConfig {
  id: NavItemId;
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
  path: string;
  description: string;
  badge?: string | number;
  badgeVariant?: 'default' | 'success' | 'warning' | 'info';
  allowedRoles: UserRole[];
  isAction?: boolean;
}

/**
 * Student navigation items:
 * - Dashboard
 * - Daily Activity
 * - Notifications (Module 11)
 * - Profile
 * - Logout
 */
export const STUDENT_NAV_ITEMS: NavItemConfig[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/student/dashboard',
    description: 'Overview of logbook progress, attachment timeline, and status',
    allowedRoles: ['student']
  },
  {
    id: 'daily-activity',
    label: 'Daily Activity',
    icon: CalendarCheck,
    path: '/student/activity',
    description: 'Daily logbook entries, weekly summaries, and skill records',
    badge: 'Today',
    badgeVariant: 'info',
    allowedRoles: ['student']
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    path: '/student/notifications',
    description: 'Supervisor remarks, report approvals, and revision alerts',
    allowedRoles: ['student']
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: User,
    path: '/student/profile',
    description: 'Student institutional data, attachment company, and supervisor details',
    allowedRoles: ['student']
  },
  {
    id: 'logout',
    label: 'Logout',
    icon: LogOut,
    path: '/logout',
    description: 'Securely sign out of the SIWES session',
    allowedRoles: ['student'],
    isAction: true
  }
];

/**
 * Administrator navigation items:
 * - Dashboard
 * - Students
 * - Reports
 * - Notifications (Module 11)
 * - Profile
 * - Logout
 */
export const ADMIN_NAV_ITEMS: NavItemConfig[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/admin/dashboard',
    description: 'Institutional metrics, review queue status, and student overview',
    allowedRoles: ['admin']
  },
  {
    id: 'students',
    label: 'Students',
    icon: Users,
    path: '/admin/students',
    description: 'Student accounts provisioning, departmental cohort management',
    badge: 'Directory',
    badgeVariant: 'default',
    allowedRoles: ['admin']
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: FileText,
    path: '/admin/reports',
    description: 'Weekly logbook review, grading, remarks, and supervisor endorsement',
    badge: 'Review',
    badgeVariant: 'warning',
    allowedRoles: ['admin']
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    path: '/admin/notifications',
    description: 'Student submission alerts, resubmission notices, and action items',
    allowedRoles: ['admin']
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: User,
    path: '/admin/profile',
    description: 'Coordinator credentials, department oversight, and settings',
    allowedRoles: ['admin']
  },
  {
    id: 'logout',
    label: 'Logout',
    icon: LogOut,
    path: '/logout',
    description: 'Securely sign out of the SIWES coordinator session',
    allowedRoles: ['admin'],
    isAction: true
  }
];

/**
 * Helper to retrieve navigation items strictly filtered by role.
 */
export function getNavigationForRole(role: UserRole | null | undefined): NavItemConfig[] {
  if (!role) return [];
  if (role === 'admin') return ADMIN_NAV_ITEMS;
  return STUDENT_NAV_ITEMS;
}
