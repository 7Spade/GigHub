# GigHub Database Setup Guide

## 概述 (Overview)

本指南說明如何設置 GigHub 專案的 Supabase 資料庫。

This guide explains how to set up the Supabase database for the GigHub project.

## 前置需求 (Prerequisites)

1. Supabase 帳號 (Supabase account)
2. 專案已建立 (Project created)
3. 資料庫連線資訊 (Database connection details)

## 快速開始 (Quick Start)

### 1. 環境配置 (Environment Configuration)

專案已包含 `.env` 文件，包含以下 Supabase 憑證：

```bash
SUPABASE_URL=https://zecsbstjqjqoytwgjyct.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. 初始化資料庫結構 (Initialize Database Schema)

#### 方法 A: 使用 Supabase Dashboard (推薦)

1. 登入 Supabase Dashboard: https://supabase.com/dashboard
2. 選擇專案: `zecsbstjqjqoytwgjyct`
3. 進入 SQL Editor
4. 複製 `docs/database/init_schema.sql` 的內容
5. 執行 SQL 腳本

#### 方法 B: 使用 psql 指令

```bash
# 使用 NON_POOLING 連線
psql "postgres://postgres.zecsbstjqjqoytwgjyct:IBXgJ6mxLrlQxNEm@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require" -f docs/database/init_schema.sql
```

#### 方法 C: 使用 Supabase CLI

```bash
# 安裝 Supabase CLI
npm install -g supabase

# 登入
supabase login

# 連結專案
supabase link --project-ref zecsbstjqjqoytwgjyct

# 執行遷移
supabase db push
```

### 3. 建立儲存桶 (Create Storage Bucket)

工地照片需要一個 Supabase Storage Bucket：

1. 進入 Supabase Dashboard > Storage
2. 建立新 Bucket:
   - **名稱**: `construction-photos`
   - **Public**: ✅ 勾選 (允許公開存取)
   - **檔案大小限制**: 10MB
   - **允許的 MIME 類型**: `image/jpeg`, `image/png`, `image/webp`

### 4. 驗證設置 (Verify Setup)

執行以下 SQL 查詢確認表格已建立：

```sql
-- 檢查表格
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('blueprints', 'construction_logs');

-- 檢查範例資料
SELECT * FROM public.blueprints LIMIT 5;
SELECT * FROM public.construction_logs LIMIT 5;
```

## 資料表結構 (Table Structure)

### blueprints (藍圖表)

| 欄位 (Column) | 類型 (Type) | 說明 (Description) |
|--------------|------------|-------------------|
| id | UUID | 主鍵 (Primary Key) |
| name | VARCHAR(200) | 藍圖名稱 |
| description | TEXT | 描述 |
| code | VARCHAR(50) | 藍圖代碼 (唯一) |
| organization_id | UUID | 組織 ID |
| status | VARCHAR(50) | 狀態 |
| creator_id | UUID | 建立者 ID |
| created_at | TIMESTAMPTZ | 建立時間 |
| updated_at | TIMESTAMPTZ | 更新時間 |
| deleted_at | TIMESTAMPTZ | 刪除時間 (軟刪除) |
| metadata | JSONB | 元資料 |

### construction_logs (工地施工日誌表)

| 欄位 (Column) | 類型 (Type) | 說明 (Description) |
|--------------|------------|-------------------|
| id | UUID | 主鍵 (Primary Key) |
| blueprint_id | UUID | 外鍵到 blueprints |
| date | TIMESTAMPTZ | 工作日期 |
| title | VARCHAR(100) | 標題 |
| description | TEXT | 描述 |
| work_hours | NUMERIC(5,2) | 工時 |
| workers | INTEGER | 工人數量 |
| equipment | TEXT | 使用設備 |
| weather | VARCHAR(50) | 天氣 |
| temperature | NUMERIC(5,2) | 溫度 |
| photos | JSONB | 照片 (JSON 陣列) |
| creator_id | UUID | 建立者 ID |
| created_at | TIMESTAMPTZ | 建立時間 |
| updated_at | TIMESTAMPTZ | 更新時間 |
| deleted_at | TIMESTAMPTZ | 刪除時間 (軟刪除) |
| voice_records | TEXT[] | 語音記錄 (預留) |
| documents | TEXT[] | 文件 (預留) |
| metadata | JSONB | 元資料 |

## Row Level Security (RLS) 政策

資料庫已啟用 RLS，以下是已配置的政策：

### blueprints 表
- ✅ 已認證用戶可讀取所有藍圖
- ✅ 已認證用戶可新增藍圖
- ✅ 用戶只能更新自己建立的藍圖

### construction_logs 表
- ✅ 已認證用戶可讀取所有日誌
- ✅ 已認證用戶可新增日誌
- ✅ 已認證用戶可更新日誌
- ✅ 已認證用戶可刪除日誌

## 常見問題 (Troubleshooting)

### 1. 找不到表格錯誤

**錯誤**: `Could not find the table 'public.construction_logs' in the schema`

**解決方法**:
1. 確認 SQL 腳本已成功執行
2. 檢查 RLS 政策是否正確設置
3. 驗證連線字串是否正確

### 2. 權限錯誤

**錯誤**: `permission denied for table`

**解決方法**:
1. 確認用戶已登入 (authenticated)
2. 檢查 RLS 政策
3. 使用 service_role key (僅限開發環境)

### 3. 外鍵約束錯誤

**錯誤**: `violates foreign key constraint`

**解決方法**:
1. 確保 blueprints 表已有資料
2. 使用正確的 blueprint_id

## 遷移與更新 (Migrations)

新的資料庫變更應放在 `docs/database/migrations/` 目錄下：

```
docs/database/migrations/
├── 001_task_quantity_expansion.sql
└── 002_new_feature.sql
```

## 備份與還原 (Backup & Restore)

### 備份

```bash
# 使用 pg_dump
pg_dump "postgres://postgres.zecsbstjqjqoytwgjyct:IBXgJ6mxLrlQxNEm@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require" > backup.sql
```

### 還原

```bash
# 使用 psql
psql "postgres://postgres.zecsbstjqjqoytwgjyct:IBXgJ6mxLrlQxNEm@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require" < backup.sql
```

## 相關文件 (Related Documentation)

- [Supabase 官方文檔](https://supabase.com/docs)
- [PostgreSQL 文檔](https://www.postgresql.org/docs/)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## 聯絡支援 (Support)

如有問題，請聯絡 GigHub 開發團隊。
