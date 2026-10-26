/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
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

interface SidebarProps {
  navItems: NavItemConfig[];
  activeNavId: NavItemId;
  onNavigate: (item: NavItemConfig) => void;
  onLogout: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  navItems,
  activeNavId,
  onNavigate,
  onLogout,
  isCollapsed = false,
  className = ''
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

  const userDisplayName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const userMatricOrDept =
    role === 'student'
      ? profile?.matric_number || profile?.matric_no || 'Matric Pending'
      : profile?.department || 'SIWES Unit';

  return (
    <aside
      className={`h-full flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64 sm:w-72'
      } ${className}`}
      aria-label="Primary Application Sidebar"
    >
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm flex-shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col truncate">
              <span className="font-bold text-sm text-slate-900 dark:text-white tracking-tight truncate">
                SIWES Logbook
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Digital Management System
              </span>
            </div>
          )}
        </div>
      </div>

      {/* User Identity Card */}
      <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/80">
        <div
          className={`rounded-xl p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-3 ${
            isCollapsed ? 'justify-center p-2' : ''
          }`}
        >
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
              role === 'admin'
                ? 'bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-300 ring-1 ring-sky-300 dark:ring-sky-700'
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 ring-1 ring-emerald-300 dark:ring-emerald-700'
            }`}
            title={userDisplayName}
          >
            {role === 'admin' ? (
              <Building2 className="w-4 h-4" />
            ) : (
              <GraduationCap className="w-4 h-4" />
            )}
          </div>

          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {userDisplayName}
                </p>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono">
                {userMatricOrDept}
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${
                    role === 'admin'
                      ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400'
                      : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                  }`}
                >
                  <ShieldCheck className="w-2.5 h-2.5" />
                  {role === 'admin' ? 'Coordinator' : 'Student'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2">
          {!isCollapsed ? (
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {role === 'admin' ? 'Coordinator Portal' : 'Student Portal'}
            </p>
          ) : (
            <div className="h-2" />
          )}
        </div>

        <nav className="space-y-1" aria-label="Sidebar Navigation">
          {navItems
            .filter((item) => !item.isAction)
            .map((item) => {
              const Icon = item.icon;
              const isActive = activeNavId === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all group cursor-pointer ${
                    isActive
                      ? role === 'admin'
                        ? 'bg-sky-50 text-sky-800 dark:bg-sky-950/80 dark:text-sky-200 font-semibold shadow-xs'
                        : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200 font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 transition-colors ${
                      isActive
                        ? role === 'admin'
                          ? 'text-sky-600 dark:text-sky-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                    }`}
                  />

                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-left truncate">{item.label}</span>
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
                                : item.badgeVariant === 'info'
                                ? 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300'
                                : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )
                      )}
                      <ChevronRight
                        className={`w-3.5 h-3.5 text-slate-300 transition-opacity ${
                          isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'
                        }`}
                      />
                    </>
                  )}
                </button>
              );
            })}
        </nav>
      </div>

      {/* Module 04 Architecture Banner */}
      {!isCollapsed && (
        <div className="px-4 pb-3">
          <div className="p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 mt-0.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <div className="leading-tight">
              <span className="font-semibold block">Module 04 Shell Active</span>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400">
                Responsive layout &amp; role-aware navigation
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Actions: Logout */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={onLogout}
          title={isCollapsed ? 'Logout' : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};
