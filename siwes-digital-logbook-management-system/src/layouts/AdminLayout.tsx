/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppLayout } from './AppLayout';
import {
  ADMIN_NAV_ITEMS,
  NavItemConfig,
  NavItemId
} from '../components/navigation/navigationConfig';

export interface AdminLayoutProps {
  activeNavId: NavItemId;
  onNavigate: (item: NavItemConfig) => void;
  children: React.ReactNode;
}

/**
 * Dedicated Layout for Administrators / SIWES Coordinators.
 * Preconfigured with ADMIN_NAV_ITEMS:
 * - Dashboard
 * - Students
 * - Reports
 * - Profile
 * - Logout
 */
export const AdminLayout: React.FC<AdminLayoutProps> = ({
  activeNavId,
  onNavigate,
  children
}) => {
  return (
    <AppLayout
      navItems={ADMIN_NAV_ITEMS}
      activeNavId={activeNavId}
      onNavigate={onNavigate}
      className="admin-theme"
    >
      {children}
    </AppLayout>
  );
};
