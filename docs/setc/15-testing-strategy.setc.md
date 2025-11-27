# 15-testing-strategy.setc.md

## 1. 模組概述

### 業務價值
測試策略確保 GigHub 系統的品質與可靠性：
- **品質保證**：透過自動化測試發現缺陷
- **回歸防護**：確保新功能不破壞既有功能
- **文件作用**：測試即規格說明
- **信心建立**：讓團隊有信心進行重構與部署

### 核心功能
1. **單元測試**：使用 Jasmine + Karma 測試元件和服務
2. **整合測試**：測試模組間互動
3. **E2E 測試**：使用 Playwright 測試完整用戶流程
4. **Mock 策略**：統一的 Mock 資料與服務規範
5. **CI 整合**：自動化測試執行與報告

### 在系統中的定位
本文件定義系統的測試標準與規範，是所有開發人員撰寫測試的參考指南。

---

## 2. 功能需求

### 使用者故事列表

#### TEST-001: 測試覆蓋率目標
**作為** 技術主管
**我想要** 設定明確的測試覆蓋率目標
**以便於** 確保關鍵程式碼有足夠測試保護

**驗收標準**：
- [ ] Store 層測試覆蓋率 100%
- [ ] Service 層測試覆蓋率 80%+
- [ ] Component 層測試覆蓋率 60%+
- [ ] Utils 層測試覆蓋率 100%

#### TEST-002: 測試命名規範
**作為** 開發人員
**我想要** 統一的測試命名規範
**以便於** 快速理解測試意圖

**驗收標準**：
- [ ] 格式：`MethodName_Condition_ExpectedResult`
- [ ] 測試描述清楚明確
- [ ] 一個測試只驗證一件事

#### TEST-003: Mock 資料規範
**作為** 開發人員
**我想要** 統一的 Mock 資料管理
**以便於** 減少重複程式碼

**驗收標準**：
- [ ] 共用 Mock 資料集中管理
- [ ] Mock 資料符合實際 Schema
- [ ] 提供 Factory 函數生成測試資料

### 優先級與依賴關係

| 優先級 | 測試類型 | 說明 |
|--------|----------|------|
| P0 | 單元測試 | 最快速的反饋循環 |
| P1 | 整合測試 | 驗證模組互動 |
| P2 | E2E 測試 | 驗證完整流程 |
| P3 | 效能測試 | 驗證效能基準 |

---

## 3. 技術設計

### 測試架構

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           E2E 測試 (Playwright)                          │
│  完整用戶流程 │ 真實瀏覽器 │ CI 整合                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                           整合測試 (Jasmine/Karma)                       │
│  模組互動 │ Service + Store │ API Mock                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                           單元測試 (Jasmine/Karma)                       │
│  元件 │ Service │ Store │ Utils │ 快速反饋                               │
└─────────────────────────────────────────────────────────────────────────┘
```

### 測試命名規範

**格式**：`MethodName_Condition_ExpectedResult`

```typescript
// ✅ 正確命名
describe('TaskStore', () => {
  it('loadTasks_whenBlueprintIdValid_shouldReturnTasks', () => { ... });
  it('createTask_whenDataValid_shouldAddToList', () => { ... });
  it('updateStatus_whenNoPermission_shouldThrowError', () => { ... });
  it('selectTask_whenTaskExists_shouldUpdateSelection', () => { ... });
});

// ❌ 錯誤命名
it('should load tasks', () => { ... });  // 太模糊
it('test create task', () => { ... });   // 無意義
it('works', () => { ... });              // 完全沒意義
```

### 測試覆蓋率目標

| 層級 | 目標 | 重點 |
|------|------|------|
| Store | 100% | 狀態變更、computed signals |
| Service | 80%+ | API 呼叫、錯誤處理 |
| Component | 60%+ | 關鍵交互、表單提交 |
| Utils | 100% | 純函數、邊界條件 |

### Mock 資料規範

**Mock 資料目錄結構**:
```
src/testing/
├── mocks/
│   ├── accounts.mock.ts
│   ├── blueprints.mock.ts
│   ├── tasks.mock.ts
│   └── index.ts
├── factories/
│   ├── account.factory.ts
│   ├── blueprint.factory.ts
│   ├── task.factory.ts
│   └── index.ts
└── helpers/
    ├── test-bed.helper.ts
    └── async.helper.ts
```

**Mock Factory 範例**:
```typescript
// src/testing/factories/task.factory.ts
export function createMockTask(overrides?: Partial<Task>): Task {
  return {
    id: crypto.randomUUID(),
    blueprint_id: 'test-blueprint-id',
    parent_id: null,
    name: 'Test Task',
    description: null,
    status: 'pending',
    priority: 'medium',
    task_type: 'task',
    progress: 0,
    start_date: null,
    due_date: null,
    sort_order: 0,
    assignee_id: null,
    reviewer_id: null,
    created_by: 'test-user-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    ...overrides
  };
}

export function createMockTaskTree(depth: number = 2, width: number = 3): Task[] {
  const tasks: Task[] = [];
  
  function createLevel(parentId: string | null, currentDepth: number) {
    if (currentDepth > depth) return;
    
    for (let i = 0; i < width; i++) {
      const task = createMockTask({
        parent_id: parentId,
        name: `Task ${currentDepth}-${i}`
      });
      tasks.push(task);
      createLevel(task.id, currentDepth + 1);
    }
  }
  
  createLevel(null, 1);
  return tasks;
}
```

### TestBed 配置

**標準配置模板**:
```typescript
import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('TaskComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskComponent],
      providers: [
        provideHttpClientTesting(),
        { provide: TaskRepository, useValue: mockTaskRepository },
        { provide: BlueprintStore, useValue: mockBlueprintStore },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(TaskComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
```

### 前端元件結構
N/A - 本文件為測試策略文件

### 狀態管理
N/A - 本文件為測試策略文件

---

## 4. 安全與權限

### RLS 測試

```typescript
describe('RLS Policy Tests', () => {
  // 使用不同角色的測試用戶
  const ownerClient = createTestClient('owner');
  const memberClient = createTestClient('member');
  const viewerClient = createTestClient('viewer');
  const outsiderClient = createTestClient('outsider');

  describe('tasks table', () => {
    it('owner_selectTask_shouldSucceed', async () => {
      const { data, error } = await ownerClient
        .from('tasks')
        .select('*')
        .eq('blueprint_id', testBlueprintId);
      
      expect(error).toBeNull();
      expect(data).not.toBeNull();
    });

    it('outsider_selectTask_shouldReturnEmpty', async () => {
      const { data, error } = await outsiderClient
        .from('tasks')
        .select('*')
        .eq('blueprint_id', testBlueprintId);
      
      expect(error).toBeNull();
      expect(data).toEqual([]);
    });
  });
});
```

### 權限檢查點測試

測試各角色的權限邊界：
1. Owner 可執行所有操作
2. Admin 可管理但不可轉移擁有權
3. Member 只能操作自己的資源
4. Viewer 只能讀取

### 資料隔離測試

```typescript
describe('Data Isolation Tests', () => {
  it('blueprint_A_member_cannotAccess_blueprint_B_data', async () => {
    const { data } = await blueprintAMemberClient
      .from('tasks')
      .select('*')
      .eq('blueprint_id', blueprintBId);
    
    expect(data).toEqual([]);
  });
});
```

---

## 5. 測試規範

### 單元測試清單

**Store 測試**:
| 測試項目 | 測試內容 | 預期結果 |
|----------|----------|----------|
| loadTasks_success | 正常載入 | tasks 填充資料 |
| loadTasks_error | API 失敗 | error 設定錯誤訊息 |
| createTask_success | 新增成功 | tasks 包含新任務 |
| updateStatus_success | 狀態變更 | 對應任務狀態更新 |
| computed_taskTree | 樹結構計算 | 正確的階層結構 |

**Component 測試**:
| 測試項目 | 測試內容 | 預期結果 |
|----------|----------|----------|
| render_loading | 載入狀態 | 顯示 loading spinner |
| render_empty | 無資料 | 顯示空狀態 |
| click_createButton | 點擊建立 | 開啟表單 |
| submit_form | 表單提交 | 呼叫 create 方法 |

### 整合測試場景

1. **任務完整流程**：
   - 建立藍圖 → 建立任務 → 更新狀態 → 驗收完成

2. **權限流程**：
   - 登入 → 加入藍圖 → 執行操作 → 驗證權限

3. **資料同步**：
   - 本地更新 → API 同步 → 驗證一致性

### E2E 測試案例

```typescript
// e2e/task-management.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Task Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password');
    await page.click('[data-testid="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('createTask_withValidData_shouldAppearInList', async ({ page }) => {
    await page.goto('/blueprints/test-blueprint/tasks');
    
    // 點擊新增按鈕
    await page.click('[data-testid="create-task-btn"]');
    
    // 填寫表單
    await page.fill('[data-testid="task-name"]', 'E2E Test Task');
    await page.click('[data-testid="submit-task"]');
    
    // 驗證任務出現在列表
    await expect(page.locator('[data-testid="task-list"]'))
      .toContainText('E2E Test Task');
  });

  test('updateTaskStatus_fromPendingToCompleted_shouldShowCompletedBadge', async ({ page }) => {
    await page.goto('/blueprints/test-blueprint/tasks');
    
    // 找到待處理任務
    const task = page.locator('[data-testid="task-card"]').first();
    await task.click();
    
    // 更新狀態
    await page.click('[data-testid="status-dropdown"]');
    await page.click('[data-testid="status-completed"]');
    
    // 驗證狀態徽章
    await expect(task.locator('[data-testid="status-badge"]'))
      .toHaveText('已完成');
  });
});
```

---

## 6. 效能考量

### 效能目標

| 指標 | 目標值 | 說明 |
|------|--------|------|
| 單元測試執行 | < 30s | 全部測試 |
| 整合測試執行 | < 2min | 全部測試 |
| E2E 測試執行 | < 10min | 全部測試 |
| CI 總時間 | < 15min | 完整 Pipeline |

### 優化策略

1. **並行執行**：
   - Jest/Karma 並行測試
   - Playwright 並行瀏覽器

2. **選擇性執行**：
   - 根據變更檔案執行相關測試
   - PR 只執行受影響的測試

3. **快取策略**：
   - 依賴快取
   - 測試結果快取

### 監控指標

- 測試執行時間趨勢
- 測試失敗率
- 覆蓋率變化
- Flaky Test 追蹤

---

## 7. 實作檢查清單

### 階段一：基礎設施（P0）
- [ ] Jasmine/Karma 配置
- [ ] Playwright 配置
- [ ] Mock 資料目錄建立
- [ ] Factory 函數建立
- [ ] TestBed Helper 建立

### 階段二：核心測試（P1）
- [ ] Store 單元測試
- [ ] Repository 單元測試
- [ ] Service 單元測試
- [ ] RLS Policy 測試

### 階段三：元件測試（P2）
- [ ] 核心元件單元測試
- [ ] 表單元件測試
- [ ] 互動元件測試

### 階段四：E2E 測試（P2）
- [ ] 登入流程 E2E
- [ ] 任務管理 E2E
- [ ] 日誌管理 E2E
- [ ] 權限邊界 E2E

### CI 整合
- [ ] PR 自動測試
- [ ] 覆蓋率報告
- [ ] 測試結果通知
- [ ] Flaky Test 監控

---

**文件版本**: v1.0
**最後更新**: 2025-11-28
**維護者**: 品質保證工程師
