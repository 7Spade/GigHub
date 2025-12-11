/**
 * Quality Module Metadata
 *
 * Defines the metadata, configuration, and events for the Quality module.
 *
 * @author GigHub Development Team
 * @date 2025-12-11
 */

/**
 * Quality Module Metadata
 */
export const QUALITY_MODULE_METADATA = {
  id: 'quality',
  name: '品質管理',
  version: '1.0.0',
  description: '品質檢查與缺陷追蹤管理模組',
  dependencies: ['context', 'logger'],
  category: 'business',
  icon: 'safety',
  color: '#faad14'
} as const;

/**
 * Quality Module Default Configuration
 */
export const QUALITY_MODULE_DEFAULT_CONFIG = {
  autoInspection: false,
  requireApproval: true,
  defaultInspector: null,
  severityLevels: ['critical', 'major', 'minor'],
  statusFlow: ['pending', 'in_progress', 'passed', 'failed']
} as const;

/**
 * Quality Module Events
 */
export const QUALITY_MODULE_EVENTS = {
  // Inspection Events
  INSPECTION_CREATED: 'QUALITY_INSPECTION_CREATED',
  INSPECTION_UPDATED: 'QUALITY_INSPECTION_UPDATED',
  INSPECTION_DELETED: 'QUALITY_INSPECTION_DELETED',
  INSPECTION_PASSED: 'QUALITY_INSPECTION_PASSED',
  INSPECTION_FAILED: 'QUALITY_INSPECTION_FAILED',

  // Defect Events
  DEFECT_CREATED: 'QUALITY_DEFECT_CREATED',
  DEFECT_RESOLVED: 'QUALITY_DEFECT_RESOLVED',
  DEFECT_VERIFIED: 'QUALITY_DEFECT_VERIFIED',

  // Module Events
  MODULE_READY: 'QUALITY_MODULE_READY',
  MODULE_ERROR: 'QUALITY_MODULE_ERROR'
} as const;

/**
 * Quality Inspection Status
 */
export enum InspectionStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  PASSED = 'passed',
  FAILED = 'failed'
}

/**
 * Defect Severity Level
 */
export enum DefectSeverity {
  CRITICAL = 'critical',
  MAJOR = 'major',
  MINOR = 'minor'
}

/**
 * Defect Status
 */
export enum DefectStatus {
  OPEN = 'open',
  RESOLVED = 'resolved',
  VERIFIED = 'verified'
}

/**
 * Quality Inspection Interface
 */
export interface QualityInspection {
  id: string;
  blueprint_id: string;
  task_id?: string | null;
  title: string;
  description?: string | null;
  status: InspectionStatus;
  inspector_id: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Quality Defect Interface
 */
export interface QualityDefect {
  id: string;
  inspection_id: string;
  title: string;
  description?: string | null;
  severity: DefectSeverity;
  status: DefectStatus;
  assignee_id?: string | null;
  created_at: Date;
  resolved_at?: Date | null;
}
