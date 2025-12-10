---
mode: agent
model: Claude Sonnet 4
---

<!-- markdownlint-disable-file -->

# 實作提示：Blueprint 模組實作 (Implementation Prompt: Blueprint Module Implementation)

## 實作指令 (Implementation Instructions)

### 步驟 1：建立變更追蹤檔案 (Step 1: Create Changes Tracking File)

您**必須**在 #file:../changes/ 中建立 `20251209-blueprint-implementation-changes.md`（如果不存在）。

### 步驟 2：執行實作 (Step 2: Execute Implementation)

您**必須**遵循 #file:../../.github/instructions/task-implementation.instructions.md
您**必須**系統性地實作 #file:../plans/20251209-blueprint-implementation-plan.instructions.md 逐任務進行
您**必須**遵循所有專案標準和慣例

**關鍵 (CRITICAL)**: 如果 ${input:phaseStop:true} 為 true，您**必須**在每個階段後停止以供使用者審查。
**關鍵 (CRITICAL)**: 如果 ${input:taskStop:false} 為 true，您**必須**在每個任務後停止以供使用者審查。

### 步驟 3：清理 (Step 3: Cleanup)

當所有階段都已勾選 (`[x]`) 並完成時，您**必須**執行以下操作：

1. 您**必須**提供 markdown 樣式連結和來自 #file:../changes/20251209-blueprint-implementation-changes.md 的所有變更摘要給使用者：

   - 您**必須**保持整體摘要簡潔
   - 您**必須**在任何清單周圍添加間距
   - 您**必須**將任何檔案參照包裝在 markdown 樣式連結中

2. 您**必須**提供 .copilot-tracking/plans/20251209-blueprint-implementation-plan.instructions.md、.copilot-tracking/details/20251209-blueprint-implementation-details.md 和 .copilot-tracking/research/20251209-blueprint-implementation-research.md 文檔的 markdown 樣式連結。您**必須**建議也清理這些檔案。
3. **強制 (MANDATORY)**: 您**必須**嘗試刪除 .copilot-tracking/prompts/implement-blueprint.prompt.md

## 成功標準 (Success Criteria)

- [ ] 變更追蹤檔案已建立
- [ ] 所有計畫項目已實作且程式碼正常運作
- [ ] 所有詳細規格已滿足
- [ ] 已遵循專案慣例
- [ ] 變更檔案持續更新
