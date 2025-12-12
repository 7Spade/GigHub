# MCP 配置完全指南

本文檔說明 GigHub 專案中 MCP (Model Context Protocol) 的完整配置架構，包括本地開發、GitHub Codespaces 和 GitHub Actions 三種環境的設定方式。

## 📋 目錄

- [MCP 配置概述](#mcp-配置概述)
- [環境變數架構](#環境變數架構)
- [配置檔案說明](#配置檔案說明)
- [三種環境的設定方式](#三種環境的設定方式)
- [常見誤解與說明](#常見誤解與說明)
- [故障排除](#故障排除)

---

## MCP 配置概述

GigHub 專案使用兩個主要的 MCP 伺服器：

1. **Supabase MCP**: 用於資料庫操作、查詢和遷移
2. **Context7 MCP**: 用於獲取最新的框架文檔和 API 參考

### 配置檔案位置

| 環境 | 配置檔案 | 用途 |
|------|----------|------|
| **本地開發** | `.vscode/mcp.json` + `.env.mcp` | VS Code 本地開發 |
| **GitHub Codespaces** | `.vscode/mcp.json` + Codespaces Secrets | 雲端開發環境 |
| **GitHub Actions** | `.github/copilot/mcp-servers.yml` + Actions Secrets | CI/CD 流程 |

---

## 環境變數架構

### 為什麼需要環境變數？

MCP 配置需要敏感的 API 金鑰和專案識別碼。這些資訊不應硬編碼在配置檔案中，而是透過環境變數動態注入。

### 必要的環境變數

| 變數名稱 | 用途 | 範例值 | 取得方式 |
|---------|------|--------|----------|
| `SUPABASE_PROJECT_REF` | Supabase 專案識別碼 | `zecsbstjqjqoytwgjyct` | Supabase Dashboard URL |
| `SUPABASE_MCP_TOKEN` | Supabase MCP 存取權杖 | `sbat_xxx...` | Supabase Account Tokens |
| `COPILOT_MCP_CONTEXT7` | Context7 API 金鑰 | `ctx7_xxx...` | Context7 Dashboard |

---

## 配置檔案說明

### 1. `.vscode/mcp.json` (本地 + Codespaces)

**用途**: VS Code 環境中的 MCP 伺服器配置

**內容**:
```json
{
  "$schema": "https://json.schemastore.org/mcp.json",
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=${SUPABASE_PROJECT_REF}",
      "headers": {
        "Authorization": "Bearer ${SUPABASE_MCP_TOKEN}"
      },
      "tools": ["*"]
    },
    "context7": {
      "type": "http",
      "url": "https://mcp.context7.com/mcp",
      "headers": {
        "CONTEXT7_API_KEY": "${COPILOT_MCP_CONTEXT7}"
      },
      "tools": ["get-library-docs", "resolve-library-id"]
    }
  }
}
```

**重點**:
- 使用 `${VAR_NAME}` 語法引用環境變數
- 環境變數來源依環境而定：
  - **本地**: `.env.mcp` 檔案
  - **Codespaces**: GitHub Codespaces Secrets

### 2. `.github/copilot/mcp-servers.yml` (GitHub Actions)

**用途**: GitHub Actions 工作流程中的 MCP 伺服器配置

**內容**:
```yaml
mcp-servers:
  context7:
    type: http
    url: 'https://mcp.context7.com/mcp'
    headers: 
      CONTEXT7_API_KEY: '${{ secrets.COPILOT_MCP_CONTEXT7 }}'
    tools: ['get-library-docs', 'resolve-library-id']

  supabase:
    type: http
    url: 'https://mcp.supabase.com/mcp?project_ref=${{ secrets.SUPABASE_PROJECT_REF }}'
    headers:
      Authorization: 'Bearer ${{ secrets.SUPABASE_MCP_TOKEN }}'
    tools: ['*']
```

**重點**:
- 使用 `${{ secrets.VAR_NAME }}` 語法引用 GitHub Secrets
- 只在 GitHub Actions 執行時有效
- **不能用於本地開發或 Codespaces**

### 3. `.env.mcp.example` (範本)

**用途**: 本地開發環境變數範本

**使用方式**:
```bash
# 1. 複製範本檔案
cp .env.mcp.example .env.mcp

# 2. 編輯 .env.mcp，填入實際的金鑰
nano .env.mcp

# 3. 重新啟動 VS Code
```

**內容範例**:
```bash
SUPABASE_PROJECT_REF=zecsbstjqjqoytwgjyct
SUPABASE_MCP_TOKEN=sbat_xxx...
COPILOT_MCP_CONTEXT7=ctx7_xxx...
```

---

## 三種環境的設定方式

### 環境 1: 本地開發 (Local Development)

#### 步驟 1: 創建 `.env.mcp` 檔案

```bash
cp .env.mcp.example .env.mcp
```

#### 步驟 2: 填入實際金鑰

編輯 `.env.mcp`:
```bash
SUPABASE_PROJECT_REF=zecsbstjqjqoytwgjyct
SUPABASE_MCP_TOKEN=sbat_xxxxxxxxxxxxxxxxxxxxxxxxxx
COPILOT_MCP_CONTEXT7=ctx7_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### 步驟 3: 重新啟動 VS Code

完全關閉 VS Code 並重新開啟（不是重新載入窗口）。

#### 步驟 4: 驗證配置

在 Copilot Chat 中輸入:
```
@supabase 列出所有資料表
```

---

### 環境 2: GitHub Codespaces

#### 步驟 1: 設定 Codespaces Secrets

✅ **已完成**: 您在 GitHub Settings 中已設定以下 secrets:
- `SUPABASE_PROJECT_REF`
- `SUPABASE_MCP_TOKEN`
- `COPILOT_MCP_CONTEXT7`

#### 步驟 2: 啟動 Codespace

當您啟動 Codespace 時，這些 secrets 會自動作為環境變數注入。

#### 步驟 3: 驗證環境變數（可選）

在 Codespace 終端機中執行:
```bash
echo $SUPABASE_PROJECT_REF
# 應顯示: zecsbstjqjqoytwgjyct

# 注意: 不要 echo token，以免洩漏
```

#### 步驟 4: 測試 MCP 連接

在 Copilot Chat 中輸入:
```
@supabase 顯示 profiles 表結構
```

---

### 環境 3: GitHub Actions

#### 步驟 1: 設定 Actions Secrets

✅ **已完成**: 您在 GitHub Settings > Secrets > Actions 中已設定:
- `SUPABASE_PROJECT_REF`
- `SUPABASE_MCP_TOKEN`
- `COPILOT_MCP_CONTEXT7`

#### 步驟 2: 在 Workflow 中使用

在 `.github/workflows/*.yml` 中引用 secrets:

```yaml
jobs:
  database-task:
    runs-on: ubuntu-latest
    env:
      SUPABASE_PROJECT_REF: ${{ secrets.SUPABASE_PROJECT_REF }}
      SUPABASE_MCP_TOKEN: ${{ secrets.SUPABASE_MCP_TOKEN }}
    steps:
      - uses: actions/checkout@v4
      - name: Run migration
        run: |
          # 您的指令
```

#### 步驟 3: MCP 自動使用

`.github/copilot/mcp-servers.yml` 會自動使用這些 secrets，無需額外配置。

---

## 常見誤解與說明

### ❓ 誤解 1: "我已經設定 GitHub Secrets，為什麼本地還是不能用？"

**說明**:
GitHub Actions Secrets 只在以下環境中可用：
- ✅ GitHub Actions workflows 執行時
- ✅ GitHub Codespaces（如果設為 Codespaces secrets）
- ❌ **本地開發環境無法存取**

**解決方案**:
本地開發必須創建 `.env.mcp` 檔案。

---

### ❓ 誤解 2: "`.vscode/mcp.json` 和 `.github/copilot/mcp-servers.yml` 有什麼區別？"

**說明**:

| 檔案 | 適用環境 | 變數語法 |
|------|----------|----------|
| `.vscode/mcp.json` | VS Code (本地 + Codespaces) | `${VAR_NAME}` |
| `.github/copilot/mcp-servers.yml` | GitHub Actions | `${{ secrets.VAR_NAME }}` |

它們配置的是**相同的 MCP 伺服器**，但用於**不同的環境**。

---

### ❓ 誤解 3: "我可以用 `SUPABASE_ACCESS_TOKEN` 代替 `SUPABASE_MCP_TOKEN` 嗎？"

**說明**:
**不可以**。變數名稱必須完全一致：

| 正確 ✅ | 錯誤 ❌ |
|--------|--------|
| `SUPABASE_MCP_TOKEN` | `SUPABASE_ACCESS_TOKEN` |
| `COPILOT_MCP_CONTEXT7` | `CONTEXT7_API_KEY` |

`.vscode/mcp.json` 中引用的變數名稱必須與 `.env.mcp` 或 Secrets 中的名稱完全匹配。

---

### ❓ 誤解 4: "為什麼我設定了環境變數，但 MCP 還是連不上？"

**可能原因**:

1. **VS Code 未重新載入環境變數**
   - **解決**: 完全關閉 VS Code 並重新開啟

2. **`.env.mcp` 檔案位置錯誤**
   - **正確位置**: 專案根目錄（與 `package.json` 同層）
   - **錯誤位置**: `.vscode/` 資料夾內

3. **環境變數值格式錯誤**
   - **正確**: `SUPABASE_PROJECT_REF=zecsbstjqjqoytwgjyct`
   - **錯誤**: `SUPABASE_PROJECT_REF="zecsbstjqjqoytwgjyct"`（不要加引號）

4. **Token 已過期或無效**
   - **解決**: 重新生成 token 並更新 `.env.mcp`

---

## 故障排除

### 🔍 檢查清單

執行以下檢查以診斷 MCP 連接問題：

#### ✅ 檢查 1: 檔案存在性

```bash
# 在專案根目錄執行
ls -la .env.mcp           # 應存在（本地開發）
ls -la .vscode/mcp.json   # 應存在
ls -la .github/copilot/mcp-servers.yml  # 應存在
```

#### ✅ 檢查 2: 檔案內容

```bash
# 檢查 .env.mcp（注意：不要在公開場合執行）
cat .env.mcp

# 應包含以下變數（已填入實際值）：
# SUPABASE_PROJECT_REF=xxx
# SUPABASE_MCP_TOKEN=xxx
# COPILOT_MCP_CONTEXT7=xxx
```

#### ✅ 檢查 3: 環境變數載入

```bash
# 在 VS Code 整合終端機中執行
echo $SUPABASE_PROJECT_REF

# 應輸出: zecsbstjqjqoytwgjyct
# 如果輸出為空，表示環境變數未載入
```

#### ✅ 檢查 4: MCP 配置語法

```bash
# 驗證 JSON 語法
python3 -c "import json; json.load(open('.vscode/mcp.json')); print('✓ JSON valid')"

# 驗證 YAML 語法
python3 -c "import yaml; yaml.safe_load(open('.github/copilot/mcp-servers.yml')); print('✓ YAML valid')"
```

#### ✅ 檢查 5: 手動測試 MCP 端點

```bash
# 測試 Supabase MCP（替換為您的實際值）
curl -X POST "https://mcp.supabase.com/mcp?project_ref=zecsbstjqjqoytwgjyct" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}'

# 預期回應: JSON 格式的工具列表
```

---

### 🛠️ 常見錯誤與解決方案

#### 錯誤 1: "Environment variable not found"

**錯誤訊息**:
```
Error: Environment variable SUPABASE_PROJECT_REF not found
```

**原因**: `.env.mcp` 檔案不存在或 VS Code 未載入

**解決方案**:
```bash
# 1. 確認檔案存在
ls -la .env.mcp

# 2. 如果不存在，從範本創建
cp .env.mcp.example .env.mcp

# 3. 編輯並填入實際值
nano .env.mcp

# 4. 重新啟動 VS Code
```

---

#### 錯誤 2: "401 Unauthorized"

**錯誤訊息**:
```
Error: 401 Unauthorized - Invalid token
```

**原因**: Token 無效或已過期

**解決方案**:
1. 前往 [Supabase Account Tokens](https://supabase.com/dashboard/account/tokens)
2. 撤銷舊 token（如果存在）
3. 生成新 token
4. 更新 `.env.mcp` 中的 `SUPABASE_MCP_TOKEN`
5. 重新啟動 VS Code

---

#### 錯誤 3: "Connection refused"

**錯誤訊息**:
```
Error: Connection refused to mcp.supabase.com
```

**原因**: 網路問題或防火牆阻擋

**解決方案**:
1. 檢查網路連接
2. 確認防火牆允許連接到 `mcp.supabase.com`
3. 嘗試使用 VPN 或代理

---

#### 錯誤 4: "Project not found"

**錯誤訊息**:
```
Error: Project zecsbstjqjqoytwgjyct not found
```

**原因**: Project Reference ID 錯誤或帳號無權存取

**解決方案**:
1. 確認 `SUPABASE_PROJECT_REF` 值正確
2. 登入 Supabase Dashboard 確認專案 ID
3. 確認您的帳號對該專案有存取權限

---

## 安全性最佳實踐

### ✅ 本地開發

- ✅ 使用 `.env.mcp` 儲存本地金鑰
- ✅ 確保 `.env.mcp` 在 `.gitignore` 中
- ✅ 定期輪替金鑰（建議每 90 天）
- ✅ 不要在終端機或日誌中列印金鑰

### ✅ GitHub Secrets

- ✅ 使用 GitHub Secrets 儲存 CI/CD 金鑰
- ✅ 限制 secrets 存取權限
- ✅ 監控 secrets 使用情況
- ✅ 發生洩漏時立即輪替

### ✅ 團隊協作

- ✅ 提供 `.env.mcp.example` 範本
- ✅ 文檔化設定流程（如本文檔）
- ✅ 使用不同的金鑰用於開發/測試/生產
- ✅ 定期審查誰有權存取 secrets

---

## 總結

### 關鍵要點

1. **環境隔離**: 本地開發使用 `.env.mcp`，CI/CD 使用 GitHub Secrets
2. **變數名稱一致性**: 確保所有配置檔案中的變數名稱完全一致
3. **重新載入**: 修改環境變數後必須重新啟動 VS Code
4. **安全性**: 絕不提交包含真實金鑰的檔案至版本控制

### 快速參考

| 需求 | 檔案 | 操作 |
|------|------|------|
| 本地開發設定 | `.env.mcp` | `cp .env.mcp.example .env.mcp` + 填入金鑰 |
| Codespaces 設定 | GitHub Codespaces Secrets | 在 Settings 中新增 secrets |
| Actions 設定 | GitHub Actions Secrets | 在 Settings 中新增 secrets |
| 驗證配置 | Copilot Chat | `@supabase 列出所有資料表` |

---

## 相關文檔

- 📚 [Supabase MCP 設定指南](./supabase-mcp-setup.md) - 詳細的 Supabase MCP 設定步驟
- 📚 [GitHub Copilot 配置](.github/copilot/README.md) - Copilot 整體配置說明
- 📚 [Supabase Agent](.github/agents/supabase.agent.md) - Supabase 專家 agent 說明
- 📚 [環境變數範本](.env.mcp.example) - 本地開發環境變數範本

---

**最後更新**: 2025-12-12  
**維護者**: GigHub 開發團隊  
**版本**: 1.0.0
