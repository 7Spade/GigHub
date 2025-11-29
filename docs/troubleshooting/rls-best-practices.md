# RLS 策略最佳實踐指南

> 預防 PostgreSQL 42501 (insufficient_privilege) 錯誤的完整指南

---

## 📋 RLS 設計原則

### 1. 避免循環依賴

**問題**：RLS 策略中查詢受 RLS 保護的表會導致無限遞迴。

**解決方案**：使用 `SECURITY DEFINER` 函數。

```sql
-- ✅ 正確做法：使用 SECURITY DEFINER 函數
CREATE OR REPLACE FUNCTION public.get_user_account_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER          -- 以函數定義者權限執行
SET row_security = off    -- 關閉 RLS 避免遞迴
STABLE                    -- 相同輸入返回相同結果
AS $$
DECLARE
  v_account_id UUID;
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
```

### 2. 處理初始化問題

**問題**：新建立的資源沒有任何成員，導致無法新增第一個成員。

**解決方案**：

#### 方案 A：使用觸發器自動初始化

```sql
-- 建立組織後自動新增 owner
CREATE OR REPLACE FUNCTION public.add_creator_as_org_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET row_security = off
AS $$
DECLARE
  v_user_account_id UUID;
BEGIN
  IF NEW.type = 'Organization' AND TG_OP = 'INSERT' THEN
    SELECT id INTO v_user_account_id
    FROM public.accounts
    WHERE auth_user_id = auth.uid()
      AND type = 'User'
      AND status != 'deleted'
    LIMIT 1;

    IF v_user_account_id IS NOT NULL THEN
      INSERT INTO public.organization_members (
        organization_id,
        account_id,
        role,
        auth_user_id
      ) VALUES (
        NEW.id,
        v_user_account_id,
        'owner',
        auth.uid()
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER add_creator_as_org_owner_trigger
  AFTER INSERT ON public.accounts
  FOR EACH ROW
  WHEN (NEW.type = 'Organization')
  EXECUTE FUNCTION public.add_creator_as_org_owner();
```

#### 方案 B：特殊初始化策略

```sql
-- 允許建立第一個 owner
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

### 3. 使用 auth_user_id 而非 account_id

**原因**：直接使用 `auth.uid()` 可以避免查詢 accounts 表造成的遞迴。

```sql
-- ✅ 優先使用 auth_user_id
CREATE POLICY "Users can view organization members" 
ON public.organization_members
FOR SELECT
TO authenticated
USING (
  auth_user_id = auth.uid()              -- 直接比對，無遞迴
  OR public.is_org_member(organization_id)  -- 使用 helper function
);

-- ❌ 避免直接查詢 accounts
CREATE POLICY "bad_policy" 
ON public.organization_members
FOR SELECT
USING (
  account_id = (
    SELECT id FROM accounts WHERE auth_user_id = auth.uid()  -- 可能遞迴
  )
);
```

---

## 📊 Helper Functions 設計模式

### 標準 Helper Function 模板

```sql
CREATE OR REPLACE FUNCTION public.is_<resource>_<role>(target_id uuid)
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
    FROM public.<membership_table>
    WHERE <resource>_id = target_id
      AND auth_user_id = auth.uid()
      AND role = '<role>'
  );
END;
$$;
```

### 必要的 Helper Functions

| 函數名稱 | 用途 | 使用場景 |
|---------|------|---------|
| `get_user_account_id()` | 取得用戶的 account_id | 避免 accounts 表遞迴 |
| `is_org_member(org_id)` | 檢查是否為組織成員 | 組織資源的 SELECT |
| `is_org_owner(org_id)` | 檢查是否為組織擁有者 | 組織資源的 INSERT/UPDATE/DELETE |
| `is_org_admin(org_id)` | 檢查是否為組織管理員 | 成員管理 |
| `organization_has_members(org_id)` | 檢查組織是否有成員 | 初始化策略 |
| `is_team_member(team_id)` | 檢查是否為團隊成員 | 團隊資源的 SELECT |
| `is_team_leader(team_id)` | 檢查是否為團隊領導者 | 團隊成員管理 |

---

## 🔧 新增資料表的 RLS 清單

建立新資料表時，請依照以下清單設置 RLS：

### 檢查清單

- [ ] 啟用 RLS：`ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
- [ ] 建立 SELECT 策略
- [ ] 建立 INSERT 策略（含初始化處理）
- [ ] 建立 UPDATE 策略
- [ ] 建立 DELETE 策略（或軟刪除）
- [ ] 建立必要的 Helper Functions
- [ ] 建立索引優化查詢效能
- [ ] 測試所有操作場景

### RLS 策略模板

```sql
-- 1. 啟用 RLS
ALTER TABLE public.<table_name> ENABLE ROW LEVEL SECURITY;

-- 2. SELECT 策略
CREATE POLICY "<table>_select" ON public.<table_name>
FOR SELECT
TO authenticated
USING (
  -- 使用 helper function 或直接條件
  public.is_<resource>_member(<foreign_key>)
);

-- 3. INSERT 策略
CREATE POLICY "<table>_insert" ON public.<table_name>
FOR INSERT
TO authenticated
WITH CHECK (
  -- 檢查用戶有權限建立
  public.is_<resource>_<required_role>(<foreign_key>)
);

-- 4. UPDATE 策略
CREATE POLICY "<table>_update" ON public.<table_name>
FOR UPDATE
TO authenticated
USING (
  -- 檢查用戶有權限更新
  created_by = public.get_user_account_id()
  OR public.is_<resource>_admin(<foreign_key>)
)
WITH CHECK (
  -- 驗證更新後的資料
  public.is_<resource>_member(<foreign_key>)
);

-- 5. DELETE 策略（軟刪除優先）
CREATE POLICY "<table>_soft_delete" ON public.<table_name>
FOR UPDATE
TO authenticated
USING (
  -- 只允許軟刪除
  status != 'deleted'
  AND (
    created_by = public.get_user_account_id()
    OR public.is_<resource>_admin(<foreign_key>)
  )
)
WITH CHECK (
  status = 'deleted'
);
```

---

## 🧪 測試 RLS 策略

### 測試腳本模板

```sql
-- 設置測試環境
BEGIN;

-- 模擬認證用戶
SET LOCAL request.jwt.claims = '{"sub": "test-user-uuid"}';

-- 測試 1: SELECT 權限
SELECT * FROM <table_name> WHERE id = '<test_id>';
-- 預期: 有權限時返回記錄，無權限時返回空

-- 測試 2: INSERT 權限
INSERT INTO <table_name> (column1, column2) VALUES ('value1', 'value2');
-- 預期: 有權限時成功，無權限時報 42501 錯誤

-- 測試 3: UPDATE 權限
UPDATE <table_name> SET column1 = 'new_value' WHERE id = '<test_id>';
-- 預期: 有權限時更新成功，無權限時影響 0 行

-- 測試 4: DELETE 權限
DELETE FROM <table_name> WHERE id = '<test_id>';
-- 預期: 有權限時刪除成功，無權限時影響 0 行

-- 清理
ROLLBACK;
```

### 使用 service_role 繞過 RLS 測試

```sql
-- 切換到 service_role（繞過 RLS）
SET ROLE service_role;

-- 執行操作
INSERT INTO <table_name> VALUES (...);

-- 恢復角色
RESET ROLE;
```

---

## 🚨 常見錯誤與修復

### 錯誤 1: "infinite recursion detected"

**原因**：RLS 策略中查詢受保護的表。

**修復**：
```sql
-- 使用 SECURITY DEFINER 函數
CREATE OR REPLACE FUNCTION public.helper_function()
RETURNS <type>
LANGUAGE plpgsql
SECURITY DEFINER
SET row_security = off
AS $$ ... $$;
```

### 錯誤 2: "new row violates row-level security policy"

**原因**：INSERT 的 WITH CHECK 條件不滿足。

**檢查步驟**：
1. 確認用戶身份：`SELECT auth.uid();`
2. 確認 account：`SELECT public.get_user_account_id();`
3. 確認權限：`SELECT public.is_xxx_member(id);`

### 錯誤 3: Helper function 返回 NULL

**原因**：用戶沒有對應的 accounts 記錄。

**修復**：
```sql
-- 確保 handle_new_user 觸發器存在
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

---

## 📚 參考資源

- [Supabase RLS 官方文檔](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS 文檔](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [42501 錯誤分析](./postgresql-42501-analysis.md)

---

**最後更新**: 2025-11-29
**維護者**: 開發團隊
