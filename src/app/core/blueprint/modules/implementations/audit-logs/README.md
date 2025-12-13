# Audit Logs Module (審計日誌模組)

Blueprint 藍圖系統的審計日誌模組，提供完整的審計追蹤能力。

## 模組概述

審計日誌模組追蹤所有在藍圖系統中發生的重要操作和事件，提供完整的審計追蹤能力，確保系統的透明度和可追溯性。

### 主要功能

- ✅ 自動審計日誌記錄
- ✅ 詳細變更追蹤 (before/after)
- ✅ IP 地址追蹤
- ✅ User Agent 追蹤
- ✅ 地理位置記錄 (可選)
- ✅ 即時更新支援
- ✅ 查詢與過濾
- ✅ 分頁載入
- ✅ 統計分析
- ✅ 匯出功能
- ✅ 保留策略
- ✅ 自動歸檔
- ✅ 警報通知

## 模組結構

```
audit-logs/
├── audit-logs.module.ts        # 主模組實作 (IBlueprintModule)
├── audit-logs.service.ts       # 業務邏輯服務
├── module.metadata.ts          # 模組元資料與配置
├── index.ts                    # 匯出檔案
├── audit-logs.module.spec.ts   # 單元測試
└── README.md                   # 本檔案
```

## 快速開始

### 1. 在 Blueprint Container 中載入模組

```typescript
import { AuditLogsModule } from '@core/blueprint/modules/implementations/audit-logs';
import { BlueprintContainer } from '@core/blueprint/container';

const container = new BlueprintContainer();
const auditLogsModule = new AuditLogsModule();

await container.loadModule(auditLogsModule);
await container.start();
```

### 2. 使用 AuditLogsService

```typescript
import { AuditLogsService } from '@core/blueprint/modules/implementations/audit-logs';

@Component({
  selector: 'app-audit-logs',
  template: `
    @if (loading()) {
      <nz-spin nzSimple />
    } @else {
      @for (log of logs(); track log.id) {
        <div class="audit-log-item">
          <span>{{ log.eventType }}</span>
          <span>{{ log.message }}</span>
          <span>{{ log.timestamp | date }}</span>
        </div>
      }
    }
  `
})
export class AuditLogsComponent {
  private auditLogsService = inject(AuditLogsService);
  
  logs = this.auditLogsService.logs;
  loading = this.auditLogsService.loading;
  
  ngOnInit() {
    this.auditLogsService.loadLogs('blueprint-id');
  }
}
```

### 3. 建立審計日誌

```typescript
import { AuditLogsService } from '@core/blueprint/modules/implementations/audit-logs';
import { 
  AuditEventType, 
  AuditCategory, 
  AuditSeverity,
  ActorType,
  AuditStatus 
} from '@core/models/audit-log.model';

private auditLogsService = inject(AuditLogsService);

async logUserAction() {
  await this.auditLogsService.createLog({
    blueprintId: 'blueprint-123',
    eventType: AuditEventType.MODULE_CONFIGURED,
    category: AuditCategory.MODULE,
    severity: AuditSeverity.INFO,
    actorId: 'user-456',
    actorType: ActorType.USER,
    resourceType: 'module',
    resourceId: 'tasks',
    action: 'configure',
    message: 'User configured tasks module',
    status: AuditStatus.SUCCESS
  });
}
```

### 4. 查詢審計日誌

```typescript
// 按事件類型查詢
auditLogsService.findByEventType(
  'blueprint-123', 
  AuditEventType.MODULE_CONFIGURED
);

// 按類別查詢
auditLogsService.findByCategory(
  'blueprint-123', 
  AuditCategory.MODULE
);

// 查詢最近錯誤
auditLogsService.findRecentErrors('blueprint-123', 20);

// 進階查詢
await auditLogsService.queryLogs('blueprint-123', {
  eventType: [AuditEventType.MODULE_CONFIGURED, AuditEventType.MODULE_ENABLED],
  severity: AuditSeverity.HIGH,
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-12-31'),
  limit: 100,
  sortOrder: 'desc'
});
```

### 5. 載入統計摘要

```typescript
await auditLogsService.loadSummary('blueprint-123');

const summary = auditLogsService.summary();
console.log('Total logs:', summary.total);
console.log('By category:', summary.byCategory);
console.log('By severity:', summary.bySeverity);
console.log('Recent errors:', summary.recentErrors);
```

## 模組 API

### AuditLogsModule

實作 `IBlueprintModule` 介面的主模組類別。

#### 屬性

- `id: string` - 模組唯一識別碼 (`audit-logs`)
- `name: string` - 模組名稱 (`審計日誌`)
- `version: string` - 模組版本 (`1.0.0`)
- `description: string` - 模組描述
- `dependencies: string[]` - 模組依賴 (無)
- `status: Signal<ModuleStatus>` - 模組狀態
- `exports: object` - 模組匯出物件

#### 生命週期方法

- `init(context: IExecutionContext): Promise<void>` - 初始化模組
- `start(): Promise<void>` - 啟動模組
- `ready(): Promise<void>` - 模組就緒
- `stop(): Promise<void>` - 停止模組
- `dispose(): Promise<void>` - 銷毀模組

### AuditLogsService

審計日誌業務邏輯服務。

#### 狀態 Signals

- `logs: Signal<AuditLogDocument[]>` - 審計日誌列表
- `loading: Signal<boolean>` - 載入狀態
- `error: Signal<string | null>` - 錯誤訊息
- `summary: Signal<AuditLogSummary | null>` - 統計摘要
- `hasMore: Signal<boolean>` - 是否有更多資料

#### 計算 Signals

- `criticalLogs: Signal<AuditLogDocument[]>` - 嚴重等級日誌
- `highSeverityLogs: Signal<AuditLogDocument[]>` - 高嚴重等級日誌
- `failedLogs: Signal<AuditLogDocument[]>` - 失敗日誌
- `logsByCategory: Signal<object>` - 按類別分組的日誌
- `logStats: Signal<object>` - 日誌統計資料

#### 方法

- `loadLogs(blueprintId: string, pageSize?: number): Promise<void>` - 載入審計日誌
- `loadMore(blueprintId: string, pageSize?: number): Promise<void>` - 載入更多日誌 (分頁)
- `queryLogs(blueprintId: string, options: AuditLogQueryOptions): Promise<void>` - 查詢日誌
- `createLog(data: CreateAuditLogData): Promise<AuditLogDocument>` - 建立日誌
- `createBatch(logs: CreateAuditLogData[]): Promise<void>` - 批次建立日誌
- `loadSummary(blueprintId: string, startDate?: Date, endDate?: Date): Promise<void>` - 載入統計摘要
- `findByEventType(blueprintId: string, eventType: AuditEventType, limit?: number): void` - 按事件類型查詢
- `findByCategory(blueprintId: string, category: AuditCategory, limit?: number): void` - 按類別查詢
- `findRecentErrors(blueprintId: string, limit?: number): void` - 查詢最近錯誤
- `findById(blueprintId: string, logId: string): void` - 按 ID 查詢
- `clearState(): void` - 清除狀態

## 模組配置

### 預設配置

```typescript
const defaultConfig = {
  features: {
    enableAutoLogging: true,
    enableDetailedChanges: true,
    enableIpTracking: true,
    enableUserAgentTracking: true,
    enableGeolocation: false,
    enableRealtime: true,
    enableExport: true,
    enableRetention: true,
    enableArchiving: true,
    enableAlerts: true
  },
  settings: {
    retentionDays: 365,
    autoArchiveAfterDays: 90,
    maxLogsPerQuery: 100,
    alertOnCritical: true,
    alertOnHigh: false,
    enableDetailedStackTrace: false,
    logSuccessfulReads: false,
    logFailedReads: true,
    compressOldLogs: true,
    enableBatchLogging: true,
    batchSize: 10,
    batchInterval: 5000
  },
  permissions: {
    requiredRoles: ['admin', 'auditor'],
    allowedActions: [
      'audit.read',
      'audit.query',
      'audit.export',
      'audit.archive',
      'audit.delete'
    ]
  }
};
```

## 模組事件

模組發出以下事件：

- `audit-logs.log_created` - 日誌建立
- `audit-logs.log_queried` - 日誌查詢
- `audit-logs.log_exported` - 日誌匯出
- `audit-logs.log_archived` - 日誌歸檔
- `audit-logs.log_deleted` - 日誌刪除
- `audit-logs.retention_exceeded` - 超過保留期限
- `audit-logs.critical_event` - 嚴重事件
- `audit-logs.high_event` - 高嚴重度事件
- `audit-logs.storage_warning` - 儲存空間警告
- `audit-logs.batch_completed` - 批次處理完成

## 審計日誌資料模型

### AuditLogDocument

```typescript
interface AuditLogDocument {
  id?: string;
  blueprintId: string;
  eventType: AuditEventType;
  category: AuditCategory;
  severity: AuditSeverity;
  actorId: string;
  actorType: ActorType;
  resourceType: string;
  resourceId?: string;
  action: string;
  message: string;
  changes?: AuditChange[];
  context?: AuditContext;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  timestamp: Date;
  status: AuditStatus;
  error?: AuditError;
}
```

### 列舉型別

- **AuditEventType**: BLUEPRINT_CREATED, MODULE_CONFIGURED, CONFIG_UPDATED, ...
- **AuditCategory**: BLUEPRINT, MODULE, CONFIG, MEMBER, PERMISSION, ACCESS, SYSTEM
- **AuditSeverity**: CRITICAL, HIGH, MEDIUM, LOW, INFO
- **ActorType**: USER, SYSTEM, SERVICE, API
- **AuditStatus**: SUCCESS, FAILED, PARTIAL, PENDING

## 最佳實踐

### 1. 何時記錄審計日誌

建議在以下情況記錄審計日誌：

- ✅ 重要資料的建立、更新、刪除
- ✅ 模組的啟用、停用、配置變更
- ✅ 權限的授予、撤銷
- ✅ 使用者登入、登出
- ✅ 系統錯誤與警告
- ❌ 不要記錄一般的讀取操作
- ❌ 不要記錄敏感資料（密碼、API 金鑰等）

### 2. 選擇適當的嚴重等級

- **CRITICAL**: 系統故障、資料遺失、安全漏洞
- **HIGH**: 重要配置變更、權限異常、多次登入失敗
- **MEDIUM**: 一般配置變更、模組錯誤
- **LOW**: 次要操作、一般性警告
- **INFO**: 資訊性事件、正常操作

### 3. 提供有意義的訊息

```typescript
// ❌ 不好的訊息
message: 'Update task'

// ✅ 好的訊息
message: `Task "${taskTitle}" status changed from ${oldStatus} to ${newStatus} by ${userName}`
```

### 4. 記錄變更細節

```typescript
changes: [
  {
    field: 'status',
    oldValue: 'pending',
    newValue: 'completed',
    changeType: 'updated'
  },
  {
    field: 'assignee',
    oldValue: 'user-123',
    newValue: 'user-456',
    changeType: 'updated'
  }
]
```

### 5. 使用批次記錄提升效能

```typescript
const logs: CreateAuditLogData[] = [];

for (const task of tasks) {
  logs.push({
    blueprintId: 'blueprint-123',
    eventType: AuditEventType.MODULE_CONFIGURED,
    // ... other fields
  });
}

await auditLogsService.createBatch(logs);
```

## 整合其他模組

其他模組可以透過模組 exports 存取審計日誌功能：

```typescript
// 在其他模組中
class MyModule implements IBlueprintModule {
  async init(context: IExecutionContext) {
    const auditLogsModule = context.use('audit-logs');
    const auditService = auditLogsModule.exports.service();
    
    await auditService.createLog({
      // ... log data
    });
  }
}
```

## 安全性考量

1. **權限控制**: 僅授權人員可檢視審計日誌
2. **敏感資料**: 避免記錄密碼、API 金鑰等敏感資料
3. **資料保留**: 遵守資料保留政策，定期歸檔或刪除舊日誌
4. **完整性**: 審計日誌應為只讀，避免被竄改
5. **隱私保護**: 遵守 GDPR 和其他隱私法規

## 效能優化

1. **分頁載入**: 使用分頁避免一次載入大量資料
2. **索引優化**: 確保 Firestore 有適當的複合索引
3. **批次寫入**: 使用批次寫入減少網路請求
4. **快取策略**: 對統計資料使用適當的快取
5. **非同步記錄**: 不要讓審計日誌記錄影響主要操作效能

## 疑難排解

### 問題：審計日誌未被記錄

**解決方案**:
1. 檢查模組是否已正確初始化
2. 確認 Firebase 權限設定
3. 檢查 blueprintId 是否正確
4. 查看瀏覽器 console 是否有錯誤訊息

### 問題：查詢速度慢

**解決方案**:
1. 確保 Firestore 有建立適當的索引
2. 減少查詢範圍（使用日期範圍過濾）
3. 降低每頁資料量
4. 考慮使用快取

### 問題：儲存空間不足

**解決方案**:
1. 啟用自動歸檔功能
2. 縮短保留天數
3. 定期清理舊日誌
4. 考慮將舊日誌匯出至外部儲存

## 未來改進

- [ ] 支援日誌匯出為 CSV/JSON
- [ ] 支援日誌搜尋（全文搜尋）
- [ ] 支援自訂警報規則
- [ ] 支援日誌可視化圖表
- [ ] 支援異常行為偵測
- [ ] 支援日誌壓縮與加密

## 相關文件

- [Blueprint Core System](../../README.md)
- [Module Interface](../../modules/module.interface.ts)
- [Audit Log Repository](../../repositories/audit-log.repository.ts)
- [Audit Log Model](../../../models/audit-log.model.ts)

## 授權

Proprietary - GigHub Development Team

---

**版本**: 1.0.0  
**最後更新**: 2025-12-13  
**狀態**: Active Development
