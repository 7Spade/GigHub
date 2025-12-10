import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  OnInit,
  effect
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NZ_DRAWER_DATA, NzDrawerRef } from 'ng-zorro-antd/drawer';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { Team, TeamMember, TeamRole, OrganizationMember } from '@core';
import { SHARED_IMPORTS, TeamMemberRepository, OrganizationMemberRepository, TeamRepository, WorkspaceContextService } from '@shared';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { EditTeamModalComponent } from '../edit-team-modal/edit-team-modal.component';

interface DrawerData {
  team: Team;
  organizationId: string;
}

@Component({
  selector: 'app-team-detail-drawer',
  standalone: true,
  imports: [
    SHARED_IMPORTS,
    FormsModule,
    NzDescriptionsModule,
    NzTagModule,
    NzSelectModule,
    NzSpaceModule,
    NzDividerModule,
    NzListModule,
    NzEmptyModule,
    NzAlertModule
  ],
  templateUrl: './team-detail-drawer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeamDetailDrawerComponent implements OnInit {
  private readonly drawerRef = inject(NzDrawerRef);
  private readonly drawerData = inject<DrawerData>(NZ_DRAWER_DATA);
  private readonly teamMemberRepository = inject(TeamMemberRepository);
  private readonly orgMemberRepository = inject(OrganizationMemberRepository);
  private readonly teamRepository = inject(TeamRepository);
  private readonly workspaceContext = inject(WorkspaceContextService);
  private readonly message = inject(NzMessageService);
  private readonly modal = inject(NzModalService);
  private readonly router = inject(Router);

  // State
  readonly team = signal<Team>(this.drawerData.team);
  readonly organizationId = this.drawerData.organizationId;
  private readonly membersState = signal<TeamMember[]>([]);
  readonly members = computed(() => this.membersState());
  private readonly orgMembersState = signal<OrganizationMember[]>([]);
  readonly availableOrgMembers = computed(() => {
    const currentMemberIds = new Set(this.members().map(m => m.user_id));
    return this.orgMembersState().filter(om => !currentMemberIds.has(om.user_id));
  });
  readonly loading = signal(false);
  readonly addingMember = signal(false);
  
  // Add member form
  selectedUserId = signal<string | null>(null);
  selectedRole = signal<TeamRole>(TeamRole.MEMBER);

  ngOnInit(): void {
    this.loadMembers();
    this.loadOrganizationMembers();
  }

  private async loadMembers(): Promise<void> {
    try {
      this.loading.set(true);
      const members = await this.teamMemberRepository.findByTeam(this.team().id).toPromise();
      this.membersState.set(members || []);
    } catch (error) {
      console.error('Error loading team members:', error);
      this.message.error('載入團隊成員失敗');
    } finally {
      this.loading.set(false);
    }
  }

  private async loadOrganizationMembers(): Promise<void> {
    try {
      const orgMembers = await this.orgMemberRepository.findByOrganization(this.organizationId).toPromise();
      this.orgMembersState.set(orgMembers || []);
    } catch (error) {
      console.error('Error loading organization members:', error);
      this.message.error('載入組織成員失敗');
    }
  }

  async addMember(): Promise<void> {
    const userId = this.selectedUserId();
    if (!userId) {
      this.message.warning('請選擇要新增的成員');
      return;
    }

    try {
      this.addingMember.set(true);
      await this.teamMemberRepository.addMember(this.team().id, userId, this.selectedRole());
      this.message.success('成員已加入團隊');
      
      // Reset form
      this.selectedUserId.set(null);
      this.selectedRole.set(TeamRole.MEMBER);
      
      // Reload members
      await this.loadMembers();
      await this.loadOrganizationMembers();
    } catch (error) {
      console.error('Error adding team member:', error);
      this.message.error('新增成員失敗');
    } finally {
      this.addingMember.set(false);
    }
  }

  async changeRole(member: TeamMember): Promise<void> {
    const newRole = member.role === TeamRole.LEADER ? TeamRole.MEMBER : TeamRole.LEADER;
    
    this.modal.confirm({
      nzTitle: '確認變更角色',
      nzContent: `是否將 ${member.user_id} 的角色從 ${this.roleLabel(member.role)} 變更為 ${this.roleLabel(newRole)}？`,
      nzOnOk: async () => {
        try {
          await this.teamMemberRepository.removeMember(member.id);
          await this.teamMemberRepository.addMember(this.team().id, member.user_id, newRole);
          this.message.success('角色已變更');
          await this.loadMembers();
        } catch (error) {
          console.error('Error changing role:', error);
          this.message.error('變更角色失敗');
        }
      }
    });
  }

  async removeMember(member: TeamMember): Promise<void> {
    this.modal.confirm({
      nzTitle: '確認移除成員',
      nzContent: `確定要將 ${member.user_id} 從團隊中移除嗎？`,
      nzOkDanger: true,
      nzOnOk: async () => {
        try {
          await this.teamMemberRepository.removeMember(member.id);
          this.message.success('成員已移除');
          await this.loadMembers();
          await this.loadOrganizationMembers();
        } catch (error) {
          console.error('Error removing member:', error);
          this.message.error('移除成員失敗');
        }
      }
    });
  }

  openEditModal(): void {
    const modalRef = this.modal.create({
      nzTitle: '編輯團隊',
      nzContent: EditTeamModalComponent,
      nzData: { team: this.team() },
      nzFooter: null,
      nzWidth: 600
    });

    modalRef.afterClose.subscribe(async (result) => {
      if (result) {
        // Reload team data
        try {
          const updatedTeam = await this.teamRepository.findById(this.team().id).toPromise();
          if (updatedTeam) {
            this.team.set(updatedTeam);
          }
        } catch (error) {
          console.error('Error reloading team:', error);
        }
      }
    });
  }

  async deleteTeam(): Promise<void> {
    this.modal.confirm({
      nzTitle: '確認刪除團隊',
      nzContent: `確定要刪除 "${this.team().name}" 嗎？此操作無法復原。`,
      nzOkDanger: true,
      nzOnOk: async () => {
        try {
          await this.teamRepository.delete(this.team().id);
          this.message.success('團隊已刪除');
          this.drawerRef.close({ deleted: true });
        } catch (error) {
          console.error('Error deleting team:', error);
          this.message.error('刪除團隊失敗');
        }
      }
    });
  }

  manageMembers(): void {
    // Switch to team context and navigate to members page
    this.workspaceContext.switchToTeam(this.team().id);
    this.router.navigate(['/team/members']);
    this.drawerRef.close();
  }

  roleLabel(role: TeamRole): string {
    return role === TeamRole.LEADER ? '領導' : '成員';
  }

  roleColor(role: TeamRole): string {
    return role === TeamRole.LEADER ? 'orange' : 'blue';
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('zh-TW');
  }

  close(): void {
    this.drawerRef.close();
  }
}
