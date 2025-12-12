# 🎯 執行檢查清單 (Execution Checklist)

## 📋 快速開始 (3 步驟搞定)

### ✅ 步驟 1: 執行 SQL (5 分鐘)

**方法**: Supabase Dashboard

1. [ ] 登入 https://supabase.com/dashboard
2. [ ] 選擇專案 `zecsbstjqjqoytwgjyct`
3. [ ] 開啟 SQL Editor (左側選單)
4. [ ] 建立新查詢 (New Query)
5. [ ] 複製 `supabase/000_complete_setup.sql` 的內容
6. [ ] 貼上並點擊 Run (執行)
7. [ ] 等待執行完成（約 10-30 秒）

**預期結果**:
```
✅ Query executed successfully
✅ Tables created
✅ Policies created
✅ Storage bucket created
```

---

### ✅ 步驟 2: 驗證設定 (2 分鐘)

在 SQL Editor 中執行以下查詢：

#### 2.1 檢查表格
```sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('blueprints', 'construction_logs');
```
**預期結果**: 返回 2 rows
```
blueprints
construction_logs
```

#### 2.2 檢查 Storage Bucket
```sql
SELECT id, name, public, file_size_limit / 1024 / 1024 AS size_limit_mb
FROM storage.buckets
WHERE id = 'construction-photos';
```
**預期結果**: 返回 1 row
```
id: construction-photos
name: construction-photos
public: true
size_limit_mb: 50
```

#### 2.3 檢查 RLS 政策
```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('blueprints', 'construction_logs')
ORDER BY tablename, policyname;
```
**預期結果**: 返回多個政策（至少 6 個）

---

### ✅ 步驟 3: 測試應用程式 (5 分鐘)

#### 3.1 啟動開發伺服器
```bash
cd /path/to/GigHub
yarn start
```
**預期結果**:
```
✅ Application bundle generation complete.
✅ Local: http://localhost:4200/
```

#### 3.2 開啟瀏覽器
```
http://localhost:4200
```

#### 3.3 導航至工地日誌
1. [ ] 點擊左側選單「藍圖」
2. [ ] 選擇或建立一個藍圖
3. [ ] 點擊「工地日誌」標籤

#### 3.4 驗證功能
- [ ] 頁面正常載入（不再顯示錯誤或空轉）
- [ ] 可以看到「新增日誌」按鈕
- [ ] 點擊「新增日誌」，彈出表單
- [ ] 填寫表單並儲存
- [ ] 日誌成功建立並顯示在列表中

#### 3.5 測試照片上傳
1. [ ] 點擊「編輯」日誌
2. [ ] 上傳一張測試照片
3. [ ] 照片成功顯示在日誌中
4. [ ] 可以刪除照片

---

## 🎉 完成！

如果以上所有步驟都通過，表示修復成功！

---

## ⚠️ 如果遇到問題

### 問題 A: SQL 執行失敗

#### 症狀
```
❌ Error: relation "public.blueprints" already exists
```

#### 解決方案
1. 表格可能已存在，忽略此錯誤
2. 或執行清理後重試：
```sql
DROP TABLE IF EXISTS public.construction_logs CASCADE;
DROP TABLE IF EXISTS public.blueprints CASCADE;
-- 然後重新執行 000_complete_setup.sql
```

---

### 問題 B: 應用程式仍顯示錯誤

#### 症狀
```
❌ Failed to fetch logs: Could not find the table...
```

#### 解決方案（按順序嘗試）
1. [ ] 確認 SQL 已成功執行
2. [ ] 重新啟動開發伺服器 (`Ctrl+C` 然後 `yarn start`)
3. [ ] 清除瀏覽器快取 (`Ctrl+Shift+R` 或 `Cmd+Shift+R`)
4. [ ] 檢查瀏覽器控制台的錯誤訊息
5. [ ] 確認環境變數檔案已更新：
   ```bash
   cat src/environments/environment.ts | grep supabase
   ```
   應顯示新的 URL: `zecsbstjqjqoytwgjyct.supabase.co`

---

### 問題 C: 無法上傳照片

#### 症狀
```
❌ Failed to upload photo
```

#### 解決方案
1. [ ] 確認 storage bucket 已建立（步驟 2.2）
2. [ ] 檢查檔案大小（必須 < 50MB）
3. [ ] 檢查檔案格式（僅接受: jpeg, jpg, png, webp, heic）
4. [ ] 確認已登入應用程式（RLS 需要認證）

---

## 📊 進度追蹤

### 整體進度
- [ ] 步驟 1: 執行 SQL (5 分鐘)
- [ ] 步驟 2: 驗證設定 (2 分鐘)
- [ ] 步驟 3: 測試應用程式 (5 分鐘)

### 詳細檢查
- [ ] Blueprints 表格已建立
- [ ] Construction Logs 表格已建立
- [ ] Storage Bucket 已建立
- [ ] RLS 政策已啟用
- [ ] 索引已建立
- [ ] 應用程式可以連接到資料庫
- [ ] 可以建立工地日誌
- [ ] 可以上傳照片
- [ ] 可以編輯和刪除日誌

---

## 🔍 驗證命令快速參考

```sql
-- 檢查表格
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- 檢查 enums
SELECT t.typname FROM pg_type t WHERE t.typtype = 'e';

-- 檢查 storage buckets
SELECT * FROM storage.buckets;

-- 檢查 RLS 政策
SELECT schemaname, tablename, policyname FROM pg_policies;

-- 檢查索引
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public';

-- 檢查外鍵
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table
FROM pg_constraint
WHERE contype = 'f' AND connamespace = 'public'::regnamespace;
```

---

## 📞 需要協助？

1. **查看詳細文件**: [README.md](./README.md)
2. **快速設定指南**: [QUICK_SETUP.md](./QUICK_SETUP.md)
3. **問題摘要**: [SUMMARY.md](./SUMMARY.md)
4. **聯繫開發團隊**: GigHub Development Team

---

## 🎯 成功標準

### ✅ 最終驗證
當所有以下條件都滿足時，表示修復完全成功：

1. ✅ SQL 執行無錯誤
2. ✅ 所有表格和 bucket 都存在
3. ✅ 應用程式頁面正常載入
4. ✅ 可以建立、編輯、刪除工地日誌
5. ✅ 可以上傳和刪除照片
6. ✅ 沒有任何錯誤訊息

### 🏆 恭喜！
如果達成以上所有標準，您已成功修復工地日誌功能！

---

**建立日期**: 2025-12-12  
**預計完成時間**: 12-15 分鐘  
**難度**: ⭐⭐☆☆☆ (簡單)
