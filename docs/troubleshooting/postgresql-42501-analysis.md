# PostgreSQL 42501 錯誤分析與解決方案

> **PostgreSQL Error Code 42501**: insufficient_privilege (權限不足)

本文件分析 GigHub 系統中 42501 錯誤的根本原因，並提供完整的解決方案與預防措施。

---

## 📋 目錄

1. [錯誤概述](#錯誤概述)
2. [系統資料流分析](#系統資料流分析)
3. [42501 錯誤根本原因](#42501-錯誤根本原因)
4. [當前 RLS 策略分析](#當前-rls-策略分析)
5. [常見場景與解決方案](#常見場景與解決方案)
6. [最佳實踐](#最佳實踐)
7. [故障排除指南](#故障排除指南)

---

## 錯誤概述

### 什麼是 42501 錯誤？

PostgreSQL 錯誤代碼 `42501` 表示 `insufficient_privilege`，當用戶嘗試執行沒有權限的操作時會發生此錯誤。

在 Supabase 環境中，42501 錯誤通常由以下原因觸發：

1. **RLS (Row Level Security) 策略拒絕操作**
2. **用戶缺少必要的角色權限**
3. **Helper Function 返回 NULL 導致條件判斷失敗**
4. **循環依賴導致 RLS 策略無法正確評估**

### 錯誤訊息範例

```json
{
  "code": "42501",
  "details": null,
  "hint": null,
  "message": "new row violates row-level security policy for table \"table_name\""
}
```

---

## 系統資料流分析

### 用戶註冊到任務建立的完整流程

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         用戶生命週期流程                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. 用戶註冊 (auth.users)                                                    │
│     │                                                                       │
│     ▼  觸發器: handle_new_user()                                            │
│  2. 自動建立 accounts (type='User')                                          │
│     │                                                                       │
│     ▼  用戶操作                                                              │
│  3. 建立組織 (accounts type='Organization')                                  │
│     │                                                                       │
│     ▼  觸發器: add_creator_as_org_owner()                                   │
│  4. 自動加入 organization_members (role='owner')                             │
│     │                                                                       │
│     ▼  用戶操作                                                              │
│  5. 建立團隊 (teams)                                                         │
│     │                                                                       │
│     ▼  觸發器: add_team_creator_as_leader()                                 │
│  6. 自動加入 team_members (role='leader')                                    │
│     │                                                                       │
│     ▼  用戶操作 (未來功能)                                                    │
│  7. 建立藍圖 (blueprints) ← 需要新增 RLS 策略                                 │
│     │                                                                       │
│     ▼  用戶操作 (未來功能)                                                    │
│  8. 建立任務 (tasks) ← 需要新增 RLS 策略                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 資料表關係圖

```
auth.users (Supabase Auth)
    │
    │ auth_user_id
    ▼
accounts (type: User/Organization/Bot)
    │
    ├──────────────────────────────────────┐
    │                                      │
    ▼                                      ▼
organization_members                   teams
(organization_id, account_id)      (organization_id)
    │                                      │
    │                                      ▼
    │                              team_members
    │                          (team_id, account_id)
    │                                      │
    │                                      ▼
    │                              team_bots
    │                          (team_id, bot_id)
    ▼
blueprints (未來)
    │
    ▼
tasks (未來)
```

---

## 42501 錯誤根本原因

### 原因 1: RLS 策略中的循環依賴

**問題描述**：當 RLS 策略需要查詢自己或其他受 RLS 保護的表時，會產生無限遞迴。

**範例**：
```sql
-- ❌ 錯誤: 會產生無限遞迴
CREATE POLICY "view_members" ON organization_members
FOR SELECT
USING (
  account_id IN (
    SELECT id FROM accounts WHERE auth_user_id = auth.uid()
  )
);
```

**解決方案**：使用 `SECURITY DEFINER` 函數繞過 RLS：
```sql
-- ✅ 正確: 使用 helper function
CREATE OR REPLACE FUNCTION public.get_user_account_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET row_security = off
STABLE
AS $$
BEGIN
  SELECT id INTO v_account_id
  FROM public.accounts
  WHERE auth_user_id = auth.uid()
    AND type = 'User'
    AND status != 'deleted'
  LIMIT 1;
  RETURN v_account_id;
END;
$$;

CREATE POLICY "view_members" ON organization_members
FOR SELECT
USING (
  account_id = public.get_user_account_id()
  OR public.is_org_member(organization_id)
);
```

### 原因 2: 雞蛋問題 (Chicken-and-Egg Problem)

**問題描述**：需要先成為成員才能新增成員，但表是空的時候無法新增第一個成員。

**範例場景**：
1. 建立新組織後，需要將創建者加入 `organization_members`
2. 但 INSERT 策略檢查 `is_org_owner()`，沒有任何成員時返回 false

**解決方案**：
1. 使用觸發器自動新增創建者：
```sql
CREATE TRIGGER add_creator_as_org_owner_trigger
  AFTER INSERT ON public.accounts
  FOR EACH ROW
  WHEN (NEW.type = 'Organization')
  EXECUTE FUNCTION public.add_creator_as_org_owner();
```

2. 或使用特殊的初始化策略：
```sql
CREATE POLICY "Allow initial organization owner on creation" 
ON public.organization_members
FOR INSERT
WITH CHECK (
  role = 'owner'
  AND auth_user_id = auth.uid()
  AND NOT public.organization_has_members(organization_id)
);
```

### 原因 3: Helper Function 返回 NULL

**問題描述**：當 `get_user_account_id()` 返回 NULL 時，RLS 條件判斷會失敗。

**常見場景**：
- 新用戶註冊後，`handle_new_user()` 觸發器尚未執行完成
- 用戶的 accounts 記錄狀態為 'deleted'
- auth_user_id 對應的記錄不存在

**解決方案**：
```sql
-- 在 RLS 策略中處理 NULL 情況
CREATE POLICY "create_organization" ON accounts
FOR INSERT
WITH CHECK (
  type = 'Organization'
  AND status <> 'deleted'
  AND public.get_user_account_id() IS NOT NULL  -- 確保用戶有 account
);
```

### 原因 4: auth_user_id 唯一約束問題

**問題描述**：原本 `accounts.auth_user_id` 有全局唯一約束，但組織需要存儲創建者的 auth_user_id。

**解決方案**：改為部分唯一索引，只對 User 類型強制唯一：
```sql
-- 只對 User 類型強制唯一
CREATE UNIQUE INDEX unique_user_auth_user_id 
ON public.accounts (auth_user_id) 
WHERE type = 'User';
```

---

## 當前 RLS 策略分析

### accounts 表策略

| 策略名稱 | 操作 | 說明 | 狀態 |
|---------|------|------|------|
| `users_view_own_user_account` | SELECT | 用戶查看自己的 User 帳戶 | ✅ |
| `users_insert_own_user_account` | INSERT | 用戶建立自己的 User 帳戶 | ✅ |
| `users_update_own_user_account` | UPDATE | 用戶更新自己的 User 帳戶 | ✅ |
| `authenticated_users_create_organizations` | INSERT | 認證用戶建立組織 | ✅ |
| `org_owners_update_organizations` | UPDATE | 組織擁有者更新組織 | ✅ |
| `org_owners_delete_organizations` | UPDATE | 組織擁有者軟刪除組織 | ✅ |
| `authenticated_users_create_bots` | INSERT | 認證用戶建立 Bot | ✅ |
| `bot_creators_update_bots` | UPDATE | Bot 創建者更新 Bot | ✅ |
| `bot_creators_delete_bots` | UPDATE | Bot 創建者軟刪除 Bot | ✅ |
| `users_view_organizations_they_belong_to` | SELECT | 用戶查看所屬組織 | ✅ |
| `users_view_bots_they_created` | SELECT | 用戶查看自己建立的 Bot | ✅ |
| `users_view_bots_in_their_teams` | SELECT | 用戶查看團隊中的 Bot | ✅ |

### organization_members 表策略

| 策略名稱 | 操作 | 說明 | 狀態 |
|---------|------|------|------|
| `Users can view organization members` | SELECT | 查看組織成員 | ✅ |
| `Allow initial organization owner on creation` | INSERT | 初始擁有者 | ✅ |
| `Organization owners can add members` | INSERT | 擁有者新增成員 | ✅ |
| `Organization admins can update member roles` | UPDATE | 管理員更新角色 | ✅ |
| `Users can leave organizations` | DELETE | 用戶離開組織 | ✅ |
| `Organization owners can remove members` | DELETE | 擁有者移除成員 | ✅ |

### teams 表策略

| 策略名稱 | 操作 | 說明 | 狀態 |
|---------|------|------|------|
| `users_view_teams_in_their_organizations` | SELECT | 查看組織團隊 | ✅ |
| `org_owners_create_teams` | INSERT | 擁有者建立團隊 | ✅ |
| `org_owners_update_teams` | UPDATE | 擁有者更新團隊 | ✅ |
| `org_owners_delete_teams` | DELETE | 擁有者刪除團隊 | ✅ |

### team_members 表策略

| 策略名稱 | 操作 | 說明 | 狀態 |
|---------|------|------|------|
| `Users can view team members in their teams` | SELECT | 查看團隊成員 | ✅ |
| `Allow initial team leader` | INSERT | 初始領導者 | ✅ |
| `Team leaders can add members` | INSERT | 領導者新增成員 | ✅ |
| `Team leaders can update member roles` | UPDATE | 領導者更新角色 | ✅ |
| `Users can remove themselves from teams` | DELETE | 用戶離開團隊 | ✅ |
| `Team leaders can remove members` | DELETE | 領導者移除成員 | ✅ |

---

## 常見場景與解決方案

### 場景 1: 新用戶無法建立組織

**錯誤訊息**：
```
42501: new row violates row-level security policy for table "accounts"
```

**原因**：
- `get_user_account_id()` 返回 NULL（用戶的 User 帳戶尚未建立）
- 或 RLS 策略檢查失敗

**解決方案**：
```sql
-- 確保 handle_new_user 觸發器正確執行
-- 並且 RLS 策略不依賴 get_user_account_id()
CREATE POLICY "authenticated_users_create_organizations" ON public.accounts
FOR INSERT
TO authenticated
WITH CHECK (
  type = 'Organization'
  AND status <> 'deleted'
  -- 不需要檢查 get_user_account_id()
  -- 觸發器會自動處理 owner 關係
);
```

### 場景 2: 組織擁有者無法建立團隊

**錯誤訊息**：
```
42501: new row violates row-level security policy for table "teams"
```

**原因**：
- `org_owners_create_teams` 策略中的子查詢無法找到 owner 記錄
- `get_user_account_id()` 返回值與 `organization_members.account_id` 不匹配

**解決方案**：
確保 RLS 策略使用正確的 helper function：
```sql
CREATE POLICY "org_owners_create_teams" ON public.teams
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT organization_id
    FROM public.organization_members
    WHERE account_id = public.get_user_account_id()
      AND role = 'owner'
  )
);
```

### 場景 3: 團隊領導者無法新增成員

**錯誤訊息**：
```
42501: new row violates row-level security policy for table "team_members"
```

**原因**：
- 新建立的團隊沒有任何成員（雞蛋問題）
- `is_team_leader()` 返回 false

**解決方案**：
已透過觸發器 `add_team_creator_as_leader()` 解決：
```sql
CREATE TRIGGER add_team_creator_as_leader_trigger
  AFTER INSERT ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.add_team_creator_as_leader();
```

---

## 最佳實踐

### 1. 使用 SECURITY DEFINER 函數

```sql
-- ✅ 正確: 封裝權限檢查邏輯
CREATE OR REPLACE FUNCTION public.is_org_member(target_org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE organization_id = target_org_id
      AND auth_user_id = auth.uid()
  );
END;
$$;
```

### 2. 建立適當的索引

```sql
-- 為常用查詢建立索引
CREATE INDEX IF NOT EXISTS idx_organization_members_auth_user
  ON public.organization_members (auth_user_id);

CREATE INDEX IF NOT EXISTS idx_team_members_auth_user
  ON public.team_members (auth_user_id);

CREATE INDEX IF NOT EXISTS idx_accounts_auth_user_type
  ON public.accounts (auth_user_id, type);
```

### 3. 使用觸發器處理初始化

```sql
-- 建立資源後自動設置權限
CREATE TRIGGER add_creator_as_org_owner_trigger
  AFTER INSERT ON public.accounts
  FOR EACH ROW
  WHEN (NEW.type = 'Organization')
  EXECUTE FUNCTION public.add_creator_as_org_owner();
```

### 4. 提供初始化策略

```sql
-- 允許第一個成員的特殊策略
CREATE POLICY "Allow initial organization owner on creation" 
ON public.organization_members
FOR INSERT
TO authenticated
WITH CHECK (
  role = 'owner'
  AND auth_user_id = auth.uid()
  AND NOT public.organization_has_members(organization_id)
);
```

### 5. 正確處理 NULL 值

```sql
-- 在策略中明確處理 NULL
CREATE POLICY "example_policy" ON some_table
FOR SELECT
USING (
  account_id = public.get_user_account_id()
  OR public.get_user_account_id() IS NULL  -- 處理無 account 的情況
);
```

---

## 故障排除指南

### 步驟 1: 確認錯誤來源

```sql
-- 檢查是哪個策略拒絕了操作
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = '<table_name>';
```

### 步驟 2: 檢查用戶身份

```sql
-- 確認當前用戶的身份
SELECT 
  auth.uid() as auth_user_id,
  public.get_user_account_id() as account_id;
```

### 步驟 3: 驗證成員資格

```sql
-- 檢查組織成員資格
SELECT * FROM organization_members
WHERE auth_user_id = auth.uid();

-- 檢查團隊成員資格
SELECT * FROM team_members
WHERE auth_user_id = auth.uid();
```

### 步驟 4: 測試 Helper Functions

```sql
-- 測試 helper functions
SELECT 
  public.is_org_member('<org_id>') as is_member,
  public.is_org_owner('<org_id>') as is_owner,
  public.is_org_admin('<org_id>') as is_admin;
```

### 步驟 5: 模擬操作

```sql
-- 使用 service_role 測試操作（繞過 RLS）
SET ROLE service_role;
INSERT INTO teams (organization_id, name) VALUES ('<org_id>', 'Test');
RESET ROLE;
```

---

## 相關文檔

- [RLS 政策驗證工作流程](../.github/copilot/workflows/rls-check.workflow.md)
- [Supabase 整合指南](./supabase/README.md)
- [資料模型參考](./reference/data-model.md)

---

**最後更新**: 2025-11-29
**維護者**: 開發團隊

---

## 未來功能：Blueprints 和 Tasks RLS 策略建議

### 建議的 blueprints 表結構

```sql
CREATE TABLE public.blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  organization_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.accounts(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.blueprints ENABLE ROW LEVEL SECURITY;
```

### 建議的 blueprints RLS 策略

```sql
-- Helper function
CREATE OR REPLACE FUNCTION public.is_blueprint_member(target_blueprint_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.blueprint_members
    WHERE blueprint_id = target_blueprint_id
      AND auth_user_id = auth.uid()
  );
END;
$$;

-- SELECT: 組織成員可以查看藍圖
CREATE POLICY "org_members_view_blueprints" ON public.blueprints
FOR SELECT
TO authenticated
USING (
  public.is_org_member(organization_id)
);

-- INSERT: 組織擁有者可以建立藍圖
CREATE POLICY "org_owners_create_blueprints" ON public.blueprints
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_org_owner(organization_id)
  AND status != 'deleted'
);

-- UPDATE: 藍圖成員可以更新
CREATE POLICY "blueprint_members_update" ON public.blueprints
FOR UPDATE
TO authenticated
USING (
  public.is_blueprint_member(id)
  OR public.is_org_admin(organization_id)
)
WITH CHECK (
  status != 'deleted'
);
```

### 建議的 tasks 表結構

```sql
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID REFERENCES public.blueprints(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  assignee_id UUID REFERENCES public.accounts(id),
  created_by UUID REFERENCES public.accounts(id),
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
```

### 建議的 tasks RLS 策略

```sql
-- SELECT: 藍圖成員可以查看任務
CREATE POLICY "blueprint_members_view_tasks" ON public.tasks
FOR SELECT
TO authenticated
USING (
  public.is_blueprint_member(blueprint_id)
);

-- INSERT: 藍圖成員可以建立任務
CREATE POLICY "blueprint_members_create_tasks" ON public.tasks
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_blueprint_member(blueprint_id)
);

-- UPDATE: 任務建立者或負責人可以更新
CREATE POLICY "task_owners_update" ON public.tasks
FOR UPDATE
TO authenticated
USING (
  created_by = public.get_user_account_id()
  OR assignee_id = public.get_user_account_id()
  OR public.is_blueprint_member(blueprint_id)
)
WITH CHECK (
  public.is_blueprint_member(blueprint_id)
);
```

---

**注意**：以上是建議的結構和策略，實際實作時請根據業務需求調整。
