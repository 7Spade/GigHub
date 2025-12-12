# GigHub Supabase 資料庫管理

## 📋 目錄結構

```
supabase/
├── README.md                    # 本檔案 - Supabase 目錄總覽
├── config.toml                  # Supabase 本地開發配置
├── 部署指南.md                  # 完整部署文檔（8000+ 字）
├── QUICK_DEPLOY.md              # 快速部署參考
├── deploy-migrations.sh         # 自動化部署腳本 ⭐
├── verify-deployment.sql        # 部署驗證腳本 ⭐
└── migrations/                  # SQL Migration 檔案
    ├── README.md                # Migration 說明
    ├── 20251212_01_create_tasks_table.sql
    ├── 20251212_02_create_logs_table.sql
    ├── 20251212_03_create_rls_policies.sql
    ├── 20251212_04_create_notifications_table.sql
    ├── 20251212_04_task_quantity_expansion.sql
    └── 20251212_05_task_quantity_rls_policies.sql
```

## 🚀 快速開始

### 一鍵部署（推薦）

```bash
# 1. 設定資料庫連線
export DATABASE_URL='postgresql://postgres:YOUR_PASSWORD@db.zecsbstjqjqoytwgjyct.supabase.co:5432/postgres'

# 2. 執行部署
./supabase/deploy-migrations.sh

# 3. 驗證部署
psql "$DATABASE_URL" -f supabase/verify-deployment.sql
```

就這麼簡單！腳本會自動處理所有事情。

## 📚 文檔指南

### 新手入門

1. **首次部署**？請閱讀：
   - 📖 [部署指南.md](./部署指南.md) - 完整教學
   - ⚡ [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) - 快速指令

2. **了解資料庫結構**？請閱讀：
   - 📊 [migrations/README.md](./migrations/README.md) - Migration 說明
   - 🏗️ [../DEPLOYMENT_SUMMARY.md](../DEPLOYMENT_SUMMARY.md) - 架構總覽

3. **遇到問題**？請查看：
   - 🐛 [部署指南.md](./部署指南.md) 中的「常見問題排解」章節

### 進階使用

- **自訂部署**：編輯 `deploy-migrations.sh`
- **驗證邏輯**：檢查 `verify-deployment.sql`
- **Migration 開發**：參考現有檔案結構

## 🗄️ 資料庫概覽

### 專案資訊

- **專案 ID**: zecsbstjqjqoytwgjyct
- **專案名稱**: GigHub
- **資料庫**: PostgreSQL 15+
- **Dashboard**: https://supabase.com/dashboard/project/zecsbstjqjqoytwgjyct

### 資料表（6 個）

| 表格名稱 | 說明 | 索引 | RLS 政策 |
|---------|------|------|---------|
| **tasks** | 任務管理 | 9 | 5 |
| **logs** | 施工日誌 | 9 | 6 |
| **notifications** | 通知系統 | 4 | 4 |
| **log_tasks** | 任務日誌關聯 | 4 | 4 |
| **quality_controls** | 品質管控 | 5 | 5 |
| **task_progress** | 進度審計 | 6 | 2 |

**總計**: 37 索引, 26 RLS 政策

### Helper 函式（11 個）

- `update_updated_at_column()` - 自動更新時間戳記
- `update_log_photo_stats()` - 照片統計
- `get_user_organization_id()` - 取得組織 ID
- `get_user_id()` - 取得使用者 ID
- `get_user_role()` - 取得角色
- `is_blueprint_in_user_organization()` - 組織驗證
- `calculate_task_completed_quantity()` - 計算完成數量
- `update_task_completed_quantity()` - 更新數量
- `user_can_access_blueprint()` - 存取權限
- `user_is_qc_inspector()` - QC 檢查
- `user_is_admin()` - 管理員檢查
- `test_rls_policies()` - RLS 測試

## 🔒 安全性

### RLS（Row Level Security）

所有表格都啟用了 RLS，確保：

- ✅ **組織隔離**：使用者只能存取自己組織的資料
- ✅ **角色權限**：支援 admin, member, viewer 三種角色
- ✅ **創建者權限**：使用者可編輯自己建立的內容
- ✅ **軟刪除**：deleted_at 欄位支援
- ✅ **預設拒絕**：anonymous 使用者無權限

### JWT Claims 要求

應用程式需要在 JWT 中包含：

```json
{
  "sub": "user-uuid",
  "organization_id": "org-uuid",
  "role": "admin|member|viewer"
}
```

**設定位置**: Firebase Auth Custom Claims

## 🛠️ 開發工具

### 部署腳本功能

`deploy-migrations.sh` 提供：

- ✅ 環境檢查（psql, Supabase CLI）
- ✅ 連線測試
- ✅ 依序執行 migrations
- ✅ 錯誤處理
- ✅ 部署驗證
- ✅ 彩色輸出

### 驗證腳本功能

`verify-deployment.sql` 檢查：

1. ✅ 表格存在性
2. ✅ RLS 啟用狀態
3. ✅ RLS 政策數量
4. ✅ 索引完整性
5. ✅ 函式存在性
6. ✅ 觸發器配置
7. ✅ RLS 測試執行
8. ✅ 表格結構
9. ✅ 基本功能
10. ✅ 文檔完整性

## 📋 Migration 檔案

### 執行順序（重要！）

必須按照以下順序執行：

1. `20251212_01_create_tasks_table.sql` (130 行)
2. `20251212_02_create_logs_table.sql` (173 行)
3. `20251212_03_create_rls_policies.sql` (371 行)
4. `20251212_04_create_notifications_table.sql` (174 行)
5. `20251212_04_task_quantity_expansion.sql` (294 行)
6. `20251212_05_task_quantity_rls_policies.sql` (348 行)

**總行數**: 1,490 行 SQL

### Migration 內容

| Migration | 建立內容 |
|-----------|---------|
| 01 | tasks 表、9 索引、觸發器 |
| 02 | logs 表、9 索引、觸發器、GIN 索引 |
| 03 | RLS 政策、Helper 函式、測試函式 |
| 04 (notifications) | notifications 表、4 索引、RLS 政策 |
| 04 (quantity) | 擴展欄位、關聯表、函式、觸發器 |
| 05 | 擴展功能的 RLS 政策 |

## 🚦 部署前檢查清單

- [ ] PostgreSQL client 已安裝
- [ ] 取得資料庫連線字串
- [ ] 測試連線成功
- [ ] 了解 Migration 內容
- [ ] 準備好回滾計畫（如需要）
- [ ] 通知團隊成員

## ✅ 部署後檢查清單

- [ ] 執行 `verify-deployment.sql` 驗證
- [ ] 所有表格建立成功
- [ ] RLS 啟用且政策正確
- [ ] 索引和觸發器運作正常
- [ ] 測試基本 CRUD 操作
- [ ] 配置 Firebase Auth Custom Claims
- [ ] 更新前端應用程式連接
- [ ] 監控 Supabase Dashboard 日誌

## 🐛 問題排解

### 連線問題

```bash
# 測試連線
psql "$DATABASE_URL" -c "SELECT version();"

# 檢查連線字串格式
echo $DATABASE_URL
```

### Migration 失敗

```bash
# 查看詳細錯誤
psql "$DATABASE_URL" -f supabase/migrations/FILE.sql 2>&1 | tee error.log

# 檢查 Supabase Logs
# Dashboard → Logs → Postgres Logs
```

### 權限問題

確認使用正確的連線字串：
- ✅ 使用 **Direct Connection**（不是 Transaction Pooler）
- ✅ 使用 **postgres** 使用者
- ✅ 密碼正確且已 URL encode

## 🔄 回滾

如需完全回滾：

```bash
# ⚠️ 警告：會刪除所有資料！
psql "$DATABASE_URL" << EOF
DROP TABLE IF EXISTS public.task_progress CASCADE;
DROP TABLE IF EXISTS public.quality_controls CASCADE;
DROP TABLE IF EXISTS public.log_tasks CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.logs CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS public.test_rls_policies();
DROP FUNCTION IF EXISTS public.is_blueprint_in_user_organization(UUID);
-- ... 其他函式
EOF
```

詳細回滾指令請參考：[部署指南.md](./部署指南.md)

## 📞 取得協助

### 資源連結

- 🏠 **Dashboard**: https://supabase.com/dashboard/project/zecsbstjqjqoytwgjyct
- 📝 **SQL Editor**: https://supabase.com/dashboard/project/zecsbstjqjqoytwgjyct/editor
- 📊 **Database Logs**: https://supabase.com/dashboard/project/zecsbstjqjqoytwgjyct/logs/postgres-logs
- 📖 **Supabase Docs**: https://supabase.com/docs

### 聯絡方式

- 查看專案 Issues
- 聯絡開發團隊
- 參考 Supabase 官方文檔

## 📈 效能監控

### 建議監控項目

1. **查詢效能**
   - 慢查詢識別
   - 索引使用率
   - 查詢計畫分析

2. **RLS 效能**
   - 政策執行時間
   - JWT Claims 解析
   - 組織隔離開銷

3. **資料庫健康**
   - 連線池使用率
   - 儲存空間
   - 備份狀態

### 優化建議

- 定期 VACUUM 和 ANALYZE
- 監控索引使用情況
- 優化複雜 RLS 政策
- 適時新增 materialized views

## 🎯 下一步

1. **完成部署**
   - 執行 deployment script
   - 驗證所有測試通過

2. **配置應用程式**
   - 設定 Firebase Auth Custom Claims
   - 更新前端連線設定
   - 測試 CRUD 操作

3. **開發功能**
   - 實作任務管理
   - 整合日誌系統
   - 啟用通知功能
   - 實現數量追蹤
   - 品質管控流程

4. **監控維護**
   - 設定告警
   - 定期備份
   - 效能優化
   - 安全性審查

## 📝 版本資訊

- **建立日期**: 2025-12-12
- **Migration 版本**: 1.0.0
- **維護者**: GigHub Development Team
- **最後更新**: 2025-12-12

---

**重要提醒**：
- 📖 部署前請詳閱 [部署指南.md](./部署指南.md)
- ⚡ 快速開始請參考 [QUICK_DEPLOY.md](./QUICK_DEPLOY.md)
- 📊 完整摘要請查看 [../DEPLOYMENT_SUMMARY.md](../DEPLOYMENT_SUMMARY.md)
