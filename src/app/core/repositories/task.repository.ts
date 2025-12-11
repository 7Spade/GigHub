import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  Timestamp,
  CollectionReference,
  DocumentReference,
  QueryConstraint
} from '@angular/fire/firestore';
import { LoggerService } from '@core';
import { Task, TaskStatus, CreateTaskRequest, UpdateTaskRequest, TaskQueryOptions } from '@core/types/task';
import { Observable, catchError, from, map, of } from 'rxjs';

/**
 * Task Repository
 * 任務 Repository
 *
 * Following Occam's Razor: Simple, focused task operations
 * Based on Blueprint Repository pattern
 *
 * @see src/app/shared/services/blueprint/blueprint.repository.ts
 */
@Injectable({
  providedIn: 'root'
})
export class TaskRepository {
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);
  private readonly collectionName = 'tasks';

  private getCollectionRef(): CollectionReference {
    return collection(this.firestore, this.collectionName);
  }

  private getDocRef(id: string): DocumentReference {
    return doc(this.firestore, this.collectionName, id);
  }

  private toTask(data: any, id: string): Task {
    return {
      id,
      blueprintId: data.blueprintId,
      title: data.title,
      description: data.description,
      status: data.status,
      assigneeId: data.assigneeId,
      creatorId: data.creatorId,
      dueDate: data.dueDate instanceof Timestamp ? data.dueDate.toDate() : data.dueDate,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
      deletedAt: data.deletedAt ? (data.deletedAt instanceof Timestamp ? data.deletedAt.toDate() : data.deletedAt) : null,
      priority: data.priority,
      tags: data.tags || [],
      attachments: data.attachments || [],
      metadata: data.metadata || {}
    };
  }

  /**
   * Find task by ID
   * 根據 ID 查找任務
   */
  findById(id: string): Observable<Task | null> {
    return from(getDoc(this.getDocRef(id))).pipe(
      map(snapshot => (snapshot.exists() ? this.toTask(snapshot.data(), snapshot.id) : null)),
      catchError(error => {
        this.logger.error('[TaskRepository]', 'findById failed', error as Error);
        return of(null);
      })
    );
  }

  /**
   * Find tasks by blueprint
   * 根據藍圖查找任務
   */
  findByBlueprint(blueprintId: string, options?: TaskQueryOptions): Observable<Task[]> {
    const constraints: QueryConstraint[] = [where('blueprintId', '==', blueprintId)];

    if (options?.status) {
      constraints.push(where('status', '==', options.status));
    }

    if (options?.assigneeId) {
      constraints.push(where('assigneeId', '==', options.assigneeId));
    }

    if (!options?.includeDeleted) {
      constraints.push(where('deletedAt', '==', null));
    }

    const q = query(this.getCollectionRef(), ...constraints);

    return from(getDocs(q)).pipe(
      map(snapshot => {
        const tasks = snapshot.docs.map(docSnap => this.toTask(docSnap.data(), docSnap.id));
        // Sort in-memory by createdAt descending
        return tasks.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA;
        });
      }),
      catchError(error => {
        this.logger.error('[TaskRepository]', 'findByBlueprint failed', error as Error);
        return of([]);
      })
    );
  }

  /**
   * Find tasks with options
   * 使用選項查找任務
   */
  findWithOptions(options: TaskQueryOptions): Observable<Task[]> {
    const constraints: QueryConstraint[] = [];

    if (options.blueprintId) {
      constraints.push(where('blueprintId', '==', options.blueprintId));
    }

    if (options.status) {
      constraints.push(where('status', '==', options.status));
    }

    if (options.assigneeId) {
      constraints.push(where('assigneeId', '==', options.assigneeId));
    }

    if (options.creatorId) {
      constraints.push(where('creatorId', '==', options.creatorId));
    }

    if (!options.includeDeleted) {
      constraints.push(where('deletedAt', '==', null));
    }

    const q = query(this.getCollectionRef(), ...constraints);

    return from(getDocs(q)).pipe(
      map(snapshot => {
        const tasks = snapshot.docs.map(docSnap => this.toTask(docSnap.data(), docSnap.id));
        // Sort in-memory by createdAt descending
        return tasks.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA;
        });
      }),
      catchError(error => {
        this.logger.error('[TaskRepository]', 'findWithOptions failed', error as Error);
        return of([]);
      })
    );
  }

  /**
   * Create a new task
   * 創建新任務
   */
  async create(payload: CreateTaskRequest): Promise<Task> {
    const now = Timestamp.now();
    const docData = {
      ...payload,
      status: payload.status || TaskStatus.TODO,
      tags: payload.tags || [],
      attachments: [],
      metadata: {},
      createdAt: now,
      updatedAt: now,
      deletedAt: null
    };

    try {
      const docRef = await addDoc(this.getCollectionRef(), docData);
      this.logger.info('[TaskRepository]', `Task created with ID: ${docRef.id}`);

      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return this.toTask(snapshot.data(), snapshot.id);
      } else {
        return this.toTask(docData, docRef.id);
      }
    } catch (error: any) {
      this.logger.error('[TaskRepository]', 'create failed', error as Error);
      throw error;
    }
  }

  /**
   * Update task
   * 更新任務
   */
  async update(id: string, data: UpdateTaskRequest): Promise<void> {
    const docData = {
      ...data,
      updatedAt: Timestamp.now()
    };

    try {
      await updateDoc(this.getDocRef(id), docData);
      this.logger.info('[TaskRepository]', `Task updated: ${id}`);
    } catch (error: any) {
      this.logger.error('[TaskRepository]', 'update failed', error as Error);
      throw error;
    }
  }

  /**
   * Soft delete task
   * 軟刪除任務
   */
  async delete(id: string): Promise<void> {
    try {
      await updateDoc(this.getDocRef(id), {
        deletedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      this.logger.info('[TaskRepository]', `Task soft deleted: ${id}`);
    } catch (error: any) {
      this.logger.error('[TaskRepository]', 'soft delete failed', error as Error);
      throw error;
    }
  }

  /**
   * Hard delete task
   * 永久刪除任務
   */
  async hardDelete(id: string): Promise<void> {
    try {
      await deleteDoc(this.getDocRef(id));
      this.logger.info('[TaskRepository]', `Task hard deleted: ${id}`);
    } catch (error: any) {
      this.logger.error('[TaskRepository]', 'hard delete failed', error as Error);
      throw error;
    }
  }

  /**
   * Update task status
   * 更新任務狀態
   */
  async updateStatus(id: string, status: TaskStatus): Promise<void> {
    try {
      await updateDoc(this.getDocRef(id), {
        status,
        updatedAt: Timestamp.now()
      });
      this.logger.info('[TaskRepository]', `Task status updated: ${id} -> ${status}`);
    } catch (error: any) {
      this.logger.error('[TaskRepository]', 'updateStatus failed', error as Error);
      throw error;
    }
  }
}
