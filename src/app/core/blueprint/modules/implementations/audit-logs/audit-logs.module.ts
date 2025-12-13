/**
 * Audit Logs Module
 *
 * Implementation of IBlueprintModule interface for audit log management.
 * Handles module lifecycle and integration with Blueprint Container.
 *
 * @author GigHub Development Team
 * @date 2025-12-13
 */

import { Injectable, signal, inject, WritableSignal } from '@angular/core';
import { LoggerService } from '@core';
import type { IExecutionContext } from '@core/blueprint/context/execution-context.interface';
import { ModuleStatus } from '@core/blueprint/modules/module-status.enum';
import { IBlueprintModule } from '@core/blueprint/modules/module.interface';
import { AuditLogRepository } from '@core/blueprint/repositories/audit-log.repository';

import { AuditLogsService } from './audit-logs.service';
import { AUDIT_LOGS_MODULE_METADATA, AUDIT_LOGS_MODULE_DEFAULT_CONFIG, AUDIT_LOGS_MODULE_EVENTS } from './module.metadata';

/**
 * Audit Logs Module Implementation
 *
 * Provides audit logging functionality for Blueprint V2.
 * Implements full module lifecycle: init → start → ready → stop → dispose.
 */
@Injectable()
export class AuditLogsModule implements IBlueprintModule {
  private readonly logger = inject(LoggerService);
  private readonly auditLogsService = inject(AuditLogsService);
  private readonly auditLogRepository = inject(AuditLogRepository);

  /** Module ID */
  readonly id = AUDIT_LOGS_MODULE_METADATA.id;

  /** Module name */
  readonly name = AUDIT_LOGS_MODULE_METADATA.name;

  /** Module version */
  readonly version = AUDIT_LOGS_MODULE_METADATA.version;

  /** Module description */
  readonly description = AUDIT_LOGS_MODULE_METADATA.description;

  /** Module dependencies */
  readonly dependencies = AUDIT_LOGS_MODULE_METADATA.dependencies;

  /** Module status signal */
  readonly status: WritableSignal<ModuleStatus> = signal(ModuleStatus.UNINITIALIZED);

  /** Execution context */
  private context?: IExecutionContext;

  /** Blueprint ID */
  private blueprintId?: string;

  /** Event unsubscribe functions */
  private eventUnsubscribers: Array<() => void> = [];

  /** Module exports */
  readonly exports = {
    service: () => this.auditLogsService,
    repository: () => this.auditLogRepository,
    metadata: AUDIT_LOGS_MODULE_METADATA,
    defaultConfig: AUDIT_LOGS_MODULE_DEFAULT_CONFIG,
    events: AUDIT_LOGS_MODULE_EVENTS
  };

  /**
   * Initialize the module
   */
  async init(context: IExecutionContext): Promise<void> {
    this.logger.info('[AuditLogsModule]', 'Initializing...');
    this.status.set(ModuleStatus.INITIALIZING);

    try {
      // Store context
      this.context = context;

      // Extract blueprint ID from context
      this.blueprintId = context.blueprintId;

      if (!this.blueprintId) {
        throw new Error('Blueprint ID not found in execution context');
      }

      // Validate dependencies
      this.validateDependencies(context);

      // Subscribe to module events
      this.subscribeToEvents(context);

      // Register module exports
      this.registerExports(context);

      this.status.set(ModuleStatus.INITIALIZED);
      this.logger.info('[AuditLogsModule]', 'Initialized successfully');
    } catch (error) {
      this.status.set(ModuleStatus.ERROR);
      this.logger.error('[AuditLogsModule]', 'Initialization failed', error as Error);
      throw error;
    }
  }

  /**
   * Start the module
   */
  async start(): Promise<void> {
    this.logger.info('[AuditLogsModule]', 'Starting...');
    this.status.set(ModuleStatus.STARTING);

    try {
      if (!this.blueprintId) {
        throw new Error('Module not initialized - blueprint ID missing');
      }

      // Load initial data (recent logs and summary)
      await Promise.all([this.auditLogsService.loadLogs(this.blueprintId, 50), this.auditLogsService.loadSummary(this.blueprintId)]);

      this.status.set(ModuleStatus.STARTED);
      this.logger.info('[AuditLogsModule]', 'Started successfully');
    } catch (error) {
      this.status.set(ModuleStatus.ERROR);
      this.logger.error('[AuditLogsModule]', 'Start failed', error as Error);
      throw error;
    }
  }

  /**
   * Signal module is ready
   */
  async ready(): Promise<void> {
    this.logger.info('[AuditLogsModule]', 'Ready');
    this.status.set(ModuleStatus.READY);

    try {
      // Emit module ready event
      if (this.context?.eventBus) {
        this.context.eventBus.emit(
          AUDIT_LOGS_MODULE_EVENTS.LOG_CREATED,
          {
            status: 'ready',
            blueprintId: this.blueprintId,
            timestamp: new Date()
          },
          this.id
        );
      }

      this.status.set(ModuleStatus.RUNNING);
      this.logger.info('[AuditLogsModule]', 'Running');
    } catch (error) {
      this.status.set(ModuleStatus.ERROR);
      this.logger.error('[AuditLogsModule]', 'Ready transition failed', error as Error);
      throw error;
    }
  }

  /**
   * Stop the module
   */
  async stop(): Promise<void> {
    this.logger.info('[AuditLogsModule]', 'Stopping...');
    this.status.set(ModuleStatus.STOPPING);

    try {
      // Clear service state
      this.auditLogsService.clearState();

      this.status.set(ModuleStatus.STOPPED);
      this.logger.info('[AuditLogsModule]', 'Stopped successfully');
    } catch (error) {
      this.status.set(ModuleStatus.ERROR);
      this.logger.error('[AuditLogsModule]', 'Stop failed', error as Error);
      throw error;
    }
  }

  /**
   * Dispose of the module
   */
  async dispose(): Promise<void> {
    this.logger.info('[AuditLogsModule]', 'Disposing...');

    try {
      // Unsubscribe from events
      this.unsubscribeFromEvents();

      // Clear all state
      this.auditLogsService.clearState();
      this.context = undefined;
      this.blueprintId = undefined;

      this.status.set(ModuleStatus.DISPOSED);
      this.logger.info('[AuditLogsModule]', 'Disposed successfully');
    } catch (error) {
      this.status.set(ModuleStatus.ERROR);
      this.logger.error('[AuditLogsModule]', 'Dispose failed', error as Error);
      throw error;
    }
  }

  /**
   * Validate module dependencies
   */
  private validateDependencies(context: IExecutionContext): void {
    // Audit logs module has no dependencies
    // It's a foundational module that other modules depend on
    this.logger.debug('[AuditLogsModule]', 'Dependencies validated');
  }

  /**
   * Subscribe to module events
   */
  private subscribeToEvents(context: IExecutionContext): void {
    if (!context.eventBus) {
      this.logger.warn('[AuditLogsModule]', 'EventBus not available in context');
      return;
    }

    const eventBus = context.eventBus;

    // Subscribe to audit log events from other modules
    this.eventUnsubscribers.push(
      eventBus.on<Record<string, unknown>>(AUDIT_LOGS_MODULE_EVENTS.LOG_CREATED, event => {
        this.logger.debug('[AuditLogsModule]', 'Audit log created event received', event.payload);
      })
    );

    this.eventUnsubscribers.push(
      eventBus.on<Record<string, unknown>>(AUDIT_LOGS_MODULE_EVENTS.CRITICAL_EVENT, event => {
        this.logger.warn('[AuditLogsModule]', 'Critical audit event detected', event.payload);
        // Could trigger notifications or alerts here
      })
    );

    this.eventUnsubscribers.push(
      eventBus.on<Record<string, unknown>>(AUDIT_LOGS_MODULE_EVENTS.HIGH_EVENT, event => {
        this.logger.info('[AuditLogsModule]', 'High severity audit event detected', event.payload);
      })
    );

    this.eventUnsubscribers.push(
      eventBus.on<Record<string, unknown>>(AUDIT_LOGS_MODULE_EVENTS.STORAGE_WARNING, event => {
        this.logger.warn('[AuditLogsModule]', 'Audit log storage warning', event.payload);
      })
    );

    this.logger.debug('[AuditLogsModule]', `Subscribed to ${this.eventUnsubscribers.length} events`);
  }

  /**
   * Unsubscribe from events
   */
  private unsubscribeFromEvents(): void {
    // Clean up event subscriptions
    this.eventUnsubscribers.forEach(unsubscribe => unsubscribe());
    this.eventUnsubscribers = [];
    this.logger.debug('[AuditLogsModule]', 'Unsubscribed from all events');
  }

  /**
   * Register module exports
   */
  private registerExports(context: IExecutionContext): void {
    // Exports are available via the exports property
    this.logger.debug('[AuditLogsModule]', 'Module exports registered');
  }
}
