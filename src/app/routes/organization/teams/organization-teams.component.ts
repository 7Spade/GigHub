import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit, effect } from '@angular/core';
import { Router } from '@angular/router';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { ContextType, Team } from '@core';
import { SHARED_IMPORTS, WorkspaceContextService, TeamRepository, TeamMemberRepository, BreadcrumbService } from '@shared';
import { CreateTeamModalComponent } from '../../../shared/components/create-team-modal/create-team-modal.component';
import { EditTeamModalComponent } from '../../../shared/components/edit-team-modal/edit-team-modal.component';
import { TeamDetailDrawerComponent } from '../../../shared/components/team-detail-drawer/team-detail-drawer.component';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzDrawerService } from 'ng-zorro-antd/drawer';

@Component({
  selector: 'app-organization-teams',
  standalone: true,
  imports: [
    SHARED_IMPORTS,
    NzAlertModule,
    NzEmptyModule,
    NzTableModule,
    NzTagModule,
    NzDescriptionsModule,
    NzSpaceModule
  ],
  template: `
    <page-header [title]="'團隊管理'" [content]="headerContent"></page-header>
    
    <ng-template #headerContent>
      <div>瀏覽並管理組織內的團隊。</div>
    </ng-template>

    @if (!isOrganizationContext()) {
      <nz-alert
        nzType="info"
        nzShowIcon
        nzMessage="請先選擇組織"
        nzDescription="請從側邊欄選擇一個組織以查看團隊列表。"
        class="mb-md"
      />
    }

    <nz-card nzTitle="團隊列表" [nzExtra]="extraTemplate" [nzLoading]="loading()">
      <ng-template #extraTemplate>
        @if (isOrganizationContext()) {
          <nz-space>
            <button 
              *nzSpaceItem 
              nz-button 
              nzType="primary" 
              (click)="openCreateTeamModal()"
            >
              <span nz-icon nzType="plus"></span>
              建立團隊
            </button>
            <button 
              *nzSpaceItem 
              nz-button 
              nzType="default"
              (click)="refreshTeams()"
            >
              <span nz-icon nzType="reload"></span>
              重新整理
            </button>
          </nz-space>
        }
      </ng-template>
      
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
                    <button 
                      *nzSpaceItem 
                      nz-button 
                      nzType="link" 
                      nzSize="small" 
                      (click)="viewTeamDetails(team)"
                    >
                      <span nz-icon nzType="eye"></span>
                      查看
                    </button>
                    <button 
                      *nzSpaceItem 
                      nz-button 
                      nzType="link" 
                      nzSize="small" 
                      (click)="manageMembers(team)"
                    >
                      <span nz-icon nzType="user"></span>
                      管理成員
                    </button>
                    <button 
                      *nzSpaceItem 
                      nz-button 
                      nzType="link" 
                      nzSize="small" 
                      (click)="openEditTeamModal(team)"
                    >
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
export class OrganizationTeamsComponent implements OnInit {
  private readonly workspaceContext = inject(WorkspaceContextService);
  private readonly teamRepository = inject(TeamRepository);
  private readonly teamMemberRepository = inject(TeamMemberRepository);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly modal = inject(NzModalService);
  private readonly message = inject(NzMessageService);
  private readonly router = inject(Router);
  private readonly drawer = inject(NzDrawerService);

  private readonly teamsState = signal<Team[]>([]);
  private readonly memberCountsState = signal<Map<string, number>>(new Map());
  loading = signal(false);

  constructor() {
    // Auto-reload teams when organization context changes
    effect(() => {
      const orgId = this.currentOrgId();
      if (orgId) {
        this.loadTeams(orgId);
      }
    });
  }

  ngOnInit(): void {
    // Set breadcrumbs
    const orgName = this.workspaceContext.contextLabel();
    const orgId = this.currentOrgId();
    
    if (orgId) {
      this.breadcrumbService.setBreadcrumbs([
        { label: '首頁', url: '/', icon: 'home' },
        { label: orgName, url: null, icon: 'team' },
        { label: '團隊管理', url: null }
      ]);
    } else {
      this.breadcrumbService.setBreadcrumbs([
        { label: '首頁', url: '/', icon: 'home' },
        { label: '團隊管理', url: null }
      ]);
    }
    
    // Load teams when component initializes
    const orgId2 = this.currentOrgId();
    if (orgId2) {
      this.loadTeams(orgId2);
    }
  }

  private loadTeams(organizationId: string): void {
    this.loading.set(true);
    this.teamRepository.findByOrganization(organizationId).subscribe({
      next: (teams: Team[]) => {
        this.teamsState.set(teams);
        this.loading.set(false);
        console.log('[OrganizationTeamsComponent] ✅ Loaded teams:', teams.length);
        
        // Load member counts for all teams
        this.loadMemberCounts(teams);
      },
      error: (error: Error) => {
        console.error('[OrganizationTeamsComponent] ❌ Failed to load teams:', error);
        this.teamsState.set([]);
        this.loading.set(false);
      }
    });
  }

  private loadMemberCounts(teams: Team[]): void {
    if (teams.length === 0) {
      this.memberCountsState.set(new Map());
      return;
    }

    // Load member counts for all teams in parallel
    const memberCountObservables = teams.map(team =>
      this.teamMemberRepository.findByTeam(team.id).pipe(
        map(members => ({ teamId: team.id, count: members.length }))
      )
    );

    combineLatest(memberCountObservables).subscribe({
      next: (counts) => {
        const map = new Map<string, number>();
        counts.forEach(({ teamId, count }) => map.set(teamId, count));
        this.memberCountsState.set(map);
        console.log('[OrganizationTeamsComponent] ✅ Loaded member counts:', map.size);
      },
      error: (error) => {
        console.error('[OrganizationTeamsComponent] ❌ Failed to load member counts:', error);
        this.memberCountsState.set(new Map());
      }
    });
  }

  getMemberCount(teamId: string): number {
    return this.memberCountsState().get(teamId) || 0;
  }

  refreshTeams(): void {
    const orgId = this.currentOrgId();
    if (orgId) {
      this.message.info('正在重新整理...');
      this.loadTeams(orgId);
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
    return this.teamsState();
  });

  isOrganizationContext(): boolean {
    return this.workspaceContext.contextType() === ContextType.ORGANIZATION;
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
        // Team created successfully, reload list
        this.loadTeams(orgId);
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
        // Team updated successfully, reload list
        const orgId = this.currentOrgId();
        if (orgId) {
          this.loadTeams(orgId);
        }
      }
    });
  }

  async deleteTeam(team: Team): Promise<void> {
    try {
      await this.teamRepository.delete(team.id);
      this.message.success('團隊已刪除');
      
      const orgId = this.currentOrgId();
      if (orgId) {
        this.loadTeams(orgId);
      }
    } catch (error) {
      console.error('[OrganizationTeamsComponent] ❌ Failed to delete team:', error);
      this.message.error('刪除團隊失敗');
    }
  }

  manageMembers(team: Team): void {
    // Switch to team context and navigate to members page
    this.workspaceContext.switchToTeam(team.id);
    this.router.navigate(['/team/members']);
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
      nzWidth: 520,
      nzClosable: true
    });

    drawerRef.afterClose.subscribe((result) => {
      if (result?.deleted || result) {
        // Reload teams if team was modified or deleted
        if (orgId) {
          this.loadTeams(orgId);
        }
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
