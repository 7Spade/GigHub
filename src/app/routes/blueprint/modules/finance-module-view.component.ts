/**
 * Finance Module View Component
 * 財務域視圖元件 - 顯示於藍圖詳情頁面的 Tab 中
 */

import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzEmptyModule } from 'ng-zorro-antd/empty';

@Component({
  selector: 'app-finance-module-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzAlertModule, NzEmptyModule],
  template: `
    <nz-card nzTitle="財務域 (Finance Domain)">
      <nz-alert
        nzType="info"
        nzMessage="模組開發中"
        nzDescription="財務域包含：成本管理、請款、付款、預算、帳務、財務報表"
        nzShowIcon
        class="mb-md"
      ></nz-alert>

      <nz-empty nzNotFoundImage="simple" [nzNotFoundContent]="contentTpl">
        <ng-template #contentTpl>
          <span> 此模組正在開發中，將提供完整的財務管理功能 </span>
        </ng-template>
        <ng-template nz-empty-footer>
          <button nz-button nzType="primary" disabled>
            <span nz-icon nzType="dollar"></span>
            財務管理
          </button>
        </ng-template>
      </nz-empty>
    </nz-card>
  `,
  styles: []
})
export class FinanceModuleViewComponent {
  /** Blueprint ID */
  blueprintId = input.required<string>();
}
