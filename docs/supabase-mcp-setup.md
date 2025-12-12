# Supabase MCP 設定指南

本指南說明如何設定 Supabase MCP (Model Context Protocol) 以在 VS Code 中直接連接到遠端 Supabase 資料庫。

## 📋 目錄

- [什麼是 Supabase MCP](#什麼是-supabase-mcp)
- [前置需求](#前置需求)
- [本地開發環境設定](#本地開發環境設定)
- [GitHub Codespaces 設定](#github-codespaces-設定)
- [GitHub Actions 設定](#github-actions-設定)
- [驗證 MCP 連接](#驗證-mcp-連接)
- [常見問題排解](#常見問題排解)
- [安全性最佳實踐](#安全性最佳實踐)

---

## 什麼是 Supabase MCP

Supabase MCP (Model Context Protocol) 是一個允許 AI 助手（如 GitHub Copilot）直接與 Supabase 資料庫互動的協議。透過 MCP，Copilot 可以：

- 📊 **查詢資料庫結構**: 自動獲取表格、欄位、關係等資訊
- 🔍 **執行查詢**: 協助撰寫和執行 SQL 查詢
- 🛠️ **生成遷移**: 根據需求自動產生資料庫遷移腳本
- ✅ **驗證 RLS 政策**: 檢查 Row Level Security 設定是否正確

**重要**: MCP 連接使用 **Supabase Access Token**，而非 Service Role Key，因此受到適當的權限限制。

---

## 前置需求

在開始之前，請確保您已具備：

1. ✅ **Supabase 專案**: 已建立的 Supabase 專案
2. ✅ **Supabase 帳號**: 可登入 Supabase Dashboard 的帳號
3. ✅ **專案權限**: 對專案具有 Owner 或 Admin 權限
4. ✅ **VS Code**: 安裝最新版本的 VS Code
5. ✅ **GitHub Copilot**: 啟用 GitHub Copilot 擴充功能

---

## 本地開發環境設定

### 步驟 1: 取得 Supabase 憑證

#### 1.1 取得 Project Reference ID

1. 登入 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇您的專案（例如: GigHub）
3. 從 URL 複製 Project Reference ID
   ```
   https://supabase.com/dashboard/project/[PROJECT_REF]
   範例: zecsbstjqjqoytwgjyct
   ```

#### 1.2 生成 Access Token

1. 前往 [Account Settings > Access Tokens](https://supabase.com/dashboard/account/tokens)
2. 點擊 **"Generate New Token"**
3. 填寫 Token 資訊:
   - **Name**: `MCP Access Token - GigHub`
   - **Description**: `用於 VS Code MCP 連接的 access token`
4. 點擊 **"Generate Token"**
5. **立即複製 token**（只會顯示一次）

### 步驟 2: 設定本地環境變數

#### 2.1 建立 `.env.mcp` 檔案

```bash
# 在專案根目錄執行
cp .env.mcp.example .env.mcp
```

#### 2.2 填入憑證

編輯 `.env.mcp` 檔案:

```bash
# Supabase Project Reference ID
SUPABASE_PROJECT_REF=zecsbstjqjqoytwgjyct

# Supabase Access Token
SUPABASE_ACCESS_TOKEN=sbat_1a2b3c4d5e6f7g8h9i0j...
```

#### 2.3 確認 `.gitignore` 設定

確保 `.env.mcp` 已在 `.gitignore` 中（避免誤提交）:

```gitignore
# Environment files
.env
.env.local
.env.mcp
.env.*.local
```

### 步驟 3: 重新啟動 VS Code

關閉並重新開啟 VS Code 以載入環境變數。

---

## GitHub Codespaces 設定

如果您使用 GitHub Codespaces 開發，需要設定 Codespaces Secrets:

### 步驟 1: 設定 Repository Secrets

1. 前往 GitHub Repository
2. 點擊 **Settings** > **Secrets and variables** > **Codespaces**
3. 點擊 **"New repository secret"**
4. 新增以下兩個 secrets:

   **Secret 1:**
   - Name: `SUPABASE_PROJECT_REF`
   - Value: `zecsbstjqjqoytwgjyct` (您的專案 ID)

   **Secret 2:**
   - Name: `SUPABASE_ACCESS_TOKEN`
   - Value: `sbat_...` (您的 access token)

### 步驟 2: 重新啟動 Codespace

1. 停止當前 Codespace
2. 重新啟動以載入新的環境變數

---

## GitHub Actions 設定

若您需要在 GitHub Actions 中使用 Supabase MCP（例如自動化測試或部署）:

### 步驟 1: 設定 Actions Secrets

1. 前往 GitHub Repository
2. 點擊 **Settings** > **Secrets and variables** > **Actions**
3. 點擊 **"New repository secret"**
4. 新增以下兩個 secrets:

   **Secret 1:**
   - Name: `SUPABASE_PROJECT_REF`
   - Value: `zecsbstjqjqoytwgjyct`

   **Secret 2:**
   - Name: `SUPABASE_MCP_TOKEN`
   - Value: `sbat_...` (使用與 Codespaces 相同的 token，或創建專用 token)

### 步驟 2: 在 Workflow 中使用

在 `.github/workflows/` 中的 workflow 檔案中引用 secrets:

```yaml
jobs:
  database-migration:
    runs-on: ubuntu-latest
    env:
      SUPABASE_PROJECT_REF: ${{ secrets.SUPABASE_PROJECT_REF }}
      SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_MCP_TOKEN }}
    steps:
      - uses: actions/checkout@v4
      - name: Run migrations
        run: |
          # 您的遷移指令
```

---

## 驗證 MCP 連接

### 方法 1: 使用 GitHub Copilot Chat

1. 開啟 VS Code
2. 開啟 Copilot Chat (按 `Ctrl+Shift+I` 或 `Cmd+Shift+I`)
3. 輸入以下測試指令:

   ```
   @supabase 列出所有資料表
   ```

   或

   ```
   查詢 profiles 表的結構
   ```

4. 如果連接成功，Copilot 會回傳資料表資訊

### 方法 2: 檢查 MCP 配置檔案

#### 檢查 `.vscode/mcp.json`:

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=${SUPABASE_PROJECT_REF}",
      "headers": {
        "Authorization": "Bearer ${SUPABASE_ACCESS_TOKEN}"
      }
    }
  }
}
```

#### 檢查 `.github/copilot/mcp-servers.yml`:

```yaml
mcp-servers:
  supabase:
    type: http
    url: 'https://mcp.supabase.com/mcp?project_ref=${{ secrets.SUPABASE_PROJECT_REF }}'
    headers:
      Authorization: 'Bearer ${{ secrets.SUPABASE_MCP_TOKEN }}'
    tools: ['*']
```

### 方法 3: 手動測試 API 連接

使用 `curl` 測試 MCP endpoint:

```bash
curl -X POST "https://mcp.supabase.com/mcp?project_ref=zecsbstjqjqoytwgjyct" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","params":{},"id":1}'
```

預期回應應包含 MCP 伺服器資訊。

---

## 常見問題排解

### ❌ 問題 1: "無法連接到 Supabase MCP"

**可能原因:**
- 環境變數未正確設定
- Access token 已過期或無效
- Project Reference ID 錯誤

**解決方法:**
1. 確認 `.env.mcp` 檔案存在且內容正確
2. 重新啟動 VS Code
3. 檢查 token 是否過期（前往 Supabase Dashboard 重新生成）
4. 確認 Project Reference ID 與 Dashboard URL 一致

### ❌ 問題 2: "權限被拒絕"

**可能原因:**
- Access token 權限不足
- 使用了錯誤的 token 類型

**解決方法:**
1. 確認使用的是 **Access Token**（非 API Key 或 Service Role Key）
2. 確認帳號對專案具有 Owner 或 Admin 權限
3. 重新生成 Access Token 並更新 `.env.mcp`

### ❌ 問題 3: "Copilot 無法識別 @supabase 指令"

**可能原因:**
- MCP 配置檔案格式錯誤
- Supabase agent 未正確載入

**解決方法:**
1. 檢查 `.vscode/mcp.json` 語法是否正確（JSON 格式）
2. 檢查 `.github/copilot/mcp-servers.yml` 語法是否正確（YAML 格式）
3. 確認 `.github/agents/supabase.agent.md` 檔案存在
4. 重新載入 VS Code 窗口

### ❌ 問題 4: "環境變數未被替換"

**可能原因:**
- VS Code 未重新載入環境變數
- `.env.mcp` 檔案路徑錯誤

**解決方法:**
1. 確認 `.env.mcp` 位於專案根目錄
2. 完全關閉 VS Code 並重新開啟（非重新載入窗口）
3. 使用 VS Code 的 "Reload Window" 指令

---

## 安全性最佳實踐

### ✅ 環境隔離

- ✅ **開發/測試/生產分離**: 每個環境使用獨立的專案和 token
- ✅ **本地開發**: 使用 `.env.mcp` 檔案（已加入 `.gitignore`）
- ✅ **CI/CD**: 使用 GitHub Secrets 或環境變數

### ✅ Token 管理

- ✅ **定期輪替**: 建議每 90 天輪替一次 access token
- ✅ **最小權限**: 只授予必要的權限範圍
- ✅ **監控使用**: 定期檢查 token 使用日誌以偵測異常
- ✅ **立即撤銷**: 發現 token 洩漏時立即撤銷並重新生成

### ✅ 配置安全

- ✅ **絕不提交 token**: 確保 `.env.mcp` 在 `.gitignore` 中
- ✅ **使用範本**: 提供 `.env.mcp.example` 供團隊參考
- ✅ **文檔化步驟**: 詳細記錄設定流程（如本文檔）
- ✅ **權限審查**: 定期審查誰有權存取 secrets

### ✅ 資料庫安全

- ✅ **啟用 RLS**: 所有表格必須啟用 Row Level Security
- ✅ **最小權限政策**: RLS 政策應遵循最小權限原則
- ✅ **審計日誌**: 啟用 Supabase 審計日誌功能
- ✅ **備份策略**: 定期備份資料庫並測試還原流程

---

## 進階設定

### 使用自訂 MCP Endpoint

如果您有自架的 Supabase 實例或代理伺服器:

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://your-custom-mcp-endpoint.com/mcp?project_ref=${SUPABASE_PROJECT_REF}",
      "headers": {
        "Authorization": "Bearer ${SUPABASE_ACCESS_TOKEN}",
        "X-Custom-Header": "custom-value"
      }
    }
  }
}
```

### 多專案設定

如果您需要連接多個 Supabase 專案:

**.env.mcp:**
```bash
# 生產環境
SUPABASE_PROD_PROJECT_REF=xxx
SUPABASE_PROD_ACCESS_TOKEN=yyy

# 測試環境
SUPABASE_TEST_PROJECT_REF=zzz
SUPABASE_TEST_ACCESS_TOKEN=www
```

**.vscode/mcp.json:**
```json
{
  "mcpServers": {
    "supabase-prod": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=${SUPABASE_PROD_PROJECT_REF}",
      "headers": {
        "Authorization": "Bearer ${SUPABASE_PROD_ACCESS_TOKEN}"
      }
    },
    "supabase-test": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=${SUPABASE_TEST_PROJECT_REF}",
      "headers": {
        "Authorization": "Bearer ${SUPABASE_TEST_ACCESS_TOKEN}"
      }
    }
  }
}
```

---

## 相關資源

- 📚 [Supabase MCP 官方文檔](https://supabase.com/docs/guides/ai/mcp)
- 📚 [Model Context Protocol 規範](https://modelcontextprotocol.io/)
- 📚 [GitHub Copilot 最佳實踐](https://gh.io/copilot-coding-agent-tips)
- 📚 [Supabase 安全性指南](https://supabase.com/docs/guides/platform/security)
- 📚 [GigHub Supabase Agent 說明](.github/agents/supabase.agent.md)

---

## 總結

完成以上設定後，您應該能夠:

- ✅ 在 VS Code 中使用 GitHub Copilot 直接查詢 Supabase 資料庫
- ✅ 讓 Copilot 自動生成符合專案規範的資料庫遷移
- ✅ 快速驗證 RLS 政策設定
- ✅ 在 GitHub Codespaces 和 Actions 中使用 MCP

如有任何問題，請參考[常見問題排解](#常見問題排解)章節或聯繫團隊成員。

---

**最後更新**: 2025-12-12  
**維護者**: GigHub 開發團隊  
**版本**: 1.0.0
