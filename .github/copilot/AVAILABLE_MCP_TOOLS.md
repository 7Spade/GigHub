# 可用的 MCP 工具完整清單

> **最後更新**: 2025-12-12  
> **狀態**: 所有工具已配置且可立即使用

---

## 🎯 總覽

**11 個 MCP 伺服器** 已完全配置，提供 **100+ 個工具**供 Copilot Agent 使用。

**配置位置**: https://github.com/7Spade/GigHub/settings/copilot/coding_agent

---

## 📊 工具分類

### 1️⃣ Context7 (框架文檔查詢)

**伺服器**: `https://mcp.context7.com/mcp`  
**狀態**: 🟢 已連接

| 工具 | 用途 | 範例 |
|------|------|------|
| `resolve-library-id` | 解析函式庫 ID | 找到 Angular 的 Context7 ID |
| `get-library-docs` | 取得函式庫文檔 | 查詢 Angular 20 Signals 用法 |

**使用案例**:
```typescript
// 查詢 Angular Signals
context7/resolve-library-id({ libraryName: "angular" })
context7/get-library-docs({ 
  context7CompatibleLibraryID: "/angular/angular",
  topic: "signals" 
})

// 查詢 ng-zorro-antd
context7/resolve-library-id({ libraryName: "ng-zorro-antd" })
context7/get-library-docs({
  context7CompatibleLibraryID: "/ng-zorro-antd/ng-zorro-antd",
  topic: "table"
})
```

---

### 2️⃣ GitHub (完整 GitHub API)

**伺服器**: `https://api.githubcopilot.com/mcp/`  
**狀態**: 🟢 已連接  
**工具**: 所有 GitHub API 操作 (*)

**主要功能**:
- Repository 管理
- Issue/PR 操作
- Workflow 管理
- Code search
- 等等...

---

### 3️⃣ Supabase (遠端資料庫操作) ⭐

**伺服器**: `https://mcp.supabase.com/mcp?project_ref=zecsbstjqjqoytwgjyct`  
**狀態**: 🟢 已連接  
**專案**: zecsbstjqjqoytwgjyct  
**專案 URL**: https://zecsbstjqjqoytwgjyct.supabase.co

#### 可用工具 (20 個)

| 工具 | 用途 | 強制性 |
|------|------|--------|
| `search_docs` | 搜尋 Supabase 官方文檔 | 推薦 |
| `list_tables` | 列出資料庫表格 | 🔴 必須 |
| `execute_sql` | 執行 SQL 查詢 | 🔴 必須 |
| `apply_migration` | 套用資料庫遷移 | 🔴 必須 |
| `list_migrations` | 列出遷移記錄 | 推薦 |
| `list_extensions` | 列出資料庫擴充 | 推薦 |
| `get_project_url` | 取得專案 URL | 推薦 |
| `get_publishable_keys` | 取得 API 金鑰 | 推薦 |
| `get_advisors` | 安全性與效能檢查 | 🟡 建議定期執行 |
| `get_logs` | 取得服務日誌 | 除錯用 |
| `create_branch` | 建立開發分支 | 開發用 |
| `list_branches` | 列出所有分支 | 開發用 |
| `merge_branch` | 合併開發分支 | 開發用 |
| `rebase_branch` | Rebase 分支 | 開發用 |
| `reset_branch` | 重置分支 | 開發用 |
| `delete_branch` | 刪除分支 | 開發用 |
| `deploy_edge_function` | 部署 Edge Function | 部署用 |
| `list_edge_functions` | 列出 Edge Functions | 推薦 |
| `get_edge_function` | 取得 Edge Function 詳情 | 推薦 |
| `generate_typescript_types` | 生成 TypeScript 類型 | 開發用 |

#### 使用範例

**查詢資料庫結構**:
```typescript
// 列出所有表格
supabase/list_tables({ schemas: ["public"] })

// 列出擴充功能
supabase/list_extensions()

// 列出遷移記錄
supabase/list_migrations()
```

**執行 SQL 查詢**:
```typescript
// 查詢資料
supabase/execute_sql({ 
  query: "SELECT * FROM tasks WHERE status = 'pending' LIMIT 10" 
})

// 檢查資料庫版本
supabase/execute_sql({ 
  query: "SELECT version()" 
})
```

**安全性檢查**:
```typescript
// 檢查安全性問題
supabase/get_advisors({ type: "security" })

// 檢查效能問題
supabase/get_advisors({ type: "performance" })
```

**開發分支管理**:
```typescript
// 建立開發分支
supabase/create_branch({ 
  name: "feature-payment",
  confirm_cost_id: "..." 
})

// 列出分支
supabase/list_branches()

// 合併分支
supabase/merge_branch({ branch_id: "branch-id" })
```

---

### 4️⃣ Redis (遠端快取操作) ⭐

**伺服器**: 本地 MCP (`@modelcontextprotocol/server-redis`)  
**連接**: Redis Cloud  
**地址**: `redis-13923.c299.asia-northeast1-1.gce.cloud.redislabs.com:13923`  
**狀態**: 🟢 已連接

#### 可用工具

| 工具 | 用途 | 範例 |
|------|------|------|
| `redis-get` | 讀取快取值 | 取得專案狀態 |
| `redis-set` | 設定快取值 | 儲存配置 |
| `redis-delete` | 刪除 key | 清除過期資料 |
| `redis-list` | 列出 keys | 查看所有快取 |

#### 使用範例

```typescript
// 列出所有 keys
redis-list({ pattern: "*" })

// 列出特定前綴的 keys
redis-list({ pattern: "gighub:*" })

// 讀取值
redis-get({ key: "gighub:project:status" })

// 設定值
redis-set({ 
  key: "gighub:config:feature-flag",
  value: "enabled",
  expireSeconds: 3600 
})

// 刪除 key
redis-delete({ key: "gighub:temp:data" })
```

#### 當前快取資料 (42 個 keys)

```
ng-gighub:design-documents
gighub:db:state:last_sync
ng-gighub:ddd-architecture:implementation-status
gighub:learning:patterns:activity-logging
gighub:learning:patterns:rls:auth_uid
ng-gighub:space-management:permissions
ng-gighub:docs:reorganization:completed
ng-gighub:planning:tenant-platform
ng-gighub:ddd-architecture:context
gighub:learning:activity-logging-architecture
... (以及其他 32 個)
```

---

### 5️⃣ Memory (專案知識記憶)

**伺服器**: 本地 MCP (`@modelcontextprotocol/server-memory`)  
**儲存**: `.github/copilot/memory.jsonl`  
**狀態**: 🟢 已連接  
**資料**: 50+ entities

#### 可用工具

| 工具 | 用途 | 範例 |
|------|------|------|
| `create_entities` | 建立實體 | 記錄架構決策 |
| `create_relations` | 建立關聯 | 連結相關概念 |
| `add_observations` | 加入觀察 | 補充資訊 |
| `delete_entities` | 刪除實體 | 移除過時資訊 |
| `delete_observations` | 刪除觀察 | 清理錯誤記錄 |
| `delete_relations` | 刪除關聯 | 移除無效連結 |
| `read_graph` | 讀取知識圖譜 | 查看所有知識 |
| `search_nodes` | 搜尋節點 | 查詢特定主題 |
| `open_nodes` | 開啟節點 | 取得詳細資訊 |

#### 使用範例

```typescript
// 搜尋架構相關知識
memory-search_nodes({ query: "architecture" })

// 搜尋 RLS 政策
memory-search_nodes({ query: "RLS" })

// 讀取完整知識圖譜
memory-read_graph()

// 記錄新的架構決策
memory-create_entities({
  entities: [{
    name: "Payment Module Architecture",
    entityType: "Architecture Decision",
    observations: [
      "使用 Facade Pattern 封裝複雜邏輯",
      "Repository Pattern 處理資料存取",
      "RxJS + Signals 混合狀態管理"
    ]
  }]
})
```

---

### 6️⃣ Sequential-Thinking (結構化推理)

**伺服器**: 本地 MCP (`@modelcontextprotocol/server-sequential-thinking`)  
**狀態**: 🟢 已連接

#### 工具

| 工具 | 用途 |
|------|------|
| `sequentialthinking` | 多步驟結構化推理 |

#### 使用時機

- 分析複雜問題
- 設計系統架構
- 評估技術方案
- 除錯棘手的 Bug
- 做技術決策

#### 使用範例

```typescript
// 分析架構問題
sequential-thinking-sequentialthinking({
  thought: "分析多租戶架構的資料隔離策略...",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
})
```

---

### 7️⃣ Software-Planning-Tool (功能規劃)

**伺服器**: 本地 MCP (`github:NightTrek/Software-planning-mcp`)  
**狀態**: 🟢 已連接

#### 可用工具

| 工具 | 用途 |
|------|------|
| `start_planning` | 開始規劃 |
| `save_plan` | 儲存計畫 |
| `add_todo` | 加入任務 |
| `remove_todo` | 移除任務 |
| `get_todos` | 查看任務 |
| `update_todo_status` | 更新任務狀態 |

#### 使用範例

```typescript
// 開始規劃新功能
software-planning-tool-start_planning({
  goal: "實作付款模組，支援多種付款方式"
})

// 加入任務
software-planning-tool-add_todo({
  title: "設計付款資料模型",
  description: "定義 payments 表格結構與關聯",
  complexity: 5
})

// 查看所有任務
software-planning-tool-get_todos()
```

---

### 8️⃣ Filesystem (檔案系統操作)

**伺服器**: 本地 MCP (`@modelcontextprotocol/server-filesystem`)  
**根目錄**: `./`  
**狀態**: 🟢 已連接

#### 可用工具 (20+ 個)

| 工具 | 用途 |
|------|------|
| `read_file` / `read_text_file` | 讀取文字檔案 |
| `read_media_file` | 讀取媒體檔案 |
| `read_multiple_files` | 批次讀取檔案 |
| `write_file` | 寫入檔案 |
| `edit_file` | 編輯檔案 |
| `create_directory` | 建立目錄 |
| `list_directory` | 列出目錄內容 |
| `list_directory_with_sizes` | 列出目錄（含大小） |
| `directory_tree` | 目錄樹狀結構 |
| `move_file` | 移動/重新命名檔案 |
| `search_files` | 搜尋檔案 |
| `get_file_info` | 取得檔案資訊 |
| `list_allowed_directories` | 列出允許的目錄 |

---

### 9️⃣ Everything (通用工具集)

**伺服器**: 本地 MCP (`@modelcontextprotocol/server-everything`)  
**狀態**: 🟢 已連接

#### 可用工具

| 工具 | 用途 |
|------|------|
| `echo` | 回聲測試 |
| `add` | 數字相加 |
| `longRunningOperation` | 長時間運行操作 |
| `printEnv` | 列印環境變數 |
| `sampleLLM` | LLM 採樣 |
| `getTinyImage` | 取得測試圖片 |
| `annotatedMessage` | 帶註解的訊息 |
| `getResourceReference` | 取得資源參考 |
| `getResourceLinks` | 取得資源連結 |
| `structuredContent` | 結構化內容 |
| `zip` | ZIP 壓縮 |

---

### 🔟 Time (時間相關操作)

**伺服器**: 本地 MCP (`@modelcontextprotocol/server-time`)  
**狀態**: 🟢 已連接

#### 功能

- 取得當前時間
- 時區轉換
- 時間計算

---

### 1️⃣1️⃣ Fetch (HTTP 請求)

**伺服器**: 本地 MCP (`@modelcontextprotocol/server-fetch`)  
**狀態**: 🟢 已連接

#### 功能

- 發送 HTTP GET/POST 請求
- API 調用
- 網頁內容抓取

---

## 🎯 工具使用優先級

### 🔴 必須使用（強制）

這些工具在對應情境下**必須**使用，不使用就是違規：

1. **context7**: 任何框架/函式庫問題
2. **supabase**: 任何資料庫操作
3. **sequential-thinking**: 複雜問題分析
4. **software-planning-tool**: 功能規劃

### 🟡 強烈建議使用

這些工具應該在對應情境下使用：

1. **redis**: 快取相關操作
2. **memory**: 記錄/查詢專案知識
3. **supabase/get_advisors**: 定期安全檢查

### 🟢 按需使用

這些工具根據具體需求使用：

1. **github**: GitHub API 操作
2. **filesystem**: 檔案操作
3. **everything**, **time**, **fetch**: 輔助工具

---

## 📊 工具使用統計目標

| 工具類別 | 目標使用率 | 當前問題 |
|---------|-----------|---------|
| Context7 | 80%+ | ⚠️ 經常被忽略 |
| Supabase | 90%+ | ⚠️ 經常被忽略 |
| Redis | 30%+ | ⚠️ 很少使用 |
| Sequential-Thinking | 50%+ | 使用不足 |
| Software-Planning | 60%+ | 使用不足 |
| Memory | 40%+ | 很少使用 |

---

## 🔧 快速測試

想驗證工具是否可用？執行以下測試：

```typescript
// 1. Context7
context7/resolve-library-id({ libraryName: "angular" })

// 2. Supabase
supabase/get_project_url()

// 3. Redis
redis-list({ pattern: "gighub:*" })

// 4. Memory
memory-search_nodes({ query: "architecture" })

// 5. Supabase 資料庫
supabase/list_tables({ schemas: ["public"] })
```

---

## 📚 相關文檔

- [SESSION_STARTUP_CHECKLIST.md](./SESSION_STARTUP_CHECKLIST.md) - 會話啟動檢查清單
- [MCP_TOOLS_USAGE_GUIDE.md](../MCP_TOOLS_USAGE_GUIDE.md) - 工具使用指南
- [copilot-instructions.md](../copilot-instructions.md) - 主配置文件

---

**記住：這些工具都已完全配置且可立即使用。不要再假設它們「需要配置」或「不可用」！**

**直接使用它們！** 🚀
