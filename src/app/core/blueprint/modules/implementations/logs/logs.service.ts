/**
 * Logs Service
 * Business logic layer with Signal-based state management.
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LoggerService } from '@core/services/logger.service';

import { LogsRepository, LogDocument, CreateLogData, LogLevel, LogCategory, LogQueryOptions } from './logs.repository';

@Injectable({ providedIn: 'root' })
export class LogsService {
  private readonly repository = inject(LogsRepository);
  private readonly logger = inject(LoggerService);

  private _logs = signal<LogDocument[]>([]);
  private _loading = signal(false);
  private _error = signal<string | null>(null);

  readonly logs = this._logs.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly debugLogs = computed(() => this._logs().filter(log => log.level === LogLevel.DEBUG));

  readonly infoLogs = computed(() => this._logs().filter(log => log.level === LogLevel.INFO));

  readonly warnLogs = computed(() => this._logs().filter(log => log.level === LogLevel.WARN));

  readonly errorLogs = computed(() => this._logs().filter(log => log.level === LogLevel.ERROR));

  readonly logStats = computed(() => {
    const logs = this._logs();
    return {
      total: logs.length,
      debug: logs.filter(l => l.level === LogLevel.DEBUG).length,
      info: logs.filter(l => l.level === LogLevel.INFO).length,
      warn: logs.filter(l => l.level === LogLevel.WARN).length,
      error: logs.filter(l => l.level === LogLevel.ERROR).length
    };
  });

  async loadLogs(blueprintId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      this.repository
        .findByBlueprintId(blueprintId)
        .pipe(takeUntilDestroyed())
        .subscribe({
          next: logs => {
            this._logs.set(logs);
            this._loading.set(false);
          },
          error: err => {
            this.logger.error('Failed to load logs', err);
            this._error.set(err.message);
            this._loading.set(false);
          }
        });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.logger.error('Failed to load logs', error);
      this._error.set(error.message);
      this._loading.set(false);
    }
  }

  async createLog(blueprintId: string, data: CreateLogData): Promise<LogDocument> {
    this._loading.set(true);
    try {
      const log = await this.repository.create(blueprintId, data);
      this._logs.update(logs => [...logs, log]);
      return log;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this._error.set(error.message);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  async deleteLog(blueprintId: string, logId: string): Promise<void> {
    this._loading.set(true);
    try {
      await this.repository.delete(blueprintId, logId);
      this._logs.update(logs => logs.filter(l => l.id !== logId));
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this._error.set(error.message);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  async queryLogs(blueprintId: string, options: LogQueryOptions): Promise<void> {
    this._loading.set(true);
    try {
      const logs = await this.repository.queryLogs(blueprintId, options);
      this._logs.set(logs);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this._error.set(error.message);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  clear(): void {
    this._logs.set([]);
    this._error.set(null);
  }
}
