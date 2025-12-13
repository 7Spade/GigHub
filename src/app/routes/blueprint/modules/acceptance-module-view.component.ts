/**
 * Acceptance Module View Component
 * 驗收域視圖元件 - 顯示於藍圖詳情頁面的 Tab 中
 */

import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzEmptyModule } from 'ng-zorro-antd/empty';

@Component({
  selector: 'app-acceptance-module-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzAlertModule, NzEmptyModule],
  template: `
    <nz-card nzTitle="驗收域 (Acceptance Domain)">
      <nz-alert
        nzType="info"
        nzMessage="模組開發中"
        nzDescription="驗收域包含：驗收申請、驗收審核、初驗、複驗、驗收結論"
        nzShowIcon
        class="mb-md"
      ></nz-alert>

      <nz-empty nzNotFoundImage="simple" [nzNotFoundContent]="contentTpl">
        <ng-template #contentTpl>
          <span> 此模組正在開發中，將提供完整的驗收流程管理功能 </span>
        </ng-template>
        <ng-template nz-empty-footer>
          <button nz-button nzType="primary" disabled>
            <span nz-icon nzType="check-circle"></span>
            驗收管理
          </button>
        </ng-template>
      </nz-empty>
    </nz-card>
  `,
  styles: []
})
export class AcceptanceModuleViewComponent {
  /** Blueprint ID */
  blueprintId = input.required<string>();
}
