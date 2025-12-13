/**
 * Workflow Module View Component
 * 流程域視圖元件 - 顯示於藍圖詳情頁面的 Tab 中
 */

import { Component, ChangeDetectionStrategy, OnInit, inject, input } from '@angular/core';
import { ApprovalService } from '@core/blueprint/modules/implementations/workflow/services/approval.service';
import { AutomationService } from '@core/blueprint/modules/implementations/workflow/services/automation.service';
import { CustomWorkflowService } from '@core/blueprint/modules/implementations/workflow/services/custom-workflow.service';
import { StateMachineService } from '@core/blueprint/modules/implementations/workflow/services/state-machine.service';
import { TemplateService } from '@core/blueprint/modules/implementations/workflow/services/template.service';
import { STColumn } from '@delon/abc/st';
import { SHARED_IMPORTS } from '@shared';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';

@Component({
  selector: 'app-workflow-module-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzStatisticModule, NzEmptyModule],
  template: `
    <!-- Statistics Card -->
    <nz-card nzTitle="流程統計" class="mb-md">
      <nz-row [nzGutter]="16">
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="customWorkflowService.data().length" nzTitle="自訂流程" [nzPrefix]="workflowIcon" />
          <ng-template #workflowIcon>
            <span nz-icon nzType="apartment" style="color: #1890ff;"></span>
          </ng-template>
        </nz-col>
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="stateMachineService.data().length" nzTitle="狀態機" [nzPrefix]="stateIcon" />
          <ng-template #stateIcon>
            <span nz-icon nzType="cluster" style="color: #52c41a;"></span>
          </ng-template>
        </nz-col>
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="automationService.data().length" nzTitle="自動化觸發" [nzPrefix]="autoIcon" />
          <ng-template #autoIcon>
            <span nz-icon nzType="robot" style="color: #faad14;"></span>
          </ng-template>
        </nz-col>
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="templateService.data().length" nzTitle="流程範本" [nzPrefix]="templateIcon" />
          <ng-template #templateIcon>
            <span nz-icon nzType="container" style="color: #722ed1;"></span>
          </ng-template>
        </nz-col>
      </nz-row>
    </nz-card>

    <!-- Tabs for Sub-modules -->
    <nz-card>
      <nz-tabset>
        <nz-tab nzTitle="自訂流程">
          @if (customWorkflowService.loading()) {
            <nz-spin nzSimple />
          } @else if (customWorkflowService.data().length === 0) {
            <nz-empty nzNotFoundContent="暫無自訂流程" />
          } @else {
            <st [data]="customWorkflowService.data()" [columns]="workflowColumns" />
          }
        </nz-tab>
        <nz-tab nzTitle="狀態機">
          @if (stateMachineService.loading()) {
            <nz-spin nzSimple />
          } @else if (stateMachineService.data().length === 0) {
            <nz-empty nzNotFoundContent="暫無狀態機配置" />
          } @else {
            <st [data]="stateMachineService.data()" [columns]="stateColumns" />
          }
        </nz-tab>
        <nz-tab nzTitle="自動化觸發">
          @if (automationService.loading()) {
            <nz-spin nzSimple />
          } @else if (automationService.data().length === 0) {
            <nz-empty nzNotFoundContent="暫無自動化規則" />
          } @else {
            <st [data]="automationService.data()" [columns]="automationColumns" />
          }
        </nz-tab>
        <nz-tab nzTitle="審批流程">
          @if (approvalService.loading()) {
            <nz-spin nzSimple />
          } @else if (approvalService.data().length === 0) {
            <nz-empty nzNotFoundContent="暫無審批流程" />
          } @else {
            <st [data]="approvalService.data()" [columns]="approvalColumns" />
          }
        </nz-tab>
      </nz-tabset>
    </nz-card>
  `,
  styles: []
})
export class WorkflowModuleViewComponent implements OnInit {
  blueprintId = input.required<string>();

  readonly customWorkflowService = inject(CustomWorkflowService);
  readonly stateMachineService = inject(StateMachineService);
  readonly automationService = inject(AutomationService);
  readonly templateService = inject(TemplateService);
  readonly approvalService = inject(ApprovalService);

  workflowColumns: STColumn[] = [
    { title: '流程名稱', index: 'name' },
    { title: '狀態', index: 'status', width: '100px' },
    { title: '建立時間', index: 'createdAt', type: 'date', width: '180px' }
  ];

  stateColumns: STColumn[] = [
    { title: '名稱', index: 'name' },
    { title: '狀態數', index: 'stateCount', width: '100px' },
    { title: '轉換數', index: 'transitionCount', width: '100px' }
  ];

  automationColumns: STColumn[] = [
    { title: '規則名稱', index: 'ruleName' },
    { title: '觸發器', index: 'trigger', width: '150px' },
    { title: '啟用', index: 'enabled', width: '80px', type: 'yn' }
  ];

  approvalColumns: STColumn[] = [
    { title: '流程名稱', index: 'processName' },
    { title: '審批人', index: 'approver', width: '120px' },
    { title: '狀態', index: 'status', width: '100px' }
  ];

  ngOnInit(): void {
    this.customWorkflowService.load();
    this.stateMachineService.load();
    this.automationService.load();
    this.templateService.load();
    this.approvalService.load();
  }
}
