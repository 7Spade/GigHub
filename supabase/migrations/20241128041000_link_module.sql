-- Link Module Migration
-- Specification: docs/specs/setc/09-link-module.setc.md

-- ============================================================================
-- Table: links
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES public.blueprints(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title VARCHAR(255),
  description TEXT,
  category VARCHAR(50) NOT NULL DEFAULT 'other',
  thumbnail_url TEXT,
  favicon_url TEXT,
  is_valid BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES public.accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_links_blueprint ON public.links(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_links_category ON public.links(category);
CREATE INDEX IF NOT EXISTS idx_links_created_by ON public.links(created_by);

-- RLS
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "links_select_policy" ON public.links
  FOR SELECT USING (is_blueprint_member(blueprint_id));

CREATE POLICY "links_insert_policy" ON public.links
  FOR INSERT WITH CHECK (is_blueprint_member(blueprint_id));

CREATE POLICY "links_update_policy" ON public.links
  FOR UPDATE USING (is_blueprint_member(blueprint_id));

CREATE POLICY "links_delete_policy" ON public.links
  FOR DELETE USING (is_blueprint_member(blueprint_id));

-- Updated at trigger
CREATE TRIGGER links_updated_at
  BEFORE UPDATE ON public.links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
