-- ============================================================================
-- Migration: Create Activities Table
-- Description: Activity timeline for blueprint events
-- Specification: docs/specs/setc/11-module-integration.setc.md
-- ============================================================================

-- Create activities table
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  entity_name VARCHAR(500),
  actor_id UUID NOT NULL REFERENCES accounts(id),
  changes JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_activities_blueprint_id ON activities(blueprint_id);
CREATE INDEX idx_activities_event_type ON activities(event_type);
CREATE INDEX idx_activities_entity_type ON activities(entity_type);
CREATE INDEX idx_activities_actor_id ON activities(actor_id);
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);

-- Add comments
COMMENT ON TABLE activities IS '活動記錄表 - 統一時間軸';
COMMENT ON COLUMN activities.event_type IS '事件類型 (task.created, diary.submitted 等)';
COMMENT ON COLUMN activities.entity_type IS '實體類型 (task, diary, file 等)';
COMMENT ON COLUMN activities.entity_id IS '實體 ID';
COMMENT ON COLUMN activities.entity_name IS '實體名稱快照';
COMMENT ON COLUMN activities.changes IS '變更內容 JSONB';

-- Enable RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- SELECT: Blueprint members can view activities
CREATE POLICY "blueprint_members_can_view_activities" ON activities FOR SELECT
USING (is_blueprint_member(blueprint_id));

-- INSERT: Only via triggers or edge functions (system-generated)
-- No direct user insert policy
