import { Injectable, inject, signal, computed, ErrorHandler } from '@angular/core';
import { Router } from '@angular/router';
import { LoggerService } from './logger/logger.service';
import { FirebaseAnalyticsService } from './firebase-analytics.service';

/**
 * Error Tracking Service
 * 錯誤追蹤服務
 * 
 * Features:
 * - Global error handling
 * - Error categorization and tracking
 * - Integration with Firebase Analytics
 * - Error rate monitoring
 * 
 * @version 1.0.0
 * @since Angular 20.3.0
 */
export interface ErrorLog {
  id: string;
  message: string;
  stack?: string;
  type: ErrorType;
  severity: ErrorSeverity;
  timestamp: number;
  url: string;
  userAgent: string;
  metadata?: Record<string, any>;
}

export enum ErrorType {
  JAVASCRIPT = 'javascript',
  HTTP = 'http',
  NAVIGATION = 'navigation',
  CUSTOM = 'custom'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

@Injectable({
  providedIn: 'root'
})
export class ErrorTrackingService {
  private readonly logger = inject(LoggerService);
  private readonly router = inject(Router);
  private readonly analytics = inject(FirebaseAnalyticsService, { optional: true });

  // ✅ Signal-based state
  private readonly _errors = signal<ErrorLog[]>([]);
  private readonly _isTracking = signal(true);

  // Public readonly signals
  readonly errors = this._errors.asReadonly();
  readonly isTracking = this._isTracking.asReadonly();

  // ✅ Computed error metrics
  readonly totalErrors = computed(() => this._errors().length);
  readonly criticalErrors = computed(() => 
    this._errors().filter(e => e.severity === ErrorSeverity.CRITICAL).length
  );
  readonly recentErrors = computed(() => {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    return this._errors().filter(e => e.timestamp > oneHourAgo);
  });
  readonly errorRate = computed(() => {
    const recent = this.recentErrors();
    if (recent.length === 0) return 0;
    // Errors per minute
    return Math.round(recent.length / 60);
  });

  /**
   * Log an error
   * 記錄錯誤
   */
  logError(
    error: Error | string,
    type: ErrorType = ErrorType.JAVASCRIPT,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    metadata?: Record<string, any>
  ): void {
    if (!this._isTracking()) return;

    const errorLog: ErrorLog = {
      id: this.generateErrorId(),
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'string' ? undefined : error.stack,
      type,
      severity,
      timestamp: Date.now(),
      url: this.router.url,
      userAgent: navigator.userAgent,
      metadata
    };

    // Add to error list
    this._errors.update(errors => {
      const updated = [...errors, errorLog];
      // Keep only last 100 errors
      return updated.slice(-100);
    });

    // Log to console
    this.logger.error(
      `[ErrorTracking][${type}][${severity}]`,
      errorLog.message,
      typeof error === 'string' ? new Error(error) : error
    );

    // Send to Firebase Analytics
    if (this.analytics) {
      this.analytics.logEvent('error', {
        error_type: type,
        error_severity: severity,
        error_message: errorLog.message,
        error_url: errorLog.url
      });
    }

    // Show notification for critical errors
    if (severity === ErrorSeverity.CRITICAL) {
      this.notifyCriticalError(errorLog);
    }
  }

  /**
   * Generate unique error ID
   * 產生唯一錯誤 ID
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Notify critical error
   * 通知關鍵錯誤
   */
  private notifyCriticalError(error: ErrorLog): void {
    // In a real application, this would send notifications
    // For now, just log it
    this.logger.error(
      '[ErrorTracking][CRITICAL]',
      'Critical error detected',
      new Error(error.message)
    );
  }

  /**
   * Clear all errors
   * 清除所有錯誤
   */
  clearErrors(): void {
    this._errors.set([]);
    this.logger.info('[ErrorTracking]', 'All errors cleared');
  }

  /**
   * Start tracking
   * 開始追蹤
   */
  startTracking(): void {
    this._isTracking.set(true);
    this.logger.info('[ErrorTracking]', 'Error tracking started');
  }

  /**
   * Stop tracking
   * 停止追蹤
   */
  stopTracking(): void {
    this._isTracking.set(false);
    this.logger.info('[ErrorTracking]', 'Error tracking stopped');
  }

  /**
   * Get error summary
   * 取得錯誤摘要
   */
  getSummary(): {
    total: number;
    critical: number;
    recentCount: number;
    errorRate: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
  } {
    const errors = this._errors();
    
    const byType = errors.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const bySeverity = errors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: this.totalErrors(),
      critical: this.criticalErrors(),
      recentCount: this.recentErrors().length,
      errorRate: this.errorRate(),
      byType,
      bySeverity
    };
  }
}

/**
 * Global Error Handler
 * 全域錯誤處理器
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly errorTracking = inject(ErrorTrackingService);

  handleError(error: Error): void {
    // Determine severity based on error type
    let severity = ErrorSeverity.MEDIUM;
    
    if (error.message.includes('ChunkLoadError') || error.message.includes('Failed to fetch')) {
      severity = ErrorSeverity.HIGH;
    } else if (error.name === 'TypeError' || error.name === 'ReferenceError') {
      severity = ErrorSeverity.HIGH;
    }

    // Log the error
    this.errorTracking.logError(error, ErrorType.JAVASCRIPT, severity, {
      errorName: error.name,
      originalError: error
    });

    // Rethrow to let Angular handle it normally
    throw error;
  }
}


