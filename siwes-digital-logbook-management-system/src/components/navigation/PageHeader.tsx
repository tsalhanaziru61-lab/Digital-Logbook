/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  badge?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  badge,
  breadcrumbs,
  actions,
  className = ''
}) => {
  return (
    <div
      className={`mb-6 pb-5 border-b border-slate-200 dark:border-slate-800 ${className}`}
    >
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav
          className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-2"
          aria-label="Breadcrumbs"
        >
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.label}>
              {idx > 0 && <span>/</span>}
              <span
                className={
                  idx === breadcrumbs.length - 1
                    ? 'font-semibold text-slate-700 dark:text-slate-200'
                    : ''
                }
              >
                {crumb.label}
              </span>
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Main Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          {Icon && (
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 flex-shrink-0 mt-0.5 shadow-xs">
              <Icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {title}
              </h1>
              {badge}
            </div>
            {subtitle && (
              <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-3xl">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex items-center gap-2.5 flex-shrink-0 self-start sm:self-center">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
