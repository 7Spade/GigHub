import { Injectable, signal, computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { LoggerService } from '@core';
import { Log, LogPhoto, CreateLogRequest, UpdateLogRequest } from '@core/types/log';
import { LogRepository } from './log.repository';
import { StorageRepository } from '../storage/storage.repository';

/**
 * Log Store
 * 日誌 Store
 * 
 * Following Occam's Razor: Simple signal-based state management
 * Integrates Storage Repository for photo uploads
 */
@Injectable({
  providedIn: 'root'
})
export class LogStore {
  private readonly repository = inject(LogRepository);
  private readonly storageRepo = inject(StorageRepository);
  private readonly logger = inject(LoggerService);

  // Private state
  private _logs = signal<Log[]>([]);
  private _loading = signal(false);
  private _error = signal<string | null>(null);
  private _uploadingPhotos = signal(false);

  // Public readonly state
  readonly logs = this._logs.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly uploadingPhotos = this._uploadingPhotos.asReadonly();

  // Computed signals
  readonly logCount = computed(() => this._logs().length);

  /**
   * Load logs for a blueprint
   * 載入藍圖的日誌
   */
  async loadLogs(blueprintId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const logs = await firstValueFrom(this.repository.findByBlueprint(blueprintId));
      this._logs.set(logs);
      this.logger.info('[LogStore]', `Loaded ${logs.length} logs for blueprint: ${blueprintId}`);
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      this._error.set(error);
      this.logger.error('[LogStore]', 'Failed to load logs', err as Error);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Create a new log
   * 創建新日誌
   */
  async createLog(request: CreateLogRequest): Promise<Log> {
    try {
      const newLog = await this.repository.create(request);
      this._logs.update(logs => [newLog, ...logs]);
      this.logger.info('[LogStore]', `Log created: ${newLog.id}`);
      return newLog;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      this._error.set(error);
      this.logger.error('[LogStore]', 'Failed to create log', err as Error);
      throw err;
    }
  }

  /**
   * Update a log
   * 更新日誌
   */
  async updateLog(id: string, data: UpdateLogRequest): Promise<void> {
    try {
      await this.repository.update(id, data);
      
      // Update local state
      this._logs.update(logs =>
        logs.map(log =>
          log.id === id
            ? { ...log, ...data, updatedAt: new Date() }
            : log
        )
      );
      
      this.logger.info('[LogStore]', `Log updated: ${id}`);
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      this._error.set(error);
      this.logger.error('[LogStore]', 'Failed to update log', err as Error);
      throw err;
    }
  }

  /**
   * Upload photo to log
   * 上傳照片到日誌
   */
  async uploadPhoto(logId: string, blueprintId: string, file: File): Promise<LogPhoto> {
    this._uploadingPhotos.set(true);

    try {
      // Generate photo path
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name}`;
      const path = `blueprints/${blueprintId}/logs/${logId}/${fileName}`;

      // Upload to storage
      const uploadResult = await this.storageRepo.uploadFile(
        'blueprint-logs',
        path,
        file,
        { upsert: false }
      );

      // Create photo record
      const photo: LogPhoto = {
        id: timestamp.toString(),
        url: uploadResult.path,
        publicUrl: uploadResult.publicUrl,
        fileName: file.name,
        size: file.size,
        uploadedAt: new Date()
      };

      // Add to repository
      await this.repository.addPhoto(logId, photo);

      // Update local state
      this._logs.update(logs =>
        logs.map(log =>
          log.id === logId
            ? { ...log, photos: [...log.photos, photo] }
            : log
        )
      );

      this.logger.info('[LogStore]', `Photo uploaded to log: ${logId}`);
      return photo;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      this._error.set(error);
      this.logger.error('[LogStore]', 'Failed to upload photo', err as Error);
      throw err;
    } finally {
      this._uploadingPhotos.set(false);
    }
  }

  /**
   * Delete photo from log
   * 從日誌刪除照片
   */
  async deletePhoto(logId: string, photo: LogPhoto): Promise<void> {
    try {
      // Delete from storage
      await this.storageRepo.deleteFile('blueprint-logs', photo.url);

      // Remove from repository
      await this.repository.removePhoto(logId, photo);

      // Update local state
      this._logs.update(logs =>
        logs.map(log =>
          log.id === logId
            ? { ...log, photos: log.photos.filter(p => p.id !== photo.id) }
            : log
        )
      );

      this.logger.info('[LogStore]', `Photo deleted from log: ${logId}`);
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      this._error.set(error);
      this.logger.error('[LogStore]', 'Failed to delete photo', err as Error);
      throw err;
    }
  }

  /**
   * Delete a log
   * 刪除日誌
   */
  async deleteLog(id: string): Promise<void> {
    try {
      await this.repository.delete(id);
      
      // Remove from local state
      this._logs.update(logs => logs.filter(log => log.id !== id));
      
      this.logger.info('[LogStore]', `Log deleted: ${id}`);
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      this._error.set(error);
      this.logger.error('[LogStore]', 'Failed to delete log', err as Error);
      throw err;
    }
  }

  /**
   * Clear error state
   * 清除錯誤狀態
   */
  clearError(): void {
    this._error.set(null);
  }

  /**
   * Reset store
   * 重置 Store
   */
  reset(): void {
    this._logs.set([]);
    this._loading.set(false);
    this._error.set(null);
    this._uploadingPhotos.set(false);
  }
}
