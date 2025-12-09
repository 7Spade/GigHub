# GigHub - 工地施工進度追蹤管理系統

AI 程式代理指南 - 快速開始文件

## 專案概覽

**技術棧**: Angular 20 + ng-alain + Firebase + TypeScript 5.9  
**架構**: 三層式企業架構 (Foundation → Container → Business)  
**套件管理**: Yarn 4.9.2

### 快速指令

```bash
# 開發
yarn start              # 啟動開發伺服器 (http://localhost:4200)

# 建置
yarn build              # 生產環境建置

# 程式碼品質
yarn lint               # ESLint + Stylelint
yarn test               # 執行單元測試
yarn test-coverage      # 測試覆蓋率報告
```

## 目錄結構與 AGENTS.md 層級

```
/                           # [根 AGENTS.md] 專案概覽
├── src/app/                # [應用層 AGENTS.md] Angular 應用架構
│   ├── core/               # [核心層 AGENTS.md] 全域服務、守衛
│   ├── shared/             # [共享層 AGENTS.md] 可重用元件
│   ├── layout/             # [佈局層 AGENTS.md] 版面配置元件
│   └── routes/             # [路由層 AGENTS.md] 功能模組
│       └── blueprint/      # [Blueprint AGENTS.md] 藍圖模組細節
```

**層級原則**: 最近的 AGENTS.md 優先生效，上層提供通用上下文。

## 開發環境提示

- **後端**: 使用 Firebase/Firestore (`@angular/fire 20.0.1`)，Supabase 僅用於統計查詢
- **元件**: 使用 Standalone Components + Signals (Angular 20)
- **樣式**: 匯入 `SHARED_IMPORTS` 避免重複模組匯入
- **狀態**: 優先使用 `signal()`、`computed()`、`effect()`
- **相依注入**: 使用 `inject()` 函式而非 constructor
- **訂閱管理**: 使用 `takeUntilDestroyed()` 自動清理
- **變更偵測**: 預設使用 `OnPush` 策略
- **資料庫操作**: 透過 Repository 模式存取 Firestore

### 程式碼風格範例

```typescript
import { Component, signal, computed, inject } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [SHARED_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <nz-spin />
    } @else {
      <div>{{ data() }}</div>
    }
  `
})
export class ExampleComponent {
  private service = inject(MyService);
  
  loading = signal(false);
  data = signal<string>('');
  computed Data = computed(() => this.data().toUpperCase());
}
```

## 測試指引

- **單元測試**: `yarn test` (Jasmine + Karma)
- **E2E 測試**: `yarn e2e` (位於 `/e2e/` 目錄)
- **測試覆蓋率**: 目標 Domain 層 > 85%、Application 層 > 80%
- **命名規範**: `MethodName_Condition_ExpectedResult()`
- **測試原則**: 
  - 測試業務邏輯而非框架
  - 使用 `TestBed` 進行元件測試
  - Mock 外部相依（Firestore、Auth）
  - 使用 `provideHttpClientTesting` 模擬 HTTP 請求

## PR 提交規範

- **標題格式**: `[模組名稱] 變更描述`
- **提交前檢查**:
  ```bash
  yarn lint          # ESLint + Stylelint 通過
  yarn test          # 所有測試通過
  yarn build         # 建置成功
  ```
- **程式碼審查重點**:
  - [ ] 使用 Standalone Components
  - [ ] 使用 Signals 管理狀態
  - [ ] 使用 `inject()` 相依注入
  - [ ] 使用 `takeUntilDestroyed()` 管理訂閱
  - [ ] 實作 Firestore Security Rules
  - [ ] 新增或更新測試
  - [ ] JSDoc 註解完整
  - [ ] 無 TypeScript strict mode 錯誤

## 關鍵原則

1. **奧卡姆剃刀**: 保持簡單，避免過度工程
2. **型別安全**: TypeScript strict mode，避免 `any`
3. **模組化**: 清晰的模組邊界與職責
4. **安全性**: 實作 Firestore Security Rules
5. **文件化**: 更新相關 AGENTS.md 文件
6. **測試**: 關鍵業務邏輯必須有測試
7. **無障礙**: 遵循 WCAG 2.1 準則
8. **效能**: OnPush 變更偵測 + 延遲載入

## 詳細文檔

- **應用層**: 查看 `src/app/AGENTS.md`
- **核心服務**: 查看 `src/app/core/AGENTS.md`
- **共享元件**: 查看 `src/app/shared/AGENTS.md`
- **路由模組**: 查看 `src/app/routes/AGENTS.md`
- **Blueprint 模組**: 查看 `src/app/routes/blueprint/AGENTS.md`
- **佈局元件**: 查看 `src/app/layout/AGENTS.md`
- **架構文檔**: 查看 `/docs/architecture/`
- **指引文檔**: 查看 `/.github/instructions/`

---

**版本**: 2.0.0 (簡化版)  
**最後更新**: 2025-12-09  
**維護**: GigHub 開發團隊
