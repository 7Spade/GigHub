import { Injectable } from '@angular/core';
import { Task, TaskStatus, CreateTaskRequest, UpdateTaskRequest, TaskQueryOptions } from '@core/types/task';

import { SupabaseBaseRepository } from './base/supabase-base.repository';

/**
 * Task Supabase Repository
 * 任務 Supabase Repository
 *
 * Implements Task CRUD operations using Supabase with:
 * - RLS policy enforcement
 * - Automatic retry on failures
 * - Organization-based isolation
 * - Soft delete support
 *
 * @extends SupabaseBaseRepository<Task>
 */
@Injectable({
  providedIn: 'root'
})
export class TaskSupabaseRepository extends SupabaseBaseRepository<Task> {
  protected tableName = 'tasks';

  /**
   * Convert database record to Task entity
   */
  protected toEntity(data: any): Task {
    return {
      id: data.id,
      blueprintId: data.blueprint_id,
      title: data.title,
      description: data.description,
      status: this.mapStatus(data.status),
      assigneeId: data.assignee_id,
      creatorId: data.creator_id,
      dueDate: data.due_date ? new Date(data.due_date) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      deletedAt: data.deleted_at ? new Date(data.deleted_at) : null,
      priority: data.priority,
      tags: data.tags || [],
      attachments: data.attachments || [],
      metadata: data.metadata || {}
    };
  }

  /**
   * Convert Task entity to database record
   */
  protected override toRecord(task: Partial<Task>): any {
    const record: any = {};

    if (task.blueprintId) record.blueprint_id = task.blueprintId;
    if (task.title) record.title = task.title;
    if (task.description !== undefined) record.description = task.description;
    if (task.status) record.status = task.status.toUpperCase();
    if (task.assigneeId !== undefined) record.assignee_id = task.assigneeId;
    if (task.creatorId) record.creator_id = task.creatorId;
    if (task.dueDate !== undefined) record.due_date = task.dueDate?.toISOString();
    if (task.priority) record.priority = task.priority.toUpperCase();
    if (task.tags) record.tags = task.tags;
    if (task.attachments) record.attachments = task.attachments;
    if (task.metadata) record.metadata = task.metadata;

    return record;
  }

  /**
   * Map database status to TaskStatus enum
   */
  private mapStatus(status: string): TaskStatus {
    const statusMap: Record<string, TaskStatus> = {
      TODO: TaskStatus.TODO,
      IN_PROGRESS: TaskStatus.IN_PROGRESS,
      IN_REVIEW: TaskStatus.IN_REVIEW,
      REVIEW: TaskStatus.IN_REVIEW,
      COMPLETED: TaskStatus.COMPLETED,
      CANCELLED: TaskStatus.CANCELLED
    };

    return statusMap[status] || TaskStatus.TODO;
  }

  /**
   * Find task by ID
   * 根據 ID 查找任務
   */
  async findById(id: string): Promise<Task | null> {
    return this.executeWithRetry(async () => {
      const { data, error } = await this.client.from(this.tableName).select('*').eq('id', id).is('deleted_at', null).single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null;
        }
        throw error;
      }

      return data ? this.toEntity(data) : null;
    });
  }

  /**
   * Find tasks by blueprint
   * 根據藍圖查找任務
   */
  async findByBlueprint(blueprintId: string, options?: TaskQueryOptions): Promise<Task[]> {
    return this.executeWithRetry(async () => {
      let query = this.client.from(this.tableName).select('*').eq('blueprint_id', blueprintId);

      // Apply filters
      if (options?.status) {
        query = query.eq('status', options.status.toUpperCase());
      }

      if (options?.assigneeId) {
        query = query.eq('assignee_id', options.assigneeId);
      }

      if (options?.creatorId) {
        query = query.eq('creator_id', options.creatorId);
      }

      // Handle deleted filter
      if (!options?.includeDeleted) {
        query = query.is('deleted_at', null);
      }

      // Apply limit
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      // Sort by created_at descending
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(item => this.toEntity(item));
    });
  }

  /**
   * Find tasks with options
   * 使用選項查找任務
   */
  async findWithOptions(options: TaskQueryOptions): Promise<Task[]> {
    return this.executeWithRetry(async () => {
      let query = this.client.from(this.tableName).select('*');

      // Apply filters
      if (options.blueprintId) {
        query = query.eq('blueprint_id', options.blueprintId);
      }

      if (options.status) {
        query = query.eq('status', options.status.toUpperCase());
      }

      if (options.assigneeId) {
        query = query.eq('assignee_id', options.assigneeId);
      }

      if (options.creatorId) {
        query = query.eq('creator_id', options.creatorId);
      }

      // Handle deleted filter
      if (!options.includeDeleted) {
        query = query.is('deleted_at', null);
      }

      // Apply limit
      if (options.limit) {
        query = query.limit(options.limit);
      }

      // Sort by created_at descending
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(item => this.toEntity(item));
    });
  }

  /**
   * Create a new task
   * 創建新任務
   */
  async create(payload: CreateTaskRequest): Promise<Task> {
    return this.executeWithRetry(async () => {
      const record = {
        blueprint_id: payload.blueprintId,
        title: payload.title,
        description: payload.description,
        status: (payload.status || TaskStatus.TODO).toUpperCase(),
        assignee_id: payload.assigneeId,
        creator_id: payload.creatorId,
        due_date: payload.dueDate?.toISOString(),
        priority: payload.priority?.toUpperCase() || 'MEDIUM',
        tags: payload.tags || [],
        attachments: [],
        metadata: {}
      };

      const { data, error } = await this.client.from(this.tableName).insert(record).select().single();

      if (error) {
        this.handleError(error, 'create task');
      }

      this.logger.info('[TaskSupabaseRepository]', `Task created with ID: ${data.id}`);

      return this.toEntity(data);
    });
  }

  /**
   * Update task
   * 更新任務
   */
  async update(id: string, payload: UpdateTaskRequest): Promise<void> {
    return this.executeWithRetry(async () => {
      const record = this.toRecord(payload);

      const { error } = await this.client.from(this.tableName).update(record).eq('id', id).is('deleted_at', null);

      if (error) {
        this.handleError(error, 'update task');
      }

      this.logger.info('[TaskSupabaseRepository]', `Task updated: ${id}`);
    });
  }

  /**
   * Update task status
   * 更新任務狀態
   */
  async updateStatus(id: string, status: TaskStatus): Promise<void> {
    return this.executeWithRetry(async () => {
      const { error } = await this.client.from(this.tableName).update({ status: status.toUpperCase() }).eq('id', id).is('deleted_at', null);

      if (error) {
        this.handleError(error, 'update task status');
      }

      this.logger.info('[TaskSupabaseRepository]', `Task status updated: ${id} -> ${status}`);
    });
  }

  /**
   * Soft delete task
   * 軟刪除任務
   */
  async delete(id: string): Promise<void> {
    return this.executeWithRetry(async () => {
      const { error } = await this.client.from(this.tableName).update({ deleted_at: new Date().toISOString() }).eq('id', id);

      if (error) {
        this.handleError(error, 'soft delete task');
      }

      this.logger.info('[TaskSupabaseRepository]', `Task soft deleted: ${id}`);
    });
  }

  /**
   * Hard delete task (permanent)
   * 永久刪除任務
   */
  async hardDelete(id: string): Promise<void> {
    return this.executeWithRetry(async () => {
      const { error } = await this.client.from(this.tableName).delete().eq('id', id);

      if (error) {
        this.handleError(error, 'hard delete task');
      }

      this.logger.info('[TaskSupabaseRepository]', `Task hard deleted: ${id}`);
    });
  }

  /**
   * Restore soft-deleted task
   * 恢復軟刪除的任務
   */
  async restore(id: string): Promise<void> {
    return this.executeWithRetry(async () => {
      const { error } = await this.client.from(this.tableName).update({ deleted_at: null }).eq('id', id);

      if (error) {
        this.handleError(error, 'restore task');
      }

      this.logger.info('[TaskSupabaseRepository]', `Task restored: ${id}`);
    });
  }

  /**
   * Count tasks by status
   * 按狀態統計任務數量
   */
  async countByStatus(blueprintId: string): Promise<Record<TaskStatus, number>> {
    return this.executeWithRetry(async () => {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('status', { count: 'exact', head: false })
        .eq('blueprint_id', blueprintId)
        .is('deleted_at', null);

      if (error) throw error;

      // Initialize counts
      const counts: Record<TaskStatus, number> = {
        [TaskStatus.TODO]: 0,
        [TaskStatus.IN_PROGRESS]: 0,
        [TaskStatus.IN_REVIEW]: 0,
        [TaskStatus.COMPLETED]: 0,
        [TaskStatus.CANCELLED]: 0
      };

      // Count by status
      (data || []).forEach(item => {
        const status = this.mapStatus(item.status);
        counts[status] = (counts[status] || 0) + 1;
      });

      return counts;
    });
  }
}
