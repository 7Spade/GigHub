# Supabase 資料庫遷移指南

## 概述

此目錄包含 GigHub 專案所需的 Supabase 資料庫結構與遷移 SQL 文件。

## 問題描述

工地日誌功能出現錯誤：
- **錯誤訊息**: `Failed to fetch logs: Could not find the table 'public.construction_logs' in the schema`
- **根本原因**: Supabase 遠端資料庫中缺少必要的資料表

## 解決方案

### 步驟 1: 登入 Supabase Dashboard

1. 前往 [Supabase Dashboard](https://supabase.com/dashboard)
2. 登入您的帳號
3. 選擇專案：`zecsbstjqjqoytwgjyct`

### 步驟 2: 執行 SQL 遷移

在 Supabase Dashboard 中：

1. 點擊左側選單的 **SQL Editor**
2. 建立新查詢 (New Query)
3. 按照以下順序執行 SQL 文件：

#### 2.1 建立 Blueprints 表格

```bash
複製並執行: supabase/001_create_blueprints_table.sql
```

**內容摘要**:
- 建立 `owner_type` enum (organization, personal)
- 建立 `blueprint_status` enum (draft, active, archived, completed)
- 建立 `module_type` enum (task, log, quality, member, document, schedule)
- 建立 `blueprints` 表格
- 建立索引以優化查詢效能
- 啟用 Row Level Security (RLS)
- 建立 RLS 政策

**執行後驗證**:
```sql
SELECT COUNT(*) FROM public.blueprints;
-- 應返回 0 (表格已建立但無資料)
```

#### 2.2 建立 Construction Logs 表格

```bash
複製並執行: supabase/002_create_construction_logs_table.sql
```

**內容摘要**:
- 建立 `construction_logs` 表格
- 設定外鍵關聯到 `blueprints` 表格
- 建立索引以優化查詢效能
- 啟用 Row Level Security (RLS)
- 建立 RLS 政策以保護資料

**執行後驗證**:
```sql
SELECT COUNT(*) FROM public.construction_logs;
-- 應返回 0 (表格已建立但無資料)

-- 驗證外鍵關聯
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table
FROM pg_constraint
WHERE conname = 'fk_construction_logs_blueprint';
-- 應顯示正確的外鍵關聯
```

#### 2.3 建立 Storage Bucket

```bash
複製並執行: supabase/003_create_storage_buckets.sql
```

**內容摘要**:
- 建立 `construction-photos` storage bucket
- 設定檔案大小限制為 50MB
- 限制檔案類型為圖片格式 (jpeg, jpg, png, webp, heic)
- 啟用 RLS 政策以控制存取權限

**執行後驗證**:
```sql
SELECT * FROM storage.buckets WHERE id = 'construction-photos';
-- 應顯示 construction-photos bucket 資訊
```

### 步驟 3: 驗證資料表結構

執行以下 SQL 驗證所有資料表已正確建立：

```sql
-- 檢查所有表格
SELECT 
    tablename, 
    schemaname 
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('blueprints', 'construction_logs')
ORDER BY tablename;

-- 檢查 enum 類型
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname IN ('owner_type', 'blueprint_status', 'module_type')
ORDER BY t.typname, e.enumsortorder;

-- 檢查 construction_logs 表格結構
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'construction_logs'
ORDER BY ordinal_position;
```

### 步驟 4: 測試應用程式

1. 啟動開發伺服器：
   ```bash
   yarn start
   ```

2. 導航至工地日誌頁面

3. 驗證以下功能：
   - ✅ 頁面正常載入（不再顯示錯誤）
   - ✅ 可以建立新的工地日誌
   - ✅ 可以上傳照片
   - ✅ 可以檢視、編輯、刪除日誌

## 資料表關係圖

```
┌─────────────────────┐
│    blueprints       │
│                     │
│  - id (PK)          │
│  - name             │
│  - slug             │
│  - owner_id         │
│  - owner_type       │
│  - status           │
│  - enabled_modules  │
│  ...                │
└──────────┬──────────┘
           │
           │ 1:N
           │
┌──────────▼──────────────────┐
│  construction_logs          │
│                             │
│  - id (PK)                  │
│  - blueprint_id (FK)        │
│  - date                     │
│  - title                    │
│  - description              │
│  - work_hours               │
│  - workers                  │
│  - equipment                │
│  - weather                  │
│  - temperature              │
│  - photos (JSONB)           │
│  - creator_id               │
│  ...                        │
└─────────────────────────────┘
```

## 環境變數更新

以下檔案已更新為使用新的 Supabase 連線資訊：

- ✅ `src/environments/environment.ts`
- ✅ `src/environments/environment.prod.ts`
- ✅ `src/app/core/services/supabase.service.ts`

新的連線資訊：
- **URL**: `https://zecsbstjqjqoytwgjyct.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## 安全性注意事項

### Row Level Security (RLS)

所有資料表都已啟用 RLS 政策以保護資料：

**Blueprints**:
- 公開的藍圖允許任何人讀取
- 只有建立者可以完全存取自己的藍圖

**Construction Logs**:
- 使用者只能存取自己藍圖的日誌
- 自動驗證使用者權限

**Storage (construction-photos)**:
- 認證使用者可以上傳照片到自己的藍圖
- 公開讀取權限（適用於已發布的照片）
- 使用者可以刪除自己上傳的照片

## 故障排除

### 錯誤：relation "public.blueprints" does not exist

**解決方案**: 確認已執行 `001_create_blueprints_table.sql`

### 錯誤：foreign key constraint "fk_construction_logs_blueprint" 

**解決方案**: 
1. 確認 blueprints 表格已建立
2. 按照順序執行 SQL 文件（先建立 blueprints，再建立 construction_logs）

### 錯誤：storage bucket not found

**解決方案**: 
1. 在 Supabase Dashboard 的 Storage 區域手動建立 bucket
2. 或執行 `003_create_storage_buckets.sql`

## 相關文件

- [Supabase 官方文件](https://supabase.com/docs)
- [PostgreSQL RLS 文件](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [專案架構文件](../docs/architecture/)

## 支援

如有問題，請參考：
- 專案 Issue Tracker
- GigHub Development Team

---

**最後更新**: 2025-12-12  
**版本**: 1.0.0  
**維護者**: GigHub Development Team
