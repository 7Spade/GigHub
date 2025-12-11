/**
 * Quality Component
 *
 * Basic prototype UI component for displaying quality inspections.
 * Uses ng-alain ST table for data display.
 *
 * @author GigHub Development Team
 * @date 2025-12-11
 */

import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { STColumn } from '@delon/abc/st';
import { SHARED_IMPORTS } from '@shared';

import { QualityService } from './quality.service';
import { InspectionStatus } from './module.metadata';

@Component({
  selector: 'app-quality',
  standalone: true,
  imports: [SHARED_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <page-header [title]="'品質管理'" [action]="action">
      <ng-template #action>
        <button nz-button nzType="primary">
          <span nz-icon nzType="plus"></span>
          新增檢查
        </button>
      </ng-template>
    </page-header>

    <!-- Statistics Cards -->
    <nz-row [nzGutter]="16" class="mb-md">
      <nz-col [nzSpan]="6">
        <nz-card>
          <nz-statistic [nzValue]="stats().total" nzTitle="總檢查數" />
        </nz-card>
      </nz-col>
      <nz-col [nzSpan]="6">
        <nz-card>
          <nz-statistic 
            [nzValue]="stats().pending" 
            nzTitle="待處理" 
            [nzValueStyle]="{ color: '#faad14' }" 
          />
        </nz-card>
      </nz-col>
      <nz-col [nzSpan]="6">
        <nz-card>
          <nz-statistic 
            [nzValue]="stats().passed" 
            nzTitle="已通過" 
            [nzValueStyle]="{ color: '#52c41a' }" 
          />
        </nz-card>
      </nz-col>
      <nz-col [nzSpan]="6">
        <nz-card>
          <nz-statistic 
            [nzValue]="stats().failed" 
            nzTitle="不合格" 
            [nzValueStyle]="{ color: '#f5222d' }" 
          />
        </nz-card>
      </nz-col>
    </nz-row>

    <!-- Inspections Table -->
    <nz-card nzTitle="檢查列表">
      @if (loading()) {
        <nz-spin nzSimple />
      } @else if (error()) {
        <nz-alert 
          nzType="error" 
          [nzMessage]="'載入失敗'" 
          [nzDescription]="error()" 
          nzShowIcon 
        />
      } @else {
        <nz-tabs>
          <nz-tab-pane nzTitle="全部">
            <st [data]="inspections()" [columns]="columns" [page]="{ show: true, showSize: true }" />
          </nz-tab-pane>
          <nz-tab-pane nzTitle="待處理">
            <st [data]="pendingInspections()" [columns]="columns" [page]="{ show: true, showSize: true }" />
          </nz-tab-pane>
          <nz-tab-pane nzTitle="不合格">
            <st [data]="failedInspections()" [columns]="columns" [page]="{ show: true, showSize: true }" />
          </nz-tab-pane>
        </nz-tabs>
      }
    </nz-card>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .mb-md {
        margin-bottom: 16px;
      }
    `
  ]
})
export class QualityComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly qualityService = inject(QualityService);

  // State from service
  readonly inspections = this.qualityService.inspections;
  readonly loading = this.qualityService.loading;
  readonly error = this.qualityService.error;
  readonly pendingInspections = this.qualityService.pendingInspections;
  readonly failedInspections = this.qualityService.failedInspections;
  readonly stats = this.qualityService.stats;

  // Table columns
  columns: STColumn[] = [
    { title: 'ID', index: 'id', width: '100px' },
    { title: '標題', index: 'title' },
    {
      title: '狀態',
      index: 'status',
      type: 'badge',
      badge: {
        pending: { text: '待處理', color: 'processing' },
        in_progress: { text: '進行中', color: 'warning' },
        passed: { text: '已通過', color: 'success' },
        failed: { text: '不合格', color: 'error' }
      }
    },
    { title: '檢查人員', index: 'inspector_id' },
    { title: '建立時間', index: 'created_at', type: 'date', dateFormat: 'yyyy-MM-dd' },
    {
      title: '操作',
      buttons: [
        { text: '查看', click: (record: any) => this.viewDetails(record) },
        { text: '編輯', click: (record: any) => this.editInspection(record) }
      ]
    }
  ];

  ngOnInit(): void {
    // Load inspections when component initializes
    const blueprintId = this.route.snapshot.params['blueprintId'];
    if (blueprintId) {
      this.qualityService.loadInspections(blueprintId);
    }
  }

  viewDetails(inspection: any): void {
    console.log('[QualityComponent] View details:', inspection);
    // TODO: Navigate to details page or open modal
  }

  editInspection(inspection: any): void {
    console.log('[QualityComponent] Edit inspection:', inspection);
    // TODO: Open edit modal
  }
}
