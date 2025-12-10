import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { SHARED_IMPORTS } from '@shared';
import { Blueprint, LoggerService } from '@core';
import { BlueprintService } from '@shared';

/**
 * Blueprint Detail Component
 * 藍圖詳情元件 - 顯示單一藍圖的完整資訊
 * 
 * Features:
 * - Display blueprint information
 * - Show enabled modules
 * - Navigate to module pages
 */
@Component({
  selector: 'app-blueprint-detail',
  standalone: true,
  imports: [SHARED_IMPORTS, NzStatisticModule, NzResultModule, NzDescriptionsModule, NzEmptyModule, DatePipe],
  template: `
    <page-header
      [title]="blueprint()?.name || '藍圖詳情'"
      [action]="action"
      [breadcrumb]="breadcrumb"
      >
      <ng-template #action>
        <button nz-button (click)="edit()">
          <span nz-icon nzType="edit"></span>
          編輯
        </button>
        <button nz-button nzDanger (click)="delete()">
          <span nz-icon nzType="delete"></span>
          刪除
        </button>
      </ng-template>
    
      <ng-template #breadcrumb>
        <nz-breadcrumb>
          <nz-breadcrumb-item>
            <a [routerLink]="['/blueprint']">藍圖管理</a>
          </nz-breadcrumb-item>
          <nz-breadcrumb-item>詳情</nz-breadcrumb-item>
        </nz-breadcrumb>
      </ng-template>
    </page-header>
    
    @if (loading()) {
      <nz-card [nzLoading]="true"></nz-card>
    } @else if (blueprint()) {
      <div nz-row [nzGutter]="16">
        <!-- Basic Information -->
        <div nz-col [nzSpan]="16">
          <nz-card nzTitle="基本資訊" class="mb-md">
            <nz-descriptions [nzColumn]="2" nzBordered>
              <nz-descriptions-item nzTitle="名稱">
                {{ blueprint()!.name }}
              </nz-descriptions-item>
              <nz-descriptions-item nzTitle="Slug">
                {{ blueprint()!.slug }}
              </nz-descriptions-item>
              <nz-descriptions-item nzTitle="描述" [nzSpan]="2">
                {{ blueprint()!.description || '-' }}
              </nz-descriptions-item>
              <nz-descriptions-item nzTitle="狀態">
                <nz-badge
                  [nzStatus]="getStatusBadge(blueprint()!.status)"
                  [nzText]="getStatusText(blueprint()!.status)"
                ></nz-badge>
              </nz-descriptions-item>
              <nz-descriptions-item nzTitle="可見性">
                {{ blueprint()!.isPublic ? '公開' : '私人' }}
              </nz-descriptions-item>
              <nz-descriptions-item nzTitle="建立時間">
                {{ blueprint()!.createdAt | date: 'yyyy-MM-dd HH:mm' }}
              </nz-descriptions-item>
              <nz-descriptions-item nzTitle="更新時間">
                {{ blueprint()!.updatedAt | date: 'yyyy-MM-dd HH:mm' }}
              </nz-descriptions-item>
            </nz-descriptions>
          </nz-card>
    
          <!-- Enabled Modules -->
          <nz-card nzTitle="啟用模組">
            @if (blueprint()!.enabledModules.length > 0) {
              <nz-list [nzDataSource]="blueprint()!.enabledModules" nzBordered>
                @for (module of blueprint()!.enabledModules; track module) {
                  <nz-list-item>
                    <nz-list-item-meta
                      [nzTitle]="getModuleName(module)"
                      [nzDescription]="getModuleDescription(module)"
                      >
                      <nz-list-item-meta-avatar>
                        <nz-avatar [nzIcon]="getModuleIcon(module)"></nz-avatar>
                      </nz-list-item-meta-avatar>
                    </nz-list-item-meta>
                    <ul nz-list-item-actions>
                      <nz-list-item-action>
                        <a (click)="openModule(module)">開啟</a>
                      </nz-list-item-action>
                    </ul>
                  </nz-list-item>
                }
              </nz-list>
            } @else {
              <nz-empty nzNotFoundContent="尚未啟用任何模組"></nz-empty>
            }
          </nz-card>
        </div>
    
        <!-- Quick Actions & Info -->
        <div nz-col [nzSpan]="8">
          <nz-card nzTitle="快速操作" class="mb-md">
            <div class="action-list">
              <button nz-button nzBlock class="mb-sm">
                <span nz-icon nzType="team"></span>
                成員管理
              </button>
              <button nz-button nzBlock class="mb-sm">
                <span nz-icon nzType="setting"></span>
                設定
              </button>
              <button nz-button nzBlock class="mb-sm">
                <span nz-icon nzType="file-text"></span>
                審計記錄
              </button>
              <button nz-button nzBlock>
                <span nz-icon nzType="export"></span>
                匯出資料
              </button>
            </div>
          </nz-card>
    
          <nz-card nzTitle="統計資訊">
            <nz-statistic
              [nzValue]="blueprint()!.enabledModules.length"
              nzTitle="啟用模組數"
              [nzPrefix]="modulePrefixTpl"
            ></nz-statistic>
            <ng-template #modulePrefixTpl>
              <span nz-icon nzType="appstore"></span>
            </ng-template>
          </nz-card>
        </div>
      </div>
    } @else {
      <nz-card>
        <nz-result
          nzStatus="404"
          nzTitle="藍圖不存在"
          nzSubTitle="找不到指定的藍圖"
          >
          <div nz-result-extra>
            <button nz-button nzType="primary" [routerLink]="['/blueprint']">
              返回列表
            </button>
          </div>
        </nz-result>
      </nz-card>
    }
    `,
  styles: [`
    :host {
      display: block;
    }
    
    .action-list {
      display: flex;
      flex-direction: column;
    }
  `]
})
export class BlueprintDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly message = inject(NzMessageService);
  private readonly logger = inject(LoggerService);
  private readonly blueprintService = inject(BlueprintService);

  // Reactive state
  loading = signal(true);
  blueprint = signal<Blueprint | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadBlueprint(id);
    } else {
      this.message.error('缺少藍圖 ID');
      this.router.navigate(['/blueprint']);
    }
  }

  /**
   * Load blueprint details
   * 載入藍圖詳情
   */
  private loadBlueprint(id: string): void {
    this.loading.set(true);

    this.blueprintService.getById(id).subscribe({
      next: (data: Blueprint | null) => {
        this.loading.set(false);
        
        if (data) {
          this.blueprint.set(data);
          this.logger.info('[BlueprintDetailComponent]', `Loaded blueprint: ${data.name}`);
        } else {
          // Blueprint not found - show 404 state
          this.blueprint.set(null);
          this.logger.warn('[BlueprintDetailComponent]', `Blueprint not found: ${id}`);
        }
      },
      error: (error: Error) => {
        this.loading.set(false);
        this.blueprint.set(null); // Set to null to trigger 404 UI
        this.message.error('載入藍圖失敗');
        this.logger.error('[BlueprintDetailComponent]', 'Failed to load blueprint', error);
      }
    });
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
   */
  openModule(module: string): void {
    const blueprintId = this.blueprint()?.id;
    if (blueprintId) {
      this.router.navigate(['/blueprint', blueprintId, module]);
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
}
