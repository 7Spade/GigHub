import { Injectable } from '@angular/core';
import { Log, LogPhoto, CreateLogRequest, UpdateLogRequest, LogQueryOptions } from '@core/types/log';

import { SupabaseBaseRepository } from './base/supabase-base.repository';

/**
 * Log Supabase Repository
 * 日誌 Supabase Repository
 *
 * Implements Log CRUD operations using Supabase with:
 * - RLS policy enforcement
 * - Automatic retry on failures
 * - Organization-based isolation
 * - Photo/document management via Supabase Storage
 * - Soft delete support
 *
 * @extends SupabaseBaseRepository<Log>
 */
@Injectable({
  providedIn: 'root'
})
export class LogSupabaseRepository extends SupabaseBaseRepository<Log> {
  protected tableName = 'logs';
  private readonly photosBucket = 'log-photos';

  /**
   * Convert database record to Log entity
   */
  protected toEntity(data: any): Log {
    return {
      id: data.id,
      blueprintId: data.blueprint_id,
      date: new Date(data.date),
      title: data.title,
      description: data.description,
      workHours: data.work_hours,
      workers: data.workers,
      equipment: data.equipment,
      weather: data.weather,
      temperature: data.temperature,
      photos: this.parsePhotos(data.photos),
      creatorId: data.creator_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      deletedAt: data.deleted_at ? new Date(data.deleted_at) : null,
      voiceRecords: data.voice_records || [],
      documents: data.documents || [],
      metadata: data.metadata || {}
    };
  }

  /**
   * Parse photos from JSONB
   */
  private parsePhotos(photos: any): LogPhoto[] {
    if (!photos || !Array.isArray(photos)) {
      return [];
    }

    return photos.map((photo: any) => ({
      id: photo.id,
      url: photo.url,
      publicUrl: photo.publicUrl || photo.public_url,
      caption: photo.caption,
      uploadedAt: new Date(photo.uploadedAt || photo.uploaded_at),
      size: photo.size,
      fileName: photo.fileName || photo.file_name
    }));
  }

  /**
   * Convert Log entity to database record
   */
  protected override toRecord(log: Partial<Log>): any {
    const record: any = {};

    if (log.blueprintId) record.blueprint_id = log.blueprintId;
    if (log.date) record.date = log.date.toISOString().split('T')[0]; // Date only
    if (log.title) record.title = log.title;
    if (log.description !== undefined) record.description = log.description;
    if (log.workHours !== undefined) record.work_hours = log.workHours;
    if (log.workers !== undefined) record.workers = log.workers;
    if (log.equipment !== undefined) record.equipment = log.equipment;
    if (log.weather !== undefined) record.weather = log.weather;
    if (log.temperature !== undefined) record.temperature = log.temperature;
    if (log.creatorId) record.creator_id = log.creatorId;

    return record;
  }

  /**
   * Find log by ID
   * 根據 ID 查找日誌
   */
  async findById(id: string): Promise<Log | null> {
    return this.executeWithRetry(async () => {
      const { data, error } = await this.client.from(this.tableName).select('*').eq('id', id).is('deleted_at', null).single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null;
        }
        throw error;
      }

      return data ? this.toEntity(data) : null;
    });
  }

  /**
   * Find logs by blueprint
   * 根據藍圖查找日誌
   */
  async findByBlueprint(blueprintId: string, options?: LogQueryOptions): Promise<Log[]> {
    return this.executeWithRetry(async () => {
      let query = this.client.from(this.tableName).select('*').eq('blueprint_id', blueprintId);

      // Apply date range filter
      if (options?.startDate) {
        query = query.gte('date', options.startDate.toISOString().split('T')[0]);
      }

      if (options?.endDate) {
        query = query.lte('date', options.endDate.toISOString().split('T')[0]);
      }

      if (options?.creatorId) {
        query = query.eq('creator_id', options.creatorId);
      }

      // Handle deleted filter
      if (!options?.includeDeleted) {
        query = query.is('deleted_at', null);
      }

      // Apply limit
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      // Sort by date descending
      query = query.order('date', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(item => this.toEntity(item));
    });
  }

  /**
   * Find logs with options
   * 使用選項查找日誌
   */
  async findWithOptions(options: LogQueryOptions): Promise<Log[]> {
    return this.executeWithRetry(async () => {
      let query = this.client.from(this.tableName).select('*');

      // Apply filters
      if (options.blueprintId) {
        query = query.eq('blueprint_id', options.blueprintId);
      }

      if (options.startDate) {
        query = query.gte('date', options.startDate.toISOString().split('T')[0]);
      }

      if (options.endDate) {
        query = query.lte('date', options.endDate.toISOString().split('T')[0]);
      }

      if (options.creatorId) {
        query = query.eq('creator_id', options.creatorId);
      }

      // Handle deleted filter
      if (!options.includeDeleted) {
        query = query.is('deleted_at', null);
      }

      // Apply limit
      if (options.limit) {
        query = query.limit(options.limit);
      }

      // Sort by date descending
      query = query.order('date', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(item => this.toEntity(item));
    });
  }

  /**
   * Create a new log
   * 創建新日誌
   */
  async create(payload: CreateLogRequest): Promise<Log> {
    return this.executeWithRetry(async () => {
      const record = {
        blueprint_id: payload.blueprintId,
        date: payload.date.toISOString().split('T')[0], // Date only
        title: payload.title,
        description: payload.description,
        work_hours: payload.workHours,
        workers: payload.workers || 0,
        equipment: payload.equipment,
        weather: payload.weather,
        temperature: payload.temperature,
        creator_id: payload.creatorId,
        photos: [],
        voice_records: [],
        documents: [],
        metadata: {}
      };

      const { data, error } = await this.client.from(this.tableName).insert(record).select().single();

      if (error) {
        this.handleError(error, 'create log');
      }

      this.logger.info('[LogSupabaseRepository]', `Log created with ID: ${data.id}`);

      return this.toEntity(data);
    });
  }

  /**
   * Update log
   * 更新日誌
   */
  async update(id: string, payload: UpdateLogRequest): Promise<void> {
    return this.executeWithRetry(async () => {
      const record = this.toRecord(payload);

      const { error } = await this.client.from(this.tableName).update(record).eq('id', id).is('deleted_at', null);

      if (error) {
        this.handleError(error, 'update log');
      }

      this.logger.info('[LogSupabaseRepository]', `Log updated: ${id}`);
    });
  }

  /**
   * Upload photo to log
   * 上傳照片至日誌
   *
   * @param logId Log ID
   * @param file Photo file
   * @param caption Optional caption
   * @returns LogPhoto with URL
   */
  async uploadPhoto(logId: string, file: File, caption?: string): Promise<LogPhoto> {
    return this.executeWithRetry(async () => {
      // Generate unique filename
      const timestamp = Date.now();
      const fileName = `${logId}/${timestamp}_${file.name}`;

      // Upload file to storage
      const { data: uploadData, error: uploadError } = await this.client.storage.from(this.photosBucket).upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

      if (uploadError) {
        this.handleError(uploadError, 'upload photo');
      }

      // Get public URL
      const { data: urlData } = this.client.storage.from(this.photosBucket).getPublicUrl(fileName);

      const photo: LogPhoto = {
        id: `${timestamp}`,
        url: fileName,
        publicUrl: urlData.publicUrl,
        caption,
        uploadedAt: new Date(),
        size: file.size,
        fileName: file.name
      };

      // Update log photos array
      const { data: currentLog, error: fetchError } = await this.client.from(this.tableName).select('photos').eq('id', logId).single();

      if (fetchError) throw fetchError;

      const photos = this.parsePhotos(currentLog.photos);
      photos.push(photo);

      const { error: updateError } = await this.client.from(this.tableName).update({ photos: photos }).eq('id', logId);

      if (updateError) {
        this.handleError(updateError, 'update log photos');
      }

      this.logger.info('[LogSupabaseRepository]', `Photo uploaded to log: ${logId}`);

      return photo;
    });
  }

  /**
   * Delete photo from log
   * 從日誌刪除照片
   *
   * @param logId Log ID
   * @param photoId Photo ID
   */
  async deletePhoto(logId: string, photoId: string): Promise<void> {
    return this.executeWithRetry(async () => {
      // Get current photos
      const { data: currentLog, error: fetchError } = await this.client.from(this.tableName).select('photos').eq('id', logId).single();

      if (fetchError) throw fetchError;

      const photos = this.parsePhotos(currentLog.photos);
      const photoToDelete = photos.find(p => p.id === photoId);

      if (!photoToDelete) {
        throw new Error(`Photo not found: ${photoId}`);
      }

      // Remove from storage
      const { error: storageError } = await this.client.storage.from(this.photosBucket).remove([photoToDelete.url]);

      if (storageError) {
        this.logger.warn('[LogSupabaseRepository]', 'Failed to delete photo from storage', {
          message: storageError.message
        });
      }

      // Update log photos array
      const updatedPhotos = photos.filter(p => p.id !== photoId);

      const { error: updateError } = await this.client.from(this.tableName).update({ photos: updatedPhotos }).eq('id', logId);

      if (updateError) {
        this.handleError(updateError, 'update log photos after deletion');
      }

      this.logger.info('[LogSupabaseRepository]', `Photo deleted from log: ${logId}`);
    });
  }

  /**
   * Soft delete log
   * 軟刪除日誌
   */
  async delete(id: string): Promise<void> {
    return this.executeWithRetry(async () => {
      const { error } = await this.client.from(this.tableName).update({ deleted_at: new Date().toISOString() }).eq('id', id);

      if (error) {
        this.handleError(error, 'soft delete log');
      }

      this.logger.info('[LogSupabaseRepository]', `Log soft deleted: ${id}`);
    });
  }

  /**
   * Hard delete log (permanent)
   * 永久刪除日誌
   */
  async hardDelete(id: string): Promise<void> {
    return this.executeWithRetry(async () => {
      // First, delete all photos from storage
      const { data: log } = await this.client.from(this.tableName).select('photos').eq('id', id).single();

      if (log && log.photos) {
        const photos = this.parsePhotos(log.photos);
        const photoUrls = photos.map(p => p.url);

        if (photoUrls.length > 0) {
          await this.client.storage.from(this.photosBucket).remove(photoUrls);
        }
      }

      // Then delete the log record
      const { error } = await this.client.from(this.tableName).delete().eq('id', id);

      if (error) {
        this.handleError(error, 'hard delete log');
      }

      this.logger.info('[LogSupabaseRepository]', `Log hard deleted: ${id}`);
    });
  }

  /**
   * Restore soft-deleted log
   * 恢復軟刪除的日誌
   */
  async restore(id: string): Promise<void> {
    return this.executeWithRetry(async () => {
      const { error } = await this.client.from(this.tableName).update({ deleted_at: null }).eq('id', id);

      if (error) {
        this.handleError(error, 'restore log');
      }

      this.logger.info('[LogSupabaseRepository]', `Log restored: ${id}`);
    });
  }

  /**
   * Get logs statistics
   * 取得日誌統計
   */
  async getStatistics(
    blueprintId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalLogs: number;
    totalWorkHours: number;
    totalPhotos: number;
    averageWorkers: number;
  }> {
    return this.executeWithRetry(async () => {
      let query = this.client
        .from(this.tableName)
        .select('work_hours, workers, photos')
        .eq('blueprint_id', blueprintId)
        .is('deleted_at', null);

      if (startDate) {
        query = query.gte('date', startDate.toISOString().split('T')[0]);
      }

      if (endDate) {
        query = query.lte('date', endDate.toISOString().split('T')[0]);
      }

      const { data, error } = await query;

      if (error) throw error;

      const logs = data || [];
      const totalLogs = logs.length;
      const totalWorkHours = logs.reduce((sum, log) => sum + (log.work_hours || 0), 0);
      const totalPhotos = logs.reduce((sum, log) => {
        const photos = this.parsePhotos(log.photos);
        return sum + photos.length;
      }, 0);
      const averageWorkers = totalLogs > 0 ? logs.reduce((sum, log) => sum + (log.workers || 0), 0) / totalLogs : 0;

      return {
        totalLogs,
        totalWorkHours,
        totalPhotos,
        averageWorkers: Math.round(averageWorkers * 10) / 10 // Round to 1 decimal
      };
    });
  }
}
