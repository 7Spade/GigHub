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

  /** Blueprint container is starting */
  CONTAINER_STARTING = 'CONTAINER_STARTING',

  /** Blueprint container has started */
  CONTAINER_STARTED = 'CONTAINER_STARTED',

  /** Blueprint container is stopping */
  CONTAINER_STOPPING = 'CONTAINER_STOPPING',

  /** Blueprint container has stopped */
  CONTAINER_STOPPED = 'CONTAINER_STOPPED',

  /** Blueprint container encountered an error */
  CONTAINER_ERROR = 'CONTAINER_ERROR',

  // ===== Module Lifecycle Events =====
  /** Module has been registered in the registry */
  MODULE_REGISTERED = 'MODULE_REGISTERED',

  /** Module has been initialized */
  MODULE_INITIALIZED = 'MODULE_INITIALIZED',

  /** Module is starting */
  MODULE_STARTING = 'MODULE_STARTING',

  /** Module has started */
  MODULE_STARTED = 'MODULE_STARTED',

  /** Module is ready */
  MODULE_READY = 'MODULE_READY',

  /** Module is stopping */
  MODULE_STOPPING = 'MODULE_STOPPING',

  /** Module has stopped */
  MODULE_STOPPED = 'MODULE_STOPPED',

  /** Module has been disposed */
  MODULE_DISPOSED = 'MODULE_DISPOSED',

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
