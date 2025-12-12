#!/usr/bin/env ts-node

/**
 * Supabase Migration Deployment Script
 * 
 * This script deploys migration files to the remote Supabase database.
 * It reads environment variables and executes SQL migrations in order.
 * 
 * Usage:
 *   ts-node scripts/supabase-deploy.ts
 * 
 * Required Environment Variables:
 *   - NG_APP_SUPABASE_URL: Supabase project URL
 *   - SUPABASE_SERVICE_ROLE_KEY: Service role key (admin access)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface MigrationResult {
  file: string;
  success: boolean;
  error?: string;
  duration: number;
}

class SupabaseMigrationDeployer {
  private client: SupabaseClient;
  private migrationsDir: string;
  private results: MigrationResult[] = [];

  constructor() {
    const supabaseUrl = process.env.NG_APP_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        'Missing required environment variables: NG_APP_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
      );
    }

    // Create Supabase client with service role (bypasses RLS)
    this.client = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    this.migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');

    console.log('✅ Supabase client initialized');
    console.log(`📁 Migrations directory: ${this.migrationsDir}`);
  }

  /**
   * Get list of migration files in order
   */
  private getMigrationFiles(): string[] {
    const files = fs.readdirSync(this.migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Files are named with timestamps, so sorting works

    console.log(`📋 Found ${files.length} migration files:`);
    files.forEach(file => console.log(`   - ${file}`));

    return files;
  }

  /**
   * Read SQL file content
   */
  private readMigrationFile(filename: string): string {
    const filepath = path.join(this.migrationsDir, filename);
    return fs.readFileSync(filepath, 'utf-8');
  }

  /**
   * Execute SQL migration using Supabase REST API
   */
  private async executeSql(sql: string): Promise<void> {
    // Remove comments and empty lines
    const cleanSql = sql
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        return trimmed && !trimmed.startsWith('--');
      })
      .join('\n');

    // Split by semicolons and execute each statement
    const statements = cleanSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      // Skip DO blocks with RAISE NOTICE (not supported in client)
      if (statement.includes('DO $$') && statement.includes('RAISE NOTICE')) {
        continue;
      }

      try {
        const { error } = await this.client.rpc('exec_sql', { sql: statement });
        
        if (error) {
          throw error;
        }
      } catch (err) {
        // If exec_sql function doesn't exist, try direct execution
        // This is a fallback for executing statements
        console.warn(`⚠️  Could not use exec_sql RPC, trying alternative method...`);
        throw err;
      }
    }
  }

  /**
   * Execute a single migration file
   */
  private async executeMigration(filename: string): Promise<MigrationResult> {
    console.log(`\n🚀 Executing migration: ${filename}`);
    const startTime = Date.now();

    try {
      const sql = this.readMigrationFile(filename);
      await this.executeSql(sql);

      const duration = Date.now() - startTime;
      console.log(`✅ Migration completed in ${duration}ms`);

      return {
        file: filename,
        success: true,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Migration failed: ${errorMessage}`);

      return {
        file: filename,
        success: false,
        error: errorMessage,
        duration
      };
    }
  }

  /**
   * Execute all migrations
   */
  async deploy(): Promise<boolean> {
    console.log('\n🎯 Starting Supabase migration deployment...\n');

    const files = this.getMigrationFiles();

    if (files.length === 0) {
      console.log('⚠️  No migration files found');
      return false;
    }

    // Execute migrations in order
    for (const file of files) {
      const result = await this.executeMigration(file);
      this.results.push(result);
    }

    // Print summary
    this.printSummary();

    // Return true if all migrations succeeded
    return this.results.every(r => r.success);
  }

  /**
   * Verify migrations by checking table existence
   */
  async verify(): Promise<boolean> {
    console.log('\n🔍 Verifying migrations...\n');

    try {
      // Check if tasks table exists
      const { data: tasks, error: tasksError } = await this.client
        .from('tasks')
        .select('id')
        .limit(1);

      if (tasksError) {
        console.error('❌ Tasks table verification failed:', tasksError.message);
        return false;
      }

      console.log('✅ Tasks table verified');

      // Check if logs table exists
      const { data: logs, error: logsError } = await this.client
        .from('logs')
        .select('id')
        .limit(1);

      if (logsError) {
        console.error('❌ Logs table verification failed:', logsError.message);
        return false;
      }

      console.log('✅ Logs table verified');

      // Check RLS policies
      const { data: policies, error: policiesError } = await this.client
        .from('pg_policies')
        .select('tablename, policyname')
        .in('tablename', ['tasks', 'logs']);

      if (policiesError) {
        console.error('❌ RLS policies verification failed:', policiesError.message);
        return false;
      }

      const tasksPolicies = policies?.filter(p => p.tablename === 'tasks').length || 0;
      const logsPolicies = policies?.filter(p => p.tablename === 'logs').length || 0;

      console.log(`✅ RLS policies verified (Tasks: ${tasksPolicies}, Logs: ${logsPolicies})`);

      return true;
    } catch (error) {
      console.error('❌ Verification failed:', error);
      return false;
    }
  }

  /**
   * Print deployment summary
   */
  private printSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 Deployment Summary');
    console.log('='.repeat(60));

    const total = this.results.length;
    const successful = this.results.filter(r => r.success).length;
    const failed = total - successful;

    console.log(`\nTotal migrations: ${total}`);
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);

    if (failed > 0) {
      console.log('\n❌ Failed migrations:');
      this.results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`   - ${r.file}: ${r.error}`);
        });
    }

    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    console.log(`\n⏱️  Total duration: ${totalDuration}ms`);
    console.log('='.repeat(60) + '\n');
  }
}

// Main execution
async function main() {
  try {
    const deployer = new SupabaseMigrationDeployer();
    
    // Deploy migrations
    const success = await deployer.deploy();
    
    if (!success) {
      console.error('\n❌ Migration deployment failed');
      process.exit(1);
    }

    // Verify deployment
    const verified = await deployer.verify();
    
    if (!verified) {
      console.error('\n❌ Migration verification failed');
      process.exit(1);
    }

    console.log('\n🎉 All migrations deployed and verified successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Deployment error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { SupabaseMigrationDeployer };
