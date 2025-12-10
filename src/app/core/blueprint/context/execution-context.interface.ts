import type { IEventBus } from '../events/event-bus.interface';
import type { IResourceProvider } from '../container/resource-provider.interface';
import type { IBlueprintConfig } from '../config/blueprint-config.interface';
import type { TenantInfo } from './tenant-info.interface';
import type { LoggerService } from '@core';

/**
 * Execution Context Interface
 * 
 * Provides modules with access to all shared resources and services
 * they need to operate within a blueprint.
 * 
 * This is the primary integration point between modules and the container.
 * 
 * @example
 * ```typescript
 * async init(context: IExecutionContext): Promise<void> {
 *   // Access event bus
 *   context.eventBus.on('SOME_EVENT', this.handler);
 *   
 *   // Access Firestore
 *   const firestore = context.use<Firestore>('firestore');
 *   
 *   // Log messages
 *   context.logger.info('[MyModule]', 'Initialized');
 * }
 * ```
 */
export interface IExecutionContext {
  /**
   * Blueprint ID
   * Unique identifier of the current blueprint instance
   */
  blueprintId: string;
  
  /**
   * Tenant Information
   * Multi-tenant scope and access control information
   */
  tenant: TenantInfo;
  
  /**
   * Event Bus
   * Pub/sub system for module communication
   */
  eventBus: IEventBus;
  
  /**
   * Resource Provider
   * Access to shared resources via dependency injection
   */
  resources: IResourceProvider;
  
  /**
   * Blueprint Configuration
   * Configuration settings for this blueprint instance
   */
  config: IBlueprintConfig;
  
  /**
   * Logger Service
   * Structured logging with context
   */
  logger: LoggerService;
  
  /**
   * Get Resource
   * 
   * Convenience method to access resources by name.
   * Equivalent to resources.get<T>(name)
   * 
   * @param resourceName - Name of the resource to retrieve
   * @returns The requested resource
   * @throws Error if resource not found
   * 
   * @example
   * ```typescript
   * const firestore = context.use<Firestore>('firestore');
   * const auth = context.use<Auth>('auth');
   * ```
   */
  use<T>(resourceName: string): T;
}
