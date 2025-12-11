# 重構檢查清單 (Refactoring Checklist)

本清單用於未來的重構工作，確保遵循已建立的架構規則和最佳實踐。

## 📋 依賴檢查 (Dependency Check)

### 在添加新導入前檢查 (Before Adding Imports)

- [ ] 確認導入符合依賴方向規則（Routes → Shared → Core）
- [ ] 檢查是否會創建循環依賴
- [ ] 優先使用具體導入而非批量導入
- [ ] 避免從 Core 導入 @shared

### 快速驗證命令 (Quick Verification Commands)

```bash
# 檢查 Core 是否非法導入 Shared
grep -r "from '@shared" src/app/core --include="*.ts"

# 檢查 Shared 是否非法導入 Routes
grep -r "from '@routes\|from '@features" src/app/shared --include="*.ts"

# 檢查是否有循環依賴
npx madge --circular --extensions ts src/app
```

## 🔍 代碼重複檢查 (Duplicate Code Check)

### 識別潛在重複 (Identify Potential Duplicates)

- [ ] 搜索相似的類別名稱
- [ ] 比較實現邏輯
- [ ] 檢查 Firestore 路徑差異
- [ ] 確認實際使用情況

### 決策標準 (Decision Criteria)

**保留條件**：
- ✅ 功能更完整
- ✅ 有實際使用
- ✅ 文檔更清楚
- ✅ 維護更好

**刪除條件**：
- ❌ 完全重複
- ❌ 無使用記錄
- ❌ 功能已過時

### 驗證非重複 (Verify Non-Duplicate)

特殊情況需要確認：

1. **不同的 Firestore 路徑**
   ```
   core/repositories/*       → 頂層集合
   blueprint/repositories/*  → Blueprint 子集合
   ```

2. **不同的數據模型**
   - 即使名稱相似，檢查介面定義
   - 確認欄位和類型差異

3. **不同的業務邏輯**
   - 檢查方法實現
   - 確認用途和職責

## 🧹 清理未使用代碼 (Clean Unused Code)

### 未使用導入 (Unused Imports)

檢查：
- [ ] 是否有導入但未使用的模組
- [ ] 是否有可以移除的 type-only imports
- [ ] 是否有重複的導入

工具：
```bash
# 使用 ESLint 檢查未使用的導入
npm run lint:ts

# 手動檢查特定檔案
grep "^import" src/app/path/to/file.ts
```

### 未使用的導出 (Unused Exports)

檢查：
- [ ] index.ts 中的導出是否都被使用
- [ ] 公開 API 是否有過時的導出
- [ ] 是否有可以改為 private 的成員

### 死代碼 (Dead Code)

尋找：
- [ ] 未被調用的函數
- [ ] 未被實例化的類別
- [ ] 註解掉的代碼區塊

## 📝 簡化機會 (Simplification Opportunities)

### 應用奧卡姆剃須刀 (Apply Occam's Razor)

1. **過度工程化** (Over-Engineering)
   - [ ] 是否有過多的抽象層級
   - [ ] 是否有不必要的設計模式
   - [ ] 是否有"以防萬一"的代碼

2. **複雜條件邏輯** (Complex Conditional Logic)
   - [ ] 可以用 Guard Clauses 簡化嗎
   - [ ] 可以用 Map/Dictionary 取代 Switch 嗎
   - [ ] 可以提取到獨立函數嗎

3. **重複邏輯** (Repeated Logic)
   - [ ] 是否有可以抽取的共用函數
   - [ ] 是否有可以合併的相似代碼
   - [ ] 是否有可以用工具函數替代的模式

### 簡化範例 (Simplification Examples)

#### Before (複雜):
```typescript
if (condition1) {
  if (condition2) {
    if (condition3) {
      // 深層巢狀
      doSomething();
    }
  }
}
```

#### After (簡化):
```typescript
if (!condition1) return;
if (!condition2) return;
if (!condition3) return;

doSomething();
```

## 🏗️ 架構改進 (Architecture Improvements)

### 組件位置檢查 (Component Location Check)

確認組件在正確的層級：

| 組件類型 | 正確位置 | 錯誤位置 |
|----------|----------|----------|
| UI 組件 | Routes/Features | Core |
| 業務邏輯 | Core (Services/Repositories) | Shared |
| 共享 UI | Shared | Core |
| 數據模型 | Core/Models | Routes |

### 移動組件步驟 (Component Movement Steps)

如果發現組件在錯誤位置：

1. [ ] 創建新位置的目錄
2. [ ] 複製組件到新位置
3. [ ] 更新所有導入路徑
4. [ ] 運行測試確認功能
5. [ ] 刪除舊組件
6. [ ] 提交更改

## 📚 文檔更新 (Documentation Updates)

### 必須更新的文檔 (Required Documentation)

重構後更新：
- [ ] README.md（如果影響使用方式）
- [ ] CHANGELOG.md（記錄重大更改）
- [ ] 架構圖（如果結構改變）
- [ ] API 文檔（如果介面改變）

### 代碼註解 (Code Comments)

添加註解說明：
- [ ] 為什麼做這個決策
- [ ] 替代方案的考慮
- [ ] 特殊情況的處理
- [ ] 外部依賴的理由

## ✅ 完成前檢查 (Final Checks)

### 代碼質量 (Code Quality)

- [ ] 運行 Lint 無錯誤
- [ ] 運行 Build 成功
- [ ] 運行測試全部通過
- [ ] 代碼審查通過

### 功能驗證 (Functional Verification)

- [ ] 現有功能無損
- [ ] 新功能正常工作
- [ ] 邊界情況處理
- [ ] 錯誤處理完整

### 效能驗證 (Performance Verification)

- [ ] Bundle 大小沒有顯著增加
- [ ] 載入時間沒有變慢
- [ ] 記憶體使用正常
- [ ] 無明顯效能退化

### 提交前清單 (Pre-Commit Checklist)

- [ ] Git status 確認變更範圍
- [ ] Commit message 清晰描述
- [ ] 相關文檔已更新
- [ ] PR 描述完整
- [ ] 標記相關 Issue

## 🎯 最佳實踐提醒 (Best Practices Reminder)

1. **最小化更改** - 一次只改一件事
2. **保持功能** - 重構不改變行為
3. **增量提交** - 小步快跑
4. **文檔同步** - 代碼和文檔一起更新
5. **團隊溝通** - 重大更改提前討論

## 📖 相關資源 (Related Resources)

- [依賴方向規則](./DEPENDENCY-RULES.md)
- [優化總結](./OPTIMIZATION-SUMMARY.md)
- [Angular 架構指南](../../.github/instructions/angular.instructions.md)
- [企業級架構模式](../../.github/instructions/enterprise-angular-architecture.instructions.md)

---

**記住**：重構的目標是讓代碼更好，而不是更複雜。始終遵循奧卡姆剃須刀原則：最簡單的解決方案通常是最好的。
