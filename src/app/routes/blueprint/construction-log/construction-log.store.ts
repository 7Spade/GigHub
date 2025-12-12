/**
 * Construction Log Store
 * 工地施工日誌狀態管理
 *
 * Uses Angular Signals for reactive state management
 * Connected to LogFirestoreRepository for data persistence
 *
 * @author GigHub Development Team
 * @date 2025-12-12
 */

import { Injectable, signal, computed, inject } from '@angular/core';
import { LogFirestoreRepository } from '@core/repositories/log-firestore.repository';
import { FirebaseService } from '@core/services/firebase.service';
import { LoggerService } from '@core/services/logger';
import { Log, CreateLogRequest, UpdateLogRequest } from '@core/types/log/log.types';

@Injectable({ providedIn: 'root' })
export class ConstructionLogStore {
  // Injected dependencies
  private readonly repository = inject(LogFirestoreRepository);
  private readonly firebase = inject(FirebaseService);
  private readonly logger = inject(LoggerService);

  // Private state signals
  private _logs = signal<Log[]>([]);
  private _loading = signal(false);
  private _error = signal<string | null>(null);

  // Public readonly signals
  readonly logs = this._logs.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed signals
  readonly logCount = computed(() => this._logs().length);
  readonly hasLogs = computed(() => this._logs().length > 0);
  readonly totalPhotos = computed(() => this._logs().reduce((sum, log) => sum + (log.photos?.length || 0), 0));
  readonly totalCount = computed(() => this._logs().length);
  readonly thisMonthCount = computed(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return this._logs().filter(log => {
      const logDate = new Date(log.date);
      return logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear;
    }).length;
  });
  readonly todayCount = computed(() => {
    const today = new Date().toDateString();
    return this._logs().filter(log => new Date(log.date).toDateString() === today).length;
  });

  /**
   * Load logs for a blueprint
   * 載入藍圖的日誌
   */
  async loadLogs(blueprintId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const logs = await this.repository.findByBlueprint(blueprintId);
      this._logs.set(logs);

      this.logger.info('[ConstructionLogStore]', `Loaded ${logs.length} logs for blueprint: ${blueprintId}`);
    } catch (error) {
      const message = (error as Error).message;
      this._error.set(message);
      this.logger.error('[ConstructionLogStore]', 'Failed to load logs', error as Error);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Create a new log
   * 創建新日誌
   */
  async createLog(request: CreateLogRequest): Promise<Log | null> {
    this._loading.set(true);
    this._error.set(null);

    try {
      // Get current user ID from Firebase Auth
      const currentUserId = this.firebase.getCurrentUserId();
      if (!currentUserId) {
        throw new Error('User not authenticated');
      }

      // Add creator ID to request
      const logRequest: CreateLogRequest = {
        ...request,
        creatorId: currentUserId
      };

      const newLog = await this.repository.create(logRequest);

      // Add to local state
      this._logs.update(logs => [newLog, ...logs]);

      this.logger.info('[ConstructionLogStore]', `Created log: ${newLog.id}`);

      return newLog;
    } catch (error) {
      const message = (error as Error).message;
      this._error.set(message);
      this.logger.error('[ConstructionLogStore]', 'Failed to create log', error as Error);
      return null;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Update an existing log
   * 更新日誌
   */
  async updateLog(blueprintId: string, logId: string, request: UpdateLogRequest): Promise<Log | null> {
    this._loading.set(true);
    this._error.set(null);

    try {
      await this.repository.update(logId, request);

      // Reload logs to get updated data
      await this.loadLogs(blueprintId);

      this.logger.info('[ConstructionLogStore]', `Updated log: ${logId}`);

      return this._logs().find(log => log.id === logId) || null;
    } catch (error) {
      const message = (error as Error).message;
      this._error.set(message);
      this.logger.error('[ConstructionLogStore]', 'Failed to update log', error as Error);
      return null;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Delete a log
   * 刪除日誌
   */
  async deleteLog(blueprintId: string, logId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      await this.repository.delete(logId);

      // Remove from local state
      this._logs.update(logs => logs.filter(log => log.id !== logId));

      this.logger.info('[ConstructionLogStore]', `Deleted log: ${logId}`);
    } catch (error) {
      const message = (error as Error).message;
      this._error.set(message);
      this.logger.error('[ConstructionLogStore]', 'Failed to delete log', error as Error);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Upload photo to log
   * 上傳照片至日誌
   */
  async uploadPhoto(blueprintId: string, logId: string, file: File, caption?: string): Promise<string> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const photo = await this.repository.uploadPhoto(logId, file, caption);

      // Update local state
      this._logs.update(logs =>
        logs.map(log => {
          if (log.id === logId) {
            return {
              ...log,
              photos: [...log.photos, photo]
            };
          }
          return log;
        })
      );

      this.logger.info('[ConstructionLogStore]', `Uploaded photo to log: ${logId}`);

      return photo.publicUrl || photo.url;
    } catch (error) {
      const message = (error as Error).message;
      this._error.set(message);
      this.logger.error('[ConstructionLogStore]', 'Failed to upload photo', error as Error);
      return '';
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Delete photo from log
   * 從日誌刪除照片
   */
  async deletePhoto(blueprintId: string, logId: string, photoId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      await this.repository.deletePhoto(logId, photoId);

      // Update local state
      this._logs.update(logs =>
        logs.map(log => {
          if (log.id === logId) {
            return {
              ...log,
              photos: log.photos.filter(photo => photo.id !== photoId)
            };
          }
          return log;
        })
      );

      this.logger.info('[ConstructionLogStore]', `Deleted photo from log: ${logId}`);
    } catch (error) {
      const message = (error as Error).message;
      this._error.set(message);
      this.logger.error('[ConstructionLogStore]', 'Failed to delete photo', error as Error);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Clear error state
   * 清除錯誤狀態
   */
  clearError(): void {
    this._error.set(null);
  }
}
