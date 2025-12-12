/**
 * Database Setup Script using Supabase Client
 * 使用 Supabase Client 的資料庫設定腳本
 * 
 * This script creates all necessary database tables and policies
 * 此腳本建立所有必要的資料庫表和政策
 * 
 * Usage: ts-node scripts/setup-db.ts
 * 
 * @author GigHub Development Team
 * @date 2025-12-12
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Supabase configuration
const SUPABASE_URL = 'https://zecsbstjqjqoytwgjyct.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplY3Nic3RqcWpxb3l0d2dqeWN0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQ5OTkzNywiZXhwIjoyMDgxMDc1OTM3fQ.3k-encLQ4LPaYGOi6MCLuyZS9d5Ft31bZZ1n';

interface TableCheckResult {
  exists: boolean;
  tableName: string;
}

async function checkTableExists(supabase: any, tableName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    // If no error, table exists
    return !error || error.code !== 'PGRST116';
  } catch (err) {
    return false;
  }
}

async function main() {
  console.log('🚀 GigHub Database Setup Script');
  console.log('================================\n');
  
  // Initialize Supabase client
  console.log('📡 Connecting to Supabase...');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  console.log('✅ Connected to Supabase\n');
  
  // Check which tables already exist
  console.log('🔍 Checking existing tables...');
  const tablesToCheck = [
    'accounts',
    'organizations', 
    'blueprints',
    'tasks',
    'logs',
    'construction_logs',
    'log_tasks',
    'quality_controls',
    'task_progress'
  ];
  
  const tableStatus: Record<string, boolean> = {};
  
  for (const table of tablesToCheck) {
    const exists = await checkTableExists(supabase, table);
    tableStatus[table] = exists;
    console.log(`   ${exists ? '✅' : '❌'} ${table}: ${exists ? 'exists' : 'not found'}`);
  }
  
  console.log('\n');
  
  // Check if construction_logs table exists
  if (tableStatus['construction_logs']) {
    console.log('✅ construction_logs table already exists!');
    console.log('\n🎉 Database is ready to use!');
    return;
  }
  
  // If table doesn't exist, show instructions
  console.log('⚠️  construction_logs table does NOT exist');
  console.log('\n📋 Setup Instructions:');
  console.log('================================\n');
  console.log('Due to Supabase security restrictions, SQL schema must be executed manually.');
  console.log('\nPlease follow these steps:\n');
  console.log('1. Open Supabase Dashboard: https://supabase.com/dashboard');
  console.log('2. Select your project: zecsbstjqjqoytwgjyct');
  console.log('3. Click "SQL Editor" in the left menu');
  console.log('4. Click "New Query"');
  console.log('5. Open file: docs/database/complete_schema.sql');
  console.log('6. Copy and paste the entire SQL content');
  console.log('7. Click "Run" button in the top right');
  console.log('\nAlternatively, see: docs/database/SETUP_INSTRUCTIONS.md');
  console.log('\n================================');
  
  // Read and display SQL file info
  const sqlFilePath = path.join(__dirname, '../docs/database/complete_schema.sql');
  
  if (fs.existsSync(sqlFilePath)) {
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    const lines = sqlContent.split('\n').length;
    const sizeKB = (sqlContent.length / 1024).toFixed(2);
    
    console.log('\n📄 SQL File Information:');
    console.log(`   Path: ${sqlFilePath}`);
    console.log(`   Lines: ${lines}`);
    console.log(`   Size: ${sizeKB} KB`);
  }
  
  console.log('\n✨ After running the SQL, execute this script again to verify.');
}

main()
  .then(() => {
    console.log('\n✅ Setup script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
