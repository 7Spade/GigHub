#!/bin/bash

# Construction Logs Database Setup Script (Direct PostgreSQL)
# 
# This script executes the SQL directly using psql if available
# or provides instructions for manual execution
#
# Usage: bash scripts/setup-db-direct.sh

set -e

echo "🚀 Construction Logs Database Setup"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Supabase PostgreSQL connection string
POSTGRES_URL="postgres://postgres.zecsbstjqjqoytwgjyct:IBXgJ6mxLrlQxNEm@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require"
SQL_FILE="docs/database/construction_logs_complete.sql"

# Check if psql is available
if command -v psql &> /dev/null; then
    echo "✓ psql found - executing SQL directly..."
    echo ""
    
    # Execute SQL file
    psql "$POSTGRES_URL" -f "$SQL_FILE"
    
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "✅ Database setup completed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Create storage bucket 'construction-photos' in Supabase Dashboard"
    echo "   2. Test: yarn start → Blueprint → 工地日誌 tab"
    echo ""
else
    echo "⚠️  psql not found - manual execution required"
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "📋 Manual Execution Options:"
    echo ""
    echo "Option 1: Supabase Dashboard (Recommended) ⭐"
    echo "  1. Open: https://supabase.com/dashboard/project/zecsbstjqjqoytwgjyct/sql"
    echo "  2. Click 'New query'"
    echo "  3. Copy contents of: $SQL_FILE"
    echo "  4. Paste and click 'Run'"
    echo ""
    echo "Option 2: Install psql and re-run this script"
    echo "  • macOS: brew install postgresql"
    echo "  • Ubuntu/Debian: sudo apt-get install postgresql-client"
    echo "  • Windows: Download from https://www.postgresql.org/download/"
    echo ""
    echo "Option 3: Use a database GUI client"
    echo "  • TablePlus: https://tableplus.com/"
    echo "  • pgAdmin: https://www.pgadmin.org/"
    echo "  • DBeaver: https://dbeaver.io/"
    echo ""
    echo "Connection details:"
    echo "  Host: aws-1-ap-southeast-1.pooler.supabase.com"
    echo "  Port: 5432"
    echo "  Database: postgres"
    echo "  User: postgres.zecsbstjqjqoytwgjyct"
    echo "  Password: IBXgJ6mxLrlQxNEm"
    echo "  SSL Mode: require"
    echo ""
fi

echo "═══════════════════════════════════════════════════════════"
