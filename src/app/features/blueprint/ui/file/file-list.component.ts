/**
 * File List Component
 *
 * Displays files and folders with navigation support
 *
 * @module features/blueprint/ui/file/file-list.component
 */

import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, OnInit, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

import { File } from '../../domain';
import { FileTypeEnum, FILE_TYPE_ICONS, FILE_TYPE_LABELS } from '../../domain/enums';
import { FileStore, FileBreadcrumb } from '../../data-access/stores';

@Component({
  selector: 'app-file-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzBreadCrumbModule,
    NzButtonModule,
    NzEmptyModule,
    NzIconModule,
    NzInputModule,
    NzSpinModule,
    NzTableModule,
    NzTagModule,
    NzToolTipModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="file-list">
      <!-- Toolbar -->
      <div class="file-toolbar">
        <div class="toolbar-left">
          <button nz-button nzType="primary" (click)="createFolder.emit()">
            <span nz-icon nzType="folder-add"></span>
            新增資料夾
          </button>
          <button nz-button (click)="uploadFile.emit()">
            <span nz-icon nzType="upload"></span>
            上傳檔案
          </button>
        </div>
        <div class="toolbar-right">
          <nz-input-group [nzSuffix]="searchIcon">
            <input nz-input placeholder="搜尋檔案..." [(ngModel)]="searchTerm" (ngModelChange)="onSearch($event)" />
          </nz-input-group>
          <ng-template #searchIcon>
            <span nz-icon nzType="search"></span>
          </ng-template>
        </div>
      </div>

      <!-- Breadcrumb -->
      <nz-breadcrumb class="file-breadcrumb">
        <nz-breadcrumb-item>
          <a (click)="navigateToRoot()">
            <span nz-icon nzType="home"></span>
            根目錄
          </a>
        </nz-breadcrumb-item>
        @for (crumb of store.breadcrumbs(); track crumb.id) {
          <nz-breadcrumb-item>
            <a (click)="navigateToBreadcrumb(crumb)">{{ crumb.name }}</a>
          </nz-breadcrumb-item>
        }
      </nz-breadcrumb>

      <!-- Loading -->
      @if (store.loading()) {
        <div class="loading-container">
          <nz-spin nzSimple></nz-spin>
        </div>
      } @else if (store.files().length === 0) {
        <nz-empty nzNotFoundContent="此資料夾沒有任何檔案"></nz-empty>
      } @else {
        <!-- File Table -->
        <nz-table
          #fileTable
          [nzData]="store.files()"
          [nzShowPagination]="false"
          nzSize="small"
        >
          <thead>
            <tr>
              <th nzWidth="40%">名稱</th>
              <th nzWidth="15%">類型</th>
              <th nzWidth="15%">大小</th>
              <th nzWidth="20%">修改時間</th>
              <th nzWidth="10%">操作</th>
            </tr>
          </thead>
          <tbody>
            @for (file of fileTable.data; track file.id) {
              <tr (dblclick)="onFileDoubleClick(file)">
                <td>
                  <span nz-icon [nzType]="getFileIcon(file.file_type)" class="file-icon"></span>
                  {{ file.name }}
                </td>
                <td>
                  <nz-tag>{{ getFileTypeLabel(file.file_type) }}</nz-tag>
                </td>
                <td>{{ formatFileSize(file.size_bytes) }}</td>
                <td>{{ file.updated_at | date:'yyyy-MM-dd HH:mm' }}</td>
                <td>
                  <button nz-button nzType="text" nzSize="small" nz-tooltip nzTooltipTitle="編輯" (click)="editFile.emit(file)">
                    <span nz-icon nzType="edit"></span>
                  </button>
                  <button nz-button nzType="text" nzSize="small" nzDanger nz-tooltip nzTooltipTitle="刪除" (click)="deleteFile.emit(file)">
                    <span nz-icon nzType="delete"></span>
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </nz-table>
      }
    </div>
  `,
  styles: [`
    .file-list {
      padding: 16px;
    }
    .file-toolbar {
      display: flex;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    .toolbar-left {
      display: flex;
      gap: 8px;
    }
    .file-breadcrumb {
      margin-bottom: 16px;
    }
    .loading-container {
      display: flex;
      justify-content: center;
      padding: 48px;
    }
    .file-icon {
      margin-right: 8px;
      font-size: 16px;
    }
  `]
})
export class FileListComponent implements OnInit {
  readonly store = inject(FileStore);

  blueprintId = input.required<string>();

  createFolder = output<void>();
  uploadFile = output<void>();
  editFile = output<File>();
  deleteFile = output<File>();
  fileSelected = output<File>();

  searchTerm = '';

  ngOnInit(): void {
    this.store.loadFiles(this.blueprintId());
  }

  getFileIcon(fileType: string): string {
    return FILE_TYPE_ICONS[fileType as FileTypeEnum] || 'file';
  }

  getFileTypeLabel(fileType: string): string {
    return FILE_TYPE_LABELS[fileType as FileTypeEnum] || '其他';
  }

  formatFileSize(bytes: number | null): string {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
  }

  onFileDoubleClick(file: File): void {
    if (file.file_type === FileTypeEnum.FOLDER) {
      this.store.navigateToFolder(this.blueprintId(), file);
    } else {
      this.fileSelected.emit(file);
    }
  }

  navigateToRoot(): void {
    this.store.navigateToFolder(this.blueprintId(), null);
  }

  navigateToBreadcrumb(crumb: FileBreadcrumb): void {
    const files = this.store.files();
    const folder = files.find(f => f.id === crumb.id);
    if (folder) {
      this.store.navigateToFolder(this.blueprintId(), folder);
    }
  }

  onSearch(term: string): void {
    if (term) {
      this.store.searchFiles(this.blueprintId(), term);
    } else {
      this.store.loadFiles(this.blueprintId(), this.store.currentFolder()?.id || null);
    }
  }
}
