---
title: "SETC-05: 進度追蹤儀表板"
status: draft
created: 2025-11-27
updated: 2025-11-27
owners: []
progress: 0
due: null
priority: high
estimated_weeks: 2
---

# SETC-05: 進度追蹤儀表板

> **Phase 3: Progress Dashboard System**

本文件定義 GigHub 進度追蹤儀表板的完整技術規格，包含進度計算、資料視覺化、Gantt 圖表及里程碑追蹤。

---

## 📋 文件資訊

| 屬性 | 值 |
|------|-----|
| **文件編號** | SETC-05 |
| **類型** | 業務模組（Business Layer） |
| **前置條件** | SETC-02（任務系統）完成 |
| **後續依賴** | SETC-07（報表系統） |
| **PRD 對應** | GH-020 ~ GH-022 |

---

## 🎯 功能目標

1. ✅ 任務進度自動彙總計算
2. ✅ S 曲線進度圖表顯示
3. ✅ Gantt 圖表互動操作
4. ✅ 里程碑追蹤
5. ✅ 進度落後預警
6. ✅ 關鍵路徑分析
7. ✅ 儀表板可自訂

---

## 🏗️ 技術架構

### 架構層級定位

```
業務層 (Business Layer)
├── 進度儀表板 → dashboards, dashboard_widgets
├── 進度快照 → progress_snapshots
├── 里程碑 → milestones
└── 依賴容器層基礎設施 (12 項)
```

### 容器層基礎設施使用

| # | 基礎設施 | 本模組使用情況 | 狀態 |
|---|----------|----------------|:----:|
| 1 | 上下文注入 | 注入 Workspace Context | ✅ 必須 |
| 2 | 權限系統 | 儀表板檢視/編輯權限 | ✅ 必須 |
| 3 | 時間軸服務 | 記錄進度變更 | ✅ 必須 |
| 4 | 通知中心 | 進度落後預警通知 | ✅ 必須 |
| 5 | 事件總線 | 進度更新事件 | ✅ 必須 |
| 6 | 搜尋引擎 | 里程碑搜尋 | 🟡 選用 |
| 7 | 關聯管理 | 任務-里程碑關聯 | ✅ 必須 |
| 8 | 資料隔離 | RLS 多租戶 | ✅ 必須 |
| 9 | 生命週期 | N/A（只讀視圖） | ❌ 不需要 |
| 10 | 配置中心 | 儀表板設定 | ✅ 必須 |
| 11 | 元數據系統 | 自訂 Widget | 🟡 選用 |
| 12 | API 閘道 | 對外 API | ❌ 不需要 |

---

## 📊 資料庫設計

### ER 關係圖

```
┌─────────────────────┐
│     blueprints      │
└──────────┬──────────┘
           │ 1:N
           ▼
┌─────────────────────┐      ┌────────────────────────┐
│     milestones      │      │   progress_snapshots   │
└──────────┬──────────┘      └────────────────────────┘
           │ 1:N                        ▲
           ▼                            │
┌─────────────────────┐                 │
│  milestone_tasks    │─────────────────┘
└─────────────────────┘
           │
           ▼
┌─────────────────────┐
│       tasks         │
└─────────────────────┘
```

### 資料表：milestones

```sql
-- Migration: 20250101_create_milestones_table.sql

CREATE TABLE milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    
    -- 基本資訊
    name VARCHAR(200) NOT NULL,
    description TEXT,
    color VARCHAR(20) DEFAULT '#1890ff',
    
    -- 日期
    target_date DATE NOT NULL,
    completed_date DATE,
    
    -- 狀態
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    
    -- 進度（自動計算）
    progress DECIMAL(5, 2) DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    
    -- 權重（用於加權計算）
    weight DECIMAL(5, 2) DEFAULT 1,
    
    -- 審計欄位
    created_by UUID NOT NULL REFERENCES accounts(id),
    updated_by UUID REFERENCES accounts(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_milestones_blueprint ON milestones(blueprint_id);
CREATE INDEX idx_milestones_workspace ON milestones(workspace_id);
CREATE INDEX idx_milestones_target_date ON milestones(target_date);
CREATE INDEX idx_milestones_status ON milestones(status);

-- 啟用 RLS
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "milestones_policy"
ON milestones
USING (
    is_blueprint_member(blueprint_id) AND deleted_at IS NULL
);
```

### 資料表：milestone_tasks

```sql
-- Migration: 20250102_create_milestone_tasks_table.sql

CREATE TABLE milestone_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    milestone_id UUID NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    
    -- 權重
    weight DECIMAL(5, 2) DEFAULT 1,
    
    -- 審計欄位
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(milestone_id, task_id)
);

CREATE INDEX idx_milestone_tasks_milestone ON milestone_tasks(milestone_id);
CREATE INDEX idx_milestone_tasks_task ON milestone_tasks(task_id);

-- 啟用 RLS
ALTER TABLE milestone_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "milestone_tasks_policy"
ON milestone_tasks
USING (
    milestone_id IN (
        SELECT id FROM milestones
        WHERE is_blueprint_member(blueprint_id) AND deleted_at IS NULL
    )
);
```

### 資料表：progress_snapshots

```sql
-- Migration: 20250103_create_progress_snapshots_table.sql

CREATE TABLE progress_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    
    -- 快照日期
    snapshot_date DATE NOT NULL,
    
    -- 計劃進度（基準線）
    planned_progress DECIMAL(5, 2) NOT NULL DEFAULT 0,
    
    -- 實際進度
    actual_progress DECIMAL(5, 2) NOT NULL DEFAULT 0,
    
    -- 差異
    variance DECIMAL(5, 2) GENERATED ALWAYS AS (actual_progress - planned_progress) STORED,
    
    -- 任務統計
    total_tasks INTEGER DEFAULT 0,
    completed_tasks INTEGER DEFAULT 0,
    in_progress_tasks INTEGER DEFAULT 0,
    overdue_tasks INTEGER DEFAULT 0,
    
    -- 工時統計
    estimated_hours DECIMAL(10, 2) DEFAULT 0,
    actual_hours DECIMAL(10, 2) DEFAULT 0,
    
    -- 審計欄位
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(workspace_id, snapshot_date)
);

CREATE INDEX idx_progress_snapshots_blueprint ON progress_snapshots(blueprint_id);
CREATE INDEX idx_progress_snapshots_workspace ON progress_snapshots(workspace_id);
CREATE INDEX idx_progress_snapshots_date ON progress_snapshots(snapshot_date);

-- 啟用 RLS
ALTER TABLE progress_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "progress_snapshots_policy"
ON progress_snapshots
USING (
    is_blueprint_member(blueprint_id)
);
```

### 資料表：dashboards

```sql
-- Migration: 20250104_create_dashboards_table.sql

CREATE TABLE dashboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
    
    -- 基本資訊
    name VARCHAR(200) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    
    -- 布局配置 (JSON)
    layout JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- 共享設定
    is_shared BOOLEAN DEFAULT FALSE,
    shared_with JSONB DEFAULT '[]'::jsonb,
    
    -- 審計欄位
    created_by UUID NOT NULL REFERENCES accounts(id),
    updated_by UUID REFERENCES accounts(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_dashboards_blueprint ON dashboards(blueprint_id);
CREATE INDEX idx_dashboards_creator ON dashboards(created_by);

-- 啟用 RLS
ALTER TABLE dashboards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dashboards_select_policy"
ON dashboards FOR SELECT
USING (
    is_blueprint_member(blueprint_id) AND deleted_at IS NULL AND
    (created_by = auth.uid() OR is_shared = TRUE)
);

CREATE POLICY "dashboards_modify_policy"
ON dashboards FOR ALL
USING (
    created_by = auth.uid() AND deleted_at IS NULL
);
```

### 進度計算函數

```sql
-- Function: 計算工作區整體進度
CREATE OR REPLACE FUNCTION calculate_workspace_progress(p_workspace_id UUID)
RETURNS DECIMAL(5, 2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_weight DECIMAL(10, 2);
    v_weighted_progress DECIMAL(10, 2);
BEGIN
    -- 使用加權平均計算進度
    SELECT 
        COALESCE(SUM(COALESCE(t.estimated_hours, 1)), 0),
        COALESCE(SUM(t.progress * COALESCE(t.estimated_hours, 1)), 0)
    INTO v_total_weight, v_weighted_progress
    FROM tasks t
    WHERE t.workspace_id = p_workspace_id
    AND t.parent_id IS NULL  -- 只計算頂層任務
    AND t.deleted_at IS NULL
    AND t.status != 'cancelled';

    IF v_total_weight = 0 THEN
        RETURN 0;
    END IF;

    RETURN ROUND(v_weighted_progress / v_total_weight, 2);
END;
$$;

-- Function: 計算里程碑進度
CREATE OR REPLACE FUNCTION calculate_milestone_progress(p_milestone_id UUID)
RETURNS DECIMAL(5, 2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_weight DECIMAL(10, 2);
    v_weighted_progress DECIMAL(10, 2);
BEGIN
    SELECT 
        COALESCE(SUM(mt.weight), 0),
        COALESCE(SUM(t.progress * mt.weight), 0)
    INTO v_total_weight, v_weighted_progress
    FROM milestone_tasks mt
    JOIN tasks t ON t.id = mt.task_id
    WHERE mt.milestone_id = p_milestone_id
    AND t.deleted_at IS NULL;

    IF v_total_weight = 0 THEN
        RETURN 0;
    END IF;

    RETURN ROUND(v_weighted_progress / v_total_weight, 2);
END;
$$;

-- Function: 創建每日進度快照
CREATE OR REPLACE FUNCTION create_daily_progress_snapshot()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO progress_snapshots (
        blueprint_id,
        workspace_id,
        snapshot_date,
        planned_progress,
        actual_progress,
        total_tasks,
        completed_tasks,
        in_progress_tasks,
        overdue_tasks,
        estimated_hours,
        actual_hours
    )
    SELECT 
        w.blueprint_id,
        w.id AS workspace_id,
        CURRENT_DATE AS snapshot_date,
        -- 計劃進度：基於日期和任務時程
        COALESCE(
            (SELECT calculate_planned_progress(w.id, CURRENT_DATE)),
            0
        ) AS planned_progress,
        -- 實際進度
        calculate_workspace_progress(w.id) AS actual_progress,
        -- 任務統計
        (SELECT COUNT(*) FROM tasks WHERE workspace_id = w.id AND deleted_at IS NULL) AS total_tasks,
        (SELECT COUNT(*) FROM tasks WHERE workspace_id = w.id AND status = 'completed' AND deleted_at IS NULL) AS completed_tasks,
        (SELECT COUNT(*) FROM tasks WHERE workspace_id = w.id AND status = 'in_progress' AND deleted_at IS NULL) AS in_progress_tasks,
        (SELECT COUNT(*) FROM tasks WHERE workspace_id = w.id AND due_date < CURRENT_DATE AND status NOT IN ('completed', 'cancelled') AND deleted_at IS NULL) AS overdue_tasks,
        -- 工時統計
        (SELECT COALESCE(SUM(estimated_hours), 0) FROM tasks WHERE workspace_id = w.id AND deleted_at IS NULL) AS estimated_hours,
        (SELECT COALESCE(SUM(actual_hours), 0) FROM tasks WHERE workspace_id = w.id AND deleted_at IS NULL) AS actual_hours
    FROM workspaces w
    WHERE w.deleted_at IS NULL
    ON CONFLICT (workspace_id, snapshot_date) 
    DO UPDATE SET
        planned_progress = EXCLUDED.planned_progress,
        actual_progress = EXCLUDED.actual_progress,
        total_tasks = EXCLUDED.total_tasks,
        completed_tasks = EXCLUDED.completed_tasks,
        in_progress_tasks = EXCLUDED.in_progress_tasks,
        overdue_tasks = EXCLUDED.overdue_tasks,
        estimated_hours = EXCLUDED.estimated_hours,
        actual_hours = EXCLUDED.actual_hours;
END;
$$;
```

---

## 📦 TypeScript 類型定義

### Domain Types

```typescript
// src/app/features/blueprint/domain/types/progress.types.ts

// ============================================
// 枚舉與常數
// ============================================

export const MILESTONE_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
} as const;

export type MilestoneStatus = typeof MILESTONE_STATUS[keyof typeof MILESTONE_STATUS];

export const WIDGET_TYPE = {
  PROGRESS_CIRCLE: 'progress_circle',
  S_CURVE: 's_curve',
  GANTT: 'gantt',
  MILESTONE_LIST: 'milestone_list',
  TASK_STATUS: 'task_status',
  OVERDUE_TASKS: 'overdue_tasks',
  WORK_HOURS: 'work_hours',
  TEAM_PROGRESS: 'team_progress',
} as const;

export type WidgetType = typeof WIDGET_TYPE[keyof typeof WIDGET_TYPE];

// ============================================
// 核心實體類型
// ============================================

/**
 * 里程碑
 */
export interface Milestone {
  id: string;
  blueprintId: string;
  workspaceId: string;
  name: string;
  description: string | null;
  color: string;
  targetDate: string;
  completedDate: string | null;
  status: MilestoneStatus;
  progress: number;
  weight: number;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  
  // 關聯
  tasks?: MilestoneTask[];
}

/**
 * 里程碑任務關聯
 */
export interface MilestoneTask {
  id: string;
  milestoneId: string;
  taskId: string;
  weight: number;
  createdAt: string;
  
  // 關聯
  task?: {
    id: string;
    title: string;
    status: string;
    progress: number;
    dueDate: string | null;
  };
}

/**
 * 進度快照
 */
export interface ProgressSnapshot {
  id: string;
  blueprintId: string;
  workspaceId: string;
  snapshotDate: string;
  plannedProgress: number;
  actualProgress: number;
  variance: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  estimatedHours: number;
  actualHours: number;
  createdAt: string;
}

/**
 * 儀表板
 */
export interface Dashboard {
  id: string;
  blueprintId: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  layout: DashboardWidget[];
  isShared: boolean;
  sharedWith: string[];
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/**
 * 儀表板 Widget
 */
export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  
  // Grid 位置
  x: number;
  y: number;
  width: number;
  height: number;
  
  // 設定
  config: Record<string, any>;
}

/**
 * S 曲線資料點
 */
export interface SCurveDataPoint {
  date: string;
  planned: number;
  actual: number;
  forecast?: number;
}

/**
 * Gantt 任務資料
 */
export interface GanttTask {
  id: string;
  title: string;
  startDate: Date | null;
  endDate: Date | null;
  progress: number;
  dependencies: string[];
  assignees: { id: string; name: string; avatar?: string }[];
  color?: string;
  isMilestone: boolean;
  children?: GanttTask[];
  isExpanded: boolean;
}

/**
 * 進度摘要
 */
export interface ProgressSummary {
  overallProgress: number;
  plannedProgress: number;
  variance: number;
  
  tasks: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    overdue: number;
  };
  
  hours: {
    estimated: number;
    actual: number;
    remaining: number;
  };
  
  milestones: {
    total: number;
    completed: number;
    upcoming: number;
    overdue: number;
  };
}

// ============================================
// DTO 類型
// ============================================

/**
 * 創建里程碑請求
 */
export interface CreateMilestoneRequest {
  workspaceId: string;
  name: string;
  description?: string;
  color?: string;
  targetDate: string;
  weight?: number;
  taskIds?: string[];
}

/**
 * 更新里程碑請求
 */
export interface UpdateMilestoneRequest {
  name?: string;
  description?: string | null;
  color?: string;
  targetDate?: string;
  weight?: number;
}

/**
 * 儀表板布局更新請求
 */
export interface UpdateDashboardLayoutRequest {
  layout: DashboardWidget[];
}

/**
 * 進度查詢參數
 */
export interface ProgressQueryParams {
  workspaceId: string;
  dateFrom: string;
  dateTo: string;
}
```

---

## 🔧 Repository 層設計

### ProgressRepository

```typescript
// src/app/features/blueprint/data-access/repositories/progress.repository.ts

import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '@core';
import {
  Milestone,
  ProgressSnapshot,
  Dashboard,
  ProgressSummary,
  SCurveDataPoint,
  CreateMilestoneRequest,
  UpdateMilestoneRequest,
  UpdateDashboardLayoutRequest,
  ProgressQueryParams,
} from '../../domain';

@Injectable({ providedIn: 'root' })
export class ProgressRepository {
  private readonly supabase = inject(SupabaseService);

  // ============================================
  // 里程碑
  // ============================================

  async getMilestones(workspaceId: string): Promise<Milestone[]> {
    const { data, error } = await this.supabase.client
      .from('milestones')
      .select(`
        *,
        tasks:milestone_tasks(
          *,
          task:tasks(id, title, status, progress, due_date)
        )
      `)
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .order('target_date', { ascending: true });

    if (error) throw error;
    return (data ?? []).map(m => this.mapToMilestone(m));
  }

  async createMilestone(req: CreateMilestoneRequest & { blueprintId: string }): Promise<Milestone> {
    const { data, error } = await this.supabase.client
      .from('milestones')
      .insert({
        blueprint_id: req.blueprintId,
        workspace_id: req.workspaceId,
        name: req.name,
        description: req.description,
        color: req.color ?? '#1890ff',
        target_date: req.targetDate,
        weight: req.weight ?? 1,
        created_by: (await this.supabase.client.auth.getUser()).data.user?.id,
      })
      .select()
      .single();

    if (error) throw error;

    // 關聯任務
    if (req.taskIds && req.taskIds.length > 0) {
      await this.addTasksToMilestone(data.id, req.taskIds);
    }

    return this.mapToMilestone(data);
  }

  async updateMilestone(id: string, req: UpdateMilestoneRequest): Promise<Milestone> {
    const { data, error } = await this.supabase.client
      .from('milestones')
      .update({
        name: req.name,
        description: req.description,
        color: req.color,
        target_date: req.targetDate,
        weight: req.weight,
        updated_by: (await this.supabase.client.auth.getUser()).data.user?.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.mapToMilestone(data);
  }

  async addTasksToMilestone(milestoneId: string, taskIds: string[]): Promise<void> {
    const { error } = await this.supabase.client
      .from('milestone_tasks')
      .upsert(
        taskIds.map(taskId => ({
          milestone_id: milestoneId,
          task_id: taskId,
        })),
        { onConflict: 'milestone_id,task_id' }
      );

    if (error) throw error;
  }

  async removeTaskFromMilestone(milestoneId: string, taskId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('milestone_tasks')
      .delete()
      .eq('milestone_id', milestoneId)
      .eq('task_id', taskId);

    if (error) throw error;
  }

  // ============================================
  // 進度快照與 S 曲線
  // ============================================

  async getProgressSnapshots(params: ProgressQueryParams): Promise<ProgressSnapshot[]> {
    const { data, error } = await this.supabase.client
      .from('progress_snapshots')
      .select('*')
      .eq('workspace_id', params.workspaceId)
      .gte('snapshot_date', params.dateFrom)
      .lte('snapshot_date', params.dateTo)
      .order('snapshot_date', { ascending: true });

    if (error) throw error;
    return (data ?? []).map(s => this.mapToSnapshot(s));
  }

  async getSCurveData(params: ProgressQueryParams): Promise<SCurveDataPoint[]> {
    const snapshots = await this.getProgressSnapshots(params);
    return snapshots.map(s => ({
      date: s.snapshotDate,
      planned: s.plannedProgress,
      actual: s.actualProgress,
    }));
  }

  async getProgressSummary(workspaceId: string): Promise<ProgressSummary> {
    const { data, error } = await this.supabase.client
      .rpc('get_progress_summary', { p_workspace_id: workspaceId });

    if (error) throw error;
    return data;
  }

  // ============================================
  // 儀表板
  // ============================================

  async getDashboards(blueprintId: string): Promise<Dashboard[]> {
    const { data, error } = await this.supabase.client
      .from('dashboards')
      .select('*')
      .eq('blueprint_id', blueprintId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map(d => this.mapToDashboard(d));
  }

  async getDefaultDashboard(blueprintId: string): Promise<Dashboard | null> {
    const { data, error } = await this.supabase.client
      .from('dashboards')
      .select('*')
      .eq('blueprint_id', blueprintId)
      .eq('is_default', true)
      .is('deleted_at', null)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? this.mapToDashboard(data) : null;
  }

  async createDashboard(
    blueprintId: string,
    name: string,
    layout: UpdateDashboardLayoutRequest['layout']
  ): Promise<Dashboard> {
    const { data, error } = await this.supabase.client
      .from('dashboards')
      .insert({
        blueprint_id: blueprintId,
        name,
        layout,
        created_by: (await this.supabase.client.auth.getUser()).data.user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapToDashboard(data);
  }

  async updateDashboardLayout(id: string, layout: UpdateDashboardLayoutRequest['layout']): Promise<Dashboard> {
    const { data, error } = await this.supabase.client
      .from('dashboards')
      .update({
        layout,
        updated_by: (await this.supabase.client.auth.getUser()).data.user?.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.mapToDashboard(data);
  }

  // ============================================
  // Gantt 資料
  // ============================================

  async getGanttData(workspaceId: string): Promise<GanttTask[]> {
    const { data, error } = await this.supabase.client
      .from('tasks')
      .select(`
        id, title, start_date, due_date, progress, status,
        parent_id, path, depth, position,
        assignee_ids,
        task_dependencies(dependency_task_id)
      `)
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .order('position', { ascending: true });

    if (error) throw error;
    return this.buildGanttTree(data ?? []);
  }

  // ============================================
  // Private Helpers
  // ============================================

  private buildGanttTree(tasks: any[]): GanttTask[] {
    const taskMap = new Map<string, GanttTask>();
    const rootTasks: GanttTask[] = [];

    // 第一遍：建立所有任務
    for (const t of tasks) {
      const ganttTask: GanttTask = {
        id: t.id,
        title: t.title,
        startDate: t.start_date ? new Date(t.start_date) : null,
        endDate: t.due_date ? new Date(t.due_date) : null,
        progress: t.progress,
        dependencies: t.task_dependencies?.map((d: any) => d.dependency_task_id) ?? [],
        assignees: [],
        isMilestone: false,
        children: [],
        isExpanded: true,
      };
      taskMap.set(t.id, ganttTask);
    }

    // 第二遍：建立樹狀結構
    for (const t of tasks) {
      const ganttTask = taskMap.get(t.id)!;
      if (t.parent_id) {
        const parent = taskMap.get(t.parent_id);
        if (parent) {
          parent.children!.push(ganttTask);
        }
      } else {
        rootTasks.push(ganttTask);
      }
    }

    return rootTasks;
  }

  private mapToMilestone(data: any): Milestone {
    return {
      id: data.id,
      blueprintId: data.blueprint_id,
      workspaceId: data.workspace_id,
      name: data.name,
      description: data.description,
      color: data.color,
      targetDate: data.target_date,
      completedDate: data.completed_date,
      status: data.status,
      progress: parseFloat(data.progress) || 0,
      weight: parseFloat(data.weight) || 1,
      createdBy: data.created_by,
      updatedBy: data.updated_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      deletedAt: data.deleted_at,
      tasks: data.tasks?.map((mt: any) => ({
        id: mt.id,
        milestoneId: mt.milestone_id,
        taskId: mt.task_id,
        weight: parseFloat(mt.weight) || 1,
        createdAt: mt.created_at,
        task: mt.task ? {
          id: mt.task.id,
          title: mt.task.title,
          status: mt.task.status,
          progress: mt.task.progress,
          dueDate: mt.task.due_date,
        } : undefined,
      })),
    };
  }

  private mapToSnapshot(data: any): ProgressSnapshot {
    return {
      id: data.id,
      blueprintId: data.blueprint_id,
      workspaceId: data.workspace_id,
      snapshotDate: data.snapshot_date,
      plannedProgress: parseFloat(data.planned_progress) || 0,
      actualProgress: parseFloat(data.actual_progress) || 0,
      variance: parseFloat(data.variance) || 0,
      totalTasks: data.total_tasks,
      completedTasks: data.completed_tasks,
      inProgressTasks: data.in_progress_tasks,
      overdueTasks: data.overdue_tasks,
      estimatedHours: parseFloat(data.estimated_hours) || 0,
      actualHours: parseFloat(data.actual_hours) || 0,
      createdAt: data.created_at,
    };
  }

  private mapToDashboard(data: any): Dashboard {
    return {
      id: data.id,
      blueprintId: data.blueprint_id,
      name: data.name,
      description: data.description,
      isDefault: data.is_default,
      layout: data.layout ?? [],
      isShared: data.is_shared,
      sharedWith: data.shared_with ?? [],
      createdBy: data.created_by,
      updatedBy: data.updated_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      deletedAt: data.deleted_at,
    };
  }
}
```

---

## 🗃️ Store 設計 (Angular Signals)

### ProgressStore

```typescript
// src/app/features/blueprint/data-access/stores/progress.store.ts

import { Injectable, inject, computed, signal } from '@angular/core';
import { ProgressRepository } from '../repositories/progress.repository';
import {
  Milestone,
  ProgressSnapshot,
  Dashboard,
  ProgressSummary,
  SCurveDataPoint,
  GanttTask,
  CreateMilestoneRequest,
  UpdateMilestoneRequest,
  ProgressQueryParams,
} from '../../domain';

interface ProgressState {
  milestones: Milestone[];
  snapshots: ProgressSnapshot[];
  sCurveData: SCurveDataPoint[];
  ganttData: GanttTask[];
  dashboards: Dashboard[];
  currentDashboard: Dashboard | null;
  summary: ProgressSummary | null;
  loading: boolean;
  error: string | null;
}

@Injectable({ providedIn: 'root' })
export class ProgressStore {
  private readonly repository = inject(ProgressRepository);

  // Private state
  private readonly _state = signal<ProgressState>({
    milestones: [],
    snapshots: [],
    sCurveData: [],
    ganttData: [],
    dashboards: [],
    currentDashboard: null,
    summary: null,
    loading: false,
    error: null,
  });

  // Public selectors
  readonly milestones = computed(() => this._state().milestones);
  readonly snapshots = computed(() => this._state().snapshots);
  readonly sCurveData = computed(() => this._state().sCurveData);
  readonly ganttData = computed(() => this._state().ganttData);
  readonly dashboards = computed(() => this._state().dashboards);
  readonly currentDashboard = computed(() => this._state().currentDashboard);
  readonly summary = computed(() => this._state().summary);
  readonly loading = computed(() => this._state().loading);
  readonly error = computed(() => this._state().error);

  // Computed values
  readonly overallProgress = computed(() => this._state().summary?.overallProgress ?? 0);
  readonly variance = computed(() => this._state().summary?.variance ?? 0);

  readonly upcomingMilestones = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this._state().milestones
      .filter(m => m.targetDate >= today && m.status !== 'completed')
      .slice(0, 5);
  });

  readonly overdueMilestones = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this._state().milestones
      .filter(m => m.targetDate < today && m.status !== 'completed');
  });

  readonly isProgressBehind = computed(() => this.variance() < -5);

  // ============================================
  // Actions
  // ============================================

  async loadMilestones(workspaceId: string): Promise<void> {
    this._state.update(s => ({ ...s, loading: true, error: null }));
    try {
      const milestones = await this.repository.getMilestones(workspaceId);
      this._state.update(s => ({ ...s, milestones, loading: false }));
    } catch (error) {
      this._state.update(s => ({
        ...s,
        loading: false,
        error: '載入里程碑失敗',
      }));
      console.error('[ProgressStore] loadMilestones error:', error);
    }
  }

  async loadProgressData(params: ProgressQueryParams): Promise<void> {
    this._state.update(s => ({ ...s, loading: true, error: null }));
    try {
      const [snapshots, sCurveData, summary] = await Promise.all([
        this.repository.getProgressSnapshots(params),
        this.repository.getSCurveData(params),
        this.repository.getProgressSummary(params.workspaceId),
      ]);
      this._state.update(s => ({
        ...s,
        snapshots,
        sCurveData,
        summary,
        loading: false,
      }));
    } catch (error) {
      this._state.update(s => ({
        ...s,
        loading: false,
        error: '載入進度資料失敗',
      }));
      console.error('[ProgressStore] loadProgressData error:', error);
    }
  }

  async loadGanttData(workspaceId: string): Promise<void> {
    this._state.update(s => ({ ...s, loading: true, error: null }));
    try {
      const ganttData = await this.repository.getGanttData(workspaceId);
      this._state.update(s => ({ ...s, ganttData, loading: false }));
    } catch (error) {
      this._state.update(s => ({
        ...s,
        loading: false,
        error: '載入 Gantt 資料失敗',
      }));
      console.error('[ProgressStore] loadGanttData error:', error);
    }
  }

  async loadDashboards(blueprintId: string): Promise<void> {
    try {
      const [dashboards, defaultDashboard] = await Promise.all([
        this.repository.getDashboards(blueprintId),
        this.repository.getDefaultDashboard(blueprintId),
      ]);
      this._state.update(s => ({
        ...s,
        dashboards,
        currentDashboard: defaultDashboard ?? dashboards[0] ?? null,
      }));
    } catch (error) {
      console.error('[ProgressStore] loadDashboards error:', error);
    }
  }

  async createMilestone(req: CreateMilestoneRequest & { blueprintId: string }): Promise<Milestone | null> {
    try {
      const milestone = await this.repository.createMilestone(req);
      this._state.update(s => ({
        ...s,
        milestones: [...s.milestones, milestone],
      }));
      return milestone;
    } catch (error) {
      this._state.update(s => ({ ...s, error: '創建里程碑失敗' }));
      console.error('[ProgressStore] createMilestone error:', error);
      return null;
    }
  }

  async updateMilestone(id: string, req: UpdateMilestoneRequest): Promise<void> {
    try {
      const updated = await this.repository.updateMilestone(id, req);
      this._state.update(s => ({
        ...s,
        milestones: s.milestones.map(m => m.id === id ? updated : m),
      }));
    } catch (error) {
      this._state.update(s => ({ ...s, error: '更新里程碑失敗' }));
      console.error('[ProgressStore] updateMilestone error:', error);
    }
  }

  async addTasksToMilestone(milestoneId: string, taskIds: string[]): Promise<void> {
    try {
      await this.repository.addTasksToMilestone(milestoneId, taskIds);
      // 重新載入里程碑以獲取更新的任務列表
      const milestone = this._state().milestones.find(m => m.id === milestoneId);
      if (milestone) {
        await this.loadMilestones(milestone.workspaceId);
      }
    } catch (error) {
      this._state.update(s => ({ ...s, error: '新增任務到里程碑失敗' }));
      console.error('[ProgressStore] addTasksToMilestone error:', error);
    }
  }

  async saveDashboardLayout(widgets: any[]): Promise<void> {
    const dashboard = this._state().currentDashboard;
    if (!dashboard) return;

    try {
      const updated = await this.repository.updateDashboardLayout(dashboard.id, widgets);
      this._state.update(s => ({
        ...s,
        currentDashboard: updated,
        dashboards: s.dashboards.map(d => d.id === dashboard.id ? updated : d),
      }));
    } catch (error) {
      this._state.update(s => ({ ...s, error: '儲存儀表板失敗' }));
      console.error('[ProgressStore] saveDashboardLayout error:', error);
    }
  }

  setCurrentDashboard(dashboard: Dashboard): void {
    this._state.update(s => ({ ...s, currentDashboard: dashboard }));
  }

  clearError(): void {
    this._state.update(s => ({ ...s, error: null }));
  }

  reset(): void {
    this._state.set({
      milestones: [],
      snapshots: [],
      sCurveData: [],
      ganttData: [],
      dashboards: [],
      currentDashboard: null,
      summary: null,
      loading: false,
      error: null,
    });
  }
}
```

---

## 🧪 測試策略

### 單元測試

```typescript
// src/app/features/blueprint/data-access/stores/progress.store.spec.ts

import { TestBed } from '@angular/core/testing';
import { ProgressStore } from './progress.store';
import { ProgressRepository } from '../repositories/progress.repository';

describe('ProgressStore', () => {
  let store: ProgressStore;
  let mockRepository: jasmine.SpyObj<ProgressRepository>;

  const mockSummary = {
    overallProgress: 65,
    plannedProgress: 70,
    variance: -5,
    tasks: { total: 100, completed: 65, inProgress: 20, pending: 10, overdue: 5 },
    hours: { estimated: 1000, actual: 800, remaining: 350 },
    milestones: { total: 10, completed: 4, upcoming: 3, overdue: 1 },
  };

  beforeEach(() => {
    mockRepository = jasmine.createSpyObj('ProgressRepository', [
      'getMilestones',
      'getProgressSnapshots',
      'getSCurveData',
      'getProgressSummary',
      'getGanttData',
      'createMilestone',
    ]);

    TestBed.configureTestingModule({
      providers: [
        ProgressStore,
        { provide: ProgressRepository, useValue: mockRepository },
      ],
    });

    store = TestBed.inject(ProgressStore);
  });

  describe('loadProgressData', () => {
    it('loadProgressData_whenParamsValid_shouldLoadAllData', async () => {
      mockRepository.getProgressSnapshots.and.resolveTo([]);
      mockRepository.getSCurveData.and.resolveTo([]);
      mockRepository.getProgressSummary.and.resolveTo(mockSummary as any);

      await store.loadProgressData({
        workspaceId: 'ws-1',
        dateFrom: '2025-01-01',
        dateTo: '2025-01-31',
      });

      expect(store.summary()).toEqual(mockSummary as any);
      expect(store.overallProgress()).toBe(65);
      expect(store.variance()).toBe(-5);
      expect(store.isProgressBehind()).toBeTrue();
    });
  });

  describe('computed values', () => {
    it('isProgressBehind_whenVarianceLessThanNegative5_shouldReturnTrue', async () => {
      mockRepository.getProgressSnapshots.and.resolveTo([]);
      mockRepository.getSCurveData.and.resolveTo([]);
      mockRepository.getProgressSummary.and.resolveTo(mockSummary as any);

      await store.loadProgressData({
        workspaceId: 'ws-1',
        dateFrom: '2025-01-01',
        dateTo: '2025-01-31',
      });

      expect(store.isProgressBehind()).toBeTrue();
    });
  });
});
```

### E2E 測試

```typescript
// e2e/progress/progress-dashboard.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Progress Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/workspace/ws-1/progress');
  });

  test('should display progress summary', async ({ page }) => {
    // 驗證進度環形圖顯示
    await expect(page.locator('[data-testid="progress-circle"]')).toBeVisible();
    
    // 驗證進度數字
    await expect(page.locator('[data-testid="overall-progress"]')).toContainText('%');
  });

  test('should display S-curve chart', async ({ page }) => {
    // 切換到 S 曲線視圖
    await page.click('[data-testid="view-scurve"]');
    
    // 驗證圖表顯示
    await expect(page.locator('[data-testid="scurve-chart"]')).toBeVisible();
    
    // 驗證圖例
    await expect(page.locator('[data-testid="legend-planned"]')).toBeVisible();
    await expect(page.locator('[data-testid="legend-actual"]')).toBeVisible();
  });

  test('should display Gantt chart', async ({ page }) => {
    // 切換到 Gantt 視圖
    await page.click('[data-testid="view-gantt"]');
    
    // 驗證 Gantt 圖表顯示
    await expect(page.locator('[data-testid="gantt-chart"]')).toBeVisible();
    
    // 驗證任務列表
    await expect(page.locator('[data-testid="gantt-task-row"]').first()).toBeVisible();
  });

  test('should create milestone', async ({ page }) => {
    // 點擊新增里程碑
    await page.click('[data-testid="add-milestone-btn"]');
    
    // 填寫表單
    await page.fill('[data-testid="milestone-name"]', '一樓完工');
    await page.fill('[data-testid="milestone-date"]', '2025-03-31');
    
    // 選擇任務
    await page.click('[data-testid="select-tasks-btn"]');
    await page.click('[data-testid="task-checkbox-1"]');
    await page.click('[data-testid="task-checkbox-2"]');
    await page.click('[data-testid="confirm-tasks-btn"]');
    
    // 儲存
    await page.click('[data-testid="save-milestone-btn"]');
    
    // 驗證里程碑已創建
    await expect(page.locator('[data-testid="milestone-一樓完工"]')).toBeVisible();
  });
});
```

---

## 📈 效能指標

| 指標 | 目標值 | 測量方式 |
|------|--------|----------|
| 儀表板載入 | < 1s | Lighthouse/DevTools |
| S 曲線渲染 | < 500ms | Frame Time |
| Gantt 圖表渲染（100 任務） | < 500ms | Frame Time |
| 進度計算 API | < 200ms | API Response Time |
| 快照查詢（30 天） | < 300ms | API Response Time |

---

## 📋 驗收檢查清單

### 資料庫
- [ ] `milestones` 資料表已建立且 RLS 正確
- [ ] `milestone_tasks` 資料表已建立
- [ ] `progress_snapshots` 資料表已建立
- [ ] `dashboards` 資料表已建立
- [ ] 進度計算函數已建立並測試
- [ ] 每日快照 Cron Job 已設定

### 後端
- [ ] Repository 方法完整實作
- [ ] 進度計算邏輯正確
- [ ] S 曲線資料格式正確

### 前端
- [ ] ProgressStore 狀態管理正確
- [ ] 進度環形圖顯示正確
- [ ] S 曲線圖表互動正常
- [ ] Gantt 圖表功能完整
- [ ] 里程碑 CRUD 完整
- [ ] 儀表板自訂功能完整

### 測試
- [ ] 單元測試覆蓋率 ≥ 80%
- [ ] E2E 測試覆蓋主要流程
- [ ] 效能測試通過

---

## 🚀 下一步

完成 SETC-05 後，進入 [SETC-06: 品質驗收系統](./06-quality-acceptance-enhanced.setc.md)
