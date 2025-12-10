---
mode: agent
model: Claude Sonnet 4
---

<!-- markdownlint-disable-file -->

# 實作提示：SETC 工作流程文檔 (Implementation Prompt: SETC Workflow Documentation)

## 實作指令 (Implementation Instructions)

### 步驟 1：建立變更追蹤檔案 (Step 1: Create Changes Tracking File)

您**必須**在 #file:../changes/ 中建立 `20251209-setc-workflow-changes.md`（如果不存在）。

變更檔案**必須**追蹤 SETC 工作流程文檔實作期間所做的所有修改。

### 步驟 2：執行實作 (Step 2: Execute Implementation)

您**必須**遵循 #file:../../.github/instructions/task-implementation.instructions.md（如果可用），或遵循以下指引：

1. 您**必須**系統性地實作 #file:../plans/20251209-setc-workflow-plan.instructions.md 逐任務進行
2. 您**必須**遵循來自 `.github/instructions/` 的所有專案標準和慣例
3. 您**必須**在每個完成的任務後更新變更追蹤檔案
4. 您**必須**在計畫檔案中將完成的任務標記為 `[x]`
5. 您**必須**在繼續之前驗證每個任務的成功標準

**實作順序 (Implementation Order)**:

**階段 1：研究文檔 (Phase 1: Research Documentation)**
- 任務 1.1: 分析 task-researcher 代理能力
- 任務 1.2: 分析 task-planner 代理工作流程
- 任務 1.3: 審查架構文檔
- 任務 1.4: 提取工作流程模式和模板

**階段 2：計畫檔案建立 (Phase 2: Planning File Creation)**
- 任務 2.1: 建立包含實作階段的計畫檔案
- 任務 2.2: 建立包含任務規格的詳細檔案
- 任務 2.3: 建立實作提示檔案
- 任務 2.4: 建立行號交叉參照

**階段 3：模板文檔 (Phase 3: Template Documentation)**
- 任務 3.1: 記錄研究模板結構
- 任務 3.2: 記錄計畫模板結構
- 任務 3.3: 記錄詳細資訊模板結構
- 任務 3.4: 記錄實作提示模板

**階段 4：工作流程處理文檔 (Phase 4: Workflow Process Documentation)**
- 任務 4.1: 記錄 SETC 工作流程階段
- 任務 4.2: 記錄品質標準
- 任務 4.3: 記錄佔位符替換系統
- 任務 4.4: 記錄交叉參照管理

**階段 5：驗證與最終確定 (Phase 5: Validation & Finalization)**
- 任務 5.1: 驗證所有模板佔位符已替換
- 任務 5.2: 驗證行號交叉參照
- 任務 5.3: 確認符合標準
- 任務 5.4: 完成文檔審查

**關鍵 (CRITICAL)**: 如果 ${input:phaseStop:true} 為 true，您**必須**在每個階段後停止以供使用者審查。  
**關鍵 (CRITICAL)**: 如果 ${input:taskStop:false} 為 true，您**必須**在每個任務後停止以供使用者審查。

### 步驟 3：清理 (Step 3: Cleanup)

當所有階段都已勾選 (`[x]`) 並完成時，您**必須**執行以下操作：

1. 您**必須**提供 markdown 樣式連結和來自 #file:../changes/20251209-setc-workflow-changes.md 的所有變更摘要給使用者：

   - 您**必須**保持整體摘要簡潔
   - 您**必須**在任何清單周圍添加間距
   - 您**必須**將任何檔案參照包裝在 markdown 樣式連結中

   **範例摘要格式 (Example Summary Format)**:
   ```markdown
   ## SETC 工作流程文檔完成 (SETC Workflow Documentation Complete)

   所有 SETC 工作流程文檔已成功建立並驗證。

   ### 已建立的檔案 (Files Created)

   - [研究檔案 (Research File)](.copilot-tracking/research/20251209-setc-workflow-research.md) - 全面的 SETC 工作流程分析
   - [計畫檔案 (Plan File)](.copilot-tracking/plans/20251209-setc-workflow-plan.instructions.md) - 實作檢查清單
   - [詳細檔案 (Details File)](.copilot-tracking/details/20251209-setc-workflow-details.md) - 任務規格
   - [提示檔案 (Prompt File)](.copilot-tracking/prompts/implement-setc-workflow.prompt.md) - 實作提示

   ### 主要成就 (Key Accomplishments)

   - 記錄了從研究到實作的完整 SETC 工作流程
   - 為所有檔案類型建立了可重用的模板
   - 建立了品質標準和驗證程序
   - 實作了行號交叉參照系統

   ### 下一步 (Next Steps)

   - 審查文檔的準確性
   - 使用新任務測試 SETC 工作流程
   - 根據需要歸檔或清理計畫檔案
   ```

2. 您**必須**提供以下文檔的 markdown 樣式連結並建議清理它們：
   - [.copilot-tracking/plans/20251209-setc-workflow-plan.instructions.md](.copilot-tracking/plans/20251209-setc-workflow-plan.instructions.md)
   - [.copilot-tracking/details/20251209-setc-workflow-details.md](.copilot-tracking/details/20251209-setc-workflow-details.md)
   - [.copilot-tracking/research/20251209-setc-workflow-research.md](.copilot-tracking/research/20251209-setc-workflow-research.md)

3. **強制 (MANDATORY)**: 您**必須**在成功完成後嘗試刪除 `.copilot-tracking/prompts/implement-setc-workflow.prompt.md`。

## 成功標準 (Success Criteria)

- [ ] 在 `.copilot-tracking/changes/` 中建立變更追蹤檔案
- [ ] 所有 5 個階段完成，所有任務標記為 `[x]`
- [ ] 研究檔案全面且遵循模板
- [ ] 計畫檔案完整且交叉參照準確
- [ ] 詳細檔案完整且包含所有任務規格
- [ ] 實作提示檔案已建立（本檔案）
- [ ] 所有行號交叉參照已驗證
- [ ] 所有模板佔位符已替換為實際內容
- [ ] 全程遵循專案慣例
- [ ] 文檔可立即使用
- [ ] 變更檔案在整個實作過程中持續更新

## 給實作代理的注意事項 (Notes for Implementation Agent)

**研究階段 (Research Phase)**:
- 研究檔案已建立且內容全面
- 專注於驗證完整性和準確性
- 確保所有代理能力都已記錄

**計畫階段 (Planning Phase)**:
- 計畫、詳細資訊和提示檔案已建立
- 驗證所有交叉參照準確
- 確保行號指向正確的部分

**模板文檔 (Template Documentation)**:
- 從代理檔案中提取模板
- 為每個模板提供清晰的範例
- 記錄佔位符慣例

**工作流程文檔 (Workflow Documentation)**:
- 記錄完整的 SETC 流程
- 包含品質標準和驗證程序
- 說明交叉參照管理

**驗證 (Validation)**:
- 驗證沒有剩餘的佔位符
- 驗證所有行號參照
- 確認符合標準
- 完成最終文檔審查
