/**
 * Base Domain Event Interface
 * 
 * All domain events must extend this interface.
 */
export interface DomainEvent {
  readonly eventType: string;
  readonly occurredOn: Date;
  readonly aggregateId: string;
  readonly data: unknown;
}

/**
 * Blueprint Created Event
 */
export interface BlueprintCreatedEvent extends DomainEvent {
  eventType: 'BlueprintCreated';
  data: {
    id: string;
    name: string;
    slug: string;
    ownerId: string;
    ownerType: string;
  };
}

/**
 * Blueprint Updated Event
 */
export interface BlueprintUpdatedEvent extends DomainEvent {
  eventType: 'BlueprintUpdated';
  data: {
    id: string;
    changes: Record<string, unknown>;
  };
}

/**
 * Blueprint Deleted Event
 */
export interface BlueprintDeletedEvent extends DomainEvent {
  eventType: 'BlueprintDeleted';
  data: {
    id: string;
  };
}

/**
 * Member Added Event
 */
export interface MemberAddedEvent extends DomainEvent {
  eventType: 'MemberAdded';
  data: {
    blueprintId: string;
    memberId: string;
    role: string;
  };
}

/**
 * Member Removed Event
 */
export interface MemberRemovedEvent extends DomainEvent {
  eventType: 'MemberRemoved';
  data: {
    blueprintId: string;
    memberId: string;
  };
}

/**
 * Module Enabled Event
 */
export interface ModuleEnabledEvent extends DomainEvent {
  eventType: 'ModuleEnabled';
  data: {
    blueprintId: string;
    moduleId: string;
  };
}

/**
 * Module Disabled Event
 */
export interface ModuleDisabledEvent extends DomainEvent {
  eventType: 'ModuleDisabled';
  data: {
    blueprintId: string;
    moduleId: string;
  };
}

/**
 * All Blueprint Event Types
 */
export type BlueprintEvent =
  | BlueprintCreatedEvent
  | BlueprintUpdatedEvent
  | BlueprintDeletedEvent
  | MemberAddedEvent
  | MemberRemovedEvent
  | ModuleEnabledEvent
  | ModuleDisabledEvent;
