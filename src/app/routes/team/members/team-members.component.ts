import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ContextType, TeamMember, TeamRole } from '@core';
import { SHARED_IMPORTS, WorkspaceContextService, TeamMemberRepository, createAsyncArrayState } from '@shared';
import { HeaderContextSwitcherComponent } from '../../../layout/basic/widgets/context-switcher.component';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { ModalHelper } from '@delon/theme';
import { NzMessageService } from 'ng-zorro-antd/message';

/**
 * Team Members Component
 * 團隊成員元件 - 管理團隊成員
 *
 * ✅ Modernized with:
 * - AsyncState for state management
 * - TeamMemberModalComponent (no DOM manipulation)
 * - Unified loading/error handling
 */
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

    <nz-card nzTitle="成員列表" [nzExtra]="extraTemplate" [nzLoading]="membersState.loading()">
      <ng-template #extraTemplate>
        @if (isTeamContext()) {
          <button nz-button nzType="primary" nzSize="small" (click)="openAddMemberModal()">
            <span nz-icon nzType="plus"></span>
            添加成員
          </button>
        }
      </ng-template>
      
      @if (membersState.error()) {
        <nz-alert
          nzType="error"
          nzShowIcon
          [nzMessage]="'載入失敗'"
          [nzDescription]="membersState.error()?.message || '無法載入成員列表'"
          class="mb-md"
        />
      }
      
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
  private readonly modal = inject(ModalHelper);
  private readonly message = inject(NzMessageService);

  // Expose TeamRole for template
  readonly TeamRole = TeamRole;

  // ✅ Modern Pattern: Use AsyncState
  readonly membersState = createAsyncArrayState<TeamMember>([]);

  ngOnInit(): void {
    const teamId = this.currentTeamId();
    if (teamId) {
      this.loadMembers(teamId);
    }
  }

  /**
   * Load members
   * ✅ Using AsyncState for automatic state management
   */
  private async loadMembers(teamId: string): Promise<void> {
    try {
      await this.membersState.load(
        firstValueFrom(this.memberRepository.findByTeam(teamId))
      );
      console.log('[TeamMembersComponent] ✅ Loaded members:', this.membersState.length());
    } catch (error) {
      console.error('[TeamMembersComponent] ❌ Failed to load members:', error);
    }
  }

  readonly currentTeamId = computed(() =>
    this.workspaceContext.contextType() === ContextType.TEAM ? this.workspaceContext.contextId() : null
  );

  readonly displayMembers = computed(() => this.membersState.data() || []);

  isTeamContext(): boolean {
    return this.workspaceContext.contextType() === ContextType.TEAM;
  }

  /**
   * Open add member modal
   * ✅ Using Modal Component (no DOM manipulation)
   */
  async openAddMemberModal(): Promise<void> {
    const { TeamMemberModalComponent } = await import('./team-member-modal.component');
    
    this.modal
      .createStatic(TeamMemberModalComponent, {}, { size: 'md' })
      .subscribe(async (component) => {
        if (component && component.isValid()) {
          const data = component.getData();
          await this.addMember(data);
        }
      });
  }

  /**
   * Add member to team
   */
  private async addMember(data: { userId: string; role: TeamRole }): Promise<void> {
    const teamId = this.currentTeamId();
    if (!teamId) {
      this.message.error('無法獲取團隊 ID');
      return;
    }

    try {
      await this.memberRepository.addMember(teamId, {
        user_id: data.userId,
        role: data.role
      });
      this.message.success('成員已添加');
      await this.loadMembers(teamId);
    } catch (error) {
      console.error('[TeamMembersComponent] ❌ Failed to add member:', error);
      this.message.error('添加成員失敗');
    }
  }

  /**
   * Remove member from team
   */
  async removeMember(member: TeamMember): Promise<void> {
    const teamId = this.currentTeamId();
    if (!teamId) {
      this.message.error('無法獲取團隊 ID');
      return;
    }

    try {
      await this.memberRepository.removeMember(teamId, member.id);
      this.message.success('成員已移除');
      await this.loadMembers(teamId);
    } catch (error) {
      console.error('[TeamMembersComponent] ❌ Failed to remove member:', error);
      this.message.error('移除成員失敗');
    }
  }

  roleLabel(role: TeamRole): string {
    switch (role) {
      case TeamRole.LEADER:
        return '組長';
      case TeamRole.ADMIN:
        return '管理員';
      case TeamRole.MEMBER:
      default:
        return '成員';
    }
  }

  roleColor(role: TeamRole): string {
    switch (role) {
      case TeamRole.LEADER:
        return 'gold';
      case TeamRole.ADMIN:
        return 'blue';
      case TeamRole.MEMBER:
      default:
        return 'default';
    }
  }
}
