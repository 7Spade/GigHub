# GigHub Supabase Database

> 工地施工進度追蹤管理系統 - 資料庫遷移與管理

## 📁 目錄結構

```
supabase/
├── migrations/                          # 資料庫遷移檔案
│   ├── 20251212_01_create_tasks_table.sql    # Migration 1: Tasks 表格
│   ├── 20251212_02_create_logs_table.sql     # Migration 2: Logs 表格
│   ├── 20251212_03_create_rls_policies.sql   # Migration 3: RLS 政策
│   └── CONSOLIDATED_MIGRATION.sql            # 整合的一鍵執行 SQL ⭐
├── QUICK_START.md                      # 5分鐘快速開始指南 ⚡
├── MIGRATION_EXECUTION_GUIDE.md        # 完整執行指南 📚
└── config.toml                         # Supabase CLI 配置
```

---

## 🚀 快速開始

### 執行資料庫遷移 (5 分鐘)

1. **打開 Supabase SQL Editor**
   - 前往: https://supabase.com/dashboard/project/obwyowvbsnqsxsnlsbhl/sql

2. **複製整合 SQL**
   - 開啟檔案: `migrations/CONSOLIDATED_MIGRATION.sql`
   - 全選並複製 (Ctrl+A, Ctrl+C)

3. **執行**
   - 貼上到 SQL Editor
   - 點擊 **"Run"**
   - 等待完成 (~10 秒)

4. **驗證**
   - 檢查執行結果顯示：
     ```
     ✅ All tables created successfully
     ✅ All RLS policies created successfully
     ```

**詳細步驟**: 參見 [`QUICK_START.md`](./QUICK_START.md)

---

## 📊 資料庫結構

### Tables (表格)

#### 1. `public.tasks` - 任務表格
追蹤工地施工進度任務

**欄位**:
- `id` (UUID) - 主鍵
- `blueprint_id` (UUID) - 關聯藍圖 ID
- `creator_id` (UUID) - 建立者 ID
- `assignee_id` (UUID) - 負責人 ID
- `title` (VARCHAR) - 任務標題
- `description` (TEXT) - 任務描述
- `status` (VARCHAR) - 狀態: TODO, IN_PROGRESS, REVIEW, COMPLETED, CANCELLED
- `priority` (VARCHAR) - 優先級: LOW, MEDIUM, HIGH, URGENT
- `due_date` (TIMESTAMPTZ) - 截止日期
- `tags` (TEXT[]) - 標籤陣列
- `attachments` (JSONB) - 附件資訊
- `metadata` (JSONB) - 元資料
- `created_at`, `updated_at`, `deleted_at` (TIMESTAMPTZ) - 時間戳記

**索引**: 8 個 (blueprint_id, creator_id, assignee_id, status, due_date, created_at, deleted_at, 複合索引)

**觸發器**: `update_tasks_updated_at` - 自動更新 `updated_at`

**RLS 政策**: 5 個 (組織隔離 + 角色控制)

---

#### 2. `public.logs` - 日誌表格
記錄工地施工日誌與進度

**欄位**:
- `id` (UUID) - 主鍵
- `blueprint_id` (UUID) - 關聯藍圖 ID
- `creator_id` (UUID) - 建立者 ID
- `date` (DATE) - 日誌日期
- `title` (VARCHAR) - 日誌標題
- `description` (TEXT) - 日誌描述
- `work_hours` (NUMERIC) - 工作時數
- `workers` (INTEGER) - 工作人數
- `equipment` (TEXT) - 使用設備
- `weather` (VARCHAR) - 天氣狀況
- `temperature` (NUMERIC) - 溫度
- `photos` (JSONB) - 照片資訊陣列
- `voice_records` (JSONB) - 語音記錄陣列
- `documents` (JSONB) - 文件資訊陣列
- `metadata` (JSONB) - 元資料 (含 photo_count)
- `created_at`, `updated_at`, `deleted_at` (TIMESTAMPTZ) - 時間戳記

**索引**: 10 個 (含 GIN 索引用於 JSONB 欄位)

**觸發器**: 
- `update_logs_updated_at` - 自動更新 `updated_at`
- `update_log_photo_stats_trigger` - 自動計算照片數量

**RLS 政策**: 6 個 (組織隔離 + 創建者權限)

---

### Functions (函式)

#### RLS 輔助函式

1. **`get_user_organization_id()`**
   - 從 JWT claims 提取 `organization_id`
   - 用於組織隔離

2. **`get_user_id()`**
   - 從 JWT claims 提取 `sub` (user ID)
   - 用於創建者權限檢查

3. **`get_user_role()`**
   - 從 JWT claims 提取 `role`
   - 用於角色權限檢查
   - 預設: 'member'

4. **`is_blueprint_in_user_organization(blueprint_uuid)`**
   - 檢查藍圖是否屬於使用者組織
   - 核心 RLS 邏輯

#### 工具函式

5. **`update_updated_at_column()`**
   - Trigger 函式
   - 自動更新 `updated_at` 欄位

6. **`update_log_photo_stats()`**
   - Trigger 函式
   - 自動計算並更新照片數量至 `metadata.photo_count`

7. **`test_rls_policies()`**
   - 測試函式
   - 驗證 RLS 是否正確配置

---

### RLS Policies (行級安全政策)

#### Tasks 政策 (5 個)

1. **SELECT** - 查看組織內任務 (未刪除)
2. **INSERT** - 建立組織內任務 (creator_id 必須為當前使用者)
3. **UPDATE** - 更新組織內任務 (未刪除)
4. **DELETE** - 管理員可刪除組織內任務
5. **SELECT (Soft Deleted)** - 管理員可查看已刪除任務

#### Logs 政策 (6 個)

1. **SELECT** - 查看組織內日誌 (未刪除)
2. **INSERT** - 建立組織內日誌 (creator_id 必須為當前使用者)
3. **UPDATE (Owner)** - 更新自己的日誌
4. **UPDATE (Admin)** - 管理員可更新所有日誌
5. **DELETE** - 創建者或管理員可刪除日誌
6. **SELECT (Soft Deleted)** - 管理員可查看已刪除日誌

---

## 🔒 安全性設計

### Row Level Security (RLS)

所有表格啟用 RLS，確保:
- ✅ 組織資料隔離 (使用者只能存取自己組織的資料)
- ✅ 角色權限控制 (admin 有更高權限)
- ✅ 創建者權限 (使用者對自己建立的資料有特殊權限)
- ✅ 軟刪除支援 (deleted_at 欄位)
- ✅ 預設拒絕 (Anonymous 使用者無權限)

### JWT Claims 要求

Firebase Auth 必須包含以下 custom claims:
```json
{
  "organization_id": "uuid-of-organization",
  "role": "admin" // or "member"
}
```

**配置範例** (Firebase Functions):
```typescript
import * as admin from 'firebase-admin';

await admin.auth().setCustomUserClaims(userId, {
  organization_id: 'user-org-uuid',
  role: 'admin'
});
```

---

## 📦 Storage Buckets

### 需要建立的 Buckets

1. **`task-attachments`** (Private)
   - 用途: 任務附件
   - 政策: 組織隔離 + 創建者權限

2. **`log-photos`** (Private)
   - 用途: 日誌照片
   - 政策: 組織隔離 + 創建者權限

**建立方式**: Supabase Dashboard -> Storage -> Create bucket

**Storage 政策配置**: 參見 `MIGRATION_EXECUTION_GUIDE.md`

---

## 🧪 測試與驗證

### 自動測試

執行遷移後，測試函式會自動運行：
```sql
SELECT * FROM public.test_rls_policies();
```

### 手動驗證

#### 1. 檢查表格
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('tasks', 'logs');
```

#### 2. 檢查 RLS
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('tasks', 'logs');
```

#### 3. 檢查政策數量
```sql
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('tasks', 'logs')
GROUP BY tablename;
```

#### 4. 檢查索引
```sql
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('tasks', 'logs')
ORDER BY tablename, indexname;
```

---

## 📚 文檔

- **[QUICK_START.md](./QUICK_START.md)** - 5分鐘快速開始
- **[MIGRATION_EXECUTION_GUIDE.md](./MIGRATION_EXECUTION_GUIDE.md)** - 完整執行指南
- **[CONSOLIDATED_MIGRATION.sql](./migrations/CONSOLIDATED_MIGRATION.sql)** - 一鍵執行 SQL

### 個別遷移檔案

- [20251212_01_create_tasks_table.sql](./migrations/20251212_01_create_tasks_table.sql) - Tasks 表格
- [20251212_02_create_logs_table.sql](./migrations/20251212_02_create_logs_table.sql) - Logs 表格
- [20251212_03_create_rls_policies.sql](./migrations/20251212_03_create_rls_policies.sql) - RLS 政策

---

## ⚠️ 重要注意事項

### 先決條件

1. **Blueprints 表格**
   - RLS 政策依賴 `public.blueprints` 表格
   - 必須包含 `organization_id` 欄位
   - 如果不存在，請先建立或暫時修改 `is_blueprint_in_user_organization()` 函式

2. **Firebase Auth Custom Claims**
   - JWT 必須包含 `organization_id` 和 `role`
   - 在執行遷移後配置

3. **Storage Buckets**
   - 需要手動建立
   - 需要手動配置政策

### 後續配置步驟

執行遷移後，必須完成:
1. ✅ 配置 Firebase Auth custom claims
2. ✅ 建立 Storage buckets
3. ✅ 配置 Storage 政策
4. ✅ 測試權限是否正常運作

---

## 🔗 相關連結

- **Supabase Project**: https://supabase.com/dashboard/project/obwyowvbsnqsxsnlsbhl
- **SQL Editor**: https://supabase.com/dashboard/project/obwyowvbsnqsxsnlsbhl/sql
- **Table Editor**: https://supabase.com/dashboard/project/obwyowvbsnqsxsnlsbhl/editor
- **Policies**: https://supabase.com/dashboard/project/obwyowvbsnqsxsnlsbhl/auth/policies
- **Storage**: https://supabase.com/dashboard/project/obwyowvbsnqsxsnlsbhl/storage/buckets

---

## 📞 支援

- **Supabase 文檔**: https://supabase.com/docs
- **GigHub 專案**: 聯繫專案維護者
- **問題回報**: 在 GitHub 建立 Issue

---

**Last Updated**: 2025-12-12  
**Database Version**: PR #63  
**Project Ref**: obwyowvbsnqsxsnlsbhl  
**Status**: Ready for deployment ✅
