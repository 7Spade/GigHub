# GitHub Copilot Agent MCP 配置指南

本文檔專門說明如何在 **GitHub Copilot Web Agent** 環境中配置 Supabase MCP，以實現直接寫入遠端資料庫的功能。

## 🎯 重要說明

您目前使用的是 **GitHub Copilot Agent (Web)**，而不是本地 VS Code。這意味著：

- ✅ **有效配置**: `.github/copilot/mcp-servers.yml` + GitHub Secrets
- ❌ **無效配置**: `.vscode/mcp.json` + `.env.mcp` (僅用於本地 VS Code)

---

## 📋 目錄

- [GitHub Agent 環境說明](#github-agent-環境說明)
- [當前配置檢查](#當前配置檢查)
- [為什麼無法寫入資料庫](#為什麼無法寫入資料庫)
- [正確配置 Supabase MCP](#正確配置-supabase-mcp)
- [驗證與測試](#驗證與測試)
- [常見問題](#常見問題)

---

## GitHub Agent 環境說明

### 什麼是 GitHub Copilot Agent？

GitHub Copilot Agent 是運行在 GitHub 基礎設施上的 AI 助手，可以：

- 🤖 在 Pull Request 中直接執行任務
- 🔧 讀取和修改 repository 中的程式碼
- 🗄️ 透過 MCP 連接到外部服務（如 Supabase）
- 🔐 使用 GitHub Repository Secrets 進行認證

### GitHub Agent vs VS Code

| 特性 | GitHub Agent (Web) | VS Code (本地) |
|------|-------------------|---------------|
| **執行環境** | GitHub 雲端 | 本機電腦 |
| **MCP 配置檔案** | `.github/copilot/mcp-servers.yml` | `.vscode/mcp.json` |
| **認證方式** | GitHub Secrets | 環境變數 (`.env.mcp`) |
| **變數語法** | `${{ secrets.VAR }}` | `${VAR}` |
| **適用場景** | PR automation, CI/CD | 開發除錯 |

---

## 當前配置檢查

### ✅ 您已完成的設定

根據您的描述，以下配置已就緒：

#### 1. GitHub Repository Secrets

在 `https://github.com/7Spade/GigHub/settings/secrets/actions` 中已設定：

- ✅ `COPILOT_MCP_CONTEXT7` - Context7 API 金鑰
- ✅ `SUPABASE_MCP_TOKEN` - Supabase MCP 存取權杖
- ✅ `SUPABASE_PROJECT_REF` - Supabase 專案 ID (zecsbstjqjqoytwgjyct)

#### 2. MCP 伺服器配置檔案

`.github/copilot/mcp-servers.yml` 已配置：

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

---

## 為什麼無法寫入資料庫

### 可能原因 1: MCP 工具權限限制

Supabase MCP 預設可能不允許**寫入操作**，只提供**讀取和查詢**功能。

**檢查方式**：
```yaml
tools: ['*']  # 允許所有工具
# vs
tools: ['read', 'query', 'describe']  # 只允許讀取
```

### 可能原因 2: Supabase Token 權限不足

`SUPABASE_MCP_TOKEN` 可能是 **Personal Access Token**，而非具有寫入權限的 **Service Role Key**。

**區別**：

| Token 類型 | 權限範圍 | 可寫入資料庫 |
|-----------|---------|------------|
| **Personal Access Token** | 受 RLS 限制 | ❌ 可能無法寫入 |
| **Service Role Key** | 跳過 RLS | ✅ 可完全寫入 |

### 可能原因 3: RLS 政策阻擋

即使 token 有權限，資料庫的 **Row Level Security (RLS)** 政策可能阻止寫入操作。

---

## 正確配置 Supabase MCP

### 方案 1: 使用 Service Role Key（推薦用於 GitHub Agent）

#### 步驟 1: 取得 Service Role Key

1. 登入 [Supabase Dashboard](https://supabase.com/dashboard/project/zecsbstjqjqoytwgjyct)
2. 前往 **Settings** > **API**
3. 找到 **Service Role Key** (標記為 `service_role`)
4. 點擊眼睛圖示顯示完整金鑰
5. **複製金鑰**（格式類似 `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`）

⚠️ **警告**: Service Role Key 擁有完整資料庫存取權限，**跳過所有 RLS 政策**。僅用於可信任的環境（如 GitHub Actions）。

#### 步驟 2: 更新 GitHub Secret

1. 前往 `https://github.com/7Spade/GigHub/settings/secrets/actions`
2. 找到 `SUPABASE_MCP_TOKEN`
3. 點擊 **Update**
4. 貼上 Service Role Key
5. 點擊 **Update secret**

#### 步驟 3: 驗證配置

`.github/copilot/mcp-servers.yml` 應維持不變：

```yaml
supabase:
  type: http
  url: 'https://mcp.supabase.com/mcp?project_ref=${{ secrets.SUPABASE_PROJECT_REF }}'
  headers:
    Authorization: 'Bearer ${{ secrets.SUPABASE_MCP_TOKEN }}'
  tools: ['*']
```

### 方案 2: 調整 RLS 政策（保留 Personal Access Token）

如果不想使用 Service Role Key，可以調整資料庫的 RLS 政策以允許寫入。

#### 範例：允許 authenticated 角色寫入

```sql
-- 假設表名為 tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 允許 authenticated 使用者插入資料
CREATE POLICY "insert_authenticated" ON tasks
  FOR INSERT TO authenticated
  WITH CHECK (true);  -- 或加入更嚴格的條件

-- 允許 authenticated 使用者更新資料
CREATE POLICY "update_authenticated" ON tasks
  FOR UPDATE TO authenticated
  USING (true);  -- 或加入更嚴格的條件

-- 允許 authenticated 使用者刪除資料
CREATE POLICY "delete_authenticated" ON tasks
  FOR DELETE TO authenticated
  USING (true);  -- 或加入更嚴格的條件
```

⚠️ **注意**: 使用 `WITH CHECK (true)` 會允許任何 authenticated 使用者寫入，這可能不安全。建議加入適當的條件限制。

---

## 驗證與測試

### 測試 1: 檢查 GitHub Secrets

在 GitHub Agent 對話中，執行以下指令（我會幫您執行）：

```bash
# 檢查環境變數是否存在（不顯示實際值）
[ -n "$SUPABASE_PROJECT_REF" ] && echo "✓ SUPABASE_PROJECT_REF is set" || echo "✗ Not set"
[ -n "$SUPABASE_MCP_TOKEN" ] && echo "✓ SUPABASE_MCP_TOKEN is set" || echo "✗ Not set"
```

### 測試 2: 測試 Supabase MCP 連接

請告訴我執行以下操作：

```
使用 Supabase MCP 列出所有資料表
```

預期回應應包含資料表清單（如 `profiles`, `organizations` 等）。

### 測試 3: 測試寫入操作

嘗試執行簡單的寫入操作：

```
使用 Supabase MCP 在 tasks 表中插入一筆測試資料
```

如果成功，表示寫入權限已正確配置。

---

## 常見問題

### ❓ Q1: GitHub Actions Secrets 和 Codespaces Secrets 有什麼區別？

**A1**: 

| Secret 類型 | 適用環境 | 設定位置 |
|------------|---------|---------|
| **Actions Secrets** | GitHub Actions workflows, GitHub Agent | Settings > Secrets > Actions |
| **Codespaces Secrets** | GitHub Codespaces | Settings > Secrets > Codespaces |
| **Dependabot Secrets** | Dependabot | Settings > Secrets > Dependabot |

您當前使用的是 **GitHub Agent**，因此使用 **Actions Secrets**。

---

### ❓ Q2: 為什麼 `.vscode/mcp.json` 不起作用？

**A2**: 

`.vscode/mcp.json` 只在 **本地 VS Code** 環境中有效。GitHub Agent 運行在 GitHub 雲端，不會讀取本地配置檔案。

**有效配置**：
- GitHub Agent → `.github/copilot/mcp-servers.yml`
- VS Code → `.vscode/mcp.json`

---

### ❓ Q3: Service Role Key 和 Anon Key 有什麼區別？

**A3**: 

| Key 類型 | 權限 | RLS 限制 | 適用場景 |
|---------|------|---------|---------|
| **Anon Key** | 受限 | ✅ 遵守 RLS | 前端應用 |
| **Service Role Key** | 完整 | ❌ 跳過 RLS | 後端/管理腳本 |
| **Personal Access Token** | 依使用者權限 | ✅ 遵守 RLS | MCP 連接（受限） |

**建議**：GitHub Agent 使用 **Service Role Key** 以獲得完整寫入權限。

---

### ❓ Q4: 如何確認 Supabase MCP 支援哪些操作？

**A4**: 

在 GitHub Agent 中執行：

```
列出 Supabase MCP 支援的所有工具和操作
```

這會顯示 MCP 伺服器提供的所有可用工具，包括是否支援 `insert`, `update`, `delete` 等寫入操作。

---

### ❓ Q5: 我可以同時使用 GitHub Agent 和本地 VS Code 嗎？

**A5**: 

可以！兩個環境使用不同的配置：

| 環境 | 配置檔案 | 認證方式 |
|------|----------|---------|
| **GitHub Agent** | `.github/copilot/mcp-servers.yml` | GitHub Secrets |
| **本地 VS Code** | `.vscode/mcp.json` | `.env.mcp` |

兩者可以共存，互不干擾。

---

## 下一步行動

### 立即行動清單

1. **驗證 Service Role Key**
   - [ ] 登入 Supabase Dashboard
   - [ ] 取得 Service Role Key
   - [ ] 更新 GitHub Secret `SUPABASE_MCP_TOKEN`

2. **測試 MCP 連接**
   - [ ] 在 GitHub Agent 中測試讀取操作
   - [ ] 測試寫入操作（插入測試資料）
   - [ ] 確認資料已成功寫入資料庫

3. **文檔更新**
   - [ ] 記錄成功的配置步驟
   - [ ] 更新團隊知識庫
   - [ ] 分享給其他開發者

---

## 總結

### 關鍵要點

1. **GitHub Agent 使用 `.github/copilot/mcp-servers.yml`**，不是 `.vscode/mcp.json`
2. **GitHub Secrets 已正確設定**，包含所有必要的變數
3. **可能需要 Service Role Key** 才能執行寫入操作
4. **RLS 政策** 可能會阻止寫入，需要適當配置

### 最可能的問題

根據您的描述，最可能的問題是：

**`SUPABASE_MCP_TOKEN` 使用的是 Personal Access Token，而非 Service Role Key**

**解決方案**: 將 GitHub Secret 更新為 Service Role Key。

---

## 相關文檔

- 📚 [Supabase MCP 官方文檔](https://supabase.com/docs/guides/ai/mcp)
- 📚 [GitHub Copilot Agent 文檔](https://docs.github.com/en/copilot)
- 📚 [Supabase Service Role Key 說明](https://supabase.com/docs/guides/api/api-keys)
- 📚 [GigHub MCP 配置指南](./mcp-configuration-guide.md)

---

**最後更新**: 2025-12-12  
**維護者**: GigHub 開發團隊  
**版本**: 1.0.0

---

## 附錄：快速診斷腳本

如果我在 GitHub Agent 環境中運行，可以執行以下診斷：

```bash
#!/bin/bash
echo "=== GitHub Agent MCP 診斷 ==="
echo ""

# 檢查環境變數
echo "1. 檢查環境變數："
[ -n "$SUPABASE_PROJECT_REF" ] && echo "  ✓ SUPABASE_PROJECT_REF: ${SUPABASE_PROJECT_REF:0:10}..." || echo "  ✗ SUPABASE_PROJECT_REF not set"
[ -n "$SUPABASE_MCP_TOKEN" ] && echo "  ✓ SUPABASE_MCP_TOKEN: ${SUPABASE_MCP_TOKEN:0:10}..." || echo "  ✗ SUPABASE_MCP_TOKEN not set"
[ -n "$COPILOT_MCP_CONTEXT7" ] && echo "  ✓ COPILOT_MCP_CONTEXT7: set" || echo "  ✗ COPILOT_MCP_CONTEXT7 not set"

# 檢查配置檔案
echo ""
echo "2. 檢查配置檔案："
[ -f ".github/copilot/mcp-servers.yml" ] && echo "  ✓ mcp-servers.yml exists" || echo "  ✗ mcp-servers.yml missing"
[ -f ".github/agents/supabase.agent.md" ] && echo "  ✓ supabase.agent.md exists" || echo "  ✗ supabase.agent.md missing"

# 測試網路連接
echo ""
echo "3. 測試網路連接："
curl -s -o /dev/null -w "  HTTP %{http_code}: mcp.supabase.com\n" "https://mcp.supabase.com/"
curl -s -o /dev/null -w "  HTTP %{http_code}: mcp.context7.com\n" "https://mcp.context7.com/"

echo ""
echo "=== 診斷完成 ==="
```

請告訴我是否需要執行此診斷腳本。
