import { Injectable } from '@angular/core';
import { Notification, CreateNotificationData, UpdateNotificationData } from '@core/models/notification.model';

/**
 * Notification Repository
 *
 * @deprecated This repository uses Supabase and needs to be migrated to Firestore
 * Temporarily stubbed to allow compilation
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationRepository {
  async findAllByUser(userId: string): Promise<Notification[]> {
    console.warn('NotificationRepository: Supabase integration removed, needs Firestore migration');
    return [];
  }

  async findById(id: string): Promise<Notification | null> {
    console.warn('NotificationRepository: Supabase integration removed, needs Firestore migration');
    return null;
  }

  async create(data: CreateNotificationData): Promise<Notification> {
    console.warn('NotificationRepository: Supabase integration removed, needs Firestore migration');
    throw new Error('NotificationRepository not implemented - needs Firestore migration');
  }

  async update(id: string, data: UpdateNotificationData): Promise<void> {
    console.warn('NotificationRepository: Supabase integration removed, needs Firestore migration');
  }

  async delete(id: string): Promise<void> {
    console.warn('NotificationRepository: Supabase integration removed, needs Firestore migration');
  }

  async markAsRead(id: string): Promise<void> {
    console.warn('NotificationRepository: Supabase integration removed, needs Firestore migration');
  }

  async markAllAsRead(userId: string): Promise<void> {
    console.warn('NotificationRepository: Supabase integration removed, needs Firestore migration');
  }

  async deleteByType(userId: string, type: string): Promise<void> {
    console.warn('NotificationRepository: Supabase integration removed, needs Firestore migration');
  }

  subscribeToRealtimeUpdates(userId: string, callback: (notification: Notification) => void): () => void {
    console.warn('NotificationRepository: Supabase integration removed, needs Firestore migration');
    return () => {};
  }

  subscribeToChanges(userId: string, callback: (payload: any) => void): () => void {
    console.warn('NotificationRepository: Supabase integration removed, needs Firestore migration');
    return () => {};
  }
}
