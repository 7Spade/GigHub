# 12-database-schema.setc.md

## 1. 模組概述

### 業務價值
資料庫設計是系統的基礎架構：
- **資料完整性**：確保資料的一致性與準確性
- **安全隔離**：RLS 實現多租戶資料隔離
- **效能優化**：索引與查詢優化
- **可擴展性**：支援系統成長的設計

### 核心功能
1. **Schema 設計**：所有資料表結構
2. **RLS 政策**：行級安全政策
3. **Helper Functions**：權限檢查輔助函數
4. **Triggers**：自動化資料處理
5. **Indexes**：查詢效能優化

### 在系統中的定位
資料庫設計是所有業務模組的基礎，定義資料如何存儲與保護。

---

## 2. 功能需求

### 設計原則

1. **UUID 主鍵**：所有資料表使用 UUID 作為主鍵
2. **軟刪除**：使用 `deleted_at` 欄位實現軟刪除
3. **時間戳**：`created_at`, `updated_at` 追蹤記錄變更
4. **外鍵約束**：確保參照完整性
5. **RLS 優先**：每張表必須啟用 RLS

---

## 3. 技術設計

### 資料表總覽

#### 基礎層資料表

| 資料表 | 說明 | 主要欄位 |
|--------|------|----------|
| accounts | 帳戶（用戶/組織/Bot） | id, type, display_name, email |
| organization_members | 組織成員關聯 | organization_id, user_id, role |
| teams | 團隊 | id, organization_id, name |
| team_members | 團隊成員關聯 | team_id, user_id, role |

#### 容器層資料表

| 資料表 | 說明 | 主要欄位 |
|--------|------|----------|
| blueprints | 藍圖 | id, owner_id, name, status |
| blueprint_members | 藍圖成員 | blueprint_id, account_id, role |
| blueprint_roles | 自訂角色 | id, blueprint_id, name, permissions |
| blueprint_branches | 藍圖分支 | id, blueprint_id, name, is_default |
| pull_requests | 合併請求 | id, source_branch_id, target_branch_id |

#### 業務層資料表

| 資料表 | 說明 | 主要欄位 |
|--------|------|----------|
| tasks | 任務 | id, blueprint_id, parent_id, name, status |
| task_attachments | 任務附件 | id, task_id, file_id |
| task_acceptances | 任務驗收 | id, task_id, status |
| diaries | 施工日誌 | id, blueprint_id, work_date, status |
| diary_tasks | 日誌任務關聯 | id, diary_id, task_id, work_hours |
| diary_attachments | 日誌附件 | id, diary_id, file_id |
| files | 檔案 | id, blueprint_id, name, file_type |
| file_versions | 檔案版本 | id, file_id, version |
| file_shares | 檔案分享 | id, file_id, share_token |
| links | 外部連結 | id, blueprint_id, url, title |
| notifications | 通知 | id, account_id, type, is_read |
| activities | 活動記錄 | id, blueprint_id, event_type, entity_id |

### 完整 Schema 定義

#### accounts
```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('user', 'organization', 'bot')),
  display_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  avatar_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_accounts_type ON accounts(type);
CREATE INDEX idx_accounts_email ON accounts(email);
```

#### blueprints
```sql
CREATE TABLE blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES accounts(id),
  name VARCHAR(500) NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived')),
  visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'internal', 'public')),
  settings JSONB DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES accounts(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_blueprints_owner_id ON blueprints(owner_id);
CREATE INDEX idx_blueprints_status ON blueprints(status);
CREATE INDEX idx_blueprints_created_by ON blueprints(created_by);
```

#### blueprint_members
```sql
CREATE TABLE blueprint_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN (
    'owner', 'admin', 'member', 'viewer'
  )),
  custom_role_id UUID REFERENCES blueprint_roles(id),
  invited_by UUID REFERENCES accounts(id),
  joined_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (blueprint_id, account_id)
);

CREATE INDEX idx_blueprint_members_blueprint_id ON blueprint_members(blueprint_id);
CREATE INDEX idx_blueprint_members_account_id ON blueprint_members(account_id);
```

#### tasks
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES blueprint_branches(id),
  parent_id UUID REFERENCES tasks(id),
  name VARCHAR(500) NOT NULL,
  description TEXT,
  task_type TEXT DEFAULT 'task' CHECK (task_type IN (
    'task', 'milestone', 'bug', 'feature', 'improvement'
  )),
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_progress', 'in_review', 'completed', 'cancelled', 'blocked'
  )),
  priority TEXT DEFAULT 'medium' CHECK (priority IN (
    'lowest', 'low', 'medium', 'high', 'highest'
  )),
  assignee_id UUID REFERENCES accounts(id),
  reviewer_id UUID REFERENCES accounts(id),
  start_date DATE,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  estimated_hours DECIMAL(8,2),
  actual_hours DECIMAL(8,2),
  sort_order INTEGER DEFAULT 0,
  path LTREE,
  depth INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES accounts(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_tasks_blueprint_id ON tasks(blueprint_id);
CREATE INDEX idx_tasks_parent_id ON tasks(parent_id);
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_path ON tasks USING GIST (path);
```

### Helper Functions

```sql
-- 取得當前用戶 ID
CREATE OR REPLACE FUNCTION get_user_account_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT id FROM accounts WHERE id = auth.uid()),
    auth.uid()
  );
$$;

-- 檢查是否為藍圖成員
CREATE OR REPLACE FUNCTION is_blueprint_member(p_blueprint_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM blueprint_members
    WHERE blueprint_id = p_blueprint_id
    AND account_id = get_user_account_id()
  );
END;
$$;

-- 取得用戶在藍圖中的角色
CREATE OR REPLACE FUNCTION get_user_role_in_blueprint(p_blueprint_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM blueprint_members
  WHERE blueprint_id = p_blueprint_id
  AND account_id = get_user_account_id();
  
  RETURN COALESCE(v_role, 'none');
END;
$$;

-- 檢查是否有指定權限
CREATE OR REPLACE FUNCTION has_blueprint_permission(
  p_blueprint_id UUID,
  p_permission TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_role TEXT;
  v_permissions TEXT[];
BEGIN
  -- 取得角色
  v_role := get_user_role_in_blueprint(p_blueprint_id);
  
  -- owner 有所有權限
  IF v_role = 'owner' THEN
    RETURN TRUE;
  END IF;
  
  -- 檢查角色對應的權限
  CASE v_role
    WHEN 'admin' THEN
      v_permissions := ARRAY['read', 'write', 'manage_members', 'manage_settings'];
    WHEN 'member' THEN
      v_permissions := ARRAY['read', 'write'];
    WHEN 'viewer' THEN
      v_permissions := ARRAY['read'];
    ELSE
      v_permissions := ARRAY[]::TEXT[];
  END CASE;
  
  RETURN p_permission = ANY(v_permissions);
END;
$$;
```

### RLS 政策總覽

#### accounts RLS
```sql
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- 用戶可以查看自己的帳戶
CREATE POLICY "users_can_view_own_account" ON accounts FOR SELECT
USING (id = auth.uid());

-- 用戶可以查看同組織成員
CREATE POLICY "users_can_view_org_members" ON accounts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM organization_members om1
    JOIN organization_members om2 ON om1.organization_id = om2.organization_id
    WHERE om1.user_id = auth.uid()
    AND om2.user_id = accounts.id
  )
);

-- 用戶可以查看同藍圖成員
CREATE POLICY "users_can_view_blueprint_members" ON accounts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM blueprint_members bm1
    JOIN blueprint_members bm2 ON bm1.blueprint_id = bm2.blueprint_id
    WHERE bm1.account_id = auth.uid()
    AND bm2.account_id = accounts.id
  )
);
```

#### blueprints RLS
```sql
ALTER TABLE blueprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blueprint_members_can_view" ON blueprints FOR SELECT
USING (is_blueprint_member(id) OR owner_id = auth.uid());

CREATE POLICY "owners_can_update" ON blueprints FOR UPDATE
USING (owner_id = auth.uid() OR get_user_role_in_blueprint(id) IN ('owner', 'admin'));

CREATE POLICY "authenticated_users_can_create" ON blueprints FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "owners_can_delete" ON blueprints FOR DELETE
USING (owner_id = auth.uid());
```

#### tasks RLS
```sql
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blueprint_members_can_view_tasks" ON tasks FOR SELECT
USING (is_blueprint_member(blueprint_id));

CREATE POLICY "blueprint_members_can_create_tasks" ON tasks FOR INSERT
WITH CHECK (
  is_blueprint_member(blueprint_id) AND
  get_user_role_in_blueprint(blueprint_id) IN ('owner', 'admin', 'member')
);

CREATE POLICY "task_editors_can_update" ON tasks FOR UPDATE
USING (
  created_by = get_user_account_id()
  OR assignee_id = get_user_account_id()
  OR get_user_role_in_blueprint(blueprint_id) IN ('owner', 'admin')
);

CREATE POLICY "blueprint_admins_can_delete_tasks" ON tasks FOR DELETE
USING (get_user_role_in_blueprint(blueprint_id) IN ('owner', 'admin'));
```

### Triggers

```sql
-- 自動更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 為所有需要的資料表添加 trigger
CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_blueprints_updated_at
  BEFORE UPDATE ON blueprints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 任務完成時自動設定 completed_at
CREATE OR REPLACE FUNCTION set_task_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = now();
  ELSIF NEW.status != 'completed' THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_task_completed_at_trigger
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION set_task_completed_at();
```

### 索引策略

**複合索引**：
```sql
-- 任務查詢優化
CREATE INDEX idx_tasks_blueprint_status ON tasks(blueprint_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_assignee_status ON tasks(assignee_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_blueprint_due_date ON tasks(blueprint_id, due_date) WHERE deleted_at IS NULL;

-- 日誌查詢優化
CREATE INDEX idx_diaries_blueprint_date ON diaries(blueprint_id, work_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_diaries_blueprint_status ON diaries(blueprint_id, status) WHERE deleted_at IS NULL;

-- 活動時間軸優化
CREATE INDEX idx_activities_blueprint_time ON activities(blueprint_id, created_at DESC);
```

---

## 4. 安全與權限

### RLS 設計原則

1. **最小權限原則**：預設拒絕，明確授權
2. **避免遞迴查詢**：RLS 中不查詢同一表
3. **使用 SECURITY DEFINER**：Helper 函數使用提權執行
4. **索引支援**：RLS 條件欄位需有索引

### 禁止的 RLS 模式

```sql
-- ❌ 禁止：在 RLS 中直接查詢受保護的表（會導致無限遞迴）
CREATE POLICY "..." ON accounts
USING (id IN (SELECT account_id FROM organization_members WHERE ...));

-- ✅ 正確：使用 Helper Function
CREATE POLICY "..." ON accounts
USING (is_organization_member(organization_id));
```

---

## 5. 測試規範

### 單元測試清單

```typescript
describe('Database Schema', () => {
  it('accounts_shouldHaveCorrectConstraints');
  it('blueprints_shouldHaveCorrectConstraints');
  it('tasks_shouldHaveCorrectConstraints');
  it('rls_shouldPreventUnauthorizedAccess');
  it('rls_shouldAllowAuthorizedAccess');
  it('triggers_shouldUpdateTimestamps');
});
```

### RLS 測試案例

```typescript
describe('RLS Policies', () => {
  it('non_member_shouldNotAccessBlueprint');
  it('member_shouldReadBlueprint');
  it('member_shouldCreateTask');
  it('viewer_shouldNotCreateTask');
  it('admin_shouldDeleteTask');
});
```

---

## 6. 效能考量

### 查詢效能目標

| 查詢類型 | 目標時間 |
|----------|----------|
| 主鍵查詢 | < 5ms |
| 索引查詢 | < 50ms |
| 複雜關聯 | < 200ms |
| 全文搜尋 | < 300ms |

### 優化策略

1. **索引覆蓋**：常用查詢條件建立索引
2. **部分索引**：排除已刪除記錄
3. **批次操作**：大量資料使用批次處理
4. **連線池**：使用 PgBouncer 管理連線

---

## 7. 實作檢查清單

### Schema
- [ ] 建立所有基礎層資料表
- [ ] 建立所有容器層資料表
- [ ] 建立所有業務層資料表
- [ ] 設定外鍵約束

### RLS
- [ ] 所有資料表啟用 RLS
- [ ] 實作 Helper Functions
- [ ] 建立 SELECT 政策
- [ ] 建立 INSERT 政策
- [ ] 建立 UPDATE 政策
- [ ] 建立 DELETE 政策

### 索引
- [ ] 主鍵索引
- [ ] 外鍵索引
- [ ] 常用查詢索引
- [ ] 複合索引

### Triggers
- [ ] updated_at 自動更新
- [ ] 任務完成時間設定
- [ ] 活動記錄觸發

### 驗證
- [ ] RLS 政策測試
- [ ] 效能測試
- [ ] 遷移腳本驗證

---

**文件版本**: v1.0
**最後更新**: 2025-11-28
**維護者**: 專案架構師
