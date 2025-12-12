# 🚀 快速開始：執行 Supabase 遷移

> **5 分鐘內完成資料庫遷移**

## ⚡ 最快方式（推薦）

### 選項 A: 使用 Supabase Dashboard

**不需要任何配置，立即執行！**

1. **開啟 SQL Editor**
   - 訪問: https://supabase.com/dashboard/project/zecsbstjqjqoytwgjyct/editor
   
2. **執行 Migration 01**
   - 點選 **New Query**
   - 複製 `supabase/migrations/20251212_01_create_tasks_table.sql` 的完整內容
   - 貼上並點選 **Run** 或按 `Ctrl+Enter`
   - ✅ 等待顯示 "Success"

3. **執行 Migration 02**
   - 點選 **New Query**
   - 複製 `supabase/migrations/20251212_02_create_logs_table.sql` 的完整內容
   - 貼上並點選 **Run**
   - ✅ 等待顯示 "Success"

4. **執行 Migration 03**
   - 點選 **New Query**
   - 複製 `supabase/migrations/20251212_03_create_rls_policies.sql` 的完整內容
   - 貼上並點選 **Run**
   - ✅ 等待顯示 "Success"

5. **驗證結果**
   - 點選 **New Query**
   - 複製以下驗證查詢並執行:
   ```sql
   -- 檢查表
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('tasks', 'logs');
   
   -- 檢查 RLS
   SELECT tablename, rowsecurity FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN ('tasks', 'logs');
   
   -- 檢查政策
   SELECT tablename, COUNT(*) FROM pg_policies 
   WHERE schemaname = 'public' 
   GROUP BY tablename;
   ```
   - ✅ 預期結果：
     - 表查詢返回 2 筆（tasks, logs）
     - RLS 查詢顯示兩個表 rowsecurity = true
     - 政策查詢顯示 tasks: 5, logs: 6

**完成！** 🎉

---

### 選項 B: 使用 VS Code Copilot Chat

**如果您在 VS Code 中開啟此專案：**

1. **開啟 Copilot Chat**
   - 快捷鍵: `Ctrl+Shift+I` (Windows/Linux) 或 `Cmd+Shift+I` (Mac)
   - 或點選左側 Copilot 圖示

2. **執行遷移指令**
   - 複製以下指令貼到 Copilot Chat：
   ```
   @workspace 請使用 Supabase MCP 執行以下遷移到遠端資料庫 https://zecsbstjqjqoytwgjyct.supabase.co：

   1. 讀取 supabase/migrations/20251212_01_create_tasks_table.sql
      使用 apply_migration 工具，migration_name: "20251212_01_create_tasks_table"

   2. 讀取 supabase/migrations/20251212_02_create_logs_table.sql
      使用 apply_migration 工具，migration_name: "20251212_02_create_logs_table"

   3. 讀取 supabase/migrations/20251212_03_create_rls_policies.sql
      使用 apply_migration 工具，migration_name: "20251212_03_create_rls_policies"

   請依序執行，並在每個步驟後報告結果。
   ```

3. **驗證結果**
   - Copilot 會自動執行並報告結果
   - 如需手動驗證，請要求 Copilot 執行驗證查詢

**完成！** 🎉

---

## ⚠️ 執行前檢查

### 必要條件

在執行遷移前，請確認：

1. **blueprints 表已存在**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' AND table_name = 'blueprints';
   ```
   - 如果返回空，RLS 政策會失敗
   - 解決: 先建立 blueprints 表或暫時跳過 Migration 03

2. **有適當的權限**
   - Supabase Dashboard 登入的帳號必須是專案 Owner 或 Admin
   - 如使用 MCP，需要 service_role key

### 執行順序

**必須**按此順序執行（不可跳過或調換）：
1. ✅ Migration 01: 建立 tasks 表
2. ✅ Migration 02: 建立 logs 表  
3. ✅ Migration 03: 建立 RLS 政策

**原因**: Migration 03 依賴前兩個表的存在

---

## 📊 執行時間預估

| 步驟 | 預估時間 |
|------|----------|
| Migration 01 | < 1 秒 |
| Migration 02 | < 1 秒 |
| Migration 03 | < 2 秒 |
| 驗證 | < 1 秒 |
| **總計** | **< 5 秒** |

---

## ✅ 成功標準

執行成功後，您應該看到：

### 1. 在 Supabase Dashboard → Database → Tables
- ✅ `tasks` 表（含 15 個欄位）
- ✅ `logs` 表（含 16 個欄位）

### 2. 在 SQL Editor 執行驗證查詢後
```sql
SELECT 
  (SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('tasks', 'logs')) as tables_count,
  (SELECT COUNT(*) FROM pg_indexes 
   WHERE schemaname = 'public' 
   AND tablename IN ('tasks', 'logs')) as indexes_count,
  (SELECT COUNT(*) FROM pg_policies 
   WHERE schemaname = 'public' 
   AND tablename IN ('tasks', 'logs')) as policies_count;
```

**預期結果**:
```
tables_count  | indexes_count | policies_count
--------------+---------------+---------------
           2  |            17 |            11
```

---

## 🔧 遇到問題？

### 問題 1: "relation blueprints does not exist"
**原因**: blueprints 表尚未建立  
**解決**: 
- 方案 A: 先建立 blueprints 表
- 方案 B: 暫時只執行 Migration 01 和 02，稍後再執行 03

### 問題 2: "permission denied"
**原因**: 權限不足  
**解決**: 
- 確認在 Dashboard 中以 Owner 或 Admin 身份登入
- 如使用 MCP，確認使用 service_role key

### 問題 3: 執行卡住
**原因**: SQL 語法可能有問題  
**解決**:
- 檢查是否完整複製了 SQL 內容
- 確認沒有遺漏任何字元
- 嘗試重新複製貼上

---

## 📚 詳細文檔

如需更詳細的說明，請參考：

- **完整執行指南**: [SUPABASE_MCP_MIGRATION_GUIDE.md](./SUPABASE_MCP_MIGRATION_GUIDE.md)
- **遷移說明**: [supabase/migrations/README.md](./supabase/migrations/README.md)
- **執行總結**: [.github/SUPABASE_MCP_EXECUTION_SUMMARY.md](./.github/SUPABASE_MCP_EXECUTION_SUMMARY.md)

---

## 💡 小提示

- ✅ **最簡單**: 使用 Supabase Dashboard
- ✅ **最快速**: VS Code Copilot Chat（如果已配置）
- ✅ **最安全**: 都很安全，選您熟悉的方式即可
- ✅ **記得驗證**: 執行完務必執行驗證查詢

---

**準備好了嗎？選擇上面的任一方式開始執行！** 🚀
