# 廢棄檔案清單 (Deprecated Files)

> **版本**: v1.0.0  
> **日期**: 2025-12-13  
> **狀態**: Phase 1.3 - 標記廢棄階段

---

## 📋 概述

本文件列出已標記為廢棄（deprecated）的檔案，以及對應的遷移路徑。這些檔案將在未來版本中移除。

**策略**: 遵循**奧卡姆剃刀原則**與**減法思維**
- ✅ 先標記廢棄（非破壞性、零風險）
- ✅ 保留選擇權（可隨時回滾）
- ✅ 逐步遷移（後續 PR 處理）

---

## 🔴 Core Repositories（核心 Repository）

### 1. TaskRepository

**檔案位置**: `src/app/core/repositories/task.repository.ts`

**狀態**: ⚠️  **已廢棄** (Deprecated)

**問題**:
- 缺少 Retry 機制
- 無基礎類別（重複程式碼）
- 錯誤處理不完整
- 缺少 restore() 功能

**遷移至**: `TaskFirestoreRepository`

**位置**: `src/app/core/repositories/task-firestore.repository.ts`

**優勢**:
- ✅ 繼承 `FirestoreBaseRepository`（企業級基礎）
- ✅ 自動 Retry 機制（3 次重試）
- ✅ 完整錯誤處理與日誌
- ✅ 支援 soft delete（restore 功能）
- ✅ 欄位映射（snake_case ↔ camelCase）
- ✅ countByStatus() 統計功能

**遷移範例**:

```typescript
// ❌ 舊寫法（已廢棄）
import { TaskRepository } from '@core/repositories/task.repository';

constructor(private taskRepo: TaskRepository) {}

async loadTasks() {
  return this.taskRepo.findAll().subscribe(tasks => {
    console.log(tasks);
  });
}

// ✅ 新寫法（建議）
import { TaskFirestoreRepository } from '@core/repositories/task-firestore.repository';

constructor(private taskRepo: TaskFirestoreRepository) {}

async loadTasks() {
  const tasks = await this.taskRepo.findAll();
  console.log(tasks);
}
```

**預估影響範圍**: 15-20 個檔案

**遷移工作量**: 1-2 小時

---

### 2. LogRepository

**檔案位置**: `src/app/core/repositories/log.repository.ts`

**狀態**: ⚠️  **已廢棄** (Deprecated)

**問題**:
- 缺少 Retry 機制
- 無基礎類別
- 照片管理邏輯分散

**遷移至**: `LogFirestoreRepository`

**位置**: `src/app/core/repositories/log-firestore.repository.ts`

**優勢**:
- ✅ 繼承 `FirestoreBaseRepository`
- ✅ 自動 Retry 機制
- ✅ 完整錯誤處理
- ✅ 整合照片管理功能
- ✅ 欄位映射支援

**遷移範例**:

```typescript
// ❌ 舊寫法（已廢棄）
import { LogRepository } from '@core/repositories/log.repository';

constructor(private logRepo: LogRepository) {}

async createLog(log: CreateLogRequest) {
  return this.logRepo.create(log).subscribe(result => {
    console.log(result);
  });
}

// ✅ 新寫法（建議）
import { LogFirestoreRepository } from '@core/repositories/log-firestore.repository';

constructor(private logRepo: LogFirestoreRepository) {}

async createLog(log: CreateLogRequest) {
  const result = await this.logRepo.create(log);
  console.log(result);
}
```

**預估影響範圍**: 5-10 個檔案

**遷移工作量**: 1 小時

---

### 3. Blueprint Tasks Repository

**檔案位置**: `src/app/core/blueprint/modules/implementations/tasks/tasks.repository.ts`

**狀態**: ⚠️  **需整合** (To be Integrated)

**問題**:
- 位置錯誤（應在 core/repositories）
- 命名不一致（複數 tasks vs 單數 task）
- 功能重複（與 TaskRepository/TaskFirestoreRepository）

**特殊功能**:
- ✅ 支援 Blueprint 子集合: `blueprints/{id}/tasks`
- ✅ 擴展欄位（6 個）:
  - `startDate`
  - `completedDate`
  - `estimatedHours`
  - `actualHours`
  - `dependencies`
  - `subtasks`

**整合策略**:
1. 保留 Blueprint 子集合邏輯
2. 整合擴展欄位到 `TaskFirestoreRepository`
3. 統一為單一 Repository
4. 移除此檔案

**遷移計畫**: Phase 1.4（下一階段）

**預估影響範圍**: 10-15 個檔案（Blueprint 模組內）

**遷移工作量**: 2-3 小時

---

## 📊 統計摘要

| 檔案 | 狀態 | 建議遷移至 | 影響檔案數 | 工作量 |
|------|------|-----------|-----------|--------|
| TaskRepository | ⚠️  已廢棄 | TaskFirestoreRepository | 15-20 | 1-2h |
| LogRepository | ⚠️  已廢棄 | LogFirestoreRepository | 5-10 | 1h |
| Blueprint tasks.repository | 🔄 待整合 | TaskFirestoreRepository | 10-15 | 2-3h |
| **總計** | | | **30-45** | **4-6h** |

---

## 🚀 遷移時間表

### Phase 1.3 ✅（當前階段 - 已完成）
- [x] 標記 TaskRepository 為 @deprecated
- [x] 標記 LogRepository 為 @deprecated
- [x] 建立遷移文檔（本文件）
- [x] 驗證 Build（無破壞）

### Phase 1.4（下一階段）
- [ ] 逐步遷移 TaskRepository 引用
- [ ] 逐步遷移 LogRepository 引用
- [ ] 整合 Blueprint tasks.repository 功能
- [ ] 執行完整測試驗證

### Phase 1.5（清理階段）
- [ ] 移除已廢棄檔案
- [ ] 更新匯入路徑
- [ ] 更新文檔

---

## ⚠️  注意事項

### 對開發者的建議

1. **新功能開發**: 直接使用 `TaskFirestoreRepository` 和 `LogFirestoreRepository`
2. **修復 Bug**: 在現有檔案修復，但計畫遷移
3. **重構工作**: 優先遷移到新 Repository

### 回滾策略

如需回滾標記廢棄：

```bash
# 移除 @deprecated 標記即可（零風險）
git checkout HEAD~1 -- src/app/core/repositories/task.repository.ts
git checkout HEAD~1 -- src/app/core/repositories/log.repository.ts
```

---

## 📖 相關文件

- **分析報告**: [PHASE1-2-TASK-REPOSITORY-ANALYSIS.md](./progress/PHASE1-2-TASK-REPOSITORY-ANALYSIS.md)
- **完整架構分析**: [ARCHITECTURE_ANALYSIS.md](../ARCHITECTURE_ANALYSIS.md)
- **重構計畫**: [REFACTORING_IMPLEMENTATION_PLAN.md](./plans/REFACTORING_IMPLEMENTATION_PLAN.md)
- **風險評估**: [RISK_ASSESSMENT.md](./plans/RISK_ASSESSMENT.md)

---

## 🤝 支援

如有問題或需協助遷移，請：
1. 查閱相關文件
2. 建立 GitHub Issue（標籤: `refactoring`, `migration`）
3. 聯繫團隊架構負責人

---

**最後更新**: 2025-12-13  
**維護者**: GigHub 開發團隊
