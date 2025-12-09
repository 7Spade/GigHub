# Blueprint 模組 AGENTS.md

本檔案涵蓋 `src/app/routes/blueprint/` 目錄下的 Blueprint 模組開發指引。

**Blueprint** 是 GigHub 的核心容器層，代表一個工地專案的工作空間。

## 目錄結構

```
src/app/routes/blueprint/
├── blueprint-list.component.ts         # 列表頁 (ST 表格)
├── blueprint-detail.component.ts       # 詳情頁
├── blueprint-modal.component.ts        # 建立/編輯 Modal
├── routes.ts                           # 路由配置
├── members/
│   └── blueprint-members.component.ts  # 成員管理
└── audit/
    └── audit-logs.component.ts         # 審計日誌
```

## 資料模型

### Blueprint

```typescript
interface Blueprint {
  id: string;
  name: string;                 // 顯示名稱
  slug: string;                 // URL 識別碼 (唯一)
  description?: string;
  
  // 擁有權
  owner_type: 'user' | 'organization';
  owner_id: string;
  
  // 狀態
  status: 'draft' | 'active' | 'archived';
  visibility: 'public' | 'private';
  
  // 模組配置
  enabled_modules: string[];    // ['task', 'diary', 'quality']
  module_settings: Record<string, any>;
  
  // 時間戳
  created_at: string;
  updated_at: string;
  deleted_at?: string;          // 軟刪除
}
```

### BlueprintMember

```typescript
interface BlueprintMember {
  id: string;
  blueprint_id: string;
  account_id: string;
  
  // 系統角色 (影響權限)
  role: 'viewer' | 'contributor' | 'maintainer';
  
  // 業務角色 (顯示用)
  business_role?: 'project_manager' | 'site_supervisor' | 'engineer';
  
  is_external: boolean;
  granted_at: string;
}
```

## 權限系統

### 角色階層

```
Maintainer (維護者) - 全部權限，管理成員與設定
    ↓
Contributor (貢獻者) - 編輯內容，CRUD 業務模組
    ↓
Viewer (檢視者) - 僅讀取權限
```

### 權限檢查

```typescript
// 元件中
const canEdit = await this.permissionService.canEdit(blueprintId);

// 守衛中
canActivate: [authGuard, permissionGuard('edit')]

// Firestore Security Rules (firestore.rules)
function canReadBlueprint(blueprintId) {
  let blueprint = get(/databases/$(database)/documents/blueprints/$(blueprintId));
  return request.auth != null && (
    blueprint.data.owner_id == request.auth.uid ||
    exists(/databases/$(database)/documents/blueprint_members/$(blueprintId + '_' + request.auth.uid))
  );
}
```

## 開發環境提示

### 新增業務模組

Blueprint 可啟用以下模組:

| 模組 ID | 名稱 | 圖示 | 說明 |
|---------|------|------|------|
| `task` | 任務管理 | check-square | 任務追蹤 |
| `diary` | 施工日誌 | file-text | 每日記錄 |
| `quality` | 品質管理 | safety | 品質檢查 |
| `financial` | 財務管理 | dollar | 預算成本 |

### 路由模式

```
/blueprint                              # 列表
/blueprint/:id                          # 詳情
/blueprint/:id/members                  # 成員管理
/blueprint/:id/audit                    # 審計日誌
/blueprint/:blueprintId/tasks           # 任務模組 (需啟用)
/blueprint/:blueprintId/diary           # 日誌模組 (需啟用)
```

## 程式碼模式

### 列表元件 (使用 ST 表格)

```typescript
import { Component, signal } from '@angular/core';
import { STColumn } from '@delon/abc/st';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-blueprint-list',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <st [data]="blueprints()" [columns]="columns" [loading]="loading()" />
  `
})
export class BlueprintListComponent {
  loading = signal(false);
  blueprints = signal<Blueprint[]>([]);
  
  columns: STColumn[] = [
    { title: '名稱', index: 'name', click: (item) => this.view(item) },
    { title: '狀態', index: 'status', type: 'badge' },
    { title: '模組', render: 'modulesTemplate' },
    {
      title: '操作',
      buttons: [
        { text: '編輯', click: (item) => this.edit(item) },
        { text: '刪除', click: (item) => this.delete(item), type: 'del' }
      ]
    }
  ];
  
  async ngOnInit() {
    await this.loadBlueprints();
  }
  
  async loadBlueprints() {
    this.loading.set(true);
    try {
      const data = await this.blueprintService.list();
      this.blueprints.set(data);
    } finally {
      this.loading.set(false);
    }
  }
}
```

### Service 模式

```typescript
@Injectable({ providedIn: 'root' })
export class BlueprintService {
  private repository = inject(BlueprintRepository);
  private eventBus = inject(BlueprintEventBus);
  
  async create(data: Partial<Blueprint>): Promise<Blueprint> {
    const blueprint = await this.repository.create(data);
    
    // 發送領域事件
    this.eventBus.emit({
      type: 'blueprint.created',
      blueprintId: blueprint.id,
      timestamp: Date.now(),
      data: blueprint
    });
    
    return blueprint;
  }
  
  async addMember(blueprintId: string, data: AddMemberDto): Promise<BlueprintMember> {
    const member = await this.repository.addMember(blueprintId, data);
    
    this.eventBus.emit({
      type: 'blueprint.member.added',
      blueprintId,
      timestamp: Date.now(),
      data: member
    });
    
    return member;
  }
}
```

### Repository 模式 (Firestore)

```typescript
@Injectable({ providedIn: 'root' })
export class BlueprintRepository {
  private firestore = inject(Firestore);
  
  async list(): Promise<Blueprint[]> {
    const collectionRef = collection(this.firestore, 'blueprints');
    const q = query(
      collectionRef,
      where('deleted_at', '==', null),
      orderBy('created_at', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Blueprint[];
  }
  
  async getById(id: string): Promise<Blueprint | null> {
    const docRef = doc(this.firestore, 'blueprints', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    return { id: docSnap.id, ...docSnap.data() } as Blueprint;
  }
}
```

## 事件系統

### 領域事件

```typescript
// 事件類型
export enum BlueprintEventType {
  Created = 'blueprint.created',
  Updated = 'blueprint.updated',
  Deleted = 'blueprint.deleted',
  MemberAdded = 'blueprint.member.added',
  ModuleEnabled = 'blueprint.module.enabled'
}

// 發送事件
this.eventBus.emit({
  type: BlueprintEventType.Created,
  blueprintId: 'xxx',
  timestamp: Date.now(),
  actor: currentUserId,
  data: blueprint
});

// 訂閱事件
this.eventBus.created$
  .pipe(takeUntilDestroyed())
  .subscribe(event => {
    this.refreshList();
  });
```

## 驗證規則

```typescript
export const BlueprintCreateSchema: ValidationSchema = {
  name: [
    { type: 'required', message: '名稱為必填' },
    { type: 'minLength', value: 3, message: '名稱至少 3 個字元' }
  ],
  slug: [
    { type: 'required', message: 'Slug 為必填' },
    { type: 'pattern', value: /^[a-z0-9-]+$/, message: '僅小寫字母、數字、連字符' }
  ],
  enabled_modules: [
    { 
      type: 'custom', 
      value: (val) => Array.isArray(val) && val.length > 0,
      message: '至少啟用一個模組' 
    }
  ]
};
```

## Firestore Security Rules

**檔案**: `firestore.rules` (專案根目錄)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /blueprints/{blueprintId} {
      allow read: if canReadBlueprint(blueprintId);
      allow update: if canEditBlueprint(blueprintId);
      allow delete: if hasRole(blueprintId, 'maintainer');
    }
    
    function canReadBlueprint(blueprintId) {
      let blueprint = get(/databases/$(database)/documents/blueprints/$(blueprintId));
      return request.auth != null && (
        blueprint.data.owner_id == request.auth.uid ||
        exists(/databases/$(database)/documents/blueprint_members/$(blueprintId + '_' + request.auth.uid))
      );
    }
    
    function canEditBlueprint(blueprintId) {
      return canReadBlueprint(blueprintId) && 
             hasRole(blueprintId, ['contributor', 'maintainer']);
    }
    
    function hasRole(blueprintId, roles) {
      let memberDoc = get(/databases/$(database)/documents/blueprint_members/$(blueprintId + '_' + request.auth.uid));
      return memberDoc.data.role in roles;
    }
  }
}
```

## 測試指引

```typescript
describe('BlueprintListComponent', () => {
  it('should load blueprints', async () => {
    const fixture = TestBed.createComponent(BlueprintListComponent);
    const component = fixture.componentInstance;
    
    await component.ngOnInit();
    
    expect(component.blueprints().length).toBeGreaterThan(0);
    expect(component.loading()).toBe(false);
  });
});
```

## 常見操作

### 建立 Blueprint

```typescript
async createBlueprint() {
  const result = await this.modal.create(BlueprintModalComponent, {
    mode: 'create'
  }).toPromise();
  
  if (result) {
    await this.loadBlueprints();
    this.message.success('建立成功');
  }
}
```

### 新增成員

```typescript
async addMember() {
  const result = await this.modal.create(MemberModalComponent, {
    blueprintId: this.blueprintId
  }).toPromise();
  
  if (result) {
    await this.loadMembers();
    this.message.success('成員已新增');
  }
}
```

## 常見問題

### Q: 如何檢查模組是否啟用?

**A**: 
```typescript
isModuleEnabled(moduleId: string): boolean {
  return this.blueprint().enabled_modules.includes(moduleId);
}
```

### Q: 如何實作軟刪除?

**A**: 
```typescript
async softDelete(id: string): Promise<void> {
  await updateDoc(doc(this.firestore, 'blueprints', id), {
    deleted_at: Timestamp.now()
  });
}
```

### Q: 權限檢查要快取嗎?

**A**: 是的，使用 5 分鐘 TTL 快取避免重複查詢

## PR 提交檢查清單

- [ ] 使用 Repository 模式存取 Firestore
- [ ] 透過 EventBus 發送領域事件
- [ ] 實作 Firestore Security Rules
- [ ] 權限檢查正確
- [ ] 軟刪除實作 (設定 deleted_at)
- [ ] 驗證規則完整
- [ ] 測試通過
- [ ] Lint 通過

## 相關文檔

- **專案根目錄**: `../../../AGENTS.md`
- **應用層**: `../../AGENTS.md`
- **路由層**: `../AGENTS.md`
- **核心服務**: `../../core/AGENTS.md`
- **Blueprint 架構**: `/BLUEPRINT_MODULE_DOCUMENTATION.md`

---

**版本**: 2.0.0 (簡化版)  
**最後更新**: 2025-12-09
