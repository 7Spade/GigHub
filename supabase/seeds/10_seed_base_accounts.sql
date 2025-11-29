-- Seed: Base Accounts
-- Purpose: Create base accounts for testing
-- Order: 10
-- Note: This creates demo User accounts

-- ============================================================================
-- DEMO USER ACCOUNTS
-- ============================================================================

-- Demo user accounts (without auth.users, used for testing)
-- In real scenario, these would be created via the trigger when auth.users is created

INSERT INTO public.accounts (id, type, name, email, status)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'User', 'Demo User 1', 'demo1@example.com', 'active'),
  ('22222222-2222-2222-2222-222222222222', 'User', 'Demo User 2', 'demo2@example.com', 'active'),
  ('33333333-3333-3333-3333-333333333333', 'User', 'Demo User 3', 'demo3@example.com', 'active')
ON CONFLICT DO NOTHING;
