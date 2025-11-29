-- Seed: Tasks
-- Purpose: Create demo tasks
-- Order: 23
-- Dependencies: 22_seed_blueprints.sql

-- ============================================================================
-- DEMO TASKS
-- ============================================================================

INSERT INTO public.tasks (id, blueprint_id, title, description, status, priority, task_type, assignee_id, created_by, sort_order)
VALUES 
  -- Root tasks
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Phase 1: Foundation', 'Foundation work for the building', 'in_progress', 'high', 'milestone', NULL, '11111111-1111-1111-1111-111111111111', 1),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Phase 2: Structure', 'Main structure construction', 'pending', 'medium', 'milestone', NULL, '11111111-1111-1111-1111-111111111111', 2)
ON CONFLICT DO NOTHING;

-- Child tasks
INSERT INTO public.tasks (id, blueprint_id, parent_id, title, description, status, priority, task_type, assignee_id, created_by, sort_order)
VALUES 
  ('11111111-aaaa-aaaa-aaaa-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Excavation', 'Dig foundation trenches', 'completed', 'high', 'task', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 1),
  ('22222222-bbbb-bbbb-bbbb-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Pour Concrete', 'Pour foundation concrete', 'in_progress', 'high', 'task', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 2),
  ('33333333-cccc-cccc-cccc-333333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Cure Time', 'Allow concrete to cure', 'pending', 'medium', 'task', NULL, '11111111-1111-1111-1111-111111111111', 3)
ON CONFLICT DO NOTHING;
