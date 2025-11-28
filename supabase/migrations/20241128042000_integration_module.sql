-- Integration Module Migration
-- Specification: docs/specs/setc/11-module-integration.setc.md

-- ============================================================================
-- Table: activities
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES public.blueprints(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  entity_name VARCHAR(255),
  actor_id UUID NOT NULL REFERENCES public.accounts(id),
  changes JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_activities_blueprint ON public.activities(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_activities_entity ON public.activities(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activities_actor ON public.activities(actor_id);
CREATE INDEX IF NOT EXISTS idx_activities_created ON public.activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_event_type ON public.activities(event_type);

-- RLS
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activities_select_policy" ON public.activities
  FOR SELECT USING (is_blueprint_member(blueprint_id));

CREATE POLICY "activities_insert_policy" ON public.activities
  FOR INSERT WITH CHECK (is_blueprint_member(blueprint_id));

-- ============================================================================
-- Table: entity_links
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.entity_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES public.blueprints(id) ON DELETE CASCADE,
  source_type VARCHAR(50) NOT NULL,
  source_id UUID NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_id UUID NOT NULL,
  link_type VARCHAR(100) NOT NULL DEFAULT 'related',
  created_by UUID NOT NULL REFERENCES public.accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(source_type, source_id, target_type, target_id, link_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_entity_links_blueprint ON public.entity_links(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_entity_links_source ON public.entity_links(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_entity_links_target ON public.entity_links(target_type, target_id);

-- RLS
ALTER TABLE public.entity_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "entity_links_select_policy" ON public.entity_links
  FOR SELECT USING (is_blueprint_member(blueprint_id));

CREATE POLICY "entity_links_insert_policy" ON public.entity_links
  FOR INSERT WITH CHECK (is_blueprint_member(blueprint_id));

CREATE POLICY "entity_links_delete_policy" ON public.entity_links
  FOR DELETE USING (is_blueprint_member(blueprint_id));

-- ============================================================================
-- Function: record_activity
-- Helper function to record activities
-- ============================================================================

CREATE OR REPLACE FUNCTION record_activity(
  p_blueprint_id UUID,
  p_event_type VARCHAR(100),
  p_entity_type VARCHAR(50),
  p_entity_id UUID,
  p_entity_name VARCHAR(255) DEFAULT NULL,
  p_changes JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO public.activities (
    blueprint_id, event_type, entity_type, entity_id, entity_name, actor_id, changes
  ) VALUES (
    p_blueprint_id, p_event_type, p_entity_type, p_entity_id, p_entity_name, auth.uid(), p_changes
  )
  RETURNING id INTO v_activity_id;
  
  RETURN v_activity_id;
END;
$$;

-- ============================================================================
-- Function: search_entities
-- Full-text search across multiple entity types
-- ============================================================================

CREATE OR REPLACE FUNCTION search_entities(
  p_blueprint_id UUID,
  p_query TEXT,
  p_entity_types TEXT[] DEFAULT ARRAY['task', 'diary', 'file', 'link']
)
RETURNS TABLE (
  entity_type TEXT,
  entity_id UUID,
  title TEXT,
  snippet TEXT,
  score REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Search tasks
  IF 'task' = ANY(p_entity_types) THEN
    RETURN QUERY
    SELECT 
      'task'::TEXT,
      t.id,
      t.name,
      LEFT(t.description, 200),
      ts_rank(to_tsvector('simple', COALESCE(t.name, '') || ' ' || COALESCE(t.description, '')), plainto_tsquery('simple', p_query))
    FROM public.tasks t
    WHERE t.blueprint_id = p_blueprint_id
      AND t.deleted_at IS NULL
      AND (
        t.name ILIKE '%' || p_query || '%'
        OR t.description ILIKE '%' || p_query || '%'
      );
  END IF;
  
  -- Search files
  IF 'file' = ANY(p_entity_types) THEN
    RETURN QUERY
    SELECT 
      'file'::TEXT,
      f.id,
      f.name,
      LEFT(f.description, 200),
      ts_rank(to_tsvector('simple', COALESCE(f.name, '') || ' ' || COALESCE(f.description, '')), plainto_tsquery('simple', p_query))
    FROM public.files f
    WHERE f.blueprint_id = p_blueprint_id
      AND f.deleted_at IS NULL
      AND (
        f.name ILIKE '%' || p_query || '%'
        OR f.description ILIKE '%' || p_query || '%'
      );
  END IF;
  
  -- Search links
  IF 'link' = ANY(p_entity_types) THEN
    RETURN QUERY
    SELECT 
      'link'::TEXT,
      l.id,
      COALESCE(l.title, l.url),
      LEFT(l.description, 200),
      ts_rank(to_tsvector('simple', COALESCE(l.title, '') || ' ' || COALESCE(l.description, '') || ' ' || l.url), plainto_tsquery('simple', p_query))
    FROM public.links l
    WHERE l.blueprint_id = p_blueprint_id
      AND l.deleted_at IS NULL
      AND (
        l.title ILIKE '%' || p_query || '%'
        OR l.description ILIKE '%' || p_query || '%'
        OR l.url ILIKE '%' || p_query || '%'
      );
  END IF;
END;
$$;
