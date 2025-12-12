# Construction Logs Database Setup Guide

## Overview
This document provides step-by-step instructions for setting up the `construction_logs` table and related Supabase resources.

## Prerequisites
- Access to Supabase Dashboard (https://supabase.com/dashboard)
- Project: `zecsbstjqjqoytwgjyct.supabase.co`
- Admin or Owner permissions

## Setup Steps

### Step 1: Create Construction Logs Table

1. Open Supabase Dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and execute the following SQL:

```sql
-- =============================================
-- Construction Logs Table Schema
-- 工地施工日誌資料表結構
-- =============================================
-- Description: Store construction site daily logs with photos
-- Created: 2025-12-11
-- Author: GigHub Development Team
-- =============================================

-- Create construction_logs table
CREATE TABLE IF NOT EXISTS public.construction_logs (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign key to blueprints
    blueprint_id UUID NOT NULL REFERENCES public.blueprints(id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- Log date (work date)
    date TIMESTAMPTZ NOT NULL,
    
    -- Basic information
    title VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Work details
    work_hours NUMERIC(5,2),
    workers INTEGER,
    equipment TEXT,
    
    -- Weather information
    weather VARCHAR(50),
    temperature NUMERIC(5,2),
    
    -- Photos (stored as JSONB array)
    photos JSONB DEFAULT '[]'::jsonb,
    
    -- Audit fields
    creator_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    -- Reserved for future
    voice_records TEXT[],
    documents TEXT[],
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_construction_logs_blueprint_id 
    ON public.construction_logs(blueprint_id);

CREATE INDEX IF NOT EXISTS idx_construction_logs_date 
    ON public.construction_logs(date DESC);

CREATE INDEX IF NOT EXISTS idx_construction_logs_creator 
    ON public.construction_logs(creator_id);

CREATE INDEX IF NOT EXISTS idx_construction_logs_deleted 
    ON public.construction_logs(deleted_at) 
    WHERE deleted_at IS NULL;

-- Add comments for documentation
COMMENT ON TABLE public.construction_logs IS 'Construction site daily logs with photos and work details';
COMMENT ON COLUMN public.construction_logs.id IS 'Unique log identifier';
COMMENT ON COLUMN public.construction_logs.blueprint_id IS 'Reference to blueprint (project)';
COMMENT ON COLUMN public.construction_logs.date IS 'Work date for this log entry';
COMMENT ON COLUMN public.construction_logs.photos IS 'JSONB array of photo objects with URLs and metadata';
COMMENT ON COLUMN public.construction_logs.deleted_at IS 'Soft delete timestamp';
```

5. Click **Run** to execute the SQL
6. Verify table creation by navigating to **Table Editor** → **construction_logs**

### Step 2: Create Storage Bucket for Photos

1. Navigate to **Storage** in Supabase Dashboard
2. Click **New bucket**
3. Configure the bucket:
   - **Name**: `construction-photos`
   - **Public**: ✅ Enabled (so photos can be viewed)
   - **File size limit**: `10 MB` (optional)
   - **Allowed MIME types**: `image/jpeg, image/png, image/gif, image/webp` (optional)

4. Click **Create bucket**

### Step 3: Set Row Level Security (RLS) Policies

Execute the following SQL to set up RLS policies:

```sql
-- Enable RLS on construction_logs table
ALTER TABLE public.construction_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read logs from their accessible blueprints
CREATE POLICY "Users can read construction logs from accessible blueprints"
ON public.construction_logs
FOR SELECT
TO authenticated
USING (
    -- Check if user has access to the blueprint
    EXISTS (
        SELECT 1 FROM public.blueprints
        WHERE blueprints.id = construction_logs.blueprint_id
        AND (
            blueprints.owner_id = auth.uid()
            OR blueprints.is_public = true
            OR EXISTS (
                SELECT 1 FROM public.blueprint_members
                WHERE blueprint_members.blueprint_id = blueprints.id
                AND blueprint_members.user_id = auth.uid()
            )
        )
    )
    AND construction_logs.deleted_at IS NULL
);

-- Policy: Allow authenticated users to insert logs to their accessible blueprints
CREATE POLICY "Users can create construction logs in accessible blueprints"
ON public.construction_logs
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.blueprints
        WHERE blueprints.id = construction_logs.blueprint_id
        AND (
            blueprints.owner_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.blueprint_members
                WHERE blueprint_members.blueprint_id = blueprints.id
                AND blueprint_members.user_id = auth.uid()
                AND blueprint_members.role IN ('owner', 'editor')
            )
        )
    )
    AND construction_logs.creator_id = auth.uid()
);

-- Policy: Allow users to update their own logs
CREATE POLICY "Users can update their own construction logs"
ON public.construction_logs
FOR UPDATE
TO authenticated
USING (
    construction_logs.creator_id = auth.uid()
    AND construction_logs.deleted_at IS NULL
)
WITH CHECK (
    construction_logs.creator_id = auth.uid()
);

-- Policy: Allow users to soft delete their own logs
CREATE POLICY "Users can soft delete their own construction logs"
ON public.construction_logs
FOR UPDATE
TO authenticated
USING (
    construction_logs.creator_id = auth.uid()
)
WITH CHECK (
    construction_logs.creator_id = auth.uid()
);
```

### Step 4: Configure Storage Bucket Policies

Execute the following SQL for storage bucket RLS:

```sql
-- Allow authenticated users to upload photos
CREATE POLICY "Authenticated users can upload construction photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'construction-photos'
    AND (storage.foldername(name))[1] IS NOT NULL  -- Must be in a folder
);

-- Allow public read access to construction photos
CREATE POLICY "Public read access for construction photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'construction-photos');

-- Allow users to delete their own photos
CREATE POLICY "Users can delete their construction photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'construction-photos'
    AND auth.uid()::text = (storage.foldername(name))[2]  -- Check if user uploaded
);
```

### Step 5: Verify Setup

Run the following verification queries:

```sql
-- 1. Check table exists
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'construction_logs';

-- 2. Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'construction_logs';

-- 3. Check RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'construction_logs';

-- 4. List RLS policies
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'construction_logs';

-- 5. Check storage bucket
SELECT name, public, file_size_limit 
FROM storage.buckets 
WHERE name = 'construction-photos';
```

Expected results:
- ✅ Table `construction_logs` exists
- ✅ 4 indexes created
- ✅ RLS enabled (rowsecurity = true)
- ✅ 4 RLS policies created
- ✅ Storage bucket `construction-photos` exists

### Step 6: Test the Feature

1. **Start the application**:
   ```bash
   cd /path/to/GigHub
   yarn start
   ```

2. **Navigate to a blueprint**:
   - Go to http://localhost:4200
   - Login with your credentials
   - Select any blueprint
   - Click on **工地日誌** tab

3. **Test CRUD operations**:
   - ✅ Click **新增日誌** to create a log
   - ✅ Fill in the form and save
   - ✅ Verify log appears in the table
   - ✅ Click **編輯** to update
   - ✅ Click **刪除** to soft delete
   - ✅ Upload photos (if implemented in modal)

4. **Verify database**:
   ```sql
   -- Check created logs
   SELECT id, title, date, creator_id, created_at 
   FROM public.construction_logs 
   WHERE deleted_at IS NULL 
   ORDER BY date DESC 
   LIMIT 10;
   ```

## Troubleshooting

### Issue: "Could not find the table 'public.construction_logs' in the schema cache"

**Solution**: Table doesn't exist. Execute Step 1 SQL in Supabase Dashboard.

### Issue: "Permission denied for table construction_logs"

**Solution**: RLS policies not set up correctly. Execute Step 3 SQL.

### Issue: "Failed to upload photo"

**Solution**: Storage bucket doesn't exist or policies not configured.
1. Verify bucket exists: Storage → Buckets → `construction-photos`
2. Execute Step 2 and Step 4

### Issue: "Cannot read logs from other blueprints"

**Solution**: This is expected behavior due to RLS policies. Users can only see logs from:
- Blueprints they own
- Public blueprints
- Blueprints they are members of

## Rollback (If Needed)

To remove the feature:

```sql
-- Drop table (CASCADE will remove all dependent objects)
DROP TABLE IF EXISTS public.construction_logs CASCADE;

-- Delete storage bucket (use Supabase Dashboard)
-- Storage → Buckets → construction-photos → Delete
```

## Maintenance

### Backup Logs

```sql
-- Export logs to JSON
COPY (
    SELECT row_to_json(t) 
    FROM public.construction_logs t 
    WHERE deleted_at IS NULL
) TO '/tmp/construction_logs_backup.json';
```

### Clean Soft Deleted Logs (Optional)

```sql
-- Permanently delete soft-deleted logs older than 30 days
DELETE FROM public.construction_logs
WHERE deleted_at IS NOT NULL
AND deleted_at < NOW() - INTERVAL '30 days';
```

## References

- [Supabase Database Documentation](https://supabase.com/docs/guides/database)
- [Row Level Security (RLS)](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Policies](https://supabase.com/docs/guides/storage/security/access-control)
- Project File: `docs/database/construction_logs.sql`
- Type Definitions: `src/app/core/types/log/log.types.ts`

## Support

For issues or questions:
1. Check application logs in browser console
2. Check Supabase logs in Dashboard → Logs
3. Contact development team

---

**Last Updated**: 2025-12-12  
**Status**: Ready for Production  
**Version**: 1.0.0
