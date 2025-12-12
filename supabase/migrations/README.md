# Supabase 資料庫遷移

> 本目錄包含 GigHub 專案的資料庫遷移腳本

## 📋 遷移檔案

### 20251212_01_create_tasks_table.sql
**建立時間**: 2025-12-12  
**目的**: 建立任務管理表  
**內容**:
- 建立 `public.tasks` 表
- UUID 主鍵
- 外鍵關聯: blueprint_id, creator_id, assignee_id
- 8 個效能索引
- 自動更新 updated_at 觸發器
- 軟刪除支援 (deleted_at)
- JSONB 欄位 (attachments, metadata)
- 標籤陣列 (tags)

**關鍵欄位**:
```typescript
interface Task {
  id: UUID;
  blueprint_id: UUID;
  creator_id: UUID;
  assignee_id?: UUID;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  due_date?: Date;
  tags: string[];
  attachments: unknown[];
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}
```

### 20251212_02_create_logs_table.sql
**建立時間**: 2025-12-12  
**目的**: 建立施工日誌表  
**內容**:
- 建立 `public.logs` 表
- UUID 主鍵
- 外鍵關聯: blueprint_id, creator_id
- 9 個索引（含 3 個 GIN 索引用於 JSONB 搜尋）
- 2 個觸發器（updated_at, photo_count 統計）
- 天氣、工時、人力記錄
- 多媒體附件支援（photos, voice_records, documents）

**關鍵欄位**:
```typescript
interface Log {
  id: UUID;
  blueprint_id: UUID;
  creator_id: UUID;
  date: Date;
  title: string;
  description?: string;
  work_hours?: number;
  workers: number;
  equipment?: string;
  weather?: string;
  temperature?: number;
  photos: Photo[];
  voice_records: VoiceRecord[];
  documents: Document[];
  metadata: Record<string, unknown> & { photo_count?: number };
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}
```

### 20251212_03_create_rls_policies.sql
**建立時間**: 2025-12-12  
**目的**: 建立 Row Level Security 政策  
**內容**:
- 啟用 RLS (tasks, logs 表)
- JWT claims 輔助函式
  - `get_user_organization_id()` - 提取組織 ID
  - `get_user_id()` - 提取使用者 ID
  - `get_user_role()` - 提取角色
  - `is_blueprint_in_user_organization()` - 檢查藍圖歸屬
- Tasks 表政策（5 個）:
  - SELECT: 組織成員可查看
  - INSERT: 組織成員可建立
  - UPDATE: 組織成員可更新
  - DELETE: 僅管理員可刪除
  - SELECT (deleted): 僅管理員可查看已刪除
- Logs 表政策（6 個）:
  - SELECT: 組織成員可查看
  - INSERT: 組織成員可建立
  - UPDATE: 建立者可更新自己的
  - UPDATE (admin): 管理員可更新所有
  - DELETE: 建立者或管理員可刪除
  - SELECT (deleted): 僅管理員可查看已刪除
- 測試函式: `test_rls_policies()`

**安全機制**:
- **Organization-based Isolation**: 多租戶資料隔離
- **Role-based Access Control**: 角色權限管理（admin, member, viewer）
- **Creator-based Permissions**: 建立者權限
- **Soft Delete Support**: 軟刪除支援

## 🚀 執行遷移

### 方法 1: 使用 Supabase MCP（推薦）
詳見專案根目錄的 `SUPABASE_MCP_MIGRATION_GUIDE.md`

### 方法 2: 使用 Supabase CLI
```bash
# 連結專案
supabase link --project-ref zecsbstjqjqoytwgjyct

# 執行遷移
supabase db push
```

### 方法 3: 使用 Supabase Dashboard
1. 訪問 SQL Editor
2. 依序複製貼上三個檔案內容
3. 執行

## ⚠️ 注意事項

### 執行順序
**必須**按以下順序執行：
1. 20251212_01_create_tasks_table.sql
2. 20251212_02_create_logs_table.sql
3. 20251212_03_create_rls_policies.sql

**原因**: RLS 政策依賴前兩個表的存在

### 前置條件
- `public.blueprints` 表必須已存在
- blueprints 表必須有 `organization_id` 欄位
- Firebase Auth 必須設定 custom claims:
  - `organization_id`: UUID
  - `role`: 'admin' | 'member' | 'viewer'

### 相依性
```
blueprints (已存在)
    ↓
tasks (Migration 01)
    ↓
logs (Migration 02)
    ↓
RLS Policies (Migration 03)
```

## ✅ 驗證

執行所有遷移後，執行以下查詢驗證：

```sql
-- 檢查表是否存在
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('tasks', 'logs');
-- 預期: tasks, logs

-- 檢查 RLS 是否啟用
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('tasks', 'logs');
-- 預期: 兩個表的 rowsecurity 都是 true

-- 檢查政策數量
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
GROUP BY tablename;
-- 預期: tasks: 5, logs: 6

-- 執行測試函式
SELECT * FROM public.test_rls_policies();
-- 預期: 所有 passed = true
```

## 🔧 故障排除

### "relation blueprints does not exist"
**解決**: 先建立 blueprints 表

### "permission denied"
**解決**: 使用 service_role key

### RLS 測試失敗
**解決**: 檢查 JWT claims 設定

## 📚 相關資源

- **專案文檔**: [SUPABASE_MCP_MIGRATION_GUIDE.md](../../SUPABASE_MCP_MIGRATION_GUIDE.md)
- **Supabase RLS**: https://supabase.com/docs/guides/auth/row-level-security
- **PR #63**: https://github.com/7Spade/GigHub/pull/63

---

**最後更新**: 2025-12-12  
**版本**: 1.0.0
