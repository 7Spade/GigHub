# Supabase MCP 使用指南

本指南說明如何使用 Supabase MCP (Model Context Protocol) 來同步遷移檔案和驗證資料庫一致性。

## 前置需求

1. Supabase 專案已設置
2. 具備 Supabase Access Token
3. 安裝 Supabase CLI

## 使用 Supabase MCP

### 1. 同步遷移到資料庫

使用 Supabase MCP 的 `execute_sql` 工具來執行遷移：

```
# 透過 MCP 執行以下 SQL 檔案
# 順序很重要，請按順序執行：

1. supabase/migrations/20251124000001_create_get_user_account_id_function.sql
2. supabase/migrations/20251124000002_rewrite_user_rls_policies.sql
3. supabase/migrations/20251124000003_rewrite_organization_rls_policies.sql
4. supabase/migrations/20251124000004_rewrite_bot_rls_policies.sql
5. supabase/migrations/20251124000005_create_team_rls_policies.sql
6. supabase/migrations/20251124000006_fix_membership_rls_policies.sql
7. supabase/migrations/20251124000007_update_org_insert_policy.sql
8. supabase/migrations/20251124000008_update_add_creator_trigger.sql
9. supabase/migrations/20251124000009_simplify_org_insert_policy.sql
10. supabase/migrations/20251124000010_fix_unique_auth_user_id_constraint.sql
11. supabase/migrations/20251124000011_fix_org_members_select_circular_dependency.sql
12. supabase/migrations/20251124000012_fix_team_members_insert_policy.sql
13. supabase/migrations/20251124000013_fix_team_members_initial_leader_policy.sql
14. supabase/migrations/20251124000014_auto_add_team_creator_as_leader.sql
15. supabase/migrations/20251129000001_create_blueprints_table.sql
16. supabase/migrations/20251129000002_create_tasks_table.sql
```

### 2. 驗證資料庫一致性

執行 `supabase/verify_schema.sql` 來檢查資料庫是否與遷移一致：

```sql
-- 在 Supabase MCP 終端執行以下查詢來驗證
-- 或者直接執行 supabase/verify_schema.sql 的內容

-- 檢查必要的 Helper Functions
SELECT 
  'Helper Functions Check' AS check_type,
  CASE 
    WHEN COUNT(*) >= 6 THEN '✅ All helper functions exist'
    ELSE '❌ Missing functions: Expected >= 6, Found ' || COUNT(*)
  END AS status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'is_blueprint_member', 
    'is_blueprint_admin', 
    'is_blueprint_owner',
    'can_access_task',
    'can_access_checklist',
    'is_checklist_admin'
  );

-- 檢查表是否存在
SELECT 
  'Tables Check' AS check_type,
  table_name,
  CASE 
    WHEN table_name IS NOT NULL THEN '✅ Exists'
    ELSE '❌ Missing'
  END AS status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('blueprints', 'blueprint_members', 'tasks', 'task_attachments')
ORDER BY table_name;

-- 檢查 RLS 是否啟用
SELECT 
  'RLS Enabled' AS check_type,
  relname AS table_name,
  CASE 
    WHEN relrowsecurity THEN '✅ Enabled'
    ELSE '❌ Disabled'
  END AS status
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname IN ('blueprints', 'blueprint_members', 'tasks', 'task_attachments');
```

## 42501 權限錯誤修復原理

### 問題原因

42501 錯誤（permission denied）通常發生在：
1. RLS (Row Level Security) 政策配置不正確
2. Helper functions 使用了不正確的安全設置
3. RLS 政策中存在循環依賴（遞迴）

### 解決方案

本遷移使用以下策略來修復 42501 錯誤：

1. **SECURITY DEFINER Functions**: 
   - `is_blueprint_member()`, `is_blueprint_admin()`, `is_blueprint_owner()`
   - 這些函數使用 `SECURITY DEFINER` 來避免 RLS 遞迴
   - 設置 `SET row_security = off` 來繞過 RLS 檢查

2. **簡化的 RLS 政策**:
   - 使用 helper functions 而不是直接查詢
   - 避免在 RLS 政策中進行複雜的子查詢

3. **正確的權限授予**:
   - 只授予 `authenticated` 角色執行權限
   - 撤銷 `anon` 和 `public` 的權限

## 驗證修復是否成功

執行以下測試來驗證 42501 錯誤是否已修復：

```sql
-- 以認證用戶身份測試查詢
-- 在 Supabase MCP 終端執行

-- 測試 1: 查詢藍圖（應該成功，不報 42501）
SELECT id, name FROM public.blueprints LIMIT 5;

-- 測試 2: 查詢任務（應該成功，不報 42501）
SELECT id, name, status FROM public.tasks LIMIT 5;

-- 測試 3: 驗證 helper function 工作正常
SELECT public.is_blueprint_member('00000000-0000-0000-0000-000000000000'::UUID);
```

## 常見問題排除

### 問題 1: 遷移執行失敗

**解決方案**:
1. 檢查是否有前置依賴未滿足
2. 確認 `get_user_account_id()` function 存在
3. 檢查資料庫連接權限

### 問題 2: RLS 仍然報錯

**解決方案**:
1. 確認所有 helper functions 都是 `SECURITY DEFINER`
2. 檢查函數的 `SET row_security = off` 設置
3. 驗證函數權限正確授予給 `authenticated`

### 問題 3: 表不存在

**解決方案**:
1. 按順序執行所有遷移
2. 確認 `blueprints` 表在 `tasks` 表之前創建
3. 檢查外鍵約束是否正確

## 聯繫支援

如果問題持續存在，請：
1. 檢查 Supabase Dashboard 的錯誤日誌
2. 執行完整的 `verify_schema.sql` 並查看結果
3. 在 GitHub Issues 中報告問題
