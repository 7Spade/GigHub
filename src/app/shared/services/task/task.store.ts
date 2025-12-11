import { Injectable, signal, computed, inject } from '@angular/core';
import { LoggerService } from '@core';
import { Task, TaskStatus, CreateTaskRequest, UpdateTaskRequest } from '@core/types/task';
import { firstValueFrom } from 'rxjs';

import { TaskRepository } from './task.repository';

/**
 * Task Store
 * 任務 Store
 *
 * Following Occam's Razor: Simple signal-based state management
 * Using Angular 20 Signals for reactive state
 */
@Injectable({
  providedIn: 'root'
})
export class TaskStore {
  private readonly repository = inject(TaskRepository);
  private readonly logger = inject(LoggerService);

  // Private state
  private _tasks = signal<Task[]>([]);
  private _loading = signal(false);
  private _error = signal<string | null>(null);

  // Public readonly state
  readonly tasks = this._tasks.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed signals
  readonly todoTasks = computed(() => this._tasks().filter(t => t.status === TaskStatus.TODO));

  readonly inProgressTasks = computed(() => this._tasks().filter(t => t.status === TaskStatus.IN_PROGRESS));

  readonly completedTasks = computed(() => this._tasks().filter(t => t.status === TaskStatus.COMPLETED));

  readonly taskCount = computed(() => this._tasks().length);

  /**
   * Load tasks for a blueprint
   * 載入藍圖的任務
   */
  async loadTasks(blueprintId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const tasks = await firstValueFrom(this.repository.findByBlueprint(blueprintId));
      this._tasks.set(tasks);
      this.logger.info('[TaskStore]', `Loaded ${tasks.length} tasks for blueprint: ${blueprintId}`);
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      this._error.set(error);
      this.logger.error('[TaskStore]', 'Failed to load tasks', err as Error);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Create a new task
   * 創建新任務
   */
  async createTask(request: CreateTaskRequest): Promise<void> {
    try {
      const newTask = await this.repository.create(request);
      this._tasks.update(tasks => [...tasks, newTask]);
      this.logger.info('[TaskStore]', `Task created: ${newTask.id}`);
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      this._error.set(error);
      this.logger.error('[TaskStore]', 'Failed to create task', err as Error);
      throw err;
    }
  }

  /**
   * Update a task
   * 更新任務
   */
  async updateTask(id: string, data: UpdateTaskRequest): Promise<void> {
    try {
      await this.repository.update(id, data);

      // Update local state
      this._tasks.update(tasks => tasks.map(task => (task.id === id ? { ...task, ...data, updatedAt: new Date() } : task)));

      this.logger.info('[TaskStore]', `Task updated: ${id}`);
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      this._error.set(error);
      this.logger.error('[TaskStore]', 'Failed to update task', err as Error);
      throw err;
    }
  }

  /**
   * Delete a task
   * 刪除任務
   */
  async deleteTask(id: string): Promise<void> {
    try {
      await this.repository.delete(id);

      // Remove from local state
      this._tasks.update(tasks => tasks.filter(task => task.id !== id));

      this.logger.info('[TaskStore]', `Task deleted: ${id}`);
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      this._error.set(error);
      this.logger.error('[TaskStore]', 'Failed to delete task', err as Error);
      throw err;
    }
  }

  /**
   * Update task status
   * 更新任務狀態
   */
  async updateTaskStatus(id: string, status: TaskStatus): Promise<void> {
    try {
      await this.repository.updateStatus(id, status);

      // Update local state
      this._tasks.update(tasks => tasks.map(task => (task.id === id ? { ...task, status, updatedAt: new Date() } : task)));

      this.logger.info('[TaskStore]', `Task status updated: ${id} -> ${status}`);
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      this._error.set(error);
      this.logger.error('[TaskStore]', 'Failed to update task status', err as Error);
      throw err;
    }
  }

  /**
   * Clear error state
   * 清除錯誤狀態
   */
  clearError(): void {
    this._error.set(null);
  }

  /**
   * Reset store
   * 重置 Store
   */
  reset(): void {
    this._tasks.set([]);
    this._loading.set(false);
    this._error.set(null);
  }
}
