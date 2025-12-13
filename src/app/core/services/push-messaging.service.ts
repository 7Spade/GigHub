import { computed, inject, Injectable, signal } from '@angular/core';
import { Messaging, getToken, isSupported, onMessage } from '@angular/fire/messaging';
import { LoggerService } from '@core/services/logger/logger.service';
import { NotificationStore } from '@core/stores/notification.store';
import { environment } from '@env/environment';
import { NzNotificationService } from 'ng-zorro-antd/notification';

@Injectable({
  providedIn: 'root'
})
export class PushMessagingService {
  private readonly messaging = inject(Messaging);
  private readonly logger = inject(LoggerService);
  private readonly notification = inject(NzNotificationService);
  private readonly notificationStore = inject(NotificationStore);

  private readonly permission = signal<NotificationPermission | 'unsupported'>(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
  );
  private readonly token = signal<string | null>(null);
  private readonly initialized = signal(false);

  readonly hasPermission = computed(() => this.permission() === 'granted');
  readonly pushToken = this.token.asReadonly();

  async init(userId: string): Promise<void> {
    if (this.initialized()) return;
    if (!this.isBrowser()) return;

    const supported = await this.checkSupport();
    if (!supported) {
      this.permission.set('unsupported');
      return;
    }

    await this.ensurePermission();
    if (!this.hasPermission()) return;

    await this.registerToken();
    this.listenForMessages(userId);
    this.initialized.set(true);
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof navigator !== 'undefined';
  }

  private async checkSupport(): Promise<boolean> {
    try {
      return await isSupported();
    } catch (error) {
      this.logger.warn('[PushMessagingService]', 'Messaging not supported in this environment', {
        error
      });
      return false;
    }
  }

  private async ensurePermission(): Promise<void> {
    if (typeof Notification === 'undefined') {
      this.permission.set('unsupported');
      return;
    }

    if (Notification.permission === 'default') {
      const result = await Notification.requestPermission();
      this.permission.set(result);
      return;
    }

    this.permission.set(Notification.permission);
  }

  private async registerToken(): Promise<void> {
    try {
      if (!('serviceWorker' in navigator)) {
        this.logger.warn('[PushMessagingService]', 'Service worker is unavailable, skip push messaging registration');
        return;
      }

      const registration =
        (await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js')) ??
        (await navigator.serviceWorker.register('/firebase-messaging-sw.js'));

      const vapidKey = environment.firebaseMessagingPublicKey;
      if (!vapidKey) {
        this.logger.warn('[PushMessagingService]', 'Missing VAPID key, skip push messaging registration');
        return;
      }
      const token = await getToken(this.messaging, { vapidKey, serviceWorkerRegistration: registration });

      if (token) {
        this.token.set(token);
        this.logger.info('[PushMessagingService]', 'Messaging token registered');
      }
    } catch (error) {
      this.logger.error('[PushMessagingService]', 'Failed to register messaging token', error as Error);
    }
  }

  private listenForMessages(userId: string): void {
    onMessage(this.messaging, payload => {
      const title = payload.notification?.title ?? '新通知';
      const body = payload.notification?.body ?? payload.data?.['body'] ?? '您有新的通知';

      this.notification.info(title, body, { nzPlacement: 'topRight' });
      void this.notificationStore.loadNotifications(userId);
    });
  }
}
