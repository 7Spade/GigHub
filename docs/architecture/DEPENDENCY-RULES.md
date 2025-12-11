# 依賴方向規則 (Dependency Direction Rules)

## 概述 (Overview)

本文檔定義了 GigHub 專案的依賴方向規則，確保代碼架構清晰、可維護且無循環依賴。

## 架構層級 (Architecture Layers)

```
┌─────────────────────────────────────────┐
│  Routes / Features (路由/功能層)        │  ← 最高層：UI 路由和功能模組
│  - src/app/routes/*                     │
│  - src/app/features/*                   │
└─────────────────────────────────────────┘
            ↓ 依賴方向
┌─────────────────────────────────────────┐
│  Shared (共享層)                         │  ← 中間層：共享 UI 組件和工具
│  - src/app/shared/*                     │
└─────────────────────────────────────────┘
            ↓ 依賴方向
┌─────────────────────────────────────────┐
│  Core (核心層)                           │  ← 基礎層：業務邏輯和數據訪問
│  - src/app/core/*                       │
└─────────────────────────────────────────┘
```

## 依賴規則 (Dependency Rules)

### ✅ 允許的依賴方向 (Allowed Dependencies)

1. **Routes/Features → Shared → Core**
   - Routes 可以導入 Shared 和 Core
   - Shared 可以導入 Core
   - Core 不能導入 Shared 或 Routes

2. **同層級模組間** (Within Same Layer)
   - 同層級模組可以互相導入（需謹慎避免循環依賴）

### ❌ 禁止的依賴方向 (Forbidden Dependencies)

1. **Core → Shared** (循環依賴)
2. **Core → Routes/Features** (反向依賴)
3. **Shared → Routes/Features** (反向依賴)

## 特殊情況處理 (Special Cases)

### Core 中的 UI 組件

**問題**：如果 Core 層需要 UI 組件（如 tasks.component.ts, logs.component.ts）？

**解決方案**：
1. **首選方案**：將 UI 組件移至 Routes 或 Features 層
2. **替代方案**：如必須保留在 Core，則：
   - ❌ 不能使用 `SHARED_IMPORTS`
   - ✅ 明確導入所需的具體模組
   - ✅ 只導入 Angular 核心和第三方 UI 庫（ng-zorro, @delon）

**範例**：
```typescript
// ❌ 錯誤：導入 SHARED_IMPORTS 會造成循環依賴
import { SHARED_IMPORTS } from '@shared';

// ✅ 正確：明確導入所需模組
import { CommonModule } from '@angular/common';
import { STModule } from '@delon/abc/st';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
```

## 模組別名映射 (Module Aliases)

專案使用以下別名（定義在 `tsconfig.json`）：

| 別名 | 路徑 | 層級 |
|------|------|------|
| `@core` | `src/app/core` | Core Layer |
| `@core/*` | `src/app/core/*` | Core Layer |
| `@shared` | `src/app/shared` | Shared Layer |
| `@shared/*` | `src/app/shared/*` | Shared Layer |
| `@routes/*` | `src/app/routes/*` | Routes Layer |
| `@features/*` | `src/app/features/*` | Features Layer |

## 驗證依賴方向 (Verify Dependencies)

### 手動檢查

```bash
# 檢查 Core 是否非法導入 Shared
grep -r "from '@shared" src/app/core --include="*.ts"

# 檢查 Shared 是否非法導入 Routes
grep -r "from '@routes\|from '@features" src/app/shared --include="*.ts"
```

### 預期結果
- Core 層應該 **沒有** 從 `@shared` 的導入
- Shared 層應該 **沒有** 從 `@routes` 或 `@features` 的導入

## 重複代碼處理 (Handling Duplicates)

### 識別重複

在不同層級發現相似功能時：

1. **檢查用途**：確認是否真的重複
2. **分析差異**：比較實現細節
3. **決定保留**：選擇功能更完整、維護更好的版本

### 範例：Repository 重複

**情況**：`audit-log.repository.ts` 有兩個版本

**分析**：
- `core/repositories/audit-log.repository.ts` - 44 行，簡單版本
- `core/blueprint/repositories/audit-log.repository.ts` - 385 行，完整版本

**決策**：保留 blueprint 版本，刪除 core 版本

**判斷非重複的例子**：
- `core/repositories/task.repository.ts` - 頂層 `tasks` 集合
- `core/blueprint/.../tasks.repository.ts` - 子集合 `blueprints/{id}/tasks`
- 這兩個操作不同的 Firestore 路徑，**不是重複**

## 重構指南 (Refactoring Guidelines)

### 修復循環依賴的步驟

1. **識別循環**：找出形成循環的導入鏈
2. **分析依賴**：確定每個模組實際需要的功能
3. **重構導入**：
   - 移除不必要的導入
   - 用具體模組替換通用導入（如 SHARED_IMPORTS）
   - 考慮移動組件到正確的層級
4. **驗證修復**：檢查不再有循環依賴

### 應用奧卡姆剃須刀 (Occam's Razor)

在優化時遵循簡化原則：

1. **消除重複**：移除真正重複的代碼
2. **簡化導入**：只導入需要的內容
3. **減少複雜度**：避免過度工程化
4. **保持功能**：確保簡化不影響功能

## 最佳實踐 (Best Practices)

1. **明確導入** (Explicit Imports)
   - 優先使用具體的模組導入
   - 避免桶式導入（barrel imports）除非確實需要

2. **最小依賴** (Minimal Dependencies)
   - 只導入真正需要的模組
   - 定期審查和清理未使用的導入

3. **單向數據流** (Unidirectional Data Flow)
   - 數據應該從上層流向下層
   - 使用事件或回調處理反向通信

4. **文檔化決策** (Document Decisions)
   - 記錄重要的架構決策
   - 說明為什麼選擇特定的實現方式

## 檢查清單 (Checklist)

新增或修改代碼時，檢查：

- [ ] 導入是否遵循依賴方向規則
- [ ] 是否有不必要的導入
- [ ] 是否創造了循環依賴
- [ ] 是否可以簡化代碼
- [ ] 是否有重複的實現

## 相關文檔 (Related Documentation)

- [Angular 架構指南](./ANGULAR-ARCHITECTURE.md)
- [企業級架構模式](../../.github/instructions/enterprise-angular-architecture.instructions.md)
- [TypeScript 開發指引](../../.github/instructions/typescript-5-es2022.instructions.md)

## 更新日誌 (Change Log)

### 2025-12-11
- 初始版本
- 修復 core/blueprint 組件的循環依賴問題
- 移除重複的 audit-log.repository.ts
- 建立依賴規則文檔
