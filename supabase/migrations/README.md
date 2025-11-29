# Supabase Migrations

> 依據 README 規劃實作的完整遷移檔案

---

## 📁 目錄結構

```
migrations/
├── README.md                                              # 本文件
├── 20251201000001_create_extensions.sql                   # Phase 1
├── 20251201000002_create_enums.sql                        # Phase 1
├── 20251201000003_create_utility_functions.sql            # Phase 1
├── 20251201000004_create_accounts_table.sql               # Phase 1
├── 20251201000005_create_organization_members_table.sql   # Phase 1
├── 20251201000006_create_teams_table.sql                  # Phase 1
├── 20251201000007_create_team_members_table.sql           # Phase 1
├── 20251202000001_create_get_user_account_id_function.sql # Phase 2
├── 20251202000002_create_is_org_member_function.sql       # Phase 2
├── 20251202000003_create_is_org_admin_function.sql        # Phase 2
├── 20251202000004_create_is_team_member_function.sql      # Phase 2
├── 20251202000005_create_is_team_leader_function.sql      # Phase 2
├── 20251203000001_enable_rls_core_tables.sql              # Phase 3
├── 20251203000002_create_user_rls_policies.sql            # Phase 3
├── 20251203000003_create_org_members_rls_policies.sql     # Phase 3
├── 20251203000004_create_teams_rls_policies.sql           # Phase 3
├── 20251203000005_create_team_members_rls_policies.sql    # Phase 3
├── 20251204000001_create_handle_new_user_trigger.sql      # Phase 4
├── 20251204000002_create_add_creator_as_org_owner_trigger.sql  # Phase 4
├── 20251204000003_create_add_creator_as_team_leader_trigger.sql # Phase 4
├── 20251205000001_create_blueprints_table.sql             # Phase 5
├── 20251205000002_create_blueprint_members_table.sql      # Phase 5
├── 20251205000003_create_blueprint_helper_functions.sql   # Phase 5
├── 20251205000004_create_blueprint_rls_policies.sql       # Phase 5
├── 20251205000005_create_blueprint_triggers.sql           # Phase 5
├── 20251206000001_create_tasks_table.sql                  # Phase 6
├── 20251206000002_create_task_helper_functions.sql        # Phase 6
└── 20251206000003_create_task_rls_policies.sql            # Phase 6
```

---

## 🚀 Phase 概覽

### Phase 1: Core Schema (YYYYMM01)
基礎表結構：extensions, enums, accounts, organization_members, teams, team_members

### Phase 2: Helper Functions (YYYYMM02)
SECURITY DEFINER 函式：get_user_account_id, is_org_member, is_org_admin, is_team_member, is_team_leader

### Phase 3: RLS Policies (YYYYMM03)
行級安全策略：accounts, organization_members, teams, team_members

### Phase 4: Triggers (YYYYMM04)
觸發器：handle_new_user, add_creator_as_org_owner, add_creator_as_team_leader

### Phase 5: Blueprint System (YYYYMM05)
藍圖系統：blueprints, blueprint_members, helper functions, RLS policies, triggers

### Phase 6: Task System (YYYYMM06)
任務系統：tasks, helper functions, RLS policies

---

## 🔐 42501 錯誤解決方案

所有 Helper Functions 使用 SECURITY DEFINER + `SET row_security = off` 模式避免 RLS 無限遞迴：

```sql
CREATE OR REPLACE FUNCTION public.get_user_account_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
-- 實現邏輯
$$;
```

---

## 📋 命名規範

| 類型 | 格式 | 範例 |
|------|------|------|
| 遷移檔案 | `YYYYMMDDNNNNNN_動作_對象.sql` | `20251201000001_create_extensions.sql` |
| 表格 | snake_case 複數 | `accounts`, `organization_members` |
| 函式 | snake_case | `get_user_account_id()` |
| 政策 | snake_case 描述性 | `users_view_own_user_account` |
| 觸發器 | snake_case_trigger | `add_org_creator_trigger` |

---

## 🔧 執行命令

```bash
# 執行所有遷移
supabase db push

# 重置資料庫
supabase db reset

# 檢查遷移狀態
supabase migration list
```

---

**最後更新**: 2025-11-29
