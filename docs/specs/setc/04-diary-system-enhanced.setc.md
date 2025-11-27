---
title: "SETC-04: 施工日誌系統"
status: draft
created: 2025-11-27
updated: 2025-11-27
owners: []
progress: 0
due: null
priority: high
estimated_weeks: 2
---

# SETC-04: 施工日誌系統

> **Phase 2: Diary System**

本文件定義 GigHub 施工日誌系統的完整技術規格，包含資料模型、API 設計、前端實作、及測試策略。

---

## 📋 文件資訊

| 屬性 | 值 |
|------|-----|
| **文件編號** | SETC-04 |
| **類型** | 業務模組（Business Layer） |
| **前置條件** | SETC-00（基礎架構）, SETC-03（檔案系統）完成 |
| **後續依賴** | SETC-05（進度儀表板）, SETC-07（報表系統） |
| **PRD 對應** | GH-014 ~ GH-016 |

---

## 🎯 功能目標

1. ✅ 日誌可上傳多張照片（整合檔案系統）
2. ✅ 人員出勤與工時可記錄
3. ✅ 工作項目可關聯任務
4. ✅ 日誌可複製前一日內容
5. ✅ 月曆視圖正確顯示
6. ✅ 天氣記錄完整
7. ✅ 日誌簽核流程

---

## 🏗️ 技術架構

### 架構層級定位

```
業務層 (Business Layer)
├── 施工日誌 → diaries, diary_photos, daily_attendance
├── 工作項目 → work_items
└── 依賴容器層基礎設施 (12 項)
```

### 容器層基礎設施使用

| # | 基礎設施 | 本模組使用情況 | 狀態 |
|---|----------|----------------|:----:|
| 1 | 上下文注入 | 注入 Workspace Context | ✅ 必須 |
| 2 | 權限系統 | 日誌編輯/檢視權限 | ✅ 必須 |
| 3 | 時間軸服務 | 記錄日誌活動 | ✅ 必須 |
| 4 | 通知中心 | 日誌提交通知 | ✅ 必須 |
| 5 | 事件總線 | 發布日誌事件 | ✅ 必須 |
| 6 | 搜尋引擎 | 日誌全文搜尋 | 🟡 選用 |
| 7 | 關聯管理 | 日誌-任務關聯 | ✅ 必須 |
| 8 | 資料隔離 | RLS 多租戶 | ✅ 必須 |
| 9 | 生命週期 | Draft/Submitted/Approved | ✅ 必須 |
| 10 | 配置中心 | 日誌欄位設定 | 🟡 選用 |
| 11 | 元數據系統 | 自訂日誌欄位 | 🟡 選用 |
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
┌─────────────────────┐      ┌────────────────────┐
│      diaries        │──1:N─│    diary_photos    │
└──────────┬──────────┘      └────────────────────┘
           │ 1:N
           ├──────────────────┐
           ▼                  ▼
┌─────────────────────┐ ┌────────────────────┐
│  daily_attendance   │ │    work_items      │
└─────────────────────┘ └────────────────────┘
                              │ N:1
                              ▼
                        ┌────────────────────┐
                        │       tasks        │
                        └────────────────────┘
```

### 資料表：diaries

```sql
-- Migration: 20250101_create_diaries_table.sql

CREATE TABLE diaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    
    -- 日期資訊
    diary_date DATE NOT NULL,
    
    -- 天氣資訊
    weather VARCHAR(20) NOT NULL DEFAULT 'sunny',
    weather_temperature INTEGER,
    weather_description VARCHAR(200),
    
    -- 施工資訊
    work_summary TEXT,
    work_hours_total DECIMAL(5, 2) DEFAULT 0,
    worker_count INTEGER DEFAULT 0,
    
    -- 材料使用
    materials_used JSONB DEFAULT '[]'::jsonb,
    
    -- 安全記錄
    safety_incidents JSONB DEFAULT '[]'::jsonb,
    safety_notes TEXT,
    
    -- 問題與備註
    issues_encountered TEXT,
    notes TEXT,
    
    -- 狀態管理
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    submitted_at TIMESTAMPTZ,
    submitted_by UUID REFERENCES accounts(id),
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES accounts(id),
    
    -- 審計欄位
    created_by UUID NOT NULL REFERENCES accounts(id),
    updated_by UUID REFERENCES accounts(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    
    -- 唯一性約束：每個 workspace 每天只能有一份日誌
    UNIQUE(workspace_id, diary_date)
);

-- 索引
CREATE INDEX idx_diaries_blueprint ON diaries(blueprint_id);
CREATE INDEX idx_diaries_workspace ON diaries(workspace_id);
CREATE INDEX idx_diaries_date ON diaries(diary_date DESC);
CREATE INDEX idx_diaries_status ON diaries(status);
CREATE INDEX idx_diaries_workspace_date ON diaries(workspace_id, diary_date DESC);

-- 啟用 RLS
ALTER TABLE diaries ENABLE ROW LEVEL SECURITY;

-- RLS 政策
CREATE POLICY "diaries_select_policy"
ON diaries FOR SELECT
USING (
    is_blueprint_member(blueprint_id) AND deleted_at IS NULL
);

CREATE POLICY "diaries_insert_policy"
ON diaries FOR INSERT
WITH CHECK (
    has_blueprint_permission(blueprint_id, 'diary:create')
);

CREATE POLICY "diaries_update_policy"
ON diaries FOR UPDATE
USING (
    has_blueprint_permission(blueprint_id, 'diary:edit')
);

CREATE POLICY "diaries_delete_policy"
ON diaries FOR DELETE
USING (
    has_blueprint_permission(blueprint_id, 'diary:delete')
);

-- 觸發器：自動更新 updated_at
CREATE TRIGGER trigger_diaries_updated_at
BEFORE UPDATE ON diaries
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

### 資料表：diary_photos

```sql
-- Migration: 20250102_create_diary_photos_table.sql

CREATE TABLE diary_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diary_id UUID NOT NULL REFERENCES diaries(id) ON DELETE CASCADE,
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    
    -- 照片資訊
    display_order INTEGER DEFAULT 0,
    caption VARCHAR(500),
    location VARCHAR(200),
    
    -- 標註資訊
    annotations JSONB DEFAULT '[]'::jsonb,
    
    -- 時間戳
    taken_at TIMESTAMPTZ,
    
    -- 審計欄位
    uploaded_by UUID NOT NULL REFERENCES accounts(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(diary_id, file_id)
);

CREATE INDEX idx_diary_photos_diary ON diary_photos(diary_id);
CREATE INDEX idx_diary_photos_file ON diary_photos(file_id);

-- 啟用 RLS
ALTER TABLE diary_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "diary_photos_policy"
ON diary_photos
USING (
    diary_id IN (
        SELECT id FROM diaries
        WHERE is_blueprint_member(blueprint_id) AND deleted_at IS NULL
    )
);
```

### 資料表：daily_attendance

```sql
-- Migration: 20250103_create_daily_attendance_table.sql

CREATE TABLE daily_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diary_id UUID NOT NULL REFERENCES diaries(id) ON DELETE CASCADE,
    
    -- 工人資訊
    worker_name VARCHAR(100) NOT NULL,
    worker_type VARCHAR(20) NOT NULL DEFAULT 'regular',
    worker_role VARCHAR(50),
    worker_company VARCHAR(100),
    
    -- 出勤時間
    check_in_time TIME,
    check_out_time TIME,
    
    -- 工時計算
    hours_worked DECIMAL(4, 2) DEFAULT 0,
    overtime_hours DECIMAL(4, 2) DEFAULT 0,
    
    -- 備註
    notes TEXT,
    
    -- 審計欄位
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_daily_attendance_diary ON daily_attendance(diary_id);
CREATE INDEX idx_daily_attendance_worker_type ON daily_attendance(worker_type);

-- 啟用 RLS
ALTER TABLE daily_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_attendance_policy"
ON daily_attendance
USING (
    diary_id IN (
        SELECT id FROM diaries
        WHERE is_blueprint_member(blueprint_id) AND deleted_at IS NULL
    )
);
```

### 資料表：work_items

```sql
-- Migration: 20250104_create_work_items_table.sql

CREATE TABLE work_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diary_id UUID NOT NULL REFERENCES diaries(id) ON DELETE CASCADE,
    
    -- 工作內容
    description TEXT NOT NULL,
    category VARCHAR(50),
    location VARCHAR(200),
    
    -- 任務關聯
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    
    -- 進度報告
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    progress_notes TEXT,
    
    -- 時間
    hours_spent DECIMAL(4, 2) DEFAULT 0,
    
    -- 順序
    display_order INTEGER DEFAULT 0,
    
    -- 審計欄位
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_work_items_diary ON work_items(diary_id);
CREATE INDEX idx_work_items_task ON work_items(task_id);

-- 啟用 RLS
ALTER TABLE work_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "work_items_policy"
ON work_items
USING (
    diary_id IN (
        SELECT id FROM diaries
        WHERE is_blueprint_member(blueprint_id) AND deleted_at IS NULL
    )
);
```

---

## 📦 TypeScript 類型定義

### Domain Types

```typescript
// src/app/features/blueprint/domain/types/diary.types.ts

// ============================================
// 枚舉與常數
// ============================================

export const DIARY_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type DiaryStatus = typeof DIARY_STATUS[keyof typeof DIARY_STATUS];

export const WEATHER_TYPE = {
  SUNNY: 'sunny',
  CLOUDY: 'cloudy',
  RAINY: 'rainy',
  STORMY: 'stormy',
  SNOWY: 'snowy',
  FOGGY: 'foggy',
} as const;

export type WeatherType = typeof WEATHER_TYPE[keyof typeof WEATHER_TYPE];

export const WORKER_TYPE = {
  REGULAR: 'regular',
  CONTRACTOR: 'contractor',
  TEMPORARY: 'temporary',
  SUPERVISOR: 'supervisor',
} as const;

export type WorkerType = typeof WORKER_TYPE[keyof typeof WORKER_TYPE];

// ============================================
// 核心實體類型
// ============================================

/**
 * 施工日誌實體
 */
export interface Diary {
  id: string;
  blueprintId: string;
  workspaceId: string;
  
  // 日期
  diaryDate: string; // ISO date string
  
  // 天氣
  weather: WeatherType;
  weatherTemperature: number | null;
  weatherDescription: string | null;
  
  // 施工摘要
  workSummary: string | null;
  workHoursTotal: number;
  workerCount: number;
  
  // 材料
  materialsUsed: MaterialUsage[];
  
  // 安全
  safetyIncidents: SafetyIncident[];
  safetyNotes: string | null;
  
  // 問題與備註
  issuesEncountered: string | null;
  notes: string | null;
  
  // 狀態
  status: DiaryStatus;
  submittedAt: string | null;
  submittedBy: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  
  // 審計
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  
  // 關聯資料 (optional, populated by joins)
  photos?: DiaryPhoto[];
  attendance?: DailyAttendance[];
  workItems?: WorkItem[];
}

/**
 * 日誌照片
 */
export interface DiaryPhoto {
  id: string;
  diaryId: string;
  fileId: string;
  displayOrder: number;
  caption: string | null;
  location: string | null;
  annotations: PhotoAnnotation[];
  takenAt: string | null;
  uploadedBy: string;
  createdAt: string;
  
  // 關聯
  file?: {
    id: string;
    originalName: string;
    mimeType: string;
    fileSize: number;
    url: string;
    thumbnailUrl?: string;
  };
}

/**
 * 照片標註
 */
export interface PhotoAnnotation {
  id: string;
  type: 'rectangle' | 'circle' | 'arrow' | 'text';
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  color: string;
}

/**
 * 出勤記錄
 */
export interface DailyAttendance {
  id: string;
  diaryId: string;
  workerName: string;
  workerType: WorkerType;
  workerRole: string | null;
  workerCompany: string | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  hoursWorked: number;
  overtimeHours: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * 工作項目
 */
export interface WorkItem {
  id: string;
  diaryId: string;
  description: string;
  category: string | null;
  location: string | null;
  taskId: string | null;
  progressPercentage: number;
  progressNotes: string | null;
  hoursSpent: number;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  
  // 關聯
  task?: {
    id: string;
    title: string;
    status: string;
    progress: number;
  };
}

/**
 * 材料使用記錄
 */
export interface MaterialUsage {
  name: string;
  quantity: number;
  unit: string;
  notes?: string;
}

/**
 * 安全事件
 */
export interface SafetyIncident {
  type: 'warning' | 'incident' | 'accident';
  description: string;
  severity: 'low' | 'medium' | 'high';
  actionTaken?: string;
  reportedBy?: string;
  time?: string;
}

// ============================================
// DTO 類型
// ============================================

/**
 * 創建日誌請求
 */
export interface CreateDiaryRequest {
  workspaceId: string;
  diaryDate: string;
  weather?: WeatherType;
  weatherTemperature?: number;
  weatherDescription?: string;
  workSummary?: string;
  notes?: string;
}

/**
 * 更新日誌請求
 */
export interface UpdateDiaryRequest {
  weather?: WeatherType;
  weatherTemperature?: number | null;
  weatherDescription?: string | null;
  workSummary?: string | null;
  materialsUsed?: MaterialUsage[];
  safetyIncidents?: SafetyIncident[];
  safetyNotes?: string | null;
  issuesEncountered?: string | null;
  notes?: string | null;
}

/**
 * 添加出勤記錄請求
 */
export interface CreateAttendanceRequest {
  workerName: string;
  workerType: WorkerType;
  workerRole?: string;
  workerCompany?: string;
  checkInTime?: string;
  checkOutTime?: string;
  notes?: string;
}

/**
 * 添加工作項目請求
 */
export interface CreateWorkItemRequest {
  description: string;
  category?: string;
  location?: string;
  taskId?: string;
  progressPercentage?: number;
  progressNotes?: string;
  hoursSpent?: number;
}

/**
 * 日誌查詢參數
 */
export interface DiaryQueryParams {
  workspaceId: string;
  dateFrom?: string;
  dateTo?: string;
  status?: DiaryStatus;
  weather?: WeatherType;
  search?: string;
  page?: number;
  pageSize?: number;
}

/**
 * 日誌統計
 */
export interface DiaryStatistics {
  totalDiaries: number;
  totalWorkHours: number;
  totalWorkers: number;
  byStatus: Record<DiaryStatus, number>;
  byWeather: Record<WeatherType, number>;
  averageWorkHoursPerDay: number;
}
```

---

## 🔧 Repository 層設計

### DiaryRepository

```typescript
// src/app/features/blueprint/data-access/repositories/diary.repository.ts

import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '@core';
import {
  Diary,
  DiaryPhoto,
  DailyAttendance,
  WorkItem,
  DiaryQueryParams,
  CreateDiaryRequest,
  UpdateDiaryRequest,
  CreateAttendanceRequest,
  CreateWorkItemRequest,
  DiaryStatistics,
} from '../../domain';

@Injectable({ providedIn: 'root' })
export class DiaryRepository {
  private readonly supabase = inject(SupabaseService);
  private readonly TABLE = 'diaries';

  /**
   * 根據日期查詢日誌
   */
  async findByDate(workspaceId: string, date: string): Promise<Diary | null> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .select(`
        *,
        photos:diary_photos(
          *,
          file:files(id, original_name, mime_type, file_size, storage_path)
        ),
        attendance:daily_attendance(*),
        work_items:work_items(
          *,
          task:tasks(id, title, status, progress)
        )
      `)
      .eq('workspace_id', workspaceId)
      .eq('diary_date', date)
      .is('deleted_at', null)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? this.mapToDiary(data) : null;
  }

  /**
   * 查詢日誌列表
   */
  async findAll(params: DiaryQueryParams): Promise<{ data: Diary[]; total: number }> {
    let query = this.supabase.client
      .from(this.TABLE)
      .select('*, photos:diary_photos(count)', { count: 'exact' })
      .eq('workspace_id', params.workspaceId)
      .is('deleted_at', null);

    if (params.dateFrom) {
      query = query.gte('diary_date', params.dateFrom);
    }
    if (params.dateTo) {
      query = query.lte('diary_date', params.dateTo);
    }
    if (params.status) {
      query = query.eq('status', params.status);
    }
    if (params.weather) {
      query = query.eq('weather', params.weather);
    }
    if (params.search) {
      query = query.or(`work_summary.ilike.%${params.search}%,notes.ilike.%${params.search}%`);
    }

    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    query = query
      .order('diary_date', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      data: (data ?? []).map(d => this.mapToDiary(d)),
      total: count ?? 0,
    };
  }

  /**
   * 獲取月曆資料
   */
  async getCalendarData(
    workspaceId: string,
    year: number,
    month: number
  ): Promise<{ date: string; weather: string; status: string; hasPhotos: boolean }[]> {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .select('diary_date, weather, status, photos:diary_photos(count)')
      .eq('workspace_id', workspaceId)
      .gte('diary_date', startDate)
      .lte('diary_date', endDate)
      .is('deleted_at', null);

    if (error) throw error;

    return (data ?? []).map(d => ({
      date: d.diary_date,
      weather: d.weather,
      status: d.status,
      hasPhotos: (d.photos as any)?.[0]?.count > 0,
    }));
  }

  /**
   * 創建日誌
   */
  async create(req: CreateDiaryRequest & { blueprintId: string }): Promise<Diary> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .insert({
        blueprint_id: req.blueprintId,
        workspace_id: req.workspaceId,
        diary_date: req.diaryDate,
        weather: req.weather ?? 'sunny',
        weather_temperature: req.weatherTemperature,
        weather_description: req.weatherDescription,
        work_summary: req.workSummary,
        notes: req.notes,
        created_by: (await this.supabase.client.auth.getUser()).data.user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapToDiary(data);
  }

  /**
   * 更新日誌
   */
  async update(id: string, req: UpdateDiaryRequest): Promise<Diary> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .update({
        weather: req.weather,
        weather_temperature: req.weatherTemperature,
        weather_description: req.weatherDescription,
        work_summary: req.workSummary,
        materials_used: req.materialsUsed,
        safety_incidents: req.safetyIncidents,
        safety_notes: req.safetyNotes,
        issues_encountered: req.issuesEncountered,
        notes: req.notes,
        updated_by: (await this.supabase.client.auth.getUser()).data.user?.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.mapToDiary(data);
  }

  /**
   * 提交日誌
   */
  async submit(id: string): Promise<Diary> {
    const userId = (await this.supabase.client.auth.getUser()).data.user?.id;
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        submitted_by: userId,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.mapToDiary(data);
  }

  /**
   * 審核日誌
   */
  async approve(id: string, approved: boolean): Promise<Diary> {
    const userId = (await this.supabase.client.auth.getUser()).data.user?.id;
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .update({
        status: approved ? 'approved' : 'rejected',
        approved_at: approved ? new Date().toISOString() : null,
        approved_by: approved ? userId : null,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.mapToDiary(data);
  }

  /**
   * 複製前一日日誌
   */
  async copyFromPrevious(workspaceId: string, targetDate: string): Promise<Diary | null> {
    // 找前一天日誌
    const previousDate = new Date(targetDate);
    previousDate.setDate(previousDate.getDate() - 1);
    
    const previous = await this.findByDate(workspaceId, previousDate.toISOString().split('T')[0]);
    if (!previous) return null;

    // 創建新日誌，複製內容但不複製照片
    const newDiary = await this.create({
      blueprintId: previous.blueprintId,
      workspaceId,
      diaryDate: targetDate,
      weather: previous.weather,
      weatherTemperature: previous.weatherTemperature ?? undefined,
      workSummary: previous.workSummary ?? undefined,
    });

    // 複製出勤記錄
    if (previous.attendance && previous.attendance.length > 0) {
      for (const att of previous.attendance) {
        await this.addAttendance(newDiary.id, {
          workerName: att.workerName,
          workerType: att.workerType,
          workerRole: att.workerRole ?? undefined,
          workerCompany: att.workerCompany ?? undefined,
        });
      }
    }

    return newDiary;
  }

  /**
   * 添加出勤記錄
   */
  async addAttendance(diaryId: string, req: CreateAttendanceRequest): Promise<DailyAttendance> {
    const hoursWorked = this.calculateHours(req.checkInTime, req.checkOutTime);
    
    const { data, error } = await this.supabase.client
      .from('daily_attendance')
      .insert({
        diary_id: diaryId,
        worker_name: req.workerName,
        worker_type: req.workerType,
        worker_role: req.workerRole,
        worker_company: req.workerCompany,
        check_in_time: req.checkInTime,
        check_out_time: req.checkOutTime,
        hours_worked: hoursWorked,
        overtime_hours: Math.max(0, hoursWorked - 8),
        notes: req.notes,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapToAttendance(data);
  }

  /**
   * 添加工作項目
   */
  async addWorkItem(diaryId: string, req: CreateWorkItemRequest): Promise<WorkItem> {
    const { data, error } = await this.supabase.client
      .from('work_items')
      .insert({
        diary_id: diaryId,
        description: req.description,
        category: req.category,
        location: req.location,
        task_id: req.taskId,
        progress_percentage: req.progressPercentage ?? 0,
        progress_notes: req.progressNotes,
        hours_spent: req.hoursSpent ?? 0,
      })
      .select(`
        *,
        task:tasks(id, title, status, progress)
      `)
      .single();

    if (error) throw error;
    return this.mapToWorkItem(data);
  }

  /**
   * 獲取統計資料
   */
  async getStatistics(workspaceId: string, dateFrom: string, dateTo: string): Promise<DiaryStatistics> {
    const { data, error } = await this.supabase.client
      .rpc('get_diary_statistics', {
        p_workspace_id: workspaceId,
        p_date_from: dateFrom,
        p_date_to: dateTo,
      });

    if (error) throw error;
    return data;
  }

  // ============================================
  // Private Helpers
  // ============================================

  private calculateHours(checkIn?: string, checkOut?: string): number {
    if (!checkIn || !checkOut) return 0;
    const inTime = new Date(`1970-01-01T${checkIn}`);
    const outTime = new Date(`1970-01-01T${checkOut}`);
    return (outTime.getTime() - inTime.getTime()) / (1000 * 60 * 60);
  }

  private mapToDiary(data: any): Diary {
    return {
      id: data.id,
      blueprintId: data.blueprint_id,
      workspaceId: data.workspace_id,
      diaryDate: data.diary_date,
      weather: data.weather,
      weatherTemperature: data.weather_temperature,
      weatherDescription: data.weather_description,
      workSummary: data.work_summary,
      workHoursTotal: parseFloat(data.work_hours_total) || 0,
      workerCount: data.worker_count || 0,
      materialsUsed: data.materials_used || [],
      safetyIncidents: data.safety_incidents || [],
      safetyNotes: data.safety_notes,
      issuesEncountered: data.issues_encountered,
      notes: data.notes,
      status: data.status,
      submittedAt: data.submitted_at,
      submittedBy: data.submitted_by,
      approvedAt: data.approved_at,
      approvedBy: data.approved_by,
      createdBy: data.created_by,
      updatedBy: data.updated_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      deletedAt: data.deleted_at,
      photos: data.photos?.map((p: any) => this.mapToPhoto(p)),
      attendance: data.attendance?.map((a: any) => this.mapToAttendance(a)),
      workItems: data.work_items?.map((w: any) => this.mapToWorkItem(w)),
    };
  }

  private mapToPhoto(data: any): DiaryPhoto {
    return {
      id: data.id,
      diaryId: data.diary_id,
      fileId: data.file_id,
      displayOrder: data.display_order,
      caption: data.caption,
      location: data.location,
      annotations: data.annotations || [],
      takenAt: data.taken_at,
      uploadedBy: data.uploaded_by,
      createdAt: data.created_at,
      file: data.file ? {
        id: data.file.id,
        originalName: data.file.original_name,
        mimeType: data.file.mime_type,
        fileSize: data.file.file_size,
        url: this.supabase.client.storage
          .from('files')
          .getPublicUrl(data.file.storage_path).data.publicUrl,
      } : undefined,
    };
  }

  private mapToAttendance(data: any): DailyAttendance {
    return {
      id: data.id,
      diaryId: data.diary_id,
      workerName: data.worker_name,
      workerType: data.worker_type,
      workerRole: data.worker_role,
      workerCompany: data.worker_company,
      checkInTime: data.check_in_time,
      checkOutTime: data.check_out_time,
      hoursWorked: parseFloat(data.hours_worked) || 0,
      overtimeHours: parseFloat(data.overtime_hours) || 0,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapToWorkItem(data: any): WorkItem {
    return {
      id: data.id,
      diaryId: data.diary_id,
      description: data.description,
      category: data.category,
      location: data.location,
      taskId: data.task_id,
      progressPercentage: data.progress_percentage,
      progressNotes: data.progress_notes,
      hoursSpent: parseFloat(data.hours_spent) || 0,
      displayOrder: data.display_order,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      task: data.task ? {
        id: data.task.id,
        title: data.task.title,
        status: data.task.status,
        progress: data.task.progress,
      } : undefined,
    };
  }
}
```

---

## 🗃️ Store 設計 (Angular Signals)

### DiaryStore

```typescript
// src/app/features/blueprint/data-access/stores/diary.store.ts

import { Injectable, inject, computed, signal } from '@angular/core';
import { DiaryRepository } from '../repositories/diary.repository';
import {
  Diary,
  DiaryQueryParams,
  CreateDiaryRequest,
  UpdateDiaryRequest,
  CreateAttendanceRequest,
  CreateWorkItemRequest,
  DiaryStatistics,
  DIARY_STATUS,
} from '../../domain';

interface DiaryState {
  diaries: Diary[];
  currentDiary: Diary | null;
  calendarData: { date: string; weather: string; status: string; hasPhotos: boolean }[];
  statistics: DiaryStatistics | null;
  loading: boolean;
  error: string | null;
  total: number;
  currentPage: number;
  pageSize: number;
}

@Injectable({ providedIn: 'root' })
export class DiaryStore {
  private readonly repository = inject(DiaryRepository);

  // Private state
  private readonly _state = signal<DiaryState>({
    diaries: [],
    currentDiary: null,
    calendarData: [],
    statistics: null,
    loading: false,
    error: null,
    total: 0,
    currentPage: 1,
    pageSize: 20,
  });

  // Public selectors
  readonly diaries = computed(() => this._state().diaries);
  readonly currentDiary = computed(() => this._state().currentDiary);
  readonly calendarData = computed(() => this._state().calendarData);
  readonly statistics = computed(() => this._state().statistics);
  readonly loading = computed(() => this._state().loading);
  readonly error = computed(() => this._state().error);
  readonly total = computed(() => this._state().total);
  readonly currentPage = computed(() => this._state().currentPage);
  readonly pageSize = computed(() => this._state().pageSize);

  // Computed values
  readonly draftDiaries = computed(() =>
    this._state().diaries.filter(d => d.status === DIARY_STATUS.DRAFT)
  );

  readonly submittedDiaries = computed(() =>
    this._state().diaries.filter(d => d.status === DIARY_STATUS.SUBMITTED)
  );

  readonly approvedDiaries = computed(() =>
    this._state().diaries.filter(d => d.status === DIARY_STATUS.APPROVED)
  );

  readonly currentDiaryPhotos = computed(() =>
    this._state().currentDiary?.photos ?? []
  );

  readonly currentDiaryAttendance = computed(() =>
    this._state().currentDiary?.attendance ?? []
  );

  readonly currentDiaryWorkItems = computed(() =>
    this._state().currentDiary?.workItems ?? []
  );

  readonly totalWorkHours = computed(() =>
    this.currentDiaryAttendance().reduce((sum, a) => sum + a.hoursWorked, 0)
  );

  readonly totalOvertimeHours = computed(() =>
    this.currentDiaryAttendance().reduce((sum, a) => sum + a.overtimeHours, 0)
  );

  // ============================================
  // Actions
  // ============================================

  async loadDiaries(params: DiaryQueryParams): Promise<void> {
    this._state.update(s => ({ ...s, loading: true, error: null }));
    try {
      const { data, total } = await this.repository.findAll(params);
      this._state.update(s => ({
        ...s,
        diaries: data,
        total,
        currentPage: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
        loading: false,
      }));
    } catch (error) {
      this._state.update(s => ({
        ...s,
        loading: false,
        error: '載入日誌失敗，請稍後再試',
      }));
      console.error('[DiaryStore] loadDiaries error:', error);
    }
  }

  async loadDiaryByDate(workspaceId: string, date: string): Promise<void> {
    this._state.update(s => ({ ...s, loading: true, error: null }));
    try {
      const diary = await this.repository.findByDate(workspaceId, date);
      this._state.update(s => ({
        ...s,
        currentDiary: diary,
        loading: false,
      }));
    } catch (error) {
      this._state.update(s => ({
        ...s,
        loading: false,
        error: '載入日誌失敗',
      }));
      console.error('[DiaryStore] loadDiaryByDate error:', error);
    }
  }

  async loadCalendarData(workspaceId: string, year: number, month: number): Promise<void> {
    try {
      const data = await this.repository.getCalendarData(workspaceId, year, month);
      this._state.update(s => ({ ...s, calendarData: data }));
    } catch (error) {
      console.error('[DiaryStore] loadCalendarData error:', error);
    }
  }

  async createDiary(req: CreateDiaryRequest & { blueprintId: string }): Promise<Diary | null> {
    this._state.update(s => ({ ...s, loading: true, error: null }));
    try {
      const diary = await this.repository.create(req);
      this._state.update(s => ({
        ...s,
        diaries: [diary, ...s.diaries],
        currentDiary: diary,
        loading: false,
      }));
      return diary;
    } catch (error) {
      this._state.update(s => ({
        ...s,
        loading: false,
        error: '創建日誌失敗',
      }));
      console.error('[DiaryStore] createDiary error:', error);
      return null;
    }
  }

  async updateDiary(id: string, req: UpdateDiaryRequest): Promise<void> {
    this._state.update(s => ({ ...s, loading: true, error: null }));
    try {
      const updated = await this.repository.update(id, req);
      this._state.update(s => ({
        ...s,
        diaries: s.diaries.map(d => d.id === id ? updated : d),
        currentDiary: s.currentDiary?.id === id ? { ...s.currentDiary, ...updated } : s.currentDiary,
        loading: false,
      }));
    } catch (error) {
      this._state.update(s => ({
        ...s,
        loading: false,
        error: '更新日誌失敗',
      }));
      console.error('[DiaryStore] updateDiary error:', error);
    }
  }

  async submitDiary(id: string): Promise<void> {
    try {
      const updated = await this.repository.submit(id);
      this._state.update(s => ({
        ...s,
        diaries: s.diaries.map(d => d.id === id ? updated : d),
        currentDiary: s.currentDiary?.id === id ? updated : s.currentDiary,
      }));
    } catch (error) {
      this._state.update(s => ({ ...s, error: '提交日誌失敗' }));
      console.error('[DiaryStore] submitDiary error:', error);
    }
  }

  async approveDiary(id: string, approved: boolean): Promise<void> {
    try {
      const updated = await this.repository.approve(id, approved);
      this._state.update(s => ({
        ...s,
        diaries: s.diaries.map(d => d.id === id ? updated : d),
        currentDiary: s.currentDiary?.id === id ? updated : s.currentDiary,
      }));
    } catch (error) {
      this._state.update(s => ({ ...s, error: approved ? '審核日誌失敗' : '退回日誌失敗' }));
      console.error('[DiaryStore] approveDiary error:', error);
    }
  }

  async copyFromPrevious(workspaceId: string, targetDate: string): Promise<Diary | null> {
    this._state.update(s => ({ ...s, loading: true, error: null }));
    try {
      const diary = await this.repository.copyFromPrevious(workspaceId, targetDate);
      if (diary) {
        this._state.update(s => ({
          ...s,
          diaries: [diary, ...s.diaries],
          currentDiary: diary,
          loading: false,
        }));
      } else {
        this._state.update(s => ({
          ...s,
          loading: false,
          error: '找不到前一日日誌可供複製',
        }));
      }
      return diary;
    } catch (error) {
      this._state.update(s => ({
        ...s,
        loading: false,
        error: '複製日誌失敗',
      }));
      console.error('[DiaryStore] copyFromPrevious error:', error);
      return null;
    }
  }

  async addAttendance(diaryId: string, req: CreateAttendanceRequest): Promise<void> {
    try {
      const attendance = await this.repository.addAttendance(diaryId, req);
      this._state.update(s => ({
        ...s,
        currentDiary: s.currentDiary ? {
          ...s.currentDiary,
          attendance: [...(s.currentDiary.attendance ?? []), attendance],
          workerCount: (s.currentDiary.workerCount ?? 0) + 1,
        } : null,
      }));
    } catch (error) {
      this._state.update(s => ({ ...s, error: '新增出勤記錄失敗' }));
      console.error('[DiaryStore] addAttendance error:', error);
    }
  }

  async addWorkItem(diaryId: string, req: CreateWorkItemRequest): Promise<void> {
    try {
      const workItem = await this.repository.addWorkItem(diaryId, req);
      this._state.update(s => ({
        ...s,
        currentDiary: s.currentDiary ? {
          ...s.currentDiary,
          workItems: [...(s.currentDiary.workItems ?? []), workItem],
        } : null,
      }));
    } catch (error) {
      this._state.update(s => ({ ...s, error: '新增工作項目失敗' }));
      console.error('[DiaryStore] addWorkItem error:', error);
    }
  }

  async loadStatistics(workspaceId: string, dateFrom: string, dateTo: string): Promise<void> {
    try {
      const stats = await this.repository.getStatistics(workspaceId, dateFrom, dateTo);
      this._state.update(s => ({ ...s, statistics: stats }));
    } catch (error) {
      console.error('[DiaryStore] loadStatistics error:', error);
    }
  }

  setCurrentDiary(diary: Diary | null): void {
    this._state.update(s => ({ ...s, currentDiary: diary }));
  }

  clearError(): void {
    this._state.update(s => ({ ...s, error: null }));
  }

  reset(): void {
    this._state.set({
      diaries: [],
      currentDiary: null,
      calendarData: [],
      statistics: null,
      loading: false,
      error: null,
      total: 0,
      currentPage: 1,
      pageSize: 20,
    });
  }
}
```

---

## 🧪 測試策略

### 單元測試

```typescript
// src/app/features/blueprint/data-access/stores/diary.store.spec.ts

import { TestBed } from '@angular/core/testing';
import { DiaryStore } from './diary.store';
import { DiaryRepository } from '../repositories/diary.repository';

describe('DiaryStore', () => {
  let store: DiaryStore;
  let mockRepository: jasmine.SpyObj<DiaryRepository>;

  const mockDiary = {
    id: 'diary-1',
    blueprintId: 'bp-1',
    workspaceId: 'ws-1',
    diaryDate: '2025-01-15',
    weather: 'sunny',
    status: 'draft',
  };

  beforeEach(() => {
    mockRepository = jasmine.createSpyObj('DiaryRepository', [
      'findByDate',
      'findAll',
      'create',
      'update',
      'submit',
      'approve',
      'copyFromPrevious',
      'addAttendance',
      'addWorkItem',
    ]);

    TestBed.configureTestingModule({
      providers: [
        DiaryStore,
        { provide: DiaryRepository, useValue: mockRepository },
      ],
    });

    store = TestBed.inject(DiaryStore);
  });

  describe('loadDiaryByDate', () => {
    it('loadDiaryByDate_whenDateValid_shouldLoadDiary', async () => {
      mockRepository.findByDate.and.resolveTo(mockDiary as any);

      await store.loadDiaryByDate('ws-1', '2025-01-15');

      expect(store.currentDiary()).toEqual(mockDiary as any);
      expect(store.loading()).toBeFalse();
      expect(store.error()).toBeNull();
    });

    it('loadDiaryByDate_whenNoDiary_shouldSetNull', async () => {
      mockRepository.findByDate.and.resolveTo(null);

      await store.loadDiaryByDate('ws-1', '2025-01-15');

      expect(store.currentDiary()).toBeNull();
    });
  });

  describe('submitDiary', () => {
    it('submitDiary_whenDraft_shouldUpdateStatus', async () => {
      const submittedDiary = { ...mockDiary, status: 'submitted' };
      mockRepository.submit.and.resolveTo(submittedDiary as any);

      await store.submitDiary('diary-1');

      expect(mockRepository.submit).toHaveBeenCalledWith('diary-1');
    });
  });

  describe('copyFromPrevious', () => {
    it('copyFromPrevious_whenPreviousExists_shouldCreateCopy', async () => {
      const copiedDiary = { ...mockDiary, id: 'diary-2', diaryDate: '2025-01-16' };
      mockRepository.copyFromPrevious.and.resolveTo(copiedDiary as any);

      const result = await store.copyFromPrevious('ws-1', '2025-01-16');

      expect(result).toEqual(copiedDiary as any);
      expect(store.currentDiary()).toEqual(copiedDiary as any);
    });

    it('copyFromPrevious_whenNoPrevious_shouldSetError', async () => {
      mockRepository.copyFromPrevious.and.resolveTo(null);

      const result = await store.copyFromPrevious('ws-1', '2025-01-16');

      expect(result).toBeNull();
      expect(store.error()).toBe('找不到前一日日誌可供複製');
    });
  });
});
```

### E2E 測試

```typescript
// e2e/diary/diary-management.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Diary Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/workspace/ws-1/diary');
  });

  test('should create a new diary entry', async ({ page }) => {
    // 點擊新增按鈕
    await page.click('[data-testid="create-diary-btn"]');
    
    // 填寫日期
    await page.fill('[data-testid="diary-date"]', '2025-01-15');
    
    // 選擇天氣
    await page.click('[data-testid="weather-select"]');
    await page.click('[data-testid="weather-sunny"]');
    
    // 填寫工作摘要
    await page.fill('[data-testid="work-summary"]', '今日完成一樓鋼筋綁紮');
    
    // 儲存
    await page.click('[data-testid="save-diary-btn"]');
    
    // 驗證成功
    await expect(page.locator('[data-testid="diary-saved-toast"]')).toBeVisible();
  });

  test('should add attendance record', async ({ page }) => {
    // 開啟現有日誌
    await page.click('[data-testid="diary-item-2025-01-15"]');
    
    // 點擊新增出勤
    await page.click('[data-testid="add-attendance-btn"]');
    
    // 填寫工人資料
    await page.fill('[data-testid="worker-name"]', '張三');
    await page.selectOption('[data-testid="worker-type"]', 'regular');
    await page.fill('[data-testid="check-in-time"]', '08:00');
    await page.fill('[data-testid="check-out-time"]', '17:00');
    
    // 儲存
    await page.click('[data-testid="save-attendance-btn"]');
    
    // 驗證出勤記錄已新增
    await expect(page.locator('[data-testid="attendance-item-張三"]')).toBeVisible();
    await expect(page.locator('[data-testid="hours-worked"]')).toContainText('9');
  });

  test('should display calendar view correctly', async ({ page }) => {
    // 切換到月曆視圖
    await page.click('[data-testid="view-calendar"]');
    
    // 驗證月曆顯示
    await expect(page.locator('.nz-calendar')).toBeVisible();
    
    // 驗證有日誌的日期有標記
    await expect(page.locator('[data-testid="calendar-has-diary-15"]')).toHaveClass(/has-diary/);
  });

  test('should copy from previous diary', async ({ page }) => {
    // 選擇新日期
    await page.click('[data-testid="diary-date-16"]');
    
    // 點擊複製按鈕
    await page.click('[data-testid="copy-previous-btn"]');
    
    // 確認複製
    await page.click('[data-testid="confirm-copy-btn"]');
    
    // 驗證內容已複製
    await expect(page.locator('[data-testid="work-summary"]')).not.toBeEmpty();
    await expect(page.locator('[data-testid="attendance-list"]')).not.toBeEmpty();
  });
});
```

---

## 📈 效能指標

| 指標 | 目標值 | 測量方式 |
|------|--------|----------|
| 日誌列表載入 | < 500ms | Lighthouse/DevTools |
| 日誌詳情載入 | < 300ms | API Response Time |
| 照片上傳（單張 5MB） | < 3s | 用戶體驗測試 |
| 月曆資料載入 | < 200ms | API Response Time |
| 出勤記錄新增 | < 100ms | UI 回應時間 |

---

## 📋 驗收檢查清單

### 資料庫
- [ ] `diaries` 資料表已建立且 RLS 正確
- [ ] `diary_photos` 資料表已建立
- [ ] `daily_attendance` 資料表已建立
- [ ] `work_items` 資料表已建立
- [ ] 索引已建立
- [ ] 觸發器正常運作

### 後端
- [ ] Repository 方法完整實作
- [ ] 錯誤處理完善
- [ ] 效能優化（分頁、索引）

### 前端
- [ ] DiaryStore 狀態管理正確
- [ ] 日誌 CRUD 功能完整
- [ ] 出勤記錄功能完整
- [ ] 工作項目功能完整
- [ ] 月曆視圖正確顯示
- [ ] 照片上傳整合完成

### 測試
- [ ] 單元測試覆蓋率 ≥ 80%
- [ ] E2E 測試覆蓋主要流程
- [ ] 效能測試通過

---

## 🚀 下一步

完成 SETC-04 後，進入 [SETC-05: 進度追蹤儀表板](./05-progress-dashboard-enhanced.setc.md)
