# PR #63 部署指南 - Supabase 遷移

## 📋 概述

本指南提供 PR #63 中 Supabase 遷移的完整部署步驟。這些遷移建立了 `tasks` 和 `logs` 表格，並配置了 RLS 政策。

## 🎯 部署目標

部署以下三個遷移檔案到 Supabase 遠端資料庫：

1. ✅ `20251212_01_create_tasks_table.sql` - 建立任務表格
2. ✅ `20251212_02_create_logs_table.sql` - 建立日誌表格
3. ✅ `20251212_03_create_rls_policies.sql` - 配置 RLS 安全政策

## 🚀 部署方法

### 方法 1: 使用 Supabase MCP (推薦) 🤖

**透過 GitHub Copilot Agent 部署**

在 [PR #63](https://github.com/7Spade/GigHub/pull/63) 中發表評論：

```markdown
@copilot 請使用 Supabase MCP 工具執行以下任務：

1. 連接到 GigHub 專案的遠端 Supabase 資料庫
2. 依序執行以下遷移檔案：
   - `supabase/migrations/20251212_01_create_tasks_table.sql`
   - `supabase/migrations/20251212_02_create_logs_table.sql`
   - `supabase/migrations/20251212_03_create_rls_policies.sql`
3. 驗證以下內容：
   - `tasks` 表格已建立並包含所有欄位
   - `logs` 表格已建立並包含所有欄位
   - RLS 政策已在兩個表格上啟用
   - 所有索引已正確建立
   - 觸發器已正確配置

請在完成後提供詳細的執行報告，包括任何錯誤或警告訊息。
```

**Copilot Agent 將會：**
- ✅ 自動讀取三個 SQL 遷移檔案
- ✅ 使用 Supabase MCP 連接到遠端資料庫
- ✅ 依序執行每個遷移
- ✅ 驗證表格結構與 RLS 政策
- ✅ 回報完整的執行結果

**預期回應範例**：
```markdown
✅ Migration deployment completed successfully!

## Execution Summary

### 1. 20251212_01_create_tasks_table.sql
- ✅ Created table: tasks
- ✅ Created indexes: 8 indexes
- ✅ Created triggers: update_tasks_updated_at
- Duration: 2.3s

### 2. 20251212_02_create_logs_table.sql
- ✅ Created table: logs
- ✅ Created indexes: 7 indexes (including GIN indexes)
- ✅ Created triggers: update_logs_updated_at, update_log_photo_stats_trigger
- Duration: 1.8s

### 3. 20251212_03_create_rls_policies.sql
- ✅ Enabled RLS on tasks table
- ✅ Enabled RLS on logs table
- ✅ Created 5 policies for tasks
- ✅ Created 6 policies for logs
- ✅ Created helper functions: 4 functions
- Duration: 1.2s

## Verification Results

✅ **Tables**: Both tasks and logs tables exist
✅ **Columns**: All required columns present
✅ **RLS**: Enabled on both tables
✅ **Policies**: 11 total policies created
✅ **Indexes**: All performance indexes created
✅ **Triggers**: All triggers functioning

Total execution time: 5.3s
```

---

### 方法 2: 使用 Bash 腳本 🐚

**在本地執行（需要配置 .env）**

#### 前置需求

1. 安裝 PostgreSQL 客戶端：
   ```bash
   # Ubuntu/Debian
   sudo apt-get install postgresql-client
   
   # macOS
   brew install postgresql
   ```

2. 配置環境變數：
   ```bash
   # 複製環境變數範本
   cp .env.example .env
   
   # 編輯 .env 並填入 Supabase 憑證
   nano .env
   ```
   
   需要設定：
   ```env
   POSTGRES_URL_NON_POOLING=postgres://postgres.[project-ref]:[password]@aws-region.pooler.supabase.com:5432/postgres
   ```

#### 執行步驟

```bash
# 方法 A: 使用 npm/yarn script
yarn db:migrate

# 方法 B: 直接執行腳本
./scripts/apply-migrations.sh

# 方法 C: 執行特定遷移
./scripts/apply-migrations.sh 20251212_01_create_tasks_table.sql
```

**執行過程**：
```
═══════════════════════════════════════════════════════════════
   Supabase Migration Application Script
═══════════════════════════════════════════════════════════════

✓ Loading environment variables from .env
✓ PostgreSQL connection URL found
✓ psql found: psql (PostgreSQL) 15.3
✓ Migrations directory: /path/to/GigHub/supabase/migrations

📋 Migration files to apply (3)

   • 20251212_01_create_tasks_table.sql
   • 20251212_02_create_logs_table.sql
   • 20251212_03_create_rls_policies.sql

⚠  About to apply 3 migration(s) to the remote database

Do you want to continue? (yes/no): yes

🚀 Applying migrations...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 Applying: 20251212_01_create_tasks_table.sql
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE
CREATE INDEX
...
✓ Migration applied successfully (2s)

[重複其他遷移...]

═══════════════════════════════════════════════════════════════
   Summary
═══════════════════════════════════════════════════════════════

Total migrations: 3
✓ Successful: 3
✗ Failed: 0

🎉 All migrations applied successfully!
```

---

### 方法 3: 使用 Supabase CLI 🛠️

**直接使用官方 CLI 工具**

#### 前置需求

```bash
# 安裝 Supabase CLI
npm install -g supabase

# 登入 Supabase
supabase login

# 連結專案
supabase link --project-ref your-project-id
```

#### 執行步驟

```bash
# 方法 A: 推送所有遷移
yarn supabase:push
# 或
supabase db push

# 方法 B: 推送特定遷移
supabase db push --file supabase/migrations/20251212_01_create_tasks_table.sql
supabase db push --file supabase/migrations/20251212_02_create_logs_table.sql
supabase db push --file supabase/migrations/20251212_03_create_rls_policies.sql
```

---

### 方法 4: 使用 GitHub Actions 🤖

**自動化 CI/CD 部署**

#### 觸發方式

1. **推送到 main 分支**（自動觸發）：
   ```bash
   git checkout main
   git merge feature/supabase-migrations
   git push origin main
   ```

2. **手動觸發**：
   - 前往 GitHub → Actions → "Deploy Supabase Migrations"
   - 點擊 "Run workflow"
   - 選擇環境（staging/production）
   - 點擊 "Run workflow"

#### Workflow 步驟

GitHub Actions 會自動執行：
1. ✅ Checkout 程式碼
2. ✅ 設定 Node.js 與 Supabase CLI
3. ✅ 驗證遷移檔案
4. ✅ 執行部署
5. ✅ 驗證結果
6. ✅ 在 PR 中發表評論

---

## 🔍 驗證部署

### 自動驗證（腳本執行後）

腳本會自動檢查：
- ✅ 表格是否存在
- ✅ RLS 政策是否啟用
- ✅ 政策數量是否正確

### 手動驗證

#### 1. 透過 Supabase Dashboard

1. 登入 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇 GigHub 專案
3. 前往 **Database** → **Tables**
4. 確認以下表格存在：
   - ✅ `tasks` - 包含 13 個欄位
   - ✅ `logs` - 包含 15 個欄位

#### 2. 透過 SQL Editor

在 Supabase Dashboard → **SQL Editor** 執行：

```sql
-- 檢查表格結構
\d tasks
\d logs

-- 檢查 RLS 狀態
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('tasks', 'logs');

-- 檢查政策數量
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN ('tasks', 'logs')
GROUP BY tablename;

-- 檢查索引
SELECT tablename, indexname 
FROM pg_indexes 
WHERE tablename IN ('tasks', 'logs')
ORDER BY tablename, indexname;

-- 測試插入（應該要求 organization_id）
INSERT INTO tasks (title, blueprint_id, creator_id) 
VALUES ('Test Task', gen_random_uuid(), auth.uid());
```

**預期結果**：
```
 tablename | rowsecurity 
-----------+-------------
 tasks     | t
 logs      | t

 tablename | policy_count 
-----------+--------------
 tasks     |            5
 logs      |            6
```

#### 3. 透過 Repository 測試

在 Angular 應用中測試：

```typescript
// src/app/test-supabase.component.ts
import { Component, inject } from '@angular/core';
import { TaskSupabaseRepository } from '@core/repositories/task-supabase.repository';
import { LogSupabaseRepository } from '@core/repositories/log-supabase.repository';

@Component({
  selector: 'app-test-supabase',
  template: `
    <button (click)="testTasks()">Test Tasks</button>
    <button (click)="testLogs()">Test Logs</button>
    <pre>{{ result }}</pre>
  `
})
export class TestSupabaseComponent {
  private taskRepo = inject(TaskSupabaseRepository);
  private logRepo = inject(LogSupabaseRepository);
  
  result = '';
  
  async testTasks() {
    try {
      // Test findAll
      const tasks = await this.taskRepo.findAll();
      this.result = `✅ Found ${tasks.length} tasks`;
    } catch (error) {
      this.result = `❌ Error: ${error.message}`;
    }
  }
  
  async testLogs() {
    try {
      // Test findAll
      const logs = await this.logRepo.findAll();
      this.result = `✅ Found ${logs.length} logs`;
    } catch (error) {
      this.result = `❌ Error: ${error.message}`;
    }
  }
}
```

---

## 🛡️ 安全檢查清單

部署前請確認：

- [ ] ✅ `.env` 檔案**未**提交到 Git
- [ ] ✅ 使用 **anon key** 在前端，**service role key** 僅用於後端
- [ ] ✅ RLS 政策已在所有表格上啟用
- [ ] ✅ 測試不同角色的存取權限（admin/member）
- [ ] ✅ 驗證跨組織資料隔離
- [ ] ✅ 檢查 Supabase Dashboard → Logs 無異常錯誤

---

## 🧪 回滾步驟

如果部署後發現問題：

### 方法 1: 透過 Supabase Dashboard

1. 前往 **Database** → **Backups**
2. 選擇最近的備份（部署前）
3. 點擊 **Restore**

### 方法 2: 透過 SQL 手動回滾

```sql
-- 刪除 RLS 政策
DROP POLICY IF EXISTS "Users can view tasks in their organization" ON tasks;
DROP POLICY IF EXISTS "Users can create tasks in their organization" ON tasks;
-- ... (其他政策)

-- 刪除表格
DROP TABLE IF EXISTS logs CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;

-- 刪除輔助函式
DROP FUNCTION IF EXISTS public.get_user_organization_id();
DROP FUNCTION IF EXISTS public.get_user_id();
DROP FUNCTION IF EXISTS public.get_user_role();
DROP FUNCTION IF EXISTS public.is_blueprint_in_user_organization(UUID);
```

---

## 📊 部署後確認項目

部署完成後，請確認以下項目：

### 1. 資料庫結構
- [ ] ✅ `tasks` 表格已建立
- [ ] ✅ `logs` 表格已建立
- [ ] ✅ 所有欄位類型正確
- [ ] ✅ 主鍵與外鍵正確設定
- [ ] ✅ 預設值正確配置

### 2. 索引與效能
- [ ] ✅ 主鍵索引存在
- [ ] ✅ 外鍵索引存在
- [ ] ✅ 查詢用索引存在（blueprint_id, status, date）
- [ ] ✅ GIN 索引存在（JSONB 欄位）

### 3. 觸發器與函式
- [ ] ✅ `updated_at` 自動更新觸發器運作
- [ ] ✅ 照片統計觸發器運作
- [ ] ✅ RLS 輔助函式可正常呼叫

### 4. RLS 政策
- [ ] ✅ 兩個表格都啟用 RLS
- [ ] ✅ SELECT 政策運作正常
- [ ] ✅ INSERT 政策運作正常
- [ ] ✅ UPDATE 政策運作正常
- [ ] ✅ DELETE 政策運作正常
- [ ] ✅ 跨組織存取被正確阻擋

### 5. 應用程式整合
- [ ] ✅ TaskSupabaseRepository CRUD 操作正常
- [ ] ✅ LogSupabaseRepository CRUD 操作正常
- [ ] ✅ 照片上傳功能運作
- [ ] ✅ 錯誤處理正確

---

## 📞 支援與協助

如果遇到問題：

1. **查看日誌**
   - Supabase Dashboard → **Logs**
   - 腳本執行輸出

2. **查閱文檔**
   - [Supabase Setup Guide](./supabase-setup-guide.md)
   - [Supabase MCP Guide](./supabase-mcp-guide.md)
   - [Scripts README](../../scripts/README.md)

3. **聯絡團隊**
   - GitHub Issues
   - 開發團隊頻道

---

## 📝 部署記錄

請在部署完成後，在此記錄部署資訊：

| 日期 | 執行者 | 方法 | 環境 | 狀態 | 備註 |
|------|--------|------|------|------|------|
| YYYY-MM-DD | @username | Supabase MCP | Production | ✅ Success | 所有遷移成功執行 |
| | | | | | |

---

**建立日期**: 2025-12-12  
**最後更新**: 2025-12-12  
**維護者**: GigHub Development Team  
**相關 PR**: [#63](https://github.com/7Spade/GigHub/pull/63)
