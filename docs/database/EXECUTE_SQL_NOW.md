# 🚀 Execute Construction Logs SQL - Start Here

## ⚡ Quick Setup (2 Minutes)

Your Supabase credentials have been updated. Now execute the SQL to create the database table.

### New Supabase Instance Details
- **URL**: `https://zecsbstjqjqoytwgjyct.supabase.co`
- **Region**: AWS AP-Southeast-1 (Singapore)
- **Database**: PostgreSQL 15

---

## Method 1: Supabase Dashboard (⭐ Recommended - Easiest)

### Step 1: Open SQL Editor
1. Go to: https://supabase.com/dashboard/project/zecsbstjqjqoytwgjyct/sql
2. Login with your Supabase account
3. Click **"New query"**

### Step 2: Copy SQL Script
1. Open file: `docs/database/construction_logs_complete.sql`
2. Select all content (Ctrl+A / Cmd+A)
3. Copy (Ctrl+C / Cmd+C)

### Step 3: Execute
1. Paste into SQL Editor (Ctrl+V / Cmd+V)
2. Click **"Run"** button (or press Ctrl+Enter / Cmd+Enter)
3. Wait for completion (~5-10 seconds)

### Step 4: Verify Success
You should see output messages:
```
✓ Construction logs table setup completed successfully!
✓ Table: public.construction_logs created
✓ Indexes: 5 indexes created for optimal performance
✓ RLS: Row Level Security enabled with 4 policies
✓ Trigger: auto-update timestamp trigger created
```

---

## Method 2: Command Line (psql)

### Prerequisites
Install PostgreSQL client:
- **macOS**: `brew install postgresql`
- **Ubuntu/Debian**: `sudo apt-get install postgresql-client`
- **Windows**: Download from https://www.postgresql.org/download/

### Execute SQL
```bash
# From project root directory
psql "postgres://postgres.zecsbstjqjqoytwgjyct:IBXgJ6mxLrlQxNEm@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require" -f docs/database/construction_logs_complete.sql
```

Or use the provided script:
```bash
chmod +x scripts/setup-db-direct.sh
./scripts/setup-db-direct.sh
```

---

## Method 3: Database GUI Client

### Popular Options
- **TablePlus** (Recommended): https://tableplus.com/
- **pgAdmin**: https://www.pgadmin.org/
- **DBeaver**: https://dbeaver.io/
- **DataGrip**: https://www.jetbrains.com/datagrip/

### Connection Details
```
Host:     aws-1-ap-southeast-1.pooler.supabase.com
Port:     5432
Database: postgres
User:     postgres.zecsbstjqjqoytwgjyct
Password: IBXgJ6mxLrlQxNEm
SSL Mode: require
```

### Steps
1. Open your GUI client
2. Create new PostgreSQL connection
3. Enter connection details above
4. Test connection
5. Open SQL query window
6. Paste contents of `docs/database/construction_logs_complete.sql`
7. Execute query

---

## Method 4: Node.js Script (Programmatic)

### Prerequisites
```bash
npm install @supabase/supabase-js
# or
yarn add @supabase/supabase-js
```

### Execute
```bash
node scripts/setup-construction-logs.js
```

**Note**: This method has limitations as Supabase JS client cannot execute DDL statements directly. Use Method 1 or 2 instead.

---

## 📋 After SQL Execution

### Create Storage Bucket

1. Go to Supabase Dashboard → Storage
   - URL: https://supabase.com/dashboard/project/zecsbstjqjqoytwgjyct/storage/buckets

2. Click **"New bucket"**

3. Configure:
   - **Name**: `construction-photos`
   - **Public**: ✅ **Enable** (Allow public access)
   - **File size limit**: 10 MB (optional)
   - **Allowed MIME types**: Leave empty or specify: `image/jpeg, image/png, image/gif, image/webp`

4. Click **"Create bucket"**

### Verify Setup

Execute these queries in SQL Editor to verify:

```sql
-- 1. Check table exists
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'construction_logs';
-- Expected: 1 row

-- 2. Check RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'construction_logs';
-- Expected: rowsecurity = true

-- 3. Count policies
SELECT COUNT(*) as policy_count 
FROM pg_policies 
WHERE tablename = 'construction_logs';
-- Expected: 4

-- 4. Check indexes
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'construction_logs'
ORDER BY indexname;
-- Expected: 6 rows (including primary key)

-- 5. Check storage bucket
SELECT name, public 
FROM storage.buckets 
WHERE name = 'construction-photos';
-- Expected: 1 row, public = true
```

---

## 🧪 Test the Feature

### Start Application
```bash
yarn start
```

### Navigate to Feature
1. Open browser: http://localhost:4200
2. Login with your credentials
3. Navigate to any Blueprint
4. Click **"工地日誌"** (Construction Logs) tab

### Create Test Log
1. Click **"新增日誌"** (New Log) button
2. Fill in the form:
   - **Date**: Today
   - **Title**: "Test Construction Log"
   - **Description**: "Testing the feature"
   - **Work Hours**: 8
   - **Workers**: 5
   - **Weather**: Sunny
   - **Temperature**: 25
3. Click **"儲存"** (Save)

### Verify Success
- ✅ Log appears in the table
- ✅ Statistics update (Total: 1, Today: 1)
- ✅ No error messages in console
- ✅ Can edit the log
- ✅ Can delete the log (soft delete)

---

## 🔧 Troubleshooting

### "relation 'construction_logs' does not exist"
**Solution**: SQL not executed yet. Go back to Method 1 and execute the SQL.

### "permission denied for table construction_logs"
**Solution**: RLS policies not created. Re-execute the complete SQL script.

### "bucket 'construction-photos' not found"
**Solution**: Storage bucket not created. See "Create Storage Bucket" section above.

### "Failed to connect to database"
**Solution**: 
- Check internet connection
- Verify Supabase project is active
- Confirm credentials are correct

### Still having issues?
1. Check Supabase Dashboard → Logs for errors
2. Review browser console for client-side errors
3. Verify all SQL statements executed successfully
4. Contact development team

---

## 📊 What Gets Created

### Database Table: `construction_logs`
- **15 columns**: id, blueprint_id, date, title, description, work_hours, workers, equipment, weather, temperature, photos, creator_id, created_at, updated_at, deleted_at
- **5 indexes**: For optimal query performance
- **RLS enabled**: With 4 security policies
- **Trigger**: Auto-update timestamp on modifications

### Security Policies
1. **Read**: Users can read logs from accessible blueprints
2. **Insert**: Users can create logs in accessible blueprints
3. **Update**: Users can update their own logs
4. **Delete**: Users can soft delete their own logs

### Storage
- **Bucket**: `construction-photos` (public access)
- **Purpose**: Store construction site photos
- **Access**: Public read, authenticated write

---

## ✅ Success Checklist

- [ ] SQL script executed successfully
- [ ] Table `construction_logs` exists
- [ ] RLS enabled (4 policies active)
- [ ] 5 indexes created
- [ ] Storage bucket `construction-photos` created
- [ ] Application started successfully
- [ ] Navigated to Construction Logs tab
- [ ] Created test log successfully
- [ ] No console errors

---

## 🎉 You're Done!

The construction logs feature is now fully operational and ready for production use!

**Next**: Start tracking your construction progress with daily logs, photos, and detailed work records.

---

**Updated**: 2025-12-12  
**Supabase Instance**: zecsbstjqjqoytwgjyct  
**Status**: ✅ Credentials Updated - Ready to Execute SQL
