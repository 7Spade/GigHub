/**
 * Tasks Component
 *
 * Angular UI component for task management.
 * Uses Angular 20 Signals and modern syntax.
 *
 * @author GigHub Development Team
 * @date 2025-12-10
 */

import { Component, OnInit, inject, signal, computed, input, effect } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { STColumn, STData } from '@delon/abc/st';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { SHARED_IMPORTS } from '@shared';

import { TaskStatus, TaskPriority, CreateTaskData } from './tasks.repository';
import { TasksService } from './tasks.service';
import { TaskModalComponent } from './task-modal.component';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-card [nzTitle]="'任務統計'" [nzExtra]="statsExtra">
      <nz-row [nzGutter]="16">
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="taskStats().total" [nzTitle]="'總任務數'" [nzPrefix]="totalIcon"> </nz-statistic>
        </nz-col>
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="taskStats().pending" [nzTitle]="'待處理'" [nzValueStyle]="{ color: '#faad14' }"> </nz-statistic>
        </nz-col>
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="taskStats().inProgress" [nzTitle]="'進行中'" [nzValueStyle]="{ color: '#1890ff' }"> </nz-statistic>
        </nz-col>
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="taskStats().completed" [nzTitle]="'已完成'" [nzValueStyle]="{ color: '#52c41a' }"> </nz-statistic>
        </nz-col>
      </nz-row>

      <ng-template #statsExtra>
        <button nz-button nzType="primary" (click)="showCreateTaskModal()">
          <span nz-icon nzType="plus"></span>
          新增任務
        </button>
      </ng-template>

      <ng-template #totalIcon>
        <span nz-icon nzType="check-circle"></span>
      </ng-template>
    </nz-card>

    <nz-card [nzTitle]="'任務列表'" style="margin-top: 16px;">
      @if (tasksService.loading()) {
        <nz-spin nzSimple />
      } @else if (tasksService.error()) {
        <nz-alert nzType="error" [nzMessage]="tasksService.error()" nzShowIcon> </nz-alert>
      } @else {
        <st [data]="tasksService.tasks()" [columns]="columns" [page]="{ show: true, showSize: true }" [loading]="tasksService.loading()">
        </st>
      }
    </nz-card>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `
  ]
})
export class TasksComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private modal = inject(NzModalService);
  private message = inject(NzMessageService);
  readonly tasksService = inject(TasksService);

  // Input from parent (Angular 19+ input() function)
  blueprintId = input<string>();
  
  // Internal state
  private _blueprintId = signal<string>('');
  blueprintName = signal<string>('任務管理');
  
  constructor() {
    // Watch for blueprintId input changes
    effect(() => {
      const id = this.blueprintId();
      if (id) {
        this._blueprintId.set(id);
        this.loadTasks(id);
      }
    });
  }

  // Computed from service
  taskStats = this.tasksService.taskStats;

  // ST Table columns
  columns: STColumn[] = [
    {
      title: 'ID',
      index: 'id',
      width: 100,
      className: 'text-truncate'
    },
    {
      title: '標題',
      index: 'title',
      width: 200
    },
    {
      title: '狀態',
      index: 'status',
      type: 'badge',
      width: 100,
      badge: {
        [TaskStatus.PENDING]: { text: '待處理', color: 'default' },
        [TaskStatus.IN_PROGRESS]: { text: '進行中', color: 'processing' },
        [TaskStatus.ON_HOLD]: { text: '暫停', color: 'warning' },
        [TaskStatus.COMPLETED]: { text: '已完成', color: 'success' },
        [TaskStatus.CANCELLED]: { text: '已取消', color: 'error' }
      }
    },
    {
      title: '優先級',
      index: 'priority',
      type: 'badge',
      width: 100,
      badge: {
        [TaskPriority.CRITICAL]: { text: '緊急', color: 'error' },
        [TaskPriority.HIGH]: { text: '高', color: 'warning' },
        [TaskPriority.MEDIUM]: { text: '中', color: 'processing' },
        [TaskPriority.LOW]: { text: '低', color: 'default' }
      }
    },
    {
      title: '負責人',
      index: 'assigneeName',
      width: 120,
      default: '未分配'
    },
    {
      title: '到期日',
      index: 'dueDate',
      type: 'date',
      width: 120,
      dateFormat: 'yyyy-MM-dd'
    },
    {
      title: '建立時間',
      index: 'createdAt',
      type: 'date',
      width: 150,
      dateFormat: 'yyyy-MM-dd HH:mm',
      sort: true
    },
    {
      title: '操作',
      width: 180,
      buttons: [
        {
          text: '編輯',
          icon: 'edit',
          click: (record: any) => this.editTask(record)
        },
        {
          text: '刪除',
          icon: 'delete',
          type: 'del',
          pop: {
            title: '確認刪除？',
            okType: 'danger'
          },
          click: (record: any) => this.deleteTask(record)
        }
      ]
    }
  ];

  ngOnInit(): void {
    // Also check route params for backwards compatibility
    this.route.params.subscribe(params => {
      const routeBlueprintId = params['id'] || params['blueprintId'];
      if (routeBlueprintId && !this.blueprintId()) {
        this._blueprintId.set(routeBlueprintId);
        this.loadTasks(routeBlueprintId);
      }
    });
  }

  loadTasks(blueprintId: string): void {
    this.tasksService.loadTasks(blueprintId);
  }

  showCreateTaskModal(): void {
    const blueprintId = this._blueprintId();
    if (!blueprintId) {
      this.message.warning('請先選擇藍圖');
      return;
    }

    const modalRef = this.modal.create({
      nzTitle: '新增任務',
      nzContent: TaskModalComponent,
      nzData: {
        blueprintId: blueprintId,
        mode: 'create'
      },
      nzWidth: 800,
      nzFooter: null,
      nzMaskClosable: false
    });

    modalRef.afterClose.subscribe((result) => {
      if (result?.success) {
        this.message.success('任務新增成功');
        // Task is already added to service state by the service
      }
    });
  }

  editTask(task: any): void {
    const blueprintId = this._blueprintId();
    if (!blueprintId) {
      this.message.warning('請先選擇藍圖');
      return;
    }

    const modalRef = this.modal.create({
      nzTitle: '編輯任務',
      nzContent: TaskModalComponent,
      nzData: {
        blueprintId: blueprintId,
        task: task,
        mode: 'edit'
      },
      nzWidth: 800,
      nzFooter: null,
      nzMaskClosable: false
    });

    modalRef.afterClose.subscribe((result) => {
      if (result?.success) {
        this.message.success('任務更新成功');
        // Task is already updated in service state
      }
    });
  }

  async deleteTask(task: any): Promise<void> {
    try {
      const blueprintId = this._blueprintId();
      if (blueprintId && task.id) {
        await this.tasksService.deleteTask(blueprintId, task.id, 'current-user');
      }
    } catch (error) {
      console.error('Delete task failed:', error);
    }
  }
}
