<!-- markdownlint-disable-file -->

# Task Details: GigHub Blueprint Architecture Refactoring

## Research Reference

**Source Research**: `.copilot-tracking/research/20251209-blueprint-architecture-analysis-research.md`
**Source Documentation**: `docs/GigHub_Blueprint_Architecture.md` (1910 lines)

## Phase 1: Foundation Refactoring (Weeks 1-2)

### Task 1.1: Define Repository Interfaces

**Files to Create**:
- `src/app/shared/services/blueprint/domain/interfaces/i-blueprint-repository.ts`
- `src/app/shared/services/blueprint/domain/interfaces/i-blueprint-member-repository.ts`

**Implementation**:
```typescript
// i-blueprint-repository.ts
export interface IBlueprintRepository {
  findById(id: string): Promise<BlueprintAggregate | null>;
  findBySlug(slug: string): Promise<BlueprintAggregate | null>;
  findByOwner(ownerType: string, ownerId: string): Promise<BlueprintAggregate[]>;
  save(aggregate: BlueprintAggregate): Promise<void>;
  delete(id: string): Promise<void>;
}
```

**Success Criteria**:
- Interfaces defined without implementation dependencies
- Clear method signatures for all CRUD operations
- TypeScript compilation successful

**Research References**:
- Research file lines 95-120: Repository pattern explanation
- Architecture doc lines 350-380: Repository interface requirements

---

### Task 1.2: Create Value Objects

**Files to Create**:
- `src/app/shared/services/blueprint/domain/value-objects/blueprint-id.ts`
- `src/app/shared/services/blueprint/domain/value-objects/owner-info.ts`
- `src/app/shared/services/blueprint/domain/value-objects/slug.ts`

**Implementation**:
```typescript
// blueprint-id.ts
export class BlueprintId {
  private constructor(private readonly value: string) {
    if (!value || !this.isValidUUID(value)) {
      throw new Error('Invalid Blueprint ID');
    }
  }
  
  static create(): BlueprintId {
    return new BlueprintId(crypto.randomUUID());
  }
  
  static fromString(value: string): BlueprintId {
    return new BlueprintId(value);
  }
  
  toString(): string {
    return this.value;
  }
  
  private isValidUUID(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }
}
```

**Success Criteria**:
- Value objects are immutable
- Validation logic encapsulated
- Equal by value, not reference

---

### Task 1.3: Create BlueprintFacade Service

**Files to Create**:
- `src/app/shared/services/blueprint/application/blueprint.facade.ts`

**Implementation**:
```typescript
import { Injectable, inject, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class BlueprintFacade {
  private blueprintService = inject(BlueprintService); // Existing service
  
  // State signals
  private _loading = signal(false);
  private _error = signal<string | null>(null);
  private _currentBlueprint = signal<Blueprint | null>(null);
  
  // Public computed signals
  loading = computed(() => this._loading());
  error = computed(() => this._error());
  currentBlueprint = computed(() => this._currentBlueprint());
  
  // Delegate to existing service (Phase 1)
  async createBlueprint(dto: CreateBlueprintDTO): Promise<Blueprint> {
    this._loading.set(true);
    this._error.set(null);
    
    try {
      const result = await this.blueprintService.create(dto);
      this._currentBlueprint.set(result);
      return result;
    } catch (error) {
      this._error.set(error.message);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }
  
  // More methods...
}
```

**Success Criteria**:
- Facade delegates to existing service
- Signals used for state management
- UI components can inject only Facade

---

## Phase 2: Command/Query Separation (Weeks 3-4)

### Task 2.1: Implement CreateBlueprintHandler

**Files to Create**:
- `src/app/shared/services/blueprint/application/commands/create-blueprint.command.ts`
- `src/app/shared/services/blueprint/application/commands/create-blueprint.handler.ts`

**Implementation**:
```typescript
// create-blueprint.command.ts
export class CreateBlueprintCommand {
  constructor(
    public readonly name: string,
    public readonly slug: string,
    public readonly ownerId: string,
    public readonly ownerType: 'user' | 'organization',
    public readonly description?: string,
  ) {}
}

// create-blueprint.handler.ts
@Injectable({ providedIn: 'root' })
export class CreateBlueprintHandler {
  private repository = inject(IBlueprintRepository);
  private eventBus = inject(EventBus);
  
  async execute(command: CreateBlueprintCommand): Promise<Blueprint> {
    // 1. Validate
    this.validateCommand(command);
    
    // 2. Check uniqueness
    const existing = await this.repository.findBySlug(command.slug);
    if (existing) {
      throw new Error('Slug already exists');
    }
    
    // 3. Create aggregate
    const aggregate = BlueprintAggregate.create({
      name: command.name,
      slug: command.slug,
      ownerId: command.ownerId,
      ownerType: command.ownerType,
      description: command.description,
      enabledModules: [],
    });
    
    // 4. Persist
    await this.repository.save(aggregate);
    
    // 5. Publish events
    const events = aggregate.getEvents();
    events.forEach(event => this.eventBus.publish(event));
    aggregate.clearEvents();
    
    return aggregate.toData();
  }
}
```

**Success Criteria**:
- Handler validates input
- Creates and persists aggregate
- Publishes domain events
- Returns DTO

---

### Task 2.2: Implement Blueprint Aggregate

**Files to Create**:
- `src/app/shared/services/blueprint/domain/aggregates/aggregate-root.base.ts`
- `src/app/shared/services/blueprint/domain/aggregates/blueprint.aggregate.ts`

**Implementation**: See research file lines 150-280 for complete aggregate implementation with:
- Signal-based reactive state
- Business rule enforcement
- Event generation
- Invariant checks

**Success Criteria**:
- All business logic encapsulated
- Generates events for state changes
- Enforces invariants
- Immutable from outside

---

## Phase 3: Repository Abstraction (Weeks 5-6)

### Task 3.1: Create FirestoreBlueprintRepository

**Files to Create**:
- `src/app/shared/services/blueprint/infrastructure/firestore/firestore-blueprint.repository.ts`

**Implementation**: See research file lines 280-350 for complete Firestore repository with:
- Implements IBlueprintRepository
- Maps domain objects to Firestore documents
- Handles Timestamp conversions
- Query optimizations

**Success Criteria**:
- Implements interface completely
- No leaking of Firestore types to domain
- Proper error handling
- Transaction support

---

### Task 3.2: Configure Dependency Injection

**Files to Create**:
- `src/app/shared/services/blueprint/infrastructure/repository.providers.ts`

**Implementation**:
```typescript
import { Provider, InjectionToken } from '@angular/core';

export const BLUEPRINT_REPOSITORY = new InjectionToken<IBlueprintRepository>(
  'IBlueprintRepository'
);

export const BLUEPRINT_REPOSITORY_PROVIDERS: Provider[] = [
  {
    provide: BLUEPRINT_REPOSITORY,
    useClass: FirestoreBlueprintRepository,
  },
];
```

**Success Criteria**:
- Interfaces can be injected
- Implementation swappable
- Feature flag support ready

---

## Phase 4: Event-Driven Integration (Weeks 7-8)

### Task 4.1: Implement EventBus Service

**Files to Create**:
- `src/app/shared/services/blueprint/infrastructure/event-bus.service.ts`

**Implementation**: See research file lines 350-400 for EventBus with:
- RxJS Subject-based
- Type-safe subscriptions
- Error isolation
- Logging support

**Success Criteria**:
- Publish/subscribe working
- Type-safe event handling
- Error handling doesn't affect publisher
- Debugging support

---

### Task 4.2: Implement Audit Trail

**Files to Create**:
- `src/app/shared/services/blueprint/infrastructure/event-handlers/audit-log.handler.ts`

**Implementation**:
```typescript
@Injectable({ providedIn: 'root' })
export class AuditLogEventHandler {
  private eventBus = inject(EventBus);
  private auditRepository = inject(IAuditLogRepository);
  
  constructor() {
    this.setupSubscriptions();
  }
  
  private setupSubscriptions(): void {
    this.eventBus.subscribeToAll(async (event) => {
      await this.auditRepository.createLog({
        blueprintId: event.aggregateId,
        action: event.eventType,
        timestamp: event.timestamp,
        data: event.data,
      });
    });
  }
}
```

**Success Criteria**:
- All events captured
- Immutable audit records
- Timestamped properly
- Queryable for compliance

---

## Phase 5: Module System & Final Polish (Weeks 9-10)

### Task 5.1: Create Module Registry

**Files to Create**:
- `src/app/shared/services/blueprint/module-system/module.interface.ts`
- `src/app/shared/services/blueprint/module-system/module-registry.service.ts`

**Implementation**:
```typescript
// module.interface.ts
export interface IBlueprintModule {
  moduleId: string;
  moduleName: string;
  version: string;
  
  onEnable(blueprintId: string): Promise<void>;
  onDisable(blueprintId: string): Promise<void>;
  onBlueprintCreated(event: BlueprintCreatedEvent): Promise<void>;
  onBlueprintDeleted(event: BlueprintArchivedEvent): Promise<void>;
}

// module-registry.service.ts
@Injectable({ providedIn: 'root' })
export class ModuleRegistry {
  private modules = new Map<string, IBlueprintModule>();
  
  register(module: IBlueprintModule): void {
    this.modules.set(module.moduleId, module);
  }
  
  async enableModule(blueprintId: string, moduleId: string): Promise<void> {
    const module = this.modules.get(moduleId);
    if (!module) {
      throw new Error(`Module ${moduleId} not found`);
    }
    await module.onEnable(blueprintId);
  }
}
```

**Success Criteria**:
- Modules can be registered dynamically
- Lifecycle hooks work
- Module communication via events
- Isolated module state

---

### Task 5.2: Performance Optimization

**Files to Modify**:
- Query handlers (add caching)
- Firestore indexes (optimize)
- UI components (add loading states)

**Implementation**:
- Add @delon/cache for query results
- Configure Firestore composite indexes
- Use Angular Signals for fine-grained reactivity
- Implement skeleton screens

**Success Criteria**:
- TTI < 3s
- FCP < 1.5s
- Bundle size < 500KB
- API response < 300ms (p95)

---

### Task 5.3: Documentation & Training

**Files to Create**:
- `docs/architecture/blueprint-module-architecture.md`
- `docs/development/adding-new-modules.md`
- `docs/development/testing-guidelines.md`

**Content**:
- Architecture overview with diagrams
- Step-by-step module development guide
- Testing patterns and examples
- Common pitfalls and solutions

**Success Criteria**:
- Team understands architecture
- Can add new modules independently
- Knows how to debug issues
- Confident with patterns

---

## Implementation Order

1. **Week 1-2**: Phase 1 - Foundation
2. **Week 3-4**: Phase 2 - CQRS
3. **Week 5-6**: Phase 3 - Repository Abstraction
4. **Week 7-8**: Phase 4 - Event-Driven
5. **Week 9-10**: Phase 5 - Module System & Polish

## Risk Mitigation

- **Regression**: Comprehensive test suite before each phase
- **Performance**: Benchmarking before/after each change
- **Compatibility**: Feature flags for gradual rollout
- **Team**: Pair programming during complex migrations

---

**Details Version**: 1.0.0  
**Created**: 2025-12-09  
**Total Tasks**: 75+ subtasks across 5 phases  
**Estimated Effort**: 400-500 hours
