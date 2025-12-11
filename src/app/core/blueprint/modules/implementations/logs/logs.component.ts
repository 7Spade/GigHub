/**
 * Logs Component
 * Angular 20 UI with Signals and new control flow syntax.
 */

import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzBadgeModule } from 'ng-zorro-antd/badge';

import { LogLevel, LogCategory } from './logs.repository';
import { LogsService } from './logs.service';

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    NzPageHeaderModule,
    NzCardModule,
    NzGridModule,
    NzStatisticModule,
    NzButtonModule,
    NzIconModule,
    NzSpinModule,
    NzListModule,
    NzBadgeModule
  ],
  template: `
    <nz-page-header nzTitle="日誌管理" nzSubtitle="系統日誌記錄與查詢">
      <nz-page-header-extra>
        <button nz-button nzType="primary" (click)="refresh()">
          <span nz-icon nzType="reload"></span>
          重新整理
        </button>
      </nz-page-header-extra>
    </nz-page-header>

    <nz-card>
      <nz-row [nzGutter]="16">
        <nz-col [nzSpan]="6">
          <nz-statistic nzTitle="總計" [nzValue]="stats().total"></nz-statistic>
        </nz-col>
        <nz-col [nzSpan]="6">
          <nz-statistic nzTitle="錯誤" [nzValue]="stats().error" [nzValueStyle]="{ color: '#cf1322' }"></nz-statistic>
        </nz-col>
        <nz-col [nzSpan]="6">
          <nz-statistic nzTitle="警告" [nzValue]="stats().warn" [nzValueStyle]="{ color: '#faad14' }"></nz-statistic>
        </nz-col>
        <nz-col [nzSpan]="6">
          <nz-statistic nzTitle="資訊" [nzValue]="stats().info" [nzValueStyle]="{ color: '#1890ff' }"></nz-statistic>
        </nz-col>
      </nz-row>
    </nz-card>

    <nz-card nzTitle="日誌列表" style="margin-top: 16px;">
      @if (loading()) {
        <nz-spin nzSimple></nz-spin>
      } @else {
        <nz-list [nzDataSource]="logs()" nzBordered nzSize="small">
          <nz-list-item *ngFor="let log of logs(); trackBy: trackByFn">
            <nz-list-item-meta>
              <nz-list-item-meta-title>
                <nz-badge [nzStatus]="getLevelStatus(log.level)" [nzText]="log.level"> </nz-badge>
                {{ log.message }}
              </nz-list-item-meta-title>
              <nz-list-item-meta-description>
                分類: {{ log.category }} | 時間: {{ log.timestamp | date: 'yyyy-MM-dd HH:mm:ss' }}
              </nz-list-item-meta-description>
            </nz-list-item-meta>
          </nz-list-item>
        </nz-list>
      }
    </nz-card>
  `
})
export class LogsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private logsService = inject(LogsService);

  readonly logs = this.logsService.logs;
  readonly loading = this.logsService.loading;
  readonly stats = this.logsService.logStats;

  private blueprintId = signal<string>('');

  ngOnInit(): void {
    const id = this.route.snapshot.params['blueprintId'];
    if (id) {
      this.blueprintId.set(id);
      this.logsService.loadLogs(id);
    }
  }

  refresh(): void {
    const id = this.blueprintId();
    if (id) {
      this.logsService.loadLogs(id);
    }
  }

  getLevelStatus(level: LogLevel): string {
    switch (level) {
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        return 'error';
      case LogLevel.WARN:
        return 'warning';
      case LogLevel.INFO:
        return 'processing';
      default:
        return 'default';
    }
  }

  trackByFn(index: number, item: any): any {
    return item.id;
  }
}
