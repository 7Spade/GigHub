-- =============================================
-- Blueprints Table Schema
-- 藍圖資料表結構
-- =============================================
-- Description: Core blueprints table for project management
-- Created: 2025-12-12
-- Author: GigHub Development Team
-- =============================================

-- Create owner_type enum if not exists
DO $$ BEGIN
    CREATE TYPE owner_type AS ENUM ('organization', 'personal');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create blueprint_status enum if not exists
DO $$ BEGIN
    CREATE TYPE blueprint_status AS ENUM ('draft', 'active', 'archived', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create module_type enum if not exists
DO $$ BEGIN
    CREATE TYPE module_type AS ENUM ('task', 'log', 'quality', 'member', 'document', 'schedule');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create blueprints table
CREATE TABLE IF NOT EXISTS public.blueprints (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic information
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    cover_url TEXT,
    
    -- Ownership
    owner_id UUID NOT NULL,
    owner_type owner_type NOT NULL DEFAULT 'personal',
    
    -- Visibility and status
    is_public BOOLEAN NOT NULL DEFAULT false,
    status blueprint_status NOT NULL DEFAULT 'draft',
    enabled_modules module_type[] DEFAULT ARRAY['task', 'log']::module_type[],
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Audit fields
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT blueprints_slug_unique UNIQUE (slug)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_blueprints_owner ON public.blueprints(owner_id, owner_type);
CREATE INDEX IF NOT EXISTS idx_blueprints_status ON public.blueprints(status);
CREATE INDEX IF NOT EXISTS idx_blueprints_slug ON public.blueprints(slug);
CREATE INDEX IF NOT EXISTS idx_blueprints_created_by ON public.blueprints(created_by);
CREATE INDEX IF NOT EXISTS idx_blueprints_deleted_at ON public.blueprints(deleted_at);

-- Enable Row Level Security
ALTER TABLE public.blueprints ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow public read for public blueprints" 
ON public.blueprints FOR SELECT 
USING (is_public = true AND deleted_at IS NULL);

CREATE POLICY "Allow owner full access" 
ON public.blueprints FOR ALL 
USING (created_by = auth.uid());

-- Add comment
COMMENT ON TABLE public.blueprints IS 'Core blueprints table for project management system';
