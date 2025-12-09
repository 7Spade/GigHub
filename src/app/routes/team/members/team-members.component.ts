import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ContextType, TeamMember, TeamRole } from '@core';
import { SHARED_IMPORTS, WorkspaceContextService } from '@shared';
import { HeaderContextSwitcherComponent } from '../../../layout/basic/widgets/context-switcher.component';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzAlertModule } from 'ng-zorro-antd/alert';

@Component({
  selector: 'app-team-members',
  standalone: true,
  imports: [SHARED_IMPORTS, NzMenuModule, NzAlertModule, HeaderContextSwitcherComponent],
  template: `
    <page-header [title]="'團隊成員'" [content]="headerContent"></page-header>
    
    <ng-template #headerContent>
      <div>檢視並管理目前團隊的成員。</div>
    </ng-template>

    @if (!isTeamContext()) {
      <nz-alert
        nzType="info"
        nzShowIcon
        nzMessage="請切換到團隊上下文"
        nzDescription="使用下方切換器切換到目標團隊後即可管理成員。"
        class="mb-md"
      />
    }

    <nz-card class="mb-md" nzTitle="工作區切換器">
      <div class="text-grey mb-sm">切換到目標團隊後，即可同步顯示成員列表。</div>
      <ul nz-menu nzMode="inline" class="bg-transparent border-0">
        <header-context-switcher />
      </ul>
    </nz-card>

    <nz-card nzTitle="成員列表">
      <nz-table #table [nzData]="displayMembers()">
        <thead>
          <tr>
            <th nzWidth="200px">成員 ID</th>
            <th nzWidth="140px">角色</th>
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
export class TeamMembersComponent {
  private readonly workspaceContext = inject(WorkspaceContextService);

  private readonly members = signal<TeamMember[]>([
    {
      id: 'leader',
      team_id: 'current',
      user_id: 'leader@example.com',
      role: TeamRole.LEADER,
      joined_at: new Date().toISOString()
    },
    {
      id: 'member',
      team_id: 'current',
      user_id: 'member@example.com',
      role: TeamRole.MEMBER,
      joined_at: new Date().toISOString()
    }
  ]);

  readonly currentTeamId = computed(() =>
    this.workspaceContext.contextType() === ContextType.TEAM ? this.workspaceContext.contextId() : null
  );

  displayMembers = computed(() => {
    const teamId = this.currentTeamId();
    if (!teamId) {
      return this.members();
    }
    return this.members().map(member => ({ ...member, team_id: teamId }));
  });

  isTeamContext(): boolean {
    return this.workspaceContext.contextType() === ContextType.TEAM;
  }

  roleLabel(role: TeamRole): string {
    switch (role) {
      case TeamRole.LEADER:
        return '領導';
      case TeamRole.MEMBER:
      default:
        return '成員';
    }
  }

  roleColor(role: TeamRole): string {
    switch (role) {
      case TeamRole.LEADER:
        return 'purple';
      case TeamRole.MEMBER:
      default:
        return 'default';
    }
  }
}
