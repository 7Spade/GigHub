/**
 * Blueprint Detail Component
 *
 * Displays detailed view of a single blueprint with tasks
 * Following vertical slice architecture and KEEP.md principles
 *
 * @module features/blueprint/ui/blueprint-detail
 */

import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SHARED_IMPORTS } from '@shared';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';

import { BlueprintStore, TaskStore } from '../../data-access';

/** Status configuration for display */
const STATUS_CONFIG: Record<string, { text: string; color: string }> = {
  draft: { text: '草稿', color: 'default' },
  published: { text: '已發布', color: 'processing' },
  archived: { text: '已封存', color: 'warning' }
};

/** Visibility configuration for display */
const VISIBILITY_CONFIG: Record<string, { text: string; color: string }> = {
  private: { text: '私有', color: 'default' },
  organization: { text: '組織', color: 'green' },
  public: { text: '公開', color: 'blue' }
};

/** Task status configuration */
const TASK_STATUS_CONFIG: Record<string, { text: string; color: string }> = {
  pending: { text: '待處理', color: 'default' },
  in_progress: { text: '進行中', color: 'processing' },
  completed: { text: '已完成', color: 'success' },
  blocked: { text: '已阻塞', color: 'error' }
};

/** Task priority configuration */
const TASK_PRIORITY_CONFIG: Record<string, { text: string; color: string }> = {
  low: { text: '低', color: 'default' },
  medium: { text: '中', color: 'warning' },
  high: { text: '高', color: 'orange' },
  critical: { text: '緊急', color: 'red' }
};

/**
 * Blueprint Detail Component
 *
 * Shows blueprint information and associated tasks
 */
@Component({
  selector: 'app-blueprint-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzDescriptionsModule, NzStatisticModule, NzProgressModule, NzEmptyModule, DatePipe],
  template: `
    <page-header [title]="pageTitle()" [action]="actionTpl">
      <ng-template #breadcrumb>
        <nz-breadcrumb>
          <nz-breadcrumb-item>
            <a [routerLink]="['/blueprint/list']">藍圖列表</a>
          </nz-breadcrumb-item>
          <nz-breadcrumb-item>藍圖詳情</nz-breadcrumb-item>
        </nz-breadcrumb>
      </ng-template>
    </page-header>

    <ng-template #actionTpl>
      <button nz-button nzType="default" (click)="goBack()">
        <i nz-icon nzType="arrow-left" nzTheme="outline"></i>
        返回列表
      </button>
      <button nz-button nzType="primary" (click)="navigateToTasks()">
        <i nz-icon nzType="project" nzTheme="outline"></i>
        任務管理
      </button>
    </ng-template>

    <!-- Loading State -->
    @if (blueprintLoading()) {
      <nz-spin nzSimple [nzSize]="'large'" class="d-block text-center py-lg"></nz-spin>
    }

    <!-- Error State -->
    @if (blueprintError()) {
      <nz-alert nzType="error" nzShowIcon [nzMessage]="'載入失敗'" [nzDescription]="blueprintError()" class="mb-md">
        <ng-template #nzExtraTemplate>
          <button nz-button nzSize="small" (click)="goBack()">返回列表</button>
        </ng-template>
      </nz-alert>
    }

    <!-- Blueprint Not Found -->
    @if (!blueprintLoading() && !blueprintError() && !blueprint()) {
      <nz-card>
        <nz-empty nzNotFoundImage="simple" [nzNotFoundContent]="'找不到此藍圖'">
          <ng-template #nzNotFoundFooter>
            <button nz-button nzType="primary" (click)="goBack()">返回列表</button>
          </ng-template>
        </nz-empty>
      </nz-card>
    }

    <!-- Blueprint Content -->
    @if (!blueprintLoading() && blueprint()) {
      <!-- Blueprint Info Card -->
      <nz-card [nzTitle]="'藍圖資訊'" class="mb-md">
        <nz-descriptions [nzColumn]="{ xxl: 3, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }" nzBordered>
          <nz-descriptions-item [nzTitle]="'名稱'" [nzSpan]="1">
            {{ blueprint()?.name }}
          </nz-descriptions-item>
          <nz-descriptions-item [nzTitle]="'狀態'" [nzSpan]="1">
            <nz-tag [nzColor]="getStatusConfig(blueprint()?.status || '').color">
              {{ getStatusConfig(blueprint()?.status || '').text }}
            </nz-tag>
          </nz-descriptions-item>
          <nz-descriptions-item [nzTitle]="'可見性'" [nzSpan]="1">
            <nz-tag [nzColor]="getVisibilityConfig(blueprint()?.visibility || '').color">
              {{ getVisibilityConfig(blueprint()?.visibility || '').text }}
            </nz-tag>
          </nz-descriptions-item>
          <nz-descriptions-item [nzTitle]="'描述'" [nzSpan]="3">
            {{ blueprint()?.description || '無描述' }}
          </nz-descriptions-item>
          <nz-descriptions-item [nzTitle]="'標籤'" [nzSpan]="3">
            @if (blueprint()?.tags?.length) {
              @for (tag of blueprint()?.tags; track tag) {
                <nz-tag>{{ tag }}</nz-tag>
              }
            } @else {
              <span class="text-muted">無標籤</span>
            }
          </nz-descriptions-item>
          <nz-descriptions-item [nzTitle]="'建立時間'" [nzSpan]="1">
            {{ blueprint()?.createdAt | date: 'yyyy-MM-dd HH:mm' }}
          </nz-descriptions-item>
          <nz-descriptions-item [nzTitle]="'更新時間'" [nzSpan]="2">
            {{ blueprint()?.updatedAt | date: 'yyyy-MM-dd HH:mm' }}
          </nz-descriptions-item>
        </nz-descriptions>
      </nz-card>

      <!-- Task Statistics Card -->
      <nz-card [nzTitle]="'任務統計'" class="mb-md">
        <nz-row [nzGutter]="16">
          <nz-col [nzXs]="12" [nzSm]="6">
            <nz-statistic [nzValue]="taskStatistics().totalCount" [nzTitle]="'總任務數'" [nzPrefix]="totalPrefix">
              <ng-template #totalPrefix><i nz-icon nzType="project"></i></ng-template>
            </nz-statistic>
          </nz-col>
          <nz-col [nzXs]="12" [nzSm]="6">
            <nz-statistic
              [nzValue]="taskStatistics().pendingCount"
              [nzTitle]="'待處理'"
              [nzPrefix]="pendingPrefix"
              [nzValueStyle]="{ color: '#faad14' }"
            >
              <ng-template #pendingPrefix><i nz-icon nzType="clock-circle"></i></ng-template>
            </nz-statistic>
          </nz-col>
          <nz-col [nzXs]="12" [nzSm]="6">
            <nz-statistic
              [nzValue]="taskStatistics().inProgressCount"
              [nzTitle]="'進行中'"
              [nzPrefix]="progressPrefix"
              [nzValueStyle]="{ color: '#1890ff' }"
            >
              <ng-template #progressPrefix><i nz-icon nzType="loading"></i></ng-template>
            </nz-statistic>
          </nz-col>
          <nz-col [nzXs]="12" [nzSm]="6">
            <nz-statistic
              [nzValue]="taskStatistics().completedCount"
              [nzTitle]="'已完成'"
              [nzPrefix]="completedPrefix"
              [nzValueStyle]="{ color: '#52c41a' }"
            >
              <ng-template #completedPrefix><i nz-icon nzType="check-circle"></i></ng-template>
            </nz-statistic>
          </nz-col>
        </nz-row>

        @if (taskStatistics().totalCount > 0) {
          <div class="mt-md">
            <span class="mb-sm d-block">完成進度</span>
            <nz-progress [nzPercent]="completionPercent()" [nzStatus]="progressStatus()"></nz-progress>
          </div>
        }
      </nz-card>

      <!-- Tasks Preview Card -->
      <nz-card [nzTitle]="'任務列表'" [nzExtra]="taskExtraTpl">
        <ng-template #taskExtraTpl>
          <button nz-button nzType="link" (click)="navigateToTasks()">
            查看全部任務
            <i nz-icon nzType="arrow-right" nzTheme="outline"></i>
          </button>
        </ng-template>

        @if (tasksLoading()) {
          <nz-spin nzSimple class="d-block text-center py-md"></nz-spin>
        }

        @if (!tasksLoading() && tasks().length === 0) {
          <nz-empty nzNotFoundImage="simple" [nzNotFoundContent]="'此藍圖尚無任務'">
            <ng-template #nzNotFoundFooter>
              <button nz-button nzType="primary" (click)="navigateToTasks()">
                <i nz-icon nzType="plus" nzTheme="outline"></i>
                建立第一個任務
              </button>
            </ng-template>
          </nz-empty>
        }

        @if (!tasksLoading() && tasks().length > 0) {
          <nz-table #taskTable [nzData]="previewTasks()" [nzShowPagination]="false" nzSize="small" nzBordered>
            <thead>
              <tr>
                <th>任務名稱</th>
                <th nzWidth="100px">狀態</th>
                <th nzWidth="80px">優先級</th>
                <th nzWidth="150px">負責人</th>
                <th nzWidth="120px">到期日</th>
              </tr>
            </thead>
            <tbody>
              @for (task of taskTable.data; track task.id) {
                <tr>
                  <td>
                    <span class="task-name">{{ task.name }}</span>
                    @if (task.description) {
                      <span class="text-muted d-block text-truncate" style="max-width: 300px;">
                        {{ task.description }}
                      </span>
                    }
                  </td>
                  <td>
                    <nz-tag [nzColor]="getTaskStatusConfig(task.status).color">
                      {{ getTaskStatusConfig(task.status).text }}
                    </nz-tag>
                  </td>
                  <td>
                    <nz-tag [nzColor]="getTaskPriorityConfig(task.priority).color">
                      {{ getTaskPriorityConfig(task.priority).text }}
                    </nz-tag>
                  </td>
                  <td>
                    @if (task.assigneeIds && task.assigneeIds.length > 0) {
                      <nz-avatar [nzSize]="24" nzIcon="user" class="mr-sm"></nz-avatar>
                      <span>{{ task.assigneeIds.length }} 人</span>
                    } @else {
                      <span class="text-muted">未指派</span>
                    }
                  </td>
                  <td>
                    @if (task.dueDate) {
                      <span [class.text-danger]="isOverdue(task.dueDate)">
                        {{ task.dueDate | date: 'yyyy-MM-dd' }}
                      </span>
                    } @else {
                      <span class="text-muted">-</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </nz-table>

          @if (tasks().length > 5) {
            <div class="text-center mt-md">
              <button nz-button nzType="default" (click)="navigateToTasks()"> 查看全部 {{ tasks().length }} 個任務 </button>
            </div>
          }
        }
      </nz-card>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .py-lg {
        padding-top: 48px;
        padding-bottom: 48px;
      }

      .py-md {
        padding-top: 24px;
        padding-bottom: 24px;
      }

      .task-name {
        font-weight: 500;
      }

      .text-truncate {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .text-muted {
        color: rgba(0, 0, 0, 0.45);
      }

      .text-danger {
        color: #ff4d4f;
      }
    `
  ]
})
export class BlueprintDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly blueprintStore = inject(BlueprintStore);
  private readonly taskStore = inject(TaskStore);

  // Blueprint state
  readonly blueprint = this.blueprintStore.selectedBlueprint;
  readonly blueprintLoading = this.blueprintStore.blueprintLoading;
  readonly blueprintError = this.blueprintStore.blueprintError;

  // Task state
  readonly tasks = this.taskStore.tasks;
  readonly tasksLoading = this.taskStore.loading;
  readonly taskStatistics = this.taskStore.statistics;

  // Local state
  readonly blueprintId = signal<string | null>(null);

  // Computed properties
  readonly pageTitle = computed(() => {
    const bp = this.blueprint();
    return bp ? `藍圖：${bp.name}` : '藍圖詳情';
  });

  readonly previewTasks = computed(() => {
    return this.tasks().slice(0, 5);
  });

  readonly completionPercent = computed(() => {
    const stats = this.taskStatistics();
    if (stats.totalCount === 0) return 0;
    return Math.round((stats.completedCount / stats.totalCount) * 100);
  });

  readonly progressStatus = computed(() => {
    const percent = this.completionPercent();
    if (percent === 100) return 'success';
    if (percent >= 50) return 'active';
    return 'normal';
  });

  constructor() {
    // Monitor route param changes
    effect(() => {
      const id = this.blueprintId();
      if (id) {
        this.loadBlueprintData(id);
      }
    });
  }

  ngOnInit(): void {
    // Get blueprint ID from route
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.blueprintId.set(id);
      }
    });
  }

  /**
   * Load blueprint and tasks data
   */
  private async loadBlueprintData(id: string): Promise<void> {
    try {
      // Load blueprint
      await this.blueprintStore.getBlueprint(id);

      // Load tasks for this blueprint (using workspaceId as it's the blueprint context)
      await this.taskStore.loadWorkspaceTasks(id);
    } catch (error) {
      console.error('[BlueprintDetail] Failed to load data:', error);
    }
  }

  /**
   * Navigate back to list
   */
  goBack(): void {
    this.router.navigate(['/blueprint/list']);
  }

  /**
   * Navigate to task management
   */
  navigateToTasks(): void {
    const id = this.blueprintId();
    if (id) {
      // Navigate to task module with blueprint context
      this.router.navigate(['/blueprint/task'], {
        queryParams: { blueprintId: id }
      });
    }
  }

  /**
   * Get status configuration for display
   */
  getStatusConfig(status: string): { text: string; color: string } {
    return STATUS_CONFIG[status] || { text: status || '未知', color: 'default' };
  }

  /**
   * Get visibility configuration for display
   */
  getVisibilityConfig(visibility: string): { text: string; color: string } {
    return VISIBILITY_CONFIG[visibility] || { text: visibility || '未知', color: 'default' };
  }

  /**
   * Get task status configuration
   */
  getTaskStatusConfig(status: string): { text: string; color: string } {
    return TASK_STATUS_CONFIG[status] || { text: status || '未知', color: 'default' };
  }

  /**
   * Get task priority configuration
   */
  getTaskPriorityConfig(priority: string): { text: string; color: string } {
    return TASK_PRIORITY_CONFIG[priority] || { text: priority || '中', color: 'default' };
  }

  /**
   * Check if date is overdue
   */
  isOverdue(date: Date | string): boolean {
    const dueDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  }
}
