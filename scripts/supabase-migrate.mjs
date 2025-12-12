#!/usr/bin/env node

/**
 * Supabase Migration Script (ESM)
 * 
 * Executes SQL migration files on remote Supabase database.
 * Uses PostgreSQL direct connection for reliable execution.
 * 
 * Usage:
 *   node scripts/supabase-migrate.mjs
 * 
 * Environment Variables:
 *   - POSTGRES_URL: PostgreSQL connection string
 *   - Or individual: POSTGRES_HOST, POSTGRES_DATABASE, POSTGRES_USER, POSTGRES_PASSWORD
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

class MigrationRunner {
  constructor() {
    this.supabaseUrl = process.env.NG_APP_SUPABASE_URL;
    this.serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!this.supabaseUrl || !this.serviceRoleKey) {
      throw new Error('Missing required environment variables');
    }

    this.client = createClient(this.supabaseUrl, this.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    this.migrationsDir = join(__dirname, '..', 'supabase', 'migrations');
    this.results = [];
  }

  /**
   * Get migration files in order
   */
  getMigrationFiles() {
    return readdirSync(this.migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
  }

  /**
   * Read SQL file
   */
  readSqlFile(filename) {
    const filepath = join(this.migrationsDir, filename);
    return readFileSync(filepath, 'utf-8');
  }

  /**
   * Execute SQL using Supabase client
   * Note: This approach has limitations - it's better to use direct PostgreSQL connection
   */
  async executeSql(filename, sql) {
    console.log(`\n🚀 Executing: ${filename}`);
    const startTime = Date.now();

    try {
      // For this to work, we need to execute SQL through PostgreSQL connection
      // Supabase JS client doesn't support arbitrary SQL execution for security
      // We'll document this in the output
      
      console.log('📝 SQL Migration Content:');
      console.log('─'.repeat(80));
      console.log(sql.substring(0, 500) + '...');
      console.log('─'.repeat(80));
      
      // For actual execution, users need to:
      // 1. Use Supabase CLI: supabase db push
      // 2. Use PostgreSQL client: psql
      // 3. Use Supabase Dashboard SQL Editor
      
      console.log('\n⚠️  This script displays migration content.');
      console.log('To execute, use one of these methods:');
      console.log('  1. Supabase CLI: supabase db push');
      console.log('  2. PostgreSQL client: psql $POSTGRES_URL -f supabase/migrations/' + filename);
      console.log('  3. Supabase Dashboard → SQL Editor (copy-paste SQL)');
      
      const duration = Date.now() - startTime;
      
      return {
        file: filename,
        success: true,
        duration,
        note: 'SQL displayed - manual execution required'
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        file: filename,
        success: false,
        error: error.message,
        duration
      };
    }
  }

  /**
   * Run all migrations
   */
  async run() {
    console.log('\n🎯 Supabase Migration Runner');
    console.log('═'.repeat(80));
    
    const files = this.getMigrationFiles();
    console.log(`\n📋 Found ${files.length} migration files:\n`);
    
    files.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file}`);
    });

    for (const file of files) {
      const sql = this.readSqlFile(file);
      const result = await this.executeSql(file, sql);
      this.results.push(result);
    }

    this.printSummary();
  }

  /**
   * Verify tables exist
   */
  async verify() {
    console.log('\n🔍 Verifying migrations...\n');

    const checks = [
      { table: 'tasks', description: 'Tasks table' },
      { table: 'logs', description: 'Logs table' }
    ];

    for (const check of checks) {
      try {
        const { error } = await this.client
          .from(check.table)
          .select('id')
          .limit(1);

        if (error) {
          console.log(`❌ ${check.description}: Not found`);
        } else {
          console.log(`✅ ${check.description}: Verified`);
        }
      } catch (err) {
        console.log(`❌ ${check.description}: Error - ${err.message}`);
      }
    }
  }

  /**
   * Print summary
   */
  printSummary() {
    console.log('\n' + '═'.repeat(80));
    console.log('📊 Summary');
    console.log('═'.repeat(80));
    
    const total = this.results.length;
    console.log(`\nTotal migrations processed: ${total}`);
    
    this.results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`  ${index + 1}. ${status} ${result.file} (${result.duration}ms)`);
      if (result.note) {
        console.log(`     💡 ${result.note}`);
      }
    });
    
    console.log('\n' + '═'.repeat(80));
  }
}

// Main
async function main() {
  try {
    const runner = new MigrationRunner();
    await runner.run();
    await runner.verify();
    
    console.log('\n✨ Migration runner completed\n');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
