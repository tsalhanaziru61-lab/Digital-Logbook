/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Send,
  Info,
  Clock,
  CheckCheck,
  ChevronRight,
  Filter,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Inbox
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { PageHeader } from '../../components/navigation/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { AppNotification, NotificationType } from '../../types/notification';
import { notificationService } from '../../services/notificationService';

export interface StudentNotificationsPageProps {
  onNavigateToActivity?: (weekNumber?: number) => void;
}

export const StudentNotificationsPage: React.FC<StudentNotificationsPageProps> = ({
  onNavigateToActivity,
}) => {
  const { user, profile } = useAuth();
  const studentId = user?.id || profile?.id || 'demo-student-uuid-001';

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedType, setSelectedType] = useState<NotificationType | 'all'>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Load notifications from service
  const fetchStudentNotifications = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await notificationService.getNotifications(studentId);
      if (res.success && res.data) {
        setNotifications(res.data);
      } else {
        setErrorMessage(res.error?.message || 'Failed to load notifications.');
      }
    } catch {
      setErrorMessage('Unexpected connection error loading notifications.');
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    let isMounted = true;
    const initFetch = async () => {
      try {
        const res = await notificationService.getNotifications(studentId);
        if (isMounted) {
          if (res.success && res.data) {
            setNotifications(res.data);
          } else {
            setErrorMessage(res.error?.message || 'Failed to load notifications.');
          }
        }
      } catch {
        if (isMounted) {
          setErrorMessage('Unexpected connection error loading notifications.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initFetch();

    const unsubscribe = notificationService.subscribe(() => {
      notificationService.getNotifications(studentId).then((res) => {
        if (isMounted && res.success && res.data) {
          setNotifications(res.data);
        }
      });
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [studentId]);

  // Mark single notification as read
  const handleMarkAsRead = async (notif: AppNotification, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (notif.is_read) return;

    try {
      const res = await notificationService.markAsRead(notif.id, studentId);
      if (res.success && res.data) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
        );
      }
    } catch {
      // Fallback
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    setIsUpdating(true);
    try {
      const res = await notificationService.markAllAsRead(studentId);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
        );
        setActionSuccessMsg('All notifications marked as read.');
        setTimeout(() => setActionSuccessMsg(null), 3000);
      } else {
        setErrorMessage(res.error?.message || 'Failed to mark all as read.');
      }
    } catch {
      setErrorMessage('Error marking all notifications as read.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Click on a notification or "View Report" button
  const handleOpenNotification = async (notif: AppNotification) => {
    if (!notif.is_read) {
      await handleMarkAsRead(notif);
    }

    if (onNavigateToActivity) {
      // If notification is tied to a specific week_number, open that exact week!
      if (notif.week_number) {
        onNavigateToActivity(notif.week_number);
      } else {
        onNavigateToActivity();
      }
    }
  };

  // Filtered notifications list
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      if (filterTab === 'unread' && notif.is_read) return false;
      if (filterTab === 'read' && !notif.is_read) return false;
      if (selectedType !== 'all' && notif.type !== selectedType) return false;
      return true;
    });
  }, [notifications, filterTab, selectedType]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.is_read).length, [notifications]);

  // Helper for human-friendly date formatting
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
      case 'report_approved':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />;
      case 'report_returned':
        return <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0" />;
      case 'report_resubmitted':
      case 'report_submitted':
        return <Send className="w-5 h-5 text-sky-600 dark:text-sky-400 flex-shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-slate-500 dark:text-slate-400 flex-shrink-0" />;
    }
  };

  const getTypeBadge = (type: NotificationType) => {
    switch (type) {
      case 'report_approved':
        return <Badge variant="success">Approved</Badge>;
      case 'report_returned':
        return <Badge variant="danger">Returned for Correction</Badge>;
      case 'report_resubmitted':
        return <Badge variant="info">Resubmitted</Badge>;
      case 'report_submitted':
        return <Badge variant="info">Submitted</Badge>;
      default:
        return <Badge variant="neutral">System Notice</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Page Header */}
      <PageHeader
        title="Notifications & Review Feedback"
        subtitle="Stay updated on weekly report approvals, coordinator remarks, and required logbook corrections."
        icon={Bell}
        badge={
          unreadCount > 0 ? (
            <Badge variant="warning">{unreadCount} Unread</Badge>
          ) : (
            <Badge variant="success">All Caught Up</Badge>
          )
        }
        breadcrumbs={[
          { label: 'Student Portal' },
          { label: 'Notifications' },
        ]}
        actions={
          unreadCount > 0 ? (
            <button
              onClick={handleMarkAllAsRead}
              disabled={isUpdating}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <CheckCheck className="w-4 h-4 text-emerald-600" />
              <span>Mark All as Read</span>
            </button>
          ) : undefined
        }
      />

      {/* Action Messages */}
      {actionSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button
            onClick={() => setActionSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center justify-between text-xs sm:text-sm text-rose-800 dark:text-rose-300 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
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

      {/* Filter Tabs & Filter Dropdown Bar */}
      <Card>
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filterTab === 'all'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilterTab('unread')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                filterTab === 'unread'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>Unread</span>
              {unreadCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  filterTab === 'unread' ? 'bg-white/20 text-white' : 'bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200'
                }`}>
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilterTab('read')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filterTab === 'read'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Read ({notifications.filter((n) => n.is_read).length})
            </button>
          </div>

          {/* Type Filter & Refresh */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Filter className="w-3.5 h-3.5" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as NotificationType | 'all')}
                className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-xs py-1.5 px-2.5 text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="report_approved">Approved Reports</option>
                <option value="report_returned">Returned Reports</option>
                <option value="report_resubmitted">Resubmissions</option>
              </select>
            </div>

            <button
              onClick={fetchStudentNotifications}
              disabled={isLoading}
              title="Refresh notifications"
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Notifications Feed */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {isLoading ? (
            <div className="p-8 text-center space-y-3">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent" />
              <p className="text-xs text-slate-500 dark:text-slate-400">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 mx-auto flex items-center justify-center text-slate-400">
                <Inbox className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                You have no notifications yet.
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {filterTab === 'unread'
                  ? 'All notifications have been reviewed. You are completely caught up.'
                  : 'Important updates regarding supervisor reviews and approvals will appear here.'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const isUnread = !notif.is_read;

              return (
                <div
                  key={notif.id}
                  onClick={() => handleOpenNotification(notif)}
                  className={`p-4 sm:p-5 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-start justify-between gap-4 group ${
                    isUnread
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-l-4 border-emerald-600'
                      : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40 border-l-4 border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    {/* Icon container */}
                    <div
                      className={`p-2.5 rounded-xl flex-shrink-0 mt-0.5 ${
                        notif.type === 'report_returned'
                          ? 'bg-rose-100/80 dark:bg-rose-950/60'
                          : notif.type === 'report_approved'
                          ? 'bg-emerald-100/80 dark:bg-emerald-950/60'
                          : 'bg-sky-100/80 dark:bg-sky-950/60'
                      }`}
                    >
                      {getTypeIcon(notif.type)}
                    </div>

                    {/* Content area */}
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
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.2 rounded-full"
                            title="Unread notification"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            New
                          </span>
                        )}
                      </div>

                      {/* Main Message (wrapping securely without viewport overflow) */}
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed break-words">
                        {notif.message}
                      </p>

                      {/* Metadata Row: Sender & Timestamp */}
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimestamp(notif.created_at)}</span>
                        </span>

                        {notif.sender_name && (
                          <span>
                            From: <strong className="font-semibold text-slate-600 dark:text-slate-300">{notif.sender_name}</strong>
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

                  {/* Right Actions: Mark as Read & View Report */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    {/* View Report Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenNotification(notif);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      <span>View Report</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    {/* Mark as read toggle */}
                    {isUnread && (
                      <button
                        onClick={(e) => handleMarkAsRead(notif, e)}
                        className="text-[11px] text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors cursor-pointer flex items-center gap-1"
                        title="Mark this notification as read"
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
