-- ============================================================================
-- Task Quantity Expansion - RLS Policies
-- 任務數量擴展 - 行級安全政策
-- 
-- Version: 1.0.0
-- Date: 2025-12-12
-- Author: GigHub Development Team
-- Description: 為任務數量追蹤相關表格配置 RLS 政策
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE public.log_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_progress ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 1: log_tasks RLS Policies
-- 日誌-任務關聯表的 RLS 政策
-- ============================================================================

-- Policy: Allow authenticated users to view log_tasks in their organization
CREATE POLICY "Users can view log_tasks in their organization"
ON public.log_tasks
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.logs l
    JOIN public.blueprints b ON l.blueprint_id = b.id
    JOIN public.accounts a ON a.id = auth.uid()
    WHERE l.id = log_tasks.log_id
    AND b.organization_id = a.organization_id
  )
);

-- Policy: Allow users to insert log_tasks for logs they created
CREATE POLICY "Users can insert log_tasks for their logs"
ON public.log_tasks
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.logs l
    WHERE l.id = log_tasks.log_id
    AND l.creator_id = auth.uid()
  )
);

-- Policy: Allow users to update log_tasks for logs they created
CREATE POLICY "Users can update log_tasks for their logs"
ON public.log_tasks
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.logs l
    WHERE l.id = log_tasks.log_id
    AND l.creator_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.logs l
    WHERE l.id = log_tasks.log_id
    AND l.creator_id = auth.uid()
  )
);

-- Policy: Allow users to delete log_tasks for logs they created
CREATE POLICY "Users can delete log_tasks for their logs"
ON public.log_tasks
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.logs l
    WHERE l.id = log_tasks.log_id
    AND l.creator_id = auth.uid()
  )
);

-- Add comments
COMMENT ON POLICY "Users can view log_tasks in their organization" ON public.log_tasks IS 
'允許用戶查看其組織內的日誌任務記錄';
COMMENT ON POLICY "Users can insert log_tasks for their logs" ON public.log_tasks IS 
'允許用戶為自己建立的日誌新增任務記錄';

-- ============================================================================
-- SECTION 2: quality_controls RLS Policies
-- 品管表的 RLS 政策
-- ============================================================================

-- Policy: Allow authenticated users to view QC records in their organization
CREATE POLICY "Users can view QC records in their organization"
ON public.quality_controls
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.blueprints b
    JOIN public.accounts a ON a.id = auth.uid()
    WHERE b.id = quality_controls.blueprint_id
    AND b.organization_id = a.organization_id
  )
);

-- Policy: Allow QC inspectors to create QC records
CREATE POLICY "QC inspectors can create QC records"
ON public.quality_controls
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.accounts a
    WHERE a.id = auth.uid()
    AND (
      a.role = 'admin' 
      OR a.role = 'qc_inspector'
      OR a.permissions->>'can_create_qc' = 'true'
    )
  )
);

-- Policy: Allow assigned inspectors and admins to update QC records
CREATE POLICY "Assigned inspectors and admins can update QC records"
ON public.quality_controls
FOR UPDATE
TO authenticated
USING (
  inspector_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.accounts a
    WHERE a.id = auth.uid()
    AND a.role = 'admin'
  )
)
WITH CHECK (
  inspector_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.accounts a
    WHERE a.id = auth.uid()
    AND a.role = 'admin'
  )
);

-- Policy: Allow admins to delete QC records (soft delete)
CREATE POLICY "Admins can delete QC records"
ON public.quality_controls
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.accounts a
    WHERE a.id = auth.uid()
    AND a.role = 'admin'
  )
);

-- Add comments
COMMENT ON POLICY "Users can view QC records in their organization" ON public.quality_controls IS 
'允許用戶查看其組織內的品管記錄';
COMMENT ON POLICY "QC inspectors can create QC records" ON public.quality_controls IS 
'允許品管人員建立品管記錄';
COMMENT ON POLICY "Assigned inspectors and admins can update QC records" ON public.quality_controls IS 
'允許指派的品管人員和管理員更新品管記錄';

-- ============================================================================
-- SECTION 3: task_progress RLS Policies
-- 任務進度審計表的 RLS 政策
-- ============================================================================

-- Policy: Allow authenticated users to view task progress in their organization
CREATE POLICY "Users can view task progress in their organization"
ON public.task_progress
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    JOIN public.blueprints b ON t.blueprint_id = b.id
    JOIN public.accounts a ON a.id = auth.uid()
    WHERE t.id = task_progress.task_id
    AND b.organization_id = a.organization_id
  )
);

-- Policy: System can insert task progress records (typically via triggers/functions)
-- Users cannot directly insert, this is managed by the system
CREATE POLICY "System can insert task progress records"
ON public.task_progress
FOR INSERT
TO authenticated
WITH CHECK (
  -- Only allow if user has admin role or if it's triggered by system functions
  EXISTS (
    SELECT 1 FROM public.accounts a
    WHERE a.id = auth.uid()
    AND (
      a.role = 'admin'
      OR a.role = 'system'
    )
  )
  -- Note: Most inserts will be done by SECURITY DEFINER functions
);

-- Policy: Prevent updates to task progress (audit trail should be immutable)
-- Only admins can update in exceptional circumstances
CREATE POLICY "Only admins can update task progress"
ON public.task_progress
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.accounts a
    WHERE a.id = auth.uid()
    AND a.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.accounts a
    WHERE a.id = auth.uid()
    AND a.role = 'admin'
  )
);

-- Policy: Prevent deletion of task progress (audit trail)
-- Only admins can delete in exceptional circumstances
CREATE POLICY "Only admins can delete task progress"
ON public.task_progress
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.accounts a
    WHERE a.id = auth.uid()
    AND a.role = 'admin'
  )
);

-- Add comments
COMMENT ON POLICY "Users can view task progress in their organization" ON public.task_progress IS 
'允許用戶查看其組織內的任務進度審計記錄';
COMMENT ON POLICY "System can insert task progress records" ON public.task_progress IS 
'系統功能可以插入任務進度記錄（通常透過觸發器或 SECURITY DEFINER 函數）';
COMMENT ON POLICY "Only admins can update task progress" ON public.task_progress IS 
'只有管理員可以更新任務進度記錄（特殊情況）';

-- ============================================================================
-- SECTION 4: Additional Security Functions
-- 額外的安全函數
-- ============================================================================

-- Function to check if user can access blueprint
CREATE OR REPLACE FUNCTION public.user_can_access_blueprint(p_blueprint_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_can_access BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.blueprints b
    JOIN public.accounts a ON a.id = auth.uid()
    WHERE b.id = p_blueprint_id
    AND b.organization_id = a.organization_id
  ) INTO v_can_access;
  
  RETURN v_can_access;
END;
$$;

COMMENT ON FUNCTION public.user_can_access_blueprint IS '檢查用戶是否可以存取指定的藍圖';

-- Function to check if user is QC inspector
CREATE OR REPLACE FUNCTION public.user_is_qc_inspector()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_is_inspector BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.accounts
    WHERE id = auth.uid()
    AND (
      role = 'admin'
      OR role = 'qc_inspector'
      OR permissions->>'can_create_qc' = 'true'
    )
  ) INTO v_is_inspector;
  
  RETURN v_is_inspector;
END;
$$;

COMMENT ON FUNCTION public.user_is_qc_inspector IS '檢查用戶是否為品管人員';

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.user_is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.accounts
    WHERE id = auth.uid()
    AND role = 'admin'
  ) INTO v_is_admin;
  
  RETURN v_is_admin;
END;
$$;

COMMENT ON FUNCTION public.user_is_admin IS '檢查用戶是否為管理員';

-- ============================================================================
-- SECTION 5: Performance Optimization
-- 效能優化
-- ============================================================================

-- Create indexes on frequently queried RLS columns
CREATE INDEX IF NOT EXISTS idx_logs_creator_id ON public.logs(creator_id);
CREATE INDEX IF NOT EXISTS idx_blueprints_organization_id ON public.blueprints(organization_id);
CREATE INDEX IF NOT EXISTS idx_accounts_organization_id ON public.accounts(organization_id);
CREATE INDEX IF NOT EXISTS idx_accounts_role ON public.accounts(role);
CREATE INDEX IF NOT EXISTS idx_quality_controls_inspector_id ON public.quality_controls(inspector_id);

-- ============================================================================
-- Migration Complete
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 20251212_05_task_quantity_rls_policies.sql completed successfully';
  RAISE NOTICE 'Enabled RLS on: log_tasks, quality_controls, task_progress';
  RAISE NOTICE 'Created RLS policies for organization-level access control';
  RAISE NOTICE 'Created security helper functions';
  RAISE NOTICE 'Created performance optimization indexes';
END $$;
