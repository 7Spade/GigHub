/**
 * Task Gantt View Component
 * 任務甘特圖視圖元件
 *
 * Displays tasks in Gantt chart format with enhanced features:
 * - Multiple zoom levels (day/week/month)
 * - Task dependencies visualization
 * - Milestone markers
 * - Progress indicators
 *
 * @author GigHub Development Team
 * @date 2025-12-12
 */

import { Component, input, output, computed, inject, signal } from '@angular/core';
import { TaskStore } from '@core/stores/task.store';
import { Task, GanttTask } from '@core/types/task';
import { SHARED_IMPORTS } from '@shared';
import { NzEmptyModule } from 'ng-zorro-antd/empty';

/** Zoom level enum */
enum ZoomLevel {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month'
}

@Component({
  selector: 'app-task-gantt-view',
  standalone: true,
  imports: [SHARED_IMPORTS, NzEmptyModule],
  template: `
    <div class="gantt-container">
      @if (loading()) {
        <nz-spin nzSimple />
      } @else if (error()) {
        <nz-alert nzType="error" [nzMessage]="error()" nzShowIcon />
      } @else {
        <div class="gantt-header">
          <div class="header-row">
            <h3>甘特圖視圖</h3>
            <nz-space>
              <nz-radio-group *nzSpaceItem [(ngModel)]="zoomLevel" aria-label="選擇甘特圖時間視圖">
                <label nz-radio-button [nzValue]="'day'" aria-label="切換到日視圖顯示60天範圍">日視圖</label>
                <label nz-radio-button [nzValue]="'week'" aria-label="切換到週視圖顯示24週範圍">週視圖</label>
                <label nz-radio-button [nzValue]="'month'" aria-label="切換到月視圖顯示12個月範圍">月視圖</label>
              </nz-radio-group>
              <nz-tag *nzSpaceItem [nzColor]="'blue'"> 共 {{ ganttTasks().length }} 個任務 </nz-tag>
            </nz-space>
          </div>
        </div>

        @if (ganttTasks().length === 0) {
          <nz-empty nzNotFoundContent="暫無包含日期的任務" nzNotFoundImage="simple" />
        } @else {
          <div class="gantt-chart">
            <div class="gantt-timeline">
              <div class="timeline-header">
                <div class="task-names-header">任務名稱</div>
                <div class="timeline-dates">
                  @for (period of timelinePeriods(); track period.label) {
                    <div class="date-cell" [style.flex]="period.flex || 1">
                      {{ period.label }}
                    </div>
                  }
                </div>
              </div>
            </div>

            <div class="gantt-tasks">
              @for (ganttTask of ganttTasks(); track ganttTask.id) {
                <div class="gantt-row" [class.milestone]="ganttTask.milestone">
                  <div class="task-name">
                    <div class="task-info">
                      @if (ganttTask.milestone) {
                        <span nz-icon nzType="flag" nzTheme="fill" class="milestone-icon"></span>
                      }
                      <span class="task-title">{{ ganttTask.name }}</span>
                      <nz-tag [nzColor]="getPriorityColor(ganttTask)" nzSize="small"> {{ ganttTask.progress }}% </nz-tag>
                      <!-- Action buttons -->
                      <span class="task-actions">
                        <button nz-button nzType="text" nzSize="small" (click)="handleEdit(ganttTask.task)" title="編輯">
                          <span nz-icon nzType="edit" nzTheme="outline"></span>
                        </button>
                        <button nz-button nzType="text" nzSize="small" nzDanger (click)="handleDelete(ganttTask.task)" title="刪除">
                          <span nz-icon nzType="delete" nzTheme="outline"></span>
                        </button>
                      </span>
                    </div>
                  </div>
                  <div class="task-timeline">
                    <!-- Dependencies lines -->
                    @for (depId of ganttTask.dependencies || []; track depId) {
                      <div
                        class="dependency-line"
                        [style.left.%]="getDependencyLinePosition(ganttTask, depId)"
                        [style.width.%]="getDependencyLineWidth(ganttTask, depId)"
                      >
                      </div>
                    }

                    <!-- Task bar -->
                    @if (ganttTask.milestone) {
                      <div
                        class="milestone-marker"
                        [style.left.%]="getTaskPosition(ganttTask)"
                        [title]="ganttTask.name"
                        [attr.aria-label]="'里程碑: ' + ganttTask.name"
                        role="img"
                      >
                        <span nz-icon nzType="flag" nzTheme="fill"></span>
                      </div>
                    } @else {
                      <div
                        class="task-bar"
                        [class.has-dependencies]="ganttTask.dependencies && ganttTask.dependencies.length > 0"
                        [style.left.%]="getTaskPosition(ganttTask)"
                        [style.width.%]="getTaskWidth(ganttTask)"
                        [style.background-color]="ganttTask.color"
                        [title]="getTaskTooltip(ganttTask)"
                      >
                        <div class="task-bar-progress" [style.width.%]="ganttTask.progress"></div>
                        <span class="task-bar-label">
                          @if (zoomLevel() === 'day') {
                            {{ ganttTask.start | date: 'M/d' }} - {{ ganttTask.end | date: 'M/d' }}
                          } @else if (zoomLevel() === 'week') {
                            {{ ganttTask.start | date: 'M/d' }}
                          } @else {
                            {{ getDurationDays(ganttTask) }}d
                          }
                        </span>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        }
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
        padding-bottom: 12px;
        border-bottom: 1px solid #f0f0f0;
      }

      .header-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .gantt-header h3 {
        margin: 0;
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

      .task-names-header {
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
        padding: 12px 4px;
        text-align: center;
        border-right: 1px solid #f0f0f0;
        font-size: 11px;
        font-weight: 500;
      }

      .gantt-tasks {
        max-height: 600px;
        overflow-y: auto;
      }

      .gantt-row {
        display: flex;
        border-bottom: 1px solid #f0f0f0;
        min-height: 40px;
      }

      .gantt-row:hover {
        background: #fafafa;
      }

      .gantt-row.milestone {
        background: #fff7e6;
      }

      .task-name {
        width: 200px;
        padding: 8px 12px;
        border-right: 1px solid #e8e8e8;
        display: flex;
        align-items: center;
      }

      .task-info {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
      }

      .task-title {
        flex: 1;
        font-size: 13px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .task-actions {
        display: none;
        gap: 4px;
        margin-left: auto;
      }

      .gantt-row:hover .task-actions {
        display: flex;
      }

      .task-actions button {
        padding: 0 4px;
      }

      .milestone-icon {
        color: #faad14;
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
        font-size: 10px;
        font-weight: 500;
        overflow: hidden;
        cursor: pointer;
        transition: all 0.2s;
      }

      .task-bar:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      }

      .task-bar.has-dependencies {
        border: 2px solid #1890ff;
      }

      .task-bar-progress {
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        background: rgba(255, 255, 255, 0.3);
        border-right: 2px solid rgba(255, 255, 255, 0.5);
      }

      .task-bar-label {
        position: relative;
        z-index: 1;
        padding: 0 8px;
      }

      .milestone-marker {
        position: absolute;
        top: 50%;
        transform: translate(-50%, -50%);
        font-size: 20px;
        color: #faad14;
        cursor: pointer;
        z-index: 10;
      }

      .milestone-marker:hover {
        color: #ff7a00;
        transform: translate(-50%, -50%) scale(1.2);
      }

      .dependency-line {
        position: absolute;
        top: 50%;
        height: 2px;
        background: #1890ff;
        opacity: 0.5;
        z-index: 1;
      }

      .dependency-line::after {
        content: '';
        position: absolute;
        right: 0;
        top: -3px;
        width: 0;
        height: 0;
        border-left: 6px solid #1890ff;
        border-top: 4px solid transparent;
        border-bottom: 4px solid transparent;
      }
    `
  ]
})
export class TaskGanttViewComponent {
  private taskStore = inject(TaskStore);

  // Inputs
  blueprintId = input.required<string>();

  // Outputs for CRUD operations
  editTask = output<Task>();
  deleteTask = output<Task>();

  // Zoom level signal
  zoomLevel = signal<ZoomLevel>(ZoomLevel.MONTH);

  // Expose store state
  readonly loading = this.taskStore.loading;
  readonly error = this.taskStore.error;

  // Timeline periods based on zoom level
  readonly timelinePeriods = computed(() => {
    const zoom = this.zoomLevel();
    const today = new Date();
    const periods: Array<{ label: string; flex?: number }> = [];

    if (zoom === ZoomLevel.DAY) {
      // Show 60 days (2 months)
      for (let i = -15; i < 45; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        periods.push({
          label: date.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })
        });
      }
    } else if (zoom === ZoomLevel.WEEK) {
      // Show 24 weeks (6 months)
      for (let i = -8; i < 16; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i * 7);
        const weekNum = this.getWeekNumber(date);
        periods.push({
          label: `W${weekNum}`
        });
      }
    } else {
      // Show 12 months (1 year)
      for (let i = -3; i < 9; i++) {
        const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
        periods.push({
          label: date.toLocaleDateString('zh-TW', { year: 'numeric', month: 'short' })
        });
      }
    }

    return periods;
  });

  // Convert tasks to gantt format
  readonly ganttTasks = computed(() => {
    const tasks = this.taskStore.tasks();

    return tasks
      .filter(task => task.startDate || task.dueDate)
      .map(task => {
        const start = task.startDate ? new Date(task.startDate) : new Date();
        const end = task.dueDate ? new Date(task.dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        // Check if milestone (task with same start and end date, or marked as milestone)
        const isMilestone =
          (task.metadata && typeof task.metadata === 'object' && task.metadata !== null && task.metadata['milestone'] === true) ||
          start.getTime() === end.getTime();

        return {
          id: task.id!,
          name: task.title,
          start,
          end,
          progress: task.progress ?? 0,
          color: this.getStatusColor(task.status),
          dependencies: task.dependencies || [],
          milestone: isMilestone,
          task
        } as GanttTask & { task: Task };
      });
  });

  // Task lookup map for better performance (O(1) lookup instead of O(n))
  readonly ganttTaskMap = computed(() => {
    const map = new Map<string, GanttTask & { task: Task }>();
    this.ganttTasks().forEach(task => map.set(task.id, task));
    return map;
  });

  // Timeline start and end dates based on zoom
  private timelineStart = computed(() => {
    const today = new Date();
    const zoom = this.zoomLevel();

    if (zoom === ZoomLevel.DAY) {
      const start = new Date(today);
      start.setDate(today.getDate() - 15);
      return start;
    } else if (zoom === ZoomLevel.WEEK) {
      const start = new Date(today);
      start.setDate(today.getDate() - 8 * 7);
      return start;
    } else {
      return new Date(today.getFullYear(), today.getMonth() - 3, 1);
    }
  });

  private timelineEnd = computed(() => {
    const today = new Date();
    const zoom = this.zoomLevel();

    if (zoom === ZoomLevel.DAY) {
      const end = new Date(today);
      end.setDate(today.getDate() + 45);
      return end;
    } else if (zoom === ZoomLevel.WEEK) {
      const end = new Date(today);
      end.setDate(today.getDate() + 16 * 7);
      return end;
    } else {
      return new Date(today.getFullYear(), today.getMonth() + 9, 0);
    }
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
    if (ganttTask.milestone) {
      return 0; // Milestones have no width
    }

    const start = this.timelineStart().getTime();
    const end = this.timelineEnd().getTime();
    const taskStart = ganttTask.start.getTime();
    const taskEnd = ganttTask.end.getTime();

    const width = ((taskEnd - taskStart) / (end - start)) * 100;
    return Math.max(1, Math.min(100, width));
  }

  /**
   * Get dependency line position (using task map for O(1) lookup)
   */
  getDependencyLinePosition(task: GanttTask, depId: string): number {
    const depTask = this.ganttTaskMap().get(depId);
    if (!depTask) return 0;

    return this.getTaskPosition(depTask);
  }

  /**
   * Get dependency line width (using task map for O(1) lookup)
   */
  getDependencyLineWidth(task: GanttTask, depId: string): number {
    const depTask = this.ganttTaskMap().get(depId);
    if (!depTask) return 0;

    const depEnd = this.getTaskPosition(depTask) + this.getTaskWidth(depTask);
    const taskStart = this.getTaskPosition(task);

    // Ensure non-negative width (handles invalid dependency order)
    return Math.max(0, taskStart - depEnd);
  }

  /**
   * Get task tooltip
   */
  getTaskTooltip(ganttTask: GanttTask): string {
    const duration = this.getDurationDays(ganttTask);
    return `${ganttTask.name}\n開始: ${ganttTask.start.toLocaleDateString('zh-TW')}\n結束: ${ganttTask.end.toLocaleDateString('zh-TW')}\n持續: ${duration} 天\n進度: ${ganttTask.progress}%`;
  }

  /**
   * Get duration in days
   */
  getDurationDays(ganttTask: GanttTask): number {
    const diff = ganttTask.end.getTime() - ganttTask.start.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Get week number
   */
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
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

  /**
   * Handle edit task
   */
  handleEdit(task: Task): void {
    this.editTask.emit(task);
  }

  /**
   * Handle delete task
   */
  handleDelete(task: Task): void {
    this.deleteTask.emit(task);
  }
}
