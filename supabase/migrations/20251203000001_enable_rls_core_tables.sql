-- Migration: Enable RLS on Core Tables
-- Purpose: Enable Row Level Security on all core tables
-- Phase: 3 - RLS Policies
-- Created: 2025-12-01
-- Dependencies: Phase 2 (Helper Functions)

-- ============================================================================
-- ENABLE RLS
-- ============================================================================

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
