import { DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Blueprint, LoggerService } from '@core';
import { SHARED_IMPORTS, createAsyncState } from '@shared';
import { BlueprintService } from '@core/blueprint/services';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { firstValueFrom } from 'rxjs';
import { BlueprintMembersComponent } from './members/blueprint-members.component';

/**
 * Blueprint Detail Component
 * 藍圖詳情元件 - 顯示單一藍圖的完整資訊
 *
 * Features:
 * - Display blueprint information
 * - Show enabled modules
 * - Navigate to module pages
 *
 * ✅ Modernized with AsyncState pattern
 */
@Component({
  selector: 'app-blueprint-detail',
  standalone: true,
  imports: [
    SHARED_IMPORTS,
    NzStatisticModule,
    NzResultModule,
    NzDescriptionsModule,
    NzEmptyModule,
    NzSpaceModule,
    NzTabsModule,
    NzTagModule,
    DatePipe,
    BlueprintMembersComponent
  ],
  template: `
    <page-header [title]="blueprint()?.name || '藍圖詳情'" [action]="action" [breadcrumb]="breadcrumb">
      <ng-template #action>
        <nz-space>
          <button *nzSpaceItem nz-button (click)="refresh()">
            <span nz-icon nzType="reload"></span>
            同步
          </button>
          <button *nzSpaceItem nz-button (click)="exportData()">
            <span nz-icon nzType="export"></span>
            匯出
          </button>
          <button *nzSpaceItem nz-button (click)="edit()">
            <span nz-icon nzType="edit"></span>
            編輯
          </button>
          <button *nzSpaceItem nz-button nzDanger (click)="delete()">
            <span nz-icon nzType="delete"></span>
            刪除
          </button>
        </nz-space>
      </ng-template>

      <ng-template #breadcrumb>
        <nz-breadcrumb>
          <nz-breadcrumb-item>
            <a [routerLink]="['..']" [relativeTo]="route">藍圖列表</a>
          </nz-breadcrumb-item>
          <nz-breadcrumb-item>{{ blueprint()?.name || '詳情' }}</nz-breadcrumb-item>
        </nz-breadcrumb>
      </ng-template>
    </page-header>

    @if (loading()) {
      <nz-card [nzLoading]="true" style="min-height: 400px;"></nz-card>
    } @else if (blueprint()) {
      <!-- Blueprint Header Info -->
      <nz-card class="mb-md">
        <nz-descriptions [nzColumn]="3">
          <nz-descriptions-item nzTitle="負責人">
            <span nz-icon nzType="user"></span>
            {{ blueprint()!.ownerType === 'user' ? '個人' : blueprint()!.ownerType === 'organization' ? '組織' : '團隊' }}
          </nz-descriptions-item>
          <nz-descriptions-item nzTitle="狀態">
            <nz-badge [nzStatus]="getStatusBadge(blueprint()!.status)" [nzText]="getStatusText(blueprint()!.status)" />
          </nz-descriptions-item>
          <nz-descriptions-item nzTitle="建立時間">
            {{ blueprint()!.createdAt | date: 'yyyy-MM-dd HH:mm' }}
          </nz-descriptions-item>
        </nz-descriptions>
        @if (blueprint()!.description) {
          <p class="mt-sm text-grey">
            <span nz-icon nzType="file-text"></span>
            {{ blueprint()!.description }}
          </p>
        }
      </nz-card>

      <!-- Tab Navigation -->
      <nz-card [nzBordered]="false">
        <nz-tabset [(nzSelectedIndex)]="activeTabIndex" (nzSelectedIndexChange)="onTabChange($event)">
          <!-- Overview Tab -->
          <nz-tab nzTitle="概覽">
            <ng-template nz-tab>
              <div nz-row [nzGutter]="16">
                <div nz-col [nzXs]="24" [nzMd]="16">
                  <!-- Statistics -->
                  <nz-card nzTitle="專案統計" class="mb-md">
                    <nz-row [nzGutter]="16">
                      <nz-col [nzSpan]="8">
                        <nz-statistic [nzValue]="blueprint()!.enabledModules.length" nzTitle="啟用模組" [nzPrefix]="moduleIconTpl" />
                        <ng-template #moduleIconTpl>
                          <span nz-icon nzType="appstore" style="color: #1890ff;"></span>
                        </ng-template>
                      </nz-col>
                      <nz-col [nzSpan]="8">
                        <nz-statistic [nzValue]="0" nzTitle="總任務" [nzPrefix]="taskIconTpl" />
                        <ng-template #taskIconTpl>
                          <span nz-icon nzType="check-square" style="color: #52c41a;"></span>
                        </ng-template>
                      </nz-col>
                      <nz-col [nzSpan]="8">
                        <nz-statistic [nzValue]="0" nzTitle="日誌數" [nzPrefix]="logIconTpl" />
                        <ng-template #logIconTpl>
                          <span nz-icon nzType="file-text" style="color: #faad14;"></span>
                        </ng-template>
                      </nz-col>
                    </nz-row>
                  </nz-card>

                  <!-- Enabled Modules -->
                  <nz-card nzTitle="啟用模組">
                    @if (blueprint()!.enabledModules.length > 0) {
                      <nz-row [nzGutter]="[16, 16]">
                        @for (module of blueprint()!.enabledModules; track module) {
                          <nz-col [nzXs]="24" [nzSm]="12" [nzMd]="8">
                            <nz-card [nzHoverable]="true" class="module-card" (click)="openModule(module)">
                              <div style="text-align: center;">
                                <span nz-icon [nzType]="getModuleIcon(module)" style="font-size: 32px; color: #1890ff;"></span>
                                <h4 style="margin-top: 12px;">{{ getModuleName(module) }}</h4>
                                <p class="text-grey" style="font-size: 12px;">{{ getModuleDescription(module) }}</p>
                              </div>
                            </nz-card>
                          </nz-col>
                        }
                      </nz-row>
                    } @else {
                      <nz-empty nzNotFoundContent="尚未啟用任何模組">
                        <ng-template nz-empty-footer>
                          <button nz-button nzType="primary" (click)="configureModules()">
                            <span nz-icon nzType="setting"></span>
                            配置模組
                          </button>
                        </ng-template>
                      </nz-empty>
                    }
                  </nz-card>
                </div>

                <div nz-col [nzXs]="24" [nzMd]="8">
                  <!-- Quick Actions -->
                  <nz-card nzTitle="快速操作" class="mb-md">
                    <button nz-button nzBlock class="mb-sm" (click)="openContainer()">
                      <span nz-icon nzType="dashboard"></span>
                      容器儀表板
                    </button>
                    <button nz-button nzBlock class="mb-sm" (click)="switchToMembersTab()">
                      <span nz-icon nzType="team"></span>
                      成員管理
                    </button>
                    <button nz-button nzBlock class="mb-sm" (click)="configureModules()">
                      <span nz-icon nzType="setting"></span>
                      模組配置
                    </button>
                    <button nz-button nzBlock class="mb-sm" (click)="viewAuditLogs()">
                      <span nz-icon nzType="file-text"></span>
                      審計記錄
                    </button>
                  </nz-card>

                  <!-- Basic Info -->
                  <nz-card nzTitle="基本資訊">
                    <nz-descriptions [nzColumn]="1" [nzColon]="false">
                      <nz-descriptions-item nzTitle="Slug">
                        <nz-tag>{{ blueprint()!.slug }}</nz-tag>
                      </nz-descriptions-item>
                      <nz-descriptions-item nzTitle="可見性">
                        @if (blueprint()!.isPublic) {
                          <nz-tag nzColor="green">
                            <span nz-icon nzType="eye"></span>
                            公開
                          </nz-tag>
                        } @else {
                          <nz-tag nzColor="default">
                            <span nz-icon nzType="eye-invisible"></span>
                            私人
                          </nz-tag>
                        }
                      </nz-descriptions-item>
                      <nz-descriptions-item nzTitle="更新時間">
                        {{ blueprint()!.updatedAt | date: 'yyyy-MM-dd HH:mm' }}
                      </nz-descriptions-item>
                    </nz-descriptions>
                  </nz-card>
                </div>
              </div>
            </ng-template>
          </nz-tab>

          <!-- Tasks Tab -->
          <nz-tab nzTitle="任務">
            <ng-template nz-tab>
              <nz-empty nzNotFoundContent="任務模組尚未實作" />
            </ng-template>
          </nz-tab>

          <!-- Logs Tab -->
          <nz-tab nzTitle="日誌">
            <ng-template nz-tab>
              <nz-empty nzNotFoundContent="日誌模組尚未實作" />
            </ng-template>
          </nz-tab>

          <!-- Members Tab -->
          <nz-tab nzTitle="成員">
            <ng-template nz-tab>
              @if (blueprint()?.id) {
                <app-blueprint-members [blueprintId]="blueprint()!.id" />
              }
            </ng-template>
          </nz-tab>

          <!-- Settings Tab -->
          <nz-tab nzTitle="設定">
            <ng-template nz-tab>
              <nz-card nzTitle="藍圖設定">
                <button nz-button (click)="edit()">
                  <span nz-icon nzType="edit"></span>
                  編輯藍圖資訊
                </button>
                <button nz-button class="ml-sm" (click)="configureModules()">
                  <span nz-icon nzType="appstore"></span>
                  配置模組
                </button>
              </nz-card>
            </ng-template>
          </nz-tab>
        </nz-tabset>
      </nz-card>
    } @else {
      <nz-card>
        <nz-result nzStatus="404" nzTitle="藍圖不存在" nzSubTitle="找不到指定的藍圖">
          <div nz-result-extra>
            <button nz-button nzType="primary" [routerLink]="['..']" [relativeTo]="route"> 返回列表 </button>
          </div>
        </nz-result>
      </nz-card>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .module-card {
        cursor: pointer;
        transition: all 0.3s;
      }

      .module-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      .text-grey {
        color: rgba(0, 0, 0, 0.45);
      }
    `
  ]
})
export class BlueprintDetailComponent implements OnInit {
  protected readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly message = inject(NzMessageService);
  private readonly logger = inject(LoggerService);
  private readonly blueprintService: BlueprintService = inject(BlueprintService);

  // ✅ Modern Pattern: Use AsyncState
  readonly blueprintState = createAsyncState<Blueprint | null>(null);

  // Convenience accessor
  readonly blueprint = this.blueprintState.data;
  readonly loading = this.blueprintState.loading;

  // Tab state
  activeTabIndex = 0;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadBlueprint(id);
    } else {
      this.message.error('缺少藍圖 ID');
      // Navigate back to list using relative path
      this.router.navigate(['..'], { relativeTo: this.route });
    }
  }

  /**
   * Load blueprint details
   * 載入藍圖詳情
   * ✅ Using AsyncState for automatic state management
   */
  private async loadBlueprint(id: string): Promise<void> {
    try {
      const data = await firstValueFrom(this.blueprintService.getById(id));

      if (data) {
        this.blueprintState.setData(data);
        this.logger.info('[BlueprintDetailComponent]', `Loaded blueprint: ${data.name}`);
      } else {
        // Blueprint not found - show 404 state
        this.blueprintState.setData(null);
        this.logger.warn('[BlueprintDetailComponent]', `Blueprint not found: ${id}`);
      }
    } catch (error) {
      this.blueprintState.setData(null); // Set to null to trigger 404 UI
      this.message.error('載入藍圖失敗');
      this.logger.error('[BlueprintDetailComponent]', 'Failed to load blueprint', error as Error);
    }
  }

  /**
   * Get status badge type
   * 取得狀態徽章類型
   */
  getStatusBadge(status: string): 'success' | 'processing' | 'default' | 'error' | 'warning' {
    const statusMap = {
      draft: 'default' as const,
      active: 'success' as const,
      archived: 'default' as const
    };
    return statusMap[status as keyof typeof statusMap] || 'default';
  }

  /**
   * Get status text
   * 取得狀態文字
   */
  getStatusText(status: string): string {
    const textMap = {
      draft: '草稿',
      active: '啟用',
      archived: '封存'
    };
    return textMap[status as keyof typeof textMap] || status;
  }

  /**
   * Get module display name
   * 取得模組顯示名稱
   */
  getModuleName(module: string): string {
    const nameMap: Record<string, string> = {
      tasks: '任務管理',
      logs: '日誌記錄',
      quality: '品質驗收',
      diary: '施工日誌',
      dashboard: '儀表板',
      files: '文件管理',
      todos: '待辦事項',
      checklists: '檢查清單',
      issues: '問題追蹤',
      bot_workflow: '自動化流程'
    };
    return nameMap[module] || module;
  }

  /**
   * Get module description
   * 取得模組描述
   */
  getModuleDescription(module: string): string {
    const descMap: Record<string, string> = {
      tasks: '管理專案任務與進度',
      logs: '記錄施工日誌與記錄',
      quality: '品質檢驗與驗收',
      diary: '每日施工日誌',
      dashboard: '數據統計與視覺化',
      files: '文件與圖片管理',
      todos: '待辦事項管理',
      checklists: '檢查清單管理',
      issues: '問題與缺陷追蹤',
      bot_workflow: '自動化工作流程'
    };
    return descMap[module] || '模組功能';
  }

  /**
   * Get module icon
   * 取得模組圖示
   */
  getModuleIcon(module: string): string {
    const iconMap: Record<string, string> = {
      tasks: 'check-square',
      logs: 'file-text',
      quality: 'safety-certificate',
      diary: 'book',
      dashboard: 'dashboard',
      files: 'folder',
      todos: 'ordered-list',
      checklists: 'check-circle',
      issues: 'warning',
      bot_workflow: 'robot'
    };
    return iconMap[module] || 'appstore';
  }

  /**
   * Open module page
   * 開啟模組頁面
   * ✅ Fixed: Use relative navigation to respect workspace context
   */
  openModule(module: string): void {
    const blueprintId = this.blueprint()?.id;
    if (blueprintId) {
      // Navigate relative to current detail page
      this.router.navigate([module], { relativeTo: this.route });
    }
  }

  /**
   * Open container dashboard
   * 開啟容器儀表板
   */
  openContainer(): void {
    const blueprintId = this.blueprint()?.id;
    if (blueprintId) {
      this.router.navigate(['container'], { relativeTo: this.route });
    }
  }

  /**
   * Edit blueprint
   * 編輯藍圖
   */
  edit(): void {
    this.message.info('編輯功能待實作');
  }

  /**
   * Delete blueprint
   * 刪除藍圖
   */
  delete(): void {
    this.message.info('刪除功能待實作');
  }

  /**
   * Refresh blueprint data
   * 重新整理藍圖資料
   */
  refresh(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadBlueprint(id);
    }
  }

  /**
   * Export blueprint data
   * 匯出藍圖資料
   */
  exportData(): void {
    this.message.info('匯出功能待實作');
  }

  /**
   * Switch to members tab
   * 切換到成員管理標籤頁
   * ✅ Updated: Directly switch to Members Tab instead of navigating (Occam's Razor)
   */
  switchToMembersTab(): void {
    this.activeTabIndex = 3; // Members tab is the 4th tab (index 3)
  }

  /**
   * Configure modules
   * 配置模組
   */
  configureModules(): void {
    this.message.info('模組配置功能待實作');
  }

  /**
   * View audit logs
   * 查看審計記錄
   */
  viewAuditLogs(): void {
    this.router.navigate(['audit'], { relativeTo: this.route });
  }

  /**
   * Handle tab change
   * 處理 Tab 切換
   */
  onTabChange(index: number): void {
    this.logger.debug('[BlueprintDetailComponent]', `Tab changed to index: ${index}`);
  }
}
