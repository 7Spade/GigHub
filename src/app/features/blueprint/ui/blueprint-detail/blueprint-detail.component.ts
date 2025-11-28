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
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SHARED_IMPORTS } from '@shared';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';

import { BlueprintStore, TaskStore } from '../../data-access';
import { Task, TaskStatus, TaskPriority } from '../../domain';

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

/** Task status configuration - aligned with TaskStatus type */
const TASK_STATUS_CONFIG: Record<string, { text: string; color: string }> = {
  pending: { text: '待處理', color: 'default' },
  in_progress: { text: '進行中', color: 'processing' },
  completed: { text: '已完成', color: 'success' },
  cancelled: { text: '已取消', color: 'error' }
};

/** Task priority configuration - aligned with TaskPriority type */
const TASK_PRIORITY_CONFIG: Record<string, { text: string; color: string }> = {
  low: { text: '低', color: 'default' },
  medium: { text: '中', color: 'warning' },
  high: { text: '高', color: 'orange' },
  urgent: { text: '緊急', color: 'red' }
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
  imports: [
    SHARED_IMPORTS,
    NzDescriptionsModule,
    NzStatisticModule,
    NzProgressModule,
    NzEmptyModule,
    NzModalModule,
    NzPopconfirmModule,
    FormsModule,
    DatePipe
  ],
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
      <button nz-button nzType="primary" (click)="openCreateTaskModal()">
        <i nz-icon nzType="plus" nzTheme="outline"></i>
        新增任務
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
          <button nz-button nzType="primary" nzSize="small" (click)="openCreateTaskModal()">
            <i nz-icon nzType="plus" nzTheme="outline"></i>
            新增任務
          </button>
        </ng-template>

        @if (tasksLoading()) {
          <nz-spin nzSimple class="d-block text-center py-md"></nz-spin>
        }

        @if (!tasksLoading() && tasks().length === 0) {
          <nz-empty nzNotFoundImage="simple" [nzNotFoundContent]="'此藍圖尚無任務'">
            <ng-template #nzNotFoundFooter>
              <button nz-button nzType="primary" (click)="openCreateTaskModal()">
                <i nz-icon nzType="plus" nzTheme="outline"></i>
                建立第一個任務
              </button>
            </ng-template>
          </nz-empty>
        }

        @if (!tasksLoading() && tasks().length > 0) {
          <nz-table #taskTable [nzData]="tasks()" [nzPageSize]="10" nzSize="small" nzBordered>
            <thead>
              <tr>
                <th>任務名稱</th>
                <th nzWidth="100px">狀態</th>
                <th nzWidth="80px">優先級</th>
                <th nzWidth="150px">負責人</th>
                <th nzWidth="120px">到期日</th>
                <th nzWidth="150px">操作</th>
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
                  <td>
                    <button nz-button nzType="link" nzSize="small" (click)="openEditTaskModal(task)">
                      <i nz-icon nzType="edit" nzTheme="outline"></i>
                      編輯
                    </button>
                    <button
                      nz-button
                      nzType="link"
                      nzDanger
                      nzSize="small"
                      nz-popconfirm
                      nzPopconfirmTitle="確定要刪除此任務嗎？"
                      (nzOnConfirm)="deleteTask(task)"
                    >
                      <i nz-icon nzType="delete" nzTheme="outline"></i>
                      刪除
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </nz-table>
        }
      </nz-card>

      <!-- Task Create/Edit Modal -->
      <nz-modal
        [(nzVisible)]="isTaskModalVisible"
        [nzTitle]="taskModalTitle()"
        [nzOkText]="isEditMode() ? '更新' : '建立'"
        [nzOkLoading]="taskSaving()"
        (nzOnOk)="saveTask()"
        (nzOnCancel)="closeTaskModal()"
        nzWidth="600px"
      >
        <ng-container *nzModalContent>
          <form nz-form nzLayout="vertical">
            <nz-form-item>
              <nz-form-label nzRequired>任務名稱</nz-form-label>
              <nz-form-control nzErrorTip="請輸入任務名稱">
                <input nz-input [(ngModel)]="taskForm.name" name="name" placeholder="請輸入任務名稱" required />
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label>任務描述</nz-form-label>
              <nz-form-control>
                <textarea
                  nz-input
                  [(ngModel)]="taskForm.description"
                  name="description"
                  placeholder="請輸入任務描述"
                  [nzAutosize]="{ minRows: 3, maxRows: 6 }"
                ></textarea>
              </nz-form-control>
            </nz-form-item>

            <nz-row [nzGutter]="16">
              <nz-col [nzSpan]="12">
                <nz-form-item>
                  <nz-form-label>狀態</nz-form-label>
                  <nz-form-control>
                    <nz-select [(ngModel)]="taskForm.status" name="status" nzPlaceHolder="選擇狀態">
                      @for (status of taskStatusOptions; track status.value) {
                        <nz-option [nzValue]="status.value" [nzLabel]="status.label"></nz-option>
                      }
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>
              </nz-col>
              <nz-col [nzSpan]="12">
                <nz-form-item>
                  <nz-form-label>優先級</nz-form-label>
                  <nz-form-control>
                    <nz-select [(ngModel)]="taskForm.priority" name="priority" nzPlaceHolder="選擇優先級">
                      @for (priority of taskPriorityOptions; track priority.value) {
                        <nz-option [nzValue]="priority.value" [nzLabel]="priority.label"></nz-option>
                      }
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>
              </nz-col>
            </nz-row>

            <nz-form-item>
              <nz-form-label>到期日</nz-form-label>
              <nz-form-control>
                <nz-date-picker
                  [(ngModel)]="taskForm.dueDate"
                  name="dueDate"
                  nzPlaceHolder="選擇到期日"
                  style="width: 100%"
                ></nz-date-picker>
              </nz-form-control>
            </nz-form-item>
          </form>
        </ng-container>
      </nz-modal>
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
  private readonly message = inject(NzMessageService);
  private readonly modal = inject(NzModalService);

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

  // Modal state
  isTaskModalVisible = false;
  readonly taskSaving = signal(false);
  readonly editingTask = signal<Task | null>(null);

  // Task form
  taskForm: {
    name: string;
    description: string;
    status: string;
    priority: string;
    dueDate: Date | null;
  } = this.getEmptyTaskForm();

  // Task options - aligned with TaskStatus and TaskPriority types
  readonly taskStatusOptions = [
    { value: 'pending', label: '待處理' },
    { value: 'in_progress', label: '進行中' },
    { value: 'completed', label: '已完成' },
    { value: 'cancelled', label: '已取消' }
  ];

  readonly taskPriorityOptions = [
    { value: 'low', label: '低' },
    { value: 'medium', label: '中' },
    { value: 'high', label: '高' },
    { value: 'urgent', label: '緊急' }
  ];

  // Computed properties
  readonly pageTitle = computed(() => {
    const bp = this.blueprint();
    return bp ? `藍圖：${bp.name}` : '藍圖詳情';
  });

  readonly taskModalTitle = computed(() => {
    return this.editingTask() ? '編輯任務' : '新增任務';
  });

  readonly isEditMode = computed(() => {
    return this.editingTask() !== null;
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

  // ==================== Task CRUD Operations ====================

  /**
   * Open create task modal
   */
  openCreateTaskModal(): void {
    this.editingTask.set(null);
    this.taskForm = this.getEmptyTaskForm();
    this.isTaskModalVisible = true;
  }

  /**
   * Open edit task modal
   */
  openEditTaskModal(task: Task): void {
    this.editingTask.set(task);
    this.taskForm = {
      name: task.name,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate) : null
    };
    this.isTaskModalVisible = true;
  }

  /**
   * Close task modal
   */
  closeTaskModal(): void {
    this.isTaskModalVisible = false;
    this.editingTask.set(null);
    this.taskForm = this.getEmptyTaskForm();
  }

  /**
   * Save task (create or update)
   */
  async saveTask(): Promise<void> {
    if (!this.taskForm.name?.trim()) {
      this.message.warning('請輸入任務名稱');
      return;
    }

    const blueprintId = this.blueprintId();
    if (!blueprintId) {
      this.message.error('無法取得藍圖 ID');
      return;
    }

    this.taskSaving.set(true);

    try {
      const taskData = {
        name: this.taskForm.name.trim(),
        description: this.taskForm.description?.trim() || undefined,
        status: this.taskForm.status as TaskStatus,
        priority: this.taskForm.priority as TaskPriority,
        dueDate: this.taskForm.dueDate || undefined,
        workspaceId: blueprintId
      };

      const editing = this.editingTask();
      if (editing) {
        // Update existing task
        await this.taskStore.updateTask(editing.id, taskData);
        this.message.success('任務更新成功');
      } else {
        // Create new task
        await this.taskStore.createTask(taskData);
        this.message.success('任務建立成功');
      }

      this.closeTaskModal();
      // Reload tasks to refresh the list
      await this.taskStore.loadWorkspaceTasks(blueprintId);
    } catch (error) {
      console.error('[BlueprintDetail] Failed to save task:', error);
      this.message.error(this.editingTask() ? '任務更新失敗' : '任務建立失敗');
    } finally {
      this.taskSaving.set(false);
    }
  }

  /**
   * Delete a task
   */
  async deleteTask(task: Task): Promise<void> {
    const blueprintId = this.blueprintId();
    if (!blueprintId) {
      this.message.error('無法取得藍圖 ID');
      return;
    }

    try {
      await this.taskStore.deleteTask(task.id);
      this.message.success('任務刪除成功');
      // Reload tasks to refresh the list
      await this.taskStore.loadWorkspaceTasks(blueprintId);
    } catch (error) {
      console.error('[BlueprintDetail] Failed to delete task:', error);
      this.message.error('任務刪除失敗');
    }
  }

  /**
   * Get empty task form
   */
  private getEmptyTaskForm() {
    return {
      name: '',
      description: '',
      status: 'pending',
      priority: 'medium',
      dueDate: null as Date | null
    };
  }

  // ==================== Helper Methods ====================

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
