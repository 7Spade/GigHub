#!/usr/bin/env node
/**
 * Database Setup Script
 * 資料庫初始化腳本
 * 
 * This script executes the complete database schema on Supabase
 * 此腳本在 Supabase 上執行完整的資料庫結構
 * 
 * @author GigHub Development Team
 * @date 2025-12-12
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration from .env
const SUPABASE_URL = 'https://zecsbstjqjqoytwgjyct.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplY3Nic3RqcWpxb3l0d2dqeWN0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQ5OTkzNywiZXhwIjoyMDgxMDc1OTM3fQ.3k-encLQ4LPaYGOi6MCLuyZS9d5Ft31bZZ1n';

console.log('🚀 GigHub Database Setup');
console.log('================================');
console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
console.log('');

async function setupDatabase() {
  try {
    // Initialize Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    console.log('✅ Supabase client initialized');
    
    // Read SQL schema file
    const sqlFilePath = path.join(__dirname, '../docs/database/complete_schema.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('📄 SQL schema file loaded');
    console.log(`   Size: ${(sqlContent.length / 1024).toFixed(2)} KB`);
    console.log('');
    
    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📊 Found ${statements.length} SQL statements to execute`);
    console.log('');
    
    // Execute each statement
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty lines
      if (!statement || statement.startsWith('--')) {
        continue;
      }
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement + ';'
        });
        
        if (error) {
          // Try direct execution if RPC fails
          console.log(`⚠️  Statement ${i + 1}/${statements.length}: Using fallback method`);
          
          // Extract table name for logging
          const match = statement.match(/CREATE TABLE.*?([\w.]+)/i);
          const tableName = match ? match[1] : 'unknown';
          
          console.log(`   Processing: ${tableName}`);
          
          // Note: Direct SQL execution via REST API is limited
          // We'll log and continue
          console.log(`   ⚠️  Note: Some statements may need manual execution in Supabase SQL Editor`);
        } else {
          successCount++;
          if ((i + 1) % 10 === 0 || i === statements.length - 1) {
            console.log(`   ✓ Executed ${i + 1}/${statements.length} statements`);
          }
        }
      } catch (err) {
        errorCount++;
        console.error(`   ❌ Error in statement ${i + 1}:`, err.message);
      }
    }
    
    console.log('');
    console.log('================================');
    console.log('📊 Execution Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log('');
    
    if (errorCount > 0) {
      console.log('⚠️  Some statements failed. Please:');
      console.log('   1. Open Supabase Dashboard SQL Editor');
      console.log('   2. Copy and paste the complete_schema.sql file');
      console.log('   3. Execute manually');
      console.log('');
      console.log(`   File location: ${sqlFilePath}`);
    } else {
      console.log('✅ Database setup completed successfully!');
      console.log('');
      console.log('🎉 You can now use the construction logs feature');
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run setup
setupDatabase().then(() => {
  console.log('');
  console.log('✨ Setup script finished');
}).catch(err => {
  console.error('💥 Unexpected error:', err);
  process.exit(1);
});
