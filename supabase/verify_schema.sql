-- Verification Script: Check database schema consistency with migrations
-- Purpose: Verify that all required tables, functions, and RLS policies exist
-- Created: 2025-11-29
--
-- Run this script against your Supabase database to verify the schema
-- Usage: Via Supabase MCP or SQL Editor in Supabase Dashboard

-- ============================================================================
-- SECTION 1: CORE HELPER FUNCTIONS VERIFICATION
-- ============================================================================

SELECT '=== CORE HELPER FUNCTIONS ===' AS section;

SELECT 
  p.proname AS function_name,
  CASE 
    WHEN p.prosecdef THEN '✅ SECURITY DEFINER'
    ELSE '❌ Not SECURITY DEFINER'
  END AS security_status,
  pg_get_function_result(p.oid) AS return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'get_user_account_id',
    'is_org_member',
    'is_org_admin',
    'is_org_owner',
    'is_team_member',
    'is_team_leader',
    'organization_has_members',
    'is_blueprint_member', 
    'is_blueprint_admin', 
    'is_blueprint_owner',
    'can_access_task',
    'can_access_checklist',
    'is_checklist_admin'
  )
ORDER BY p.proname;

-- ============================================================================
-- SECTION 2: BLUEPRINT HELPER FUNCTIONS (Critical for 42501 fix)
-- ============================================================================

SELECT '=== BLUEPRINT HELPER FUNCTIONS (Critical) ===' AS section;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_blueprint_member') 
    THEN '✅ is_blueprint_member exists'
    ELSE '❌ is_blueprint_member MISSING'
  END AS is_blueprint_member_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_blueprint_admin') 
    THEN '✅ is_blueprint_admin exists'
    ELSE '❌ is_blueprint_admin MISSING'
  END AS is_blueprint_admin_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_blueprint_owner') 
    THEN '✅ is_blueprint_owner exists'
    ELSE '❌ is_blueprint_owner MISSING'
  END AS is_blueprint_owner_status;

-- ============================================================================
-- SECTION 3: TABLES VERIFICATION
-- ============================================================================

SELECT '=== TABLES ===' AS section;

SELECT 
  table_name,
  '✅ Exists' AS status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'accounts',
    'organization_members',
    'teams',
    'team_members',
    'team_bots',
    'blueprints',
    'blueprint_members',
    'tasks',
    'task_attachments',
    'checklists',
    'checklist_items',
    'task_acceptances'
  )
ORDER BY table_name;

-- ============================================================================
-- SECTION 4: RLS ENABLED CHECK
-- ============================================================================

SELECT '=== RLS ENABLED STATUS ===' AS section;

SELECT 
  relname AS table_name,
  CASE 
    WHEN relrowsecurity THEN '✅ RLS Enabled'
    ELSE '❌ RLS Disabled'
  END AS rls_status
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname IN (
    'accounts',
    'organization_members',
    'teams',
    'team_members',
    'team_bots',
    'blueprints',
    'blueprint_members',
    'tasks',
    'task_attachments',
    'checklists',
    'checklist_items',
    'task_acceptances'
  )
ORDER BY relname;

-- ============================================================================
-- SECTION 5: RLS POLICIES COUNT BY TABLE
-- ============================================================================

SELECT '=== RLS POLICIES COUNT BY TABLE ===' AS section;

SELECT 
  tablename,
  COUNT(*) AS policy_count,
  string_agg(cmd, ', ' ORDER BY cmd) AS operations_covered
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'accounts',
    'organization_members',
    'teams',
    'team_members',
    'blueprints',
    'blueprint_members',
    'tasks',
    'task_attachments',
    'checklists',
    'checklist_items',
    'task_acceptances'
  )
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- SECTION 6: BLUEPRINT-SPECIFIC POLICIES
-- ============================================================================

SELECT '=== BLUEPRINT POLICIES ===' AS section;

SELECT 
  tablename,
  policyname,
  cmd AS operation,
  '✅' AS status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('blueprints', 'blueprint_members')
ORDER BY tablename, cmd, policyname;

-- ============================================================================
-- SECTION 7: TASK-SPECIFIC POLICIES
-- ============================================================================

SELECT '=== TASK POLICIES ===' AS section;

SELECT 
  tablename,
  policyname,
  cmd AS operation,
  '✅' AS status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('tasks', 'task_attachments', 'checklists', 'checklist_items', 'task_acceptances')
ORDER BY tablename, cmd, policyname;

-- ============================================================================
-- SECTION 8: OVERALL SUMMARY
-- ============================================================================

SELECT '=== SUMMARY ===' AS section;

SELECT 
  (SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_schema = 'public' AND table_type = 'BASE TABLE') AS total_tables,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') AS total_policies,
  (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
   WHERE n.nspname = 'public' AND p.prosecdef = true) AS security_definer_functions,
  (SELECT COUNT(*) FROM pg_class c JOIN pg_namespace n ON c.relnamespace = n.oid 
   WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity = true) AS tables_with_rls;

-- ============================================================================
-- SECTION 9: 42501 FIX VERIFICATION
-- ============================================================================

SELECT '=== 42501 FIX VERIFICATION ===' AS section;

-- Check if blueprint helper functions have correct security settings
SELECT 
  p.proname AS function_name,
  CASE 
    WHEN p.prosecdef THEN '✅ SECURITY DEFINER'
    ELSE '❌ Missing SECURITY DEFINER - Will cause 42501!'
  END AS security_definer,
  CASE 
    WHEN p.proconfig IS NOT NULL AND 'row_security=off' = ANY(p.proconfig)
    THEN '✅ row_security=off'
    ELSE '⚠️ row_security not explicitly off'
  END AS row_security_setting
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'is_blueprint_member', 
    'is_blueprint_admin', 
    'is_blueprint_owner'
  )
ORDER BY p.proname;
