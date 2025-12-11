import { Injectable, inject } from '@angular/core';
import { SupabaseService, LoggerService } from '@core';
import {
  UploadResult,
  FileObject,
  StorageError,
  UploadOptions,
  DownloadOptions,
  ListOptions
} from '@core/types/storage';

/**
 * Storage Repository
 * 儲存庫 Repository
 * 
 * Following Occam's Razor: Simple, focused storage operations
 * Based on Supabase Storage API documentation
 * 
 * @see https://supabase.com/docs/guides/storage
 */
@Injectable({
  providedIn: 'root'
})
export class StorageRepository {
  private readonly supabase = inject(SupabaseService);
  private readonly logger = inject(LoggerService);

  /**
   * Upload a file to storage bucket
   * 上傳檔案到儲存桶
   * 
   * @param bucket - Bucket name
   * @param path - File path in bucket
   * @param file - File to upload
   * @param options - Upload options
   * @returns Upload result with path and URLs
   * 
   * @example
   * ```ts
   * const result = await storageRepo.uploadFile(
   *   'blueprint-logs',
   *   'logs/2024/01/photo.jpg',
   *   file,
   *   { upsert: false }
   * );
   * ```
   */
  async uploadFile(
    bucket: string,
    path: string,
    file: File,
    options?: UploadOptions
  ): Promise<UploadResult> {
    try {
      this.logger.info('[StorageRepository]', `Uploading file to ${bucket}/${path}`);

      const { data, error } = await this.supabase.client.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: options?.cacheControl || '3600',
          contentType: options?.contentType || file.type,
          upsert: options?.upsert || false
        });

      if (error) {
        this.logger.error('[StorageRepository]', 'Upload failed', error as Error);
        throw this.mapStorageError(error);
      }

      // Get public URL for the uploaded file
      const { data: publicUrlData } = this.supabase.client.storage
        .from(bucket)
        .getPublicUrl(path);

      const result: UploadResult = {
        path: data.path,
        fullPath: `${bucket}/${data.path}`,
        publicUrl: publicUrlData.publicUrl
      };

      this.logger.info('[StorageRepository]', `File uploaded successfully: ${result.fullPath}`);
      return result;
    } catch (error) {
      this.logger.error('[StorageRepository]', 'Upload error', error as Error);
      throw error;
    }
  }

  /**
   * Download a file from storage bucket
   * 從儲存桶下載檔案
   * 
   * @param bucket - Bucket name
   * @param path - File path in bucket
   * @param options - Download options
   * @returns File blob
   * 
   * @example
   * ```ts
   * const blob = await storageRepo.downloadFile(
   *   'blueprint-logs',
   *   'logs/2024/01/photo.jpg'
   * );
   * ```
   */
  async downloadFile(
    bucket: string,
    path: string,
    options?: DownloadOptions
  ): Promise<Blob> {
    try {
      this.logger.info('[StorageRepository]', `Downloading file from ${bucket}/${path}`);

      const { data, error } = await this.supabase.client.storage
        .from(bucket)
        .download(path, options?.transform);

      if (error) {
        this.logger.error('[StorageRepository]', 'Download failed', error as Error);
        throw this.mapStorageError(error);
      }

      this.logger.info('[StorageRepository]', 'File downloaded successfully');
      return data;
    } catch (error) {
      this.logger.error('[StorageRepository]', 'Download error', error as Error);
      throw error;
    }
  }

  /**
   * Delete a file from storage bucket
   * 從儲存桶刪除檔案
   * 
   * @param bucket - Bucket name
   * @param path - File path in bucket
   * 
   * @example
   * ```ts
   * await storageRepo.deleteFile('blueprint-logs', 'logs/2024/01/photo.jpg');
   * ```
   */
  async deleteFile(bucket: string, path: string): Promise<void> {
    try {
      this.logger.info('[StorageRepository]', `Deleting file from ${bucket}/${path}`);

      const { error } = await this.supabase.client.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        this.logger.error('[StorageRepository]', 'Delete failed', error as Error);
        throw this.mapStorageError(error);
      }

      this.logger.info('[StorageRepository]', 'File deleted successfully');
    } catch (error) {
      this.logger.error('[StorageRepository]', 'Delete error', error as Error);
      throw error;
    }
  }

  /**
   * List files in a storage bucket folder
   * 列出儲存桶資料夾中的檔案
   * 
   * @param bucket - Bucket name
   * @param folder - Folder path (optional)
   * @param options - List options
   * @returns Array of file objects
   * 
   * @example
   * ```ts
   * const files = await storageRepo.listFiles('blueprint-logs', 'logs/2024/01');
   * ```
   */
  async listFiles(
    bucket: string,
    folder?: string,
    options?: ListOptions
  ): Promise<FileObject[]> {
    try {
      this.logger.info('[StorageRepository]', `Listing files in ${bucket}/${folder || ''}`);

      const { data, error } = await this.supabase.client.storage
        .from(bucket)
        .list(folder, {
          limit: options?.limit,
          offset: options?.offset,
          sortBy: options?.sortBy
        });

      if (error) {
        this.logger.error('[StorageRepository]', 'List failed', error as Error);
        throw this.mapStorageError(error);
      }

      const files: FileObject[] = data.map(file => ({
        name: file.name,
        path: folder ? `${folder}/${file.name}` : file.name,
        id: file.id,
        updated_at: file.updated_at,
        created_at: file.created_at,
        last_accessed_at: file.last_accessed_at,
        metadata: file.metadata
      }));

      this.logger.info('[StorageRepository]', `Listed ${files.length} files`);
      return files;
    } catch (error) {
      this.logger.error('[StorageRepository]', 'List error', error as Error);
      throw error;
    }
  }

  /**
   * Get public URL for a file
   * 取得檔案的公開 URL
   * 
   * @param bucket - Bucket name
   * @param path - File path in bucket
   * @returns Public URL
   * 
   * @example
   * ```ts
   * const url = storageRepo.getPublicUrl('blueprint-logs', 'logs/2024/01/photo.jpg');
   * ```
   */
  getPublicUrl(bucket: string, path: string): string {
    const { data } = this.supabase.client.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  /**
   * Map Supabase storage error to StorageError
   * 將 Supabase 儲存錯誤對應到 StorageError
   */
  private mapStorageError(error: any): StorageError {
    return {
      message: error.message || 'Storage operation failed',
      statusCode: error.statusCode,
      error: error.error
    };
  }
}
