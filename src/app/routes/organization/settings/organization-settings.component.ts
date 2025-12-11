import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ContextType } from '@core';
import { SHARED_IMPORTS, WorkspaceContextService } from '@shared';
import { NzAlertModule } from 'ng-zorro-antd/alert';

@Component({
  selector: 'app-organization-settings',
  standalone: true,
  imports: [SHARED_IMPORTS, NzAlertModule],
  template: `
    <page-header [title]="'組織設定'" [content]="headerContent"></page-header>

    <ng-template #headerContent>
      <div>調整組織偏好與資訊。</div>
    </ng-template>

    @if (!isOrganizationContext()) {
      <nz-alert
        nzType="info"
        nzShowIcon
        nzMessage="請切換到組織上下文"
        nzDescription="請使用頂部導航列的工作區切換器切換到目標組織後再更新設定。"
        class="mb-md"
      />
    }

    <nz-card nzTitle="基本資訊">
      <nz-list>
        <nz-list-item>
          <nz-list-item-meta nzTitle="組織名稱" [nzDescription]="activeLabel() || '尚未選擇組織'"></nz-list-item-meta>
        </nz-list-item>
        <nz-list-item>
          <nz-list-item-meta nzTitle="自訂設定" nzDescription="此處預留未來與後端串接的欄位。"></nz-list-item-meta>
        </nz-list-item>
      </nz-list>
    </nz-card>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrganizationSettingsComponent {
  private readonly workspaceContext = inject(WorkspaceContextService);

  readonly activeLabel = computed(() => this.workspaceContext.contextLabel());

  isOrganizationContext(): boolean {
    return this.workspaceContext.contextType() === ContextType.ORGANIZATION;
  }
}
