# GigHub 資料庫設定 (Database Setup)

## 🚨 快速修復 (Quick Fix)

如果您遇到以下錯誤：
```
Failed to fetch logs: Could not find the table 'public.construction_logs' in the schema
```

**立即解決方案 (Immediate Solution)**:

1. 開啟 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇專案: `zecsbstjqjqoytwgjyct`
3. 點選 **SQL Editor** → **New Query**
4. 複製貼上 `QUICK_FIX.sql` 的內容
5. 點選 **Run** 執行

✅ **完成！** 現在可以使用工地施工日誌功能

---

## 📁 檔案說明 (File Descriptions)

### 1. `QUICK_FIX.sql` ⚡ (推薦用於快速修復)

**用途**: 建立最基本的資料庫結構以修復錯誤

**包含內容**:
- ✅ `accounts` 表 (帳號)
- ✅ `organizations` 表 (組織)
- ✅ `blueprints` 表 (藍圖/專案)
- ✅ `construction_logs` 表 (工地施工日誌) ⭐
- ✅ 基本索引
- ✅ RLS 政策 (開放給所有使用者)
- ✅ 測試資料

**適合情境**: 快速修復錯誤，立即讓功能可用

---

### 2. `complete_schema.sql` 📚 (完整版)

**用途**: 建立完整的 GigHub 資料庫結構

**包含內容**:
- ✅ 所有基礎表 (Foundation Layer)
- ✅ 所有容器表 (Container Layer)
- ✅ 所有業務表 (Business Layer)
- ✅ Tasks, Logs, Quality Control 等功能表
- ✅ 完整索引優化
- ✅ 完整 RLS 政策
- ✅ 自動更新 Triggers
- ✅ 範例資料

**適合情境**: 
- 新專案初始化
- 需要完整功能的正式環境
- 需要所有模組的整合開發

---

### 3. `construction_logs.sql` 📝 (單表版)

**用途**: 僅建立 construction_logs 表的定義

**包含內容**:
- ✅ `construction_logs` 表結構
- ✅ 欄位註解
- ⚠️ 需要手動建立相依表 (blueprints, accounts)

**適合情境**: 
- 已有其他表，只需要新增 construction_logs
- 參考表結構設計

---

### 4. `SETUP_INSTRUCTIONS.md` 📖

**用途**: 詳細的設定指引文件

**包含內容**:
- 步驟說明
- 故障排除
- 驗證方法
- 環境變數設定
- 聯絡支援資訊

---

## 🔧 執行方式 (Execution Methods)

### 方法 1: Supabase Dashboard (推薦) ⭐

**優點**: 
- ✅ 最簡單
- ✅ 視覺化介面
- ✅ 即時錯誤提示
- ✅ 不需要安裝工具

**步驟**:
1. 登入 https://supabase.com/dashboard
2. 選擇專案
3. SQL Editor → New Query
4. 貼上 SQL → Run

---

### 方法 2: PostgreSQL CLI

**優點**:
- ✅ 適合自動化
- ✅ 可批次執行
- ✅ 適合 CI/CD

**步驟**:
```bash
# 使用 QUICK_FIX.sql
psql "postgres://postgres.zecsbstjqjqoytwgjyct:IBXgJ6mxLrlQxNEm@db.zecsbstjqjqoytwgjyct.supabase.co:5432/postgres?sslmode=require" \
  -f docs/database/QUICK_FIX.sql

# 或使用完整 schema
psql "postgres://..." -f docs/database/complete_schema.sql
```

---

### 方法 3: TypeScript 腳本

**優點**:
- ✅ 自動檢查
- ✅ 友善提示
- ✅ 驗證功能

**步驟**:
```bash
# 執行設定腳本
npx ts-node scripts/setup-db.ts
```

---

## ✅ 驗證安裝 (Verification)

### 1. 檢查表是否存在

```sql
-- 執行此查詢
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'construction_logs';
```

**預期結果**: 應該返回 1 筆記錄

---

### 2. 檢查表結構

```sql
-- 檢視所有欄位
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'construction_logs'
ORDER BY ordinal_position;
```

**預期結果**: 應該顯示所有欄位 (id, blueprint_id, date, title 等)

---

### 3. 測試插入資料

```sql
-- 插入測試記錄
INSERT INTO public.construction_logs (
  blueprint_id,
  date,
  title,
  creator_id
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  NOW(),
  '測試日誌',
  '00000000-0000-0000-0000-000000000001'
);

-- 查詢確認
SELECT COUNT(*) FROM public.construction_logs;
```

**預期結果**: 應該返回 1 或更多

---

### 4. 測試應用程式

```bash
# 啟動開發伺服器
yarn start

# 開啟瀏覽器
# http://localhost:4200
# 導航至工地施工日誌頁面
```

**預期結果**: 
- ✅ 不再出現 "table not found" 錯誤
- ✅ 可以看到日誌列表（即使是空的）
- ✅ 可以新增日誌

---

## 🐛 故障排除 (Troubleshooting)

### 問題 1: "permission denied for table"

**解決方案**:
1. 確認使用 Service Role Key 執行 SQL
2. 檢查 RLS 政策是否正確設定
3. 嘗試執行 `QUICK_FIX.sql` 中的 RLS 政策

### 問題 2: "relation does not exist"

**解決方案**:
1. 確認已執行 SQL schema
2. 檢查表名是否正確 (construction_logs)
3. 確認在 public schema 中

### 問題 3: "foreign key violation"

**解決方案**:
1. 先執行 `QUICK_FIX.sql` 建立所有相依表
2. 確認 blueprints 和 accounts 表存在
3. 使用提供的測試資料

---

## 📊 資料庫結構圖 (Schema Diagram)

```
organizations (組織)
    ↓
blueprints (藍圖/專案)
    ↓
construction_logs (工地施工日誌) ⭐
    ↑
accounts (帳號)
```

---

## 🔐 安全性 (Security)

### Row Level Security (RLS)

所有表都啟用了 RLS：

**QUICK_FIX.sql**:
- 🔓 開放政策：允許所有使用者讀寫 (適合開發環境)

**complete_schema.sql**:
- 🔒 認證政策：只允許已認證使用者存取 (適合正式環境)

### 修改 RLS 政策

```sql
-- 限制只有已認證使用者可以存取
DROP POLICY IF EXISTS "Enable read for all users" ON public.construction_logs;
CREATE POLICY "Enable read for authenticated users" ON public.construction_logs
    FOR SELECT USING (auth.role() = 'authenticated');
```

---

## 📞 獲取協助 (Get Help)

如果遇到問題：

1. 📖 閱讀 `SETUP_INSTRUCTIONS.md`
2. 🔍 檢查 Supabase Dashboard 的錯誤訊息
3. 🐛 查看瀏覽器 Console 的錯誤日誌
4. 💬 聯絡開發團隊並提供：
   - 錯誤訊息截圖
   - 執行的 SQL 查詢
   - Supabase 專案 ID

---

**最後更新**: 2025-12-12  
**維護者**: GigHub Development Team  
**版本**: 1.0.0
