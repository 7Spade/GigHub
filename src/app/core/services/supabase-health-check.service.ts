import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SupabaseService } from './supabase.service';
import { LoggerService } from './logger';
import { interval, from } from 'rxjs';
import { switchMap, catchError, tap, filter } from 'rxjs/operators';
import { NzNotificationService } from 'ng-zorro-antd/notification';

/**
 * Supabase Health Check Service
 *
 * Monitors Supabase connection health and availability:
 * - Periodic health checks (default: 30 seconds)
 * - Connection status monitoring
 * - Error detection and alerting
 * - Recovery mechanisms
 *
 * Features:
 * - Configurable check interval
 * - Automatic retry on failure
 * - User notifications on connection issues
 * - Health metrics collection
 *
 * @usage
 * - Automatically starts on service initialization
 * - Provides reactive signals for UI integration
 * - Logs all health check events
 */
@Injectable({
  providedIn: 'root'
})
export class SupabaseHealthCheckService {
  private readonly supabaseService = inject(SupabaseService);
  private readonly logger = inject(LoggerService);
  private readonly notification = inject(NzNotificationService);
  private readonly destroyRef = inject(DestroyRef);

  // Health check configuration
  private readonly CHECK_INTERVAL = this.getConfigValue('NG_APP_HEALTH_CHECK_INTERVAL', 30000);
  private readonly ENABLED = this.getConfigValue('NG_APP_ENABLE_HEALTH_CHECK', 'true') === 'true';
  private readonly MAX_CONSECUTIVE_FAILURES = 3;

  // Health state signals
  private _isHealthy = signal(true);
  private _lastCheckTime = signal<Date | null>(null);
  private _consecutiveFailures = signal(0);
  private _totalChecks = signal(0);
  private _totalFailures = signal(0);
  private _averageResponseTime = signal(0);

  // Public readonly signals
  readonly isHealthy = this._isHealthy.asReadonly();
  readonly lastCheckTime = this._lastCheckTime.asReadonly();
  readonly consecutiveFailures = this._consecutiveFailures.asReadonly();

  // Computed: Health status description
  readonly healthStatus = computed(() => {
    if (this._isHealthy()) {
      return 'healthy';
    } else if (this._consecutiveFailures() >= this.MAX_CONSECUTIVE_FAILURES) {
      return 'critical';
    } else {
      return 'degraded';
    }
  });

  // Computed: Uptime percentage
  readonly uptimePercentage = computed(() => {
    const total = this._totalChecks();
    if (total === 0) return 100;

    const failures = this._totalFailures();
    return ((total - failures) / total) * 100;
  });

  constructor() {
    if (this.ENABLED) {
      this.startHealthCheck();
      this.logger.info('[SupabaseHealthCheck]', `Health check started (interval: ${this.CHECK_INTERVAL}ms)`);
    } else {
      this.logger.info('[SupabaseHealthCheck]', 'Health check disabled by configuration');
    }
  }

  /**
   * Start periodic health checks
   */
  private startHealthCheck(): void {
    // Initial health check
    this.performHealthCheck();

    // Periodic health checks
    interval(this.CHECK_INTERVAL)
      .pipe(
        switchMap(() => from(this.performHealthCheck())),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  /**
   * Perform a single health check
   */
  private async performHealthCheck(): Promise<void> {
    const startTime = performance.now();

    try {
      this._totalChecks.update(count => count + 1);

      // Perform health check via Supabase service
      const isHealthy = await this.supabaseService.healthCheck();

      const responseTime = performance.now() - startTime;
      this.updateAverageResponseTime(responseTime);

      this._lastCheckTime.set(new Date());
      this._isHealthy.set(isHealthy);

      if (isHealthy) {
        // Reset consecutive failures on success
        this._consecutiveFailures.set(0);

        this.logger.debug('[SupabaseHealthCheck]', `Health check passed (${responseTime.toFixed(2)}ms)`);
      } else {
        // Increment failure count
        this._consecutiveFailures.update(count => count + 1);
        this._totalFailures.update(count => count + 1);

        this.logger.warn('[SupabaseHealthCheck]', `Health check failed (attempt ${this._consecutiveFailures()})`);

        this.handleHealthCheckFailure();
      }
    } catch (error) {
      const responseTime = performance.now() - startTime;

      this._isHealthy.set(false);
      this._consecutiveFailures.update(count => count + 1);
      this._totalFailures.update(count => count + 1);
      this._lastCheckTime.set(new Date());

      this.logger.error('[SupabaseHealthCheck]', 'Health check exception', error as Error);

      this.handleHealthCheckFailure();
    }
  }

  /**
   * Handle health check failure
   */
  private handleHealthCheckFailure(): void {
    const failures = this._consecutiveFailures();

    // Show notification on first failure
    if (failures === 1) {
      this.notification.warning('連線警告', 'Supabase 連線不穩定，正在嘗試恢復...', {
        nzDuration: 5000
      });
    }

    // Show critical notification after max consecutive failures
    if (failures >= this.MAX_CONSECUTIVE_FAILURES) {
      this.notification.error('連線失敗', 'Supabase 連線異常，請檢查網路連線或稍後再試。', {
        nzDuration: 0 // Don't auto-dismiss
      });
    }
  }

  /**
   * Update average response time
   */
  private updateAverageResponseTime(newTime: number): void {
    const currentAvg = this._averageResponseTime();
    const totalChecks = this._totalChecks();

    // Exponential moving average with more weight on recent values
    const alpha = 0.3;
    const newAvg = alpha * newTime + (1 - alpha) * currentAvg;

    this._averageResponseTime.set(newAvg);
  }

  /**
   * Get configuration value from environment
   */
  private getConfigValue(key: string, defaultValue: string | number): any {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      const value = import.meta.env[key];
      return typeof defaultValue === 'number' ? parseInt(value as string, 10) : value;
    }

    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      const value = process.env[key];
      return typeof defaultValue === 'number' ? parseInt(value as string, 10) : value;
    }

    return defaultValue;
  }

  /**
   * Get health metrics
   */
  getHealthMetrics() {
    return {
      isHealthy: this._isHealthy(),
      lastCheckTime: this._lastCheckTime(),
      consecutiveFailures: this._consecutiveFailures(),
      totalChecks: this._totalChecks(),
      totalFailures: this._totalFailures(),
      uptimePercentage: this.uptimePercentage(),
      averageResponseTime: this._averageResponseTime(),
      healthStatus: this.healthStatus()
    };
  }

  /**
   * Manually trigger health check (for testing)
   */
  async manualHealthCheck(): Promise<boolean> {
    this.logger.info('[SupabaseHealthCheck]', 'Manual health check triggered');
    await this.performHealthCheck();
    return this._isHealthy();
  }

  /**
   * Reset health metrics
   */
  resetMetrics(): void {
    this._totalChecks.set(0);
    this._totalFailures.set(0);
    this._consecutiveFailures.set(0);
    this._averageResponseTime.set(0);
    this.logger.info('[SupabaseHealthCheck]', 'Health metrics reset');
  }
}
