<!-- markdownlint-disable-file -->

# Task Research Notes: Blueprint Module Implementation

## Research Executed

### File Analysis

**Source Documents Analyzed**:
- `docs/Blueprint_Architecture.md` (2,355 lines) - Complete architecture documentation with 12 enterprise components
- `docs/BLUEPRINT_CONTAINER_DESIGN.md` (1,331 lines) - Detailed Firestore data model and implementation patterns

**Key Findings**:
1. **Architecture Pattern**: 4-layer design (Presentation → Facade → Service → Repository → Firestore)
2. **Technology Stack**: Angular 20, ng-zorro-antd 20, Firebase/Firestore, TypeScript 5.9
3. **Data Model**: Firestore collections with subcollections for modular design
4. **Security**: 19 Firestore Security Rules helper functions with multi-tier permissions
5. **State Management**: Angular Signals for reactive state

### Project Structure Analysis

**Current Repository Structure**:
```
src/
├── app/
│   ├── core/              # Core services, types, guards
│   ├── shared/            # Shared components, services
│   ├── routes/            # Feature routes
│   └── layout/            # Layout components
├── assets/
└── environments/
```

**Required New Structure for Blueprint**:
```
src/app/routes/blueprint/
├── blueprint-list/
├── blueprint-detail/
├── blueprint-create/
├── blueprint-settings/
├── members/
├── permissions/
├── audit-logs/
└── modules/
    ├── tasks/
    ├── logs/
    ├── quality/
    └── [other modules]

src/app/core/
├── types/
│   ├── blueprint/
│   ├── permission/
│   └── configuration/
├── services/
│   ├── audit/
│   ├── logger/
│   ├── tracing/
│   └── event-bus/
└── errors/

src/app/shared/services/
├── blueprint/
│   ├── blueprint.repository.ts
│   ├── blueprint.service.ts
│   └── blueprint.facade.ts
├── permission/
├── configuration/
├── module-lifecycle/
└── validation/
```

### External References

**Angular 20 Documentation** (#file:context7):
- Standalone Components: Required for all new components
- Signals: `signal()`, `computed()`, `effect()` for reactive state
- `inject()` function for dependency injection
- `input()`, `output()` instead of decorators (Angular >= 19)

**ng-zorro-antd Documentation** (#file:context7):
- `nz-table` for data tables
- `nz-form` for reactive forms
- `nz-modal` for dialogs
- `nz-notification` for user feedback

**Firebase/Firestore SDK** (#file:context7):
- `@angular/fire` v18+ integration
- Firestore SDK: `getDoc`, `getDocs`, `addDoc`, `updateDoc`, `deleteDoc`
- Security Rules: Custom functions for permission checking
- Real-time listeners: `onSnapshot` for live updates

### Implementation Patterns from Documentation

**1. Repository Pattern** (Lines 580-680 in BLUEPRINT_CONTAINER_DESIGN.md):
```typescript
@Injectable({ providedIn: 'root' })
export class BlueprintRepository {
  private firestore = inject(Firestore);
  private logger = inject(LoggerService);
  
  findById(id: string): Observable<Blueprint | null> {
    return from(getDoc(this.getDocRef(id))).pipe(
      map(docSnap => docSnap.exists() ? this.toBlueprint(docSnap.data(), docSnap.id) : null),
      catchError(error => {
        this.logger.error('[BlueprintRepository]', error);
        return of(null);
      })
    );
  }
  
  private getDocRef(id: string): DocumentReference {
    return doc(this.firestore, 'blueprints', id);
  }
  
  private toBlueprint(data: DocumentData, id: string): Blueprint {
    return {
      id,
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate()
    } as Blueprint;
  }
}
```

**2. Firestore Security Rules** (Lines 250-450 in BLUEPRINT_CONTAINER_DESIGN.md):
```javascript
// Helper Functions
function isAuthenticated() {
  return request.auth != null;
}

function isBlueprintOwner(blueprintId) {
  let blueprint = get(/databases/$(database)/documents/blueprints/$(blueprintId));
  let accountId = getCurrentAccountId();
  return blueprint.data.ownerType == 'user' && blueprint.data.ownerId == accountId;
}

function canEditBlueprint(blueprintId) {
  return isBlueprintOwner(blueprintId) 
    || isOrganizationAdmin(ownerId)
    || hasMemberRole(blueprintId, ['maintainer', 'contributor'])
    || hasTeamAccess(blueprintId, ['write', 'admin']);
}
```

**3. Audit Logging** (Lines 700-900 in Blueprint_Architecture.md):
```typescript
interface AuditLog {
  id: string;
  blueprintId: string;
  entityType: 'blueprint' | 'member' | 'task' | 'log' | 'quality';
  entityId: string;
  operation: 'create' | 'update' | 'delete' | 'access' | 'permission_grant';
  userId: string;
  timestamp: Date;
  changes?: { before: Record<string, any>; after: Record<string, any>; };
  metadata: { ipAddress?: string; userAgent?: string; context?: string; };
}
```

**4. Permission System** (Lines 1000-1200 in Blueprint_Architecture.md):
```typescript
interface Permission {
  id: string;
  blueprintId: string;
  subjectId: string;
  subjectType: 'user' | 'team' | 'organization';
  level: PermissionLevel;
  permissions: {
    blueprint: { read, update, delete, manageSettings, manageMembers, exportData };
    modules: { tasks: ModulePermission; logs: ModulePermission; ... };
  };
  validFrom?: Date;
  validUntil?: Date;
}
```

**5. Module Lifecycle** (Lines 1300-1500 in Blueprint_Architecture.md):
```typescript
enum ModuleState {
  UNINITIALIZED, INITIALIZING, ACTIVE, PAUSED, STOPPING, STOPPED, ERROR
}

abstract class BaseModule implements IModule {
  protected state: ModuleState = ModuleState.UNINITIALIZED;
  async initialize(): Promise<void> { /* ... */ }
  abstract onInitialize(): Promise<void>;
  async cleanup(): Promise<void> { /* ... */ }
}
```

### Standards References

**From GigHub Repository**:
- `.github/instructions/angular.instructions.md` - Angular 20 coding standards
- `.github/instructions/typescript-5-es2022.instructions.md` - TypeScript conventions
- `.github/instructions/ng-alain-delon.instructions.md` - ng-alain framework patterns
- `.github/instructions/ng-zorro-antd.instructions.md` - UI component guidelines
- `.github/instructions/angularfire.instructions.md` - Firebase integration patterns

**Key Conventions**:
1. **File Naming**: `feature-name.component.ts`, `feature-name.service.ts`, `feature-name.repository.ts`
2. **Component Structure**: Standalone components with `SHARED_IMPORTS`
3. **State Management**: Use Signals for reactive state
4. **Dependency Injection**: Use `inject()` function
5. **Error Handling**: Comprehensive try-catch with structured errors

## Implementation Approach

### Recommended Architecture

**Selected Approach**: Phased Implementation with Repository Pattern

**Rationale**:
1. **Proven Pattern**: Repository pattern is well-documented in both source documents
2. **Testability**: Clear separation of concerns enables unit testing
3. **Firebase Optimization**: Firestore SDK best practices are followed
4. **Scalability**: Modular design supports future extensions
5. **Team Familiarity**: Aligns with existing GigHub patterns

**Alternative Approaches Considered** (Removed after selection):
- None - Repository pattern is the established approach in documentation

### Phase Breakdown

**Phase 1: Foundation (Weeks 1-2)**
- Epic 1.1: Core Data Model & Types
- Epic 1.2: Repository Layer Implementation
- Epic 1.3: Firestore Security Rules
- Epic 1.4: Basic Service Layer

**Phase 2: Core Features (Weeks 3-4)**
- Epic 2.1: Blueprint CRUD Operations
- Epic 2.2: Member Management
- Epic 2.3: Permission System
- Epic 2.4: UI Components (List, Detail, Create)

**Phase 3: Advanced Components (Weeks 5-6)**
- Epic 3.1: Audit Logging System
- Epic 3.2: Configuration Management
- Epic 3.3: Module Lifecycle Management
- Epic 3.4: Event System

**Phase 4: Observability & Extensions (Weeks 7-8)**
- Epic 4.1: Logging & Tracing
- Epic 4.2: Error Handling Framework
- Epic 4.3: Data Validation
- Epic 4.4: Observability (Metrics, Health Checks)

### Technical Decisions

**Data Storage**: Firestore with subcollections
- Main collection: `blueprints/`
- Subcollections: `members/`, `auditLogs/`, `events/`, `configuration/`
- Rationale: Avoids document size limits, enables granular permissions

**State Management**: Angular Signals
- Reactive state updates
- Fine-grained reactivity
- Better performance than RxJS for UI state

**Authentication**: Firebase Authentication
- Seamless Firestore Rules integration
- Built-in token management
- Support for multiple providers

**Security**: Multi-layer approach
- Firestore Security Rules (database level)
- Angular Guards (route level)
- Service-level permission checks (application level)

## Dependencies

**Required Tools/Frameworks**:
- Angular 20.3.x
- @angular/fire 18.x
- ng-zorro-antd 20.x
- Firebase SDK 11.x
- TypeScript 5.9.x
- RxJS 7.8.x

**Development Tools**:
- Firebase CLI (for Security Rules deployment)
- Firebase Emulator Suite (for local testing)
- Angular CLI (for code generation)

## Success Criteria

**Phase 1 Success**:
- [ ] All TypeScript interfaces defined
- [ ] Repository layer with full CRUD operations
- [ ] Firestore Security Rules deployed and tested
- [ ] Basic service layer operational

**Phase 2 Success**:
- [ ] Blueprint create/read/update/delete working
- [ ] Member management operational
- [ ] Permission system enforced
- [ ] UI components functional with real data

**Phase 3 Success**:
- [ ] Audit logs capturing all operations
- [ ] Configuration management with versioning
- [ ] Module lifecycle with health checks
- [ ] Event system with pub/sub

**Phase 4 Success**:
- [ ] Structured logging operational
- [ ] Error handling with recovery
- [ ] Data validation framework
- [ ] Metrics and health checks exposed

**Overall Completion Criteria**:
- [ ] All 12 enterprise components implemented
- [ ] 80%+ test coverage
- [ ] Security audit passed
- [ ] Performance benchmarks met (<2s page load, <500ms queries)
- [ ] Documentation complete
