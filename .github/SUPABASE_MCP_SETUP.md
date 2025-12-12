# Supabase MCP 設定指南

> **目的**: 讓 GitHub Copilot Agent 能夠直接操作遠端 Supabase 資料庫

---

## 🎯 問題說明

您的 GitHub Copilot 已正確配置 Supabase MCP 工具（`.github/copilot/mcp-servers.yml`），但無法存取遠端資料庫。

**原因**: MCP 配置需要兩個 GitHub Repository Secrets 來連接到您的遠端 Supabase 專案：
- `SUPABASE_PROJECT_REF`: Supabase 專案識別碼
- `SUPABASE_MCP_TOKEN`: Supabase 存取權杖

---

## ✅ 當前狀態

### 已配置 ✓
- [x] Supabase MCP 伺服器配置檔（`.github/copilot/mcp-servers.yml`）
- [x] MCP 工具已安裝並正常運作（20 個可用工具）
- [x] 文檔查詢功能正常

### 可用的 Supabase MCP 工具

| 工具名稱 | 功能說明 | 狀態 |
|---------|---------|------|
| `search_docs` | 搜尋 Supabase 官方文檔 | ✅ 已驗證 |
| `list_tables` | 列出資料庫表格 | ⏳ 需要連線 |
| `execute_sql` | 執行 SQL 查詢 | ⏳ 需要連線 |
| `apply_migration` | 套用資料庫遷移 | ⏳ 需要連線 |
| `list_migrations` | 列出遷移歷史 | ⏳ 需要連線 |
| `get_project_url` | 取得專案 URL | ⏳ 需要連線 |
| `get_publishable_keys` | 取得 API 金鑰 | ⏳ 需要連線 |
| `create_branch` | 建立開發分支 | ⏳ 需要連線 |
| `deploy_edge_function` | 部署 Edge Function | ⏳ 需要連線 |
| `get_logs` | 取得服務日誌 | ⏳ 需要連線 |
| 以及其他 10 個工具... | - | ⏳ 需要連線 |

### 缺少 ⚠️
- [ ] GitHub Repository Secret: `SUPABASE_PROJECT_REF`
- [ ] GitHub Repository Secret: `SUPABASE_MCP_TOKEN`

---

## 📝 設定步驟

### 步驟 1: 取得 Supabase 專案資訊

#### 1.1 登入 Supabase Dashboard
訪問 [Supabase Dashboard](https://supabase.com/dashboard)

#### 1.2 取得 Project Reference (PROJECT_REF)
1. 選擇您的專案
2. 前往 **Settings** → **General**
3. 找到 **Reference ID** 或從 URL 複製

**範例**:
```
Project URL: https://zecsbstjqjqoytwgjyct.supabase.co
              ↑
              這就是 PROJECT_REF: zecsbstjqjqoytwgjyct
```

#### 1.3 生成 MCP Access Token (MCP_TOKEN)

Supabase MCP 需要一個具備適當權限的存取權杖。您有兩個選擇：

**選項 A: 使用 Service Role Key (推薦用於開發/測試)**
1. 前往 **Settings** → **API**
2. 找到 **service_role key** (secret)
3. ⚠️ **注意**: Service Role Key 會繞過 RLS，請謹慎使用

**選項 B: 生成專用 MCP Token (推薦用於生產環境)**
1. 前往 **Settings** → **API** → **Tokens**
2. 建立新的存取權杖
3. 設定適當的權限範圍

---

### 步驟 2: 在 GitHub 設定 Repository Secrets

#### 2.1 前往 Repository Settings
訪問: `https://github.com/7Spade/GigHub/settings/secrets/actions`

或手動導航:
1. 前往您的 GitHub Repository
2. 點擊 **Settings**
3. 左側選單選擇 **Secrets and variables** → **Actions**

#### 2.2 新增 SUPABASE_PROJECT_REF
1. 點擊 **New repository secret**
2. Name: `SUPABASE_PROJECT_REF`
3. Secret: 輸入您的專案 Reference ID (例如: `zecsbstjqjqoytwgjyct`)
4. 點擊 **Add secret**

#### 2.3 新增 SUPABASE_MCP_TOKEN
1. 點擊 **New repository secret**
2. Name: `SUPABASE_MCP_TOKEN`
3. Secret: 輸入您的 Supabase Access Token
4. 點擊 **Add secret**

---

### 步驟 3: 驗證配置

#### 3.1 檢查 Secrets 是否設定成功
在 Repository Secrets 頁面應該看到：
```
✓ SUPABASE_PROJECT_REF
✓ SUPABASE_MCP_TOKEN
```

#### 3.2 重新啟動 Copilot Session
1. 開啟新的 GitHub Copilot Agent 對話
2. 執行測試命令

#### 3.3 測試資料庫連線

在 Copilot 中執行以下測試：

**測試 1: 列出資料表**
```
請使用 Supabase MCP 列出 public schema 中的所有資料表
```

**測試 2: 查詢資料庫版本**
```
請使用 Supabase MCP 執行 SQL: SELECT version()
```

**測試 3: 取得專案資訊**
```
請使用 Supabase MCP 取得專案 URL 和可用的 API 金鑰
```

---

## 🔒 安全性最佳實踐

### 1. 權限最小化原則

**開發環境**:
```yaml
# 使用受限的開發用 Token
permissions:
  - read: tables, schemas
  - write: migrations, edge_functions
  - admin: false
```

**生產環境**:
```yaml
# 使用 Service Role Key，但限制操作
permissions:
  - 僅供 Copilot Agent 在 GitHub Actions 中使用
  - 啟用審核日誌
  - 定期輪替 Token
```

### 2. Token 管理

✅ **推薦作法**:
- 為不同環境使用不同的 Token
- 定期輪替 Token (建議每 90 天)
- 使用 GitHub Environments 區隔開發/生產環境
- 啟用 Supabase 審核日誌追蹤 API 使用

❌ **避免**:
- 將 Token 硬編碼在程式碼中
- 在公開場合分享 Token
- 使用同一 Token 在多個環境
- 使用過期或未使用的 Token

### 3. Row Level Security (RLS)

即使使用 Service Role Key，也應：
1. 為所有表格啟用 RLS
2. 建立明確的安全政策
3. 定期審查權限設定
4. 使用 `get_advisors` 工具檢查安全漏洞

---

## 🔧 進階配置

### 使用 GitHub Environments

針對多環境部署，建議使用 GitHub Environments:

#### 1. 建立 Environments
在 Repository Settings → Environments 建立：
- `development`
- `staging`
- `production`

#### 2. 為每個 Environment 設定 Secrets
每個環境使用獨立的 Supabase 專案：

**Development**:
```
SUPABASE_PROJECT_REF: dev-project-ref
SUPABASE_MCP_TOKEN: dev-token
```

**Production**:
```
SUPABASE_PROJECT_REF: prod-project-ref
SUPABASE_MCP_TOKEN: prod-token
```

#### 3. 在 Copilot 對話中指定環境
```
請使用 production 環境的 Supabase MCP 列出資料表
```

---

## 🐛 疑難排解

### 問題 1: Copilot 無法連接到資料庫

**檢查清單**:
- [ ] Secrets 是否正確設定？
- [ ] PROJECT_REF 格式是否正確？（不應包含完整 URL）
- [ ] TOKEN 是否有效且未過期？
- [ ] Supabase 專案是否處於活動狀態？

**診斷命令**:
```
請使用 Supabase MCP 的 get_project_url 工具取得專案狀態
```

### 問題 2: 權限被拒絕

**可能原因**:
- Token 權限不足
- RLS 政策阻止存取
- IP 限制（如果啟用）

**解決方案**:
```sql
-- 檢查 RLS 狀態
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- 暫時允許 service role 存取（僅測試用）
ALTER TABLE your_table DISABLE ROW LEVEL SECURITY;
```

### 問題 3: MCP 工具回應緩慢

**優化建議**:
- 使用資料庫索引
- 限制查詢結果數量
- 使用 `list_tables` 而非 `execute_sql` 取得結構資訊
- 考慮使用 Supabase Edge Functions 處理複雜查詢

---

## 📊 監控與維護

### 1. 定期檢查

**每週**:
- [ ] 檢查 Supabase 審核日誌
- [ ] 驗證 MCP 工具功能
- [ ] 檢查 Token 使用狀況

**每月**:
- [ ] 審查 Secrets 設定
- [ ] 更新安全政策
- [ ] 輪替過期 Token

### 2. 使用 Supabase MCP 的 get_advisors 工具

定期執行安全性與效能檢查：

```
請使用 Supabase MCP 的 get_advisors 工具檢查：
1. 安全性問題
2. 效能瓶頸
3. 未使用的索引
```

---

## 📚 參考資源

### 官方文檔
- [Supabase MCP Documentation](https://supabase.com/docs/guides/auth/oauth-server/mcp-authentication)
- [GitHub Repository Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Supabase API Keys](https://supabase.com/docs/guides/api/api-keys)

### GigHub 專案文檔
- [MCP 工具使用指南](./.github/MCP_TOOLS_USAGE_GUIDE.md)
- [Copilot 設定說明](./.github/COPILOT_SETUP.md)
- [環境變數範例](../.env.example)

---

## ✨ 完成後的效果

配置完成後，您可以在 GitHub Copilot Agent 中執行：

### 資料庫管理
```
# 列出所有資料表
請列出 Supabase 資料庫中的所有表格

# 執行查詢
請查詢 tasks 表中狀態為 'pending' 的記錄

# 套用遷移
請套用最新的資料庫遷移
```

### 開發分支
```
# 建立開發分支
請建立名為 'feature-payment' 的 Supabase 開發分支

# 合併分支
請將 'feature-payment' 分支合併回 main
```

### Edge Functions
```
# 部署函數
請部署 'send-notification' Edge Function

# 取得日誌
請取得 'send-notification' 函數的最新日誌
```

---

## 🎉 總結

完成以上步驟後，GitHub Copilot Agent 將能夠：

✅ 直接查詢遠端 Supabase 資料庫  
✅ 執行資料庫遷移與管理  
✅ 部署與管理 Edge Functions  
✅ 建立與管理開發分支  
✅ 取得專案日誌與診斷資訊  
✅ 執行安全性與效能檢查  

**下一步**: 設定完成後，建議執行 `.github/copilot/workflows/rls-check.workflow.md` 中的 RLS 檢查工作流程，確保資料庫安全性。

---

**最後更新**: 2025-12-12  
**維護者**: GitHub Copilot  
**問題回報**: 請在 GitHub Issues 中提出
