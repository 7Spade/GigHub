# Supabase Migration Execution Guide

## 📋 Overview

This guide provides instructions for executing the SQL migrations from PR #63 to the remote Supabase database.

**Project Reference**: `zecsbstjqjqoytwgjyct` (Primary) | `obwyowvbsnqsxsnlsbhl` (Alternative)  
**Migrations to Execute**: 3 files in `supabase/migrations/`

---

## 🎯 Migration Files

### Migration 1: Create Tasks Table
**File**: `supabase/migrations/20251212_01_create_tasks_table.sql`  
**Purpose**: Creates the `tasks` table for construction site task tracking  
**Contains**:
- Tasks table schema (13 columns)
- 8 performance indexes
- Auto-update trigger for `updated_at`
- Comprehensive column comments
- Permission grants

### Migration 2: Create Logs Table
**File**: `supabase/migrations/20251212_02_create_logs_table.sql`  
**Purpose**: Creates the `logs` table for construction site daily logs  
**Contains**:
- Logs table schema (16 columns)
- 10 performance indexes (including GIN indexes for JSONB)
- Photo statistics auto-calculation trigger
- Comprehensive column comments
- Permission grants

### Migration 3: Create RLS Policies
**File**: `supabase/migrations/20251212_03_create_rls_policies.sql`  
**Purpose**: Implements Row Level Security policies  
**Contains**:
- Enable RLS on tasks and logs tables
- 4 helper functions (JWT claims extraction)
- 5 policies for tasks table (organization isolation + role-based control)
- 6 policies for logs table (organization isolation + creator permissions)
- Test function for verification

---

## 🚀 Execution Methods

### Method 1: Supabase Dashboard SQL Editor (Recommended ⭐)

**Steps**:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/zecsbstjqjqoytwgjyct)
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Execute migrations in order:

#### Step 1: Execute Migration 1
```sql
-- Copy the entire content of:
-- supabase/migrations/20251212_01_create_tasks_table.sql
-- Paste and click "Run"
```

#### Step 2: Execute Migration 2
```sql
-- Copy the entire content of:
-- supabase/migrations/20251212_02_create_logs_table.sql
-- Paste and click "Run"
```

#### Step 3: Execute Migration 3
```sql
-- Copy the entire content of:
-- supabase/migrations/20251212_03_create_rls_policies.sql
-- Paste and click "Run"
```

#### Step 4: Verify
```sql
-- Run the test function
SELECT * FROM public.test_rls_policies();

-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('tasks', 'logs');

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('tasks', 'logs');

-- Check policies count
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('tasks', 'logs')
GROUP BY tablename;
```

**Expected Results**:
- ✅ All test_rls_policies() tests should pass
- ✅ Both `tasks` and `logs` tables should exist
- ✅ RLS should be enabled (rowsecurity = true) for both tables
- ✅ Tasks should have 5+ policies, Logs should have 6+ policies

---

### Method 2: Supabase CLI (For Developers)

**Prerequisites**:
- Supabase CLI installed: `npm install -g supabase`
- Supabase Access Token

**Steps**:

#### Option A: Using Supabase Login
```bash
# Step 1: Login to Supabase
supabase login

# Step 2: Link to project
cd /path/to/GigHub
supabase link --project-ref zecsbstjqjqoytwgjyct

# Step 3: Push migrations
supabase db push --linked
```

#### Option B: Using Access Token
```bash
# Step 1: Set access token
export SUPABASE_ACCESS_TOKEN="your-access-token-here"

# Step 2: Push migrations
cd /path/to/GigHub
supabase db push --linked --project-ref zecsbstjqjqoytwgjyct
```

#### Option C: Using Database URL
```bash
# Step 1: Get database URL from Supabase Dashboard
# Settings -> Database -> Connection string -> URI

# Step 2: Execute migrations
cd /path/to/GigHub
supabase db push --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.obwyowvbsnqsxsnlsbhl.supabase.co:5432/postgres"
```

---

### Method 3: GitHub Actions Automation

**Setup GitHub Secrets**:
1. Go to repository **Settings** -> **Secrets and variables** -> **Actions**
2. Add secrets:
   - `SUPABASE_ACCESS_TOKEN`: Your Supabase access token
   - Or `SUPABASE_DB_URL`: Direct database connection string

**Create Workflow** (`.github/workflows/supabase-migrations.yml`):
```yaml
name: Supabase Migrations

on:
  workflow_dispatch:
  push:
    paths:
      - 'supabase/migrations/**'

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest
      
      - name: Push migrations
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
        run: |
          supabase db push --linked --project-ref zecsbstjqjqoytwgjyct
```

---

## ✅ Verification Checklist

After executing migrations, verify:

- [ ] **Tables Created**
  ```sql
  SELECT COUNT(*) FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('tasks', 'logs');
  -- Should return: 2
  ```

- [ ] **RLS Enabled**
  ```sql
  SELECT tablename, rowsecurity 
  FROM pg_tables 
  WHERE schemaname = 'public' 
  AND tablename IN ('tasks', 'logs');
  -- Both should show: rowsecurity = true
  ```

- [ ] **Policies Applied**
  ```sql
  SELECT tablename, COUNT(*) as policy_count
  FROM pg_policies 
  WHERE schemaname = 'public' 
  GROUP BY tablename;
  -- tasks: 5+, logs: 6+
  ```

- [ ] **Indexes Created**
  ```sql
  SELECT tablename, indexname 
  FROM pg_indexes 
  WHERE schemaname = 'public' 
  AND tablename IN ('tasks', 'logs')
  ORDER BY tablename, indexname;
  -- Should list all indexes
  ```

- [ ] **Functions Created**
  ```sql
  SELECT routine_name 
  FROM information_schema.routines 
  WHERE routine_schema = 'public'
  AND routine_name IN (
    'update_updated_at_column',
    'update_log_photo_stats',
    'get_user_organization_id',
    'get_user_id',
    'get_user_role',
    'is_blueprint_in_user_organization',
    'test_rls_policies'
  );
  -- Should return: 7 functions
  ```

- [ ] **Triggers Created**
  ```sql
  SELECT trigger_name, event_object_table 
  FROM information_schema.triggers 
  WHERE trigger_schema = 'public'
  AND event_object_table IN ('tasks', 'logs');
  -- Should list all triggers
  ```

- [ ] **Run Test Function**
  ```sql
  SELECT * FROM public.test_rls_policies();
  -- All tests should pass (passed = true)
  ```

---

## 🔒 Security Notes

### Important Prerequisites

Before executing migrations, ensure:

1. **Blueprints Table Exists**
   - Migration 3 assumes `public.blueprints` table exists
   - Must have `organization_id` column
   - If not exists, RLS helper functions will fail

2. **Firebase Auth Integration**
   - JWT tokens must include custom claims:
     - `organization_id`: UUID of user's organization
     - `role`: 'admin' | 'member' | 'viewer'
   - Configure in Firebase Auth before using

3. **Storage Buckets** (Manual Setup Required)
   - Create buckets: `task-attachments`, `log-photos`
   - Configure storage policies via Supabase Dashboard
   - See Migration 3 comments for policy logic

### Post-Migration Configuration

After migrations are applied:

1. **Configure Firebase Auth Custom Claims**
   ```javascript
   // In Firebase Functions
   admin.auth().setCustomUserClaims(uid, {
     organization_id: 'user-org-uuid',
     role: 'admin' // or 'member'
   });
   ```

2. **Create Storage Buckets**
   - Dashboard -> Storage -> Create bucket
   - Bucket names: `task-attachments`, `log-photos`
   - Set public: false (private buckets)

3. **Configure Storage Policies**
   - See `supabase/migrations/20251212_03_create_rls_policies.sql` (lines 229-256)
   - Apply via Dashboard -> Storage -> Policies

---

## 🐛 Troubleshooting

### Issue: "relation 'blueprints' does not exist"

**Cause**: RLS helper function `is_blueprint_in_user_organization()` references `blueprints` table

**Solution**: 
1. Create blueprints table first, or
2. Temporarily comment out the function body:
```sql
CREATE OR REPLACE FUNCTION public.is_blueprint_in_user_organization(blueprint_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- TODO: Implement after blueprints table is created
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Issue: "permission denied for table tasks"

**Cause**: RLS policies are blocking access without proper JWT claims

**Solution**:
1. Verify JWT contains `organization_id` and `role` claims
2. Test with service_role key (bypasses RLS) to verify table structure
3. Check `auth.users` table has correct metadata

### Issue: "function does not exist"

**Cause**: Migrations were executed out of order

**Solution**: Re-run migrations in correct order (1 → 2 → 3)

---

## 📞 Support

For issues or questions:
- **Supabase Docs**: https://supabase.com/docs
- **GigHub Project**: Contact project maintainers
- **RLS Debugging**: Use `SET ROLE authenticated;` in SQL Editor to simulate authenticated user

---

**Last Updated**: 2025-12-12  
**Migrations Version**: PR #63  
**Project Ref**: zecsbstjqjqoytwgjyct (Primary) | obwyowvbsnqsxsnlsbhl (Alternative)
