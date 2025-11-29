-- Seed: Organizations
-- Purpose: Create demo organizations
-- Order: 20
-- Dependencies: 10_seed_base_accounts.sql

-- ============================================================================
-- DEMO ORGANIZATIONS
-- ============================================================================

INSERT INTO public.accounts (id, type, name, email, status, auth_user_id)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Organization', 'Demo Construction Co.', 'admin@democonstruction.com', 'active', NULL)
ON CONFLICT DO NOTHING;

-- Add organization members
INSERT INTO public.organization_members (organization_id, account_id, role, auth_user_id)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'owner', NULL),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'admin', NULL),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'member', NULL)
ON CONFLICT DO NOTHING;
