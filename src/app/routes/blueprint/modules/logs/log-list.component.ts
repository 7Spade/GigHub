import { Component, OnInit, inject, input } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ModalHelper } from '@delon/theme';
import { STColumn } from '@delon/abc/st';
import { SHARED_IMPORTS } from '@shared';
import { Log, LoggerService } from '@core';
import { LogStore } from '@shared/services/log/log.store';

/**
 * Log List Component
 * 日誌列表元件
 * 
 * Following Occam's Razor: Simple construction log display
 * Uses ng-alain ST table with photo preview
 */
@Component({
  selector: 'app-log-list',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-card nzTitle="施工日誌" [nzExtra]="extra">
      <ng-template #extra>
        <nz-space>
          <button *nzSpaceItem nz-button nzType="primary" (click)="addLog()">
            <span nz-icon nzType="plus"></span>
            新增日誌
          </button>
          <button *nzSpaceItem nz-button (click)="refresh()">
            <span nz-icon nzType="reload"></span>
            重新整理
          </button>
        </nz-space>
      </ng-template>

      @if (logStore.loading()) {
        <nz-spin nzSimple></nz-spin>
      } @else if (logStore.error()) {
        <nz-alert
          nzType="error"
          nzShowIcon
          [nzMessage]="'載入失敗'"
          [nzDescription]="logStore.error() || '無法載入日誌列表'"
          class="mb-md"
        />
      } @else {
        <!-- Log Statistics -->
        <div nz-row [nzGutter]="16" class="mb-md">
          <div nz-col [nzSpan]="12">
            <nz-statistic
              [nzValue]="logStore.logCount()"
              nzTitle="總日誌數"
              [nzValueStyle]="{ color: '#1890ff' }"
              nzSuffix="筆"
            />
          </div>
          <div nz-col [nzSpan]="12">
            <nz-statistic
              [nzValue]="getTotalPhotos()"
              nzTitle="總照片數"
              [nzValueStyle]="{ color: '#52c41a' }"
              nzSuffix="張"
            />
          </div>
        </div>

        <!-- Log Table -->
        <st
          #st
          [data]="logStore.logs() || []"
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
    
    .mb-md {
      margin-bottom: 16px;
    }
  `]
})
export class LogListComponent implements OnInit {
  private readonly message = inject(NzMessageService);
  private readonly modal = inject(ModalHelper);
  private readonly logger = inject(LoggerService);
  readonly logStore = inject(LogStore);

  // Input: blueprint ID
  blueprintId = input.required<string>();

  // Table columns
  columns: STColumn[] = [
    {
      title: '日期',
      index: 'date',
      type: 'date',
      width: '120px',
      dateFormat: 'yyyy-MM-dd'
    },
    {
      title: '標題',
      index: 'title',
      width: '25%'
    },
    {
      title: '描述',
      index: 'description',
      width: '30%',
      default: '-'
    },
    {
      title: '工時',
      index: 'workHours',
      width: '80px',
      default: '-',
      format: (item: Log) => item.workHours ? `${item.workHours}h` : '-'
    },
    {
      title: '人數',
      index: 'workers',
      width: '80px',
      default: '-',
      format: (item: Log) => item.workers ? `${item.workers}人` : '-'
    },
    {
      title: '天氣',
      index: 'weather',
      width: '100px',
      default: '-'
    },
    {
      title: '照片',
      width: '80px',
      render: 'photos',
      format: (item: Log) => item.photos.length
    },
    {
      title: '操作',
      width: '180px',
      buttons: [
        {
          text: '檢視',
          type: 'link',
          click: (record: any) => this.viewLog(record)
        },
        {
          text: '編輯',
          type: 'link',
          click: (record: any) => this.editLog(record)
        },
        {
          text: '刪除',
          type: 'del',
          pop: {
            title: '確定要刪除此日誌嗎?',
            okType: 'danger'
          },
          click: (record: any) => this.deleteLog(record)
        }
      ]
    }
  ];

  ngOnInit(): void {
    this.loadLogs();
  }

  /**
   * Load logs
   * 載入日誌列表
   */
  private async loadLogs(): Promise<void> {
    try {
      await this.logStore.loadLogs(this.blueprintId());
      this.logger.info('[LogListComponent]', `Loaded logs for blueprint: ${this.blueprintId()}`);
    } catch (error) {
      this.message.error('載入日誌失敗');
      this.logger.error('[LogListComponent]', 'Failed to load logs', error as Error);
    }
  }

  /**
   * Refresh logs
   * 重新整理日誌
   */
  async refresh(): Promise<void> {
    await this.loadLogs();
    this.message.success('已重新整理');
  }

  /**
   * Get total photos count
   * 取得總照片數
   */
  getTotalPhotos(): number {
    return this.logStore.logs().reduce((sum, log) => sum + log.photos.length, 0);
  }

  /**
   * Add new log
   * 新增日誌
   */
  async addLog(): Promise<void> {
    this.message.info('新增日誌功能待實作');
    // TODO: Implement log modal with photo upload
  }

  /**
   * View log details
   * 檢視日誌詳情
   */
  async viewLog(record: any): Promise<void> {
    const log = record as Log;
    this.message.info(`檢視日誌: ${log.title}`);
    this.logger.info('[LogListComponent]', `View log: ${log.id}`);
    // TODO: Implement log detail modal/page
  }

  /**
   * Edit log
   * 編輯日誌
   */
  async editLog(record: any): Promise<void> {
    const log = record as Log;
    this.message.info(`編輯日誌: ${log.title}`);
    this.logger.info('[LogListComponent]', `Edit log: ${log.id}`);
    // TODO: Implement log edit modal
  }

  /**
   * Delete log
   * 刪除日誌
   */
  async deleteLog(record: any): Promise<void> {
    const log = record as Log;

    try {
      await this.logStore.deleteLog(log.id);
      this.message.success('日誌已刪除');
    } catch (error) {
      this.message.error('刪除日誌失敗');
      this.logger.error('[LogListComponent]', 'Failed to delete log', error as Error);
    }
  }
}
