import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ContextType, Team } from '@core';
import { SHARED_IMPORTS, WorkspaceContextService } from '@shared';
import { HeaderContextSwitcherComponent } from '../../../layout/basic/widgets/context-switcher.component';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzAlertModule } from 'ng-zorro-antd/alert';

@Component({
  selector: 'app-organization-teams',
  standalone: true,
  imports: [SHARED_IMPORTS, NzMenuModule, NzAlertModule, HeaderContextSwitcherComponent],
  template: `
    <page-header [title]="'團隊管理'" [content]="headerContent"></page-header>
    
    <ng-template #headerContent>
      <div>瀏覽並管理組織內的團隊。</div>
    </ng-template>

    @if (!isOrganizationContext()) {
      <nz-alert
        nzType="info"
        nzShowIcon
        nzMessage="請切換到組織上下文"
        nzDescription="使用下方切換器切換到目標組織後即可查看團隊列表。"
        class="mb-md"
      />
    }

    <nz-card class="mb-md" nzTitle="工作區切換器">
      <div class="text-grey mb-sm">切換到目標組織後，會依據組織載入對應團隊。</div>
      <ul nz-menu nzMode="inline" class="bg-transparent border-0">
        <header-context-switcher />
      </ul>
    </nz-card>

    <nz-card nzTitle="團隊列表">
      <nz-list [nzDataSource]="teams()" [nzRenderItem]="teamTpl" [nzItemLayout]="'horizontal'"></nz-list>
      <ng-template #teamTpl let-team>
        <nz-list-item>
          <nz-list-item-meta
            [nzTitle]="team.name"
            [nzDescription]="team.description || '尚無描述'"
          ></nz-list-item-meta>
          <nz-tag>{{ team.id }}</nz-tag>
        </nz-list-item>
      </ng-template>
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
export class OrganizationTeamsComponent {
  private readonly workspaceContext = inject(WorkspaceContextService);

  readonly currentOrgId = computed(() =>
    this.workspaceContext.contextType() === ContextType.ORGANIZATION ? this.workspaceContext.contextId() : null
  );

  readonly teams = computed<Team[]>(() => {
    const orgId = this.currentOrgId();
    if (!orgId) {
      return [];
    }
    const teams = this.workspaceContext.getTeamsForOrg(orgId);
    if (teams.length > 0) {
      return teams;
    }
    return [
      {
        id: `${orgId}-team-1`,
        organization_id: orgId,
        name: '預設團隊',
        description: '尚未連接資料來源時的示例團隊'
      }
    ];
  });

  isOrganizationContext(): boolean {
    return this.workspaceContext.contextType() === ContextType.ORGANIZATION;
  }
}
