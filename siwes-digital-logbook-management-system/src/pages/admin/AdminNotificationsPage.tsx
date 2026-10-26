/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Clock,
  CheckCheck,
  Send,
  RotateCcw,
  ArrowRight,
  Filter,
  RefreshCw,
  Inbox,
  Building2,
  FileText
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { PageHeader } from '../../components/navigation/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { AppNotification, NotificationType } from '../../types/notification';
import { notificationService } from '../../services/notificationService';

export interface AdminNotificationsPageProps {
  onNavigateToReports?: () => void;
}

export const AdminNotificationsPage: React.FC<AdminNotificationsPageProps> = ({
  onNavigateToReports,
}) => {
  const { user, profile } = useAuth();
  const adminId = user?.id || profile?.id || 'demo-admin-uuid-002';

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedType, setSelectedType] = useState<NotificationType | 'all'>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await notificationService.getNotifications(adminId);
      if (res.success && res.data) {
        setNotifications(res.data);
      } else {
        setErrorMessage(res.error?.message || 'Failed to load coordinator alerts.');
      }
    } catch {
      setErrorMessage('Unexpected connection error loading alerts.');
    } finally {
      setIsLoading(false);
    }
  }, [adminId]);

  useEffect(() => {
    let isMounted = true;
    const initFetch = async () => {
      try {
        const res = await notificationService.getNotifications(adminId);
        if (isMounted) {
          if (res.success && res.data) {
            setNotifications(res.data);
          } else {
            setErrorMessage(res.error?.message || 'Failed to load coordinator alerts.');
          }
        }
      } catch {
        if (isMounted) {
          setErrorMessage('Unexpected connection error loading alerts.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initFetch();

    const unsubscribe = notificationService.subscribe(() => {
      notificationService.getNotifications(adminId).then((res) => {
        if (isMounted && res.success && res.data) {
          setNotifications(res.data);
        }
      });
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [adminId]);

  const handleMarkAsRead = async (notif: AppNotification, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (notif.is_read) return;

    try {
      const res = await notificationService.markAsRead(notif.id, adminId);
      if (res.success && res.data) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
        );
      }
    } catch {
      // Fallback
    }
  };

  const handleMarkAllAsRead = async () => {
    setIsUpdating(true);
    try {
      const res = await notificationService.markAllAsRead(adminId);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
        );
        setActionSuccessMsg('All administrator alerts marked as read.');
        setTimeout(() => setActionSuccessMsg(null), 3000);
      } else {
        setErrorMessage(res.error?.message || 'Failed to mark all as read.');
      }
    } catch {
      setErrorMessage('Error marking alerts as read.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOpenAlert = async (notif: AppNotification) => {
    if (!notif.is_read) {
      await handleMarkAsRead(notif);
    }

    if (onNavigateToReports) {
      onNavigateToReports();
    }
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      if (filterTab === 'unread' && notif.is_read) return false;
      if (filterTab === 'read' && !notif.is_read) return false;
      if (selectedType !== 'all' && notif.type !== selectedType) return false;
      return true;
    });
  }, [notifications, filterTab, selectedType]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.is_read).length, [notifications]);

  const formatTimestamp = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 2) return 'Just now';
      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;

      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'report_resubmitted':
        return <RotateCcw className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />;
      case 'report_submitted':
        return <Send className="w-5 h-5 text-sky-600 dark:text-sky-400 flex-shrink-0" />;
      default:
        return <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />;
    }
  };

  const getTypeBadge = (type: NotificationType) => {
    switch (type) {
      case 'report_resubmitted':
        return <Badge variant="warning">Resubmitted for Review</Badge>;
      case 'report_submitted':
        return <Badge variant="info">New Submission</Badge>;
      default:
        return <Badge variant="neutral">System Alert</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Coordinator Alerts & Submission Notices"
        subtitle="Operational feed of student weekly logbook submissions, returned report resubmissions, and review milestones."
        icon={Bell}
        badge={
          unreadCount > 0 ? (
            <Badge variant="warning">{unreadCount} Pending Action</Badge>
          ) : (
            <Badge variant="success">Review Queue Clear</Badge>
          )
        }
        breadcrumbs={[
          { label: 'Coordinator Portal' },
          { label: 'Notifications' },
        ]}
        actions={
          unreadCount > 0 ? (
            <button
              onClick={handleMarkAllAsRead}
              disabled={isUpdating}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <CheckCheck className="w-4 h-4 text-sky-600" />
              <span>Mark All as Read</span>
            </button>
          ) : undefined
        }
      />

      {actionSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 flex items-center justify-between text-xs sm:text-sm text-sky-800 dark:text-sky-300 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-sky-600 flex-shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button
            onClick={() => setActionSuccessMsg(null)}
            className="text-sky-700 hover:text-sky-900 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center justify-between text-xs sm:text-sm text-rose-800 dark:text-rose-300 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-700 hover:text-rose-900 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter Tabs Bar */}
      <Card>
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filterTab === 'all'
                  ? 'bg-sky-700 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All Alerts ({notifications.length})
            </button>
            <button
              onClick={() => setFilterTab('unread')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                filterTab === 'unread'
                  ? 'bg-sky-700 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>Unread</span>
              {unreadCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  filterTab === 'unread' ? 'bg-white/20 text-white' : 'bg-sky-200 dark:bg-sky-900 text-sky-900 dark:text-sky-200'
                }`}>
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilterTab('read')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filterTab === 'read'
                  ? 'bg-sky-700 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Read ({notifications.filter((n) => n.is_read).length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Filter className="w-3.5 h-3.5" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as NotificationType | 'all')}
                className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-xs py-1.5 px-2.5 text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-sky-500 cursor-pointer"
              >
                <option value="all">All Submission Types</option>
                <option value="report_submitted">New Submissions</option>
                <option value="report_resubmitted">Resubmissions</option>
              </select>
            </div>

            <button
              onClick={fetchAlerts}
              disabled={isLoading}
              title="Refresh alerts"
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Alerts Feed */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {isLoading ? (
            <div className="p-8 text-center space-y-3">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-sky-500 border-t-transparent" />
              <p className="text-xs text-slate-500 dark:text-slate-400">Loading coordinator alerts...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 mx-auto flex items-center justify-center text-slate-400">
                <Inbox className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                No alerts in this view.
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Student submissions and resubmissions awaiting coordinator inspection will appear here in real-time.
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const isUnread = !notif.is_read;

              return (
                <div
                  key={notif.id}
                  onClick={() => handleOpenAlert(notif)}
                  className={`p-4 sm:p-5 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-start justify-between gap-4 group ${
                    isUnread
                      ? 'bg-sky-50/40 dark:bg-sky-950/20 border-l-4 border-sky-600'
                      : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40 border-l-4 border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={`p-2.5 rounded-xl flex-shrink-0 mt-0.5 ${
                        notif.type === 'report_resubmitted'
                          ? 'bg-amber-100/80 dark:bg-amber-950/60'
                          : 'bg-sky-100/80 dark:bg-sky-950/60'
                      }`}
                    >
                      {getTypeIcon(notif.type)}
                    </div>

                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4
                          className={`text-sm ${
                            isUnread
                              ? 'font-bold text-slate-900 dark:text-white'
                              : 'font-semibold text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          {notif.title}
                        </h4>

                        {getTypeBadge(notif.type)}

                        {isUnread && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-900/60 px-1.5 py-0.2 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
                            Pending Review
                          </span>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed break-words">
                        {notif.message}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimestamp(notif.created_at)}</span>
                        </span>

                        {notif.sender_name && (
                          <span>
                            Student: <strong className="font-semibold text-slate-600 dark:text-slate-300">{notif.sender_name}</strong>
                          </span>
                        )}

                        {notif.week_number && (
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                            Week {notif.week_number}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenAlert(notif);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-700 hover:bg-sky-800 text-white font-medium text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Review Report</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    {isUnread && (
                      <button
                        onClick={(e) => handleMarkAsRead(notif, e)}
                        className="text-[11px] text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 font-medium transition-colors cursor-pointer flex items-center gap-1"
                        title="Mark alert as read"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Mark read</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
};
