# Shared Components Agent Guide

The Shared module contains reusable components, services, pipes, directives, and utilities used across the GigHub application.

## Module Purpose

**規則**:
- Shared 模組提供可重用的 UI 元件以保持一致的用戶體驗
- 提供通用工具進行資料操作和格式化
- 提供共享服務處理橫切關注點
- 提供自訂管道在模板中進行資料轉換
- 提供自訂指令進行 DOM 操作和行為
- 提供 `SHARED_IMPORTS` 常數用於通用模組匯入

## Module Structure

**規則**:
- `src/app/shared/components/` - 可重用的 UI 元件（page-header、result、exception、widgets）
- `src/app/shared/services/` - 共享服務（validation、blueprint、utils）
- `src/app/shared/pipes/` - 自訂管道（safe、time-ago、file-size）
- `src/app/shared/directives/` - 自訂指令（permission、auto-focus）
- `src/app/shared/utils/` - 工具函數（date、string、array）
- `src/app/shared/index.ts` - 公開 API 和 SHARED_IMPORTS

## SHARED_IMPORTS

**規則**:
- 目的：集中匯入通用模組
- 位置：`src/app/shared/index.ts`
- 必須包含 CommonModule、ReactiveFormsModule、FormsModule、RouterModule
- 必須包含所有 ng-zorro-antd 元件模組
- 必須包含所有 @delon 元件模組
- 必須包含共享元件、管道、指令
- 使用方式：在 standalone component 中匯入 `SHARED_IMPORTS`

## Reusable Components

### PageHeaderComponent

**規則**:
- 目的：一致的頁面標題，包含麵包屑和操作
- 位置：`src/app/shared/components/page-header/page-header.component.ts`
- 必須使用 `input.required<string>()` 接收 `title`
- 必須使用 `input<string>()` 接收 `subtitle`（可選）
- 必須使用 `input<boolean>()` 接收 `showBack`（預設 false）
- 必須使用 `input<Array<{ label: string; path?: string }>>()` 接收 `breadcrumbs`
- 必須使用 `output<void>()` 發送 `back` 事件
- 必須使用 `inject(Router)` 注入路由器
- 如果沒有 back 觀察者，必須導航到上一層路由

### ResultComponent

**規則**:
- 目的：顯示成功/錯誤/資訊結果頁面
- 位置：`src/app/shared/components/result/result.component.ts`
- 必須使用 `input.required<ResultStatus>()` 接收 `status`（'success' | 'error' | 'info' | 'warning' | '404' | '403' | '500'）
- 必須使用 `input.required<string>()` 接收 `title`
- 必須使用 `input<string>()` 接收 `subtitle`（可選）
- 必須使用 `input<boolean>()` 接收 `showRetry`（預設 false）
- 必須使用 `input<boolean>()` 接收 `showHome`（預設 true）
- 必須使用 `output<void>()` 發送 `retry` 事件

### ExceptionComponent

**規則**:
- 目的：顯示常見異常頁面（403、404、500）
- 位置：`src/app/shared/components/exception/exception.component.ts`
- 必須使用 `input.required<'403' | '404' | '500'>()` 接收 `type`
- 必須根據類型返回適當的標題和副標題

## Custom Pipes

### SafePipe

**規則**:
- 目的：清理 HTML、URL 和資源 URL
- 位置：`src/app/shared/pipes/safe.pipe.ts`
- 必須實作 `PipeTransform` 介面
- 必須使用 `inject(DomSanitizer)` 注入清理器
- 必須支援 'html'、'style'、'script'、'url'、'resourceUrl' 類型
- 必須使用 `SecurityContext` 進行適當的清理

### TimeAgoPipe

**規則**:
- 目的：顯示相對時間（例如："2 hours ago"）
- 位置：`src/app/shared/pipes/time-ago.pipe.ts`
- 必須實作 `PipeTransform` 介面
- 必須支援 `string | Date` 類型的輸入
- 必須計算與當前時間的差異
- 必須返回人性化的相對時間字串

### FileSizePipe

**規則**:
- 目的：將位元組大小格式化為人類可讀的格式
- 位置：`src/app/shared/pipes/file-size.pipe.ts`
- 必須實作 `PipeTransform` 介面
- 必須支援可選的 `decimals` 參數（預設 2）
- 必須返回適當的單位（Bytes、KB、MB、GB、TB）

## Custom Directives

### PermissionDirective

**規則**:
- 目的：根據用戶權限顯示/隱藏元素
- 位置：`src/app/shared/directives/permission.directive.ts`
- 必須使用 `input.required<string>()` 接收權限類型（'read'、'edit'、'delete'、'manageMembers'、'manageSettings'）
- 必須使用 `input.required<string>()` 接收 `blueprintId`
- 必須使用 `inject(PermissionService)` 注入權限服務
- 必須使用 `inject(TemplateRef)` 和 `inject(ViewContainerRef)` 管理視圖
- 必須在 `ngOnInit` 中檢查權限並創建/清除視圖

### AutoFocusDirective

**規則**:
- 目的：在載入時自動聚焦元素
- 位置：`src/app/shared/directives/auto-focus.directive.ts`
- 必須使用 `input<number>()` 接收延遲時間（預設 0）
- 必須使用 `inject(ElementRef)` 注入元素引用
- 必須在 `ngAfterViewInit` 中執行聚焦
- 必須支援延遲聚焦

## Utility Functions

### Date Utils

**規則**:
- 位置：`src/app/shared/utils/date.utils.ts`
- 必須提供 `formatDate()` 方法格式化日期
- 必須提供 `isToday()` 方法檢查是否為今天
- 必須提供 `isSameDay()` 方法檢查是否為同一天
- 必須提供 `addDays()` 方法添加天數
- 必須提供 `diffInDays()` 方法計算天數差異

### String Utils

**規則**:
- 位置：`src/app/shared/utils/string.utils.ts`
- 必須提供 `truncate()` 方法截斷字串
- 必須提供 `capitalize()` 方法首字母大寫
- 必須提供 `camelToKebab()` 方法轉換命名
- 必須提供 `kebabToCamel()` 方法轉換命名
- 必須提供 `slugify()` 方法生成 slug
- 必須提供 `isEmail()` 方法驗證電子郵件
- 必須提供 `isUrl()` 方法驗證 URL

### Array Utils

**規則**:
- 位置：`src/app/shared/utils/array.utils.ts`
- 必須提供 `unique()` 方法去重
- 必須提供 `groupBy()` 方法分組
- 必須提供 `sortBy()` 方法排序
- 必須提供 `chunk()` 方法分塊
- 必須提供 `intersection()` 方法求交集
- 必須提供 `difference()` 方法求差集

## Best Practices

### Component Design

**規則**:
1. 必須保持元件小而專注（單一職責）
2. 必須使用 input/output signals 進行元件通訊（Angular ≥19）
3. 必須優先使用組合而非繼承（透過組合重用）
4. 必須使元件可配置（使用 inputs 進行自訂）
5. 必須記錄元件 API（清晰的 JSDoc 註解）

### Pipe Design

**規則**:
1. 必須保持管道純粹（無副作用）
2. 必須優化效能（盡可能快取結果）
3. 必須處理 null/undefined（始終提供回退）
4. 必須使用描述性名稱（清晰的轉換目的）
5. 必須使管道可重用（盡可能通用）

### Directive Design

**規則**:
1. 必須單一目的（每個指令一個職責）
2. 必須使用 input signals（適用於 Angular ≥19）
3. 必須清理訂閱（使用 `takeUntilDestroyed()`）
4. 必須記錄行為（清晰的使用範例）
5. 必須處理邊緣情況（null/undefined 輸入）

### Utility Functions

**規則**:
1. 必須是純函數（無副作用）
2. 必須類型安全（適當的 TypeScript 類型）
3. 必須經過良好測試（邊緣情況的單元測試）
4. 必須有文件（帶範例的 JSDoc）
5. 必須命名一致（遵循約定）

## Common Patterns

### Loading State

**規則**:
- 必須使用 `signal(false)` 管理 loading 狀態
- 必須使用 `signal<string | null>(null)` 管理 error 狀態
- 必須使用 `signal<any[]>([])` 管理 data 狀態
- 必須在 try-catch-finally 中處理非同步操作
- 必須在 loading 時顯示 spinner
- 必須在 error 時顯示錯誤結果頁面

### Confirmation Dialog

**規則**:
- 必須使用 `NzModalService.confirm()` 顯示確認對話框
- 必須設定 `nzTitle`、`nzContent`、`nzOkText`、`nzCancelText`
- 必須在 `afterClose` 中處理確認結果
- 必須在確認後執行操作並顯示成功訊息

### Form Validation

**規則**:
- 必須使用 Reactive Forms（`FormGroup`、`FormControl`）
- 必須使用 `Validators` 進行驗證
- 必須提供 `getErrorMessage()` 方法獲取錯誤訊息
- 必須檢查控制項錯誤並返回適當的訊息

## Testing Shared Components

**規則**:
- 必須使用 `TestBed.configureTestingModule()` 配置測試模組
- 必須匯入被測試的元件
- 必須使用 `fixture.componentRef.setInput()` 設定輸入
- 必須使用 `fixture.detectChanges()` 觸發變更檢測
- 必須測試元件行為和輸出事件

## Related Documentation

**規則**:
- 必須參考 Root AGENTS.md 獲取專案總覽
- 必須參考 Core Services AGENTS.md 獲取核心基礎設施
- 必須參考 Blueprint Module AGENTS.md 獲取 Blueprint 特定資訊

---

**Module Version**: 1.0.0  
**Last Updated**: 2025-12-09  
**Status**: Production Ready
