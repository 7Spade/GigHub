<!-- markdownlint-disable-file -->

# Task Research Notes: SETC 任務實施文件完善研究

## Research Executed

### File Analysis

- `docs/specs/setc/01-account-blueprint-enhancement.setc.md`
  - 結構完整，包含 11 個任務，但缺少效能指標和 API 規格
  
- `docs/specs/setc/02-task-system-production.setc.md`
  - 最詳細的 SETC 文件，包含 16 個任務，有 POC 評估任務
  
- `docs/specs/setc/03-file-system.setc.md`
  - 12 個任務，格式較簡化，缺少詳細步驟
  
- `docs/specs/setc/04-diary-system.setc.md`
  - 11 個任務，缺少照片管理細節
  
- `docs/specs/setc/05-progress-dashboard.setc.md`
  - 10 個任務，缺少圖表庫選型評估
  
- `docs/specs/setc/06-quality-inspection.setc.md`
  - 9 個任務，缺少簽核流程細節
  
- `docs/specs/setc/07-collaboration-reports-launch.setc.md`
  - **格式嚴重不一致**，內容過於簡略，缺少詳細任務分解

### Code Search Results

- `src/app/features/blueprint/`
  - 已有 task.store.ts、diary.store.ts、todo.store.ts 等實作
  - Repository 模式已實現（blueprint.repository.ts, task.repository.ts 等）
  - 垂直切片架構已建立

- `docs/prd/construction-site-management.md`
  - 完整的 PRD 文件，包含 40 個 User Story（GH-001 ~ GH-040）
  - 涵蓋所有功能模組需求

### External Research

- #githubRepo:"angular best practices task management"
  - 發現 SETC 缺少 Angular 20 特性運用指引

- #fetch:https://angular.dev/style-guide
  - 需要與 Angular 最新風格指南對齊

### Project Conventions

- Standards referenced: `.github/instructions/gighub-*.instructions.md`
- Instructions followed: `docs/agent/mindmap.md` 架構決策指引

## Key Discoveries

### Project Structure

```
SETC 文件現況：
├── 01-account-blueprint-enhancement.setc.md (詳細，11 任務)
├── 02-task-system-production.setc.md (最詳細，16 任務)
├── 03-file-system.setc.md (中等，12 任務)
├── 04-diary-system.setc.md (中等，11 任務)
├── 05-progress-dashboard.setc.md (中等，10 任務)
├── 06-quality-inspection.setc.md (中等，9 任務)
└── 07-collaboration-reports-launch.setc.md (簡略，格式不一致)
```

### Implementation Patterns

#### 現有 SETC 格式（以 SETC-01/02 為標準）

```markdown
### P{階段}-T{任務號}: 任務標題

| 屬性 | 值 |
|------|-----|
| **階段** | P{階段號} |
| **預估工時** | X 天 |
| **前置依賴** | P{階段}-T{任務號} |
| **負責角色** | 角色名稱 |

#### 描述
任務描述...

#### 執行步驟
1. 步驟 1
2. 步驟 2

#### 驗收標準
- [ ] 標準 1
- [ ] 標準 2

#### 產出物
- `path/to/file.ts`
```

### API and Schema Documentation

**缺失項目識別**：
1. 缺少 Supabase Migration 範本
2. 缺少 TypeScript Interface 定義
3. 缺少 API 端點規格（Request/Response）
4. 缺少 RLS 政策範本

### Configuration Examples

**缺失配置範例**：
- Angular 路由配置
- ng-zorro 元件配置
- @delon/abc 元件配置
- Supabase Storage 配置

### Technical Requirements

**效能指標缺失**：
- 頁面載入時間目標（LCP）
- API 回應時間目標（P95, P99）
- 測試覆蓋率目標
- 任務數量上限（已在 PRD 定義，但 SETC 未引用）

## 發現的主要問題

### 1. 格式一致性問題

| SETC 編號 | 問題 |
|-----------|------|
| 01-06 | 格式相對一致 |
| 07 | **格式嚴重不一致**：使用不同的 Phase 命名、缺少標準屬性表格 |

### 2. 內容深度問題

| 問題類型 | 說明 | 受影響的 SETC |
|----------|------|---------------|
| 缺少技術規格 | API 規格、Schema 定義不完整 | 所有 |
| 測試策略不足 | 只有「撰寫測試」但無具體測試案例 | 所有 |
| 效能指標缺失 | 無 LCP、P95 等量化指標 | 所有 |
| 依賴關係不清 | 跨 SETC 依賴未明確標示 | 03-07 |

### 3. PRD 覆蓋問題

| PRD User Story | SETC 覆蓋情況 |
|----------------|---------------|
| GH-001 ~ GH-010 (帳戶) | SETC-01 部分覆蓋 |
| GH-011 ~ GH-015 (任務) | SETC-02 覆蓋 |
| GH-016 ~ GH-018 (日誌) | SETC-04 覆蓋 |
| GH-019 ~ GH-021 (檔案) | SETC-03 覆蓋 |
| GH-022 ~ GH-025 (驗收) | SETC-06 覆蓋 |
| GH-026 ~ GH-028 (問題追蹤) | **未覆蓋** |
| GH-029 ~ GH-031 (協作) | SETC-07 部分覆蓋 |
| GH-032 ~ GH-034 (報表) | SETC-07 部分覆蓋 |
| GH-035 ~ GH-037 (離線) | **未覆蓋** |
| GH-038 ~ GH-040 (系統管理) | **未覆蓋** |

### 4. 缺失的 SETC 模組

基於 PRD 分析，缺少以下 SETC：

1. **SETC-08: 問題追蹤系統** (GH-026 ~ GH-028)
2. **SETC-09: 離線與同步** (GH-035 ~ GH-037)
3. **SETC-10: 系統管理** (GH-038 ~ GH-040)

## Recommended Approach

### 改進方案：SETC 文件完善計劃

#### Phase 1: 格式標準化

1. **統一 SETC-07 格式**
   - 使用與 SETC-01/02 相同的格式
   - 補充詳細任務分解

2. **建立 SETC 模板**
   - 包含所有必要章節
   - 包含標準屬性表格

#### Phase 2: 內容增強

1. **增加技術規格章節**
   - API 端點規格（Request/Response 格式）
   - Supabase Migration 範本
   - TypeScript Interface 定義
   - RLS 政策範本

2. **增加效能指標**
   - 頁面載入目標（LCP < 2.5s）
   - API 回應目標（P95 < 500ms）
   - 測試覆蓋率目標（≥ 80%）

3. **增加測試案例**
   - 單元測試案例範例
   - E2E 測試場景
   - 邊界條件測試

#### Phase 3: 補充缺失模組

1. **新增 SETC-08: 問題追蹤系統**
2. **新增 SETC-09: 離線與同步**
3. **新增 SETC-10: 系統管理**

## Implementation Guidance

### 建議的 SETC 增強模板

```markdown
---
title: 階段名稱
status: draft | in-progress | completed
created: YYYY-MM-DD
owners: [github-username]
progress: 0-100
due: YYYY-MM-DD | null
---

# 階段名稱

> **Phase X: English Name**

---

## 階段資訊

| 屬性 | 值 |
|------|-----|
| **階段編號** | PX |
| **預計週數** | N-M 週 |
| **總任務數** | N |
| **前置條件** | PX-1 完成 |
| **完成目標** | 目標描述 |

---

## 階段目標

1. ✅ 目標 1
2. ✅ 目標 2

---

## 技術規格 (新增)

### 資料模型

```sql
-- Migration 範本
CREATE TABLE table_name (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ...
);
```

### API 規格

```typescript
// Request/Response 定義
interface CreateXxxRequest {
  field: string;
}

interface CreateXxxResponse {
  id: string;
  ...
}
```

### RLS 政策

```sql
-- RLS 範本
CREATE POLICY "policy_name" ON table_name
FOR SELECT USING (condition);
```

---

## 效能指標 (新增)

| 指標 | 目標值 |
|------|--------|
| LCP | < 2.5s |
| API P95 | < 500ms |
| 測試覆蓋率 | ≥ 80% |

---

## 任務清單

### PX-T01: 任務標題

| 屬性 | 值 |
|------|-----|
| **階段** | PX |
| **預估工時** | N 天 |
| **前置依賴** | PX-TYY |
| **負責角色** | 角色 |

#### 描述
詳細描述...

#### 執行步驟
1. 步驟 1
2. 步驟 2

#### 驗收標準
- [ ] 標準 1（可量化）
- [ ] 標準 2（可驗證）

#### 測試案例 (新增)
- 單元測試：`describe('xxx', () => { ... })`
- E2E 測試：`test('scenario', async () => { ... })`

#### 產出物
- `path/to/file.ts`

---

## PRD 對應 (新增)

| PRD Story | 任務編號 |
|-----------|----------|
| GH-XXX | PX-TYY |

---

## 階段完成檢查清單

- [ ] PX-T01: 任務 1
- [ ] PX-T02: 任務 2

---

## 風險與緩解 (新增)

| 風險 | 緩解措施 |
|------|----------|
| 風險 1 | 措施 1 |

---

## 下一階段

完成 PX 後，進入 [下一階段](./next.setc.md)
```

### 優先執行順序

1. **立即執行**：修正 SETC-07 格式
2. **短期執行**：為所有 SETC 增加技術規格章節
3. **中期執行**：增加測試案例與效能指標
4. **長期執行**：新增缺失的 SETC-08, 09, 10

### 依賴關係圖

```
SETC-01 (帳戶/藍圖)
    │
    ▼
SETC-02 (任務系統) ────────────────────┐
    │                                  │
    ├──────────┬──────────┐            │
    ▼          ▼          ▼            │
SETC-03    SETC-04    SETC-05          │
(檔案)     (日誌)     (進度)            │
    │          │          │            │
    └──────────┼──────────┘            │
               ▼                       │
           SETC-06 (品質驗收)          │
               │                       │
               ▼                       │
           SETC-07 (協作報表)          │
               │                       │
    ┌──────────┼──────────┐            │
    ▼          ▼          ▼            │
SETC-08    SETC-09    SETC-10          │
(問題追蹤) (離線同步) (系統管理) ◄──────┘
```

## 成果驗證

### Definition of Done (DoD)

- [ ] 所有 SETC 文件格式統一
- [ ] 每個 SETC 包含技術規格章節
- [ ] 每個任務有可量化的驗收標準
- [ ] PRD User Story 完整對應
- [ ] 缺失的 SETC-08, 09, 10 已建立

### Success Metrics

| 指標 | 目標 |
|------|------|
| 格式一致性 | 100% |
| PRD 覆蓋率 | 100% |
| 技術規格完整度 | ≥ 90% |
| 測試案例覆蓋 | 每任務至少 1 個 |

---

**研究完成時間**: 2025-11-27
**研究者**: Task Researcher
**下一步**: 提供具體的改進建議與行動計劃
