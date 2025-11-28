-- File Module Migration
-- Specification: docs/specs/setc/08-file-module.setc.md

-- ============================================================================
-- Table: files
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES public.blueprints(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.files(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL DEFAULT 'other',
  mime_type VARCHAR(255),
  size_bytes BIGINT,
  storage_path TEXT,
  description TEXT,
  created_by UUID NOT NULL REFERENCES public.accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_files_blueprint ON public.files(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_files_parent ON public.files(parent_id);
CREATE INDEX IF NOT EXISTS idx_files_type ON public.files(file_type);
CREATE INDEX IF NOT EXISTS idx_files_created_by ON public.files(created_by);

-- RLS
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "files_select_policy" ON public.files
  FOR SELECT USING (is_blueprint_member(blueprint_id));

CREATE POLICY "files_insert_policy" ON public.files
  FOR INSERT WITH CHECK (is_blueprint_member(blueprint_id));

CREATE POLICY "files_update_policy" ON public.files
  FOR UPDATE USING (is_blueprint_member(blueprint_id));

CREATE POLICY "files_delete_policy" ON public.files
  FOR DELETE USING (is_blueprint_member(blueprint_id));

-- ============================================================================
-- Table: file_versions
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.file_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  storage_path TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  created_by UUID NOT NULL REFERENCES public.accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_file_versions_file ON public.file_versions(file_id);

-- RLS
ALTER TABLE public.file_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "file_versions_select_policy" ON public.file_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.files f 
      WHERE f.id = file_id AND is_blueprint_member(f.blueprint_id)
    )
  );

CREATE POLICY "file_versions_insert_policy" ON public.file_versions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.files f 
      WHERE f.id = file_id AND is_blueprint_member(f.blueprint_id)
    )
  );

-- ============================================================================
-- Table: file_shares
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.file_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  share_token VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  expires_at TIMESTAMPTZ,
  max_access_count INTEGER,
  access_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES public.accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_file_shares_token ON public.file_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_file_shares_file ON public.file_shares(file_id);

-- RLS
ALTER TABLE public.file_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "file_shares_select_policy" ON public.file_shares
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.files f 
      WHERE f.id = file_id AND is_blueprint_member(f.blueprint_id)
    )
  );

CREATE POLICY "file_shares_insert_policy" ON public.file_shares
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.files f 
      WHERE f.id = file_id AND is_blueprint_member(f.blueprint_id)
    )
  );

CREATE POLICY "file_shares_update_policy" ON public.file_shares
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.files f 
      WHERE f.id = file_id AND is_blueprint_member(f.blueprint_id)
    )
  );

CREATE POLICY "file_shares_delete_policy" ON public.file_shares
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.files f 
      WHERE f.id = file_id AND is_blueprint_member(f.blueprint_id)
    )
  );

-- Updated at trigger
CREATE TRIGGER files_updated_at
  BEFORE UPDATE ON public.files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
