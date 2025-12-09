# Blueprint Architecture - Phase 1 Foundation

## Overview

This document describes the Phase 1 Foundation implementation of the Blueprint Architecture refactoring, completed on 2025-12-09.

**Status**: ✅ COMPLETE  
**Pattern**: Hexagonal Architecture (Ports & Adapters)  
**Principles**: Occam's Razor (simplest effective solution)

## Objectives

1. ✅ Establish domain layer with value objects and domain events
2. ✅ Introduce Facade pattern with Angular Signals
3. ✅ Setup EventBus infrastructure for event-driven architecture
4. ✅ Maintain backward compatibility with existing code

## Architecture Before & After

### Before Phase 1
```
┌─────────────┐
│ UI Component│
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│ BlueprintService │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│    Repository    │
└────────┬─────────┘
         │
         ▼
    Firestore
```

### After Phase 1
```
┌─────────────┐
│ UI Component│
└──────┬──────┘
       │
       ▼
┌────────────────────┐     ┌──────────┐
│  BlueprintFacade   │────>│ EventBus │
│    (Signals)       │     └────┬─────┘
└────────┬───────────┘          │
         │                      │ Domain Events
         ▼                      │
┌──────────────────┐            │
│ BlueprintService │            │
└────────┬─────────┘            │
         │                      ▼
         ▼               [Future Subscribers]
┌──────────────────┐     - Audit Logs
│    Repository    │     - Notifications
└────────┬─────────┘     - Cache Updates
         │
         ▼
    Firestore
```

## Implementation Details

### 1. Domain Layer

#### Value Objects (`src/app/shared/services/blueprint/domain/value-objects/`)

**BlueprintId**
```typescript
class BlueprintId {
  static create(): BlueprintId           // Generate new UUID
  static fromString(value: string): BlueprintId
  toString(): string
  equals(other: BlueprintId): boolean
}
```

**OwnerInfo**
```typescript
class OwnerInfo {
  static create(ownerId: string, ownerType: OwnerType): OwnerInfo
  getOwnerId(): string
  getOwnerType(): OwnerType
  isUser(): boolean
  isOrganization(): boolean
  isTeam(): boolean
  equals(other: OwnerInfo): boolean
}
```

**Slug**
```typescript
class Slug {
  static fromString(value: string): Slug
  static fromName(name: string): Slug    // Auto-generate from name
  toString(): string
  equals(other: Slug): boolean
}
```

**Benefits**:
- Type safety (can't pass wrong string as ID)
- Validation encapsulated (invalid values throw errors)
- Immutability (no accidental modifications)
- Value equality (compare by content, not reference)

#### Domain Events (`src/app/shared/services/blueprint/domain/events/`)

**Base Interface**:
```typescript
interface DomainEvent {
  readonly type: string;
  readonly aggregateId: string;
  readonly occurredAt: Date;
  readonly userId?: string;
  readonly metadata?: Record<string, unknown>;
}
```

**Event Types**:
1. `BlueprintCreatedEvent` - When blueprint is created
2. `BlueprintUpdatedEvent` - When blueprint is modified
3. `BlueprintDeletedEvent` - When blueprint is deleted
4. `BlueprintMemberAddedEvent` - When member is added
5. `BlueprintMemberRemovedEvent` - When member is removed
6. `BlueprintModuleEnabledEvent` - When module is enabled
7. `BlueprintModuleDisabledEvent` - When module is disabled

**Benefits**:
- Standardized event structure
- Type-safe event handling
- Audit trail foundation
- Module decoupling

### 2. EventBus Service (`src/app/core/services/event-bus/`)

**API**:
```typescript
@Injectable({ providedIn: 'root' })
class EventBusService {
  publish(event: DomainEvent): void
  events$(): Observable<DomainEvent>
  ofType<T>(eventType: string): Observable<T>
  fromAggregate(aggregateId: string): Observable<DomainEvent>
  ofTypes(eventTypes: string[]): Observable<DomainEvent>
}
```

**Usage Example**:
```typescript
// Publish event
const event: BlueprintCreatedEvent = {
  type: 'blueprint.created',
  aggregateId: blueprint.id,
  blueprintId: blueprint.id,
  name: blueprint.name,
  occurredAt: new Date()
};
eventBus.publish(event);

// Subscribe to specific event type
eventBus.ofType<BlueprintCreatedEvent>('blueprint.created')
  .subscribe(event => {
    console.log('Blueprint created:', event.blueprintId);
  });

// Subscribe to events from specific blueprint
eventBus.fromAggregate(blueprintId)
  .subscribe(event => {
    console.log('Event for blueprint:', event.type);
  });
```

**Implementation**:
- Uses RxJS `Subject` for event stream
- Logging for debugging
- Type-safe event filtering
- Observable-based (reactive)

### 3. BlueprintFacade (`src/app/shared/services/blueprint/application/`)

**State Management with Signals**:
```typescript
@Injectable({ providedIn: 'root' })
class BlueprintFacade {
  // Reactive state (readonly)
  readonly loading: Signal<boolean>;
  readonly error: Signal<string | null>;
  readonly currentBlueprint: Signal<Blueprint | null>;
  readonly blueprints: Signal<Blueprint[]>;
  readonly hasBlueprints: Signal<boolean>;
  
  // Query methods
  getById(id: string): Observable<Blueprint | null>
  getByOwner(type: OwnerType, id: string): Observable<Blueprint[]>
  query(options: BlueprintQueryOptions): Observable<Blueprint[]>
  
  // Command methods
  async createBlueprint(request: CreateBlueprintRequest): Promise<Blueprint>
  async updateBlueprint(id: string, updates: UpdateBlueprintRequest): Promise<void>
  async deleteBlueprint(id: string): Promise<void>
  async addMember(blueprintId: string, member: ...): Promise<void>
  
  // State management
  clearError(): void
  clearCurrent(): void
  clearAll(): void
}
```

**Usage in Component**:
```typescript
@Component({
  selector: 'app-blueprint-list',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    @if (facade.loading()) {
      <nz-spin nzSimple />
    } @else if (facade.error()) {
      <nz-alert nzType="error" [nzMessage]="facade.error()" />
    } @else {
      @for (blueprint of facade.blueprints(); track blueprint.id) {
        <div>{{ blueprint.name }}</div>
      }
    }
  `
})
export class BlueprintListComponent {
  readonly facade = inject(BlueprintFacade);
  
  ngOnInit() {
    this.facade.getByOwner(OwnerType.USER, this.userId);
  }
}
```

**Benefits**:
- Simplified UI code (no manual state management)
- Reactive updates (Signals auto-update views)
- Centralized state
- Event publishing automatic
- Backward compatible (uses existing service)

## Design Decisions

### 1. Occam's Razor Applied

**What We Did**:
- ✅ Created only essential value objects (ID, Owner, Slug)
- ✅ Simple EventBus (no event persistence yet)
- ✅ Facade delegates to existing service (no CQRS yet)

**What We Didn't Do** (Deferred to later phases):
- ❌ Command/Query handlers (Phase 2)
- ❌ Blueprint Aggregate (Phase 2)
- ❌ Repository abstraction (Phase 3)
- ❌ Event subscribers (Phase 4)
- ❌ Event sourcing/replay (Phase 4)

**Rationale**: Start simple, validate approach, add complexity only when needed.

### 2. Angular 20 Modern Patterns

**Signals for State**:
- Replaces manual Observable management
- Automatic change detection
- Cleaner component code

**inject() for DI**:
- Modern Angular DI syntax
- Better type inference
- More concise code

**Standalone Services**:
- `providedIn: 'root'` for singletons
- Tree-shakable
- No NgModule required

### 3. Backward Compatibility

**No Breaking Changes**:
- Existing `BlueprintService` unchanged
- Existing components continue to work
- Gradual migration possible

**Migration Path**:
```typescript
// Old way (still works)
inject(BlueprintService).create(request)

// New way (recommended)
inject(BlueprintFacade).createBlueprint(request)
```

### 4. Event-Driven Foundation

**Events Published**:
- Every CRUD operation publishes event
- Standardized event structure
- Ready for subscribers

**Future Subscribers** (Phase 4):
- Audit Log Handler → Records all changes
- Permission Cache Handler → Invalidates cache
- Notification Handler → Sends notifications
- Analytics Handler → Tracks usage

## Testing Strategy

### Unit Tests (Deferred to Phase 1.4)

**Value Objects**:
```typescript
describe('BlueprintId', () => {
  it('should create valid UUID', () => {
    const id = BlueprintId.create();
    expect(id.toString()).toMatch(/^[0-9a-f-]{36}$/);
  });
  
  it('should reject invalid UUID', () => {
    expect(() => BlueprintId.fromString('invalid'))
      .toThrow('Invalid Blueprint ID');
  });
  
  it('should compare by value', () => {
    const id1 = BlueprintId.fromString('...');
    const id2 = BlueprintId.fromString('...');
    expect(id1.equals(id2)).toBe(true);
  });
});
```

**Facade**:
```typescript
describe('BlueprintFacade', () => {
  it('should set loading state', () => {
    const facade = TestBed.inject(BlueprintFacade);
    expect(facade.loading()).toBe(false);
    
    facade.getById('test-id');
    expect(facade.loading()).toBe(true);
  });
  
  it('should publish event on create', async () => {
    const eventBus = TestBed.inject(EventBusService);
    const spy = jasmine.createSpy('event');
    eventBus.ofType('blueprint.created').subscribe(spy);
    
    await facade.createBlueprint(request);
    expect(spy).toHaveBeenCalled();
  });
});
```

### Integration Tests (Deferred to Phase 1.4)

**Facade + Service + Repository**:
```typescript
it('should create blueprint end-to-end', async () => {
  const facade = TestBed.inject(BlueprintFacade);
  const request = { name: 'Test', slug: 'test', ... };
  
  const blueprint = await facade.createBlueprint(request);
  
  expect(blueprint.id).toBeDefined();
  expect(facade.currentBlueprint()).toEqual(blueprint);
  expect(facade.blueprints()).toContain(blueprint);
});
```

## File Structure

```
src/app/
├── core/
│   ├── services/
│   │   └── event-bus/
│   │       ├── event-bus.service.ts  ← EventBus implementation
│   │       └── index.ts              ← Exports
│   └── index.ts                      ← Updated: exports EventBusService
│
└── shared/
    └── services/
        └── blueprint/
            ├── domain/               ← NEW: Domain layer
            │   ├── value-objects/
            │   │   ├── blueprint-id.ts
            │   │   ├── owner-info.ts
            │   │   ├── slug.ts
            │   │   └── index.ts
            │   ├── events/
            │   │   ├── blueprint.events.ts
            │   │   └── index.ts
            │   └── index.ts
            │
            ├── application/          ← NEW: Application layer
            │   ├── blueprint.facade.ts
            │   └── index.ts
            │
            ├── blueprint.service.ts  ← EXISTING: Unchanged
            └── blueprint.repository.ts ← EXISTING: Unchanged
```

## Migration Guide

### For UI Components

**Old Code**:
```typescript
@Component({...})
export class BlueprintListComponent {
  private service = inject(BlueprintService);
  loading = false;
  error: string | null = null;
  blueprints: Blueprint[] = [];
  
  ngOnInit() {
    this.loading = true;
    this.service.getByOwner(type, id).subscribe({
      next: blueprints => {
        this.blueprints = blueprints;
        this.loading = false;
      },
      error: err => {
        this.error = err.message;
        this.loading = false;
      }
    });
  }
}
```

**New Code**:
```typescript
@Component({...})
export class BlueprintListComponent {
  readonly facade = inject(BlueprintFacade);
  
  ngOnInit() {
    this.facade.getByOwner(type, id);
  }
}
```

**Template Changes**:
```html
<!-- Old -->
<div *ngIf="loading">Loading...</div>
<div *ngIf="error">{{ error }}</div>
<div *ngFor="let b of blueprints">{{ b.name }}</div>

<!-- New -->
@if (facade.loading()) {
  <div>Loading...</div>
} @else if (facade.error()) {
  <div>{{ facade.error() }}</div>
} @else {
  @for (b of facade.blueprints(); track b.id) {
    <div>{{ b.name }}</div>
  }
}
```

### For Event Subscribers

**Subscribe to Events**:
```typescript
@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private eventBus = inject(EventBusService);
  private repository = inject(AuditLogRepository);
  
  constructor() {
    // Subscribe to all blueprint events
    this.eventBus.ofTypes([
      'blueprint.created',
      'blueprint.updated',
      'blueprint.deleted'
    ]).subscribe(event => {
      this.logEvent(event);
    });
  }
  
  private async logEvent(event: DomainEvent): Promise<void> {
    await this.repository.create({
      entityType: 'blueprint',
      entityId: event.aggregateId,
      eventType: event.type,
      userId: event.userId,
      timestamp: event.occurredAt,
      metadata: event
    });
  }
}
```

## Performance Considerations

### Signals vs Observables

**Signals**:
- ✅ Synchronous (no async overhead)
- ✅ Automatic change detection
- ✅ Simple dependency tracking
- ✅ Better for UI state

**Observables**:
- ✅ Asynchronous operations
- ✅ Complex operators (map, filter, etc.)
- ✅ HTTP requests
- ✅ Event streams

**Our Approach**: Use both
- Signals for component state (loading, error, data)
- Observables for async operations (HTTP, EventBus)

### Memory Management

**EventBus Subscribers**:
- Use `takeUntilDestroyed()` in components
- Unsubscribe in services when no longer needed
- EventBus itself is a singleton (one instance)

**Value Objects**:
- Immutable (no memory leaks from mutations)
- Small objects (ID, Owner, Slug)
- Created on-demand, garbage collected when unused

## Next Steps

### Phase 2: Command/Query Separation (CQRS)

**Goals**:
1. Create command handlers (Create, Update, Delete, AddMember)
2. Create query handlers (GetById, List, GetMembers)
3. Implement Blueprint Aggregate with business logic
4. Update Facade to route through handlers

**Benefits**:
- Separate read/write concerns
- Business logic in Aggregate
- Easier to test
- Foundation for event sourcing

**Timeline**: 2-3 weeks

### Phase 3: Repository Abstraction

**Goals**:
1. Extract repository interfaces
2. Firestore implementation
3. Supabase skeleton
4. DI configuration

**Benefits**:
- Database flexibility
- Easier to test (mock repositories)
- Clear boundaries

**Timeline**: 2 weeks

### Phase 4: Event-Driven Integration

**Goals**:
1. Event subscribers (Audit, Cache, Notifications)
2. Event persistence
3. Event replay capability

**Benefits**:
- Complete audit trail
- Debugging support
- Event sourcing foundation

**Timeline**: 2 weeks

## References

- **Source Plan**: `.copilot-tracking/plans/20251209-blueprint-architecture-plan.instructions.md`
- **Implementation Log**: `.copilot-tracking/changes/20251209-phase1-foundation-complete.md`
- **Architecture Docs**: `docs/GigHub_Blueprint_Architecture.md`
- **Angular Signals**: `.github/instructions/angular-modern-features.instructions.md`

---

**Document Version**: 1.0  
**Last Updated**: 2025-12-09  
**Status**: Phase 1 Complete ✅
