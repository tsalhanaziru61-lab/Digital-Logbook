/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppLayout } from './AppLayout';
import {
  STUDENT_NAV_ITEMS,
  NavItemConfig,
  NavItemId
} from '../components/navigation/navigationConfig';

export interface StudentLayoutProps {
  activeNavId: NavItemId;
  onNavigate: (item: NavItemConfig) => void;
  children: React.ReactNode;
}

/**
 * Dedicated Layout for Students.
 * Preconfigured with STUDENT_NAV_ITEMS:
 * - Dashboard
 * - Profile
 * - Daily Activity
 * - Logout
 */
export const StudentLayout: React.FC<StudentLayoutProps> = ({
  activeNavId,
  onNavigate,
  children
}) => {
  return (
    <AppLayout
      navItems={STUDENT_NAV_ITEMS}
      activeNavId={activeNavId}
      onNavigate={onNavigate}
      className="student-theme"
    >
      {children}
    </AppLayout>
  );
};
