/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  GraduationCap,
  Building2,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { NavItemConfig, NavItemId } from './navigationConfig';
import { notificationService } from '../../services/notificationService';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: NavItemConfig[];
  activeNavId: NavItemId;
  onNavigate: (item: NavItemConfig) => void;
  onLogout: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  isOpen,
  onClose,
  navItems,
  activeNavId,
  onNavigate,
  onLogout
}) => {
  const { user, profile, role } = useAuth();
  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(0);

  useEffect(() => {
    const currentUserId =
      user?.id ||
      profile?.id ||
      (role === 'admin' ? 'demo-admin-uuid-002' : 'demo-student-uuid-001');

    const fetchCount = async () => {
      const res = await notificationService.getUnreadCount(currentUserId);
      if (res.success && typeof res.data === 'number') {
        setUnreadNotifCount(res.data);
      }
    };

    fetchCount();
    const unsubscribe = notificationService.subscribe(fetchCount);
    return () => unsubscribe();
  }, [user?.id, profile?.id, role]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const userDisplayName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const userMatricOrDept =
    role === 'student'
      ? profile?.matric_number || profile?.matric_no || 'Matric Pending'
      : profile?.department || 'SIWES Unit';

  return (
    <div
      className="fixed inset-0 z-50 lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation Drawer"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-white dark:bg-slate-900 shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200 border-r border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                SIWES Logbook
              </span>
              <span className="text-[10px] text-slate-500 block leading-none">
                {role === 'admin' ? 'Admin Portal' : 'Student Portal'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            aria-label="Close mobile navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                role === 'admin'
                  ? 'bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-300'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
              }`}
            >
              {role === 'admin' ? (
                <Building2 className="w-5 h-5" />
              ) : (
                <GraduationCap className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {userDisplayName}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                {userMatricOrDept}
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${
                    role === 'admin'
                      ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                  }`}
                >
                  <ShieldCheck className="w-2.5 h-2.5" />
                  {role === 'admin' ? 'Administrator' : 'Student'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          <p className="px-3 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Menu Navigation
          </p>

          <nav className="space-y-1">
            {navItems
              .filter((item) => !item.isAction)
              .map((item) => {
                const Icon = item.icon;
                const isActive = activeNavId === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item);
                      onClose();
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                      isActive
                        ? role === 'admin'
                          ? 'bg-sky-50 text-sky-800 dark:bg-sky-950/80 dark:text-sky-200 font-bold'
                          : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200 font-bold'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 flex-shrink-0 ${
                        isActive
                          ? role === 'admin'
                            ? 'text-sky-600 dark:text-sky-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-400'
                      }`}
                    />
                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between">
                        <span>{item.label}</span>
                        {item.id === 'notifications' && unreadNotifCount > 0 ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 ring-1 ring-emerald-300 dark:ring-emerald-700">
                            {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                          </span>
                        ) : (
                          item.badge && (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                item.badgeVariant === 'warning'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                                  : 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-normal truncate">
                        {item.description}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                  </button>
                );
              })}
          </nav>
        </div>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs">
            <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>SIWES Digital Logbook System</span>
          </div>

          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
