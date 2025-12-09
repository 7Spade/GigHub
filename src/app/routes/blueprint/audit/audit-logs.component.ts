import { Component, OnInit, inject, signal, input } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { STColumn } from '@delon/abc/st';
import { SHARED_IMPORTS } from '@shared';
import { AuditLog, AuditQueryOptions, AuditEntityType, AuditOperation, LoggerService } from '@core';
import { AuditLogRepository } from '@shared';

/**
 * Audit Logs Component
 * 審計記錄元件 - 顯示藍圖審計記錄
 * 
 * Features:
 * - Display audit logs
 * - Filter by entity type, operation, user
 * - Date range filter
 * - Pagination
 * 
 * Following Occam's Razor: Simple, read-only audit viewer
 */
@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [SHARED_IMPORTS, NzSpaceModule],
  template: `
    <nz-card nzTitle="審計記錄">
      <!-- Filters -->
      <div class="mb-md" style="display: flex; gap: 8px;">
        <nz-select
          [(ngModel)]="filterEntityType"
          (ngModelChange)="onFilterChange()"
          nzPlaceHolder="實體類型"
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

        <nz-select
          [(ngModel)]="filterOperation"
          (ngModelChange)="onFilterChange()"
          nzPlaceHolder="操作類型"
          style="width: 150px"
          nzAllowClear
        >
          <nz-option nzLabel="建立" nzValue="create"></nz-option>
          <nz-option nzLabel="更新" nzValue="update"></nz-option>
          <nz-option nzLabel="刪除" nzValue="delete"></nz-option>
          <nz-option nzLabel="存取" nzValue="access"></nz-option>
          <nz-option nzLabel="授權" nzValue="permission_grant"></nz-option>
        </nz-select>

        <button nz-button (click)="refresh()">
          <span nz-icon nzType="reload"></span>
          重新整理
        </button>
      </div>

      <!-- Table -->
      @if (loading()) {
        <nz-spin nzSimple></nz-spin>
      } @else {
        <st
          #st
          [data]="logs()"
          [columns]="columns"
          [page]="{ show: true, showSize: true }"
        ></st>
      }
    </nz-card>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class AuditLogsComponent implements OnInit {
  private readonly message = inject(NzMessageService);
  private readonly logger = inject(LoggerService);
  private readonly auditRepository = inject(AuditLogRepository);

  // Input: blueprint ID
  blueprintId = input.required<string>();

  // Reactive state
  loading = signal(false);
  logs = signal<AuditLog[]>([]);

  // Filter state
  filterEntityType: AuditEntityType | null = null;
  filterOperation: AuditOperation | null = null;

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
      title: '實體類型',
      index: 'entityType',
      width: '120px'
    },
    {
      title: '操作',
      index: 'operation',
      width: '100px',
      type: 'badge',
      badge: {
        create: { text: '建立', color: 'success' },
        update: { text: '更新', color: 'processing' },
        delete: { text: '刪除', color: 'error' },
        access: { text: '存取', color: 'default' },
        permission_grant: { text: '授權', color: 'warning' }
      }
    },
    {
      title: '使用者',
      index: 'userName',
      width: '150px'
    },
    {
      title: '實體 ID',
      index: 'entityId',
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
   */
  private loadLogs(): void {
    this.loading.set(true);

    const options: AuditQueryOptions = {
      ...(this.filterEntityType && { entityType: this.filterEntityType }),
      ...(this.filterOperation && { operation: this.filterOperation }),
      limit: 100
    };

    this.auditRepository.queryLogs(this.blueprintId(), options).subscribe({
      next: (data: AuditLog[]) => {
        this.logs.set(data);
        this.loading.set(false);
        this.logger.info('[AuditLogsComponent]', `Loaded ${data.length} audit logs`);
      },
      error: (error: Error) => {
        this.loading.set(false);
        this.message.error('載入審計記錄失敗');
        this.logger.error('[AuditLogsComponent]', 'Failed to load audit logs', error);
      }
    });
  }

  /**
   * Get entity type display name
   * 取得實體類型顯示名稱
   */
  private getEntityTypeName(type: AuditEntityType): string {
    const typeMap: Record<AuditEntityType, string> = {
      blueprint: '藍圖',
      member: '成員',
      task: '任務',
      log: '日誌',
      quality: '品質',
      module: '模組'
    };
    return typeMap[type] || type;
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
    const log = record as AuditLog;
    
    // Show details in modal or drawer
    // For simplicity, show in message (can be enhanced later)
    const details = JSON.stringify(log.changes || {}, null, 2);
    console.log('Audit Log Details:', log);
    this.message.info('詳情已輸出到控制台');
  }
}
