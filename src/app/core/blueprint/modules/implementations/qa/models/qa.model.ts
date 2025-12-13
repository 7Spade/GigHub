/**
 * QA Models - Quality assurance and defect tracking
 *
 * @module QAModels
 * @author GigHub Development Team
 * @date 2025-12-13
 */

export enum DefectSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum DefectStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

export interface QADefect {
  id: string;
  blueprintId: string;
  title: string;
  description: string;
  severity: DefectSeverity;
  status: DefectStatus;
  location?: string;
  photos?: string[];
  assigneeId?: string;
  resolvedDate?: Date;
  metadata?: Record<string, unknown>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateQADefectData {
  blueprintId: string;
  title: string;
  description: string;
  severity: DefectSeverity;
  location?: string;
  assigneeId?: string;
  createdBy: string;
}

export interface UpdateQADefectData {
  title?: string;
  description?: string;
  severity?: DefectSeverity;
  status?: DefectStatus;
  location?: string;
  photos?: string[];
  assigneeId?: string;
  resolvedDate?: Date;
  metadata?: Record<string, unknown>;
}

export interface QAQueryOptions {
  severity?: DefectSeverity;
  status?: DefectStatus;
  assigneeId?: string;
  limit?: number;
}
