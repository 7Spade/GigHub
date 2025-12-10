import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit, effect } from '@angular/core';
import { Router } from '@angular/router';
import { ContextType, Team } from '@core';
import { SHARED_IMPORTS, WorkspaceContextService, TeamRepository } from '@shared';
import { HeaderContextSwitcherComponent } from '../../../layout/basic/widgets/context-switcher.component';
import { CreateTeamModalComponent } from '../../../shared/components/create-team-modal/create-team-modal.component';
import { EditTeamModalComponent } from '../../../shared/components/edit-team-modal/edit-team-modal.component';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';

@Component({
  selector: 'app-organization-teams',
  standalone: true,
  imports: [
    SHARED_IMPORTS,
    NzMenuModule,
    NzAlertModule,
    NzEmptyModule,
    NzTableModule,
    NzTagModule,
    NzDescriptionsModule,
    HeaderContextSwitcherComponent
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

    <nz-card nzTitle="團隊列表" [nzExtra]="extraTemplate" [nzLoading]="loading()">
      <ng-template #extraTemplate>
        @if (isOrganizationContext()) {
          <button nz-button nzType="primary" nzSize="small" (click)="openCreateTeamModal()">
            <span nz-icon nzType="plus"></span>
            建立團隊
          </button>
        }
      </ng-template>
      
      @if (teams().length > 0) {
        <nz-table #table [nzData]="teams()" [nzShowPagination]="false">
          <thead>
            <tr>
              <th nzWidth="200px">團隊名稱</th>
              <th>描述</th>
              <th nzWidth="200px">建立時間</th>
              <th nzWidth="220px">操作</th>
            </tr>
          </thead>
          <tbody>
            @for (team of table.data; track team.id) {
              <tr>
                <td>
                  <strong>{{ team.name }}</strong>
                </td>
                <td>{{ team.description || '尚無描述' }}</td>
                <td>{{ formatDate(team.created_at) }}</td>
                <td>
                  <a (click)="manageMembers(team)" class="mr-sm">管理成員</a>
                  <a (click)="openEditTeamModal(team)" class="mr-sm">編輯</a>
                  <a nz-popconfirm nzPopconfirmTitle="確定刪除此團隊？此操作無法復原。" (nzOnConfirm)="deleteTeam(team)">刪除</a>
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
  private readonly modal = inject(NzModalService);
  private readonly message = inject(NzMessageService);
  private readonly router = inject(Router);

  private readonly teamsState = signal<Team[]>([]);
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
    // Load teams when component initializes
    const orgId = this.currentOrgId();
    if (orgId) {
      this.loadTeams(orgId);
    }
  }

  private loadTeams(organizationId: string): void {
    this.loading.set(true);
    this.teamRepository.findByOrganization(organizationId).subscribe({
      next: (teams: Team[]) => {
        this.teamsState.set(teams);
        this.loading.set(false);
        console.log('[OrganizationTeamsComponent] ✅ Loaded teams:', teams.length);
      },
      error: (error: Error) => {
        console.error('[OrganizationTeamsComponent] ❌ Failed to load teams:', error);
        this.teamsState.set([]);
        this.loading.set(false);
      }
    });
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
