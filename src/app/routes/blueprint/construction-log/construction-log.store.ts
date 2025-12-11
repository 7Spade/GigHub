/**
 * Construction Log Store
 * 工地施工日誌狀態管理
 *
 * Uses Angular Signals for reactive state management
 * Follows Repository pattern for data access
 *
 * @author GigHub Development Team
 * @date 2025-12-11
 */

import { Injectable, signal, computed } from '@angular/core';
import { inject } from '@angular/core';
import { Log, CreateLogRequest, UpdateLogRequest, LogQueryOptions } from '@core/types/log/log.types';
import { ConstructionLogRepository } from './construction-log.repository';

@Injectable({ providedIn: 'root' })
export class ConstructionLogStore {
  private repository = inject(ConstructionLogRepository);

  // Private state signals
  private _logs = signal<Log[]>([]);
  private _loading = signal(false);
  private _error = signal<string | null>(null);

  // Public readonly signals
  readonly logs = this._logs.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed statistics
  readonly totalCount = computed(() => this._logs().length);

  readonly thisMonthCount = computed(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return this._logs().filter((log) => {
      const logDate = new Date(log.date);
      return logDate >= firstDay;
    }).length;
  });

  readonly todayCount = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this._logs().filter((log) => {
      const logDate = new Date(log.date);
      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === today.getTime();
    }).length;
  });

  readonly totalPhotos = computed(() => {
    return this._logs().reduce((total, log) => {
      return total + (log.photos?.length || 0);
    }, 0);
  });

  // Actions

  /**
   * Load all logs for a blueprint
   */
  async loadLogs(blueprintId: string, options?: LogQueryOptions): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const logs = await this.repository.findAll({ blueprintId, ...options });
      this._logs.set(logs);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      this._error.set(errorMessage);
      console.error('Failed to load logs:', err);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Load a single log by ID
   */
  async loadLog(blueprintId: string, logId: string): Promise<Log | null> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const log = await this.repository.findById(blueprintId, logId);
      return log;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      this._error.set(errorMessage);
      console.error('Failed to load log:', err);
      return null;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Create a new log
   */
  async createLog(request: CreateLogRequest): Promise<Log | null> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const newLog = await this.repository.create(request);
      // Add to local state
      this._logs.update((logs) => [newLog, ...logs]);
      return newLog;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      this._error.set(errorMessage);
      console.error('Failed to create log:', err);
      return null;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Update an existing log
   */
  async updateLog(blueprintId: string, logId: string, request: UpdateLogRequest): Promise<Log | null> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const updatedLog = await this.repository.update(blueprintId, logId, request);
      // Update local state
      this._logs.update((logs) => logs.map((log) => (log.id === logId ? updatedLog : log)));
      return updatedLog;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      this._error.set(errorMessage);
      console.error('Failed to update log:', err);
      return null;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Delete a log
   */
  async deleteLog(blueprintId: string, logId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      await this.repository.delete(blueprintId, logId);
      // Remove from local state
      this._logs.update((logs) => logs.filter((log) => log.id !== logId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      this._error.set(errorMessage);
      console.error('Failed to delete log:', err);
      throw err;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Upload photo for a log
   */
  async uploadPhoto(blueprintId: string, logId: string, file: File): Promise<string | null> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const photoUrl = await this.repository.uploadPhoto(blueprintId, logId, file);
      return photoUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      this._error.set(errorMessage);
      console.error('Failed to upload photo:', err);
      return null;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Delete photo from a log
   */
  async deletePhoto(blueprintId: string, logId: string, photoId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      await this.repository.deletePhoto(blueprintId, logId, photoId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      this._error.set(errorMessage);
      console.error('Failed to delete photo:', err);
      throw err;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this._error.set(null);
  }

  /**
   * Reset store state
   */
  reset(): void {
    this._logs.set([]);
    this._loading.set(false);
    this._error.set(null);
  }
}
