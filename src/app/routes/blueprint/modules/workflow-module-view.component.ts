/**
 * Workflow Module View Component
 * 流程域視圖元件 - 顯示於藍圖詳情頁面的 Tab 中
 */

import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzEmptyModule } from 'ng-zorro-antd/empty';

@Component({
  selector: 'app-workflow-module-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzAlertModule, NzEmptyModule],
  template: `
    <nz-card nzTitle="流程域 (Workflow Domain)">
      <nz-alert
        nzType="info"
        nzMessage="模組開發中"
        nzDescription="流程域包含：自訂流程、狀態機、自動化觸發器、流程範本、審批流程"
        nzShowIcon
        class="mb-md"
      ></nz-alert>

      <nz-empty nzNotFoundImage="simple" [nzNotFoundContent]="contentTpl">
        <ng-template #contentTpl>
          <span> 此模組正在開發中，將提供彈性的工作流程管理功能 </span>
        </ng-template>
        <ng-template nz-empty-footer>
          <button nz-button nzType="primary" disabled>
            <span nz-icon nzType="apartment"></span>
            管理流程
          </button>
        </ng-template>
      </nz-empty>
    </nz-card>
  `,
  styles: []
})
export class WorkflowModuleViewComponent {
  /** Blueprint ID */
  blueprintId = input.required<string>();
}
