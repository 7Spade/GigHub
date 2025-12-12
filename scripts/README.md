# GigHub Scripts

This directory contains utility scripts for managing the GigHub project.

## Supabase Migration Scripts

### 📋 Overview

Three scripts are provided for applying Supabase migrations to the remote database:

| Script | Purpose | Method | Recommended |
|--------|---------|--------|-------------|
| `apply-migrations.sh` | Apply migrations using PostgreSQL client | Direct SQL via `psql` | ✅ Yes |
| `supabase-migrate.mjs` | Display migrations and verification | Supabase JS Client | For reference |
| `supabase-deploy.ts` | TypeScript migration deployer | Supabase JS Client | For development |

### 🚀 Quick Start

#### Method 1: Using Bash Script (Recommended)

**Prerequisites:**
- PostgreSQL client (`psql`) installed
- `.env` file configured with `POSTGRES_URL_NON_POOLING`

**Usage:**
```bash
# Apply all migrations
./scripts/apply-migrations.sh

# Apply specific migration
./scripts/apply-migrations.sh 20251212_01_create_tasks_table.sql
```

**Example Output:**
```
═══════════════════════════════════════════════════════════════
   Supabase Migration Application Script
═══════════════════════════════════════════════════════════════

✓ Loading environment variables from .env
✓ PostgreSQL connection URL found
✓ psql found: psql (PostgreSQL) 15.3
✓ Migrations directory: /path/to/GigHub/supabase/migrations

📋 Migration files to apply (3)

   • 20251212_01_create_tasks_table.sql
   • 20251212_02_create_logs_table.sql
   • 20251212_03_create_rls_policies.sql

⚠  About to apply 3 migration(s) to the remote database

Do you want to continue? (yes/no): yes

🚀 Applying migrations...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 Applying: 20251212_01_create_tasks_table.sql
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Migration applied successfully (2s)

[... similar output for other migrations ...]

═══════════════════════════════════════════════════════════════
   Summary
═══════════════════════════════════════════════════════════════

Total migrations: 3
✓ Successful: 3
✗ Failed: 0

🎉 All migrations applied successfully!

🔍 Verifying tables...

✓ Tables verified

🔒 Checking RLS policies...

✓ RLS policies found
```

#### Method 2: Using Supabase CLI

**Prerequisites:**
- Supabase CLI installed: `npm install -g supabase`
- Supabase project linked: `supabase link --project-ref your-project-id`

**Usage:**
```bash
# Push all migrations
supabase db push

# Or push specific file
supabase db push --file supabase/migrations/20251212_01_create_tasks_table.sql
```

#### Method 3: Using Node.js Script

**Prerequisites:**
- Node.js 18+ installed
- `.env` file configured with Supabase credentials

**Usage:**
```bash
# Display migrations and verify
node scripts/supabase-migrate.mjs
```

### 🔧 Environment Setup

#### Required Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Supabase Configuration (Frontend)
NG_APP_SUPABASE_URL=https://your-project-id.supabase.co
NG_APP_SUPABASE_ANON_KEY=your_anon_key_here

# Supabase Configuration (Backend - for migrations)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# PostgreSQL Direct Connection (for psql migrations)
POSTGRES_URL_NON_POOLING=postgres://postgres.your-project-id:password@aws-region.pooler.supabase.com:5432/postgres
```

#### Getting PostgreSQL Connection String

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **Database**
4. Scroll to **Connection String**
5. Select **URI** tab
6. Copy the connection string (use the non-pooling version for migrations)
7. Replace `[YOUR-PASSWORD]` with your actual database password

### 📦 Installing Dependencies

#### Install PostgreSQL Client

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install postgresql-client
```

**macOS:**
```bash
brew install postgresql
```

**Windows:**
Download and install from [PostgreSQL Official Site](https://www.postgresql.org/download/)

#### Install Supabase CLI

```bash
npm install -g supabase
# or
yarn global add supabase
```

### 🧪 Testing Migrations Locally

Before applying to production, test migrations locally:

```bash
# Start local Supabase
supabase start

# Apply migrations locally
supabase db reset

# Test with local database
POSTGRES_URL_NON_POOLING="postgres://postgres:postgres@localhost:54322/postgres" \
  ./scripts/apply-migrations.sh
```

### 📊 Migration Files

Current migrations in `supabase/migrations/`:

1. **20251212_01_create_tasks_table.sql**
   - Creates `tasks` table
   - Adds indexes for performance
   - Sets up triggers for `updated_at`

2. **20251212_02_create_logs_table.sql**
   - Creates `logs` table
   - Adds GIN indexes for JSONB columns
   - Sets up photo statistics trigger

3. **20251212_03_create_rls_policies.sql**
   - Enables RLS on `tasks` and `logs`
   - Creates helper functions for JWT claims
   - Sets up organization-based isolation policies
   - Configures role-based access control

### 🔒 Security Best Practices

1. **Never commit `.env` file** - It contains sensitive credentials
2. **Use service role key only for migrations** - Never expose in frontend
3. **Test migrations locally first** - Avoid production mistakes
4. **Backup database before migrations** - Use Supabase Dashboard backup feature
5. **Review RLS policies carefully** - Ensure proper data isolation

### 🛠️ Troubleshooting

#### Error: "psql: command not found"

Install PostgreSQL client (see Installation section above).

#### Error: "POSTGRES_URL not set"

Add the connection string to your `.env` file or export it:
```bash
export POSTGRES_URL_NON_POOLING="postgres://..."
```

#### Error: "permission denied"

Make the script executable:
```bash
chmod +x scripts/apply-migrations.sh
```

#### Error: "connection refused"

- Check if the database URL is correct
- Verify your IP is allowed in Supabase project settings
- Check if the password is correct (no URL encoding issues)

#### Error: "relation already exists"

The migration was already applied. This is usually safe to ignore.
You can check existing tables:
```bash
psql "$POSTGRES_URL_NON_POOLING" -c "\dt"
```

### 📚 Related Documentation

- [Supabase Setup Guide](../docs/operations/supabase-setup-guide.md)
- [Supabase Integration](../docs/operations/supabase-integration.md)
- [Database Schema](../supabase/migrations/)
- [RLS Policies](../supabase/migrations/20251212_03_create_rls_policies.sql)

### 🆘 Support

If you encounter issues:

1. Check the [Supabase Documentation](https://supabase.com/docs)
2. Review project logs in Supabase Dashboard
3. Consult the team in development channel

---

**Last Updated:** 2025-12-12  
**Maintainer:** GigHub Development Team
