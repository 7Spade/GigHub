/**
 * File Repository
 *
 * Repository for File data access layer
 * Following vertical slice architecture
 *
 * @module features/blueprint/data-access/repositories/file.repository
 */

import { Injectable } from '@angular/core';
import { BaseRepository, QueryOptions } from '@core';
import { Observable, map } from 'rxjs';

import { File, FileInsert, FileUpdate } from '../../domain';

/**
 * File Repository
 *
 * Handles data access for files and folders
 */
@Injectable({ providedIn: 'root' })
export class FileRepository extends BaseRepository<File, FileInsert, FileUpdate> {
  protected tableName = 'files';

  /**
   * Find files by blueprint
   *
   * @param {string} blueprintId - Blueprint ID
   * @param {QueryOptions} [options] - Query options
   * @returns {Observable<File[]>} Array of files
   */
  findByBlueprint(blueprintId: string, options?: QueryOptions): Observable<File[]> {
    return this.findAll({
      ...options,
      filters: {
        ...options?.filters,
        blueprintId
      },
      order: { column: 'name', ascending: true }
    });
  }

  /**
   * Find files by folder
   *
   * @param {string} folderId - Folder ID (null for root)
   * @param {string} blueprintId - Blueprint ID
   * @returns {Observable<File[]>} Array of files
   */
  findByFolder(folderId: string | null, blueprintId: string): Observable<File[]> {
    const filters: Record<string, unknown> = { blueprintId };
    if (folderId === null) {
      filters['folderId'] = null;
    } else {
      filters['folderId'] = folderId;
    }
    return this.findAll({
      filters,
      order: { column: 'name', ascending: true }
    });
  }

  /**
   * Find folders only
   *
   * @param {string} blueprintId - Blueprint ID
   * @returns {Observable<File[]>} Array of folders
   */
  findFolders(blueprintId: string): Observable<File[]> {
    return this.findAll({
      filters: {
        blueprintId,
        fileType: 'folder'
      },
      order: { column: 'name', ascending: true }
    });
  }

  /**
   * Find files by type
   *
   * @param {string} blueprintId - Blueprint ID
   * @param {string} fileType - File type
   * @returns {Observable<File[]>} Array of files
   */
  findByType(blueprintId: string, fileType: string): Observable<File[]> {
    return this.findAll({
      filters: {
        blueprintId,
        fileType
      },
      order: { column: 'name', ascending: true }
    });
  }

  /**
   * Search files by name
   *
   * @param {string} blueprintId - Blueprint ID
   * @param {string} searchTerm - Search term
   * @returns {Observable<File[]>} Array of matching files
   */
  searchByName(blueprintId: string, searchTerm: string): Observable<File[]> {
    return this.findByBlueprint(blueprintId).pipe(
      map(files => files.filter(f =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase())
      ))
    );
  }

  /**
   * Get folder path (breadcrumbs)
   *
   * @param {string} folderId - Current folder ID
   * @returns {Observable<File[]>} Array of folders from root to current
   */
  getFolderPath(folderId: string): Observable<File[]> {
    // For now, just fetch the folder. Full path calculation would need RPC
    return this.findById(folderId).pipe(
      map(folder => folder ? [folder] : [])
    );
  }
}
