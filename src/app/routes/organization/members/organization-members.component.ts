import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { ContextType, OrganizationMember, OrganizationRole } from '@core';
import { SHARED_IMPORTS, WorkspaceContextService, OrganizationMemberRepository, createAsyncArrayState } from '@shared';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-organization-members',
  standalone: true,
  imports: [SHARED_IMPORTS, NzAlertModule, NzEmptyModule],
  template: `
    <page-header [title]="'組織成員'" [content]="headerContent" [breadcrumb]="breadcrumb"></page-header>

    <ng-template #breadcrumb>
      <nz-breadcrumb>
        <nz-breadcrumb-item>
          <a routerLink="/">
            <span nz-icon nzType="home"></span>
            首頁
          </a>
        </nz-breadcrumb-item>
        @if (organizationName()) {
          <nz-breadcrumb-item>
            <span nz-icon nzType="team"></span>
            {{ organizationName() }}
          </nz-breadcrumb-item>
        }
        <nz-breadcrumb-item>組織成員</nz-breadcrumb-item>
      </nz-breadcrumb>
    </ng-template>

    <ng-template #headerContent>
      <div>管理當前組織的成員與角色。</div>
    </ng-template>

    @if (!isOrganizationContext()) {
      <nz-alert
        nzType="info"
        nzShowIcon
        nzMessage="請切換到組織上下文"
        nzDescription="請從側邊欄切換到目標組織後即可管理成員。"
        class="mb-md"
      />
    }

    <nz-card nzTitle="成員列表" [nzLoading]="membersState.loading()">
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
              <th nzWidth="180px">角色</th>
              <th nzWidth="200px">加入時間</th>
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
export class OrganizationMembersComponent implements OnInit {
  private readonly workspaceContext = inject(WorkspaceContextService);
  private readonly memberRepository = inject(OrganizationMemberRepository);

  // ✅ Modern Pattern: Use AsyncState for unified state management
  readonly membersState = createAsyncArrayState<OrganizationMember>([]);

  ngOnInit(): void {
    // Load members when component initializes
    this.loadMembers();
  }

  /**
   * Load organization members from repository
   * 從 Repository 載入組織成員（使用 AsyncState 統一管理）
   */
  private async loadMembers(): Promise<void> {
    const orgId = this.currentOrgId();

    if (!orgId) {
      return;
    }

    try {
      await this.membersState.load(firstValueFrom(this.memberRepository.findByOrganization(orgId)));
      console.log('[OrganizationMembersComponent] ✅ Loaded members:', this.membersState.length());
    } catch (error) {
      console.error('[OrganizationMembersComponent] ❌ Failed to load members:', error);
      // Error is automatically managed by AsyncState
    }
  }

  readonly currentOrgId = computed(() =>
    this.workspaceContext.contextType() === ContextType.ORGANIZATION ? this.workspaceContext.contextId() : null
  );

  displayMembers = computed(() => this.membersState.data() || []);
  
  readonly organizationName = computed(() => this.workspaceContext.contextLabel());

  isOrganizationContext(): boolean {
    return this.workspaceContext.contextType() === ContextType.ORGANIZATION;
  }

  roleLabel(role: OrganizationRole): string {
    switch (role) {
      case OrganizationRole.OWNER:
        return '擁有者';
      case OrganizationRole.ADMIN:
        return '管理員';
      case OrganizationRole.MEMBER:
      default:
        return '成員';
    }
  }

  roleColor(role: OrganizationRole): string {
    switch (role) {
      case OrganizationRole.OWNER:
        return 'gold';
      case OrganizationRole.ADMIN:
        return 'blue';
      case OrganizationRole.MEMBER:
      default:
        return 'default';
    }
  }
}
