/**
 * Task Types
 * 任務類型定義
 * 
 * Following Occam's Razor: Simple, essential task management
 * Designed for extensibility without over-engineering
 */

/**
 * Task status enum
 * 任務狀態列舉
 */
export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

/**
 * Task priority enum (reserved for future)
 * 任務優先級列舉（為未來擴展預留）
 */
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

/**
 * Task entity
 * 任務實體
 */
export interface Task {
  /** Task ID */
  id: string;

  /** Blueprint ID this task belongs to */
  blueprintId: string;

  /** Task title */
  title: string;

  /** Task description (optional) */
  description?: string;

  /** Task status */
  status: TaskStatus;

  /** Assignee account ID (optional) */
  assigneeId?: string;

  /** Creator account ID */
  creatorId: string;

  /** Due date (optional) */
  dueDate?: Date;

  /** Created timestamp */
  createdAt: Date;

  /** Last updated timestamp */
  updatedAt: Date;

  /** Soft delete timestamp */
  deletedAt?: Date | null;

  // Reserved for future extensions
  /** Priority (reserved) */
  priority?: TaskPriority;

  /** Tags (reserved) */
  tags?: string[];

  /** Attachments (reserved) */
  attachments?: string[];

  /** Metadata for extensions */
  metadata?: Record<string, any>;
}

/**
 * Create task request
 * 創建任務請求
 */
export interface CreateTaskRequest {
  /** Blueprint ID */
  blueprintId: string;

  /** Task title */
  title: string;

  /** Task description (optional) */
  description?: string;

  /** Assignee account ID (optional) */
  assigneeId?: string;

  /** Creator account ID */
  creatorId: string;

  /** Due date (optional) */
  dueDate?: Date;

  /** Initial status (defaults to TODO) */
  status?: TaskStatus;

  /** Priority (optional) */
  priority?: TaskPriority;

  /** Tags (optional) */
  tags?: string[];
}

/**
 * Update task request
 * 更新任務請求
 */
export interface UpdateTaskRequest {
  /** Task title */
  title?: string;

  /** Task description */
  description?: string;

  /** Task status */
  status?: TaskStatus;

  /** Assignee account ID */
  assigneeId?: string;

  /** Due date */
  dueDate?: Date;

  /** Priority */
  priority?: TaskPriority;

  /** Tags */
  tags?: string[];
}

/**
 * Task query options
 * 任務查詢選項
 */
export interface TaskQueryOptions {
  /** Filter by blueprint ID */
  blueprintId?: string;

  /** Filter by status */
  status?: TaskStatus;

  /** Filter by assignee */
  assigneeId?: string;

  /** Filter by creator */
  creatorId?: string;

  /** Include deleted tasks */
  includeDeleted?: boolean;

  /** Limit results */
  limit?: number;
}
