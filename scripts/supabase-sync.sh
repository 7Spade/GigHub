#!/bin/bash
# Script: Supabase Migration Sync
# Purpose: Apply migrations to remote Supabase database
# Usage: ./scripts/supabase-sync.sh
#
# Prerequisites:
# 1. Set SUPABASE_ACCESS_TOKEN environment variable
# 2. Ensure you're in the project root directory
# 3. Have supabase CLI installed (npx supabase)

set -e

PROJECT_REF=$(cat supabase/.temp/project-ref)

echo "==================================="
echo "Supabase Migration Sync"
echo "==================================="
echo "Project: $PROJECT_REF"
echo ""

# Check for access token
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "Error: SUPABASE_ACCESS_TOKEN environment variable not set"
  echo ""
  echo "To set the token:"
  echo "  export SUPABASE_ACCESS_TOKEN=your-token-here"
  echo ""
  echo "You can get your access token from:"
  echo "  https://supabase.com/dashboard/account/tokens"
  exit 1
fi

# Link to project
echo "Linking to Supabase project..."
npx supabase link --project-ref "$PROJECT_REF"

# Push migrations
echo ""
echo "Pushing migrations to remote database..."
npx supabase db push

echo ""
echo "==================================="
echo "Migration sync complete!"
echo "==================================="
echo ""
echo "To verify the schema, run:"
echo "  npx supabase db diff"
echo ""
echo "Or use the verification SQL script in:"
echo "  supabase/verify_schema.sql"
