# GigHub Project Agent Guide

Welcome to the GigHub construction site progress tracking management system. This file provides context for AI coding agents to navigate and contribute to the project effectively.

## Project Overview

**GigHub** is an enterprise-level construction site management system built with modern web technologies:

- **Frontend**: Angular 20.3.x with Standalone Components & Signals
- **Admin Framework**: ng-alain 20.1.x (Delon components)
- **UI Library**: ng-zorro-antd 20.3.x (Ant Design for Angular)
- **Backend**: Firebase/Firestore with @angular/fire 20.0.1
- **Authentication**: Firebase Auth (@angular/fire/auth)
- **Database**: Firestore (@angular/fire/firestore)
- **Storage**: Firebase Storage (@angular/fire/storage)
- **Language**: TypeScript 5.9.x (strict mode)
- **Reactive**: RxJS 7.8.x
- **Package Manager**: Yarn 4.9.2

**Note**: Supabase (@supabase/supabase-js 2.86.x) is used only for statistics queries, not as the primary backend.

## Architecture

### Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Business Layer                        │
│  Tasks • Construction Diary • Quality Control • Finance  │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                   Container Layer                        │
│    Blueprint • Permissions • Events • Configurations     │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                  Foundation Layer                        │
│        Account • Auth • Organization • Teams             │
└─────────────────────────────────────────────────────────┘
```

### Directory Structure

```
src/app/
├── core/               # Core services, guards, interceptors
│   ├── services/       # Singleton services
│   ├── guards/         # Route guards
│   ├── errors/         # Custom error classes
│   └── startup/        # App initialization
├── routes/             # Feature modules (lazy-loaded)
│   ├── blueprint/      # Blueprint management (AGENTS.md)
│   ├── dashboard/      # Dashboard views
│   ├── passport/       # Auth flows
│   └── exception/      # Error pages
├── shared/             # Shared components & utilities (AGENTS.md)
│   ├── components/     # Reusable components
│   ├── services/       # Shared services
│   ├── pipes/          # Custom pipes
│   └── directives/     # Custom directives
└── layout/             # App layout components
    ├── basic/          # Basic layout
    └── passport/       # Auth layout
```

## Working with This Project

### Common Tasks

1. **Adding a new feature module**
   - Create under `src/app/routes/[module-name]/`
   - Include module-level `AGENTS.md` for context
   - Register in `src/app/routes/routes.ts`
   - Follow lazy-loading pattern

2. **Creating components**
   - Use standalone components (no NgModules)
   - Import from `SHARED_IMPORTS` for common modules
   - Use Signals for state management
   - Apply `OnPush` change detection

3. **Adding services**
   - Place in `src/app/core/services/` for global services
   - Place in `src/app/shared/services/` for shared utilities
   - Use `providedIn: 'root'` for singletons
   - Use `inject()` function for DI

4. **Database operations**
   - Use Firestore via @angular/fire
   - Use repository pattern for data access
   - Implement Firestore Security Rules
   - Follow naming: `[entity].repository.ts`
   - Place in `src/app/core/infra/repositories/`

### Code Standards

#### TypeScript
- Strict mode enabled
- No `any` types - use `unknown` with type guards
- Prefer interfaces over type aliases for objects
- Use JSDoc for public APIs

#### Angular Patterns
```typescript
// ✅ Good: Standalone component with Signals
import { Component, signal, computed } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [SHARED_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `...`
})
export class ExampleComponent {
  count = signal(0);
  doubled = computed(() => this.count() * 2);
}
```

#### Naming Conventions
- Components: `feature-name.component.ts`
- Services: `feature-name.service.ts`
- Guards: `feature-name.guard.ts`
- Models: `feature-name.model.ts`
- Use kebab-case for file names
- Use PascalCase for class names

### Permission System

The project uses a hierarchical permission model:

```
Blueprint (Container)
├── Owner (Full Control)
├── Maintainer (Manage Members + Settings)
├── Contributor (Edit Content)
└── Viewer (Read Only)
```

**Checking permissions:**
```typescript
// In components
const canEdit = await this.permissionService.canEdit(blueprintId);

// In guards
canActivate(): Observable<boolean> {
  return this.permissionService.hasRole(blueprintId, 'contributor');
}

// In Firestore Security Rules
// See firestore.rules in project root
```

## Shared Context

### State Management
- Use **Signals** for local component state
- Use **Services** for shared state across components
- Use **Firestore Snapshots** for real-time data sync
- Avoid complex state management libraries (no NgRx needed)

### HTTP & API
- Use **@angular/fire** services (Firestore, Auth, Storage)
- Follow repository pattern for data access
- Implement error handling in repositories
- Use RxJS operators for data transformation
- Use `collectionData()` and `docData()` from @angular/fire for observables

### Forms
- Use **Reactive Forms** (`FormGroup`, `FormControl`)
- Implement form validation with `Validators`
- Use ng-zorro form components for consistent UI
- Extract reusable form validators to shared services

### Styling
- Use **SCSS** for styles
- Follow **Ant Design** guidelines
- Prefer **ng-zorro components** over custom HTML
- Use **Tailwind** utility classes when appropriate
- Component-scoped styles by default

## Module-Specific Agents

Each major module has its own `AGENTS.md` with detailed context:

### Core Architecture
- **[App Module](src/app/AGENTS.md)** - Application bootstrap, Firebase integration, routing strategy
- **[Layout Module](src/app/layout/AGENTS.md)** - Basic/Blank/Passport layouts, responsive design
- **[Core Services](src/app/core/AGENTS.md)** - Shared services, guards, repositories
- **[Shared Components](src/app/shared/AGENTS.md)** - Reusable UI components, pipes, directives

### Foundation Layer (Account & Identity)
- **[Passport Module](src/app/routes/passport/AGENTS.md)** - Authentication (Firebase Auth, Login, Register)
- **[User Module](src/app/routes/user/AGENTS.md)** - User profile, settings, preferences
- **[Organization Module](src/app/routes/organization/AGENTS.md)** - Multi-tenant organizations
- **[Team Module](src/app/routes/team/AGENTS.md)** - Team collaboration within organizations

### Container Layer (Project Management)
- **[Blueprint Module](src/app/routes/blueprint/AGENTS.md)** - Core container for projects, permissions, audit

### Business Layer (Feature Modules)
- **[Dashboard Module](src/app/routes/dashboard/AGENTS.md)** - Workplace, analysis, monitoring dashboards
- **[Exception Module](src/app/routes/exception/AGENTS.md)** - Error pages (403/404/500), error handling

### Module Navigation
- **[Routes Overview](src/app/routes/AGENTS.md)** - Routing configuration and lazy loading

## Adding New Modules

To add a new business module to GigHub:

### 1. Plan Module Structure

```
src/app/routes/[module-name]/
├── AGENTS.md                    # Module-specific agent context
├── [module]-list.component.ts   # List/index view
├── [module]-detail.component.ts # Detail view
├── [module]-modal.component.ts  # Create/edit modal
└── components/                  # Module-specific components
```

### 2. Define Data Model

```typescript
// src/app/core/types/[module].types.ts
export interface ModuleEntity {
  id: string;
  blueprint_id: string;
  name: string;
  // ... other fields
  created_at: string;
  updated_at: string;
  deleted_at?: string; // Soft delete
}
```

### 3. Create Repository

```typescript
// src/app/core/infra/repositories/[module]/[module].repository.ts
import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, query, where } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ModuleRepository {
  private firestore = inject(Firestore);
  
  list(blueprintId: string): Observable<ModuleEntity[]> {
    const collectionRef = collection(this.firestore, 'module_table');
    const q = query(
      collectionRef,
      where('blueprint_id', '==', blueprintId),
      where('deleted_at', '==', null)
    );
    
    return collectionData(q, { idField: 'id' }) as Observable<ModuleEntity[]>;
  }
}
```

### 4. Implement Firestore Security Rules

```javascript
// In firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /module_table/{moduleId} {
      allow read: if canReadBlueprint(resource.data.blueprint_id);
      allow write: if canEditBlueprint(resource.data.blueprint_id);
    }
    
    function canReadBlueprint(blueprintId) {
      let blueprint = get(/databases/$(database)/documents/blueprints/$(blueprintId));
      return request.auth != null && (
        blueprint.data.owner_id == request.auth.uid ||
        exists(/databases/$(database)/documents/blueprint_members/$(blueprintId + '_' + request.auth.uid))
      );
    }
  }
}
```

### 5. Create UI Components

Use ng-alain's ST table for lists:
```typescript
columns: STColumn[] = [
  { title: 'Name', index: 'name' },
  { title: 'Status', index: 'status', type: 'badge' },
  { title: 'Created', index: 'created_at', type: 'date' },
  {
    title: 'Actions',
    buttons: [
      { text: 'Edit', click: (item) => this.edit(item) },
      { text: 'Delete', click: (item) => this.delete(item) }
    ]
  }
];
```

### 6. Register Routes

```typescript
// src/app/routes/routes.ts
{
  path: 'module-name',
  loadChildren: () => import('./module-name/routes').then(m => m.routes)
}
```

### 7. Document in AGENTS.md

Create `src/app/routes/[module-name]/AGENTS.md` documenting:
- Module purpose
- Data models
- Key components
- Integration points
- Common operations

## Testing

- **Unit Tests**: Place next to source files (`.spec.ts`)
- **E2E Tests**: Place in `/e2e/` directory
- Run tests: `yarn test`
- Run E2E: `yarn e2e`

## Build & Deploy

```bash
# Development
yarn start                  # Dev server on http://localhost:4200

# Production build
yarn build                  # Output to /dist

# Lint & format
yarn lint                   # ESLint
yarn format                 # Prettier
```

## Getting Help

1. **Check module-specific AGENTS.md** for detailed context
2. **Review existing implementations** in similar modules
3. **Consult architecture docs** in `/docs/architecture/`
4. **Check API references** in `/docs/reference/api/`
5. **Review permission system** in `/docs/guides/permission-system.md`

## Enterprise Development Standards

### 奧卡姆剃刀原則 (Occam's Razor Principle)

**適用於所有模組的簡化準則**:

1. **最小化層級** - 僅需三層 (UI → Service → Repository)
2. **避免抽象過度** - 直接注入服務，不建立不必要的 Facade
3. **單一數據流** - 使用 Signals 而非複雜狀態管理
4. **組合優於繼承** - 使用服務組合而非深層繼承樹

### 共享上下文原則 (Shared Context Principles)

所有模組必須遵循統一的上下文傳遞模式:

```
User Context (Auth)
    ↓
Organization Context (Account)
    ↓
Blueprint Context (Container)
    ↓
Module Context (Business)
```

**實作規範**:
- 使用 `inject()` 注入上層上下文服務
- 使用 `signal()` 保存當前上下文狀態
- 使用 `computed()` 計算衍生狀態
- 上下文變更自動傳播到子元件

### 事件驅動架構 (Event-Driven Architecture)

#### 統一事件匯流排

所有模組事件透過 `BlueprintEventBus` 集中管理:

```typescript
// 發送事件
eventBus.emit({
  type: 'module.action',
  blueprintId: 'xxx',
  timestamp: Date.now(),
  actor: userId,
  data: payload
});

// 訂閱事件
eventBus.events$
  .pipe(
    filter(e => e.type === 'module.action'),
    takeUntilDestroyed()
  )
  .subscribe(event => {
    // Handle event
  });
```

**事件命名規範**: `[module].[action]` (例如: `task.created`, `diary.updated`)

### 錯誤處理標準 (Error Handling Standards)

#### 四層錯誤防護

1. **UI 層**: Error Boundary Component 捕獲顯示錯誤
2. **Service 層**: Try-catch 包裝，拋出類型化錯誤
3. **Repository 層**: Firestore 錯誤轉換為領域錯誤
4. **Global 層**: GlobalErrorHandler 記錄所有未捕獲錯誤

**錯誤分級**:
- `Critical`: 系統級錯誤，需立即處理
- `High`: 功能無法使用，需修復
- `Medium`: 部分功能受影響，可降級使用
- `Low`: 不影響核心功能，可忽略

### 生命週期管理標準 (Lifecycle Management Standards)

#### 元件生命週期最佳實踐

```typescript
export class StandardComponent implements OnInit, OnDestroy {
  // 1. 依賴注入 (Constructor)
  private service = inject(MyService);
  
  // 2. 狀態定義 (Signals)
  data = signal<Data[]>([]);
  loading = signal(false);
  
  // 3. 計算狀態 (Computed)
  filteredData = computed(() => this.data().filter(d => !d.deleted));
  
  // 4. 初始化 (OnInit)
  ngOnInit(): void {
    this.loadData();
    this.setupSubscriptions();
  }
  
  // 5. 訂閱管理 (takeUntilDestroyed)
  private setupSubscriptions(): void {
    this.service.updates$
      .pipe(takeUntilDestroyed())
      .subscribe(update => this.handleUpdate(update));
  }
  
  // 6. 清理 (OnDestroy) - 通常不需要，因為使用 takeUntilDestroyed
  ngOnDestroy(): void {
    // 僅在需要手動清理時使用
  }
}
```

**禁止事項**:
- ❌ 在 constructor 中執行業務邏輯
- ❌ 手動管理 subscriptions (使用 takeUntilDestroyed)
- ❌ 在 ngOnDestroy 中執行非同步操作
- ❌ 忘記清理定時器與事件監聽器

### 模塊擴展規範 (Module Extension Standards)

#### 標準化擴展流程

新增任何業務模塊必須遵循以下步驟:

1. **註冊階段**:
   - 在 `module-registry.ts` 註冊模塊定義
   - 定義模塊 ID、名稱、圖示、路由
   - 聲明依賴的其他模塊

2. **實作階段**:
   - 建立模塊目錄結構
   - 實作 Repository → Service → Component
   - 整合 Event Bus 發送領域事件
   - 實作 Error Boundary

3. **整合階段**:
   - 註冊路由與守衛
   - 加入 Blueprint 模塊列表
   - 更新 Firestore Security Rules
   - 建立模塊專屬 AGENTS.md

4. **測試階段**:
   - 單元測試 (Service, Repository)
   - 元件測試 (UI Components)
   - 整合測試 (與 Blueprint 整合)
   - E2E 測試 (完整使用者流程)

**模塊清單範本**: 參考 `src/app/routes/blueprint/AGENTS.md` 的「系統化模塊擴展」章節

### 代碼審查檢查點 (Code Review Checklist)

在提交 PR 前，確認以下項目:

#### 架構檢查
- [ ] 遵循三層架構 (UI → Service → Repository)
- [ ] 使用 Signals 進行狀態管理
- [ ] 使用 Standalone Components
- [ ] 正確注入依賴 (使用 `inject()`)

#### 上下文檢查
- [ ] 正確傳遞 Blueprint Context
- [ ] 使用 computed() 計算衍生狀態
- [ ] 上下文清理正確實作

#### 事件檢查
- [ ] 所有領域事件透過 EventBus 發送
- [ ] 事件命名遵循規範 (`[module].[action]`)
- [ ] 事件訂閱使用 takeUntilDestroyed()

#### 錯誤處理檢查
- [ ] Service 方法包含 try-catch
- [ ] 拋出類型化錯誤 (繼承 BlueprintError)
- [ ] UI 使用 Error Boundary Component
- [ ] 錯誤分級正確設定

#### 生命週期檢查
- [ ] 不在 constructor 執行業務邏輯
- [ ] 使用 takeUntilDestroyed() 管理訂閱
- [ ] 手動資源清理在 ngOnDestroy

#### 文檔檢查
- [ ] 更新或建立模塊 AGENTS.md
- [ ] 程式碼包含 JSDoc 註解
- [ ] 複雜邏輯有文字說明

#### 測試檢查
- [ ] 單元測試覆蓋率 > 80%
- [ ] 關鍵業務邏輯有測試
- [ ] E2E 測試涵蓋主要流程

### AI 開發指引 (AI Development Guidelines)

**給 AI 代理的明確指示**:

#### 禁止行為
1. ❌ 不要建立 NgModule (使用 Standalone Components)
2. ❌ 不要使用 NgRx/Redux (使用 Signals)
3. ❌ 不要建立 Facade 層 (直接使用 Service)
4. ❌ 不要手動管理訂閱 (使用 takeUntilDestroyed)
5. ❌ 不要使用 any 類型 (使用 unknown + type guards)
6. ❌ 不要忽略錯誤處理 (必須 try-catch)
7. ❌ 不要直接操作 Firestore (使用 Repository)
8. ❌ 不要建立 SQL/RLS (使用 Firestore Security Rules)

#### 必須行為
1. ✅ 必須使用 Signals 管理狀態
2. ✅ 必須使用 inject() 注入依賴
3. ✅ 必須遵循三層架構
4. ✅ 必須透過 EventBus 發送事件
5. ✅ 必須實作 Error Boundary
6. ✅ 必須建立 AGENTS.md 文檔
7. ✅ 必須撰寫單元測試
8. ✅ 必須實作 Firestore Security Rules

#### 決策樹

```
需要狀態管理？
├─ 是 → 使用 signal()
└─ 否 → 不需要狀態

需要衍生狀態？
├─ 是 → 使用 computed()
└─ 否 → 直接使用原始 signal

需要訂閱？
├─ 是 → 使用 takeUntilDestroyed()
└─ 否 → 不訂閱

需要新模塊？
├─ 是 → 遵循「模塊擴展規範」
└─ 否 → 擴展現有模塊

遇到錯誤？
├─ 可恢復 → 拋出 recoverable=true 錯誤
└─ 不可恢復 → 拋出 recoverable=false 錯誤
```

## Key Principles

1. **Occam's Razor**: Keep implementations simple and focused
2. **Type Safety**: Leverage TypeScript's strict mode
3. **Modularity**: Clear boundaries between modules
4. **Security**: Always implement Firestore Security Rules
5. **Documentation**: Update AGENTS.md when adding features
6. **Testing**: Write tests for critical business logic
7. **Accessibility**: Follow WCAG 2.1 guidelines
8. **Performance**: Use OnPush change detection and lazy loading

## Resources

- **Project Docs**: `/docs/`
- **Architecture**: `/docs/architecture/`
- **Blueprint Design**: `/BLUEPRINT_MODULE_DOCUMENTATION.md`
- **GitHub Agents**: `/.github/agents/`
- **Copilot Setup**: `/.github/COPILOT_SETUP.md`

---

**Version**: 1.0.0  
**Last Updated**: 2025-12-09  
**Maintained by**: GigHub Development Team
