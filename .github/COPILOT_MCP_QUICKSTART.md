# GitHub Copilot MCP 快速入門指南

> 5 分鐘內完成 GitHub Copilot MCP 設定

## 📖 目錄

- [我是 Repository 管理員](#repository-管理員)
- [我是開發者](#開發者)
- [常見問題](#常見問題)
- [完整文檔](#完整文檔)

---

## Repository 管理員

### 1️⃣ 建立 GitHub Secrets

前往: https://github.com/7Spade/GigHub/settings/secrets/actions

建立以下 3 個 secrets:

| Secret Name | 說明 | 如何取得 |
|------------|------|---------|
| `COPILOT_MCP_CONTEXT7` | Context7 API Key | [Context7 官網](https://context7.com) → API Settings → Create Key |
| `SUPABASE_PROJECT_REF` | Supabase 專案 ID | [Supabase Dashboard](https://supabase.com/dashboard) → Project Settings → General → Reference ID |
| `SUPABASE_MCP_TOKEN` | Supabase Service Role Key | [Supabase Dashboard](https://supabase.com/dashboard) → Settings → API → service_role key |

### 2️⃣ 驗證配置

```bash
# 檢查 mcp-servers.yml
python3 -c "import yaml; yaml.safe_load(open('.github/copilot/mcp-servers.yml')); print('✅ YAML valid')"
```

### 3️⃣ 通知團隊

分享給開發者:
- 📄 [copilot-setup-steps.yml](.github/copilot-setup-steps.yml) - 完整設定指南
- 📖 [MCP_TOOLS_USAGE_GUIDE.md](MCP_TOOLS_USAGE_GUIDE.md) - 工具使用指南

**提供給開發者的資訊**:
- Context7 API Key (與 COPILOT_MCP_CONTEXT7 相同的值)
- Supabase Project Ref (與 SUPABASE_PROJECT_REF 相同的值)
- Supabase MCP Token (與 SUPABASE_MCP_TOKEN 相同的值)

---

## 開發者

### 前置需求

- ✅ GitHub Copilot 訂閱 ([檢查訂閱狀態](https://github.com/settings/copilot))
- ✅ 從 Repository 管理員取得 3 個 API Keys

### 1️⃣ 啟用 Copilot Agent

1. 前往: https://github.com/settings/copilot
2. 啟用 "Enable Copilot Agent for code changes"
3. 儲存設定

### 2️⃣ 新增 MCP 伺服器

在 [Copilot Settings](https://github.com/settings/copilot) 的 "Model Context Protocol (MCP) Servers" 區塊:

#### 新增 Context7

```yaml
Server Name: context7
Type: HTTP
URL: https://mcp.context7.com/mcp
Headers:
  CONTEXT7_API_KEY: <從管理員取得的 API Key>
Tools:
  - get-library-docs
  - resolve-library-id
```

#### 新增 Supabase

```yaml
Server Name: supabase
Type: HTTP
URL: https://mcp.supabase.com/mcp?project_ref=<從管理員取得的 Project Ref>
Headers:
  Authorization: Bearer <從管理員取得的 MCP Token>
Tools:
  - * (所有工具)
```

### 3️⃣ 驗證設定

在 GitHub Copilot Chat 中測試:

**測試 Context7**:
```
使用 context7 查詢 Angular 20 中 signal() 函數的用法
```

**測試 Supabase**:
```
列出 GigHub 專案的 Supabase 資料表
```

**測試 Sequential Thinking**:
```
使用 sequential-thinking 分析如何設計一個通知系統
```

✅ 如果看到相關工具被呼叫並返回結果，表示設定成功！

---

## 常見問題

### ❓ 為什麼要設定這些 MCP 伺服器？

| MCP 伺服器 | 用途 | 優勢 |
|-----------|------|------|
| Context7 | 查詢最新框架文檔 | 確保 Angular/ng-alain 語法是最新版本 |
| Supabase | 資料庫操作與查詢 | 直接存取專案資料庫 schema |
| Sequential Thinking | 結構化推理分析 | 複雜問題的系統性解決 |

### ❓ 我的 API Keys 安全嗎？

✅ **是的**，只要遵循這些原則:
- 絕不在程式碼中硬編碼
- 不與他人分享個人 API Keys
- 定期輪替 (建議每 90 天)
- 使用密碼管理器儲存

### ❓ Copilot 沒有使用 MCP 工具怎麼辦？

💡 **解決方法**:
1. 明確要求: "**使用 context7** 查詢..."
2. 使用 Chat Shortcuts: `/gighub-component`
3. 在對話開頭聲明: "請遵循 MANDATORY 工具使用政策"

### ❓ 哪裡可以找到完整文檔？

📚 **完整文檔**:
- [copilot-setup-steps.yml](.github/copilot-setup-steps.yml) - 詳細設定步驟
- [MCP_TOOLS_USAGE_GUIDE.md](MCP_TOOLS_USAGE_GUIDE.md) - 工具使用指南
- [copilot-instructions.md](copilot-instructions.md) - 主配置檔案
- [SETUP_VALIDATION.md](copilot/SETUP_VALIDATION.md) - 驗證清單

---

## 完整文檔

### 設定相關
- 📄 **[copilot-setup-steps.yml](.github/copilot-setup-steps.yml)** - 完整的 MCP 設定指南
  - Repository 管理員步驟
  - 開發者設定步驟
  - 安全性最佳實踐
  - 常見問題排解
  - FAQ

### 使用指南
- 📖 **[MCP_TOOLS_USAGE_GUIDE.md](MCP_TOOLS_USAGE_GUIDE.md)** - MCP 工具使用指南
  - 如何確保 Copilot 使用工具
  - Memory 工具使用
  - 驗證工具效果
  - 最佳實踐建議

- 📋 **[copilot-instructions.md](copilot-instructions.md)** - Copilot 主配置
  - 專案概覽
  - 工具使用政策 (MANDATORY)
  - 程式碼標準
  - 整合模式

### 快速參考
- ⚡ **[instructions/quick-reference.instructions.md](instructions/quick-reference.instructions.md)** - 快速參考
  - Angular 20 現代語法
  - ng-alain 常用元件
  - Supabase 資料存取
  - 禁止模式速查

- 🎯 **[copilot/shortcuts/chat-shortcuts.md](copilot/shortcuts/chat-shortcuts.md)** - Chat 快捷指令
  - `/gighub-component` - 生成元件
  - `/gighub-service` - 生成服務
  - `/gighub-review` - 審查程式碼

### 驗證與維護
- ✅ **[copilot/SETUP_VALIDATION.md](copilot/SETUP_VALIDATION.md)** - 設定驗證清單
- 🔒 **[copilot/constraints.md](copilot/constraints.md)** - 約束規則
- 🔐 **[copilot/security-rules.yml](copilot/security-rules.yml)** - 安全規則

---

## 🆘 需要協助？

1. **檢查文檔**: 先查看上方的完整文檔連結
2. **搜尋 Issues**: [GitHub Issues](https://github.com/7Spade/GigHub/issues)
3. **聯絡管理員**: 在團隊協作頻道提問
4. **提交 Issue**: 如果是新問題，建立新 Issue

---

## 📊 設定狀態檢查

```bash
# 快速檢查所有設定
cd /path/to/GigHub

# 1. 檢查 YAML 檔案
python3 -c "import yaml; yaml.safe_load(open('.github/copilot/mcp-servers.yml')); print('✅ mcp-servers.yml valid')"

# 2. 檢查必要檔案
test -f .github/copilot-instructions.md && echo "✅ Main instructions exist"
test -f .github/copilot-setup-steps.yml && echo "✅ Setup steps exist"
test -f .github/MCP_TOOLS_USAGE_GUIDE.md && echo "✅ Usage guide exists"

# 3. 檢查 instruction 檔案
find .github/instructions -name "*.md" -type f | wc -l
# 應該顯示 9 (9 個 instruction 檔案)
```

---

**最後更新**: 2025-12-12  
**維護者**: GitHub Copilot  
**版本**: 1.0.0
