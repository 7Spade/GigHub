/**
 * Safety Module View Component
 * 安全域視圖元件
 */

import { Component, ChangeDetectionStrategy, OnInit, inject, input } from '@angular/core';
import { IncidentReportService } from '@core/blueprint/modules/implementations/safety/services/incident-report.service';
import { RiskAssessmentService } from '@core/blueprint/modules/implementations/safety/services/risk-assessment.service';
import { SafetyInspectionService } from '@core/blueprint/modules/implementations/safety/services/safety-inspection.service';
import { SafetyTrainingService } from '@core/blueprint/modules/implementations/safety/services/safety-training.service';
import { STColumn } from '@delon/abc/st';
import { SHARED_IMPORTS } from '@shared';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';

@Component({
  selector: 'app-safety-module-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzStatisticModule, NzEmptyModule],
  template: `
    <nz-card nzTitle="安全統計" class="mb-md">
      <nz-row [nzGutter]="16">
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="inspectionService.data().length" nzTitle="巡檢" />
        </nz-col>
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="riskService.data().length" nzTitle="風險評估" />
        </nz-col>
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="incidentService.data().length" nzTitle="事故通報" />
        </nz-col>
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="trainingService.data().length" nzTitle="安全訓練" />
        </nz-col>
      </nz-row>
    </nz-card>

    <nz-card>
      <nz-tabset>
        <nz-tab nzTitle="安全巡檢">
          @if (inspectionService.loading()) {
            <nz-spin nzSimple />
          } @else if (inspectionService.data().length === 0) {
            <nz-empty nzNotFoundContent="暫無巡檢記錄" />
          } @else {
            <st [data]="inspectionService.data()" [columns]="inspectionColumns" />
          }
        </nz-tab>
        <nz-tab nzTitle="風險評估">
          @if (riskService.loading()) {
            <nz-spin nzSimple />
          } @else if (riskService.data().length === 0) {
            <nz-empty nzNotFoundContent="暫無風險評估" />
          } @else {
            <st [data]="riskService.data()" [columns]="riskColumns" />
          }
        </nz-tab>
        <nz-tab nzTitle="事故通報">
          @if (incidentService.loading()) {
            <nz-spin nzSimple />
          } @else if (incidentService.data().length === 0) {
            <nz-empty nzNotFoundContent="暫無事故通報" />
          } @else {
            <st [data]="incidentService.data()" [columns]="incidentColumns" />
          }
        </nz-tab>
        <nz-tab nzTitle="安全訓練">
          @if (trainingService.loading()) {
            <nz-spin nzSimple />
          } @else if (trainingService.data().length === 0) {
            <nz-empty nzNotFoundContent="暫無訓練記錄" />
          } @else {
            <st [data]="trainingService.data()" [columns]="trainingColumns" />
          }
        </nz-tab>
      </nz-tabset>
    </nz-card>
  `,
  styles: []
})
export class SafetyModuleViewComponent implements OnInit {
  blueprintId = input.required<string>();

  readonly inspectionService = inject(SafetyInspectionService);
  readonly riskService = inject(RiskAssessmentService);
  readonly incidentService = inject(IncidentReportService);
  readonly trainingService = inject(SafetyTrainingService);

  inspectionColumns: STColumn[] = [
    { title: '巡檢項目', index: 'item' },
    { title: '巡檢人', index: 'inspector', width: '120px' },
    { title: '結果', index: 'result', width: '100px' },
    { title: '時間', index: 'inspectedAt', type: 'date', width: '180px' }
  ];

  riskColumns: STColumn[] = [
    { title: '風險項目', index: 'riskItem' },
    { title: '等級', index: 'level', width: '100px' },
    { title: '狀態', index: 'status', width: '100px' }
  ];

  incidentColumns: STColumn[] = [
    { title: '事故描述', index: 'description' },
    { title: '嚴重度', index: 'severity', width: '100px' },
    { title: '通報時間', index: 'reportedAt', type: 'date', width: '180px' }
  ];

  trainingColumns: STColumn[] = [
    { title: '訓練課程', index: 'course' },
    { title: '講師', index: 'instructor', width: '120px' },
    { title: '時間', index: 'trainingDate', type: 'date', width: '180px' }
  ];

  ngOnInit(): void {
    this.inspectionService.load();
    this.riskService.load();
    this.incidentService.load();
    this.trainingService.load();
  }
}
