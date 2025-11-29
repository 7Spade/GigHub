-- Seed: Teams
-- Purpose: Create demo teams within organizations
-- Order: 21
-- Dependencies: 20_seed_organizations.sql

-- ============================================================================
-- DEMO TEAMS
-- ============================================================================

INSERT INTO public.teams (id, organization_id, name, description, created_by)
VALUES 
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Site Team A', 'Main construction team', '11111111-1111-1111-1111-111111111111')
ON CONFLICT DO NOTHING;

-- Add team members
INSERT INTO public.team_members (team_id, account_id, role, auth_user_id)
VALUES 
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'leader', NULL),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', 'member', NULL)
ON CONFLICT DO NOTHING;
