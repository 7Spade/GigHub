# GigHub 專案設置指南

> 完整的開發環境設置說明

## 📋 目錄

1. [前置需求](#前置需求)
2. [快速開始](#快速開始)
3. [Supabase 設置](#supabase-設置)
4. [Firebase 設置](#firebase-設置)
5. [開發伺服器](#開發伺服器)
6. [常見問題](#常見問題)

---

## 前置需求

確保你的系統已安裝以下工具：

- **Node.js**: v20.x 或更高版本
- **Yarn**: v4.9.2 (Berry)
- **Git**: 最新版本

```bash
# 檢查版本
node --version  # 應該是 v20.x
yarn --version  # 應該是 4.9.2
```

---

## 快速開始

### 1. Clone 專案

```bash
git clone https://github.com/7Spade/GigHub.git
cd GigHub
```

### 2. 安裝依賴

```bash
yarn install
```

### 3. 環境配置

#### 方法 A: 使用互動式腳本 (推薦)

```bash
./scripts/setup-env.sh
```

按照提示輸入你的 Supabase 憑證。

#### 方法 B: 手動建立

複製範例文件並編輯：

```bash
cp .env.example .env
```

編輯 `.env` 文件，填入你的憑證：

```env
# Supabase Configuration
NG_PUBLIC_SUPABASE_URL="your-supabase-url"
NG_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

SUPABASE_URL="your-supabase-url"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

---

## Supabase 設置

### 1. 建立 Supabase 專案

1. 前往 [Supabase Dashboard](https://supabase.com/dashboard)
2. 建立新專案
3. 記下專案 URL 和 API Keys

### 2. 初始化資料庫

#### 方法 A: 使用 Supabase Dashboard (推薦)

1. 進入 **SQL Editor**
2. 複製 `docs/database/init_schema.sql` 的內容
3. 執行腳本

#### 方法 B: 使用 psql 指令

```bash
psql "your-postgres-connection-string" -f docs/database/init_schema.sql
```

#### 方法 C: 使用 Supabase CLI

```bash
# 安裝 CLI
npm install -g supabase

# 登入
supabase login

# 連結專案
supabase link --project-ref your-project-ref

# 執行遷移
supabase db push
```

### 3. 建立 Storage Bucket

工地照片需要一個儲存桶：

1. 進入 **Storage** 頁面
2. 建立新 Bucket:
   - **名稱**: `construction-photos`
   - **Public**: ✅ 勾選
   - **檔案大小限制**: 10MB
   - **允許的 MIME 類型**: `image/jpeg`, `image/png`, `image/webp`

### 4. 驗證設置

在 SQL Editor 執行：

```sql
-- 檢查表格
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- 檢查範例資料
SELECT * FROM public.blueprints LIMIT 5;
SELECT * FROM public.construction_logs LIMIT 5;
```

---

## Firebase 設置

> 任務管理功能使用 Firebase Firestore

### 1. 建立 Firebase 專案

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 建立新專案
3. 啟用 Firestore Database

### 2. 配置 Firebase

1. 進入專案設定
2. 在 "你的應用程式" 區域選擇 Web 應用
3. 複製配置物件

### 3. 更新環境配置

編輯 `src/environments/environment.ts`：

```typescript
export const environment = {
  // ... 其他配置
  firebase: {
    apiKey: "your-api-key",
    authDomain: "your-auth-domain",
    projectId: "your-project-id",
    storageBucket: "your-storage-bucket",
    messagingSenderId: "your-messaging-sender-id",
    appId: "your-app-id"
  }
};
```

---

## 開發伺服器

### 啟動開發伺服器

```bash
yarn start
```

應用程式將在 `http://localhost:4200` 啟動。

### 其他指令

```bash
# 建置專案
yarn build

# 執行測試
yarn test

# 程式碼檢查
yarn lint

# 樣式檢查
yarn lint:style

# 端對端測試
yarn e2e
```

---

## 常見問題

### 1. 找不到表格錯誤

**錯誤**: `Could not find the table 'public.construction_logs' in the schema`

**解決方法**:
1. 確認 `init_schema.sql` 已執行
2. 檢查 Supabase 連線配置
3. 驗證 RLS 政策

### 2. 權限被拒絕

**錯誤**: `permission denied for table`

**解決方法**:
1. 確認用戶已登入
2. 檢查 RLS 政策設定
3. 使用正確的 API Key

### 3. 任務列表空轉

**可能原因**:
- Firebase 未正確配置
- Firestore 規則設定錯誤
- 網路連線問題

**解決方法**:
1. 檢查 Firebase 配置
2. 查看瀏覽器 Console 錯誤訊息
3. 確認 Firestore 規則允許讀取

### 4. 建置失敗

**可能原因**:
- Node 版本不符
- 依賴安裝不完整
- TypeScript 錯誤

**解決方法**:
```bash
# 清理並重新安裝
rm -rf node_modules .yarn/cache
yarn install

# 檢查 TypeScript 錯誤
yarn lint:ts
```

### 5. 環境變數未載入

**解決方法**:
- 確認 `.env` 文件在專案根目錄
- 重啟開發伺服器
- 檢查 `environment.ts` 配置

---

## 開發工作流程

### 新增功能

1. 建立新分支：`git checkout -b feature/your-feature`
2. 開發並測試
3. 執行 lint：`yarn lint`
4. 提交變更：`git commit -m "feat: your feature"`
5. 推送並建立 PR

### 資料庫變更

1. 在 `docs/database/migrations/` 建立新的 SQL 文件
2. 命名格式：`XXX_description.sql`
3. 在 Supabase 執行遷移
4. 更新相關 TypeScript 介面

---

## 相關文件

- [Angular 開發指引](.github/instructions/angular.instructions.md)
- [資料庫設置指南](docs/database/README.md)
- [快速參考指南](.github/instructions/quick-reference.instructions.md)
- [Copilot 指令](.github/copilot-instructions.md)

---

## 取得協助

- 📧 Email: support@gighub.dev
- 💬 GitHub Issues: [GigHub Issues](https://github.com/7Spade/GigHub/issues)
- 📚 文件: [GigHub Docs](https://github.com/7Spade/GigHub/tree/main/docs)

---

## 授權

MIT License - 詳見 [LICENSE](LICENSE)
