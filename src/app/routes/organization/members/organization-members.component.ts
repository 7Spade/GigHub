import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ContextType, OrganizationMember, OrganizationRole } from '@core';
import { SHARED_IMPORTS, WorkspaceContextService } from '@shared';
import { HeaderContextSwitcherComponent } from '../../../layout/basic/widgets/context-switcher.component';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzAlertModule } from 'ng-zorro-antd/alert';

@Component({
  selector: 'app-organization-members',
  standalone: true,
  imports: [SHARED_IMPORTS, NzMenuModule, NzAlertModule, HeaderContextSwitcherComponent],
  template: `
    <page-header [title]="'組織成員'" [desc]="'管理當前組織的成員與角色。'"></page-header>

    @if (!isOrganizationContext()) {
      <nz-alert
        nzType="info"
        nzShowIcon
        nzMessage="請切換到組織上下文"
        nzDescription="使用下方切換器切換到目標組織後即可管理成員。"
        class="mb-md"
      />
    }

    <nz-card class="mb-md" nzTitle="工作區切換器">
      <div class="text-grey mb-sm">支援直接在頁面切換到對應的組織。</div>
      <ul nz-menu nzMode="inline" class="bg-transparent border-0">
        <header-context-switcher />
      </ul>
    </nz-card>

    <nz-card nzTitle="成員列表">
      <nz-table #table [nzData]="displayMembers()">
        <thead>
          <tr>
            <th nzWidth="200px">成員 ID</th>
            <th nzWidth="180px">角色</th>
            <th nzWidth="200px">加入時間</th>
          </tr>
        </thead>
        <tbody>
          @for (member of table.data; track member.id) {
            <tr>
              <td>{{ member.user_id }}</td>
              <td>
                <nz-tag [nzColor]="roleColor(member.role)">{{ roleLabel(member.role) }}</nz-tag>
              </td>
              <td>{{ member.joined_at || '-' }}</td>
            </tr>
          }
        </tbody>
      </nz-table>
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
export class OrganizationMembersComponent {
  private readonly workspaceContext = inject(WorkspaceContextService);

  private readonly members = signal<OrganizationMember[]>([
    {
      id: 'owner',
      organization_id: 'current',
      user_id: 'owner@example.com',
      role: OrganizationRole.OWNER,
      joined_at: new Date().toISOString()
    },
    {
      id: 'admin',
      organization_id: 'current',
      user_id: 'admin@example.com',
      role: OrganizationRole.ADMIN,
      joined_at: new Date().toISOString()
    },
    {
      id: 'member',
      organization_id: 'current',
      user_id: 'member@example.com',
      role: OrganizationRole.MEMBER,
      joined_at: new Date().toISOString()
    }
  ]);

  readonly currentOrgId = computed(() =>
    this.workspaceContext.contextType() === ContextType.ORGANIZATION ? this.workspaceContext.contextId() : null
  );

  displayMembers = computed(() => {
    const orgId = this.currentOrgId();
    if (!orgId) {
      return this.members();
    }
    return this.members().map(member => ({ ...member, organization_id: orgId }));
  });

  isOrganizationContext(): boolean {
    return this.workspaceContext.contextType() === ContextType.ORGANIZATION;
  }

  roleLabel(role: OrganizationRole): string {
    switch (role) {
      case OrganizationRole.OWNER:
        return '擁有者';
      case OrganizationRole.ADMIN:
        return '管理員';
      case OrganizationRole.MEMBER:
      default:
        return '成員';
    }
  }

  roleColor(role: OrganizationRole): string {
    switch (role) {
      case OrganizationRole.OWNER:
        return 'gold';
      case OrganizationRole.ADMIN:
        return 'blue';
      case OrganizationRole.MEMBER:
      default:
        return 'default';
    }
  }
}
