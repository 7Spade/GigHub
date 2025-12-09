# Blueprint 邏輯容器設計文件 (Blueprint Logical Container Design)

## 文件版本 (Document Version)
- **版本 (Version)**: 2.0
- **最後更新 (Last Updated)**: 2025-12-09
- **狀態 (Status)**: 優化版本 - Firestore 適配

## 概述 (Overview)

Blueprint（藍圖）是 GigHub 系統中的核心邏輯容器，用於組織和管理工地施工進度追蹤的各個模組。Blueprint 提供了一個共享上下文環境，讓其中的模組可以協同工作並共享資料。

Blueprint is the core logical container in the GigHub system, used to organize and manage various modules for construction site progress tracking. Blueprint provides a shared context environment where modules can work together and share data.

### 設計目標 (Design Goals)
1. **模組化 (Modularity)**: 清晰的模組邊界與職責劃分
2. **可擴展性 (Extensibility)**: 易於新增業務模組
3. **多租戶 (Multi-tenancy)**: 支援用戶與組織級別的隔離
4. **安全性 (Security)**: 完整的權限控制與資料隔離
5. **效能 (Performance)**: 優化的資料存取模式

## 架構定位 (Architectural Position)

### 三層架構中的位置 (Position in Three-Layer Architecture)

```
┌─────────────────────────────────────────────────────────────┐
│                     Business Layer (業務層)                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Blueprint 邏輯容器                          │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │  │
│  │  │ 任務模組  │  │ 日誌模組  │  │ 品質模組  │          │  │
│  │  └──────────┘  └──────────┘  └──────────┘          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                   Container Layer (容器層)                   │
│  - 權限控制 (ACL)                                            │
│  - 事件總線 (Event Bus)                                     │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                  Foundation Layer (基礎層)                   │
│  - 帳戶體系 (Account System)                                │
│  - 組織管理 (Organization Management)                       │
└─────────────────────────────────────────────────────────────┘
```

## 核心特性 (Core Features)

### 1. 擁有者模型 (Ownership Model)

Blueprint 可以被兩種實體擁有：
- **用戶 (User)**: 個人藍圖，用於個人工地專案管理
- **組織 (Organization)**: 組織藍圖，用於組織級別的專案管理

**重要**: 團隊 (Team) 和機器人 (Bot) **無法**建立 Blueprint，只能訪問用戶或組織建立的 Blueprint。

```typescript
interface Blueprint {
  id: string;
  name: string;
  description?: string;
  
  // 擁有者資訊 (Owner Information)
  owner_type: 'user' | 'organization';  // 擁有者類型
  owner_id: string;                      // 用戶 ID 或組織 ID
  
  // 元數據 (Metadata)
  created_at: string;
  updated_at: string;
  created_by: string;                    // 建立者用戶 ID
  
  // 狀態 (Status)
  status: 'draft' | 'active' | 'archived';
  
  // 配置 (Configuration)
  settings?: {
    modules_enabled: string[];           // 啟用的模組列表
    shared_context: Record<string, any>; // 共享上下文資料
  };
}
```

### 2. 模組系統 (Module System)

Blueprint 內部包含多個業務模組，這些模組共享同一個 Blueprint 上下文：

#### 基礎模組 (Basic Modules)

1. **任務模組 (Task Module)**
   - 任務建立與分配
   - 任務狀態追蹤
   - 任務依賴管理

2. **日誌模組 (Log Module)**
   - 施工日誌記錄
   - 進度日誌
   - 事件日誌

3. **品質驗收模組 (Quality Acceptance Module)**
   - 品質檢查清單
   - 驗收標準
   - 驗收記錄

#### 模組共享上下文 (Shared Context)

```typescript
interface BlueprintContext {
  blueprint_id: string;
  owner_type: 'user' | 'organization';
  owner_id: string;
  
  // 共享資料 (Shared Data)
  project_info?: {
    site_name: string;
    site_address: string;
    start_date: string;
    end_date: string;
  };
  
  // 權限資訊 (Permission Info)
  permissions: {
    user_id: string;
    role: string;
    actions: string[];
  }[];
  
  // 設定 (Settings)
  settings: Record<string, any>;
}
```

### 3. 權限模型 (Permission Model)

Blueprint 使用基於角色的訪問控制 (RBAC):

```typescript
enum BlueprintRole {
  OWNER = 'owner',       // 擁有者 - 完全控制權
  ADMIN = 'admin',       // 管理員 - 管理權限（不含刪除）
  EDITOR = 'editor',     // 編輯者 - 編輯內容
  VIEWER = 'viewer'      // 檢視者 - 唯讀訪問
}

interface BlueprintPermission {
  blueprint_id: string;
  user_id: string;
  role: BlueprintRole;
  granted_at: string;
  granted_by: string;
}
```

### 4. 訪問控制 (Access Control)

#### 用戶 Blueprint 訪問規則
- 擁有者: 完全控制權
- 可以邀請其他用戶協作（分配角色）
- 可以轉移擁有權給其他用戶

#### 組織 Blueprint 訪問規則
- 組織擁有者/管理員: 完全控制權
- 組織成員: 根據分配的角色訪問
- 團隊成員: 根據團隊角色訪問組織的 Blueprint
- 可以設定團隊級別的權限

## 資料模型 (Data Model)

### Firestore 集合結構 (Firestore Collection Structure)

```
GigHub/
├── blueprints/                         # 藍圖集合
│   ├── {blueprintId}/                  # 藍圖文件
│   │   ├── name: string
│   │   ├── slug: string
│   │   ├── description: string
│   │   ├── coverUrl: string
│   │   ├── ownerId: string             # 擁有者 Account ID
│   │   ├── ownerType: 'user'|'organization'
│   │   ├── isPublic: boolean
│   │   ├── status: 'draft'|'active'|'archived'
│   │   ├── enabledModules: string[]    # ['tasks', 'logs', 'quality']
│   │   ├── metadata: object
│   │   ├── createdBy: string           # 建立者 Account ID
│   │   ├── createdAt: timestamp
│   │   ├── updatedAt: timestamp
│   │   ├── deletedAt: timestamp?
│   │   │
│   │   ├── members/                    # 子集合：成員
│   │   │   ├── {accountId}/
│   │   │   │   ├── accountId: string
│   │   │   │   ├── role: 'viewer'|'contributor'|'maintainer'
│   │   │   │   ├── businessRole: 'project_manager'|'site_supervisor'|...
│   │   │   │   ├── isExternal: boolean
│   │   │   │   ├── grantedBy: string
│   │   │   │   ├── grantedAt: timestamp
│   │   │   │   ├── permissions: object # 擴展權限
│   │   │   │   └── metadata: object
│   │   │
│   │   ├── teamRoles/                  # 子集合：團隊角色
│   │   │   ├── {teamId}/
│   │   │   │   ├── teamId: string
│   │   │   │   ├── access: 'read'|'write'|'admin'
│   │   │   │   ├── grantedBy: string
│   │   │   │   ├── grantedAt: timestamp
│   │   │   │   └── metadata: object
│   │   │
│   │   ├── tasks/                      # 子集合：任務（範例模組）
│   │   │   ├── {taskId}/
│   │   │   │   ├── title: string
│   │   │   │   ├── description: string
│   │   │   │   ├── status: string
│   │   │   │   ├── assignedTo: string
│   │   │   │   ├── createdAt: timestamp
│   │   │   │   └── updatedAt: timestamp
│   │   │
│   │   ├── logs/                       # 子集合：日誌
│   │   │   └── ...
│   │   │
│   │   └── quality/                    # 子集合：品質驗收
│   │       └── ...
│
├── accounts/                           # 帳戶集合（參考）
│   └── {accountId}/
│
└── organizations/                      # 組織集合（參考）
    └── {organizationId}/
```

### TypeScript 型別定義 (TypeScript Type Definitions)

```typescript
// ============================================================================
// 核心型別定義 (Core Type Definitions)
// File: src/app/core/types/blueprint/blueprint.types.ts
// ============================================================================

/**
 * 藍圖角色列舉
 * Blueprint role enumeration
 */
export enum BlueprintRole {
  VIEWER = 'viewer',           // 檢視者 - 唯讀訪問
  CONTRIBUTOR = 'contributor', // 貢獻者 - 可編輯內容
  MAINTAINER = 'maintainer'    // 維護者 - 完全控制（除刪除）
}

/**
 * 業務角色列舉
 * Business role enumeration
 */
export enum BlueprintBusinessRole {
  PROJECT_MANAGER = 'project_manager',     // 專案經理
  SITE_SUPERVISOR = 'site_supervisor',     // 工地主任
  ENGINEER = 'engineer',                   // 工程師
  QUALITY_INSPECTOR = 'quality_inspector', // 品檢員
  ARCHITECT = 'architect',                 // 建築師
  CONTRACTOR = 'contractor',               // 承包商
  CLIENT = 'client'                        // 業主
}

/**
 * 模組類型列舉
 * Module type enumeration
 */
export enum ModuleType {
  TASKS = 'tasks',           // 任務管理
  LOGS = 'logs',             // 施工日誌
  QUALITY = 'quality',       // 品質驗收
  DIARY = 'diary',           // 工作日記
  DASHBOARD = 'dashboard',   // 儀表板
  FILES = 'files',           // 檔案管理
  TODOS = 'todos',           // 待辦事項
  CHECKLISTS = 'checklists', // 檢查清單
  ISSUES = 'issues',         // 問題追蹤
  BOT_WORKFLOW = 'bot_workflow' // 機器人工作流
}

/**
 * 團隊訪問權限
 * Team access level
 */
export enum BlueprintTeamAccess {
  READ = 'read',   // 唯讀
  WRITE = 'write', // 讀寫
  ADMIN = 'admin'  // 管理
}

/**
 * 帳戶狀態
 * Account status
 */
export enum AccountStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  DELETED = 'deleted'
}

/**
 * 藍圖介面
 * Blueprint interface
 */
export interface Blueprint {
  id: string;
  name: string;
  slug: string;
  description?: string;
  coverUrl?: string;
  
  // 擁有者資訊
  ownerId: string;
  ownerType: 'user' | 'organization';
  
  // 狀態與可見性
  isPublic: boolean;
  status: 'draft' | 'active' | 'archived';
  
  // 模組配置
  enabledModules: ModuleType[];
  
  // 元數據
  metadata?: Record<string, any>;
  
  // 審計欄位
  createdBy: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string | null;
}

/**
 * 藍圖成員介面
 * Blueprint member interface
 */
export interface BlueprintMember {
  id: string;
  blueprintId: string;
  accountId: string;
  
  // 角色
  role: BlueprintRole;
  businessRole?: BlueprintBusinessRole;
  
  // 狀態
  isExternal: boolean;
  
  // 擴展權限（自訂權限）
  permissions?: {
    canManageMembers?: boolean;
    canManageSettings?: boolean;
    canExportData?: boolean;
    canDeleteBlueprint?: boolean;
    customPermissions?: string[];
  };
  
  // 元數據
  metadata?: Record<string, any>;
  
  // 審計欄位
  grantedBy: string;
  grantedAt: Date | string;
}

/**
 * 藍圖團隊角色介面
 * Blueprint team role interface
 */
export interface BlueprintTeamRole {
  id: string;
  blueprintId: string;
  teamId: string;
  access: BlueprintTeamAccess;
  
  // 元數據
  metadata?: Record<string, any>;
  
  // 審計欄位
  grantedBy: string;
  grantedAt: Date | string;
}

/**
 * 藍圖查詢選項
 * Blueprint query options
 */
export interface BlueprintQueryOptions {
  ownerId?: string;
  ownerType?: 'user' | 'organization';
  status?: 'draft' | 'active' | 'archived';
  isPublic?: boolean;
  includeDeleted?: boolean;
}
```

### Firestore 安全規則 (Firestore Security Rules)

```javascript
// ============================================================================
// Firestore Security Rules for Blueprints
// File: firestore.rules (部分)
// ============================================================================

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ========================================================================
    // 輔助函數 (Helper Functions)
    // ========================================================================
    
    /**
     * 檢查使用者是否已驗證
     */
    function isAuthenticated() {
      return request.auth != null;
    }
    
    /**
     * 獲取當前用戶的 Account ID
     */
    function getCurrentAccountId() {
      // 假設 accounts 集合中有 authUserId 欄位映射到 auth.uid
      return get(/databases/$(database)/documents/accounts/$(request.auth.uid)).data.id;
    }
    
    /**
     * 檢查用戶是否為藍圖擁有者
     */
    function isBlueprintOwner(blueprintData) {
      let accountId = getCurrentAccountId();
      return blueprintData.ownerType == 'user' 
        && blueprintData.ownerId == accountId;
    }
    
    /**
     * 檢查用戶是否為組織管理員
     */
    function isOrganizationAdmin(orgId) {
      let accountId = getCurrentAccountId();
      let orgMember = get(/databases/$(database)/documents/organizations/$(orgId)/members/$(accountId));
      return orgMember.data.role in ['owner', 'admin'];
    }
    
    /**
     * 檢查用戶是否有藍圖訪問權限
     */
    function hasBlueprintAccess(blueprintId) {
      let accountId = getCurrentAccountId();
      let blueprint = get(/databases/$(database)/documents/blueprints/$(blueprintId));
      
      // 情況 1: 個人藍圖擁有者
      if (blueprint.data.ownerType == 'user' && blueprint.data.ownerId == accountId) {
        return true;
      }
      
      // 情況 2: 組織藍圖 - 組織成員
      if (blueprint.data.ownerType == 'organization') {
        return exists(/databases/$(database)/documents/organizations/$(blueprint.data.ownerId)/members/$(accountId));
      }
      
      // 情況 3: 明確的成員權限
      return exists(/databases/$(database)/documents/blueprints/$(blueprintId)/members/$(accountId));
    }
    
    /**
     * 檢查用戶是否有藍圖編輯權限
     */
    function canEditBlueprint(blueprintId) {
      let accountId = getCurrentAccountId();
      let blueprint = get(/databases/$(database)/documents/blueprints/$(blueprintId));
      
      // 擁有者可以編輯
      if (isBlueprintOwner(blueprint.data)) {
        return true;
      }
      
      // 組織管理員可以編輯
      if (blueprint.data.ownerType == 'organization' 
          && isOrganizationAdmin(blueprint.data.ownerId)) {
        return true;
      }
      
      // 成員角色為 maintainer 或 contributor
      let member = get(/databases/$(database)/documents/blueprints/$(blueprintId)/members/$(accountId));
      return member.data.role in ['maintainer', 'contributor'];
    }
    
    // ========================================================================
    // Blueprints 集合規則
    // ========================================================================
    
    match /blueprints/{blueprintId} {
      
      // 讀取權限：公開藍圖或有訪問權限的用戶
      allow read: if isAuthenticated() 
        && (resource.data.isPublic == true || hasBlueprintAccess(blueprintId));
      
      // 建立權限：已驗證用戶可以為自己建立藍圖
      allow create: if isAuthenticated()
        && (
          // 個人藍圖
          (request.resource.data.ownerType == 'user' 
           && request.resource.data.ownerId == getCurrentAccountId())
          ||
          // 組織藍圖（必須是組織管理員）
          (request.resource.data.ownerType == 'organization'
           && isOrganizationAdmin(request.resource.data.ownerId))
        )
        && request.resource.data.createdBy == getCurrentAccountId()
        && request.resource.data.createdAt == request.time
        && request.resource.data.updatedAt == request.time;
      
      // 更新權限：擁有者或有編輯權限的成員
      allow update: if isAuthenticated()
        && canEditBlueprint(blueprintId)
        && request.resource.data.updatedAt == request.time
        // 防止修改關鍵欄位
        && request.resource.data.ownerId == resource.data.ownerId
        && request.resource.data.ownerType == resource.data.ownerType
        && request.resource.data.createdBy == resource.data.createdBy
        && request.resource.data.createdAt == resource.data.createdAt;
      
      // 刪除權限：僅擁有者（軟刪除通過 update 實現）
      allow delete: if false; // 禁止硬刪除，只允許軟刪除
      
      // ======================================================================
      // Members 子集合規則
      // ======================================================================
      
      match /members/{accountId} {
        // 讀取：有藍圖訪問權限的用戶
        allow read: if isAuthenticated() && hasBlueprintAccess(blueprintId);
        
        // 建立/更新：擁有者或 maintainer
        allow create, update: if isAuthenticated()
          && canEditBlueprint(blueprintId);
        
        // 刪除：擁有者或 maintainer
        allow delete: if isAuthenticated()
          && canEditBlueprint(blueprintId);
      }
      
      // ======================================================================
      // TeamRoles 子集合規則
      // ======================================================================
      
      match /teamRoles/{teamId} {
        // 讀取：有藍圖訪問權限的用戶
        allow read: if isAuthenticated() && hasBlueprintAccess(blueprintId);
        
        // 建立/更新/刪除：擁有者或組織管理員
        allow create, update, delete: if isAuthenticated()
          && canEditBlueprint(blueprintId);
      }
      
      // ======================================================================
      // Tasks 子集合規則（範例模組）
      // ======================================================================
      
      match /tasks/{taskId} {
        // 讀取：有藍圖訪問權限的用戶
        allow read: if isAuthenticated() && hasBlueprintAccess(blueprintId);
        
        // 建立/更新：有編輯權限的用戶
        allow create, update: if isAuthenticated() 
          && canEditBlueprint(blueprintId);
        
        // 刪除：有編輯權限的用戶
        allow delete: if isAuthenticated()
          && canEditBlueprint(blueprintId);
      }
      
      // 其他子集合（logs, quality 等）規則類似
    }
  }
}
```

## 實作指引 (Implementation Guide)

### 專案檔案架構 (Project File Structure)

```
src/app/
├── core/
│   ├── types/
│   │   └── blueprint/
│   │       ├── index.ts                          # 型別匯出入口
│   │       ├── blueprint.types.ts                # 核心型別定義
│   │       ├── blueprint-member.types.ts         # 成員型別
│   │       └── blueprint-team-role.types.ts      # 團隊角色型別
│   │
│   ├── services/
│   │   ├── firebase.service.ts                   # Firebase 核心服務
│   │   └── auth.service.ts                       # 認證服務
│   │
│   └── facades/
│       └── blueprint/
│           ├── index.ts                          # Facade 匯出入口
│           ├── blueprint.facade.ts               # Blueprint Facade
│           └── base-crud.facade.ts               # 基礎 CRUD Facade
│
├── shared/
│   ├── models/
│   │   └── blueprint/
│   │       ├── index.ts                          # 業務模型匯出
│   │       ├── blueprint.models.ts               # Blueprint 業務模型
│   │       ├── blueprint-request.models.ts       # 請求模型
│   │       └── blueprint-response.models.ts      # 回應模型
│   │
│   ├── services/
│   │   └── blueprint/
│   │       ├── index.ts                          # 服務匯出入口
│   │       ├── blueprint.service.ts              # Blueprint 服務
│   │       ├── blueprint-member.service.ts       # 成員管理服務
│   │       └── blueprint-team-role.service.ts    # 團隊角色服務
│   │
│   ├── repositories/
│   │   └── blueprint/
│   │       ├── index.ts                          # Repository 匯出
│   │       ├── blueprint.repository.ts           # Blueprint Repository
│   │       ├── blueprint-member.repository.ts    # 成員 Repository
│   │       └── blueprint-team-role.repository.ts # 團隊角色 Repository
│   │
│   └── components/
│       └── blueprint/
│           ├── blueprint-selector/               # 藍圖選擇器元件
│           │   ├── blueprint-selector.component.ts
│           │   ├── blueprint-selector.component.html
│           │   └── blueprint-selector.component.scss
│           │
│           └── blueprint-member-list/            # 成員列表元件
│               ├── blueprint-member-list.component.ts
│               ├── blueprint-member-list.component.html
│               └── blueprint-member-list.component.scss
│
└── routes/
    └── blueprint/
        ├── routes.ts                             # 路由配置
        ├── list/                                 # 藍圖列表頁
        │   ├── list.component.ts
        │   ├── list.component.html
        │   └── list.component.scss
        │
        ├── create/                               # 建立藍圖頁/對話框
        │   ├── create.component.ts
        │   ├── create.component.html
        │   └── create.component.scss
        │
        ├── detail/                               # 藍圖詳情頁
        │   ├── detail.component.ts
        │   ├── detail.component.html
        │   └── detail.component.scss
        │
        └── members/                              # 成員管理頁
            ├── members.component.ts
            ├── members.component.html
            └── members.component.scss
```

### 命名規範 (Naming Conventions)

#### 檔案命名 (File Naming)
```typescript
// 1. 元件檔案 - kebab-case
blueprint-selector.component.ts
blueprint-member-list.component.ts
create-blueprint-dialog.component.ts

// 2. 服務檔案 - kebab-case
blueprint.service.ts
blueprint-member.service.ts
workspace-context.service.ts

// 3. Repository 檔案 - kebab-case
blueprint.repository.ts
blueprint-member.repository.ts

// 4. Facade 檔案 - kebab-case
blueprint.facade.ts
base-crud.facade.ts

// 5. 型別檔案 - kebab-case
blueprint.types.ts
blueprint-member.types.ts

// 6. 模型檔案 - kebab-case
blueprint.models.ts
blueprint-request.models.ts
```

#### 類別命名 (Class Naming)
```typescript
// 1. 元件類別 - PascalCase + Component 後綴
export class BlueprintSelectorComponent {}
export class BlueprintMemberListComponent {}
export class CreateBlueprintDialogComponent {}

// 2. 服務類別 - PascalCase + Service 後綴
export class BlueprintService {}
export class BlueprintMemberService {}
export class WorkspaceContextService {}

// 3. Repository 類別 - PascalCase + Repository 後綴
export class BlueprintRepository {}
export class BlueprintMemberRepository {}

// 4. Facade 類別 - PascalCase + Facade 後綴
export class BlueprintFacade {}
export class BaseCrudFacade {}

// 5. 介面 - PascalCase（無 I 前綴）
export interface Blueprint {}
export interface BlueprintMember {}
export interface CreateBlueprintRequest {}

// 6. 列舉 - PascalCase
export enum BlueprintRole {}
export enum ModuleType {}

// 7. 型別別名 - PascalCase
export type BlueprintId = string;
export type BlueprintModel = Blueprint;
```

#### 變數與方法命名 (Variable and Method Naming)
```typescript
// 1. 變數 - camelCase
const blueprintId = 'xxx';
const currentUser = user;
const enabledModules = ['tasks'];

// 2. 常數 - UPPER_SNAKE_CASE
const DEFAULT_PAGE_SIZE = 10;
const MAX_MEMBERS_PER_BLUEPRINT = 100;
const BLUEPRINT_COLLECTION = 'blueprints';

// 3. 私有屬性 - camelCase（可選 _ 前綴）
private blueprintService: BlueprintService;
private _currentBlueprint: Blueprint | null;

// 4. Signal 變數 - camelCase
blueprints = signal<Blueprint[]>([]);
loading = signal(false);
currentBlueprint = signal<Blueprint | null>(null);

// 5. Observable 變數 - camelCase + $ 後綴
blueprints$ = this.blueprintService.blueprints$;
loading$ = this.loadingSubject.asObservable();

// 6. 方法 - camelCase + 動詞開頭
async createBlueprint(request: CreateBlueprintRequest): Promise<Blueprint> {}
async updateBlueprint(id: string, updates: Partial<Blueprint>): Promise<Blueprint> {}
async deleteBlueprint(id: string): Promise<void> {}
async findById(id: string): Promise<Blueprint | null> {}
async findByOwner(ownerId: string): Promise<Blueprint[]> {}

// 7. 布林方法 - is/has/can + camelCase
canEditBlueprint(blueprintId: string): boolean {}
hasPermission(permission: string): boolean {}
isOwner(blueprint: Blueprint): boolean {}

// 8. 事件處理方法 - on + PascalCase
onBlueprintSelected(blueprint: Blueprint): void {}
onMemberAdded(member: BlueprintMember): void {}
onDeleteConfirmed(): void {}
```

### 1. Repository 層實作 (Repository Layer Implementation)

#### Blueprint Repository
```typescript
// ============================================================================
// File: src/app/shared/repositories/blueprint/blueprint.repository.ts
// ============================================================================

import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  DocumentReference,
  CollectionReference
} from '@angular/fire/firestore';
import { Observable, from, map, catchError, of } from 'rxjs';

import { Blueprint, BlueprintQueryOptions } from '@core/types/blueprint';

/**
 * Blueprint Repository
 * 
 * 藍圖資料存取層 - 處理 Firestore 的 CRUD 操作
 * Blueprint data access layer - Handles Firestore CRUD operations
 * 
 * 職責 (Responsibilities):
 * - 封裝所有 Firestore 資料庫操作
 * - 提供型別安全的資料存取方法
 * - 處理資料轉換（Firestore ↔ TypeScript）
 * - 統一錯誤處理
 */
@Injectable({ providedIn: 'root' })
export class BlueprintRepository {
  private readonly firestore = inject(Firestore);
  private readonly collectionName = 'blueprints';
  
  /**
   * 取得藍圖集合參考
   * Get blueprints collection reference
   */
  private getCollectionRef(): CollectionReference {
    return collection(this.firestore, this.collectionName);
  }
  
  /**
   * 取得藍圖文件參考
   * Get blueprint document reference
   */
  private getDocRef(id: string): DocumentReference {
    return doc(this.firestore, this.collectionName, id);
  }
  
  /**
   * 將 Firestore 文件轉換為 Blueprint 物件
   * Convert Firestore document to Blueprint object
   */
  private toBlueprint(data: any, id: string): Blueprint {
    return {
      id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      coverUrl: data.coverUrl,
      ownerId: data.ownerId,
      ownerType: data.ownerType,
      isPublic: data.isPublic,
      status: data.status,
      enabledModules: data.enabledModules || [],
      metadata: data.metadata || {},
      createdBy: data.createdBy,
      createdAt: data.createdAt instanceof Timestamp 
        ? data.createdAt.toDate() 
        : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp 
        ? data.updatedAt.toDate() 
        : data.updatedAt,
      deletedAt: data.deletedAt 
        ? (data.deletedAt instanceof Timestamp 
            ? data.deletedAt.toDate() 
            : data.deletedAt)
        : null
    };
  }
  
  /**
   * 根據 ID 查詢藍圖
   * Find blueprint by ID
   * 
   * @param id - Blueprint ID
   * @returns Observable<Blueprint | null>
   */
  findById(id: string): Observable<Blueprint | null> {
    return from(getDoc(this.getDocRef(id))).pipe(
      map(docSnap => {
        if (!docSnap.exists()) return null;
        return this.toBlueprint(docSnap.data(), docSnap.id);
      }),
      catchError(error => {
        console.error('[BlueprintRepository] findById error:', error);
        return of(null);
      })
    );
  }
  
  /**
   * 根據 slug 和 owner 查詢藍圖
   * Find blueprint by slug and owner
   * 
   * @param ownerId - Owner ID
   * @param slug - Blueprint slug
   * @returns Observable<Blueprint | null>
   */
  findBySlug(ownerId: string, slug: string): Observable<Blueprint | null> {
    const q = query(
      this.getCollectionRef(),
      where('ownerId', '==', ownerId),
      where('slug', '==', slug),
      where('deletedAt', '==', null),
      limit(1)
    );
    
    return from(getDocs(q)).pipe(
      map(querySnap => {
        if (querySnap.empty) return null;
        const doc = querySnap.docs[0];
        return this.toBlueprint(doc.data(), doc.id);
      }),
      catchError(error => {
        console.error('[BlueprintRepository] findBySlug error:', error);
        return of(null);
      })
    );
  }
  
  /**
   * 根據擁有者查詢藍圖列表
   * Find blueprints by owner
   * 
   * @param ownerId - Owner ID
   * @returns Observable<Blueprint[]>
   */
  findByOwner(ownerId: string): Observable<Blueprint[]> {
    const q = query(
      this.getCollectionRef(),
      where('ownerId', '==', ownerId),
      where('deletedAt', '==', null),
      orderBy('name', 'asc')
    );
    
    return from(getDocs(q)).pipe(
      map(querySnap => {
        return querySnap.docs.map(doc => 
          this.toBlueprint(doc.data(), doc.id)
        );
      }),
      catchError(error => {
        console.error('[BlueprintRepository] findByOwner error:', error);
        return of([]);
      })
    );
  }
  
  /**
   * 根據查詢選項查詢藍圖
   * Find blueprints with options
   * 
   * @param options - Query options
   * @returns Observable<Blueprint[]>
   */
  findWithOptions(options: BlueprintQueryOptions): Observable<Blueprint[]> {
    const constraints = [];
    
    if (options.ownerId) {
      constraints.push(where('ownerId', '==', options.ownerId));
    }
    
    if (options.ownerType) {
      constraints.push(where('ownerType', '==', options.ownerType));
    }
    
    if (options.status) {
      constraints.push(where('status', '==', options.status));
    }
    
    if (options.isPublic !== undefined) {
      constraints.push(where('isPublic', '==', options.isPublic));
    }
    
    if (!options.includeDeleted) {
      constraints.push(where('deletedAt', '==', null));
    }
    
    constraints.push(orderBy('name', 'asc'));
    
    const q = query(this.getCollectionRef(), ...constraints);
    
    return from(getDocs(q)).pipe(
      map(querySnap => {
        return querySnap.docs.map(doc => 
          this.toBlueprint(doc.data(), doc.id)
        );
      }),
      catchError(error => {
        console.error('[BlueprintRepository] findWithOptions error:', error);
        return of([]);
      })
    );
  }
  
  /**
   * 查詢公開藍圖
   * Find public blueprints
   * 
   * @returns Observable<Blueprint[]>
   */
  findPublic(): Observable<Blueprint[]> {
    return this.findWithOptions({ isPublic: true, includeDeleted: false });
  }
  
  /**
   * 建立藍圖
   * Create blueprint
   * 
   * @param blueprint - Blueprint data (without id)
   * @returns Observable<Blueprint | null>
   */
  create(blueprint: Omit<Blueprint, 'id'>): Observable<Blueprint | null> {
    const data = {
      ...blueprint,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    return from(addDoc(this.getCollectionRef(), data)).pipe(
      map(docRef => {
        return this.toBlueprint(data, docRef.id);
      }),
      catchError(error => {
        console.error('[BlueprintRepository] create error:', error);
        return of(null);
      })
    );
  }
  
  /**
   * 更新藍圖
   * Update blueprint
   * 
   * @param id - Blueprint ID
   * @param updates - Partial blueprint data
   * @returns Observable<Blueprint | null>
   */
  update(id: string, updates: Partial<Blueprint>): Observable<Blueprint | null> {
    const data = {
      ...updates,
      updatedAt: Timestamp.now()
    };
    
    // 移除 id 欄位（不應更新）
    delete (data as any).id;
    
    return from(updateDoc(this.getDocRef(id), data)).pipe(
      map(() => {
        // 更新後重新查詢以獲取完整資料
        return this.findById(id);
      }),
      catchError(error => {
        console.error('[BlueprintRepository] update error:', error);
        return of(null);
      })
    );
  }
  
  /**
   * 軟刪除藍圖
   * Soft delete blueprint
   * 
   * @param id - Blueprint ID
   * @returns Observable<boolean>
   */
  softDelete(id: string): Observable<boolean> {
    return from(updateDoc(this.getDocRef(id), {
      deletedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      status: 'archived'
    })).pipe(
      map(() => true),
      catchError(error => {
        console.error('[BlueprintRepository] softDelete error:', error);
        return of(false);
      })
    );
  }
  
  /**
   * 恢復已刪除的藍圖
   * Restore deleted blueprint
   * 
   * @param id - Blueprint ID
   * @returns Observable<boolean>
   */
  restore(id: string): Observable<boolean> {
    return from(updateDoc(this.getDocRef(id), {
      deletedAt: null,
      updatedAt: Timestamp.now(),
      status: 'active'
    })).pipe(
      map(() => true),
      catchError(error => {
        console.error('[BlueprintRepository] restore error:', error);
        return of(false);
      })
    );
  }
  
  /**
   * 硬刪除藍圖（永久刪除）
   * Hard delete blueprint (permanent deletion)
   * 
   * 注意：此操作無法復原，僅在必要時使用
   * Warning: This operation is irreversible, use only when necessary
   * 
   * @param id - Blueprint ID
   * @returns Observable<boolean>
   */
  hardDelete(id: string): Observable<boolean> {
    return from(deleteDoc(this.getDocRef(id))).pipe(
      map(() => true),
      catchError(error => {
        console.error('[BlueprintRepository] hardDelete error:', error);
        return of(false);
      })
    );
  }
}
```

### 2. Blueprint Selector Component

```typescript
// src/app/shared/components/blueprint-selector/blueprint-selector.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { BlueprintService } from '@core/services/blueprint.service';
import { WorkspaceContextService } from '@shared/services/workspace-context.service';

@Component({
  selector: 'app-blueprint-selector',
  standalone: true,
  imports: [
    CommonModule,
    NzSelectModule,
    NzButtonModule,
    NzIconModule
  ],
  template: `
    <div class="blueprint-selector">
      <nz-select
        [nzPlaceHolder]="'選擇藍圖'"
        [(ngModel)]="selectedBlueprintId"
        (ngModelChange)="onBlueprintChange($event)"
        [nzLoading]="blueprintService.loading()">
        @for (blueprint of blueprintService.blueprints(); track blueprint.id) {
          <nz-option 
            [nzValue]="blueprint.id" 
            [nzLabel]="blueprint.name">
          </nz-option>
        }
      </nz-select>
      
      @if (canCreateBlueprint()) {
        <button nz-button nzType="primary" (click)="createBlueprint()">
          <nz-icon nzType="plus" />
          新增藍圖
        </button>
      }
    </div>
  `,
  styles: [`
    .blueprint-selector {
      display: flex;
      gap: 8px;
      align-items: center;
      
      nz-select {
        flex: 1;
        min-width: 200px;
      }
    }
  `]
})
export class BlueprintSelectorComponent implements OnInit {
  blueprintService = inject(BlueprintService);
  workspaceContext = inject(WorkspaceContextService);
  
  selectedBlueprintId: string | null = null;
  
  ngOnInit() {
    this.blueprintService.loadBlueprintsForCurrentContext();
    
    // 監聽上下文變更
    effect(() => {
      const contextType = this.workspaceContext.contextType();
      if (contextType) {
        this.blueprintService.loadBlueprintsForCurrentContext();
      }
    });
  }
  
  onBlueprintChange(blueprintId: string) {
    const blueprint = this.blueprintService.blueprints()
      .find(b => b.id === blueprintId);
    this.blueprintService.setCurrentBlueprint(blueprint || null);
  }
  
  canCreateBlueprint(): boolean {
    const contextType = this.workspaceContext.contextType();
    return contextType === 'user' || contextType === 'organization';
  }
  
  createBlueprint() {
    // 開啟建立 Blueprint 的對話框
    // Open create blueprint dialog
  }
}
```

## 使用場景 (Use Cases)

### 場景 1: 用戶建立個人 Blueprint

```typescript
// 1. 用戶登入並切換到用戶上下文
workspaceContext.switchToUser(userId);

// 2. 建立個人藍圖
const blueprint = await blueprintService.createBlueprint({
  name: '住宅裝修專案',
  description: '張先生家的住宅裝修工程'
});

// 3. 在藍圖中建立任務
const task = await taskService.createTask({
  blueprint_id: blueprint.id,
  title: '水電配管',
  assigned_to: electricianId
});
```

### 場景 2: 組織建立並管理 Blueprint

```typescript
// 1. 切換到組織上下文
workspaceContext.switchToOrganization(orgId);

// 2. 組織管理員建立藍圖
const blueprint = await blueprintService.createBlueprint({
  name: '商業大樓專案',
  description: '市中心商業大樓建設'
});

// 3. 分配權限給團隊成員
await blueprintService.grantPermission({
  blueprint_id: blueprint.id,
  user_id: projectManagerId,
  role: 'admin'
});

// 4. 團隊成員可以訪問並協作
workspaceContext.switchToTeam(teamId);
const blueprints = await blueprintService.loadBlueprintsForCurrentContext();
```

### 場景 3: 團隊協作訪問組織 Blueprint

```typescript
// 1. 團隊成員切換到團隊上下文
workspaceContext.switchToTeam(teamId);

// 2. 自動載入所屬組織的 Blueprints
await blueprintService.loadBlueprintsForCurrentContext();

// 3. 選擇 Blueprint 並開始工作
blueprintService.setCurrentBlueprint(blueprints[0]);

// 4. 在 Blueprint 上下文中執行操作
await taskService.updateTask(taskId, { status: 'completed' });
```

## 最佳實踐 (Best Practices)

### 1. 上下文感知 (Context Awareness)
- 總是檢查當前 WorkspaceContext 再執行操作
- 根據上下文類型顯示或隱藏功能
- 在上下文切換時重新載入資料

### 2. 權限檢查 (Permission Checking)
- 在 UI 層面進行權限檢查（隱藏/停用按鈕）
- 在 Service 層面進行權限驗證
- 使用 RLS 政策作為最終防線

### 3. 資料同步 (Data Synchronization)
- 使用 Signals 保持 UI 自動更新
- 實作 Supabase Realtime 訂閱以獲得即時更新
- 處理離線狀態和衝突解決

### 4. 效能優化 (Performance Optimization)
- 使用分頁載入大量 Blueprints
- 實作虛擬滾動顯示大量模組資料
- 快取常用的 Blueprint 資料

## 未來擴展 (Future Extensions)

### 1. Blueprint 範本系統
- 預定義的 Blueprint 範本
- 使用者自訂範本
- 範本市場

### 2. Blueprint 版本控制
- Blueprint 快照
- 版本歷史
- 復原/重做功能

### 3. Blueprint 分析
- 進度追蹤視覺化
- 效率分析報告
- 成本統計

### 4. 跨 Blueprint 功能
- Blueprint 之間的任務連結
- 資源共享
- 統一的報表檢視

## 總結 (Summary)

Blueprint 邏輯容器是 GigHub 系統的核心抽象，提供了：
- ✅ 清晰的擁有權模型（用戶和組織）
- ✅ 靈活的權限控制系統
- ✅ 模組化的業務功能組織
- ✅ 良好的擴展性和維護性
- ✅ 與 SaaS 多租戶架構的無縫整合

The Blueprint logical container is the core abstraction of the GigHub system, providing:
- ✅ Clear ownership model (User and Organization)
- ✅ Flexible permission control system
- ✅ Modular business function organization
- ✅ Good scalability and maintainability
- ✅ Seamless integration with SaaS multi-tenancy architecture
