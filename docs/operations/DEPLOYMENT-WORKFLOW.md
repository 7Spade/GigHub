# Supabase 遷移部署工作流程

## 📊 視覺化工作流程

### 完整部署流程

```mermaid
graph TB
    Start([開始部署]) --> Choice{選擇部署方法}
    
    Choice -->|方法1| MCP[使用 Supabase MCP]
    Choice -->|方法2| Script[使用 Bash 腳本]
    Choice -->|方法3| CLI[使用 Supabase CLI]
    Choice -->|方法4| Actions[使用 GitHub Actions]
    
    subgraph "方法 1: Supabase MCP"
        MCP --> MCP1[在 PR 中評論]
        MCP1 --> MCP2[@copilot 使用 supabase MCP...]
        MCP2 --> MCP3[Copilot Agent 執行]
        MCP3 --> MCP4[自動驗證]
        MCP4 --> MCP5[回報結果]
    end
    
    subgraph "方法 2: Bash 腳本"
        Script --> S1[配置 .env]
        S1 --> S2[執行 yarn db:migrate]
        S2 --> S3[互動式確認]
        S3 --> S4[執行 SQL]
        S4 --> S5[自動驗證]
    end
    
    subgraph "方法 3: Supabase CLI"
        CLI --> C1[supabase login]
        C1 --> C2[supabase link]
        C2 --> C3[supabase db push]
        C3 --> C4[CLI 驗證]
    end
    
    subgraph "方法 4: GitHub Actions"
        Actions --> A1[觸發 Workflow]
        A1 --> A2[Checkout 程式碼]
        A2 --> A3[設定環境]
        A3 --> A4[執行遷移]
        A4 --> A5[驗證結果]
        A5 --> A6[PR 評論]
    end
    
    MCP5 --> Verify{驗證成功?}
    S5 --> Verify
    C4 --> Verify
    A6 --> Verify
    
    Verify -->|是| Success([✅ 部署成功])
    Verify -->|否| Debug[查看錯誤日誌]
    Debug --> Fix[修復問題]
    Fix --> Choice
    
    Success --> Test[測試整合]
    Test --> Done([🎉 完成])
```

---

## 🔄 各方法詳細流程

### 方法 1: Supabase MCP (推薦)

```mermaid
sequenceDiagram
    participant User as 使用者
    participant GH as GitHub PR
    participant Copilot as Copilot Agent
    participant MCP as Supabase MCP
    participant DB as Supabase DB
    
    User->>GH: 在 PR 中發表評論
    Note over User,GH: @copilot 使用 supabase MCP...
    
    GH->>Copilot: 觸發 Agent
    Copilot->>MCP: 呼叫 MCP 工具
    
    MCP->>DB: 連接資料庫
    DB-->>MCP: 連接成功
    
    loop 每個遷移檔案
        MCP->>DB: 執行 SQL
        DB-->>MCP: 執行結果
    end
    
    MCP->>DB: 驗證表格
    DB-->>MCP: 驗證結果
    
    MCP->>DB: 檢查 RLS
    DB-->>MCP: RLS 狀態
    
    MCP-->>Copilot: 回報結果
    Copilot-->>GH: 發表評論
    GH-->>User: 顯示結果
```

---

### 方法 2: Bash 腳本

```mermaid
flowchart LR
    Start([開始]) --> Env[配置 .env]
    Env --> Check{環境檢查}
    
    Check -->|psql 存在| Load[載入環境變數]
    Check -->|psql 不存在| Install[安裝 psql]
    Install --> Load
    
    Load --> List[列出遷移檔案]
    List --> Confirm{確認執行?}
    
    Confirm -->|否| Cancel([取消])
    Confirm -->|是| M1[執行遷移 1]
    
    M1 --> M1V{成功?}
    M1V -->|是| M2[執行遷移 2]
    M1V -->|否| Error1[顯示錯誤]
    
    M2 --> M2V{成功?}
    M2V -->|是| M3[執行遷移 3]
    M2V -->|否| Error2[顯示錯誤]
    
    M3 --> M3V{成功?}
    M3V -->|是| Verify[驗證部署]
    M3V -->|否| Error3[顯示錯誤]
    
    Error1 --> Summary
    Error2 --> Summary
    Error3 --> Summary
    
    Verify --> Summary[顯示摘要]
    Summary --> Done([完成])
```

---

### 方法 3: Supabase CLI

```mermaid
stateDiagram-v2
    [*] --> 未登入
    
    未登入 --> 登入中: supabase login
    登入中 --> 已登入: 成功
    登入中 --> 未登入: 失敗
    
    已登入 --> 未連結: 選擇專案
    
    未連結 --> 連結中: supabase link
    連結中 --> 已連結: 成功
    連結中 --> 未連結: 失敗
    
    已連結 --> 推送中: supabase db push
    推送中 --> 推送成功: 成功
    推送中 --> 推送失敗: 失敗
    
    推送成功 --> 驗證中
    驗證中 --> 完成: 通過
    驗證中 --> 推送失敗: 失敗
    
    推送失敗 --> 已連結: 重試
    完成 --> [*]
```

---

### 方法 4: GitHub Actions

```mermaid
graph LR
    subgraph "觸發方式"
        T1[推送到 main]
        T2[手動觸發]
        T3[遷移檔案變更]
    end
    
    T1 --> Workflow
    T2 --> Workflow
    T3 --> Workflow
    
    subgraph "Workflow 步驟"
        Workflow[開始 Workflow] --> Job1[Checkout 程式碼]
        Job1 --> Job2[設定 Node.js]
        Job2 --> Job3[安裝 Supabase CLI]
        Job3 --> Job4[配置憑證]
        Job4 --> Job5[驗證遷移檔案]
        Job5 --> Job6{檔案存在?}
        
        Job6 -->|否| Skip[跳過部署]
        Job6 -->|是| Deploy[執行部署]
        
        Deploy --> Verify[驗證結果]
        Verify --> Report[生成報告]
        Report --> Comment[PR 評論]
    end
    
    Comment --> Success{成功?}
    Success -->|是| Done1[✅ 完成]
    Success -->|否| Notify[發送通知]
    
    Skip --> Done2[完成]
```

---

## 🔍 驗證流程

```mermaid
flowchart TD
    Start([開始驗證]) --> T1{tables 表存在?}
    
    T1 -->|否| Fail1[❌ tasks 表不存在]
    T1 -->|是| T2{logs 表存在?}
    
    T2 -->|否| Fail2[❌ logs 表不存在]
    T2 -->|是| RLS{RLS 已啟用?}
    
    RLS -->|否| Fail3[❌ RLS 未啟用]
    RLS -->|是| Policies{政策數量正確?}
    
    Policies -->|否| Fail4[❌ 政策不完整]
    Policies -->|是| Indexes{索引已建立?}
    
    Indexes -->|否| Warn1[⚠️ 索引缺失]
    Indexes -->|是| Triggers{觸發器運作?}
    
    Triggers -->|否| Warn2[⚠️ 觸發器問題]
    Triggers -->|是| Test{測試查詢?}
    
    Test -->|失敗| Fail5[❌ 查詢失敗]
    Test -->|成功| Success[✅ 驗證通過]
    
    Fail1 --> Report[生成報告]
    Fail2 --> Report
    Fail3 --> Report
    Fail4 --> Report
    Fail5 --> Report
    Warn1 --> Report
    Warn2 --> Report
    Success --> Report
    
    Report --> End([結束])
```

---

## 🛡️ 安全檢查流程

```mermaid
graph TB
    Start([開始安全檢查]) --> C1{.env 未追蹤?}
    
    C1 -->|否| S1[❌ 安全風險: .env 已追蹤]
    C1 -->|是| C2{使用 anon key?}
    
    C2 -->|否| S2[❌ 前端使用 service_role_key]
    C2 -->|是| C3{RLS 已啟用?}
    
    C3 -->|否| S3[❌ RLS 未啟用]
    C3 -->|是| C4{政策正確設定?}
    
    C4 -->|否| S4[⚠️ 政策需檢查]
    C4 -->|是| C5{測試跨組織隔離?}
    
    C5 -->|失敗| S5[❌ 隔離失敗]
    C5 -->|通過| C6{金鑰定期輪替?}
    
    C6 -->|否| S6[⚠️ 建議輪替金鑰]
    C6 -->|是| Pass[✅ 安全檢查通過]
    
    S1 --> Fix[修復安全問題]
    S2 --> Fix
    S3 --> Fix
    S4 --> Fix
    S5 --> Fix
    
    Fix --> Start
    S6 --> Plan[排程輪替]
    Plan --> Pass
    
    Pass --> Done([完成])
```

---

## 🔄 回滾流程

```mermaid
stateDiagram-v2
    [*] --> 部署完成
    
    部署完成 --> 發現問題: 測試失敗
    部署完成 --> 正常運作: 測試通過
    
    發現問題 --> 評估影響
    
    評估影響 --> 決策: 影響範圍?
    
    決策 --> 快速修復: 小問題
    決策 --> 計畫回滾: 嚴重問題
    
    快速修復 --> 熱修復
    熱修復 --> 驗證修復
    驗證修復 --> 正常運作: 成功
    驗證修復 --> 計畫回滾: 失敗
    
    計畫回滾 --> 備份檢查
    備份檢查 --> Dashboard回滾: 有備份
    備份檢查 --> SQL回滾: 無備份
    
    Dashboard回滾 --> 還原資料庫
    SQL回滾 --> 執行回滾SQL
    
    還原資料庫 --> 驗證回滾
    執行回滾SQL --> 驗證回滾
    
    驗證回滾 --> 正常運作: 成功
    驗證回滾 --> 聯絡支援: 失敗
    
    聯絡支援 --> 手動處理
    手動處理 --> 正常運作
    
    正常運作 --> [*]
```

---

## 📊 決策樹：選擇部署方法

```mermaid
graph TD
    Start{需要部署遷移} --> Q1{是否使用 GitHub?}
    
    Q1 -->|是| Q2{有 Copilot Agent 存取權?}
    Q1 -->|否| Q6{有本地環境?}
    
    Q2 -->|是| M1[✅ 使用 Supabase MCP]
    Q2 -->|否| Q3{需要自動化?}
    
    Q3 -->|是| M2[✅ 使用 GitHub Actions]
    Q3 -->|否| Q4{熟悉命令列?}
    
    Q4 -->|是| Q5{安裝了 Supabase CLI?}
    Q4 -->|否| M3[✅ 使用 Bash 腳本]
    
    Q5 -->|是| M4[✅ 使用 Supabase CLI]
    Q5 -->|否| M3
    
    Q6 -->|是| Q7{安裝了 psql?}
    Q6 -->|否| Contact[聯絡管理員]
    
    Q7 -->|是| M3
    Q7 -->|否| Install[安裝 PostgreSQL]
    Install --> M3
    
    M1 --> Explain1[最簡單，自動驗證]
    M2 --> Explain2[適合 CI/CD 流程]
    M3 --> Explain3[直接執行，完整控制]
    M4 --> Explain4[官方工具，穩定可靠]
```

---

## 🎯 最佳實踐路徑

```mermaid
journey
    title Supabase 遷移最佳實踐流程
    section 準備階段
      閱讀文檔: 5: User
      本地測試: 5: User
      備份資料庫: 5: User
    section 執行階段
      選擇方法: 4: User
      配置環境: 4: User
      執行遷移: 5: User
    section 驗證階段
      檢查表格: 5: System
      測試 RLS: 5: System
      測試查詢: 4: User
    section 完成階段
      更新文檔: 3: User
      通知團隊: 4: User
      監控運作: 5: User
```

---

## 📈 時間估算

| 階段 | Supabase MCP | Bash 腳本 | Supabase CLI | GitHub Actions |
|------|--------------|-----------|--------------|----------------|
| **準備** | 2 分鐘 | 5 分鐘 | 10 分鐘 | 15 分鐘 |
| **執行** | 自動 (2 分鐘) | 3 分鐘 | 2 分鐘 | 自動 (5 分鐘) |
| **驗證** | 自動 (1 分鐘) | 2 分鐘 | 2 分鐘 | 自動 (2 分鐘) |
| **總計** | ~5 分鐘 | ~10 分鐘 | ~14 分鐘 | ~22 分鐘 |

---

## 🔗 相關文檔連結

- [PR #63 部署指南](./PR63-DEPLOYMENT-GUIDE.md) - 完整步驟說明
- [Supabase MCP 指南](./supabase-mcp-guide.md) - MCP 工具使用
- [快速參考手冊](./QUICK-REFERENCE.md) - 指令速查表
- [Scripts README](../../scripts/README.md) - 腳本使用文檔

---

**建立日期**: 2025-12-12  
**版本**: 1.0.0  
**維護者**: GigHub Development Team
