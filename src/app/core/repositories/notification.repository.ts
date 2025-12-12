import { Injectable, inject } from '@angular/core';
import { Notification, CreateNotificationData, UpdateNotificationData } from '@core/models/notification.model';
import { SupabaseService } from '@core/services/supabase.service';
import { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

/**
 * Notification Repository
 *
 * Handles all data operations for notifications using Supabase
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationRepository {
  private readonly supabase: SupabaseClient;

  constructor() {
    const supabaseService = inject(SupabaseService);
    this.supabase = supabaseService.client;
  }

  /**
   * Find all notifications for a user
   */
  async findAllByUser(userId: string): Promise<Notification[]> {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch notifications: ${error.message}`);
    }

    return this.mapToNotifications(data || []);
  }

  /**
   * Find unread notifications for a user
   */
  async findUnreadByUser(userId: string): Promise<Notification[]> {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('read', false)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch unread notifications: ${error.message}`);
    }

    return this.mapToNotifications(data || []);
  }

  /**
   * Create a new notification
   */
  async create(data: CreateNotificationData): Promise<Notification> {
    const { data: result, error } = await this.supabase
      .from('notifications')
      .insert({
        user_id: data.userId,
        type: data.type,
        title: data.title,
        description: data.description,
        avatar: data.avatar,
        datetime: data.datetime || new Date().toISOString(),
        read: data.read || false,
        extra: data.extra,
        status: data.status,
        link: data.link
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create notification: ${error.message}`);
    }

    return this.mapToNotification(result);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string): Promise<void> {
    const { error } = await this.supabase.from('notifications').update({ read: true }).eq('id', id);

    if (error) {
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await this.supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);

    if (error) {
      throw new Error(`Failed to mark all notifications as read: ${error.message}`);
    }
  }

  /**
   * Update a notification
   */
  async update(id: string, data: UpdateNotificationData): Promise<void> {
    const { error } = await this.supabase.from('notifications').update(data).eq('id', id);

    if (error) {
      throw new Error(`Failed to update notification: ${error.message}`);
    }
  }

  /**
   * Delete notifications by type for a user
   */
  async deleteByType(userId: string, type: string): Promise<void> {
    const { error } = await this.supabase.from('notifications').delete().eq('user_id', userId).eq('type', type);

    if (error) {
      throw new Error(`Failed to delete notifications: ${error.message}`);
    }
  }

  /**
   * Delete a single notification
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from('notifications').delete().eq('id', id);

    if (error) {
      throw new Error(`Failed to delete notification: ${error.message}`);
    }
  }

  /**
   * Subscribe to realtime changes for a user's notifications
   */
  subscribeToChanges(userId: string, callback: (payload: any) => void): RealtimeChannel {
    return this.supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  }

  /**
   * Map database records to Notification models
   */
  private mapToNotifications(records: any[]): Notification[] {
    return records.map(record => this.mapToNotification(record));
  }

  /**
   * Map single database record to Notification model
   */
  private mapToNotification(record: any): Notification {
    return {
      id: record.id,
      userId: record.user_id,
      type: record.type,
      title: record.title,
      description: record.description,
      avatar: record.avatar,
      datetime: record.datetime,
      read: record.read,
      extra: record.extra,
      status: record.status,
      link: record.link,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at)
    };
  }
}
