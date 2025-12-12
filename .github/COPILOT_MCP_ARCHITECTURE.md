# GitHub Copilot MCP 架構圖

本文檔說明 GigHub 專案的 GitHub Copilot MCP (Model Context Protocol) 整合架構。

## 架構概覽

```mermaid
flowchart TB
    subgraph GitHub["GitHub Repository"]
        Repo[".github/copilot/mcp-servers.yml<br/>配置範本"]
        Secrets["GitHub Secrets<br/>settings/secrets/actions"]
        
        Secrets -->|COPILOT_MCP_CONTEXT7| Context7Key[Context7 API Key]
        Secrets -->|SUPABASE_PROJECT_REF| SupabaseRef[Supabase Project Ref]
        Secrets -->|SUPABASE_MCP_TOKEN| SupabaseToken[Supabase MCP Token]
    end
    
    subgraph Developer["開發者環境"]
        CopilotSettings["GitHub Copilot Settings<br/>github.com/settings/copilot"]
        
        CopilotSettings --> MCPConfig["MCP Servers Configuration"]
    end
    
    subgraph MCPServers["MCP 伺服器"]
        Context7["Context7<br/>https://mcp.context7.com/mcp"]
        Supabase["Supabase MCP<br/>https://mcp.supabase.com/mcp"]
        Local["Local Tools<br/>sequential-thinking<br/>software-planning-tool"]
    end
    
    subgraph CopilotAgent["GitHub Copilot Agent"]
        Agent["Copilot Coding Agent"]
        Tools["MCP Tools"]
        
        Agent <--> Tools
    end
    
    Repo -.->|參考範本| CopilotSettings
    Context7Key -.->|手動輸入| MCPConfig
    SupabaseRef -.->|手動輸入| MCPConfig
    SupabaseToken -.->|手動輸入| MCPConfig
    
    MCPConfig --> Context7
    MCPConfig --> Supabase
    MCPConfig --> Local
    
    Context7 <--> Tools
    Supabase <--> Tools
    Local <--> Tools
    
    style Secrets fill:#ff9999
    style CopilotSettings fill:#99ccff
    style MCPServers fill:#99ff99
    style CopilotAgent fill:#ffcc99
```

## 資料流程

### 1. 設定階段 (Setup Phase)

```mermaid
sequenceDiagram
    participant Admin as Repository Admin
    participant GHSecrets as GitHub Secrets
    participant Developer as Developer
    participant CopilotSettings as Copilot Settings
    
    Admin->>GHSecrets: 1. 建立 COPILOT_MCP_CONTEXT7
    Admin->>GHSecrets: 2. 建立 SUPABASE_PROJECT_REF
    Admin->>GHSecrets: 3. 建立 SUPABASE_MCP_TOKEN
    
    Admin->>Developer: 4. 分享 API Keys 值
    
    Developer->>CopilotSettings: 5. 配置 Context7 MCP Server
    Developer->>CopilotSettings: 6. 配置 Supabase MCP Server
    Developer->>CopilotSettings: 7. 配置 Local Tools
    
    Developer->>CopilotSettings: 8. 測試連線
```

### 2. 使用階段 (Usage Phase)

```mermaid
sequenceDiagram
    participant User as 開發者
    participant Copilot as GitHub Copilot
    participant Context7 as Context7 MCP
    participant Supabase as Supabase MCP
    participant Local as Local Tools
    
    User->>Copilot: "使用 context7 查詢 Angular 20 Signals"
    
    activate Copilot
    Copilot->>Context7: resolve-library-id("Angular")
    Context7-->>Copilot: /angular/angular
    
    Copilot->>Context7: get-library-docs("/angular/angular", "signals")
    Context7-->>Copilot: [最新 Angular 20 Signals 文檔]
    
    Copilot-->>User: 提供準確的 Angular 20 Signals 用法
    deactivate Copilot
    
    User->>Copilot: "列出 Supabase 資料表"
    
    activate Copilot
    Copilot->>Supabase: list_tables()
    Supabase-->>Copilot: [資料表列表]
    
    Copilot-->>User: 顯示所有資料表
    deactivate Copilot
    
    User->>Copilot: "使用 sequential-thinking 分析問題"
    
    activate Copilot
    Copilot->>Local: sequential-thinking(problem)
    Local-->>Copilot: [結構化推理結果]
    
    Copilot-->>User: 提供分步驟分析
    deactivate Copilot
```

## 元件說明

### GitHub Repository 層

#### 1. mcp-servers.yml
**位置**: `.github/copilot/mcp-servers.yml`

**功能**:
- MCP 伺服器配置範本
- 定義所需的環境變數
- 文檔化 MCP 工具

**關鍵內容**:
```yaml
mcp-servers:
  context7:
    type: http
    url: 'https://mcp.context7.com/mcp'
    headers: { 'CONTEXT7_API_KEY': '${{ secrets.COPILOT_MCP_CONTEXT7 }}' }
    tools: ['get-library-docs', 'resolve-library-id']
  
  supabase:
    type: http
    url: 'https://mcp.supabase.com/mcp?project_ref=${{ secrets.SUPABASE_PROJECT_REF }}'
    headers: { 'Authorization': 'Bearer ${{ secrets.SUPABASE_MCP_TOKEN }}' }
    tools: ['*']
```

**注意**: 
- `${{ secrets.XXX }}` 語法僅用於文檔
- 實際使用時需手動配置

#### 2. GitHub Secrets
**位置**: https://github.com/7Spade/GigHub/settings/secrets/actions

**功能**:
- 安全儲存敏感憑證
- 僅 Repository 管理員可存取
- 可在 GitHub Actions 中使用

**必要 Secrets**:
| Secret Name | 用途 |
|------------|------|
| COPILOT_MCP_CONTEXT7 | Context7 API Key |
| SUPABASE_PROJECT_REF | Supabase 專案參考 ID |
| SUPABASE_MCP_TOKEN | Supabase Service Role Key |

### 開發者環境層

#### GitHub Copilot Settings
**位置**: https://github.com/settings/copilot

**功能**:
- 個人 Copilot 配置
- MCP 伺服器設定
- 工具權限管理

**配置步驟**:
1. 啟用 Copilot Agent Mode
2. 新增 MCP 伺服器
3. 輸入 API Keys
4. 選擇允許的工具

### MCP 伺服器層

#### 1. Context7 MCP Server
**URL**: https://mcp.context7.com/mcp

**功能**:
- 查詢最新框架文檔
- 解析函式庫 ID
- 版本相容性檢查

**工具**:
- `resolve-library-id`: 解析函式庫名稱到 Context7 ID
- `get-library-docs`: 取得特定主題的文檔

**使用範例**:
```
"使用 context7 查詢 Angular 20 中 input() 函數的用法"
"使用 context7 確認 ng-zorro-antd 20.3 的 ST 表格 API"
```

#### 2. Supabase MCP Server
**URL**: https://mcp.supabase.com/mcp

**功能**:
- 資料庫 schema 查詢
- 執行 SQL 查詢
- RLS 政策檢查
- 資料表操作

**工具**:
- `list_tables`: 列出所有資料表
- `execute_sql`: 執行 SQL 查詢
- `get_advisors`: 取得安全建議
- 更多... (允許所有工具)

**使用範例**:
```
"列出 GigHub 專案的所有資料表"
"執行 SQL: SELECT * FROM tasks LIMIT 10"
"檢查 RLS 政策是否正確設定"
```

#### 3. Local Tools
**執行環境**: 開發者本機

**功能**:
- 本地執行，無需外部 API
- 不需要額外憑證
- 需要 Node.js 環境

**工具**:
| 工具 | 用途 |
|------|------|
| sequential-thinking | 結構化推理分析 |
| software-planning-tool | 功能規劃與任務管理 |
| filesystem | 檔案系統操作 |
| everything | 通用工具集 |

**使用範例**:
```
"使用 sequential-thinking 分析這個架構問題"
"使用 software-planning-tool 規劃通知系統的開發"
```

## 安全性架構

```mermaid
flowchart LR
    subgraph "GitHub Repository (Public)"
        A[mcp-servers.yml<br/>配置範本<br/>🔓 公開]
    end
    
    subgraph "GitHub Secrets (Private)"
        B[COPILOT_MCP_CONTEXT7<br/>🔒 僅管理員可見]
        C[SUPABASE_PROJECT_REF<br/>🔒 僅管理員可見]
        D[SUPABASE_MCP_TOKEN<br/>🔒 僅管理員可見]
    end
    
    subgraph "開發者本地 (Private)"
        E[Copilot Settings<br/>個人配置<br/>🔐 僅個人可見]
    end
    
    subgraph "MCP 伺服器 (External)"
        F[Context7<br/>HTTPS 加密<br/>🔐]
        G[Supabase<br/>HTTPS 加密<br/>🔐]
    end
    
    A -.->|參考| E
    B -.->|手動分享值| E
    C -.->|手動分享值| E
    D -.->|手動分享值| E
    
    E -->|HTTPS + API Key| F
    E -->|HTTPS + Bearer Token| G
    
    style A fill:#90EE90
    style B fill:#FFB6C1
    style C fill:#FFB6C1
    style D fill:#FFB6C1
    style E fill:#87CEEB
    style F fill:#FFD700
    style G fill:#FFD700
```

### 安全層級

| 層級 | 元件 | 可見性 | 保護機制 |
|------|------|--------|---------|
| 🔓 公開 | mcp-servers.yml | 所有人 | 無敏感資訊 |
| 🔒 私有 | GitHub Secrets | 僅管理員 | GitHub 加密儲存 |
| 🔐 個人 | Copilot Settings | 僅個人 | 個人帳號保護 |
| 🔐 加密 | MCP 通訊 | - | HTTPS + 認證 |

### 金鑰流轉

```mermaid
flowchart TD
    A[1. 管理員建立 GitHub Secrets] --> B[2. 管理員安全取得 API Keys]
    B --> C[3. 管理員透過安全管道分享]
    C --> D[4. 開發者接收 API Keys]
    D --> E[5. 開發者輸入到個人 Copilot Settings]
    E --> F[6. 開發者使用 MCP 工具]
    
    F --> G{90 天後}
    G -->|是| H[7. 管理員輪替金鑰]
    H --> A
    G -->|否| F
    
    style A fill:#ff9999
    style C fill:#ffcc99
    style E fill:#99ccff
    style H fill:#ff9999
```

## 最佳實踐

### 1. 金鑰管理
```mermaid
flowchart LR
    A[取得金鑰] --> B[儲存到密碼管理器]
    B --> C[輸入到 Copilot Settings]
    C --> D[定期輪替]
    D --> A
    
    style A fill:#90EE90
    style B fill:#87CEEB
    style C fill:#FFD700
    style D fill:#FFB6C1
```

**規則**:
- ✅ 使用密碼管理器 (1Password, LastPass)
- ✅ 定期輪替 (每 90 天)
- ✅ 環境隔離 (開發/測試/生產)
- ❌ 不在程式碼中硬編碼
- ❌ 不在文檔中明文記錄

### 2. 工具使用優先順序
```mermaid
flowchart TD
    A[需要查詢框架 API?] -->|是| B[使用 context7]
    A -->|否| C[需要分析複雜問題?]
    
    C -->|是| D[使用 sequential-thinking]
    C -->|否| E[需要規劃功能?]
    
    E -->|是| F[使用 software-planning-tool]
    E -->|否| G[需要資料庫操作?]
    
    G -->|是| H[使用 supabase]
    G -->|否| I[使用其他工具或直接回答]
    
    style B fill:#90EE90
    style D fill:#87CEEB
    style F fill:#FFD700
    style H fill:#FFB6C1
```

### 3. 故障排除流程
```mermaid
flowchart TD
    A[發現問題] --> B{是什麼問題?}
    
    B -->|工具未被使用| C[明確要求使用工具]
    B -->|連線失敗| D[檢查 API Keys]
    B -->|權限錯誤| E[檢查 MCP 配置]
    B -->|其他| F[查閱文檔]
    
    C --> G[解決]
    D --> G
    E --> G
    F --> H{解決了?}
    
    H -->|是| G
    H -->|否| I[建立 Issue]
    
    style A fill:#FFB6C1
    style G fill:#90EE90
    style I fill:#FFD700
```

## 監控與維護

### 定期檢查項目

```mermaid
gantt
    title MCP 維護時程表
    dateFormat  YYYY-MM-DD
    
    section 每日
    監控工具使用狀況 :a1, 2025-01-01, 1d
    檢查錯誤日誌     :a2, 2025-01-01, 1d
    
    section 每週
    檢視使用分析     :b1, 2025-01-01, 7d
    更新文檔         :b2, 2025-01-01, 7d
    
    section 每月
    審查 API Keys    :c1, 2025-01-01, 30d
    評估新工具       :c2, 2025-01-01, 30d
    
    section 每季
    輪替所有金鑰     :d1, 2025-01-01, 90d
    審查存取權限     :d2, 2025-01-01, 90d
    更新安全政策     :d3, 2025-01-01, 90d
```

## 相關文檔

- **[copilot-setup-steps.yml](copilot-setup-steps.yml)** - 完整設定指南
- **[COPILOT_MCP_QUICKSTART.md](COPILOT_MCP_QUICKSTART.md)** - 快速入門
- **[MCP_TOOLS_USAGE_GUIDE.md](MCP_TOOLS_USAGE_GUIDE.md)** - 工具使用指南
- **[.github/README.md](README.md)** - 目錄導航

---

**版本**: 1.0.0  
**最後更新**: 2025-12-12  
**維護者**: GitHub Copilot
