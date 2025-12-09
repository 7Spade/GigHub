# Blueprint Domain Architecture - Phase 1.1 Implementation

## 🎯 Overview

This document describes the Domain-Driven Design (DDD) patterns implemented in the Blueprint module, following the architecture plan from `.copilot-tracking/plans/20251209-blueprint-architecture-plan.instructions.md`.

**Implementation Date**: 2025-12-09  
**Phase**: Phase 1.1 - Domain Layer Foundation  
**Status**: ✅ Completed

---

## 📐 Architecture Layers

The Blueprint module now follows a clean 3-layer architecture:

```
src/app/shared/services/blueprint/
├── domain/                    # Domain Layer (Business Logic)
│   ├── value-objects/        # Immutable value objects
│   │   ├── blueprint-id.ts   # UUID-based identity
│   │   ├── slug.ts           # URL-friendly identifier
│   │   └── owner-info.ts     # Owner reference
│   └── events/               # Domain events
│       └── blueprint.events.ts
├── application/              # Application Layer (Orchestration)
│   ├── blueprint.facade.ts   # UI facade with Signals
│   └── event-bus.service.ts  # Event pub/sub
├── blueprint.repository.ts   # Infrastructure (Data Access)
├── blueprint.service.ts      # Infrastructure (Business Services)
└── ...
```

---

## 🎨 Modern Angular 20 Patterns

### Signals for Reactive State

The `BlueprintFacade` uses Angular 20 Signals for reactive state management:

```typescript
@Injectable({ providedIn: 'root' })
export class BlueprintFacade {
  // Private writable signals
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _currentBlueprint = signal<Blueprint | null>(null);
  private readonly _blueprints = signal<Blueprint[]>([]);

  // Public read-only computed signals
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());
  readonly currentBlueprint = computed(() => this._currentBlueprint());
  readonly blueprints = computed(() => this._blueprints());
  readonly hasBlueprints = computed(() => this._blueprints().length > 0);
  readonly blueprintCount = computed(() => this._blueprints().length);
}
```

### Why Signals?

1. **Fine-grained reactivity**: Only affected parts of UI re-render
2. **No Zone.js dependency**: Better performance
3. **Simpler mental model**: No subscriptions to manage
4. **Type-safe**: Full TypeScript support

---

## 🧱 Value Objects

### What are Value Objects?

Value Objects are immutable objects that represent domain concepts through their attributes. They:
- Have no identity (equal by value, not reference)
- Are immutable (cannot be changed after creation)
- Encapsulate validation logic
- Provide type safety

### BlueprintId

```typescript
// Create new ID
const id = BlueprintId.create(); // Auto-generates UUID

// Create from existing
const id = BlueprintId.fromString('550e8400-e29b-41d4-a716-446655440000');

// Use in comparisons
if (id1.equals(id2)) {
  console.log('Same blueprint!');
}
```

**Benefits**:
- ✅ Prevents invalid UUIDs
- ✅ Type-safe (can't mix with string IDs)
- ✅ Self-documenting code

### Slug

```typescript
// Create from text (auto-generates)
const slug = Slug.fromText('My Blueprint Name'); // -> 'my-blueprint-name'

// Create from existing slug
const slug = Slug.fromString('my-blueprint');

// Validation rules:
// - Lowercase only
// - Alphanumeric + hyphens
// - 3-100 characters
```

**Benefits**:
- ✅ URL-friendly format
- ✅ Automatic generation
- ✅ Validation built-in

### OwnerInfo

```typescript
// Factory methods for each owner type
const userOwner = OwnerInfo.forUser('user-123');
const orgOwner = OwnerInfo.forOrganization('org-456');
const teamOwner = OwnerInfo.forTeam('team-789');

// Type checking
if (owner.isUser()) {
  console.log('Owned by user:', owner.getId());
}

// Convert to plain object
const data = owner.toObject();
```

**Benefits**:
- ✅ Type-safe owner references
- ✅ Prevents invalid combinations
- ✅ Clear factory methods

---

## 📨 Domain Events

### Event Types

7 domain events are defined:

1. **BlueprintCreatedEvent**: When a blueprint is created
2. **BlueprintUpdatedEvent**: When blueprint properties change
3. **BlueprintDeletedEvent**: When a blueprint is deleted (soft)
4. **MemberAddedEvent**: When a member joins
5. **MemberRemovedEvent**: When a member leaves
6. **ModuleEnabledEvent**: When a module is enabled
7. **ModuleDisabledEvent**: When a module is disabled

### Event Structure

```typescript
interface DomainEvent {
  readonly eventType: string;      // Event identifier
  readonly occurredOn: Date;       // When it happened
  readonly aggregateId: string;    // Which blueprint
  readonly data: unknown;          // Event payload
}
```

### Example Event

```typescript
const event: BlueprintCreatedEvent = {
  eventType: 'BlueprintCreated',
  occurredOn: new Date(),
  aggregateId: 'blueprint-123',
  data: {
    id: 'blueprint-123',
    name: 'My Blueprint',
    slug: 'my-blueprint',
    ownerId: 'user-456',
    ownerType: 'user'
  }
};
```

---

## 🚌 EventBus Service

### Publishing Events

```typescript
@Injectable()
export class SomeService {
  private eventBus = inject(EventBus);
  
  async createBlueprint(data: CreateBlueprintRequest) {
    const blueprint = await this.repository.create(data);
    
    // Publish domain event
    this.eventBus.publish({
      eventType: 'BlueprintCreated',
      occurredOn: new Date(),
      aggregateId: blueprint.id,
      data: { ...blueprint }
    });
    
    return blueprint;
  }
}
```

### Subscribing to Events

```typescript
@Injectable()
export class AuditLogService {
  private eventBus = inject(EventBus);
  
  constructor() {
    // Subscribe to specific event type
    this.eventBus.on<BlueprintCreatedEvent>('BlueprintCreated')
      .subscribe(event => {
        this.logEvent('Blueprint created', event);
      });
    
    // Subscribe to all events
    this.eventBus.onAll()
      .subscribe(event => {
        console.log('Event occurred:', event.eventType);
      });
  }
}
```

### Event History (Signal-based)

```typescript
@Component({
  template: `
    <div>Total events: {{ eventBus.eventCount() }}</div>
    
    @for (event of eventBus.eventHistory(); track event.occurredOn) {
      <div>{{ event.eventType }} at {{ event.occurredOn }}</div>
    }
  `
})
export class EventMonitorComponent {
  eventBus = inject(EventBus);
}
```

**Features**:
- ✅ RxJS Observable streams
- ✅ Signal-based history tracking
- ✅ Type-safe subscriptions
- ✅ Automatic logging

---

## 🎭 Blueprint Facade

### What is a Facade?

The Facade pattern provides a simplified interface to complex subsystems. `BlueprintFacade`:
- Hides complexity from UI components
- Manages state with Signals
- Delegates to underlying services
- Provides clean, consistent API

### Usage in Components

```typescript
@Component({
  selector: 'app-blueprint-list',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    @if (facade.loading()) {
      <nz-spin nzSimple />
    } @else if (facade.error()) {
      <nz-alert nzType="error" [nzMessage]="facade.error()!" />
    } @else {
      @for (blueprint of facade.blueprints(); track blueprint.id) {
        <app-blueprint-card [blueprint]="blueprint" />
      }
    }
    
    <div>Total: {{ facade.blueprintCount() }}</div>
  `
})
export class BlueprintListComponent {
  facade = inject(BlueprintFacade);
  
  async ngOnInit() {
    await this.facade.getByOwner('user', this.currentUserId);
  }
  
  async createBlueprint() {
    try {
      await this.facade.createBlueprint({
        name: 'New Blueprint',
        slug: 'new-blueprint',
        ownerId: this.currentUserId,
        ownerType: 'user'
      });
      
      this.message.success('Blueprint created!');
    } catch (error) {
      // Error already in facade.error() signal
    }
  }
}
```

### Available Methods

```typescript
interface BlueprintFacade {
  // State (read-only signals)
  readonly loading: Signal<boolean>;
  readonly error: Signal<string | null>;
  readonly currentBlueprint: Signal<Blueprint | null>;
  readonly blueprints: Signal<Blueprint[]>;
  readonly hasBlueprints: Signal<boolean>;
  readonly blueprintCount: Signal<number>;
  
  // Operations
  getById(id: string): Promise<Blueprint | null>;
  getByOwner(ownerType: OwnerType, ownerId: string): Promise<Blueprint[]>;
  query(options: BlueprintQueryOptions): Promise<Blueprint[]>;
  createBlueprint(request: CreateBlueprintRequest): Promise<Blueprint>;
  updateBlueprint(id: string, request: UpdateBlueprintRequest): Promise<Blueprint>;
  deleteBlueprint(id: string): Promise<void>;
  
  // State management
  clearError(): void;
  clearCurrent(): void;
  reset(): void;
}
```

---

## 🔄 Integration with Existing Code

### Before (Direct Service Usage)

```typescript
@Component({...})
export class OldComponent {
  private blueprintService = inject(BlueprintService);
  loading = false;
  error: string | null = null;
  
  async loadBlueprints() {
    this.loading = true;
    try {
      this.blueprintService.getByOwner('user', 'user-123').subscribe(
        blueprints => {
          this.blueprints = blueprints;
          this.loading = false;
        },
        error => {
          this.error = error.message;
          this.loading = false;
        }
      );
    } catch (error) {
      this.error = error.message;
      this.loading = false;
    }
  }
}
```

### After (Facade with Signals)

```typescript
@Component({...})
export class NewComponent {
  facade = inject(BlueprintFacade);
  
  async ngOnInit() {
    await this.facade.getByOwner('user', 'user-123');
  }
}

// Template automatically reacts to facade signals
@if (facade.loading()) { <nz-spin /> }
@else if (facade.error()) { <nz-alert [nzMessage]="facade.error()!" /> }
@else { @for (bp of facade.blueprints(); track bp.id) { ... } }
```

**Benefits**:
- ✅ Less boilerplate
- ✅ Automatic reactivity
- ✅ Consistent error handling
- ✅ Easier testing

---

## 🧪 Testing

### Testing Value Objects

```typescript
describe('BlueprintId', () => {
  it('should create valid UUID', () => {
    const id = BlueprintId.create();
    expect(id.toString()).toMatch(/^[0-9a-f]{8}-/);
  });
  
  it('should reject invalid UUID', () => {
    expect(() => BlueprintId.fromString('invalid'))
      .toThrow('Invalid Blueprint ID format');
  });
  
  it('should compare by value', () => {
    const id1 = BlueprintId.fromString('550e8400-e29b-41d4-a716-446655440000');
    const id2 = BlueprintId.fromString('550e8400-e29b-41d4-a716-446655440000');
    expect(id1.equals(id2)).toBe(true);
  });
});
```

### Testing EventBus

```typescript
describe('EventBus', () => {
  let eventBus: EventBus;
  
  beforeEach(() => {
    TestBed.configureTestingModule({});
    eventBus = TestBed.inject(EventBus);
  });
  
  it('should publish and receive events', (done) => {
    const event: BlueprintCreatedEvent = {
      eventType: 'BlueprintCreated',
      occurredOn: new Date(),
      aggregateId: 'test-123',
      data: { id: 'test-123', name: 'Test' }
    };
    
    eventBus.on<BlueprintCreatedEvent>('BlueprintCreated')
      .subscribe(received => {
        expect(received.aggregateId).toBe('test-123');
        done();
      });
    
    eventBus.publish(event);
  });
  
  it('should track event history', () => {
    const event = { /* ... */ };
    eventBus.publish(event);
    
    expect(eventBus.eventCount()).toBe(1);
    expect(eventBus.eventHistory()).toContain(event);
  });
});
```

### Testing Facade

```typescript
describe('BlueprintFacade', () => {
  let facade: BlueprintFacade;
  let mockService: jasmine.SpyObj<BlueprintService>;
  
  beforeEach(() => {
    mockService = jasmine.createSpyObj('BlueprintService', ['getById', 'create']);
    
    TestBed.configureTestingModule({
      providers: [
        BlueprintFacade,
        { provide: BlueprintService, useValue: mockService }
      ]
    });
    
    facade = TestBed.inject(BlueprintFacade);
  });
  
  it('should set loading state during operations', async () => {
    mockService.getById.and.returnValue(of(mockBlueprint));
    
    const promise = facade.getById('test-123');
    expect(facade.loading()).toBe(true);
    
    await promise;
    expect(facade.loading()).toBe(false);
  });
  
  it('should update blueprints signal after query', async () => {
    const mockBlueprints = [/* ... */];
    mockService.getByOwner.and.returnValue(of(mockBlueprints));
    
    await facade.getByOwner('user', 'user-123');
    
    expect(facade.blueprints()).toEqual(mockBlueprints);
    expect(facade.blueprintCount()).toBe(mockBlueprints.length);
  });
});
```

---

## 📚 Next Steps

### Phase 2: CQRS Pattern (To be implemented)

1. **Command Handlers**
   - CreateBlueprintHandler
   - UpdateBlueprintHandler
   - DeleteBlueprintHandler
   - AddMemberHandler

2. **Query Handlers**
   - GetBlueprintByIdQuery
   - ListBlueprintsQuery
   - GetBlueprintMembersQuery

3. **Blueprint Aggregate**
   - Business rule enforcement
   - Event generation
   - Invariant checks

### Phase 3: Repository Abstraction

1. **Repository Interfaces**
   - IBlueprintRepository
   - IBlueprintMemberRepository

2. **Multiple Implementations**
   - FirestoreBlueprintRepository (existing)
   - SupabaseBlueprintRepository (new)

3. **DI Configuration**
   - Feature flags for database switching
   - Environment-based providers

---

## 🔗 References

- **Architecture Doc**: `docs/GigHub_Blueprint_Architecture.md`
- **Implementation Plan**: `.copilot-tracking/plans/20251209-blueprint-architecture-plan.instructions.md`
- **Research**: `.copilot-tracking/research/20251209-blueprint-architecture-analysis-research.md`
- **Angular Signals**: https://angular.dev/guide/signals
- **DDD Patterns**: Domain-Driven Design by Eric Evans

---

**Author**: GitHub Copilot  
**Date**: 2025-12-09  
**Version**: 1.0  
**Status**: ✅ Completed
