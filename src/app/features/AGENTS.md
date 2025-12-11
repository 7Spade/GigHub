# Features Module Agent Guide

The Features module contains reusable, independent feature modules that can be used across different parts of the application.

## Module Purpose

**規則**:
- Features 模組提供可重用的功能元件
- Features 應該是獨立的，不依賴特定路由
- Features 可以延遲載入
- Features 包含完整的功能邏輯（元件、服務、模型）
- Features 遵循 standalone component 模式

## Module Structure

**規則**:
- `src/app/features/AGENTS.md` - 本文件
- `src/app/features/module-manager/` - Blueprint 模組管理器
  - `components/` - 功能子元件（module-card、module-config-form、module-dependency-graph、module-status-badge）
  - `module-manager.component.ts` - 主要功能元件
  - `module-manager.service.ts` - 功能服務層
  - `module-manager.routes.ts` - 路由配置
  - `index.ts` - 公開 API

## Module Manager Feature

### Purpose

**規則**:
- 提供 Blueprint 模組的圖形化管理介面
- 顯示已安裝模組的狀態和資訊
- 支援模組啟用/停用
- 支援模組配置編輯
- 顯示模組依賴關係圖
- 提供模組健康狀態監控

### Architecture

**規則**:
- 必須使用 Signal-based 狀態管理
- 必須使用 `@core/blueprint/repositories` 存取資料
- 必須使用 `@core/models` 定義資料模型
- 必須使用 standalone components
- 必須從 `@shared` 匯入 `SHARED_IMPORTS`

### Components

#### module-manager.component.ts

**規則**:
- 主要容器元件
- 管理整體模組列表視圖
- 處理模組過濾和搜尋
- 協調子元件互動
- 使用 `OnPush` 變更檢測

#### module-card.component.ts

**規則**:
- 顯示單一模組資訊卡片
- 顯示模組名稱、版本、狀態
- 提供快速操作按鈕（啟用/停用）
- 使用 `input()` 接收模組資料
- 使用 `output()` 發送事件

#### module-config-form.component.ts

**規則**:
- 動態表單元件
- 根據模組 schema 生成表單欄位
- 支援表單驗證
- 使用 `@delon/form` 進行動態表單生成
- 使用 reactive forms

#### module-dependency-graph.component.ts

**規則**:
- 視覺化模組依賴關係
- 使用圖形庫（如 D3.js 或 Cytoscape.js）
- 顯示模組間的依賴箭頭
- 支援拖拽調整佈局
- 高亮顯示循環依賴

#### module-status-badge.component.ts

**規則**:
- 顯示模組狀態徽章
- 支援多種狀態（enabled、disabled、running、failed）
- 使用 `nz-badge` 元件
- 使用 `input()` 接收狀態

### Service

#### module-manager.service.ts

**規則**:
- 提供模組管理的業務邏輯
- 使用 `BlueprintModuleRepository` 存取資料
- 使用 `AuditLogRepository` 記錄操作
- 提供 Signal-based 狀態：`modules()`、`loading()`、`error()`
- 提供計算統計：`statistics()`
- 提供操作方法：`loadModules()`、`enableModule()`、`disableModule()`、`updateModuleConfig()`
- 必須使用 `inject()` 進行依賴注入
- 必須使用 `providedIn: 'root'` 或在元件層級提供

## Import Conventions

**規則**:
- Models：`import { BlueprintModuleDocument } from '@core/models'`
- Repositories：`import { BlueprintModuleRepository } from '@core/blueprint/repositories'`
- Shared UI：`import { SHARED_IMPORTS } from '@shared'`
- 不使用相對路徑匯入 core 或 shared

## Testing

**規則**:
- 必須為每個元件提供單元測試
- 必須 mock repositories 和外部依賴
- 必須測試 Signal 狀態變更
- 必須測試用戶互動流程
- 必須使用 `TestBed` 配置測試環境

## Routes Configuration

**規則**:
- 路由定義在 `module-manager.routes.ts`
- 可以延遲載入整個功能
- 路由應該可以整合到父路由配置中
- 範例路由：`{ path: 'module-manager', loadComponent: () => import('./module-manager.component').then(m => m.ModuleManagerComponent) }`
