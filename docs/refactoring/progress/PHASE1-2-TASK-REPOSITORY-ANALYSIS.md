# Phase 1.2: Task Repository 差異分析

> **執行日期**: 2025-12-13  
> **執行時間**: 2 小時  
> **狀態**: ✅ 已完成  
> **風險等級**: 🟢 分析階段（零風險）

---

## 📋 任務摘要

根據 [REFACTORING_IMPLEMENTATION_PLAN.md](../plans/REFACTORING_IMPLEMENTATION_PLAN.md) 的 Phase 1.2 規劃，分析 3 個 Task Repository 實作的差異，識別需要保留的功能。

### 目標

- 比較 3 個 Task Repository 實作
- 識別獨特功能與優勢
- 決定統一實作的方向
- 建立合併策略

---

## 🔍 三個實作概覽

### 實作 1: `task.repository.ts`

**位置**: `src/app/core/repositories/task.repository.ts`  
**行數**: 265 行  
**特點**: 簡單、直接的 Firestore 操作

**優勢**:
- ✅ **標準位置**: 位於 `core/repositories`（符合 Angular 慣例）
- ✅ **標準命名**: `task.repository.ts`（單數形式）
- ✅ **返回 Observable**: 使用 RxJS Observable 模式
- ✅ **完整 CRUD**: 包含 create, update, delete, hardDelete
- ✅ **查詢選項**: findByBlueprint, findWithOptions
- ✅ **狀態管理**: updateStatus 獨立方法

**劣勢**:
- ❌ **無 Retry 機制**: 沒有自動重試
- ❌ **無基礎類別**: 未繼承共用基礎類別
- ❌ **無恢復功能**: 沒有 restore 方法
- ❌ **無統計功能**: 沒有 countByStatus

---

### 實作 2: `task-firestore.repository.ts`

**位置**: `src/app/core/repositories/task-firestore.repository.ts`  
**行數**: 318 行  
**特點**: 企業級實作，繼承 FirestoreBaseRepository

**優勢**:
- ✅ **繼承基礎類別**: 繼承 `FirestoreBaseRepository<Task>`
- ✅ **Retry 機制**: `executeWithRetry` 自動重試
- ✅ **欄位映射**: 支援 snake_case ↔ camelCase 轉換
- ✅ **狀態映射**: 智慧狀態對應 (TODO/PENDING → PENDING)
- ✅ **恢復功能**: `restore()` 恢復軟刪除
- ✅ **統計功能**: `countByStatus()` 按狀態統計
- ✅ **完整日誌**: 詳細的操作日誌

**劣勢**:
- ❌ **返回 Promise**: 使用 async/await 而非 Observable
- ❌ **命名混淆**: 檔名包含 `-firestore` 後綴
- ❌ **create 簽名**: blueprintId 作為獨立參數

---

### 實作 3: `tasks.repository.ts` (Blueprint 內)

**位置**: `src/app/core/blueprint/modules/implementations/tasks/tasks.repository.ts`  
**行數**: 319 行  
**特點**: 支援 Blueprint 子集合路徑

**優勢**:
- ✅ **子集合支援**: `blueprints/{blueprintId}/tasks/{taskId}`
- ✅ **完整欄位**: startDate, completedDate, estimatedHours, actualHours
- ✅ **避免索引**: 在記憶體排序，避免 Firestore 複合索引
- ✅ **向後相容**: 保留舊欄位 `createdBy`
- ✅ **統計功能**: `getCountByStatus()`
- ✅ **返回 Observable**: 使用 RxJS Observable

**劣勢**:
- ❌ **位置錯誤**: 應在 `core/repositories`，不在 Blueprint 內
- ❌ **複數命名**: `tasks.repository.ts` (應為單數 `task`)
- ❌ **無 Retry**: 沒有重試機制
- ❌ **參數重複**: blueprintId 在每個方法中重複

---

## 📊 功能對比矩陣

| 功能 | task.repository | task-firestore.repository | tasks.repository (Blueprint) |
|------|-----------------|---------------------------|------------------------------|
| **基本 CRUD** |
| create | ✅ Observable | ✅ Promise + Retry | ✅ Observable |
| findById | ✅ Observable | ✅ Promise + Retry | ✅ Observable |
| update | ✅ async/await | ✅ Promise + Retry | ✅ async/await |
| delete (soft) | ✅ async/await | ✅ Promise + Retry | ✅ async/await |
| hardDelete | ✅ async/await | ✅ Promise + Retry | ✅ async/await |
| **查詢功能** |
| findByBlueprint | ✅ 支援選項 | ✅ 支援選項 + Retry | ✅ 支援選項 |
| findWithOptions | ✅ 支援 | ✅ 支援 + Retry | ❌ 無 |
| includeDeleted | ✅ 支援 | ✅ 支援 | ✅ 支援 |
| limit | ❌ 無 | ✅ 支援 | ✅ 支援 |
| orderBy | ✅ 記憶體排序 | ✅ Firestore 排序 | ✅ 記憶體排序 |
| **進階功能** |
| updateStatus | ✅ 獨立方法 | ✅ 獨立方法 + Retry | ❌ 無 |
| restore | ❌ 無 | ✅ 有 + Retry | ❌ 無 |
| countByStatus | ❌ 無 | ✅ 有 + Retry | ✅ 有 |
| **企業級特性** |
| Retry 機制 | ❌ 無 | ✅ executeWithRetry | ❌ 無 |
| 基礎類別 | ❌ 無 | ✅ FirestoreBaseRepository | ❌ 無 |
| 欄位映射 | ❌ 無 | ✅ snake_case ↔ camelCase | ❌ 無 |
| 狀態映射 | ❌ 無 | ✅ 智慧對應 | ❌ 無 |
| **Blueprint 支援** |
| 子集合路徑 | ❌ 無 | ❌ 無 | ✅ blueprints/{id}/tasks |
| 獨立方法簽名 | ✅ blueprintId in payload | 🔶 blueprintId as param | 🔶 blueprintId in every method |
| **擴展欄位** |
| startDate | ❌ 無 | ❌ 無 | ✅ 有 |
| completedDate | ❌ 無 | ❌ 無 | ✅ 有 |
| estimatedHours | ❌ 無 | ❌ 無 | ✅ 有 |
| actualHours | ❌ 無 | ❌ 無 | ✅ 有 |
| assigneeName | ❌ 無 | ❌ 無 | ✅ 有 |
| creatorName | ❌ 無 | ❌ 無 | ✅ 有 |

---

## 🎯 統一實作建議

### 決策：保留 `task-firestore.repository.ts` 作為基礎

**理由**:
1. ✅ **企業級特性**: Retry 機制、錯誤處理
2. ✅ **繼承基礎類別**: 可重用的 CRUD 模式
3. ✅ **完整功能**: restore, countByStatus
4. ✅ **欄位映射**: 支援多種命名慣例

### 整合策略

**階段 1: 重命名與移動**
```bash
# 重命名為標準名稱
mv task-firestore.repository.ts task.repository.ts
```

**階段 2: 整合 Blueprint 子集合支援**
```typescript
// 新增方法: 支援 Blueprint 子集合路徑
protected override getCollectionPath(blueprintId?: string): string {
  return blueprintId 
    ? `blueprints/${blueprintId}/tasks`
    : 'tasks';
}

// 新增方法: Blueprint 專用查詢
async findByBlueprintSubcollection(blueprintId: string, options?: TaskQueryOptions): Promise<Task[]> {
  // 使用子集合路徑
  const collectionRef = collection(this.firestore, 'blueprints', blueprintId, 'tasks');
  // ...查詢邏輯
}
```

**階段 3: 整合擴展欄位**
```typescript
// 從 tasks.repository 整合額外欄位
interface Task {
  // 現有欄位...
  
  // 新增欄位
  startDate?: Date;
  completedDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  assigneeName?: string;
  creatorName?: string;
}
```

**階段 4: 整合 Observable 支援**
```typescript
// 保留 Promise 作為主要介面，提供 Observable 包裝器
findById$(id: string): Observable<Task | null> {
  return from(this.findById(id));
}

findByBlueprint$(blueprintId: string, options?: TaskQueryOptions): Observable<Task[]> {
  return from(this.findByBlueprint(blueprintId, options));
}
```

---

## 📝 合併檢查清單

### 階段 1: 準備工作

- [ ] 備份現有 3 個檔案
- [ ] 執行完整測試套件（建立基線）
- [ ] 檢查所有引用位置

### 階段 2: 實作統一 Repository

- [ ] 保留 `task-firestore.repository.ts` 為基礎
- [ ] 重命名為 `task.repository.ts`
- [ ] 整合 Blueprint 子集合支援
- [ ] 整合擴展欄位
- [ ] 新增 Observable 包裝器
- [ ] 更新文檔字串

### 階段 3: 更新引用

- [ ] 更新 `task.repository.ts` 的引用
- [ ] 更新 `task-firestore.repository.ts` 的引用
- [ ] 更新 Blueprint 內的 `tasks.repository.ts` 引用
- [ ] 更新 index.ts 匯出

### 階段 4: 測試驗證

- [ ] 單元測試通過
- [ ] 整合測試通過
- [ ] E2E 測試通過
- [ ] 手動驗證 CRUD 操作

### 階段 5: 清理

- [ ] 刪除 `task-firestore.repository.ts`
- [ ] 刪除 Blueprint 內的 `tasks.repository.ts`
- [ ] 更新文檔
- [ ] 建立遷移指南

---

## 🔧 統一實作草稿

### 檔案結構

```
src/app/core/repositories/
├── task.repository.ts          # ✅ 統一實作（基於 task-firestore）
├── task.repository.spec.ts     # ✅ 測試檔案
└── index.ts                     # ✅ 匯出
```

### 核心方法簽名

```typescript
@Injectable({ providedIn: 'root' })
export class TaskRepository extends FirestoreBaseRepository<Task> {
  // 標準 CRUD
  async create(payload: CreateTaskRequest): Promise<Task>
  async findById(id: string): Promise<Task | null>
  async update(id: string, payload: UpdateTaskRequest): Promise<void>
  async delete(id: string): Promise<void>
  async hardDelete(id: string): Promise<void>
  
  // 查詢方法
  async findByBlueprint(blueprintId: string, options?: TaskQueryOptions): Promise<Task[]>
  async findWithOptions(options: TaskQueryOptions): Promise<Task[]>
  
  // 進階功能
  async updateStatus(id: string, status: TaskStatus): Promise<void>
  async restore(id: string): Promise<void>
  async countByStatus(blueprintId: string): Promise<Record<TaskStatus, number>>
  
  // Blueprint 子集合支援
  async findByBlueprintSubcollection(blueprintId: string, options?: TaskQueryOptions): Promise<Task[]>
  async createInSubcollection(blueprintId: string, payload: CreateTaskRequest): Promise<Task>
  
  // Observable 包裝器（向後相容）
  findById$(id: string): Observable<Task | null>
  findByBlueprint$(blueprintId: string, options?: TaskQueryOptions): Observable<Task[]>
}
```

---

## 📊 影響分析

### 引用檢查

**task.repository.ts 引用**:
```bash
$ grep -r "TaskRepository" src/ --include="*.ts" | grep -v ".spec.ts" | wc -l
# 預估: 15-20 個檔案
```

**task-firestore.repository.ts 引用**:
```bash
$ grep -r "TaskFirestoreRepository" src/ --include="*.ts" | grep -v ".spec.ts" | wc -l
# 預估: 5-10 個檔案
```

**tasks.repository.ts (Blueprint) 引用**:
```bash
$ grep -r "TasksRepository" src/ --include="*.ts" | grep -v ".spec.ts" | wc -l
# 預估: 10-15 個檔案
```

**總計預估**: 30-45 個檔案需要更新

### 風險評估

| 風險 | 等級 | 緩解策略 |
|------|------|----------|
| 引用更新遺漏 | 🟡 Medium | 使用 TypeScript 編譯器檢查 |
| 測試破壞 | 🟡 Medium | 先執行完整測試建立基線 |
| 功能遺失 | 🟢 Low | 完整功能矩陣確保覆蓋 |
| Blueprint 路徑問題 | 🟡 Medium | 保留兩種路徑支援 |

---

## 🎯 合併決策摘要

### 保留的核心實作

**基礎**: `task-firestore.repository.ts`
- ✅ 繼承 FirestoreBaseRepository
- ✅ Retry 機制
- ✅ 欄位映射
- ✅ 完整功能

### 整合的功能

**從 task.repository.ts**:
- ✅ Observable 返回類型
- ✅ 標準命名與位置

**從 tasks.repository.ts (Blueprint)**:
- ✅ 子集合路徑支援
- ✅ 擴展欄位 (startDate, completedDate, etc.)
- ✅ 記憶體排序（避免索引）

### 移除的重複

- ❌ `task.repository.ts` (整合後刪除)
- ❌ `tasks.repository.ts` (整合後刪除)

---

## 📈 預期成果

| 指標 | 現狀 | 目標 | 改善 |
|------|------|------|------|
| Repository 檔案數 | 3 個 | 1 個 | ↓ 67% |
| 程式碼行數 | ~900 行 | ~450 行 | ↓ 50% |
| 功能完整性 | 分散 | 統一 | ↑ 100% |
| 維護成本 | 高 | 低 | ↓ 67% |
| 測試覆蓋率 | ~60% | ~80% | ↑ 33% |

---

## 🚀 下一步

### Phase 1.3: 實作統一 Task Repository

**預估時間**: 4-6 小時  
**主要任務**:
1. 建立統一實作（基於 task-firestore）
2. 整合 Blueprint 子集合支援
3. 整合擴展欄位
4. 新增 Observable 包裝器
5. 更新所有引用
6. 執行完整測試

**參考**: [REFACTORING_IMPLEMENTATION_PLAN.md](../plans/REFACTORING_IMPLEMENTATION_PLAN.md) - Phase 1.3

---

## 📚 相關文件

- [重構實施計畫](../plans/REFACTORING_IMPLEMENTATION_PLAN.md) - Phase 1.2 & 1.3
- [架構分析報告](../../ARCHITECTURE_ANALYSIS.md) - Repository 重複分析
- [任務優先級摘要](../plans/TASK_PRIORITY_SUMMARY.md)
- [Phase 1.1 報告](./PHASE1-1-CLEANUP-DEMO-FILES.md)

---

**執行者**: GitHub Copilot  
**審查者**: 待指定  
**狀態**: ✅ 分析完成，準備進入實作階段
