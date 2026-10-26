/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sidebar } from '../components/navigation/Sidebar';
import { Navbar } from '../components/navigation/Navbar';
import { MobileNav } from '../components/navigation/MobileNav';
import {
  NavItemConfig,
  NavItemId,
  getNavigationForRole
} from '../components/navigation/navigationConfig';
import { useAuth } from '../hooks/useAuth';

export interface AppLayoutProps {
  navItems?: NavItemConfig[];
  activeNavId: NavItemId;
  onNavigate: (item: NavItemConfig) => void;
  children: React.ReactNode;
  className?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  navItems: customNavItems,
  activeNavId,
  onNavigate,
  children,
  className = ''
}) => {
  const { role, signOut } = useAuth();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Fallback to role-based navigation if customNavItems is not supplied
  const navItems = customNavItems || getNavigationForRole(role);

  const activeItem = navItems.find((item) => item.id === activeNavId);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleItemClick = (item: NavItemConfig) => {
    if (item.isAction && item.id === 'logout') {
      handleLogout();
    } else {
      onNavigate(item);
    }
  };

  return (
    <div className={`min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased ${className}`}>
      {/* Desktop Sidebar (visible on lg+) */}
      <div className="hidden lg:flex flex-shrink-0 sticky top-0 h-screen z-20">
        <Sidebar
          navItems={navItems}
          activeNavId={activeNavId}
          onNavigate={handleItemClick}
          onLogout={handleLogout}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>

      {/* Mobile Drawer (accessible slide-over) */}
      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        navItems={navItems}
        activeNavId={activeNavId}
        onNavigate={handleItemClick}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Navbar */}
        <Navbar
          activeItem={activeItem}
          onOpenMobileNav={() => setIsMobileNavOpen(true)}
          onNavigateToNotifications={() => {
            const notifItem = navItems.find((i) => i.id === 'notifications');
            if (notifItem) {
              handleItemClick(notifItem);
            }
          }}
        />

        {/* Dynamic Page Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
          {children}
        </main>
      </div>
    </div>
  );
};
