/**
 * Safety Module View Component
 * 安全域視圖元件 - 顯示於藍圖詳情頁面的 Tab 中
 */

import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzEmptyModule } from 'ng-zorro-antd/empty';

@Component({
  selector: 'app-safety-module-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzAlertModule, NzEmptyModule],
  template: `
    <nz-card nzTitle="安全域 (Safety Domain)">
      <nz-alert
        nzType="info"
        nzMessage="模組開發中"
        nzDescription="安全域包含：安全巡檢、風險評估、事故通報、安全教育訓練"
        nzShowIcon
        class="mb-md"
      ></nz-alert>

      <nz-empty nzNotFoundImage="simple" [nzNotFoundContent]="contentTpl">
        <ng-template #contentTpl>
          <span> 此模組正在開發中，將提供完整的工地安全管理功能 </span>
        </ng-template>
        <ng-template nz-empty-footer>
          <button nz-button nzType="primary" disabled>
            <span nz-icon nzType="safety"></span>
            安全管理
          </button>
        </ng-template>
      </nz-empty>
    </nz-card>
  `,
  styles: []
})
export class SafetyModuleViewComponent {
  /** Blueprint ID */
  blueprintId = input.required<string>();
}
