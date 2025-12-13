/**
 * Finance Module View Component
 * 財務域視圖元件 - 顯示於藍圖詳情頁面的 Tab 中
 */

import { Component, ChangeDetectionStrategy, OnInit, inject, input } from '@angular/core';
import { STColumn } from '@delon/abc/st';
import { SHARED_IMPORTS } from '@shared';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { CostService } from '@core/blueprint/modules/implementations/finance/services/cost.service';
import { InvoiceService } from '@core/blueprint/modules/implementations/finance/services/invoice.service';
import { PaymentService } from '@core/blueprint/modules/implementations/finance/services/payment.service';
import { BudgetService } from '@core/blueprint/modules/implementations/finance/services/budget.service';
import { LedgerService } from '@core/blueprint/modules/implementations/finance/services/ledger.service';
import { FinancialReportService } from '@core/blueprint/modules/implementations/finance/services/financial-report.service';

@Component({
  selector: 'app-finance-module-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzStatisticModule, NzEmptyModule],
  template: `
    <!-- Statistics Card -->
    <nz-card nzTitle="財務統計" class="mb-md">
      <nz-row [nzGutter]="16">
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="costService.data().length" nzTitle="成本項" [nzPrefix]="costIcon" />
          <ng-template #costIcon>
            <span nz-icon nzType="dollar" style="color: #1890ff;"></span>
          </ng-template>
        </nz-col>
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="invoiceService.data().length" nzTitle="請款單" [nzPrefix]="invoiceIcon" />
          <ng-template #invoiceIcon>
            <span nz-icon nzType="file-text" style="color: #52c41a;"></span>
          </ng-template>
        </nz-col>
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="paymentService.data().length" nzTitle="付款" [nzPrefix]="paymentIcon" />
          <ng-template #paymentIcon>
            <span nz-icon nzType="transaction" style="color: #faad14;"></span>
          </ng-template>
        </nz-col>
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="budgetService.data().length" nzTitle="預算" [nzPrefix]="budgetIcon" />
          <ng-template #budgetIcon>
            <span nz-icon nzType="fund" style="color: #722ed1;"></span>
          </ng-template>
        </nz-col>
      </nz-row>
    </nz-card>

    <!-- Tabs for Sub-modules -->
    <nz-card>
      <nz-tabset>
        <nz-tab nzTitle="成本管理">
          @if (costService.loading()) {
            <nz-spin nzSimple />
          } @else if (costService.data().length === 0) {
            <nz-empty nzNotFoundContent="暫無成本記錄" />
          } @else {
            <st [data]="costService.data()" [columns]="costColumns" />
          }
        </nz-tab>
        <nz-tab nzTitle="請款">
          @if (invoiceService.loading()) {
            <nz-spin nzSimple />
          } @else if (invoiceService.data().length === 0) {
            <nz-empty nzNotFoundContent="暫無請款單" />
          } @else {
            <st [data]="invoiceService.data()" [columns]="invoiceColumns" />
          }
        </nz-tab>
        <nz-tab nzTitle="付款">
          @if (paymentService.loading()) {
            <nz-spin nzSimple />
          } @else if (paymentService.data().length === 0) {
            <nz-empty nzNotFoundContent="暫無付款記錄" />
          } @else {
            <st [data]="paymentService.data()" [columns]="paymentColumns" />
          }
        </nz-tab>
        <nz-tab nzTitle="預算">
          @if (budgetService.loading()) {
            <nz-spin nzSimple />
          } @else if (budgetService.data().length === 0) {
            <nz-empty nzNotFoundContent="暫無預算項目" />
          } @else {
            <st [data]="budgetService.data()" [columns]="budgetColumns" />
          }
        </nz-tab>
        <nz-tab nzTitle="財務報表">
          @if (financialReportService.loading()) {
            <nz-spin nzSimple />
          } @else if (financialReportService.data().length === 0) {
            <nz-empty nzNotFoundContent="暫無財務報表" />
          } @else {
            <st [data]="financialReportService.data()" [columns]="reportColumns" />
          }
        </nz-tab>
      </nz-tabset>
    </nz-card>
  `,
  styles: []
})
export class FinanceModuleViewComponent implements OnInit {
  blueprintId = input.required<string>();
  
  readonly costService = inject(CostService);
  readonly invoiceService = inject(InvoiceService);
  readonly paymentService = inject(PaymentService);
  readonly budgetService = inject(BudgetService);
  readonly ledgerService = inject(LedgerService);
  readonly financialReportService = inject(FinancialReportService);

  costColumns: STColumn[] = [
    { title: '成本項目', index: 'item' },
    { title: '金額', index: 'amount', width: '120px' },
    { title: '類別', index: 'category', width: '100px' },
    { title: '日期', index: 'date', type: 'date', width: '180px' }
  ];

  invoiceColumns: STColumn[] = [
    { title: '請款單號', index: 'invoiceNumber', width: '150px' },
    { title: '金額', index: 'amount', width: '120px' },
    { title: '狀態', index: 'status', width: '100px' },
    { title: '申請日期', index: 'requestedAt', type: 'date', width: '180px' }
  ];

  paymentColumns: STColumn[] = [
    { title: '付款對象', index: 'payee' },
    { title: '金額', index: 'amount', width: '120px' },
    { title: '付款方式', index: 'method', width: '100px' },
    { title: '付款日期', index: 'paidAt', type: 'date', width: '180px' }
  ];

  budgetColumns: STColumn[] = [
    { title: '預算項目', index: 'item' },
    { title: '預算金額', index: 'budgetAmount', width: '120px' },
    { title: '已使用', index: 'usedAmount', width: '120px' },
    { title: '剩餘', index: 'remainingAmount', width: '120px' }
  ];

  reportColumns: STColumn[] = [
    { title: '報表名稱', index: 'reportName' },
    { title: '類型', index: 'type', width: '120px' },
    { title: '生成時間', index: 'generatedAt', type: 'date', width: '180px' }
  ];

  ngOnInit(): void {
    this.costService.load();
    this.invoiceService.load();
    this.paymentService.load();
    this.budgetService.load();
    this.ledgerService.load();
    this.financialReportService.load();
  }
}
