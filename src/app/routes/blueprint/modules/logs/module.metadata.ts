/**
 * Logs Module Metadata
 *
 * Configuration, features, permissions and event definitions for the Logs module.
 *
 * @author GigHub Development Team
 * @date 2025-12-11
 */

import { ModuleMetadata, ModuleFeature, ModulePermission, ModuleEventDefinition } from '@core/blueprint/modules/module.interface';

/**
 * Logs Module Metadata
 */
export const LOGS_MODULE_METADATA: ModuleMetadata = {
  id: 'logs',
  name: '日誌管理',
  nameEn: 'Log Management',
  version: '1.0.0',
  description: '系統日誌記錄、查詢與分析功能',
  descriptionEn: 'System log recording, querying and analysis',
  author: 'GigHub Development Team',
  homepage: '/blueprint/:blueprintId/logs',
  icon: 'file-text',
  category: 'monitoring',
  tags: ['logs', 'monitoring', 'debugging', 'audit'],
  dependencies: ['context', 'logger', 'audit'],

  features: [
    {
      id: 'log-recording',
      name: '日誌記錄',
      nameEn: 'Log Recording',
      description: '記錄系統運行日誌',
      descriptionEn: 'Record system operation logs',
      enabled: true
    },
    {
      id: 'log-query',
      name: '日誌查詢',
      nameEn: 'Log Query',
      description: '查詢與篩選歷史日誌',
      descriptionEn: 'Query and filter historical logs',
      enabled: true
    },
    {
      id: 'log-analysis',
      name: '日誌分析',
      nameEn: 'Log Analysis',
      description: '統計分析日誌資料',
      descriptionEn: 'Analyze log data statistically',
      enabled: true
    },
    {
      id: 'log-export',
      name: '日誌匯出',
      nameEn: 'Log Export',
      description: '匯出日誌為檔案',
      descriptionEn: 'Export logs to file',
      enabled: false
    }
  ] as ModuleFeature[],

  permissions: [
    {
      id: 'logs:view',
      name: '查看日誌',
      nameEn: 'View Logs',
      description: '查看日誌列表與詳情',
      descriptionEn: 'View log list and details',
      roles: ['admin', 'manager', 'member']
    },
    {
      id: 'logs:create',
      name: '建立日誌',
      nameEn: 'Create Logs',
      description: '建立新日誌記錄',
      descriptionEn: 'Create new log records',
      roles: ['admin', 'manager', 'member']
    },
    {
      id: 'logs:delete',
      name: '刪除日誌',
      nameEn: 'Delete Logs',
      description: '刪除日誌記錄',
      descriptionEn: 'Delete log records',
      roles: ['admin']
    },
    {
      id: 'logs:export',
      name: '匯出日誌',
      nameEn: 'Export Logs',
      description: '匯出日誌資料',
      descriptionEn: 'Export log data',
      roles: ['admin', 'manager']
    }
  ] as ModulePermission[]
};

/**
 * Logs Module Default Configuration
 */
export const LOGS_MODULE_DEFAULT_CONFIG = {
  retention: {
    days: 90,
    autoCleanup: true
  },
  display: {
    pageSize: 50,
    defaultLevel: 'INFO',
    showTimestamp: true,
    showSource: true
  },
  filters: {
    enabledLevels: ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'],
    enabledCategories: ['system', 'user', 'api', 'database']
  }
};

/**
 * Logs Module Events
 */
export const LOGS_MODULE_EVENTS: ModuleEventDefinition[] = [
  {
    type: 'log-created',
    description: '新日誌記錄建立',
    descriptionEn: 'New log record created',
    payload: {
      logId: 'string',
      level: 'string',
      message: 'string',
      timestamp: 'Date'
    }
  },
  {
    type: 'log-deleted',
    description: '日誌記錄刪除',
    descriptionEn: 'Log record deleted',
    payload: {
      logId: 'string',
      deletedBy: 'string',
      timestamp: 'Date'
    }
  },
  {
    type: 'logs-exported',
    description: '日誌匯出',
    descriptionEn: 'Logs exported',
    payload: {
      count: 'number',
      format: 'string',
      exportedBy: 'string',
      timestamp: 'Date'
    }
  }
];
