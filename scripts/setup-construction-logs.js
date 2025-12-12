#!/usr/bin/env node

/**
 * Construction Logs Database Setup Script
 * 
 * This script executes the complete database setup for the construction logs feature
 * using the Supabase service role key to ensure all permissions are granted.
 * 
 * Usage: node scripts/setup-construction-logs.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase Configuration (from .env.example)
const SUPABASE_URL = 'https://zecsbstjqjqoytwgjyct.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplY3Nic3RqcWpxb3l0d2dqeWN0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQ5OTkzNywiZXhwIjoyMDgxMDc1OTM3fQ.3k-encLQ4LPaYGOi6MLuyZS9d5Ft31XbZM1nWqVN2so';

async function main() {
  console.log('🚀 Starting Construction Logs Database Setup...\n');
  
  // Create Supabase client with service role
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('✓ Connected to Supabase at:', SUPABASE_URL);
  console.log('✓ Using service role for admin access\n');

  // Read SQL script
  const sqlPath = path.join(__dirname, '../docs/database/construction_logs_complete.sql');
  console.log('📄 Reading SQL script:', sqlPath);
  
  let sqlScript;
  try {
    sqlScript = fs.readFileSync(sqlPath, 'utf8');
    console.log('✓ SQL script loaded successfully\n');
  } catch (error) {
    console.error('❌ Failed to read SQL script:', error.message);
    process.exit(1);
  }

  // Split SQL into individual statements (basic splitting on semicolons)
  // Note: This is a simplified approach. For production, use a proper SQL parser
  const statements = sqlScript
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => {
      // Filter out empty statements and comments-only blocks
      const cleaned = stmt.replace(/--[^\n]*/g, '').trim();
      return cleaned.length > 0 && 
             !cleaned.startsWith('/*') && 
             cleaned !== 'DO $$' &&
             !cleaned.match(/^BEGIN\s*$/i) &&
             !cleaned.match(/^END\s*\$\$;?$/i);
    });

  console.log(`📊 Found ${statements.length} SQL statements to execute\n`);
  console.log('─────────────────────────────────────────────────────────\n');

  let successCount = 0;
  let errorCount = 0;

  // Execute statements one by one
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';
    const preview = statement.substring(0, 80).replace(/\n/g, ' ');
    
    console.log(`[${i + 1}/${statements.length}] Executing: ${preview}...`);
    
    try {
      const { data, error } = await supabase.rpc('exec_sql', { 
        sql_query: statement 
      }).catch(async () => {
        // If rpc doesn't work, try direct query
        return await supabase.from('_').select('*').limit(0).then(() => {
          // Fallback: use PostgreSQL client if available
          throw new Error('Direct SQL execution not available via Supabase JS client');
        });
      });

      if (error) {
        console.error(`   ❌ Error: ${error.message}`);
        errorCount++;
      } else {
        console.log('   ✓ Success');
        successCount++;
      }
    } catch (error) {
      console.error(`   ⚠️  Skipped (needs direct database access): ${error.message}`);
      errorCount++;
    }
  }

  console.log('\n─────────────────────────────────────────────────────────\n');
  console.log('📊 Execution Summary:');
  console.log(`   ✓ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📝 Total: ${statements.length}\n`);

  if (errorCount > 0) {
    console.log('⚠️  Some statements could not be executed via the Supabase JS client.');
    console.log('   This is expected as DDL operations require direct database access.\n');
    console.log('📋 Alternative execution methods:\n');
    console.log('   1. Execute in Supabase Dashboard SQL Editor (Recommended)');
    console.log('      → Open https://supabase.com/dashboard/project/zecsbstjqjqoytwgjyct/sql');
    console.log('      → Copy and paste: docs/database/construction_logs_complete.sql');
    console.log('      → Click "Run"\n');
    console.log('   2. Use psql command line tool:');
    console.log(`      → psql "postgres://postgres.zecsbstjqjqoytwgjyct:IBXgJ6mxLrlQxNEm@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require" -f docs/database/construction_logs_complete.sql\n`);
    console.log('   3. Use a database client (TablePlus, pgAdmin, DBeaver, etc.)\n');
  } else {
    console.log('✅ All statements executed successfully!\n');
    console.log('🎉 Construction logs table setup complete!\n');
    console.log('📋 Next steps:');
    console.log('   1. Create storage bucket "construction-photos" in Supabase Dashboard');
    console.log('   2. Test the feature: yarn start → Navigate to Blueprint → 工地日誌 tab');
    console.log('   3. Create your first construction log!\n');
  }

  console.log('─────────────────────────────────────────────────────────\n');
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  console.error(error.stack);
  process.exit(1);
});
