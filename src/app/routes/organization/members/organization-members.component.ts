import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { ContextType, OrganizationMember, OrganizationRole } from '@core';
import { SHARED_IMPORTS, WorkspaceContextService, OrganizationMemberRepository } from '@shared';
import { HeaderContextSwitcherComponent } from '../../../layout/basic/widgets/context-switcher.component';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzEmptyModule } from 'ng-zorro-antd/empty';

@Component({
  selector: 'app-organization-members',
  standalone: true,
  imports: [SHARED_IMPORTS, NzMenuModule, NzAlertModule, NzEmptyModule, HeaderContextSwitcherComponent],
  template: `
    <page-header [title]="'組織成員'" [content]="headerContent"></page-header>
    
    <ng-template #headerContent>
      <div>管理當前組織的成員與角色。</div>
    </ng-template>

    @if (!isOrganizationContext()) {
      <nz-alert
        nzType="info"
        nzShowIcon
        nzMessage="請切換到組織上下文"
        nzDescription="使用下方切換器切換到目標組織後即可管理成員。"
        class="mb-md"
      />
    }

    <nz-card class="mb-md" nzTitle="工作區切換器">
      <div class="text-grey mb-sm">支援直接在頁面切換到對應的組織。</div>
      <ul nz-menu nzMode="inline" class="bg-transparent border-0">
        <header-context-switcher />
      </ul>
    </nz-card>

    <nz-card nzTitle="成員列表" [nzLoading]="loading()">
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

  // State signals (Occam's Razor: simple reactive state)
  private readonly members = signal<OrganizationMember[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    // Load members when component initializes (Occam's Razor: single load point)
    this.loadMembers();
  }

  /**
   * Load organization members from repository
   * 從 Repository 載入組織成員（使用真實數據）
   */
  private loadMembers(): void {
    const orgId = this.currentOrgId();
    
    if (!orgId) {
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.memberRepository.findByOrganization(orgId).subscribe({
      next: (members: OrganizationMember[]) => {
        this.members.set(members);
        this.loading.set(false);
        console.log('[OrganizationMembersComponent] ✅ Loaded members:', members.length);
      },
      error: (error: Error) => {
        console.error('[OrganizationMembersComponent] ❌ Failed to load members:', error);
        this.members.set([]);
        this.loading.set(false);
      }
    });
  }

  readonly currentOrgId = computed(() =>
    this.workspaceContext.contextType() === ContextType.ORGANIZATION ? this.workspaceContext.contextId() : null
  );

  displayMembers = computed(() => this.members());

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
