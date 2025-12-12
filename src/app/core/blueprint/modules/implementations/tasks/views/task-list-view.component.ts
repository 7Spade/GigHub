/**
 * Task List View Component
 * 任務列表視圖元件
 *
 * Displays tasks in table format using ST (Simple Table)
 *
 * @author GigHub Development Team
 * @date 2025-12-12
 */

import { Component, input, output, inject } from '@angular/core';
import { STColumn } from '@delon/abc/st';
import { SHARED_IMPORTS } from '@shared';
import { Task, TaskStatus, TaskPriority } from '@core/types/task';
import { TaskStore } from '@core/stores/task.store';

@Component({
  selector: 'app-task-list-view',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <div class="list-view-container">
      @if (loading()) {
        <nz-spin nzSimple />
      } @else if (error()) {
        <nz-alert nzType="error" [nzMessage]="error()" nzShowIcon />
      } @else {
        <st 
          [data]="tasks()" 
          [columns]="columns" 
          [page]="{ show: true, showSize: true }" 
          [loading]="loading()"
        />
      }
    </div>
  `,
  styles: [
    `
      .list-view-container {
        height: 100%;
        overflow: auto;
      }
    `
  ]
})
export class TaskListViewComponent {
  private taskStore = inject(TaskStore);

  // Inputs
  blueprintId = input.required<string>();

  // Outputs
  editTask = output<Task>();
  deleteTask = output<Task>();

  // Expose store state
  readonly tasks = this.taskStore.tasks;
  readonly loading = this.taskStore.loading;
  readonly error = this.taskStore.error;

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
      title: '進度',
      index: 'progress',
      width: 120,
      render: 'progressTpl',
      renderTitle: 'progressTitle'
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
          click: (record: any) => this.editTask.emit(record)
        },
        {
          text: '刪除',
          icon: 'delete',
          type: 'del',
          pop: {
            title: '確認刪除？',
            okType: 'danger'
          },
          click: (record: any) => this.deleteTask.emit(record)
        }
      ]
    }
  ];
}
