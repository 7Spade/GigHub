-- ============================================
-- Migration: Create RLS Policies
-- Created: 2025-12-12
-- Description: 建立 Row Level Security 政策，確保資料安全隔離
-- ============================================

-- ============================================
-- Part 1: Enable RLS on Tables
-- ============================================

-- Enable RLS on tasks table
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Enable RLS on logs table
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

RAISE NOTICE 'RLS enabled on tasks and logs tables';

-- ============================================
-- Part 2: Helper Functions for RLS
-- ============================================

-- Function to extract organization_id from JWT claims
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        current_setting('request.jwt.claims', true)::json->>'organization_id'
    )::uuid;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to extract user_id (sub) from JWT claims
CREATE OR REPLACE FUNCTION public.get_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        current_setting('request.jwt.claims', true)::json->>'sub'
    )::uuid;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to extract user role from JWT claims
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN current_setting('request.jwt.claims', true)::json->>'role';
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'member';  -- Default role
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if blueprint belongs to user's organization
CREATE OR REPLACE FUNCTION public.is_blueprint_in_user_organization(blueprint_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_org_id UUID;
    blueprint_org_id UUID;
BEGIN
    user_org_id := public.get_user_organization_id();
    
    IF user_org_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Note: This assumes blueprints table exists with organization_id column
    -- Adjust based on actual schema
    SELECT organization_id INTO blueprint_org_id
    FROM public.blueprints
    WHERE id = blueprint_uuid;
    
    RETURN blueprint_org_id = user_org_id;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

RAISE NOTICE 'Helper functions for RLS created successfully';

-- ============================================
-- Part 3: Tasks Table RLS Policies
-- ============================================

-- Policy 1: SELECT - Users can view tasks in their organization
CREATE POLICY "Users can view tasks in their organization"
ON public.tasks
FOR SELECT
TO authenticated
USING (
    public.is_blueprint_in_user_organization(blueprint_id)
    AND deleted_at IS NULL
);

-- Policy 2: INSERT - Users can create tasks in their organization
CREATE POLICY "Users can create tasks in their organization"
ON public.tasks
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_blueprint_in_user_organization(blueprint_id)
    AND creator_id = public.get_user_id()
);

-- Policy 3: UPDATE - Users can update tasks in their organization
CREATE POLICY "Users can update tasks in their organization"
ON public.tasks
FOR UPDATE
TO authenticated
USING (
    public.is_blueprint_in_user_organization(blueprint_id)
    AND deleted_at IS NULL
)
WITH CHECK (
    public.is_blueprint_in_user_organization(blueprint_id)
);

-- Policy 4: DELETE - Only admins can delete tasks
CREATE POLICY "Admins can delete tasks in their organization"
ON public.tasks
FOR DELETE
TO authenticated
USING (
    public.is_blueprint_in_user_organization(blueprint_id)
    AND public.get_user_role() = 'admin'
);

-- Policy 5: SELECT (Soft Deleted) - Admins can view deleted tasks
CREATE POLICY "Admins can view deleted tasks"
ON public.tasks
FOR SELECT
TO authenticated
USING (
    public.is_blueprint_in_user_organization(blueprint_id)
    AND deleted_at IS NOT NULL
    AND public.get_user_role() = 'admin'
);

RAISE NOTICE 'RLS policies for tasks table created successfully';

-- ============================================
-- Part 4: Logs Table RLS Policies
-- ============================================

-- Policy 1: SELECT - Users can view logs in their organization
CREATE POLICY "Users can view logs in their organization"
ON public.logs
FOR SELECT
TO authenticated
USING (
    public.is_blueprint_in_user_organization(blueprint_id)
    AND deleted_at IS NULL
);

-- Policy 2: INSERT - Users can create logs in their organization
CREATE POLICY "Users can create logs in their organization"
ON public.logs
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_blueprint_in_user_organization(blueprint_id)
    AND creator_id = public.get_user_id()
);

-- Policy 3: UPDATE - Users can update their own logs
CREATE POLICY "Users can update their own logs"
ON public.logs
FOR UPDATE
TO authenticated
USING (
    public.is_blueprint_in_user_organization(blueprint_id)
    AND creator_id = public.get_user_id()
    AND deleted_at IS NULL
)
WITH CHECK (
    public.is_blueprint_in_user_organization(blueprint_id)
    AND creator_id = public.get_user_id()
);

-- Policy 4: UPDATE (Admin) - Admins can update all logs
CREATE POLICY "Admins can update all logs in their organization"
ON public.logs
FOR UPDATE
TO authenticated
USING (
    public.is_blueprint_in_user_organization(blueprint_id)
    AND public.get_user_role() = 'admin'
    AND deleted_at IS NULL
)
WITH CHECK (
    public.is_blueprint_in_user_organization(blueprint_id)
);

-- Policy 5: DELETE - Users can delete their own logs, admins can delete all
CREATE POLICY "Users can delete their own logs or admins can delete all"
ON public.logs
FOR DELETE
TO authenticated
USING (
    public.is_blueprint_in_user_organization(blueprint_id)
    AND (
        creator_id = public.get_user_id()
        OR public.get_user_role() = 'admin'
    )
);

-- Policy 6: SELECT (Soft Deleted) - Admins can view deleted logs
CREATE POLICY "Admins can view deleted logs"
ON public.logs
FOR SELECT
TO authenticated
USING (
    public.is_blueprint_in_user_organization(blueprint_id)
    AND deleted_at IS NOT NULL
    AND public.get_user_role() = 'admin'
);

RAISE NOTICE 'RLS policies for logs table created successfully';

-- ============================================
-- Part 5: Storage Bucket Policies
-- ============================================

-- Note: Storage bucket policies need to be created via Supabase Dashboard or CLI
-- The following SQL shows the logic, but needs to be implemented as storage policies

-- Create storage bucket for task attachments (if not exists)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('task-attachments', 'task-attachments', false)
-- ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for log photos (if not exists)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('log-photos', 'log-photos', false)
-- ON CONFLICT (id) DO NOTHING;

-- Storage Policy Examples (to be implemented via Dashboard):
-- 
-- Bucket: task-attachments
-- SELECT Policy: Users can view attachments from their organization's tasks
-- INSERT Policy: Users can upload attachments to their organization's tasks
-- DELETE Policy: Task creators can delete their attachments
--
-- Bucket: log-photos
-- SELECT Policy: Users can view photos from their organization's logs
-- INSERT Policy: Users can upload photos to their organization's logs
-- DELETE Policy: Log creators can delete their photos

RAISE NOTICE 'Storage bucket policies need to be configured via Supabase Dashboard';

-- ============================================
-- Part 6: Anonymous Access Policies
-- ============================================

-- By default, anonymous users (anon role) have NO access
-- All policies above are for authenticated users only
-- This ensures data security and prevents unauthorized access

-- If you need to allow anonymous read access to specific data,
-- create separate policies for the anon role with strict conditions

RAISE NOTICE 'Anonymous access denied by default (secure by design)';

-- ============================================
-- Part 7: Testing and Verification
-- ============================================

-- Function to test RLS policies
CREATE OR REPLACE FUNCTION public.test_rls_policies()
RETURNS TABLE (
    test_name TEXT,
    passed BOOLEAN,
    message TEXT
) AS $$
BEGIN
    -- Test 1: Verify RLS is enabled
    RETURN QUERY
    SELECT 
        'RLS Enabled on Tasks'::TEXT,
        (SELECT relrowsecurity FROM pg_class WHERE relname = 'tasks')::BOOLEAN,
        'RLS should be enabled on tasks table'::TEXT;
    
    RETURN QUERY
    SELECT 
        'RLS Enabled on Logs'::TEXT,
        (SELECT relrowsecurity FROM pg_class WHERE relname = 'logs')::BOOLEAN,
        'RLS should be enabled on logs table'::TEXT;
    
    -- Test 2: Count policies
    RETURN QUERY
    SELECT 
        'Tasks Policies Count'::TEXT,
        (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'tasks') >= 5,
        'Should have at least 5 policies for tasks'::TEXT;
    
    RETURN QUERY
    SELECT 
        'Logs Policies Count'::TEXT,
        (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'logs') >= 6,
        'Should have at least 6 policies for logs'::TEXT;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Run tests
SELECT * FROM public.test_rls_policies();

-- ============================================
-- Migration Complete
-- ============================================

DO $$
DECLARE
    tasks_policies_count INTEGER;
    logs_policies_count INTEGER;
BEGIN
    -- Count policies
    SELECT COUNT(*) INTO tasks_policies_count FROM pg_policies WHERE tablename = 'tasks';
    SELECT COUNT(*) INTO logs_policies_count FROM pg_policies WHERE tablename = 'logs';
    
    IF tasks_policies_count >= 5 AND logs_policies_count >= 6 THEN
        RAISE NOTICE 'Migration 20251212_03_create_rls_policies completed successfully';
        RAISE NOTICE 'Tasks policies: %, Logs policies: %', tasks_policies_count, logs_policies_count;
    ELSE
        RAISE WARNING 'RLS policies may not be fully configured. Please verify.';
        RAISE WARNING 'Tasks policies: %, Logs policies: %', tasks_policies_count, logs_policies_count;
    END IF;
END $$;

-- ============================================
-- Security Checklist
-- ============================================

-- ✅ RLS enabled on all tables
-- ✅ Organization-based isolation implemented
-- ✅ Role-based access control (admin/member)
-- ✅ Creator-based permissions for logs
-- ✅ Soft delete support (deleted_at filtering)
-- ✅ Helper functions for JWT claims extraction
-- ✅ Default deny for anonymous users
-- ⚠️ Storage bucket policies need manual configuration
-- ⚠️ Requires blueprints table with organization_id column

-- ============================================
-- Next Steps
-- ============================================

-- 1. Configure Firebase Auth to include custom claims:
--    - organization_id: UUID of user's organization
--    - role: 'admin' | 'member' | 'viewer'
--
-- 2. Configure Storage Bucket Policies via Supabase Dashboard:
--    - Navigate to Storage -> Policies
--    - Create policies for task-attachments and log-photos buckets
--
-- 3. Test RLS policies with different user roles:
--    - Test as admin user
--    - Test as regular member
--    - Test cross-organization access (should be denied)
--
-- 4. Monitor RLS policy violations:
--    - Check Supabase logs for access denied errors
--    - Adjust policies if legitimate use cases are blocked
