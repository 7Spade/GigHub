/**
 * Base Domain Event
 * 基礎領域事件
 * 
 * All domain events must extend this interface.
 * 所有領域事件必須擴展此介面
 */
export interface DomainEvent {
  /**
   * Event type identifier
   * 事件類型識別符
   */
  readonly type: string;

  /**
   * Aggregate ID that produced the event
   * 產生事件的聚合 ID
   */
  readonly aggregateId: string;

  /**
   * Timestamp when event occurred
   * 事件發生時的時間戳
   */
  readonly occurredAt: Date;

  /**
   * User who triggered the event
   * 觸發事件的使用者
   */
  readonly userId?: string;

  /**
   * Additional metadata
   * 額外的元資料
   */
  readonly metadata?: Record<string, unknown>;
}

/**
 * Blueprint Created Event
 * 藍圖建立事件
 */
export interface BlueprintCreatedEvent extends DomainEvent {
  readonly type: 'blueprint.created';
  readonly blueprintId: string;
  readonly name: string;
  readonly slug: string;
  readonly ownerId: string;
  readonly ownerType: string;
}

/**
 * Blueprint Updated Event
 * 藍圖更新事件
 */
export interface BlueprintUpdatedEvent extends DomainEvent {
  readonly type: 'blueprint.updated';
  readonly blueprintId: string;
  readonly changes: Record<string, unknown>;
}

/**
 * Blueprint Deleted Event
 * 藍圖刪除事件
 */
export interface BlueprintDeletedEvent extends DomainEvent {
  readonly type: 'blueprint.deleted';
  readonly blueprintId: string;
}

/**
 * Blueprint Member Added Event
 * 藍圖成員新增事件
 */
export interface BlueprintMemberAddedEvent extends DomainEvent {
  readonly type: 'blueprint.member.added';
  readonly blueprintId: string;
  readonly memberId: string;
  readonly accountId: string;
  readonly role: string;
}

/**
 * Blueprint Member Removed Event
 * 藍圖成員移除事件
 */
export interface BlueprintMemberRemovedEvent extends DomainEvent {
  readonly type: 'blueprint.member.removed';
  readonly blueprintId: string;
  readonly memberId: string;
  readonly accountId: string;
}

/**
 * Blueprint Module Enabled Event
 * 藍圖模組啟用事件
 */
export interface BlueprintModuleEnabledEvent extends DomainEvent {
  readonly type: 'blueprint.module.enabled';
  readonly blueprintId: string;
  readonly moduleType: string;
}

/**
 * Blueprint Module Disabled Event
 * 藍圖模組停用事件
 */
export interface BlueprintModuleDisabledEvent extends DomainEvent {
  readonly type: 'blueprint.module.disabled';
  readonly blueprintId: string;
  readonly moduleType: string;
}

/**
 * Union type of all blueprint events
 * 所有藍圖事件的聯合類型
 */
export type BlueprintEvent =
  | BlueprintCreatedEvent
  | BlueprintUpdatedEvent
  | BlueprintDeletedEvent
  | BlueprintMemberAddedEvent
  | BlueprintMemberRemovedEvent
  | BlueprintModuleEnabledEvent
  | BlueprintModuleDisabledEvent;
