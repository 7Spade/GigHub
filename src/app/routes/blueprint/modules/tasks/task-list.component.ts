import { Component, OnInit, inject, input } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ModalHelper } from '@delon/theme';
import { STColumn } from '@delon/abc/st';
import { SHARED_IMPORTS, OPTIONAL_ZORRO_MODULES } from '@shared';
import { Task, TaskStatus, LoggerService } from '@core';
import { TaskStore } from '@shared/services/task/task.store';

/**
 * Task List Component
 * 任務列表元件
 * 
 * Following Occam's Razor: Simple, focused task management
 * Uses ng-alain ST table for display
 * Uses Angular 20 Signals for state management
 */
@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [SHARED_IMPORTS, OPTIONAL_ZORRO_MODULES.space],
  template: `
    <nz-card nzTitle="任務管理" [nzExtra]="extra">
      <ng-template #extra>
        <nz-space>
          <button *nzSpaceItem nz-button nzType="primary" (click)="addTask()">
            <span nz-icon nzType="plus"></span>
            新增任務
          </button>
          <button *nzSpaceItem nz-button (click)="refresh()">
            <span nz-icon nzType="reload"></span>
            重新整理
          </button>
        </nz-space>
      </ng-template>

      @if (taskStore.loading()) {
        <nz-spin nzSimple></nz-spin>
      } @else if (taskStore.error()) {
        <nz-alert
          nzType="error"
          nzShowIcon
          [nzMessage]="'載入失敗'"
          [nzDescription]="taskStore.error() || '無法載入任務列表'"
          class="mb-md"
        />
      } @else {
        <!-- Task Statistics -->
        <div nz-row [nzGutter]="16" class="mb-md">
          <div nz-col [nzSpan]="8">
            <nz-statistic
              [nzValue]="taskStore.todoTasks().length"
              nzTitle="待辦"
              [nzValueStyle]="{ color: '#1890ff' }"
            />
          </div>
          <div nz-col [nzSpan]="8">
            <nz-statistic
              [nzValue]="taskStore.inProgressTasks().length"
              nzTitle="進行中"
              [nzValueStyle]="{ color: '#faad14' }"
            />
          </div>
          <div nz-col [nzSpan]="8">
            <nz-statistic
              [nzValue]="taskStore.completedTasks().length"
              nzTitle="已完成"
              [nzValueStyle]="{ color: '#52c41a' }"
            />
          </div>
        </div>

        <!-- Task Table -->
        <st
          #st
          [data]="taskStore.tasks() || []"
          [columns]="columns"
          [page]="{ show: true, showSize: true }"
        ></st>
      }
    </nz-card>
  `,
  styles: [`
    :host {
      display: block;
    }
    
    .mb-md {
      margin-bottom: 16px;
    }
  `]
})
export class TaskListComponent implements OnInit {
  private readonly message = inject(NzMessageService);
  private readonly modal = inject(ModalHelper);
  private readonly logger = inject(LoggerService);
  readonly taskStore = inject(TaskStore);

  // Input: blueprint ID
  blueprintId = input.required<string>();

  // Table columns
  columns: STColumn[] = [
    {
      title: '標題',
      index: 'title',
      width: '30%'
    },
    {
      title: '狀態',
      index: 'status',
      width: '120px',
      type: 'badge',
      badge: {
        todo: { text: '待辦', color: 'default' },
        in_progress: { text: '進行中', color: 'processing' },
        in_review: { text: '審核中', color: 'warning' },
        completed: { text: '已完成', color: 'success' },
        cancelled: { text: '已取消', color: 'default' }
      }
    },
    {
      title: '負責人',
      index: 'assigneeId',
      width: '150px',
      default: '-'
    },
    {
      title: '截止日期',
      index: 'dueDate',
      type: 'date',
      width: '120px',
      default: '-'
    },
    {
      title: '建立時間',
      index: 'createdAt',
      type: 'date',
      width: '150px',
      dateFormat: 'yyyy-MM-dd HH:mm'
    },
    {
      title: '操作',
      width: '200px',
      buttons: [
        {
          text: '編輯',
          type: 'link',
          click: (record: any) => this.editTask(record)
        },
        {
          text: '完成',
          type: 'link',
          iif: (record: any) => record.status !== TaskStatus.COMPLETED,
          click: (record: any) => this.completeTask(record)
        },
        {
          text: '刪除',
          type: 'del',
          pop: {
            title: '確定要刪除此任務嗎?',
            okType: 'danger'
          },
          click: (record: any) => this.deleteTask(record)
        }
      ]
    }
  ];

  ngOnInit(): void {
    this.loadTasks();
  }

  /**
   * Load tasks
   * 載入任務列表
   */
  private async loadTasks(): Promise<void> {
    try {
      await this.taskStore.loadTasks(this.blueprintId());
      this.logger.info('[TaskListComponent]', `Loaded tasks for blueprint: ${this.blueprintId()}`);
    } catch (error) {
      this.message.error('載入任務失敗');
      this.logger.error('[TaskListComponent]', 'Failed to load tasks', error as Error);
    }
  }

  /**
   * Refresh tasks
   * 重新整理任務
   */
  async refresh(): Promise<void> {
    await this.loadTasks();
    this.message.success('已重新整理');
  }

  /**
   * Add new task
   * 新增任務
   */
  async addTask(): Promise<void> {
    this.message.info('新增任務功能待實作');
    // TODO: Implement task modal
    // const { TaskModalComponent } = await import('./task-modal.component');
    // this.modal
    //   .createStatic(
    //     TaskModalComponent,
    //     { blueprintId: this.blueprintId() },
    //     { size: 'md' }
    //   )
    //   .subscribe((result) => {
    //     if (result) {
    //       this.loadTasks();
    //     }
    //   });
  }

  /**
   * Edit task
   * 編輯任務
   */
  async editTask(record: any): Promise<void> {
    this.message.info('編輯任務功能待實作');
    const task = record as Task;
    this.logger.info('[TaskListComponent]', `Edit task: ${task.id}`);
    // TODO: Implement task modal
  }

  /**
   * Complete task
   * 完成任務
   */
  async completeTask(record: any): Promise<void> {
    const task = record as Task;

    try {
      await this.taskStore.updateTaskStatus(task.id, TaskStatus.COMPLETED);
      this.message.success('任務已完成');
    } catch (error) {
      this.message.error('更新任務狀態失敗');
      this.logger.error('[TaskListComponent]', 'Failed to complete task', error as Error);
    }
  }

  /**
   * Delete task
   * 刪除任務
   */
  async deleteTask(record: any): Promise<void> {
    const task = record as Task;

    try {
      await this.taskStore.deleteTask(task.id);
      this.message.success('任務已刪除');
    } catch (error) {
      this.message.error('刪除任務失敗');
      this.logger.error('[TaskListComponent]', 'Failed to delete task', error as Error);
    }
  }
}
