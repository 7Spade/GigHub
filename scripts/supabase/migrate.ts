/**
 * Supabase Migration Script
 * 
 * 用於將 Supabase 遷移推送到遠端數據庫的 TypeScript 腳本
 * 
 * Usage:
 *   ts-node scripts/supabase/migrate.ts --mode=local
 *   ts-node scripts/supabase/migrate.ts --mode=remote --project-ref=<ref>
 * 
 * Environment Variables:
 *   SUPABASE_ACCESS_TOKEN  - Supabase access token (for remote migrations)
 *   SUPABASE_PROJECT_REF   - Supabase project reference ID
 *   SUPABASE_DB_PASSWORD   - Database password (for direct connection)
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

// Logging utilities
const log = {
  info: (msg: string) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg: string) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg: string) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg: string) => console.error(`${colors.red}[ERROR]${colors.reset} ${msg}`),
};

interface MigrationOptions {
  mode: 'local' | 'remote';
  projectRef?: string;
  dryRun?: boolean;
  reset?: boolean;
}

class SupabaseMigrationRunner {
  private options: MigrationOptions;
  private migrationsDir: string;

  constructor(options: MigrationOptions) {
    this.options = options;
    this.migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
  }

  /**
   * Check if Supabase CLI is installed
   */
  private async checkSupabaseCLI(): Promise<void> {
    try {
      const { stdout } = await execAsync('supabase --version');
      log.success(`Supabase CLI found: ${stdout.trim()}`);
    } catch (error) {
      log.error('Supabase CLI not found');
      log.info('Install from: https://supabase.com/docs/guides/cli');
      throw error;
    }
  }

  /**
   * Check if migrations directory exists and has files
   */
  private async checkMigrations(): Promise<string[]> {
    try {
      await fs.access(this.migrationsDir);
      const files = await fs.readdir(this.migrationsDir);
      const sqlFiles = files.filter(f => f.endsWith('.sql'));
      
      if (sqlFiles.length === 0) {
        throw new Error('No migration files found');
      }
      
      log.success(`Found ${sqlFiles.length} migration files`);
      return sqlFiles;
    } catch (error) {
      log.error(`Migrations directory not found: ${this.migrationsDir}`);
      throw error;
    }
  }

  /**
   * List available migrations
   */
  private listMigrations(files: string[]): void {
    log.info('Available migrations:');
    files.forEach(file => {
      console.log(`  - ${file}`);
    });
  }

  /**
   * Start local Supabase instance
   */
  private async startLocalSupabase(): Promise<void> {
    log.info('Checking local Supabase status...');
    
    try {
      await execAsync('supabase status');
      log.success('Local Supabase is already running');
    } catch {
      log.info('Starting local Supabase...');
      const { stdout, stderr } = await execAsync('supabase start');
      
      if (stderr) {
        log.warning(`Supabase start warnings: ${stderr}`);
      }
      
      log.success('Local Supabase started successfully');
      console.log(stdout);
    }
  }

  /**
   * Run local migrations
   */
  private async runLocalMigrations(): Promise<void> {
    log.info('Running migrations on local database...');
    
    try {
      if (this.options.reset) {
        log.warning('Resetting local database...');
        const { stdout } = await execAsync('supabase db reset');
        console.log(stdout);
        log.success('Database reset complete');
      } else {
        const { stdout } = await execAsync('supabase db push');
        console.log(stdout);
        log.success('Migrations applied successfully');
      }
    } catch (error: any) {
      log.error(`Migration failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check remote connection
   */
  private async checkRemoteConnection(): Promise<void> {
    log.info('Checking remote Supabase connection...');
    
    const projectRefPath = path.join(process.cwd(), 'supabase', '.temp', 'project-ref');
    
    try {
      const projectRef = await fs.readFile(projectRefPath, 'utf-8');
      log.success(`Linked to project: ${projectRef.trim()}`);
    } catch {
      log.error('No remote project linked');
      log.info('Link your project with: supabase link --project-ref <project-ref>');
      throw new Error('Project not linked');
    }
  }

  /**
   * Link to remote project
   */
  private async linkRemoteProject(): Promise<void> {
    if (!this.options.projectRef) {
      throw new Error('Project reference is required for remote migrations');
    }
    
    log.info(`Linking to project: ${this.options.projectRef}`);
    
    const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
    if (!accessToken) {
      log.warning('SUPABASE_ACCESS_TOKEN not set, you may be prompted for credentials');
    }
    
    try {
      const cmd = `supabase link --project-ref ${this.options.projectRef}`;
      const { stdout } = await execAsync(cmd);
      console.log(stdout);
      log.success('Project linked successfully');
    } catch (error: any) {
      log.error(`Failed to link project: ${error.message}`);
      throw error;
    }
  }

  /**
   * Run remote migrations
   */
  private async runRemoteMigrations(): Promise<void> {
    log.info('Running migrations on remote database...');
    
    if (this.options.dryRun) {
      log.warning('Dry run mode - no changes will be applied');
      const { stdout } = await execAsync('supabase db push --dry-run');
      console.log(stdout);
      return;
    }
    
    log.warning('This will modify the remote database');
    
    try {
      const { stdout } = await execAsync('supabase db push');
      console.log(stdout);
      log.success('Remote migrations applied successfully');
    } catch (error: any) {
      log.error(`Migration failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verify migrations
   */
  private async verifyMigrations(): Promise<void> {
    log.info('Verifying migrations...');
    
    try {
      // Check if tables exist
      const tables = ['tasks', 'logs'];
      
      for (const table of tables) {
        const query = `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '${table}');`;
        const { stdout } = await execAsync(`supabase db execute "${query}"`);
        
        if (stdout.includes('t')) {
          log.success(`Table '${table}' exists`);
        } else {
          log.error(`Table '${table}' not found`);
        }
      }
    } catch (error: any) {
      log.warning(`Verification failed: ${error.message}`);
    }
  }

  /**
   * Main migration runner
   */
  async run(): Promise<void> {
    try {
      log.info('=== Supabase Migration Runner ===');
      log.info(`Mode: ${this.options.mode}`);
      
      // Check prerequisites
      await this.checkSupabaseCLI();
      const migrationFiles = await this.checkMigrations();
      this.listMigrations(migrationFiles);
      
      console.log('');
      
      // Run migrations based on mode
      if (this.options.mode === 'local') {
        await this.startLocalSupabase();
        await this.runLocalMigrations();
        await this.verifyMigrations();
      } else {
        await this.checkRemoteConnection();
        await this.runRemoteMigrations();
      }
      
      console.log('');
      log.success('=== Migration Complete ===');
      
      // Show next steps
      if (this.options.mode === 'local') {
        log.info('Next steps:');
        console.log('  1. Access Supabase Studio: http://localhost:54323');
        console.log('  2. Check database tables in the Table Editor');
        console.log('  3. Test RLS policies with different auth states');
      } else {
        log.info('Next steps:');
        console.log('  1. Access Supabase Dashboard: https://app.supabase.com');
        console.log('  2. Verify tables and RLS policies');
        console.log('  3. Update .env with connection details');
      }
    } catch (error) {
      log.error('Migration failed');
      process.exit(1);
    }
  }
}

// Parse command line arguments
function parseArgs(): MigrationOptions {
  const args = process.argv.slice(2);
  const options: MigrationOptions = {
    mode: 'local',
    dryRun: false,
    reset: false,
  };
  
  args.forEach(arg => {
    const [key, value] = arg.split('=');
    
    switch (key) {
      case '--mode':
        if (value === 'local' || value === 'remote') {
          options.mode = value;
        }
        break;
      case '--project-ref':
        options.projectRef = value;
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--reset':
        options.reset = true;
        break;
      case '--help':
        console.log(`
Supabase Migration Script

Usage:
  ts-node scripts/supabase/migrate.ts [options]

Options:
  --mode=local|remote       Migration mode (default: local)
  --project-ref=<ref>       Supabase project reference (required for remote)
  --dry-run                 Show what would be migrated without applying
  --reset                   Reset database and re-run all migrations
  --help                    Show this help message

Environment Variables:
  SUPABASE_ACCESS_TOKEN     Supabase access token (for remote migrations)
  SUPABASE_PROJECT_REF      Supabase project reference ID
  SUPABASE_DB_PASSWORD      Database password (for direct connection)

Examples:
  # Run local migrations
  ts-node scripts/supabase/migrate.ts --mode=local

  # Run remote migrations
  ts-node scripts/supabase/migrate.ts --mode=remote --project-ref=abc123

  # Dry run (preview changes)
  ts-node scripts/supabase/migrate.ts --mode=remote --dry-run

  # Reset and re-run all migrations
  ts-node scripts/supabase/migrate.ts --mode=local --reset
        `);
        process.exit(0);
    }
  });
  
  return options;
}

// Main entry point
if (require.main === module) {
  const options = parseArgs();
  const runner = new SupabaseMigrationRunner(options);
  runner.run();
}

export { SupabaseMigrationRunner, MigrationOptions };
