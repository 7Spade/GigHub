# 🚀 Quick Start: Execute SQL Migrations

## ⚡ Fastest Method (Recommended)

### Option 1: Copy & Paste in Supabase Dashboard (5 minutes)

1. **Open Supabase SQL Editor**
   ```
   https://supabase.com/dashboard/project/zecsbstjqjqoytwgjyct/sql
   ```
   
   **Alternative Project URL** (if above doesn't work):
   ```
   https://supabase.com/dashboard/project/obwyowvbsnqsxsnlsbhl/sql
   ```

2. **Copy the Consolidated SQL**
   - Open file: `supabase/migrations/CONSOLIDATED_MIGRATION.sql`
   - Copy the entire content (Ctrl+A, Ctrl+C)

3. **Execute in SQL Editor**
   - Paste in SQL Editor
   - Click **"Run"** button
   - Wait for completion (~5-10 seconds)

4. **Verify Results**
   - Check for "✅ All tables created successfully" message
   - Check for "✅ All RLS policies created successfully" message
   - Review test results at the bottom

**Expected Output:**
```
NOTICE: Migration 1: Tasks table created successfully
NOTICE: Migration 2: Logs table created successfully
NOTICE: RLS enabled on tasks and logs tables
NOTICE: Helper functions for RLS created successfully
NOTICE: RLS policies for tasks table created successfully
NOTICE: RLS policies for logs table created successfully
NOTICE: Migration 3: RLS policies created successfully
NOTICE: ✅ All tables created successfully
NOTICE: ✅ All RLS policies created successfully
NOTICE: Tasks policies: 5, Logs policies: 6
NOTICE: ========================================
NOTICE: Consolidated Migration Completed
NOTICE: ========================================

 test_name               | passed | message
-------------------------+--------+------------------------------------------
 RLS Enabled on Tasks    | t      | RLS should be enabled on tasks table
 RLS Enabled on Logs     | t      | RLS should be enabled on logs table
 Tasks Policies Count    | t      | Should have at least 5 policies for tasks
 Logs Policies Count     | t      | Should have at least 6 policies for logs
```

---

### Option 2: Use Supabase CLI (2 minutes)

**Prerequisites**: Supabase CLI access token

```bash
# Step 1: Login
supabase login

# Step 2: Navigate to project
cd /path/to/GigHub

# Step 3: Push all migrations
supabase db push --linked --project-ref obwyowvbsnqsxsnlsbhl
```

**Alternative with Access Token:**
```bash
export SUPABASE_ACCESS_TOKEN="your-token-here"
cd /path/to/GigHub

# Use the current project reference
supabase db push --linked --project-ref zecsbstjqjqoytwgjyct

# Or if using the alternative project
# supabase db push --linked --project-ref obwyowvbsnqsxsnlsbhl
```

---

## 📋 Verification Checklist

After execution, verify in Supabase Dashboard:

### Tables Created ✅
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('tasks', 'logs');
```
**Expected**: 2 rows (tasks, logs)

### RLS Enabled ✅
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('tasks', 'logs');
```
**Expected**: Both show `rowsecurity = true`

### Policies Applied ✅
```sql
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('tasks', 'logs')
GROUP BY tablename;
```
**Expected**: 
- tasks: 5 policies
- logs: 6 policies

### Run Test Function ✅
```sql
SELECT * FROM public.test_rls_policies();
```
**Expected**: All 4 tests show `passed = true`

---

## 🔧 Post-Migration Configuration

### 1. Configure Firebase Auth Custom Claims

In your Firebase Functions:
```typescript
import * as admin from 'firebase-admin';

// When user signs up or org changes
await admin.auth().setCustomUserClaims(userId, {
  organization_id: 'uuid-of-organization',
  role: 'admin' // or 'member'
});
```

### 2. Create Storage Buckets

In Supabase Dashboard -> Storage:
1. Create bucket: `task-attachments` (Private)
2. Create bucket: `log-photos` (Private)

### 3. Configure Storage Policies

For `task-attachments` bucket:
```sql
-- SELECT: Users can view files from their org's tasks
CREATE POLICY "Users can view task attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'task-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- INSERT: Users can upload files to their org's tasks
CREATE POLICY "Users can upload task attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'task-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
```

Similar policies for `log-photos` bucket.

---

## ⚠️ Important Notes

### Prerequisites
- ✅ Supabase project `obwyowvbsnqsxsnlsbhl` must exist
- ⚠️ `blueprints` table should exist (for RLS to work correctly)
- ⚠️ If blueprints table doesn't exist, RLS helper functions will fail

### If Blueprints Table Missing

Temporarily modify the helper function:
```sql
CREATE OR REPLACE FUNCTION public.is_blueprint_in_user_organization(blueprint_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- TODO: Implement after blueprints table is created
    RETURN TRUE;  -- Allow all for testing
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Then recreate properly after blueprints table exists.

---

## 🆘 Troubleshooting

### Issue: "permission denied"
**Solution**: Make sure you're logged in as project owner or have sufficient permissions

### Issue: "relation does not exist"
**Solution**: Check if you're connected to the correct project

### Issue: "syntax error"
**Solution**: Make sure you copied the entire SQL file content

### Issue: "function already exists"
**Solution**: This is normal - functions are replaced with `CREATE OR REPLACE`

---

## 📞 Need Help?

- **Full Guide**: See `supabase/MIGRATION_EXECUTION_GUIDE.md`
- **Individual Migrations**: Check files in `supabase/migrations/`
- **Supabase Docs**: https://supabase.com/docs

---

**Quick Links:**
- 🌐 [Supabase Dashboard](https://supabase.com/dashboard/project/zecsbstjqjqoytwgjyct)
- 📝 [SQL Editor](https://supabase.com/dashboard/project/zecsbstjqjqoytwgjyct/sql) ⭐ **Start Here**
- 🗄️ [Table Editor](https://supabase.com/dashboard/project/zecsbstjqjqoytwgjyct/editor)
- 🔒 [Policies](https://supabase.com/dashboard/project/zecsbstjqjqoytwgjyct/auth/policies)
- 📦 [Storage](https://supabase.com/dashboard/project/zecsbstjqjqoytwgjyct/storage/buckets)

**Last Updated**: 2025-12-12  
**Status**: Ready to execute ✅
