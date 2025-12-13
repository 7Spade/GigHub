/**
 * Audit Logs Module Unit Tests
 *
 * Tests for the AuditLogsModule implementation.
 *
 * @author GigHub Development Team
 * @date 2025-12-13
 */

import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { LoggerService } from '@core';
import { ModuleStatus } from '@core/blueprint/modules/module-status.enum';
import { IExecutionContext } from '@core/blueprint/context/execution-context.interface';
import { IEventBus } from '@core/blueprint/events/event-bus.interface';
import { AuditLogsModule } from './audit-logs.module';
import { AuditLogsService } from './audit-logs.service';
import { AuditLogRepository } from '@core/blueprint/repositories/audit-log.repository';

/**
 * Mock Event Bus
 */
class MockEventBus implements IEventBus {
  private handlers = new Map<string, Array<(event: any) => void>>();

  emit<T>(eventType: string, payload: T, source?: string): void {
    const handlers = this.handlers.get(eventType) || [];
    handlers.forEach(handler => handler({ eventType, payload, source }));
  }

  on<T>(eventType: string, handler: (event: any) => void): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);

    return () => {
      const handlers = this.handlers.get(eventType) || [];
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    };
  }

  off(eventType: string, handler?: (event: any) => void): void {
    if (handler) {
      const handlers = this.handlers.get(eventType) || [];
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    } else {
      this.handlers.delete(eventType);
    }
  }

  clear(): void {
    this.handlers.clear();
  }
}

/**
 * Mock Execution Context
 */
function createMockExecutionContext(blueprintId: string): IExecutionContext {
  return {
    blueprintId,
    eventBus: new MockEventBus(),
    sharedContext: {
      getState: () => undefined,
      setState: () => {},
      removeState: () => {},
      hasState: () => false,
      clear: () => {}
    } as any
  };
}

describe('AuditLogsModule', () => {
  let module: AuditLogsModule;
  let mockContext: IExecutionContext;
  let mockLogger: jasmine.SpyObj<LoggerService>;
  let mockService: jasmine.SpyObj<AuditLogsService>;
  let mockRepository: jasmine.SpyObj<AuditLogRepository>;

  beforeEach(() => {
    // Create mocks
    mockLogger = jasmine.createSpyObj('LoggerService', ['info', 'error', 'warn', 'debug']);
    mockService = jasmine.createSpyObj('AuditLogsService', ['loadLogs', 'loadSummary', 'clearState']);
    mockRepository = jasmine.createSpyObj('AuditLogRepository', ['findByBlueprintId', 'create']);

    mockContext = createMockExecutionContext('test-blueprint-123');

    TestBed.configureTestingModule({
      providers: [
        AuditLogsModule,
        { provide: LoggerService, useValue: mockLogger },
        { provide: AuditLogsService, useValue: mockService },
        { provide: AuditLogRepository, useValue: mockRepository }
      ]
    });

    module = TestBed.inject(AuditLogsModule);
  });

  it('should be created', () => {
    expect(module).toBeTruthy();
  });

  it('should have correct module metadata', () => {
    expect(module.id).toBe('audit-logs');
    expect(module.name).toBe('審計日誌');
    expect(module.version).toBe('1.0.0');
    expect(module.description).toContain('藍圖審計日誌模組');
    expect(module.dependencies).toEqual([]);
  });

  it('should start with UNINITIALIZED status', () => {
    expect(module.status()).toBe(ModuleStatus.UNINITIALIZED);
  });

  it('should have exports object', () => {
    expect(module.exports).toBeDefined();
    expect(module.exports.service).toBeDefined();
    expect(module.exports.repository).toBeDefined();
    expect(module.exports.metadata).toBeDefined();
    expect(module.exports.defaultConfig).toBeDefined();
    expect(module.exports.events).toBeDefined();
  });

  describe('Module Lifecycle', () => {
    it('should initialize successfully', async () => {
      mockService.loadLogs.and.returnValue(Promise.resolve());
      mockService.loadSummary.and.returnValue(Promise.resolve());

      await module.init(mockContext);

      expect(module.status()).toBe(ModuleStatus.INITIALIZED);
      expect(mockLogger.info).toHaveBeenCalledWith('[AuditLogsModule]', 'Initializing...');
      expect(mockLogger.info).toHaveBeenCalledWith('[AuditLogsModule]', 'Initialized successfully');
    });

    it('should throw error if blueprint ID is missing', async () => {
      const invalidContext = { ...mockContext, blueprintId: undefined } as any;

      await expectAsync(module.init(invalidContext)).toBeRejectedWithError(
        'Blueprint ID not found in execution context'
      );
      expect(module.status()).toBe(ModuleStatus.ERROR);
    });

    it('should start successfully after initialization', async () => {
      mockService.loadLogs.and.returnValue(Promise.resolve());
      mockService.loadSummary.and.returnValue(Promise.resolve());

      await module.init(mockContext);
      await module.start();

      expect(module.status()).toBe(ModuleStatus.STARTED);
      expect(mockService.loadLogs).toHaveBeenCalledWith('test-blueprint-123', 50);
      expect(mockService.loadSummary).toHaveBeenCalledWith('test-blueprint-123');
    });

    it('should transition to RUNNING after ready', async () => {
      mockService.loadLogs.and.returnValue(Promise.resolve());
      mockService.loadSummary.and.returnValue(Promise.resolve());

      await module.init(mockContext);
      await module.start();
      await module.ready();

      expect(module.status()).toBe(ModuleStatus.RUNNING);
    });

    it('should stop successfully', async () => {
      mockService.loadLogs.and.returnValue(Promise.resolve());
      mockService.loadSummary.and.returnValue(Promise.resolve());

      await module.init(mockContext);
      await module.start();
      await module.stop();

      expect(module.status()).toBe(ModuleStatus.STOPPED);
      expect(mockService.clearState).toHaveBeenCalled();
    });

    it('should dispose successfully', async () => {
      mockService.loadLogs.and.returnValue(Promise.resolve());
      mockService.loadSummary.and.returnValue(Promise.resolve());

      await module.init(mockContext);
      await module.start();
      await module.dispose();

      expect(module.status()).toBe(ModuleStatus.DISPOSED);
      expect(mockService.clearState).toHaveBeenCalled();
    });
  });

  describe('Event Handling', () => {
    it('should subscribe to events during initialization', async () => {
      mockService.loadLogs.and.returnValue(Promise.resolve());
      mockService.loadSummary.and.returnValue(Promise.resolve());

      await module.init(mockContext);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        '[AuditLogsModule]',
        jasmine.stringContaining('Subscribed to')
      );
    });

    it('should unsubscribe from events on dispose', async () => {
      mockService.loadLogs.and.returnValue(Promise.resolve());
      mockService.loadSummary.and.returnValue(Promise.resolve());

      await module.init(mockContext);
      await module.dispose();

      expect(mockLogger.debug).toHaveBeenCalledWith('[AuditLogsModule]', 'Unsubscribed from all events');
    });
  });

  describe('Module Exports', () => {
    it('should return service from exports', () => {
      const service = module.exports.service();
      expect(service).toBe(mockService);
    });

    it('should return repository from exports', () => {
      const repository = module.exports.repository();
      expect(repository).toBe(mockRepository);
    });

    it('should return metadata from exports', () => {
      const metadata = module.exports.metadata;
      expect(metadata.id).toBe('audit-logs');
    });

    it('should return default config from exports', () => {
      const config = module.exports.defaultConfig;
      expect(config).toBeDefined();
      expect(config.features).toBeDefined();
    });

    it('should return events from exports', () => {
      const events = module.exports.events;
      expect(events).toBeDefined();
      expect(events.LOG_CREATED).toBe('audit-logs.log_created');
    });
  });
});
