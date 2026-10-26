/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  User,
  Building2,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Info
} from 'lucide-react';
import { PageHeader } from '../../components/navigation/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';

export const AdminProfilePage: React.FC = () => {
  const { profile, user } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Coordinator Profile & Settings"
        subtitle="Manage your institutional coordinator profile, assigned departments, and system notifications."
        icon={User}
        badge={<Badge variant="info">Administrative Account</Badge>}
        breadcrumbs={[
          { label: 'Admin Portal' },
          { label: 'Profile' }
        ]}
      />

      {/* Module Notice */}
      <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 flex items-start gap-3">
        <Info className="w-5 h-5 text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm">
          <h4 className="font-semibold text-sky-900 dark:text-sky-200">
            Admin Profile Shell Placeholder (Module 04)
          </h4>
          <p className="text-sky-800 dark:text-sky-300 mt-1 leading-relaxed">
            This administrator profile view is mounted in the <code>AdminLayout</code> shell. Department assignment, signature stamp customization, and multi-user delegation settings will be fully editable in administrative management modules.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Officer Information */}
        <Card>
          <CardHeader
            title="Coordinator Identity"
            subtitle="Institutional credentials and supervisory role"
            icon={<ShieldCheck className="w-5 h-5 text-sky-600" />}
          />
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[11px] text-slate-400 font-mono uppercase">Full Name</span>
                <p className="font-semibold text-slate-900 dark:text-white mt-0.5">
                  {profile?.full_name || 'Dr. O. Babatunde'}
                </p>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-mono uppercase">Role Privilege</span>
                <p className="font-semibold text-sky-600 dark:text-sky-400 mt-0.5">
                  Institutional Coordinator
                </p>
              </div>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 font-mono uppercase">Assigned Unit / Department</span>
              <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                {profile?.department || 'Directorate of SIWES & Industrial Attachment'}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 font-mono uppercase">Coordinator Email</span>
              <p className="font-mono text-slate-700 dark:text-slate-300 mt-0.5">
                {user?.email || profile?.email || 'admin@siwes.edu.ng'}
              </p>
            </div>
          </div>
        </Card>

        {/* Security & Access Policies */}
        <Card>
          <CardHeader
            title="System Access Controls"
            subtitle="Row Level Security &amp; privileged capabilities"
            icon={<Building2 className="w-5 h-5 text-indigo-600" />}
          />
          <div className="space-y-3 text-xs sm:text-sm">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block">
                  Student Provisioning Rights
                </span>
                <span className="text-slate-500 text-xs">
                  Authorized to create, invite, and assign student attachment accounts.
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block">
                  Weekly Report Endorsement
                </span>
                <span className="text-slate-500 text-xs">
                  Authorized to grade weekly log summaries and submit official remarks.
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block">
                  Institutional Export &amp; Audit
                </span>
                <span className="text-slate-500 text-xs">
                  Full clearance for ITF (Industrial Training Fund) audit compliance logs.
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
