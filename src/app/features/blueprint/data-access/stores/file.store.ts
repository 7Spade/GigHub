/**
 * File Store
 *
 * Signal-based state management for file module
 *
 * @module features/blueprint/data-access/stores/file.store
 */

import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { File, FileInsert, FileUpdate } from '../../domain';
import { FileTypeEnum } from '../../domain/enums';
import { FileRepository } from '../repositories';

/**
 * File breadcrumb interface
 */
export interface FileBreadcrumb {
  id: string;
  name: string;
}

/**
 * File Store
 *
 * Manages file and folder state
 */
@Injectable({ providedIn: 'root' })
export class FileStore {
  private readonly repository = inject(FileRepository);

  // Private state signals
  private readonly _files = signal<File[]>([]);
  private readonly _currentFolder = signal<File | null>(null);
  private readonly _breadcrumbs = signal<FileBreadcrumb[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // Public readonly state
  readonly files = this._files.asReadonly();
  readonly currentFolder = this._currentFolder.asReadonly();
  readonly breadcrumbs = this._breadcrumbs.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed signals
  readonly folders = computed(() =>
    this._files().filter(f => f.file_type === FileTypeEnum.FOLDER)
  );

  readonly nonFolderFiles = computed(() =>
    this._files().filter(f => f.file_type !== FileTypeEnum.FOLDER)
  );

  readonly statistics = computed(() => {
    const files = this._files();
    const folders = this.folders().length;
    const images = files.filter(f => f.file_type === FileTypeEnum.IMAGE).length;
    const documents = files.filter(f => f.file_type === FileTypeEnum.DOCUMENT).length;
    const totalSize = files.reduce((sum, f) => sum + (f.size_bytes || 0), 0);

    return { total: files.length, folders, images, documents, totalSize };
  });

  /**
   * Load files for a blueprint
   */
  async loadFiles(blueprintId: string, folderId: string | null = null): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const files = await firstValueFrom(
        this.repository.findByFolder(folderId, blueprintId)
      );
      this._files.set(files);
    } catch (err) {
      this._error.set('載入檔案失敗');
      console.error('[FileStore] loadFiles error:', err);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Navigate to folder
   */
  async navigateToFolder(blueprintId: string, folder: File | null): Promise<void> {
    this._currentFolder.set(folder);

    // Update breadcrumbs
    if (!folder) {
      this._breadcrumbs.set([]);
    } else {
      // For now, just add the folder. Full path calculation needs backend
      const current = this._breadcrumbs();
      const index = current.findIndex(b => b.id === folder.id);
      if (index >= 0) {
        // Navigating back
        this._breadcrumbs.set(current.slice(0, index + 1));
      } else {
        // Navigating forward
        this._breadcrumbs.set([...current, { id: folder.id, name: folder.name }]);
      }
    }

    await this.loadFiles(blueprintId, folder?.id || null);
  }

  /**
   * Create a folder
   */
  async createFolder(data: FileInsert): Promise<File | null> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const folder = await firstValueFrom(this.repository.create({
        ...data,
        file_type: FileTypeEnum.FOLDER
      }));
      this._files.update(files => [...files, folder]);
      return folder;
    } catch (err) {
      this._error.set('建立資料夾失敗');
      console.error('[FileStore] createFolder error:', err);
      return null;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Upload a file
   */
  async uploadFile(data: FileInsert): Promise<File | null> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const file = await firstValueFrom(this.repository.create(data));
      this._files.update(files => [...files, file]);
      return file;
    } catch (err) {
      this._error.set('上傳檔案失敗');
      console.error('[FileStore] uploadFile error:', err);
      return null;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Update file/folder
   */
  async updateFile(id: string, data: FileUpdate): Promise<File | null> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const file = await firstValueFrom(this.repository.update(id, data));
      this._files.update(files =>
        files.map(f => f.id === id ? file : f)
      );
      return file;
    } catch (err) {
      this._error.set('更新失敗');
      console.error('[FileStore] updateFile error:', err);
      return null;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Delete file/folder
   */
  async deleteFile(id: string): Promise<boolean> {
    this._loading.set(true);
    this._error.set(null);

    try {
      await firstValueFrom(this.repository.delete(id));
      this._files.update(files => files.filter(f => f.id !== id));
      return true;
    } catch (err) {
      this._error.set('刪除失敗');
      console.error('[FileStore] deleteFile error:', err);
      return false;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Search files
   */
  async searchFiles(blueprintId: string, term: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const files = await firstValueFrom(
        this.repository.searchByName(blueprintId, term)
      );
      this._files.set(files);
    } catch (err) {
      this._error.set('搜尋失敗');
      console.error('[FileStore] searchFiles error:', err);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Reset store state
   */
  reset(): void {
    this._files.set([]);
    this._currentFolder.set(null);
    this._breadcrumbs.set([]);
    this._loading.set(false);
    this._error.set(null);
  }
}
