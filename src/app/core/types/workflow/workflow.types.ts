/**
 * Workflow Types
 * 工作流類型定義
 *
 * Following Occam's Razor: Simple, essential workflow management
 * Event-driven architecture for module decoupling
 *
 * @author GigHub Development Team
 * @date 2025-12-11
 */

/**
 * Workflow Event Type
 * 工作流事件類型
 */
export enum WorkflowEventType {
  // Task Events
  TASK_CREATED = 'task.created',
  TASK_UPDATED = 'task.updated',
  TASK_DELETED = 'task.deleted',
  TASK_QUANTITY_UPDATED = 'task.quantity.updated',
  TASK_QUANTITY_REACHED = 'task.quantity.reached',
  TASK_STATUS_CHANGED = 'task.status.changed',
  TASK_AUTO_COMPLETED = 'task.auto.completed',
  TASK_SENT_TO_QC = 'task.sent.to.qc',

  // Log Events
  LOG_CREATED = 'log.created',
  LOG_SUBMITTED = 'log.submitted',
  LOG_TASK_ADDED = 'log.task.added',

  // QC Events
  QC_CREATED = 'qc.created',
  QC_ASSIGNED = 'qc.assigned',
  QC_STARTED = 'qc.started',
  QC_PASSED = 'qc.passed',
  QC_REJECTED = 'qc.rejected',
  QC_CANCELLED = 'qc.cancelled'
}

/**
 * Workflow Event
 * 工作流事件
 */
export interface WorkflowEvent<T = any> {
  /** Event type */
  type: WorkflowEventType;

  /** Event payload */
  payload: T;

  /** Event timestamp */
  timestamp: Date;

  /** Source module/component */
  source: string;

  /** Blueprint ID (context) */
  blueprintId: string;

  /** Actor account ID */
  actorId?: string;

  /** Correlation ID for tracking */
  correlationId?: string;

  /** Metadata */
  metadata?: Record<string, any>;
}

/**
 * Task Quantity Reached Event Payload
 * 任務數量達標事件負載
 */
export interface TaskQuantityReachedPayload {
  /** Task ID */
  taskId: string;

  /** Task title */
  taskTitle: string;

  /** Total quantity */
  totalQuantity: number;

  /** Completed quantity */
  completedQuantity: number;

  /** Unit */
  unit: string;

  /** Auto complete enabled */
  autoCompleteEnabled: boolean;

  /** Auto send to QC enabled */
  autoSendToQCEnabled: boolean;
}

/**
 * Task Sent to QC Event Payload
 * 任務送品管事件負載
 */
export interface TaskSentToQCPayload {
  /** Task ID */
  taskId: string;

  /** Task title */
  taskTitle: string;

  /** QC ID created */
  qcId: string;

  /** Quantity to inspect */
  quantityToInspect: number;

  /** Unit */
  unit: string;
}

/**
 * QC Result Event Payload
 * 品管結果事件負載
 */
export interface QCResultPayload {
  /** QC ID */
  qcId: string;

  /** Task ID */
  taskId: string;

  /** QC Status */
  status: 'passed' | 'rejected';

  /** Inspector ID */
  inspectorId: string;

  /** Passed quantity */
  passedQuantity?: number;

  /** Rejected quantity */
  rejectedQuantity?: number;

  /** Notes */
  notes?: string;
}

/**
 * Workflow Rule
 * 工作流規則
 */
export interface WorkflowRule {
  /** Rule ID */
  id: string;

  /** Rule name */
  name: string;

  /** Trigger event type */
  triggerEvent: WorkflowEventType;

  /** Condition function */
  condition: (event: WorkflowEvent) => boolean;

  /** Action to execute */
  action: (event: WorkflowEvent) => Promise<void>;

  /** Is enabled */
  enabled: boolean;

  /** Priority (higher executes first) */
  priority?: number;
}

/**
 * Workflow Execution Result
 * 工作流執行結果
 */
export interface WorkflowExecutionResult {
  /** Success */
  success: boolean;

  /** Rules executed count */
  rulesExecuted: number;

  /** Errors encountered */
  errors?: Error[];

  /** Execution time (ms) */
  executionTime: number;

  /** Results from each rule */
  ruleResults?: Array<{
    ruleId: string;
    success: boolean;
    error?: Error;
  }>;
}
