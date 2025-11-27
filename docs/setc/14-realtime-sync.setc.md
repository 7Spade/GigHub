# 14-realtime-sync.setc.md

## 1. 模組概述

### 業務價值
Realtime 與離線同步確保多人協作的即時性與資料一致性：
- **即時協作**：多用戶同時編輯時即時更新
- **離線支援**：網路斷線時繼續操作
- **資料一致性**：自動衝突解決與同步
- **用戶體驗**：無縫的線上/離線切換

### 核心功能
1. **Realtime 事件規範**：定義事件格式與訂閱策略
2. **離線操作策略**：本地暫存與隊列管理
3. **衝突解決機制**：多用戶併發編輯處理
4. **訂閱管理**：頻道生命週期與資源釋放

### 在系統中的定位
Realtime 與離線同步是橫切所有業務模組的技術關注點，為任務、日誌、待辦等模組提供即時更新能力。

---

## 2. 功能需求

### 使用者故事列表

#### RT-001: Realtime 任務更新
**作為** 團隊成員
**我想要** 看到其他成員對任務的即時修改
**以便於** 掌握最新的任務狀態

**驗收標準**：
- [ ] 任務狀態變更即時同步到所有在線成員
- [ ] 任務指派變更即時通知
- [ ] 任務進度更新即時顯示
- [ ] 新增/刪除任務即時反映

#### RT-002: 離線任務編輯
**作為** 現場施工人員
**我想要** 在網路不穩定時仍能編輯任務
**以便於** 不受網路環境影響工作

**驗收標準**：
- [ ] 離線時可建立新任務
- [ ] 離線時可更新任務狀態
- [ ] 離線時可上傳照片（本地暫存）
- [ ] 恢復連線後自動同步

#### RT-003: 衝突解決
**作為** 系統
**我想要** 自動處理多人同時編輯的衝突
**以便於** 維護資料一致性

**驗收標準**：
- [ ] 同一欄位衝突採用 Last-Write-Wins
- [ ] 保留衝突歷史供檢視
- [ ] 嚴重衝突通知用戶
- [ ] 支援手動合併

#### RT-004: 訂閱生命週期管理
**作為** 系統
**我想要** 正確管理 Realtime 訂閱
**以便於** 避免資源洩漏

**驗收標準**：
- [ ] 進入藍圖時建立訂閱
- [ ] 離開藍圖時取消訂閱
- [ ] 切換藍圖時正確切換訂閱
- [ ] 瀏覽器關閉時清理訂閱

### 優先級與依賴關係

| 優先級 | 功能 | 依賴 |
|--------|------|------|
| P0 | Realtime 基礎架構 | Supabase Realtime |
| P0 | 訂閱管理 | Angular 生命週期 |
| P1 | 離線暫存 | IndexedDB |
| P1 | 自動同步 | 離線暫存 |
| P2 | 衝突解決 | Realtime + 離線同步 |
| P3 | 衝突歷史 | 衝突解決 |

---

## 3. 技術設計

### Realtime 事件格式

**標準事件格式**：
```typescript
interface RealtimeEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  commit_timestamp: string;
  old: Record<string, any> | null;
  new: Record<string, any> | null;
}

interface BroadcastEvent {
  type: string;        // 事件類型，如 'task:updated', 'member:joined'
  payload: object;     // 事件資料
  timestamp: string;   // ISO 8601 格式
  actor_id: string;    // 觸發者帳戶 ID
}
```

### 需要 Realtime 的資料表

| 資料表 | 啟用 Realtime | 理由 | 訂閱範圍 |
|--------|--------------|------|----------|
| `tasks` | ✅ 是 | 多人協作編輯核心 | `blueprint_id = X` |
| `task_comments` | ✅ 是 | 討論即時更新 | `task_id = X` |
| `diaries` | ✅ 是 | 日誌狀態同步 | `blueprint_id = X` |
| `task_acceptances` | ✅ 是 | 驗收狀態即時通知 | `task_id = X` |
| `issues` | ✅ 是 | 問題狀態追蹤 | `blueprint_id = X` |
| `notifications` | ✅ 是 | 通知即時推送 | `recipient_id = auth.uid()` |
| `blueprint_members` | ⚠️ 視需求 | 成員變更較少 | `blueprint_id = X` |
| `accounts` | ❌ 否 | 變更頻率低 | - |
| `blueprints` | ❌ 否 | 設定變更頻率低 | - |
| `checklists` | ❌ 否 | 範本資料穩定 | - |
| `files` | ❌ 否 | 輪詢或手動刷新 | - |

### 訂閱實作

**Blueprint 級別訂閱**：
```typescript
@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private readonly supabase = inject(SupabaseService);
  private activeChannel: RealtimeChannel | null = null;

  setupBlueprintSubscription(blueprintId: string): void {
    // 清理現有訂閱
    this.teardown();

    this.activeChannel = this.supabase.client
      .channel(`blueprint:${blueprintId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `blueprint_id=eq.${blueprintId}`
        },
        (payload) => this.handleTaskChange(payload)
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'diaries',
          filter: `blueprint_id=eq.${blueprintId}`
        },
        (payload) => this.handleDiaryChange(payload)
      )
      .subscribe();
  }

  teardown(): void {
    this.activeChannel?.unsubscribe();
    this.activeChannel = null;
  }
}
```

### 冪等性處理

```typescript
@Injectable({ providedIn: 'root' })
export class IdempotencyService {
  private processedEvents = new Set<string>();
  private readonly MAX_CACHE_SIZE = 1000;

  shouldProcess(event: RealtimeEvent): boolean {
    const key = this.generateKey(event);
    
    if (this.processedEvents.has(key)) {
      console.debug('[Realtime] Duplicate event ignored:', key);
      return false;
    }
    
    this.processedEvents.add(key);
    
    // 防止快取無限增長
    if (this.processedEvents.size > this.MAX_CACHE_SIZE) {
      const firstKey = this.processedEvents.values().next().value;
      this.processedEvents.delete(firstKey);
    }
    
    return true;
  }

  private generateKey(event: RealtimeEvent): string {
    const recordId = event.new?.id || event.old?.id;
    return `${event.table}:${recordId}:${event.commit_timestamp}`;
  }
}
```

### 離線操作策略

**離線隊列設計**：
```typescript
interface OfflineOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  table: string;
  data: Record<string, any>;
  timestamp: string;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed';
}

@Injectable({ providedIn: 'root' })
export class OfflineQueueService {
  private db!: IDBDatabase;
  private readonly STORE_NAME = 'offline_operations';

  async enqueue(operation: OfflineOperation): Promise<void> {
    const tx = this.db.transaction(this.STORE_NAME, 'readwrite');
    const store = tx.objectStore(this.STORE_NAME);
    await store.add(operation);
  }

  async dequeue(): Promise<OfflineOperation | null> {
    const tx = this.db.transaction(this.STORE_NAME, 'readonly');
    const store = tx.objectStore(this.STORE_NAME);
    const cursor = await store.openCursor();
    return cursor?.value || null;
  }

  async syncAll(): Promise<void> {
    let operation = await this.dequeue();
    while (operation) {
      try {
        await this.syncOperation(operation);
        await this.remove(operation.id);
      } catch (error) {
        await this.handleSyncError(operation, error);
      }
      operation = await this.dequeue();
    }
  }
}
```

### 衝突解決機制

**衝突解決策略**：

| 場景 | 策略 | 說明 |
|------|------|------|
| 同一欄位同時更新 | Last-Write-Wins | 以時間戳較新者為準 |
| 離線操作與線上衝突 | 線上優先 | 離線操作嘗試合併，失敗則通知 |
| 刪除與更新衝突 | 刪除優先 | 已刪除資料不接受更新 |
| 父子關係衝突 | 拒絕操作 | 保護資料完整性 |

```typescript
interface ConflictResolution {
  id: string;
  table: string;
  record_id: string;
  local_version: Record<string, any>;
  server_version: Record<string, any>;
  resolution: 'local_wins' | 'server_wins' | 'manual';
  resolved_at: string;
  resolved_by?: string;
}

@Injectable({ providedIn: 'root' })
export class ConflictResolver {
  resolve(local: any, server: any): ConflictResolution {
    const localTime = new Date(local.updated_at).getTime();
    const serverTime = new Date(server.updated_at).getTime();

    // Last-Write-Wins
    if (serverTime > localTime) {
      return { resolution: 'server_wins', ...this.createResolution(local, server) };
    }
    return { resolution: 'local_wins', ...this.createResolution(local, server) };
  }
}
```

### 順序保證策略

| 場景 | 策略 | 說明 |
|------|------|------|
| 同一記錄的更新 | 比較 `commit_timestamp` | 忽略較舊的事件 |
| 跨記錄的操作 | 無強順序保證 | 最終一致性 |
| 批次操作 | 應用層排序 | 根據 `sort_order` 重排 |

```typescript
handleTaskUpdate(event: RealtimeEvent): void {
  const existingTask = this._tasks().find(t => t.id === event.new.id);
  
  if (existingTask) {
    const existingTime = new Date(existingTask.updated_at).getTime();
    const eventTime = new Date(event.new.updated_at).getTime();
    
    // 忽略過期事件
    if (eventTime < existingTime) {
      console.debug('[Realtime] Stale event ignored');
      return;
    }
  }
  
  // 套用更新
  this._tasks.update(tasks =>
    tasks.map(t => (t.id === event.new.id ? event.new : t))
  );
}
```

---

## 4. 安全與權限

### Realtime 權限控制

**訂閱權限**：
- Realtime 訂閱受 RLS 政策限制
- 用戶只能收到有權存取的資料變更
- `filter` 參數進一步限制訂閱範圍

**安全注意事項**：
- 不要在 Realtime 中傳遞敏感資料
- 使用 `filter` 避免過度訂閱
- 定期清理過期訂閱

### 離線資料安全

```typescript
// 離線資料加密儲存
async function encryptData(data: any, key: CryptoKey): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(JSON.stringify(data))
  );
  return encrypted;
}
```

---

## 5. 測試規範

### 單元測試清單

| 測試項目 | 測試方法 | 預期結果 |
|----------|----------|----------|
| 訂閱建立 | `setupSubscription_validBlueprint_subscriptionCreated` | 頻道建立成功 |
| 訂閱取消 | `teardown_activeSubscription_subscriptionRemoved` | 頻道取消，資源釋放 |
| 冪等性檢查 | `shouldProcess_duplicateEvent_returnsFalse` | 重複事件被過濾 |
| 時間戳比較 | `handleUpdate_staleEvent_ignored` | 過期事件被忽略 |
| 離線入隊 | `enqueue_offlineOperation_operationStored` | 操作成功儲存 |
| 離線同步 | `syncAll_pendingOperations_allSynced` | 所有操作同步完成 |
| 衝突解決 | `resolve_serverNewer_serverWins` | 較新版本獲勝 |

### 整合測試場景

| 場景 | 測試步驟 | 預期結果 |
|------|----------|----------|
| 即時更新 | 用戶 A 更新任務，用戶 B 觀察 | B 即時看到 A 的更新 |
| 離線更新 | 斷線 → 更新任務 → 恢復連線 | 更新成功同步到伺服器 |
| 衝突處理 | A、B 同時更新同一任務 | 系統正確解決衝突 |
| 訂閱切換 | 切換藍圖 | 舊訂閱取消，新訂閱建立 |

### E2E 測試案例

```typescript
describe('Realtime Sync E2E', () => {
  it('should sync task updates across browsers', async () => {
    // 開啟兩個瀏覽器
    const browserA = await browser.launch();
    const browserB = await browser.launch();
    
    // 兩者進入同一藍圖
    await browserA.goto('/blueprint/123');
    await browserB.goto('/blueprint/123');
    
    // A 更新任務
    await browserA.click('[data-testid="task-1"]');
    await browserA.fill('[name="status"]', 'completed');
    await browserA.click('[data-testid="save"]');
    
    // B 應該看到更新
    await expect(browserB.locator('[data-testid="task-1-status"]'))
      .toHaveText('completed');
  });
});
```

---

## 6. 效能考量

### 效能目標

| 指標 | 目標值 | 說明 |
|------|--------|------|
| 事件延遲 | < 100ms | 從伺服器到客戶端 |
| 離線同步 | < 5s | 恢復連線後同步完成 |
| 訂閱建立 | < 500ms | 進入藍圖到訂閱就緒 |
| 記憶體使用 | < 50MB | Realtime 相關快取 |

### 優化策略

1. **訂閱粒度控制**：
   - 使用 `filter` 限制訂閱範圍
   - 只訂閱必要的表
   - 避免全表訂閱

2. **批次處理**：
   ```typescript
   // 使用 debounce 批次處理事件
   private eventQueue = signal<RealtimeEvent[]>([]);
   
   constructor() {
     effect(() => {
       const events = this.eventQueue();
       if (events.length > 0) {
         this.processBatch(events);
         this.eventQueue.set([]);
       }
     }, { delay: 100 }); // 100ms 批次處理
   }
   ```

3. **離線資料壓縮**：
   ```typescript
   // 壓縮離線資料
   async function compressData(data: string): Promise<Uint8Array> {
     const stream = new Response(data).body!
       .pipeThrough(new CompressionStream('gzip'));
     return new Uint8Array(await new Response(stream).arrayBuffer());
   }
   ```

### 監控指標

| 指標 | 監控方式 | 告警閾值 |
|------|----------|----------|
| 訂閱延遲 | 客戶端測量 | > 500ms |
| 同步失敗率 | 錯誤計數 | > 5% |
| 離線隊列大小 | IndexedDB 查詢 | > 100 操作 |
| Realtime 連線數 | Supabase 監控 | > 1000 |

---

## 7. 實作檢查清單

### Phase 1: Realtime 基礎設施
- [ ] RealtimeService 建立
- [ ] IdempotencyService 實作
- [ ] 訂閱生命週期管理
- [ ] 事件處理流程

### Phase 2: Store 整合
- [ ] TaskStore Realtime 整合
- [ ] DiaryStore Realtime 整合
- [ ] NotificationStore Realtime 整合
- [ ] 事件格式標準化

### Phase 3: 離線支援
- [ ] IndexedDB 初始化
- [ ] OfflineQueueService 實作
- [ ] 網路狀態監測
- [ ] 自動同步機制

### Phase 4: 衝突解決
- [ ] ConflictResolver 實作
- [ ] 衝突歷史記錄
- [ ] 手動合併 UI
- [ ] 衝突通知

### Phase 5: 測試與監控
- [ ] 單元測試撰寫
- [ ] 整合測試撰寫
- [ ] E2E 測試撰寫
- [ ] 監控指標設定

---

**文件版本**: v1.0
**最後更新**: 2025-11-28
**維護者**: 專案架構師
