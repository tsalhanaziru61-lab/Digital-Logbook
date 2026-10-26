/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen, ShieldCheck, Terminal, LogIn } from 'lucide-react';
import { APP_NAME, APP_TAGLINE } from '../../constants';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../hooks/useAuth';
import { UserMenu } from '../auth/UserMenu';

interface HeaderProps {
  isSupabaseConfigured: boolean;
  onOpenLogin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isSupabaseConfigured,
  onOpenLogin,
}) => {
  const { isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & App Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  {APP_NAME}
                </h1>
                <Badge variant="purple" size="sm">
                  Module 03
                </Badge>
              </div>
              <p className="hidden md:block text-xs text-slate-500 dark:text-slate-400">
                {APP_TAGLINE}
              </p>
            </div>
          </div>

          {/* User Controls & Connection Status */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 font-mono">
              <Terminal className="w-3.5 h-3.5 text-slate-500" />
              <span>Auth &amp; RBAC Active</span>
            </div>

            {isSupabaseConfigured ? (
              <Badge variant="success" size="sm" className="hidden sm:inline-flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Supabase Auth</span>
              </Badge>
            ) : (
              <Badge variant="warning" size="sm" className="hidden sm:inline-flex gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>Sandbox Auth</span>
              </Badge>
            )}

            {/* User Dropdown or Sign In CTA */}
            {isAuthenticated ? (
              <UserMenu />
            ) : (
              onOpenLogin && (
                <button
                  onClick={onOpenLogin}
                  className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs sm:text-sm transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
