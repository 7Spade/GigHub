/**
 * Construction Log Store
 * 工地施工日誌狀態管理
 *
 * Simplified architecture using LogFirestoreRepository directly
 * Follows Occam's Razor principle - minimal complexity
 *
 * @author GigHub Development Team
 * @date 2025-12-12
 */

import { Injectable, signal, computed, inject } from '@angular/core';
import {
  AuditLogsService,
  AuditEventType,
  AuditCategory,
  AuditSeverity,
  ActorType,
  AuditStatus
} from '@core/blueprint/modules/implementations/audit-logs';
import { LogFirestoreRepository } from '@core/repositories/log-firestore.repository';
import { Log, CreateLogRequest, UpdateLogRequest, LogPhoto } from '@core/types/log/log.types';

@Injectable({ providedIn: 'root' })
export class ConstructionLogStore {
  private repository = inject(LogFirestoreRepository);
  private auditService = inject(AuditLogsService);

  // Private state signals
  private _logs = signal<Log[]>([]);
  private _loading = signal(false);
  private _error = signal<string | null>(null);

  // Public readonly signals
  readonly logs = this._logs.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed signals - simplified calculations
  readonly totalCount = computed(() => this._logs().length);
  readonly totalPhotos = computed(() => this._logs().reduce((sum, log) => sum + (log.photos?.length || 0), 0));

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
   */
  async loadLogs(blueprintId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const logs = await this.repository.findByBlueprint(blueprintId);
      this._logs.set(logs);
    } catch (error) {
      this._error.set(error instanceof Error ? error.message : 'Failed to load logs');
      console.error('Load logs error:', error);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Create a new log
   */
  async createLog(request: CreateLogRequest): Promise<Log | null> {
    try {
      const newLog = await this.repository.create(request);
      this._logs.update(logs => [newLog, ...logs]);

      // Record audit log
      try {
        await this.auditService.recordLog({
          blueprintId: request.blueprintId,
          eventType: AuditEventType.LOG_CREATED,
          category: AuditCategory.DATA,
          severity: AuditSeverity.INFO,
          actorId: request.creatorId,
          actorType: ActorType.USER,
          resourceType: 'log',
          resourceId: newLog.id,
          action: '建立日誌',
          message: `日誌已建立: ${newLog.title}`,
          status: AuditStatus.SUCCESS
        });
      } catch (auditError) {
        console.error('Failed to record audit log:', auditError);
      }

      return newLog;
    } catch (error) {
      this._error.set(error instanceof Error ? error.message : 'Failed to create log');
      console.error('Create log error:', error);
      return null;
    }
  }

  /**
   * Update an existing log
   */
  async updateLog(blueprintId: string, logId: string, request: UpdateLogRequest): Promise<Log | null> {
    try {
      await this.repository.update(logId, request);

      // Reload the updated log
      const updatedLog = await this.repository.findById(logId);
      if (updatedLog) {
        this._logs.update(logs => logs.map(log => (log.id === logId ? updatedLog : log)));
      }
      return updatedLog;
    } catch (error) {
      this._error.set(error instanceof Error ? error.message : 'Failed to update log');
      console.error('Update log error:', error);
      return null;
    }
  }

  /**
   * Delete a log (soft delete)
   */
  async deleteLog(blueprintId: string, logId: string): Promise<void> {
    try {
      await this.repository.delete(logId);
      this._logs.update(logs => logs.filter(log => log.id !== logId));
    } catch (error) {
      this._error.set(error instanceof Error ? error.message : 'Failed to delete log');
      console.error('Delete log error:', error);
      throw error;
    }
  }

  /**
   * Upload a photo to a log
   */
  async uploadPhoto(blueprintId: string, logId: string, file: File, caption?: string): Promise<string> {
    try {
      const photo = await this.repository.uploadPhoto(logId, file, caption);

      // Update the log in the local state
      this._logs.update(logs =>
        logs.map(log => {
          if (log.id === logId) {
            return { ...log, photos: [...log.photos, photo] };
          }
          return log;
        })
      );

      return photo.id;
    } catch (error) {
      this._error.set(error instanceof Error ? error.message : 'Failed to upload photo');
      console.error('Upload photo error:', error);
      throw error;
    }
  }

  /**
   * Delete a photo from a log
   */
  async deletePhoto(blueprintId: string, logId: string, photoId: string): Promise<void> {
    try {
      await this.repository.deletePhoto(logId, photoId);

      // Update the log in the local state
      this._logs.update(logs =>
        logs.map(log => {
          if (log.id === logId) {
            return { ...log, photos: log.photos.filter(p => p.id !== photoId) };
          }
          return log;
        })
      );
    } catch (error) {
      this._error.set(error instanceof Error ? error.message : 'Failed to delete photo');
      console.error('Delete photo error:', error);
      throw error;
    }
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this._error.set(null);
  }
}
