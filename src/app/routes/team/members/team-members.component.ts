import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { ContextType, TeamMember, TeamRole, OrganizationMember } from '@core';
import { SHARED_IMPORTS, WorkspaceContextService, TeamMemberRepository, OrganizationMemberRepository } from '@shared';
import { HeaderContextSwitcherComponent } from '../../../layout/basic/widgets/context-switcher.component';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-team-members',
  standalone: true,
  imports: [SHARED_IMPORTS, NzMenuModule, NzAlertModule, NzEmptyModule, NzSelectModule, FormsModule, HeaderContextSwitcherComponent],
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

    <nz-card nzTitle="成員列表" [nzExtra]="extraTemplate" [nzLoading]="loading()">
      <ng-template #extraTemplate>
        @if (isTeamContext()) {
          <button nz-button nzType="primary" nzSize="small" (click)="openAddMemberModal()">
            <span nz-icon nzType="user-add"></span>
            新增成員
          </button>
        }
      </ng-template>
      
      @if (displayMembers().length > 0) {
        <nz-table #table [nzData]="displayMembers()">
          <thead>
            <tr>
              <th nzWidth="200px">成員 ID</th>
              <th nzWidth="140px">角色</th>
              <th nzWidth="200px">加入時間</th>
              <th nzWidth="120px">操作</th>
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
                <td>
                  <a (click)="changeRole(member)" class="mr-sm">變更角色</a>
                  <a nz-popconfirm nzPopconfirmTitle="確定移除此成員？" (nzOnConfirm)="removeMember(member)">移除</a>
                </td>
              </tr>
            }
          </tbody>
        </nz-table>
      } @else {
        <nz-empty nzNotFoundContent="暫無成員"></nz-empty>
      }
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
      .mr-sm {
        margin-right: 8px;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeamMembersComponent implements OnInit {
  private readonly workspaceContext = inject(WorkspaceContextService);
  private readonly memberRepository = inject(TeamMemberRepository);
  private readonly orgMemberRepository = inject(OrganizationMemberRepository);
  private readonly modal = inject(NzModalService);
  private readonly message = inject(NzMessageService);

  private readonly members = signal<TeamMember[]>([]);
  loading = signal(false);
  
  // Add TeamRole to template
  readonly TeamRole = TeamRole;

  ngOnInit(): void {
    // Load members when component initializes
    const teamId = this.currentTeamId();
    if (teamId) {
      this.loadMembers(teamId);
    }
  }

  private loadMembers(teamId: string): void {
    this.loading.set(true);
    this.memberRepository.findByTeam(teamId).subscribe({
      next: (members: TeamMember[]) => {
        this.members.set(members);
        this.loading.set(false);
        console.log('[TeamMembersComponent] ✅ Loaded members:', members.length);
      },
      error: (error: Error) => {
        console.error('[TeamMembersComponent] ❌ Failed to load members:', error);
        this.members.set([]);
        this.loading.set(false);
      }
    });
  }

  readonly currentTeamId = computed(() =>
    this.workspaceContext.contextType() === ContextType.TEAM ? this.workspaceContext.contextId() : null
  );

  displayMembers = computed(() => {
    const teamId = this.currentTeamId();
    if (!teamId) {
      return [];
    }
    return this.members();
  });

  isTeamContext(): boolean {
    return this.workspaceContext.contextType() === ContextType.TEAM;
  }

  openAddMemberModal(): void {
    const teamId = this.currentTeamId();
    if (!teamId) {
      this.message.error('無法獲取團隊 ID');
      return;
    }

    // Get current team to find organization
    const currentTeam = this.workspaceContext.teams().find(t => t.id === teamId);
    if (!currentTeam) {
      this.message.error('找不到團隊資訊');
      return;
    }

    // Load organization members
    this.loading.set(true);
    this.orgMemberRepository.findByOrganization(currentTeam.organization_id).subscribe({
      next: (orgMembers: OrganizationMember[]) => {
        this.loading.set(false);
        
        // Filter out members already in team
        const currentMemberIds = this.members().map(m => m.user_id);
        const availableMembers = orgMembers.filter(om => !currentMemberIds.includes(om.user_id));

        if (availableMembers.length === 0) {
          this.message.warning('所有組織成員都已加入此團隊');
          return;
        }

        this.showAddMemberDialog(teamId, availableMembers);
      },
      error: (error: Error) => {
        this.loading.set(false);
        console.error('[TeamMembersComponent] ❌ Failed to load org members:', error);
        this.message.error('載入組織成員失敗');
      }
    });
  }

  private showAddMemberDialog(teamId: string, availableMembers: OrganizationMember[]): void {
    let selectedUserId = '';
    let selectedRole: TeamRole = TeamRole.MEMBER;

    const modalRef = this.modal.create({
      nzTitle: '新增團隊成員',
      nzContent: `
        <div>
          <div class="mb-md">
            <label class="d-block mb-sm"><strong>選擇成員</strong></label>
            <select id="selectMember" class="ant-input" style="width: 100%; padding: 4px 11px; border: 1px solid #d9d9d9; border-radius: 2px;">
              <option value="">請選擇要加入的成員</option>
              ${availableMembers.map(m => `<option value="${m.user_id}">${m.user_id}</option>`).join('')}
            </select>
          </div>
          <div class="mb-md">
            <label class="d-block mb-sm"><strong>角色</strong></label>
            <select id="selectRole" class="ant-input" style="width: 100%; padding: 4px 11px; border: 1px solid #d9d9d9; border-radius: 2px;">
              <option value="${TeamRole.MEMBER}">團隊成員</option>
              <option value="${TeamRole.LEADER}">團隊領導</option>
            </select>
          </div>
        </div>
      `,
      nzOnOk: async () => {
        selectedUserId = (document.getElementById('selectMember') as HTMLSelectElement)?.value || '';
        selectedRole = (document.getElementById('selectRole') as HTMLSelectElement)?.value as TeamRole || TeamRole.MEMBER;

        if (!selectedUserId) {
          this.message.error('請選擇成員');
          return false;
        }

        try {
          await this.memberRepository.addMember(teamId, selectedUserId, selectedRole);
          this.message.success('成員已加入團隊');
          this.loadMembers(teamId);
          return true;
        } catch (error) {
          console.error('[TeamMembersComponent] ❌ Failed to add member:', error);
          this.message.error('新增成員失敗');
          return false;
        }
      }
    });
  }

  changeRole(member: TeamMember): void {
    const newRole = member.role === TeamRole.LEADER ? TeamRole.MEMBER : TeamRole.LEADER;
    const roleLabel = newRole === TeamRole.LEADER ? '團隊領導' : '團隊成員';

    this.modal.confirm({
      nzTitle: '變更成員角色',
      nzContent: `確定將此成員角色變更為「${roleLabel}」？`,
      nzOnOk: async () => {
        const teamId = this.currentTeamId();
        if (!teamId) return;

        try {
          // Remove and re-add with new role (simple approach)
          await this.memberRepository.removeMember(member.id);
          await this.memberRepository.addMember(teamId, member.user_id, newRole);
          this.message.success('角色已變更');
          this.loadMembers(teamId);
        } catch (error) {
          console.error('[TeamMembersComponent] ❌ Failed to change role:', error);
          this.message.error('變更角色失敗');
        }
      }
    });
  }

  async removeMember(member: TeamMember): Promise<void> {
    try {
      await this.memberRepository.removeMember(member.id);
      this.message.success('成員已移除');
      
      const teamId = this.currentTeamId();
      if (teamId) {
        this.loadMembers(teamId);
      }
    } catch (error) {
      console.error('[TeamMembersComponent] ❌ Failed to remove member:', error);
      this.message.error('移除成員失敗');
    }
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
