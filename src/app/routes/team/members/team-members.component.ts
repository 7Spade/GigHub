import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { ContextType, TeamMember, TeamRole } from '@core';
import { SHARED_IMPORTS, WorkspaceContextService, TeamMemberRepository } from '@shared';
import { HeaderContextSwitcherComponent } from '../../../layout/basic/widgets/context-switcher.component';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-team-members',
  standalone: true,
  imports: [SHARED_IMPORTS, NzMenuModule, NzAlertModule, NzEmptyModule, HeaderContextSwitcherComponent],
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
            <span nz-icon nzType="plus"></span>
            添加成員
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
                  @if (member.role !== TeamRole.LEADER) {
                    <a nz-popconfirm nzPopconfirmTitle="確定移除此成員？" (nzOnConfirm)="removeMember(member)">移除</a>
                  }
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
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeamMembersComponent implements OnInit {
  private readonly workspaceContext = inject(WorkspaceContextService);
  private readonly memberRepository = inject(TeamMemberRepository);
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
    this.modal.create({
      nzTitle: '添加團隊成員',
      nzContent: `
        <form nz-form>
          <nz-form-item>
            <nz-form-label nzRequired>用戶 ID/Email</nz-form-label>
            <nz-form-control>
              <input nz-input id="userId" placeholder="請輸入用戶 ID 或 Email" />
            </nz-form-control>
          </nz-form-item>
          <nz-form-item>
            <nz-form-label>角色</nz-form-label>
            <nz-form-control>
              <nz-select id="role" nzPlaceHolder="選擇角色" style="width: 100%">
                <nz-option nzValue="${TeamRole.MEMBER}" nzLabel="成員"></nz-option>
                <nz-option nzValue="${TeamRole.LEADER}" nzLabel="領導"></nz-option>
              </nz-select>
            </nz-form-control>
          </nz-form-item>
        </form>
      `,
      nzOnOk: async () => {
        const userId = (document.getElementById('userId') as HTMLInputElement)?.value;
        const role = (document.getElementById('role') as HTMLSelectElement)?.value || TeamRole.MEMBER;
        
        if (!userId || userId.trim() === '') {
          this.message.error('請輸入用戶 ID');
          return false;
        }

        const teamId = this.currentTeamId();
        if (!teamId) {
          this.message.error('無法獲取團隊 ID');
          return false;
        }

        try {
          await this.memberRepository.addMember(teamId, userId.trim(), role as TeamRole);
          this.message.success('成員已添加');
          this.loadMembers(teamId);
          return true;
        } catch (error) {
          console.error('[TeamMembersComponent] ❌ Failed to add member:', error);
          this.message.error('添加成員失敗');
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
