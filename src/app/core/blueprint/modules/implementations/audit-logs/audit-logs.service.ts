/**
 * Audit Logs Service
 *
 * Business logic layer for audit log management.
 * Orchestrates between repository and UI, handles validation and business rules.
 *
 * @author GigHub Development Team
 * @date 2025-12-13
 */

import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { QueryDocumentSnapshot } from '@angular/fire/firestore';
import { LoggerService } from '@core';
import { AuditLogRepository, CreateAuditLogData, AuditLogPage } from '@core/blueprint/repositories/audit-log.repository';
import {
  AuditLogDocument,
  AuditLogQueryOptions,
  AuditLogSummary,
  AuditEventType,
  AuditCategory,
  AuditSeverity,
  AuditStatus
} from '@core/models/audit-log.model';

/**
 * Audit Logs Service
 *
 * Manages audit log operations with business logic and state management.
 */
@Injectable({
  providedIn: 'root'
})
export class AuditLogsService {
  private readonly repository = inject(AuditLogRepository);
  private readonly logger = inject(LoggerService);
  private readonly destroyRef = inject(DestroyRef);

  // State signals
  private _logs = signal<AuditLogDocument[]>([]);
  private _loading = signal(false);
  private _error = signal<string | null>(null);
  private _currentBlueprintId = signal<string | null>(null);
  private _summary = signal<AuditLogSummary | null>(null);
  private _hasMore = signal(false);
  private _lastDoc = signal<QueryDocumentSnapshot | undefined>(undefined);

  // Public readonly signals
  readonly logs = this._logs.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly summary = this._summary.asReadonly();
  readonly hasMore = this._hasMore.asReadonly();

  // Computed signals
  readonly criticalLogs = computed(() => this._logs().filter(l => l.severity === AuditSeverity.CRITICAL));

  readonly highSeverityLogs = computed(() => this._logs().filter(l => l.severity === AuditSeverity.HIGH));

  readonly failedLogs = computed(() => this._logs().filter(l => l.status === AuditStatus.FAILED));

  readonly logsByCategory = computed(() => {
    const logs = this._logs();
    return {
      blueprint: logs.filter(l => l.category === AuditCategory.BLUEPRINT),
      module: logs.filter(l => l.category === AuditCategory.MODULE),
      config: logs.filter(l => l.category === AuditCategory.CONFIG),
      member: logs.filter(l => l.category === AuditCategory.MEMBER),
      permission: logs.filter(l => l.category === AuditCategory.PERMISSION),
      access: logs.filter(l => l.category === AuditCategory.ACCESS),
      system: logs.filter(l => l.category === AuditCategory.SYSTEM)
    };
  });

  readonly logStats = computed(() => {
    const logs = this._logs();
    return {
      total: logs.length,
      critical: this.criticalLogs().length,
      high: this.highSeverityLogs().length,
      failed: this.failedLogs().length,
      successRate: logs.length > 0 ? Math.round(((logs.length - this.failedLogs().length) / logs.length) * 100) : 0
    };
  });

  /**
   * Load audit logs for a blueprint
   */
  async loadLogs(blueprintId: string, pageSize = 50): Promise<void> {
    this._currentBlueprintId.set(blueprintId);
    this._loading.set(true);
    this._error.set(null);

    try {
      const page: AuditLogPage = await this.repository.findByBlueprintId(blueprintId, pageSize);

      this._logs.set(page.logs);
      this._hasMore.set(page.hasMore);
      this._lastDoc.set(page.lastDoc);
      this._loading.set(false);

      this.logger.info('[AuditLogsService]', `Loaded ${page.logs.length} audit logs`);
    } catch (err: any) {
      this._error.set(err.message || 'Failed to load audit logs');
      this._loading.set(false);
      this.logger.error('[AuditLogsService]', 'loadLogs failed', err);
    }
  }

  /**
   * Load more logs (pagination)
   */
  async loadMore(blueprintId: string, pageSize = 50): Promise<void> {
    if (!this._hasMore() || this._loading()) {
      return;
    }

    this._loading.set(true);
    this._error.set(null);

    try {
      const page: AuditLogPage = await this.repository.findByBlueprintId(blueprintId, pageSize, this._lastDoc());

      // Append new logs
      this._logs.update(logs => [...logs, ...page.logs]);
      this._hasMore.set(page.hasMore);
      this._lastDoc.set(page.lastDoc);
      this._loading.set(false);

      this.logger.info('[AuditLogsService]', `Loaded ${page.logs.length} more audit logs`);
    } catch (err: any) {
      this._error.set(err.message || 'Failed to load more audit logs');
      this._loading.set(false);
      this.logger.error('[AuditLogsService]', 'loadMore failed', err);
    }
  }

  /**
   * Query audit logs with filters
   */
  async queryLogs(blueprintId: string, options: AuditLogQueryOptions): Promise<void> {
    this._currentBlueprintId.set(blueprintId);
    this._loading.set(true);
    this._error.set(null);

    try {
      const logs = await this.repository.queryLogs(blueprintId, options);

      this._logs.set(logs);
      this._hasMore.set(false); // Query results don't support pagination
      this._loading.set(false);

      this.logger.info('[AuditLogsService]', `Queried ${logs.length} audit logs`);
    } catch (err: any) {
      this._error.set(err.message || 'Failed to query audit logs');
      this._loading.set(false);
      this.logger.error('[AuditLogsService]', 'queryLogs failed', err);
    }
  }

  /**
   * Create a new audit log entry
   */
  async createLog(data: CreateAuditLogData): Promise<AuditLogDocument> {
    try {
      const log = await this.repository.create(data);

      // Update local state if viewing same blueprint
      if (this._currentBlueprintId() === data.blueprintId) {
        this._logs.update(logs => [log, ...logs]);
      }

      this.logger.info('[AuditLogsService]', `Audit log created: ${log.id}`);
      return log;
    } catch (error: any) {
      this.logger.error('[AuditLogsService]', 'createLog failed', error);
      throw error;
    }
  }

  /**
   * Batch create audit log entries
   */
  async createBatch(logs: CreateAuditLogData[]): Promise<void> {
    try {
      await this.repository.createBatch(logs);

      // Refresh logs if viewing the same blueprint
      const blueprintId = logs[0]?.blueprintId;
      if (blueprintId && this._currentBlueprintId() === blueprintId) {
        await this.loadLogs(blueprintId);
      }

      this.logger.info('[AuditLogsService]', `Batch created ${logs.length} audit logs`);
    } catch (error: any) {
      this.logger.error('[AuditLogsService]', 'createBatch failed', error);
      throw error;
    }
  }

  /**
   * Load audit log summary
   */
  async loadSummary(blueprintId: string, startDate?: Date, endDate?: Date): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const summary = await this.repository.getSummary(blueprintId, startDate, endDate);

      this._summary.set(summary);
      this._loading.set(false);

      this.logger.info('[AuditLogsService]', 'Audit log summary loaded');
    } catch (err: any) {
      this._error.set(err.message || 'Failed to load audit log summary');
      this._loading.set(false);
      this.logger.error('[AuditLogsService]', 'loadSummary failed', err);
    }
  }

  /**
   * Find logs by event type
   */
  findByEventType(blueprintId: string, eventType: AuditEventType, limitCount = 100): void {
    this._loading.set(true);
    this._error.set(null);

    this.repository
      .findByEventType(blueprintId, eventType, limitCount)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: logs => {
          this._logs.set(logs);
          this._hasMore.set(false);
          this._loading.set(false);
          this.logger.info('[AuditLogsService]', `Found ${logs.length} logs by event type`);
        },
        error: err => {
          this._error.set(err.message || 'Failed to find logs by event type');
          this._loading.set(false);
          this.logger.error('[AuditLogsService]', 'findByEventType failed', err);
        }
      });
  }

  /**
   * Find logs by category
   */
  findByCategory(blueprintId: string, category: AuditCategory, limitCount = 100): void {
    this._loading.set(true);
    this._error.set(null);

    this.repository
      .findByCategory(blueprintId, category, limitCount)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: logs => {
          this._logs.set(logs);
          this._hasMore.set(false);
          this._loading.set(false);
          this.logger.info('[AuditLogsService]', `Found ${logs.length} logs by category`);
        },
        error: err => {
          this._error.set(err.message || 'Failed to find logs by category');
          this._loading.set(false);
          this.logger.error('[AuditLogsService]', 'findByCategory failed', err);
        }
      });
  }

  /**
   * Find recent error logs
   */
  findRecentErrors(blueprintId: string, limitCount = 20): void {
    this._loading.set(true);
    this._error.set(null);

    this.repository
      .findRecentErrors(blueprintId, limitCount)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: logs => {
          this._logs.set(logs);
          this._hasMore.set(false);
          this._loading.set(false);
          this.logger.info('[AuditLogsService]', `Found ${logs.length} recent errors`);
        },
        error: err => {
          this._error.set(err.message || 'Failed to find recent errors');
          this._loading.set(false);
          this.logger.error('[AuditLogsService]', 'findRecentErrors failed', err);
        }
      });
  }

  /**
   * Find log by ID
   */
  findById(blueprintId: string, logId: string): void {
    this._loading.set(true);
    this._error.set(null);

    this.repository
      .findById(blueprintId, logId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: log => {
          if (log) {
            this._logs.set([log]);
          } else {
            this._logs.set([]);
            this._error.set('Audit log not found');
          }
          this._hasMore.set(false);
          this._loading.set(false);
        },
        error: err => {
          this._error.set(err.message || 'Failed to find audit log');
          this._loading.set(false);
          this.logger.error('[AuditLogsService]', 'findById failed', err);
        }
      });
  }

  /**
   * Clear local state
   */
  clearState(): void {
    this._logs.set([]);
    this._loading.set(false);
    this._error.set(null);
    this._currentBlueprintId.set(null);
    this._summary.set(null);
    this._hasMore.set(false);
    this._lastDoc.set(undefined);
  }

  /**
   * Get current blueprint ID
   */
  getCurrentBlueprintId(): string | null {
    return this._currentBlueprintId();
  }
}
