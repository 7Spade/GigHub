# 快速模式參考 (Quick Patterns Reference)

> 從近期變更中提取的常用模式速查表

**日期**: 2025-12-13  
**用途**: 快速查找常用開發模式和最佳實踐

---

## 📋 目錄

1. [設計原則](#設計原則)
2. [模組化架構](#模組化架構)
3. [狀態管理](#狀態管理)
4. [元件模式](#元件模式)
5. [資料存取](#資料存取)
6. [錯誤處理](#錯誤處理)
7. [CDK 使用](#cdk-使用)

---

## 🎯 設計原則

### 奧卡姆剃刀 (Occam's Razor)

```typescript
// ❌ 過度設計
export class ComplexService {
  // 200+ 行未使用的代碼
  private cache = new Map();
  private queue = [];
  private observers = [];
  // ...
}

// ✅ 簡單實用
export class SimpleService {
  // 只包含實際需要的功能
  async getData(): Promise<Data> {
    return await this.http.get('/api/data');
  }
}
```

**原則**: 選擇最簡單的解決方案，不增加不必要的複雜度

---

## 🏗️ 模組化架構

### Blueprint V2 模組範本

```typescript
// {module-name}.module.ts
@Injectable({ providedIn: 'root' })
export class YourModule implements IBlueprintModule {
  readonly id = 'your-module';
  readonly name = '您的模組';
  readonly version = '1.0.0';
  readonly dependencies: string[] = [];
  
  private _status = signal<ModuleStatus>('uninitialized');
  readonly status = this._status.asReadonly();
  
  async init(context: IBlueprintContext): Promise<void> {
    this._status.set('initializing');
    // 初始化邏輯
    this._status.set('initialized');
  }
  
  async start(): Promise<void> { /* ... */ }
  async ready(): Promise<void> { /* ... */ }
  async stop(): Promise<void> { /* ... */ }
  async dispose(): Promise<void> { /* ... */ }
}
```

**目錄結構**:
```
implementations/{module-name}/
├── {module-name}.module.ts      # IBlueprintModule 實作
├── module.metadata.ts           # 元數據
├── index.ts                     # 導出
├── README.md                    # 文檔
├── config/                      # 配置
├── models/                      # 資料模型
├── repositories/                # 資料存取
├── services/                    # 業務邏輯
├── components/                  # UI 元件
└── exports/                     # 公開 API
```

---

## 💾 狀態管理

### AsyncState 模式

```typescript
import { createAsyncState } from '@shared/utils/async-state';

@Component({
  template: `
    @if (dataState.loading()) {
      <nz-spin />
    } @else if (dataState.error()) {
      <nz-alert nzType="error" [nzMessage]="dataState.error()!" />
    } @else if (dataState.data()) {
      <app-content [data]="dataState.data()!" />
    }
  `
})
export class DataComponent {
  dataState = createAsyncState<Data>();
  
  async loadData(id: string): Promise<void> {
    // ✅ 自動管理 loading/error/data
    await this.dataState.load(
      firstValueFrom(this.service.get(id))
    );
  }
}
```

### Signal + Computed

```typescript
@Component({...})
export class TaskListComponent {
  // 基礎狀態
  tasks = signal<Task[]>([]);
  
  // ✅ 自動計算
  totalCount = computed(() => this.tasks().length);
  completedCount = computed(() =>
    this.tasks().filter(t => t.status === 'completed').length
  );
  completionRate = computed(() => {
    const total = this.totalCount();
    return total > 0 ? (this.completedCount() / total) * 100 : 0;
  });
}
```

### Store/Facade 模式

```typescript
@Injectable({ providedIn: 'root' })
export class TaskStore {
  private repository = inject(TaskRepository);
  
  // 私有狀態
  private _tasks = signal<Task[]>([]);
  private _loading = signal(false);
  
  // 公開只讀
  tasks = this._tasks.asReadonly();
  loading = this._loading.asReadonly();
  
  // 計算屬性
  completedTasks = computed(() =>
    this._tasks().filter(t => t.status === 'completed')
  );
  
  // 動作方法
  async loadTasks(): Promise<void> {
    this._loading.set(true);
    try {
      const data = await this.repository.findAll();
      this._tasks.set(data);
    } finally {
      this._loading.set(false);
    }
  }
  
  async createTask(task: CreateTaskDto): Promise<Task> {
    const newTask = await this.repository.create(task);
    this._tasks.update(tasks => [...tasks, newTask]);
    return newTask;
  }
}
```

---

## 🎨 元件模式

### Standalone Component

```typescript
import { Component, inject, input, output, model } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-task-item',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <div class="task-item" [class.readonly]="readonly()">
      <h3>{{ task().title }}</h3>
      
      @if (!readonly()) {
        <button (click)="onEdit()">編輯</button>
        <button (click)="onDelete()">刪除</button>
      }
    </div>
  `
})
export class TaskItemComponent {
  // ✅ 使用 input() 函式
  task = input.required<Task>();
  readonly = input(false);
  
  // ✅ 使用 output() 函式
  taskEdit = output<Task>();
  taskDelete = output<string>();
  
  // ✅ 使用 model() 雙向綁定
  selected = model(false);
  
  // ✅ 使用 inject() 依賴注入
  private message = inject(NzMessageService);
  
  onEdit(): void {
    this.taskEdit.emit(this.task());
  }
  
  onDelete(): void {
    this.taskDelete.emit(this.task().id);
  }
}
```

### 新控制流

```html
<!-- ✅ @if 條件渲染 -->
@if (loading()) {
  <nz-spin />
} @else if (error()) {
  <nz-alert nzType="error" [nzMessage]="error()!" />
} @else {
  <div class="content">{{ data() }}</div>
}

<!-- ✅ @for 迴圈渲染 -->
@for (item of items(); track item.id) {
  <app-item-card [item]="item" />
} @empty {
  <nz-empty nzNotFoundContent="沒有資料" />
}

<!-- ✅ @switch 選擇渲染 -->
@switch (status()) {
  @case ('pending') { <nz-badge nzStatus="processing" /> }
  @case ('completed') { <nz-badge nzStatus="success" /> }
  @default { <nz-badge nzStatus="default" /> }
}
```

---

## 🗄️ 資料存取

### Repository 模式

```typescript
@Injectable({ providedIn: 'root' })
export class TaskRepository {
  private supabase = inject(SupabaseService);
  
  async findAll(): Promise<Task[]> {
    const { data, error } = await this.supabase.client
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(`查詢失敗: ${error.message}`);
    return data || [];
  }
  
  async findById(id: string): Promise<Task | null> {
    const { data, error } = await this.supabase.client
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`查詢失敗: ${error.message}`);
    }
    return data;
  }
  
  async create(task: CreateTaskDto): Promise<Task> {
    const { data, error } = await this.supabase.client
      .from('tasks')
      .insert(task)
      .select()
      .single();
    
    if (error) throw new Error(`建立失敗: ${error.message}`);
    return data;
  }
  
  async update(id: string, updates: Partial<Task>): Promise<Task> {
    const { data, error } = await this.supabase.client
      .from('tasks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`更新失敗: ${error.message}`);
    return data;
  }
  
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('tasks')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(`刪除失敗: ${error.message}`);
  }
}
```

---

## ⚠️ 錯誤處理

### 統一錯誤處理

```typescript
@Component({...})
export class TaskComponent {
  private message = inject(NzMessageService);
  
  async saveTask(task: Task): Promise<void> {
    try {
      await this.taskService.save(task);
      this.message.success('儲存成功');
    } catch (error) {
      const message = error instanceof Error 
        ? error.message 
        : '儲存失敗';
      this.message.error(message);
      
      // 記錄錯誤
      console.error('Save task failed:', error);
    }
  }
}
```

### AsyncState 錯誤處理

```typescript
@Component({
  template: `
    @if (dataState.error()) {
      <nz-alert 
        nzType="error" 
        [nzMessage]="dataState.error()!"
        nzShowIcon
      />
    }
  `
})
export class DataComponent {
  dataState = createAsyncState<Data>();
  
  async loadData(): Promise<void> {
    // ✅ AsyncState 自動捕獲錯誤
    await this.dataState.load(
      firstValueFrom(this.service.getData())
    );
  }
}
```

---

## 🎨 CDK 使用

### 按需導入

```typescript
import { SHARED_IMPORTS, OPTIONAL_CDK_MODULES } from '@shared';

@Component({
  standalone: true,
  imports: [
    SHARED_IMPORTS,
    OPTIONAL_CDK_MODULES.scrolling  // ✅ 只導入需要的
  ]
})
export class LargeListComponent {}
```

### 虛擬滾動 (資料 > 1000 筆)

```typescript
@Component({
  imports: [SHARED_IMPORTS, OPTIONAL_CDK_MODULES.scrolling],
  template: `
    <cdk-virtual-scroll-viewport itemSize="50" class="viewport">
      @for (item of items(); track item.id) {
        <div class="item">{{ item.name }}</div>
      }
    </cdk-virtual-scroll-viewport>
  `,
  styles: [`
    .viewport { height: 500px; }
    .item { height: 50px; }
  `]
})
export class VirtualListComponent {
  items = signal(Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    name: `Item ${i}`
  })));
}
```

### 響應式佈局 (BreakpointService)

```typescript
import { BreakpointService } from '@core/services/layout';

@Component({
  template: `
    @if (breakpoint.isMobile()) {
      <app-mobile-view />
    } @else if (breakpoint.isTablet()) {
      <app-tablet-view />
    } @else {
      <app-desktop-view />
    }
  `
})
export class ResponsiveComponent {
  breakpoint = inject(BreakpointService);
}
```

---

## 🔍 快速決策表

### 何時使用哪種模式？

| 場景 | 推薦模式 | 原因 |
|------|---------|------|
| 非同步資料載入 | AsyncState | 自動管理 loading/error/data |
| 共享狀態 | Store/Facade | 集中管理、統一 API |
| 衍生狀態 | Computed Signal | 自動更新、效能好 |
| 大量資料列表 | 虛擬滾動 | 效能優化 |
| 響應式佈局 | BreakpointService | 統一斷點管理 |
| 資料存取 | Repository | 封裝資料邏輯 |
| 新功能模組 | Blueprint V2 | 標準化、可維護 |

### 避免的反模式

| 反模式 | 問題 | 正確做法 |
|--------|------|---------|
| 模擬數據 | 誤導用戶 | 等到有實際 API 再實作 |
| 過度抽象 | 增加複雜度 | 選擇最簡單的解決方案 |
| 職責混亂 | 難以維護 | 單一職責原則 |
| 手動狀態管理 | 容易出錯 | 使用 AsyncState |
| 全局導入 CDK | bundle size 大 | 按需導入 |

---

## 📚 延伸閱讀

### 內部文檔
- [完整價值提取](./VALUE_EXTRACTION_FROM_RECENT_CHANGES.md)
- [Angular 現代化特性](.github/instructions/angular-modern-features.instructions.md)
- [企業架構模式](.github/instructions/enterprise-angular-architecture.instructions.md)
- [快速參考](.github/instructions/quick-reference.instructions.md)

### 專案文檔
- [CDK 模組架構](./architecture/CDK_MODULES_README.md)
- [審計記錄模組化](../AUDIT_LOGS_ANALYSIS.md)
- [簡化分析](./refactoring/simplification-analysis.md)

---

**版本**: 1.0  
**最後更新**: 2025-12-13  
**維護者**: GigHub 開發團隊
