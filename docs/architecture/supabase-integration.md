# Supabase 整合架構設計

## 📋 概述

本文件說明 GigHub 專案如何整合 Supabase，同時保持與現有 Firebase Authentication 的兼容性。

## 🎯 目標

1. **安全性**：確保資料隔離與存取控制
2. **可用性**：高可用性與故障恢復
3. **相容性**：與現有 Firebase Auth 無縫整合
4. **效能**：優化查詢與連線管理

## 🏗️ 架構圖

```
┌─────────────────────────────────────────────────────────────────┐
│                         前端應用層                                │
│                    (Angular 20 + ng-alain)                      │
└────────────────────┬───────────────────────┬────────────────────┘
                     │                       │
                     ▼                       ▼
        ┌───────────────────────┐  ┌──────────────────────┐
        │   Firebase Auth       │  │   Supabase Client    │
        │   (主認證系統)         │  │   (資料庫 & 存儲)     │
        └───────────┬───────────┘  └──────────┬───────────┘
                    │                         │
                    │ ① 使用者登入             │
                    │    獲取 Firebase        │
                    │    ID Token            │
                    │                         │
                    ▼                         │
        ┌───────────────────────┐            │
        │  @delon/auth          │            │
        │  Token Service        │            │
        └───────────┬───────────┘            │
                    │                         │
                    │ ② 同步 Token            │
                    │    至 Supabase         │
                    │                         │
                    ▼                         ▼
        ┌─────────────────────────────────────────┐
        │     SupabaseAuthSyncService            │
        │  (Firebase Token → Supabase JWT)       │
        └─────────────────┬───────────────────────┘
                          │
                          │ ③ 設定 Supabase Auth Header
                          │
                          ▼
        ┌─────────────────────────────────────────┐
        │         Supabase Service                │
        │    (連線管理 & 健康檢查)                 │
        └─────────────────┬───────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
         ▼                ▼                ▼
┌───────────────┐ ┌──────────────┐ ┌─────────────┐
│ Task Repo     │ │ Log Repo     │ │ Storage     │
│ (Supabase)    │ │ (Supabase)   │ │ (Supabase)  │
└───────┬───────┘ └──────┬───────┘ └─────┬───────┘
        │                │                │
        └────────────────┼────────────────┘
                         │
                         ▼
        ┌─────────────────────────────────────────┐
        │          Supabase Backend               │
        │  ┌───────────────────────────────────┐  │
        │  │   PostgreSQL Database             │  │
        │  │   • tasks 表格                    │  │
        │  │   • logs 表格                     │  │
        │  │   • RLS 政策啟用                  │  │
        │  └───────────────────────────────────┘  │
        │  ┌───────────────────────────────────┐  │
        │  │   Storage Buckets                 │  │
        │  │   • task-attachments              │  │
        │  │   • log-photos                    │  │
        │  └───────────────────────────────────┘  │
        └─────────────────────────────────────────┘
```

## 🔐 認證流程

### 1. 使用者登入流程

```typescript
// 步驟 1: 使用者透過 Firebase Auth 登入
FirebaseAuthService.signInWithEmailAndPassword(email, password)
  ↓
// 步驟 2: Firebase 返回 User 與 ID Token
Firebase User { uid, email, idToken }
  ↓
// 步驟 3: 同步至 @delon/auth Token Service
tokenService.set({ token: idToken, uid, email, ... })
  ↓
// 步驟 4: SupabaseAuthSyncService 監聽 Token 變化
SupabaseAuthSyncService.syncToken(idToken)
  ↓
// 步驟 5: 將 Firebase Token 轉換為 Supabase JWT
// 選項 A: 使用 Supabase Custom Claims (推薦)
// 選項 B: 使用 Firebase Admin SDK 驗證後簽發 Supabase JWT
  ↓
// 步驟 6: 設定 Supabase Client Auth Header
supabaseClient.auth.setSession({ access_token: supabaseJWT })
```

### 2. Token 同步機制

#### 方案 A: Custom Claims + RLS 政策 (推薦)

**優點**：
- ✅ 完全在資料庫層控制權限
- ✅ 無需額外 API 呼叫
- ✅ 與 Supabase RLS 原生整合

**實作流程**：

```typescript
// 1. Firebase Function 在使用者登入時設定 Custom Claims
// functions/src/setSupabaseClaims.ts
export const setSupabaseClaims = functions.auth.user().onCreate(async (user) => {
  await admin.auth().setCustomUserClaims(user.uid, {
    supabase_uid: user.uid,
    organization_id: '...',  // 從 Firestore 獲取
    role: '...'
  });
});

// 2. Angular 前端取得包含 Custom Claims 的 ID Token
const idToken = await firebase.auth().currentUser.getIdToken(true);

// 3. 解析 Token 並建立 Supabase Session
const decoded = jwtDecode(idToken);
const supabaseSession = {
  user: {
    id: decoded.supabase_uid,
    app_metadata: { 
      organization_id: decoded.organization_id,
      role: decoded.role 
    }
  },
  access_token: idToken  // 使用 Firebase Token
};

// 4. 設定 Supabase Client
await supabase.auth.setSession(supabaseSession);
```

**RLS 政策範例**：

```sql
-- tasks 表格：使用者只能存取自己組織的任務
CREATE POLICY "Users can view tasks in their organization"
ON tasks FOR SELECT
USING (
  organization_id = (current_setting('request.jwt.claims', true)::json->>'organization_id')::uuid
);

CREATE POLICY "Users can create tasks in their organization"
ON tasks FOR INSERT
WITH CHECK (
  organization_id = (current_setting('request.jwt.claims', true)::json->>'organization_id')::uuid
);
```

#### 方案 B: Firebase Admin SDK 驗證 (備選)

**優點**：
- ✅ 更靈活的權限控制
- ✅ 可在後端驗證 Firebase Token

**缺點**：
- ❌ 需要額外的後端服務
- ❌ 增加延遲

**實作流程**：

```typescript
// 1. 前端發送 Firebase ID Token 至後端
POST /api/auth/supabase-token
Headers: { Authorization: Bearer <firebase-id-token> }

// 2. 後端驗證 Firebase Token 並簽發 Supabase JWT
// api/auth/supabase-token.ts
export async function handler(req: Request) {
  const firebaseToken = req.headers.authorization.split('Bearer ')[1];
  
  // 驗證 Firebase Token
  const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
  
  // 簽發 Supabase JWT
  const supabaseJWT = jwt.sign(
    {
      sub: decodedToken.uid,
      organization_id: decodedToken.organization_id,
      role: decodedToken.role,
      aud: 'authenticated',
      iss: 'supabase'
    },
    process.env.SUPABASE_JWT_SECRET,
    { expiresIn: '1h' }
  );
  
  return { supabase_token: supabaseJWT };
}

// 3. 前端設定 Supabase Session
const { supabase_token } = await fetch('/api/auth/supabase-token');
await supabase.auth.setSession({ access_token: supabase_token });
```

## 🛡️ Row Level Security (RLS) 政策

### 設計原則

1. **組織隔離**：使用者只能存取自己組織的資料
2. **藍圖權限**：基於藍圖的細粒度權限控制
3. **角色權限**：管理員、成員、訪客的權限分級
4. **預設拒絕**：所有未明確允許的操作都被拒絕

### Tasks 表格 RLS

```sql
-- 啟用 RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 1. SELECT 政策：使用者可查看自己組織的任務
CREATE POLICY "Users can view tasks in their organization"
ON tasks FOR SELECT
USING (
  blueprint_id IN (
    SELECT id FROM blueprints 
    WHERE organization_id = (
      current_setting('request.jwt.claims', true)::json->>'organization_id'
    )::uuid
  )
);

-- 2. INSERT 政策：使用者可在自己組織的藍圖中建立任務
CREATE POLICY "Users can create tasks in their organization"
ON tasks FOR INSERT
WITH CHECK (
  blueprint_id IN (
    SELECT id FROM blueprints 
    WHERE organization_id = (
      current_setting('request.jwt.claims', true)::json->>'organization_id'
    )::uuid
  )
  AND creator_id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid
);

-- 3. UPDATE 政策：使用者可更新自己組織的任務
CREATE POLICY "Users can update tasks in their organization"
ON tasks FOR UPDATE
USING (
  blueprint_id IN (
    SELECT id FROM blueprints 
    WHERE organization_id = (
      current_setting('request.jwt.claims', true)::json->>'organization_id'
    )::uuid
  )
)
WITH CHECK (
  blueprint_id IN (
    SELECT id FROM blueprints 
    WHERE organization_id = (
      current_setting('request.jwt.claims', true)::json->>'organization_id'
    )::uuid
  )
);

-- 4. DELETE 政策：只有管理員可刪除任務
CREATE POLICY "Admins can delete tasks in their organization"
ON tasks FOR DELETE
USING (
  blueprint_id IN (
    SELECT id FROM blueprints 
    WHERE organization_id = (
      current_setting('request.jwt.claims', true)::json->>'organization_id'
    )::uuid
  )
  AND (current_setting('request.jwt.claims', true)::json->>'role') = 'admin'
);
```

### Logs 表格 RLS

```sql
-- 啟用 RLS
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- 1. SELECT 政策：使用者可查看自己組織的日誌
CREATE POLICY "Users can view logs in their organization"
ON logs FOR SELECT
USING (
  blueprint_id IN (
    SELECT id FROM blueprints 
    WHERE organization_id = (
      current_setting('request.jwt.claims', true)::json->>'organization_id'
    )::uuid
  )
);

-- 2. INSERT 政策：使用者可在自己組織的藍圖中建立日誌
CREATE POLICY "Users can create logs in their organization"
ON logs FOR INSERT
WITH CHECK (
  blueprint_id IN (
    SELECT id FROM blueprints 
    WHERE organization_id = (
      current_setting('request.jwt.claims', true)::json->>'organization_id'
    )::uuid
  )
  AND creator_id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid
);

-- 3. UPDATE 政策：使用者可更新自己建立的日誌
CREATE POLICY "Users can update their own logs"
ON logs FOR UPDATE
USING (
  creator_id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid
  AND blueprint_id IN (
    SELECT id FROM blueprints 
    WHERE organization_id = (
      current_setting('request.jwt.claims', true)::json->>'organization_id'
    )::uuid
  )
)
WITH CHECK (
  creator_id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid
  AND blueprint_id IN (
    SELECT id FROM blueprints 
    WHERE organization_id = (
      current_setting('request.jwt.claims', true)::json->>'organization_id'
    )::uuid
  )
);

-- 4. DELETE 政策：使用者可刪除自己建立的日誌或管理員可刪除所有日誌
CREATE POLICY "Users can delete their own logs or admins can delete all"
ON logs FOR DELETE
USING (
  (
    creator_id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid
    OR (current_setting('request.jwt.claims', true)::json->>'role') = 'admin'
  )
  AND blueprint_id IN (
    SELECT id FROM blueprints 
    WHERE organization_id = (
      current_setting('request.jwt.claims', true)::json->>'organization_id'
    )::uuid
  )
);
```

### Storage RLS 政策

```sql
-- log-photos bucket 政策
CREATE POLICY "Users can upload photos to their organization's logs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'log-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM logs 
    WHERE blueprint_id IN (
      SELECT id FROM blueprints 
      WHERE organization_id = (
        current_setting('request.jwt.claims', true)::json->>'organization_id'
      )::uuid
    )
  )
);

CREATE POLICY "Users can view photos from their organization's logs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'log-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM logs 
    WHERE blueprint_id IN (
      SELECT id FROM blueprints 
      WHERE organization_id = (
        current_setting('request.jwt.claims', true)::json->>'organization_id'
      )::uuid
    )
  )
);
```

## 🔄 連線管理與容錯

### 1. 連線池配置

```typescript
// supabase.service.ts
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'gighub-angular-app'
    }
  }
});
```

### 2. 健康檢查

```typescript
// supabase-health-check.service.ts
@Injectable({ providedIn: 'root' })
export class SupabaseHealthCheckService {
  private healthCheckInterval = 30000; // 30 seconds
  private isHealthy = signal(true);
  private lastCheckTime = signal<Date | null>(null);
  
  constructor() {
    this.startHealthCheck();
  }
  
  private async startHealthCheck(): Promise<void> {
    setInterval(async () => {
      try {
        // 簡單的健康檢查：查詢系統表
        const { error } = await this.supabase
          .from('_health_check')
          .select('count')
          .limit(1);
        
        this.isHealthy.set(!error);
        this.lastCheckTime.set(new Date());
        
        if (error) {
          this.logger.error('[SupabaseHealthCheck]', 'Health check failed', error);
          this.notificationService.error('Supabase 連線異常，請檢查網路連線');
        }
      } catch (err) {
        this.isHealthy.set(false);
        this.logger.error('[SupabaseHealthCheck]', 'Health check exception', err);
      }
    }, this.healthCheckInterval);
  }
  
  get healthy(): Signal<boolean> {
    return this.isHealthy.asReadonly();
  }
}
```

### 3. 重試策略 (Exponential Backoff)

```typescript
// supabase-base.repository.ts
export abstract class SupabaseBaseRepository {
  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        // 不重試的錯誤類型
        if (this.isNonRetryableError(error)) {
          throw error;
        }
        
        // 計算延遲 (exponential backoff with jitter)
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        
        this.logger.warn(
          `[${this.constructor.name}]`,
          `Operation failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${delay}ms`,
          error
        );
        
        await this.sleep(delay);
      }
    }
    
    throw lastError;
  }
  
  private isNonRetryableError(error: any): boolean {
    // RLS 違規、權限錯誤不重試
    const nonRetryableCodes = ['PGRST301', '42501', '23505'];
    return nonRetryableCodes.includes(error.code);
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## 📊 監控與日誌

### 1. 效能監控

```typescript
// supabase.service.ts
export class SupabaseService {
  private performanceMonitor = inject(PerformanceMonitoringService);
  
  async query<T>(queryFn: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await queryFn();
      const duration = performance.now() - startTime;
      
      // 記錄查詢效能
      this.performanceMonitor.recordMetric('supabase_query_duration', duration);
      
      if (duration > 1000) {
        this.logger.warn(
          '[SupabaseService]',
          `Slow query detected: ${duration.toFixed(2)}ms`
        );
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.performanceMonitor.recordMetric('supabase_query_error', duration);
      throw error;
    }
  }
}
```

### 2. 錯誤追蹤

```typescript
// error-tracking.service.ts
@Injectable({ providedIn: 'root' })
export class ErrorTrackingService {
  trackSupabaseError(context: string, error: any, metadata?: any): void {
    const errorData = {
      timestamp: new Date(),
      context,
      errorCode: error.code,
      errorMessage: error.message,
      errorDetails: error.details,
      metadata,
      userId: this.authService.currentUser?.uid,
      sessionId: this.sessionId
    };
    
    // 發送至錯誤追蹤服務 (如 Sentry)
    this.sentryService.captureException(error, {
      tags: {
        service: 'supabase',
        context
      },
      extra: errorData
    });
    
    // 本地日誌
    this.logger.error('[ErrorTracking]', context, errorData);
  }
}
```

## 🔒 安全最佳實踐

### 1. 環境變數管理

```typescript
// environment.ts (開發環境)
export const environment = {
  production: false,
  supabase: {
    url: import.meta.env['NG_PUBLIC_SUPABASE_URL'] || '',
    anonKey: import.meta.env['NG_PUBLIC_SUPABASE_ANON_KEY'] || '',
    // 永遠不要在程式碼中硬編碼 Service Role Key
  }
};
```

### 2. CORS 配置

在 Supabase Dashboard 中配置允許的來源：
- 開發環境：`http://localhost:4200`
- 測試環境：`https://test.gighub.com`
- 生產環境：`https://gighub.com`

### 3. Rate Limiting

```typescript
// Implement rate limiting at application level
@Injectable({ providedIn: 'root' })
export class RateLimiterService {
  private requests = new Map<string, number[]>();
  private maxRequestsPerMinute = 60;
  
  canMakeRequest(userId: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];
    
    // Remove requests older than 1 minute
    const recentRequests = userRequests.filter(time => now - time < 60000);
    
    if (recentRequests.length >= this.maxRequestsPerMinute) {
      return false;
    }
    
    recentRequests.push(now);
    this.requests.set(userId, recentRequests);
    return true;
  }
}
```

## 📦 遷移策略

### Phase 1: 準備階段
1. 設定 Supabase 專案
2. 建立資料表與 RLS 政策
3. 配置環境變數

### Phase 2: 平行運行
1. 新增 Supabase Repository (與 Firestore Repository 並存)
2. 實作 Feature Flag 控制使用哪個資料源
3. 雙寫模式：同時寫入 Firestore 與 Supabase

### Phase 3: 資料遷移
1. 編寫資料遷移腳本
2. 驗證資料完整性
3. 執行增量同步

### Phase 4: 切換
1. 逐步將讀取流量切換至 Supabase
2. 監控效能與錯誤率
3. 停止雙寫，完全切換至 Supabase

### Phase 5: 清理
1. 移除舊的 Firestore Repository
2. 更新文件
3. 刪除不再使用的 Feature Flag

## 🧪 測試策略

### 1. 單元測試

```typescript
describe('TaskSupabaseRepository', () => {
  let repository: TaskSupabaseRepository;
  let mockSupabaseClient: jasmine.SpyObj<SupabaseClient>;
  
  beforeEach(() => {
    mockSupabaseClient = jasmine.createSpyObj('SupabaseClient', ['from']);
    repository = new TaskSupabaseRepository(mockSupabaseClient);
  });
  
  it('should enforce RLS when querying tasks', async () => {
    const mockQuery = jasmine.createSpyObj('Query', ['select', 'eq']);
    mockSupabaseClient.from.and.returnValue(mockQuery);
    
    await repository.findByBlueprint('blueprint-id');
    
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('tasks');
    expect(mockQuery.select).toHaveBeenCalled();
    expect(mockQuery.eq).toHaveBeenCalledWith('blueprint_id', 'blueprint-id');
  });
});
```

### 2. 整合測試

```typescript
describe('Supabase Integration', () => {
  it('should sync Firebase token to Supabase', async () => {
    // 1. 登入 Firebase
    const user = await firebaseAuth.signInWithEmailAndPassword(email, password);
    
    // 2. 驗證 Token 已同步
    const supabaseSession = await supabase.auth.getSession();
    expect(supabaseSession.data.session).toBeTruthy();
    
    // 3. 驗證可以查詢資料
    const { data, error } = await supabase.from('tasks').select('*');
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });
});
```

### 3. RLS 測試

```sql
-- Test RLS policies in Supabase SQL Editor
-- 1. Create test user
INSERT INTO auth.users (id, email) VALUES 
  ('test-user-1', 'user1@test.com');

-- 2. Set JWT claims
SELECT set_config('request.jwt.claims', 
  '{"sub": "test-user-1", "organization_id": "org-1", "role": "member"}', 
  true);

-- 3. Test SELECT policy
SELECT * FROM tasks;  -- Should only return tasks in org-1

-- 4. Test INSERT policy
INSERT INTO tasks (blueprint_id, title, creator_id) 
VALUES ('blueprint-1', 'Test Task', 'test-user-1');  -- Should succeed

-- 5. Test unauthorized access
INSERT INTO tasks (blueprint_id, title, creator_id) 
VALUES ('blueprint-other-org', 'Test Task', 'test-user-1');  -- Should fail
```

## 📚 參考資源

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Firebase Custom Claims](https://firebase.google.com/docs/auth/admin/custom-claims)
- [PostgreSQL Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

## 📝 待辦事項

- [ ] 實作 Token 刷新機制
- [ ] 建立監控儀表板
- [ ] 編寫災難恢復計畫
- [ ] 效能基準測試
- [ ] 安全審計

---

**最後更新**: 2025-12-12  
**維護者**: GigHub Development Team
