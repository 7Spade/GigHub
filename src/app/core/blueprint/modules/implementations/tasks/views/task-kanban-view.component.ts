/**
 * Task Kanban View Component
 * 任務看板視圖元件
 *
 * Displays tasks in Kanban board format with drag-and-drop
 *
 * @author GigHub Development Team
 * @date 2025-12-12
 */

import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Component, input, computed, inject } from '@angular/core';
import { TaskStore } from '@core/stores/task.store';
import { Task, TaskStatus } from '@core/types/task';
import { SHARED_IMPORTS } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-task-kanban-view',
  standalone: true,
  imports: [SHARED_IMPORTS, DragDropModule],
  template: `
    <div class="kanban-container">
      @if (loading()) {
        <nz-spin nzSimple />
      } @else if (error()) {
        <nz-alert nzType="error" [nzMessage]="error()" nzShowIcon />
      } @else {
        <div class="kanban-board">
          @for (column of columns(); track column.id) {
            <div class="kanban-column">
              <div class="column-header">
                <h3>{{ column.title }}</h3>
                <nz-badge [nzCount]="column.tasks.length" />
              </div>

              <div
                class="column-content"
                cdkDropList
                [id]="column.id"
                [cdkDropListData]="column.tasks"
                [cdkDropListConnectedTo]="connectedDropLists()"
                (cdkDropListDropped)="onDrop($event, column.status)"
              >
                @for (task of column.tasks; track task.id) {
                  <div class="task-card" cdkDrag>
                    <div class="task-card-header">
                      <span class="task-title">{{ task.title }}</span>
                      <nz-tag [nzColor]="getPriorityColor(task.priority)">
                        {{ getPriorityText(task.priority) }}
                      </nz-tag>
                    </div>

                    @if (task.description) {
                      <div class="task-description">{{ task.description }}</div>
                    }

                    @if (task.progress !== undefined) {
                      <div class="task-progress">
                        <nz-progress [nzPercent]="task.progress" nzSize="small" />
                      </div>
                    }

                    <div class="task-meta">
                      @if (task.assigneeName) {
                        <nz-avatar [nzText]="task.assigneeName.charAt(0)" nzSize="small" />
                        <span class="assignee-name">{{ task.assigneeName }}</span>
                      }
                      @if (task.dueDate) {
                        <span class="due-date">
                          <span nz-icon nzType="calendar" nzTheme="outline"></span>
                          {{ task.dueDate | date: 'MM/dd' }}
                        </span>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .kanban-container {
        height: 100%;
        overflow-x: auto;
        padding: 16px;
      }

      .kanban-board {
        display: flex;
        gap: 16px;
        min-width: fit-content;
      }

      .kanban-column {
        width: 300px;
        border-radius: 4px;
        display: flex;
        flex-direction: column;
      }

      .column-header {
        padding: 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .column-header h3 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
      }

      .column-content {
        flex: 1;
        padding: 8px;
        overflow-y: auto;
        min-height: 200px;
      }

      .task-card {
        background: white;
        border-radius: 4px;
        padding: 12px;
        margin-bottom: 8px;
        cursor: move;
      }

      .task-card:hover {
      }

      .task-card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 8px;
      }

      .task-title {
        font-weight: 500;
        flex: 1;
        margin-right: 8px;
      }

      .task-description {
        font-size: 12px;
        margin-bottom: 8px;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }

      .task-progress {
        margin-bottom: 8px;
      }

      .task-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
      }

      .assignee-name {
        flex: 1;
      }

      .due-date {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .cdk-drag-preview {
        opacity: 0.8;
      }

      .cdk-drag-placeholder {
        opacity: 0.4;
        border: 2px dashed;
      }

      .cdk-drop-list-dragging .task-card:not(.cdk-drag-placeholder) {
        transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
      }
    `
  ]
})
export class TaskKanbanViewComponent {
  private taskStore = inject(TaskStore);
  private message = inject(NzMessageService);

  // Inputs
  blueprintId = input.required<string>();

  // Expose store state
  readonly loading = this.taskStore.loading;
  readonly error = this.taskStore.error;

  // Kanban columns
  readonly columns = computed(() => {
    const tasks = this.taskStore.tasks();

    const columnDefs = [
      { id: TaskStatus.PENDING, title: '待處理', status: TaskStatus.PENDING },
      { id: TaskStatus.IN_PROGRESS, title: '進行中', status: TaskStatus.IN_PROGRESS },
      { id: TaskStatus.ON_HOLD, title: '暫停', status: TaskStatus.ON_HOLD },
      { id: TaskStatus.COMPLETED, title: '已完成', status: TaskStatus.COMPLETED }
    ];

    return columnDefs.map(col => ({
      ...col,
      tasks: tasks.filter(t => t.status === col.status)
    }));
  });

  readonly connectedDropLists = computed(() => this.columns().map(col => col.id));

  /**
   * Handle card drop event
   */
  async onDrop(event: CdkDragDrop<Task[]>, newStatus: string): Promise<void> {
    if (event.previousContainer === event.container) {
      // Same column - just reorder
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Different column - move and update status
      const task = event.previousContainer.data[event.previousIndex];

      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);

      // Update task status
      try {
        await this.taskStore.updateTaskStatus(
          this.blueprintId(),
          task.id!,
          newStatus as TaskStatus,
          'current-user' // TODO: Get from auth service
        );
        this.message.success('任務狀態已更新');
      } catch (error) {
        this.message.error('更新任務狀態失敗');
        // Revert the move
        transferArrayItem(event.container.data, event.previousContainer.data, event.currentIndex, event.previousIndex);
      }
    }
  }

  /**
   * Get priority color
   */
  getPriorityColor(priority: string): string {
    return 'default';
  }

  /**
   * Get priority text
   */
  getPriorityText(priority: string): string {
    const textMap: Record<string, string> = {
      critical: '緊急',
      high: '高',
      medium: '中',
      low: '低'
    };
    return textMap[priority] || priority;
  }
}
