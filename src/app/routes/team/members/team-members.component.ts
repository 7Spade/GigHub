import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit, effect } from '@angular/core';
import { ContextType, TeamMember, TeamRole, OrganizationMember } from '@core';
import { SHARED_IMPORTS, WorkspaceContextService, TeamMemberRepository, OrganizationMemberRepository, BreadcrumbService } from '@shared';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-team-members',
  standalone: true,
  imports: [SHARED_IMPORTS, NzAlertModule, NzEmptyModule, NzSelectModule, NzSpaceModule, FormsModule],
  template: `
    <page-header [title]="'團隊成員'" [content]="headerContent"></page-header>
    
    <ng-template #headerContent>
      <div>檢視並管理目前團隊的成員。</div>
    </ng-template>

    @if (!isTeamContext()) {
      <nz-alert
        nzType="info"
        nzShowIcon
        nzMessage="請先選擇團隊"
        nzDescription="請從側邊欄選擇一個團隊以管理成員。"
        class="mb-md"
      />
    }

    <nz-card nzTitle="成員列表" [nzExtra]="extraTemplate" [nzLoading]="loading()">
      <ng-template #extraTemplate>
        @if (isTeamContext()) {
          <nz-space>
            <button 
              *nzSpaceItem 
              nz-button 
              nzType="primary" 
              (click)="openAddMemberModal()"
            >
              <span nz-icon nzType="user-add"></span>
              新增成員
            </button>
            <button 
              *nzSpaceItem 
              nz-button 
              nzType="default"
              (click)="refreshMembers()"
            >
              <span nz-icon nzType="reload"></span>
              重新整理
            </button>
          </nz-space>
        }
      </ng-template>
      
      @if (displayMembers().length > 0) {
        <nz-table #table [nzData]="displayMembers()">
          <thead>
            <tr>
              <th nzWidth="200px">成員 ID</th>
              <th nzWidth="140px">角色</th>
              <th nzWidth="200px">加入時間</th>
              <th nzWidth="200px">操作</th>
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
                  <nz-space>
                    <button 
                      *nzSpaceItem 
                      nz-button 
                      nzType="link" 
                      nzSize="small" 
                      (click)="changeRole(member)"
                    >
                      <span nz-icon nzType="swap"></span>
                      變更角色
                    </button>
                    <button 
                      *nzSpaceItem 
                      nz-button 
                      nzType="link" 
                      nzSize="small" 
                      nzDanger
                      nz-popconfirm 
                      nzPopconfirmTitle="確定移除此成員？" 
                      (nzOnConfirm)="removeMember(member)"
                    >
                      <span nz-icon nzType="user-delete"></span>
                      移除
                    </button>
                  </nz-space>
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
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly modal = inject(NzModalService);
  private readonly message = inject(NzMessageService);

  private readonly members = signal<TeamMember[]>([]);
  loading = signal(false);
  
  // Add TeamRole to template
  readonly TeamRole = TeamRole;

  constructor() {
    // Auto-reload members when team context changes
    effect(() => {
      const teamId = this.currentTeamId();
      if (teamId) {
        this.loadMembers(teamId);
      }
    });
  }

  ngOnInit(): void {
    // Set breadcrumbs
    const teamName = this.workspaceContext.contextLabel();
    const orgName = this.getOrganizationName();
    const teamId = this.currentTeamId();
    
    if (teamId) {
      this.breadcrumbService.setBreadcrumbs([
        { label: '首頁', url: '/', icon: 'home' },
        { label: orgName, url: null, icon: 'team' },
        { label: teamName, url: null, icon: 'usergroup-add' },
        { label: '成員管理', url: null }
      ]);
    } else {
      this.breadcrumbService.setBreadcrumbs([
        { label: '首頁', url: '/', icon: 'home' },
        { label: '成員管理', url: null }
      ]);
    }
    
    // Load members when component initializes
    const teamId2 = this.currentTeamId();
    if (teamId2) {
      this.loadMembers(teamId2);
    }
  }
  
  private getOrganizationName(): string {
    const teams = this.workspaceContext.teams();
    const currentTeam = teams.find(t => t.id === this.currentTeamId());
    if (currentTeam) {
      const orgs = this.workspaceContext.organizations();
      const org = orgs.find(o => o.id === currentTeam.organization_id);
      return org?.name || '組織';
    }
    return '組織';
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

  refreshMembers(): void {
    const teamId = this.currentTeamId();
    if (teamId) {
      this.message.info('正在重新整理...');
      this.loadMembers(teamId);
    }
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

        this.showAddMemberModal(teamId, availableMembers);
      },
      error: (error: Error) => {
        this.loading.set(false);
        console.error('[TeamMembersComponent] ❌ Failed to load org members:', error);
        this.message.error('載入組織成員失敗');
      }
    });
  }

  private showAddMemberModal(teamId: string, availableMembers: OrganizationMember[]): void {
    // Import modal component dynamically
    import('./team-member-modal.component').then(({ TeamMemberModalComponent }) => {
      const modalRef = this.modal.create({
        nzTitle: '新增團隊成員',
        nzContent: TeamMemberModalComponent,
        nzData: { availableMembers },
        nzWidth: 600,
        nzFooter: null,
        nzMaskClosable: false
      });

      // Handle modal result
      modalRef.afterClose.subscribe(async (result) => {
        if (result) {
          try {
            await this.memberRepository.addMember(teamId, result.userId, result.role);
            this.message.success('成員已加入團隊');
            this.loadMembers(teamId);
          } catch (error) {
            console.error('[TeamMembersComponent] ❌ Failed to add member:', error);
            this.message.error('新增成員失敗');
          }
        }
      });
    });
  }

  changeRole(member: TeamMember): void {
    const teamId = this.currentTeamId();
    if (!teamId) return;

    // Create a simple role change modal
    const currentRole = member.role;
    const availableRoles = Object.values(TeamRole).filter(role => role !== currentRole);
    
    const modalRef = this.modal.create({
      nzTitle: '變更成員角色',
      nzContent: `
        <div>
          <p>當前角色：<strong>${this.roleLabel(currentRole)}</strong></p>
          <div class="mb-md">
            <label class="d-block mb-sm"><strong>選擇新角色</strong></label>
            <nz-radio-group id="roleSelector" style="display: flex; flex-direction: column; gap: 12px;">
              ${availableRoles.map(role => `
                <label nz-radio nzValue="${role}" style="display: flex; align-items: center; padding: 8px; border: 1px solid #d9d9d9; border-radius: 4px;">
                  <input type="radio" name="role" value="${role}" />
                  <span style="margin-left: 8px;">
                    <strong>${this.roleLabel(role)}</strong>
                    <span style="display: block; font-size: 12px; color: rgba(0,0,0,0.45);">
                      ${role === TeamRole.LEADER ? '可管理團隊成員和設定' : '可檢視和執行團隊任務'}
                    </span>
                  </span>
                </label>
              `).join('')}
            </nz-radio-group>
          </div>
        </div>
      `,
      nzOnOk: async () => {
        const selectedInput = document.querySelector('input[name="role"]:checked') as HTMLInputElement;
        const newRole = selectedInput?.value as TeamRole;

        if (!newRole) {
          this.message.error('請選擇角色');
          return false;
        }

        try {
          // Remove and re-add with new role (simple approach)
          await this.memberRepository.removeMember(member.id);
          await this.memberRepository.addMember(teamId, member.user_id, newRole);
          this.message.success('角色已變更');
          this.loadMembers(teamId);
          return true;
        } catch (error) {
          console.error('[TeamMembersComponent] ❌ Failed to change role:', error);
          this.message.error('變更角色失敗');
          return false;
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
