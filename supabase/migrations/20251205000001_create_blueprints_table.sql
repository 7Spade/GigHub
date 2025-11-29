-- Migration: Create Blueprints Table
-- Purpose: Create the blueprints container table
-- Phase: 5 - Blueprint System
-- Created: 2025-12-01
-- Dependencies: Phase 4 (Triggers)
-- Source: migrations-old/20251129000001_create_blueprints_table.sql

-- ============================================================================
-- BLUEPRINTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  slug VARCHAR(100),
  status TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('draft', 'active', 'archived', 'deleted')),
  visibility TEXT DEFAULT 'private' NOT NULL CHECK (visibility IN ('private', 'internal', 'public')),
  category TEXT CHECK (category IN ('construction', 'renovation', 'maintenance', 'inspection', 'other')),
  settings JSONB DEFAULT '{}' NOT NULL,
  metadata JSONB DEFAULT '{}' NOT NULL,
  cover_image_url TEXT,
  created_by UUID NOT NULL REFERENCES public.accounts(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  deleted_at TIMESTAMPTZ,
  UNIQUE (owner_id, slug)
);

COMMENT ON TABLE public.blueprints IS
'Blueprints are logical containers providing data isolation for workspaces.
Each blueprint belongs to an owner (user, organization, or team).
Status: draft, active, archived, deleted. Visibility: private, internal, public.';

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_blueprints_owner_id ON public.blueprints(owner_id);
CREATE INDEX IF NOT EXISTS idx_blueprints_status ON public.blueprints(status) WHERE status != 'deleted';
CREATE INDEX IF NOT EXISTS idx_blueprints_visibility ON public.blueprints(visibility);
CREATE INDEX IF NOT EXISTS idx_blueprints_slug ON public.blueprints(slug);
CREATE INDEX IF NOT EXISTS idx_blueprints_created_by ON public.blueprints(created_by);

-- ============================================================================
-- TRIGGER
-- ============================================================================

DROP TRIGGER IF EXISTS update_blueprints_updated_at ON public.blueprints;
CREATE TRIGGER update_blueprints_updated_at
  BEFORE UPDATE ON public.blueprints
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT ALL ON TABLE public.blueprints TO authenticated;
GRANT ALL ON TABLE public.blueprints TO service_role;
