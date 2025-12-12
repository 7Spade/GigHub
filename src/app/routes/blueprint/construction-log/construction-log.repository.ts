import { Injectable } from '@angular/core';
import { Log, CreateLogRequest, UpdateLogRequest, LogQueryOptions, LogPhoto } from '@core/types/log/log.types';

/**
 * Construction Log Repository
 * 工地施工日誌資料存取層
 *
 * @deprecated This repository uses Supabase and should use LogFirestoreRepository instead
 * Temporarily stubbed to allow compilation
 */
@Injectable({ providedIn: 'root' })
export class ConstructionLogRepository {
  /**
   * Find all logs with optional filters
   *
   * @deprecated Use LogFirestoreRepository instead
   */
  async findAll(options?: LogQueryOptions): Promise<Log[]> {
    console.warn('ConstructionLogRepository: Use LogFirestoreRepository instead');
    return [];
  }

  /**
   * Find log by ID
   *
   * @deprecated Use LogFirestoreRepository instead
   */
  async findById(id: string): Promise<Log | null> {
    console.warn('ConstructionLogRepository: Use LogFirestoreRepository instead');
    return null;
  }

  /**
   * Create a new log
   *
   * @deprecated Use LogFirestoreRepository instead
   */
  async create(request: CreateLogRequest): Promise<Log> {
    console.warn('ConstructionLogRepository: Use LogFirestoreRepository instead');
    throw new Error('ConstructionLogRepository deprecated - use LogFirestoreRepository');
  }

  /**
   * Update existing log
   *
   * @deprecated Use LogFirestoreRepository instead
   */
  async update(id: string, request: UpdateLogRequest): Promise<void> {
    console.warn('ConstructionLogRepository: Use LogFirestoreRepository instead');
  }

  /**
   * Delete log
   *
   * @deprecated Use LogFirestoreRepository instead
   */
  async delete(id: string): Promise<void> {
    console.warn('ConstructionLogRepository: Use LogFirestoreRepository instead');
  }

  /**
   * Upload photo to log
   *
   * @deprecated Use LogFirestoreRepository instead
   */
  async uploadPhoto(logId: string, file: File, caption?: string): Promise<LogPhoto> {
    console.warn('ConstructionLogRepository: Use LogFirestoreRepository instead');
    throw new Error('ConstructionLogRepository deprecated - use LogFirestoreRepository');
  }

  /**
   * Delete photo from log
   *
   * @deprecated Use LogFirestoreRepository instead
   */
  async deletePhoto(logId: string, photoId: string): Promise<void> {
    console.warn('ConstructionLogRepository: Use LogFirestoreRepository instead');
  }
}
