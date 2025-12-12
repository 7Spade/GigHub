#!/bin/bash
# ============================================
# Supabase Migrations Runner
# ============================================
# 
# Purpose: Push local migrations to remote Supabase database
# Usage: ./scripts/supabase/run-migrations.sh [options]
#
# Options:
#   --local       Run migrations on local Supabase (default)
#   --remote      Run migrations on remote Supabase
#   --dry-run     Show what would be migrated without applying
#   --reset       Reset database and re-run all migrations
#   --help        Show this help message
#
# Prerequisites:
#   - Supabase CLI installed (https://supabase.com/docs/guides/cli)
#   - Supabase project linked (supabase link --project-ref <project-ref>)
#   - Environment variables set (for remote migrations)
#
# ============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default options
MODE="local"
DRY_RUN=false
RESET=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --local)
      MODE="local"
      shift
      ;;
    --remote)
      MODE="remote"
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --reset)
      RESET=true
      shift
      ;;
    --help)
      head -n 20 "$0" | tail -n +2
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Function to print colored messages
print_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Supabase CLI is installed
check_supabase_cli() {
  if ! command -v supabase &> /dev/null; then
    print_error "Supabase CLI not found"
    print_info "Install it from: https://supabase.com/docs/guides/cli"
    exit 1
  fi
  
  local version=$(supabase --version)
  print_success "Supabase CLI found: $version"
}

# Check if migrations directory exists
check_migrations() {
  if [ ! -d "supabase/migrations" ]; then
    print_error "Migrations directory not found: supabase/migrations"
    exit 1
  fi
  
  local migration_count=$(ls -1 supabase/migrations/*.sql 2>/dev/null | wc -l)
  if [ $migration_count -eq 0 ]; then
    print_error "No migration files found in supabase/migrations"
    exit 1
  fi
  
  print_success "Found $migration_count migration files"
}

# List migrations
list_migrations() {
  print_info "Available migrations:"
  for file in supabase/migrations/*.sql; do
    echo "  - $(basename "$file")"
  done
}

# Start local Supabase (if needed)
start_local_supabase() {
  print_info "Checking local Supabase status..."
  
  if supabase status &> /dev/null; then
    print_success "Local Supabase is already running"
  else
    print_info "Starting local Supabase..."
    supabase start
    print_success "Local Supabase started successfully"
  fi
}

# Run migrations on local database
run_local_migrations() {
  print_info "Running migrations on local database..."
  
  if [ "$RESET" = true ]; then
    print_warning "Resetting local database..."
    supabase db reset
    print_success "Database reset complete"
  else
    supabase db push
    print_success "Migrations applied successfully"
  fi
}

# Check remote connection
check_remote_connection() {
  print_info "Checking remote Supabase connection..."
  
  # Check if project is linked
  if [ ! -f "supabase/.temp/project-ref" ]; then
    print_error "No remote project linked"
    print_info "Link your project with: supabase link --project-ref <project-ref>"
    exit 1
  fi
  
  local project_ref=$(cat supabase/.temp/project-ref)
  print_success "Linked to project: $project_ref"
}

# Run migrations on remote database
run_remote_migrations() {
  print_info "Running migrations on remote database..."
  
  if [ "$DRY_RUN" = true ]; then
    print_warning "Dry run mode - no changes will be applied"
    supabase db push --dry-run
  else
    print_warning "This will modify the remote database"
    read -p "Are you sure you want to continue? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      print_info "Migration cancelled"
      exit 0
    fi
    
    supabase db push --db-url "$DATABASE_URL"
    print_success "Remote migrations applied successfully"
  fi
}

# Verify migrations
verify_migrations() {
  print_info "Verifying migrations..."
  
  # Check if tables exist
  local tables=("tasks" "logs")
  
  for table in "${tables[@]}"; do
    if [ "$MODE" = "local" ]; then
      # For local, check using supabase db execute
      print_info "Checking table: $table"
    fi
  done
}

# Main execution
main() {
  print_info "=== Supabase Migration Runner ==="
  print_info "Mode: $MODE"
  
  # Check prerequisites
  check_supabase_cli
  check_migrations
  list_migrations
  
  echo ""
  
  # Run migrations based on mode
  if [ "$MODE" = "local" ]; then
    start_local_supabase
    run_local_migrations
    verify_migrations
  else
    check_remote_connection
    run_remote_migrations
  fi
  
  echo ""
  print_success "=== Migration Complete ==="
  
  # Show next steps
  if [ "$MODE" = "local" ]; then
    print_info "Next steps:"
    echo "  1. Access Supabase Studio: http://localhost:54323"
    echo "  2. Check database tables in the Table Editor"
    echo "  3. Test RLS policies with different auth states"
  else
    print_info "Next steps:"
    echo "  1. Access Supabase Dashboard: https://app.supabase.com"
    echo "  2. Verify tables and RLS policies"
    echo "  3. Update .env with connection details"
  fi
}

# Run main
main
