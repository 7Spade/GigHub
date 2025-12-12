/**
 * Task Gantt View Component
 * 任務甘特圖視圖元件
 *
 * Displays tasks in Gantt chart format (basic implementation)
 *
 * @author GigHub Development Team
 * @date 2025-12-12
 */

import { Component, input, computed, inject } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { Task, GanttTask } from '@core/types/task';
import { TaskStore } from '@core/stores/task.store';

@Component({
  selector: 'app-task-gantt-view',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <div class="gantt-container">
      @if (loading()) {
        <nz-spin nzSimple />
      } @else if (error()) {
        <nz-alert nzType="error" [nzMessage]="error()" nzShowIcon />
      } @else {
        <div class="gantt-header">
          <h3>甘特圖視圖</h3>
          <nz-alert 
            nzType="info" 
            nzMessage="基礎甘特圖實現" 
            nzDescription="顯示任務起始日期與持續時間的簡化視圖"
            nzShowIcon
          />
        </div>

        <div class="gantt-chart">
          <div class="gantt-timeline">
            <div class="timeline-header">
              <div class="task-names">任務名稱</div>
              <div class="timeline-dates">
                @for (date of timelineMonths(); track date) {
                  <div class="date-cell">{{ date }}</div>
                }
              </div>
            </div>
          </div>

          <div class="gantt-tasks">
            @for (ganttTask of ganttTasks(); track ganttTask.id) {
              <div class="gantt-row">
                <div class="task-name">
                  {{ ganttTask.name }}
                  <nz-tag [nzColor]="getPriorityColor(ganttTask)">
                    {{ ganttTask.progress }}%
                  </nz-tag>
                </div>
                <div class="task-timeline">
                  <div 
                    class="task-bar"
                    [style.left.%]="getTaskPosition(ganttTask)"
                    [style.width.%]="getTaskWidth(ganttTask)"
                    [style.background-color]="ganttTask.color"
                  >
                    <div class="task-bar-progress" [style.width.%]="ganttTask.progress"></div>
                    <span class="task-bar-label">
                      {{ ganttTask.start | date: 'MM/dd' }} - {{ ganttTask.end | date: 'MM/dd' }}
                    </span>
                  </div>
                </div>
              </div>
            }
          </div>

          @if (ganttTasks().length === 0) {
            <nz-empty nzNotFoundContent="暫無任務" />
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .gantt-container {
        height: 100%;
        overflow: auto;
        padding: 16px;
      }

      .gantt-header {
        margin-bottom: 16px;
      }

      .gantt-header h3 {
        margin-bottom: 8px;
      }

      .gantt-chart {
        background: white;
        border: 1px solid #e8e8e8;
        border-radius: 4px;
        overflow: hidden;
      }

      .gantt-timeline {
        border-bottom: 2px solid #e8e8e8;
      }

      .timeline-header {
        display: flex;
        background: #fafafa;
      }

      .task-names {
        width: 200px;
        padding: 12px;
        font-weight: 600;
        border-right: 1px solid #e8e8e8;
      }

      .timeline-dates {
        flex: 1;
        display: flex;
      }

      .date-cell {
        flex: 1;
        padding: 12px;
        text-align: center;
        border-right: 1px solid #f0f0f0;
        font-size: 12px;
        font-weight: 500;
      }

      .gantt-tasks {
        max-height: 600px;
        overflow-y: auto;
      }

      .gantt-row {
        display: flex;
        border-bottom: 1px solid #f0f0f0;
      }

      .gantt-row:hover {
        background: #fafafa;
      }

      .task-name {
        width: 200px;
        padding: 12px;
        border-right: 1px solid #e8e8e8;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 13px;
      }

      .task-timeline {
        flex: 1;
        position: relative;
        padding: 8px 4px;
      }

      .task-bar {
        position: absolute;
        height: 24px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 11px;
        font-weight: 500;
        overflow: hidden;
      }

      .task-bar-progress {
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        background: rgba(255, 255, 255, 0.3);
      }

      .task-bar-label {
        position: relative;
        z-index: 1;
      }
    `
  ]
})
export class TaskGanttViewComponent {
  private taskStore = inject(TaskStore);

  // Inputs
  blueprintId = input.required<string>();

  // Expose store state
  readonly loading = this.taskStore.loading;
  readonly error = this.taskStore.error;

  // Timeline range (6 months)
  readonly timelineMonths = computed(() => {
    const months = [];
    const today = new Date();
    for (let i = -2; i < 4; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
      months.push(date.toLocaleDateString('zh-TW', { year: 'numeric', month: 'short' }));
    }
    return months;
  });

  // Convert tasks to gantt format
  readonly ganttTasks = computed(() => {
    const tasks = this.taskStore.tasks();
    
    return tasks
      .filter(task => task.startDate || task.dueDate)
      .map(task => {
        const start = task.startDate ? new Date(task.startDate) : new Date();
        const end = task.dueDate ? new Date(task.dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        
        return {
          id: task.id!,
          name: task.title,
          start,
          end,
          progress: task.progress ?? 0,
          color: this.getStatusColor(task.status),
          task
        } as GanttTask & { task: Task };
      });
  });

  // Timeline start and end dates
  private timelineStart = computed(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth() - 2, 1);
  });

  private timelineEnd = computed(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth() + 4, 0);
  });

  /**
   * Calculate task position on timeline (left offset %)
   */
  getTaskPosition(ganttTask: GanttTask): number {
    const start = this.timelineStart().getTime();
    const end = this.timelineEnd().getTime();
    const taskStart = ganttTask.start.getTime();
    
    const position = ((taskStart - start) / (end - start)) * 100;
    return Math.max(0, Math.min(100, position));
  }

  /**
   * Calculate task width on timeline (%)
   */
  getTaskWidth(ganttTask: GanttTask): number {
    const start = this.timelineStart().getTime();
    const end = this.timelineEnd().getTime();
    const taskStart = ganttTask.start.getTime();
    const taskEnd = ganttTask.end.getTime();
    
    const width = ((taskEnd - taskStart) / (end - start)) * 100;
    return Math.max(1, Math.min(100, width));
  }

  /**
   * Get status color
   */
  getStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      pending: '#d9d9d9',
      in_progress: '#1890ff',
      on_hold: '#faad14',
      completed: '#52c41a',
      cancelled: '#ff4d4f'
    };
    return colorMap[status] || '#d9d9d9';
  }

  /**
   * Get priority color
   */
  getPriorityColor(ganttTask: GanttTask & { task?: Task }): string {
    if (!ganttTask.task) return 'default';
    const colorMap: Record<string, string> = {
      critical: 'red',
      high: 'orange',
      medium: 'blue',
      low: 'default'
    };
    return colorMap[ganttTask.task.priority] || 'default';
  }
}
