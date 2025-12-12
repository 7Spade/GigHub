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
/* eslint-disable @typescript-eslint/no-unused-vars */
export class ConstructionLogRepository {
  /**
   * Find all logs with optional filters
   *
   * @deprecated Use LogFirestoreRepository instead
   */
  async findAll(_options?: LogQueryOptions): Promise<Log[]> {
    console.warn('ConstructionLogRepository: Use LogFirestoreRepository instead');
    return [];
  }

  /**
   * Find log by ID
   *
   * @deprecated Use LogFirestoreRepository instead
   */
  async findById(_id: string): Promise<Log | null> {
    console.warn('ConstructionLogRepository: Use LogFirestoreRepository instead');
    return null;
  }

  /**
   * Create a new log
   *
   * @deprecated Use LogFirestoreRepository instead
   */
  async create(_request: CreateLogRequest): Promise<Log> {
    console.warn('ConstructionLogRepository: Use LogFirestoreRepository instead');
    throw new Error('ConstructionLogRepository deprecated - use LogFirestoreRepository');
  }

  /**
   * Update existing log
   *
   * @deprecated Use LogFirestoreRepository instead
   */
  async update(_id: string, _request: UpdateLogRequest): Promise<void> {
    console.warn('ConstructionLogRepository: Use LogFirestoreRepository instead');
  }

  /**
   * Delete log
   *
   * @deprecated Use LogFirestoreRepository instead
   */
  async delete(_id: string): Promise<void> {
    console.warn('ConstructionLogRepository: Use LogFirestoreRepository instead');
  }

  /**
   * Upload photo to log
   *
   * @deprecated Use LogFirestoreRepository instead
   */
  async uploadPhoto(_logId: string, _file: File, _caption?: string): Promise<LogPhoto> {
    console.warn('ConstructionLogRepository: Use LogFirestoreRepository instead');
    throw new Error('ConstructionLogRepository deprecated - use LogFirestoreRepository');
  }

  /**
   * Delete photo from log
   *
   * @deprecated Use LogFirestoreRepository instead
   */
  async deletePhoto(_logId: string, _photoId: string): Promise<void> {
    console.warn('ConstructionLogRepository: Use LogFirestoreRepository instead');
  }
}
