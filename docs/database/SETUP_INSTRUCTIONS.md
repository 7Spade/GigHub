# 資料庫設定說明 (Database Setup Instructions)

## 問題描述 (Problem Description)

工地施工日誌功能出現以下錯誤：
```
Failed to fetch logs: Could not find the table 'public.construction_logs' in the schema
```

**原因**: 資料庫中缺少必要的表結構

---

## 解決方案 (Solution)

### 方法 1: 使用 Supabase Dashboard (推薦)

#### 步驟 1: 登入 Supabase Dashboard

1. 開啟瀏覽器訪問: https://supabase.com/dashboard
2. 登入您的帳號
3. 選擇專案: `zecsbstjqjqoytwgjyct`

#### 步驟 2: 開啟 SQL Editor

1. 在左側選單點選 **SQL Editor**
2. 點選 **New Query** 建立新查詢

#### 步驟 3: 執行 SQL Schema

1. 開啟檔案: `docs/database/complete_schema.sql`
2. 複製完整內容
3. 貼上到 SQL Editor
4. 點選右上角 **Run** 按鈕執行

#### 步驟 4: 驗證結果

執行完成後，您應該會看到:
```
✅ GigHub database schema created successfully!
📊 Tables created: blueprints, construction_logs, tasks, logs, log_tasks, quality_controls, task_progress
🔒 RLS policies enabled
⚡ Triggers configured
✨ Sample data inserted
```

#### 步驟 5: 確認表已建立

1. 在左側選單點選 **Table Editor**
2. 確認以下表已建立:
   - ✅ `accounts`
   - ✅ `organizations`
   - ✅ `blueprints`
   - ✅ `tasks`
   - ✅ `logs`
   - ✅ `construction_logs` ⭐ (主要表)
   - ✅ `log_tasks`
   - ✅ `quality_controls`
   - ✅ `task_progress`

---

### 方法 2: 使用 PostgreSQL CLI (進階)

如果您有 PostgreSQL CLI 工具，可以直接執行:

```bash
# 使用提供的 PostgreSQL 連線字串
psql "postgres://postgres.zecsbstjqjqoytwgjyct:IBXgJ6mxLrlQxNEm@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require" \
  -f docs/database/complete_schema.sql
```

---

## 驗證安裝 (Verify Installation)

### 1. 檢查表是否存在

在 Supabase SQL Editor 執行:

```sql
-- 檢查 construction_logs 表
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'construction_logs'
ORDER BY ordinal_position;
```

預期結果應顯示所有欄位資訊。

### 2. 測試插入範例資料

```sql
-- 插入測試日誌
INSERT INTO public.construction_logs (
  blueprint_id,
  date,
  title,
  description,
  creator_id
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  NOW(),
  '測試工地日誌',
  '這是一筆測試資料',
  '00000000-0000-0000-0000-000000000001'
);

-- 查詢確認
SELECT * FROM public.construction_logs LIMIT 1;
```

### 3. 測試應用程式

1. 啟動開發伺服器: `yarn start`
2. 開啟瀏覽器訪問應用程式
3. 導航至工地施工日誌頁面
4. 確認不再出現 "table not found" 錯誤
5. 確認可以載入日誌列表（即使是空的）

---

## 故障排除 (Troubleshooting)

### 錯誤 1: "relation does not exist"

**原因**: 表尚未建立或 schema 名稱不正確

**解決方案**:
1. 確認已執行 `complete_schema.sql`
2. 檢查表是否在 `public` schema 中
3. 確認 RLS 政策已啟用

### 錯誤 2: "permission denied"

**原因**: 使用者權限不足

**解決方案**:
1. 使用 Service Role Key 執行 SQL
2. 在 Supabase Dashboard 中確認 RLS 政策設定
3. 檢查使用者是否已認證

### 錯誤 3: "foreign key violation"

**原因**: 缺少相依表（blueprints, accounts）

**解決方案**:
1. 確認已執行完整的 `complete_schema.sql`
2. 檢查範例資料是否已插入
3. 手動建立必要的測試資料

---

## 資料庫結構說明 (Database Structure)

### 核心表 (Core Tables)

#### 1. `construction_logs` (工地施工日誌)
- 主鍵: `id` (UUID)
- 外鍵: `blueprint_id` → `blueprints(id)`
- 外鍵: `creator_id` → `accounts(id)`
- 欄位: date, title, description, work_hours, workers, weather, temperature, photos
- 特殊欄位: `photos` (JSONB 陣列)

#### 2. `blueprints` (藍圖/專案)
- 主鍵: `id` (UUID)
- 外鍵: `organization_id` → `organizations(id)`
- 儲存專案基本資訊

#### 3. `accounts` (帳號)
- 主鍵: `id` (UUID)
- 唯一: `email`
- 儲存使用者基本資訊

### 索引 (Indexes)

- `idx_construction_logs_blueprint`: 快速查詢特定專案的日誌
- `idx_construction_logs_date`: 按日期排序
- `idx_construction_logs_creator`: 快速查詢特定建立者的日誌
- `idx_construction_logs_active`: 快速查詢未刪除的日誌

### Row Level Security (RLS)

所有表都啟用了 RLS，基本政策:
- 認證使用者可以讀取所有資料
- 認證使用者可以插入、更新資料
- construction_logs 支援軟刪除

---

## 環境變數設定 (Environment Variables)

確認 `.env` 檔案包含正確的 Supabase 憑證:

```bash
# Supabase Configuration
SUPABASE_URL="https://zecsbstjqjqoytwgjyct.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 聯絡支援 (Contact Support)

如果遇到無法解決的問題，請提供以下資訊:

1. 錯誤訊息截圖
2. Supabase 專案 ID
3. 執行的 SQL 查詢
4. 瀏覽器 Console 錯誤日誌

---

**最後更新**: 2025-12-12  
**版本**: 1.0.0  
**作者**: GigHub Development Team
