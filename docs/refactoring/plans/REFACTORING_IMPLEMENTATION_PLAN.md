# 🎯 GigHub 架構重構實施計畫

> **計畫日期**: 2025-12-13  
> **分析方法**: Debug Workflow + Sequential Thinking + Occam's Razor  
> **規劃工具**: Software Planning Tool  
> **文檔查詢**: Context7

---

## 📋 執行摘要

### 問題本質（奧卡姆剃刀分析）

基於對 `ARCHITECTURE_ANALYSIS.md` 和 `simplification-analysis.md` 的深度分析，核心問題可歸納為：

**最簡單的事實**：
1. **重複 = 維護成本** → Task/Log Repository 各有 2-3 個實作
2. **未使用 = 浪費資源** → 12 個示範檔案佔用 2-3 MB
3. **孤立 = 狀態不明** → Explore/Climate 功能整合狀態不清楚

**最簡單的解決方案**：
1. **合併重複** → 統一 Repository 介面
2. **移除無用** → 刪除示範檔案
3. **明確狀態** → 決定孤立功能的去留

### 風險等級評估

| 風險類型 | 等級 | 影響範圍 | 緩解策略 |
|---------|------|---------|---------|
| Repository 合併破壞現有功能 | 🔴 High | 所有 CRUD 操作 | Feature Flag + 測試覆蓋 |
| 誤刪有用檔案 | 🟡 Medium | 局部功能 | Git 備份 + 驗證腳本 |
| 測試破壞 | 🟡 Medium | CI/CD | 測試先行 + 回滾計畫 |
| 團隊學習成本 | 🟢 Low | 開發效率 | 文檔 + 培訓 |

---

## 🎯 Phase 1: 高優先級任務（立即執行）

### 任務 1.1: 清理示範檔案 ⭐ 最簡單且最有效

**原因選擇**：
- ✅ 風險最低（不影響任何功能）
- ✅ 收益最明顯（減少 2-3 MB bundle）
- ✅ 執行最快（15 分鐘）
- ✅ 可立即驗證效果

**實施步驟**：

```bash
# Step 1: 驗證檔案未被引用
grep -r "demo\.(docx|pdf|pptx|xlsx)" src/ --exclude-dir=node_modules
grep -r "assets/tmp/img/[1-6].png" src/ --exclude-dir=node_modules

# Step 2: 備份（以防萬一）
mkdir -p /tmp/gighub-backup
cp -r src/assets/tmp/* /tmp/gighub-backup/

# Step 3: 刪除示範檔案
rm -rf src/assets/tmp/demo.docx
rm -rf src/assets/tmp/demo.pdf
rm -rf src/assets/tmp/demo.pptx
rm -rf src/assets/tmp/demo.xlsx
rm -rf src/assets/tmp/demo.zip
rm -rf src/assets/tmp/img/{1..6}.png
rm -f src/assets/tmp/avatar.jpg

# Step 4: 保留目錄結構
touch src/assets/tmp/.gitkeep

# Step 5: 更新 .gitignore
echo "" >> .gitignore
echo "# Temporary demo assets" >> .gitignore
echo "src/assets/tmp/demo.*" >> .gitignore
echo "src/assets/tmp/*.jpg" >> .gitignore
echo "!src/assets/tmp/.gitkeep" >> .gitignore

# Step 6: 提交變更
git add -A
git commit -m "chore: 清理 ng-alain 範本示範檔案 (-2.5 MB)

- 移除 demo.docx, demo.pdf, demo.pptx, demo.xlsx, demo.zip
- 移除示範圖片 1-6.png, avatar.jpg
- 保留目錄結構 (.gitkeep)
- 更新 .gitignore 防止誤提交示範檔案

影響: 無 (僅移除未使用的範本檔案)
收益: Bundle 大小減少約 2.5 MB"
```

**驗證檢查**：
```bash
# 1. 確認建置成功
yarn build --configuration production

# 2. 檢查 bundle 大小
ls -lh dist/browser/*.js | awk '{print $5, $9}'

# 3. 確認測試通過
yarn test --watch=false --browsers=ChromeHeadless

# 4. 確認 Lint 通過
yarn lint
```

**預估時間**: 15 分鐘  
**預期收益**: 減少 2-3 MB bundle  
**風險等級**: 🟢 極低

---

### 任務 1.2: 合併 Task Repositories (3 → 1)

**複雜度分析**（Sequential Thinking）：

```
問題拆解:
├─ 1. 三個檔案做相同的事
│  ├─ task.repository.ts (主要實作)
│  ├─ task-firestore.repository.ts (Firestore 專用)
│  └─ tasks.repository.ts (Blueprint 子集合)
│
├─ 2. 每個檔案的獨特功能
│  ├─ task.repository.ts: 標準 CRUD
│  ├─ task-firestore.repository.ts: Batch 操作 + Retry
│  └─ tasks.repository.ts: Blueprint 子集合查詢
│
└─ 3. 依賴關係
   ├─ TaskService → TaskRepository
   ├─ BlueprintService → tasks.repository
   └─ 測試檔案 → 各自的 Repository
```

**整合策略（奧卡姆剃刀）**：

保留 `task.repository.ts`，因為：
1. ✅ 命名最標準（符合 Angular 慣例）
2. ✅ 位置最合理（在 core/repositories）
3. ✅ 結構最完整（繼承 FirestoreBaseRepository）

**實施步驟**：

#### Step 1: 分析現有實作差異

```bash
# 比較三個檔案
diff src/app/core/repositories/task.repository.ts \
     src/app/core/repositories/task-firestore.repository.ts > /tmp/task-repo-diff.txt

# 檢查 Blueprint 版本的特殊實作
cat src/app/core/blueprint/modules/implementations/tasks/tasks.repository.ts
```

#### Step 2: 建立統一 Repository

```typescript
// src/app/core/repositories/task.repository.ts

import { Injectable, inject } from '@angular/core';
import { FirestoreBaseRepository } from './base/firestore-base.repository';
import { Task, TaskStatus, TaskPriority } from '@core/types/task';
import { SupabaseService } from '@core/services/supabase.service';

/**
 * 統一的 Task Repository
 * 
 * 整合功能:
 * - 標準 CRUD 操作
 * - Blueprint 子集合查詢
 * - Batch 操作支援
 * - Retry 機制
 * - Soft delete
 * 
 * @remarks
 * 此 Repository 合併了三個原有實作:
 * - task.repository.ts (標準 CRUD)
 * - task-firestore.repository.ts (Batch + Retry)
 * - tasks.repository.ts (Blueprint 子集合)
 */
@Injectable({ providedIn: 'root' })
export class TaskRepository extends FirestoreBaseRepository<Task> {
  protected collectionName = 'tasks';
  private supabase = inject(SupabaseService);

  /**
   * 獲取集合路徑（支援 Blueprint 子集合）
   * 
   * @param blueprintId - 可選的 Blueprint ID
   * @returns Firestore 集合路徑
   * 
   * @example
   * ```typescript
   * // 全域任務
   * const path = repo.getCollectionPath();
   * // => 'tasks'
   * 
   * // Blueprint 任務
   * const path = repo.getCollectionPath('bp-123');
   * // => 'blueprints/bp-123/tasks'
   * ```
   */
  getCollectionPath(blueprintId?: string): string {
    return blueprintId 
      ? `blueprints/${blueprintId}/tasks`
      : 'tasks';
  }

  /**
   * 查詢特定 Blueprint 的所有任務
   * 
   * @param blueprintId - Blueprint ID
   * @param options - 查詢選項
   * @returns 任務陣列
   */
  async findByBlueprint(
    blueprintId: string,
    options?: {
      status?: TaskStatus;
      priority?: TaskPriority;
      assigneeId?: string;
      limit?: number;
    }
  ): Promise<Task[]> {
    let query = this.supabase.client
      .from('tasks')
      .select('*')
      .eq('blueprint_id', blueprintId);

    // 套用篩選條件
    if (options?.status) {
      query = query.eq('status', options.status);
    }
    if (options?.priority) {
      query = query.eq('priority', options.priority);
    }
    if (options?.assigneeId) {
      query = query.eq('assignee_id', options.assigneeId);
    }

    // 排序與限制
    query = query.order('created_at', { ascending: false });
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  }

  /**
   * 批次建立任務（從 task-firestore.repository 整合）
   * 
   * @param tasks - 任務陣列
   * @returns 已建立的任務陣列
   */
  async createBatch(tasks: Omit<Task, 'id' | 'created_at' | 'updated_at'>[]): Promise<Task[]> {
    const { data, error } = await this.supabase.client
      .from('tasks')
      .insert(tasks)
      .select();
    
    if (error) throw error;
    return data;
  }

  /**
   * 批次更新任務
   * 
   * @param updates - 更新資料陣列 { id, ...fields }
   * @returns 已更新的任務陣列
   */
  async updateBatch(updates: Array<Partial<Task> & { id: string }>): Promise<Task[]> {
    const promises = updates.map(update => 
      this.supabase.client
        .from('tasks')
        .update(update)
        .eq('id', update.id)
        .select()
        .single()
    );

    const results = await Promise.all(promises);
    
    // 檢查錯誤
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      throw new Error(`Batch update failed: ${errors.map(e => e.error?.message).join(', ')}`);
    }

    return results.map(r => r.data!);
  }

  /**
   * Soft delete（標記為已刪除）
   * 
   * @param id - 任務 ID
   */
  async softDelete(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('tasks')
      .update({ 
        deleted_at: new Date().toISOString(),
        status: 'archived' as TaskStatus
      })
      .eq('id', id);
    
    if (error) throw error;
  }

  /**
   * 批次 Soft delete
   * 
   * @param ids - 任務 ID 陣列
   */
  async softDeleteBatch(ids: string[]): Promise<void> {
    const { error } = await this.supabase.client
      .from('tasks')
      .update({ 
        deleted_at: new Date().toISOString(),
        status: 'archived' as TaskStatus
      })
      .in('id', ids);
    
    if (error) throw error;
  }

  /**
   * 恢復已刪除的任務
   * 
   * @param id - 任務 ID
   * @param newStatus - 恢復後的狀態（預設為 'pending'）
   */
  async restore(id: string, newStatus: TaskStatus = 'pending'): Promise<Task> {
    const { data, error } = await this.supabase.client
      .from('tasks')
      .update({ 
        deleted_at: null,
        status: newStatus
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  /**
   * 查詢已刪除的任務
   * 
   * @param blueprintId - 可選的 Blueprint ID
   * @returns 已刪除的任務陣列
   */
  async findDeleted(blueprintId?: string): Promise<Task[]> {
    let query = this.supabase.client
      .from('tasks')
      .select('*')
      .not('deleted_at', 'is', null);

    if (blueprintId) {
      query = query.eq('blueprint_id', blueprintId);
    }

    query = query.order('deleted_at', { ascending: false });

    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  }
}
```

#### Step 3: 更新所有引用

```bash
# 搜尋舊 import
echo "=== 搜尋 task-firestore.repository 引用 ==="
grep -r "task-firestore.repository" src/ --exclude-dir=node_modules

echo ""
echo "=== 搜尋 tasks.repository (Blueprint) 引用 ==="
grep -r "from '@core/blueprint/modules/implementations/tasks/tasks.repository'" src/

echo ""
echo "=== 搜尋類別名稱引用 ==="
grep -r "TaskFirestoreRepository" src/ --exclude-dir=node_modules
grep -r "TasksRepository" src/app/core/blueprint --exclude-dir=node_modules
```

**更新腳本**：
```bash
#!/bin/bash
# scripts/migrate-task-repository.sh

echo "開始遷移 Task Repository 引用..."

# 替換 import 路徑
find src -type f -name "*.ts" -exec sed -i \
  "s|from '@core/repositories/task-firestore.repository'|from '@core/repositories/task.repository'|g" {} +

find src -type f -name "*.ts" -exec sed -i \
  "s|from '@core/blueprint/modules/implementations/tasks/tasks.repository'|from '@core/repositories/task.repository'|g" {} +

# 替換類別名稱
find src -type f -name "*.ts" -exec sed -i \
  "s|TaskFirestoreRepository|TaskRepository|g" {} +

find src -type f -name "*.ts" -exec sed -i \
  "s|TasksRepository|TaskRepository|g" {} +

echo "遷移完成，請執行測試驗證"
```

#### Step 4: 更新測試

```typescript
// src/app/core/repositories/task.repository.spec.ts

import { TestBed } from '@angular/core/testing';
import { TaskRepository } from './task.repository';
import { SupabaseService } from '@core/services/supabase.service';
import { Task, TaskStatus, TaskPriority } from '@core/types/task';

describe('TaskRepository', () => {
  let repository: TaskRepository;
  let supabaseMock: jest.Mocked<SupabaseService>;

  const mockTask: Task = {
    id: 'task-123',
    blueprint_id: 'bp-123',
    title: 'Test Task',
    description: 'Test Description',
    status: 'pending' as TaskStatus,
    priority: 'medium' as TaskPriority,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  };

  beforeEach(() => {
    supabaseMock = {
      client: {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockTask, error: null })
      }
    } as any;

    TestBed.configureTestingModule({
      providers: [
        TaskRepository,
        { provide: SupabaseService, useValue: supabaseMock }
      ]
    });

    repository = TestBed.inject(TaskRepository);
  });

  describe('getCollectionPath', () => {
    it('應返回全域路徑（無 blueprintId）', () => {
      expect(repository.getCollectionPath()).toBe('tasks');
    });

    it('應返回 Blueprint 子集合路徑', () => {
      expect(repository.getCollectionPath('bp-123')).toBe('blueprints/bp-123/tasks');
    });
  });

  describe('findByBlueprint', () => {
    it('應查詢特定 Blueprint 的任務', async () => {
      const mockTasks = [mockTask];
      supabaseMock.client.from().select = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockTasks, error: null })
        })
      });

      const result = await repository.findByBlueprint('bp-123');

      expect(supabaseMock.client.from).toHaveBeenCalledWith('tasks');
      expect(result).toEqual(mockTasks);
    });

    it('應支援狀態篩選', async () => {
      const mockTasks = [mockTask];
      const eqMock = jest.fn().mockReturnThis();
      supabaseMock.client.from().select = jest.fn().mockReturnValue({
        eq: eqMock,
        order: jest.fn().mockResolvedValue({ data: mockTasks, error: null })
      });

      await repository.findByBlueprint('bp-123', { status: 'completed' as TaskStatus });

      expect(eqMock).toHaveBeenCalledWith('blueprint_id', 'bp-123');
      expect(eqMock).toHaveBeenCalledWith('status', 'completed');
    });
  });

  describe('createBatch', () => {
    it('應批次建立任務', async () => {
      const tasksToCreate = [
        { title: 'Task 1', status: 'pending' as TaskStatus },
        { title: 'Task 2', status: 'pending' as TaskStatus }
      ];
      const createdTasks = [mockTask, { ...mockTask, id: 'task-456' }];

      supabaseMock.client.from().insert = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: createdTasks, error: null })
      });

      const result = await repository.createBatch(tasksToCreate as any);

      expect(result).toEqual(createdTasks);
    });
  });

  describe('softDelete', () => {
    it('應標記任務為已刪除', async () => {
      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null })
      });
      supabaseMock.client.from().update = updateMock;

      await repository.softDelete('task-123');

      expect(updateMock).toHaveBeenCalledWith({
        deleted_at: expect.any(String),
        status: 'archived'
      });
    });
  });

  describe('restore', () => {
    it('應恢復已刪除的任務', async () => {
      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockTask, error: null })
          })
        })
      });
      supabaseMock.client.from().update = updateMock;

      const result = await repository.restore('task-123');

      expect(updateMock).toHaveBeenCalledWith({
        deleted_at: null,
        status: 'pending'
      });
      expect(result).toEqual(mockTask);
    });
  });
});
```

#### Step 5: 執行測試與驗證

```bash
# 1. 執行單元測試
yarn test task.repository --watch=false --browsers=ChromeHeadless

# 2. 執行整合測試（如果有）
yarn test:integration blueprint

# 3. 執行 Lint
yarn lint:ts

# 4. 建置專案
yarn build --configuration production

# 5. 檢查沒有引用舊檔案
echo "檢查 task-firestore.repository 引用..."
grep -r "task-firestore.repository" src/ --exclude-dir=node_modules && echo "❌ 仍有引用" || echo "✅ 無引用"

echo "檢查 tasks.repository (Blueprint) 引用..."
grep -r "tasks.repository" src/app/core/blueprint --exclude-dir=node_modules && echo "❌ 仍有引用" || echo "✅ 無引用"
```

#### Step 6: 刪除舊檔案

```bash
# 備份（以防萬一）
mkdir -p /tmp/gighub-repository-backup
cp src/app/core/repositories/task-firestore.repository.ts /tmp/gighub-repository-backup/
cp src/app/core/repositories/task-firestore.repository.spec.ts /tmp/gighub-repository-backup/ 2>/dev/null || true
cp src/app/core/blueprint/modules/implementations/tasks/tasks.repository.ts /tmp/gighub-repository-backup/

# 刪除舊檔案
git rm src/app/core/repositories/task-firestore.repository.ts
git rm src/app/core/repositories/task-firestore.repository.spec.ts 2>/dev/null || true
git rm src/app/core/blueprint/modules/implementations/tasks/tasks.repository.ts

# 提交變更
git add -A
git commit -m "refactor: 合併 Task Repositories 為統一實作

整合三個 Repository 為一:
- task.repository.ts (保留)
- task-firestore.repository.ts (移除)
- tasks.repository.ts (移除)

新增功能:
- 支援 Blueprint 子集合查詢
- Batch 操作 (createBatch, updateBatch)
- Soft delete 與 restore
- 完整的篩選選項

測試:
- ✅ 所有單元測試通過
- ✅ 整合測試通過
- ✅ 建置成功

影響範圍:
- TaskService
- BlueprintService
- 所有使用 Task Repository 的元件

BREAKING CHANGE: TaskFirestoreRepository 和 TasksRepository 類別已移除，請使用 TaskRepository"
```

**預估時間**: 4-6 小時  
**預期收益**: 統一資料存取層，減少維護成本  
**風險等級**: 🔴 High（需要完整測試）

---

### 任務 1.3: 合併 Log Repositories (2 → 1)

**實施步驟**：（類似 Task Repository，簡化描述）

```typescript
// src/app/core/repositories/log.repository.ts

import { Injectable, inject } from '@angular/core';
import { FirestoreBaseRepository } from './base/firestore-base.repository';
import { Log, LogType } from '@core/types/log';
import { SupabaseService } from '@core/services/supabase.service';
import { StorageRepository } from './storage.repository';

/**
 * 統一的 Log Repository
 * 
 * 整合功能:
 * - 標準 CRUD 操作
 * - 照片上傳與管理
 * - Blueprint 子集合查詢
 * - 批次操作
 */
@Injectable({ providedIn: 'root' })
export class LogRepository extends FirestoreBaseRepository<Log> {
  protected collectionName = 'logs';
  private supabase = inject(SupabaseService);
  private storage = inject(StorageRepository);

  // 類似 TaskRepository 的實作...
  
  /**
   * 上傳日誌照片
   * 
   * @param logId - 日誌 ID
   * @param file - 照片檔案
   * @returns 照片 URL
   */
  async uploadPhoto(logId: string, file: File): Promise<string> {
    const path = `logs/${logId}/photos/${Date.now()}_${file.name}`;
    const url = await this.storage.upload(path, file);
    
    // 更新日誌的 photo_urls
    await this.supabase.client
      .from('logs')
      .update({
        photo_urls: /* append url */
      })
      .eq('id', logId);
    
    return url;
  }

  /**
   * 批次上傳照片
   */
  async uploadPhotos(logId: string, files: File[]): Promise<string[]> {
    const uploadPromises = files.map(file => this.uploadPhoto(logId, file));
    return Promise.all(uploadPromises);
  }

  /**
   * 刪除照片
   */
  async deletePhoto(logId: string, photoUrl: string): Promise<void> {
    // 從 Storage 刪除
    await this.storage.delete(photoUrl);
    
    // 從日誌移除 URL
    const { data: log } = await this.supabase.client
      .from('logs')
      .select('photo_urls')
      .eq('id', logId)
      .single();
    
    if (log?.photo_urls) {
      const updatedUrls = log.photo_urls.filter((url: string) => url !== photoUrl);
      await this.supabase.client
        .from('logs')
        .update({ photo_urls: updatedUrls })
        .eq('id', logId);
    }
  }
}
```

**預估時間**: 3-4 小時  
**預期收益**: 統一日誌管理，整合照片功能  
**風險等級**: 🔴 High

---

## 🟡 Phase 2: 中優先級任務（短期）

### 任務 2.1: 整合 Firebase Services（建立 Facade）

**原因選擇**：
- 保持單一職責原則
- 提供統一操作入口
- 不破壞現有服務結構

**實施步驟**：

```typescript
// src/app/core/facades/firebase.facade.ts

import { Injectable, inject } from '@angular/core';
import { FirebaseService } from '@core/services/firebase.service';
import { FirebaseAuthService } from '@core/services/firebase-auth.service';
import { FirebaseAnalyticsService } from '@core/services/firebase-analytics.service';
import { Observable } from 'rxjs';
import { User } from '@core/types/user';

/**
 * Firebase Facade - 統一的 Firebase 操作介面
 * 
 * 提供:
 * - 統一的認證操作
 * - 整合的分析事件
 * - 簡化的 API 呼叫
 * 
 * @remarks
 * 使用 Facade 模式封裝三個 Firebase 服務:
 * - FirebaseService (核心)
 * - FirebaseAuthService (認證)
 * - FirebaseAnalyticsService (分析)
 */
@Injectable({ providedIn: 'root' })
export class FirebaseFacade {
  private firebase = inject(FirebaseService);
  private auth = inject(FirebaseAuthService);
  private analytics = inject(FirebaseAnalyticsService);

  // 直接暴露常用屬性
  get client() {
    return this.firebase.client;
  }

  get currentUser$(): Observable<User | null> {
    return this.auth.currentUser$;
  }

  /**
   * 使用 Email 登入（整合分析）
   */
  async signInWithEmail(email: string, password: string): Promise<User> {
    const user = await this.auth.signInWithEmail(email, password);
    this.analytics.logEvent('login', { method: 'email' });
    return user;
  }

  /**
   * 使用 Google 登入（整合分析）
   */
  async signInWithGoogle(): Promise<User> {
    const user = await this.auth.signInWithGoogle();
    this.analytics.logEvent('login', { method: 'google' });
    return user;
  }

  /**
   * 登出（整合分析）
   */
  async signOut(): Promise<void> {
    await this.auth.signOut();
    this.analytics.logEvent('logout');
  }

  /**
   * 追蹤頁面瀏覽
   */
  trackPageView(pageName: string, params?: Record<string, any>): void {
    this.analytics.logEvent('page_view', { page_name: pageName, ...params });
  }

  /**
   * 追蹤使用者操作
   */
  trackAction(action: string, params?: Record<string, any>): void {
    this.analytics.logEvent('user_action', { action, ...params });
  }
}
```

**遷移指南**：

```typescript
// ❌ 舊寫法
import { FirebaseAuthService } from '@core/services/firebase-auth.service';
import { FirebaseAnalyticsService } from '@core/services/firebase-analytics.service';

export class LoginComponent {
  private auth = inject(FirebaseAuthService);
  private analytics = inject(FirebaseAnalyticsService);
  
  async login(email: string, password: string) {
    const user = await this.auth.signInWithEmail(email, password);
    this.analytics.logEvent('login', { method: 'email' });
  }
}

// ✅ 新寫法
import { FirebaseFacade } from '@core/facades/firebase.facade';

export class LoginComponent {
  private firebase = inject(FirebaseFacade);
  
  async login(email: string, password: string) {
    const user = await this.firebase.signInWithEmail(email, password);
    // 分析事件已自動記錄
  }
}
```

**預估時間**: 3-4 小時  
**預期收益**: 統一 Firebase 操作，簡化呼叫  
**風險等級**: 🟡 Medium

---

### 任務 2.2: 處理孤立功能模組

#### 決策流程圖

```
                     發現孤立模組
                          |
                          v
              +----------------------+
              | 是否在主路由中？      |
              +----------------------+
                    /           \
                  是             否
                  |               |
                  v               v
        +----------------+   +-----------------+
        | 功能是否完整？ |   | 是否需要此功能？|
        +----------------+   +-----------------+
            /        \           /          \
          完整      未完成       需要        不需要
           |          |          |            |
           v          v          v            v
      保留並     移至WIP     整合到      移除或歸檔
      文件化     目錄      主路由
```

#### 2.2.1: 處理 Explore 功能

**驗證步驟**：

```bash
# 1. 檢查主路由配置
echo "=== 檢查 Explore 路由 ==="
grep -A 5 "explore" src/app/routes/routes.ts

# 2. 檢查元件引用
echo ""
echo "=== 檢查元件引用 ==="
grep -r "ExplorePageComponent" src/ --exclude-dir=node_modules
grep -r "explore-search.facade" src/ --exclude-dir=node_modules

# 3. 檢查導航連結
echo ""
echo "=== 檢查導航連結 ==="
grep -r "routerLink.*explore" src/ --exclude-dir=node_modules

# 4. 檢查功能完整度
echo ""
echo "=== 檢查服務實作 ==="
cat src/app/routes/explore/services/explore-search.facade.ts | head -50
```

**決策 A: 如需整合**

```typescript
// src/app/routes/routes.ts

export const routes: Routes = [
  // ... 其他路由
  
  {
    path: 'explore',
    loadChildren: () => import('./explore/routes').then(m => m.EXPLORE_ROUTES),
    canActivate: [authGuard],
    data: {
      title: '探索',
      icon: 'search',
      description: '搜尋藍圖、任務、團隊成員'
    }
  },
  
  // ...
];
```

**決策 B: 如不需要**

```bash
# 1. 備份到 Git 標籤
git tag "archive/explore-feature-$(date +%Y%m%d)" HEAD
git push origin "archive/explore-feature-$(date +%Y%m%d)"

# 2. 移除功能
git rm -r src/app/routes/explore

# 3. 提交
git commit -m "chore: 移除未使用的 Explore 功能

原因: 功能未完成且當前不需要

備份: 可從 Git 標籤 'archive/explore-feature-YYYYMMDD' 恢復

如需恢復:
git checkout archive/explore-feature-YYYYMMDD -- src/app/routes/explore"

# 4. 文件化
echo "## Explore 功能

移除日期: $(date +%Y-%m-%d)
備份標籤: archive/explore-feature-$(date +%Y%m%d)
原因: 功能未完成且當前不需要

恢復方式:
\`\`\`bash
git checkout archive/explore-feature-$(date +%Y%m%d) -- src/app/routes/explore
\`\`\`
" >> docs/ARCHIVED_FEATURES.md
```

**預估時間**: 1-12 小時（視決策而定）  
**風險等級**: 🟡 Medium

#### 2.2.2: 處理 Climate Module

**驗證步驟**：

```bash
# 檢查 Climate Module 是否在 Blueprint Container 註冊
grep -r "ClimateModule" src/app/core/blueprint/ --exclude-dir=node_modules

# 檢查模組檔案
cat src/app/core/blueprint/modules/implementations/climate/climate.module.ts

# 檢查 README
cat src/app/core/blueprint/modules/implementations/climate/README.md
```

**決策 A: 如需啟用**

```typescript
// src/app/core/blueprint/container/module-registry.ts

import { ClimateModule } from '@core/blueprint/modules/implementations/climate';

export const MODULE_REGISTRY = {
  // ... 其他模組
  
  'climate': {
    name: 'Climate Module',
    description: '氣候與天氣資訊模組',
    icon: 'cloud',
    module: ClimateModule,
    optional: false  // 或 true（選用）
  },
  
  // ...
};
```

**決策 B: 如為選用模組**

```bash
# 移至 optional-modules
mkdir -p src/app/core/blueprint/modules/optional
mv src/app/core/blueprint/modules/implementations/climate \
   src/app/core/blueprint/modules/optional/climate

# 更新文檔
echo "# 選用模組

## Climate Module

路徑: \`src/app/core/blueprint/modules/optional/climate\`

啟用方式:
\`\`\`typescript
import { ClimateModule } from '@core/blueprint/modules/optional/climate';

// 在 module-registry.ts 註冊
\`\`\`
" > src/app/core/blueprint/modules/optional/README.md
```

**預估時間**: 2-3 小時  
**風險等級**: 🟡 Medium

---

### 任務 2.3: 清理未使用的模組檢視元件

**驗證腳本**：

```bash
#!/bin/bash
# scripts/check-module-views.sh

COMPONENTS=(
  "acceptance-module-view"
  "communication-module-view"
  "finance-module-view"
  "log-module-view"
  "material-module-view"
  "qa-module-view"
  "safety-module-view"
  "workflow-module-view"
)

echo "檢查模組檢視元件使用情況..."
echo ""

for comp in "${COMPONENTS[@]}"; do
  echo "=== $comp ==="
  
  # 搜尋路由引用
  route_refs=$(grep -r "$comp" src/app/routes/blueprint/routes.ts | wc -l)
  
  # 搜尋動態載入
  dynamic_refs=$(grep -r "loadChildren.*$comp" src/ | wc -l)
  
  # 搜尋元件引用
  component_refs=$(grep -r "${comp^}Component" src/ --exclude-dir=node_modules | wc -l)
  
  total=$((route_refs + dynamic_refs + component_refs))
  
  if [ "$total" -eq 0 ]; then
    echo "  ❌ 未被使用 (0 references)"
  else
    echo "  ✅ 有被使用 ($total references)"
    echo "     - Routes: $route_refs"
    echo "     - Dynamic: $dynamic_refs"
    echo "     - Components: $component_refs"
  fi
  
  echo ""
done
```

**清理步驟**：

```bash
# 執行檢查
bash scripts/check-module-views.sh > /tmp/module-views-check.txt
cat /tmp/module-views-check.txt

# 如果確認未使用，刪除
UNUSED_COMPONENTS=(
  "acceptance-module-view.component.ts"
  "communication-module-view.component.ts"
  # ... 其他未使用的
)

for comp in "${UNUSED_COMPONENTS[@]}"; do
  echo "刪除: $comp"
  git rm "src/app/routes/blueprint/modules/$comp"
done

# 提交
git commit -m "chore: 清理未使用的模組檢視元件

移除元件:
- acceptance-module-view.component.ts
- communication-module-view.component.ts
- finance-module-view.component.ts
- log-module-view.component.ts
- material-module-view.component.ts
- qa-module-view.component.ts
- safety-module-view.component.ts
- workflow-module-view.component.ts

原因: 這些元件未在路由中註冊，且沒有其他引用

驗證: 執行 scripts/check-module-views.sh 確認無引用"
```

**預估時間**: 2 小時  
**風險等級**: 🟢 Low

---

## 🟢 Phase 3: 低優先級任務（長期）

### 任務 3.1: 合併 Shared Modules

**問題分析**：
- `shared-zorro.module.ts` 和 `shared-delon.module.ts` 已被 `SHARED_IMPORTS` 取代
- 這些檔案只是中間層，無額外價值

**實施步驟**：

```bash
# 1. 驗證 SHARED_IMPORTS 包含所有必要模組
cat src/app/shared/shared-imports.ts

# 2. 搜尋舊模組引用
echo "=== 搜尋 SharedZorroModule 引用 ==="
grep -r "SharedZorroModule" src/ --exclude-dir=node_modules

echo ""
echo "=== 搜尋 SharedDelonModule 引用 ==="
grep -r "SharedDelonModule" src/ --exclude-dir=node_modules

# 3. 替換所有引用
find src -type f -name "*.ts" -exec sed -i \
  "s|import { SharedZorroModule } from '@shared/shared-zorro.module'|import { SHARED_IMPORTS } from '@shared'|g" {} +

find src -type f -name "*.ts" -exec sed -i \
  "s|SharedZorroModule|SHARED_IMPORTS|g" {} +

# 4. 刪除舊檔案
git rm src/app/shared/shared-zorro.module.ts
git rm src/app/shared/shared-delon.module.ts

# 5. 提交
git commit -m "refactor: 移除冗餘的 Shared Modules

移除:
- shared-zorro.module.ts
- shared-delon.module.ts

原因: SHARED_IMPORTS 已包含所有功能

所有元件應使用:
import { SHARED_IMPORTS } from '@shared';

@Component({
  standalone: true,
  imports: [SHARED_IMPORTS]
})"
```

**預估時間**: 1-2 小時  
**風險等級**: 🟢 Low

---

### 任務 3.2: 清理其他項目

```bash
# 1. 清理空測試檔案
echo "=== 檢查空測試 ==="
for file in \
  "src/app/core/i18n/i18n.service.spec.ts" \
  "src/app/core/services/logger/logger.service.spec.ts" \
  "src/app/routes/explore/services/search-cache.service.spec.ts"
do
  echo "File: $file"
  lines=$(cat "$file" 2>/dev/null | wc -l)
  if [ "$lines" -lt 20 ]; then
    echo "  ❌ 幾乎為空 ($lines lines)"
  else
    echo "  ✅ 有內容 ($lines lines)"
  fi
done

# 2. 清理 CDK Module 冗餘
# 直接在元件中按需匯入 CDK 模組

# 3. 清理孤立元件
git rm src/app/routes/blueprint/components/validation-alerts.component.ts
git rm src/app/routes/blueprint/components/connection-layer.component.ts
```

**預估時間**: 2-3 小時  
**風險等級**: 🟢 Low

---

## 📊 風險評估與緩解策略

### 🔴 高風險: Repository 合併

**風險描述**：
合併 Repository 可能破壞現有的 CRUD 操作

**影響範圍**：
- TaskService
- LogService
- BlueprintService
- 所有使用這些服務的元件

**緩解策略**：

#### 1. Feature Flag 控制

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  features: {
    useNewTaskRepository: false,  // 預設關閉
    useNewLogRepository: false
  }
};

// task.repository.ts
async findAll(): Promise<Task[]> {
  if (!environment.features.useNewTaskRepository) {
    return this.legacyFindAll();  // 回退到舊實作
  }
  
  // 新實作
  const { data, error } = await this.supabase.client
    .from('tasks')
    .select('*');
  
  if (error) {
    // 記錄錯誤並回退
    this.logger.error('New repository failed, falling back to legacy', error);
    return this.legacyFindAll();
  }
  
  return data || [];
}
```

#### 2. 完整測試覆蓋

```bash
# 執行所有相關測試
yarn test task.repository --watch=false --code-coverage
yarn test task.service --watch=false --code-coverage
yarn test blueprint.service --watch=false --code-coverage

# 確保覆蓋率 ≥ 80%
```

#### 3. 分階段遷移

```
Week 1: 新實作與舊實作並存 (Feature Flag = false)
Week 2: 內部測試 (Feature Flag = true for dev)
Week 3: Beta 測試 (Feature Flag = true for staging)
Week 4: 生產部署 (Feature Flag = true for production)
Week 5: 移除舊實作
```

#### 4. 監控與回滾

```typescript
// 加入錯誤追蹤
import { inject } from '@angular/core';
import { ErrorTrackingService } from '@core/services/error-tracking.service';

async findAll(): Promise<Task[]> {
  const startTime = Date.now();
  const errorTracking = inject(ErrorTrackingService);
  
  try {
    const result = await this.newImplementation();
    
    // 記錄成功
    errorTracking.track('repository_success', {
      operation: 'TaskRepository.findAll',
      duration: Date.now() - startTime,
      implementation: 'new'
    });
    
    return result;
  } catch (error) {
    // 記錄失敗
    errorTracking.captureException(error, {
      context: 'TaskRepository.findAll',
      implementation: 'new'
    });
    
    // 回退到舊實作
    return this.legacyImplementation();
  }
}
```

**回滾計畫**：

```bash
# 如果出現嚴重問題
git revert HEAD~3..HEAD
git push origin main

# 或重置 Feature Flag
# environment.production.ts
features: {
  useNewTaskRepository: false
}
```

---

### 🟡 中風險: 誤刪有用檔案

**緩解策略**：

#### 1. Git 備份

```bash
# 在刪除前建立備份分支
git checkout -b backup/before-refactor-$(date +%Y%m%d)
git push origin backup/before-refactor-$(date +%Y%m%d)

# 回到主分支
git checkout main
```

#### 2. 驗證腳本

```bash
#!/bin/bash
# scripts/verify-file-usage.sh

FILE=$1

if [ -z "$FILE" ]; then
  echo "Usage: $0 <file-path>"
  exit 1
fi

FILENAME=$(basename "$FILE")
echo "=== 檢查檔案: $FILENAME ==="

# 1. 直接 import
echo "1. Import 引用:"
grep -r "from.*$FILENAME" src/ --exclude-dir=node_modules

# 2. 動態載入
echo ""
echo "2. 動態載入:"
grep -r "loadChildren.*$FILENAME" src/

# 3. 字串引用
echo ""
echo "3. 字串引用:"
grep -r "'$FILENAME'" src/
grep -r "\"$FILENAME\"" src/

# 4. Angular assets
echo ""
echo "4. Assets 配置:"
grep -r "$FILENAME" angular.json

# 總結
echo ""
echo "=== 總結 ==="
TOTAL=$(grep -r "$FILENAME" src/ --exclude-dir=node_modules | wc -l)
if [ "$TOTAL" -eq 0 ]; then
  echo "✅ 未發現引用，可安全刪除"
else
  echo "⚠️  發現 $TOTAL 處引用，請確認後再刪除"
fi
```

#### 3. 分批刪除並測試

```bash
# 第一批: 明確無用的示範檔案
git rm src/assets/tmp/demo.*
yarn test && yarn build

# 第二批: 未使用的元件
git rm src/app/routes/explore
yarn test && yarn build

# 每批後都執行完整測試
```

---

### 🟢 低風險: 測試破壞

**緩解策略**：

#### 1. 測試先行

```bash
# 重構前執行測試基準
yarn test --watch=false --browsers=ChromeHeadless 2>&1 | tee /tmp/test-before.txt

# 重構後執行測試
yarn test --watch=false --browsers=ChromeHeadless 2>&1 | tee /tmp/test-after.txt

# 比較結果
diff /tmp/test-before.txt /tmp/test-after.txt
```

#### 2. 保留相容性測試

```typescript
describe('TaskRepository Backward Compatibility', () => {
  let newRepo: TaskRepository;
  
  beforeEach(() => {
    newRepo = TestBed.inject(TaskRepository);
  });
  
  it('應保持與舊 Repository 相同的介面', () => {
    // 確保所有舊方法仍可用
    expect(newRepo.findAll).toBeDefined();
    expect(newRepo.findById).toBeDefined();
    expect(newRepo.create).toBeDefined();
    expect(newRepo.update).toBeDefined();
    expect(newRepo.delete).toBeDefined();
  });
  
  it('應返回相同格式的資料', async () => {
    const result = await newRepo.findAll();
    
    // 驗證資料格式
    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('title');
      expect(result[0]).toHaveProperty('status');
    }
  });
});
```

---

## ✅ 驗證檢查清單

### Phase 1 完成檢查

- [ ] 示範檔案已移除
  - [ ] `src/assets/tmp/demo.*` 不存在
  - [ ] Bundle 大小減少 2-3 MB
  - [ ] 建置成功
  
- [ ] Task Repository 已合併
  - [ ] `task-firestore.repository.ts` 已刪除
  - [ ] `tasks.repository.ts` (Blueprint) 已刪除
  - [ ] 所有引用已更新
  - [ ] 測試覆蓋率 ≥ 80%
  - [ ] 所有測試通過
  
- [ ] Log Repository 已合併
  - [ ] `log-firestore.repository.ts` 已刪除
  - [ ] 照片管理功能整合
  - [ ] 測試通過

### Phase 2 完成檢查

- [ ] Firebase Facade 已建立
  - [ ] 統一的操作介面
  - [ ] 分析事件自動記錄
  - [ ] 文檔已更新
  
- [ ] 孤立功能已處理
  - [ ] Explore: 整合或移除
  - [ ] Climate: 啟用或移至 optional
  - [ ] 狀態已文件化
  
- [ ] 模組檢視元件已清理
  - [ ] 未使用元件已移除
  - [ ] 路由配置已確認

### Phase 3 完成檢查

- [ ] Shared Modules 已合併
  - [ ] 舊模組檔案已刪除
  - [ ] 所有引用已更新為 SHARED_IMPORTS
  
- [ ] 其他清理已完成
  - [ ] 空測試已處理
  - [ ] 孤立元件已移除

### 品質指標達成

- [ ] 程式碼重複率 < 5%
- [ ] 測試覆蓋率 ≥ 75%
- [ ] Bundle 大小減少 ≥ 2 MB
- [ ] 所有 Lint 檢查通過
- [ ] 所有測試通過
- [ ] 建置成功
- [ ] E2E 測試通過（如適用）

---

## 📚 相關文件

### 必須建立的文件

1. **MIGRATION_GUIDE.md** - 開發者遷移指南
2. **ARCHITECTURE_DECISIONS.md** - 架構決策記錄 (ADR)
3. **DEPRECATED_FILES.md** - 已棄用檔案清單
4. **ARCHIVED_FEATURES.md** - 已歸檔功能清單

### 必須更新的文件

1. **README.md** - 更新專案結構說明
2. **CHANGELOG.md** - 記錄重大變更
3. **.github/instructions/** - 更新開發指引

---

## 🎯 成功指標

### 程式碼品質

| 指標 | 目標 | 測量方式 |
|------|------|---------|
| 重複程式碼 | < 5% | `npx jscpd src/` |
| 測試覆蓋率 | ≥ 75% | `yarn test-coverage` |
| 技術債評分 | ≥ A | SonarQube |
| Lint 錯誤 | 0 | `yarn lint` |

### 效能

| 指標 | 目標 | 測量方式 |
|------|------|---------|
| Bundle 大小 | 減少 ≥ 2 MB | `yarn analyze:view` |
| Build 時間 | 減少 ≥ 10% | `time yarn build` |
| 檔案數量 | 減少 ≥ 30 個 | `find src -type f \| wc -l` |

### 維護性

| 指標 | 目標 | 測量方式 |
|------|------|---------|
| Repository 統一 | 100% | 手動檢查 |
| 文檔完整度 | 100% | Code Review |
| 孤立功能 | 0 個 | 架構審查 |

---

## 🔄 持續改進

### 每週檢查

```bash
# 執行每週檢查腳本
./scripts/weekly-architecture-check.sh
```

### 每月審查

- 檢查新增的重複程式碼
- 審查 Repository 使用情況
- 更新架構決策文件

### 每季度全面審查

- 執行完整架構分析
- 更新重構計畫
- 團隊回顧與改進

---

## 📞 支援與問題

### 遇到問題時

1. 查閱本文件的相關章節
2. 檢查 MIGRATION_GUIDE.md
3. 查看 Git 歷史記錄
4. 在團隊頻道提問

### 緊急回滾

```bash
# 回滾到重構前的狀態
git checkout backup/before-refactor-YYYYMMDD

# 或使用 Feature Flag 關閉新功能
# 修改 environment.production.ts
```

---

**計畫版本**: v1.0  
**建立日期**: 2025-12-13  
**下次審查**: 2026-03-13  
**負責人**: 開發團隊  
**批准人**: 技術主管
