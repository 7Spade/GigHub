---
mode: agent
model: Claude Sonnet 4
---

<!-- markdownlint-disable-file -->

# Implementation Prompt: GigHub Blueprint Architecture Refactoring

## Context

This prompt guides the implementation of a complete architectural refactoring of the GigHub Blueprint module, transforming it from a monolithic service-based architecture to a clean, hexagonal architecture following DDD, CQRS, and Event-Driven patterns.

## Source Documents

- **Research**: `.copilot-tracking/research/20251209-blueprint-architecture-analysis-research.md`
- **Plan**: `.copilot-tracking/plans/20251209-blueprint-architecture-plan.instructions.md`
- **Details**: `.copilot-tracking/details/20251209-blueprint-architecture-details.md`
- **Architecture Spec**: `docs/GigHub_Blueprint_Architecture.md` (1910 lines)

## Implementation Instructions

### Step 1: Create Changes Tracking File

Before starting implementation, create a changes tracking file:

```bash
touch .copilot-tracking/changes/20251209-blueprint-architecture-changes.md
```

Add header:
```markdown
# Implementation Changes: Blueprint Architecture Refactoring

## Implementation Start: [DATE]

### Phase 1: Foundation Refactoring
- [ ] Task 1.1: Define repository interfaces
- [ ] Task 1.2: Create value objects
- [ ] Task 1.3: Implement Facade
- [ ] Task 1.4: Setup Event Bus
- [ ] Task 1.5: Testing

[Update as you progress through each phase]
```

### Step 2: Execute Implementation Phase by Phase

#### Phase 1: Foundation Refactoring (Weeks 1-2)

**Goal**: Establish architectural foundations without breaking existing functionality

**Tasks**:
1. Create domain layer directory structure
2. Define repository interfaces
3. Create value objects (BlueprintId, OwnerInfo, Slug)
4. Define domain event interfaces
5. Create aggregate base class
6. Implement BlueprintFacade (delegates to existing service)
7. Setup EventBus service
8. Update UI components one by one to use Facade
9. Write unit tests for value objects
10. Write integration tests for Facade
11. Run regression tests

**Validation Checkpoint**:
- [ ] All UI components use Facade
- [ ] No regression in functionality
- [ ] Tests pass
- [ ] TypeScript compilation successful

**Update changes file** with completed tasks before proceeding.

---

#### Phase 2: Command/Query Separation (Weeks 3-4)

**Goal**: Implement CQRS pattern with clear separation of concerns

**Tasks**:
1. Create command handler structure
2. Implement CreateBlueprintHandler
3. Implement UpdateBlueprintHandler
4. Implement DeleteBlueprintHandler
5. Implement AddMemberHandler
6. Create query handler structure
7. Implement GetBlueprintByIdQuery
8. Implement ListBlueprintsQuery
9. Implement GetBlueprintMembersQuery
10. Create Blueprint Aggregate with business logic
11. Add event generation to aggregate
12. Implement invariant checks
13. Update Facade to route to handlers (commands → command handlers, queries → query handlers)
14. Write unit tests for all handlers
15. Write aggregate behavior tests
16. Write end-to-end workflow tests

**Validation Checkpoint**:
- [ ] All CRUD operations use handlers
- [ ] Blueprint Aggregate enforces business rules
- [ ] Queries bypass domain logic
- [ ] Test coverage > 80%
- [ ] No breaking changes

**Update changes file** before proceeding.

---

#### Phase 3: Repository Abstraction (Weeks 5-6)

**Goal**: Decouple from Firestore, enable database flexibility

**Tasks**:
1. Create FirestoreBlueprintRepository implementing IBlueprintRepository
2. Create FirestoreMemberRepository implementing IBlueprintMemberRepository
3. Move all Firestore-specific code from existing repositories
4. Setup dependency injection with InjectionTokens
5. Configure providers for repository interfaces
6. Update all handlers to inject interfaces (not concrete classes)
7. Create Supabase repository skeleton
8. Implement basic CRUD for Supabase
9. Add feature flag for database switching
10. Write repository integration tests
11. Write database switching tests

**Validation Checkpoint**:
- [ ] No direct Firestore dependencies in handlers
- [ ] Repository interfaces fully abstracted
- [ ] Supabase repositories work
- [ ] Database switching via feature flag
- [ ] Tests pass with both databases

**Update changes file** before proceeding.

---

#### Phase 4: Event-Driven Integration (Weeks 7-8)

**Goal**: Enable inter-module communication via events

**Tasks**:
1. Update aggregates to generate domain events
2. Publish events from command handlers
3. Add event metadata (timestamp, user, correlation ID)
4. Enhance EventBus with error handling
5. Create AuditLogEventHandler
6. Create PermissionCacheHandler
7. Create NotificationHandler (email/push)
8. Implement audit log repository
9. Subscribe audit handler to all blueprint events
10. Implement event store service
11. Implement event replay service
12. Write event publishing tests
13. Write event handler tests (isolated)
14. Write end-to-end event flow tests

**Validation Checkpoint**:
- [ ] All state changes publish events
- [ ] Audit trail captures all operations
- [ ] Event handlers process asynchronously
- [ ] Event replay functional
- [ ] No event loss under load

**Update changes file** before proceeding.

---

#### Phase 5: Module System & Final Polish (Weeks 9-10)

**Goal**: Implement pluggable module system and complete migration

**Tasks**:
1. Define IBlueprintModule interface
2. Create ModuleRegistry service
3. Implement module discovery mechanism
4. Add module lifecycle hooks (onEnable, onDisable)
5. Wrap Task module in module interface
6. Wrap Log module in module interface
7. Wrap Quality Check module in module interface
8. Implement module event subscriptions
9. Implement cross-module workflows
10. Add query result caching (@delon/cache)
11. Optimize Firestore indexes
12. Add loading states and skeletons to UI
13. Update architecture documentation
14. Create developer guide for adding modules
15. Create testing guidelines document
16. Conduct team training session
17. Performance benchmarking
18. Final regression testing

**Validation Checkpoint**:
- [ ] Module system operational
- [ ] All features converted to modules
- [ ] Performance targets met (TTI < 3s, FCP < 1.5s)
- [ ] Team trained
- [ ] Documentation complete
- [ ] All tests passing

**Update changes file** with completion status.

---

### Step 3: Final Validation

**Before marking complete**:
1. Run full test suite (unit + integration + E2E)
2. Perform load testing
3. Verify performance metrics
4. Code review with team
5. Security audit
6. Update all documentation

**Final Checklist**:
- [ ] All 5 phases completed
- [ ] 80%+ test coverage achieved
- [ ] Performance targets met
- [ ] No regressions
- [ ] Documentation updated
- [ ] Team trained
- [ ] Production-ready

### Step 4: Cleanup

After successful implementation:
1. Archive old service implementations (don't delete, mark deprecated)
2. Update CI/CD pipelines
3. Deploy to staging
4. Monitor for issues
5. Gradual rollout to production (10% → 50% → 100%)

## Success Criteria

**Technical Success**:
- Clean hexagonal architecture implemented
- Domain-Driven Design principles followed
- CQRS pattern operational
- Event-driven architecture working
- 80%+ test coverage
- Performance targets met

**Business Success**:
- No downtime during migration
- No feature regressions
- Improved developer velocity
- Easier to add new modules
- Better testability

**Team Success**:
- Team understands architecture
- Can work independently on modules
- Confident debugging issues
- Documentation accessible

## Rollback Plan

If critical issues arise in any phase:

1. **Phase 1**: Revert UI components to inject old service
2. **Phase 2**: Keep Facade but delegate to old service
3. **Phase 3**: Switch back to concrete Firestore implementations
4. **Phase 4**: Disable event publishing
5. **Phase 5**: Unregister problematic modules

**Database rollback**: Use feature flag to switch back to Firestore

## Monitoring

During and after implementation, monitor:
- Error rates (should stay < 1%)
- Response times (should stay < 300ms p95)
- Event processing lag (should stay < 1s)
- Test coverage (should stay > 80%)
- Bundle size (should stay < 500KB)

## Documentation Updates

As you implement, update:
- Architecture decision records (ADRs)
- API documentation
- Developer guides
- Testing guidelines
- Deployment procedures

---

**Prompt Version**: 1.0.0  
**Created**: 2025-12-09  
**Implementation Duration**: 10 weeks  
**Estimated Effort**: 400-500 hours  
**Team Size**: 3-5 developers recommended
