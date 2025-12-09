import { Component, OnInit, inject, signal, input } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ModalHelper } from '@delon/theme';
import { STColumn } from '@delon/abc/st';
import { SHARED_IMPORTS } from '@shared';
import { BlueprintMember, BlueprintRole, LoggerService } from '@core';
import { BlueprintMemberRepository } from '@shared';

/**
 * Blueprint Members Component
 * 藍圖成員元件 - 管理藍圖成員
 * 
 * Features:
 * - Display members list
 * - Add new member
 * - Update member role
 * - Remove member
 * 
 * Following Occam's Razor: Simple, focused member management
 */
@Component({
  selector: 'app-blueprint-members',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-card nzTitle="成員管理" [nzExtra]="extra">
      <ng-template #extra>
        <button nz-button nzType="primary" (click)="addMember()">
          <span nz-icon nzType="user-add"></span>
          新增成員
        </button>
      </ng-template>

      @if (loading()) {
        <nz-spin nzSimple></nz-spin>
      } @else {
        <st
          #st
          [data]="members()"
          [columns]="columns"
          [page]="{ show: false }"
        ></st>
      }
    </nz-card>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class BlueprintMembersComponent implements OnInit {
  private readonly message = inject(NzMessageService);
  private readonly modal = inject(ModalHelper);
  private readonly logger = inject(LoggerService);
  private readonly memberRepository = inject(BlueprintMemberRepository);

  // Input: blueprint ID
  blueprintId = input.required<string>();

  // Reactive state
  loading = signal(false);
  members = signal<BlueprintMember[]>([]);

  // Table columns
  columns: STColumn[] = [
    {
      title: '成員 ID',
      index: 'accountId',
      width: '250px'
    },
    {
      title: '角色',
      index: 'role',
      width: '120px',
      type: 'badge',
      badge: {
        viewer: { text: '檢視者', color: 'default' },
        contributor: { text: '貢獻者', color: 'processing' },
        maintainer: { text: '維護者', color: 'success' }
      }
    },
    {
      title: '業務角色',
      index: 'businessRole',
      width: '150px',
      format: (item: BlueprintMember) => this.getBusinessRoleName(item.businessRole),
      default: '-'
    },
    {
      title: '外部成員',
      index: 'isExternal',
      width: '100px',
      type: 'yn'
    },
    {
      title: '授予時間',
      index: 'grantedAt',
      type: 'date',
      width: '150px'
    },
    {
      title: '操作',
      width: '180px',
      buttons: [
        {
          text: '編輯',
          type: 'link',
          click: (record: any) => this.editMember(record)
        },
        {
          text: '移除',
          type: 'del',
          pop: {
            title: '確定要移除此成員嗎?',
            okType: 'danger'
          },
          click: (record: any) => this.removeMember(record)
        }
      ]
    }
  ];

  ngOnInit(): void {
    this.loadMembers();
  }

  /**
   * Load members
   * 載入成員列表
   */
  private loadMembers(): void {
    this.loading.set(true);

    this.memberRepository.findByBlueprint(this.blueprintId()).subscribe({
      next: (data: BlueprintMember[]) => {
        this.members.set(data);
        this.loading.set(false);
        this.logger.info('[BlueprintMembersComponent]', `Loaded ${data.length} members`);
      },
      error: (error: Error) => {
        this.loading.set(false);
        this.message.error('載入成員失敗');
        this.logger.error('[BlueprintMembersComponent]', 'Failed to load members', error);
      }
    });
  }

  /**
   * Get business role display name
   * 取得業務角色顯示名稱
   */
  private getBusinessRoleName(role?: string): string {
    if (!role) return '-';
    
    const roleMap: Record<string, string> = {
      project_manager: '專案經理',
      site_supervisor: '工地主任',
      engineer: '工程師',
      quality_inspector: '品管人員',
      architect: '建築師',
      contractor: '承包商',
      client: '業主'
    };
    
    return roleMap[role] || role;
  }

  /**
   * Add new member
   * 新增成員
   */
  async addMember(): Promise<void> {
    const { MemberModalComponent } = await import('./member-modal.component');
    this.modal
      .createStatic(
        MemberModalComponent,
        { blueprintId: this.blueprintId() },
        { size: 'md' }
      )
      .subscribe((result) => {
        if (result) {
          this.loadMembers();
        }
      });
  }

  /**
   * Edit member role/permissions
   * 編輯成員角色/權限
   */
  async editMember(record: any): Promise<void> {
    const member = record as BlueprintMember;
    const { MemberModalComponent } = await import('./member-modal.component');
    this.modal
      .createStatic(
        MemberModalComponent,
        { blueprintId: this.blueprintId(), member },
        { size: 'md' }
      )
      .subscribe((result) => {
        if (result) {
          this.loadMembers();
        }
      });
  }

  /**
   * Remove member
   * 移除成員
   */
  async removeMember(record: any): Promise<void> {
    const member = record as BlueprintMember;

    try {
      await this.memberRepository.removeMember(this.blueprintId(), member.id);
      this.message.success('成員已移除');
      this.loadMembers();
    } catch (error) {
      this.message.error('移除成員失敗');
      this.logger.error('[BlueprintMembersComponent]', 'Failed to remove member', error as Error);
    }
  }
}
