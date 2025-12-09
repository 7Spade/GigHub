import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { Router } from '@angular/router';
import { STColumn, STData } from '@delon/abc/st';
import { ModalHelper } from '@delon/theme';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { SHARED_IMPORTS } from '@shared';
import { Blueprint, BlueprintStatus, LoggerService, FirebaseAuthService, OwnerType, ContextType } from '@core';
import { BlueprintFacade, WorkspaceContextService } from '@shared';

/**
 * Blueprint List Component
 * 藍圖列表元件 - 顯示使用者的所有藍圖
 * 
 * Features:
 * - Display blueprints in ST table
 * - Filter by status
 * - Create new blueprint
 * - Navigate to detail
 */
@Component({
  selector: 'app-blueprint-list',
  standalone: true,
  imports: [SHARED_IMPORTS, NzSpaceModule],
  template: `
    <page-header [title]="'藍圖管理'" [action]="action">
      <ng-template #action>
        <button nz-button nzType="primary" (click)="create()">
          <span nz-icon nzType="plus"></span>
          建立藍圖
        </button>
      </ng-template>
    </page-header>

    <nz-card>
      <!-- Filter Section -->
      <div class="mb-md" style="display: flex; gap: 8px;">
        <nz-select
          [(ngModel)]="filterStatus"
          (ngModelChange)="onFilterChange()"
          nzPlaceHolder="篩選狀態"
          style="width: 150px"
        >
          <nz-option nzLabel="全部" [nzValue]="null"></nz-option>
          <nz-option nzLabel="草稿" nzValue="draft"></nz-option>
          <nz-option nzLabel="啟用" nzValue="active"></nz-option>
          <nz-option nzLabel="封存" nzValue="archived"></nz-option>
        </nz-select>
        <button nz-button (click)="refresh()">
          <span nz-icon nzType="reload"></span>
          重新整理
        </button>
      </div>

      <!-- Table -->
      <st
        #st
        [data]="blueprints()"
        [columns]="columns"
        [loading]="loading()"
        [page]="{ show: true, showSize: true }"
        (change)="onChange($event)"
      ></st>
    </nz-card>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class BlueprintListComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly modal = inject(ModalHelper);
  private readonly message = inject(NzMessageService);
  private readonly logger = inject(LoggerService);
  readonly facade = inject(BlueprintFacade);
  private readonly authService = inject(FirebaseAuthService);
  private readonly workspaceContext = inject(WorkspaceContextService);

  // Reactive state from Facade Signals
  loading = this.facade.loading;
  blueprints = this.facade.blueprints;
  filterStatus: BlueprintStatus | null = null;
  
  constructor() {
    // Auto-reload blueprints when workspace context changes
    effect(() => {
      const contextType = this.workspaceContext.contextType();
      const contextId = this.workspaceContext.contextId();
      
      // Skip if no context is set
      if (!contextId && contextType !== ContextType.USER) return;
      
      this.loadBlueprints();
    });
  }

  // Table columns configuration
  columns: STColumn[] = [
    {
      title: '名稱',
      index: 'name',
      width: '200px',
      render: 'name'
    },
    {
      title: 'Slug',
      index: 'slug',
      width: '150px'
    },
    {
      title: '描述',
      index: 'description',
      width: '300px',
      default: '-'
    },
    {
      title: '狀態',
      index: 'status',
      width: '100px',
      type: 'badge',
      badge: {
        draft: { text: '草稿', color: 'default' },
        active: { text: '啟用', color: 'success' },
        archived: { text: '封存', color: 'default' }
      }
    },
    {
      title: '建立時間',
      index: 'createdAt',
      type: 'date',
      width: '150px'
    },
    {
      title: '操作',
      width: '180px',
      buttons: [
        {
          text: '檢視',
          type: 'link',
          click: (record: STData) => this.view(record)
        },
        {
          text: '編輯',
          type: 'link',
          click: (record: STData) => this.edit(record)
        },
        {
          text: '刪除',
          type: 'del',
          pop: {
            title: '確定要刪除嗎?',
            okType: 'danger'
          },
          click: (record: STData) => this.delete(record)
        }
      ]
    }
  ];

  ngOnInit(): void {
    this.loadBlueprints();
  }

  /**
   * Load blueprints for current workspace context
   * 載入當前工作區上下文的藍圖
   */
  private async loadBlueprints(): Promise<void> {
    const user = this.authService.currentUser;
    if (!user) {
      this.message.error('請先登入');
      return;
    }

    // Determine owner type and ID based on workspace context
    const contextType = this.workspaceContext.contextType();
    const contextId = this.workspaceContext.contextId();
    
    let ownerType: OwnerType;
    let ownerId: string;
    
    switch (contextType) {
      case ContextType.ORGANIZATION:
        ownerType = OwnerType.ORGANIZATION;
        ownerId = contextId || user.uid;
        break;
      case ContextType.TEAM:
        // Teams belong to organizations, so load organization's blueprints
        const team = this.workspaceContext.teams().find(t => t.id === contextId);
        if (team) {
          ownerType = OwnerType.ORGANIZATION;
          ownerId = team.organization_id;
        } else {
          ownerType = OwnerType.USER;
          ownerId = user.uid;
        }
        break;
      case ContextType.USER:
      default:
        ownerType = OwnerType.USER;
        ownerId = user.uid;
        break;
    }

    try {
      await this.facade.listBlueprints({
        ownerId,
        ownerType,
        status: this.filterStatus ?? undefined
      });
      
      this.logger.info('[BlueprintListComponent]', `Loaded ${this.blueprints().length} blueprints for ${ownerType}:${ownerId}`);
    } catch (error) {
      this.message.error('載入藍圖失敗');
      this.logger.error('[BlueprintListComponent]', 'Failed to load blueprints', error as Error);
    }
  }

  /**
   * Refresh blueprint list
   * 重新整理藍圖列表
   */
  refresh(): void {
    this.loadBlueprints();
  }

  /**
   * Handle filter change
   * 處理篩選變更
   */
  onFilterChange(): void {
    this.loadBlueprints();
  }

  /**
   * Handle table change event
   * 處理表格變更事件
   */
  onChange(event: any): void {
    // Handle pagination, sorting, etc.
    this.logger.debug('[BlueprintListComponent]', 'Table changed', event);
  }

  /**
   * Create new blueprint
   * 建立新藍圖
   */
  async create(): Promise<void> {
    const { BlueprintModalComponent } = await import('./blueprint-modal.component');
    this.modal
      .createStatic(
        BlueprintModalComponent,
        {},
        { size: 'md' }
      )
      .subscribe((result) => {
        if (result) {
          this.refresh();
        }
      });
  }

  /**
   * View blueprint details
   * 檢視藍圖詳情
   */
  view(record: STData): void {
    const blueprint = record as unknown as Blueprint;
    this.router.navigate(['/blueprint', blueprint.id]);
  }

  /**
   * Edit blueprint
   * 編輯藍圖
   */
  async edit(record: STData): Promise<void> {
    const blueprint = record as unknown as Blueprint;
    const { BlueprintModalComponent } = await import('./blueprint-modal.component');
    this.modal
      .createStatic(
        BlueprintModalComponent,
        { blueprint },
        { size: 'md' }
      )
      .subscribe((result) => {
        if (result) {
          this.refresh();
        }
      });
  }

  /**
   * Delete blueprint (soft delete)
   * 刪除藍圖（軟刪除）
   */
  async delete(record: STData): Promise<void> {
    const blueprint = record as unknown as Blueprint;
    const user = this.authService.currentUser;
    
    if (!user) {
      this.message.error('請先登入');
      return;
    }
    
    try {
      await this.facade.deleteBlueprint(blueprint.id, user.uid);
      this.message.success('藍圖已刪除');
      this.logger.info('[BlueprintListComponent]', `Deleted blueprint ${blueprint.id}`);
    } catch (error) {
      this.message.error('刪除藍圖失敗');
      this.logger.error('[BlueprintListComponent]', 'Failed to delete blueprint', error as Error);
    }
  }
}
