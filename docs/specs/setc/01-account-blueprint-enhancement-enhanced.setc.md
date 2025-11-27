---
title: SETC-01：帳戶與藍圖強化（增強版）
status: implementable
created: 2025-11-27
version: 2.0.0
owners: []
progress: 0
due: null
prd_coverage:
  - GH-011: 組織管理
  - GH-012: 團隊管理
  - GH-013: 藍圖權限
  - GH-014: 工作區管理
---

# SETC-01：帳戶與藍圖強化（增強版）

> **Phase 0: Account & Blueprint Enhancement**
> 
> 🎯 本文件為**可實施版本**，包含完整的技術規格、資料庫設計、程式碼範例和測試策略。

---

## 📋 技術架構定位

### 三層架構位置

```
┌─────────────────────────────────────────────────┐
│              🏢 基礎層 (Foundation)               │  ← 本 SETC 主要範圍
│  帳戶體系 | 組織管理 | 認證授權 | 權限系統         │
└─────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────┐
│              📦 容器層 (Container)               │  ← 本 SETC 部分範圍
│  藍圖系統 | 工作區 | 分支管理 | 成員角色          │
└─────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────┐
│              🏗️ 業務層 (Business)               │
│  任務 | 日誌 | 檔案 | 驗收 | 進度                │
└─────────────────────────────────────────────────┘
```

### 容器層基礎設施使用清單

| # | 基礎設施 | 本階段使用 | 說明 |
|---|----------|-----------|------|
| 1 | 上下文注入 | ✅ 核心 | WorkspaceContextFacade 實作 |
| 2 | 權限系統 (RBAC) | ✅ 核心 | AclPermissionService 實作 |
| 3 | 時間軸服務 | ⬜ 不需要 | - |
| 4 | 通知中心 | ⬜ 不需要 | - |
| 5 | 事件總線 | ✅ 基礎 | 帳戶變更事件 |
| 6 | 搜尋引擎 | ⬜ 不需要 | - |
| 7 | 關聯管理 | ⬜ 不需要 | - |
| 8 | 資料隔離 (RLS) | ✅ 核心 | 藍圖/工作區 RLS 政策 |
| 9 | 生命週期 | ✅ 基礎 | 藍圖狀態管理 |
| 10 | 配置中心 | ⬜ 不需要 | - |
| 11 | 元數據系統 | ⬜ 不需要 | - |
| 12 | API 閘道 | ⬜ 不需要 | - |

---

## 📊 階段資訊

| 屬性 | 值 |
|------|-----|
| **階段編號** | P0 / SETC-01 |
| **預計週數** | 1-2 週 |
| **總任務數** | 11 |
| **前置條件** | 現有帳戶體系 80%、藍圖系統 70% |
| **完成目標** | 帳戶體系與藍圖系統達到企業標準 |
| **PRD 對應** | GH-011 ~ GH-014 |

---

## 🎯 階段目標

1. ✅ 完善 ACL 權限控制，支援 CRUD + 模組級權限
2. ✅ 強化路由守衛，確保未授權存取被阻擋
3. ✅ 藍圖模板管理完整 CRUD
4. ✅ 藍圖複製功能實作
5. ✅ 工作區切換與藍圖系統整合

---

## 💾 資料庫設計

### `blueprint_templates` 資料表

```sql
-- Migration: 20250101_001_create_blueprint_templates.sql
-- 描述: 藍圖模板資料表，用於快速建立新藍圖

-- 創建表
CREATE TABLE blueprint_templates (
    -- 主鍵
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 擁有者（帳戶 ID，可以是用戶或組織）
    owner_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    
    -- 基本資訊
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'file-text',
    color VARCHAR(20) DEFAULT '#1890ff',
    
    -- 模板內容（JSONB 存儲預設任務、設定等）
    template_data JSONB NOT NULL DEFAULT '{
        "tasks": [],
        "settings": {
            "defaultView": "tree",
            "enableDiary": true,
            "enableInspection": true
        },
        "metadata": {}
    }'::jsonb,
    
    -- 分類與標籤
    category VARCHAR(50), -- 'construction', 'renovation', 'maintenance', etc.
    tags TEXT[] DEFAULT '{}',
    
    -- 可見性
    is_public BOOLEAN DEFAULT false,
    is_system BOOLEAN DEFAULT false, -- 系統預設模板
    
    -- 統計
    use_count INTEGER DEFAULT 0,
    
    -- 狀態
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    
    -- 審計欄位
    created_by UUID NOT NULL REFERENCES accounts(id),
    updated_by UUID REFERENCES accounts(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    
    -- 約束
    CONSTRAINT blueprint_templates_name_not_empty CHECK (length(trim(name)) > 0)
);

-- 索引
CREATE INDEX idx_blueprint_templates_owner ON blueprint_templates(owner_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_blueprint_templates_category ON blueprint_templates(category) WHERE deleted_at IS NULL;
CREATE INDEX idx_blueprint_templates_public ON blueprint_templates(is_public) WHERE deleted_at IS NULL AND is_public = true;
CREATE INDEX idx_blueprint_templates_tags ON blueprint_templates USING GIN(tags) WHERE deleted_at IS NULL;

-- 全文搜尋索引
CREATE INDEX idx_blueprint_templates_search ON blueprint_templates 
USING GIN(to_tsvector('chinese', coalesce(name, '') || ' ' || coalesce(description, '')))
WHERE deleted_at IS NULL;

-- 觸發器：自動更新 updated_at
CREATE TRIGGER trg_blueprint_templates_updated_at
    BEFORE UPDATE ON blueprint_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 註解
COMMENT ON TABLE blueprint_templates IS '藍圖模板表，用於快速建立新藍圖';
COMMENT ON COLUMN blueprint_templates.template_data IS 'JSON 格式的模板內容，包含預設任務和設定';
COMMENT ON COLUMN blueprint_templates.is_system IS '是否為系統預設模板，不可被普通用戶刪除';
```

### RLS 政策

```sql
-- 啟用 RLS
ALTER TABLE blueprint_templates ENABLE ROW LEVEL SECURITY;

-- SELECT 政策：可查看自己的模板或公開模板
CREATE POLICY "blueprint_templates_select_policy"
ON blueprint_templates FOR SELECT
USING (
    deleted_at IS NULL AND (
        -- 自己的模板
        owner_id = auth.uid() OR
        -- 公開模板
        is_public = true OR
        -- 同組織成員可見
        owner_id IN (
            SELECT om.organization_id 
            FROM organization_members om 
            WHERE om.account_id = auth.uid() AND om.status = 'active'
        )
    )
);

-- INSERT 政策：任何認證用戶可創建
CREATE POLICY "blueprint_templates_insert_policy"
ON blueprint_templates FOR INSERT
WITH CHECK (
    auth.uid() IS NOT NULL AND
    owner_id = auth.uid()
);

-- UPDATE 政策：只能更新自己的模板（非系統模板）
CREATE POLICY "blueprint_templates_update_policy"
ON blueprint_templates FOR UPDATE
USING (
    owner_id = auth.uid() AND 
    is_system = false AND
    deleted_at IS NULL
);

-- DELETE 政策：只能刪除自己的模板（非系統模板）
CREATE POLICY "blueprint_templates_delete_policy"
ON blueprint_templates FOR DELETE
USING (
    owner_id = auth.uid() AND 
    is_system = false AND
    deleted_at IS NULL
);
```

### `blueprint_members` 資料表（強化）

```sql
-- Migration: 20250101_002_enhance_blueprint_members.sql
-- 描述: 強化藍圖成員表，支援更細粒度的權限控制

-- 新增欄位（如果表已存在）
ALTER TABLE blueprint_members 
    ADD COLUMN IF NOT EXISTS permissions TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES accounts(id),
    ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

-- 新增索引
CREATE INDEX IF NOT EXISTS idx_blueprint_members_permissions 
ON blueprint_members USING GIN(permissions) WHERE status = 'active';

-- 更新 RLS 政策
DROP POLICY IF EXISTS "blueprint_members_select_policy" ON blueprint_members;

CREATE POLICY "blueprint_members_select_policy"
ON blueprint_members FOR SELECT
USING (
    -- 同藍圖成員可見
    blueprint_id IN (
        SELECT bm.blueprint_id 
        FROM blueprint_members bm 
        WHERE bm.account_id = auth.uid() AND bm.status = 'active'
    )
);

-- Helper Function: 檢查藍圖權限
CREATE OR REPLACE FUNCTION has_blueprint_permission(
    p_blueprint_id UUID, 
    p_permission TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_role TEXT;
    v_permissions TEXT[];
BEGIN
    -- 獲取用戶在藍圖中的角色和權限
    SELECT role, permissions INTO v_role, v_permissions
    FROM blueprint_members
    WHERE blueprint_id = p_blueprint_id 
    AND account_id = auth.uid()
    AND status = 'active';
    
    -- 未找到成員記錄
    IF v_role IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Owner 和 Admin 有所有權限
    IF v_role IN ('owner', 'admin') THEN
        RETURN TRUE;
    END IF;
    
    -- 檢查特定權限
    RETURN p_permission = ANY(v_permissions) OR 
           (p_permission || ':*') = ANY(v_permissions);
END;
$$;
```

---

## 📦 TypeScript 類型定義

### Domain Types

```typescript
// src/app/features/blueprint/domain/types/template.types.ts

// ============================================
// 枚舉與常數
// ============================================

export const TEMPLATE_STATUS = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  DELETED: 'deleted',
} as const;

export type TemplateStatus = typeof TEMPLATE_STATUS[keyof typeof TEMPLATE_STATUS];

export const TEMPLATE_CATEGORY = {
  CONSTRUCTION: 'construction',   // 新建工程
  RENOVATION: 'renovation',       // 裝修工程
  MAINTENANCE: 'maintenance',     // 維護工程
  INSPECTION: 'inspection',       // 檢驗專案
  CUSTOM: 'custom',              // 自訂
} as const;

export type TemplateCategory = typeof TEMPLATE_CATEGORY[keyof typeof TEMPLATE_CATEGORY];

// ============================================
// 模板資料結構
// ============================================

/**
 * 模板內預設任務結構
 */
export interface TemplateTask {
  id: string;
  title: string;
  description?: string;
  parentId: string | null;
  position: number;
  estimatedHours?: number;
  tags?: string[];
}

/**
 * 模板設定
 */
export interface TemplateSettings {
  defaultView: 'tree' | 'table' | 'kanban' | 'gantt';
  enableDiary: boolean;
  enableInspection: boolean;
  enableFileManagement: boolean;
  progressCalculation: 'equal_weight' | 'weighted';
  customFields?: TemplateCustomField[];
}

/**
 * 自訂欄位定義
 */
export interface TemplateCustomField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect';
  required: boolean;
  options?: string[];
  defaultValue?: unknown;
}

/**
 * 模板資料
 */
export interface TemplateData {
  tasks: TemplateTask[];
  settings: TemplateSettings;
  metadata: Record<string, unknown>;
}

// ============================================
// 核心實體類型
// ============================================

/**
 * 藍圖模板實體
 */
export interface BlueprintTemplate {
  id: string;
  ownerId: string;
  
  // 基本資訊
  name: string;
  description: string | null;
  icon: string;
  color: string;
  
  // 模板內容
  templateData: TemplateData;
  
  // 分類
  category: TemplateCategory | null;
  tags: string[];
  
  // 可見性
  isPublic: boolean;
  isSystem: boolean;
  
  // 統計
  useCount: number;
  
  // 狀態
  status: TemplateStatus;
  
  // 審計
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// ============================================
// DTO 類型
// ============================================

/**
 * 創建模板請求
 */
export interface CreateTemplateRequest {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  templateData?: Partial<TemplateData>;
  category?: TemplateCategory;
  tags?: string[];
  isPublic?: boolean;
}

/**
 * 更新模板請求
 */
export interface UpdateTemplateRequest {
  name?: string;
  description?: string | null;
  icon?: string;
  color?: string;
  templateData?: Partial<TemplateData>;
  category?: TemplateCategory | null;
  tags?: string[];
  isPublic?: boolean;
  status?: TemplateStatus;
}

/**
 * 模板查詢參數
 */
export interface TemplateQueryParams {
  ownerId?: string;
  category?: TemplateCategory;
  tags?: string[];
  isPublic?: boolean;
  status?: TemplateStatus;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'name' | 'createdAt' | 'useCount';
  sortOrder?: 'asc' | 'desc';
}

/**
 * 模板列表響應
 */
export interface TemplateListResponse {
  items: BlueprintTemplate[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
```

### 權限類型

```typescript
// src/app/core/constants/permissions.ts

/**
 * 系統權限常數
 * 遵循 resource:action 格式
 */
export const PERMISSIONS = {
  // 藍圖權限
  BLUEPRINT: {
    CREATE: 'blueprint:create',
    READ: 'blueprint:read',
    UPDATE: 'blueprint:update',
    DELETE: 'blueprint:delete',
    MANAGE_MEMBERS: 'blueprint:manage_members',
    MANAGE_SETTINGS: 'blueprint:manage_settings',
    EXPORT: 'blueprint:export',
    COPY: 'blueprint:copy',
  },
  
  // 模板權限
  TEMPLATE: {
    CREATE: 'template:create',
    READ: 'template:read',
    UPDATE: 'template:update',
    DELETE: 'template:delete',
    PUBLISH: 'template:publish',
  },
  
  // 工作區權限
  WORKSPACE: {
    CREATE: 'workspace:create',
    READ: 'workspace:read',
    UPDATE: 'workspace:update',
    DELETE: 'workspace:delete',
    SWITCH: 'workspace:switch',
  },
  
  // 成員管理權限
  MEMBER: {
    INVITE: 'member:invite',
    REMOVE: 'member:remove',
    UPDATE_ROLE: 'member:update_role',
    VIEW: 'member:view',
  },
} as const;

/**
 * 藍圖角色類型
 */
export type BlueprintRole = 
  | 'owner'           // 擁有者 - 所有權限
  | 'admin'           // 管理員 - 除刪除藍圖外的所有權限
  | 'project_manager' // 專案經理 - 任務、日誌、驗收管理
  | 'site_director'   // 工地主任 - 任務執行、日誌填寫
  | 'worker'          // 施工人員 - 檢視、填寫
  | 'qa_staff'        // 品管人員 - 檢驗、驗收
  | 'observer';       // 觀察者 - 唯讀

/**
 * 角色權限對應表
 */
export const ROLE_PERMISSIONS: Record<BlueprintRole, string[]> = {
  owner: ['*'], // 所有權限
  admin: [
    PERMISSIONS.BLUEPRINT.READ,
    PERMISSIONS.BLUEPRINT.UPDATE,
    PERMISSIONS.BLUEPRINT.MANAGE_MEMBERS,
    PERMISSIONS.BLUEPRINT.MANAGE_SETTINGS,
    PERMISSIONS.BLUEPRINT.EXPORT,
    PERMISSIONS.BLUEPRINT.COPY,
    PERMISSIONS.TEMPLATE.CREATE,
    PERMISSIONS.TEMPLATE.READ,
    PERMISSIONS.TEMPLATE.UPDATE,
    PERMISSIONS.TEMPLATE.DELETE,
    PERMISSIONS.MEMBER.INVITE,
    PERMISSIONS.MEMBER.REMOVE,
    PERMISSIONS.MEMBER.UPDATE_ROLE,
    PERMISSIONS.MEMBER.VIEW,
    // 任務權限
    'task:*',
    // 日誌權限
    'diary:*',
    // 檔案權限
    'file:*',
    // 驗收權限
    'inspection:*',
  ],
  project_manager: [
    PERMISSIONS.BLUEPRINT.READ,
    PERMISSIONS.BLUEPRINT.EXPORT,
    PERMISSIONS.TEMPLATE.READ,
    PERMISSIONS.MEMBER.VIEW,
    'task:create', 'task:read', 'task:update', 'task:assign', 'task:approve',
    'diary:read', 'diary:approve',
    'file:upload', 'file:download', 'file:delete',
    'inspection:read', 'inspection:approve',
    'report:view', 'report:export',
  ],
  site_director: [
    PERMISSIONS.BLUEPRINT.READ,
    PERMISSIONS.TEMPLATE.READ,
    'task:read', 'task:update', 'task:complete',
    'diary:create', 'diary:read', 'diary:update',
    'file:upload', 'file:download',
    'inspection:create', 'inspection:read',
  ],
  worker: [
    PERMISSIONS.BLUEPRINT.READ,
    'task:read',
    'diary:read',
    'file:upload', 'file:download',
  ],
  qa_staff: [
    PERMISSIONS.BLUEPRINT.READ,
    'task:read',
    'diary:read',
    'file:upload', 'file:download',
    'inspection:create', 'inspection:read', 'inspection:update', 'inspection:sign',
    'issue:create', 'issue:read', 'issue:update',
  ],
  observer: [
    PERMISSIONS.BLUEPRINT.READ,
    PERMISSIONS.TEMPLATE.READ,
    'task:read',
    'diary:read',
    'file:download',
    'report:view',
  ],
};
```

---

## 🔧 Repository 層設計

### BlueprintTemplateRepository

```typescript
// src/app/features/blueprint/data-access/repositories/template.repository.ts

import { Injectable, inject } from '@angular/core';
import { Observable, from, map, catchError, throwError } from 'rxjs';
import { SupabaseService } from '@core';
import {
  BlueprintTemplate,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  TemplateQueryParams,
  TemplateListResponse,
} from '../../domain';

/**
 * 藍圖模板 Repository
 * 
 * 負責藍圖模板的資料存取，封裝所有 Supabase 操作
 * 
 * @example
 * ```typescript
 * const templates = await this.templateRepo.findByOwner(ownerId).toPromise();
 * ```
 */
@Injectable({ providedIn: 'root' })
export class BlueprintTemplateRepository {
  private readonly supabase = inject(SupabaseService);
  private readonly TABLE = 'blueprint_templates';

  /**
   * 查詢模板列表
   */
  findAll(params: TemplateQueryParams = {}): Observable<TemplateListResponse> {
    const {
      ownerId,
      category,
      tags,
      isPublic,
      status = 'active',
      search,
      page = 1,
      pageSize = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    return from(
      (async () => {
        let query = this.supabase.client
          .from(this.TABLE)
          .select('*', { count: 'exact' })
          .eq('status', status)
          .is('deleted_at', null);

        // 應用篩選條件
        if (ownerId) {
          query = query.eq('owner_id', ownerId);
        }
        if (category) {
          query = query.eq('category', category);
        }
        if (tags && tags.length > 0) {
          query = query.overlaps('tags', tags);
        }
        if (isPublic !== undefined) {
          query = query.eq('is_public', isPublic);
        }
        if (search) {
          query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
        }

        // 排序
        const sortColumn = this.toSnakeCase(sortBy);
        query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

        // 分頁
        const start = (page - 1) * pageSize;
        query = query.range(start, start + pageSize - 1);

        const { data, error, count } = await query;

        if (error) throw error;

        return {
          items: this.mapToCamelCase(data || []),
          total: count || 0,
          page,
          pageSize,
          hasMore: (count || 0) > page * pageSize,
        };
      })()
    );
  }

  /**
   * 根據擁有者查詢模板
   */
  findByOwner(ownerId: string): Observable<BlueprintTemplate[]> {
    return this.findAll({ ownerId, status: 'active' }).pipe(
      map(response => response.items)
    );
  }

  /**
   * 查詢公開模板
   */
  findPublic(params?: Omit<TemplateQueryParams, 'isPublic'>): Observable<TemplateListResponse> {
    return this.findAll({ ...params, isPublic: true });
  }

  /**
   * 根據 ID 查詢單一模板
   */
  findById(id: string): Observable<BlueprintTemplate | null> {
    return from(
      this.supabase.client
        .from(this.TABLE)
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error && error.code !== 'PGRST116') throw error;
        return data ? this.mapToCamelCaseSingle(data) : null;
      })
    );
  }

  /**
   * 創建模板
   */
  create(request: CreateTemplateRequest, userId: string): Observable<BlueprintTemplate> {
    return from(
      this.supabase.client
        .from(this.TABLE)
        .insert({
          owner_id: userId,
          name: request.name,
          description: request.description || null,
          icon: request.icon || 'file-text',
          color: request.color || '#1890ff',
          template_data: request.templateData || {
            tasks: [],
            settings: {
              defaultView: 'tree',
              enableDiary: true,
              enableInspection: true,
              enableFileManagement: true,
              progressCalculation: 'equal_weight',
            },
            metadata: {},
          },
          category: request.category || null,
          tags: request.tags || [],
          is_public: request.isPublic || false,
          created_by: userId,
        })
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.mapToCamelCaseSingle(data);
      }),
      catchError(error => {
        console.error('[TemplateRepository] Create failed:', error);
        return throwError(() => new Error('創建模板失敗'));
      })
    );
  }

  /**
   * 更新模板
   */
  update(id: string, request: UpdateTemplateRequest, userId: string): Observable<BlueprintTemplate> {
    const updateData: Record<string, unknown> = {
      updated_by: userId,
      updated_at: new Date().toISOString(),
    };

    if (request.name !== undefined) updateData.name = request.name;
    if (request.description !== undefined) updateData.description = request.description;
    if (request.icon !== undefined) updateData.icon = request.icon;
    if (request.color !== undefined) updateData.color = request.color;
    if (request.templateData !== undefined) {
      updateData.template_data = request.templateData;
    }
    if (request.category !== undefined) updateData.category = request.category;
    if (request.tags !== undefined) updateData.tags = request.tags;
    if (request.isPublic !== undefined) updateData.is_public = request.isPublic;
    if (request.status !== undefined) updateData.status = request.status;

    return from(
      this.supabase.client
        .from(this.TABLE)
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.mapToCamelCaseSingle(data);
      })
    );
  }

  /**
   * 軟刪除模板
   */
  delete(id: string, userId: string): Observable<void> {
    return from(
      this.supabase.client
        .from(this.TABLE)
        .update({
          status: 'deleted',
          deleted_at: new Date().toISOString(),
          updated_by: userId,
        })
        .eq('id', id)
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      })
    );
  }

  /**
   * 增加使用次數
   */
  incrementUseCount(id: string): Observable<void> {
    return from(
      this.supabase.client.rpc('increment_template_use_count', { template_id: id })
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      })
    );
  }

  // ============================================
  // 私有輔助方法
  // ============================================

  private mapToCamelCase(data: unknown[]): BlueprintTemplate[] {
    return data.map(item => this.mapToCamelCaseSingle(item));
  }

  private mapToCamelCaseSingle(data: unknown): BlueprintTemplate {
    const item = data as Record<string, unknown>;
    return {
      id: item.id as string,
      ownerId: item.owner_id as string,
      name: item.name as string,
      description: item.description as string | null,
      icon: item.icon as string,
      color: item.color as string,
      templateData: item.template_data as BlueprintTemplate['templateData'],
      category: item.category as BlueprintTemplate['category'],
      tags: item.tags as string[],
      isPublic: item.is_public as boolean,
      isSystem: item.is_system as boolean,
      useCount: item.use_count as number,
      status: item.status as BlueprintTemplate['status'],
      createdBy: item.created_by as string,
      updatedBy: item.updated_by as string | null,
      createdAt: item.created_at as string,
      updatedAt: item.updated_at as string,
      deletedAt: item.deleted_at as string | null,
    };
  }

  private toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}
```

---

## 📊 Store 設計

### BlueprintTemplateStore

```typescript
// src/app/features/blueprint/data-access/stores/template.store.ts

import { Injectable, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { switchMap, catchError, tap, of } from 'rxjs/operators';
import { BlueprintTemplateRepository } from '../repositories/template.repository';
import { WorkspaceContextFacade } from '@core';
import {
  BlueprintTemplate,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  TemplateQueryParams,
  TemplateCategory,
} from '../../domain';

/**
 * 藍圖模板 Store
 * 
 * 使用 Angular Signals 管理模板狀態，提供響應式的資料存取
 */
@Injectable({ providedIn: 'root' })
export class BlueprintTemplateStore {
  private readonly repository = inject(BlueprintTemplateRepository);
  private readonly contextFacade = inject(WorkspaceContextFacade);

  // ============================================
  // 私有狀態 (Private State)
  // ============================================
  
  private readonly _templates = signal<BlueprintTemplate[]>([]);
  private readonly _selectedTemplate = signal<BlueprintTemplate | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _pagination = signal({
    page: 1,
    pageSize: 20,
    total: 0,
    hasMore: false,
  });

  // ============================================
  // 公開唯讀狀態 (Public Readonly State)
  // ============================================

  readonly templates = this._templates.asReadonly();
  readonly selectedTemplate = this._selectedTemplate.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly pagination = this._pagination.asReadonly();

  // ============================================
  // 計算屬性 (Computed Properties)
  // ============================================

  /** 是否有模板 */
  readonly hasTemplates = computed(() => this._templates().length > 0);

  /** 公開模板 */
  readonly publicTemplates = computed(() => 
    this._templates().filter(t => t.isPublic)
  );

  /** 私有模板 */
  readonly privateTemplates = computed(() => 
    this._templates().filter(t => !t.isPublic)
  );

  /** 按分類分組的模板 */
  readonly templatesByCategory = computed(() => {
    const grouped: Record<string, BlueprintTemplate[]> = {};
    for (const template of this._templates()) {
      const category = template.category || 'uncategorized';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(template);
    }
    return grouped;
  });

  /** 模板統計 */
  readonly statistics = computed(() => ({
    total: this._templates().length,
    public: this.publicTemplates().length,
    private: this.privateTemplates().length,
    byCategory: Object.entries(this.templatesByCategory()).map(([category, templates]) => ({
      category,
      count: templates.length,
    })),
  }));

  // ============================================
  // 公開方法 (Public Methods)
  // ============================================

  /**
   * 載入模板列表
   */
  async loadTemplates(params?: TemplateQueryParams): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const response = await this.repository.findAll(params).toPromise();
      if (response) {
        this._templates.set(response.items);
        this._pagination.set({
          page: response.page,
          pageSize: response.pageSize,
          total: response.total,
          hasMore: response.hasMore,
        });
      }
    } catch (error) {
      this._error.set((error as Error).message || '載入模板失敗');
      console.error('[TemplateStore] loadTemplates error:', error);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * 載入我的模板
   */
  async loadMyTemplates(): Promise<void> {
    const userId = this.contextFacade.currentAccountId();
    if (!userId) {
      this._error.set('請先登入');
      return;
    }
    await this.loadTemplates({ ownerId: userId });
  }

  /**
   * 載入公開模板
   */
  async loadPublicTemplates(): Promise<void> {
    await this.loadTemplates({ isPublic: true });
  }

  /**
   * 選擇模板
   */
  async selectTemplate(id: string): Promise<BlueprintTemplate | null> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const template = await this.repository.findById(id).toPromise();
      this._selectedTemplate.set(template ?? null);
      return template ?? null;
    } catch (error) {
      this._error.set((error as Error).message || '載入模板詳情失敗');
      return null;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * 清除選中的模板
   */
  clearSelection(): void {
    this._selectedTemplate.set(null);
  }

  /**
   * 創建模板
   */
  async createTemplate(request: CreateTemplateRequest): Promise<BlueprintTemplate | null> {
    const userId = this.contextFacade.currentAccountId();
    if (!userId) {
      this._error.set('請先登入');
      return null;
    }

    this._loading.set(true);
    this._error.set(null);

    try {
      const template = await this.repository.create(request, userId).toPromise();
      if (template) {
        this._templates.update(templates => [...templates, template]);
        return template;
      }
      return null;
    } catch (error) {
      this._error.set((error as Error).message || '創建模板失敗');
      return null;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * 更新模板
   */
  async updateTemplate(id: string, request: UpdateTemplateRequest): Promise<BlueprintTemplate | null> {
    const userId = this.contextFacade.currentAccountId();
    if (!userId) {
      this._error.set('請先登入');
      return null;
    }

    this._loading.set(true);
    this._error.set(null);

    try {
      const template = await this.repository.update(id, request, userId).toPromise();
      if (template) {
        this._templates.update(templates =>
          templates.map(t => (t.id === id ? template : t))
        );
        if (this._selectedTemplate()?.id === id) {
          this._selectedTemplate.set(template);
        }
        return template;
      }
      return null;
    } catch (error) {
      this._error.set((error as Error).message || '更新模板失敗');
      return null;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * 刪除模板
   */
  async deleteTemplate(id: string): Promise<boolean> {
    const userId = this.contextFacade.currentAccountId();
    if (!userId) {
      this._error.set('請先登入');
      return false;
    }

    this._loading.set(true);
    this._error.set(null);

    try {
      await this.repository.delete(id, userId).toPromise();
      this._templates.update(templates => templates.filter(t => t.id !== id));
      if (this._selectedTemplate()?.id === id) {
        this._selectedTemplate.set(null);
      }
      return true;
    } catch (error) {
      this._error.set((error as Error).message || '刪除模板失敗');
      return false;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * 使用模板（增加使用次數並返回模板資料）
   */
  async useTemplate(id: string): Promise<BlueprintTemplate | null> {
    const template = await this.selectTemplate(id);
    if (template) {
      // 背景更新使用次數
      this.repository.incrementUseCount(id).subscribe();
      // 更新本地狀態
      this._templates.update(templates =>
        templates.map(t => (t.id === id ? { ...t, useCount: t.useCount + 1 } : t))
      );
    }
    return template;
  }

  /**
   * 重置狀態
   */
  reset(): void {
    this._templates.set([]);
    this._selectedTemplate.set(null);
    this._loading.set(false);
    this._error.set(null);
    this._pagination.set({
      page: 1,
      pageSize: 20,
      total: 0,
      hasMore: false,
    });
  }
}
```

---

## 🧪 測試策略

### 單元測試範例

```typescript
// src/app/features/blueprint/data-access/stores/template.store.spec.ts

import { TestBed } from '@angular/core/testing';
import { BlueprintTemplateStore } from './template.store';
import { BlueprintTemplateRepository } from '../repositories/template.repository';
import { WorkspaceContextFacade } from '@core';
import { of, throwError } from 'rxjs';
import { BlueprintTemplate, TEMPLATE_STATUS } from '../../domain';

describe('BlueprintTemplateStore', () => {
  let store: BlueprintTemplateStore;
  let repositoryMock: jasmine.SpyObj<BlueprintTemplateRepository>;
  let contextFacadeMock: jasmine.SpyObj<WorkspaceContextFacade>;

  const mockUserId = 'user-123';
  const mockTemplate: BlueprintTemplate = {
    id: 'template-1',
    ownerId: mockUserId,
    name: '測試模板',
    description: '測試用模板',
    icon: 'file-text',
    color: '#1890ff',
    templateData: {
      tasks: [],
      settings: {
        defaultView: 'tree',
        enableDiary: true,
        enableInspection: true,
        enableFileManagement: true,
        progressCalculation: 'equal_weight',
      },
      metadata: {},
    },
    category: 'construction',
    tags: ['test'],
    isPublic: false,
    isSystem: false,
    useCount: 0,
    status: TEMPLATE_STATUS.ACTIVE,
    createdBy: mockUserId,
    updatedBy: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  };

  beforeEach(() => {
    repositoryMock = jasmine.createSpyObj('BlueprintTemplateRepository', [
      'findAll',
      'findById',
      'create',
      'update',
      'delete',
      'incrementUseCount',
    ]);

    contextFacadeMock = jasmine.createSpyObj('WorkspaceContextFacade', [], {
      currentAccountId: jasmine.createSpy().and.returnValue(mockUserId),
    });

    TestBed.configureTestingModule({
      providers: [
        BlueprintTemplateStore,
        { provide: BlueprintTemplateRepository, useValue: repositoryMock },
        { provide: WorkspaceContextFacade, useValue: contextFacadeMock },
      ],
    });

    store = TestBed.inject(BlueprintTemplateStore);
  });

  afterEach(() => {
    store.reset();
  });

  describe('loadTemplates', () => {
    it('loadTemplates_whenSuccess_shouldUpdateTemplatesState', async () => {
      // Arrange
      const mockResponse = {
        items: [mockTemplate],
        total: 1,
        page: 1,
        pageSize: 20,
        hasMore: false,
      };
      repositoryMock.findAll.and.returnValue(of(mockResponse));

      // Act
      await store.loadTemplates();

      // Assert
      expect(store.templates()).toEqual([mockTemplate]);
      expect(store.loading()).toBeFalse();
      expect(store.error()).toBeNull();
      expect(store.pagination().total).toBe(1);
    });

    it('loadTemplates_whenError_shouldSetErrorState', async () => {
      // Arrange
      repositoryMock.findAll.and.returnValue(throwError(() => new Error('Network error')));

      // Act
      await store.loadTemplates();

      // Assert
      expect(store.templates()).toEqual([]);
      expect(store.loading()).toBeFalse();
      expect(store.error()).toBe('Network error');
    });
  });

  describe('createTemplate', () => {
    it('createTemplate_whenSuccess_shouldAddToTemplates', async () => {
      // Arrange
      const request = { name: '新模板' };
      repositoryMock.create.and.returnValue(of(mockTemplate));

      // Act
      const result = await store.createTemplate(request);

      // Assert
      expect(result).toEqual(mockTemplate);
      expect(store.templates()).toContain(mockTemplate);
    });

    it('createTemplate_whenNotLoggedIn_shouldReturnNull', async () => {
      // Arrange
      (contextFacadeMock.currentAccountId as jasmine.Spy).and.returnValue(null);
      const request = { name: '新模板' };

      // Act
      const result = await store.createTemplate(request);

      // Assert
      expect(result).toBeNull();
      expect(store.error()).toBe('請先登入');
    });
  });

  describe('deleteTemplate', () => {
    it('deleteTemplate_whenSuccess_shouldRemoveFromTemplates', async () => {
      // Arrange
      store['_templates'].set([mockTemplate]);
      repositoryMock.delete.and.returnValue(of(void 0));

      // Act
      const result = await store.deleteTemplate(mockTemplate.id);

      // Assert
      expect(result).toBeTrue();
      expect(store.templates()).not.toContain(mockTemplate);
    });
  });

  describe('computed properties', () => {
    it('publicTemplates_shouldReturnOnlyPublicTemplates', () => {
      // Arrange
      const publicTemplate = { ...mockTemplate, id: 'public-1', isPublic: true };
      const privateTemplate = { ...mockTemplate, id: 'private-1', isPublic: false };
      store['_templates'].set([publicTemplate, privateTemplate]);

      // Act & Assert
      expect(store.publicTemplates()).toEqual([publicTemplate]);
      expect(store.privateTemplates()).toEqual([privateTemplate]);
    });

    it('statistics_shouldCalculateCorrectly', () => {
      // Arrange
      const templates = [
        { ...mockTemplate, id: '1', isPublic: true, category: 'construction' },
        { ...mockTemplate, id: '2', isPublic: false, category: 'construction' },
        { ...mockTemplate, id: '3', isPublic: false, category: 'renovation' },
      ] as BlueprintTemplate[];
      store['_templates'].set(templates);

      // Act
      const stats = store.statistics();

      // Assert
      expect(stats.total).toBe(3);
      expect(stats.public).toBe(1);
      expect(stats.private).toBe(2);
    });
  });
});
```

### E2E 測試範例

```typescript
// e2e/blueprint/template-management.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Blueprint Template Management', () => {
  test.beforeEach(async ({ page }) => {
    // 登入
    await page.goto('/passport/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
  });

  test('should create a new template', async ({ page }) => {
    // 導航到模板頁面
    await page.goto('/blueprint/templates');
    
    // 點擊新增按鈕
    await page.click('[data-testid="create-template-button"]');
    
    // 填寫表單
    await page.fill('[data-testid="template-name"]', 'E2E 測試模板');
    await page.fill('[data-testid="template-description"]', '這是一個 E2E 測試創建的模板');
    await page.selectOption('[data-testid="template-category"]', 'construction');
    
    // 提交
    await page.click('[data-testid="submit-button"]');
    
    // 驗證
    await expect(page.locator('[data-testid="template-list"]')).toContainText('E2E 測試模板');
  });

  test('should delete a template', async ({ page }) => {
    // 創建測試模板
    await page.goto('/blueprint/templates');
    await page.click('[data-testid="create-template-button"]');
    await page.fill('[data-testid="template-name"]', '待刪除模板');
    await page.click('[data-testid="submit-button"]');
    
    // 刪除
    await page.click('[data-testid="template-actions-待刪除模板"]');
    await page.click('[data-testid="delete-action"]');
    await page.click('[data-testid="confirm-delete"]');
    
    // 驗證
    await expect(page.locator('[data-testid="template-list"]')).not.toContainText('待刪除模板');
  });
});
```

---

## 📈 效能指標

| 指標 | 目標 | 測量方式 |
|------|------|---------|
| **模板列表載入** | < 500ms | 首次載入時間 |
| **模板詳情載入** | < 200ms | 單一模板查詢時間 |
| **創建模板** | < 1s | API 響應時間 |
| **UI 響應** | < 100ms | 點擊到視覺反饋 |
| **LCP** | < 2.5s | Core Web Vitals |
| **FID** | < 100ms | Core Web Vitals |

---

## 📋 任務清單

（保持原有的 11 個任務，但現在有了完整的技術支撐）

### P0-T01 ~ P0-T11

> 參見原文件中的任務定義，現在這些任務有了明確的資料庫結構、類型定義、Repository 和 Store 範例可以直接實作。

---

## ✅ 階段完成檢查清單

### 技術實作檢查
- [ ] 資料庫 Migration 已執行且通過
- [ ] RLS 政策測試通過
- [ ] TypeScript 類型無編譯錯誤
- [ ] Repository 單元測試 ≥ 80% 覆蓋率
- [ ] Store 單元測試 ≥ 80% 覆蓋率
- [ ] E2E 測試通過

### 功能檢查
- [ ] ACL 權限矩陣已設計並文件化
- [ ] 路由守衛正確阻擋未授權存取
- [ ] 藍圖模板 CRUD 完整運作
- [ ] 藍圖複製功能正確複製所有子項目
- [ ] 工作區切換正確載入藍圖

### 效能檢查
- [ ] 模板列表載入 < 500ms
- [ ] API 響應時間 < 1s
- [ ] 無記憶體洩漏

---

## 📚 下一階段

完成 SETC-01 後，進入 [SETC-02：任務系統生產級](./02-task-system-production-enhanced.setc.md)

---

## 📖 參考文件

- [PRD - 帳戶體系](../prd/construction-site-management.md#帳戶體系)
- [系統架構 - 容器層](../architecture/system-architecture.md#容器層)
- [SETC-00 - 基礎設施](./00-foundation-infrastructure.setc.md)
