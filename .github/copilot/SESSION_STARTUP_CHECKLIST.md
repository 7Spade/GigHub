# GitHub Copilot Session Startup Checklist

> **目的**: 確保每次 Copilot 會話開始時都正確識別並使用可用的 MCP 工具

---

## 🚨 強制執行：每次會話必讀

當你（Copilot Agent）開始新的會話時，**必須先執行此檢查清單**，然後才能回答任何問題。

---

## ✅ 第 1 步：確認可用的 MCP 工具

以下工具已在 GitHub 設定中配置（`https://github.com/7Spade/GigHub/settings/copilot/coding_agent`）：

### 已配置的 MCP 伺服器

```json
{
  "context7": {
    "status": "✅ Active",
    "url": "https://mcp.context7.com/mcp",
    "tools": ["resolve-library-id", "get-library-docs"]
  },
  "github": {
    "status": "✅ Active", 
    "url": "https://api.githubcopilot.com/mcp/",
    "tools": ["*"]
  },
  "supabase": {
    "status": "✅ Active",
    "url": "https://mcp.supabase.com/mcp?project_ref=zecsbstjqjqoytwgjyct",
    "tools": ["*"],
    "connection": "Remote Database Connected"
  },
  "redis": {
    "status": "✅ Active",
    "command": "@modelcontextprotocol/server-redis",
    "connection": "redis://...@redis-13923.c299.asia-northeast1-1.gce.cloud.redislabs.com:13923",
    "tools": ["*"]
  },
  "memory": {
    "status": "✅ Active",
    "command": "@modelcontextprotocol/server-memory",
    "storage": ".github/copilot/memory.jsonl",
    "tools": ["*"]
  },
  "sequential-thinking": {
    "status": "✅ Active",
    "command": "@modelcontextprotocol/server-sequential-thinking",
    "tools": ["*"]
  },
  "software-planning-tool": {
    "status": "✅ Active",
    "command": "github:NightTrek/Software-planning-mcp",
    "tools": ["*"]
  },
  "filesystem": {
    "status": "✅ Active",
    "command": "@modelcontextprotocol/server-filesystem",
    "tools": ["*"]
  },
  "everything": {
    "status": "✅ Active",
    "command": "@modelcontextprotocol/server-everything",
    "tools": ["*"]
  },
  "time": {
    "status": "✅ Active",
    "command": "@modelcontextprotocol/server-time",
    "tools": ["*"]
  },
  "fetch": {
    "status": "✅ Active",
    "command": "@modelcontextprotocol/server-fetch",
    "tools": ["*"]
  }
}
```

---

## ✅ 第 2 步：工具使用決策樹

在回答問題前，按此決策樹判斷：

```
[問題] → 判斷類型 → 選擇工具

1. 涉及 Angular/ng-alain/Supabase/任何函式庫？
   └─→ 🔴 STOP! 必須先使用 context7
        ├─→ resolve-library-id: 找到函式庫 ID
        └─→ get-library-docs: 取得最新文檔
   
2. 需要查詢/操作資料庫？
   └─→ 🔴 STOP! 必須先使用 supabase
        ├─→ list_tables: 查看資料表結構
        ├─→ execute_sql: 執行 SQL 查詢
        ├─→ list_migrations: 查看遷移記錄
        └─→ get_advisors: 安全性與效能檢查
   
3. 需要快取操作？
   └─→ 🔴 STOP! 必須先使用 redis
        ├─→ redis-get: 讀取快取
        ├─→ redis-set: 設定快取
        └─→ redis-list: 列出 keys
   
4. 複雜問題需要深入分析？
   └─→ 🔴 STOP! 必須先使用 sequential-thinking
        └─→ 結構化推理，步驟分析
   
5. 規劃新功能或重構？
   └─→ 🔴 STOP! 必須先使用 software-planning-tool
        ├─→ start_planning: 開始規劃
        ├─→ add_todo: 加入任務
        └─→ get_todos: 查看任務清單
   
6. 涉及專案特定模式或決策？
   └─→ 🔴 STOP! 必須先使用 memory
        ├─→ search_nodes: 搜尋專案知識
        ├─→ read_graph: 讀取知識圖譜
        └─→ create_entities: 儲存新知識
   
7. 需要檔案操作？
   └─→ 使用 filesystem
        ├─→ view: 查看檔案
        ├─→ edit: 編輯檔案
        └─→ grep/glob: 搜尋檔案
```

---

## ✅ 第 3 步：自我檢查問題

在回答任何問題之前，問自己：

### 檢查清單

- [ ] 我是否檢查了這個問題需要哪些 MCP 工具？
- [ ] 如果涉及框架/函式庫，我是否使用了 context7？
- [ ] 如果涉及資料庫，我是否使用了 supabase 工具？
- [ ] 如果是複雜分析，我是否使用了 sequential-thinking？
- [ ] 如果是功能規劃，我是否使用了 software-planning-tool？
- [ ] 我是否假設了任何 API 或資料庫結構而沒有先查詢？

### 🚫 常見錯誤模式（必須避免）

❌ **錯誤**: "根據 Angular 20 的慣例，你應該使用..."
✅ **正確**: 先使用 `context7` 查詢 Angular 20 文檔，然後回答

❌ **錯誤**: "假設你的資料庫有以下表格..."
✅ **正確**: 先使用 `supabase-list_tables` 查詢實際表格結構

❌ **錯誤**: "直接分析這個複雜問題..."
✅ **正確**: 使用 `sequential-thinking` 進行結構化分析

❌ **錯誤**: "我們可以這樣規劃功能..."
✅ **正確**: 使用 `software-planning-tool` 建立完整計畫

---

## ✅ 第 4 步：驗證工具使用

### 測試可用性（可選）

如果你懷疑某個工具不可用，可以快速測試：

```typescript
// Context7 測試
context7/resolve-library-id({ libraryName: "angular" })

// Supabase 測試  
supabase/list_tables({ schemas: ["public"] })

// Redis 測試
redis-list({ pattern: "*" })

// Memory 測試
memory-search_nodes({ query: "architecture" })
```

但請記住：**這些工具都已經配置好了，不需要懷疑！**

---

## ✅ 第 5 步：開始回答

只有在完成上述檢查後，才能開始回答使用者的問題。

### 回答模板

對於涉及工具的問題，使用此模板：

```markdown
我理解您的問題。讓我先使用相關的 MCP 工具來確保提供準確資訊。

[使用相關工具]

根據 [工具名稱] 的查詢結果，[提供答案]...
```

---

## 📊 工具使用統計目標

### 預期使用率

| 工具 | 目標使用率 | 當前問題 |
|------|-----------|---------|
| context7 | 80%+ | 經常被忽略 ⚠️ |
| supabase | 90%+ | 經常被忽略 ⚠️ |
| sequential-thinking | 50%+ | 使用不足 ⚠️ |
| software-planning-tool | 60%+ | 使用不足 ⚠️ |
| memory | 40%+ | 很少使用 ⚠️ |
| redis | 30%+ | 很少使用 ⚠️ |

---

## 🎯 成功案例對比

### ❌ 錯誤示範

**使用者**: "如何在 Angular 20 中使用 input() 函數？"

**Copilot (錯誤)**:
```
在 Angular 20 中，input() 函數的用法如下：
[根據記憶或訓練資料回答，可能過時]
```

### ✅ 正確示範

**使用者**: "如何在 Angular 20 中使用 input() 函數？"

**Copilot (正確)**:
```
讓我先查詢 Angular 20 的最新文檔來確保資訊準確。

[使用 context7]
1. resolve-library-id({ libraryName: "angular" })
2. get-library-docs({ context7CompatibleLibraryID: "/angular/angular", topic: "input" })

根據 Angular 20 官方文檔：
[提供基於最新文檔的準確答案]
```

---

## 🔄 持續改進

### 每週檢討

- 我是否忽略了應該使用的工具？
- 我的工具使用率是否達到目標？
- 使用者是否需要糾正我？

### 調整策略

如果發現自己經常忘記使用工具：
1. 重新閱讀此檢查清單
2. 在回答前多問自己「需要哪些工具？」
3. 養成「工具優先」的思考習慣

---

## 📝 記憶提示

**如果你看到這段文字，請記住：**

> 你不是在「協助」使用者使用工具。
> 
> 你**就是**要使用這些工具來提供更好的答案。
> 
> **工具不是可選的，是必要的！**

---

**建立日期**: 2025-12-12  
**用途**: 確保 Copilot Agent 正確使用所有可用的 MCP 工具  
**更新頻率**: 當發現工具被忽略時立即更新
