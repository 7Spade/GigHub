-- Seed: Blueprints
-- Purpose: Create demo blueprints
-- Order: 22
-- Dependencies: 20_seed_organizations.sql

-- ============================================================================
-- DEMO BLUEPRINTS
-- ============================================================================

INSERT INTO public.blueprints (id, owner_id, name, description, slug, status, visibility, category, created_by)
VALUES 
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'Demo Project', 'A demo construction project', 'demo-project', 'active', 'private', 'construction', '11111111-1111-1111-1111-111111111111'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Company Template', 'Company-wide project template', 'company-template', 'active', 'internal', 'construction', '11111111-1111-1111-1111-111111111111')
ON CONFLICT DO NOTHING;

-- Add blueprint members
INSERT INTO public.blueprint_members (blueprint_id, account_id, role, auth_user_id)
VALUES 
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'owner', NULL),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'admin', NULL),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 'member', NULL),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', 'owner', NULL),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '22222222-2222-2222-2222-222222222222', 'viewer', NULL)
ON CONFLICT DO NOTHING;
