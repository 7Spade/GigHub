/**
 * Quality Module
 *
 * Basic prototype implementation of IBlueprintModule for quality management.
 * Handles module lifecycle and integration with Blueprint Container.
 *
 * @author GigHub Development Team
 * @date 2025-12-11
 */

import { Injectable, signal, inject, WritableSignal } from '@angular/core';
import type { IExecutionContext } from '@core/blueprint/context/execution-context.interface';
import { ModuleStatus } from '@core/blueprint/modules/module-status.enum';
import { IBlueprintModule } from '@core/blueprint/modules/module.interface';
import { LoggerService } from '@core';

import { QUALITY_MODULE_METADATA, QUALITY_MODULE_DEFAULT_CONFIG, QUALITY_MODULE_EVENTS } from './module.metadata';
import { QualityService } from './quality.service';

/**
 * Quality Module Implementation (Basic Prototype)
 *
 * Provides quality inspection management functionality for Blueprint V2.
 * Implements full module lifecycle: init → start → ready → stop → dispose.
 */
@Injectable()
export class QualityModule implements IBlueprintModule {
  private readonly logger = inject(LoggerService);
  private readonly qualityService = inject(QualityService);

  /** Module ID */
  readonly id = QUALITY_MODULE_METADATA.id;

  /** Module name */
  readonly name = QUALITY_MODULE_METADATA.name;

  /** Module version */
  readonly version = QUALITY_MODULE_METADATA.version;

  /** Module description */
  readonly description = QUALITY_MODULE_METADATA.description;

  /** Module dependencies */
  readonly dependencies = QUALITY_MODULE_METADATA.dependencies;

  /** Module status signal */
  readonly status: WritableSignal<ModuleStatus> = signal(ModuleStatus.UNINITIALIZED);

  /** Execution context */
  private context?: IExecutionContext;

  /** Blueprint ID */
  private blueprintId?: string;

  /** Event unsubscribers */
  private eventUnsubscribers: Array<() => void> = [];

  /** Module exports */
  readonly exports = {
    service: () => this.qualityService,
    metadata: QUALITY_MODULE_METADATA,
    defaultConfig: QUALITY_MODULE_DEFAULT_CONFIG,
    events: QUALITY_MODULE_EVENTS
  };

  /**
   * Initialize the module
   */
  async init(context: IExecutionContext): Promise<void> {
    this.logger.info('[QualityModule]', 'Initializing...');
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

      this.status.set(ModuleStatus.INITIALIZED);
      this.logger.info('[QualityModule]', 'Initialized successfully');
    } catch (error) {
      this.status.set(ModuleStatus.ERROR);
      this.logger.error('[QualityModule]', 'Initialization failed', error as Error);
      throw error;
    }
  }

  /**
   * Start the module
   */
  async start(): Promise<void> {
    this.logger.info('[QualityModule]', 'Starting...');
    this.status.set(ModuleStatus.STARTING);

    try {
      if (!this.blueprintId) {
        throw new Error('Module not initialized - blueprint ID missing');
      }

      // Load initial data
      await this.qualityService.loadInspections(this.blueprintId);

      this.status.set(ModuleStatus.STARTED);
      this.logger.info('[QualityModule]', 'Started successfully');
    } catch (error) {
      this.status.set(ModuleStatus.ERROR);
      this.logger.error('[QualityModule]', 'Start failed', error as Error);
      throw error;
    }
  }

  /**
   * Signal module is ready
   */
  async ready(): Promise<void> {
    this.logger.info('[QualityModule]', 'Ready');
    this.status.set(ModuleStatus.READY);

    // Emit module ready event
    if (this.context?.eventBus) {
      this.context.eventBus.emit(
        QUALITY_MODULE_EVENTS.MODULE_READY,
        { status: 'ready', blueprintId: this.blueprintId },
        this.id
      );
    }

    this.status.set(ModuleStatus.RUNNING);
    this.logger.info('[QualityModule]', 'Running');
  }

  /**
   * Stop the module
   */
  async stop(): Promise<void> {
    this.logger.info('[QualityModule]', 'Stopping...');
    this.status.set(ModuleStatus.STOPPING);

    try {
      // Clear service state
      this.qualityService.clearState();

      this.status.set(ModuleStatus.STOPPED);
      this.logger.info('[QualityModule]', 'Stopped successfully');
    } catch (error) {
      this.status.set(ModuleStatus.ERROR);
      this.logger.error('[QualityModule]', 'Stop failed', error as Error);
      throw error;
    }
  }

  /**
   * Dispose of the module
   */
  async dispose(): Promise<void> {
    this.logger.info('[QualityModule]', 'Disposing...');

    try {
      // Unsubscribe from events
      this.unsubscribeFromEvents();

      // Clear all state
      this.qualityService.clearState();
      this.context = undefined;
      this.blueprintId = undefined;

      this.status.set(ModuleStatus.DISPOSED);
      this.logger.info('[QualityModule]', 'Disposed successfully');
    } catch (error) {
      this.status.set(ModuleStatus.ERROR);
      this.logger.error('[QualityModule]', 'Dispose failed', error as Error);
      throw error;
    }
  }

  /**
   * Validate module dependencies
   */
  private validateDependencies(context: IExecutionContext): void {
    for (const depId of this.dependencies) {
      const dependency = context.getModule?.(depId);
      if (!dependency) {
        this.logger.warn('[QualityModule]', `Dependency not found: ${depId} (may be optional)`);
      }
    }
  }

  /**
   * Subscribe to module events
   */
  private subscribeToEvents(context: IExecutionContext): void {
    if (!context.eventBus) {
      this.logger.warn('[QualityModule]', 'EventBus not available in context');
      return;
    }

    // Subscribe to task completion events for auto-inspection
    const unsubscribe = context.eventBus.on('TASK_COMPLETED', async (event) => {
      this.logger.debug('[QualityModule]', 'Task completed, consider creating inspection', event.payload);
      // TODO: Implement auto-inspection logic
    });

    this.eventUnsubscribers.push(unsubscribe);
    this.logger.debug('[QualityModule]', 'Subscribed to events');
  }

  /**
   * Unsubscribe from events
   */
  private unsubscribeFromEvents(): void {
    this.eventUnsubscribers.forEach(unsub => unsub());
    this.eventUnsubscribers = [];
    this.logger.debug('[QualityModule]', 'Unsubscribed from events');
  }
}
