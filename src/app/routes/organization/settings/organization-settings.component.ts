import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ContextType } from '@core';
import { SHARED_IMPORTS, WorkspaceContextService } from '@shared';
import { HeaderContextSwitcherComponent } from '../../../layout/basic/widgets/context-switcher.component';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzAlertModule } from 'ng-zorro-antd/alert';

@Component({
  selector: 'app-organization-settings',
  standalone: true,
  imports: [SHARED_IMPORTS, NzMenuModule, NzAlertModule, HeaderContextSwitcherComponent],
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
        nzDescription="使用下方切換器切換到目標組織後再更新設定。"
        class="mb-md"
      />
    }

    <nz-card class="mb-md" nzTitle="工作區切換器">
      <div class="text-grey mb-sm">切換至目標組織後即可開始調整設定。</div>
      <ul nz-menu nzMode="inline" class="bg-transparent border-0">
        <header-context-switcher />
      </ul>
    </nz-card>

    <nz-card nzTitle="基本資訊">
      <nz-list>
        <nz-list-item>
          <nz-list-item-meta
            nzTitle="組織名稱"
            [nzDescription]="activeLabel() || '尚未選擇組織'"
          ></nz-list-item-meta>
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
      .bg-transparent {
        background: transparent;
      }
      .border-0 {
        border: 0;
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
