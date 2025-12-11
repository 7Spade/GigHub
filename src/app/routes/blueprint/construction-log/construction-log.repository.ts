/**
 * Construction Log Repository
 * 工地施工日誌資料存取層
 *
 * Uses Supabase for data persistence and storage
 * Implements Repository pattern
 *
 * @author GigHub Development Team
 * @date 2025-12-11
 */

import { Injectable, inject } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { Log, CreateLogRequest, UpdateLogRequest, LogQueryOptions, LogPhoto } from '@core/types/log/log.types';
import { SupabaseService } from '@core/services/supabase.service';

@Injectable({ providedIn: 'root' })
export class ConstructionLogRepository {
  private supabase = inject(SupabaseService);
  private client: SupabaseClient;

  constructor() {
    this.client = this.supabase.client;
  }

  /**
   * Find all logs with optional filters
   */
  async findAll(options?: LogQueryOptions): Promise<Log[]> {
    let query = this.client.from('construction_logs').select('*');

    // Apply filters
    if (options?.blueprintId) {
      query = query.eq('blueprint_id', options.blueprintId);
    }

    if (options?.startDate) {
      query = query.gte('date', options.startDate.toISOString());
    }

    if (options?.endDate) {
      query = query.lte('date', options.endDate.toISOString());
    }

    if (options?.creatorId) {
      query = query.eq('creator_id', options.creatorId);
    }

    if (!options?.includeDeleted) {
      query = query.is('deleted_at', null);
    }

    // Apply limit
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    // Order by date descending
    query = query.order('date', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch logs: ${error.message}`);
    }

    return this.mapToLogs(data || []);
  }

  /**
   * Find a single log by ID
   */
  async findById(blueprintId: string, logId: string): Promise<Log | null> {
    const { data, error } = await this.client
      .from('construction_logs')
      .select('*')
      .eq('id', logId)
      .eq('blueprint_id', blueprintId)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      throw new Error(`Failed to fetch log: ${error.message}`);
    }

    return this.mapToLog(data);
  }

  /**
   * Create a new log
   */
  async create(request: CreateLogRequest): Promise<Log> {
    const logData = {
      blueprint_id: request.blueprintId,
      date: request.date.toISOString(),
      title: request.title,
      description: request.description || null,
      work_hours: request.workHours || null,
      workers: request.workers || null,
      equipment: request.equipment || null,
      weather: request.weather || null,
      temperature: request.temperature || null,
      photos: [],
      creator_id: request.creatorId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await this.client.from('construction_logs').insert(logData).select().single();

    if (error) {
      throw new Error(`Failed to create log: ${error.message}`);
    }

    return this.mapToLog(data);
  }

  /**
   * Update an existing log
   */
  async update(blueprintId: string, logId: string, request: UpdateLogRequest): Promise<Log> {
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (request.date !== undefined) {
      updateData.date = request.date.toISOString();
    }
    if (request.title !== undefined) {
      updateData.title = request.title;
    }
    if (request.description !== undefined) {
      updateData.description = request.description;
    }
    if (request.workHours !== undefined) {
      updateData.work_hours = request.workHours;
    }
    if (request.workers !== undefined) {
      updateData.workers = request.workers;
    }
    if (request.equipment !== undefined) {
      updateData.equipment = request.equipment;
    }
    if (request.weather !== undefined) {
      updateData.weather = request.weather;
    }
    if (request.temperature !== undefined) {
      updateData.temperature = request.temperature;
    }

    const { data, error } = await this.client
      .from('construction_logs')
      .update(updateData)
      .eq('id', logId)
      .eq('blueprint_id', blueprintId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update log: ${error.message}`);
    }

    return this.mapToLog(data);
  }

  /**
   * Soft delete a log
   */
  async delete(blueprintId: string, logId: string): Promise<void> {
    const { error } = await this.client
      .from('construction_logs')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', logId)
      .eq('blueprint_id', blueprintId);

    if (error) {
      throw new Error(`Failed to delete log: ${error.message}`);
    }
  }

  /**
   * Upload photo to Supabase Storage
   */
  async uploadPhoto(blueprintId: string, logId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${blueprintId}/${logId}/${Date.now()}.${fileExt}`;
    const filePath = `construction-logs/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await this.client.storage
      .from('construction-photos')
      .upload(filePath, file);

    if (uploadError) {
      throw new Error(`Failed to upload photo: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = this.client.storage.from('construction-photos').getPublicUrl(filePath);

    const photoUrl = urlData.publicUrl;

    // Update log with photo
    const { data: log, error: fetchError } = await this.client
      .from('construction_logs')
      .select('photos')
      .eq('id', logId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch log for photo update: ${fetchError.message}`);
    }

    const photos = log.photos || [];
    const newPhoto: LogPhoto = {
      id: `photo_${Date.now()}`,
      url: filePath,
      publicUrl: photoUrl,
      fileName: file.name,
      size: file.size,
      uploadedAt: new Date()
    };

    photos.push(newPhoto);

    const { error: updateError } = await this.client
      .from('construction_logs')
      .update({ photos, updated_at: new Date().toISOString() })
      .eq('id', logId);

    if (updateError) {
      throw new Error(`Failed to update log with photo: ${updateError.message}`);
    }

    return photoUrl;
  }

  /**
   * Delete photo from Supabase Storage and log
   */
  async deletePhoto(blueprintId: string, logId: string, photoId: string): Promise<void> {
    // Get current log
    const { data: log, error: fetchError } = await this.client
      .from('construction_logs')
      .select('photos')
      .eq('id', logId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch log for photo deletion: ${fetchError.message}`);
    }

    const photos = (log.photos || []) as LogPhoto[];
    const photo = photos.find((p) => p.id === photoId);

    if (!photo) {
      throw new Error('Photo not found');
    }

    // Delete from storage
    const { error: deleteError } = await this.client.storage.from('construction-photos').remove([photo.url]);

    if (deleteError) {
      console.warn('Failed to delete photo from storage:', deleteError);
    }

    // Update log to remove photo reference
    const updatedPhotos = photos.filter((p) => p.id !== photoId);

    const { error: updateError } = await this.client
      .from('construction_logs')
      .update({ photos: updatedPhotos, updated_at: new Date().toISOString() })
      .eq('id', logId);

    if (updateError) {
      throw new Error(`Failed to update log after photo deletion: ${updateError.message}`);
    }
  }

  /**
   * Map database row to Log entity
   */
  private mapToLog(data: any): Log {
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
      photos: data.photos || [],
      creatorId: data.creator_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      deletedAt: data.deleted_at ? new Date(data.deleted_at) : null
    };
  }

  /**
   * Map database rows to Log entities
   */
  private mapToLogs(data: any[]): Log[] {
    return data.map((item) => this.mapToLog(item));
  }
}
