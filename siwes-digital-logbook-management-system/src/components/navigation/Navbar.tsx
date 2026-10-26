/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Menu,
  GraduationCap,
  Building2,
  Bell,
  Sparkles,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { UserMenu } from '../auth/UserMenu';
import { NavItemConfig } from './navigationConfig';
import { notificationService } from '../../services/notificationService';

interface NavbarProps {
  activeItem?: NavItemConfig;
  onOpenMobileNav: () => void;
  onNavigateToNotifications?: () => void;
  className?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeItem,
  onOpenMobileNav,
  onNavigateToNotifications,
  className = ''
}) => {
  const { user, profile, role, isDemo } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    const currentUserId =
      user?.id ||
      profile?.id ||
      (role === 'admin' ? 'demo-admin-uuid-002' : 'demo-student-uuid-001');

    const fetchCount = async () => {
      const res = await notificationService.getUnreadCount(currentUserId);
      if (res.success && typeof res.data === 'number') {
        setUnreadCount(res.data);
      }
    };

    fetchCount();
    const unsubscribe = notificationService.subscribe(fetchCount);
    return () => unsubscribe();
  }, [user?.id, profile?.id, role]);

  return (
    <header
      className={`h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 ${className}`}
    >
      {/* Left: Mobile Menu Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Button */}
        <button
          onClick={onOpenMobileNav}
          className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          aria-label="Open mobile navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumbs / Page Title */}
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <span className="font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">
            {role === 'admin' ? 'Coordinator Portal' : 'Student Portal'}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
          <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            {activeItem?.label || 'Dashboard'}
          </span>
        </div>
      </div>

      {/* Right: Quick actions, Role Badge, and User Menu */}
      <div className="flex items-center gap-3">
        {/* Role Pill Indicator */}
        <div
          className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            role === 'admin'
              ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-300'
              : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
          }`}
        >
          {role === 'admin' ? (
            <Building2 className="w-3.5 h-3.5" />
          ) : (
            <GraduationCap className="w-3.5 h-3.5" />
          )}
          <span>{role === 'admin' ? 'Administrator' : 'Student'}</span>
          {isDemo && (
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded bg-amber-200 dark:bg-amber-800/80 text-amber-900 dark:text-amber-200 font-bold">
              Demo
            </span>
          )}
        </div>



        {/* Real Notifications Button with Live Unread Indicator (Module 11) */}
        <button
          onClick={onNavigateToNotifications}
          className="p-2 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 relative transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
          aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'No unread notifications'}
          title={unreadCount > 0 ? `${unreadCount} unread notifications` : 'View notifications'}
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-slate-900 animate-in zoom-in-50 duration-150"
              aria-hidden="true"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* User Dropdown Menu */}
        <UserMenu />
      </div>
    </header>
  );
};
