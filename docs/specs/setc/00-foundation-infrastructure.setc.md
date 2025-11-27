---
title: "SETC-00: 基礎架構設計"
status: draft
created: 2025-11-27
updated: 2025-11-27
owners: []
progress: 0
due: null
priority: critical
estimated_weeks: 2
---

# SETC-00: 基礎架構設計

> **Phase 0: Foundation Infrastructure**

本文件定義 GigHub 系統的基礎架構設計，包含 12 項容器層基礎設施、核心資料表設計、以及跨模組共用的技術規格。所有後續 SETC 都應參照本文件的設計規範。

---

## 📋 文件資訊

| 屬性 | 值 |
|------|-----|
| **文件編號** | SETC-00 |
| **類型** | 基礎架構（Foundation） |
| **前置條件** | 無 |
| **後續依賴** | SETC-01 ~ SETC-10 |
| **PRD 對應** | 全域架構需求 |

---

## 🏗️ 三層架構定義

### 架構層級判斷流程

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        基礎層 (Foundation Layer)                         │
│                                                                          │
│   問：涉及用戶身份、組織、Bot、認證嗎？                                    │
│   ├── 是 → 在基礎層處理                                                   │
│   └── 否 → 繼續往下層判斷                                                 │
│                                                                          │
│   核心實體：accounts, organizations, teams, auth                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        容器層 (Container Layer)                          │
│                                                                          │
│   問：涉及藍圖、工作區、分支、權限嗎？                                     │
│   ├── 是 → 在容器層處理                                                   │
│   └── 否 → 在業務層處理                                                   │
│                                                                          │
│   核心實體：blueprints, workspaces, blueprint_members, blueprint_roles    │
│   核心基礎設施：12 項（見下文）                                            │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        業務層 (Business Layer)                           │
│                                                                          │
│   問：屬於哪個業務模組？                                                  │
│   ├── 任務管理 → tasks, task_attachments                                 │
│   ├── 施工日誌 → diaries, diary_photos                                   │
│   ├── 品質驗收 → checklists, task_acceptances                            │
│   ├── 問題追蹤 → issues                                                  │
│   └── 其他業務 → 對應資料表                                               │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 12 項容器層基礎設施

### 基礎設施清單

| # | 名稱 | 英文名稱 | 說明 | 狀態 |
|---|------|----------|------|:----:|
| 1 | 上下文注入 | Context Injection | 自動注入 Blueprint/User/Permissions | 🔴 待設計 |
| 2 | 權限系統 | RBAC | 多層級角色權限控制 | 🔴 待設計 |
| 3 | 時間軸服務 | Timeline Service | 跨模組活動追蹤 | 🔴 待設計 |
| 4 | 通知中心 | Notification Hub | 多渠道通知路由 | 🔴 待設計 |
| 5 | 事件總線 | Event Bus | 模組間解耦通訊 | 🔴 待設計 |
| 6 | 搜尋引擎 | Search Engine | 跨模組全文檢索 | 🔴 待設計 |
| 7 | 關聯管理 | Relation Manager | 跨模組資源引用 | 🔴 待設計 |
| 8 | 資料隔離 | Data Isolation (RLS) | 多租戶資料隔離 | 🔴 待設計 |
| 9 | 生命週期 | Lifecycle Manager | Draft/Active/Archived/Deleted | 🔴 待設計 |
| 10 | 配置中心 | Config Center | 藍圖級配置管理 | 🔴 待設計 |
| 11 | 元數據系統 | Metadata System | 自訂欄位支援 | 🔴 待設計 |
| 12 | API 閘道 | API Gateway | 對外 API 統一入口 | 🔴 待設計 |

---

### 基礎設施 #1: 上下文注入 (Context Injection)

#### 設計說明

上下文注入負責在應用程式各層自動傳遞當前用戶、藍圖、權限等上下文資訊。

#### TypeScript 介面定義

```typescript
// src/app/core/facades/workspace-context.facade.ts

export type WorkspaceContextType = 'USER' | 'ORGANIZATION' | 'TEAM' | 'BOT';

export interface WorkspaceContext {
  /** 當前帳戶 ID */
  accountId: string;
  /** 上下文類型 */
  contextType: WorkspaceContextType;
  /** 組織 ID（如適用） */
  organizationId?: string;
  /** 團隊 ID（如適用） */
  teamId?: string;
  /** 當前藍圖 ID */
  blueprintId?: string;
  /** 當前分支 ID */
  branchId?: string;
  /** 用戶在藍圖中的角色 */
  blueprintRole?: BlueprintRole;
  /** 權限列表 */
  permissions: string[];
  /** 上下文載入時間 */
  loadedAt: Date;
}

export type BlueprintRole = 
  | 'owner'           // 擁有者
  | 'admin'           // 管理員
  | 'project_manager' // 專案經理
  | 'site_director'   // 工地主任
  | 'worker'          // 施工人員
  | 'qa_staff'        // 品管人員
  | 'observer';       // 觀察者
```

#### Facade 實作

```typescript
// src/app/core/facades/workspace-context.facade.ts

import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@core';

@Injectable({ providedIn: 'root' })
export class WorkspaceContextFacade {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  // 私有狀態
  private readonly _context = signal<WorkspaceContext | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // 公開唯讀狀態
  readonly context = this._context.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // 計算屬性
  readonly isAuthenticated = computed(() => !!this._context()?.accountId);
  readonly currentAccountId = computed(() => this._context()?.accountId);
  readonly currentBlueprintId = computed(() => this._context()?.blueprintId);
  readonly currentRole = computed(() => this._context()?.blueprintRole);
  readonly permissions = computed(() => this._context()?.permissions ?? []);

  /**
   * 檢查是否有特定權限
   */
  hasPermission(permission: string): boolean {
    return this.permissions().includes(permission);
  }

  /**
   * 檢查是否有任一權限
   */
  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(p => this.hasPermission(p));
  }

  /**
   * 檢查是否有所有權限
   */
  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(p => this.hasPermission(p));
  }

  /**
   * 載入上下文
   */
  async loadContext(blueprintId?: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const user = await this.auth.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // TODO: 從 API 載入完整上下文
      const context: WorkspaceContext = {
        accountId: user.id,
        contextType: 'USER',
        blueprintId,
        permissions: [],
        loadedAt: new Date()
      };

      this._context.set(context);
    } catch (error) {
      this._error.set((error as Error).message);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * 清除上下文
   */
  clearContext(): void {
    this._context.set(null);
  }
}
```

#### 使用方式

```typescript
// 在元件中使用
@Component({ ... })
export class TaskListComponent {
  private readonly contextFacade = inject(WorkspaceContextFacade);

  readonly canCreateTask = computed(() => 
    this.contextFacade.hasPermission('task:create')
  );

  readonly canDeleteTask = computed(() =>
    this.contextFacade.hasAnyPermission(['task:delete', 'admin:*'])
  );
}
```

---

### 基礎設施 #2: 權限系統 (RBAC)

#### 設計說明

實作多層級角色權限控制，支援平台層級和藍圖層級的角色管理。

#### 權限層級結構

```
平台層級角色（帳戶體系）
├── super_admin     - 系統超級管理員
├── org_owner       - 組織擁有者
├── org_admin       - 組織管理員
└── user            - 一般用戶

藍圖層級角色（業務角色）
├── owner           - 藍圖擁有者
├── admin           - 藍圖管理員
├── project_manager - 專案經理
├── site_director   - 工地主任
├── worker          - 施工人員
├── qa_staff        - 品管人員
└── observer        - 觀察者
```

#### 權限清單定義

```typescript
// src/app/core/constants/permissions.ts

export const PERMISSIONS = {
  // 藍圖權限
  BLUEPRINT: {
    CREATE: 'blueprint:create',
    READ: 'blueprint:read',
    UPDATE: 'blueprint:update',
    DELETE: 'blueprint:delete',
    MANAGE_MEMBERS: 'blueprint:manage_members',
    MANAGE_SETTINGS: 'blueprint:manage_settings',
  },
  
  // 任務權限
  TASK: {
    CREATE: 'task:create',
    READ: 'task:read',
    UPDATE: 'task:update',
    DELETE: 'task:delete',
    ASSIGN: 'task:assign',
    COMPLETE: 'task:complete',
    APPROVE: 'task:approve',
  },
  
  // 日誌權限
  DIARY: {
    CREATE: 'diary:create',
    READ: 'diary:read',
    UPDATE: 'diary:update',
    DELETE: 'diary:delete',
    APPROVE: 'diary:approve',
  },
  
  // 檔案權限
  FILE: {
    UPLOAD: 'file:upload',
    DOWNLOAD: 'file:download',
    DELETE: 'file:delete',
    MANAGE: 'file:manage',
  },
  
  // 驗收權限
  INSPECTION: {
    CREATE: 'inspection:create',
    READ: 'inspection:read',
    UPDATE: 'inspection:update',
    APPROVE: 'inspection:approve',
    SIGN: 'inspection:sign',
  },
  
  // 問題追蹤權限
  ISSUE: {
    CREATE: 'issue:create',
    READ: 'issue:read',
    UPDATE: 'issue:update',
    ASSIGN: 'issue:assign',
    RESOLVE: 'issue:resolve',
    CLOSE: 'issue:close',
  },
  
  // 報表權限
  REPORT: {
    VIEW: 'report:view',
    EXPORT: 'report:export',
    GENERATE: 'report:generate',
  },
  
  // 管理權限
  ADMIN: {
    ALL: 'admin:*',
    USERS: 'admin:users',
    SETTINGS: 'admin:settings',
    AUDIT: 'admin:audit',
  },
} as const;

// 角色權限對應
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  owner: [
    PERMISSIONS.ADMIN.ALL,
  ],
  admin: [
    PERMISSIONS.BLUEPRINT.MANAGE_MEMBERS,
    PERMISSIONS.BLUEPRINT.MANAGE_SETTINGS,
    PERMISSIONS.TASK.CREATE,
    PERMISSIONS.TASK.UPDATE,
    PERMISSIONS.TASK.DELETE,
    PERMISSIONS.TASK.ASSIGN,
    PERMISSIONS.TASK.APPROVE,
    // ... 其他權限
  ],
  project_manager: [
    PERMISSIONS.TASK.CREATE,
    PERMISSIONS.TASK.UPDATE,
    PERMISSIONS.TASK.ASSIGN,
    PERMISSIONS.TASK.APPROVE,
    PERMISSIONS.DIARY.APPROVE,
    PERMISSIONS.INSPECTION.APPROVE,
    PERMISSIONS.REPORT.VIEW,
    PERMISSIONS.REPORT.EXPORT,
    // ... 其他權限
  ],
  site_director: [
    PERMISSIONS.TASK.READ,
    PERMISSIONS.TASK.UPDATE,
    PERMISSIONS.TASK.COMPLETE,
    PERMISSIONS.DIARY.CREATE,
    PERMISSIONS.DIARY.UPDATE,
    PERMISSIONS.INSPECTION.CREATE,
    PERMISSIONS.ISSUE.CREATE,
    // ... 其他權限
  ],
  worker: [
    PERMISSIONS.TASK.READ,
    PERMISSIONS.DIARY.READ,
    PERMISSIONS.FILE.UPLOAD,
    PERMISSIONS.FILE.DOWNLOAD,
  ],
  qa_staff: [
    PERMISSIONS.TASK.READ,
    PERMISSIONS.INSPECTION.CREATE,
    PERMISSIONS.INSPECTION.UPDATE,
    PERMISSIONS.INSPECTION.SIGN,
    PERMISSIONS.ISSUE.CREATE,
    PERMISSIONS.ISSUE.UPDATE,
  ],
  observer: [
    PERMISSIONS.BLUEPRINT.READ,
    PERMISSIONS.TASK.READ,
    PERMISSIONS.DIARY.READ,
    PERMISSIONS.FILE.DOWNLOAD,
    PERMISSIONS.REPORT.VIEW,
  ],
};
```

#### 權限檢查指令

```typescript
// src/app/shared/directives/has-permission.directive.ts

import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect } from '@angular/core';
import { WorkspaceContextFacade } from '@core';

@Directive({
  selector: '[appHasPermission]',
  standalone: true,
})
export class HasPermissionDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly contextFacade = inject(WorkspaceContextFacade);

  private hasView = false;

  @Input() set appHasPermission(permission: string | string[]) {
    effect(() => {
      const permissions = Array.isArray(permission) ? permission : [permission];
      const hasPermission = this.contextFacade.hasAnyPermission(permissions);

      if (hasPermission && !this.hasView) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView = true;
      } else if (!hasPermission && this.hasView) {
        this.viewContainer.clear();
        this.hasView = false;
      }
    });
  }
}
```

---

### 基礎設施 #3: 時間軸服務 (Timeline Service)

#### 設計說明

記錄和顯示跨模組的活動歷史，支援任務、日誌、檔案、驗收等各類活動。

#### 資料表設計

```sql
-- Migration: 20250101_create_activities_table.sql

CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
    
    -- 活動類型
    entity_type VARCHAR(50) NOT NULL, -- 'task', 'diary', 'file', 'inspection', 'issue'
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'deleted', 'completed', 'commented'
    
    -- 活動詳情
    actor_id UUID NOT NULL REFERENCES accounts(id),
    changes JSONB, -- 變更內容
    metadata JSONB DEFAULT '{}',
    
    -- 時間戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX idx_activities_blueprint ON activities(blueprint_id);
CREATE INDEX idx_activities_entity ON activities(entity_type, entity_id);
CREATE INDEX idx_activities_actor ON activities(actor_id);
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);

-- 啟用 RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- RLS 政策
CREATE POLICY "activities_select_policy"
ON activities FOR SELECT
USING (
    blueprint_id IN (
        SELECT blueprint_id FROM blueprint_members
        WHERE account_id = auth.uid()
    )
);

CREATE POLICY "activities_insert_policy"
ON activities FOR INSERT
WITH CHECK (
    blueprint_id IN (
        SELECT blueprint_id FROM blueprint_members
        WHERE account_id = auth.uid()
    )
);
```

#### TypeScript 介面

```typescript
// src/app/features/blueprint/domain/types/activity.types.ts

export type ActivityEntityType = 
  | 'task' 
  | 'diary' 
  | 'file' 
  | 'inspection' 
  | 'issue' 
  | 'comment';

export type ActivityAction = 
  | 'created' 
  | 'updated' 
  | 'deleted' 
  | 'completed' 
  | 'commented' 
  | 'assigned' 
  | 'status_changed'
  | 'approved'
  | 'rejected';

export interface Activity {
  id: string;
  blueprintId: string;
  entityType: ActivityEntityType;
  entityId: string;
  action: ActivityAction;
  actorId: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface ActivityWithActor extends Activity {
  actor: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
}
```

#### 服務實作

```typescript
// src/app/features/blueprint/data-access/services/timeline.service.ts

import { Injectable, inject, signal, computed } from '@angular/core';
import { SupabaseService } from '@core';
import { Activity, ActivityWithActor, ActivityEntityType, ActivityAction } from '../../domain';

@Injectable({ providedIn: 'root' })
export class TimelineService {
  private readonly supabase = inject(SupabaseService);

  // 狀態
  private readonly _activities = signal<ActivityWithActor[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // 公開狀態
  readonly activities = this._activities.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // 計算屬性
  readonly todayActivities = computed(() => {
    const today = new Date().toDateString();
    return this._activities().filter(a => 
      new Date(a.createdAt).toDateString() === today
    );
  });

  /**
   * 載入藍圖時間軸
   */
  async loadTimeline(blueprintId: string, options?: {
    entityType?: ActivityEntityType;
    entityId?: string;
    limit?: number;
    offset?: number;
  }): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      let query = this.supabase.client
        .from('activities')
        .select(`
          *,
          actor:accounts!actor_id(id, display_name, avatar_url)
        `)
        .eq('blueprint_id', blueprintId)
        .order('created_at', { ascending: false });

      if (options?.entityType) {
        query = query.eq('entity_type', options.entityType);
      }
      if (options?.entityId) {
        query = query.eq('entity_id', options.entityId);
      }
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;
      this._activities.set(data || []);
    } catch (error) {
      this._error.set((error as Error).message);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * 記錄活動
   */
  async recordActivity(activity: Omit<Activity, 'id' | 'createdAt'>): Promise<void> {
    try {
      const { error } = await this.supabase.client
        .from('activities')
        .insert({
          blueprint_id: activity.blueprintId,
          entity_type: activity.entityType,
          entity_id: activity.entityId,
          action: activity.action,
          actor_id: activity.actorId,
          changes: activity.changes,
          metadata: activity.metadata,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to record activity:', error);
    }
  }
}
```

---

### 基礎設施 #4: 通知中心 (Notification Hub)

#### 設計說明

統一管理應用內通知、電子郵件通知、推播通知等多渠道通知。

#### 資料表設計

```sql
-- Migration: 20250101_create_notifications_table.sql

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    
    -- 通知內容
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'info', 'warning', 'error', 'success'
    category VARCHAR(50) NOT NULL, -- 'task', 'diary', 'inspection', 'mention', 'system'
    
    -- 關聯實體
    entity_type VARCHAR(50),
    entity_id UUID,
    blueprint_id UUID REFERENCES blueprints(id) ON DELETE CASCADE,
    
    -- 狀態
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    
    -- 時間戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ
);

-- 索引
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX idx_notifications_unread ON notifications(recipient_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- 啟用 RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS 政策：用戶只能看到自己的通知
CREATE POLICY "notifications_select_policy"
ON notifications FOR SELECT
USING (recipient_id = auth.uid());

CREATE POLICY "notifications_update_policy"
ON notifications FOR UPDATE
USING (recipient_id = auth.uid());
```

#### TypeScript 介面

```typescript
// src/app/core/types/notification.types.ts

export type NotificationType = 'info' | 'warning' | 'error' | 'success';
export type NotificationCategory = 'task' | 'diary' | 'inspection' | 'mention' | 'system';

export interface Notification {
  id: string;
  recipientId: string;
  title: string;
  body: string;
  type: NotificationType;
  category: NotificationCategory;
  entityType?: string;
  entityId?: string;
  blueprintId?: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  expiresAt?: Date;
}

export interface CreateNotificationRequest {
  recipientId: string;
  title: string;
  body: string;
  type: NotificationType;
  category: NotificationCategory;
  entityType?: string;
  entityId?: string;
  blueprintId?: string;
  expiresAt?: Date;
}
```

#### 服務實作

```typescript
// src/app/core/services/notification.service.ts

import { Injectable, inject, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Notification, CreateNotificationRequest } from '../types';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly supabase = inject(SupabaseService);

  // 狀態
  private readonly _notifications = signal<Notification[]>([]);
  private readonly _loading = signal(false);

  // 公開狀態
  readonly notifications = this._notifications.asReadonly();
  readonly loading = this._loading.asReadonly();

  // 計算屬性
  readonly unreadCount = computed(() => 
    this._notifications().filter(n => !n.isRead).length
  );

  readonly unreadNotifications = computed(() =>
    this._notifications().filter(n => !n.isRead)
  );

  /**
   * 載入用戶通知
   */
  async loadNotifications(options?: {
    limit?: number;
    unreadOnly?: boolean;
  }): Promise<void> {
    this._loading.set(true);

    try {
      let query = this.supabase.client
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (options?.unreadOnly) {
        query = query.eq('is_read', false);
      }
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (error) throw error;

      this._notifications.set(data || []);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * 標記為已讀
   */
  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) throw error;

    this._notifications.update(notifications =>
      notifications.map(n =>
        n.id === notificationId
          ? { ...n, isRead: true, readAt: new Date() }
          : n
      )
    );
  }

  /**
   * 標記所有為已讀
   */
  async markAllAsRead(): Promise<void> {
    const { error } = await this.supabase.client
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('is_read', false);

    if (error) throw error;

    this._notifications.update(notifications =>
      notifications.map(n => ({ ...n, isRead: true, readAt: new Date() }))
    );
  }

  /**
   * 發送通知（供其他服務呼叫）
   */
  async sendNotification(request: CreateNotificationRequest): Promise<void> {
    const { error } = await this.supabase.client
      .from('notifications')
      .insert({
        recipient_id: request.recipientId,
        title: request.title,
        body: request.body,
        type: request.type,
        category: request.category,
        entity_type: request.entityType,
        entity_id: request.entityId,
        blueprint_id: request.blueprintId,
        expires_at: request.expiresAt?.toISOString(),
      });

    if (error) throw error;
  }
}
```

---

### 基礎設施 #5: 事件總線 (Event Bus)

#### 設計說明

實現模組間的解耦通訊，使用 RxJS Subject 作為事件總線。

#### TypeScript 介面

```typescript
// src/app/core/services/event-bus.service.ts

import { Injectable } from '@angular/core';
import { Subject, Observable, filter } from 'rxjs';

export interface AppEvent<T = unknown> {
  type: string;
  payload: T;
  timestamp: Date;
  source?: string;
}

// 事件類型定義
export const EVENT_TYPES = {
  // 任務事件
  TASK_CREATED: 'task:created',
  TASK_UPDATED: 'task:updated',
  TASK_DELETED: 'task:deleted',
  TASK_COMPLETED: 'task:completed',
  TASK_ASSIGNED: 'task:assigned',

  // 日誌事件
  DIARY_CREATED: 'diary:created',
  DIARY_UPDATED: 'diary:updated',
  DIARY_APPROVED: 'diary:approved',

  // 檔案事件
  FILE_UPLOADED: 'file:uploaded',
  FILE_DELETED: 'file:deleted',

  // 驗收事件
  INSPECTION_CREATED: 'inspection:created',
  INSPECTION_COMPLETED: 'inspection:completed',
  INSPECTION_SIGNED: 'inspection:signed',

  // 問題事件
  ISSUE_CREATED: 'issue:created',
  ISSUE_RESOLVED: 'issue:resolved',
  ISSUE_CLOSED: 'issue:closed',

  // 系統事件
  USER_LOGGED_IN: 'user:logged_in',
  USER_LOGGED_OUT: 'user:logged_out',
  BLUEPRINT_SWITCHED: 'blueprint:switched',
} as const;

export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES];

@Injectable({ providedIn: 'root' })
export class EventBusService {
  private readonly eventSubject = new Subject<AppEvent>();

  /**
   * 發布事件
   */
  emit<T>(type: EventType, payload: T, source?: string): void {
    const event: AppEvent<T> = {
      type,
      payload,
      timestamp: new Date(),
      source,
    };
    this.eventSubject.next(event);
  }

  /**
   * 訂閱特定類型的事件
   */
  on<T>(type: EventType): Observable<AppEvent<T>> {
    return this.eventSubject.asObservable().pipe(
      filter(event => event.type === type)
    ) as Observable<AppEvent<T>>;
  }

  /**
   * 訂閱多個類型的事件
   */
  onAny<T>(types: EventType[]): Observable<AppEvent<T>> {
    return this.eventSubject.asObservable().pipe(
      filter(event => types.includes(event.type as EventType))
    ) as Observable<AppEvent<T>>;
  }

  /**
   * 訂閱所有事件
   */
  onAll(): Observable<AppEvent> {
    return this.eventSubject.asObservable();
  }
}
```

#### 使用範例

```typescript
// 在服務中發布事件
@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly eventBus = inject(EventBusService);

  async createTask(request: CreateTaskRequest): Promise<Task> {
    // ... 創建任務邏輯
    const task = await this.repository.create(request);
    
    // 發布事件
    this.eventBus.emit(EVENT_TYPES.TASK_CREATED, task, 'TaskService');
    
    return task;
  }
}

// 在其他服務中訂閱事件
@Injectable({ providedIn: 'root' })
export class TimelineService {
  private readonly eventBus = inject(EventBusService);

  constructor() {
    // 訂閱任務相關事件
    this.eventBus.onAny([
      EVENT_TYPES.TASK_CREATED,
      EVENT_TYPES.TASK_UPDATED,
      EVENT_TYPES.TASK_COMPLETED,
    ]).subscribe(event => {
      this.recordActivity(event);
    });
  }
}
```

---

### 基礎設施 #6: 搜尋引擎 (Search Engine)

#### 設計說明

提供跨模組的全文檢索功能，支援任務、日誌、檔案、問題等實體的搜尋。

#### 資料表設計

```sql
-- Migration: 20250101_create_search_index.sql

-- 搜尋索引表
CREATE TABLE search_index (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    
    -- 搜尋內容
    title TEXT NOT NULL,
    content TEXT,
    tags TEXT[],
    
    -- 全文檢索向量
    search_vector TSVECTOR,
    
    -- 更新時間
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(entity_type, entity_id)
);

-- 建立 GIN 索引
CREATE INDEX idx_search_index_vector ON search_index USING GIN(search_vector);
CREATE INDEX idx_search_index_blueprint ON search_index(blueprint_id);
CREATE INDEX idx_search_index_entity_type ON search_index(entity_type);

-- 觸發器：自動更新搜尋向量
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('simple', coalesce(NEW.title, '')), 'A') ||
        setweight(to_tsvector('simple', coalesce(NEW.content, '')), 'B') ||
        setweight(to_tsvector('simple', coalesce(array_to_string(NEW.tags, ' '), '')), 'C');
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_search_vector
    BEFORE INSERT OR UPDATE ON search_index
    FOR EACH ROW
    EXECUTE FUNCTION update_search_vector();

-- 啟用 RLS
ALTER TABLE search_index ENABLE ROW LEVEL SECURITY;

CREATE POLICY "search_index_select_policy"
ON search_index FOR SELECT
USING (
    blueprint_id IN (
        SELECT blueprint_id FROM blueprint_members
        WHERE account_id = auth.uid()
    )
);
```

#### TypeScript 介面

```typescript
// src/app/core/types/search.types.ts

export type SearchableEntityType = 'task' | 'diary' | 'file' | 'issue' | 'inspection';

export interface SearchResult {
  id: string;
  entityType: SearchableEntityType;
  entityId: string;
  title: string;
  content?: string;
  tags?: string[];
  rank: number;
  highlight?: string;
}

export interface SearchQuery {
  query: string;
  blueprintId: string;
  entityTypes?: SearchableEntityType[];
  tags?: string[];
  limit?: number;
  offset?: number;
}
```

#### 服務實作

```typescript
// src/app/core/services/search.service.ts

import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { SearchResult, SearchQuery } from '../types';

@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly supabase = inject(SupabaseService);

  private readonly _results = signal<SearchResult[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly results = this._results.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  /**
   * 執行搜尋
   */
  async search(query: SearchQuery): Promise<SearchResult[]> {
    if (!query.query.trim()) {
      this._results.set([]);
      return [];
    }

    this._loading.set(true);
    this._error.set(null);

    try {
      // 使用 PostgreSQL 全文檢索
      const searchTerms = query.query.split(' ').filter(t => t.length > 0).join(' & ');
      
      let rpcQuery = this.supabase.client
        .rpc('search_entities', {
          p_blueprint_id: query.blueprintId,
          p_search_query: searchTerms,
          p_entity_types: query.entityTypes || null,
          p_limit: query.limit || 20,
          p_offset: query.offset || 0,
        });

      const { data, error } = await rpcQuery;

      if (error) throw error;

      const results = (data || []).map((item: any) => ({
        id: item.id,
        entityType: item.entity_type,
        entityId: item.entity_id,
        title: item.title,
        content: item.content,
        tags: item.tags,
        rank: item.rank,
        highlight: item.highlight,
      }));

      this._results.set(results);
      return results;
    } catch (error) {
      this._error.set((error as Error).message);
      return [];
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * 更新搜尋索引
   */
  async updateIndex(
    entityType: string,
    entityId: string,
    blueprintId: string,
    title: string,
    content?: string,
    tags?: string[]
  ): Promise<void> {
    const { error } = await this.supabase.client
      .from('search_index')
      .upsert({
        entity_type: entityType,
        entity_id: entityId,
        blueprint_id: blueprintId,
        title,
        content,
        tags,
      }, {
        onConflict: 'entity_type,entity_id',
      });

    if (error) {
      console.error('Failed to update search index:', error);
    }
  }

  /**
   * 從搜尋索引移除
   */
  async removeFromIndex(entityType: string, entityId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('search_index')
      .delete()
      .eq('entity_type', entityType)
      .eq('entity_id', entityId);

    if (error) {
      console.error('Failed to remove from search index:', error);
    }
  }

  /**
   * 清除搜尋結果
   */
  clearResults(): void {
    this._results.set([]);
  }
}
```

---

### 基礎設施 #7-12: 後續設計

由於篇幅限制，以下基礎設施將在後續版本補充完整設計：

| # | 基礎設施 | 設計狀態 | 優先級 |
|---|----------|:--------:|:------:|
| 7 | 關聯管理 (Relation Manager) | 待補充 | 中 |
| 8 | 資料隔離 (RLS) | 已有範例 | 高 |
| 9 | 生命週期 (Lifecycle) | 待補充 | 中 |
| 10 | 配置中心 (Config Center) | 待補充 | 低 |
| 11 | 元數據系統 (Metadata) | 待補充 | 低 |
| 12 | API 閘道 (API Gateway) | 待補充 | 低 |

---

## 💾 核心資料表設計

### 基礎層資料表

#### `accounts` - 帳戶表

```sql
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 帳戶類型
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('USER', 'ORGANIZATION', 'BOT')),
    
    -- 基本資訊
    email VARCHAR(255) UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    
    -- 狀態
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
    
    -- 時間戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_accounts_email ON accounts(email);
CREATE INDEX idx_accounts_type ON accounts(account_type);
```

#### `blueprint_members` - 藍圖成員表

```sql
CREATE TABLE blueprint_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    
    -- 角色
    role VARCHAR(50) NOT NULL DEFAULT 'observer',
    
    -- 邀請資訊
    invited_by UUID REFERENCES accounts(id),
    invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    joined_at TIMESTAMPTZ,
    
    -- 狀態
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
    
    UNIQUE(blueprint_id, account_id)
);

CREATE INDEX idx_blueprint_members_blueprint ON blueprint_members(blueprint_id);
CREATE INDEX idx_blueprint_members_account ON blueprint_members(account_id);
```

### 業務層資料表

（詳細設計已在研究報告中提供，此處列出清單）

| 資料表 | 所屬模組 | SETC 參考 |
|--------|----------|-----------|
| `tasks` | 任務系統 | SETC-02 |
| `task_attachments` | 任務系統 | SETC-02 |
| `diaries` | 日誌系統 | SETC-04 |
| `diary_photos` | 日誌系統 | SETC-04 |
| `files` | 檔案系統 | SETC-03 |
| `file_versions` | 檔案系統 | SETC-03 |
| `checklists` | 品質驗收 | SETC-06 |
| `checklist_items` | 品質驗收 | SETC-06 |
| `checklist_results` | 品質驗收 | SETC-06 |
| `issues` | 問題追蹤 | SETC-08 |
| `progress_milestones` | 進度追蹤 | SETC-05 |

---

## 📁 檔案結構規範

### Feature 垂直切片結構

```
src/app/features/{feature-name}/
├── {feature-name}.routes.ts         # 路由配置
├── shell/                           # 邏輯容器層
│   └── {feature}-shell/
│       ├── {feature}-shell.component.ts
│       └── {feature}-shell.component.html
├── data-access/                     # 資料存取層
│   ├── stores/                      # Signals Store (Facade)
│   │   └── {feature}.store.ts
│   ├── services/                    # 業務服務
│   │   └── {feature}.service.ts
│   └── repositories/                # Supabase Repository
│       └── {feature}.repository.ts
├── domain/                          # 領域層
│   ├── enums/                       # 枚舉定義
│   ├── interfaces/                  # 介面定義
│   ├── models/                      # 領域模型
│   └── types/                       # 類型定義
│       └── {feature}.types.ts
├── ui/                              # 展示層
│   └── {sub-feature}/
│       ├── {component}/
│       │   ├── {component}.component.ts
│       │   ├── {component}.component.html
│       │   └── {component}.component.less
│       └── index.ts
└── utils/                           # 工具函數
```

### 命名規範

| 類型 | 命名規則 | 範例 |
|------|----------|------|
| 資料夾 | kebab-case | `task-list`, `diary-form` |
| 元件 | PascalCase | `TaskListComponent` |
| 服務 | PascalCase + Service | `TaskService` |
| Store | PascalCase + Store | `TaskStore` |
| Repository | PascalCase + Repository | `TaskRepository` |
| 類型檔案 | kebab-case.types.ts | `task.types.ts` |
| 測試檔案 | *.spec.ts | `task.service.spec.ts` |

---

## 📊 效能指標規範

### 前端效能指標

| 指標 | 目標值 | 說明 |
|------|--------|------|
| LCP (Largest Contentful Paint) | < 2.5s | 最大內容繪製 |
| FID (First Input Delay) | < 100ms | 首次輸入延遲 |
| CLS (Cumulative Layout Shift) | < 0.1 | 累積布局偏移 |
| TTFB (Time to First Byte) | < 600ms | 首字節時間 |
| 任務樹渲染 (1000 節點) | < 500ms | 大量資料渲染 |

### API 效能指標

| 指標 | 目標值 | 說明 |
|------|--------|------|
| API P50 | < 200ms | 50% 請求延遲 |
| API P95 | < 500ms | 95% 請求延遲 |
| API P99 | < 1s | 99% 請求延遲 |
| 資料庫查詢 P95 | < 100ms | 資料庫查詢延遲 |

### 測試覆蓋率目標

| 層級 | 目標 | 重點 |
|------|------|------|
| Store | 100% | 狀態變更、computed signals |
| Service | 80%+ | API 呼叫、錯誤處理 |
| Repository | 80%+ | CRUD 操作 |
| Component | 60%+ | 關鍵交互、表單提交 |
| Utils | 100% | 純函數、邊界條件 |

---

## 🔗 SETC 依賴關係

```
                        ┌────────────────────────────────────────┐
                        │         SETC-00: 基礎架構               │
                        │   (12 項容器層基礎設施 + 資料表設計)     │
                        └────────────────────┬───────────────────┘
                                             │
                        ┌────────────────────▼───────────────────┐
                        │      SETC-01: 帳戶藍圖增強              │
                        │        (帳戶體系 + 藍圖系統)            │
                        └────────────────────┬───────────────────┘
                                             │
                        ┌────────────────────▼───────────────────┐
                        │      SETC-02: 任務系統生產級            │
                        │    (核心任務 CRUD + 樹狀 + Gantt)       │
                        └────────────────────┬───────────────────┘
                                             │
         ┌───────────────────────────────────┼───────────────────────────────────┐
         │                                   │                                   │
┌────────▼────────┐               ┌─────────▼─────────┐               ┌─────────▼─────────┐
│   SETC-03       │               │    SETC-04        │               │    SETC-05        │
│   檔案系統       │               │    日誌系統        │               │    進度儀表板      │
└────────┬────────┘               └─────────┬─────────┘               └─────────┬─────────┘
         │                                   │                                   │
         └───────────────────────────────────┼───────────────────────────────────┘
                                             │
                        ┌────────────────────▼───────────────────┐
                        │      SETC-06: 品質驗收                  │
                        └────────────────────┬───────────────────┘
                                             │
                        ┌────────────────────▼───────────────────┐
                        │      SETC-07: 協作報表上線              │
                        └────────────────────┬───────────────────┘
                                             │
         ┌───────────────────────────────────┼───────────────────────────────────┐
         │                                   │                                   │
┌────────▼────────┐               ┌─────────▼─────────┐               ┌─────────▼─────────┐
│   SETC-08       │               │    SETC-09        │               │    SETC-10        │
│   問題追蹤       │               │    離線同步        │               │    系統管理        │
└─────────────────┘               └───────────────────┘               └───────────────────┘
```

---

## ✅ 完成檢查清單

- [ ] 12 項容器層基礎設施設計完成
- [ ] 核心資料表 SQL 設計完成
- [ ] RLS 政策設計完成
- [ ] TypeScript 類型定義完成
- [ ] 檔案結構規範定義完成
- [ ] 效能指標規範定義完成
- [ ] SETC 依賴關係確認完成

---

**最後更新**: 2025-11-27
**文件版本**: 1.0.0
