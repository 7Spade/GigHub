/**
 * File Domain Interfaces
 *
 * Interfaces for file management system
 * Specification: docs/specs/setc/08-file-module.setc.md
 *
 * @module features/blueprint/domain/interfaces/file
 */

/**
 * File type classification
 */
export type IFileType = 'folder' | 'image' | 'document' | 'spreadsheet' | 'cad' | 'video' | 'audio' | 'other';

/**
 * Query filters for file listing
 */
export interface IFileFilters {
  folder_id?: string;
  file_type?: IFileType[];
  search?: string;
  created_by?: string;
}

/**
 * Create folder request interface
 */
export interface ICreateFolderRequest {
  blueprint_id: string;
  name: string;
  parent_id?: string;
  description?: string;
}

/**
 * Upload file request interface
 */
export interface IUploadFileRequest {
  blueprint_id: string;
  folder_id?: string;
  name: string;
  file_type: IFileType;
  mime_type: string;
  size_bytes: number;
  storage_path: string;
  description?: string;
}

/**
 * Create file share request interface
 */
export interface ICreateShareRequest {
  file_id: string;
  password?: string;
  expires_at?: string;
  max_access_count?: number;
}

/**
 * Breadcrumb item for folder navigation
 */
export interface IFileBreadcrumb {
  id: string;
  name: string;
}
