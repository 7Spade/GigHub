/**
 * Logs Module
 * Implements IBlueprintModule for full lifecycle management.
 */

import { Injectable, inject, signal } from '@angular/core';
import { IBlueprintModule, ModuleMetadata, IExecutionContext, ModuleStatus } from '@core/blueprint/interfaces';
import { LoggerService } from '@core/services/logger.service';

import { LogsRepository } from './logs.repository';
import { LogsService } from './logs.service';
import { LOGS_MODULE_METADATA } from './module.metadata';

@Injectable()
export class LogsModule implements IBlueprintModule {
  readonly id = 'logs';
  readonly version = '1.0.0';
  readonly metadata: ModuleMetadata = LOGS_MODULE_METADATA as any;

  private readonly logger = inject(LoggerService);
  private readonly logsService = inject(LogsService);
  private readonly logsRepository = inject(LogsRepository);

  private _status = signal<ModuleStatus>(ModuleStatus.UNINITIALIZED);
  readonly status = this._status.asReadonly();

  private _context: IExecutionContext | null = null;
  private _initialized = false;
  private _started = false;

  async init(context: IExecutionContext): Promise<void> {
    if (this._initialized) return;

    this._status.set(ModuleStatus.INITIALIZING);
    this.logger.info('[LogsModule] Initializing...');

    try {
      this._context = context;
      if (!context.blueprintId) {
        throw new Error('Blueprint ID required');
      }

      this._initialized = true;
      this._status.set(ModuleStatus.INITIALIZED);
      this.logger.info('[LogsModule] Initialized');
    } catch (err) {
      this._status.set(ModuleStatus.ERROR);
      throw err;
    }
  }

  async start(): Promise<void> {
    if (!this._initialized) throw new Error('Not initialized');
    if (this._started) return;

    this._status.set(ModuleStatus.STARTING);
    this.logger.info('[LogsModule] Starting...');

    try {
      if (this._context?.blueprintId) {
        await this.logsService.loadLogs(this._context.blueprintId);
      }

      this._started = true;
      this._status.set(ModuleStatus.STARTED);
      this.logger.info('[LogsModule] Started');
    } catch (err) {
      this._status.set(ModuleStatus.ERROR);
      throw err;
    }
  }

  async ready(): Promise<void> {
    if (!this._started) throw new Error('Not started');
    this._status.set(ModuleStatus.READY);
    this._status.set(ModuleStatus.RUNNING);
    this.logger.info('[LogsModule] Running');
  }

  async stop(): Promise<void> {
    if (!this._started) return;

    this._status.set(ModuleStatus.STOPPING);
    this.logsService.clear();
    this._started = false;
    this._status.set(ModuleStatus.STOPPED);
    this.logger.info('[LogsModule] Stopped');
  }

  async dispose(): Promise<void> {
    if (this._started) await this.stop();
    this.logsService.clear();
    this._context = null;
    this._initialized = false;
    this._status.set(ModuleStatus.DISPOSED);
    this.logger.info('[LogsModule] Disposed');
  }

  getExports(): Record<string, any> {
    return {
      service: this.logsService,
      repository: this.logsRepository,
      metadata: this.metadata
    };
  }

  getStatus(): ModuleStatus {
    return this._status();
  }

  getContext(): IExecutionContext | null {
    return this._context;
  }
}
