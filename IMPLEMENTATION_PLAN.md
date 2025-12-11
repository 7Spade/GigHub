# GigHub 記憶體洩漏修復與品質模組實施計畫

## 📊 執行摘要 (Executive Summary)

**專案目標**: 
1. 修復記憶體洩漏 (2天)
2. 實施品質模組 (4-5天)
3. 修復事件總線 (0.5天)

**總工期**: 6.5-7.5 天

**關鍵原則**: 奧卡姆剃刀原則 - 以最簡單有效的方式解決問題

---

## 🔍 階段 1: 需求理解與問題分析

### 1.1 記憶體洩漏問題分析

#### 識別到的洩漏點:

**高優先級洩漏 (Critical)**:
1. **RxJS 訂閱未清理** (29 個檔案受影響)
   - `app.component.ts` - router.events 訂閱
   - `team-members.component.ts` - 多個 repository 訂閱
   - `blueprint-designer.component.ts` - blueprintService 訂閱
   - `firebase-auth.service.ts` - user$ 訂閱
   - 其他 25+ 個檔案

2. **Event Bus 訂閱管理問題**
   - `event-bus.ts` 的 `off()` 方法無法正確匹配 handler
   - 訂閱追蹤機制不完善
   - 可能導致 handler 累積

3. **Modal/Drawer afterClose 訂閱**
   - 多個元件中的 modal.afterClose 訂閱未清理
   - drawer.afterClose 訂閱未清理

**中優先級洩漏 (Medium)**:
4. **Supabase Realtime 訂閱** (待驗證)
   - 需檢查是否有 Realtime channel 未正確 unsubscribe

#### 影響分析:
- **記憶體使用**: 長時間運行後記憶體持續增長
- **性能影響**: 事件處理器累積導致重複執行
- **穩定性**: 可能導致應用程序緩慢或崩潰

### 1.2 品質模組需求分析

**功能需求**:
- 品質檢查管理
- 缺陷追蹤
- 驗收標準管理
- 與任務模組整合

**技術需求**:
- 遵循 `IBlueprintModule` 介面
- 實現完整生命週期: init → start → ready → stop → dispose
- 使用 Signals 進行狀態管理
- 整合 Event Bus 進行模組通訊
- Repository 模式進行資料存取

**資料模型**:
```typescript
interface QualityInspection {
  id: string;
  blueprint_id: string;
  task_id?: string;
  title: string;
  description: string;
  status: 'pending' | 'passed' | 'failed' | 'in_progress';
  inspector_id: string;
  created_at: Date;
  updated_at: Date;
}

interface QualityDefect {
  id: string;
  inspection_id: string;
  title: string;
  description: string;
  severity: 'critical' | 'major' | 'minor';
  status: 'open' | 'resolved' | 'verified';
  assignee_id?: string;
  created_at: Date;
  resolved_at?: Date;
}
```

### 1.3 事件總線問題分析

**問題識別**:
```typescript
// 當前 off() 實現的問題:
off<T>(type: string, handler: EventHandler<T>): void {
  const subs = this.subscriptions.get(type);
  if (!subs) return;
  
  // ❌ 問題: 無法匹配 handler 到 subscription
  subs.forEach(sub => sub.unsubscribe());
  this.subscriptions.delete(type);
}
```

**根本原因**:
- Subscription 和 Handler 之間沒有映射關係
- `off()` 會取消該事件類型的所有訂閱,而不是特定 handler

**解決方案**:
- 建立 Handler → Subscription 的映射表
- 實現精確的訂閱移除

---

## 🛠️ 階段 2: 技術解決方案設計

### 2.1 記憶體洩漏修復方案

#### 方案 A: 使用 `takeUntilDestroyed()` (推薦)

**優點**:
- Angular 19+ 官方推薦
- 自動在元件銷毀時取消訂閱
- 程式碼簡潔
- 零記憶體洩漏風險

**實現模式**:
```typescript
import { Component, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({ /* ... */ })
export class ExampleComponent {
  private destroyRef = inject(DestroyRef);
  
  ngOnInit() {
    this.data$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => { /* ... */ });
  }
}
```

#### 方案 B: Manual Subscription Management

**適用場景**: 需要手動控制訂閱生命週期

**實現模式**:
```typescript
@Component({ /* ... */ })
export class ExampleComponent implements OnDestroy {
  private subscriptions = new Subscription();
  
  ngOnInit() {
    this.subscriptions.add(
      this.data$.subscribe(data => { /* ... */ })
    );
  }
  
  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
```

**決策**: 優先使用方案 A (takeUntilDestroyed)

### 2.2 Event Bus 修復方案

#### 改進的 Event Bus 設計

```typescript
@Injectable({ providedIn: 'root' })
export class EventBus implements IEventBus {
  private readonly eventSubject = new Subject<IBlueprintEvent>();
  
  // 改進: Handler → Subscription 映射
  private readonly handlerMap = new Map<string, Map<EventHandler<any>, Subscription>>();
  
  on<T>(type: string, handler: EventHandler<T>): () => void {
    const subscription = this.eventSubject
      .pipe(filter(event => event.type === type))
      .subscribe(async event => {
        try {
          await handler(event as IBlueprintEvent<T>);
        } catch (error) {
          console.error(`[EventBus] Error in handler for event "${type}":`, error);
        }
      });
    
    // 存儲映射關係
    if (!this.handlerMap.has(type)) {
      this.handlerMap.set(type, new Map());
    }
    this.handlerMap.get(type)!.set(handler, subscription);
    
    return () => {
      subscription.unsubscribe();
      this.handlerMap.get(type)?.delete(handler);
    };
  }
  
  off<T>(type: string, handler: EventHandler<T>): void {
    const handlers = this.handlerMap.get(type);
    if (!handlers) return;
    
    const subscription = handlers.get(handler);
    if (subscription) {
      subscription.unsubscribe();
      handlers.delete(handler);
      
      if (handlers.size === 0) {
        this.handlerMap.delete(type);
      }
    }
  }
  
  dispose(): void {
    // 清理所有訂閱
    this.handlerMap.forEach(handlers => {
      handlers.forEach(sub => sub.unsubscribe());
    });
    this.handlerMap.clear();
    this.eventSubject.complete();
  }
}
```

### 2.3 品質模組架構設計

#### 模組結構

```
src/app/core/blueprint/modules/implementations/quality/
├── index.ts                      # 模組導出
├── module.metadata.ts            # 模組元數據
├── quality.module.ts             # 模組實現 (IBlueprintModule)
├── quality.service.ts            # 業務邏輯服務
├── quality.repository.ts         # 資料存取層
├── quality.component.ts          # UI 元件
├── quality.routes.ts             # 路由配置
├── quality.module.spec.ts        # 單元測試
└── models/
    ├── quality-inspection.model.ts
    └── quality-defect.model.ts
```

#### 實現步驟

1. **建立資料模型** (models/)
2. **實現 Repository** (quality.repository.ts)
3. **實現 Service** (quality.service.ts)
4. **實現 Module** (quality.module.ts)
5. **實現 Component** (quality.component.ts)
6. **配置路由** (quality.routes.ts)
7. **註冊模組** (implementations/index.ts)

---

## 📝 階段 3: 序列化可執行任務鏈 (SETC)

### Task Chain 1: 記憶體洩漏修復 (2天)

#### T1.1: Event Bus 修復 (0.5天)
**輸入**: 當前 event-bus.ts
**輸出**: 修復後的 event-bus.ts + 測試
**步驟**:
1. ✅ 添加 handlerMap 映射表
2. ✅ 重構 on() 方法
3. ✅ 重構 off() 方法
4. ✅ 更新 dispose() 方法
5. ✅ 添加單元測試
6. ✅ 執行測試驗證

#### T1.2: 全局訂閱清理 - 批次 1 (0.5天)
**範圍**: Core services (5 個檔案)
- `app.component.ts`
- `firebase-auth.service.ts`
- `refresh-token.ts`
- `i18n.service.ts`
- `basic.component.ts`

**步驟**:
1. ✅ 添加 DestroyRef 注入
2. ✅ 添加 takeUntilDestroyed() 到所有訂閱
3. ✅ 移除手動 unsubscribe (如有)
4. ✅ 測試每個修改的檔案

#### T1.3: 全局訂閱清理 - 批次 2 (0.5天)
**範圍**: Route components (12 個檔案)
- Team 相關元件 (3 個)
- Blueprint 相關元件 (6 個)
- Organization 相關元件 (3 個)

**步驟**: 同 T1.2

#### T1.4: 全局訂閱清理 - 批次 3 (0.25天)
**範圍**: Module implementations (4 個檔案)
- tasks.component.ts
- tasks.service.ts
- logs.service.ts
- module-manager.component.ts

**步驟**: 同 T1.2

#### T1.5: 驗證與測試 (0.25天)
**步驟**:
1. ✅ 執行完整測試套件
2. ✅ 執行 linting
3. ✅ 手動測試記憶體使用
4. ✅ 使用 Chrome DevTools Memory Profiler 驗證
5. ✅ 文檔更新

---

### Task Chain 2: 品質模組實施 (4-5天)

#### T2.1: 資料庫設計與 RLS 政策 (0.5天)
**輸出**: SQL migration files

```sql
-- quality_inspections table
CREATE TABLE quality_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'passed', 'failed', 'in_progress')),
  inspector_id UUID NOT NULL REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- quality_defects table
CREATE TABLE quality_defects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES quality_inspections(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  severity VARCHAR(50) NOT NULL CHECK (severity IN ('critical', 'major', 'minor')),
  status VARCHAR(50) NOT NULL CHECK (status IN ('open', 'resolved', 'verified')),
  assignee_id UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE quality_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_defects ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view inspections in their blueprints"
  ON quality_inspections FOR SELECT
  USING (is_blueprint_member(blueprint_id));

CREATE POLICY "Users can create inspections in their blueprints"
  ON quality_inspections FOR INSERT
  WITH CHECK (is_blueprint_member(blueprint_id));

-- Similar policies for quality_defects...
```

#### T2.2: TypeScript 模型定義 (0.25天)
**輸出**: models/ 目錄

```typescript
// quality-inspection.model.ts
export interface QualityInspection {
  id: string;
  blueprint_id: string;
  task_id?: string | null;
  title: string;
  description?: string | null;
  status: InspectionStatus;
  inspector_id: string;
  created_at: Date;
  updated_at: Date;
}

export enum InspectionStatus {
  PENDING = 'pending',
  PASSED = 'passed',
  FAILED = 'failed',
  IN_PROGRESS = 'in_progress'
}

// quality-defect.model.ts
export interface QualityDefect {
  id: string;
  inspection_id: string;
  title: string;
  description?: string | null;
  severity: DefectSeverity;
  status: DefectStatus;
  assignee_id?: string | null;
  created_at: Date;
  resolved_at?: Date | null;
}

export enum DefectSeverity {
  CRITICAL = 'critical',
  MAJOR = 'major',
  MINOR = 'minor'
}

export enum DefectStatus {
  OPEN = 'open',
  RESOLVED = 'resolved',
  VERIFIED = 'verified'
}
```

#### T2.3: Repository 實現 (0.75天)
**輸出**: quality.repository.ts

```typescript
@Injectable({ providedIn: 'root' })
export class QualityRepository {
  private readonly supabase = inject(SupabaseService);
  private readonly logger = inject(LoggerService);

  async findInspectionsByBlueprint(blueprintId: string): Promise<QualityInspection[]> {
    const { data, error } = await this.supabase.client
      .from('quality_inspections')
      .select('*')
      .eq('blueprint_id', blueprintId)
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error('[QualityRepository]', 'Failed to fetch inspections', error);
      throw error;
    }

    return data || [];
  }

  async createInspection(inspection: Omit<QualityInspection, 'id' | 'created_at' | 'updated_at'>): Promise<QualityInspection> {
    const { data, error } = await this.supabase.client
      .from('quality_inspections')
      .insert(inspection)
      .select()
      .single();

    if (error) {
      this.logger.error('[QualityRepository]', 'Failed to create inspection', error);
      throw error;
    }

    return data;
  }

  // ... 其他 CRUD 方法
}
```

#### T2.4: Service 實現 (1天)
**輸出**: quality.service.ts

```typescript
@Injectable({ providedIn: 'root' })
export class QualityService {
  private readonly repository = inject(QualityRepository);
  private readonly logger = inject(LoggerService);
  private readonly eventBus = inject(EventBus);

  // State signals
  private readonly _inspections = signal<QualityInspection[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // Public readonly state
  readonly inspections = this._inspections.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed signals
  readonly pendingInspections = computed(() =>
    this._inspections().filter(i => i.status === InspectionStatus.PENDING)
  );

  readonly failedInspections = computed(() =>
    this._inspections().filter(i => i.status === InspectionStatus.FAILED)
  );

  async loadInspections(blueprintId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const inspections = await this.repository.findInspectionsByBlueprint(blueprintId);
      this._inspections.set(inspections);
      this.logger.info('[QualityService]', `Loaded ${inspections.length} inspections`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this._error.set(message);
      this.logger.error('[QualityService]', 'Failed to load inspections', err as Error);
      throw err;
    } finally {
      this._loading.set(false);
    }
  }

  async createInspection(inspection: Omit<QualityInspection, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    try {
      const newInspection = await this.repository.createInspection(inspection);
      this._inspections.update(inspections => [...inspections, newInspection]);

      // Emit event
      this.eventBus.emit('QUALITY_INSPECTION_CREATED', newInspection, 'quality-module');

      this.logger.info('[QualityService]', 'Inspection created', newInspection.id);
    } catch (err) {
      this.logger.error('[QualityService]', 'Failed to create inspection', err as Error);
      throw err;
    }
  }

  clearState(): void {
    this._inspections.set([]);
    this._loading.set(false);
    this._error.set(null);
  }
}
```

#### T2.5: Module 實現 (1天)
**輸出**: quality.module.ts

```typescript
@Injectable()
export class QualityModule implements IBlueprintModule {
  private readonly logger = inject(LoggerService);
  private readonly qualityService = inject(QualityService);
  private readonly qualityRepository = inject(QualityRepository);

  readonly id = 'quality';
  readonly name = '品質管理';
  readonly version = '1.0.0';
  readonly description = '品質檢查與缺陷追蹤管理';
  readonly dependencies = ['context', 'logger'];
  readonly status: WritableSignal<ModuleStatus> = signal(ModuleStatus.UNINITIALIZED);

  private context?: IExecutionContext;
  private blueprintId?: string;
  private eventUnsubscribers: Array<() => void> = [];

  readonly exports = {
    service: () => this.qualityService,
    repository: () => this.qualityRepository
  };

  async init(context: IExecutionContext): Promise<void> {
    this.logger.info('[QualityModule]', 'Initializing...');
    this.status.set(ModuleStatus.INITIALIZING);

    try {
      this.context = context;
      this.blueprintId = context.blueprintId;

      if (!this.blueprintId) {
        throw new Error('Blueprint ID not found in execution context');
      }

      this.validateDependencies(context);
      this.subscribeToEvents(context);

      this.status.set(ModuleStatus.INITIALIZED);
      this.logger.info('[QualityModule]', 'Initialized successfully');
    } catch (error) {
      this.status.set(ModuleStatus.ERROR);
      this.logger.error('[QualityModule]', 'Initialization failed', error as Error);
      throw error;
    }
  }

  async start(): Promise<void> {
    this.logger.info('[QualityModule]', 'Starting...');
    this.status.set(ModuleStatus.STARTING);

    try {
      if (!this.blueprintId) {
        throw new Error('Module not initialized - blueprint ID missing');
      }

      await this.qualityService.loadInspections(this.blueprintId);

      this.status.set(ModuleStatus.STARTED);
      this.logger.info('[QualityModule]', 'Started successfully');
    } catch (error) {
      this.status.set(ModuleStatus.ERROR);
      this.logger.error('[QualityModule]', 'Start failed', error as Error);
      throw error;
    }
  }

  async ready(): Promise<void> {
    this.logger.info('[QualityModule]', 'Ready');
    this.status.set(ModuleStatus.READY);

    if (this.context?.eventBus) {
      this.context.eventBus.emit({
        type: 'QUALITY_MODULE_READY',
        source: this.id,
        payload: { status: 'ready' },
        timestamp: new Date()
      });
    }

    this.status.set(ModuleStatus.RUNNING);
    this.logger.info('[QualityModule]', 'Running');
  }

  async stop(): Promise<void> {
    this.logger.info('[QualityModule]', 'Stopping...');
    this.status.set(ModuleStatus.STOPPING);

    this.qualityService.clearState();

    this.status.set(ModuleStatus.STOPPED);
    this.logger.info('[QualityModule]', 'Stopped successfully');
  }

  async dispose(): Promise<void> {
    this.logger.info('[QualityModule]', 'Disposing...');

    this.unsubscribeFromEvents();
    this.qualityService.clearState();
    this.context = undefined;
    this.blueprintId = undefined;

    this.status.set(ModuleStatus.DISPOSED);
    this.logger.info('[QualityModule]', 'Disposed successfully');
  }

  private validateDependencies(context: IExecutionContext): void {
    for (const depId of this.dependencies) {
      const dependency = context.getModule?.(depId);
      if (!dependency) {
        throw new Error(`Required dependency not found: ${depId}`);
      }
    }
  }

  private subscribeToEvents(context: IExecutionContext): void {
    if (!context.eventBus) {
      this.logger.warn('[QualityModule]', 'EventBus not available in context');
      return;
    }

    // Subscribe to task completion events
    const unsubscribe = context.eventBus.on('TASK_COMPLETED', async (event) => {
      this.logger.debug('[QualityModule]', 'Task completed, may need quality inspection', event.payload);
      // Auto-create quality inspection for completed tasks
    });

    this.eventUnsubscribers.push(unsubscribe);
  }

  private unsubscribeFromEvents(): void {
    this.eventUnsubscribers.forEach(unsub => unsub());
    this.eventUnsubscribers = [];
  }
}
```

#### T2.6: Component 實現 (1天)
**輸出**: quality.component.ts

```typescript
@Component({
  selector: 'app-quality',
  standalone: true,
  imports: [SHARED_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <page-header [title]="'品質管理'" [breadcrumb]="breadcrumb" [action]="action">
      <ng-template #action>
        <button nz-button nzType="primary" (click)="createInspection()">
          <span nz-icon nzType="plus"></span>
          新增檢查
        </button>
      </ng-template>
    </page-header>

    <nz-card>
      <nz-tabs>
        <nz-tab-pane nzTitle="進行中">
          @if (loading()) {
            <nz-spin nzSimple />
          } @else {
            <st
              [data]="pendingInspections()"
              [columns]="columns"
              [page]="{ show: true, showSize: true }"
            ></st>
          }
        </nz-tab-pane>
        <nz-tab-pane nzTitle="已完成">
          <st
            [data]="completedInspections()"
            [columns]="columns"
            [page]="{ show: true, showSize: true }"
          ></st>
        </nz-tab-pane>
        <nz-tab-pane nzTitle="不合格">
          <st
            [data]="failedInspections()"
            [columns]="columns"
            [page]="{ show: true, showSize: true }"
          ></st>
        </nz-tab-pane>
      </nz-tabs>
    </nz-card>
  `
})
export class QualityComponent implements OnInit {
  private readonly qualityService = inject(QualityService);
  private readonly route = inject(ActivatedRoute);
  private readonly modal = inject(ModalHelper);
  private readonly logger = inject(LoggerService);
  private readonly destroyRef = inject(DestroyRef);

  // State from service
  readonly inspections = this.qualityService.inspections;
  readonly loading = this.qualityService.loading;
  readonly error = this.qualityService.error;

  // Computed
  readonly pendingInspections = this.qualityService.pendingInspections;
  readonly failedInspections = this.qualityService.failedInspections;
  readonly completedInspections = computed(() =>
    this.inspections().filter(i => i.status === InspectionStatus.PASSED)
  );

  columns: STColumn[] = [
    { title: '標題', index: 'title' },
    { title: '狀態', index: 'status', type: 'badge' },
    { title: '檢查人員', index: 'inspector_id' },
    { title: '建立時間', index: 'created_at', type: 'date' },
    {
      title: '操作',
      buttons: [
        { text: '查看', click: (record: any) => this.viewDetails(record) },
        { text: '編輯', click: (record: any) => this.editInspection(record) }
      ]
    }
  ];

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const blueprintId = params['blueprintId'];
        if (blueprintId) {
          this.qualityService.loadInspections(blueprintId);
        }
      });
  }

  createInspection(): void {
    // Open modal for creating inspection
  }

  viewDetails(inspection: QualityInspection): void {
    // Navigate to details page
  }

  editInspection(inspection: QualityInspection): void {
    // Open edit modal
  }
}
```

#### T2.7: 路由配置與註冊 (0.25天)
**輸出**: quality.routes.ts + 更新 implementations/index.ts

#### T2.8: 測試與驗證 (0.25天)
**步驟**:
1. ✅ 單元測試
2. ✅ 整合測試
3. ✅ E2E 測試
4. ✅ 手動測試

---

## 🔄 階段 4: 驗證與品質保證

### 驗證清單

**功能驗證**:
- [ ] 記憶體洩漏修復驗證
  - [ ] 使用 Chrome DevTools Memory Profiler
  - [ ] 長時間運行測試 (30 分鐘+)
  - [ ] 記憶體快照對比

- [ ] 品質模組功能驗證
  - [ ] CRUD 操作正常
  - [ ] 事件發布/訂閱正常
  - [ ] 與任務模組整合正常
  - [ ] RLS 政策生效

- [ ] 事件總線修復驗證
  - [ ] off() 方法正確移除特定 handler
  - [ ] 多個 handler 互不影響
  - [ ] 訂閱計數正確

**程式碼品質**:
- [ ] 通過 ESLint
- [ ] 通過 Stylelint
- [ ] 通過 TypeScript 編譯
- [ ] 測試覆蓋率 > 80%

**性能驗證**:
- [ ] 記憶體使用穩定
- [ ] 無記憶體洩漏
- [ ] 載入時間 < 3秒
- [ ] 操作響應時間 < 500ms

---

## 📊 階段 5: 風險評估與緩解

### 風險矩陣

| 風險 | 可能性 | 影響 | 緩解措施 |
|------|--------|------|----------|
| 修復破壞現有功能 | 中 | 高 | 完整測試套件,逐步修復 |
| 品質模組複雜度超預期 | 中 | 中 | 分階段實現,MVP 優先 |
| Event Bus 修改影響其他模組 | 低 | 高 | 向後相容設計,完整測試 |
| 時程延誤 | 中 | 中 | 優先級排序,核心功能優先 |

---

## 📅 時程規劃

### Week 1 (Day 1-3): 記憶體洩漏修復

**Day 1**:
- 上午: T1.1 Event Bus 修復
- 下午: T1.2 Core services 訂閱清理

**Day 2**:
- 上午: T1.3 Route components 訂閱清理
- 下午: T1.4 Module implementations 訂閱清理

**Day 3** (Half):
- 上午: T1.5 驗證與測試

### Week 1-2 (Day 3.5-8): 品質模組實施

**Day 3** (Half):
- 下午: T2.1 資料庫設計 + T2.2 模型定義

**Day 4**:
- 全天: T2.3 Repository 實現

**Day 5**:
- 全天: T2.4 Service 實現

**Day 6**:
- 全天: T2.5 Module 實現

**Day 7**:
- 全天: T2.6 Component 實現

**Day 8** (Half):
- 上午: T2.7 路由配置
- 下午: T2.8 測試與驗證

---

## 🎯 成功指標

### 關鍵績效指標 (KPI)

1. **記憶體洩漏修復**:
   - ✅ 所有訂閱都有清理機制
   - ✅ Memory Profiler 顯示記憶體穩定
   - ✅ 長時間運行無記憶體增長

2. **品質模組實施**:
   - ✅ 模組完整實現 IBlueprintModule
   - ✅ CRUD 功能完整
   - ✅ 與系統整合成功
   - ✅ 測試覆蓋率 > 80%

3. **事件總線修復**:
   - ✅ off() 方法正確運作
   - ✅ 無記憶體洩漏
   - ✅ 訂閱管理精確

4. **程式碼品質**:
   - ✅ 通過所有 linting
   - ✅ 零 TypeScript 錯誤
   - ✅ 符合專案編碼標準

---

## 📚 參考文件

- Angular 官方文檔: https://angular.dev
- RxJS 官方文檔: https://rxjs.dev
- ng-alain 文檔: https://ng-alain.com
- Supabase 文檔: https://supabase.com/docs
- 專案約束規則: `.github/copilot/constraints.md`

---

## 📝 附錄

### A. 記憶體洩漏檢測工具

**Chrome DevTools Memory Profiler**:
1. 開啟 DevTools > Memory
2. 選擇 "Heap snapshot"
3. 執行操作 → 拍攝快照
4. 重複步驟 3 多次
5. 比較快照,檢查物件增長

**Angular DevTools**:
- 檢查 Component 樹
- 監控變更偵測
- 分析 dependency injection

### B. 測試腳本

```bash
# 記憶體洩漏測試
yarn test-coverage

# Lint 檢查
yarn lint

# 建置檢查
yarn build

# E2E 測試
yarn e2e
```

### C. 程式碼審查檢查清單

```markdown
- [ ] 所有訂閱都使用 takeUntilDestroyed()
- [ ] 沒有手動 unsubscribe (除非必要)
- [ ] Event Bus 訂閱都有清理
- [ ] Modal/Drawer 訂閱都有清理
- [ ] 符合 Angular 20 最佳實踐
- [ ] 使用 Signals 進行狀態管理
- [ ] 使用新控制流語法 (@if, @for)
- [ ] 符合專案架構模式
```

---

**最後更新**: 2025-12-11
**版本**: 1.0.0
**作者**: GigHub Development Team
