<!-- markdownlint-disable-file -->

# Task Research Notes: SETC 任務實施文件完整重構研究

> **選定方向**: C - 完整重構（含增強模板、PRD 補全、跨模組同步）

---

## 用戶指出的關鍵問題

### ❌ 問題 1: 容器層基礎設施缺失

**PRD 現狀**：
- 只提到基本的 Store/Service 結構
- 缺少 12 項關鍵基礎設施的具體設計
- 沒有說明這些基礎設施如何與業務模組整合

**影響**：
- ❌ 無法實現模組間解耦通訊（事件總線缺失）
- ❌ 無法實現跨模組搜尋（搜尋引擎缺失）
- ❌ 無法實現統一通知管理（通知中心缺失）
- ❌ 無法實現活動追蹤（時間軸服務缺失）

### ❌ 問題 2: 資料存取層設計不一致

**PRD 描述**：
- 第 1.3.2 節：已移除 `repositories/` 資料夾
- 第 8.7 節：資料夾結構中沒有 `repositories/`

**實際代碼**：
- `src/app/features/blueprint/data-access/repositories/` 已存在
- 包含：`blueprint.repository.ts`, `task.repository.ts`, `diary.repository.ts`, `todo.repository.ts`, `workspace.repository.ts`

**影響**：
- ❌ 設計與實作不一致，開發者會困惑
- ❌ 缺少 Repository 層會導致 Service 層直接操作 Supabase，違反分層原則
- ❌ 無法統一資料存取邏輯，難以測試與維護

### ❌ 問題 3: 資料庫設計空白

**PRD 現狀**：
- 第 8.8.3 節：所有核心資料表都標記為「⬜ 待建立」
- 第 8.9 節：只有 RLS 設計規範，但沒有具體的資料表結構
- 第 8.10.3 節：只有 SQL 片段，不是完整的資料表設計

**缺失的資料表設計**：
| 資料表 | PRD 狀態 | 說明 |
|--------|----------|------|
| `blueprints` | 有 SQL 但不完整 | 第 1399 行 |
| `tasks` | 有 SQL 但不完整 | 第 1420 行 |
| `task_attachments` | 有 SQL 但不完整 | 第 1459 行 |
| `diaries` | **完全缺失** | - |
| `diary_photos` | **完全缺失** | - |
| `files` | **完全缺失** | - |
| `checklists` | **完全缺失** | - |
| `task_acceptances` | 有 SQL 但不完整 | 第 1749 行 |

### ❌ 問題 4: 業務模組設計不完整

**進度追蹤模組 (PRD 4.5 節)**：
- 只有功能列表，沒有：
  - 資料模型設計
  - 進度計算邏輯（加權/等權）
  - 自動彙總演算法
  - 風險預警規則

**品質驗收模組 (PRD 4.6 節)**：
- 只有功能列表，沒有：
  - 檢查清單資料模型
  - 驗收流程狀態機
  - 驗收結果判定邏輯
  - 串驗收流程設計

**問題追蹤模組 (PRD 4.8 節)**：
- 只有功能列表，沒有：
  - 問題資料模型
  - 問題狀態流程
  - 跨分支同步機制

### ❌ 問題 5: 技術架構與需求不匹配

**架構文件 (system-architecture.md)**：
- 定義了 12 項容器層基礎設施
- 有詳細的藍圖角色系統
- 有完整的架構圖

**PRD 需求**：
- 只提到基本的 Store/Service 結構
- 業務模組不完整（缺少進度追蹤、品質驗收的詳細設計）
- 資料夾結構與架構文件不一致

**影響**：
- ❌ 架構文件與 PRD 脫節，開發者不知道該參考哪個
- ❌ 無法確保實施的一致性

---

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

### 完整 SETC 增強模板（可實施版本）

以下是完整的 SETC 模板，包含所有必要章節，確保可實施性：

```markdown
---
title: "SETC-XX: 階段名稱"
status: draft | in-progress | completed | blocked
created: YYYY-MM-DD
updated: YYYY-MM-DD
owners: [github-username]
progress: 0-100
due: YYYY-MM-DD | null
priority: critical | high | medium | low
estimated_weeks: N-M
---

# SETC-XX: 階段名稱

> **Phase X: English Name**

---

## 📋 階段資訊

| 屬性 | 值 |
|------|-----|
| **階段編號** | PX |
| **預計週數** | N-M 週 |
| **總任務數** | N |
| **前置條件** | SETC-YY 完成 |
| **完成目標** | 目標描述 |
| **核心依賴** | 依賴列表 |

---

## 🎯 階段目標

1. ✅ 目標 1（可量化）
2. ✅ 目標 2（可驗證）
3. ✅ 目標 3

---

## 🏗️ 技術架構

### 架構層級定位

```
┌─────────────────────────────────────────┐
│ 層級判斷：                               │
│                                          │
│ 問：涉及用戶/組織/認證嗎？               │
│ └── 是 → 基礎層 (Foundation)            │
│                                          │
│ 問：涉及藍圖/工作區/權限嗎？             │
│ └── 是 → 容器層 (Container)             │
│                                          │
│ 問：業務邏輯功能？                       │
│ └── 是 → 業務層 (Business)              │
└─────────────────────────────────────────┘
```

### 涉及的容器層基礎設施

| # | 基礎設施 | 是否涉及 | 用途 |
|---|----------|:--------:|------|
| 1 | 上下文注入 (Context Injection) | ☐ | |
| 2 | 權限系統 (RBAC) | ☐ | |
| 3 | 時間軸服務 (Timeline) | ☐ | |
| 4 | 通知中心 (Notification Hub) | ☐ | |
| 5 | 事件總線 (Event Bus) | ☐ | |
| 6 | 搜尋引擎 (Search Engine) | ☐ | |
| 7 | 關聯管理 (Relation Manager) | ☐ | |
| 8 | 資料隔離 (RLS) | ☐ | |
| 9 | 生命週期 (Lifecycle) | ☐ | |
| 10 | 配置中心 (Config Center) | ☐ | |
| 11 | 元數據系統 (Metadata) | ☐ | |
| 12 | API 閘道 (API Gateway) | ☐ | |

### 模組依賴圖

```
[本階段] ──依賴──→ [前置模組]
    │
    ├── [子模組 1]
    ├── [子模組 2]
    └── [子模組 3]
```

---

## 💾 資料模型設計

### 資料表結構

#### 表名：`table_name`

| 欄位 | 類型 | 約束 | 說明 |
|------|------|------|------|
| `id` | `UUID` | PK, DEFAULT gen_random_uuid() | 主鍵 |
| `blueprint_id` | `UUID` | FK → blueprints(id) | 所屬藍圖 |
| `created_by` | `UUID` | FK → accounts(id) | 建立者 |
| `created_at` | `TIMESTAMPTZ` | DEFAULT now() | 建立時間 |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT now() | 更新時間 |
| `deleted_at` | `TIMESTAMPTZ` | NULL | 軟刪除時間 |

#### 完整 Migration SQL

```sql
-- Migration: YYYYMMDD_create_table_name.sql
-- 描述: 建立 table_name 資料表

CREATE TABLE IF NOT EXISTS public.table_name (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    created_by UUID NOT NULL REFERENCES accounts(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- 索引
CREATE INDEX idx_table_name_blueprint_id ON table_name(blueprint_id);
CREATE INDEX idx_table_name_status ON table_name(status);
CREATE INDEX idx_table_name_created_at ON table_name(created_at);

-- 觸發器：自動更新 updated_at
CREATE OR REPLACE FUNCTION update_table_name_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_table_name_updated_at
    BEFORE UPDATE ON table_name
    FOR EACH ROW
    EXECUTE FUNCTION update_table_name_updated_at();

-- 啟用 RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

### RLS 政策設計

```sql
-- RLS 政策：table_name

-- SELECT: 藍圖成員可查看
CREATE POLICY "table_name_select_policy"
ON table_name FOR SELECT
USING (
    blueprint_id IN (
        SELECT blueprint_id FROM blueprint_members
        WHERE account_id = auth.uid()
    )
);

-- INSERT: 藍圖成員可新增
CREATE POLICY "table_name_insert_policy"
ON table_name FOR INSERT
WITH CHECK (
    blueprint_id IN (
        SELECT blueprint_id FROM blueprint_members
        WHERE account_id = auth.uid()
        AND role IN ('owner', 'admin', 'member')
    )
);

-- UPDATE: 建立者或管理員可更新
CREATE POLICY "table_name_update_policy"
ON table_name FOR UPDATE
USING (
    created_by = auth.uid()
    OR
    blueprint_id IN (
        SELECT blueprint_id FROM blueprint_members
        WHERE account_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
);

-- DELETE: 軟刪除，只有建立者或管理員可執行
CREATE POLICY "table_name_delete_policy"
ON table_name FOR UPDATE
USING (
    created_by = auth.uid()
    OR
    blueprint_id IN (
        SELECT blueprint_id FROM blueprint_members
        WHERE account_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
);
```

---

## 📝 TypeScript 類型定義

### Domain Types

```typescript
// src/app/features/{feature}/domain/types/{entity}.types.ts

/**
 * Entity 狀態枚舉
 */
export enum EntityStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/**
 * Entity 基本介面（對應資料表）
 */
export interface Entity {
  id: string;
  blueprintId: string;
  name: string;
  description?: string;
  status: EntityStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

/**
 * 建立 Entity DTO
 */
export interface CreateEntityDto {
  blueprintId: string;
  name: string;
  description?: string;
}

/**
 * 更新 Entity DTO
 */
export interface UpdateEntityDto {
  name?: string;
  description?: string;
  status?: EntityStatus;
}

/**
 * Entity 查詢參數
 */
export interface EntityQueryParams {
  blueprintId: string;
  status?: EntityStatus;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: keyof Entity;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Entity 列表回應
 */
export interface EntityListResponse {
  data: Entity[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

### Repository 介面

```typescript
// src/app/features/{feature}/data-access/repositories/{entity}.repository.ts

import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '@core/services/supabase.service';
import { Entity, CreateEntityDto, UpdateEntityDto, EntityQueryParams, EntityListResponse } from '../../domain/types/{entity}.types';

@Injectable({ providedIn: 'root' })
export class EntityRepository {
  private readonly supabase = inject(SupabaseService);
  private readonly TABLE = 'table_name';

  /**
   * 根據藍圖 ID 取得列表
   */
  async findByBlueprint(params: EntityQueryParams): Promise<EntityListResponse> {
    const { blueprintId, status, search, page = 1, pageSize = 20, sortBy = 'createdAt', sortOrder = 'desc' } = params;
    
    let query = this.supabase.client
      .from(this.TABLE)
      .select('*', { count: 'exact' })
      .eq('blueprint_id', blueprintId)
      .is('deleted_at', null);

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query
      .order(this.camelToSnake(sortBy), { ascending: sortOrder === 'asc' })
      .range(from, to);

    if (error) throw error;

    return {
      data: (data ?? []).map(this.mapToEntity),
      total: count ?? 0,
      page,
      pageSize,
      totalPages: Math.ceil((count ?? 0) / pageSize),
    };
  }

  /**
   * 根據 ID 取得單筆
   */
  async findById(id: string): Promise<Entity | null> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) throw error;
    return data ? this.mapToEntity(data) : null;
  }

  /**
   * 新增
   */
  async create(dto: CreateEntityDto): Promise<Entity> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .insert({
        blueprint_id: dto.blueprintId,
        name: dto.name,
        description: dto.description,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapToEntity(data);
  }

  /**
   * 更新
   */
  async update(id: string, dto: UpdateEntityDto): Promise<Entity> {
    const updateData: Record<string, unknown> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.status !== undefined) updateData.status = dto.status;

    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.mapToEntity(data);
  }

  /**
   * 軟刪除
   */
  async softDelete(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from(this.TABLE)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }

  private mapToEntity(row: Record<string, unknown>): Entity {
    return {
      id: row['id'] as string,
      blueprintId: row['blueprint_id'] as string,
      name: row['name'] as string,
      description: row['description'] as string | undefined,
      status: row['status'] as EntityStatus,
      createdBy: row['created_by'] as string,
      createdAt: new Date(row['created_at'] as string),
      updatedAt: new Date(row['updated_at'] as string),
      deletedAt: row['deleted_at'] ? new Date(row['deleted_at'] as string) : undefined,
    };
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}
```

### Store 設計 (Signals)

```typescript
// src/app/features/{feature}/data-access/stores/{entity}.store.ts

import { Injectable, computed, inject, signal } from '@angular/core';
import { EntityRepository } from '../repositories/{entity}.repository';
import { Entity, CreateEntityDto, UpdateEntityDto, EntityQueryParams, EntityStatus } from '../../domain/types/{entity}.types';

@Injectable({ providedIn: 'root' })
export class EntityStore {
  private readonly repository = inject(EntityRepository);

  // Private state
  private readonly _entities = signal<Entity[]>([]);
  private readonly _selectedEntity = signal<Entity | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _total = signal(0);
  private readonly _page = signal(1);
  private readonly _pageSize = signal(20);

  // Public readonly state
  readonly entities = this._entities.asReadonly();
  readonly selectedEntity = this._selectedEntity.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly total = this._total.asReadonly();
  readonly page = this._page.asReadonly();
  readonly pageSize = this._pageSize.asReadonly();

  // Computed properties
  readonly activeEntities = computed(() =>
    this._entities().filter(e => e.status === EntityStatus.ACTIVE)
  );

  readonly entityCount = computed(() => this._entities().length);

  readonly hasEntities = computed(() => this._entities().length > 0);

  readonly totalPages = computed(() =>
    Math.ceil(this._total() / this._pageSize())
  );

  /**
   * 載入列表
   */
  async loadEntities(params: EntityQueryParams): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const response = await this.repository.findByBlueprint(params);
      this._entities.set(response.data);
      this._total.set(response.total);
      this._page.set(response.page);
      this._pageSize.set(response.pageSize);
    } catch (error) {
      this._error.set('載入資料失敗，請稍後再試');
      console.error('[EntityStore] loadEntities error:', error);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * 載入單筆
   */
  async loadEntity(id: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const entity = await this.repository.findById(id);
      this._selectedEntity.set(entity);
    } catch (error) {
      this._error.set('載入資料失敗，請稍後再試');
      console.error('[EntityStore] loadEntity error:', error);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * 新增
   */
  async createEntity(dto: CreateEntityDto): Promise<Entity | null> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const entity = await this.repository.create(dto);
      this._entities.update(entities => [...entities, entity]);
      return entity;
    } catch (error) {
      this._error.set('新增失敗，請稍後再試');
      console.error('[EntityStore] createEntity error:', error);
      return null;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * 更新
   */
  async updateEntity(id: string, dto: UpdateEntityDto): Promise<Entity | null> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const entity = await this.repository.update(id, dto);
      this._entities.update(entities =>
        entities.map(e => (e.id === id ? entity : e))
      );
      if (this._selectedEntity()?.id === id) {
        this._selectedEntity.set(entity);
      }
      return entity;
    } catch (error) {
      this._error.set('更新失敗，請稍後再試');
      console.error('[EntityStore] updateEntity error:', error);
      return null;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * 軟刪除
   */
  async deleteEntity(id: string): Promise<boolean> {
    this._loading.set(true);
    this._error.set(null);

    try {
      await this.repository.softDelete(id);
      this._entities.update(entities => entities.filter(e => e.id !== id));
      if (this._selectedEntity()?.id === id) {
        this._selectedEntity.set(null);
      }
      return true;
    } catch (error) {
      this._error.set('刪除失敗，請稍後再試');
      console.error('[EntityStore] deleteEntity error:', error);
      return false;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * 重置狀態
   */
  reset(): void {
    this._entities.set([]);
    this._selectedEntity.set(null);
    this._loading.set(false);
    this._error.set(null);
    this._total.set(0);
    this._page.set(1);
  }
}
```

---

## 📊 效能指標

| 指標類型 | 指標名稱 | 目標值 | 測量方式 |
|----------|----------|--------|----------|
| 前端效能 | LCP (Largest Contentful Paint) | < 2.5s | Lighthouse |
| 前端效能 | FID (First Input Delay) | < 100ms | Web Vitals |
| 前端效能 | CLS (Cumulative Layout Shift) | < 0.1 | Web Vitals |
| API 效能 | P50 Latency | < 200ms | APM |
| API 效能 | P95 Latency | < 500ms | APM |
| API 效能 | P99 Latency | < 1s | APM |
| 資料庫 | 查詢 P95 | < 100ms | Supabase Dashboard |
| 測試 | 單元測試覆蓋率 | ≥ 80% | Jest Coverage |
| 測試 | E2E 測試通過率 | 100% | Playwright |

---

## 🧪 測試策略

### 測試金字塔

```
        /\
       /  \
      / E2E \     (少量，高價值)
     /──────\
    /   整合  \    (適量，關鍵路徑)
   /──────────\
  /    單元     \   (大量，快速回饋)
 /──────────────\
```

### 單元測試範例

```typescript
// src/app/features/{feature}/data-access/stores/{entity}.store.spec.ts

import { TestBed } from '@angular/core/testing';
import { EntityStore } from './{entity}.store';
import { EntityRepository } from '../repositories/{entity}.repository';
import { EntityStatus } from '../../domain/types/{entity}.types';

describe('EntityStore', () => {
  let store: EntityStore;
  let repositoryMock: jasmine.SpyObj<EntityRepository>;

  beforeEach(() => {
    repositoryMock = jasmine.createSpyObj('EntityRepository', [
      'findByBlueprint',
      'findById',
      'create',
      'update',
      'softDelete',
    ]);

    TestBed.configureTestingModule({
      providers: [
        EntityStore,
        { provide: EntityRepository, useValue: repositoryMock },
      ],
    });

    store = TestBed.inject(EntityStore);
  });

  describe('loadEntities', () => {
    it('loadEntities_whenBlueprintIdValid_shouldReturnEntities', async () => {
      // Arrange
      const mockResponse = {
        data: [{ id: '1', name: 'Test', status: EntityStatus.ACTIVE }],
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      };
      repositoryMock.findByBlueprint.and.returnValue(Promise.resolve(mockResponse));

      // Act
      await store.loadEntities({ blueprintId: 'bp-1' });

      // Assert
      expect(store.entities().length).toBe(1);
      expect(store.total()).toBe(1);
      expect(store.loading()).toBeFalse();
      expect(store.error()).toBeNull();
    });

    it('loadEntities_whenRepositoryFails_shouldSetError', async () => {
      // Arrange
      repositoryMock.findByBlueprint.and.rejectWith(new Error('Network error'));

      // Act
      await store.loadEntities({ blueprintId: 'bp-1' });

      // Assert
      expect(store.entities().length).toBe(0);
      expect(store.error()).toBe('載入資料失敗，請稍後再試');
      expect(store.loading()).toBeFalse();
    });
  });

  describe('createEntity', () => {
    it('createEntity_whenValidDto_shouldAddToEntities', async () => {
      // Arrange
      const mockEntity = { id: '1', name: 'New Entity', status: EntityStatus.DRAFT };
      repositoryMock.create.and.returnValue(Promise.resolve(mockEntity));

      // Act
      const result = await store.createEntity({ blueprintId: 'bp-1', name: 'New Entity' });

      // Assert
      expect(result).toEqual(mockEntity);
      expect(store.entities()).toContain(mockEntity);
    });
  });
});
```

### E2E 測試範例

```typescript
// e2e/{feature}/{entity}.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Entity Module', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate
    await page.goto('/blueprint/1/entity');
    await page.waitForSelector('[data-testid="entity-list"]');
  });

  test('entity_list_shouldDisplayEntities', async ({ page }) => {
    // Assert
    await expect(page.locator('[data-testid="entity-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="entity-item"]')).toHaveCount.greaterThan(0);
  });

  test('entity_create_shouldAddNewEntity', async ({ page }) => {
    // Arrange
    await page.click('[data-testid="create-entity-btn"]');
    await page.waitForSelector('[data-testid="entity-form"]');

    // Act
    await page.fill('[data-testid="entity-name-input"]', 'Test Entity');
    await page.click('[data-testid="entity-submit-btn"]');

    // Assert
    await expect(page.locator('text=Test Entity')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test('entity_update_shouldModifyEntity', async ({ page }) => {
    // Arrange
    await page.click('[data-testid="entity-item"]:first-child');
    await page.click('[data-testid="edit-entity-btn"]');

    // Act
    await page.fill('[data-testid="entity-name-input"]', 'Updated Entity');
    await page.click('[data-testid="entity-submit-btn"]');

    // Assert
    await expect(page.locator('text=Updated Entity')).toBeVisible();
  });

  test('entity_delete_shouldRemoveEntity', async ({ page }) => {
    // Arrange
    const initialCount = await page.locator('[data-testid="entity-item"]').count();
    await page.click('[data-testid="entity-item"]:first-child');
    await page.click('[data-testid="delete-entity-btn"]');
    await page.click('[data-testid="confirm-delete-btn"]');

    // Assert
    await expect(page.locator('[data-testid="entity-item"]')).toHaveCount(initialCount - 1);
  });
});
```

---

## 📁 任務清單

### PX-T01: 任務標題

| 屬性 | 值 |
|------|-----|
| **階段** | PX |
| **預估工時** | N 天 |
| **前置依賴** | PX-TYY, SETC-ZZ |
| **負責角色** | 前端工程師 / 後端工程師 / 全端工程師 |
| **優先級** | critical / high / medium / low |

#### 描述
詳細描述任務目標和背景...

#### 技術決策
- 選用 XXX 技術的原因
- 與現有架構的整合方式

#### 執行步驟
1. **步驟 1**: 詳細說明
   - 子步驟 1.1
   - 子步驟 1.2
2. **步驟 2**: 詳細說明
3. **步驟 3**: 詳細說明

#### 驗收標準
- [ ] 標準 1（可量化：例如「API 回應時間 < 200ms」）
- [ ] 標準 2（可驗證：例如「所有 E2E 測試通過」）
- [ ] 標準 3（功能性：例如「可成功建立新記錄」）

#### 測試案例

**單元測試**:
```typescript
describe('TaskTitle', () => {
  it('methodName_condition_expectedResult', () => {
    // Test implementation
  });
});
```

**E2E 測試**:
```typescript
test('scenario description', async ({ page }) => {
  // Test implementation
});
```

#### 產出物
- `supabase/migrations/YYYYMMDD_xxx.sql`
- `src/app/features/{feature}/domain/types/{entity}.types.ts`
- `src/app/features/{feature}/data-access/repositories/{entity}.repository.ts`
- `src/app/features/{feature}/data-access/stores/{entity}.store.ts`
- `e2e/{feature}/{entity}.spec.ts`

#### 安全考量
- RLS 政策確保資料隔離
- 輸入驗證防止注入攻擊

#### 效能考量
- 使用索引優化查詢
- 實作分頁避免大量資料載入

---

## 📋 PRD 對應

| PRD User Story | 對應任務 | 狀態 |
|----------------|----------|------|
| GH-XXX | PX-TYY | ⬜ 待開始 |
| GH-YYY | PX-TZZ | ⬜ 待開始 |

---

## ⚠️ 風險與緩解

| 風險 | 機率 | 影響 | 緩解措施 |
|------|:----:|:----:|----------|
| 風險 1 描述 | 高/中/低 | 高/中/低 | 緩解措施描述 |
| 風險 2 描述 | 高/中/低 | 高/中/低 | 緩解措施描述 |

---

## ✅ 階段完成檢查清單

### 任務完成度
- [ ] PX-T01: 任務 1
- [ ] PX-T02: 任務 2
- [ ] PX-T03: 任務 3

### 品質檢查
- [ ] 所有單元測試通過 (coverage ≥ 80%)
- [ ] 所有 E2E 測試通過
- [ ] 效能指標達標 (LCP < 2.5s, API P95 < 500ms)
- [ ] 安全審計通過 (RLS 政策驗證)
- [ ] 代碼審查完成
- [ ] 文件更新完成

### 整合驗證
- [ ] 與前置模組整合測試通過
- [ ] 與容器層基礎設施整合正常
- [ ] 權限系統運作正確

---

## 📚 相關文檔

- [PRD: Construction Site Management](../../prd/construction-site-management.md)
- [系統架構](../../architecture/system-architecture.md)
- [SETC 索引](./README.md)
- [前置階段: SETC-XX](./prev.setc.md)
- [下一階段: SETC-YY](./next.setc.md)

---

**最後更新**: YYYY-MM-DD
**擁有者**: @github-username
```

### 優先執行順序

1. **立即執行**：修正 SETC-07 格式
2. **短期執行**：為所有 SETC 增加技術規格章節
3. **中期執行**：增加測試案例與效能指標
4. **長期執行**：新增缺失的 SETC-08, 09, 10

---

## 🏗️ 12 項容器層基礎設施設計

用戶指出 PRD 缺少 12 項關鍵基礎設施的具體設計。以下是完整的設計規劃：

### 1. 上下文注入 (Context Injection)

**目的**: 自動注入 Blueprint/User/Permissions 到元件和服務

```typescript
// src/app/core/facades/workspace-context.facade.ts

export interface WorkspaceContext {
  contextType: 'user' | 'organization' | 'team' | 'bot';
  accountId: string;
  organizationId?: string;
  teamId?: string;
  permissions: string[];
}

@Injectable({ providedIn: 'root' })
export class WorkspaceContextFacade {
  private readonly _context = signal<WorkspaceContext | null>(null);
  readonly currentContext = this._context.asReadonly();
  readonly contextType = computed(() => this._context()?.contextType);
  readonly permissions = computed(() => this._context()?.permissions ?? []);

  hasPermission(permission: string): boolean {
    return this.permissions().includes(permission);
  }

  setContext(context: WorkspaceContext): void {
    this._context.set(context);
  }
}
```

### 2. 權限系統 (RBAC)

**目的**: 多層級角色權限控制

```typescript
// src/app/core/guards/permission.guard.ts

export interface Permission {
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
  resource: string;
}

export enum BlueprintRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  PROJECT_MANAGER = 'project_manager',
  SITE_DIRECTOR = 'site_director',
  WORKER = 'worker',
  QA_STAFF = 'qa_staff',
  OBSERVER = 'observer',
}

// 角色權限映射表
export const ROLE_PERMISSIONS: Record<BlueprintRole, Permission[]> = {
  [BlueprintRole.OWNER]: [
    { action: 'manage', resource: '*' },
  ],
  [BlueprintRole.ADMIN]: [
    { action: 'create', resource: 'task' },
    { action: 'update', resource: 'task' },
    { action: 'delete', resource: 'task' },
    // ...
  ],
  // ...
};
```

### 3. 時間軸服務 (Timeline Service)

**目的**: 跨模組活動追蹤

```sql
-- supabase/migrations/xxx_create_activities.sql

CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES accounts(id),
    action VARCHAR(100) NOT NULL, -- 'task.created', 'diary.updated', etc.
    entity_type VARCHAR(50) NOT NULL, -- 'task', 'diary', 'checklist'
    entity_id UUID NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activities_blueprint_id ON activities(blueprint_id);
CREATE INDEX idx_activities_entity ON activities(entity_type, entity_id);
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);
```

```typescript
// src/app/core/services/activity.service.ts

@Injectable({ providedIn: 'root' })
export class ActivityService {
  async logActivity(activity: CreateActivityDto): Promise<void> {
    await this.supabase.client.from('activities').insert(activity);
  }

  async getTimeline(blueprintId: string, params: TimelineParams): Promise<Activity[]> {
    // ...
  }
}
```

### 4. 通知中心 (Notification Hub)

**目的**: 多渠道通知路由

```sql
-- supabase/migrations/xxx_create_notifications.sql

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES accounts(id),
    type VARCHAR(50) NOT NULL, -- 'task_assigned', 'mention', 'deadline_reminder'
    title VARCHAR(255) NOT NULL,
    content TEXT,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    action_url VARCHAR(500),
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, is_read);
```

```typescript
// src/app/core/services/notification.service.ts

@Injectable({ providedIn: 'root' })
export class NotificationService {
  async send(notification: CreateNotificationDto): Promise<void> { }
  async markAsRead(id: string): Promise<void> { }
  async markAllAsRead(recipientId: string): Promise<void> { }
  subscribeToNotifications(userId: string): Observable<Notification> { }
}
```

### 5. 事件總線 (Event Bus)

**目的**: 模組間解耦通訊

```typescript
// src/app/core/services/event-bus.service.ts

export interface DomainEvent<T = unknown> {
  type: string;
  payload: T;
  timestamp: Date;
  metadata: {
    blueprintId: string;
    actorId: string;
    correlationId?: string;
  };
}

@Injectable({ providedIn: 'root' })
export class EventBusService {
  private readonly eventSubject = new Subject<DomainEvent>();

  publish<T>(event: DomainEvent<T>): void {
    this.eventSubject.next(event);
  }

  on<T>(eventType: string): Observable<DomainEvent<T>> {
    return this.eventSubject.pipe(
      filter(e => e.type === eventType)
    );
  }

  onMultiple<T>(eventTypes: string[]): Observable<DomainEvent<T>> {
    return this.eventSubject.pipe(
      filter(e => eventTypes.includes(e.type))
    );
  }
}

// 事件類型定義
export const DOMAIN_EVENTS = {
  TASK_CREATED: 'task.created',
  TASK_UPDATED: 'task.updated',
  TASK_COMPLETED: 'task.completed',
  TASK_DELETED: 'task.deleted',
  DIARY_CREATED: 'diary.created',
  CHECKLIST_COMPLETED: 'checklist.completed',
  // ...
} as const;
```

### 6. 搜尋引擎 (Search Engine)

**目的**: 跨模組全文檢索

```sql
-- supabase/migrations/xxx_create_search_index.sql

-- 使用 PostgreSQL 全文搜尋
CREATE TABLE search_index (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT,
    search_vector TSVECTOR,
    metadata JSONB DEFAULT '{}',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_search_index_vector ON search_index USING GIN(search_vector);
CREATE INDEX idx_search_index_blueprint ON search_index(blueprint_id);

-- 觸發器：自動更新 search_vector
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('chinese', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('chinese', COALESCE(NEW.content, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_search_vector
    BEFORE INSERT OR UPDATE ON search_index
    FOR EACH ROW
    EXECUTE FUNCTION update_search_vector();
```

### 7. 關聯管理 (Relation Manager)

**目的**: 跨模組資源引用

```sql
-- supabase/migrations/xxx_create_entity_relations.sql

CREATE TABLE entity_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
    source_type VARCHAR(50) NOT NULL,
    source_id UUID NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id UUID NOT NULL,
    relation_type VARCHAR(50) NOT NULL, -- 'depends_on', 'blocks', 'relates_to', 'parent_of'
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(source_type, source_id, target_type, target_id, relation_type)
);

CREATE INDEX idx_relations_source ON entity_relations(source_type, source_id);
CREATE INDEX idx_relations_target ON entity_relations(target_type, target_id);
```

### 8. 資料隔離 (RLS)

**目的**: 多租戶資料隔離

參見上方「RLS 政策設計」章節的完整範例。

### 9. 生命週期 (Lifecycle)

**目的**: 實體狀態管理 (Draft/Active/Archived/Deleted)

```typescript
// src/app/core/domain/lifecycle.types.ts

export enum LifecycleStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DELETED = 'deleted',
}

export interface LifecycleEntity {
  status: LifecycleStatus;
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date;
  deletedAt?: Date;
}

export interface LifecycleTransition {
  from: LifecycleStatus;
  to: LifecycleStatus;
  allowedRoles: string[];
}

export const LIFECYCLE_TRANSITIONS: LifecycleTransition[] = [
  { from: LifecycleStatus.DRAFT, to: LifecycleStatus.ACTIVE, allowedRoles: ['owner', 'admin'] },
  { from: LifecycleStatus.ACTIVE, to: LifecycleStatus.ARCHIVED, allowedRoles: ['owner', 'admin'] },
  { from: LifecycleStatus.ARCHIVED, to: LifecycleStatus.ACTIVE, allowedRoles: ['owner', 'admin'] },
  { from: LifecycleStatus.ACTIVE, to: LifecycleStatus.DELETED, allowedRoles: ['owner'] },
];
```

### 10. 配置中心 (Config Center)

**目的**: 藍圖級配置管理

```sql
-- supabase/migrations/xxx_create_blueprint_configs.sql

CREATE TABLE blueprint_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
    config_key VARCHAR(100) NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(blueprint_id, config_key)
);
```

```typescript
// src/app/core/services/config.service.ts

@Injectable({ providedIn: 'root' })
export class BlueprintConfigService {
  async getConfig<T>(blueprintId: string, key: string, defaultValue: T): Promise<T> { }
  async setConfig<T>(blueprintId: string, key: string, value: T): Promise<void> { }
}
```

### 11. 元數據系統 (Metadata)

**目的**: 自訂欄位支援

```sql
-- supabase/migrations/xxx_create_custom_fields.sql

CREATE TABLE custom_field_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL, -- 'task', 'diary', etc.
    field_name VARCHAR(100) NOT NULL,
    field_type VARCHAR(50) NOT NULL, -- 'text', 'number', 'date', 'select', 'multi_select'
    field_options JSONB DEFAULT '{}', -- For select types
    is_required BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(blueprint_id, entity_type, field_name)
);

CREATE TABLE custom_field_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_definition_id UUID NOT NULL REFERENCES custom_field_definitions(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(field_definition_id, entity_id)
);
```

### 12. API 閘道 (API Gateway)

**目的**: 對外 API 統一入口

```typescript
// src/app/core/interceptors/api-gateway.interceptor.ts

@Injectable()
export class ApiGatewayInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // 統一處理：
    // - 認證 Token 注入
    // - 請求/回應日誌
    // - 錯誤處理
    // - 重試邏輯
    // - 速率限制
  }
}
```

---

## 📊 完整的缺失資料表設計

### `diaries` - 施工日誌表

```sql
CREATE TABLE diaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
    work_date DATE NOT NULL,
    weather VARCHAR(50), -- 'sunny', 'cloudy', 'rainy', 'stormy', 'snowy', 'foggy'
    temperature_high DECIMAL(4,1),
    temperature_low DECIMAL(4,1),
    work_summary TEXT,
    worker_count INTEGER DEFAULT 0,
    work_hours DECIMAL(4,1) DEFAULT 0,
    safety_notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- 'draft', 'submitted', 'approved', 'rejected'
    submitted_at TIMESTAMPTZ,
    approved_by UUID REFERENCES accounts(id),
    approved_at TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES accounts(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(blueprint_id, work_date)
);

CREATE INDEX idx_diaries_blueprint ON diaries(blueprint_id);
CREATE INDEX idx_diaries_work_date ON diaries(work_date);
CREATE INDEX idx_diaries_status ON diaries(status);
```

### `diary_photos` - 日誌照片表

```sql
CREATE TABLE diary_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diary_id UUID NOT NULL REFERENCES diaries(id) ON DELETE CASCADE,
    file_id UUID NOT NULL REFERENCES files(id),
    caption VARCHAR(500),
    taken_at TIMESTAMPTZ,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_diary_photos_diary ON diary_photos(diary_id);
```

### `files` - 檔案表

```sql
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
    storage_path VARCHAR(500) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    checksum VARCHAR(64), -- SHA-256
    uploaded_by UUID NOT NULL REFERENCES accounts(id),
    is_public BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_files_blueprint ON files(blueprint_id);
CREATE INDEX idx_files_uploaded_by ON files(uploaded_by);
```

### `checklists` - 檢查清單表

```sql
CREATE TABLE checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100), -- 'quality', 'safety', 'compliance'
    is_template BOOLEAN DEFAULT false,
    created_by UUID NOT NULL REFERENCES accounts(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE checklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checklist_id UUID NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    required BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE checklist_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checklist_id UUID NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id),
    inspector_id UUID NOT NULL REFERENCES accounts(id),
    inspection_date DATE NOT NULL,
    overall_result VARCHAR(50) NOT NULL, -- 'passed', 'failed', 'conditional'
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE checklist_item_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checklist_result_id UUID NOT NULL REFERENCES checklist_results(id) ON DELETE CASCADE,
    checklist_item_id UUID NOT NULL REFERENCES checklist_items(id),
    is_checked BOOLEAN DEFAULT false,
    result VARCHAR(50), -- 'pass', 'fail', 'na'
    notes TEXT,
    photo_ids UUID[] DEFAULT '{}'
);
```

---

## 📋 缺失的 SETC 規劃

### SETC-08: 問題追蹤系統 (Issue Tracking)

**覆蓋 PRD**: GH-026 ~ GH-028

**核心資料表**:

```sql
CREATE TABLE issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    severity VARCHAR(50) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    status VARCHAR(50) NOT NULL DEFAULT 'new', -- 'new', 'assigned', 'in_progress', 'pending_confirm', 'resolved', 'closed', 'reopened'
    category VARCHAR(100), -- 'defect', 'safety', 'quality', 'other'
    related_task_id UUID REFERENCES tasks(id),
    assignee_id UUID REFERENCES accounts(id),
    reporter_id UUID NOT NULL REFERENCES accounts(id),
    due_date DATE,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES accounts(id),
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);
```

**狀態流程圖**:

```
[新建] ──→ [已指派] ──→ [處理中] ──→ [待確認] ──→ [已解決] ──→ [已關閉]
                            │                        │
                            └────────────────────────┴──→ [已重開]
```

### SETC-09: 離線與同步 (Offline & Sync)

**覆蓋 PRD**: GH-035 ~ GH-037

**核心設計**:

```typescript
// src/app/core/services/offline-sync.service.ts

interface SyncQueueItem {
  id: string;
  operation: 'create' | 'update' | 'delete';
  entityType: string;
  entityId: string;
  payload: unknown;
  timestamp: Date;
  retryCount: number;
}

@Injectable({ providedIn: 'root' })
export class OfflineSyncService {
  private readonly db = new Dexie('GigHubOffline');
  private readonly syncQueue = signal<SyncQueueItem[]>([]);
  
  async queueOperation(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>): Promise<void> { }
  async syncAll(): Promise<void> { }
  async resolveConflict(localItem: SyncQueueItem, serverItem: unknown): Promise<void> { }
}
```

### SETC-10: 系統管理 (System Administration)

**覆蓋 PRD**: GH-038 ~ GH-040

**功能模組**:
- 用戶管理（邀請、停用、角色變更）
- 組織設定（基本資訊、訂閱方案）
- 系統監控（使用量統計、錯誤日誌）
- 資料匯出/匯入
- 審計日誌查詢

### 依賴關係圖

```
                        ┌────────────────────────────────────────┐
                        │         SETC-00: 基礎架構               │
                        │   (12 項容器層基礎設施 + 資料表設計)     │
                        └────────────────────┬───────────────────┘
                                             │
                        ┌────────────────────▼───────────────────┐
                        │      SETC-01: 帳戶藍圖增強              │
                        │        (帳戶體系 + 藍圖系統)            │
                        └────────────────────┬───────────────────┘
                                             │
                        ┌────────────────────▼───────────────────┐
                        │      SETC-02: 任務系統生產級            │
                        │    (核心任務 CRUD + 樹狀 + Gantt)       │
                        └────────────────────┬───────────────────┘
                                             │
         ┌───────────────────────────────────┼───────────────────────────────────┐
         │                                   │                                   │
┌────────▼────────┐               ┌─────────▼─────────┐               ┌─────────▼─────────┐
│   SETC-03       │               │    SETC-04        │               │    SETC-05        │
│   檔案系統       │               │    日誌系統        │               │    進度儀表板      │
│  (上傳/預覽)     │               │   (施工日誌)       │               │   (圖表/統計)      │
└────────┬────────┘               └─────────┬─────────┘               └─────────┬─────────┘
         │                                   │                                   │
         └───────────────────────────────────┼───────────────────────────────────┘
                                             │
                        ┌────────────────────▼───────────────────┐
                        │      SETC-06: 品質驗收                  │
                        │   (檢查清單 + 驗收流程 + 簽核)          │
                        └────────────────────┬───────────────────┘
                                             │
                        ┌────────────────────▼───────────────────┐
                        │      SETC-07: 協作報表上線              │
                        │   (通知 + 評論 + 報表 + 上線)          │
                        └────────────────────┬───────────────────┘
                                             │
         ┌───────────────────────────────────┼───────────────────────────────────┐
         │                                   │                                   │
┌────────▼────────┐               ┌─────────▼─────────┐               ┌─────────▼─────────┐
│   SETC-08       │               │    SETC-09        │               │    SETC-10        │
│   問題追蹤       │               │    離線同步        │               │    系統管理        │
│  (GH-026~028)   │               │   (GH-035~037)    │               │   (GH-038~040)    │
└─────────────────┘               └───────────────────┘               └───────────────────┘
```

---

## ✅ 完整執行計劃 (方向 C)

### 第一階段：基礎修復 (1-2 週)

| 任務 | 描述 | 優先級 |
|------|------|:------:|
| C-01 | 新增 SETC-00：基礎架構設計文件 | 🔴 最高 |
| C-02 | 12 項容器層基礎設施完整設計 | 🔴 最高 |
| C-03 | 缺失資料表完整 SQL 設計 | 🔴 最高 |
| C-04 | 統一 SETC-07 格式 | 🟠 高 |

### 第二階段：全面增強 (2-3 週)

| 任務 | 描述 | 優先級 |
|------|------|:------:|
| C-05 | SETC-01~06 增加技術規格章節 | 🟠 高 |
| C-06 | SETC-01~06 增加完整 TypeScript 類型定義 | 🟠 高 |
| C-07 | SETC-01~06 增加 Repository 模板 | 🟠 高 |
| C-08 | SETC-01~06 增加 Store 模板 | 🟠 高 |
| C-09 | SETC-01~06 增加效能指標 | 🟡 中 |
| C-10 | SETC-01~06 增加測試案例 | 🟡 中 |

### 第三階段：補充缺失 (2-3 週)

| 任務 | 描述 | 優先級 |
|------|------|:------:|
| C-11 | 新增 SETC-08：問題追蹤系統 | 🟠 高 |
| C-12 | 新增 SETC-09：離線與同步 | 🟡 中 |
| C-13 | 新增 SETC-10：系統管理 | 🟡 中 |

### 第四階段：PRD 同步更新 (1 週)

| 任務 | 描述 | 優先級 |
|------|------|:------:|
| C-14 | PRD 增加 Repository 層說明（與代碼同步） | 🟠 高 |
| C-15 | PRD 增加 12 項基礎設施參考 | 🟠 高 |
| C-16 | PRD 增加完整資料表設計 | 🟠 高 |
| C-17 | PRD 增加業務模組詳細設計（進度追蹤、品質驗收） | 🟠 高 |

---

## 成果驗證

### Definition of Done (DoD)

- [ ] 所有 SETC 文件格式統一
- [ ] 每個 SETC 包含完整技術規格章節
- [ ] 每個任務有可量化的驗收標準
- [ ] PRD User Story 100% 對應
- [ ] 12 項容器層基礎設施有具體設計
- [ ] 所有核心資料表有完整 SQL
- [ ] Repository 層設計與代碼一致
- [ ] 缺失的 SETC-08, 09, 10 已建立

### Success Metrics

| 指標 | 目標 |
|------|------|
| 格式一致性 | 100% |
| PRD 覆蓋率 | 100% (GH-001 ~ GH-040) |
| 技術規格完整度 | ≥ 90% |
| 測試案例覆蓋 | 每任務至少 1 個單元 + 1 個 E2E |
| 資料表設計完整度 | 100% |
| 基礎設施設計完整度 | 12/12 |

---

**研究完成時間**: 2025-11-27
**研究者**: Task Researcher
**選定方向**: C - 完整重構
**下一步**: 依照執行計劃開始實施
