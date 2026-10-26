/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  LogOut,
  ChevronDown,
  GraduationCap,
  ShieldCheck,
  Building2,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Badge } from '../ui/Badge';

export const UserMenu: React.FC = () => {
  const { profile, role, logout, isDemoSession } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!profile) return null;

  const initials = profile.full_name
    ? profile.full_name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  const roleLabel = role === 'admin' ? 'Administrator' : 'Student';
  const roleColor = role === 'admin' ? 'info' : 'success';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
        aria-expanded={isOpen}
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white shadow-xs ${
          role === 'admin'
            ? 'bg-gradient-to-br from-sky-600 to-indigo-700'
            : 'bg-gradient-to-br from-emerald-600 to-teal-700'
        }`}>
          {initials}
        </div>

        <div className="hidden sm:block text-left">
          <div className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[130px]">
            {profile.full_name}
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant={roleColor} size="sm">
              {roleLabel}
            </Badge>
            {isDemoSession && (
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">
                demo
              </span>
            )}
          </div>
        </div>

        <ChevronDown className="w-4 h-4 text-slate-400 transition-transform hidden sm:block" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-2 z-50 animate-fadeIn space-y-2">
          {/* User Overview */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {profile.full_name}
              </span>
              <Badge variant={roleColor} size="sm">
                {roleLabel}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-mono">
              {profile.email}
            </p>
            {profile.matric_number && (
              <div className="text-[11px] text-slate-500 pt-1">
                Matric No: <span className="font-mono text-slate-700 dark:text-slate-300">{profile.matric_number}</span>
              </div>
            )}
            {profile.department && (
              <div className="text-[11px] text-slate-500">
                Dept: <span className="text-slate-700 dark:text-slate-300">{profile.department}</span>
              </div>
            )}
          </div>


          {/* Sign Out Button */}
          <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full py-2 px-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
