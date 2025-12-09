# Angular 應用層 AGENTS.md

本檔案涵蓋 `src/app/` 目錄下的 Angular 應用架構與開發指引。

## 目錄結構

```
src/app/
├── app.component.ts        # 根元件
├── app.config.ts           # 應用配置
├── app.routes.ts           # 根路由
├── core/                   # 核心服務層 (查看 core/AGENTS.md)
├── shared/                 # 共享元件層 (查看 shared/AGENTS.md)
├── layout/                 # 佈局元件層 (查看 layout/AGENTS.md)
└── routes/                 # 功能路由層 (查看 routes/AGENTS.md)
```

## 開發環境提示

### 新增元件

```bash
# 使用 Angular CLI (推薦)
ng generate component routes/[module]/[component-name] --standalone

# 手動建立時必須:
# 1. 設定 standalone: true
# 2. 匯入 SHARED_IMPORTS
# 3. 使用 signal() 管理狀態
# 4. 使用 inject() 相依注入
```

### 新增服務

```bash
# 全域服務 (singleton)
ng generate service core/services/[service-name]
# 自動設定 providedIn: 'root'

# 範疇服務 (scoped)
# 在元件的 providers 陣列中提供
@Component({
  providers: [ScopedService]
})
```

### 新增路由模組

```bash
# 1. 建立目錄
mkdir -p src/app/routes/[module-name]

# 2. 建立元件與路由
ng generate component routes/[module-name]/[module-name]-list --standalone
touch src/app/routes/[module-name]/routes.ts
touch src/app/routes/[module-name]/AGENTS.md

# 3. 註冊到主路由 (src/app/routes/routes.ts)
{
  path: '[module-name]',
  loadChildren: () => import('./[module-name]/routes').then(m => m.routes)
}
```

## 程式碼模式

### Standalone Component 範本

```typescript
import { Component, signal, computed, inject } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [SHARED_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <nz-spin nzSimple />
    } @else if (error()) {
      <nz-alert nzType="error" [nzMessage]="error()" />
    } @else {
      <nz-card [nzTitle]="title()">
        @for (item of items(); track item.id) {
          <div>{{ item.name }}</div>
        }
      </nz-card>
    }
  `
})
export class ExampleComponent {
  // 相依注入
  private service = inject(MyService);
  private message = inject(NzMessageService);
  
  // 狀態 Signals
  loading = signal(false);
  error = signal<string | null>(null);
  items = signal<Item[]>([]);
  
  // 計算 Signals
  title = computed(() => `Items (${this.items().length})`);
  hasItems = computed(() => this.items().length > 0);
  
  // 初始化
  constructor() {
    this.loadData();
    this.setupSubscriptions();
  }
  
  private async loadData(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      const data = await this.service.fetchData();
      this.items.set(data);
    } catch (err) {
      this.error.set('Failed to load data');
      this.message.error('載入失敗');
    } finally {
      this.loading.set(false);
    }
  }
  
  private setupSubscriptions(): void {
    this.service.updates$
      .pipe(takeUntilDestroyed())
      .subscribe(update => {
        // 自動清理，無需 unsubscribe
        this.handleUpdate(update);
      });
  }
}
```

### Service 範本

```typescript
import { Injectable, inject, signal } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MyService {
  private firestore = inject(Firestore);
  private repository = inject(MyRepository);
  
  // 共享狀態 (如需)
  private _data = signal<Data[]>([]);
  data = this._data.asReadonly();
  
  async fetchData(): Promise<Data[]> {
    try {
      const data = await this.repository.list();
      this._data.set(data);
      return data;
    } catch (error) {
      console.error('fetchData error:', error);
      throw error;
    }
  }
  
  // Observable 流 (用於訂閱)
  get updates$(): Observable<Data> {
    return this.repository.updates$;
  }
}
```

### Repository 範本

```typescript
import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where 
} from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class MyRepository {
  private firestore = inject(Firestore);
  
  async list(): Promise<Data[]> {
    const collectionRef = collection(this.firestore, 'my_table');
    const q = query(
      collectionRef,
      where('deleted_at', '==', null)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Data[];
  }
  
  async getById(id: string): Promise<Data | null> {
    const docRef = doc(this.firestore, 'my_table', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    return { id: docSnap.id, ...docSnap.data() } as Data;
  }
}
```

## 測試指引

### 元件測試

```typescript
import { TestBed } from '@angular/core/testing';
import { ExampleComponent } from './example.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('ExampleComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExampleComponent],
      providers: [
        provideHttpClientTesting(),
        // Mock services
      ]
    }).compileComponents();
  });
  
  it('should create', () => {
    const fixture = TestBed.createComponent(ExampleComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
  
  it('should load data on init', async () => {
    const fixture = TestBed.createComponent(ExampleComponent);
    const component = fixture.componentInstance;
    
    fixture.detectChanges();
    await fixture.whenStable();
    
    expect(component.loading()).toBe(false);
    expect(component.items().length).toBeGreaterThan(0);
  });
});
```

### 服務測試

```typescript
import { TestBed } from '@angular/core/testing';
import { MyService } from './my.service';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('MyService', () => {
  let service: MyService;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MyService,
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(MyService);
  });
  
  it('should fetch data', async () => {
    const data = await service.fetchData();
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
  });
});
```

## 常見問題

### Q: 何時使用 signal() vs Observable?

**A**: 
- **signal()**: 本地狀態、計算值、UI 響應
- **Observable**: 非同步流、事件、HTTP 請求

範例:
```typescript
// ✅ GOOD: signal 用於本地狀態
count = signal(0);
doubled = computed(() => this.count() * 2);

// ✅ GOOD: Observable 用於資料流
data$ = this.http.get('/api/data');
```

### Q: 如何避免記憶體洩漏?

**A**: 使用 `takeUntilDestroyed()`
```typescript
constructor() {
  this.service.updates$
    .pipe(takeUntilDestroyed())
    .subscribe(data => {
      // 元件銷毀時自動 unsubscribe
    });
}
```

### Q: 如何處理非同步錯誤?

**A**: try-catch + signal 狀態
```typescript
async loadData() {
  this.loading.set(true);
  this.error.set(null);
  
  try {
    const data = await this.service.fetch();
    this.data.set(data);
  } catch (err) {
    this.error.set((err as Error).message);
  } finally {
    this.loading.set(false);
  }
}
```

## PR 提交檢查清單

- [ ] 元件為 Standalone
- [ ] 使用 `signal()` 管理狀態
- [ ] 使用 `inject()` 相依注入
- [ ] 使用 `takeUntilDestroyed()` 管理訂閱
- [ ] 使用 `@if`、`@for`、`@switch` 新控制流
- [ ] OnPush 變更偵測策略
- [ ] 無 TypeScript strict 錯誤
- [ ] 測試通過
- [ ] Lint 通過

## 相關文檔

- **專案根目錄**: `../../AGENTS.md`
- **核心服務**: `./core/AGENTS.md`
- **共享元件**: `./shared/AGENTS.md`
- **佈局元件**: `./layout/AGENTS.md`
- **功能路由**: `./routes/AGENTS.md`

---

**版本**: 1.0.0  
**最後更新**: 2025-12-09
