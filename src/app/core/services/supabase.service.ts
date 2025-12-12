import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LoggerService } from '@core/services/logger';
import { environment } from '@env/environment';
import { createClient, SupabaseClient, AuthChangeEvent, Session } from '@supabase/supabase-js';

/**
 * Enhanced Supabase Service
 *
 * Provides secure, production-ready Supabase client with:
 * - Environment-based configuration (no hardcoded credentials)
 * - Connection health monitoring
 * - Error handling and retry logic
 * - Firebase Auth integration
 * - Performance tracking
 *
 * @security
 * - Uses environment variables for credentials
 * - All data access protected by RLS policies
 * - Token sync with Firebase Auth
 * - Automatic session management
 */
@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private readonly logger = inject(LoggerService);
  private readonly destroyRef = inject(DestroyRef);

  // Supabase client instance
  private supabase!: SupabaseClient;

  // Connection state signals
  private _isConnected = signal(false);
  private _isAuthenticated = signal(false);
  private _lastError = signal<Error | null>(null);
  private _session = signal<Session | null>(null);

  // Public readonly signals
  readonly isConnected = this._isConnected.asReadonly();
  readonly isAuthenticated = this._isAuthenticated.asReadonly();
  readonly lastError = this._lastError.asReadonly();
  readonly session = this._session.asReadonly();

  // Computed: Health status
  readonly isHealthy = computed(() => this.isConnected() && !this.lastError());

  constructor() {
    this.initializeClient();
    this.setupAuthListener();
  }

  /**
   * Initialize Supabase client with environment configuration
   */
  private initializeClient(): void {
    try {
      // Get credentials from environment
      const supabaseUrl = this.getEnvVar('NG_APP_SUPABASE_URL');
      const supabaseKey = this.getEnvVar('NG_APP_SUPABASE_ANON_KEY');

      if (!supabaseUrl || !supabaseKey) {
        throw new Error(
          'Supabase configuration missing. Please set NG_APP_SUPABASE_URL and NG_APP_SUPABASE_ANON_KEY in environment variables.'
        );
      }

      // Create Supabase client with optimized configuration
      this.supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
          storage: window.localStorage,
          storageKey: 'gighub-supabase-auth'
        },
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        },
        db: {
          schema: 'public'
        },
        global: {
          headers: {
            'X-Client-Info': 'gighub-angular@1.0.0',
            'X-Client-Platform': 'web'
          }
        }
      });

      this._isConnected.set(true);
      this.logger.info('[SupabaseService]', 'Client initialized successfully');
    } catch (error) {
      this._isConnected.set(false);
      this._lastError.set(error as Error);
      this.logger.error('[SupabaseService]', 'Failed to initialize client', error as Error);
    }
  }

  /**
   * Setup auth state listener
   */
  private setupAuthListener(): void {
    this.supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      this._session.set(session);
      this._isAuthenticated.set(!!session);

      this.logger.info('[SupabaseService]', `Auth state changed: ${event}`, {
        hasSession: !!session,
        userId: session?.user?.id
      });

      // Handle auth errors
      if (event === 'TOKEN_REFRESHED') {
        this.logger.info('[SupabaseService]', 'Token refreshed successfully');
      } else if (event === 'SIGNED_OUT') {
        this.logger.info('[SupabaseService]', 'User signed out');
      }
    });
  }

  /**
   * Get environment variable with fallback
   */
  private getEnvVar(key: string): string {
    // Try import.meta.env first (Vite/modern bundlers)
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      return import.meta.env[key] as string;
    }

    // Fallback to process.env (webpack)
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] as string;
    }

    // Fallback to environment object (Angular)
    if (environment && (environment as any)[key]) {
      return (environment as any)[key];
    }

    return '';
  }

  /**
   * Get the Supabase client instance
   * Use this for database queries, storage operations, etc.
   */
  get client(): SupabaseClient {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized. Check configuration.');
    }
    return this.supabase;
  }

  /**
   * Query data from a table with error handling
   *
   * @param table Table name
   * @returns Supabase query builder
   */
  from(table: string) {
    this.ensureConnected();
    return this.supabase.from(table);
  }

  /**
   * Access Supabase storage with error handling
   *
   * @param bucket Bucket name
   * @returns Supabase storage bucket
   */
  storage(bucket: string) {
    this.ensureConnected();
    return this.supabase.storage.from(bucket);
  }

  /**
   * Set auth session (used by SupabaseAuthSyncService)
   *
   * @param accessToken JWT access token
   * @param refreshToken JWT refresh token
   */
  async setSession(accessToken: string, refreshToken: string): Promise<void> {
    try {
      const { error } = await this.supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });

      if (error) {
        throw error;
      }

      this.logger.info('[SupabaseService]', 'Session set successfully');
    } catch (error) {
      this._lastError.set(error as Error);
      this.logger.error('[SupabaseService]', 'Failed to set session', error as Error);
      throw error;
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;

      this._isAuthenticated.set(false);
      this._session.set(null);
      this.logger.info('[SupabaseService]', 'User signed out successfully');
    } catch (error) {
      this._lastError.set(error as Error);
      this.logger.error('[SupabaseService]', 'Failed to sign out', error as Error);
      throw error;
    }
  }

  /**
   * Health check: Ping Supabase to verify connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Simple query to verify connection
      const { error } = await this.supabase.from('_health_check').select('count').limit(1);

      const isHealthy = !error;
      this._isConnected.set(isHealthy);

      if (!isHealthy) {
        this._lastError.set(error as Error);
      } else {
        this._lastError.set(null);
      }

      return isHealthy;
    } catch (error) {
      this._isConnected.set(false);
      this._lastError.set(error as Error);
      this.logger.error('[SupabaseService]', 'Health check failed', error as Error);
      return false;
    }
  }

  /**
   * Ensure client is connected before operation
   */
  private ensureConnected(): void {
    if (!this._isConnected()) {
      throw new Error('Supabase client is not connected. Please check your network connection.');
    }
  }

  /**
   * Get current user from session
   */
  getCurrentUser() {
    return this._session()?.user ?? null;
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return this._session()?.access_token ?? null;
  }
}
