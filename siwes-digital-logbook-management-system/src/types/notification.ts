/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type NotificationType =
  | 'report_approved'
  | 'report_returned'
  | 'report_resubmitted'
  | 'report_submitted'
  | 'general';

export interface AppNotification {
  id: string;
  recipient_id: string;
  title: string;
  message: string;
  type: NotificationType;
  related_id?: string | null;     // typically week_id
  week_number?: number | null;
  is_read: boolean;
  created_at: string;
  read_at?: string | null;
  action_url?: string | null;
  sender_name?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface NotificationFilters {
  status?: 'all' | 'unread' | 'read';
  type?: NotificationType | 'all';
  limit?: number;
}

export interface CreateNotificationInput {
  recipient_id: string;
  title: string;
  message: string;
  type: NotificationType;
  related_id?: string | null;
  week_number?: number | null;
  action_url?: string | null;
  sender_name?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
}
