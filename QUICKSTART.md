# 🚀 GigHub 快速啟動指南

> 5 分鐘內啟動 GigHub 開發環境

## ⚡ 快速步驟

### 1️⃣ 執行資料庫腳本 (最重要！)

**前往 Supabase Dashboard 並執行 SQL**:

1. 開啟 https://supabase.com/dashboard
2. 選擇專案 `zecsbstjqjqoytwgjyct`
3. 點擊 **SQL Editor**
4. 複製 `docs/database/init_schema.sql` 的內容
5. 貼上並點擊 **RUN**

✅ 這將建立:
- `blueprints` 表
- `construction_logs` 表
- RLS 政策
- 觸發器和索引

### 2️⃣ 建立 Storage Bucket

**在 Supabase Dashboard**:

1. 點擊 **Storage**
2. 點擊 **New bucket**
3. 輸入名稱: `construction-photos`
4. ✅ 勾選 **Public bucket**
5. 點擊 **Create bucket**

### 3️⃣ 本地環境設置

```bash
# 1. 安裝依賴
yarn install

# 2. 建立 .env 文件（使用互動式腳本）
./scripts/setup-env.sh

# 3. 啟動開發伺服器
yarn start
```

### 4️⃣ 驗證

開啟 http://localhost:4200

- 檢查 Console 是否有 `[SupabaseService] Initialized` 訊息
- 測試工地日誌功能

## ✅ 完成！

如果一切正常，你應該可以:
- ✅ 查看工地日誌
- ✅ 建立新的日誌
- ✅ 上傳照片

## 🔧 如果遇到問題

### 問題: 找不到表格

**錯誤訊息**: `Could not find the table 'public.construction_logs'`

**解決**: 確認步驟 1 已完成，再執行一次 SQL 腳本

### 問題: 權限錯誤

**錯誤訊息**: `permission denied for table`

**解決**: 檢查 RLS 政策是否已建立（在步驟 1 的 SQL 腳本中）

### 問題: 照片上傳失敗

**解決**: 確認步驟 2 已完成，bucket 必須設為 Public

## 📚 詳細文件

- 完整設置: [SETUP.md](SETUP.md)
- 實施摘要: [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
- 資料庫文件: [docs/database/README.md](docs/database/README.md)

## 🎯 下一步

- [ ] 設置 Firebase (任務功能)
- [ ] 配置 CI/CD
- [ ] 部署到測試環境

---

**需要幫助?** 請開 GitHub Issue 或查看完整文件。
