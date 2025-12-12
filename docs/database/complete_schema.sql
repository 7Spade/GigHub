-- =============================================
-- GigHub Complete Database Schema
-- 工地施工進度追蹤管理系統 - 完整資料庫結構
-- =============================================
-- Description: Complete database schema for GigHub system
-- Created: 2025-12-12
-- Author: GigHub Development Team
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- FOUNDATION LAYER: Core Tables
-- =============================================

-- Accounts table (if not exists)
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Organizations table (if not exists)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- CONTAINER LAYER: Blueprints
-- =============================================

-- Blueprints table
CREATE TABLE IF NOT EXISTS public.blueprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    start_date DATE,
    end_date DATE,
    created_by UUID REFERENCES public.accounts(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_blueprints_organization ON public.blueprints(organization_id);
CREATE INDEX IF NOT EXISTS idx_blueprints_status ON public.blueprints(status);

-- =============================================
-- BUSINESS LAYER: Tasks
-- =============================================

-- Tasks table (if not exists)
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID NOT NULL REFERENCES public.blueprints(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(50) DEFAULT 'medium',
    assigned_to UUID REFERENCES public.accounts(id),
    due_date DATE,
    created_by UUID REFERENCES public.accounts(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    -- Quantity tracking fields
    total_quantity NUMERIC(10,2),
    unit VARCHAR(50),
    completed_quantity NUMERIC(10,2) DEFAULT 0,
    enable_quantity_tracking BOOLEAN DEFAULT FALSE,
    auto_complete_on_quantity_reached BOOLEAN DEFAULT TRUE,
    auto_send_to_qc BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_tasks_blueprint ON public.tasks(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_quantity_tracking ON public.tasks(enable_quantity_tracking) WHERE enable_quantity_tracking = TRUE;

-- =============================================
-- BUSINESS LAYER: Logs
-- =============================================

-- Logs table (general logs, if not exists)
CREATE TABLE IF NOT EXISTS public.logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID NOT NULL REFERENCES public.blueprints(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    log_type VARCHAR(50) DEFAULT 'general',
    created_by UUID REFERENCES public.accounts(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_logs_blueprint ON public.logs(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_logs_type ON public.logs(log_type);
CREATE INDEX IF NOT EXISTS idx_logs_created ON public.logs(created_at DESC);

-- =============================================
-- BUSINESS LAYER: Construction Logs
-- =============================================

-- Construction logs table
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
    creator_id UUID NOT NULL REFERENCES public.accounts(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    -- Reserved for future
    voice_records TEXT[],
    documents TEXT[],
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for construction_logs
CREATE INDEX IF NOT EXISTS idx_construction_logs_blueprint ON public.construction_logs(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_construction_logs_date ON public.construction_logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_construction_logs_creator ON public.construction_logs(creator_id);
CREATE INDEX IF NOT EXISTS idx_construction_logs_created ON public.construction_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_construction_logs_active ON public.construction_logs(blueprint_id, deleted_at) WHERE deleted_at IS NULL;

-- =============================================
-- BUSINESS LAYER: Log-Task Junction
-- =============================================

-- Log-Task junction table
CREATE TABLE IF NOT EXISTS public.log_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    log_id UUID NOT NULL REFERENCES public.logs(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    task_title VARCHAR(255) NOT NULL,
    quantity_completed NUMERIC(10,2) NOT NULL CHECK (quantity_completed > 0),
    unit VARCHAR(50) NOT NULL,
    notes TEXT,
    task_status_at_log VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_log_task UNIQUE(log_id, task_id)
);

CREATE INDEX IF NOT EXISTS idx_log_tasks_log ON public.log_tasks(log_id);
CREATE INDEX IF NOT EXISTS idx_log_tasks_task ON public.log_tasks(task_id);

-- =============================================
-- BUSINESS LAYER: Quality Control
-- =============================================

-- Quality control table
CREATE TABLE IF NOT EXISTS public.quality_controls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID NOT NULL REFERENCES public.blueprints(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    task_title VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    inspector_id UUID REFERENCES public.accounts(id),
    inspector_name VARCHAR(255),
    notes TEXT,
    photos TEXT[],
    issues JSONB,
    inspected_quantity NUMERIC(10,2),
    passed_quantity NUMERIC(10,2),
    rejected_quantity NUMERIC(10,2),
    unit VARCHAR(50),
    inspection_start_date TIMESTAMPTZ,
    inspection_end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_qc_blueprint ON public.quality_controls(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_qc_task ON public.quality_controls(task_id);
CREATE INDEX IF NOT EXISTS idx_qc_status ON public.quality_controls(status);
CREATE INDEX IF NOT EXISTS idx_qc_inspector ON public.quality_controls(inspector_id);

-- =============================================
-- BUSINESS LAYER: Task Progress Audit
-- =============================================

-- Task progress audit table
CREATE TABLE IF NOT EXISTS public.task_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    log_id UUID REFERENCES public.logs(id) ON DELETE SET NULL,
    qc_id UUID REFERENCES public.quality_controls(id) ON DELETE SET NULL,
    quantity_delta NUMERIC(10,2) NOT NULL,
    total_quantity NUMERIC(10,2) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    actor_id UUID NOT NULL REFERENCES public.accounts(id),
    actor_name VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_task_progress_task ON public.task_progress(task_id);
CREATE INDEX IF NOT EXISTS idx_task_progress_log ON public.task_progress(log_id);
CREATE INDEX IF NOT EXISTS idx_task_progress_qc ON public.task_progress(qc_id);
CREATE INDEX IF NOT EXISTS idx_task_progress_created ON public.task_progress(created_at DESC);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.construction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.log_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_progress ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (allow all for authenticated users - adjust as needed)
-- Blueprints
CREATE POLICY IF NOT EXISTS "Enable read access for authenticated users" ON public.blueprints
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Enable insert for authenticated users" ON public.blueprints
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Enable update for authenticated users" ON public.blueprints
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Construction Logs
CREATE POLICY IF NOT EXISTS "Enable read access for authenticated users" ON public.construction_logs
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Enable insert for authenticated users" ON public.construction_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Enable update for authenticated users" ON public.construction_logs
    FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Enable delete for authenticated users" ON public.construction_logs
    FOR DELETE USING (auth.role() = 'authenticated');

-- Tasks
CREATE POLICY IF NOT EXISTS "Enable read access for authenticated users" ON public.tasks
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Enable insert for authenticated users" ON public.tasks
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Enable update for authenticated users" ON public.tasks
    FOR UPDATE USING (auth.role() = 'authenticated');

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_blueprints_updated_at ON public.blueprints;
CREATE TRIGGER update_blueprints_updated_at
    BEFORE UPDATE ON public.blueprints
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_construction_logs_updated_at ON public.construction_logs;
CREATE TRIGGER update_construction_logs_updated_at
    BEFORE UPDATE ON public.construction_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_quality_controls_updated_at ON public.quality_controls;
CREATE TRIGGER update_quality_controls_updated_at
    BEFORE UPDATE ON public.quality_controls
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- SAMPLE DATA (Optional - for testing)
-- =============================================

-- Insert sample account (if not exists)
INSERT INTO public.accounts (id, email, display_name)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'admin@gighub.com', 'System Admin')
ON CONFLICT (email) DO NOTHING;

-- Insert sample organization (if not exists)
INSERT INTO public.organizations (id, name, description)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'GigHub Demo Organization', 'Demo organization for testing')
ON CONFLICT (id) DO NOTHING;

-- Insert sample blueprint (if not exists)
INSERT INTO public.blueprints (id, organization_id, name, description, status, created_by)
VALUES 
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Sample Construction Project', 'Demo project for testing construction logs', 'active', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '✅ GigHub database schema created successfully!';
    RAISE NOTICE '📊 Tables created: blueprints, construction_logs, tasks, logs, log_tasks, quality_controls, task_progress';
    RAISE NOTICE '🔒 RLS policies enabled';
    RAISE NOTICE '⚡ Triggers configured';
    RAISE NOTICE '✨ Sample data inserted';
END $$;
