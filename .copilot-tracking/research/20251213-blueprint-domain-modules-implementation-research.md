<!-- markdownlint-disable-file -->

# Research: Blueprint Domain Module Implementation

**Research Date**: 2025-12-13  
**Task**: Implement 8 Blueprint domain module prototypes based on existing documentation  
**Domains**: log, workflow, qa, acceptance, finance, material, safety, communication

---

## Research Summary

This research analyzes the existing Blueprint module implementations and README documentation to create implementation guidelines for 8 new domain modules.

### Key Findings

✅ **Existing Reference Implementations**:
- `audit-logs` - Full implementation with all required files (258 lines)
- `climate` - Full implementation with services and API exports (322 lines)
- `tasks` - Partial implementation with components

✅ **Comprehensive Documentation**:
- All 8 domains have detailed README files (94-877 lines each)
- Each README contains: architecture, sub-modules, data models, API interfaces
- Clear priority order: P1 (log, workflow), P2 (qa, acceptance, finance), P3 (material), P4 (safety, communication)

✅ **Blueprint Architecture Standards**:
- IBlueprintModule interface implementation required
- Event Bus integration for inter-domain communication
- Repository pattern for Supabase data access
- Signal-based state management

---

## 1. Reference Implementation Analysis

### 1.1 audit-logs Module Structure

**Location**: `src/app/core/blueprint/modules/implementations/audit-logs/`

**Files**:
```
audit-logs/
├── audit-logs.module.ts       (258 lines) - Main IBlueprintModule implementation
├── module.metadata.ts          (143 lines) - Metadata, config, events  
├── repositories/audit-log.repository.ts
├── services/audit-logs.service.ts
├── components/ config/ exports/ models/
├── index.ts
└── README.md
```

**Key Patterns from audit-logs.module.ts**:
- Injectable class implementing IBlueprintModule
- Signal-based status management
- Inject LoggerService, services, repositories
- Module metadata constants (id, name, version, description, dependencies)
- Lifecycle methods: init, start, ready, stop, dispose
- Event Bus subscription/unsubscription
- Exports object with service/repository/metadata access

**Module Metadata Pattern** (module.metadata.ts):
```typescript
export const {DOMAIN}_MODULE_METADATA = {
  id: 'domain-name',
  moduleType: 'domain-name',
  name: '中文名稱',
  nameEn: 'English Name',
  version: '1.0.0',
  description: '中文描述',
  descriptionEn: 'English description',
  dependencies: [],
  defaultOrder: 10,
  icon: 'icon-name',
  color: '#hexcolor',
  category: 'system|business',
  tags: ['tag1', 'tag2'],
  author: 'GigHub Development Team',
  license: 'Proprietary'
};

export const {DOMAIN}_MODULE_DEFAULT_CONFIG: BlueprintModuleConfiguration = {
  features: { /* feature flags */ },
  settings: { /* module settings */ },
  ui: { icon, color, position, visibility },
  permissions: { requiredRoles, allowedActions },
  limits: { maxItems, maxStorage, maxRequests }
};

export const {DOMAIN}_MODULE_EVENTS = {
  EVENT_NAME: 'domain.event_name'
};
```

### 1.2 climate Module Patterns

**Location**: `src/app/core/blueprint/modules/implementations/climate/`

**Additional Patterns**:
- Configuration loading from environment variables
- Service initialization in init() method
- API exports creation: `createClimateModuleApi(service, repository)`
- Event emission during ready() state
- Cache cleanup during stop()

---

## 2. Domain Documentation Analysis

### 2.1 Log Domain (P1 - Critical)

**README Location**: `log/README.md` (731 lines)

**Sub-Modules** (5 total):
1. **Activity Log** - User operation tracking
   - Model: ActivityLog (id, blueprintId, userId, action, actionType, resourceType, metadata)
   
2. **System Event** - System-level event logging  
   - Model: SystemEvent (eventType, severity, source, message, details)
   
3. **Comment** - Multi-level comment system
   - Model: Comment (parentId, content, mentions, attachments, isEdited)
   
4. **Attachment** - File upload management
   - Model: Attachment (fileName, fileSize, fileType, storagePath)
   
5. **Change History** - Data change tracking
   - Model: ChangeHistory (changeType, fieldName, oldValue, newValue, version)

**API Interfaces**:
- IActivityLogApi: recordActivity, getActivityLogs
- ISystemEventApi: recordEvent, subscribeToEventType
- ICommentApi: createComment, replyToComment
- IAttachmentApi: uploadAttachment, downloadAttachment
- IChangeHistoryApi: recordChange, getChangeHistory

### 2.2 Workflow Domain (P1 - Critical)

**README Location**: `workflow/README.md` (877 lines)

**Sub-Modules** (5 total):
1. **Workflow Definition** - Workflow template management
2. **State Machine** - State transitions and rules
3. **Automation** - Event-driven automation triggers
4. **Approval** - Multi-level approval workflows
5. **Execution Monitor** - Real-time workflow monitoring

### 2.3 QA Domain (P2 - Important)

**README Location**: `qa/README.md` (785 lines)

**Sub-Modules** (4 total):
1. **Inspection** - Quality inspection management
2. **Checklist** - Customizable inspection checklists
3. **Defect** - Defect tracking and management
4. **Report** - QA report generation

### 2.4 Acceptance Domain (P2 - Important)

**README Location**: `acceptance/README.md` (871 lines)

**Sub-Modules** (5 total):
1. **Acceptance Process** - Acceptance workflow management
2. **Inspection Record** - Acceptance inspection records
3. **Defect Tracking** - Defect tracking during acceptance
4. **Certificate** - Acceptance certificate generation
5. **Document Management** - Acceptance document management

### 2.5 Finance Domain (P2 - Important)

**README Location**: `finance/README.md` (117 lines)

**Sub-Modules** (6 total):
1. **Budget** - Budget planning and tracking
2. **Invoice** - Invoice management
3. **Payment** - Payment processing
4. **Cost Tracking** - Cost tracking and analysis
5. **Accounting** - Accounting entry management
6. **Report** - Financial report generation

### 2.6 Material Domain (P3 - Recommended)

**README Location**: `material/README.md` (103 lines)

**Sub-Modules** (5 total):
1. **Material Master** - Material master data
2. **Inventory** - Inventory management
3. **Requisition** - Material requisition
4. **Asset** - Asset lifecycle management
5. **Loss Analysis** - Material loss analysis

### 2.7 Safety Domain (P4 - Optional)

**README Location**: `safety/README.md` (95 lines)

**Sub-Modules** (4 total):
1. **Inspection** - Safety inspection
2. **Risk** - Risk assessment and management
3. **Incident** - Incident reporting and investigation
4. **Training** - Safety training records

### 2.8 Communication Domain (P4 - Optional)

**README Location**: `communication/README.md` (94 lines)

**Sub-Modules** (4 total):
1. **Notification** - Multi-channel notifications
2. **Messaging** - Real-time messaging
3. **Reminder** - Task reminders and scheduling
4. **Preference** - Notification preferences

---

## 3. Implementation Patterns & Templates

### 3.1 Standard File Structure

```
{domain}/
├── {domain}.module.ts              # Main module class (~250 lines)
├── module.metadata.ts              # Metadata + config (~150 lines)
├── services/                       # Sub-module services
│   ├── {sub-module-1}.service.ts  (~80 lines each)
│   └── {sub-module-2}.service.ts
├── models/                         # TypeScript interfaces
│   ├── {sub-module-1}.model.ts    (~50 lines each)
│   └── {sub-module-2}.model.ts
├── config/
│   └── {domain}.config.ts         (~50 lines)
├── exports/
│   └── {domain}-api.exports.ts    (~100 lines)
├── index.ts                        (~20 lines)
└── README.md                       (already exists)
```

### 3.2 Module Class Template

```typescript
// {domain}.module.ts
import { Injectable, signal, inject, WritableSignal } from '@angular/core';
import { LoggerService } from '@core';
import type { IExecutionContext } from '@core/blueprint/context/execution-context.interface';
import { ModuleStatus } from '@core/blueprint/modules/module-status.enum';
import { IBlueprintModule } from '@core/blueprint/modules/module.interface';

@Injectable()
export class {Domain}Module implements IBlueprintModule {
  private readonly logger = inject(LoggerService);
  
  readonly id = {DOMAIN}_MODULE_METADATA.id;
  readonly name = {DOMAIN}_MODULE_METADATA.name;
  readonly version = {DOMAIN}_MODULE_METADATA.version;
  readonly description = {DOMAIN}_MODULE_METADATA.description;
  readonly dependencies = {DOMAIN}_MODULE_METADATA.dependencies;
  readonly status: WritableSignal<ModuleStatus> = signal(ModuleStatus.UNINITIALIZED);
  
  private context?: IExecutionContext;
  private blueprintId?: string;
  private eventUnsubscribers: Array<() => void> = [];
  
  readonly exports = {
    metadata: {DOMAIN}_MODULE_METADATA,
    defaultConfig: {DOMAIN}_MODULE_DEFAULT_CONFIG,
    events: {DOMAIN}_MODULE_EVENTS
  };

  async init(context: IExecutionContext): Promise<void> {
    this.logger.info('[{Domain}Module]', 'Initializing...');
    this.status.set(ModuleStatus.INITIALIZING);
    
    try {
      this.context = context;
      this.blueprintId = context.blueprintId;
      
      if (!this.blueprintId) {
        throw new Error('Blueprint ID not found');
      }
      
      this.validateDependencies(context);
      this.subscribeToEvents(context);
      this.registerExports(context);
      
      this.status.set(ModuleStatus.INITIALIZED);
      this.logger.info('[{Domain}Module]', 'Initialized successfully');
    } catch (error) {
      this.status.set(ModuleStatus.ERROR);
      this.logger.error('[{Domain}Module]', 'Initialization failed', error as Error);
      throw error;
    }
  }

  async start(): Promise<void> { /* ... */ }
  async ready(): Promise<void> { /* ... */ }
  async stop(): Promise<void> { /* ... */ }
  async dispose(): Promise<void> { /* ... */ }
  
  private validateDependencies(_context: IExecutionContext): void { /* ... */ }
  private subscribeToEvents(context: IExecutionContext): void { /* ... */ }
  private unsubscribeFromEvents(): void { /* ... */ }
  private registerExports(_context: IExecutionContext): void { /* ... */ }
}
```

### 3.3 Service Template (Stub)

```typescript
// services/{sub-module}.service.ts
import { Injectable, signal } from '@angular/core';

export interface {SubModule}Data {
  id: string;
  blueprintId: string;
  createdAt: Date;
}

@Injectable({ providedIn: 'root' })
export class {SubModule}Service {
  private _items = signal<{SubModule}Data[]>([]);
  private _loading = signal(false);
  private _error = signal<string | null>(null);
  
  readonly items = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  
  async load(blueprintId: string): Promise<void> {
    this._loading.set(true);
    try {
      // TODO: Implement Supabase query
      this._items.set([]);
    } catch (error) {
      this._error.set(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      this._loading.set(false);
    }
  }
  
  clearState(): void {
    this._items.set([]);
    this._error.set(null);
  }
}
```

---

## 4. Domain Metadata Reference

| Domain | ID | Icon | Color | Order | Sub-Modules |
|--------|----|----|-------|-------|-------------|
| Log | log | file-text | #52c41a | 20 | 5 |
| Workflow | workflow | branches | #1890ff | 30 | 5 |
| QA | qa | safety-certificate | #faad14 | 40 | 4 |
| Acceptance | acceptance | file-done | #722ed1 | 50 | 5 |
| Finance | finance | dollar | #eb2f96 | 60 | 6 |
| Material | material | shopping | #13c2c2 | 70 | 5 |
| Safety | safety | safety | #f5222d | 80 | 4 |
| Communication | communication | message | #2f54eb | 90 | 4 |

---

## 5. Implementation Scope

### MVP Prototype Scope

✅ **Include in Initial Implementation**:
- Complete {domain}.module.ts implementing IBlueprintModule
- Complete module.metadata.ts with config and events
- All sub-module model interfaces
- Stub service files for each sub-module (with signals)
- Basic config file
- API exports interface definitions
- Index.ts with proper exports

❌ **Defer to Post-Prototype**:
- Full Supabase repository implementations
- UI components
- Routes configuration
- Complex business logic
- Database schema SQL

### Estimated LOC per Domain

| Domain | LOC Estimate |
|--------|--------------|
| Log | 1500 |
| Workflow | 2000 |
| QA | 1200 |
| Acceptance | 1500 |
| Finance | 1800 |
| Material | 1500 |
| Safety | 1000 |
| Communication | 1000 |

**Total**: ~11,500 lines of code

---

## 6. Success Criteria

For each domain prototype:

✅ **Structural**:
- [ ] Module implements IBlueprintModule
- [ ] All lifecycle methods present
- [ ] Metadata file complete
- [ ] All sub-module models defined
- [ ] All sub-module services created
- [ ] Config, exports, index files present

✅ **Quality**:
- [ ] TypeScript compiles without errors
- [ ] No linting errors
- [ ] JSDoc comments present
- [ ] Follows project conventions

✅ **Integration**:
- [ ] Module can be instantiated
- [ ] Lifecycle can be executed
- [ ] Event Bus integration works
- [ ] Exports accessible

---

## 7. External References

- IBlueprintModule: `src/app/core/blueprint/modules/module.interface.ts`
- Reference: `src/app/core/blueprint/modules/implementations/audit-logs/`
- Reference: `src/app/core/blueprint/modules/implementations/climate/`
- Architecture: `docs/GigHub_Blueprint_Architecture_Analysis.md`
- Standards: `.github/instructions/angular.instructions.md`

---

**Research Status**: ✅ Complete  
**Ready for Planning**: Yes  
**Confidence**: High (95%)
