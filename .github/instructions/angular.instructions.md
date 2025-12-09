```instructions
---
description: 'Angular 專用的程式設計準則與最佳實務 (繁體中文翻譯)'
applyTo: '**/*.ts, **/*.html, **/*.scss, **/*.css'
---

# Angular 開發指引

使用 TypeScript 建構高品質 Angular 應用程式的說明，採用 Angular Signals 作為狀態管理，並遵循官方最佳實務 (https://angular.dev)。

## 專案背景
- 使用最新的 Angular 版本（預設採用獨立元件 standalone components）
- 使用 TypeScript 以確保型別安全
- 使用 Angular CLI 進行專案初始化與樣板產生
- 遵循 Angular Style Guide（https://angular.dev/style-guide）
- 如有指定，使用 Angular Material 或其他現代化 UI 函式庫以維持一致的樣式

## 開發準則

### 架構
- 儘量使用獨立元件（standalone components），除非明確需要使用 NgModule
- 以功能或領域 (feature/domain) 組織程式碼，以利擴充性
- 對功能模組實作延遲載入 (lazy loading) 以優化效能
- 有效運用 Angular 內建的相依注入 (DI)
- 將元件結構化，清楚區分關注點（smart vs presentational 元件）

### TypeScript
- 在 `tsconfig.json` 啟用 `strict` 模式以提升型別安全
- 為元件、服務與資料模型定義清晰的介面與型別
- 使用型別守衛與聯合型別以加強型別檢查
- 使用 RxJS 運算子（例如 `catchError`）實作適當的錯誤處理
- 在反應式表單中使用具型別的表單類別（如 `FormGroup`、`FormControl`）

### 元件設計
- 遵循 Angular 元件生命週期掛勾的最佳實務
- 在 Angular >= 19 時，優先使用 `input()`、`output()`、`viewChild()`、`viewChildren()`、`contentChild()` 和 `contentChildren()` 函式取代裝飾器，否則沿用裝飾器語法
- 運用 Angular 的變更偵測策略（預設或 `OnPush` 以提升效能）
- 保持模板簡潔，將邏輯放在元件類別或服務中
- 使用指令與管線 (pipes) 來封裝可重複使用的功能

### 樣式
- 使用 Angular 的元件層級 CSS 封裝（預設為 `ViewEncapsulation.Emulated`）
- 優先使用 SCSS 進行樣式管理並維持一致的主題
- 使用 CSS Grid、Flexbox 或 Angular CDK Layout 工具來實作響應式設計
- 若使用 Angular Material，遵循其主題與樣式指南
- 維持無障礙 (a11y) 標準，使用 ARIA 屬性與語意化 HTML

### 狀態管理
- 在元件與服務中使用 Angular Signals 作為反應式狀態管理
- 使用 `signal()`、`computed()` 與 `effect()` 來實作反應式更新
- 對於可變狀態使用可寫 signals，對於衍生狀態使用 computed signals
- 使用 signals 管理載入與錯誤狀態，並提供適當的 UI 回饋
- 當 signals 與 RxJS 結合時，於模板中使用 `AsyncPipe` 處理 observable

### 數據擷取
- 使用 Angular 的 `HttpClient` 發送 API 請求並加上正確型別
- 使用 RxJS 運算子進行資料轉換與錯誤處理
- 在獨立元件中使用 `inject()` 進行相依注入
- 實作快取策略（例如對 observable 使用 `shareReplay`）
- 將 API 回應存入 signals 以驅動反應式更新
- 透過全域攔截器處理 API 錯誤，達成一致的錯誤處理流程

### 安全性
- 使用 Angular 內建的輸入消毒機制對使用者輸入進行消毒
- 實作路由守衛（route guards）處理驗證與授權
- 使用 `HttpInterceptor` 加入 CSRF 防護與 API 驗證標頭
- 以反應式表單與自訂驗證器驗證表單輸入
- 遵循 Angular 的安全性最佳實務（例如避免直接操作 DOM）

### 效能
- 使用生產環境建置（例如 `ng build --prod`）以取得最佳化輸出
- 對路由採用延遲載入以縮減初始 bundle 大小
- 使用 `OnPush` 策略與 signals 以優化變更偵測效能
- 在 `ngFor` 中使用 `trackBy` 以改善渲染效能
- 若有需求，可使用 Angular Universal 實作 SSR 或 SSG

### 測試
- 使用 Jasmine + Karma 撰寫元件、服務與管線的單元測試
- 使用 Angular 的 `TestBed` 配合模擬相依來做元件測試
- 使用 Angular 測試工具測試 signal 驅動的狀態更新
- 如指定，使用 Cypress 或 Playwright 撰寫端對端測試
- 使用 `provideHttpClientTesting` 模擬 HTTP 請求
- 為關鍵功能確保高測試覆蓋率

## 實作流程
1. 規劃專案結構與功能模組
2. 定義 TypeScript 介面與模型
3. 使用 Angular CLI 快速產生元件、服務與管線
4. 實作資料服務與 API 整合，並以 signals 管理狀態
5. 建立具明確輸入/輸出的可重用元件
6. 新增反應式表單與驗證
7. 使用 SCSS 並實作響應式樣式
8. 實作延遲載入路由與路由守衛
9. 使用 signals 新增錯誤處理與載入狀態
10. 撰寫單元與端對端測試
11. 最後優化效能與 bundle 大小

## 額外指引
- 遵循 Angular Style Guide 的檔名規範（參見 https://angular.dev/style-guide），例如元件使用 `feature.ts`，服務使用 `feature-service.ts`。對於既有程式碼庫，維持既有模式的一致性。
- 使用 Angular CLI 指令產生樣板程式碼
- 以清晰的 JSDoc 註解文件化元件與服務
- 在適用情況下確保符合無障礙準則（WCAG 2.1）
- 如需國際化，使用 Angular 內建的 i18n 機制
- 透過建立可重用的工具與共用模組來保持 DRY 原則
- 一致性地使用 signals 作為狀態管理方式以確保反應式更新

```
---
description: 'Angular-specific coding standards and best practices'
applyTo: '**/*.ts, **/*.html, **/*.scss, **/*.css'
---

# Angular Development Instructions

Instructions for generating high-quality Angular applications with TypeScript, using Angular Signals for state management, adhering to Angular best practices as outlined at https://angular.dev.

## Project Context
- Latest Angular version (use standalone components by default)
- TypeScript for type safety
- Angular CLI for project setup and scaffolding
- Follow Angular Style Guide (https://angular.dev/style-guide)
- Use Angular Material or other modern UI libraries for consistent styling (if specified)

## Development Standards

### Architecture
- Use standalone components unless modules are explicitly required
- Organize code by standalone feature modules or domains for scalability
- Implement lazy loading for feature modules to optimize performance
- Use Angular's built-in dependency injection system effectively
- Structure components with a clear separation of concerns (smart vs. presentational components)

### TypeScript
- Enable strict mode in `tsconfig.json` for type safety
- Define clear interfaces and types for components, services, and models
- Use type guards and union types for robust type checking
- Implement proper error handling with RxJS operators (e.g., `catchError`)
- Use typed forms (e.g., `FormGroup`, `FormControl`) for reactive forms

### Component Design
- Follow Angular's component lifecycle hooks best practices
- When using Angular >= 19, Use `input()` `output()`, `viewChild()`, `viewChildren()`, `contentChild()` and `contentChildren()` functions instead of decorators; otherwise use decorators
- Leverage Angular's change detection strategy (default or `OnPush` for performance)
- Keep templates clean and logic in component classes or services
- Use Angular directives and pipes for reusable functionality

### Styling
- Use Angular's component-level CSS encapsulation (default: ViewEncapsulation.Emulated)
- Prefer SCSS for styling with consistent theming
- Implement responsive design using CSS Grid, Flexbox, or Angular CDK Layout utilities
- Follow Angular Material's theming guidelines if used
- Maintain accessibility (a11y) with ARIA attributes and semantic HTML

### State Management
- Use Angular Signals for reactive state management in components and services
- Leverage `signal()`, `computed()`, and `effect()` for reactive state updates
- Use writable signals for mutable state and computed signals for derived state
- Handle loading and error states with signals and proper UI feedback
- Use Angular's `AsyncPipe` to handle observables in templates when combining signals with RxJS

### Data Fetching
- Use Angular's `HttpClient` for API calls with proper typing
- Implement RxJS operators for data transformation and error handling
- Use Angular's `inject()` function for dependency injection in standalone components
- Implement caching strategies (e.g., `shareReplay` for observables)
- Store API response data in signals for reactive updates
- Handle API errors with global interceptors for consistent error handling

### Security
- Sanitize user inputs using Angular's built-in sanitization
- Implement route guards for authentication and authorization
- Use Angular's `HttpInterceptor` for CSRF protection and API authentication headers
- Validate form inputs with Angular's reactive forms and custom validators
- Follow Angular's security best practices (e.g., avoid direct DOM manipulation)

### Performance
- Enable production builds with `ng build --prod` for optimization
- Use lazy loading for routes to reduce initial bundle size
- Optimize change detection with `OnPush` strategy and signals for fine-grained reactivity
- Use trackBy in `ngFor` loops to improve rendering performance
- Implement server-side rendering (SSR) or static site generation (SSG) with Angular Universal (if specified)

### Testing
- Write unit tests for components, services, and pipes using Jasmine and Karma
- Use Angular's `TestBed` for component testing with mocked dependencies
- Test signal-based state updates using Angular's testing utilities
- Write end-to-end tests with Cypress or Playwright (if specified)
- Mock HTTP requests using `provideHttpClientTesting`
- Ensure high test coverage for critical functionality

## Implementation Process
1. Plan project structure and feature modules
2. Define TypeScript interfaces and models
3. Scaffold components, services, and pipes using Angular CLI
4. Implement data services and API integrations with signal-based state
5. Build reusable components with clear inputs and outputs
6. Add reactive forms and validation
7. Apply styling with SCSS and responsive design
8. Implement lazy-loaded routes and guards
9. Add error handling and loading states using signals
10. Write unit and end-to-end tests
11. Optimize performance and bundle size

## Additional Guidelines
- Follow the Angular Style Guide for file naming conventions (see https://angular.dev/style-guide), e.g., use `feature.ts` for components and `feature-service.ts` for services. For legacy codebases, maintain consistency with existing pattern.
- Use Angular CLI commands for generating boilerplate code
- Document components and services with clear JSDoc comments
- Ensure accessibility compliance (WCAG 2.1) where applicable
- Use Angular's built-in i18n for internationalization (if specified)
- Keep code DRY by creating reusable utilities and shared modules
- Use signals consistently for state management to ensure reactive updates
