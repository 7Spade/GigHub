/**
 * Tasks Repository
 *
 * Data access layer for task management.
 * Handles all Firestore operations for tasks within a blueprint.
 *
 * Collection path: blueprints/{blueprintId}/tasks/{taskId}
 *
 * @author GigHub Development Team
 * @date 2025-12-10
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
import { Observable, from, map, catchError, of } from 'rxjs';

/**
 * Task Status
 */
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

/**
 * Task Priority
 */
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Task Document Interface
 */
export interface TaskDocument {
  readonly id?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  assigneeName?: string;
  dueDate?: Date | Timestamp;
  startDate?: Date | Timestamp;
  completedDate?: Date | Timestamp;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
  createdBy: string;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  deletedAt?: Date | Timestamp | null;
}

/**
 * Create Task Data
 */
export interface CreateTaskData {
  title: string;
  description?: string;
  priority?: TaskPriority;
  assigneeId?: string;
  assigneeName?: string;
  dueDate?: Date;
  startDate?: Date;
  estimatedHours?: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
  createdBy: string;
}

/**
 * Update Task Data
 */
export type UpdateTaskData = Partial<Omit<TaskDocument, 'id' | 'createdAt' | 'createdBy'>>;

/**
 * Task Query Options
 */
export interface TaskQueryOptions {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  includeDeleted?: boolean;
  limit?: number;
}

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
   * Convert Firestore data to TaskDocument
   */
  private toTaskDocument(data: any, id: string): TaskDocument {
    return {
      id,
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      assigneeId: data.assigneeId,
      assigneeName: data.assigneeName,
      dueDate: data.dueDate instanceof Timestamp ? data.dueDate.toDate() : data.dueDate,
      startDate: data.startDate instanceof Timestamp ? data.startDate.toDate() : data.startDate,
      completedDate: data.completedDate instanceof Timestamp ? data.completedDate.toDate() : data.completedDate,
      estimatedHours: data.estimatedHours,
      actualHours: data.actualHours,
      tags: data.tags || [],
      metadata: data.metadata || {},
      createdBy: data.createdBy,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
      deletedAt: data.deletedAt ? (data.deletedAt instanceof Timestamp ? data.deletedAt.toDate() : data.deletedAt) : null
    };
  }

  /**
   * Find all tasks for a blueprint
   */
  findByBlueprintId(blueprintId: string, options?: TaskQueryOptions): Observable<TaskDocument[]> {
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
      map(snapshot => snapshot.docs.map(docSnap => this.toTaskDocument(docSnap.data(), docSnap.id))),
      catchError(error => {
        this.logger.error('[TasksRepository]', 'findByBlueprintId failed', error as Error);
        return of([]);
      })
    );
  }

  /**
   * Find task by ID
   */
  findById(blueprintId: string, taskId: string): Observable<TaskDocument | null> {
    return from(getDoc(doc(this.firestore, this.parentCollection, blueprintId, this.subcollectionName, taskId))).pipe(
      map(snapshot => (snapshot.exists() ? this.toTaskDocument(snapshot.data(), snapshot.id) : null)),
      catchError(error => {
        this.logger.error('[TasksRepository]', 'findById failed', error as Error);
        return of(null);
      })
    );
  }

  /**
   * Create a new task
   */
  async create(blueprintId: string, data: CreateTaskData): Promise<TaskDocument> {
    const now = Timestamp.now();
    const docData = {
      title: data.title,
      description: data.description || '',
      status: TaskStatus.PENDING,
      priority: data.priority || TaskPriority.MEDIUM,
      assigneeId: data.assigneeId,
      assigneeName: data.assigneeName,
      dueDate: data.dueDate ? Timestamp.fromDate(data.dueDate) : null,
      startDate: data.startDate ? Timestamp.fromDate(data.startDate) : null,
      completedDate: null,
      estimatedHours: data.estimatedHours,
      actualHours: 0,
      tags: data.tags || [],
      metadata: data.metadata || {},
      createdBy: data.createdBy,
      createdAt: now,
      updatedAt: now,
      deletedAt: null
    };

    try {
      const docRef = await addDoc(this.getTasksCollection(blueprintId), docData);
      this.logger.info('[TasksRepository]', `Task created: ${docRef.id}`);

      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return this.toTaskDocument(snapshot.data(), snapshot.id);
      }

      return this.toTaskDocument(docData, docRef.id);
    } catch (error: any) {
      this.logger.error('[TasksRepository]', 'create failed', error as Error);
      throw error;
    }
  }

  /**
   * Update an existing task
   */
  async update(blueprintId: string, taskId: string, data: UpdateTaskData): Promise<void> {
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
