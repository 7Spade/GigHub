/**
 * Tasks Repository
 *
 * Data access layer for task management.
 * Handles all Firestore operations for tasks within a blueprint.
 *
 * Collection path: blueprints/{blueprintId}/tasks/{taskId}
 *
 * Following Occam's Razor: Single repository implementation for all task operations
 * Uses unified Task types from @core/types/task
 *
 * @author GigHub Development Team
 * @date 2025-12-12
 */

import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  CollectionReference,
  QueryConstraint
} from '@angular/fire/firestore';
import { LoggerService } from '@core';
import { Task, TaskStatus, TaskPriority, CreateTaskRequest, UpdateTaskRequest, TaskQueryOptions } from '@core/types/task';
import { Observable, from, map, catchError, of } from 'rxjs';

/**
 * Type aliases for backward compatibility
 * These will be removed in future versions
 */
/** @deprecated Use Task from @core/types/task */
export type TaskDocument = Task;

/** @deprecated Use CreateTaskRequest from @core/types/task */
export type CreateTaskData = CreateTaskRequest;

/** @deprecated Use UpdateTaskRequest from @core/types/task */
export type UpdateTaskData = UpdateTaskRequest;

/** @deprecated Import from @core/types/task */
export type { TaskStatus, TaskPriority, TaskQueryOptions };

/**
 * Tasks Repository Service
 *
 * Manages CRUD operations for tasks within a blueprint.
 */
@Injectable({
  providedIn: 'root'
})
export class TasksRepository {
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);
  private readonly parentCollection = 'blueprints';
  private readonly subcollectionName = 'tasks';

  /**
   * Get tasks subcollection reference
   */
  private getTasksCollection(blueprintId: string): CollectionReference {
    return collection(this.firestore, this.parentCollection, blueprintId, this.subcollectionName);
  }

  /**
   * Convert Firestore data to Task entity
   * 將 Firestore 數據轉換為 Task 實體
   */
  private toTask(data: any, id: string): Task {
    return {
      id,
      blueprintId: data.blueprintId || '',
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      assigneeId: data.assigneeId,
      assigneeName: data.assigneeName,
      creatorId: data.createdBy || data.creatorId,
      creatorName: data.creatorName,
      dueDate: data.dueDate instanceof Timestamp ? data.dueDate.toDate() : data.dueDate,
      startDate: data.startDate instanceof Timestamp ? data.startDate.toDate() : data.startDate,
      completedDate: data.completedDate instanceof Timestamp ? data.completedDate.toDate() : data.completedDate,
      estimatedHours: data.estimatedHours,
      actualHours: data.actualHours,
      tags: data.tags || [],
      attachments: data.attachments || [],
      metadata: data.metadata || {},
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
      deletedAt: data.deletedAt ? (data.deletedAt instanceof Timestamp ? data.deletedAt.toDate() : data.deletedAt) : null
    };
  }

  /**
   * Find all tasks for a blueprint
   * 根據藍圖 ID 查找所有任務
   */
  findByBlueprintId(blueprintId: string, options?: TaskQueryOptions): Observable<Task[]> {
    const constraints: QueryConstraint[] = [];

    if (options?.status) {
      constraints.push(where('status', '==', options.status));
    }

    if (options?.priority) {
      constraints.push(where('priority', '==', options.priority));
    }

    if (options?.assigneeId) {
      constraints.push(where('assigneeId', '==', options.assigneeId));
    }

    if (!options?.includeDeleted) {
      constraints.push(where('deletedAt', '==', null));
    }

    constraints.push(orderBy('createdAt', 'desc'));

    if (options?.limit) {
      constraints.push(limit(options.limit));
    }

    const q = query(this.getTasksCollection(blueprintId), ...constraints);

    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(docSnap => this.toTask(docSnap.data(), docSnap.id))),
      catchError(error => {
        this.logger.error('[TasksRepository]', 'findByBlueprintId failed', error as Error);
        return of([]);
      })
    );
  }

  /**
   * Find task by ID
   * 根據 ID 查找任務
   */
  findById(blueprintId: string, taskId: string): Observable<Task | null> {
    return from(getDoc(doc(this.firestore, this.parentCollection, blueprintId, this.subcollectionName, taskId))).pipe(
      map(snapshot => (snapshot.exists() ? this.toTask(snapshot.data(), snapshot.id) : null)),
      catchError(error => {
        this.logger.error('[TasksRepository]', 'findById failed', error as Error);
        return of(null);
      })
    );
  }

  /**
   * Create a new task
   * 創建新任務
   */
  async create(blueprintId: string, data: CreateTaskRequest): Promise<Task> {
    const now = Timestamp.now();
    const docData = {
      blueprintId,
      title: data.title,
      description: data.description || '',
      status: data.status || TaskStatus.PENDING,
      priority: data.priority || TaskPriority.MEDIUM,
      assigneeId: data.assigneeId || null,
      assigneeName: data.assigneeName || null,
      creatorId: data.creatorId,
      creatorName: data.creatorName || null,
      dueDate: data.dueDate ? Timestamp.fromDate(data.dueDate) : null,
      startDate: data.startDate ? Timestamp.fromDate(data.startDate) : null,
      completedDate: null,
      estimatedHours: data.estimatedHours || null,
      actualHours: 0,
      tags: data.tags || [],
      attachments: [],
      metadata: data.metadata || {},
      createdBy: data.creatorId, // Backward compatibility
      createdAt: now,
      updatedAt: now,
      deletedAt: null
    };

    try {
      const docRef = await addDoc(this.getTasksCollection(blueprintId), docData);
      this.logger.info('[TasksRepository]', `Task created: ${docRef.id}`);

      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return this.toTask(snapshot.data(), snapshot.id);
      }

      return this.toTask(docData, docRef.id);
    } catch (error: any) {
      this.logger.error('[TasksRepository]', 'create failed', error as Error);
      throw error;
    }
  }

  /**
   * Update an existing task
   * 更新現有任務
   */
  async update(blueprintId: string, taskId: string, data: UpdateTaskRequest): Promise<void> {
    const docData: any = {
      ...data,
      updatedAt: Timestamp.now()
    };

    // Convert dates to Timestamps
    if (data.dueDate) {
      docData.dueDate = data.dueDate instanceof Date ? Timestamp.fromDate(data.dueDate) : data.dueDate;
    }
    if (data.startDate) {
      docData.startDate = data.startDate instanceof Date ? Timestamp.fromDate(data.startDate) : data.startDate;
    }
    if (data.completedDate) {
      docData.completedDate = data.completedDate instanceof Date ? Timestamp.fromDate(data.completedDate) : data.completedDate;
    }

    delete (docData as any).id;

    try {
      await updateDoc(doc(this.firestore, this.parentCollection, blueprintId, this.subcollectionName, taskId), docData);
      this.logger.info('[TasksRepository]', `Task updated: ${taskId}`);
    } catch (error: any) {
      this.logger.error('[TasksRepository]', 'update failed', error as Error);
      throw error;
    }
  }

  /**
   * Delete a task (soft delete)
   */
  async delete(blueprintId: string, taskId: string): Promise<void> {
    try {
      await updateDoc(doc(this.firestore, this.parentCollection, blueprintId, this.subcollectionName, taskId), {
        deletedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      this.logger.info('[TasksRepository]', `Task deleted: ${taskId}`);
    } catch (error: any) {
      this.logger.error('[TasksRepository]', 'delete failed', error as Error);
      throw error;
    }
  }

  /**
   * Hard delete a task
   */
  async hardDelete(blueprintId: string, taskId: string): Promise<void> {
    try {
      await deleteDoc(doc(this.firestore, this.parentCollection, blueprintId, this.subcollectionName, taskId));
      this.logger.info('[TasksRepository]', `Task hard deleted: ${taskId}`);
    } catch (error: any) {
      this.logger.error('[TasksRepository]', 'hardDelete failed', error as Error);
      throw error;
    }
  }

  /**
   * Get task count by status
   */
  async getCountByStatus(blueprintId: string): Promise<Record<TaskStatus, number>> {
    try {
      const snapshot = await getDocs(query(this.getTasksCollection(blueprintId), where('deletedAt', '==', null)));

      const counts: Record<TaskStatus, number> = {
        [TaskStatus.PENDING]: 0,
        [TaskStatus.IN_PROGRESS]: 0,
        [TaskStatus.ON_HOLD]: 0,
        [TaskStatus.COMPLETED]: 0,
        [TaskStatus.CANCELLED]: 0
      };

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data['status'] && data['status'] in counts) {
          counts[data['status'] as TaskStatus]++;
        }
      });

      return counts;
    } catch (error: any) {
      this.logger.error('[TasksRepository]', 'getCountByStatus failed', error as Error);
      throw error;
    }
  }
}
