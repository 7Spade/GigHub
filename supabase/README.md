# Supabase Database Migrations

## 📂 目錄說明

此目錄包含所有 Supabase 資料庫的 SQL 腳本和遷移檔案。

## 📋 檔案清單

### `construction_logs.sql`
**工地施工日誌表格建立腳本**

**功能**:
- 建立 `construction_logs` 表格
- 建立 5 個效能索引
- 啟用 Row Level Security (RLS)
- 建立 4 個 RLS 政策
- 建立自動更新時間戳記的觸發器
- 建立 Storage 政策 (construction-photos bucket)

**使用方式**:
1. 登入 Supabase Dashboard
2. 前往 SQL Editor
3. 複製 `construction_logs.sql` 內容
4. 執行 SQL
5. 手動建立 Storage Bucket: `construction-photos` (Public)

**驗證**:
```sql
-- 檢查表格是否存在
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'construction_logs';

-- 檢查 RLS 是否啟用
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename = 'construction_logs';

-- 檢查政策數量
SELECT COUNT(*) FROM pg_policies WHERE tablename = 'construction_logs';
```

## 🔧 執行順序

1. **construction_logs.sql** - 工地日誌功能 (已完成)
2. 未來的遷移檔案將依序加入

## 📚 相關文件

- 完整設定指南: `/docs/database/SETUP_CONSTRUCTION_LOGS.md`
- 快速開始: `/docs/database/QUICK_START.md`
- 實作總結: `/CONSTRUCTION_LOGS_IMPLEMENTATION.md`

## ⚠️ 注意事項

- 所有 SQL 腳本應使用 UTF-8 編碼
- 執行前請先備份資料庫
- 確認 Supabase 專案 URL 和金鑰正確
- Storage Bucket 需手動在 Dashboard 建立

## 🔗 Supabase 連線資訊

專案 URL: `https://zecsbstjqjqoytwgjyct.supabase.co`

環境變數配置位於:
- `src/environments/environment.ts` (開發環境)
- `src/environments/environment.prod.ts` (生產環境)
