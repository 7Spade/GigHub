-- ============================================================================
-- Task Quantity Expansion - Database Migration
-- 任務數量擴展 - 資料庫遷移
-- 
-- Version: 1.0.0
-- Date: 2025-12-12
-- Author: GigHub Development Team
-- Description: 擴展任務系統以支援數量追蹤、工作流自動化和品管功能
-- ============================================================================

-- SECTION 0: Create Required Referenced Tables (Stubs for now)
-- 建立必需的參考表格（暫時為存根）

-- Create accounts table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'member',
    organization_id UUID,
    permissions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    CONSTRAINT accounts_role_check CHECK (role IN ('admin', 'member', 'viewer', 'qc_inspector', 'system'))
);

-- Create indexes on accounts
CREATE INDEX IF NOT EXISTS idx_accounts_email ON public.accounts(email);
CREATE INDEX IF NOT EXISTS idx_accounts_organization_id ON public.accounts(organization_id);
CREATE INDEX IF NOT EXISTS idx_accounts_role ON public.accounts(role);

COMMENT ON TABLE public.accounts IS '帳號表格：用於用戶管理（暫時存根）';

-- Create blueprints table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.blueprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    CONSTRAINT blueprints_status_check CHECK (status IN ('active', 'archived', 'deleted'))
);

-- Create indexes on blueprints
CREATE INDEX IF NOT EXISTS idx_blueprints_organization_id ON public.blueprints(organization_id);
CREATE INDEX IF NOT EXISTS idx_blueprints_status ON public.blueprints(status);

COMMENT ON TABLE public.blueprints IS '藍圖表格：用於項目管理（暫時存根）';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blueprints TO authenticated;

DO $$
BEGIN
    RAISE NOTICE 'Created stub tables: accounts, blueprints';
END $$;

-- SECTION 1: Extend Tasks Table with Quantity Fields
-- 擴展任務表格，增加數量追蹤欄位
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS total_quantity DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS unit VARCHAR(50),
ADD COLUMN IF NOT EXISTS completed_quantity DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS enable_quantity_tracking BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS auto_complete_on_quantity_reached BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS auto_send_to_qc BOOLEAN DEFAULT TRUE;

-- Add index for quantity tracking queries
CREATE INDEX IF NOT EXISTS idx_tasks_quantity_tracking 
  ON public.tasks(enable_quantity_tracking) WHERE enable_quantity_tracking = TRUE;

-- Add comment for documentation
COMMENT ON COLUMN public.tasks.total_quantity IS 'Total quantity required for this task (e.g., 100 units)';
COMMENT ON COLUMN public.tasks.unit IS 'Unit of measurement (e.g., 件, m³, kg)';
COMMENT ON COLUMN public.tasks.completed_quantity IS 'Completed quantity (calculated from logs)';
COMMENT ON COLUMN public.tasks.enable_quantity_tracking IS 'Whether quantity tracking is enabled for this task';
COMMENT ON COLUMN public.tasks.auto_complete_on_quantity_reached IS 'Auto complete task when quantity reached';
COMMENT ON COLUMN public.tasks.auto_send_to_qc IS 'Auto send to QC when completed';

-- ============================================================================
-- SECTION 2: Create Log-Task Junction Table
-- 建立日誌-任務關聯表，用於記錄每次施工日誌中完成的任務數量
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.log_tasks (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  log_id UUID NOT NULL REFERENCES public.logs(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  
  -- Task Information (cached for display)
  task_title VARCHAR(255) NOT NULL,
  
  -- Quantity Information
  quantity_completed DECIMAL(10,2) NOT NULL CHECK (quantity_completed > 0),
  unit VARCHAR(50) NOT NULL,
  
  -- Additional Information
  notes TEXT,
  task_status_at_log VARCHAR(50),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT uq_log_task UNIQUE(log_id, task_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_log_tasks_log_id ON public.log_tasks(log_id);
CREATE INDEX IF NOT EXISTS idx_log_tasks_task_id ON public.log_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_log_tasks_created_at ON public.log_tasks(created_at DESC);

-- Add comments
COMMENT ON TABLE public.log_tasks IS '日誌-任務關聯表：記錄每次施工日誌中完成的任務及數量';
COMMENT ON COLUMN public.log_tasks.quantity_completed IS 'Quantity completed in this specific log entry';
COMMENT ON COLUMN public.log_tasks.task_status_at_log IS 'Task status at the time of log creation';

-- ============================================================================
-- SECTION 3: Create Quality Control Table
-- 建立品管表，用於品質控制和驗收流程
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.quality_controls (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  blueprint_id UUID NOT NULL REFERENCES public.blueprints(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  inspector_id UUID REFERENCES public.accounts(id),
  
  -- Task Information (cached)
  task_title VARCHAR(255) NOT NULL,
  
  -- QC Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  
  -- Inspector Information (cached)
  inspector_name VARCHAR(255),
  
  -- QC Details
  notes TEXT,
  photos TEXT[], -- Array of photo URLs
  issues JSONB, -- Structured list of issues found
  
  -- Quantity Information
  inspected_quantity DECIMAL(10,2),
  passed_quantity DECIMAL(10,2),
  rejected_quantity DECIMAL(10,2),
  unit VARCHAR(50),
  
  -- Dates
  inspection_start_date TIMESTAMPTZ,
  inspection_end_date TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ, -- Soft delete
  
  -- Metadata
  metadata JSONB,
  
  -- Constraints
  CONSTRAINT qc_status_check CHECK (status IN ('pending', 'in_progress', 'passed', 'rejected', 'cancelled'))
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_qc_task_id ON public.quality_controls(task_id);
CREATE INDEX IF NOT EXISTS idx_qc_blueprint_id ON public.quality_controls(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_qc_status ON public.quality_controls(status);
CREATE INDEX IF NOT EXISTS idx_qc_inspector_id ON public.quality_controls(inspector_id);
CREATE INDEX IF NOT EXISTS idx_qc_created_at ON public.quality_controls(created_at DESC);

-- Add comments
COMMENT ON TABLE public.quality_controls IS '品管表：用於任務的品質控制和驗收流程';
COMMENT ON COLUMN public.quality_controls.status IS 'QC Status: pending, in_progress, passed, rejected, cancelled';
COMMENT ON COLUMN public.quality_controls.issues IS 'Structured list of issues found during inspection (JSONB format)';
COMMENT ON COLUMN public.quality_controls.passed_quantity IS 'Quantity that passed QC inspection';
COMMENT ON COLUMN public.quality_controls.rejected_quantity IS 'Quantity that was rejected during QC';

-- ============================================================================
-- SECTION 4: Create Task Progress Audit Table
-- 建立任務進度審計表，用於追蹤數量變化歷史
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.task_progress (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  log_id UUID REFERENCES public.logs(id) ON DELETE SET NULL,
  qc_id UUID REFERENCES public.quality_controls(id) ON DELETE SET NULL,
  actor_id UUID NOT NULL REFERENCES public.accounts(id),
  
  -- Progress Information
  quantity_delta DECIMAL(10,2) NOT NULL, -- Change amount (can be positive or negative)
  total_quantity DECIMAL(10,2) NOT NULL, -- Total quantity after this change
  
  -- Action Information
  action_type VARCHAR(50) NOT NULL,
  actor_name VARCHAR(255), -- Cached for display
  notes TEXT,
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB,
  
  -- Constraints
  CONSTRAINT task_progress_action_type_check CHECK (
    action_type IN ('log_submit', 'manual_adjust', 'qc_adjust', 'admin_override')
  )
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_task_progress_task_id ON public.task_progress(task_id);
CREATE INDEX IF NOT EXISTS idx_task_progress_log_id ON public.task_progress(log_id);
CREATE INDEX IF NOT EXISTS idx_task_progress_qc_id ON public.task_progress(qc_id);
CREATE INDEX IF NOT EXISTS idx_task_progress_actor_id ON public.task_progress(actor_id);
CREATE INDEX IF NOT EXISTS idx_task_progress_created_at ON public.task_progress(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_progress_action_type ON public.task_progress(action_type);

-- Add comments
COMMENT ON TABLE public.task_progress IS '任務進度審計表：追蹤所有數量變化的完整歷史記錄';
COMMENT ON COLUMN public.task_progress.quantity_delta IS 'Change in quantity (positive for additions, negative for reductions)';
COMMENT ON COLUMN public.task_progress.total_quantity IS 'Total completed quantity after this change';
COMMENT ON COLUMN public.task_progress.action_type IS 'Type of action: log_submit, manual_adjust, qc_adjust, admin_override';

-- ============================================================================
-- SECTION 5: Update Task Status Enum (if needed)
-- 更新任務狀態枚舉，增加品管相關狀態
-- ============================================================================

-- Note: The tasks table already has status check constraint
-- We need to modify it to include new QC-related statuses
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_status_check;

ALTER TABLE public.tasks
ADD CONSTRAINT tasks_status_check CHECK (
  status IN (
    'TODO',
    'IN_PROGRESS',
    'REVIEW',
    'COMPLETED',
    'CANCELLED',
    'PENDING_QC',        -- 等待品管
    'QC_IN_PROGRESS',    -- 品管中
    'QC_PASSED',         -- 品管通過
    'QC_REJECTED'        -- 品管駁回
  )
);

-- ============================================================================
-- SECTION 6: Create Helper Functions (Optional)
-- 建立輔助函數，用於自動化和資料一致性
-- ============================================================================

-- Function to calculate total completed quantity from log_tasks
CREATE OR REPLACE FUNCTION public.calculate_task_completed_quantity(p_task_id UUID)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total DECIMAL(10,2);
BEGIN
  SELECT COALESCE(SUM(quantity_completed), 0)
  INTO v_total
  FROM public.log_tasks
  WHERE task_id = p_task_id;
  
  RETURN v_total;
END;
$$;

COMMENT ON FUNCTION public.calculate_task_completed_quantity IS '計算任務的總完成數量（從 log_tasks 累加）';

-- Function to update task completed quantity
CREATE OR REPLACE FUNCTION public.update_task_completed_quantity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the completed_quantity in tasks table
  UPDATE public.tasks
  SET 
    completed_quantity = public.calculate_task_completed_quantity(NEW.task_id),
    updated_at = NOW()
  WHERE id = NEW.task_id;
  
  RETURN NEW;
END;
$$;

-- Trigger to automatically update task completed quantity when log_tasks changes
DROP TRIGGER IF EXISTS trigger_update_task_quantity ON public.log_tasks;

CREATE TRIGGER trigger_update_task_quantity
AFTER INSERT OR UPDATE OR DELETE ON public.log_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_task_completed_quantity();

COMMENT ON TRIGGER trigger_update_task_quantity ON public.log_tasks IS '自動更新任務完成數量的觸發器';

-- ============================================================================
-- SECTION 7: Grant Permissions (RLS will be configured separately)
-- 授予權限（RLS 政策將另外配置）
-- ============================================================================

-- Grant basic permissions to authenticated users
-- Note: Specific RLS policies should be configured based on your security requirements

-- Grant SELECT to authenticated users on new tables
-- GRANT SELECT ON public.log_tasks TO authenticated;
-- GRANT SELECT ON public.quality_controls TO authenticated;
-- GRANT SELECT ON public.task_progress TO authenticated;

-- Note: INSERT, UPDATE, DELETE permissions should be granted through RLS policies
-- based on specific business rules and user roles

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Add migration metadata
DO $$
BEGIN
  RAISE NOTICE 'Migration 20251212_04_task_quantity_expansion.sql completed successfully';
  RAISE NOTICE 'Created tables: log_tasks, quality_controls, task_progress';
  RAISE NOTICE 'Extended table: tasks (added quantity tracking fields)';
  RAISE NOTICE 'Created indexes for performance optimization';
  RAISE NOTICE 'Created helper functions and triggers for automatic quantity calculation';
END $$;
