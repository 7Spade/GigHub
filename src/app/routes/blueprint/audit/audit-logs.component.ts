import { Component, ChangeDetectionStrategy, OnInit, inject, input } from '@angular/core';
import { LoggerService } from '@core';
import { AuditLogRepository } from '@core/blueprint/repositories';
import { AuditLogDocument, AuditEventType, AuditCategory, AuditLogQueryOptions } from '@core/models/audit-log.model';
import { STColumn } from '@delon/abc/st';
import { SHARED_IMPORTS, createAsyncArrayState } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzEmptyModule } from 'ng-zorro-antd/empty';

/**
 * Audit Logs Component
 * 審計記錄元件 - 顯示藍圖審計記錄
 *
 * Features:
 * - Display audit logs
 * - Filter by event type, category, resource
 * - Date range filter
 * - Pagination
 *
 * Following Occam's Razor: Simple, read-only audit viewer
 * ✅ Modernized with AsyncState pattern
 * ✅ Fixed: Use correct query parameters (eventType, category)
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-audit-logs',
  standalone: true,
  imports: [SHARED_IMPORTS, NzSpaceModule, NzEmptyModule],
  template: `
    <!-- Filters -->
    <div class="mb-md" style="display: flex; gap: 8px;">
      <nz-select [(ngModel)]="filterCategory" (ngModelChange)="onFilterChange()" nzPlaceHolder="類別" style="width: 150px" nzAllowClear>
        <nz-option nzLabel="藍圖" nzValue="blueprint"></nz-option>
        <nz-option nzLabel="成員" nzValue="member"></nz-option>
        <nz-option nzLabel="安全性" nzValue="security"></nz-option>
        <nz-option nzLabel="資料" nzValue="data"></nz-option>
        <nz-option nzLabel="系統" nzValue="system"></nz-option>
      </nz-select>

      <nz-select
        [(ngModel)]="filterResourceType"
        (ngModelChange)="onFilterChange()"
        nzPlaceHolder="資源類型"
        style="width: 150px"
        nzAllowClear
      >
        <nz-option nzLabel="藍圖" nzValue="blueprint"></nz-option>
        <nz-option nzLabel="成員" nzValue="member"></nz-option>
        <nz-option nzLabel="任務" nzValue="task"></nz-option>
        <nz-option nzLabel="日誌" nzValue="log"></nz-option>
        <nz-option nzLabel="品質" nzValue="quality"></nz-option>
        <nz-option nzLabel="模組" nzValue="module"></nz-option>
      </nz-select>

      <button nz-button (click)="refresh()">
        <span nz-icon nzType="reload"></span>
        重新整理
      </button>
    </div>

    <!-- Table -->
    @if (logsState.loading()) {
      <nz-spin nzSimple></nz-spin>
    } @else if (logsState.error()) {
      <nz-alert
        nzType="error"
        nzShowIcon
        [nzMessage]="'載入失敗'"
        [nzDescription]="logsState.error()?.message || '無法載入審計記錄'"
        class="mb-md"
      />
    } @else if ((logsState.data() || []).length === 0) {
      <nz-empty nzNotFoundContent="暫無審計記錄"></nz-empty>
    } @else {
      <st #st [data]="logsState.data() || []" [columns]="columns" [page]="{ show: true, showSize: true }"></st>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `
  ]
})
export class AuditLogsComponent implements OnInit {
  private readonly message = inject(NzMessageService);
  private readonly logger = inject(LoggerService);
  private readonly auditRepository: AuditLogRepository = inject(AuditLogRepository);

  // Input: blueprint ID
  blueprintId = input.required<string>();

  // ✅ Modern Pattern: Use AsyncState for unified state management
  readonly logsState = createAsyncArrayState<AuditLogDocument>([]);

  // Filter state - using correct model properties
  filterCategory: AuditCategory | null = null;
  filterResourceType: string | null = null;

  // Table columns
  columns: STColumn[] = [
    {
      title: '時間',
      index: 'timestamp',
      type: 'date',
      width: '180px',
      dateFormat: 'yyyy-MM-dd HH:mm:ss'
    },
    {
      title: '事件類型',
      index: 'eventType',
      width: '150px'
    },
    {
      title: '操作',
      index: 'action',
      width: '200px'
    },
    {
      title: '使用者',
      index: 'actorId',
      width: '150px'
    },
    {
      title: '資源類型',
      index: 'resourceType',
      width: '120px'
    },
    {
      title: '資源 ID',
      index: 'resourceId',
      width: '200px'
    },
    {
      title: '詳情',
      width: '100px',
      buttons: [
        {
          text: '檢視',
          type: 'link',
          click: (record: any) => this.viewDetails(record)
        }
      ]
    }
  ];

  ngOnInit(): void {
    this.loadLogs();
  }

  /**
   * Load audit logs
   * 載入審計記錄
   * ✅ Using AsyncState for automatic state management
   * ✅ Fixed: Use correct query options with category and resourceType
   */
  private async loadLogs(): Promise<void> {
    const options: AuditLogQueryOptions = {
      ...(this.filterCategory && { category: this.filterCategory }),
      ...(this.filterResourceType && { resourceType: this.filterResourceType }),
      limit: 100
    };

    try {
      await this.logsState.load(this.auditRepository.queryLogs(this.blueprintId(), options));
      this.logger.info('[AuditLogsComponent]', `Loaded ${this.logsState.data()?.length || 0} audit logs`);
    } catch (error) {
      this.message.error('載入審計記錄失敗');
      this.logger.error('[AuditLogsComponent]', 'Failed to load audit logs', error as Error);
    }
  }

  /**
   * Handle filter change
   * 處理篩選變更
   */
  onFilterChange(): void {
    this.loadLogs();
  }

  /**
   * Refresh logs
   * 重新整理
   */
  refresh(): void {
    this.loadLogs();
  }

  /**
   * View audit log details
   * 檢視審計記錄詳情
   */
  viewDetails(record: any): void {
    const log = record as AuditLogDocument;

    // Show details in modal or drawer
    // For simplicity, show in message (can be enhanced later)
    const details = JSON.stringify(log.changes || {}, null, 2);
    console.log('Audit Log Details:', log);
    this.message.info('詳情已輸出到控制台');
  }
}
