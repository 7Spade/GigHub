---
title: "SETC-02: 任務系統生產級（增強版）"
status: draft
created: 2025-11-27
updated: 2025-11-27
owners: []
progress: 0
due: null
priority: critical
estimated_weeks: 4
---

# SETC-02: 任務系統生產級（增強版）

> **Phase 1: Task System Production Level - Enhanced**

本文件定義任務系統的完整技術規格，包含資料模型、API 設計、前端架構、測試策略等，確保可直接實施。

---

## 📋 文件資訊

| 屬性 | 值 |
|------|-----|
| **文件編號** | SETC-02 |
| **類型** | 業務模組（Business） |
| **架構層級** | 業務層 (Business Layer) |
| **前置條件** | SETC-00（基礎架構）、SETC-01（帳戶藍圖）|
| **PRD 對應** | GH-001 ~ GH-010 |
| **預計週數** | 4 週 |
| **總任務數** | 16 |

---

## 🏗️ 技術架構

### 架構層級定位

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        業務層 (Business Layer)                          │
│                                                                          │
│   任務系統 (Task System) - 本 SETC 範圍                                  │
│                                                                          │
│   ├── 核心 CRUD 操作                                                     │
│   ├── 無限深度樹狀結構                                                   │
│   ├── 拖放排序                                                           │
│   ├── 批量操作                                                           │
│   ├── Gantt 視圖                                                         │
│   └── 任務模板                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### 容器層基礎設施使用檢查表

| # | 基礎設施 | 使用狀況 | 說明 |
|---|----------|:--------:|------|
| 1 | 上下文注入 | ✅ 使用 | 從 BlueprintShell 注入 blueprintId、permissions |
| 2 | 權限系統 | ✅ 使用 | task:create, task:update, task:delete 等權限檢查 |
| 3 | 時間軸服務 | ✅ 使用 | 記錄任務創建、更新、完成等活動 |
| 4 | 通知中心 | ✅ 使用 | 任務指派、到期提醒通知 |
| 5 | 事件總線 | ✅ 使用 | 發布 TASK_CREATED, TASK_UPDATED 等事件 |
| 6 | 搜尋引擎 | ✅ 使用 | 任務標題、描述全文檢索 |
| 7 | 關聯管理 | ✅ 使用 | 任務與日誌、檔案、驗收的關聯 |
| 8 | 資料隔離 | ✅ 使用 | RLS 限制只能存取所屬藍圖的任務 |
| 9 | 生命週期 | ✅ 使用 | 任務狀態：pending → in_progress → completed |
| 10 | 配置中心 | ⬜ 未使用 | - |
| 11 | 元數據系統 | ⬜ 未使用 | - |
| 12 | API 閘道 | ⬜ 未使用 | - |

---

## 💾 資料模型設計

### `tasks` 資料表

#### Migration SQL

```sql
-- Migration: 20250101_create_tasks_table.sql

CREATE TABLE tasks (
    -- 主鍵與外鍵
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
    
    -- 樹狀結構
    parent_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    path LTREE NOT NULL, -- PostgreSQL ltree extension for hierarchical data
    depth INTEGER NOT NULL DEFAULT 0,
    position INTEGER NOT NULL DEFAULT 0,
    
    -- 基本資訊
    title VARCHAR(500) NOT NULL,
    description TEXT,
    
    -- 狀態與進度
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    
    -- 時間管理
    start_date DATE,
    due_date DATE,
    completed_at TIMESTAMPTZ,
    
    -- 工時管理
    estimated_hours DECIMAL(10, 2),
    actual_hours DECIMAL(10, 2) DEFAULT 0,
    
    -- 指派與標籤
    assignee_ids UUID[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    area VARCHAR(100),
    
    -- 審計欄位
    created_by UUID NOT NULL REFERENCES accounts(id),
    updated_by UUID REFERENCES accounts(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    
    -- 約束
    CONSTRAINT valid_status CHECK (status IN ('pending', 'in_progress', 'in_review', 'completed', 'cancelled', 'blocked')),
    CONSTRAINT valid_priority CHECK (priority IN ('lowest', 'low', 'medium', 'high', 'highest')),
    CONSTRAINT valid_dates CHECK (due_date IS NULL OR start_date IS NULL OR due_date >= start_date)
);

-- 啟用 ltree 擴展
CREATE EXTENSION IF NOT EXISTS ltree;

-- 索引
CREATE INDEX idx_tasks_workspace ON tasks(workspace_id);
CREATE INDEX idx_tasks_blueprint ON tasks(blueprint_id);
CREATE INDEX idx_tasks_parent ON tasks(parent_id);
CREATE INDEX idx_tasks_path ON tasks USING GIST(path);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_assignees ON tasks USING GIN(assignee_ids);
CREATE INDEX idx_tasks_tags ON tasks USING GIN(tags);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);

-- 軟刪除過濾索引
CREATE INDEX idx_tasks_active ON tasks(workspace_id, deleted_at) WHERE deleted_at IS NULL;
```

#### RLS 政策

```sql
-- 啟用 RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Helper function: 檢查是否為藍圖成員
CREATE OR REPLACE FUNCTION is_blueprint_member(p_blueprint_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM blueprint_members
        WHERE blueprint_id = p_blueprint_id
        AND account_id = auth.uid()
        AND status = 'active'
    );
END;
$$;

-- SELECT 政策：藍圖成員可查看
CREATE POLICY "tasks_select_policy"
ON tasks FOR SELECT
USING (is_blueprint_member(blueprint_id) AND deleted_at IS NULL);

-- INSERT 政策：有 task:create 權限的成員可創建
CREATE POLICY "tasks_insert_policy"
ON tasks FOR INSERT
WITH CHECK (
    is_blueprint_member(blueprint_id) AND
    has_blueprint_permission(blueprint_id, 'task:create')
);

-- UPDATE 政策：有 task:update 權限的成員可更新
CREATE POLICY "tasks_update_policy"
ON tasks FOR UPDATE
USING (
    is_blueprint_member(blueprint_id) AND
    has_blueprint_permission(blueprint_id, 'task:update')
);

-- DELETE 政策：有 task:delete 權限的成員可刪除
CREATE POLICY "tasks_delete_policy"
ON tasks FOR DELETE
USING (
    is_blueprint_member(blueprint_id) AND
    has_blueprint_permission(blueprint_id, 'task:delete')
);
```

### `task_attachments` 資料表

```sql
-- Migration: 20250101_create_task_attachments_table.sql

CREATE TABLE task_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    
    -- 附件資訊
    display_order INTEGER DEFAULT 0,
    description VARCHAR(500),
    
    -- 審計欄位
    uploaded_by UUID NOT NULL REFERENCES accounts(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(task_id, file_id)
);

CREATE INDEX idx_task_attachments_task ON task_attachments(task_id);
CREATE INDEX idx_task_attachments_file ON task_attachments(file_id);

-- 啟用 RLS
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_attachments_policy"
ON task_attachments
USING (
    task_id IN (
        SELECT id FROM tasks
        WHERE is_blueprint_member(blueprint_id) AND deleted_at IS NULL
    )
);
```

---

## 📦 TypeScript 類型定義

### Domain Types

```typescript
// src/app/features/blueprint/domain/types/task.types.ts

// ============================================
// 枚舉與常數
// ============================================

export const TASK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  IN_REVIEW: 'in_review',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  BLOCKED: 'blocked',
} as const;

export type TaskStatus = typeof TASK_STATUS[keyof typeof TASK_STATUS];

export const TASK_PRIORITY = {
  LOWEST: 'lowest',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  HIGHEST: 'highest',
} as const;

export type TaskPriority = typeof TASK_PRIORITY[keyof typeof TASK_PRIORITY];

// ============================================
// 核心實體類型
// ============================================

/**
 * 任務實體（資料庫對應）
 */
export interface Task {
  id: string;
  workspaceId: string;
  blueprintId: string;
  
  // 樹狀結構
  parentId: string | null;
  path: string;
  depth: number;
  position: number;
  
  // 基本資訊
  title: string;
  description: string | null;
  
  // 狀態與進度
  status: TaskStatus;
  priority: TaskPriority;
  progress: number;
  
  // 時間管理
  startDate: string | null;  // ISO date string
  dueDate: string | null;    // ISO date string
  completedAt: string | null; // ISO datetime string
  
  // 工時管理
  estimatedHours: number | null;
  actualHours: number;
  
  // 指派與標籤
  assigneeIds: string[];
  tags: string[];
  area: string | null;
  
  // 審計欄位
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/**
 * 任務樹節點（含子任務）
 */
export interface TaskTreeNode extends Task {
  children: TaskTreeNode[];
  isExpanded: boolean;
  isLeaf: boolean;
  level: number;
}

/**
 * 任務附件
 */
export interface TaskAttachment {
  id: string;
  taskId: string;
  fileId: string;
  displayOrder: number;
  description: string | null;
  uploadedBy: string;
  createdAt: string;
  
  // 關聯
  file?: {
    id: string;
    originalName: string;
    mimeType: string;
    fileSize: number;
    url: string;
  };
}

// ============================================
// DTO 類型 (Data Transfer Objects)
// ============================================

/**
 * 創建任務請求
 */
export interface CreateTaskRequest {
  workspaceId: string;
  parentId?: string | null;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
  assigneeIds?: string[];
  tags?: string[];
  area?: string;
}

/**
 * 更新任務請求
 */
export interface UpdateTaskRequest {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  progress?: number;
  startDate?: string | null;
  dueDate?: string | null;
  estimatedHours?: number | null;
  actualHours?: number;
  assigneeIds?: string[];
  tags?: string[];
  area?: string | null;
}

/**
 * 移動任務請求（拖放）
 */
export interface MoveTaskRequest {
  taskId: string;
  newParentId: string | null;
  newPosition: number;
}

/**
 * 批量操作請求
 */
export interface BatchTaskRequest {
  taskIds: string[];
  operation: 'complete' | 'cancel' | 'delete' | 'assign';
  payload?: {
    assigneeIds?: string[];
  };
}

// ============================================
// 查詢參數類型
// ============================================

/**
 * 任務列表查詢參數
 */
export interface TaskQueryParams {
  workspaceId: string;
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority | TaskPriority[];
  assigneeId?: string;
  tags?: string[];
  area?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  search?: string;
  parentId?: string | null;
  includeChildren?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: 'title' | 'dueDate' | 'priority' | 'status' | 'createdAt' | 'position';
  sortOrder?: 'asc' | 'desc';
}

/**
 * 任務統計資料
 */
export interface TaskStatistics {
  total: number;
  byStatus: Record<TaskStatus, number>;
  byPriority: Record<TaskPriority, number>;
  overdue: number;
  completedThisWeek: number;
  averageProgress: number;
}

// ============================================
// 視圖模式
// ============================================

export type TaskViewMode = 'tree' | 'table' | 'kanban' | 'gantt';

/**
 * Gantt 視圖資料
 */
export interface GanttTask {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  dependencies: string[];
  assignees: { id: string; name: string; avatar?: string }[];
  color?: string;
  isMilestone: boolean;
}
```

---

## 🔧 Repository 層設計

### TaskRepository

```typescript
// src/app/features/blueprint/data-access/repositories/task.repository.ts

import { Injectable, inject } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { SupabaseService } from '@core';
import {
  Task,
  TaskQueryParams,
  CreateTaskRequest,
  UpdateTaskRequest,
  MoveTaskRequest,
} from '../../domain';

/**
 * 任務 Repository
 * 
 * 負責任務資料的 CRUD 操作，封裝所有 Supabase 存取邏輯
 */
@Injectable({ providedIn: 'root' })
export class TaskRepository {
  private readonly supabase = inject(SupabaseService);
  private readonly TABLE = 'tasks';

  /**
   * 根據工作區載入所有任務
   */
  findByWorkspace(workspaceId: string): Observable<Task[]> {
    return from(
      this.supabase.client
        .from(this.TABLE)
        .select('*')
        .eq('workspace_id', workspaceId)
        .is('deleted_at', null)
        .order('path', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.mapToCamelCase(data || []);
      })
    );
  }

  /**
   * 根據父節點載入子任務
   */
  findByParent(parentId: string | null, workspaceId: string): Observable<Task[]> {
    let query = this.supabase.client
      .from(this.TABLE)
      .select('*')
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .order('position', { ascending: true });

    if (parentId === null) {
      query = query.is('parent_id', null);
    } else {
      query = query.eq('parent_id', parentId);
    }

    return from(query).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.mapToCamelCase(data || []);
      })
    );
  }

  /**
   * 根據 ID 取得單一任務
   */
  findById(id: string): Observable<Task | null> {
    return from(
      this.supabase.client
        .from(this.TABLE)
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error && error.code !== 'PGRST116') throw error;
        return data ? this.mapToCamelCaseSingle(data) : null;
      })
    );
  }

  /**
   * 建立任務
   */
  create(request: CreateTaskRequest, userId: string): Observable<Task> {
    return from(
      this.supabase.client
        .from(this.TABLE)
        .insert({
          workspace_id: request.workspaceId,
          blueprint_id: this.getBlueprintIdFromWorkspace(request.workspaceId),
          parent_id: request.parentId || null,
          title: request.title,
          description: request.description || null,
          status: request.status || 'pending',
          priority: request.priority || 'medium',
          start_date: request.startDate || null,
          due_date: request.dueDate || null,
          estimated_hours: request.estimatedHours || null,
          assignee_ids: request.assigneeIds || [],
          tags: request.tags || [],
          area: request.area || null,
          created_by: userId,
          // path, depth, position 將由 trigger 計算
        })
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.mapToCamelCaseSingle(data);
      })
    );
  }

  /**
   * 更新任務
   */
  update(id: string, request: UpdateTaskRequest, userId: string): Observable<Task> {
    const updateData: Record<string, unknown> = {
      updated_by: userId,
      updated_at: new Date().toISOString(),
    };

    if (request.title !== undefined) updateData.title = request.title;
    if (request.description !== undefined) updateData.description = request.description;
    if (request.status !== undefined) updateData.status = request.status;
    if (request.priority !== undefined) updateData.priority = request.priority;
    if (request.progress !== undefined) updateData.progress = request.progress;
    if (request.startDate !== undefined) updateData.start_date = request.startDate;
    if (request.dueDate !== undefined) updateData.due_date = request.dueDate;
    if (request.estimatedHours !== undefined) updateData.estimated_hours = request.estimatedHours;
    if (request.actualHours !== undefined) updateData.actual_hours = request.actualHours;
    if (request.assigneeIds !== undefined) updateData.assignee_ids = request.assigneeIds;
    if (request.tags !== undefined) updateData.tags = request.tags;
    if (request.area !== undefined) updateData.area = request.area;

    // 處理任務完成
    if (request.status === 'completed') {
      updateData.completed_at = new Date().toISOString();
      updateData.progress = 100;
    }

    return from(
      this.supabase.client
        .from(this.TABLE)
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.mapToCamelCaseSingle(data);
      })
    );
  }

  /**
   * 軟刪除任務
   */
  softDelete(id: string): Observable<void> {
    return from(
      this.supabase.client
        .from(this.TABLE)
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      })
    );
  }

  /**
   * 移動任務（拖放排序）
   */
  move(request: MoveTaskRequest): Observable<void> {
    return from(
      this.supabase.client.rpc('move_task', {
        p_task_id: request.taskId,
        p_new_parent_id: request.newParentId,
        p_new_position: request.newPosition,
      })
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      })
    );
  }

  /**
   * 批量更新狀態
   */
  batchUpdateStatus(taskIds: string[], status: string, userId: string): Observable<void> {
    const updateData: Record<string, unknown> = {
      status,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    };

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
      updateData.progress = 100;
    }

    return from(
      this.supabase.client
        .from(this.TABLE)
        .update(updateData)
        .in('id', taskIds)
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      })
    );
  }

  /**
   * 批量指派
   */
  batchAssign(taskIds: string[], assigneeIds: string[], userId: string): Observable<void> {
    return from(
      this.supabase.client
        .from(this.TABLE)
        .update({
          assignee_ids: assigneeIds,
          updated_by: userId,
          updated_at: new Date().toISOString(),
        })
        .in('id', taskIds)
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      })
    );
  }

  /**
   * 取得任務統計
   */
  getStatistics(workspaceId: string): Observable<Record<string, number>> {
    return from(
      this.supabase.client.rpc('get_task_statistics', {
        p_workspace_id: workspaceId,
      })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data || {};
      })
    );
  }

  // ========================================
  // Private Helper Methods
  // ========================================

  private mapToCamelCase(data: any[]): Task[] {
    return data.map(item => this.mapToCamelCaseSingle(item));
  }

  private mapToCamelCaseSingle(item: any): Task {
    return {
      id: item.id,
      workspaceId: item.workspace_id,
      blueprintId: item.blueprint_id,
      parentId: item.parent_id,
      path: item.path,
      depth: item.depth,
      position: item.position,
      title: item.title,
      description: item.description,
      status: item.status,
      priority: item.priority,
      progress: item.progress,
      startDate: item.start_date,
      dueDate: item.due_date,
      completedAt: item.completed_at,
      estimatedHours: item.estimated_hours,
      actualHours: item.actual_hours,
      assigneeIds: item.assignee_ids,
      tags: item.tags,
      area: item.area,
      createdBy: item.created_by,
      updatedBy: item.updated_by,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      deletedAt: item.deleted_at,
    };
  }

  private getBlueprintIdFromWorkspace(workspaceId: string): string {
    // TODO: 實作從 workspace 取得 blueprint_id
    // 這裡需要透過 WorkspaceContextFacade 或查詢取得
    throw new Error('Not implemented: getBlueprintIdFromWorkspace');
  }
}
```

---

## 📊 Store 層設計

### TaskStore (Facade)

```typescript
// src/app/features/blueprint/data-access/stores/task.store.ts

import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { WorkspaceContextFacade, EventBusService, EVENT_TYPES, TimelineService } from '@core';
import {
  Task,
  TaskTreeNode,
  TaskStatistics,
  TaskViewMode,
  CreateTaskRequest,
  UpdateTaskRequest,
  MoveTaskRequest,
  BatchTaskRequest,
  TASK_STATUS,
} from '../../domain';
import { TaskRepository } from '../repositories/task.repository';

/**
 * 任務 Store (Facade)
 * 
 * 提供任務模組的統一 API，管理狀態、處理業務邏輯、發布事件
 */
@Injectable({ providedIn: 'root' })
export class TaskStore {
  private readonly repository = inject(TaskRepository);
  private readonly contextFacade = inject(WorkspaceContextFacade);
  private readonly eventBus = inject(EventBusService);
  private readonly timeline = inject(TimelineService);

  // ========================================
  // Private State
  // ========================================
  
  private readonly _tasks = signal<Task[]>([]);
  private readonly _selectedTaskId = signal<string | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _viewMode = signal<TaskViewMode>('tree');
  private readonly _expandedIds = signal<Set<string>>(new Set());

  // ========================================
  // Public Readonly State
  // ========================================

  readonly tasks = this._tasks.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly viewMode = this._viewMode.asReadonly();

  // ========================================
  // Computed Properties
  // ========================================

  /**
   * 選中的任務
   */
  readonly selectedTask = computed(() => {
    const id = this._selectedTaskId();
    return id ? this._tasks().find(t => t.id === id) ?? null : null;
  });

  /**
   * 任務樹結構
   */
  readonly taskTree = computed(() => {
    const tasks = this._tasks();
    const expandedIds = this._expandedIds();
    return this.buildTaskTree(tasks, null, expandedIds);
  });

  /**
   * 根任務（L0）
   */
  readonly rootTasks = computed(() =>
    this._tasks().filter(t => t.parentId === null)
  );

  /**
   * 待處理任務
   */
  readonly pendingTasks = computed(() =>
    this._tasks().filter(t => t.status === TASK_STATUS.PENDING)
  );

  /**
   * 進行中任務
   */
  readonly inProgressTasks = computed(() =>
    this._tasks().filter(t => t.status === TASK_STATUS.IN_PROGRESS)
  );

  /**
   * 已完成任務
   */
  readonly completedTasks = computed(() =>
    this._tasks().filter(t => t.status === TASK_STATUS.COMPLETED)
  );

  /**
   * 逾期任務
   */
  readonly overdueTasks = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this._tasks().filter(t =>
      t.dueDate &&
      t.dueDate < today &&
      t.status !== TASK_STATUS.COMPLETED &&
      t.status !== TASK_STATUS.CANCELLED
    );
  });

  /**
   * 任務統計
   */
  readonly statistics = computed<TaskStatistics>(() => {
    const tasks = this._tasks();
    const today = new Date().toISOString().split('T')[0];
    const weekStart = this.getWeekStart();

    return {
      total: tasks.length,
      byStatus: {
        pending: tasks.filter(t => t.status === TASK_STATUS.PENDING).length,
        in_progress: tasks.filter(t => t.status === TASK_STATUS.IN_PROGRESS).length,
        in_review: tasks.filter(t => t.status === TASK_STATUS.IN_REVIEW).length,
        completed: tasks.filter(t => t.status === TASK_STATUS.COMPLETED).length,
        cancelled: tasks.filter(t => t.status === TASK_STATUS.CANCELLED).length,
        blocked: tasks.filter(t => t.status === TASK_STATUS.BLOCKED).length,
      },
      byPriority: {
        lowest: tasks.filter(t => t.priority === 'lowest').length,
        low: tasks.filter(t => t.priority === 'low').length,
        medium: tasks.filter(t => t.priority === 'medium').length,
        high: tasks.filter(t => t.priority === 'high').length,
        highest: tasks.filter(t => t.priority === 'highest').length,
      },
      overdue: tasks.filter(t =>
        t.dueDate && t.dueDate < today &&
        t.status !== TASK_STATUS.COMPLETED &&
        t.status !== TASK_STATUS.CANCELLED
      ).length,
      completedThisWeek: tasks.filter(t =>
        t.status === TASK_STATUS.COMPLETED &&
        t.completedAt &&
        t.completedAt >= weekStart
      ).length,
      averageProgress: tasks.length > 0
        ? Math.round(tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length)
        : 0,
    };
  });

  // ========================================
  // Public Methods - 查詢
  // ========================================

  /**
   * 載入工作區任務
   */
  async loadTasks(workspaceId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const tasks = await firstValueFrom(
        this.repository.findByWorkspace(workspaceId)
      );
      this._tasks.set(tasks);
    } catch (error) {
      this._error.set((error as Error).message);
      console.error('[TaskStore] loadTasks error:', error);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * 取得單一任務
   */
  async getTask(id: string): Promise<Task | null> {
    const existing = this._tasks().find(t => t.id === id);
    if (existing) return existing;

    try {
      return await firstValueFrom(this.repository.findById(id));
    } catch (error) {
      console.error('[TaskStore] getTask error:', error);
      return null;
    }
  }

  // ========================================
  // Public Methods - 命令
  // ========================================

  /**
   * 建立任務
   */
  async createTask(request: CreateTaskRequest): Promise<Task | null> {
    const userId = this.contextFacade.currentAccountId();
    if (!userId) {
      this._error.set('用戶未登入');
      return null;
    }

    this._loading.set(true);
    this._error.set(null);

    try {
      const task = await firstValueFrom(
        this.repository.create(request, userId)
      );

      // 更新本地狀態（樂觀更新）
      this._tasks.update(tasks => [...tasks, task]);

      // 發布事件
      this.eventBus.emit(EVENT_TYPES.TASK_CREATED, task, 'TaskStore');

      // 記錄活動
      await this.timeline.recordActivity({
        blueprintId: task.blueprintId,
        entityType: 'task',
        entityId: task.id,
        action: 'created',
        actorId: userId,
        metadata: { title: task.title },
      });

      return task;
    } catch (error) {
      this._error.set((error as Error).message);
      console.error('[TaskStore] createTask error:', error);
      return null;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * 更新任務
   */
  async updateTask(id: string, request: UpdateTaskRequest): Promise<Task | null> {
    const userId = this.contextFacade.currentAccountId();
    if (!userId) {
      this._error.set('用戶未登入');
      return null;
    }

    // 樂觀更新：先更新本地狀態
    const oldTask = this._tasks().find(t => t.id === id);
    if (!oldTask) {
      this._error.set('任務不存在');
      return null;
    }

    const optimisticTask = { ...oldTask, ...request, updatedAt: new Date().toISOString() };
    this._tasks.update(tasks =>
      tasks.map(t => t.id === id ? optimisticTask : t)
    );

    try {
      const task = await firstValueFrom(
        this.repository.update(id, request, userId)
      );

      // 用實際資料更新
      this._tasks.update(tasks =>
        tasks.map(t => t.id === id ? task : t)
      );

      // 發布事件
      this.eventBus.emit(EVENT_TYPES.TASK_UPDATED, task, 'TaskStore');

      // 記錄活動
      const changes: Record<string, { old: unknown; new: unknown }> = {};
      for (const [key, value] of Object.entries(request)) {
        if (value !== undefined && (oldTask as any)[key] !== value) {
          changes[key] = { old: (oldTask as any)[key], new: value };
        }
      }

      await this.timeline.recordActivity({
        blueprintId: task.blueprintId,
        entityType: 'task',
        entityId: task.id,
        action: 'updated',
        actorId: userId,
        changes,
      });

      return task;
    } catch (error) {
      // 回滾樂觀更新
      this._tasks.update(tasks =>
        tasks.map(t => t.id === id ? oldTask : t)
      );
      this._error.set((error as Error).message);
      console.error('[TaskStore] updateTask error:', error);
      return null;
    }
  }

  /**
   * 刪除任務
   */
  async deleteTask(id: string): Promise<boolean> {
    const task = this._tasks().find(t => t.id === id);
    if (!task) return false;

    // 樂觀更新
    this._tasks.update(tasks => tasks.filter(t => t.id !== id));

    try {
      await firstValueFrom(this.repository.softDelete(id));

      // 發布事件
      this.eventBus.emit(EVENT_TYPES.TASK_DELETED, { id }, 'TaskStore');

      return true;
    } catch (error) {
      // 回滾
      this._tasks.update(tasks => [...tasks, task]);
      this._error.set((error as Error).message);
      console.error('[TaskStore] deleteTask error:', error);
      return false;
    }
  }

  /**
   * 完成任務
   */
  async completeTask(id: string): Promise<Task | null> {
    const task = await this.updateTask(id, {
      status: TASK_STATUS.COMPLETED,
      progress: 100,
    });

    if (task) {
      this.eventBus.emit(EVENT_TYPES.TASK_COMPLETED, task, 'TaskStore');
    }

    return task;
  }

  /**
   * 移動任務（拖放）
   */
  async moveTask(request: MoveTaskRequest): Promise<boolean> {
    try {
      await firstValueFrom(this.repository.move(request));

      // 重新載入任務（因為 path 和 position 都會變）
      const workspaceId = this._tasks().find(t => t.id === request.taskId)?.workspaceId;
      if (workspaceId) {
        await this.loadTasks(workspaceId);
      }

      return true;
    } catch (error) {
      this._error.set((error as Error).message);
      console.error('[TaskStore] moveTask error:', error);
      return false;
    }
  }

  /**
   * 批量操作
   */
  async batchOperation(request: BatchTaskRequest): Promise<boolean> {
    const userId = this.contextFacade.currentAccountId();
    if (!userId) {
      this._error.set('用戶未登入');
      return false;
    }

    try {
      switch (request.operation) {
        case 'complete':
          await firstValueFrom(
            this.repository.batchUpdateStatus(request.taskIds, TASK_STATUS.COMPLETED, userId)
          );
          break;
        case 'cancel':
          await firstValueFrom(
            this.repository.batchUpdateStatus(request.taskIds, TASK_STATUS.CANCELLED, userId)
          );
          break;
        case 'assign':
          if (request.payload?.assigneeIds) {
            await firstValueFrom(
              this.repository.batchAssign(request.taskIds, request.payload.assigneeIds, userId)
            );
          }
          break;
        case 'delete':
          for (const taskId of request.taskIds) {
            await firstValueFrom(this.repository.softDelete(taskId));
          }
          break;
      }

      // 重新載入
      const workspaceId = this._tasks()[0]?.workspaceId;
      if (workspaceId) {
        await this.loadTasks(workspaceId);
      }

      return true;
    } catch (error) {
      this._error.set((error as Error).message);
      console.error('[TaskStore] batchOperation error:', error);
      return false;
    }
  }

  // ========================================
  // Public Methods - UI 狀態
  // ========================================

  /**
   * 選擇任務
   */
  selectTask(id: string | null): void {
    this._selectedTaskId.set(id);
  }

  /**
   * 設定視圖模式
   */
  setViewMode(mode: TaskViewMode): void {
    this._viewMode.set(mode);
  }

  /**
   * 展開/收起任務節點
   */
  toggleExpand(taskId: string): void {
    this._expandedIds.update(ids => {
      const newIds = new Set(ids);
      if (newIds.has(taskId)) {
        newIds.delete(taskId);
      } else {
        newIds.add(taskId);
      }
      return newIds;
    });
  }

  /**
   * 展開所有
   */
  expandAll(): void {
    const allIds = this._tasks().map(t => t.id);
    this._expandedIds.set(new Set(allIds));
  }

  /**
   * 收起所有
   */
  collapseAll(): void {
    this._expandedIds.set(new Set());
  }

  /**
   * 清除錯誤
   */
  clearError(): void {
    this._error.set(null);
  }

  /**
   * 重置狀態
   */
  reset(): void {
    this._tasks.set([]);
    this._selectedTaskId.set(null);
    this._loading.set(false);
    this._error.set(null);
    this._expandedIds.set(new Set());
  }

  // ========================================
  // Private Helper Methods
  // ========================================

  /**
   * 建構任務樹
   */
  private buildTaskTree(
    tasks: Task[],
    parentId: string | null,
    expandedIds: Set<string>
  ): TaskTreeNode[] {
    return tasks
      .filter(t => t.parentId === parentId)
      .sort((a, b) => a.position - b.position)
      .map(task => {
        const children = this.buildTaskTree(tasks, task.id, expandedIds);
        return {
          ...task,
          children,
          isExpanded: expandedIds.has(task.id),
          isLeaf: children.length === 0,
          level: task.depth,
        };
      });
  }

  /**
   * 取得本週開始日期
   */
  private getWeekStart(): string {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(now.setDate(diff));
    return weekStart.toISOString();
  }
}
```

---

## 📊 效能指標

### 目標指標

| 指標 | 目標值 | 測量方式 |
|------|--------|----------|
| 任務列表載入 (100 項) | < 300ms | Performance API |
| 任務樹渲染 (1000 節點) | < 500ms | Component render time |
| 拖放排序響應 | < 100ms | User perceived latency |
| 任務創建響應 | < 500ms | API response time |
| 批量操作 (50 項) | < 1s | API response time |

### 優化策略

1. **虛擬捲動**：大量任務使用 CDK Virtual Scroll
2. **樂觀更新**：先更新 UI，後同步後端
3. **防抖搜尋**：搜尋輸入防抖 300ms
4. **分頁載入**：表格視圖支援分頁
5. **懶載入子節點**：樹狀視圖按需載入

---

## 🧪 測試策略

### 單元測試

```typescript
// src/app/features/blueprint/data-access/stores/task.store.spec.ts

import { TestBed } from '@angular/core/testing';
import { TaskStore } from './task.store';
import { TaskRepository } from '../repositories/task.repository';
import { of, throwError } from 'rxjs';

describe('TaskStore', () => {
  let store: TaskStore;
  let mockRepository: jasmine.SpyObj<TaskRepository>;

  beforeEach(() => {
    mockRepository = jasmine.createSpyObj('TaskRepository', [
      'findByWorkspace',
      'findById',
      'create',
      'update',
      'softDelete',
    ]);

    TestBed.configureTestingModule({
      providers: [
        TaskStore,
        { provide: TaskRepository, useValue: mockRepository },
      ],
    });

    store = TestBed.inject(TaskStore);
  });

  describe('loadTasks', () => {
    it('loadTasks_whenSuccess_shouldUpdateState', async () => {
      // Arrange
      const mockTasks = [
        { id: '1', title: 'Task 1', status: 'pending' },
        { id: '2', title: 'Task 2', status: 'completed' },
      ];
      mockRepository.findByWorkspace.and.returnValue(of(mockTasks));

      // Act
      await store.loadTasks('workspace-1');

      // Assert
      expect(store.tasks()).toEqual(mockTasks);
      expect(store.loading()).toBeFalse();
      expect(store.error()).toBeNull();
    });

    it('loadTasks_whenError_shouldSetError', async () => {
      // Arrange
      mockRepository.findByWorkspace.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      // Act
      await store.loadTasks('workspace-1');

      // Assert
      expect(store.tasks()).toEqual([]);
      expect(store.error()).toBe('Network error');
    });
  });

  describe('createTask', () => {
    it('createTask_whenValid_shouldAddToState', async () => {
      // Arrange
      const newTask = { id: '3', title: 'New Task', status: 'pending' };
      mockRepository.create.and.returnValue(of(newTask));

      // Act
      const result = await store.createTask({
        workspaceId: 'workspace-1',
        title: 'New Task',
      });

      // Assert
      expect(result).toEqual(newTask);
      expect(store.tasks()).toContain(newTask);
    });
  });

  describe('updateTask', () => {
    it('updateTask_whenSuccess_shouldUpdateState', async () => {
      // Arrange
      const existingTask = { id: '1', title: 'Old Title', status: 'pending' };
      const updatedTask = { ...existingTask, title: 'New Title' };
      
      store['_tasks'].set([existingTask]);
      mockRepository.update.and.returnValue(of(updatedTask));

      // Act
      const result = await store.updateTask('1', { title: 'New Title' });

      // Assert
      expect(result?.title).toBe('New Title');
      expect(store.tasks().find(t => t.id === '1')?.title).toBe('New Title');
    });

    it('updateTask_whenError_shouldRollback', async () => {
      // Arrange
      const existingTask = { id: '1', title: 'Old Title', status: 'pending' };
      store['_tasks'].set([existingTask]);
      mockRepository.update.and.returnValue(
        throwError(() => new Error('Update failed'))
      );

      // Act
      const result = await store.updateTask('1', { title: 'New Title' });

      // Assert
      expect(result).toBeNull();
      expect(store.tasks().find(t => t.id === '1')?.title).toBe('Old Title');
    });
  });

  describe('computed signals', () => {
    it('pendingTasks_shouldFilterCorrectly', () => {
      // Arrange
      store['_tasks'].set([
        { id: '1', status: 'pending' },
        { id: '2', status: 'completed' },
        { id: '3', status: 'pending' },
      ]);

      // Assert
      expect(store.pendingTasks().length).toBe(2);
    });

    it('statistics_shouldCalculateCorrectly', () => {
      // Arrange
      store['_tasks'].set([
        { id: '1', status: 'pending', progress: 0 },
        { id: '2', status: 'completed', progress: 100 },
        { id: '3', status: 'in_progress', progress: 50 },
      ]);

      // Assert
      const stats = store.statistics();
      expect(stats.total).toBe(3);
      expect(stats.byStatus.pending).toBe(1);
      expect(stats.byStatus.completed).toBe(1);
      expect(stats.averageProgress).toBe(50);
    });
  });
});
```

### E2E 測試

```typescript
// e2e/task/task-crud.e2e.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Task CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    // 登入並導航到任務頁面
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
    await page.goto('/blueprints/test-blueprint/tasks');
  });

  test('createTask_whenValid_shouldAppearInList', async ({ page }) => {
    // 點擊新增按鈕
    await page.click('[data-testid="create-task-button"]');
    
    // 填寫表單
    await page.fill('[data-testid="task-title"]', 'E2E Test Task');
    await page.fill('[data-testid="task-description"]', 'This is a test task');
    await page.selectOption('[data-testid="task-priority"]', 'high');
    
    // 提交
    await page.click('[data-testid="submit-task-button"]');
    
    // 驗證
    await expect(page.locator('text=E2E Test Task')).toBeVisible();
    await expect(page.locator('[data-testid="task-list"]')).toContainText('E2E Test Task');
  });

  test('updateTask_whenStatusChanged_shouldUpdateUI', async ({ page }) => {
    // 點擊任務進入詳情
    await page.click('[data-testid="task-item-1"]');
    
    // 更改狀態
    await page.selectOption('[data-testid="task-status"]', 'completed');
    
    // 儲存
    await page.click('[data-testid="save-task-button"]');
    
    // 驗證
    await expect(page.locator('[data-testid="task-item-1"]')).toHaveClass(/completed/);
  });

  test('deleteTask_whenConfirmed_shouldRemoveFromList', async ({ page }) => {
    // 取得初始任務數
    const initialCount = await page.locator('[data-testid="task-item"]').count();
    
    // 刪除任務
    await page.click('[data-testid="task-item-1"] [data-testid="delete-button"]');
    await page.click('[data-testid="confirm-delete-button"]');
    
    // 驗證
    await expect(page.locator('[data-testid="task-item"]')).toHaveCount(initialCount - 1);
  });

  test('dragDropTask_whenMoved_shouldUpdatePosition', async ({ page }) => {
    // 拖放任務
    const task1 = page.locator('[data-testid="task-item-1"]');
    const task3 = page.locator('[data-testid="task-item-3"]');
    
    await task1.dragTo(task3);
    
    // 驗證順序改變
    const items = await page.locator('[data-testid="task-item"]').allTextContents();
    expect(items[2]).toContain('Task 1');
  });
});
```

---

## 📋 PRD User Story 對應

| PRD ID | User Story | 本 SETC 對應任務 |
|--------|------------|-----------------|
| GH-001 | 作為用戶，我可以創建任務 | P1-T03: 任務 CRUD 完善 |
| GH-002 | 作為用戶，我可以編輯任務 | P1-T03: 任務 CRUD 完善 |
| GH-003 | 作為用戶，我可以刪除任務 | P1-T03: 任務 CRUD 完善 |
| GH-004 | 作為用戶，我可以查看任務列表 | P1-T04: 表格視圖增強 |
| GH-005 | 作為用戶，我可以拖放排序任務 | P1-T01, P1-T02: 拖放排序 |
| GH-006 | 作為用戶，我可以批量操作任務 | P1-T05: 批量操作 |
| GH-007 | 作為用戶，我可以記錄工時 | P1-T06: 工時記錄 |
| GH-008 | 作為用戶，我可以使用任務模板 | P1-T07: 任務模板 |
| GH-009 | 作為用戶，我可以查看 Gantt 圖 | P1-T08: Gantt 視圖 |
| GH-010 | 作為用戶，我可以篩選任務 | P1-T04: 表格視圖增強 |

---

## ⚠️ 風險評估

| 風險 | 影響 | 機率 | 緩解措施 |
|------|:----:|:----:|----------|
| CDK DragDrop 與 NzTree 整合困難 | 高 | 中 | 先做 POC 驗證 |
| 大量任務效能問題 | 高 | 中 | 實作虛擬捲動 |
| 拖放後位置計算複雜 | 中 | 高 | 使用後端 stored procedure |
| Gantt 視圖第三方庫限制 | 中 | 低 | 評估多個庫，選擇最佳 |

---

## 📅 任務清單

### Phase 1: 基礎功能 (Week 1-2)

| ID | 任務 | 預估 | 前置依賴 | 狀態 |
|----|------|:----:|:--------:|:----:|
| P1-T01 | 拖放排序 POC | 2d | - | ⬜ |
| P1-T02 | 任務樹狀拖放實作 | 3d | P1-T01 | ⬜ |
| P1-T03 | 任務 CRUD 完善 | 2d | - | ⬜ |
| P1-T04 | 表格視圖增強 | 2d | P1-T03 | ⬜ |

### Phase 2: 進階功能 (Week 2-3)

| ID | 任務 | 預估 | 前置依賴 | 狀態 |
|----|------|:----:|:--------:|:----:|
| P1-T05 | 批量操作實作 | 2d | P1-T03 | ⬜ |
| P1-T06 | 工時記錄功能 | 2d | P1-T03 | ⬜ |
| P1-T07 | 任務模板功能 | 2d | P1-T03 | ⬜ |
| P1-T08 | Gantt 視圖 POC | 2d | - | ⬜ |

### Phase 3: Gantt 與優化 (Week 3-4)

| ID | 任務 | 預估 | 前置依賴 | 狀態 |
|----|------|:----:|:--------:|:----:|
| P1-T09 | Gantt 視圖實作 | 3d | P1-T08 | ⬜ |
| P1-T10 | 效能優化 | 2d | P1-T02, P1-T04 | ⬜ |
| P1-T11 | 單元測試 | 2d | P1-T01~T09 | ⬜ |
| P1-T12 | E2E 測試 | 2d | P1-T11 | ⬜ |

---

## ✅ 完成檢查清單

### 技術規格完整性

- [x] 資料模型設計（Migration SQL）
- [x] RLS 政策設計
- [x] TypeScript 類型定義（Domain Types, DTOs, Query Params）
- [x] Repository 層設計
- [x] Store 層設計
- [x] 效能指標定義
- [x] 測試策略（單元測試、E2E 測試）

### PRD 對應

- [x] PRD User Story 完整對應
- [x] 驗收標準明確

### 風險管理

- [x] 風險識別與緩解措施

---

**最後更新**: 2025-11-27
**文件版本**: 2.0.0 (Enhanced)
