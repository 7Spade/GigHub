/**
 * Acceptance Module View Component
 * 驗收域視圖元件 - 顯示於藍圖詳情頁面的 Tab 中
 */

import { Component, ChangeDetectionStrategy, OnInit, inject, input } from '@angular/core';
import { STColumn } from '@delon/abc/st';
import { SHARED_IMPORTS } from '@shared';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { RequestService } from '@core/blueprint/modules/implementations/acceptance/services/request.service';
import { ReviewService } from '@core/blueprint/modules/implementations/acceptance/services/review.service';
import { PreliminaryService } from '@core/blueprint/modules/implementations/acceptance/services/preliminary.service';
import { ReInspectionService } from '@core/blueprint/modules/implementations/acceptance/services/re-inspection.service';
import { ConclusionService } from '@core/blueprint/modules/implementations/acceptance/services/conclusion.service';

@Component({
  selector: 'app-acceptance-module-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzStatisticModule, NzEmptyModule],
  template: `
    <!-- Statistics Card -->
    <nz-card nzTitle="驗收統計" class="mb-md">
      <nz-row [nzGutter]="16">
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="requestService.data().length" nzTitle="驗收申請" />
        </nz-col>
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="reviewService.data().length" nzTitle="審核中" />
        </nz-col>
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="preliminaryService.data().length" nzTitle="初驗" />
        </nz-col>
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="conclusionService.data().length" nzTitle="已完成" />
        </nz-col>
      </nz-row>
    </nz-card>

    <!-- Tabs for Sub-modules -->
    <nz-card>
      <nz-tabset>
        <nz-tab nzTitle="驗收申請">
          @if (requestService.loading()) {
            <nz-spin nzSimple />
          } @else if (requestService.data().length === 0) {
            <nz-empty nzNotFoundContent="暫無驗收申請" />
          } @else {
            <st [data]="requestService.data()" [columns]="requestColumns" />
          }
        </nz-tab>
        <nz-tab nzTitle="審核">
          @if (reviewService.loading()) {
            <nz-spin nzSimple />
          } @else if (reviewService.data().length === 0) {
            <nz-empty nzNotFoundContent="暫無審核記錄" />
          } @else {
            <st [data]="reviewService.data()" [columns]="reviewColumns" />
          }
        </nz-tab>
        <nz-tab nzTitle="初驗">
          @if (preliminaryService.loading()) {
            <nz-spin nzSimple />
          } @else if (preliminaryService.data().length === 0) {
            <nz-empty nzNotFoundContent="暫無初驗記錄" />
          } @else {
            <st [data]="preliminaryService.data()" [columns]="preliminaryColumns" />
          }
        </nz-tab>
        <nz-tab nzTitle="複驗">
          @if (reInspectionService.loading()) {
            <nz-spin nzSimple />
          } @else if (reInspectionService.data().length === 0) {
            <nz-empty nzNotFoundContent="暫無複驗記錄" />
          } @else {
            <st [data]="reInspectionService.data()" [columns]="reInspectionColumns" />
          }
        </nz-tab>
        <nz-tab nzTitle="驗收結論">
          @if (conclusionService.loading()) {
            <nz-spin nzSimple />
          } @else if (conclusionService.data().length === 0) {
            <nz-empty nzNotFoundContent="暫無驗收結論" />
          } @else {
            <st [data]="conclusionService.data()" [columns]="conclusionColumns" />
          }
        </nz-tab>
      </nz-tabset>
    </nz-card>
  `,
  styles: []
})
export class AcceptanceModuleViewComponent implements OnInit {
  blueprintId = input.required<string>();
  
  readonly requestService = inject(RequestService);
  readonly reviewService = inject(ReviewService);
  readonly preliminaryService = inject(PreliminaryService);
  readonly reInspectionService = inject(ReInspectionService);
  readonly conclusionService = inject(ConclusionService);

  requestColumns: STColumn[] = [
    { title: '申請項目', index: 'item' },
    { title: '申請人', index: 'requester', width: '120px' },
    { title: '狀態', index: 'status', width: '100px' },
    { title: '申請時間', index: 'requestedAt', type: 'date', width: '180px' }
  ];

  reviewColumns: STColumn[] = [
    { title: '審核項目', index: 'item' },
    { title: '審核人', index: 'reviewer', width: '120px' },
    { title: '結果', index: 'result', width: '100px' }
  ];

  preliminaryColumns: STColumn[] = [
    { title: '初驗項目', index: 'item' },
    { title: '驗收人', index: 'inspector', width: '120px' },
    { title: '通過', index: 'passed', width: '80px', type: 'yn' }
  ];

  reInspectionColumns: STColumn[] = [
    { title: '複驗項目', index: 'item' },
    { title: '複驗原因', index: 'reason', width: '200px' },
    { title: '狀態', index: 'status', width: '100px' }
  ];

  conclusionColumns: STColumn[] = [
    { title: '驗收項目', index: 'item' },
    { title: '最終結果', index: 'finalResult', width: '100px' },
    { title: '完成時間', index: 'completedAt', type: 'date', width: '180px' }
  ];

  ngOnInit(): void {
    this.requestService.load();
    this.reviewService.load();
    this.preliminaryService.load();
    this.reInspectionService.load();
    this.conclusionService.load();
  }
}
