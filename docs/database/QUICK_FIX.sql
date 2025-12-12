-- =============================================
-- QUICK FIX: Construction Logs Table
-- 快速修復：工地施工日誌表
-- =============================================
-- This SQL creates the minimum required schema to fix the error:
-- "Could not find the table 'public.construction_logs'"
--
-- Execute this in Supabase SQL Editor:
-- https://supabase.com/dashboard → SQL Editor → New Query
-- =============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create accounts table (if not exists)
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create organizations table (if not exists)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create blueprints table (if not exists)
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

-- Create construction_logs table (MAIN FIX)
CREATE TABLE IF NOT EXISTS public.construction_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID NOT NULL REFERENCES public.blueprints(id) ON DELETE CASCADE ON UPDATE CASCADE,
    date TIMESTAMPTZ NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    work_hours NUMERIC(5,2),
    workers INTEGER,
    equipment TEXT,
    weather VARCHAR(50),
    temperature NUMERIC(5,2),
    photos JSONB DEFAULT '[]'::jsonb,
    creator_id UUID NOT NULL REFERENCES public.accounts(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    voice_records TEXT[],
    documents TEXT[],
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_blueprints_org ON public.blueprints(organization_id);
CREATE INDEX IF NOT EXISTS idx_construction_logs_blueprint ON public.construction_logs(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_construction_logs_date ON public.construction_logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_construction_logs_creator ON public.construction_logs(creator_id);

-- Enable RLS
ALTER TABLE public.blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.construction_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for construction_logs
DROP POLICY IF EXISTS "Enable read for all users" ON public.construction_logs;
CREATE POLICY "Enable read for all users" ON public.construction_logs
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.construction_logs;
CREATE POLICY "Enable insert for authenticated users" ON public.construction_logs
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.construction_logs;
CREATE POLICY "Enable update for authenticated users" ON public.construction_logs
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.construction_logs;
CREATE POLICY "Enable delete for authenticated users" ON public.construction_logs
    FOR DELETE USING (true);

-- Create blueprints RLS policies
DROP POLICY IF EXISTS "Enable read for all users" ON public.blueprints;
CREATE POLICY "Enable read for all users" ON public.blueprints
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.blueprints;
CREATE POLICY "Enable insert for authenticated users" ON public.blueprints
    FOR INSERT WITH CHECK (true);

-- Create trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
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

-- Insert test data
INSERT INTO public.accounts (id, email, display_name)
VALUES ('00000000-0000-0000-0000-000000000001', 'admin@gighub.com', 'System Admin')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.organizations (id, name, description)
VALUES ('00000000-0000-0000-0000-000000000001', 'GigHub Demo', 'Demo organization')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.blueprints (id, organization_id, name, description, status, created_by)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Sample Project',
    'Demo project for testing',
    'active',
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (id) DO NOTHING;

-- Verify installation
SELECT 'Setup completed! Tables created:' as message;
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('accounts', 'organizations', 'blueprints', 'construction_logs')
ORDER BY tablename;
