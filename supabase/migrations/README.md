# Supabase Migrations - GigHub

## 📋 Overview

This directory contains database migrations for the GigHub construction site progress tracking system.

## 🗄️ Migration Files

### Base Schema Migrations
1. **20251212_01_create_tasks_table.sql** - 任務表格
2. **20251212_02_create_logs_table.sql** - 日誌表格
3. **20251212_03_create_rls_policies.sql** - 基礎 RLS 政策

### Task Quantity Expansion Feature
4. **20251212_04_task_quantity_expansion.sql** - 任務數量追蹤擴展
   - Extends `tasks` table with quantity tracking fields
   - Creates `log_tasks` junction table
   - Creates `quality_controls` table for QC workflow
   - Creates `task_progress` audit trail table
   - Adds helper functions and triggers

5. **20251212_05_task_quantity_rls_policies.sql** - 數量擴展 RLS 政策
   - RLS policies for `log_tasks`
   - RLS policies for `quality_controls`
   - RLS policies for `task_progress`
   - Security helper functions

## 🚀 How to Apply Migrations

### Method 1: Using Automated Deployment Script (Recommended) ✨

**最簡單的方法！** 使用專案提供的自動化腳本一鍵部署所有 migrations。

**Requirements:**
- PostgreSQL client (`psql`) installed
- Database connection URL
- Project Reference: `zecsbstjqjqoytwgjyct`

**Steps:**
```bash
# 1. Set database connection
export DATABASE_URL='postgresql://postgres:YOUR_PASSWORD@db.zecsbstjqjqoytwgjyct.supabase.co:5432/postgres'

# 2. Run deployment script
cd /path/to/GigHub
./supabase/deploy-migrations.sh

# 3. Verify deployment
psql "$DATABASE_URL" -f supabase/verify-deployment.sql
```

**Features:**
- ✅ Automatic environment checks
- ✅ Database connection testing
- ✅ Sequential migration execution
- ✅ Real-time progress display
- ✅ Error handling and reporting
- ✅ Post-deployment verification

詳細說明請參考：
- 完整指南：[../部署指南.md](../部署指南.md)
- 快速參考：[../QUICK_DEPLOY.md](../QUICK_DEPLOY.md)

### Method 2: Using Supabase Dashboard (Manual)

1. **Login to Supabase Dashboard**
   ```
   https://supabase.com/dashboard/project/zecsbstjqjqoytwgjyct
   ```

2. **Navigate to SQL Editor**
   - Go to "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and Execute Migration Files**
   - Copy the content of `20251212_04_task_quantity_expansion.sql`
   - Paste into the SQL Editor
   - Click "Run" to execute
   - Wait for confirmation
   - Repeat for `20251212_05_task_quantity_rls_policies.sql`

### Method 3: Using Supabase CLI

**Prerequisites:**
```bash
# Install Supabase CLI (if not installed)
brew install supabase/tap/supabase  # macOS
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git  # Windows
scoop install supabase

# Or using NPM
npm install -g supabase
```

**Steps:**

1. **Login to Supabase**
   ```bash
   supabase login
   ```

2. **Link to Remote Project**
   ```bash
   cd /path/to/GigHub
   supabase link --project-ref zecsbstjqjqoytwgjyct
   ```

3. **Apply Migrations to Remote Database**
   ```bash
   # Apply specific migration
   supabase db push

   # Or execute migration file directly
   supabase db execute --file supabase/migrations/20251212_04_task_quantity_expansion.sql
   supabase db execute --file supabase/migrations/20251212_05_task_quantity_rls_policies.sql
   ```

4. **Verify Migration Status**
   ```bash
   supabase migration list
   ```

### Method 4: Using psql (Direct Database Connection)

**Prerequisites:**
- PostgreSQL client (`psql`) installed
- Supabase database credentials

**Steps:**

1. **Get Database Connection String**
   - From Supabase Dashboard → Settings → Database
   - Copy the connection string (with password)

2. **Execute Migration**
   ```bash
   psql "postgresql://postgres:[YOUR-PASSWORD]@db.zecsbstjqjqoytwgjyct.supabase.co:5432/postgres" \
     -f supabase/migrations/20251212_04_task_quantity_expansion.sql
   
   psql "postgresql://postgres:[YOUR-PASSWORD]@db.zecsbstjqjqoytwgjyct.supabase.co:5432/postgres" \
     -f supabase/migrations/20251212_05_task_quantity_rls_policies.sql
   ```

## ✅ Verification

After applying migrations, verify the changes:

### 1. Check Tables Created

```sql
-- Check if new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('log_tasks', 'quality_controls', 'task_progress');

-- Check if tasks table has new columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name LIKE '%quantity%';
```

### 2. Check RLS Policies

```sql
-- List all RLS policies for new tables
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename IN ('log_tasks', 'quality_controls', 'task_progress');
```

### 3. Check Functions and Triggers

```sql
-- List functions
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%task%quantity%';

-- List triggers
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'log_tasks';
```

### 4. Test Basic Operations

```sql
-- Test: Query new columns on tasks table
SELECT id, title, total_quantity, unit, completed_quantity, enable_quantity_tracking
FROM public.tasks
LIMIT 5;

-- Test: Query log_tasks table
SELECT * FROM public.log_tasks LIMIT 5;

-- Test: Query quality_controls table
SELECT * FROM public.quality_controls LIMIT 5;

-- Test: Query task_progress table
SELECT * FROM public.task_progress ORDER BY created_at DESC LIMIT 5;
```

## 🔄 Rollback (If Needed)

If you need to rollback these migrations:

```sql
-- Drop new tables (cascade will remove dependent objects)
DROP TABLE IF EXISTS public.task_progress CASCADE;
DROP TABLE IF EXISTS public.quality_controls CASCADE;
DROP TABLE IF EXISTS public.log_tasks CASCADE;

-- Remove columns from tasks table
ALTER TABLE public.tasks 
DROP COLUMN IF EXISTS total_quantity,
DROP COLUMN IF EXISTS unit,
DROP COLUMN IF EXISTS completed_quantity,
DROP COLUMN IF EXISTS enable_quantity_tracking,
DROP COLUMN IF EXISTS auto_complete_on_quantity_reached,
DROP COLUMN IF EXISTS auto_send_to_qc;

-- Drop helper functions
DROP FUNCTION IF EXISTS public.calculate_task_completed_quantity(UUID);
DROP FUNCTION IF EXISTS public.update_task_completed_quantity();
DROP FUNCTION IF EXISTS public.user_can_access_blueprint(UUID);
DROP FUNCTION IF EXISTS public.user_is_qc_inspector();
DROP FUNCTION IF EXISTS public.user_is_admin();
```

## 📊 Database Schema Diagram

After migration, the schema relationships:

```
accounts
  ↓
tasks (extended with quantity fields)
  ↓
  ├─→ log_tasks (many-to-many with logs)
  ├─→ quality_controls (QC workflow)
  └─→ task_progress (audit trail)
```

## 🔐 Security Notes

- All new tables have RLS enabled
- Policies enforce organization-level isolation
- QC operations restricted to authorized personnel
- Audit trail (task_progress) is immutable for regular users
- Helper functions use SECURITY DEFINER for consistent security checks

## 📝 Migration Details

### Tables Created

1. **log_tasks** (8 columns, 4 indexes)
   - Junction table for task-log relationships
   - Tracks quantity completed per log entry

2. **quality_controls** (19 columns, 5 indexes)
   - QC workflow management
   - Inspector assignment and results tracking

3. **task_progress** (12 columns, 6 indexes)
   - Complete audit trail for quantity changes
   - Immutable record of all updates

### Functions Created

1. **calculate_task_completed_quantity()** - Calculate total from log_tasks
2. **update_task_completed_quantity()** - Trigger function for auto-update
3. **user_can_access_blueprint()** - Security helper
4. **user_is_qc_inspector()** - Security helper
5. **user_is_admin()** - Security helper

### Triggers Created

1. **trigger_update_task_quantity** - Auto-update completed_quantity on tasks

## 🐛 Troubleshooting

### Issue: "relation does not exist"
- Ensure base tables (tasks, logs, blueprints, accounts) exist
- Run base migrations first (20251212_01, 02, 03)

### Issue: "foreign key constraint violation"
- Verify referenced tables have the expected primary keys
- Check that UUIDs are using the correct format

### Issue: "permission denied"
- Ensure you're connected as a user with sufficient privileges
- For Supabase, use the service role key for migrations

### Issue: RLS blocking queries
- Verify your auth.uid() is set correctly
- Check that your user account exists in the accounts table
- Review RLS policies to ensure they match your use case

## 📚 References

- [Supabase Migrations Guide](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Task Quantity Expansion Design Doc](../../docs/task-quantity-expansion-design.md)

## 🆘 Support

If you encounter issues:
1. Check the Supabase Dashboard logs
2. Verify your database connection
3. Consult the error messages in the migration output
4. Review the design document for context

---

**Last Updated:** 2025-12-12  
**Version:** 1.0.0  
**Author:** GigHub Development Team
