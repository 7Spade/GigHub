---
title: SETC-03：檔案管理系統（增強版）
status: implementable
created: 2025-11-27
version: 2.0.0
owners: []
progress: 0
due: null
prd_coverage:
  - GH-017: 檔案上傳
  - GH-018: 檔案管理
  - GH-019: 檔案共享
---

# SETC-03：檔案管理系統（增強版）

> **Phase 1.2: File Management System**
>
> 🎯 本文件為**可實施版本**，包含完整的技術規格、資料庫設計、程式碼範例和測試策略。

---

## 📋 技術架構定位

### 三層架構位置

```
┌─────────────────────────────────────────────────┐
│              🏢 基礎層 (Foundation)               │
│  帳戶體系 | 組織管理 | 認證授權 | 權限系統         │
└─────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────┐
│              📦 容器層 (Container)               │
│  藍圖系統 | 工作區 | 分支管理 | 成員角色          │
└─────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────┐
│              🏗️ 業務層 (Business)               │ ← 本 SETC 範圍
│  任務 | 日誌 | 📁檔案 | 驗收 | 進度              │
└─────────────────────────────────────────────────┘
```

### 容器層基礎設施使用清單

| # | 基礎設施 | 本階段使用 | 說明 |
|---|----------|-----------|------|
| 1 | 上下文注入 | ✅ 使用 | 藍圖上下文獲取 |
| 2 | 權限系統 (RBAC) | ✅ 使用 | 檔案權限控制 |
| 3 | 時間軸服務 | ✅ 使用 | 檔案操作記錄 |
| 4 | 通知中心 | ✅ 使用 | 檔案分享通知 |
| 5 | 事件總線 | ✅ 使用 | 檔案變更事件 |
| 6 | 搜尋引擎 | ✅ 使用 | 檔案名稱搜尋 |
| 7 | 關聯管理 | ✅ 核心 | 檔案與任務/日誌關聯 |
| 8 | 資料隔離 (RLS) | ✅ 核心 | 檔案 RLS 政策 |
| 9 | 生命週期 | ✅ 使用 | 檔案版本管理 |
| 10 | 配置中心 | ✅ 使用 | 儲存配置 |
| 11 | 元數據系統 | ✅ 使用 | 檔案 EXIF 元數據 |
| 12 | API 閘道 | ⬜ 不需要 | - |

---

## 📊 階段資訊

| 屬性 | 值 |
|------|-----|
| **階段編號** | P1.2 / SETC-03 |
| **預計週數** | 2 週 |
| **總任務數** | 12 |
| **前置條件** | SETC-02 任務系統完成 |
| **完成目標** | 檔案管理系統完整實作 |
| **PRD 對應** | GH-017 ~ GH-019 |

---

## 🎯 階段目標

1. ✅ 支援圖片、文件、工程圖上傳（最大 100MB）
2. ✅ 檔案與任務/日誌關聯
3. ✅ 檔案版本控制
4. ✅ 圖片預覽與縮圖生成
5. ✅ 檔案權限控制
6. ✅ 檔案分享功能

---

## 💾 資料庫設計

### `files` 主資料表

```sql
-- Migration: 20250101_010_create_files.sql
-- 描述: 檔案管理主資料表

-- 創建枚舉類型
DO $$ BEGIN
    CREATE TYPE file_type AS ENUM ('image', 'document', 'spreadsheet', 'cad', 'video', 'audio', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE file_status AS ENUM ('uploading', 'processing', 'active', 'archived', 'deleted');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 創建表
CREATE TABLE files (
    -- 主鍵
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 所屬藍圖
    blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
    
    -- 檔案資訊
    name VARCHAR(255) NOT NULL,                    -- 原始檔名
    display_name VARCHAR(255),                      -- 顯示名稱（可自訂）
    description TEXT,                               -- 檔案描述
    
    -- 檔案類型
    file_type file_type NOT NULL DEFAULT 'other',
    mime_type VARCHAR(100) NOT NULL,               -- MIME 類型
    extension VARCHAR(20),                          -- 副檔名
    
    -- 儲存資訊
    storage_path VARCHAR(500) NOT NULL,            -- Supabase Storage 路徑
    storage_bucket VARCHAR(100) NOT NULL DEFAULT 'files',
    size_bytes BIGINT NOT NULL,                    -- 檔案大小（bytes）
    
    -- 縮圖（圖片類型）
    thumbnail_path VARCHAR(500),                   -- 縮圖路徑
    preview_path VARCHAR(500),                     -- 預覽圖路徑
    
    -- 圖片元數據
    image_metadata JSONB DEFAULT '{}',             -- 寬高、EXIF 等
    
    -- 版本控制
    version INTEGER NOT NULL DEFAULT 1,
    parent_version_id UUID REFERENCES files(id),   -- 上一版本
    is_latest BOOLEAN NOT NULL DEFAULT true,
    
    -- 分類與標籤
    folder_path VARCHAR(500) DEFAULT '/',          -- 虛擬資料夾路徑
    tags TEXT[] DEFAULT '{}',
    
    -- 關聯（使用中間表管理，此處為快速查詢的冗餘欄位）
    linked_task_count INTEGER DEFAULT 0,
    linked_diary_count INTEGER DEFAULT 0,
    
    -- Hash 用於去重
    file_hash VARCHAR(64),                         -- SHA-256 hash
    
    -- 狀態
    status file_status NOT NULL DEFAULT 'uploading',
    
    -- 分享設定
    is_shared BOOLEAN DEFAULT false,
    shared_link_token VARCHAR(64),
    shared_link_expires_at TIMESTAMPTZ,
    shared_link_password_hash VARCHAR(255),
    
    -- 下載統計
    download_count INTEGER DEFAULT 0,
    last_downloaded_at TIMESTAMPTZ,
    
    -- 審計欄位
    created_by UUID NOT NULL REFERENCES accounts(id),
    updated_by UUID REFERENCES accounts(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    
    -- 約束
    CONSTRAINT files_name_not_empty CHECK (length(trim(name)) > 0),
    CONSTRAINT files_size_valid CHECK (size_bytes > 0 AND size_bytes <= 104857600), -- 100MB
    CONSTRAINT files_storage_path_not_empty CHECK (length(trim(storage_path)) > 0)
);

-- 索引
CREATE INDEX idx_files_blueprint ON files(blueprint_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_files_folder ON files(blueprint_id, folder_path) WHERE deleted_at IS NULL;
CREATE INDEX idx_files_type ON files(file_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_files_status ON files(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_files_hash ON files(file_hash) WHERE deleted_at IS NULL AND file_hash IS NOT NULL;
CREATE INDEX idx_files_created_at ON files(blueprint_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_files_tags ON files USING GIN(tags) WHERE deleted_at IS NULL;
CREATE INDEX idx_files_shared ON files(shared_link_token) WHERE deleted_at IS NULL AND is_shared = true;

-- 全文搜尋索引
CREATE INDEX idx_files_search ON files 
USING GIN(to_tsvector('chinese', coalesce(name, '') || ' ' || coalesce(display_name, '') || ' ' || coalesce(description, '')))
WHERE deleted_at IS NULL;

-- 觸發器
CREATE TRIGGER trg_files_updated_at
    BEFORE UPDATE ON files
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 註解
COMMENT ON TABLE files IS '檔案管理主資料表';
COMMENT ON COLUMN files.storage_path IS 'Supabase Storage 中的檔案路徑';
COMMENT ON COLUMN files.image_metadata IS 'JSON 格式的圖片元數據，包含寬高、EXIF 等';
```

### `file_links` 關聯表

```sql
-- Migration: 20250101_011_create_file_links.sql
-- 描述: 檔案與其他實體的關聯表

-- 創建枚舉
DO $$ BEGIN
    CREATE TYPE linked_entity_type AS ENUM ('task', 'diary', 'inspection', 'issue', 'comment');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE file_links (
    -- 主鍵
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 檔案
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    
    -- 關聯實體
    entity_type linked_entity_type NOT NULL,
    entity_id UUID NOT NULL,
    
    -- 關聯說明
    link_description TEXT,
    link_position INTEGER DEFAULT 0,              -- 排序位置
    
    -- 是否為主要附件
    is_primary BOOLEAN DEFAULT false,
    
    -- 審計
    created_by UUID NOT NULL REFERENCES accounts(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- 唯一約束：同一檔案不能重複關聯同一實體
    UNIQUE(file_id, entity_type, entity_id)
);

-- 索引
CREATE INDEX idx_file_links_file ON file_links(file_id);
CREATE INDEX idx_file_links_entity ON file_links(entity_type, entity_id);
CREATE INDEX idx_file_links_primary ON file_links(entity_type, entity_id) WHERE is_primary = true;

-- 觸發器：更新 files 表的關聯計數
CREATE OR REPLACE FUNCTION update_file_link_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.entity_type = 'task' THEN
            UPDATE files SET linked_task_count = linked_task_count + 1 WHERE id = NEW.file_id;
        ELSIF NEW.entity_type = 'diary' THEN
            UPDATE files SET linked_diary_count = linked_diary_count + 1 WHERE id = NEW.file_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.entity_type = 'task' THEN
            UPDATE files SET linked_task_count = GREATEST(0, linked_task_count - 1) WHERE id = OLD.file_id;
        ELSIF OLD.entity_type = 'diary' THEN
            UPDATE files SET linked_diary_count = GREATEST(0, linked_diary_count - 1) WHERE id = OLD.file_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_file_link_count
    AFTER INSERT OR DELETE ON file_links
    FOR EACH ROW
    EXECUTE FUNCTION update_file_link_count();
```

### RLS 政策

```sql
-- 啟用 RLS
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_links ENABLE ROW LEVEL SECURITY;

-- files RLS 政策

-- SELECT：藍圖成員可查看
CREATE POLICY "files_select_policy"
ON files FOR SELECT
USING (
    deleted_at IS NULL AND
    has_blueprint_permission(blueprint_id, 'file:read')
);

-- INSERT：有上傳權限的藍圖成員可上傳
CREATE POLICY "files_insert_policy"
ON files FOR INSERT
WITH CHECK (
    has_blueprint_permission(blueprint_id, 'file:upload')
);

-- UPDATE：檔案擁有者或管理員可更新
CREATE POLICY "files_update_policy"
ON files FOR UPDATE
USING (
    deleted_at IS NULL AND
    (created_by = auth.uid() OR has_blueprint_permission(blueprint_id, 'file:manage'))
);

-- DELETE：檔案擁有者或管理員可刪除
CREATE POLICY "files_delete_policy"
ON files FOR DELETE
USING (
    deleted_at IS NULL AND
    (created_by = auth.uid() OR has_blueprint_permission(blueprint_id, 'file:delete'))
);

-- file_links RLS 政策

CREATE POLICY "file_links_select_policy"
ON file_links FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM files f 
        WHERE f.id = file_id 
        AND f.deleted_at IS NULL
        AND has_blueprint_permission(f.blueprint_id, 'file:read')
    )
);

CREATE POLICY "file_links_insert_policy"
ON file_links FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM files f 
        WHERE f.id = file_id 
        AND f.deleted_at IS NULL
        AND has_blueprint_permission(f.blueprint_id, 'file:upload')
    )
);

CREATE POLICY "file_links_delete_policy"
ON file_links FOR DELETE
USING (
    created_by = auth.uid() OR
    EXISTS (
        SELECT 1 FROM files f 
        WHERE f.id = file_id 
        AND f.deleted_at IS NULL
        AND has_blueprint_permission(f.blueprint_id, 'file:manage')
    )
);
```

---

## 📦 TypeScript 類型定義

### Domain Types

```typescript
// src/app/features/blueprint/domain/types/file.types.ts

// ============================================
// 枚舉與常數
// ============================================

export const FILE_TYPE = {
  IMAGE: 'image',
  DOCUMENT: 'document',
  SPREADSHEET: 'spreadsheet',
  CAD: 'cad',
  VIDEO: 'video',
  AUDIO: 'audio',
  OTHER: 'other',
} as const;

export type FileType = typeof FILE_TYPE[keyof typeof FILE_TYPE];

export const FILE_STATUS = {
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  DELETED: 'deleted',
} as const;

export type FileStatus = typeof FILE_STATUS[keyof typeof FILE_STATUS];

export const LINKED_ENTITY_TYPE = {
  TASK: 'task',
  DIARY: 'diary',
  INSPECTION: 'inspection',
  ISSUE: 'issue',
  COMMENT: 'comment',
} as const;

export type LinkedEntityType = typeof LINKED_ENTITY_TYPE[keyof typeof LINKED_ENTITY_TYPE];

// 檔案大小限制（bytes）
export const FILE_SIZE_LIMITS = {
  IMAGE: 10 * 1024 * 1024,      // 10 MB
  DOCUMENT: 50 * 1024 * 1024,   // 50 MB
  CAD: 100 * 1024 * 1024,       // 100 MB
  DEFAULT: 100 * 1024 * 1024,   // 100 MB
} as const;

// 允許的 MIME 類型
export const ALLOWED_MIME_TYPES: Record<FileType, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  spreadsheet: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  cad: ['application/acad', 'application/x-acad', 'image/vnd.dwg', 'image/x-dwg'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
  other: [],
};

// ============================================
// 核心實體類型
// ============================================

/**
 * 圖片元數據
 */
export interface ImageMetadata {
  width?: number;
  height?: number;
  orientation?: number;
  takenAt?: string;
  location?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  camera?: {
    make?: string;
    model?: string;
  };
  [key: string]: unknown;
}

/**
 * 檔案實體
 */
export interface FileEntity {
  id: string;
  blueprintId: string;
  
  // 檔案資訊
  name: string;
  displayName: string | null;
  description: string | null;
  
  // 類型
  fileType: FileType;
  mimeType: string;
  extension: string | null;
  
  // 儲存
  storagePath: string;
  storageBucket: string;
  sizeBytes: number;
  
  // 縮圖
  thumbnailPath: string | null;
  previewPath: string | null;
  
  // 元數據
  imageMetadata: ImageMetadata;
  
  // 版本
  version: number;
  parentVersionId: string | null;
  isLatest: boolean;
  
  // 分類
  folderPath: string;
  tags: string[];
  
  // 關聯計數
  linkedTaskCount: number;
  linkedDiaryCount: number;
  
  // Hash
  fileHash: string | null;
  
  // 狀態
  status: FileStatus;
  
  // 分享
  isShared: boolean;
  sharedLinkToken: string | null;
  sharedLinkExpiresAt: string | null;
  
  // 統計
  downloadCount: number;
  lastDownloadedAt: string | null;
  
  // 審計
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/**
 * 檔案關聯
 */
export interface FileLink {
  id: string;
  fileId: string;
  entityType: LinkedEntityType;
  entityId: string;
  linkDescription: string | null;
  linkPosition: number;
  isPrimary: boolean;
  createdBy: string;
  createdAt: string;
}

// ============================================
// DTO 類型
// ============================================

/**
 * 上傳請求
 */
export interface UploadFileRequest {
  blueprintId: string;
  file: File;
  displayName?: string;
  description?: string;
  folderPath?: string;
  tags?: string[];
  linkedEntity?: {
    type: LinkedEntityType;
    id: string;
  };
}

/**
 * 上傳進度
 */
export interface UploadProgress {
  fileId: string;
  fileName: string;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  error?: string;
}

/**
 * 更新檔案請求
 */
export interface UpdateFileRequest {
  displayName?: string;
  description?: string | null;
  folderPath?: string;
  tags?: string[];
}

/**
 * 檔案查詢參數
 */
export interface FileQueryParams {
  blueprintId: string;
  folderPath?: string;
  fileType?: FileType;
  tags?: string[];
  status?: FileStatus;
  search?: string;
  linkedEntityType?: LinkedEntityType;
  linkedEntityId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'name' | 'createdAt' | 'sizeBytes';
  sortOrder?: 'asc' | 'desc';
}

/**
 * 檔案列表響應
 */
export interface FileListResponse {
  items: FileEntity[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * 創建分享連結請求
 */
export interface CreateShareLinkRequest {
  expiresInDays?: number;
  password?: string;
}

/**
 * 分享連結響應
 */
export interface ShareLinkResponse {
  url: string;
  token: string;
  expiresAt: string | null;
  hasPassword: boolean;
}
```

---

## 🔧 Repository 層設計

### FileRepository

```typescript
// src/app/features/blueprint/data-access/repositories/file.repository.ts

import { Injectable, inject } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { SupabaseService } from '@core';
import {
  FileEntity,
  FileLink,
  UploadFileRequest,
  UpdateFileRequest,
  FileQueryParams,
  FileListResponse,
  CreateShareLinkRequest,
  ShareLinkResponse,
} from '../../domain';

@Injectable({ providedIn: 'root' })
export class FileRepository {
  private readonly supabase = inject(SupabaseService);
  private readonly TABLE = 'files';
  private readonly LINKS_TABLE = 'file_links';
  private readonly BUCKET = 'files';

  /**
   * 上傳檔案
   */
  async upload(request: UploadFileRequest, userId: string): Promise<FileEntity> {
    const { blueprintId, file, displayName, description, folderPath, tags } = request;
    
    // 1. 生成儲存路徑
    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const storagePath = `${blueprintId}/${folderPath || 'root'}/${fileName}`;
    
    // 2. 上傳到 Supabase Storage
    const { error: uploadError } = await this.supabase.client.storage
      .from(this.BUCKET)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      });
    
    if (uploadError) throw uploadError;
    
    // 3. 判斷檔案類型
    const fileType = this.detectFileType(file.type);
    
    // 4. 創建資料庫記錄
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .insert({
        blueprint_id: blueprintId,
        name: file.name,
        display_name: displayName || file.name,
        description: description || null,
        file_type: fileType,
        mime_type: file.type,
        extension: fileExt,
        storage_path: storagePath,
        storage_bucket: this.BUCKET,
        size_bytes: file.size,
        folder_path: folderPath || '/',
        tags: tags || [],
        status: 'processing',
        created_by: userId,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // 5. 如果是圖片，生成縮圖（異步處理）
    if (fileType === 'image') {
      this.generateThumbnailAsync(data.id, storagePath);
    }
    
    // 6. 更新狀態為 active
    await this.supabase.client
      .from(this.TABLE)
      .update({ status: 'active' })
      .eq('id', data.id);
    
    return this.mapToCamelCase(data);
  }

  /**
   * 查詢檔案列表
   */
  findAll(params: FileQueryParams): Observable<FileListResponse> {
    const {
      blueprintId,
      folderPath,
      fileType,
      tags,
      status = 'active',
      search,
      linkedEntityType,
      linkedEntityId,
      page = 1,
      pageSize = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    return from(
      (async () => {
        let query = this.supabase.client
          .from(this.TABLE)
          .select('*', { count: 'exact' })
          .eq('blueprint_id', blueprintId)
          .eq('status', status)
          .is('deleted_at', null);

        if (folderPath) query = query.eq('folder_path', folderPath);
        if (fileType) query = query.eq('file_type', fileType);
        if (tags && tags.length > 0) query = query.overlaps('tags', tags);
        if (search) query = query.or(`name.ilike.%${search}%,display_name.ilike.%${search}%`);

        // 如果需要按關聯實體篩選
        if (linkedEntityType && linkedEntityId) {
          const { data: links } = await this.supabase.client
            .from(this.LINKS_TABLE)
            .select('file_id')
            .eq('entity_type', linkedEntityType)
            .eq('entity_id', linkedEntityId);
          
          const fileIds = links?.map(l => l.file_id) || [];
          if (fileIds.length > 0) {
            query = query.in('id', fileIds);
          } else {
            return { items: [], total: 0, page, pageSize, hasMore: false };
          }
        }

        const sortColumn = this.toSnakeCase(sortBy);
        query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

        const start = (page - 1) * pageSize;
        query = query.range(start, start + pageSize - 1);

        const { data, error, count } = await query;
        if (error) throw error;

        return {
          items: this.mapToCamelCaseArray(data || []),
          total: count || 0,
          page,
          pageSize,
          hasMore: (count || 0) > page * pageSize,
        };
      })()
    );
  }

  /**
   * 獲取檔案下載 URL
   */
  async getDownloadUrl(fileId: string): Promise<string> {
    const file = await this.findById(fileId).toPromise();
    if (!file) throw new Error('檔案不存在');

    const { data, error } = await this.supabase.client.storage
      .from(file.storageBucket)
      .createSignedUrl(file.storagePath, 3600); // 1 小時有效

    if (error) throw error;
    
    // 更新下載計數
    await this.supabase.client
      .from(this.TABLE)
      .update({ 
        download_count: file.downloadCount + 1,
        last_downloaded_at: new Date().toISOString(),
      })
      .eq('id', fileId);

    return data.signedUrl;
  }

  /**
   * 創建分享連結
   */
  async createShareLink(fileId: string, request: CreateShareLinkRequest): Promise<ShareLinkResponse> {
    const token = crypto.randomUUID().replace(/-/g, '');
    const expiresAt = request.expiresInDays
      ? new Date(Date.now() + request.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    await this.supabase.client
      .from(this.TABLE)
      .update({
        is_shared: true,
        shared_link_token: token,
        shared_link_expires_at: expiresAt,
        // 如果有密碼，需要 hash 處理（實際應用中應使用 bcrypt）
        shared_link_password_hash: request.password || null,
      })
      .eq('id', fileId);

    return {
      url: `${window.location.origin}/shared/${token}`,
      token,
      expiresAt,
      hasPassword: !!request.password,
    };
  }

  /**
   * 關聯檔案到實體
   */
  async linkToEntity(
    fileId: string,
    entityType: string,
    entityId: string,
    userId: string,
    options?: { description?: string; isPrimary?: boolean }
  ): Promise<FileLink> {
    const { data, error } = await this.supabase.client
      .from(this.LINKS_TABLE)
      .insert({
        file_id: fileId,
        entity_type: entityType,
        entity_id: entityId,
        link_description: options?.description || null,
        is_primary: options?.isPrimary || false,
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapLinkToCamelCase(data);
  }

  /**
   * 取消關聯
   */
  async unlinkFromEntity(fileId: string, entityType: string, entityId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from(this.LINKS_TABLE)
      .delete()
      .eq('file_id', fileId)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId);

    if (error) throw error;
  }

  /**
   * 軟刪除檔案
   */
  async delete(fileId: string, userId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from(this.TABLE)
      .update({
        status: 'deleted',
        deleted_at: new Date().toISOString(),
        updated_by: userId,
      })
      .eq('id', fileId);

    if (error) throw error;
  }

  // ============================================
  // 私有輔助方法
  // ============================================

  findById(id: string): Observable<FileEntity | null> {
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
        return data ? this.mapToCamelCase(data) : null;
      })
    );
  }

  private detectFileType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf') || mimeType.includes('word')) return 'document';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'spreadsheet';
    if (mimeType.includes('dwg') || mimeType.includes('dxf') || mimeType.includes('acad')) return 'cad';
    return 'other';
  }

  private async generateThumbnailAsync(fileId: string, storagePath: string): Promise<void> {
    // 實際實現需要使用 Supabase Edge Function 或後端服務
    // 這裡僅為示範
    console.log(`[FileRepository] Generating thumbnail for ${fileId}`);
  }

  private mapToCamelCase(data: Record<string, unknown>): FileEntity {
    return {
      id: data.id as string,
      blueprintId: data.blueprint_id as string,
      name: data.name as string,
      displayName: data.display_name as string | null,
      description: data.description as string | null,
      fileType: data.file_type as FileEntity['fileType'],
      mimeType: data.mime_type as string,
      extension: data.extension as string | null,
      storagePath: data.storage_path as string,
      storageBucket: data.storage_bucket as string,
      sizeBytes: data.size_bytes as number,
      thumbnailPath: data.thumbnail_path as string | null,
      previewPath: data.preview_path as string | null,
      imageMetadata: data.image_metadata as FileEntity['imageMetadata'],
      version: data.version as number,
      parentVersionId: data.parent_version_id as string | null,
      isLatest: data.is_latest as boolean,
      folderPath: data.folder_path as string,
      tags: data.tags as string[],
      linkedTaskCount: data.linked_task_count as number,
      linkedDiaryCount: data.linked_diary_count as number,
      fileHash: data.file_hash as string | null,
      status: data.status as FileEntity['status'],
      isShared: data.is_shared as boolean,
      sharedLinkToken: data.shared_link_token as string | null,
      sharedLinkExpiresAt: data.shared_link_expires_at as string | null,
      downloadCount: data.download_count as number,
      lastDownloadedAt: data.last_downloaded_at as string | null,
      createdBy: data.created_by as string,
      updatedBy: data.updated_by as string | null,
      createdAt: data.created_at as string,
      updatedAt: data.updated_at as string,
      deletedAt: data.deleted_at as string | null,
    };
  }

  private mapToCamelCaseArray(data: Record<string, unknown>[]): FileEntity[] {
    return data.map(item => this.mapToCamelCase(item));
  }

  private mapLinkToCamelCase(data: Record<string, unknown>): FileLink {
    return {
      id: data.id as string,
      fileId: data.file_id as string,
      entityType: data.entity_type as FileLink['entityType'],
      entityId: data.entity_id as string,
      linkDescription: data.link_description as string | null,
      linkPosition: data.link_position as number,
      isPrimary: data.is_primary as boolean,
      createdBy: data.created_by as string,
      createdAt: data.created_at as string,
    };
  }

  private toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}
```

---

## 📊 Store 設計

### FileStore

```typescript
// src/app/features/blueprint/data-access/stores/file.store.ts

import { Injectable, inject, signal, computed } from '@angular/core';
import { FileRepository } from '../repositories/file.repository';
import { WorkspaceContextFacade } from '@core';
import {
  FileEntity,
  FileType,
  UploadFileRequest,
  UpdateFileRequest,
  FileQueryParams,
  UploadProgress,
  CreateShareLinkRequest,
  ShareLinkResponse,
} from '../../domain';

@Injectable({ providedIn: 'root' })
export class FileStore {
  private readonly repository = inject(FileRepository);
  private readonly contextFacade = inject(WorkspaceContextFacade);

  // ============================================
  // 私有狀態
  // ============================================

  private readonly _files = signal<FileEntity[]>([]);
  private readonly _selectedFile = signal<FileEntity | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _uploadQueue = signal<UploadProgress[]>([]);
  private readonly _currentFolder = signal('/');
  private readonly _pagination = signal({
    page: 1,
    pageSize: 20,
    total: 0,
    hasMore: false,
  });

  // ============================================
  // 公開唯讀狀態
  // ============================================

  readonly files = this._files.asReadonly();
  readonly selectedFile = this._selectedFile.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly uploadQueue = this._uploadQueue.asReadonly();
  readonly currentFolder = this._currentFolder.asReadonly();
  readonly pagination = this._pagination.asReadonly();

  // ============================================
  // 計算屬性
  // ============================================

  /** 是否有檔案 */
  readonly hasFiles = computed(() => this._files().length > 0);

  /** 是否正在上傳 */
  readonly isUploading = computed(() => 
    this._uploadQueue().some(u => u.status === 'uploading')
  );

  /** 按類型分組 */
  readonly filesByType = computed(() => {
    const grouped: Record<FileType, FileEntity[]> = {
      image: [],
      document: [],
      spreadsheet: [],
      cad: [],
      video: [],
      audio: [],
      other: [],
    };
    for (const file of this._files()) {
      grouped[file.fileType].push(file);
    }
    return grouped;
  });

  /** 圖片檔案 */
  readonly images = computed(() => this.filesByType().image);

  /** 文件檔案 */
  readonly documents = computed(() => this.filesByType().document);

  /** 總檔案大小 */
  readonly totalSize = computed(() => 
    this._files().reduce((sum, f) => sum + f.sizeBytes, 0)
  );

  /** 格式化的總大小 */
  readonly formattedTotalSize = computed(() => 
    this.formatBytes(this.totalSize())
  );

  // ============================================
  // 公開方法
  // ============================================

  /**
   * 載入檔案列表
   */
  async loadFiles(blueprintId: string, params?: Partial<FileQueryParams>): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const response = await this.repository.findAll({
        blueprintId,
        folderPath: this._currentFolder(),
        ...params,
      }).toPromise();

      if (response) {
        this._files.set(response.items);
        this._pagination.set({
          page: response.page,
          pageSize: response.pageSize,
          total: response.total,
          hasMore: response.hasMore,
        });
      }
    } catch (error) {
      this._error.set((error as Error).message || '載入檔案失敗');
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * 上傳檔案
   */
  async uploadFile(request: UploadFileRequest): Promise<FileEntity | null> {
    const userId = this.contextFacade.currentAccountId();
    if (!userId) {
      this._error.set('請先登入');
      return null;
    }

    const uploadId = crypto.randomUUID();
    
    // 加入上傳佇列
    this._uploadQueue.update(queue => [
      ...queue,
      {
        fileId: uploadId,
        fileName: request.file.name,
        status: 'uploading',
        progress: 0,
      },
    ]);

    try {
      const file = await this.repository.upload(request, userId);
      
      // 更新上傳狀態
      this._uploadQueue.update(queue =>
        queue.map(u => u.fileId === uploadId
          ? { ...u, status: 'completed', progress: 100, fileId: file.id }
          : u
        )
      );

      // 加入檔案列表
      this._files.update(files => [...files, file]);

      return file;
    } catch (error) {
      this._uploadQueue.update(queue =>
        queue.map(u => u.fileId === uploadId
          ? { ...u, status: 'failed', error: (error as Error).message }
          : u
        )
      );
      return null;
    }
  }

  /**
   * 批次上傳
   */
  async uploadFiles(requests: UploadFileRequest[]): Promise<FileEntity[]> {
    const results: FileEntity[] = [];
    for (const request of requests) {
      const file = await this.uploadFile(request);
      if (file) results.push(file);
    }
    return results;
  }

  /**
   * 獲取下載 URL
   */
  async getDownloadUrl(fileId: string): Promise<string> {
    return this.repository.getDownloadUrl(fileId);
  }

  /**
   * 創建分享連結
   */
  async createShareLink(fileId: string, request?: CreateShareLinkRequest): Promise<ShareLinkResponse | null> {
    try {
      const result = await this.repository.createShareLink(fileId, request || {});
      
      // 更新本地狀態
      this._files.update(files =>
        files.map(f => f.id === fileId ? { ...f, isShared: true } : f)
      );

      return result;
    } catch (error) {
      this._error.set((error as Error).message || '創建分享連結失敗');
      return null;
    }
  }

  /**
   * 刪除檔案
   */
  async deleteFile(fileId: string): Promise<boolean> {
    const userId = this.contextFacade.currentAccountId();
    if (!userId) return false;

    try {
      await this.repository.delete(fileId, userId);
      this._files.update(files => files.filter(f => f.id !== fileId));
      return true;
    } catch (error) {
      this._error.set((error as Error).message || '刪除檔案失敗');
      return false;
    }
  }

  /**
   * 切換資料夾
   */
  setCurrentFolder(folderPath: string): void {
    this._currentFolder.set(folderPath);
  }

  /**
   * 清除上傳佇列中已完成的項目
   */
  clearCompletedUploads(): void {
    this._uploadQueue.update(queue =>
      queue.filter(u => u.status !== 'completed' && u.status !== 'failed')
    );
  }

  /**
   * 重置狀態
   */
  reset(): void {
    this._files.set([]);
    this._selectedFile.set(null);
    this._loading.set(false);
    this._error.set(null);
    this._uploadQueue.set([]);
    this._currentFolder.set('/');
  }

  // ============================================
  // 私有輔助方法
  // ============================================

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
```

---

## 🧪 測試策略

### 單元測試範例

```typescript
// src/app/features/blueprint/data-access/stores/file.store.spec.ts

import { TestBed } from '@angular/core/testing';
import { FileStore } from './file.store';
import { FileRepository } from '../repositories/file.repository';
import { WorkspaceContextFacade } from '@core';
import { of } from 'rxjs';
import { FileEntity, FILE_STATUS, FILE_TYPE } from '../../domain';

describe('FileStore', () => {
  let store: FileStore;
  let repositoryMock: jasmine.SpyObj<FileRepository>;
  let contextFacadeMock: jasmine.SpyObj<WorkspaceContextFacade>;

  const mockFile: FileEntity = {
    id: 'file-1',
    blueprintId: 'blueprint-1',
    name: 'test.jpg',
    displayName: 'Test Image',
    description: null,
    fileType: FILE_TYPE.IMAGE,
    mimeType: 'image/jpeg',
    extension: 'jpg',
    storagePath: 'blueprint-1/root/test.jpg',
    storageBucket: 'files',
    sizeBytes: 1024000,
    thumbnailPath: null,
    previewPath: null,
    imageMetadata: {},
    version: 1,
    parentVersionId: null,
    isLatest: true,
    folderPath: '/',
    tags: [],
    linkedTaskCount: 0,
    linkedDiaryCount: 0,
    fileHash: null,
    status: FILE_STATUS.ACTIVE,
    isShared: false,
    sharedLinkToken: null,
    sharedLinkExpiresAt: null,
    downloadCount: 0,
    lastDownloadedAt: null,
    createdBy: 'user-1',
    updatedBy: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  };

  beforeEach(() => {
    repositoryMock = jasmine.createSpyObj('FileRepository', [
      'findAll',
      'upload',
      'delete',
      'getDownloadUrl',
      'createShareLink',
    ]);

    contextFacadeMock = jasmine.createSpyObj('WorkspaceContextFacade', [], {
      currentAccountId: jasmine.createSpy().and.returnValue('user-1'),
    });

    TestBed.configureTestingModule({
      providers: [
        FileStore,
        { provide: FileRepository, useValue: repositoryMock },
        { provide: WorkspaceContextFacade, useValue: contextFacadeMock },
      ],
    });

    store = TestBed.inject(FileStore);
  });

  describe('loadFiles', () => {
    it('loadFiles_whenSuccess_shouldUpdateFilesState', async () => {
      // Arrange
      const mockResponse = {
        items: [mockFile],
        total: 1,
        page: 1,
        pageSize: 20,
        hasMore: false,
      };
      repositoryMock.findAll.and.returnValue(of(mockResponse));

      // Act
      await store.loadFiles('blueprint-1');

      // Assert
      expect(store.files()).toEqual([mockFile]);
      expect(store.loading()).toBeFalse();
    });
  });

  describe('computed properties', () => {
    it('filesByType_shouldGroupFilesCorrectly', () => {
      // Arrange
      const imageFile = { ...mockFile, id: '1', fileType: FILE_TYPE.IMAGE };
      const docFile = { ...mockFile, id: '2', fileType: FILE_TYPE.DOCUMENT };
      store['_files'].set([imageFile, docFile] as FileEntity[]);

      // Act & Assert
      expect(store.images()).toEqual([imageFile]);
      expect(store.documents()).toEqual([docFile]);
    });

    it('totalSize_shouldCalculateCorrectly', () => {
      // Arrange
      const files = [
        { ...mockFile, id: '1', sizeBytes: 1000 },
        { ...mockFile, id: '2', sizeBytes: 2000 },
      ] as FileEntity[];
      store['_files'].set(files);

      // Act & Assert
      expect(store.totalSize()).toBe(3000);
    });
  });
});
```

---

## 📈 效能指標

| 指標 | 目標 | 測量方式 |
|------|------|---------|
| **檔案列表載入** | < 500ms | 首次載入時間 |
| **單檔上傳 (10MB)** | < 5s | 上傳完成時間 |
| **縮圖生成** | < 2s | 圖片處理時間 |
| **下載 URL 獲取** | < 200ms | API 響應時間 |
| **LCP** | < 2.5s | Core Web Vitals |

---

## ✅ 階段完成檢查清單

### 技術實作檢查
- [ ] files 資料表已建立
- [ ] file_links 關聯表已建立
- [ ] RLS 政策測試通過
- [ ] Supabase Storage 配置完成
- [ ] Repository 單元測試 ≥ 80%
- [ ] Store 單元測試 ≥ 80%

### 功能檢查
- [ ] 檔案上傳功能正常（圖片、文件、CAD）
- [ ] 縮圖生成正常
- [ ] 檔案關聯任務/日誌正常
- [ ] 分享連結功能正常
- [ ] 檔案版本控制正常

---

## 📚 下一階段

完成 SETC-03 後，進入 [SETC-04：施工日誌系統](./04-diary-system-enhanced.setc.md)
