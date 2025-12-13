/**
 * Communication Module View Component
 * 通訊域視圖元件
 */

import { Component, ChangeDetectionStrategy, OnInit, inject, input } from '@angular/core';
import { STColumn } from '@delon/abc/st';
import { SHARED_IMPORTS } from '@shared';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { SystemNotificationService } from '@core/blueprint/modules/implementations/communication/services/system-notification.service';
import { GroupMessageService } from '@core/blueprint/modules/implementations/communication/services/group-message.service';
import { TaskReminderService } from '@core/blueprint/modules/implementations/communication/services/task-reminder.service';
import { PushNotificationService } from '@core/blueprint/modules/implementations/communication/services/push-notification.service';

@Component({
  selector: 'app-communication-module-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzStatisticModule, NzEmptyModule],
  template: `
    <nz-card nzTitle="通訊統計" class="mb-md">
      <nz-row [nzGutter]="16">
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="notificationService.data().length" nzTitle="系統通知" />
        </nz-col>
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="messageService.data().length" nzTitle="群組訊息" />
        </nz-col>
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="reminderService.data().length" nzTitle="任務提醒" />
        </nz-col>
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="pushService.data().length" nzTitle="推播通知" />
        </nz-col>
      </nz-row>
    </nz-card>

    <nz-card>
      <nz-tabset>
        <nz-tab nzTitle="系統通知">
          @if (notificationService.loading()) {
            <nz-spin nzSimple />
          } @else if (notificationService.data().length === 0) {
            <nz-empty nzNotFoundContent="暫無系統通知" />
          } @else {
            <st [data]="notificationService.data()" [columns]="notificationColumns" />
          }
        </nz-tab>
        <nz-tab nzTitle="群組訊息">
          @if (messageService.loading()) {
            <nz-spin nzSimple />
          } @else if (messageService.data().length === 0) {
            <nz-empty nzNotFoundContent="暫無群組訊息" />
          } @else {
            <st [data]="messageService.data()" [columns]="messageColumns" />
          }
        </nz-tab>
        <nz-tab nzTitle="任務提醒">
          @if (reminderService.loading()) {
            <nz-spin nzSimple />
          } @else if (reminderService.data().length === 0) {
            <nz-empty nzNotFoundContent="暫無任務提醒" />
          } @else {
            <st [data]="reminderService.data()" [columns]="reminderColumns" />
          }
        </nz-tab>
        <nz-tab nzTitle="推播通知">
          @if (pushService.loading()) {
            <nz-spin nzSimple />
          } @else if (pushService.data().length === 0) {
            <nz-empty nzNotFoundContent="暫無推播通知" />
          } @else {
            <st [data]="pushService.data()" [columns]="pushColumns" />
          }
        </nz-tab>
      </nz-tabset>
    </nz-card>
  `,
  styles: []
})
export class CommunicationModuleViewComponent implements OnInit {
  blueprintId = input.required<string>();
  
  readonly notificationService = inject(SystemNotificationService);
  readonly messageService = inject(GroupMessageService);
  readonly reminderService = inject(TaskReminderService);
  readonly pushService = inject(PushNotificationService);

  notificationColumns: STColumn[] = [
    { title: '通知內容', index: 'content' },
    { title: '類型', index: 'type', width: '100px' },
    { title: '時間', index: 'createdAt', type: 'date', width: '180px' }
  ];

  messageColumns: STColumn[] = [
    { title: '訊息', index: 'message' },
    { title: '發送者', index: 'sender', width: '120px' },
    { title: '時間', index: 'sentAt', type: 'date', width: '180px' }
  ];

  reminderColumns: STColumn[] = [
    { title: '提醒內容', index: 'content' },
    { title: '任務', index: 'taskName', width: '150px' },
    { title: '提醒時間', index: 'reminderTime', type: 'date', width: '180px' }
  ];

  pushColumns: STColumn[] = [
    { title: '推播內容', index: 'content' },
    { title: '接收者', index: 'recipient', width: '120px' },
    { title: '發送時間', index: 'pushedAt', type: 'date', width: '180px' }
  ];

  ngOnInit(): void {
    this.notificationService.load();
    this.messageService.load();
    this.reminderService.load();
    this.pushService.load();
  }
}
