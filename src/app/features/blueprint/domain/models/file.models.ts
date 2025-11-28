/**
 * File Domain Models
 *
 * Model definitions for file management
 *
 * @module features/blueprint/domain/models/file
 */

import { FileTypeEnum } from '../enums';

/**
 * File entity model
 */
export interface File {
  id: string;
  blueprint_id: string;
  parent_id: string | null;
  name: string;
  file_type: FileTypeEnum;
  mime_type: string | null;
  size_bytes: number | null;
  storage_path: string | null;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/**
 * File insert model
 */
export interface FileInsert {
  blueprint_id: string;
  parent_id?: string | null;
  name: string;
  file_type: FileTypeEnum | string;
  mime_type?: string | null;
  size_bytes?: number | null;
  storage_path?: string | null;
  description?: string | null;
}

/**
 * File update model
 */
export interface FileUpdate {
  name?: string;
  parent_id?: string | null;
  description?: string | null;
}

/**
 * File version entity model
 */
export interface FileVersion {
  id: string;
  file_id: string;
  version_number: number;
  storage_path: string;
  size_bytes: number;
  created_by: string;
  created_at: string;
}

/**
 * File share entity model
 */
export interface FileShare {
  id: string;
  file_id: string;
  share_token: string;
  password_hash: string | null;
  expires_at: string | null;
  max_access_count: number | null;
  access_count: number;
  created_by: string;
  created_at: string;
}

/**
 * File share insert model
 */
export interface FileShareInsert {
  file_id: string;
  share_token: string;
  password_hash?: string | null;
  expires_at?: string | null;
  max_access_count?: number | null;
}
