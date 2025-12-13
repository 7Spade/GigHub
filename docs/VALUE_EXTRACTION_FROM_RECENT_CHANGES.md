# 價值提取：近期變更的最佳實踐與模式 (Value Extraction from Recent Changes)

**日期**: 2025-12-13  
**來源**: PRs #122, #121, #118, #116  
**目的**: 從近期專案變更中提取可重用的架構模式、最佳實踐和設計原則

---

## 📋 執行摘要

本文檔總結了 GigHub 專案近期重要變更中的核心價值，提供可重用的模式和指引供未來開發參考。

### 核心價值提取

| 主題 | 來源 | 關鍵洞察 |
|------|------|---------|
| **CDK 模組架構** | PR #122, #121 | 按需導入策略、服務封裝模式 |
| **審計記錄模組化** | PR #116 | Blueprint V2 模組實作範本 |
| **Gantt 視圖修復** | PR #118 | Signal 相容性、非同步狀態管理 |
| **簡化原則** | 重構文檔 | 奧卡姆剃刀、YAGNI、單一職責 |

---

## 🎯 核心設計原則

### 1. 奧卡姆剃刀原則 (Occam's Razor)

> "如無必要，勿增實體" - 最簡單的解決方案通常是最好的解決方案

**實際應用案例**：

#### ❌ 過度設計 (Before)
```typescript
// 藍圖詳情頁面 - 複雜且包含模擬數據
@Component({...})
export class BlueprintDetailComponent {
  // 527 行代碼
  containerLoading = signal(false);
  containerStatus = signal({
    status: 'Running',  // 模擬數據
    uptime: 0,          // 模擬數據
    moduleCount: 0      // 模擬數據
  });
  
  refreshContainerStatus(): void {
    // 200+ 行模擬邏輯
  }
  
  openContainer(): void { ... }
  switchToMembersTab(): void { ... }
  viewAuditLogs(): void { ... }
}
```

#### ✅ 簡化後 (After)
```typescript
// 藍圖詳情頁面 - 簡潔且只顯示實際數據
@Component({...})
export class BlueprintDetailComponent {
  // 450 行代碼 (減少 160+ 行)
  
  // 只保留核心功能
  private async loadBlueprint(id: string): Promise<void> {
    await this.blueprintState.load(
      firstValueFrom(this.blueprintService.getById(id))
    );
  }
  
  // 移除所有模擬數據和不必要的方法
}
```

**價值**:
- ✅ 代碼量減少 30% (160+ 行)
- ✅ 職責更清晰
- ✅ 維護性提升
- ✅ 沒有模擬數據與實際數據混淆

---

### 2. YAGNI 原則 (You Aren't Gonna Need It)

> "不實作現在不需要的功能"

**實際應用**:

```typescript
// ❌ 錯誤: 預先建立複雜的容器服務
@Injectable({ providedIn: 'root' })
export class BlueprintContainerService {
  private containers = new Map<string, BlueprintContainer>();
  // ... 100+ 行未使用的代碼
}

// ✅ 正確: 只實作當前需要的功能
// 等到真正需要容器服務時再建立
```

**關鍵決策**:
- ✅ Container Dashboard 使用模擬數據 → 暫不實作
- ✅ 只顯示有實際數據來源的功能（審計記錄）
- ✅ 未來如需要，再建立實際的 BlueprintContainerService

---

### 3. 單一職責原則 (Single Responsibility)

> "一個類別/元件應該只有一個改變的理由"

**架構對比**:

#### ❌ 職責混亂
```
BlueprintDetailComponent
├── 藍圖資料管理 ✓
├── 模擬容器狀態管理 ✗ (不該在這裡)
├── 容器儀表板邏輯 ✗ (重複邏輯)
├── 審計記錄管理 ✗ (應該獨立)
└── 多個導航方法 ✗ (過度設計)
```

#### ✅ 職責清晰
```
BlueprintDetailComponent
├── 藍圖資料管理 ✓
└── 基本操作 ✓

AuditLogsComponent
└── 審計記錄展示 ✓
```

---

## 🏗️ 模組化架構模式

### Blueprint V2 模組範本

**來源**: PR #116 - Audit Logs 模組化

#### 標準模組結構

```
src/app/core/blueprint/modules/implementations/{module-name}/
├── {module-name}.module.ts          # IBlueprintModule 實作
├── module.metadata.ts               # 元數據與配置
├── index.ts                         # 公開導出
├── README.md                        # 完整文檔
│
├── config/
│   └── {module-name}.config.ts      # 運行時配置
│
├── models/
│   ├── {entity}.model.ts            # 完整資料模型
│   └── {entity}.types.ts            # 類型定義
│
├── repositories/
│   └── {entity}.repository.ts       # 資料存取層
│
├── services/
│   └── {module-name}.service.ts     # 業務邏輯層
│
├── components/
│   └── {component}.component.ts     # UI 元件
│
└── exports/
    └── {module-name}-api.exports.ts # 公開 API
```

#### 模組實作範例

```typescript
/**
 * Blueprint V2 模組實作範本
 * 
 * 實作 IBlueprintModule 介面，提供完整生命週期管理
 */
import { Injectable, inject, signal, Signal } from '@angular/core';
import { 
  IBlueprintModule, 
  IBlueprintContext,
  ModuleStatus 
} from '@core/blueprint';

@Injectable({ providedIn: 'root' })
export class YourModule implements IBlueprintModule {
  // ==================== 模組識別 ====================
  readonly id = 'your-module';
  readonly name = '您的模組';
  readonly version = '1.0.0';
  readonly dependencies: string[] = [];
  
  // ==================== 狀態管理 ====================
  private _status = signal<ModuleStatus>('uninitialized');
  readonly status: Signal<ModuleStatus> = this._status.asReadonly();
  
  private _context?: IBlueprintContext;
  
  // ==================== 依賴注入 ====================
  private yourService = inject(YourService);
  private yourRepository = inject(YourRepository);
  
  // ==================== 生命週期方法 ====================
  
  /**
   * 初始化模組
   * 設置配置、驗證依賴、準備資源
   */
  async init(context: IBlueprintContext): Promise<void> {
    this._context = context;
    this._status.set('initializing');
    
    try {
      // 初始化邏輯
      await this.yourService.initialize(context.config);
      
      this._status.set('initialized');
    } catch (error) {
      this._status.set('error');
      throw error;
    }
  }
  
  /**
   * 啟動模組
   * 開始監聽事件、建立連接
   */
  async start(): Promise<void> {
    if (this._status() !== 'initialized') {
      throw new Error('Module must be initialized before starting');
    }
    
    this._status.set('starting');
    
    try {
      // 啟動邏輯
      await this.yourService.start();
      
      this._status.set('started');
    } catch (error) {
      this._status.set('error');
      throw error;
    }
  }
  
  /**
   * 模組就緒
   * 可以開始處理業務邏輯
   */
  async ready(): Promise<void> {
    this._status.set('ready');
  }
  
  /**
   * 停止模組
   * 停止監聽、清理資源
   */
  async stop(): Promise<void> {
    this._status.set('stopping');
    
    try {
      await this.yourService.stop();
      this._status.set('stopped');
    } catch (error) {
      this._status.set('error');
      throw error;
    }
  }
  
  /**
   * 釋放資源
   * 清理所有資源、取消訂閱
   */
  async dispose(): Promise<void> {
    await this.yourService.dispose();
    this._status.set('disposed');
  }
}
```

**關鍵特性**:
- ✅ 完整的生命週期管理 (init → start → ready → stop → dispose)
- ✅ Signal-based 狀態管理
- ✅ 清晰的職責分離
- ✅ 可測試與可維護
- ✅ 可獨立部署

---

## 📦 CDK 模組架構模式

**來源**: PR #122, #121 - CDK Cleanup & Module Placement

### 按需導入策略 (On-Demand Import Strategy)

#### 核心概念

```typescript
/**
 * Angular CDK 模組配置
 * 
 * 策略：
 * 1. 預設不載入 (SHARED_CDK_MODULES 為空)
 * 2. 按需導入 (OPTIONAL_CDK_MODULES)
 * 3. 服務封裝 (常用功能封裝為服務)
 */

// src/app/shared/shared-cdk.module.ts

/**
 * 可選 CDK 模組
 * 按需導入以優化 bundle size
 */
export const OPTIONAL_CDK_MODULES = {
  /** 可存取性 - 鍵盤導航、焦點管理 */
  a11y: A11yModule,
  
  /** 虛擬滾動 - 大量資料列表 (>1000 筆) */
  scrolling: ScrollingModule,
  
  /** DOM 監聽 - 元素可見性、尺寸變化 */
  observers: ObserversModule,
  
  /** 浮層管理 - 自訂對話框（通常不需要，ng-zorro 已包含）*/
  overlay: OverlayModule,
  
  /** 動態內容 - 動態元件載入（通常不需要，ng-zorro 已包含）*/
  portal: PortalModule
} as const;

/**
 * 標準 CDK 導入
 * 目前為空，因為 ng-zorro-antd 已包含必要的 CDK 模組
 */
export const SHARED_CDK_MODULES: any[] = [];
```

#### 使用場景與範例

##### 場景 1: 大量資料列表 (虛擬滾動)

```typescript
import { Component, signal } from '@angular/core';
import { SHARED_IMPORTS, OPTIONAL_CDK_MODULES } from '@shared';

@Component({
  selector: 'app-large-list',
  standalone: true,
  imports: [
    SHARED_IMPORTS,
    OPTIONAL_CDK_MODULES.scrolling  // 按需導入
  ],
  template: `
    <cdk-virtual-scroll-viewport itemSize="50" class="list-viewport">
      @for (item of items(); track item.id) {
        <div class="list-item">{{ item.name }}</div>
      }
    </cdk-virtual-scroll-viewport>
  `,
  styles: [`
    .list-viewport { height: 500px; }
    .list-item { height: 50px; }
  `]
})
export class LargeListComponent {
  items = signal(Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    name: `Item ${i}`
  })));
}
```

**使用時機**: 資料量 > 1000 筆時

##### 場景 2: 響應式佈局 (服務封裝)

```typescript
// src/app/core/services/layout/breakpoint.service.ts

import { Injectable, inject, signal, computed } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * 斷點服務
 * 封裝 CDK Layout 功能，提供響應式設計斷點偵測
 */
@Injectable({ providedIn: 'root' })
export class BreakpointService {
  private breakpointObserver = inject(BreakpointObserver);
  
  // 當前斷點狀態
  private _currentBreakpoint = signal<string>('Unknown');
  currentBreakpoint = this._currentBreakpoint.asReadonly();
  
  // 計算屬性
  isMobile = computed(() => {
    const bp = this._currentBreakpoint();
    return bp === 'XSmall' || bp === 'Small';
  });
  
  isTablet = computed(() => this._currentBreakpoint() === 'Medium');
  
  isDesktop = computed(() => {
    const bp = this._currentBreakpoint();
    return bp === 'Large' || bp === 'XLarge';
  });
  
  constructor() {
    // 監聽斷點變化
    this.breakpointObserver
      .observe([
        Breakpoints.XSmall,
        Breakpoints.Small,
        Breakpoints.Medium,
        Breakpoints.Large,
        Breakpoints.XLarge
      ])
      .pipe(takeUntilDestroyed())
      .subscribe(result => {
        if (result.breakpoints[Breakpoints.XSmall]) {
          this._currentBreakpoint.set('XSmall');
        } else if (result.breakpoints[Breakpoints.Small]) {
          this._currentBreakpoint.set('Small');
        } else if (result.breakpoints[Breakpoints.Medium]) {
          this._currentBreakpoint.set('Medium');
        } else if (result.breakpoints[Breakpoints.Large]) {
          this._currentBreakpoint.set('Large');
        } else if (result.breakpoints[Breakpoints.XLarge]) {
          this._currentBreakpoint.set('XLarge');
        }
      });
  }
}
```

**使用範例**:

```typescript
import { Component, inject } from '@angular/core';
import { BreakpointService } from '@core/services/layout';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-responsive-layout',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <div class="layout">
      @if (breakpoint.isMobile()) {
        <app-mobile-view />
      } @else if (breakpoint.isTablet()) {
        <app-tablet-view />
      } @else {
        <app-desktop-view />
      }
      
      <p>當前斷點: {{ breakpoint.currentBreakpoint() }}</p>
    </div>
  `
})
export class ResponsiveLayoutComponent {
  breakpoint = inject(BreakpointService);
}
```

### 決策矩陣

| CDK 模組 | 放置位置 | 載入策略 | 理由 |
|---------|---------|---------|------|
| **Overlay** | `OPTIONAL_CDK_MODULES` | 按需導入 | ng-zorro 已包含，很少需要直接使用 |
| **Portal** | `OPTIONAL_CDK_MODULES` | 按需導入 | ng-zorro 已包含，進階場景才需要 |
| **A11y** | `OPTIONAL_CDK_MODULES` | 按需導入 | 重要但不是所有元件都需要 |
| **Scrolling** | `OPTIONAL_CDK_MODULES` | 按需導入 | 特定場景（大量資料）才需要 |
| **Layout** | `core/services/layout/` | 服務封裝 | 全局需要，封裝為服務更好管理 |
| **Observers** | `OPTIONAL_CDK_MODULES` | 按需導入 | 使用頻率低，特定功能才需要 |

**效能影響**:
- ✅ 不增加初始 bundle size
- ✅ Overlay (~15KB) 和 Portal (~8KB) 已在 ng-zorro 中
- ✅ 只有實際使用的模組才會被打包

---

## 🎨 Angular 20 現代化模式

### Signal-Based 狀態管理

#### 模式 1: AsyncState + Signal

```typescript
import { Component, signal, inject } from '@angular/core';
import { createAsyncState, AsyncState } from '@shared/utils/async-state';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-data-view',
  standalone: true,
  template: `
    @if (dataState.loading()) {
      <nz-spin nzSimple />
    } @else if (dataState.error()) {
      <nz-alert 
        nzType="error" 
        [nzMessage]="dataState.error()!" 
      />
    } @else if (dataState.data()) {
      <app-data-content [data]="dataState.data()!" />
    }
  `
})
export class DataViewComponent {
  private dataService = inject(DataService);
  
  // ✅ 使用 AsyncState 管理非同步狀態
  dataState = createAsyncState<DataType>();
  
  async ngOnInit(): Promise<void> {
    // ✅ 使用 load() 方法自動管理狀態
    await this.dataState.load(
      firstValueFrom(this.dataService.getData())
    );
  }
}
```

**優勢**:
- ✅ 自動管理 loading/error/data 狀態
- ✅ 避免手動設置狀態的時序問題
- ✅ 防止載入過程中閃現錯誤
- ✅ 類型安全

#### 模式 2: Computed Signals

```typescript
import { Component, signal, computed } from '@angular/core';

@Component({
  selector: 'app-task-list',
  template: `
    <div class="stats">
      <p>總任務: {{ totalCount() }}</p>
      <p>已完成: {{ completedCount() }}</p>
      <p>進行中: {{ inProgressCount() }}</p>
      <p>完成率: {{ completionRate() }}%</p>
    </div>
  `
})
export class TaskListComponent {
  // 基礎狀態
  tasks = signal<Task[]>([]);
  
  // ✅ 計算屬性 - 自動更新
  totalCount = computed(() => this.tasks().length);
  
  completedCount = computed(() => 
    this.tasks().filter(t => t.status === 'completed').length
  );
  
  inProgressCount = computed(() =>
    this.tasks().filter(t => t.status === 'in-progress').length
  );
  
  completionRate = computed(() => {
    const total = this.totalCount();
    if (total === 0) return 0;
    return Math.round((this.completedCount() / total) * 100);
  });
}
```

### 新控制流語法

```typescript
@Component({
  template: `
    <!-- ✅ @if 條件渲染 -->
    @if (loading()) {
      <nz-spin nzSimple />
    } @else if (error()) {
      <nz-alert nzType="error" [nzMessage]="error()!" />
    } @else {
      <div class="content">
        <!-- ✅ @for 迴圈渲染 (必須提供 track) -->
        @for (item of items(); track item.id) {
          <app-item-card [item]="item" />
        } @empty {
          <nz-empty />
        }
      </div>
    }
    
    <!-- ✅ @switch 選擇渲染 -->
    @switch (status()) {
      @case ('pending') {
        <nz-badge nzStatus="processing" nzText="處理中" />
      }
      @case ('completed') {
        <nz-badge nzStatus="success" nzText="已完成" />
      }
      @default {
        <nz-badge nzStatus="default" nzText="未知" />
      }
    }
  `
})
```

### Standalone Components

```typescript
import { Component, inject, input, output, model } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-task-item',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `...`
})
export class TaskItemComponent {
  // ✅ 使用 input() 函式
  task = input.required<Task>();
  readonly = input(false);
  
  // ✅ 使用 output() 函式
  taskChange = output<Task>();
  taskDelete = output<string>();
  
  // ✅ 使用 model() 雙向綁定
  selected = model(false);
  
  // ✅ 使用 inject() 依賴注入
  private taskService = inject(TaskService);
  private message = inject(NzMessageService);
  
  async updateTask(): Promise<void> {
    try {
      const updated = await this.taskService.update(this.task());
      this.taskChange.emit(updated);
      this.message.success('更新成功');
    } catch (error) {
      this.message.error('更新失敗');
    }
  }
}
```

---

## 🔧 實用工具模式

### 1. AsyncState 工具

**位置**: `src/app/shared/utils/async-state.ts`

```typescript
/**
 * AsyncState - 統一的非同步狀態管理工具
 * 
 * 提供 loading/error/data 三態管理
 */
export interface AsyncState<T> {
  loading: Signal<boolean>;
  error: Signal<string | null>;
  data: Signal<T | null>;
  
  load(promise: Promise<T>): Promise<void>;
  setData(data: T | null): void;
  setError(error: string): void;
  reset(): void;
}

export function createAsyncState<T>(): AsyncState<T> {
  const _loading = signal(false);
  const _error = signal<string | null>(null);
  const _data = signal<T | null>(null);
  
  return {
    loading: _loading.asReadonly(),
    error: _error.asReadonly(),
    data: _data.asReadonly(),
    
    async load(promise: Promise<T>): Promise<void> {
      _loading.set(true);
      _error.set(null);
      
      try {
        const result = await promise;
        _data.set(result);
      } catch (err) {
        _error.set(err instanceof Error ? err.message : 'Unknown error');
        _data.set(null);
      } finally {
        _loading.set(false);
      }
    },
    
    setData(data: T | null): void {
      _data.set(data);
      _error.set(null);
    },
    
    setError(error: string): void {
      _error.set(error);
      _data.set(null);
    },
    
    reset(): void {
      _loading.set(false);
      _error.set(null);
      _data.set(null);
    }
  };
}
```

**使用範例**:

```typescript
@Component({...})
export class ExampleComponent {
  // 建立狀態
  userState = createAsyncState<User>();
  
  async loadUser(id: string): Promise<void> {
    // ✅ 自動管理 loading/error/data
    await this.userState.load(
      firstValueFrom(this.userService.getById(id))
    );
  }
  
  // Template 中使用
  // @if (userState.loading()) { ... }
  // @else if (userState.error()) { ... }
  // @else if (userState.data()) { ... }
}
```

### 2. Repository 模式

```typescript
/**
 * Repository 標準模式
 * 
 * 職責：
 * - 封裝資料存取邏輯
 * - 處理資料轉換
 * - 統一錯誤處理
 */
import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '@core/services/supabase.service';

@Injectable({ providedIn: 'root' })
export class TaskRepository {
  private supabase = inject(SupabaseService);
  
  /**
   * 查詢所有任務
   */
  async findAll(): Promise<Task[]> {
    const { data, error } = await this.supabase.client
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(`查詢任務失敗: ${error.message}`);
    return data || [];
  }
  
  /**
   * 根據 ID 查詢任務
   */
  async findById(id: string): Promise<Task | null> {
    const { data, error } = await this.supabase.client
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`查詢任務失敗: ${error.message}`);
    }
    
    return data;
  }
  
  /**
   * 建立任務
   */
  async create(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
    const { data, error } = await this.supabase.client
      .from('tasks')
      .insert(task)
      .select()
      .single();
    
    if (error) throw new Error(`建立任務失敗: ${error.message}`);
    return data;
  }
  
  /**
   * 更新任務
   */
  async update(id: string, updates: Partial<Task>): Promise<Task> {
    const { data, error } = await this.supabase.client
      .from('tasks')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`更新任務失敗: ${error.message}`);
    return data;
  }
  
  /**
   * 刪除任務
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('tasks')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(`刪除任務失敗: ${error.message}`);
  }
}
```

### 3. Store 模式 (Facade Pattern)

```typescript
/**
 * Store/Facade 模式
 * 
 * 職責：
 * - 封裝業務邏輯
 * - 管理共享狀態
 * - 協調多個 Repository
 * - 提供統一的 API
 */
import { Injectable, signal, computed, inject } from '@angular/core';
import { TaskRepository } from '@core/infra/task.repository';

@Injectable({ providedIn: 'root' })
export class TaskStore {
  private repository = inject(TaskRepository);
  
  // ==================== 私有狀態 ====================
  private _tasks = signal<Task[]>([]);
  private _loading = signal(false);
  private _error = signal<string | null>(null);
  
  // ==================== 公開只讀狀態 ====================
  tasks = this._tasks.asReadonly();
  loading = this._loading.asReadonly();
  error = this._error.asReadonly();
  
  // ==================== 計算屬性 ====================
  completedTasks = computed(() =>
    this._tasks().filter(t => t.status === 'completed')
  );
  
  pendingTasks = computed(() =>
    this._tasks().filter(t => t.status === 'pending')
  );
  
  taskCount = computed(() => this._tasks().length);
  
  // ==================== 動作方法 ====================
  
  /**
   * 載入所有任務
   */
  async loadTasks(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    
    try {
      const tasks = await this.repository.findAll();
      this._tasks.set(tasks);
    } catch (err) {
      const message = err instanceof Error ? err.message : '載入任務失敗';
      this._error.set(message);
      throw err;
    } finally {
      this._loading.set(false);
    }
  }
  
  /**
   * 建立任務
   */
  async createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
    try {
      const newTask = await this.repository.create(task);
      this._tasks.update(tasks => [...tasks, newTask]);
      return newTask;
    } catch (err) {
      const message = err instanceof Error ? err.message : '建立任務失敗';
      this._error.set(message);
      throw err;
    }
  }
  
  /**
   * 更新任務
   */
  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    try {
      const updatedTask = await this.repository.update(id, updates);
      this._tasks.update(tasks =>
        tasks.map(t => t.id === id ? updatedTask : t)
      );
      return updatedTask;
    } catch (err) {
      const message = err instanceof Error ? err.message : '更新任務失敗';
      this._error.set(message);
      throw err;
    }
  }
  
  /**
   * 刪除任務
   */
  async deleteTask(id: string): Promise<void> {
    try {
      await this.repository.delete(id);
      this._tasks.update(tasks => tasks.filter(t => t.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : '刪除任務失敗';
      this._error.set(message);
      throw err;
    }
  }
}
```

---

## 📚 最佳實踐總結

### 架構層面

1. **三層架構**
   - ✅ Foundation Layer: 基礎服務 (Auth, Account, Organization)
   - ✅ Container Layer: 容器服務 (Blueprint, Permissions, Events)
   - ✅ Business Layer: 業務邏輯 (Tasks, Logs, Quality)

2. **模組化設計**
   - ✅ Blueprint V2 模組範本
   - ✅ 清晰的職責分離
   - ✅ 完整的生命週期管理

3. **按需載入**
   - ✅ OPTIONAL_CDK_MODULES
   - ✅ Lazy loading components
   - ✅ Tree-shakable services

### 程式碼層面

1. **Angular 20 現代化**
   - ✅ Signals 狀態管理
   - ✅ Standalone Components
   - ✅ 新控制流語法 (@if, @for, @switch)
   - ✅ inject() 依賴注入
   - ✅ input(), output(), model() 函式

2. **狀態管理**
   - ✅ AsyncState 工具
   - ✅ Signal + Computed 模式
   - ✅ Store/Facade 模式

3. **資料存取**
   - ✅ Repository 模式
   - ✅ 統一錯誤處理
   - ✅ 類型安全

### 設計原則

1. **奧卡姆剃刀** - 選擇最簡單的解決方案
2. **YAGNI** - 不實作不需要的功能
3. **單一職責** - 一個類別一個改變理由
4. **DRY** - 不重複自己

---

## 🎓 學習資源

### 內部文檔

- [CDK 模組架構](./architecture/CDK_MODULES_README.md)
- [CDK 模組分析](./architecture/cdk-modules-placement-analysis.md)
- [審計記錄模組化](../AUDIT_LOGS_ANALYSIS.md)
- [審計記錄遷移](../AUDIT_LOGS_MIGRATION.md)
- [簡化分析](./refactoring/simplification-analysis.md)
- [藍圖重構](./refactoring/blueprint-detail-refactoring.md)

### 專案指引

- [Angular 現代化特性](.github/instructions/angular-modern-features.instructions.md)
- [企業架構模式](.github/instructions/enterprise-angular-architecture.instructions.md)
- [快速參考](.github/instructions/quick-reference.instructions.md)
- [約束規則](.github/copilot/constraints.md)

### 外部資源

- [Angular 官方文檔](https://angular.dev)
- [Angular CDK](https://material.angular.io/cdk/categories)
- [ng-alain](https://ng-alain.com)
- [ng-zorro-antd](https://ng.ant.design)

---

## 🔄 持續改進

### 未來方向

1. **效能優化**
   - 實作更多 OnPush 變更檢測
   - 使用虛擬滾動處理大量資料
   - 優化 bundle size

2. **測試覆蓋率**
   - 增加單元測試
   - 增加整合測試
   - 建立 E2E 測試套件

3. **文檔完善**
   - 更多程式碼範例
   - 架構決策記錄 (ADR)
   - API 文檔

4. **開發體驗**
   - 更多開發工具
   - 更好的錯誤訊息
   - 程式碼生成器

---

**文檔版本**: 1.0  
**最後更新**: 2025-12-13  
**維護者**: GigHub 開發團隊  
**狀態**: ✅ 已完成

**相關 PRs**:
- #122: CDK 模組清理與架構
- #121: 模組放置分析
- #118: Gantt 視圖修復與任務 UX 改進
- #116: 審計記錄模組化
