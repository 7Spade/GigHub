/**
 * Audit Logs Module Metadata
 *
 * Configuration and metadata for the Audit Logs module.
 * Defines module identity, dependencies, and default configuration.
 *
 * @module AuditLogsModuleMetadata
 * @author GigHub Development Team
 * @date 2025-12-13
 */

import { BlueprintModuleConfiguration } from '@core/models/blueprint-module.model';

/**
 * Audit Logs Module Metadata
 */
export const AUDIT_LOGS_MODULE_METADATA = {
  /** Unique module identifier */
  id: 'audit-logs',

  /** Module type identifier */
  moduleType: 'audit-logs',

  /** Display name */
  name: '審計日誌',

  /** English name */
  nameEn: 'Audit Logs',

  /** Module version */
  version: '1.0.0',

  /** Module description */
  description: '藍圖審計日誌模組，追蹤所有重要操作和事件，提供完整的審計追蹤能力',

  /** English description */
  descriptionEn: 'Blueprint audit logs module for tracking all significant actions and events with complete audit trail capability',

  /** Module dependencies */
  dependencies: [] as string[],

  /** Default load order */
  defaultOrder: 10,

  /** Module icon (ng-zorro-antd icon name) */
  icon: 'file-text',

  /** Module color theme */
  color: '#722ed1',

  /** Module category */
  category: 'system',

  /** Tags for filtering */
  tags: ['審計', 'audit', 'logging', 'tracking', 'security'],

  /** Author */
  author: 'GigHub Development Team',

  /** License */
  license: 'Proprietary'
} as const;

/**
 * Default Module Configuration
 *
 * Default settings when the module is first enabled.
 */
export const AUDIT_LOGS_MODULE_DEFAULT_CONFIG: BlueprintModuleConfiguration = {
  features: {
    enableAutoLogging: true,
    enableDetailedChanges: true,
    enableIpTracking: true,
    enableUserAgentTracking: true,
    enableGeolocation: false,
    enableRealtime: true,
    enableExport: true,
    enableRetention: true,
    enableArchiving: true,
    enableAlerts: true
  },

  settings: {
    retentionDays: 365,
    autoArchiveAfterDays: 90,
    maxLogsPerQuery: 100,
    alertOnCritical: true,
    alertOnHigh: false,
    enableDetailedStackTrace: false,
    logSuccessfulReads: false,
    logFailedReads: true,
    compressOldLogs: true,
    enableBatchLogging: true,
    batchSize: 10,
    batchInterval: 5000 // 5 seconds
  },

  ui: {
    icon: 'file-text',
    color: '#722ed1',
    position: 10,
    visibility: 'visible'
  },

  permissions: {
    requiredRoles: ['admin', 'auditor'],
    allowedActions: ['audit.read', 'audit.query', 'audit.export', 'audit.archive', 'audit.delete']
  },

  limits: {
    maxItems: 100000,
    maxStorage: 1073741824, // 1GB
    maxRequests: 10000
  }
};

/**
 * Module Permissions
 *
 * Defines permission actions for the Audit Logs module.
 */
export const AUDIT_LOGS_MODULE_PERMISSIONS = {
  READ: 'audit.read',
  QUERY: 'audit.query',
  EXPORT: 'audit.export',
  ARCHIVE: 'audit.archive',
  DELETE: 'audit.delete',
  VIEW_SENSITIVE: 'audit.view_sensitive'
} as const;

/**
 * Module Events
 *
 * Events emitted by the Audit Logs module.
 */
export const AUDIT_LOGS_MODULE_EVENTS = {
  LOG_CREATED: 'audit-logs.log_created',
  LOG_QUERIED: 'audit-logs.log_queried',
  LOG_EXPORTED: 'audit-logs.log_exported',
  LOG_ARCHIVED: 'audit-logs.log_archived',
  LOG_DELETED: 'audit-logs.log_deleted',
  RETENTION_EXCEEDED: 'audit-logs.retention_exceeded',
  CRITICAL_EVENT: 'audit-logs.critical_event',
  HIGH_EVENT: 'audit-logs.high_event',
  STORAGE_WARNING: 'audit-logs.storage_warning',
  BATCH_COMPLETED: 'audit-logs.batch_completed'
} as const;
