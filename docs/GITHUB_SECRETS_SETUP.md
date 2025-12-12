# GitHub Secrets 設定指南

> **專案**: GigHub - 工地施工進度追蹤管理系統  
> **用途**: CI/CD 自動化部署與資料庫遷移

## 📋 目錄

1. [概述](#概述)
2. [必要的 Secrets](#必要的-secrets)
3. [設定步驟](#設定步驟)
4. [環境特定配置](#環境特定配置)
5. [驗證設定](#驗證設定)
6. [安全最佳實踐](#安全最佳實踐)

---

## 概述

GitHub Secrets 用於安全儲存敏感資訊（如 API 金鑰、資料庫密碼），避免直接暴露在程式碼中。本專案需要設定以下 Secrets 以支援自動化遷移流程。

---

## 必要的 Secrets

### 1. Supabase 通用 Secrets

#### `SUPABASE_ACCESS_TOKEN`
- **用途**: Supabase CLI 認證
- **取得方式**:
  1. 前往 [Supabase Account Settings](https://app.supabase.com/account/tokens)
  2. 點擊 "Generate New Token"
  3. 複製生成的 Token

**範例值**: `sbp_1234567890abcdef...`

---

### 2. Development 環境 Secrets

#### `SUPABASE_PROJECT_REF_DEV`
- **用途**: Development 專案 ID
- **取得方式**:
  1. 前往 [Supabase Dashboard](https://app.supabase.com)
  2. 選擇 Development 專案
  3. 前往 Settings > General
  4. 複製 "Reference ID"

**範例值**: `abcdef123456`

#### `SUPABASE_ANON_KEY_DEV`
- **用途**: Development 公開金鑰（前端使用）
- **取得方式**:
  1. 前往 Supabase Dashboard > Settings > API
  2. 複製 "anon public" 金鑰

**範例值**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

#### `SUPABASE_SERVICE_ROLE_KEY_DEV`
- **用途**: Development 服務金鑰（後端管理使用）
- **取得方式**:
  1. 前往 Supabase Dashboard > Settings > API
  2. 複製 "service_role" 金鑰
  3. ⚠️ **切勿在前端使用此金鑰！**

**範例值**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

### 3. Staging 環境 Secrets

#### `SUPABASE_PROJECT_REF_STAGING`
- **用途**: Staging 專案 ID
- **取得方式**: 同 Development

#### `SUPABASE_ANON_KEY_STAGING`
- **用途**: Staging 公開金鑰
- **取得方式**: 同 Development

#### `SUPABASE_SERVICE_ROLE_KEY_STAGING`
- **用途**: Staging 服務金鑰
- **取得方式**: 同 Development

---

### 4. Production 環境 Secrets

#### `SUPABASE_PROJECT_REF_PROD`
- **用途**: Production 專案 ID
- **取得方式**: 同 Development

#### `SUPABASE_ANON_KEY_PROD`
- **用途**: Production 公開金鑰
- **取得方式**: 同 Development

#### `SUPABASE_SERVICE_ROLE_KEY_PROD`
- **用途**: Production 服務金鑰
- **取得方式**: 同 Development

#### `SUPABASE_DB_URL_PROD`
- **用途**: Production 資料庫直連 URL（用於備份）
- **取得方式**:
  1. 前往 Supabase Dashboard > Settings > Database
  2. 複製 "Connection string" (URI format)

**範例值**: `postgres://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`

---

### 5. 其他可選 Secrets

#### `FIREBASE_ADMIN_SDK`
- **用途**: Firebase Admin SDK 服務帳號金鑰（JSON 格式）
- **取得方式**:
  1. 前往 [Firebase Console](https://console.firebase.google.com)
  2. 選擇專案 > Project Settings > Service Accounts
  3. 點擊 "Generate new private key"
  4. 將 JSON 內容複製為 Secret

#### `SENTRY_DSN`
- **用途**: 錯誤追蹤（Sentry）
- **取得方式**: Sentry Dashboard > Settings > Client Keys (DSN)

---

## 設定步驟

### 方法 1: 透過 GitHub Web UI（推薦）

1. **前往 Repository Settings**
   ```
   https://github.com/7Spade/GigHub/settings/secrets/actions
   ```

2. **新增 Secret**
   - 點擊 "New repository secret"
   - 輸入 Secret 名稱（例如 `SUPABASE_ACCESS_TOKEN`）
   - 貼上 Secret 值
   - 點擊 "Add secret"

3. **重複步驟** 為每個必要的 Secret

4. **驗證設定**
   - 確認所有 Secrets 已新增
   - 檢查名稱拼寫正確

### 方法 2: 使用 GitHub CLI

```bash
# 安裝 GitHub CLI (如果尚未安裝)
# macOS: brew install gh
# Windows: scoop install gh
# Linux: https://github.com/cli/cli/blob/trunk/docs/install_linux.md

# 登入 GitHub
gh auth login

# 新增 Secrets
gh secret set SUPABASE_ACCESS_TOKEN
# 系統會提示輸入值，貼上後按 Enter

# 或從檔案設定
gh secret set SUPABASE_ACCESS_TOKEN < token.txt

# 批次設定多個 Secrets
gh secret set SUPABASE_PROJECT_REF_DEV -b "abcdef123456"
gh secret set SUPABASE_ANON_KEY_DEV -b "eyJhbGci..."
gh secret set SUPABASE_SERVICE_ROLE_KEY_DEV -b "eyJhbGci..."
```

### 方法 3: 使用腳本自動化

建立 `scripts/setup-secrets.sh`:

```bash
#!/bin/bash

echo "Setting up GitHub Secrets for GigHub project"

# Supabase Access Token
read -p "Enter SUPABASE_ACCESS_TOKEN: " token
gh secret set SUPABASE_ACCESS_TOKEN -b "$token"

# Development Environment
read -p "Enter SUPABASE_PROJECT_REF_DEV: " dev_ref
gh secret set SUPABASE_PROJECT_REF_DEV -b "$dev_ref"

read -p "Enter SUPABASE_ANON_KEY_DEV: " dev_anon
gh secret set SUPABASE_ANON_KEY_DEV -b "$dev_anon"

read -p "Enter SUPABASE_SERVICE_ROLE_KEY_DEV: " dev_service
gh secret set SUPABASE_SERVICE_ROLE_KEY_DEV -b "$dev_service"

# Production Environment
read -p "Enter SUPABASE_PROJECT_REF_PROD: " prod_ref
gh secret set SUPABASE_PROJECT_REF_PROD -b "$prod_ref"

read -p "Enter SUPABASE_ANON_KEY_PROD: " prod_anon
gh secret set SUPABASE_ANON_KEY_PROD -b "$prod_anon"

read -p "Enter SUPABASE_SERVICE_ROLE_KEY_PROD: " prod_service
gh secret set SUPABASE_SERVICE_ROLE_KEY_PROD -b "$prod_service"

read -p "Enter SUPABASE_DB_URL_PROD: " prod_db_url
gh secret set SUPABASE_DB_URL_PROD -b "$prod_db_url"

echo "✅ All secrets have been set successfully!"
```

執行腳本:
```bash
chmod +x scripts/setup-secrets.sh
./scripts/setup-secrets.sh
```

---

## 環境特定配置

### Development 環境

**用途**: 本地開發、功能測試

**必要 Secrets**:
- ✅ `SUPABASE_ACCESS_TOKEN`
- ✅ `SUPABASE_PROJECT_REF_DEV`
- ✅ `SUPABASE_ANON_KEY_DEV`
- ✅ `SUPABASE_SERVICE_ROLE_KEY_DEV`

**觸發條件**:
- Push to `develop` branch
- Manual workflow dispatch with `environment: development`

### Staging 環境

**用途**: UAT 測試、客戶驗收

**必要 Secrets**:
- ✅ `SUPABASE_ACCESS_TOKEN`
- ✅ `SUPABASE_PROJECT_REF_STAGING`
- ✅ `SUPABASE_ANON_KEY_STAGING`
- ✅ `SUPABASE_SERVICE_ROLE_KEY_STAGING`

**觸發條件**:
- Manual workflow dispatch with `environment: staging`

### Production 環境

**用途**: 正式環境、實際使用者

**必要 Secrets**:
- ✅ `SUPABASE_ACCESS_TOKEN`
- ✅ `SUPABASE_PROJECT_REF_PROD`
- ✅ `SUPABASE_ANON_KEY_PROD`
- ✅ `SUPABASE_SERVICE_ROLE_KEY_PROD`
- ✅ `SUPABASE_DB_URL_PROD`

**觸發條件**:
- Push to `main` branch
- Manual workflow dispatch with `environment: production`

**額外保護**:
- Required reviewers (建議設定)
- Branch protection rules
- 自動備份機制

---

## 驗證設定

### 方法 1: 使用 GitHub CLI

```bash
# 列出所有 Secrets
gh secret list

# 預期輸出:
# SUPABASE_ACCESS_TOKEN
# SUPABASE_PROJECT_REF_DEV
# SUPABASE_ANON_KEY_DEV
# SUPABASE_SERVICE_ROLE_KEY_DEV
# SUPABASE_PROJECT_REF_STAGING
# ...
```

### 方法 2: 觸發測試 Workflow

1. 前往 GitHub Actions
2. 選擇 "Supabase Migrations" workflow
3. 點擊 "Run workflow"
4. 選擇 `environment: development`
5. 勾選 `dry_run: true`
6. 點擊 "Run workflow"
7. 檢查執行結果

### 方法 3: 檢查 Workflow 日誌

```bash
# 使用 GitHub CLI 查看最近的 workflow runs
gh run list --workflow=supabase-migrations.yml

# 查看特定 run 的日誌
gh run view <run-id> --log
```

---

## 安全最佳實踐

### ✅ 應該做的事

1. **金鑰分離**
   - 不同環境使用不同的 Supabase 專案
   - 切勿在多個環境共用金鑰

2. **定期輪替**
   - 每 90 天輪替所有金鑰
   - 在 Calendar 設定提醒

3. **最小權限原則**
   - 前端只使用 Anon Key
   - Service Role Key 僅用於後端腳本

4. **監控存取**
   - 定期檢查 Supabase Dashboard > Logs
   - 設定異常存取告警

5. **備份機制**
   - Production 遷移前自動備份
   - 保留備份至少 30 天

### ❌ 不應該做的事

1. **切勿提交至版本控制**
   ```bash
   # 確保 .env 在 .gitignore 中
   echo ".env" >> .gitignore
   echo ".env.local" >> .gitignore
   ```

2. **切勿在日誌中輸出**
   ```typescript
   // ❌ 錯誤
   console.log('API Key:', process.env.SUPABASE_KEY);
   
   // ✅ 正確
   console.log('API Key:', '***REDACTED***');
   ```

3. **切勿在前端暴露 Service Role Key**
   ```typescript
   // ❌ 絕對禁止！
   const supabase = createClient(url, SERVICE_ROLE_KEY);
   ```

4. **切勿共用金鑰**
   - 不同團隊成員使用個人 Access Token
   - 不同環境使用獨立專案

### 🔒 金鑰輪替流程

1. **建立新金鑰**
   - 前往 Supabase Dashboard > Settings > API
   - Generate new keys

2. **更新 GitHub Secrets**
   ```bash
   gh secret set SUPABASE_ANON_KEY_PROD -b "new_key_here"
   gh secret set SUPABASE_SERVICE_ROLE_KEY_PROD -b "new_key_here"
   ```

3. **更新部署環境**
   - 更新 Production 環境變數
   - 重新部署應用程式

4. **驗證功能**
   - 測試應用程式功能
   - 檢查 API 呼叫是否正常

5. **撤銷舊金鑰**
   - 確認新金鑰運作正常後再撤銷
   - 在 Supabase Dashboard 撤銷舊金鑰

---

## 疑難排解

### 問題 1: Workflow 執行失敗 "Secret not found"

**原因**: Secret 名稱拼寫錯誤或未設定

**解決方案**:
```bash
# 檢查 Secret 名稱
gh secret list

# 重新設定 Secret
gh secret set SUPABASE_ACCESS_TOKEN
```

### 問題 2: "Authentication failed"

**原因**: Access Token 過期或無效

**解決方案**:
1. 重新生成 Access Token
2. 更新 GitHub Secret
3. 重新執行 Workflow

### 問題 3: "Project not found"

**原因**: Project Reference ID 錯誤

**解決方案**:
1. 驗證 Project Reference ID
2. 確認使用正確的環境（dev/staging/prod）
3. 更新對應的 Secret

---

## 相關資源

- [GitHub Secrets 官方文檔](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Supabase CLI 認證](https://supabase.com/docs/guides/cli/local-development#log-in-to-the-supabase-cli)
- [Supabase API 金鑰管理](https://supabase.com/docs/guides/api#api-keys)

---

**最後更新**: 2025-12-12  
**維護者**: GigHub Development Team
