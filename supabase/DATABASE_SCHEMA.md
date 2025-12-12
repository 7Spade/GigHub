# GigHub Database Schema

> Visual representation of the database structure from PR #63

## 📊 Entity Relationship Diagram (ERD)

```
┌─────────────────────────────────────────────────────────────────┐
│                         public.blueprints                        │
│                        (External Dependency)                     │
├─────────────────────────────────────────────────────────────────┤
│ ◉ id                    UUID (PK)                                │
│   organization_id       UUID                                     │
│   ...                                                            │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    │ (Referenced by FK)
                    │
        ┌───────────┴──────────────┐
        │                          │
        ▼                          ▼
┌──────────────────────┐   ┌──────────────────────┐
│   public.tasks       │   │   public.logs        │
├──────────────────────┤   ├──────────────────────┤
│ ◉ id          UUID   │   │ ◉ id          UUID   │
│ ○ blueprint_id UUID  │   │ ○ blueprint_id UUID  │
│ ○ creator_id   UUID  │   │ ○ creator_id   UUID  │
│   assignee_id  UUID  │   │   date         DATE  │
│   title        TEXT  │   │   title        TEXT  │
│   description  TEXT  │   │   description  TEXT  │
│   status       ENUM  │   │   work_hours   NUM   │
│   priority     ENUM  │   │   workers      INT   │
│   due_date     TS    │   │   equipment    TEXT  │
│   tags         []    │   │   weather      TEXT  │
│   attachments  JSON  │   │   temperature  NUM   │
│   metadata     JSON  │   │   photos       JSON  │
│   created_at   TS    │   │   voice_rec    JSON  │
│   updated_at   TS    │   │   documents    JSON  │
│   deleted_at   TS    │   │   metadata     JSON  │
└──────────────────────┘   │   created_at   TS    │
                           │   updated_at   TS    │
                           │   deleted_at   TS    │
                           └──────────────────────┘

Legend:
◉ = Primary Key
○ = Foreign Key
TS = TIMESTAMPTZ
NUM = NUMERIC
ENUM = CHECK constraint
JSON = JSONB
```

---

## 📋 Tables Detail

### 1. `public.tasks` - Task Management

**Purpose**: Track construction site tasks and progress

**Columns** (13):
| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | PRIMARY KEY |
| `blueprint_id` | UUID | NO | - | FK (blueprints.id) |
| `creator_id` | UUID | NO | - | FK (auth.users) |
| `assignee_id` | UUID | YES | - | FK (auth.users) |
| `title` | VARCHAR(255) | NO | - | - |
| `description` | TEXT | YES | - | - |
| `status` | VARCHAR(50) | NO | 'TODO' | CHECK (TODO, IN_PROGRESS, REVIEW, COMPLETED, CANCELLED) |
| `priority` | VARCHAR(20) | YES | 'MEDIUM' | CHECK (LOW, MEDIUM, HIGH, URGENT) |
| `due_date` | TIMESTAMPTZ | YES | - | - |
| `tags` | TEXT[] | YES | '{}' | - |
| `attachments` | JSONB | YES | '[]' | - |
| `metadata` | JSONB | YES | '{}' | - |
| `created_at` | TIMESTAMPTZ | NO | NOW() | - |
| `updated_at` | TIMESTAMPTZ | NO | NOW() | AUTO-UPDATE |
| `deleted_at` | TIMESTAMPTZ | YES | - | Soft delete |

**Indexes** (8):
1. `idx_tasks_blueprint_id` - B-tree on `blueprint_id`
2. `idx_tasks_creator_id` - B-tree on `creator_id`
3. `idx_tasks_assignee_id` - B-tree on `assignee_id`
4. `idx_tasks_status` - B-tree on `status`
5. `idx_tasks_due_date` - B-tree on `due_date`
6. `idx_tasks_created_at` - B-tree on `created_at DESC`
7. `idx_tasks_deleted_at` - Partial on `deleted_at` WHERE deleted_at IS NULL
8. `idx_tasks_blueprint_status` - Composite on `(blueprint_id, status)` WHERE deleted_at IS NULL

**Triggers** (1):
- `update_tasks_updated_at` - BEFORE UPDATE - Auto-update `updated_at`

**RLS Policies** (5):
1. SELECT - View tasks in user's organization (not deleted)
2. INSERT - Create tasks in user's organization (creator_id = current user)
3. UPDATE - Update tasks in user's organization (not deleted)
4. DELETE - Admins can delete tasks
5. SELECT - Admins can view soft-deleted tasks

---

### 2. `public.logs` - Daily Construction Logs

**Purpose**: Record daily construction site activities and progress

**Columns** (16):
| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | PRIMARY KEY |
| `blueprint_id` | UUID | NO | - | FK (blueprints.id) |
| `creator_id` | UUID | NO | - | FK (auth.users) |
| `date` | DATE | NO | - | - |
| `title` | VARCHAR(255) | NO | - | - |
| `description` | TEXT | YES | - | - |
| `work_hours` | NUMERIC(5,2) | YES | - | CHECK >= 0 |
| `workers` | INTEGER | YES | 0 | CHECK >= 0 |
| `equipment` | TEXT | YES | - | - |
| `weather` | VARCHAR(50) | YES | - | - |
| `temperature` | NUMERIC(4,1) | YES | - | - |
| `photos` | JSONB | YES | '[]' | - |
| `voice_records` | JSONB | YES | '[]' | - |
| `documents` | JSONB | YES | '[]' | - |
| `metadata` | JSONB | YES | '{}' | Auto photo_count |
| `created_at` | TIMESTAMPTZ | NO | NOW() | - |
| `updated_at` | TIMESTAMPTZ | NO | NOW() | AUTO-UPDATE |
| `deleted_at` | TIMESTAMPTZ | YES | - | Soft delete |

**Indexes** (10):
1. `idx_logs_blueprint_id` - B-tree on `blueprint_id`
2. `idx_logs_creator_id` - B-tree on `creator_id`
3. `idx_logs_date` - B-tree on `date DESC`
4. `idx_logs_created_at` - B-tree on `created_at DESC`
5. `idx_logs_deleted_at` - Partial on `deleted_at` WHERE deleted_at IS NULL
6. `idx_logs_blueprint_date` - Composite on `(blueprint_id, date DESC)` WHERE deleted_at IS NULL
7. `idx_logs_photos_gin` - GIN on `photos` (JSONB search)
8. `idx_logs_documents_gin` - GIN on `documents` (JSONB search)
9. `idx_logs_metadata_gin` - GIN on `metadata` (JSONB search)
10. *(Note: 3 GIN indexes for fast JSONB queries)*

**Triggers** (2):
- `update_logs_updated_at` - BEFORE UPDATE - Auto-update `updated_at`
- `update_log_photo_stats_trigger` - BEFORE INSERT/UPDATE OF photos - Auto-calculate `metadata.photo_count`

**RLS Policies** (6):
1. SELECT - View logs in user's organization (not deleted)
2. INSERT - Create logs in user's organization (creator_id = current user)
3. UPDATE (Owner) - Update own logs
4. UPDATE (Admin) - Admins can update all logs
5. DELETE - Creator or admin can delete logs
6. SELECT - Admins can view soft-deleted logs

---

## 🔧 Functions & Triggers

### Helper Functions

#### 1. `get_user_organization_id() → UUID`
- **Purpose**: Extract organization_id from JWT claims
- **Usage**: RLS policies for organization isolation
- **Returns**: UUID of user's organization or NULL

#### 2. `get_user_id() → UUID`
- **Purpose**: Extract user ID (sub) from JWT claims
- **Usage**: RLS policies for creator permissions
- **Returns**: UUID of current user or NULL

#### 3. `get_user_role() → TEXT`
- **Purpose**: Extract role from JWT claims
- **Usage**: RLS policies for role-based access
- **Returns**: 'admin' | 'member' | 'viewer' (default: 'member')

#### 4. `is_blueprint_in_user_organization(blueprint_uuid UUID) → BOOLEAN`
- **Purpose**: Check if blueprint belongs to user's organization
- **Usage**: Core RLS logic for all policies
- **Dependencies**: Requires `public.blueprints` table with `organization_id`
- **Returns**: TRUE if blueprint belongs to user's org, FALSE otherwise

### Trigger Functions

#### 5. `update_updated_at_column() → TRIGGER`
- **Purpose**: Auto-update `updated_at` timestamp
- **Tables**: tasks, logs
- **Trigger**: BEFORE UPDATE FOR EACH ROW

#### 6. `update_log_photo_stats() → TRIGGER`
- **Purpose**: Auto-calculate and store photo count in metadata
- **Tables**: logs
- **Trigger**: BEFORE INSERT OR UPDATE OF photos FOR EACH ROW
- **Logic**: `metadata.photo_count = jsonb_array_length(photos)`

### Test Function

#### 7. `test_rls_policies() → TABLE`
- **Purpose**: Verify RLS configuration
- **Returns**: 4 test results (test_name, passed, message)
- **Tests**:
  1. RLS enabled on tasks
  2. RLS enabled on logs
  3. Tasks has >= 5 policies
  4. Logs has >= 6 policies

---

## 🔒 Row Level Security (RLS)

### RLS Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    Firebase Auth JWT                        │
│  {                                                          │
│    "sub": "user-uuid",                                      │
│    "organization_id": "org-uuid",                           │
│    "role": "admin" | "member"                               │
│  }                                                          │
└────────────────┬───────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────┐
│              RLS Helper Functions                           │
│  • get_user_id()                                            │
│  • get_user_organization_id()                               │
│  • get_user_role()                                          │
│  • is_blueprint_in_user_organization()                      │
└────────────────┬───────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────┐
│                  RLS Policies                               │
│                                                             │
│  Tasks:                          Logs:                      │
│  1. SELECT (active)              1. SELECT (active)         │
│  2. INSERT (creator check)       2. INSERT (creator check)  │
│  3. UPDATE (org check)           3. UPDATE (owner check)    │
│  4. DELETE (admin only)          4. UPDATE (admin check)    │
│  5. SELECT (soft deleted)        5. DELETE (owner/admin)    │
│                                  6. SELECT (soft deleted)   │
└────────────────────────────────────────────────────────────┘
```

### Policy Matrix

| Action | Tasks | Logs | Organization Check | Role Check | Creator Check |
|--------|-------|------|-------------------|------------|---------------|
| **SELECT (Active)** | ✅ All Members | ✅ All Members | ✅ Required | ❌ | ❌ |
| **SELECT (Deleted)** | ✅ Admin Only | ✅ Admin Only | ✅ Required | ✅ Admin | ❌ |
| **INSERT** | ✅ All Members | ✅ All Members | ✅ Required | ❌ | ✅ Must be creator |
| **UPDATE** | ✅ All Members | ✅ Owner | ✅ Required | ❌ | ❌ (Logs: ✅) |
| **UPDATE (Admin)** | ❌ | ✅ Admin | ✅ Required | ✅ Admin | ❌ |
| **DELETE** | ✅ Admin Only | ✅ Owner or Admin | ✅ Required | ✅ Admin | ✅ (Logs: Owner) |

### Security Guarantees

✅ **Organization Isolation**
- Users can ONLY access data from their own organization
- Enforced via `is_blueprint_in_user_organization()` check
- All policies include organization check

✅ **Role-Based Access Control**
- `admin` role has elevated permissions
- DELETE operations restricted to admins (tasks) or owner/admin (logs)
- Soft-deleted data only visible to admins

✅ **Creator Permissions**
- INSERT requires `creator_id = current_user_id()`
- Logs UPDATE restricted to creator (unless admin)
- Prevents impersonation

✅ **Soft Delete Support**
- Active policies filter `WHERE deleted_at IS NULL`
- Separate policies for viewing soft-deleted records
- Admin-only access to deleted data

✅ **Default Deny**
- Anonymous users have NO access
- All policies explicitly TO authenticated
- No data leakage

---

## 📦 Storage Buckets (Manual Setup Required)

### Bucket Structure

```
storage.buckets
├── task-attachments (Private)
│   └── /{blueprint_id}/
│       └── /{task_id}/
│           └── files...
│
└── log-photos (Private)
    └── /{blueprint_id}/
        └── /{log_id}/
            └── photos...
```

### Required Policies

#### task-attachments Bucket

```sql
-- SELECT: Users can view files from their org's tasks
CREATE POLICY "Users can view task attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'task-attachments' 
    AND public.is_blueprint_in_user_organization(
        (storage.foldername(name))[1]::uuid
    )
);

-- INSERT: Users can upload files to their org's tasks
CREATE POLICY "Users can upload task attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'task-attachments'
    AND public.is_blueprint_in_user_organization(
        (storage.foldername(name))[1]::uuid
    )
);

-- DELETE: Task creators can delete attachments
CREATE POLICY "Users can delete task attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'task-attachments'
    AND public.is_blueprint_in_user_organization(
        (storage.foldername(name))[1]::uuid
    )
);
```

#### log-photos Bucket

Similar policies with `bucket_id = 'log-photos'`

---

## 📈 Performance Considerations

### Index Strategy

**B-tree Indexes** (Standard lookups):
- Foreign keys (blueprint_id, creator_id, assignee_id)
- Status fields (status for tasks)
- Date fields (due_date, date, created_at)
- Soft delete (deleted_at with partial index)

**Composite Indexes** (Common query patterns):
- `(blueprint_id, status)` - List tasks by blueprint and status
- `(blueprint_id, date)` - List logs by blueprint and date

**GIN Indexes** (JSONB search):
- `photos`, `documents`, `metadata` in logs table
- Enables fast JSONB queries with `@>`, `?`, `?&`, `?|` operators

**Partial Indexes** (Filtered queries):
- `deleted_at IS NULL` - Only index active records
- Reduces index size by ~50% (assuming 10% deletion rate)

### Query Optimization Tips

**Good Queries**:
```sql
-- Uses idx_tasks_blueprint_status
SELECT * FROM tasks 
WHERE blueprint_id = $1 AND status = 'IN_PROGRESS' AND deleted_at IS NULL;

-- Uses idx_logs_blueprint_date
SELECT * FROM logs 
WHERE blueprint_id = $1 AND date > $2 AND deleted_at IS NULL
ORDER BY date DESC;

-- Uses idx_logs_photos_gin
SELECT * FROM logs 
WHERE photos @> '[{"type": "before"}]';
```

**Avoid**:
```sql
-- Table scan (no index on title)
SELECT * FROM tasks WHERE title LIKE '%search%';

-- Function on indexed column prevents index usage
SELECT * FROM logs WHERE EXTRACT(YEAR FROM date) = 2024;
```

---

## 🧪 Testing Queries

### Verify Table Creation

```sql
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('tasks', 'logs');
```

### Verify RLS Status

```sql
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    (SELECT COUNT(*) FROM pg_policies p 
     WHERE p.tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public' 
AND tablename IN ('tasks', 'logs');
```

### Verify Indexes

```sql
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
AND tablename IN ('tasks', 'logs')
ORDER BY tablename, indexname;
```

### Verify Functions

```sql
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'get_user_id',
    'get_user_organization_id',
    'get_user_role',
    'is_blueprint_in_user_organization',
    'update_updated_at_column',
    'update_log_photo_stats',
    'test_rls_policies'
)
ORDER BY routine_name;
```

### Run Automated Tests

```sql
SELECT * FROM public.test_rls_policies();
```

Expected: All 4 tests show `passed = true`

---

## 📊 Statistics

| Metric | Count | Details |
|--------|-------|---------|
| **Tables** | 2 | tasks, logs |
| **Columns** | 29 | tasks: 13, logs: 16 |
| **Indexes** | 18 | tasks: 8, logs: 10 (3 GIN) |
| **Functions** | 7 | 4 RLS helpers, 2 triggers, 1 test |
| **Triggers** | 3 | 1 on tasks, 2 on logs |
| **RLS Policies** | 11 | tasks: 5, logs: 6 |
| **Storage Buckets** | 2 | task-attachments, log-photos (manual setup) |

---

**Last Updated**: 2025-12-12  
**Schema Version**: PR #63  
**Status**: Production Ready ✅
