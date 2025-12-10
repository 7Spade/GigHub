# Copilot 追蹤目錄 (Copilot Tracking Directory)

本目錄包含 SETC (Serialized Executable Task Chain，序列化可執行任務鏈) 工作流程，用於管理 GigHub 專案中的複雜實作任務。

## 目錄結構 (Directory Structure)

```
.copilot-tracking/
├── research/       # 來自 task-researcher 代理的研究文檔
├── plans/          # 來自 task-planner 代理的實作計畫清單
├── details/        # 帶有程式碼範例的詳細任務規格
├── prompts/        # 代理可執行的實作提示
└── changes/        # 實作進度追蹤
```

## SETC 工作流程 (SETC Workflow)

**SETC (Serialized Executable Task Chain，序列化可執行任務鏈)** 是一種結構化的複雜實作方法：

1. **研究階段 (Research Phase)** → task-researcher 代理
   - 使用所有可用工具進行深入分析
   - 以證據記錄已驗證的發現
   - 提取模式、範例和需求
   - 指導向最佳方法

2. **計畫階段 (Planning Phase)** → task-planner 代理
   - 建立包含階段和任務的計畫清單
   - 編寫帶有規格的實作細節
   - 生成代理可執行的提示
   - 確保準確的交叉參照

3. **實作階段 (Implementation Phase)** → 實作代理
   - 系統性地遵循計畫
   - 在每個階段後驗證
   - 更新變更追蹤檔案
   - 持續執行測試

4. **驗證階段 (Validation Phase)** → 審查
   - 完成所有成功標準
   - 通過所有測試
   - 達成效能基準
   - 更新文檔

## 當前 SETC：Blueprint 架構重構 (Current SETC: Blueprint Architecture Refactoring)

### 已建立檔案 (Files Created) (2025-12-09)

1. **研究 (Research)**: `research/20251209-blueprint-architecture-analysis-research.md` (377 行)
   - 來源：`docs/GigHub_Blueprint_Architecture.md` (1910 行)
   - 架構模式：Hexagonal, DDD, CQRS, Event-Driven
   - 提取的 5 階段實作策略
   - 已記錄的技術需求

2. **計畫 (Plan)**: `plans/20251209-blueprint-architecture-plan.instructions.md` (13KB)
   - 10 週內 5 個階段
   - 75+ 個帶核取方塊的子任務
   - 每個階段的成功標準
   - 交叉參照到詳細檔案

3. **詳細資訊 (Details)**: `details/20251209-blueprint-architecture-details.md` (12KB)
   - 帶程式碼範例的任務規格
   - 新增/修改檔案的檔案路徑
   - 實作指引
   - 測試需求

4. **提示 (Prompt)**: `prompts/implement-blueprint-architecture.prompt.md` (8.4KB)
   - 代理可執行指令
   - 逐步驗證
   - 回滾程序
   - 監控指引

### 實作階段 (Implementation Phases)

**階段 1：基礎重構 (Phase 1: Foundation Refactoring) (第 1-2 週)**
- 領域層結構
- Facade 模式
- Event Bus 基礎設施
- UI 元件更新

**階段 2：命令/查詢分離 (Phase 2: Command/Query Separation) (第 3-4 週)**
- 命令處理器
- 查詢處理器
- Blueprint 聚合
- CQRS 實作

**階段 3：儲存庫抽象 (Phase 3: Repository Abstraction) (第 5-6 週)**
- 儲存庫介面
- Firestore 實作
- Supabase 骨架
- 依賴注入

**階段 4：事件驅動整合 (Phase 4: Event-Driven Integration) (第 7-8 週)**
- 事件發布
- 事件訂閱者
- 審計追蹤
- 事件重播

**階段 5：模組系統與潤色 (Phase 5: Module System & Polish) (第 9-10 週)**
- 模組註冊表
- 功能模組
- 效能優化
- 文檔與培訓

## 使用說明 (Usage Instructions)

### 給開發者 (For Developers)

1. **開始新實作 (Starting New Implementation)**:
   ```bash
   # 首先閱讀研究文檔
   cat .copilot-tracking/research/20251209-blueprint-architecture-analysis-research.md
   
   # 審查計畫清單
   cat .copilot-tracking/plans/20251209-blueprint-architecture-plan.instructions.md
   
   # 建立變更追蹤檔案
   touch .copilot-tracking/changes/20251209-blueprint-architecture-changes.md
   ```

2. **實作期間 (During Implementation)**:
   - 逐階段遵循計畫
   - 參照詳細檔案以了解規格
   - 每個任務後更新變更檔案
   - 每個子任務後執行測試

3. **驗證 (Validation)**:
   - 檢查每個階段的成功標準
   - 執行完整測試套件
   - 效能基準測試
   - 程式碼審查

### 給 AI 代理 (For AI Agents)

1. **研究代理 (Research Agent)**:
   - 使用 task-researcher.agent.md 指令
   - 僅在 `research/` 目錄中建立檔案
   - 以證據記錄已驗證的發現
   - 指導向單一推薦方法

2. **計畫代理 (Planning Agent)**:
   - 使用 task-planner.agent.md 指令
   - 首先驗證研究是否存在
   - 建立三個檔案：計畫、詳細資訊、提示
   - 使用基於模板的方法與佔位符

3. **實作代理 (Implementation Agent)**:
   - 閱讀提示檔案以了解指令
   - 遵循系統性的逐階段方法
   - 持續更新變更檔案
   - 在檢查點進行驗證

## 最佳實務 (Best Practices)

### 研究品質 (Research Quality)
- ✅ 基於實際工具使用的證據
- ✅ 全面涵蓋所有方面
- ✅ 可操作的實作指引
- ✅ 當前且最新的資訊
- ✅ 單一推薦方法（評估後）

### 計畫品質 (Planning Quality)
- ✅ 可操作且具體的動詞
- ✅ 研究驅動的決策
- ✅ 實作就緒且有足夠細節
- ✅ 組織良好的邏輯進展
- ✅ 準確的交叉參照

### 實作品質 (Implementation Quality)
- ✅ 系統性地遵循計畫
- ✅ 持續更新文檔
- ✅ 符合標準的程式碼
- ✅ 每個階段都經過測試
- ✅ 可追溯到計畫項目

## 成功標準 (Success Criteria)

### 技術成功 (Technical Success)
- [ ] 所有階段完成
- [ ] 80%+ 測試覆蓋率
- [ ] 達成效能目標
- [ ] 無退化
- [ ] 實作乾淨架構

### 流程成功 (Process Success)
- [ ] 研究全面
- [ ] 計畫詳細且可操作
- [ ] 實作系統性
- [ ] 文檔完整
- [ ] 團隊接受培訓

### 業務成功 (Business Success)
- [ ] 遷移期間無停機時間
- [ ] 功能速度改善
- [ ] 更容易添加新功能
- [ ] 更好的可維護性
- [ ] 減少技術債務

## 參考資料 (References)

- **代理指令 (Agent Instructions)**: `.github/agents/`
  - `task-researcher.agent.md` - 研究專家
  - `task-planner.agent.md` - 計畫專家
  
- **專案標準 (Project Standards)**: `.github/instructions/`
  - `angular.instructions.md` - Angular 20 模式
  - `typescript-5-es2022.instructions.md` - TypeScript 標準
  - `ng-alain-delon.instructions.md` - 企業級模式
  - `enterprise-angular-architecture.instructions.md` - DDD & SOLID

- **架構文檔 (Architecture Docs)**: `docs/`
  - `GigHub_Blueprint_Architecture.md` - Blueprint 模組規格
  - `GigHub_Architecture.md` - 整體系統架構

---

**最後更新 (Last Updated)**: 2025-12-09  
**當前 SETC (Current SETC)**: Blueprint 架構重構  
**狀態 (Status)**: 計畫完成，準備實作  
**預估時間 (Estimated Duration)**: 10 週 (400-500 小時)
