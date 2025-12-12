import { Injectable, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Auth, authState, User as FirebaseUser } from '@angular/fire/auth';
import { of, from, interval } from 'rxjs';
import { catchError, switchMap, filter, tap, debounceTime } from 'rxjs/operators';

import { LoggerService } from './logger';
import { SupabaseService } from './supabase.service';

/**
 * Supabase Auth Sync Service
 *
 * Synchronizes Firebase Authentication with Supabase Authentication:
 * 1. Listens to Firebase auth state changes
 * 2. Extracts Firebase ID Token with custom claims
 * 3. Sets Supabase session using Firebase token
 * 4. Handles token refresh automatically
 *
 * This enables:
 * - Single authentication source (Firebase)
 * - Supabase RLS policies using Firebase user claims
 * - Automatic token sync on login/logout
 *
 * @architecture
 * Firebase Auth (Primary) → Token Extraction → Supabase Auth (Secondary)
 *
 * @security
 * - Firebase tokens contain custom claims (organization_id, role)
 * - Supabase RLS policies validate these claims
 * - Tokens auto-refresh before expiration
 */
@Injectable({
  providedIn: 'root'
})
export class SupabaseAuthSyncService {
  private readonly firebaseAuth = inject(Auth);
  private readonly supabaseService = inject(SupabaseService);
  private readonly logger = inject(LoggerService);
  private readonly destroyRef = inject(DestroyRef);

  // Sync state signals
  private _isSyncing = signal(false);
  private _lastSyncTime = signal<Date | null>(null);
  private _syncError = signal<Error | null>(null);

  // Public readonly signals
  readonly isSyncing = this._isSyncing.asReadonly();
  readonly lastSyncTime = this._lastSyncTime.asReadonly();
  readonly syncError = this._syncError.asReadonly();

  // Token refresh interval (50 minutes - Firebase tokens expire in 1 hour)
  private readonly TOKEN_REFRESH_INTERVAL = 50 * 60 * 1000;

  constructor() {
    this.setupAuthSync();
    this.setupTokenRefresh();
  }

  /**
   * Setup Firebase auth state listener
   * Syncs to Supabase whenever Firebase auth state changes
   */
  private setupAuthSync(): void {
    authState(this.firebaseAuth)
      .pipe(
        debounceTime(100), // Debounce rapid auth state changes
        tap(user => {
          this.logger.info('[SupabaseAuthSync]', 'Firebase auth state changed', {
            hasUser: !!user,
            uid: user?.uid
          });
        }),
        switchMap(user => (user ? this.syncFirebaseToSupabase(user) : this.handleSignOut())),
        catchError(error => {
          this._syncError.set(error);
          this.logger.error('[SupabaseAuthSync]', 'Auth sync failed', error);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  /**
   * Setup automatic token refresh
   * Refreshes tokens before they expire
   */
  private setupTokenRefresh(): void {
    interval(this.TOKEN_REFRESH_INTERVAL)
      .pipe(
        filter(() => !!this.firebaseAuth.currentUser),
        switchMap(() => {
          const user = this.firebaseAuth.currentUser;
          if (!user) return of(null);

          this.logger.info('[SupabaseAuthSync]', 'Auto-refreshing token');
          return this.syncFirebaseToSupabase(user);
        }),
        catchError(error => {
          this.logger.error('[SupabaseAuthSync]', 'Token refresh failed', error);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  /**
   * Sync Firebase user to Supabase
   *
   * Flow:
   * 1. Get Firebase ID Token (includes custom claims)
   * 2. Parse token to extract user info
   * 3. Set Supabase session using Firebase token
   *
   * @param user Firebase user
   */
  private syncFirebaseToSupabase(user: FirebaseUser) {
    this._isSyncing.set(true);
    this._syncError.set(null);

    return from(this.performSync(user)).pipe(
      tap(() => {
        this._isSyncing.set(false);
        this._lastSyncTime.set(new Date());
        this.logger.info('[SupabaseAuthSync]', 'Sync completed successfully');
      }),
      catchError(error => {
        this._isSyncing.set(false);
        this._syncError.set(error);
        this.logger.error('[SupabaseAuthSync]', 'Sync failed', error);
        throw error;
      })
    );
  }

  /**
   * Perform actual sync operation
   */
  private async performSync(user: FirebaseUser): Promise<void> {
    try {
      // Step 1: Get Firebase ID Token with custom claims
      // Force refresh to get latest claims
      const idToken = await user.getIdToken(true);

      // Step 2: Parse token to extract claims
      const tokenData = this.parseJWT(idToken);

      this.logger.info('[SupabaseAuthSync]', 'Firebase token obtained', {
        uid: user.uid,
        email: user.email,
        hasClaims: !!tokenData.organization_id
      });

      // Step 3: Prepare Supabase session
      // Note: We use Firebase token directly as Supabase access token
      // This works because Supabase RLS policies can validate Firebase tokens
      // Alternative: Use a backend service to exchange Firebase token for Supabase JWT

      // For now, we'll use a simple approach:
      // Store Firebase token in Supabase session metadata
      // RLS policies will be configured to accept Firebase tokens

      await this.supabaseService.setSession(idToken, idToken);

      this.logger.info('[SupabaseAuthSync]', 'Supabase session set successfully', {
        userId: user.uid,
        organizationId: tokenData.organization_id
      });
    } catch (error) {
      this.logger.error('[SupabaseAuthSync]', 'Failed to sync Firebase to Supabase', error as Error);
      throw error;
    }
  }

  /**
   * Handle Firebase sign out
   */
  private handleSignOut() {
    this.logger.info('[SupabaseAuthSync]', 'Firebase user signed out, clearing Supabase session');

    return from(this.supabaseService.signOut()).pipe(
      tap(() => {
        this._lastSyncTime.set(new Date());
        this._syncError.set(null);
      }),
      catchError(error => {
        this.logger.error('[SupabaseAuthSync]', 'Failed to sign out from Supabase', error);
        return of(null);
      })
    );
  }

  /**
   * Parse JWT token to extract claims
   */
  private parseJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      this.logger.error('[SupabaseAuthSync]', 'Failed to parse JWT', error as Error);
      return {};
    }
  }

  /**
   * Manually trigger sync (for testing or recovery)
   */
  async manualSync(): Promise<void> {
    const user = this.firebaseAuth.currentUser;
    if (!user) {
      throw new Error('No Firebase user to sync');
    }

    this.logger.info('[SupabaseAuthSync]', 'Manual sync triggered');
    await this.performSync(user);
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    return {
      isSyncing: this._isSyncing(),
      lastSyncTime: this._lastSyncTime(),
      syncError: this._syncError(),
      isHealthy: !this._syncError() && !!this._lastSyncTime()
    };
  }
}
