# 使用 MCP 配置執行 SQL 遷移

> 當 MCP 內已配置 Supabase account key 時的執行指南

## 🎯 前提條件

✅ MCP 內已配置 account key  
✅ Project Reference: `zecsbstjqjqoytwgjyct`  
✅ SQL 遷移檔案已準備: `CONSOLIDATED_MIGRATION.sql`

---

## 🚀 方法 1: 直接在 Supabase Dashboard 執行 (最推薦)

### 步驟

1. **登入 Supabase Dashboard**
   ```
   https://supabase.com/dashboard
   ```
   使用您已配置的 account credentials

2. **選擇專案**
   - Project ID: `zecsbstjqjqoytwgjyct`
   - 或在專案列表中選擇對應的專案

3. **開啟 SQL Editor**
   ```
   https://supabase.com/dashboard/project/zecsbstjqjqoytwgjyct/sql/new
   ```

4. **執行整合 SQL**
   - 複製 `supabase/migrations/CONSOLIDATED_MIGRATION.sql` 的完整內容
   - 貼上到 SQL Editor
   - 點擊 **"Run"** 或按 `Ctrl + Enter`

5. **驗證結果**
   - 檢查執行成功訊息
   - 查看測試結果 (應該 4/4 通過)

### 預期輸出

```sql
NOTICE: Migration 1: Tasks table created successfully
NOTICE: Migration 2: Logs table created successfully
NOTICE: RLS enabled on tasks and logs tables
NOTICE: Helper functions for RLS created successfully
NOTICE: RLS policies for tasks table created successfully
NOTICE: RLS policies for logs table created successfully
NOTICE: Migration 3: RLS policies created successfully
NOTICE: ✅ All tables created successfully
NOTICE: ✅ All RLS policies created successfully
NOTICE: Tasks policies: 5, Logs policies: 6
NOTICE: ========================================
NOTICE: Consolidated Migration Completed
NOTICE: ========================================

-- Test Results
 test_name               | passed | message
-------------------------+--------+------------------------------------------
 RLS Enabled on Tasks    | t      | RLS should be enabled on tasks table
 RLS Enabled on Logs     | t      | RLS should be enabled on logs table
 Tasks Policies Count    | t      | Should have at least 5 policies for tasks
 Logs Policies Count     | t      | Should have at least 6 policies for logs
(4 rows)
```

---

## 🔧 方法 2: 使用 Supabase CLI (進階)

### 前置設定

如果您的 MCP 配置包含 access token，可以設定環境變數：

```bash
# 方式 1: 設定 Access Token
export SUPABASE_ACCESS_TOKEN="your-access-token-from-mcp"

# 方式 2: 使用 Supabase CLI Login
supabase login
```

### 執行遷移

```bash
# 1. 進入專案目錄
cd /path/to/GigHub

# 2. Link 到專案
supabase link --project-ref zecsbstjqjqoytwgjyct

# 3. Push 所有遷移
supabase db push --linked

# 或一次完成
SUPABASE_ACCESS_TOKEN="your-token" supabase db push --linked --project-ref zecsbstjqjqoytwgjyct
```

### 驗證

```bash
# 檢查遷移歷史
supabase migration list --linked

# 連線到資料庫並測試
supabase db shell --linked

# 在 SQL shell 中執行
SELECT * FROM public.test_rls_policies();
\dt public.tasks
\dt public.logs
```

---

## 🔐 方法 3: 使用直接資料庫連線 (需要 Database Password)

如果您的 MCP 配置包含資料庫連線資訊：

### 使用連接字串

```bash
# 格式
postgresql://postgres:[YOUR-PASSWORD]@db.zecsbstjqjqoytwgjyct.supabase.co:5432/postgres

# 使用 psql
psql "postgresql://postgres:[PASSWORD]@db.zecsbstjqjqoytwgjyct.supabase.co:5432/postgres" \
  -f supabase/migrations/CONSOLIDATED_MIGRATION.sql

# 或使用 Supabase CLI
supabase db push --db-url "postgresql://postgres:[PASSWORD]@db.zecsbstjqjqoytwgjyct.supabase.co:5432/postgres"
```

### 使用 .env 配置

如果有 `.env` 檔案配置：

```bash
# .env
SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@db.zecsbstjqjqoytwgjyct.supabase.co:5432/postgres

# 執行
source .env
supabase db push --db-url "$SUPABASE_DB_URL"
```

---

## 📊 方法 4: 使用 Supabase JavaScript Client (程式化執行)

如果 MCP 配置包含 Supabase URL 和 Service Role Key：

### Node.js 腳本

創建 `execute-migration.js`:

```javascript
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// 從 MCP 配置或環境變數讀取
const supabaseUrl = process.env.SUPABASE_URL || 'https://zecsbstjqjqoytwgjyct.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment');
  process.exit(1);
}

// 使用 Service Role Key (繞過 RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeMigration() {
  try {
    console.log('📖 Reading migration file...');
    const sql = fs.readFileSync('./supabase/migrations/CONSOLIDATED_MIGRATION.sql', 'utf8');
    
    console.log('🚀 Executing migration...');
    const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
    
    console.log('✅ Migration completed successfully');
    console.log('📊 Result:', data);
    
    // 驗證
    console.log('\n🧪 Running tests...');
    const { data: testResults, error: testError } = await supabase
      .rpc('test_rls_policies');
    
    if (testError) {
      console.error('❌ Tests failed:', testError);
    } else {
      console.log('✅ Test results:', testResults);
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

executeMigration();
```

### 執行腳本

```bash
# 安裝依賴
npm install @supabase/supabase-js

# 設定環境變數
export SUPABASE_URL="https://zecsbstjqjqoytwgjyct.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# 執行
node execute-migration.js
```

---

## 🎯 推薦執行順序

根據您的 MCP 配置情況，按優先順序選擇：

### 情況 1: 有 Dashboard 存取權限
✅ **方法 1: Supabase Dashboard** (最簡單、最安全)
- 直接登入 Dashboard
- 使用 SQL Editor 執行
- 視覺化驗證結果

### 情況 2: 有 Access Token
✅ **方法 2: Supabase CLI**
```bash
export SUPABASE_ACCESS_TOKEN="your-token"
supabase db push --linked --project-ref zecsbstjqjqoytwgjyct
```

### 情況 3: 有 Database Password
✅ **方法 3: 直接資料庫連線**
```bash
supabase db push --db-url "postgresql://postgres:[PASSWORD]@db.zecsbstjqjqoytwgjyct.supabase.co:5432/postgres"
```

### 情況 4: 有 Service Role Key
✅ **方法 4: JavaScript Client**
- 使用提供的 Node.js 腳本
- 程式化執行與驗證

---

## ✅ 執行後驗證

無論使用哪種方法，執行後都應該驗證：

### 1. 在 SQL Editor 執行測試

```sql
-- 測試 RLS 政策
SELECT * FROM public.test_rls_policies();

-- 檢查表格
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('tasks', 'logs');

-- 檢查 RLS 狀態
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('tasks', 'logs');

-- 檢查政策數量
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' AND tablename IN ('tasks', 'logs')
GROUP BY tablename;
```

### 2. 在 Dashboard 檢查

- **Table Editor**: 確認 tasks 和 logs 表格存在
- **Policies**: 確認 RLS 政策已建立 (Tasks: 5, Logs: 6)
- **Functions**: 確認輔助函式已建立 (7 個)

### 3. 檢查通知訊息

所有方法都應該看到成功訊息：
- ✅ All tables created successfully
- ✅ All RLS policies created successfully
- ✅ 測試全部通過 (4/4)

---

## 🔒 安全性提醒

**重要**: 
- ⚠️ Service Role Key 可繞過 RLS，請妥善保管
- ⚠️ 不要在前端或公開程式碼中暴露 Service Role Key
- ⚠️ Database Password 應該使用環境變數，不要硬編碼
- ✅ Dashboard 方式最安全，僅在 Supabase 平台執行

---

## 📞 需要協助？

**如果遇到問題**:

1. **權限錯誤**: 確認您的 account 有 Database Write 權限
2. **連線失敗**: 檢查 project-ref 是否正確 (`zecsbstjqjqoytwgjyct`)
3. **SQL 錯誤**: 確認 blueprints 表格是否存在
4. **Token 過期**: 重新登入 Dashboard 或刷新 token

**尋求幫助**:
- 查看 `MIGRATION_EXECUTION_GUIDE.md` 取得詳細排錯指南
- 查看 `QUICK_START.md` 取得快速開始步驟
- 聯繫專案維護者

---

**Last Updated**: 2025-12-12  
**Project Ref**: zecsbstjqjqoytwgjyct  
**Migration Files**: 3 個 (整合為 1 個 CONSOLIDATED_MIGRATION.sql)  
**Status**: Ready for execution with MCP credentials ✅
