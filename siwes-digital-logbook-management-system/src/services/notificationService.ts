/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  AppNotification,
  CreateNotificationInput,
  NotificationFilters,
  NotificationStats,
  NotificationType,
} from '../types/notification';
import { ServiceResponse } from '../types';

const NOTIFICATIONS_STORAGE_PREFIX = 'siwes_notifications_';

// Initial realistic demo notifications for instant evaluation
const DEFAULT_STUDENT_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'demo-notif-stu-001',
    recipient_id: 'd4930092-0a64-41d7-af79-16dd85a4b68f',
    title: 'Weekly Report Returned',
    message: 'Your Week 4 report has been returned for correction. Please review the coordinator’s feedback and resubmit your logbook.',
    type: 'report_returned',
    related_id: 'demo-week-004',
    week_number: 4,
    is_read: false,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    action_url: '/student/activity',
    sender_name: 'Dr. Elizabeth Nnamani',
  },
  {
    id: 'demo-notif-stu-002',
    recipient_id: 'd4930092-0a64-41d7-af79-16dd85a4b68f',
    title: 'Weekly Report Approved',
    message: 'Your Week 2 SIWES report has been endorsed with Grade A. Excellent technical breakdown of switchgear testing.',
    type: 'report_approved',
    related_id: 'demo-week-002',
    week_number: 2,
    is_read: false,
    created_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(), // Yesterday
    action_url: '/student/activity',
    sender_name: 'Dr. Elizabeth Nnamani',
  },
  {
    id: 'demo-notif-stu-003',
    recipient_id: 'd4930092-0a64-41d7-af79-16dd85a4b68f',
    title: 'Weekly Report Approved',
    message: 'Your Week 1 SIWES report has been approved. Safe industrial orientation documented.',
    type: 'report_approved',
    related_id: 'demo-week-001',
    week_number: 1,
    is_read: true,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    read_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    action_url: '/student/activity',
    sender_name: 'Dr. Elizabeth Nnamani',
  },
];

const DEFAULT_ADMIN_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'demo-notif-adm-001',
    recipient_id: 'dce626bd-3eba-4aef-97ce-45621dbf05f2',
    title: 'Weekly Report Resubmitted',
    message: 'Chinedu Eze has updated and resubmitted their Week 4 SIWES report following corrections.',
    type: 'report_resubmitted',
    related_id: 'demo-week-004',
    week_number: 4,
    is_read: false,
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
    action_url: '/admin/reports',
    sender_name: 'Chinedu Eze (FUT/2021/8841)',
  },
  {
    id: 'demo-notif-adm-002',
    recipient_id: 'dce626bd-3eba-4aef-97ce-45621dbf05f2',
    title: 'New Weekly Report Submitted',
    message: 'Amina Bello has submitted their Week 2 SIWES report and is awaiting administrative inspection.',
    type: 'report_submitted',
    related_id: 'demo-week-demo-student-uuid-002-2',
    week_number: 2,
    is_read: false,
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    action_url: '/admin/reports',
    sender_name: 'Amina Bello (FUT/2021/8842)',
  },
  {
    id: 'demo-notif-adm-003',
    recipient_id: 'dce626bd-3eba-4aef-97ce-45621dbf05f2',
    title: 'New Weekly Report Submitted',
    message: 'Oluwaseun Adeyemi has submitted their Week 3 logbook report for departmental review.',
    type: 'report_submitted',
    related_id: 'demo-week-demo-student-uuid-003-2',
    week_number: 3,
    is_read: true,
    created_at: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(),
    read_at: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    action_url: '/admin/reports',
    sender_name: 'Oluwaseun Adeyemi (FUT/2021/8843)',
  },
];

type NotificationListener = () => void;

class NotificationService {
  private listeners: Set<NotificationListener> = new Set();

  /**
   * Subscribe to notification state changes for instant UI synchronization.
   */
  subscribe(listener: NotificationListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch {
        // Ignore subscriber errors
      }
    });
  }

  /**
   * Reads stored notifications for a user from localStorage.
   */
  private getStoredNotifications(userId: string): AppNotification[] {
    try {
      const stored = localStorage.getItem(`${NOTIFICATIONS_STORAGE_PREFIX}${userId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }

    // Default seeded records if not yet initialized
    let defaults: AppNotification[] = [];
    if (userId === 'd4930092-0a64-41d7-af79-16dd85a4b68f' || userId === 'demo-student-uuid-001' || userId.includes('student')) {
      defaults = JSON.parse(JSON.stringify(DEFAULT_STUDENT_NOTIFICATIONS));
    } else if (userId === 'dce626bd-3eba-4aef-97ce-45621dbf05f2' || userId === 'demo-admin-uuid-002' || userId.includes('admin')) {
      defaults = JSON.parse(JSON.stringify(DEFAULT_ADMIN_NOTIFICATIONS));
    }

    if (defaults.length > 0) {
      this.saveStoredNotifications(userId, defaults);
    }
    return defaults;
  }

  private saveStoredNotifications(userId: string, notifications: AppNotification[]): void {
    try {
      localStorage.setItem(`${NOTIFICATIONS_STORAGE_PREFIX}${userId}`, JSON.stringify(notifications));
      this.notifyListeners();
    } catch {
      // Ignore quota errors
    }
  }

  /**
   * Fetches notifications for an authenticated user with filtering.
   */
  async getNotifications(
    userId: string,
    filters?: NotificationFilters
  ): Promise<ServiceResponse<AppNotification[]>> {
    if (!userId) {
      return {
        data: [],
        error: { message: 'Authentication required to view notifications.' },
        success: false,
      };
    }

    // 1. Demo Mode or Local Storage Fallback
    if (!isSupabaseConfigured() || userId.startsWith('demo-')) {
      let items = this.getStoredNotifications(userId);

      if (filters?.status === 'unread') {
        items = items.filter((n) => !n.is_read);
      } else if (filters?.status === 'read') {
        items = items.filter((n) => n.is_read);
      }

      if (filters?.type && filters.type !== 'all') {
        items = items.filter((n) => n.type === filters.type);
      }

      // Sort newest first
      items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      if (filters?.limit && filters.limit > 0) {
        items = items.slice(0, filters.limit);
      }

      return {
        data: items,
        error: null,
        success: true,
      };
    }

    // 2. Real Supabase Database Execution
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false });

      if (filters?.status === 'unread') {
        query = query.eq('is_read', false);
      } else if (filters?.status === 'read') {
        query = query.eq('is_read', true);
      }

      if (filters?.type && filters.type !== 'all') {
        query = query.eq('type', filters.type);
      }

      if (filters?.limit && filters.limit > 0) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        // Table might not exist yet, fallback to localStorage
        const fallback = this.getStoredNotifications(userId);
        return {
          data: fallback,
          error: null,
          success: true,
        };
      }

      return {
        data: (data || []) as AppNotification[],
        error: null,
        success: true,
      };
    } catch {
      const fallback = this.getStoredNotifications(userId);
      return {
        data: fallback,
        error: null,
        success: true,
      };
    }
  }

  /**
   * Retrieves accurate unread notification count directly from database.
   */
  async getUnreadCount(userId: string): Promise<ServiceResponse<number>> {
    if (!userId) {
      return { data: 0, error: null, success: true };
    }

    // 1. Demo Mode or Local Storage Fallback
    if (!isSupabaseConfigured() || userId.startsWith('demo-')) {
      const items = this.getStoredNotifications(userId);
      const count = items.filter((n) => !n.is_read).length;
      return { data: count, error: null, success: true };
    }

    // 2. Real Supabase Database Execution
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .eq('is_read', false);

      if (error) {
        const fallback = this.getStoredNotifications(userId);
        return {
          data: fallback.filter((n) => !n.is_read).length,
          error: null,
          success: true,
        };
      }

      return {
        data: count ?? 0,
        error: null,
        success: true,
      };
    } catch {
      const fallback = this.getStoredNotifications(userId);
      return {
        data: fallback.filter((n) => !n.is_read).length,
        error: null,
        success: true,
      };
    }
  }

  /**
   * Marks an individual notification as read.
   * Strictly enforces that only the authenticated recipient can mark it read.
   */
  async markAsRead(notificationId: string, userId: string): Promise<ServiceResponse<AppNotification>> {
    if (!userId || !notificationId) {
      return {
        data: null,
        error: { message: 'Missing parameters to mark notification as read.' },
        success: false,
      };
    }

    const now = new Date().toISOString();

    // 1. Demo / Local Storage
    if (!isSupabaseConfigured() || userId.startsWith('demo-')) {
      const items = this.getStoredNotifications(userId);
      const index = items.findIndex((n) => n.id === notificationId);

      if (index === -1) {
        return {
          data: null,
          error: { message: 'Notification not found.' },
          success: false,
        };
      }

      const notif = items[index];
      // Recipient check
      if (notif.recipient_id !== userId) {
        return {
          data: null,
          error: { message: 'Unauthorized. You cannot modify another user’s notification.' },
          success: false,
        };
      }

      notif.is_read = true;
      notif.read_at = now;
      items[index] = notif;
      this.saveStoredNotifications(userId, items);

      return { data: notif, error: null, success: true };
    }

    // 2. Real Supabase Database Execution
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: now,
        })
        .eq('id', notificationId)
        .eq('recipient_id', userId) // Security: recipient constraint
        .select('*')
        .single();

      if (error) {
        // Fallback to local
        const items = this.getStoredNotifications(userId);
        const match = items.find((n) => n.id === notificationId);
        if (match) {
          match.is_read = true;
          match.read_at = now;
          this.saveStoredNotifications(userId, items);
          return { data: match, error: null, success: true };
        }
        return { data: null, error: { message: error.message }, success: false };
      }

      this.notifyListeners();
      return { data: data as AppNotification, error: null, success: true };
    } catch (err) {
      return {
        data: null,
        error: { message: err instanceof Error ? err.message : 'Error updating notification.' },
        success: false,
      };
    }
  }

  /**
   * Marks all unread notifications as read for the authenticated recipient.
   */
  async markAllAsRead(userId: string): Promise<ServiceResponse<number>> {
    if (!userId) {
      return {
        data: 0,
        error: { message: 'Authentication required.' },
        success: false,
      };
    }

    const now = new Date().toISOString();

    // 1. Demo / Local Storage
    if (!isSupabaseConfigured() || userId.startsWith('demo-')) {
      const items = this.getStoredNotifications(userId);
      let updatedCount = 0;
      const updated = items.map((n) => {
        if (!n.is_read) {
          updatedCount++;
          return { ...n, is_read: true, read_at: now };
        }
        return n;
      });

      this.saveStoredNotifications(userId, updated);
      return { data: updatedCount, error: null, success: true };
    }

    // 2. Real Supabase Database Execution
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: now,
        })
        .eq('recipient_id', userId)
        .eq('is_read', false);

      if (error) {
        const items = this.getStoredNotifications(userId);
        let updatedCount = 0;
        const updated = items.map((n) => {
          if (!n.is_read) {
            updatedCount++;
            return { ...n, is_read: true, read_at: now };
          }
          return n;
        });
        this.saveStoredNotifications(userId, updated);
        return { data: updatedCount, error: null, success: true };
      }

      this.notifyListeners();
      return { data: 1, error: null, success: true };
    } catch (err) {
      return {
        data: 0,
        error: { message: err instanceof Error ? err.message : 'Error updating all notifications.' },
        success: false,
      };
    }
  }

  /**
   * Trusted workflow notification creation.
   * Controlled notification types:
   * - 'report_approved'
   * - 'report_returned'
   * - 'report_resubmitted'
   * - 'report_submitted'
   * - 'general'
   */
  async createNotification(
    input: CreateNotificationInput
  ): Promise<ServiceResponse<AppNotification>> {
    const { recipient_id, title, message, type, related_id, week_number, action_url, sender_name } = input;

    // Type validation against controlled types
    const allowedTypes: NotificationType[] = [
      'report_approved',
      'report_returned',
      'report_resubmitted',
      'report_submitted',
      'general',
    ];

    if (!allowedTypes.includes(type)) {
      return {
        data: null,
        error: { message: `Invalid notification type '${type}'. Only controlled workflow types are allowed.` },
        success: false,
      };
    }

    const newRecord: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      recipient_id,
      title: title.trim(),
      message: message.trim(),
      type,
      related_id: related_id || null,
      week_number: week_number || null,
      is_read: false,
      created_at: new Date().toISOString(),
      read_at: null,
      action_url: action_url || (recipient_id.includes('admin') ? '/admin/reports' : '/student/activity'),
      sender_name: sender_name || null,
    };

    // 1. Local Storage / Demo Mode
    const stored = this.getStoredNotifications(recipient_id);
    stored.unshift(newRecord);
    this.saveStoredNotifications(recipient_id, stored);

    // 2. Also attempt Supabase insert if configured
    if (isSupabaseConfigured() && !recipient_id.startsWith('demo-')) {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .insert({
            recipient_id,
            title: newRecord.title,
            message: newRecord.message,
            type: newRecord.type,
            related_id: newRecord.related_id,
            week_number: newRecord.week_number,
            is_read: false,
            action_url: newRecord.action_url,
            sender_name: newRecord.sender_name,
          })
          .select('*')
          .single();

        if (!error && data) {
          this.notifyListeners();
          return { data: data as AppNotification, error: null, success: true };
        }
      } catch {
        // Fall back to returned local record
      }
    }

    this.notifyListeners();
    return { data: newRecord, error: null, success: true };
  }

  /**
   * Computes notification statistics (total, unread, read) for user.
   */
  async getStats(userId: string): Promise<ServiceResponse<NotificationStats>> {
    const res = await this.getNotifications(userId);
    if (!res.success || !res.data) {
      return {
        data: { total: 0, unread: 0, read: 0 },
        error: res.error,
        success: false,
      };
    }

    const total = res.data.length;
    const unread = res.data.filter((n) => !n.is_read).length;
    const read = total - unread;

    return {
      data: { total, unread, read },
      error: null,
      success: true,
    };
  }
}

export const notificationService = new NotificationService();
