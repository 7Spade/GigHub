# Quick Deploy - One-Click Deployment Guide

## 🚀 快速部署（一鍵複製貼上）

### Option 1: 使用自動化腳本（最簡單）

```bash
# 1. 設定資料庫連線（替換成你的密碼）
export DATABASE_URL='postgresql://postgres:YOUR_PASSWORD_HERE@db.zecsbstjqjqoytwgjyct.supabase.co:5432/postgres'

# 2. 執行部署腳本
cd /path/to/GigHub
./supabase/deploy-migrations.sh
```

---

### Option 2: 使用 psql 命令（手動）

```bash
# 1. 設定資料庫連線（替換成你的密碼）
export DATABASE_URL='postgresql://postgres:YOUR_PASSWORD_HERE@db.zecsbstjqjqoytwgjyct.supabase.co:5432/postgres'

# 2. 執行所有 migrations
psql "$DATABASE_URL" -f supabase/migrations/20251212_01_create_tasks_table.sql
psql "$DATABASE_URL" -f supabase/migrations/20251212_02_create_logs_table.sql
psql "$DATABASE_URL" -f supabase/migrations/20251212_03_create_rls_policies.sql
psql "$DATABASE_URL" -f supabase/migrations/20251212_04_create_notifications_table.sql
psql "$DATABASE_URL" -f supabase/migrations/20251212_04_task_quantity_expansion.sql
psql "$DATABASE_URL" -f supabase/migrations/20251212_05_task_quantity_rls_policies.sql
```

---

### Option 3: 使用 Supabase CLI

```bash
# 1. 安裝 CLI（如果還沒安裝）
npm install -g supabase

# 2. 登入
supabase login

# 3. 連結專案
cd /path/to/GigHub
supabase link --project-ref zecsbstjqjqoytwgjyct

# 4. 推送 migrations
supabase db push
```

---

## ✅ 快速驗證

部署完成後，執行此 SQL 驗證：

```sql
-- 複製整段貼到 Supabase SQL Editor

-- 檢查表格
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 檢查 RLS 狀態
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- 檢查政策數量
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- 執行測試
SELECT * FROM public.test_rls_policies();
```

**預期結果**：
- ✅ 6 個表格建立成功
- ✅ 所有表格 RLS 啟用（rowsecurity = true）
- ✅ 每個表格都有對應數量的政策
- ✅ 所有測試通過

---

## 📍 取得連線字串

1. 前往：https://supabase.com/dashboard/project/zecsbstjqjqoytwgjyct/settings/database
2. 找到 **Connection String** → **Direct Connection**
3. 複製連線字串
4. 替換 `[YOUR-PASSWORD]` 為實際密碼

---

## 🆘 快速排錯

**連線失敗？**
```bash
# 測試連線
psql "$DATABASE_URL" -c "SELECT version();"
```

**找不到 psql？**
```bash
# macOS
brew install postgresql

# Ubuntu
sudo apt-get install postgresql-client
```

**Migration 失敗？**
- 確認是否按順序執行
- 檢查 Supabase Dashboard → Logs
- 確認使用正確的資料庫密碼

---

## 📱 聯絡方式

- Dashboard: https://supabase.com/dashboard/project/zecsbstjqjqoytwgjyct
- 完整文檔: [部署指南.md](./部署指南.md)
- Migration 說明: [README.md](./migrations/README.md)

---

**最後更新**: 2025-12-12
