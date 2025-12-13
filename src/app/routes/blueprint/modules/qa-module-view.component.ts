/**
 * QA Module View Component
 * 品質控管域視圖元件 - 顯示於藍圖詳情頁面的 Tab 中
 */

import { Component, ChangeDetectionStrategy, OnInit, inject, input } from '@angular/core';
import { STColumn } from '@delon/abc/st';
import { SHARED_IMPORTS } from '@shared';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { ChecklistService } from '@core/blueprint/modules/implementations/qa/services/checklist.service';
import { DefectService } from '@core/blueprint/modules/implementations/qa/services/defect.service';
import { InspectionService } from '@core/blueprint/modules/implementations/qa/services/inspection.service';
import { QaReportService } from '@core/blueprint/modules/implementations/qa/services/qa-report.service';

@Component({
  selector: 'app-qa-module-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzStatisticModule, NzEmptyModule],
  template: `
    <!-- Statistics Card -->
    <nz-card nzTitle="品質統計" class="mb-md">
      <nz-row [nzGutter]="16">
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="checklistService.data().length" nzTitle="檢查表" [nzPrefix]="checklistIcon" />
          <ng-template #checklistIcon>
            <span nz-icon nzType="check-square" style="color: #1890ff;"></span>
          </ng-template>
        </nz-col>
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="defectService.data().length" nzTitle="缺失" [nzPrefix]="defectIcon" />
          <ng-template #defectIcon>
            <span nz-icon nzType="warning" style="color: #ff4d4f;"></span>
          </ng-template>
        </nz-col>
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="inspectionService.data().length" nzTitle="巡檢" [nzPrefix]="inspectionIcon" />
          <ng-template #inspectionIcon>
            <span nz-icon nzType="eye" style="color: #52c41a;"></span>
          </ng-template>
        </nz-col>
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="qaReportService.data().length" nzTitle="品質報告" [nzPrefix]="reportIcon" />
          <ng-template #reportIcon>
            <span nz-icon nzType="file-text" style="color: #722ed1;"></span>
          </ng-template>
        </nz-col>
      </nz-row>
    </nz-card>

    <!-- Tabs for Sub-modules -->
    <nz-card>
      <nz-tabset>
        <nz-tab nzTitle="檢查表">
          @if (checklistService.loading()) {
            <nz-spin nzSimple />
          } @else if (checklistService.data().length === 0) {
            <nz-empty nzNotFoundContent="暫無檢查表" />
          } @else {
            <st [data]="checklistService.data()" [columns]="checklistColumns" />
          }
        </nz-tab>
        <nz-tab nzTitle="缺失管理">
          @if (defectService.loading()) {
            <nz-spin nzSimple />
          } @else if (defectService.data().length === 0) {
            <nz-empty nzNotFoundContent="暫無缺失記錄" />
          } @else {
            <st [data]="defectService.data()" [columns]="defectColumns" />
          }
        </nz-tab>
        <nz-tab nzTitle="現場巡檢">
          @if (inspectionService.loading()) {
            <nz-spin nzSimple />
          } @else if (inspectionService.data().length === 0) {
            <nz-empty nzNotFoundContent="暫無巡檢記錄" />
          } @else {
            <st [data]="inspectionService.data()" [columns]="inspectionColumns" />
          }
        </nz-tab>
        <nz-tab nzTitle="品質報告">
          @if (qaReportService.loading()) {
            <nz-spin nzSimple />
          } @else if (qaReportService.data().length === 0) {
            <nz-empty nzNotFoundContent="暫無品質報告" />
          } @else {
            <st [data]="qaReportService.data()" [columns]="reportColumns" />
          }
        </nz-tab>
      </nz-tabset>
    </nz-card>
  `,
  styles: []
})
export class QaModuleViewComponent implements OnInit {
  blueprintId = input.required<string>();
  
  readonly checklistService = inject(ChecklistService);
  readonly defectService = inject(DefectService);
  readonly inspectionService = inject(InspectionService);
  readonly qaReportService = inject(QaReportService);

  checklistColumns: STColumn[] = [
    { title: '檢查表名稱', index: 'name' },
    { title: '完成率', index: 'completionRate', width: '100px' },
    { title: '建立時間', index: 'createdAt', type: 'date', width: '180px' }
  ];

  defectColumns: STColumn[] = [
    { title: '缺失描述', index: 'description' },
    { title: '嚴重程度', index: 'severity', width: '100px' },
    { title: '狀態', index: 'status', width: '100px' },
    { title: '發現時間', index: 'foundAt', type: 'date', width: '180px' }
  ];

  inspectionColumns: STColumn[] = [
    { title: '巡檢項目', index: 'item' },
    { title: '巡檢人', index: 'inspector', width: '120px' },
    { title: '結果', index: 'result', width: '100px' },
    { title: '巡檢時間', index: 'inspectedAt', type: 'date', width: '180px' }
  ];

  reportColumns: STColumn[] = [
    { title: '報告名稱', index: 'reportName' },
    { title: '類型', index: 'reportType', width: '120px' },
    { title: '生成時間', index: 'generatedAt', type: 'date', width: '180px' }
  ];

  ngOnInit(): void {
    this.checklistService.load();
    this.defectService.load();
    this.inspectionService.load();
    this.qaReportService.load();
  }
}
