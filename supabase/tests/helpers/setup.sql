-- Test Helper: Setup
-- Purpose: Common setup functions for tests
-- Usage: Run this before any test suite

-- ============================================================================
-- TEST USER SETUP
-- ============================================================================

-- Create a test user context
CREATE OR REPLACE FUNCTION tests.setup_test_user(p_auth_user_id UUID DEFAULT gen_random_uuid())
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET row_security = off
AS $$
DECLARE
  v_account_id UUID;
BEGIN
  -- Create test account
  INSERT INTO public.accounts (auth_user_id, type, name, email, status)
  VALUES (p_auth_user_id, 'User', 'Test User', 'test@example.com', 'active')
  RETURNING id INTO v_account_id;
  
  RETURN v_account_id;
END;
$$;

-- ============================================================================
-- TEST CLEANUP
-- ============================================================================

CREATE OR REPLACE FUNCTION tests.cleanup_test_data()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET row_security = off
AS $$
BEGIN
  -- Clean up test data (in reverse order of dependencies)
  DELETE FROM public.tasks WHERE created_by IN (
    SELECT id FROM public.accounts WHERE email LIKE 'test%@example.com'
  );
  DELETE FROM public.blueprint_members WHERE account_id IN (
    SELECT id FROM public.accounts WHERE email LIKE 'test%@example.com'
  );
  DELETE FROM public.blueprints WHERE created_by IN (
    SELECT id FROM public.accounts WHERE email LIKE 'test%@example.com'
  );
  DELETE FROM public.team_members WHERE account_id IN (
    SELECT id FROM public.accounts WHERE email LIKE 'test%@example.com'
  );
  DELETE FROM public.teams WHERE created_by IN (
    SELECT id FROM public.accounts WHERE email LIKE 'test%@example.com'
  );
  DELETE FROM public.organization_members WHERE account_id IN (
    SELECT id FROM public.accounts WHERE email LIKE 'test%@example.com'
  );
  DELETE FROM public.accounts WHERE email LIKE 'test%@example.com';
END;
$$;
