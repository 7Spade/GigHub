/**
 * Cloud Module View Component
 * 雲端域視圖元件
 *
 * Purpose: Display cloud storage, backup, and sync features
 * Created: 2025-12-13
 */

import { Component, ChangeDetectionStrategy, OnInit, input, signal } from '@angular/core';
import { STColumn } from '@delon/abc/st';
import { SHARED_IMPORTS } from '@shared';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';

/**
 * Cloud file interface
 */
interface CloudFile {
  name: string;
  size: string;
  type: string;
  status: 'synced' | 'pending' | 'error';
  uploadedAt: Date;
}

/**
 * Sync status interface
 */
interface SyncStatus {
  item: string;
  status: string;
  lastSync: Date;
}

/**
 * Backup interface
 */
interface Backup {
  name: string;
  size: string;
  createdAt: Date;
}

/**
 * Cloud Module View Component
 *
 * Features:
 * - Cloud storage statistics
 * - File sync status
 * - Backup management
 * - Cloud resource monitoring
 *
 * ✅ Follows Angular 20 Standalone Component pattern
 * ✅ Uses Signals for state management
 * ✅ Implements OnPush change detection
 */
@Component({
  selector: 'app-cloud-module-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzStatisticModule, NzEmptyModule],
  template: `
    <nz-card nzTitle="雲端統計" class="mb-md">
      <nz-row [nzGutter]="16">
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="storageUsed()" nzTitle="已用容量 (GB)" [nzPrefix]="storageIconTpl" />
          <ng-template #storageIconTpl>
            <span nz-icon nzType="cloud-upload"></span>
          </ng-template>
        </nz-col>
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="filesCount()" nzTitle="檔案數量" [nzPrefix]="filesIconTpl" />
          <ng-template #filesIconTpl>
            <span nz-icon nzType="file"></span>
          </ng-template>
        </nz-col>
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="syncedCount()" nzTitle="已同步" [nzPrefix]="syncIconTpl" />
          <ng-template #syncIconTpl>
            <span nz-icon nzType="sync"></span>
          </ng-template>
        </nz-col>
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="backupCount()" nzTitle="備份數" [nzPrefix]="backupIconTpl" />
          <ng-template #backupIconTpl>
            <span nz-icon nzType="save"></span>
          </ng-template>
        </nz-col>
      </nz-row>
    </nz-card>

    <nz-card>
      <nz-tabset>
        <nz-tab nzTitle="雲端檔案">
          @if (loading()) {
            <nz-spin nzSimple />
          } @else if (cloudFiles().length === 0) {
            <nz-empty nzNotFoundContent="暫無雲端檔案">
              <ng-template nz-empty-footer>
                <button nz-button nzType="primary" (click)="uploadFile()">
                  <span nz-icon nzType="cloud-upload"></span>
                  上傳檔案
                </button>
              </ng-template>
            </nz-empty>
          } @else {
            <st [data]="cloudFiles()" [columns]="fileColumns" />
          }
        </nz-tab>

        <nz-tab nzTitle="同步狀態">
          @if (loading()) {
            <nz-spin nzSimple />
          } @else if (syncStatus().length === 0) {
            <nz-empty nzNotFoundContent="暫無同步記錄" />
          } @else {
            <st [data]="syncStatus()" [columns]="syncColumns" />
          }
        </nz-tab>

        <nz-tab nzTitle="備份管理">
          @if (loading()) {
            <nz-spin nzSimple />
          } @else if (backups().length === 0) {
            <nz-empty nzNotFoundContent="暫無備份記錄">
              <ng-template nz-empty-footer>
                <button nz-button nzType="primary" (click)="createBackup()">
                  <span nz-icon nzType="save"></span>
                  建立備份
                </button>
              </ng-template>
            </nz-empty>
          } @else {
            <st [data]="backups()" [columns]="backupColumns" />
          }
        </nz-tab>
      </nz-tabset>
    </nz-card>
  `,
  styles: []
})
export class CloudModuleViewComponent implements OnInit {
  // ✅ Modern Angular 20 input pattern
  blueprintId = input.required<string>();

  // ✅ Signal-based state management
  loading = signal(false);
  storageUsed = signal(0);
  filesCount = signal(0);
  syncedCount = signal(0);
  backupCount = signal(0);
  cloudFiles = signal<CloudFile[]>([]);
  syncStatus = signal<SyncStatus[]>([]);
  backups = signal<Backup[]>([]);

  // Table columns configuration
  fileColumns: STColumn[] = [
    { title: '檔案名稱', index: 'name' },
    { title: '大小', index: 'size', width: '100px' },
    { title: '類型', index: 'type', width: '100px' },
    {
      title: '狀態',
      index: 'status',
      width: '100px',
      type: 'badge',
      badge: {
        synced: { text: '已同步', color: 'success' },
        pending: { text: '待同步', color: 'processing' },
        error: { text: '錯誤', color: 'error' }
      }
    },
    { title: '上傳時間', index: 'uploadedAt', type: 'date', width: '180px' }
  ];

  syncColumns: STColumn[] = [
    { title: '項目', index: 'item' },
    { title: '同步狀態', index: 'status', width: '120px' },
    { title: '最後同步', index: 'lastSync', type: 'date', width: '180px' }
  ];

  backupColumns: STColumn[] = [
    { title: '備份名稱', index: 'name' },
    { title: '大小', index: 'size', width: '120px' },
    { title: '建立時間', index: 'createdAt', type: 'date', width: '180px' },
    {
      title: '操作',
      buttons: [
        {
          text: '還原',
          icon: 'reload',
          click: (record: Backup) => this.restoreBackup(record)
        },
        {
          text: '下載',
          icon: 'download',
          click: (record: Backup) => this.downloadBackup(record)
        }
      ]
    }
  ];

  ngOnInit(): void {
    this.loadCloudData();
  }

  /**
   * Load cloud data
   * 載入雲端資料
   */
  private async loadCloudData(): Promise<void> {
    this.loading.set(true);

    try {
      // Simulate API call - Replace with actual service calls
      await new Promise(resolve => setTimeout(resolve, 500));

      // Mock data for demonstration
      this.storageUsed.set(2.5);
      this.filesCount.set(0);
      this.syncedCount.set(0);
      this.backupCount.set(0);
      this.cloudFiles.set([]);
      this.syncStatus.set([]);
      this.backups.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Upload file to cloud
   * 上傳檔案到雲端
   */
  uploadFile(): void {
    console.log('[CloudModuleView] Upload file triggered');
    // TODO: Implement file upload functionality
  }

  /**
   * Create backup
   * 建立備份
   */
  createBackup(): void {
    console.log('[CloudModuleView] Create backup triggered');
    // TODO: Implement backup creation functionality
  }

  /**
   * Restore backup
   * 還原備份
   */
  restoreBackup(record: Backup): void {
    console.log('[CloudModuleView] Restore backup:', record);
    // TODO: Implement backup restoration functionality
  }

  /**
   * Download backup
   * 下載備份
   */
  downloadBackup(record: Backup): void {
    console.log('[CloudModuleView] Download backup:', record);
    // TODO: Implement backup download functionality
  }
}
