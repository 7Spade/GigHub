/**
 * Construction Log Store
 * 工地施工日誌狀態管理
 *
 * @deprecated Temporarily stubbed - needs migration to use LogFirestoreRepository correctly
 * Uses Angular Signals for reactive state management
 *
 * @author GigHub Development Team
 * @date 2025-12-12
 */

import { Injectable, signal, computed } from '@angular/core';
import { Log, CreateLogRequest, UpdateLogRequest } from '@core/types/log/log.types';

@Injectable({ providedIn: 'root' })
export class ConstructionLogStore {
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

  async loadLogs(blueprintId: string): Promise<void> {
    console.warn('ConstructionLogStore: Temporarily stubbed - needs migration to LogFirestoreRepository');
    this._loading.set(true);
    this._error.set(null);
    try {
      this._logs.set([]);
    } catch (error) {
      this._error.set((error as Error).message);
    } finally {
      this._loading.set(false);
    }
  }

  async createLog(request: CreateLogRequest): Promise<Log | null> {
    console.warn('ConstructionLogStore: Temporarily stubbed - needs migration to LogFirestoreRepository');
    return null;
  }

  async updateLog(blueprintId: string, logId: string, request: UpdateLogRequest): Promise<Log | null> {
    console.warn('ConstructionLogStore: Temporarily stubbed - needs migration to LogFirestoreRepository');
    return null;
  }

  async deleteLog(blueprintId: string, logId: string): Promise<void> {
    console.warn('ConstructionLogStore: Temporarily stubbed - needs migration to LogFirestoreRepository');
  }

  async uploadPhoto(blueprintId: string, logId: string, file: File, caption?: string): Promise<string> {
    console.warn('ConstructionLogStore: Temporarily stubbed - needs migration to LogFirestoreRepository');
    return '';
  }

  async deletePhoto(blueprintId: string, logId: string, photoId: string): Promise<void> {
    console.warn('ConstructionLogStore: Temporarily stubbed - needs migration to LogFirestoreRepository');
  }

  clearError(): void {
    this._error.set(null);
  }
}
