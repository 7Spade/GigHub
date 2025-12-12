# Supabase MCP 資料庫遷移執行指南

> **目標**: 使用 Supabase MCP 將 PR #63 的 SQL 遷移同步到遠端資料庫

## 📌 執行環境說明

### ⚠️ 重要限制
本 GitHub Actions 環境**無法直接執行** Supabase MCP 工具。原因：
- MCP 工具配置於 GitHub Copilot IDE 整合中
- 需要在支援 MCP 的環境中執行（VS Code Copilot Chat、Claude Desktop）
- GitHub Actions runner 無法訪問 IDE 層級的 MCP 服務

### ✅ 正確執行方式

請在以下任一環境中執行此遷移：

#### 方法 1: GitHub Copilot Chat（推薦）
1. 在 VS Code 中開啟此專案
2. 開啟 GitHub Copilot Chat
3. 確認 Supabase MCP 已在 GitHub Settings → Copilot 中配置
4. 使用下方的指令範本

#### 方法 2: Claude Desktop
1. 配置 Claude Desktop 的 MCP server（參見下方配置）
2. 在 Claude 中執行遷移指令

#### 方法 3: Supabase Dashboard（最簡單）
1. 訪問: https://supabase.com/dashboard/project/zecsbstjqjqoytwgjyct
2. 進入 SQL Editor
3. 依序複製貼上三個 SQL 檔案內容執行

---

## 🎯 遷移檔案資訊

### 遠端資料庫
- **URL**: `https://zecsbstjqjqoytwgjyct.supabase.co`
- **Project Ref**: `zecsbstjqjqoytwgjyct`

### 遷移檔案清單
1. **20251212_01_create_tasks_table.sql** - 建立 tasks 表（含索引、觸發器）
2. **20251212_02_create_logs_table.sql** - 建立 logs 表（含 JSONB、GIN 索引）
3. **20251212_03_create_rls_policies.sql** - 建立 RLS 政策（多租戶隔離）

**⚠️ 必須按此順序執行**（RLS 政策依賴前兩個表）

---

## 📋 方法 1: 使用 GitHub Copilot Chat

在 VS Code 的 Copilot Chat 中，依序執行：

### Step 1: 執行第一個遷移
```
@workspace 請使用 Supabase MCP 的 apply_migration 工具，執行以下操作：

遷移名稱: 20251212_01_create_tasks_table
SQL 檔案: supabase/migrations/20251212_01_create_tasks_table.sql
目標資料庫: https://zecsbstjqjqoytwgjyct.supabase.co

請讀取檔案內容並執行遷移。
```

### Step 2: 執行第二個遷移
```
@workspace 請使用 Supabase MCP 的 apply_migration 工具，執行以下操作：

遷移名稱: 20251212_02_create_logs_table
SQL 檔案: supabase/migrations/20251212_02_create_logs_table.sql
目標資料庫: https://zecsbstjqjqoytwgjyct.supabase.co

請讀取檔案內容並執行遷移。
```

### Step 3: 執行第三個遷移
```
@workspace 請使用 Supabase MCP 的 apply_migration 工具，執行以下操作：

遷移名稱: 20251212_03_create_rls_policies
SQL 檔案: supabase/migrations/20251212_03_create_rls_policies.sql
目標資料庫: https://zecsbstjqjqoytwgjyct.supabase.co

請讀取檔案內容並執行遷移。
```

### Step 4: 驗證遷移結果
```
@workspace 請使用 Supabase MCP 的 execute_sql 工具，執行以下驗證查詢：

SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('tasks', 'logs');

SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('tasks', 'logs');

SELECT tablename, COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
GROUP BY tablename;

SELECT * FROM public.test_rls_policies();
```

---

## 📋 方法 2: 使用 Claude Desktop

### 配置 MCP Server

編輯 `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) 或  
`%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase-community/supabase-mcp@latest",
        "--project-ref",
        "zecsbstjqjqoytwgjyct",
        "--api-key",
        "YOUR_SUPABASE_SERVICE_ROLE_KEY"
      ]
    }
  }
}
```

**獲取 Service Role Key**:
1. 訪問 https://supabase.com/dashboard/project/zecsbstjqjqoytwgjyct/settings/api
2. 複製 `service_role` key（secret）

### 在 Claude 中執行

重啟 Claude Desktop 後，使用以下指令：

```
請使用 apply_migration 工具執行以下遷移：

1. 遷移名稱: 20251212_01_create_tasks_table
   SQL: [貼上 supabase/migrations/20251212_01_create_tasks_table.sql 的完整內容]

2. 遷移名稱: 20251212_02_create_logs_table
   SQL: [貼上 supabase/migrations/20251212_02_create_logs_table.sql 的完整內容]

3. 遷移名稱: 20251212_03_create_rls_policies
   SQL: [貼上 supabase/migrations/20251212_03_create_rls_policies.sql 的完整內容]

請依序執行，並在每個步驟後報告結果。
```

---

## 📋 方法 3: 使用 Supabase Dashboard (最簡單)

### 步驟
1. 訪問 https://supabase.com/dashboard/project/zecsbstjqjqoytwgjyct
2. 左側選單點選 **SQL Editor**
3. 點選 **New Query**
4. 複製 `supabase/migrations/20251212_01_create_tasks_table.sql` 內容
5. 點選 **Run** 執行
6. 重複步驟 3-5，依序執行第 2、3 個遷移

### 驗證
執行以下查詢確認成功：
```sql
-- 檢查表
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('tasks', 'logs');

-- 預期結果: 應顯示 tasks 和 logs 兩個表
```

---

## 🔍 遷移內容摘要

### Migration 01: tasks 表
- **表**: `public.tasks`
- **主鍵**: UUID (id)
- **外鍵**: blueprint_id, creator_id, assignee_id
- **索引**: 8 個（blueprint_id, creator_id, assignee_id, status, due_date, created_at, deleted_at, 複合索引）
- **觸發器**: update_updated_at_column
- **特色**: 軟刪除支援、JSONB 欄位（attachments, metadata）、標籤陣列

### Migration 02: logs 表
- **表**: `public.logs`
- **主鍵**: UUID (id)
- **外鍵**: blueprint_id, creator_id
- **索引**: 9 個（含 3 個 GIN 索引用於 JSONB 搜尋）
- **觸發器**: update_updated_at_column, update_log_photo_stats
- **特色**: 施工日誌、天氣記錄、工時統計、多媒體附件（photos, voice_records, documents）

### Migration 03: RLS 政策
- **啟用 RLS**: tasks, logs 表
- **輔助函式**: 
  - `get_user_organization_id()` - 從 JWT 提取組織 ID
  - `get_user_id()` - 從 JWT 提取使用者 ID
  - `get_user_role()` - 從 JWT 提取角色
  - `is_blueprint_in_user_organization()` - 檢查藍圖歸屬
- **政策**:
  - tasks: 5 個（SELECT, INSERT, UPDATE, DELETE, SELECT deleted）
  - logs: 6 個（SELECT, INSERT, UPDATE user/admin, DELETE, SELECT deleted）
- **特色**: Organization-based 多租戶隔離、角色權限控制

---

## ⚠️ 前置條件檢查

### 必須存在的表
- `public.blueprints` (含 `organization_id` 欄位)

**檢查方式**:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'blueprints'
AND column_name = 'organization_id';
```

如果 blueprints 表不存在，RLS 政策中的 `is_blueprint_in_user_organization()` 函式會失敗。

### JWT Claims 要求
Firebase Auth 必須設定 custom claims：
- `organization_id`: UUID 格式
- `role`: 'admin' | 'member' | 'viewer'

---

## ✅ 驗證清單

執行所有遷移後，確認：

### 1. 表已建立
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('tasks', 'logs');
```
✅ 預期: 返回 `tasks` 和 `logs`

### 2. RLS 已啟用
```sql
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('tasks', 'logs');
```
✅ 預期: 兩個表的 `rowsecurity` 都是 `true`

### 3. 索引已建立
```sql
SELECT tablename, indexname FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('tasks', 'logs');
```
✅ 預期: tasks 有 8 個索引，logs 有 9 個索引

### 4. 觸發器已建立
```sql
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND event_object_table IN ('tasks', 'logs');
```
✅ 預期: tasks 有 1 個觸發器，logs 有 2 個觸發器

### 5. RLS 政策已建立
```sql
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
GROUP BY tablename;
```
✅ 預期: tasks 有 5 個政策，logs 有 6 個政策

### 6. 測試函式
```sql
SELECT * FROM public.test_rls_policies();
```
✅ 預期: 所有測試通過（passed = true）

---

## 🔧 故障排除

### 問題 1: "relation blueprints does not exist"
**原因**: blueprints 表尚未建立  
**解決**: 先建立 blueprints 表，或暫時註解掉 RLS 中的 `is_blueprint_in_user_organization()` 檢查

### 問題 2: "permission denied"
**原因**: 使用的 API key 權限不足  
**解決**: 使用 `service_role` key（有完整 admin 權限）

### 問題 3: "syntax error at or near RAISE"
**原因**: PostgreSQL 版本過舊  
**解決**: 確認資料庫版本 >= 15（執行 `SHOW server_version;`）

### 問題 4: RLS 政策測試失敗
**原因**: JWT claims 函式無法正確讀取  
**解決**: 檢查 Firebase Auth 整合、JWT 格式、custom claims 設定

---

## 📚 相關資源

- **Supabase MCP GitHub**: https://github.com/supabase-community/supabase-mcp
- **Supabase RLS 文檔**: https://supabase.com/docs/guides/auth/row-level-security
- **PR #63**: https://github.com/7Spade/GigHub/pull/63
- **本地遷移檔案**: `supabase/migrations/`

---

## 📝 執行記錄

請在執行後填寫：

### Migration 01: tasks 表
- [ ] 執行時間: _______________
- [ ] 執行方式: □ Copilot Chat  □ Claude Desktop  □ Dashboard
- [ ] 結果: □ 成功  □ 失敗
- [ ] 錯誤訊息（如有）: _______________

### Migration 02: logs 表
- [ ] 執行時間: _______________
- [ ] 執行方式: □ Copilot Chat  □ Claude Desktop  □ Dashboard
- [ ] 結果: □ 成功  □ 失敗
- [ ] 錯誤訊息（如有）: _______________

### Migration 03: RLS 政策
- [ ] 執行時間: _______________
- [ ] 執行方式: □ Copilot Chat  □ Claude Desktop  □ Dashboard
- [ ] 結果: □ 成功  □ 失敗
- [ ] 錯誤訊息（如有）: _______________

### 驗證結果
- [ ] 表已建立（tasks, logs）
- [ ] RLS 已啟用
- [ ] 索引數量正確（tasks: 8, logs: 9）
- [ ] 觸發器數量正確（tasks: 1, logs: 2）
- [ ] 政策數量正確（tasks: 5, logs: 6）
- [ ] 測試函式通過

---

**建議**: 如果您在 VS Code 中查看此文件，請使用 GitHub Copilot Chat 執行遷移，這是最方便的方式。
