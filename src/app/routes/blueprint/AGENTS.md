# Blueprint Module Agent Guide

The Blueprint module is the **Container Layer** core of GigHub - it provides the logical container for all project-related data and operations.

## Module Purpose

A Blueprint represents a construction project workspace that:
- Contains tasks, diary entries, quality checks, and financial data
- Manages member permissions and access control
- Tracks audit logs for compliance
- Configures enabled modules and settings
- Supports both user-owned and organization-owned contexts

## Module Structure

```
src/app/routes/blueprint/
├── AGENTS.md                           # This file
├── blueprint-list.component.ts         # List/index view with ST table
├── blueprint-detail.component.ts       # Detail view with module dashboard
├── blueprint-modal.component.ts        # Create/edit modal
├── routes.ts                           # Module routing
├── members/
│   ├── blueprint-members.component.ts  # Member management
│   └── member-modal.component.ts       # Add/edit member
└── audit/
    └── audit-logs.component.ts         # Audit log viewer
```

## Data Models

### Blueprint

```typescript
interface Blueprint {
  id: string;                    // UUID primary key
  name: string;                  // Display name (min 3 chars)
  slug: string;                  // URL-friendly identifier (unique)
  description?: string;          // Optional description
  
  // Ownership
  owner_type: 'user' | 'organization';
  owner_id: string;              // User ID or Organization ID
  
  // Status & Visibility
  status: 'draft' | 'active' | 'archived';
  visibility: 'public' | 'private';
  
  // Module Configuration
  enabled_modules: string[];     // ['task', 'diary', 'quality', 'financial']
  module_settings: Record<string, any>;
  
  // Metadata
  created_at: string;
  updated_at: string;
  deleted_at?: string;           // Soft delete
  created_by: string;
  updated_by: string;
}
```

### BlueprintMember

```typescript
interface BlueprintMember {
  id: string;
  blueprint_id: string;
  account_id: string;            // User/Bot ID
  
  // System Role (affects permissions)
  role: 'viewer' | 'contributor' | 'maintainer';
  
  // Business Role (for display)
  business_role?: 'project_manager' | 'site_supervisor' | 
                  'engineer' | 'quality_inspector' | 
                  'architect' | 'contractor' | 'client';
  
  is_external: boolean;          // External contractor flag
  granted_at: string;
  granted_by: string;
}
```

### AuditLog

```typescript
interface AuditLog {
  id: string;
  blueprint_id: string;
  
  // What happened
  entity_type: 'Blueprint' | 'Member' | 'Task' | 'Log' | 'Quality' | 'Module';
  entity_id: string;
  operation: 'Create' | 'Update' | 'Delete' | 'Access' | 'PermissionGrant';
  
  // Who & When
  actor_id: string;
  actor_name: string;
  timestamp: string;
  
  // Context
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
}
```

## Enterprise Architecture Patterns

### 奧卡姆剃刀原則 (Occam's Razor Principle)

**核心理念**: "如無必要，勿增實體" - 保持最小化複雜度

Blueprint 模組遵循以下簡化原則：

1. **單一資料流**: 所有狀態變更通過 Signal 流動
2. **最少抽象層**: 僅三層 (UI → Service → Repository)
3. **避免過度工程**: 
   - ❌ 不使用 Redux/NgRx (Signals 已足夠)
   - ❌ 不建立 Facade 層 (直接注入 Service)
   - ❌ 不實作複雜狀態機 (使用簡單 status enum)
4. **可組合性優於繼承**: 使用組合模式而非深層繼承

### 共享上下文 (Shared Context)

#### Context Flow Architecture

```
User Context (Firebase Auth)
    ↓
Blueprint Context (Container)
    ↓
Module Context (Task/Diary/Quality)
```

#### Context Provider Pattern

**BlueprintContextService** - 提供當前 Blueprint 上下文給所有子模組

```typescript
// src/app/routes/blueprint/services/blueprint-context.service.ts
@Injectable()
export class BlueprintContextService implements OnDestroy {
  private currentBlueprintSignal = signal<Blueprint | null>(null);
  
  // Public readonly signal
  blueprint = this.currentBlueprintSignal.asReadonly();
  
  // Computed derived state
  blueprintId = computed(() => this.blueprint()?.id);
  enabledModules = computed(() => this.blueprint()?.enabled_modules || []);
  canEdit = computed(() => this.checkEditPermission());
  
  // Lifecycle
  private destroy$ = new Subject<void>();
  
  constructor() {
    // Auto-sync with route params
    this.syncWithRoute();
  }
  
  setBlueprint(blueprint: Blueprint): void {
    this.currentBlueprintSignal.set(blueprint);
  }
  
  isModuleEnabled(moduleId: string): boolean {
    return this.enabledModules().includes(moduleId);
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

**使用方式** (子模組注入):
```typescript
// In task module
@Component({
  providers: [BlueprintContextService] // Scoped to component tree
})
export class TaskListComponent {
  private context = inject(BlueprintContextService);
  
  blueprintId = this.context.blueprintId; // Auto-updates
  canEdit = this.context.canEdit;
}
```

#### Context Boundaries

1. **Route-level Context**: Blueprint ID from URL → Context Service
2. **Component-level Context**: Scoped providers for isolated state
3. **Module-level Context**: Shared within feature module

### 事件系統 (Event System)

#### Event Entry Points

Blueprint 模組提供三種事件入口點:

##### 1. Domain Events (領域事件)

```typescript
// src/app/routes/blueprint/events/blueprint.events.ts
export enum BlueprintEventType {
  Created = 'blueprint.created',
  Updated = 'blueprint.updated',
  Deleted = 'blueprint.deleted',
  MemberAdded = 'blueprint.member.added',
  MemberRemoved = 'blueprint.member.removed',
  ModuleEnabled = 'blueprint.module.enabled',
  ModuleDisabled = 'blueprint.module.disabled'
}

export interface BlueprintEvent<T = any> {
  type: BlueprintEventType;
  blueprintId: string;
  timestamp: number;
  actor: string;
  data: T;
}
```

##### 2. Event Bus Pattern

```typescript
// src/app/routes/blueprint/services/blueprint-event-bus.service.ts
@Injectable({ providedIn: 'root' })
export class BlueprintEventBus {
  private eventSubject = new Subject<BlueprintEvent>();
  
  // Observable stream of all events
  events$ = this.eventSubject.asObservable();
  
  // Filtered streams
  created$ = this.events$.pipe(
    filter(e => e.type === BlueprintEventType.Created)
  );
  
  updated$ = this.events$.pipe(
    filter(e => e.type === BlueprintEventType.Updated)
  );
  
  // Emit event
  emit(event: BlueprintEvent): void {
    this.eventSubject.next(event);
    this.logEvent(event); // Auto-logging
  }
  
  // Subscribe to specific blueprint
  forBlueprint(blueprintId: string): Observable<BlueprintEvent> {
    return this.events$.pipe(
      filter(e => e.blueprintId === blueprintId)
    );
  }
  
  private logEvent(event: BlueprintEvent): void {
    // Send to audit log
    console.log('[BlueprintEvent]', event);
  }
}
```

##### 3. Event Usage Pattern

```typescript
// In BlueprintService
async create(data: CreateBlueprintDto): Promise<Blueprint> {
  const blueprint = await this.repository.create(data);
  
  // Emit domain event
  this.eventBus.emit({
    type: BlueprintEventType.Created,
    blueprintId: blueprint.id,
    timestamp: Date.now(),
    actor: this.auth.currentUser!.uid,
    data: blueprint
  });
  
  return blueprint;
}

// In other components (reactive)
export class DashboardComponent {
  private eventBus = inject(BlueprintEventBus);
  
  constructor() {
    // React to blueprint changes
    this.eventBus.created$
      .pipe(takeUntilDestroyed())
      .subscribe(event => {
        this.refreshDashboard();
      });
  }
}
```

#### Event Flow Diagram

```
User Action (UI)
    ↓
Component Method
    ↓
Service Method
    ↓
Repository Operation
    ↓
Event Bus Emit
    ↓
╔══════════════════════╗
║   Event Subscribers   ║
║  - Audit Log Writer  ║
║  - Cache Invalidator ║
║  - UI Refresh        ║
║  - Analytics         ║
╚══════════════════════╝
```

### 錯誤邊界 (Error Boundaries)

#### Error Handling Strategy

##### 1. Error Classification

```typescript
// src/app/routes/blueprint/errors/blueprint-error.ts
export enum BlueprintErrorSeverity {
  Low = 'low',           // Non-critical, user can continue
  Medium = 'medium',     // Important but recoverable
  High = 'high',         // Critical, requires attention
  Critical = 'critical'  // System-level, needs immediate fix
}

export class BlueprintError extends Error {
  constructor(
    message: string,
    public code: string,
    public severity: BlueprintErrorSeverity,
    public recoverable: boolean,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'BlueprintError';
  }
}

// Specific error types
export class BlueprintNotFoundError extends BlueprintError {
  constructor(blueprintId: string) {
    super(
      `Blueprint not found: ${blueprintId}`,
      'BLUEPRINT_NOT_FOUND',
      BlueprintErrorSeverity.High,
      false,
      { blueprintId }
    );
  }
}

export class BlueprintPermissionError extends BlueprintError {
  constructor(action: string, blueprintId: string) {
    super(
      `Permission denied for ${action} on blueprint ${blueprintId}`,
      'BLUEPRINT_PERMISSION_DENIED',
      BlueprintErrorSeverity.High,
      false,
      { action, blueprintId }
    );
  }
}
```

##### 2. Error Boundary Component

```typescript
// src/app/routes/blueprint/components/blueprint-error-boundary.component.ts
@Component({
  selector: 'blueprint-error-boundary',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    @if (error()) {
      <nz-result
        [nzStatus]="getStatus()"
        [nzTitle]="error()!.message"
        [nzSubTitle]="getSubtitle()">
        <div nz-result-extra>
          @if (error()!.recoverable) {
            <button nz-button nzType="primary" (click)="retry()">
              Retry
            </button>
          }
          <button nz-button (click)="goBack()">
            Go Back
          </button>
        </div>
      </nz-result>
    } @else {
      <ng-content />
    }
  `
})
export class BlueprintErrorBoundaryComponent {
  error = signal<BlueprintError | null>(null);
  
  private router = inject(Router);
  private logger = inject(LoggerService);
  
  catchError(error: unknown): void {
    if (error instanceof BlueprintError) {
      this.error.set(error);
      this.logger.error('Blueprint Error', error, error.context);
    } else {
      // Wrap unknown errors
      this.error.set(new BlueprintError(
        String(error),
        'UNKNOWN_ERROR',
        BlueprintErrorSeverity.Medium,
        true
      ));
    }
  }
  
  retry(): void {
    this.error.set(null);
    // Retry logic
  }
  
  goBack(): void {
    this.router.navigate(['/blueprint']);
  }
  
  getStatus(): 'error' | '403' | '404' | '500' {
    const code = this.error()?.code;
    if (code === 'BLUEPRINT_NOT_FOUND') return '404';
    if (code === 'BLUEPRINT_PERMISSION_DENIED') return '403';
    return 'error';
  }
  
  getSubtitle(): string {
    return this.error()?.recoverable 
      ? 'This error is recoverable. Please try again.'
      : 'Please contact support if this persists.';
  }
}
```

##### 3. Error Handling in Services

```typescript
// In BlueprintService
async getById(id: string): Promise<Blueprint> {
  try {
    const blueprint = await this.repository.getById(id);
    
    if (!blueprint) {
      throw new BlueprintNotFoundError(id);
    }
    
    // Permission check
    const canRead = await this.permissionService.canRead(id);
    if (!canRead) {
      throw new BlueprintPermissionError('read', id);
    }
    
    return blueprint;
  } catch (error) {
    // Re-throw typed errors
    if (error instanceof BlueprintError) {
      throw error;
    }
    
    // Wrap Firestore errors
    if (error.code === 'permission-denied') {
      throw new BlueprintPermissionError('read', id);
    }
    
    // Generic error
    throw new BlueprintError(
      'Failed to load blueprint',
      'BLUEPRINT_LOAD_FAILED',
      BlueprintErrorSeverity.High,
      true,
      { error, blueprintId: id }
    );
  }
}
```

##### 4. Global Error Handler

```typescript
// src/app/core/services/global-error-handler.service.ts
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private logger = inject(LoggerService);
  private message = inject(NzMessageService);
  
  handleError(error: any): void {
    if (error instanceof BlueprintError) {
      this.handleBlueprintError(error);
    } else {
      this.handleUnknownError(error);
    }
  }
  
  private handleBlueprintError(error: BlueprintError): void {
    // Log with severity
    this.logger.error(error.message, error, error.context);
    
    // Show user-friendly message
    switch (error.severity) {
      case BlueprintErrorSeverity.Critical:
        this.message.error(error.message, { nzDuration: 0 });
        break;
      case BlueprintErrorSeverity.High:
        this.message.error(error.message);
        break;
      case BlueprintErrorSeverity.Medium:
        this.message.warning(error.message);
        break;
      case BlueprintErrorSeverity.Low:
        this.message.info(error.message);
        break;
    }
  }
}
```

### 生命週期管理 (Lifecycle Management)

#### Component Lifecycle Hooks

Blueprint 模組元件生命週期管理策略:

##### 1. Lifecycle Phases

```typescript
export class BlueprintDetailComponent implements OnInit, OnDestroy {
  // Phase 1: Construction
  constructor() {
    // Only inject dependencies
    // NO business logic here
  }
  
  // Phase 2: Initialization
  ngOnInit(): void {
    // Setup phase
    this.loadBlueprint();
    this.setupSubscriptions();
    this.initializeContext();
  }
  
  // Phase 3: Active (signal-based reactivity)
  // No explicit hook - handled by signals
  
  // Phase 4: Cleanup
  ngOnDestroy(): void {
    // Cleanup subscriptions (auto with takeUntilDestroyed)
    // Clear context
    this.context.clear();
  }
}
```

##### 2. Lifecycle Best Practices

```typescript
// ✅ GOOD: Use takeUntilDestroyed() for subscriptions
export class BlueprintListComponent {
  private blueprintService = inject(BlueprintService);
  
  constructor() {
    // Auto-cleanup with takeUntilDestroyed
    this.blueprintService.list()
      .pipe(takeUntilDestroyed())
      .subscribe(blueprints => {
        this.blueprints.set(blueprints);
      });
  }
}

// ✅ GOOD: Use signals for reactive state (no manual cleanup needed)
export class BlueprintDetailComponent {
  blueprint = signal<Blueprint | null>(null);
  
  // Computed values auto-update
  blueprintName = computed(() => this.blueprint()?.name || 'Loading...');
  enabledModules = computed(() => this.blueprint()?.enabled_modules || []);
}

// ❌ BAD: Manual subscription without cleanup
export class BadComponent implements OnInit {
  ngOnInit(): void {
    this.service.data$.subscribe(data => {
      // Memory leak - no cleanup!
    });
  }
}
```

##### 3. Service Lifecycle

```typescript
// Singleton service (providedIn: 'root')
@Injectable({ providedIn: 'root' })
export class BlueprintService {
  // Lives for entire application lifetime
  // State persists across route changes
  
  private cacheSignal = signal<Map<string, Blueprint>>(new Map());
  
  // NO ngOnDestroy - never destroyed
}

// Scoped service (provided in component)
@Injectable()
export class BlueprintContextService implements OnDestroy {
  // Lives only within component tree
  // Destroyed when component is destroyed
  
  ngOnDestroy(): void {
    this.cleanup();
  }
}
```

##### 4. Async Lifecycle

```typescript
export class BlueprintListComponent {
  loading = signal(false);
  error = signal<Error | null>(null);
  
  async loadBlueprints(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      const blueprints = await this.service.list();
      this.blueprints.set(blueprints);
    } catch (error) {
      this.error.set(error as Error);
    } finally {
      this.loading.set(false);
    }
  }
}
```

### 系統化模塊擴展 (Systematic Module Extension)

#### Module Extension Framework

##### 1. Module Registry Pattern

```typescript
// src/app/routes/blueprint/config/module-registry.ts
export interface ModuleDefinition {
  id: string;
  name: string;
  icon: string;
  description: string;
  route: string;
  requiredPermission: string;
  dependencies?: string[]; // Other module IDs
  configSchema?: any;
}

export const BLUEPRINT_MODULES: Record<string, ModuleDefinition> = {
  task: {
    id: 'task',
    name: '任務管理',
    icon: 'check-square',
    description: '追蹤與管理專案任務',
    route: 'tasks',
    requiredPermission: 'task:read'
  },
  diary: {
    id: 'diary',
    name: '施工日誌',
    icon: 'file-text',
    description: '記錄每日施工進度',
    route: 'diary',
    requiredPermission: 'diary:read',
    dependencies: ['task'] // Requires task module
  },
  quality: {
    id: 'quality',
    name: '品質管理',
    icon: 'safety',
    description: '品質檢查與缺陷追蹤',
    route: 'quality',
    requiredPermission: 'quality:read'
  },
  financial: {
    id: 'financial',
    name: '財務管理',
    icon: 'dollar',
    description: '預算與成本追蹤',
    route: 'financial',
    requiredPermission: 'financial:read'
  }
};
```

##### 2. Adding New Module Checklist

**步驟化新增模組流程**:

```markdown
## 新增模組檢查清單

### Phase 1: 規劃 (Planning)
- [ ] 定義模組 ID 與名稱
- [ ] 設計資料模型 (interfaces)
- [ ] 規劃 UI 元件結構
- [ ] 確認依賴的其他模組
- [ ] 設計權限需求

### Phase 2: 註冊 (Registration)
- [ ] 在 `module-registry.ts` 註冊模組定義
- [ ] 更新 Blueprint 介面的 `enabled_modules` 類型
- [ ] 在 Firestore 建立對應 collection
- [ ] 建立 Firestore Security Rules

### Phase 3: 實作 (Implementation)
- [ ] 建立模組目錄: `src/app/routes/[module]/`
- [ ] 建立 AGENTS.md 文件
- [ ] 實作資料模型: `types/[module].types.ts`
- [ ] 實作 Repository: `repositories/[module]/[module].repository.ts`
- [ ] 實作 Service: `services/[module]/[module].service.ts`
- [ ] 實作 List Component
- [ ] 實作 Detail Component
- [ ] 實作 Modal Component
- [ ] 建立路由配置: `routes.ts`

### Phase 4: 整合 (Integration)
- [ ] 註冊路由到主路由: `src/app/routes/routes.ts`
- [ ] 加入 moduleEnabledGuard
- [ ] 整合到 Blueprint Detail 頁面
- [ ] 加入側邊欄選單項目
- [ ] 實作事件整合 (Event Bus)

### Phase 5: 測試 (Testing)
- [ ] 單元測試 (Repository, Service)
- [ ] 元件測試 (List, Detail, Modal)
- [ ] 整合測試 (與 Blueprint 整合)
- [ ] 權限測試 (Security Rules)
- [ ] E2E 測試 (使用者流程)

### Phase 6: 文件 (Documentation)
- [ ] 更新模組 AGENTS.md
- [ ] 更新 Blueprint AGENTS.md (整合點)
- [ ] 建立使用者指南
- [ ] 建立 API 文件
```

##### 3. Module Template

```typescript
// Template for new module service
// src/app/routes/[module]/services/[module].service.ts

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ModuleRepository } from '../repositories/[module].repository';
import { ModuleEntity } from '../types/[module].types';
import { BlueprintEventBus, BlueprintEventType } from '@routes/blueprint/services/blueprint-event-bus.service';

@Injectable({ providedIn: 'root' })
export class ModuleService {
  private repository = inject(ModuleRepository);
  private eventBus = inject(BlueprintEventBus);
  private auth = inject(Auth);
  
  // CRUD Operations
  async list(blueprintId: string): Promise<ModuleEntity[]> {
    return this.repository.list(blueprintId);
  }
  
  async getById(id: string): Promise<ModuleEntity> {
    return this.repository.getById(id);
  }
  
  async create(blueprintId: string, data: Partial<ModuleEntity>): Promise<ModuleEntity> {
    const entity = await this.repository.create(blueprintId, data);
    
    // Emit event
    this.eventBus.emit({
      type: '[module].created' as BlueprintEventType,
      blueprintId,
      timestamp: Date.now(),
      actor: this.auth.currentUser!.uid,
      data: entity
    });
    
    return entity;
  }
  
  async update(id: string, data: Partial<ModuleEntity>): Promise<ModuleEntity> {
    const entity = await this.repository.update(id, data);
    
    // Emit event
    this.eventBus.emit({
      type: '[module].updated' as BlueprintEventType,
      blueprintId: entity.blueprint_id,
      timestamp: Date.now(),
      actor: this.auth.currentUser!.uid,
      data: entity
    });
    
    return entity;
  }
  
  async delete(id: string): Promise<void> {
    const entity = await this.repository.getById(id);
    await this.repository.softDelete(id);
    
    // Emit event
    this.eventBus.emit({
      type: '[module].deleted' as BlueprintEventType,
      blueprintId: entity.blueprint_id,
      timestamp: Date.now(),
      actor: this.auth.currentUser!.uid,
      data: { id }
    });
  }
}
```

##### 4. Module Integration Points

```typescript
// Blueprint Detail Component - Dynamic module loading
export class BlueprintDetailComponent {
  enabledModules = computed(() => {
    const bp = this.blueprint();
    if (!bp) return [];
    
    return bp.enabled_modules
      .map(id => BLUEPRINT_MODULES[id])
      .filter(m => m !== undefined);
  });
  
  navigateToModule(module: ModuleDefinition): void {
    this.router.navigate([
      '/blueprint',
      this.blueprint()!.id,
      module.route
    ]);
  }
}
```

## Components Overview

### BlueprintListComponent

**Purpose**: Main entry point showing all accessible blueprints  
**File**: `blueprint-list.component.ts` (312 lines)

**Key Features**:
- ST table with pagination
- Status filtering (draft/active/archived)
- Owner type filtering
- Quick actions (view, edit, delete)
- Create new blueprint modal

**State Management**:
```typescript
blueprints = signal<Blueprint[]>([]);
loading = signal(false);
selectedStatus = signal<string>('all');
```

**Table Configuration**:
```typescript
columns: STColumn[] = [
  { title: 'Name', index: 'name', click: (item) => this.view(item) },
  { title: 'Status', index: 'status', type: 'badge' },
  { title: 'Owner', index: 'owner_type' },
  { title: 'Modules', render: 'modulesTemplate' },
  { title: 'Created', index: 'created_at', type: 'date' },
  { title: 'Actions', buttons: [...] }
];
```

**Common Operations**:
- `loadBlueprints()`: Fetch and display blueprints
- `create()`: Open modal for new blueprint
- `edit(blueprint)`: Open modal for editing
- `delete(blueprint)`: Soft delete with confirmation

### BlueprintDetailComponent

**Purpose**: Shows full blueprint information and quick actions  
**File**: `blueprint-detail.component.ts` (384 lines)

**Key Features**:
- Basic info display (name, slug, status, owner)
- Enabled modules grid with icons
- Quick action buttons (members, settings, audit, export)
- Breadcrumb navigation
- Permission-based UI controls

**State Management**:
```typescript
blueprint = signal<Blueprint | null>(null);
loading = signal(false);
canEdit = signal(false);
canDelete = signal(false);
canManageMembers = signal(false);
```

**Computed Values**:
```typescript
enabledModules = computed(() => {
  const bp = this.blueprint();
  return bp ? this.getModuleInfo(bp.enabled_modules) : [];
});
```

**Permission Checks**:
```typescript
ngOnInit() {
  this.loadBlueprint();
  this.checkPermissions();
}

async checkPermissions() {
  const blueprintId = this.blueprint()?.id;
  if (!blueprintId) return;
  
  this.canEdit.set(
    await this.permissionService.canEdit(blueprintId)
  );
  this.canManageMembers.set(
    await this.permissionService.canManageMembers(blueprintId)
  );
}
```

### BlueprintModalComponent

**Purpose**: Unified create/edit modal with form validation  
**File**: `blueprint-modal.component.ts` (332 lines)

**Key Features**:
- Reactive form with validation
- Auto-generate slug from name
- Module selection checkboxes
- Owner type/ID selection
- Status and visibility toggles

**Form Definition**:
```typescript
form = this.fb.group({
  name: ['', [Validators.required, Validators.minLength(3)]],
  slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
  description: [''],
  owner_type: ['user', Validators.required],
  owner_id: ['', Validators.required],
  status: ['draft', Validators.required],
  visibility: ['private', Validators.required],
  enabled_modules: [[], Validators.required]
});
```

**Auto-slug Generation**:
```typescript
ngOnInit() {
  this.form.get('name')?.valueChanges.subscribe(name => {
    if (this.mode === 'create') {
      const slug = this.generateSlug(name);
      this.form.patchValue({ slug }, { emitEvent: false });
    }
  });
}

generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
```

**Save Flow**:
```typescript
async save() {
  if (!this.form.valid) return;
  
  const data = this.form.value;
  
  // Validate with ValidationService
  const validation = this.validationService.validate(
    data,
    this.mode === 'create' ? 
      BlueprintCreateSchema : 
      BlueprintUpdateSchema
  );
  
  if (!validation.valid) {
    this.showErrors(validation.errors);
    return;
  }
  
  // Call service
  const result = this.mode === 'create' ?
    await this.blueprintService.create(data) :
    await this.blueprintService.update(this.blueprint!.id, data);
  
  this.modal.close(result);
}
```

### BlueprintMembersComponent

**Purpose**: Manage blueprint member access and roles  
**File**: `members/blueprint-members.component.ts` (221 lines)

**Key Features**:
- ST table showing all members
- Role badges (viewer/contributor/maintainer)
- Business role display
- Add/edit/remove member actions
- External member indicator

**Table Configuration**:
```typescript
columns: STColumn[] = [
  { title: 'Account ID', index: 'account_id' },
  { 
    title: 'System Role', 
    index: 'role',
    type: 'badge',
    badge: {
      viewer: { text: 'Viewer', color: 'default' },
      contributor: { text: 'Contributor', color: 'processing' },
      maintainer: { text: 'Maintainer', color: 'success' }
    }
  },
  { title: 'Business Role', index: 'business_role' },
  { title: 'External', index: 'is_external', type: 'yn' },
  { title: 'Granted', index: 'granted_at', type: 'date' },
  { title: 'Actions', buttons: [...] }
];
```

**Member Operations**:
```typescript
async addMember() {
  const result = await this.modal.create(MemberModalComponent, {
    mode: 'add',
    blueprintId: this.blueprintId
  }).toPromise();
  
  if (result) {
    await this.loadMembers();
  }
}

async removeMember(member: BlueprintMember) {
  const confirmed = await this.modal.confirm({
    title: 'Remove Member',
    content: `Remove ${member.account_id}?`
  }).toPromise();
  
  if (confirmed) {
    await this.blueprintService.removeMember(
      this.blueprintId, 
      member.id
    );
    await this.loadMembers();
  }
}
```

### AuditLogsComponent

**Purpose**: View immutable audit trail  
**File**: `audit/audit-logs.component.ts` (271 lines)

**Key Features**:
- ST table with all audit logs
- Filter by entity type
- Filter by operation
- Timestamp formatting
- Detail view modal

**Filtering**:
```typescript
selectedEntityType = signal<string>('all');
selectedOperation = signal<string>('all');

filteredLogs = computed(() => {
  let logs = this.logs();
  
  const entityType = this.selectedEntityType();
  if (entityType !== 'all') {
    logs = logs.filter(log => log.entity_type === entityType);
  }
  
  const operation = this.selectedOperation();
  if (operation !== 'all') {
    logs = logs.filter(log => log.operation === operation);
  }
  
  return logs;
});
```

## Permission System

### Role Hierarchy

```
Maintainer (維護者)
├─ All permissions
├─ Manage members
├─ Manage settings
├─ Delete blueprint
└─ Full CRUD on all modules

Contributor (貢獻者)
├─ Read blueprint
├─ Edit blueprint
├─ CRUD on tasks, diary, quality
└─ Cannot manage members/settings

Viewer (檢視者)
└─ Read-only access to all modules
```

### Permission Checks

**Client-side (UI control)**:
```typescript
// In component
canEdit = signal(false);

ngOnInit() {
  this.permissionService
    .canEdit(this.blueprintId)
    .subscribe(can => this.canEdit.set(can));
}

// In template
@if (canEdit()) {
  <button (click)="edit()">Edit</button>
}
```

**Server-side (Firestore Security Rules)**:
```javascript
// In firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Blueprints collection
    match /blueprints/{blueprintId} {
      allow read: if canReadBlueprint(blueprintId);
      allow update: if canEditBlueprint(blueprintId);
      allow delete: if hasRole(blueprintId, 'maintainer');
    }
    
    // Helper functions
    function canReadBlueprint(blueprintId) {
      let blueprint = get(/databases/$(database)/documents/blueprints/$(blueprintId));
      return request.auth != null && (
        // Owner check
        blueprint.data.owner_type == 'user' && blueprint.data.owner_id == request.auth.uid ||
        // Member check
        exists(/databases/$(database)/documents/blueprint_members/$(blueprintId + '_' + request.auth.uid))
      );
    }
    
    function canEditBlueprint(blueprintId) {
      return request.auth != null && (
        canReadBlueprint(blueprintId) &&
        hasRole(blueprintId, ['contributor', 'maintainer'])
      );
    }
    
    function hasRole(blueprintId, roles) {
      let memberDoc = get(/databases/$(database)/documents/blueprint_members/$(blueprintId + '_' + request.auth.uid));
      return memberDoc.data.role in roles;
    }
  }
}
```

### Firestore Security Rules Structure

**Main Rules File**: `firestore.rules` in project root

**Key Functions**:
- `canReadBlueprint()` - Check read permission
- `canEditBlueprint()` - Check edit permission
- `hasRole()` - Check user's role in blueprint
- `isOwner()` - Check if user owns the blueprint

**Protected Collections**:
1. `blueprints` - Main blueprint documents
2. `blueprint_members` - Member roles and permissions
3. `blueprint_tasks` - Tasks (subcollection or top-level)
4. `blueprint_logs` - Activity logs
5. `blueprint_audit` - Audit logs (immutable)

**Rule Examples**:
```javascript
// Read-only audit logs
match /blueprint_audit/{auditId} {
  allow read: if canReadBlueprint(resource.data.blueprint_id);
  allow create: if true; // System creates these
  allow update, delete: if false; // Immutable
}

// Member management (maintainer only)
match /blueprint_members/{memberId} {
  allow read: if canReadBlueprint(resource.data.blueprint_id);
  allow write: if hasRole(resource.data.blueprint_id, ['maintainer']);
}
```

## Validation

### Schema-based Validation

**Create Blueprint Schema**:
```typescript
export const BlueprintCreateSchema: ValidationSchema = {
  name: [
    { type: 'required', message: '名稱為必填' },
    { type: 'minLength', value: 3, message: '名稱至少需要 3 個字元' },
    { type: 'maxLength', value: 100, message: '名稱最多 100 個字元' }
  ],
  slug: [
    { type: 'required', message: 'Slug 為必填' },
    { 
      type: 'pattern', 
      value: /^[a-z0-9-]+$/, 
      message: 'Slug 只能包含小寫字母、數字和連字符' 
    }
  ],
  owner_type: [
    { type: 'required', message: '擁有者類型為必填' }
  ],
  owner_id: [
    { type: 'required', message: '擁有者 ID 為必填' }
  ],
  enabled_modules: [
    { 
      type: 'custom', 
      value: (val) => Array.isArray(val) && val.length > 0,
      message: '至少需要啟用一個模組' 
    }
  ]
};
```

**Update Blueprint Schema**:
```typescript
export const BlueprintUpdateSchema: ValidationSchema = {
  name: [
    { type: 'minLength', value: 3, message: '名稱至少需要 3 個字元' },
    { type: 'maxLength', value: 100, message: '名稱最多 100 個字元' }
  ],
  slug: [
    { 
      type: 'pattern', 
      value: /^[a-z0-9-]+$/, 
      message: 'Slug 只能包含小寫字母、數字和連字符' 
    }
  ]
};
```

## Services & Repositories

### BlueprintService

**Location**: `src/app/shared/services/blueprint/blueprint.service.ts`

**Methods**:
```typescript
@Injectable({ providedIn: 'root' })
export class BlueprintService {
  // CRUD operations
  async list(): Promise<Blueprint[]>
  async getById(id: string): Promise<Blueprint>
  async create(data: CreateBlueprintDto): Promise<Blueprint>
  async update(id: string, data: UpdateBlueprintDto): Promise<Blueprint>
  async delete(id: string): Promise<void>
  
  // Member management
  async listMembers(blueprintId: string): Promise<BlueprintMember[]>
  async addMember(blueprintId: string, data: AddMemberDto): Promise<BlueprintMember>
  async updateMember(blueprintId: string, memberId: string, data: UpdateMemberDto): Promise<BlueprintMember>
  async removeMember(blueprintId: string, memberId: string): Promise<void>
  
  // Audit logs
  async getAuditLogs(blueprintId: string): Promise<AuditLog[]>
  
  // Module management
  async enableModule(blueprintId: string, moduleId: string): Promise<void>
  async disableModule(blueprintId: string, moduleId: string): Promise<void>
}
```

### BlueprintRepository

**Location**: `src/app/core/infra/repositories/blueprint/blueprint.repository.ts`

**Responsibilities**:
- Direct Firestore database access
- Query building with @angular/fire
- Data transformation
- Error handling

**Example**:
```typescript
import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class BlueprintRepository {
  private firestore = inject(Firestore);
  
  async list(): Promise<Blueprint[]> {
    try {
      const blueprintsRef = collection(this.firestore, 'blueprints');
      const q = query(
        blueprintsRef,
        where('deleted_at', '==', null),
        orderBy('created_at', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Blueprint[];
    } catch (error) {
      throw new BlueprintError('Failed to fetch blueprints', {
        severity: ErrorSeverity.High,
        context: { error }
      });
    }
  }
  
  async getById(id: string): Promise<Blueprint | null> {
    const docRef = doc(this.firestore, 'blueprints', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    return { id: docSnap.id, ...docSnap.data() } as Blueprint;
  }
  
  async create(data: Partial<Blueprint>): Promise<Blueprint> {
    const blueprintsRef = collection(this.firestore, 'blueprints');
    const docRef = await addDoc(blueprintsRef, {
      ...data,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now()
    });
    
    return this.getById(docRef.id) as Promise<Blueprint>;
  }
  
  async update(id: string, data: Partial<Blueprint>): Promise<Blueprint> {
    const docRef = doc(this.firestore, 'blueprints', id);
    await updateDoc(docRef, {
      ...data,
      updated_at: Timestamp.now()
    });
    
    return this.getById(id) as Promise<Blueprint>;
  }
}
```

## Available Modules

Blueprints can enable the following business modules:

| Module ID | Name | Icon | Description |
|-----------|------|------|-------------|
| `task` | 任務管理 | check-square | Task tracking and management |
| `diary` | 施工日誌 | file-text | Daily construction logs |
| `quality` | 品質管理 | safety | Quality control and inspections |
| `financial` | 財務管理 | dollar | Budget and financial tracking |
| `file` | 文件管理 | folder-open | Document storage and organization |
| `notification` | 通知系統 | bell | In-app notifications |
| `timeline` | 時間軸 | clock-circle | Project timeline visualization |

## Common Operations

### Creating a Blueprint

```typescript
// In BlueprintListComponent
async create() {
  const result = await this.modal.create(BlueprintModalComponent, {
    mode: 'create'
  }).toPromise();
  
  if (result) {
    await this.loadBlueprints();
    this.message.success('Blueprint created successfully');
  }
}
```

### Adding a Member

```typescript
// In BlueprintMembersComponent
async addMember() {
  const result = await this.modal.create(MemberModalComponent, {
    mode: 'add',
    blueprintId: this.blueprintId
  }).toPromise();
  
  if (result) {
    await this.loadMembers();
    this.message.success('Member added successfully');
  }
}
```

### Viewing Audit Logs

```typescript
// Navigate from detail page
viewAudit() {
  this.router.navigate(['/blueprint', this.blueprint()?.id, 'audit']);
}
```

## Integration Points

### With Foundation Layer
- **Account Service**: Validates owner_id existence
- **Organization Service**: Checks org membership for org-owned blueprints
- **Team Service**: Manages team-level access

### With Business Layer
- **Task Module**: Scoped by blueprint_id
- **Diary Module**: Scoped by blueprint_id
- **Quality Module**: Scoped by blueprint_id
- **Financial Module**: Scoped by blueprint_id

### With External Services
- **Firebase Auth**: User identity and session management (@angular/fire/auth)
- **Firebase Storage**: File uploads for blueprint documents (@angular/fire/storage)
- **Firestore Realtime**: Real-time updates for collaboration (onSnapshot)

## Testing

### Unit Tests
```typescript
describe('BlueprintListComponent', () => {
  it('should load blueprints on init', async () => {
    const component = new BlueprintListComponent();
    await component.ngOnInit();
    expect(component.blueprints().length).toBeGreaterThan(0);
  });
  
  it('should filter by status', () => {
    component.selectedStatus.set('active');
    const filtered = component.filteredBlueprints();
    expect(filtered.every(b => b.status === 'active')).toBe(true);
  });
});
```

### E2E Tests
```typescript
test('should create new blueprint', async ({ page }) => {
  await page.goto('/blueprint');
  await page.click('button:has-text("New Blueprint")');
  await page.fill('input[name="name"]', 'Test Project');
  await page.click('button:has-text("Save")');
  await expect(page.locator('text=Test Project')).toBeVisible();
});
```

## Troubleshooting

### Common Issues

**Issue**: Members not showing after adding  
**Solution**: Check Firestore Security Rules for `blueprint_members` collection

**Issue**: Can't edit blueprint even as owner  
**Solution**: Verify `canEditBlueprint()` function in firestore.rules includes owner check

**Issue**: Slug validation fails  
**Solution**: Ensure slug only contains lowercase letters, numbers, and hyphens

**Issue**: Module not appearing in detail view  
**Solution**: Check `enabled_modules` array includes module ID

## Best Practices

1. **Always check permissions** before showing UI controls
2. **Use soft delete** (set `deleted_at`) instead of hard delete
3. **Validate on both client and server** for security
4. **Log important actions** to audit_logs table
5. **Use transactions** for operations affecting multiple tables
6. **Cache permission checks** (5-minute TTL) for performance
7. **Follow naming conventions** for consistency
8. **Write tests** for critical business logic

## Related Documentation

- **[Root AGENTS.md](../../AGENTS.md)** - Project-wide context
- **[Blueprint Architecture](../../../docs/Blueprint_Architecture.md)** - Detailed design
- **[Permission System](../../../docs/guides/permission-system.md)** - Authorization guide
- **[Firestore Rules](../../../firestore.rules)** - Security rules
- **[Firebase Console](https://console.firebase.google.com)** - Database management

---

**Module Version**: 1.0.0  
**Last Updated**: 2025-12-09  
**Status**: Production Ready
