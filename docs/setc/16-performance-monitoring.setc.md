# 16-performance-monitoring.setc.md

## 1. 模組概述

### 業務價值
效能監控與優化確保系統的穩定性與使用者體驗：
- **用戶體驗**：快速的頁面載入與互動響應
- **系統穩定性**：即時發現與處理效能問題
- **成本控制**：優化資源使用，降低運營成本
- **容量規劃**：基於數據的擴展決策

### 核心功能
1. **效能基準**：定義各項效能指標的目標值
2. **監控指標**：收集與追蹤關鍵效能數據
3. **優化策略**：前端與後端的效能優化方法
4. **告警機制**：效能異常的即時通知

### 在系統中的定位
效能監控是橫切所有模組的技術關注點，從前端載入到後端 API 響應，全鏈路追蹤與優化。

---

## 2. 功能需求

### 效能需求清單

#### PERF-001: 前端效能監控
**需求**：追蹤並優化前端核心指標

**驗收標準**：
- [ ] FCP (First Contentful Paint) < 1.5s
- [ ] LCP (Largest Contentful Paint) < 2.5s
- [ ] INP (Interaction to Next Paint) < 200ms
- [ ] CLS (Cumulative Layout Shift) < 0.1
- [ ] TTI (Time to Interactive) < 3.5s

#### PERF-002: 後端效能監控
**需求**：追蹤並優化 API 響應時間

**驗收標準**：
- [ ] API P50 延遲 < 200ms
- [ ] API P95 延遲 < 500ms
- [ ] API P99 延遲 < 1s
- [ ] 資料庫查詢 P95 < 100ms
- [ ] 錯誤率 < 0.1%

#### PERF-003: 資料庫效能監控
**需求**：追蹤並優化資料庫效能

**驗收標準**：
- [ ] 查詢執行計劃分析
- [ ] 慢查詢記錄與告警
- [ ] 連線池使用率監控
- [ ] 索引使用率追蹤

#### PERF-004: 資源使用監控
**需求**：追蹤系統資源使用情況

**驗收標準**：
- [ ] CPU 使用率監控
- [ ] 記憶體使用率監控
- [ ] 儲存空間使用監控
- [ ] 網路流量監控

### 優先級與依賴關係

| 優先級 | 功能 | 依賴 |
|--------|------|------|
| P0 | 前端 Core Web Vitals | Angular |
| P0 | API 響應時間 | Supabase |
| P1 | 資料庫效能監控 | PostgreSQL |
| P1 | 錯誤追蹤 | 日誌系統 |
| P2 | 資源使用監控 | 基礎設施 |
| P2 | 告警系統 | 監控指標 |

---

## 3. 技術設計

### 效能指標定義

**前端 Core Web Vitals**：

| 指標 | 目標 | 良好 | 需改進 | 差 |
|------|------|------|--------|-----|
| FCP | < 1.5s | ≤ 1.8s | ≤ 3s | > 3s |
| LCP | < 2.5s | ≤ 2.5s | ≤ 4s | > 4s |
| INP | < 200ms | ≤ 200ms | ≤ 500ms | > 500ms |
| CLS | < 0.1 | ≤ 0.1 | ≤ 0.25 | > 0.25 |
| TTFB | < 800ms | ≤ 800ms | ≤ 1800ms | > 1800ms |

**後端 API 效能**：

| 指標 | 定義 | 目標值 |
|------|------|--------|
| P50 | 50% 請求響應時間 | < 200ms |
| P95 | 95% 請求響應時間 | < 500ms |
| P99 | 99% 請求響應時間 | < 1000ms |
| 錯誤率 | 失敗請求比例 | < 0.1% |
| 吞吐量 | 每秒請求數 | > 100 RPS |

### 監控架構

```
前端應用
    │
    ▼
┌─────────────────┐
│  Performance    │ ─── Core Web Vitals 收集
│  Observer API   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Analytics      │ ─── 指標上報
│  Service        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Monitoring     │ ─── 資料聚合與視覺化
│  Dashboard      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Alert          │ ─── 告警通知
│  System         │
└─────────────────┘
```

### 前端效能監控實作

**Core Web Vitals 收集**：
```typescript
@Injectable({ providedIn: 'root' })
export class PerformanceMonitorService {
  private readonly metrics = signal<PerformanceMetrics>({});

  constructor() {
    this.observeCoreWebVitals();
  }

  private observeCoreWebVitals(): void {
    // FCP
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.reportMetric('FCP', entry.startTime);
        }
      }
    }).observe({ entryTypes: ['paint'] });

    // LCP
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.reportMetric('LCP', lastEntry.startTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // CLS
    let clsValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any[]) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      this.reportMetric('CLS', clsValue);
    }).observe({ entryTypes: ['layout-shift'] });

    // INP
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.reportMetric('INP', entry.duration);
      }
    }).observe({ entryTypes: ['event'] });
  }

  private reportMetric(name: string, value: number): void {
    this.metrics.update(m => ({ ...m, [name]: value }));
    // 上報到監控系統
    this.sendToAnalytics(name, value);
  }
}
```

**資源載入監控**：
```typescript
interface ResourceTiming {
  name: string;
  type: string;
  duration: number;
  transferSize: number;
}

function getResourceTimings(): ResourceTiming[] {
  return performance.getEntriesByType('resource').map(entry => ({
    name: entry.name,
    type: (entry as PerformanceResourceTiming).initiatorType,
    duration: entry.duration,
    transferSize: (entry as PerformanceResourceTiming).transferSize
  }));
}
```

### 後端效能監控

**API 響應時間追蹤**：
```typescript
@Injectable({ providedIn: 'root' })
export class ApiPerformanceService {
  private readonly metrics = new Map<string, number[]>();

  trackRequest(endpoint: string, duration: number): void {
    if (!this.metrics.has(endpoint)) {
      this.metrics.set(endpoint, []);
    }
    this.metrics.get(endpoint)!.push(duration);
    
    // 保留最近 1000 筆
    const list = this.metrics.get(endpoint)!;
    if (list.length > 1000) {
      list.shift();
    }
  }

  getPercentile(endpoint: string, percentile: number): number {
    const list = this.metrics.get(endpoint) || [];
    if (list.length === 0) return 0;
    
    const sorted = [...list].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }
}
```

**HTTP Interceptor 整合**：
```typescript
@Injectable()
export class PerformanceInterceptor implements HttpInterceptor {
  private readonly perfService = inject(ApiPerformanceService);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const startTime = performance.now();
    
    return next.handle(req).pipe(
      finalize(() => {
        const duration = performance.now() - startTime;
        this.perfService.trackRequest(req.url, duration);
      })
    );
  }
}
```

### 資料庫效能監控

**慢查詢追蹤（PostgreSQL）**：
```sql
-- 啟用慢查詢日誌
ALTER SYSTEM SET log_min_duration_statement = '100';  -- 記錄超過 100ms 的查詢

-- 查詢統計視圖
CREATE VIEW slow_queries AS
SELECT 
  query,
  calls,
  total_time / 1000 as total_seconds,
  mean_time / 1000 as mean_seconds,
  rows
FROM pg_stat_statements
WHERE mean_time > 100
ORDER BY mean_time DESC
LIMIT 20;
```

**索引使用率監控**：
```sql
-- 未使用的索引
SELECT 
  schemaname || '.' || relname AS table,
  indexrelname AS index,
  idx_scan as scans
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND schemaname = 'public';

-- 索引使用統計
SELECT 
  relname AS table,
  seq_scan AS sequential_scans,
  idx_scan AS index_scans,
  seq_scan - idx_scan AS diff
FROM pg_stat_user_tables
WHERE seq_scan - idx_scan > 0
ORDER BY diff DESC;
```

### 告警規則

| 監控項目 | 告警閾值 | 響應層級 | 處理方式 |
|----------|----------|----------|----------|
| API P99 響應時間 | > 2s | 🔴 Critical | 立即處理 |
| API 錯誤率 | > 5% | 🔴 Critical | 立即處理 |
| 資料庫連線池 | > 80% | ⚠️ Warning | 1 小時內處理 |
| 儲存空間使用 | > 80% | ⚠️ Warning | 24 小時內處理 |
| Realtime 連線數 | > 1000 | ℹ️ Info | 持續觀察 |
| 記憶體使用率 | > 85% | 🔴 Critical | 立即處理 |
| FCP | > 3s | ⚠️ Warning | 1 週內優化 |
| LCP | > 4s | ⚠️ Warning | 1 週內優化 |

---

## 4. 安全與權限

### 監控資料安全

- 監控資料不應包含敏感用戶資訊
- 錯誤日誌需脫敏處理
- 監控後台需要權限控制

### 存取控制

```typescript
// 只有管理員可以存取監控 Dashboard
@Guard('monitoring:read')
@Component({...})
export class MonitoringDashboardComponent {}
```

---

## 5. 測試規範

### 效能測試清單

| 測試項目 | 測試工具 | 預期結果 |
|----------|----------|----------|
| 頁面載入效能 | Lighthouse | Performance Score > 90 |
| 任務列表渲染 | Chrome DevTools | 1000 項目 < 500ms |
| API 壓力測試 | k6 / Artillery | P99 < 1s @ 100 RPS |
| 資料庫壓力測試 | pgbench | TPS > 1000 |
| 記憶體洩漏測試 | Chrome DevTools | 無明顯記憶體增長 |

### 效能回歸測試

```typescript
describe('Performance Regression', () => {
  it('task list should render 1000 items under 500ms', async () => {
    const startTime = performance.now();
    
    component.tasks.set(generateTasks(1000));
    fixture.detectChanges();
    await fixture.whenStable();
    
    const duration = performance.now() - startTime;
    expect(duration).toBeLessThan(500);
  });

  it('API response should be under 200ms for P50', async () => {
    const durations: number[] = [];
    
    for (let i = 0; i < 100; i++) {
      const start = performance.now();
      await taskService.getTasks(blueprintId);
      durations.push(performance.now() - start);
    }
    
    const p50 = percentile(durations, 50);
    expect(p50).toBeLessThan(200);
  });
});
```

### 負載測試腳本

```javascript
// k6 負載測試腳本
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 50 },   // 1 分鐘爬升到 50 用戶
    { duration: '3m', target: 100 },  // 3 分鐘維持 100 用戶
    { duration: '1m', target: 0 },    // 1 分鐘降到 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const res = http.get('https://api.example.com/tasks');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
```

---

## 6. 效能考量

### 前端優化策略

1. **Bundle 優化**：
   - 啟用 Tree Shaking
   - 動態導入（Code Splitting）
   - 壓縮與 gzip
   - 預載入關鍵資源

2. **渲染優化**：
   - 使用 `OnPush` 變更檢測
   - 使用 `trackBy` 優化列表
   - 使用 `@defer` 延遲載入
   - 虛擬捲動大列表

3. **網路優化**：
   - 使用 Service Worker 快取
   - 預載入關鍵 API 資料
   - 圖片懶載入
   - 使用 CDN

```typescript
// 虛擬捲動實作
@Component({
  template: `
    <cdk-virtual-scroll-viewport itemSize="50" class="task-list">
      <app-task-item
        *cdkVirtualFor="let task of tasks(); trackBy: trackById"
        [task]="task"
      />
    </cdk-virtual-scroll-viewport>
  `
})
export class TaskListComponent {
  trackById = (index: number, task: Task) => task.id;
}
```

### 後端優化策略

1. **資料庫優化**：
   - 適當的索引設計
   - 查詢計劃分析
   - 連線池配置
   - 讀寫分離（如需要）

2. **快取策略**：

   | 資料類型 | 快取策略 | TTL | 失效條件 |
   |----------|----------|-----|----------|
   | 用戶權限 | Memory + Signal | 30 分鐘 | 權限變更事件 |
   | 藍圖設定 | Memory | 10 分鐘 | 設定更新事件 |
   | 任務列表 | Memory + Signal | Realtime 更新 | 手動刷新 |
   | 檔案元資料 | Memory | 5 分鐘 | 上傳/刪除操作 |
   | 統計數據 | Memory | 1 分鐘 | 手動刷新 |

3. **API 優化**：
   - 分頁與限制
   - 欄位選擇（GraphQL-like）
   - 批次操作
   - 壓縮響應

---

## 7. 實作檢查清單

### Phase 1: 監控基礎設施
- [ ] PerformanceMonitorService 建立
- [ ] Core Web Vitals 收集
- [ ] API 響應時間追蹤
- [ ] HTTP Interceptor 設定

### Phase 2: 資料庫監控
- [ ] 慢查詢日誌啟用
- [ ] 索引使用率監控
- [ ] 連線池監控
- [ ] 查詢計劃分析工具

### Phase 3: 告警系統
- [ ] 告警規則定義
- [ ] 通知管道設定
- [ ] 告警升級機制
- [ ] 告警歷史記錄

### Phase 4: Dashboard
- [ ] 監控儀表板 UI
- [ ] 即時數據視覺化
- [ ] 歷史趨勢分析
- [ ] 報表匯出功能

### Phase 5: 優化實施
- [ ] 前端 Bundle 優化
- [ ] 資料庫查詢優化
- [ ] 快取策略實施
- [ ] 效能回歸測試

---

**文件版本**: v1.0
**最後更新**: 2025-11-28
**維護者**: 專案架構師
