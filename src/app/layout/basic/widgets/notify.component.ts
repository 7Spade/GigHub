import { ChangeDetectionStrategy, Component, inject, OnInit, DestroyRef } from '@angular/core';
import { FirebaseService } from '@core/services/firebase.service';
import { NotificationStore } from '@core/stores/notification.store';
import { NoticeIconModule, NoticeIconSelect } from '@delon/abc/notice-icon';
import { NzMessageService } from 'ng-zorro-antd/message';

/**
 * Header Notify Component
 *
 * Displays notifications using ng-alain notice-icon component
 * Connected to real Firebase data via NotificationStore
 */
@Component({
  selector: 'header-notify',
  template: `
    <notice-icon
      [data]="notificationStore.groupedNotifications()"
      [count]="notificationStore.unreadCount()"
      [loading]="notificationStore.loading()"
      btnClass="alain-default__nav-item"
      btnIconClass="alain-default__nav-item-icon"
      (select)="select($event)"
      (clear)="clear($event)"
      (popoverVisibleChange)="loadData()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NoticeIconModule]
})
export class HeaderNotifyComponent implements OnInit {
  private readonly msg = inject(NzMessageService);
  private readonly firebase = inject(FirebaseService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly notificationStore = inject(NotificationStore);

  async ngOnInit(): Promise<void> {
    const user = this.firebase.getCurrentUser();
    if (user) {
      // Subscribe to realtime updates
      this.notificationStore.subscribeToRealtimeUpdates(user.uid, this.destroyRef);
    }
  }

  async loadData(): Promise<void> {
    const user = this.firebase.getCurrentUser();
    if (user) {
      await this.notificationStore.loadNotifications(user.uid);
    }
  }

  async clear(type: string): Promise<void> {
    const user = this.firebase.getCurrentUser();
    if (user) {
      await this.notificationStore.clearByType(user.uid, type);
      this.msg.success(`清空了 ${type}`);
    }
  }

  async select(res: NoticeIconSelect): Promise<void> {
    const itemId = (res.item as any).id;
    if (itemId) {
      await this.notificationStore.markAsRead(itemId);
    }
    this.msg.success(`點擊了 ${res.title} 的 ${res.item.title}`);
  }
}
