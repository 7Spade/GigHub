import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { ContextType, Team } from '@core';
import { SHARED_IMPORTS, WorkspaceContextService, TeamRepository } from '@shared';
import { HeaderContextSwitcherComponent } from '../../../layout/basic/widgets/context-switcher.component';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';

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
  private readonly modal = inject(NzModalService);
  private readonly message = inject(NzMessageService);

  private readonly teamsState = signal<Team[]>([]);
  loading = signal(false);

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
    this.modal.create({
      nzTitle: '建立團隊',
      nzContent: `
        <form nz-form>
          <nz-form-item>
            <nz-form-label nzRequired>團隊名稱</nz-form-label>
            <nz-form-control>
              <input nz-input id="teamName" placeholder="請輸入團隊名稱" />
            </nz-form-control>
          </nz-form-item>
          <nz-form-item>
            <nz-form-label>描述</nz-form-label>
            <nz-form-control>
              <textarea nz-input id="teamDescription" placeholder="請輸入團隊描述（選填）" rows="3"></textarea>
            </nz-form-control>
          </nz-form-item>
        </form>
      `,
      nzOnOk: async () => {
        const name = (document.getElementById('teamName') as HTMLInputElement)?.value;
        const description = (document.getElementById('teamDescription') as HTMLTextAreaElement)?.value;
        
        if (!name || name.trim() === '') {
          this.message.error('請輸入團隊名稱');
          return false;
        }

        const orgId = this.currentOrgId();
        if (!orgId) {
          this.message.error('無法獲取組織 ID');
          return false;
        }

        try {
          await this.teamRepository.create({
            organization_id: orgId,
            name: name.trim(),
            description: description?.trim() || null
          });
          this.message.success('團隊已建立');
          this.loadTeams(orgId);
          return true;
        } catch (error) {
          console.error('[OrganizationTeamsComponent] ❌ Failed to create team:', error);
          this.message.error('建立團隊失敗');
          return false;
        }
      }
    });
  }

  openEditTeamModal(team: Team): void {
    this.modal.create({
      nzTitle: '編輯團隊',
      nzContent: `
        <form nz-form>
          <nz-form-item>
            <nz-form-label nzRequired>團隊名稱</nz-form-label>
            <nz-form-control>
              <input nz-input id="editTeamName" value="${team.name}" />
            </nz-form-control>
          </nz-form-item>
          <nz-form-item>
            <nz-form-label>描述</nz-form-label>
            <nz-form-control>
              <textarea nz-input id="editTeamDescription" rows="3">${team.description || ''}</textarea>
            </nz-form-control>
          </nz-form-item>
        </form>
      `,
      nzOnOk: async () => {
        const name = (document.getElementById('editTeamName') as HTMLInputElement)?.value;
        const description = (document.getElementById('editTeamDescription') as HTMLTextAreaElement)?.value;
        
        if (!name || name.trim() === '') {
          this.message.error('請輸入團隊名稱');
          return false;
        }

        try {
          await this.teamRepository.update(team.id, {
            name: name.trim(),
            description: description?.trim() || null
          });
          this.message.success('團隊已更新');
          
          const orgId = this.currentOrgId();
          if (orgId) {
            this.loadTeams(orgId);
          }
          return true;
        } catch (error) {
          console.error('[OrganizationTeamsComponent] ❌ Failed to update team:', error);
          this.message.error('更新團隊失敗');
          return false;
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
}
