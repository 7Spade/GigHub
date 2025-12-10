/**
 * Standard Blueprint Event Types
 * 
 * Centralized event type definitions for the blueprint system.
 * Ensures consistency and prevents typos in event handling.
 */
export enum BlueprintEventType {
  // ===== Container Lifecycle Events =====
  /** Blueprint container has been initialized */
  CONTAINER_INITIALIZED = 'CONTAINER_INITIALIZED',
  
  /** Blueprint container has started */
  CONTAINER_STARTED = 'CONTAINER_STARTED',
  
  /** Blueprint container has stopped */
  CONTAINER_STOPPED = 'CONTAINER_STOPPED',
  
  // ===== Module Lifecycle Events =====
  /** Module has been registered in the registry */
  MODULE_REGISTERED = 'MODULE_REGISTERED',
  
  /** Module has been loaded and initialized */
  MODULE_LOADED = 'MODULE_LOADED',
  
  /** Module has been unloaded */
  MODULE_UNLOADED = 'MODULE_UNLOADED',
  
  /** Module encountered an error */
  MODULE_ERROR = 'MODULE_ERROR',
  
  // ===== Blueprint CRUD Events =====
  /** New blueprint created */
  BLUEPRINT_CREATED = 'BLUEPRINT_CREATED',
  
  /** Blueprint updated */
  BLUEPRINT_UPDATED = 'BLUEPRINT_UPDATED',
  
  /** Blueprint deleted */
  BLUEPRINT_DELETED = 'BLUEPRINT_DELETED',
  
  /** Blueprint activated */
  BLUEPRINT_ACTIVATED = 'BLUEPRINT_ACTIVATED',
  
  /** Blueprint deactivated */
  BLUEPRINT_DEACTIVATED = 'BLUEPRINT_DEACTIVATED',
  
  // ===== Business Events (Examples from Core Modules) =====
  /** Task created */
  TASK_CREATED = 'TASK_CREATED',
  
  /** Task updated */
  TASK_UPDATED = 'TASK_UPDATED',
  
  /** Task completed */
  TASK_COMPLETED = 'TASK_COMPLETED',
  
  /** Log entry created */
  LOG_CREATED = 'LOG_CREATED',
  
  /** Quality check requested */
  QUALITY_CHECK_REQUESTED = 'QUALITY_CHECK_REQUESTED',
  
  /** Quality check completed */
  QUALITY_CHECK_COMPLETED = 'QUALITY_CHECK_COMPLETED'
}
