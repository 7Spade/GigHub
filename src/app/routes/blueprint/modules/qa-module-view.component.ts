/**
 * QA Module View Component
 * 品質控管域視圖元件 - 顯示於藍圖詳情頁面的 Tab 中
 */

import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzEmptyModule } from 'ng-zorro-antd/empty';

@Component({
  selector: 'app-qa-module-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzAlertModule, NzEmptyModule],
  template: `
    <nz-card nzTitle="品質控管域 (QA Domain)">
      <nz-alert
        nzType="info"
        nzMessage="模組開發中"
        nzDescription="品質控管域包含：檢查表、缺失管理、現場巡檢、品質報告"
        nzShowIcon
        class="mb-md"
      ></nz-alert>

      <nz-empty nzNotFoundImage="simple" [nzNotFoundContent]="contentTpl">
        <ng-template #contentTpl>
          <span> 此模組正在開發中，將提供完整的品質檢查與管理功能 </span>
        </ng-template>
        <ng-template nz-empty-footer>
          <button nz-button nzType="primary" disabled>
            <span nz-icon nzType="safety-certificate"></span>
            品質檢查
          </button>
        </ng-template>
      </nz-empty>
    </nz-card>
  `,
  styles: []
})
export class QaModuleViewComponent {
  /** Blueprint ID */
  blueprintId = input.required<string>();
}
