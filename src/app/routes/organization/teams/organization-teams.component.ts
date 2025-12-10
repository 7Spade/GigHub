import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ContextType, Team } from '@core';
import { SHARED_IMPORTS, WorkspaceContextService, TeamRepository, createAsyncArrayState } from '@shared';
import { HeaderContextSwitcherComponent } from '../../../layout/basic/widgets/context-switcher.component';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzAlertModule} from 'ng-zorro-antd/alert';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { ModalHelper } from '@delon/theme';
import { NzMessageService } from 'ng-zorro-antd/message';

/**
 * Organization Teams Component
 * 組織團隊元件 - 管理組織內的團隊
 *
 * ✅ Modernized with:
 * - AsyncState for state management
 * - TeamModalComponent (no DOM manipulation)
 * - Unified loading/error handling
 */
@Component({
  selector: 'app-organization-teams',
  standalone: true,
  imports: [SHARED_IMPORTS, NzMenuModule, NzAlertModule, NzEmptyModule, HeaderContextSwitcherComponent],
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

    <nz-card nzTitle="團隊列表" [nzExtra]="extraTemplate" [nzLoading]="teamsState.loading()">
      <ng-template #extraTemplate>
        @if (isOrganizationContext()) {
          <button nz-button nzType="primary" nzSize="small" (click)="openCreateTeamModal()">
            <span nz-icon nzType="plus"></span>
            建立團隊
          </button>
        }
      </ng-template>
      
      @if (teamsState.error()) {
        <nz-alert
          nzType="error"
          nzShowIcon
          [nzMessage]="'載入失敗'"
          [nzDescription]="teamsState.error()?.message || '無法載入團隊列表'"
          class="mb-md"
        />
      }
      
      @if (teams().length > 0) {
        <nz-list [nzDataSource]="teams()" [nzRenderItem]="teamTpl" [nzItemLayout]="'horizontal'"></nz-list>
        <ng-template #teamTpl let-team>
          <nz-list-item [nzActions]="[editAction, deleteAction]">
            <nz-list-item-meta
              [nzTitle]="team.name"
              [nzDescription]="team.description || '尚無描述'"
            ></nz-list-item-meta>
            <nz-tag>{{ team.id }}</nz-tag>
            
            <ng-template #editAction>
              <a (click)="openEditTeamModal(team)">編輯</a>
            </ng-template>
            <ng-template #deleteAction>
              <a nz-popconfirm nzPopconfirmTitle="確定刪除此團隊？" (nzOnConfirm)="deleteTeam(team)">刪除</a>
            </ng-template>
          </nz-list-item>
        </ng-template>
      } @else {
        <nz-empty nzNotFoundContent="暫無團隊"></nz-empty>
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
export class OrganizationTeamsComponent implements OnInit {
  private readonly workspaceContext = inject(WorkspaceContextService);
  private readonly teamRepository = inject(TeamRepository);
  private readonly modal = inject(ModalHelper);
  private readonly message = inject(NzMessageService);

  // ✅ Modern Pattern: Use AsyncState
  readonly teamsState = createAsyncArrayState<Team>([]);

  ngOnInit(): void {
    const orgId = this.currentOrgId();
    if (orgId) {
      this.loadTeams(orgId);
    }
  }

  /**
   * Load teams
   * ✅ Using AsyncState for automatic state management
   */
  private async loadTeams(organizationId: string): Promise<void> {
    try {
      await this.teamsState.load(
        firstValueFrom(this.teamRepository.findByOrganization(organizationId))
      );
      console.log('[OrganizationTeamsComponent] ✅ Loaded teams:', this.teamsState.length());
    } catch (error) {
      console.error('[OrganizationTeamsComponent] ❌ Failed to load teams:', error);
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
    return this.teamsState.data() || [];
  });

  isOrganizationContext(): boolean {
    return this.workspaceContext.contextType() === ContextType.ORGANIZATION;
  }

  /**
   * Open create team modal
   * ✅ Using Modal Component (no DOM manipulation)
   */
  async openCreateTeamModal(): Promise<void> {
    const { TeamModalComponent } = await import('./team-modal.component');
    
    this.modal
      .createStatic(TeamModalComponent, {}, { size: 'md' })
      .subscribe(async (component) => {
        if (component && component.isValid()) {
          const data = component.getData();
          await this.createTeam(data);
        }
      });
  }

  /**
   * Open edit team modal
   * ✅ Using Modal Component (no DOM manipulation)
   */
  async openEditTeamModal(team: Team): Promise<void> {
    const { TeamModalComponent } = await import('./team-modal.component');
    
    this.modal
      .createStatic(TeamModalComponent, { team }, { size: 'md' })
      .subscribe(async (component) => {
        if (component && component.isValid()) {
          const data = component.getData();
          await this.updateTeam(team.id, data);
        }
      });
  }

  /**
   * Create team
   */
  private async createTeam(data: { name: string; description: string | null }): Promise<void> {
    const orgId = this.currentOrgId();
    if (!orgId) {
      this.message.error('無法獲取組織 ID');
      return;
    }

    try {
      await this.teamRepository.create({
        organization_id: orgId,
        name: data.name,
        description: data.description
      });
      this.message.success('團隊已建立');
      await this.loadTeams(orgId);
    } catch (error) {
      console.error('[OrganizationTeamsComponent] ❌ Failed to create team:', error);
      this.message.error('建立團隊失敗');
    }
  }

  /**
   * Update team
   */
  private async updateTeam(id: string, data: { name: string; description: string | null }): Promise<void> {
    try {
      await this.teamRepository.update(id, {
        name: data.name,
        description: data.description
      });
      this.message.success('團隊已更新');
      
      const orgId = this.currentOrgId();
      if (orgId) {
        await this.loadTeams(orgId);
      }
    } catch (error) {
      console.error('[OrganizationTeamsComponent] ❌ Failed to update team:', error);
      this.message.error('更新團隊失敗');
    }
  }

  /**
   * Delete team
   */
  async deleteTeam(team: Team): Promise<void> {
    try {
      await this.teamRepository.delete(team.id);
      this.message.success('團隊已刪除');
      
      const orgId = this.currentOrgId();
      if (orgId) {
        await this.loadTeams(orgId);
      }
    } catch (error) {
      console.error('[OrganizationTeamsComponent] ❌ Failed to delete team:', error);
      this.message.error('刪除團隊失敗');
    }
  }
}
