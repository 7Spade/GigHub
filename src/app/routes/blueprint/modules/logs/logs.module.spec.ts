/**
 * Logs Module Tests
 * Unit tests for Logs Module lifecycle.
 */

import { TestBed } from '@angular/core/testing';
import { LogsModule } from './logs.module';
import { LogsService } from './logs.service';
import { LogsRepository } from './logs.repository';
import { ModuleStatus } from '@core/blueprint/interfaces';

describe('LogsModule', () => {
  let module: LogsModule;
  let service: LogsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LogsModule,
        LogsService,
        { provide: LogsRepository, useValue: {} }
      ]
    });

    module = TestBed.inject(LogsModule);
    service = TestBed.inject(LogsService);
  });

  it('should create', () => {
    expect(module).toBeTruthy();
  });

  it('should have correct metadata', () => {
    expect(module.id).toBe('logs');
    expect(module.version).toBe('1.0.0');
    expect(module.metadata).toBeDefined();
  });

  it('should initialize successfully', async () => {
    const context = { blueprintId: 'test-123' };
    await module.init(context);
    expect(module.getStatus()).toBe(ModuleStatus.INITIALIZED);
  });

  it('should transition through full lifecycle', async () => {
    const context = { blueprintId: 'test-123' };
    
    await module.init(context);
    expect(module.getStatus()).toBe(ModuleStatus.INITIALIZED);
    
    await module.start();
    expect(module.getStatus()).toBe(ModuleStatus.STARTED);
    
    await module.ready();
    expect(module.getStatus()).toBe(ModuleStatus.RUNNING);
    
    await module.stop();
    expect(module.getStatus()).toBe(ModuleStatus.STOPPED);
    
    await module.dispose();
    expect(module.getStatus()).toBe(ModuleStatus.DISPOSED);
  });

  it('should export service and repository', () => {
    const exports = module.getExports();
    expect(exports.service).toBeDefined();
    expect(exports.repository).toBeDefined();
    expect(exports.metadata).toBeDefined();
  });
});
