import { ChangeDetectionStrategy, Component, computed, inject, OnInit, effect, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ContextType, Team, TeamStore } from '@core';
import { SHARED_IMPORTS, WorkspaceContextService } from '@shared';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { CreateTeamModalComponent } from '../../../shared/components/create-team-modal/create-team-modal.component';
import { EditTeamModalComponent } from '../../../shared/components/edit-team-modal/edit-team-modal.component';
import { TeamDetailDrawerComponent } from '../../../shared/components/team-detail-drawer/team-detail-drawer.component';

@Component({
  selector: 'app-organization-teams',
  standalone: true,
  imports: [SHARED_IMPORTS, NzAlertModule, NzEmptyModule, NzTableModule, NzTagModule, NzSpaceModule, NzModalModule],
  template: `
    <nz-modal [nzOpen]="visible()" nzTitle="團隊管理" [nzFooter]="null" nzWidth="1100px" nzMaskClosable="false" (nzOnCancel)="closeModal()">
      <div class="mb-sm">瀏覽並管理組織內的團隊。</div>

      @if (!isOrganizationContext()) {
        <nz-alert nzType="info" nzShowIcon nzMessage="請先選擇組織" nzDescription="請從側邊欄選擇一個組織以查看團隊列表。" class="mb-md" />
      }

      <div class="mb-md">
        @if (isOrganizationContext()) {
          <nz-space>
            <button *nzSpaceItem nz-button nzType="primary" (click)="openCreateTeamModal()">
              <span nz-icon nzType="plus"></span>
              建立團隊
            </button>
            <button *nzSpaceItem nz-button nzType="default" (click)="refreshTeams()">
              <span nz-icon nzType="reload"></span>
              重新整理
            </button>
          </nz-space>
        }
      </div>

      @if (teams().length > 0) {
        <nz-table #table [nzData]="teams()" [nzShowPagination]="false">
          <thead>
            <tr>
              <th nzWidth="250px">團隊名稱</th>
              <th>描述</th>
              <th nzWidth="180px">建立時間</th>
              <th nzWidth="320px">操作</th>
            </tr>
          </thead>
          <tbody>
            @for (team of table.data; track team.id) {
              <tr>
                <td>
                  <strong>{{ team.name }}</strong>
                  <nz-tag class="ml-sm" nzColor="blue">
                    <span nz-icon nzType="user"></span>
                    {{ getMemberCount(team.id) }} 名成員
                  </nz-tag>
                </td>
                <td>{{ team.description || '尚無描述' }}</td>
                <td>{{ formatDate(team.created_at) }}</td>
                <td>
                  <nz-space>
                    <button *nzSpaceItem nz-button nzType="link" nzSize="small" (click)="viewTeamDetails(team)">
                      <span nz-icon nzType="eye"></span>
                      查看
                    </button>
                    <button *nzSpaceItem nz-button nzType="link" nzSize="small" (click)="manageMembers(team)">
                      <span nz-icon nzType="user"></span>
                      管理成員
                    </button>
                    <button *nzSpaceItem nz-button nzType="link" nzSize="small" (click)="openEditTeamModal(team)">
                      <span nz-icon nzType="edit"></span>
                      編輯
                    </button>
                    <button
                      *nzSpaceItem
                      nz-button
                      nzType="link"
                      nzSize="small"
                      nzDanger
                      nz-popconfirm
                      nzPopconfirmTitle="確定刪除此團隊？此操作無法復原。"
                      (nzOnConfirm)="deleteTeam(team)"
                    >
                      <span nz-icon nzType="delete"></span>
                      刪除
                    </button>
                  </nz-space>
                </td>
              </tr>
            }
          </tbody>
        </nz-table>
      } @else {
        <nz-empty nzNotFoundContent="暫無團隊，請點擊上方按鈕建立團隊"></nz-empty>
      }
    </nz-modal>
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
export class OrganizationTeamsComponent implements OnInit {
  readonly workspaceContext = inject(WorkspaceContextService);
  readonly teamStore = inject(TeamStore);
  readonly visible = signal(true);
  private readonly modal = inject(NzModalService);
  private readonly message = inject(NzMessageService);
  private readonly router = inject(Router);
  private readonly drawer = inject(NzDrawerService);
  private readonly closeTargetUrl = ['/organization/members'];

  constructor() {
    // Auto-reload teams when organization context changes
    effect(() => {
      const orgId = this.currentOrgId();
      if (orgId) {
        this.teamStore.loadTeams(orgId);
      }
    });
  }

  ngOnInit(): void {
    // Load teams when component initializes
    const orgId = this.currentOrgId();
    if (orgId) {
      this.teamStore.loadTeams(orgId);
    }
  }

  getMemberCount(teamId: string): number {
    return this.teamStore.getMemberCount(teamId);
  }

  refreshTeams(): void {
    const orgId = this.currentOrgId();
    if (orgId) {
      this.message.info('正在重新整理...');
      this.teamStore.loadTeams(orgId);
    }
  }

  readonly currentOrgId = computed(() =>
    this.workspaceContext.contextType() === ContextType.ORGANIZATION ? this.workspaceContext.contextId() : null
  );

  readonly teams = computed<Team[]>(() => {
    const orgId = this.currentOrgId();
    if (!orgId) {
      return [];
    }
    return this.teamStore.teams();
  });

  readonly loading = this.teamStore.loading;

  isOrganizationContext(): boolean {
    return this.workspaceContext.contextType() === ContextType.ORGANIZATION;
  }

  closeModal(): void {
    this.visible.set(false);
    this.router.navigate(this.closeTargetUrl, { replaceUrl: true });
  }

  openCreateTeamModal(): void {
    const orgId = this.currentOrgId();
    if (!orgId) {
      this.message.error('無法獲取組織 ID');
      return;
    }

    const modalRef = this.modal.create({
      nzTitle: '建立團隊',
      nzContent: CreateTeamModalComponent,
      nzData: {
        organizationId: orgId
      },
      nzFooter: null,
      nzWidth: 520
    });

    modalRef.afterClose.subscribe((result: Team | undefined) => {
      if (result) {
        // Team created successfully - reload workspace context
        this.workspaceContext.reloadData();
      }
    });
  }

  openEditTeamModal(team: Team): void {
    const modalRef = this.modal.create({
      nzTitle: '編輯團隊',
      nzContent: EditTeamModalComponent,
      nzData: {
        team: team
      },
      nzFooter: null,
      nzWidth: 520
    });

    modalRef.afterClose.subscribe((success: boolean | undefined) => {
      if (success) {
        // Team updated successfully - store automatically updated
        // No need to reload, TeamStore maintains state
      }
    });
  }

  async deleteTeam(team: Team): Promise<void> {
    try {
      await this.teamStore.deleteTeam(team.id);
      this.message.success('團隊已刪除');
    } catch (error) {
      console.error('[OrganizationTeamsComponent] ❌ Failed to delete team:', error);
      this.message.error('刪除團隊失敗');
    }
  }

  manageMembers(team: Team): void {
    // Navigate to team members page with team context
    // Use URL parameters to pass team ID instead of relying on workspace context
    this.router.navigate(['/team/members'], {
      queryParams: { teamId: team.id }
    });
  }

  viewTeamDetails(team: Team): void {
    const orgId = this.currentOrgId();
    if (!orgId) {
      this.message.error('無法獲取組織 ID');
      return;
    }

    const drawerRef = this.drawer.create({
      nzTitle: '團隊詳情',
      nzContent: TeamDetailDrawerComponent,
      nzData: {
        team: team,
        organizationId: orgId
      },
      nzWidth: 720,
      nzClosable: true
    });

    drawerRef.afterClose.subscribe(result => {
      if (result?.deleted || result) {
        // Team modified or deleted - store automatically updated
        // No need to reload, TeamStore maintains state
      }
    });
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return '-';
    }
  }
}
