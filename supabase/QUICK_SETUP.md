# 快速設定指南 (Quick Setup Guide)

## 🚀 最快的設定方式

### 方法 1: 使用 Supabase Dashboard (推薦)

1. 登入 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇專案 `zecsbstjqjqoytwgjyct`
3. 進入 **SQL Editor**
4. 依序執行以下 SQL 文件：

#### Step 1: 建立 Blueprints 表格
```sql
-- 複製 supabase/001_create_blueprints_table.sql 的內容並執行
```

#### Step 2: 建立 Construction Logs 表格
```sql
-- 複製 supabase/002_create_construction_logs_table.sql 的內容並執行
```

#### Step 3: 建立 Storage Bucket
```sql
-- 複製 supabase/003_create_storage_buckets.sql 的內容並執行
```

### 方法 2: 使用 Supabase CLI (本機執行)

如果您有 Supabase CLI 安裝在本機：

```bash
# 設定環境變數
export SUPABASE_URL="https://zecsbstjqjqoytwgjyct.supabase.co"
export SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplY3Nic3RqcWpxb3l0d2dqeWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0OTk5MzcsImV4cCI6MjA4MTA3NTkzN30.GQSslGa2ujmjdR-DeqXwPiAUr0RPe2O3lwb37wnJQeE"

# 連結到遠端專案
supabase link --project-ref zecsbstjqjqoytwgjyct

# 執行遷移
supabase db push
```

### 方法 3: 使用 psql (PostgreSQL 客戶端)

如果您有 psql 工具：

```bash
# 設定密碼
export PGPASSWORD="IBXgJ6mxLrlQxNEm"

# 執行 SQL 文件
psql -h db.zecsbstjqjqoytwgjyct.supabase.co \
     -p 5432 \
     -U postgres.zecsbstjqjqoytwgjyct \
     -d postgres \
     -f supabase/001_create_blueprints_table.sql

psql -h db.zecsbstjqjqoytwgjyct.supabase.co \
     -p 5432 \
     -U postgres.zecsbstjqjqoytwgjyct \
     -d postgres \
     -f supabase/002_create_construction_logs_table.sql

psql -h db.zecsbstjqjqoytwgjyct.supabase.co \
     -p 5432 \
     -U postgres.zecsbstjqjqoytwgjyct \
     -d postgres \
     -f supabase/003_create_storage_buckets.sql
```

## ✅ 驗證設定

執行以下 SQL 驗證所有資料表已建立：

```sql
-- 檢查表格是否存在
SELECT 
    tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('blueprints', 'construction_logs')
ORDER BY tablename;

-- 應該返回 2 rows:
-- blueprints
-- construction_logs
```

## 🧪 測試應用程式

```bash
# 啟動開發伺服器
yarn start

# 瀏覽器開啟
# http://localhost:4200

# 導航至工地日誌頁面，確認：
# ✅ 不再顯示錯誤訊息
# ✅ 可以正常讀取資料
# ✅ 可以建立新日誌
```

## 📋 完整檢查清單

- [ ] 執行 001_create_blueprints_table.sql
- [ ] 執行 002_create_construction_logs_table.sql
- [ ] 執行 003_create_storage_buckets.sql
- [ ] 驗證表格已建立
- [ ] 驗證 RLS 政策已啟用
- [ ] 測試應用程式功能
- [ ] 確認可以建立工地日誌
- [ ] 確認可以上傳照片

## ⚠️ 注意事項

1. **執行順序很重要**: 必須先建立 blueprints 表格，再建立 construction_logs 表格（因為有外鍵依賴）
2. **RLS 政策**: 所有表格都已啟用 Row Level Security，確保資料安全
3. **Storage Bucket**: construction-photos bucket 限制檔案大小為 50MB，僅接受圖片格式

## 🆘 常見問題

### Q: 出現 "relation does not exist" 錯誤？
A: 確認已按照順序執行所有 SQL 文件

### Q: 無法上傳照片？
A: 檢查 storage bucket 是否已建立，RLS 政策是否正確設定

### Q: 無法看到其他使用者的日誌？
A: 這是正常的，RLS 政策確保使用者只能看到自己的資料

---

**需要幫助？** 請參考 [README.md](./README.md) 或聯繫開發團隊
