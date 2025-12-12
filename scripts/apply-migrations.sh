#!/bin/bash

###############################################################################
# Supabase Migration Application Script
# 
# Applies SQL migration files to remote Supabase database using psql.
# Requires PostgreSQL client (psql) to be installed.
#
# Usage:
#   ./scripts/apply-migrations.sh [migration-file]
#
# Examples:
#   ./scripts/apply-migrations.sh                    # Apply all migrations
#   ./scripts/apply-migrations.sh 20251212_01_*      # Apply specific migration
#
# Environment Variables:
#   POSTGRES_URL or POSTGRES_URL_NON_POOLING: PostgreSQL connection string
###############################################################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MIGRATIONS_DIR="$PROJECT_ROOT/supabase/migrations"

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Supabase Migration Application Script${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Load environment variables from .env file if it exists
if [ -f "$PROJECT_ROOT/.env" ]; then
    echo -e "${GREEN}✓${NC} Loading environment variables from .env"
    export $(cat "$PROJECT_ROOT/.env" | grep -v '^#' | grep -v '^$' | xargs)
else
    echo -e "${YELLOW}⚠${NC}  No .env file found, using system environment variables"
fi

# Check for PostgreSQL connection URL
POSTGRES_CONN="${POSTGRES_URL_NON_POOLING:-${POSTGRES_URL:-}}"

if [ -z "$POSTGRES_CONN" ]; then
    echo -e "${RED}✗${NC} Error: POSTGRES_URL or POSTGRES_URL_NON_POOLING not set"
    echo ""
    echo "Please set one of the following environment variables:"
    echo "  export POSTGRES_URL='postgres://...'"
    echo "  export POSTGRES_URL_NON_POOLING='postgres://...'"
    echo ""
    echo "Or add it to .env file:"
    echo "  POSTGRES_URL_NON_POOLING=postgres://..."
    exit 1
fi

echo -e "${GREEN}✓${NC} PostgreSQL connection URL found"

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}✗${NC} Error: psql not found"
    echo ""
    echo "Please install PostgreSQL client:"
    echo "  Ubuntu/Debian: sudo apt-get install postgresql-client"
    echo "  macOS: brew install postgresql"
    echo "  Windows: Install from https://www.postgresql.org/download/"
    exit 1
fi

echo -e "${GREEN}✓${NC} psql found: $(psql --version | head -n1)"

# Check if migrations directory exists
if [ ! -d "$MIGRATIONS_DIR" ]; then
    echo -e "${RED}✗${NC} Error: Migrations directory not found: $MIGRATIONS_DIR"
    exit 1
fi

echo -e "${GREEN}✓${NC} Migrations directory: $MIGRATIONS_DIR"
echo ""

# Get migration files
if [ $# -eq 0 ]; then
    # Apply all migrations
    MIGRATION_FILES=($(ls -1 "$MIGRATIONS_DIR"/*.sql 2>/dev/null | sort))
else
    # Apply specific migration(s)
    MIGRATION_FILES=($(ls -1 "$MIGRATIONS_DIR"/$1*.sql 2>/dev/null | sort))
fi

if [ ${#MIGRATION_FILES[@]} -eq 0 ]; then
    echo -e "${YELLOW}⚠${NC}  No migration files found"
    exit 0
fi

echo -e "${BLUE}📋 Migration files to apply (${#MIGRATION_FILES[@]})${NC}"
echo ""

for file in "${MIGRATION_FILES[@]}"; do
    filename=$(basename "$file")
    echo "   • $filename"
done

echo ""
echo -e "${YELLOW}⚠${NC}  About to apply ${#MIGRATION_FILES[@]} migration(s) to the remote database"
echo ""

# Confirm before proceeding
read -p "Do you want to continue? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo -e "${YELLOW}⚠${NC}  Migration aborted by user"
    exit 0
fi

# Apply migrations
SUCCESS_COUNT=0
FAIL_COUNT=0
TOTAL_COUNT=${#MIGRATION_FILES[@]}

echo -e "${BLUE}🚀 Applying migrations...${NC}"
echo ""

for file in "${MIGRATION_FILES[@]}"; do
    filename=$(basename "$file")
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}📄 Applying: $filename${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    START_TIME=$(date +%s)
    
    if psql "$POSTGRES_CONN" -f "$file" 2>&1; then
        END_TIME=$(date +%s)
        DURATION=$((END_TIME - START_TIME))
        echo ""
        echo -e "${GREEN}✓${NC} Migration applied successfully (${DURATION}s)"
        ((SUCCESS_COUNT++))
    else
        END_TIME=$(date +%s)
        DURATION=$((END_TIME - START_TIME))
        echo ""
        echo -e "${RED}✗${NC} Migration failed (${DURATION}s)"
        ((FAIL_COUNT++))
    fi
    
    echo ""
done

# Print summary
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Total migrations: $TOTAL_COUNT"
echo -e "${GREEN}✓${NC} Successful: $SUCCESS_COUNT"

if [ $FAIL_COUNT -gt 0 ]; then
    echo -e "${RED}✗${NC} Failed: $FAIL_COUNT"
else
    echo "✗ Failed: 0"
fi

echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}🎉 All migrations applied successfully!${NC}"
    
    # Verify tables
    echo ""
    echo -e "${BLUE}🔍 Verifying tables...${NC}"
    echo ""
    
    psql "$POSTGRES_CONN" -c "\dt tasks" -c "\dt logs" 2>&1 | grep -E "(tasks|logs)" && \
        echo -e "${GREEN}✓${NC} Tables verified" || \
        echo -e "${YELLOW}⚠${NC}  Could not verify tables"
    
    echo ""
    echo -e "${BLUE}🔒 Checking RLS policies...${NC}"
    echo ""
    
    psql "$POSTGRES_CONN" -c "SELECT tablename, COUNT(*) as policy_count FROM pg_policies WHERE tablename IN ('tasks', 'logs') GROUP BY tablename;" 2>&1 | \
        grep -E "(tasks|logs)" && \
        echo -e "${GREEN}✓${NC} RLS policies found" || \
        echo -e "${YELLOW}⚠${NC}  Could not verify RLS policies"
    
    exit 0
else
    echo -e "${RED}💥 Some migrations failed${NC}"
    echo ""
    echo "Please check the error messages above and fix any issues."
    exit 1
fi
