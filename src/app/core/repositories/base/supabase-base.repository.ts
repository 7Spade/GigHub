import { inject } from '@angular/core';
import { ErrorTrackingService } from '@core/services/error-tracking.service';
import { LoggerService } from '@core/services/logger';
import { SupabaseService } from '@core/services/supabase.service';
import { SupabaseClient, PostgrestError } from '@supabase/supabase-js';

/**
 * Supabase Base Repository
 *
 * 提供所有 Supabase Repository 的基礎功能：
 * - 統一的錯誤處理
 * - 自動重試機制 (Exponential Backoff)
 * - RLS 政策驗證
 * - 日誌記錄
 * - 效能追蹤
 *
 * @abstract
 * 所有 Supabase Repository 都應繼承此類
 *
 * @example
 * ```typescript
 * export class TaskSupabaseRepository extends SupabaseBaseRepository<Task> {
 *   protected tableName = 'tasks';
 *
 *   async findByBlueprint(blueprintId: string): Promise<Task[]> {
 *     return this.executeWithRetry(async () => {
 *       const { data, error } = await this.client
 *         .from(this.tableName)
 *         .select('*')
 *         .eq('blueprint_id', blueprintId)
 *         .is('deleted_at', null);
 *
 *       if (error) throw error;
 *       return data.map(item => this.toEntity(item));
 *     });
 *   }
 * }
 * ```
 */
export abstract class SupabaseBaseRepository<T> {
  protected readonly supabaseService = inject(SupabaseService);
  protected readonly logger = inject(LoggerService);
  protected readonly errorTracking = inject(ErrorTrackingService);

  /**
   * 表格名稱（子類必須實作）
   */
  protected abstract tableName: string;

  /**
   * Get Supabase client instance
   */
  protected get client(): SupabaseClient {
    return this.supabaseService.client;
  }

  /**
   * 將資料庫記錄轉換為領域實體
   * 子類必須實作此方法
   */
  protected abstract toEntity(data: any): T;

  /**
   * 將領域實體轉換為資料庫記錄
   * 子類可選實作（若需要）
   */
  protected toRecord(entity: Partial<T>): any {
    return entity;
  }

  /**
   * 執行操作並自動重試（Exponential Backoff）
   *
   * @param operation 要執行的操作
   * @param maxRetries 最大重試次數（預設 3 次）
   * @param baseDelay 基礎延遲時間（預設 1000ms）
   * @returns 操作結果
   * @throws 最後一次錯誤（如果所有重試都失敗）
   */
  protected async executeWithRetry<R>(operation: () => Promise<R>, maxRetries = 3, baseDelay = 1000): Promise<R> {
    let lastError: any;
    const operationName = this.getOperationName();

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const startTime = performance.now();
        const result = await operation();
        const duration = performance.now() - startTime;

        // 記錄成功的操作
        this.logger.debug(`[${this.constructor.name}]`, `${operationName} succeeded (${duration.toFixed(2)}ms)`);

        return result;
      } catch (error: any) {
        lastError = error;

        // 檢查是否為不可重試的錯誤
        if (this.isNonRetryableError(error)) {
          this.logger.error(`[${this.constructor.name}]`, `${operationName} failed with non-retryable error`, error);
          this.errorTracking.trackSupabaseError(this.tableName, error, {
            operation: operationName,
            retryable: false
          });
          throw error;
        }

        // 計算延遲時間 (exponential backoff with jitter)
        const delay = this.calculateBackoffDelay(attempt, baseDelay);

        this.logger.warn(
          `[${this.constructor.name}]`,
          `${operationName} failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${delay}ms`,
          {
            error: error.message,
            code: error.code
          }
        );

        // 等待後重試
        await this.sleep(delay);
      }
    }

    // 所有重試都失敗，記錄錯誤並拋出
    this.logger.error(`[${this.constructor.name}]`, `${operationName} failed after ${maxRetries} retries`, lastError);

    this.errorTracking.trackSupabaseError(this.tableName, lastError, {
      operation: operationName,
      retries: maxRetries,
      finalFailure: true
    });

    throw lastError;
  }

  /**
   * 檢查是否為不可重試的錯誤
   *
   * 不可重試的錯誤類型：
   * - RLS 政策違規 (PGRST301)
   * - 權限不足 (42501)
   * - 唯一約束違規 (23505)
   * - 外鍵約束違規 (23503)
   * - 資料格式錯誤 (22P02)
   * - 檢查約束違規 (23514)
   */
  protected isNonRetryableError(error: any): boolean {
    // PostgreSQL error codes for non-retryable errors
    const nonRetryableCodes = [
      'PGRST301', // RLS policy violation
      '42501', // Insufficient privilege
      '23505', // Unique violation
      '23503', // Foreign key violation
      '22P02', // Invalid text representation
      '23514', // Check violation
      '23502', // Not null violation
      '42P01', // Undefined table
      '42703' // Undefined column
    ];

    const errorCode = error?.code || '';
    return nonRetryableCodes.includes(errorCode);
  }

  /**
   * 計算 Exponential Backoff 延遲時間（含 Jitter）
   *
   * Formula: delay = baseDelay * (2 ^ attempt) + random(0, 1000)
   * Jitter 避免多個請求同時重試（雷鳴效應）
   */
  protected calculateBackoffDelay(attempt: number, baseDelay: number): number {
    const exponentialDelay = baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 1000;
    const maxDelay = 30000; // 最大延遲 30 秒

    return Math.min(exponentialDelay + jitter, maxDelay);
  }

  /**
   * 休眠指定毫秒
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 取得目前操作名稱（用於日誌）
   */
  protected getOperationName(): string {
    // 嘗試從呼叫堆疊取得函式名稱
    try {
      const stack = new Error().stack || '';
      const stackLines = stack.split('\n');
      // 第三行通常是呼叫者
      const callerLine = stackLines[3] || '';
      const match = callerLine.match(/at (\w+)/);
      return match ? match[1] : 'unknown operation';
    } catch {
      return 'unknown operation';
    }
  }

  /**
   * 驗證 RLS 政策（透過嘗試存取）
   *
   * 此方法會執行一個簡單的 SELECT 查詢來驗證 RLS 政策是否正確配置
   * 如果 RLS 政策未正確配置，會拋出錯誤
   */
  async validateRLS(): Promise<boolean> {
    try {
      const { error } = await this.client.from(this.tableName).select('count').limit(1);

      if (error) {
        this.logger.error(`[${this.constructor.name}]`, 'RLS validation failed', error);
        return false;
      }

      this.logger.info(`[${this.constructor.name}]`, 'RLS validation passed');
      return true;
    } catch (error) {
      this.logger.error(`[${this.constructor.name}]`, 'RLS validation exception', error as Error);
      return false;
    }
  }

  /**
   * 處理 Supabase 錯誤並轉換為使用者友好的訊息
   */
  protected handleError(error: PostgrestError | any, context: string): never {
    const errorMessage = this.getErrorMessage(error);

    const errorContext: Record<string, unknown> = {
      message: errorMessage,
      details: error.details,
      hint: error.hint
    };

    // Only add code if it exists
    if (error['code']) {
      errorContext['code'] = error['code'];
    }

    // Create an Error object for logging
    const errorObj = new Error(errorMessage);

    this.logger.error(`[${this.constructor.name}]`, `${context} failed`, errorObj, errorContext);

    this.errorTracking.trackSupabaseError(this.tableName, error, { context });

    throw new Error(errorMessage);
  }

  /**
   * 取得使用者友好的錯誤訊息
   */
  protected getErrorMessage(error: any): string {
    const errorCode = error?.code || '';

    // 根據錯誤碼返回對應的訊息
    const errorMessages: Record<string, string> = {
      PGRST301: 'error.rls-violation',
      '42501': 'error.insufficient-privilege',
      '23505': 'error.duplicate-entry',
      '23503': 'error.foreign-key-violation',
      '23502': 'error.required-field-missing',
      '22P02': 'error.invalid-data-format',
      '23514': 'error.constraint-violation',
      PGRST116: 'error.connection-failed'
    };

    return errorMessages[errorCode] || error.message || 'error.unknown-database-error';
  }

  /**
   * 批次執行操作（減少 API 呼叫次數）
   *
   * @param operations 操作陣列
   * @param batchSize 批次大小（預設 100）
   */
  protected async executeBatch<R>(operations: Array<() => Promise<R>>, batchSize = 100): Promise<R[]> {
    const results: R[] = [];

    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(op => op()));
      results.push(...batchResults);

      this.logger.debug(`[${this.constructor.name}]`, `Batch ${Math.floor(i / batchSize) + 1} completed`, {
        processed: results.length,
        total: operations.length
      });
    }

    return results;
  }

  /**
   * 取得表格名稱（供子類使用）
   */
  protected getTableName(): string {
    return this.tableName;
  }
}
