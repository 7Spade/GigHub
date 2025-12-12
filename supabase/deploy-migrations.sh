#!/bin/bash
# =============================================================================
# Supabase Migrations Deployment Script
# =============================================================================
# This script deploys all SQL migrations to the Supabase remote database
# Project Reference: zecsbstjqjqoytwgjyct
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project configuration
PROJECT_REF="zecsbstjqjqoytwgjyct"
MIGRATIONS_DIR="$(dirname "$0")/migrations"

# Print colored message
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_header() {
    echo ""
    print_message "$BLUE" "=========================================="
    print_message "$BLUE" "$1"
    print_message "$BLUE" "=========================================="
    echo ""
}

print_success() {
    print_message "$GREEN" "✓ $1"
}

print_error() {
    print_message "$RED" "✗ $1"
}

print_warning() {
    print_message "$YELLOW" "⚠ $1"
}

# Check if psql is installed
check_psql() {
    if ! command -v psql &> /dev/null; then
        print_error "psql is not installed. Please install PostgreSQL client."
        echo "On macOS: brew install postgresql"
        echo "On Ubuntu: sudo apt-get install postgresql-client"
        exit 1
    fi
    print_success "psql is installed"
}

# Check if Supabase CLI is installed
check_supabase_cli() {
    if ! command -v supabase &> /dev/null; then
        print_warning "Supabase CLI is not installed (optional but recommended)"
        echo "Install: npm install -g supabase"
        return 1
    fi
    print_success "Supabase CLI is installed"
    return 0
}

# Get database connection string
get_connection_string() {
    if [ -z "$DATABASE_URL" ]; then
        print_warning "DATABASE_URL environment variable not set"
        echo ""
        echo "Please set DATABASE_URL with your Supabase connection string:"
        echo "export DATABASE_URL='postgresql://postgres:[YOUR-PASSWORD]@db.${PROJECT_REF}.supabase.co:5432/postgres'"
        echo ""
        echo "You can get the connection string from:"
        echo "https://supabase.com/dashboard/project/${PROJECT_REF}/settings/database"
        echo ""
        read -p "Enter connection string now (or press Ctrl+C to exit): " DATABASE_URL
        
        if [ -z "$DATABASE_URL" ]; then
            print_error "No connection string provided"
            exit 1
        fi
    fi
    print_success "Database connection string configured"
}

# Test database connection
test_connection() {
    print_message "$YELLOW" "Testing database connection..."
    
    if psql "$DATABASE_URL" -c "SELECT version();" > /dev/null 2>&1; then
        print_success "Database connection successful"
        return 0
    else
        print_error "Failed to connect to database"
        print_error "Please verify your connection string and credentials"
        exit 1
    fi
}

# Execute a migration file
execute_migration() {
    local migration_file=$1
    local filename=$(basename "$migration_file")
    
    print_message "$BLUE" "Executing: $filename"
    
    if psql "$DATABASE_URL" -f "$migration_file" > /tmp/migration_output.log 2>&1; then
        print_success "$filename completed successfully"
        
        # Show any NOTICE or WARNING messages
        if grep -E "(NOTICE|WARNING)" /tmp/migration_output.log > /dev/null 2>&1; then
            echo ""
            grep -E "(NOTICE|WARNING)" /tmp/migration_output.log
            echo ""
        fi
        
        return 0
    else
        print_error "$filename failed"
        echo ""
        echo "Error details:"
        cat /tmp/migration_output.log
        echo ""
        return 1
    fi
}

# Deploy all migrations
deploy_migrations() {
    print_header "Deploying Migrations to Supabase"
    
    # List of migrations in order
    local migrations=(
        "20251212_01_create_tasks_table.sql"
        "20251212_02_create_logs_table.sql"
        "20251212_03_create_rls_policies.sql"
        "20251212_04_create_notifications_table.sql"
        "20251212_04_task_quantity_expansion.sql"
        "20251212_05_task_quantity_rls_policies.sql"
    )
    
    local success_count=0
    local fail_count=0
    
    for migration in "${migrations[@]}"; do
        local migration_path="$MIGRATIONS_DIR/$migration"
        
        if [ ! -f "$migration_path" ]; then
            print_error "Migration file not found: $migration"
            fail_count=$((fail_count + 1))
            continue
        fi
        
        if execute_migration "$migration_path"; then
            success_count=$((success_count + 1))
        else
            fail_count=$((fail_count + 1))
            print_error "Migration $migration failed. Stopping deployment."
            exit 1
        fi
        
        echo ""
    done
    
    print_header "Deployment Summary"
    print_success "Successful migrations: $success_count"
    if [ $fail_count -gt 0 ]; then
        print_error "Failed migrations: $fail_count"
    fi
}

# Verify deployment
verify_deployment() {
    print_header "Verifying Deployment"
    
    print_message "$YELLOW" "Checking tables..."
    
    # Check tables
    local tables_query="
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    ORDER BY table_name;
    "
    
    psql "$DATABASE_URL" -c "$tables_query"
    
    print_message "$YELLOW" "Checking RLS status..."
    
    # Check RLS
    local rls_query="
    SELECT tablename, rowsecurity 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('tasks', 'logs', 'notifications', 'log_tasks', 'quality_controls', 'task_progress')
    ORDER BY tablename;
    "
    
    psql "$DATABASE_URL" -c "$rls_query"
    
    print_message "$YELLOW" "Checking RLS policies count..."
    
    # Check policies
    local policies_query="
    SELECT tablename, COUNT(*) as policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    GROUP BY tablename
    ORDER BY tablename;
    "
    
    psql "$DATABASE_URL" -c "$policies_query"
    
    print_success "Verification complete"
}

# Main execution
main() {
    print_header "Supabase Migration Deployment"
    print_message "$BLUE" "Project: $PROJECT_REF"
    echo ""
    
    # Pre-flight checks
    check_psql
    check_supabase_cli || true  # Continue even if Supabase CLI is not installed
    
    # Get and test connection
    get_connection_string
    test_connection
    
    # Confirm deployment
    echo ""
    print_warning "This will deploy migrations to the REMOTE Supabase database"
    print_warning "Project Reference: $PROJECT_REF"
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        print_message "$YELLOW" "Deployment cancelled"
        exit 0
    fi
    
    # Deploy
    deploy_migrations
    
    # Verify
    echo ""
    read -p "Do you want to verify the deployment? (yes/no): " verify
    if [ "$verify" == "yes" ]; then
        verify_deployment
    fi
    
    print_header "Deployment Complete!"
    print_success "All migrations have been deployed successfully"
    echo ""
    print_message "$GREEN" "Next steps:"
    echo "1. Test the application with the new database schema"
    echo "2. Verify RLS policies are working correctly"
    echo "3. Check Supabase Dashboard for any warnings or issues"
    echo "4. Update application code to use the new tables"
    echo ""
    print_message "$BLUE" "Dashboard: https://supabase.com/dashboard/project/$PROJECT_REF"
}

# Run main function
main
