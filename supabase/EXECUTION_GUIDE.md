# 🚀 Construction Logs 資料庫執行指南

## ⚠️ 重要說明

由於 GitHub Actions 執行環境的網路限制，無法直接連線至 Supabase 遠端資料庫。
請依照以下任一方式執行 SQL 腳本。

---

## 方法 1: Supabase Dashboard (推薦) ⭐

**最簡單、最快速的方式**

### 步驟

1. **開啟 Supabase Dashboard**
   - 前往: https://supabase.com/dashboard
   - 登入您的帳號
   - 選擇專案: `zecsbstjqjqoytwgjyct`

2. **開啟 SQL Editor**
   - 點選左側選單 **SQL Editor**
   - 點選 **New Query**

3. **複製並執行 SQL**
   ```bash
   # 複製整個檔案內容
   cat /home/runner/work/GigHub/GigHub/supabase/construction_logs.sql
   ```
   - 將內容貼入 SQL Editor
   - 點選 **Run** 或按 `Ctrl+Enter`

4. **建立 Storage Bucket**
   - 點選左側選單 **Storage**
   - 點選 **New bucket**
   - 名稱: `construction-photos`
   - Public bucket: ✅ 勾選
   - 點選 **Create bucket**

5. **驗證**
   執行以下 SQL 驗證:
   ```sql
   -- 檢查表格
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' AND table_name = 'construction_logs';
   
   -- 檢查 RLS
   SELECT tablename, rowsecurity FROM pg_tables 
   WHERE tablename = 'construction_logs';
   
   -- 檢查政策
   SELECT COUNT(*) FROM pg_policies 
   WHERE tablename = 'construction_logs';
   -- 應該返回: 4
   ```

**預計時間**: 2-3 分鐘

---

## 方法 2: 本機使用 psql (進階)

**適合熟悉 PostgreSQL 的開發者**

### 前置需求

- 安裝 PostgreSQL client (psql)
- 設定環境變數

### 步驟

1. **設定環境變數**
   ```bash
   export PGHOST="db.zecsbstjqjqoytwgjyct.supabase.co"
   export PGPORT="5432"
   export PGUSER="postgres"
   export PGPASSWORD="IBXgJ6mxLrlQxNEm"
   export PGDATABASE="postgres"
   ```

2. **執行 SQL**
   ```bash
   psql -f supabase/construction_logs.sql
   ```

3. **驗證**
   ```bash
   psql -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='construction_logs';"
   ```

**預計時間**: 5 分鐘

---

## 方法 3: Supabase CLI (自動化)

**適合 CI/CD 整合**

### 前置需求

- 安裝 Supabase CLI
  ```bash
  npm install -g supabase
  ```

### 步驟

1. **登入 Supabase**
   ```bash
   supabase login
   ```

2. **連結專案**
   ```bash
   supabase link --project-ref zecsbstjqjqoytwgjyct
   ```

3. **執行 SQL**
   ```bash
   supabase db execute --file supabase/construction_logs.sql
   ```

4. **建立 Storage Bucket** (需使用 Dashboard 或 API)

**預計時間**: 10 分鐘 (首次設定)

---

## 方法 4: 使用 Supabase Management API

**適合程式化執行**

### 使用 curl

```bash
# 取得 Service Role Key (從環境變數)
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplY3Nic3RqcWpxb3l0d2dqeWN0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQ5OTkzNywiZXhwIjoyMDgxMDc1OTM3fQ.3k-encLQ4LPaYGOi6MLuyZS9d5Ft31XbZM1nWqVN2so"

# 執行 SQL (需要將 SQL 內容編碼)
SQL_CONTENT=$(cat supabase/construction_logs.sql | jq -Rs .)

curl -X POST \
  'https://zecsbstjqjqoytwgjyct.supabase.co/rest/v1/rpc/exec_sql' \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $SQL_CONTENT}"
```

**注意**: 此方法需要建立 `exec_sql` RPC 函數。

**預計時間**: 15 分鐘 (含設定)

---

## 📋 執行檢查清單

執行完成後，請確認以下項目:

- [ ] ✅ 表格 `construction_logs` 已建立
- [ ] ✅ 5 個索引已建立
- [ ] ✅ RLS 已啟用
- [ ] ✅ 4 個 RLS 政策已建立
- [ ] ✅ 自動更新時間戳記觸發器已建立
- [ ] ✅ Storage Bucket `construction-photos` 已建立並設為 Public
- [ ] ✅ 前端應用可正常存取工地日誌功能

---

## 🔍 疑難排解

### 問題 1: 連線失敗
**症狀**: `could not translate host name`
**解決**: 檢查網路連線，確認 Supabase 專案 URL 正確

### 問題 2: 權限不足
**症狀**: `permission denied`
**解決**: 確認使用 Service Role Key，而非 Anon Key

### 問題 3: 表格已存在
**症狀**: `relation "construction_logs" already exists`
**解決**: SQL 腳本使用 `CREATE TABLE IF NOT EXISTS`，可安全重複執行

### 問題 4: Storage Bucket 建立失敗
**症狀**: Cannot create bucket
**解決**: 必須透過 Dashboard 手動建立，API 有限制

---

## 📚 相關文件

- SQL 腳本: `/supabase/construction_logs.sql`
- 快速開始: `/docs/database/QUICK_START.md`
- 完整設定: `/docs/database/SETUP_CONSTRUCTION_LOGS.md`
- 實作總結: `/CONSTRUCTION_LOGS_IMPLEMENTATION.md`

---

## ✅ 推薦執行方式

**對於首次設定，我們推薦使用「方法 1: Supabase Dashboard」**

理由:
- ✅ 最簡單、最快速
- ✅ 視覺化介面，容易理解
- ✅ 即時查看執行結果
- ✅ 不需要額外工具安裝
- ✅ 可直接建立 Storage Bucket

**預計總時間**: 2-3 分鐘

---

## 🎯 下一步

執行完成後:

1. **測試前端功能**
   ```bash
   yarn start
   ```
   - 開啟 `http://localhost:4200`
   - 前往任一藍圖詳細頁面
   - 點選「工地日誌」分頁
   - 測試新增/編輯/刪除功能

2. **確認資料儲存**
   - 在 Supabase Dashboard → Table Editor
   - 查看 `construction_logs` 表格
   - 確認測試資料已正確儲存

3. **測試照片上傳** (選用)
   - 新增日誌時上傳照片
   - 確認照片顯示正常
   - 在 Supabase Dashboard → Storage
   - 檢查 `construction-photos` bucket 中的檔案

---

**執行完成後，請回報結果以便更新進度！** 🚀
