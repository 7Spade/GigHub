/**
 * Link Domain Interfaces
 *
 * Interfaces for external resource link management
 * Specification: docs/specs/setc/09-link-module.setc.md
 *
 * @module features/blueprint/domain/interfaces/link
 */

/**
 * Link category types
 */
export type ILinkCategory = 'document' | 'design' | 'reference' | 'tool' | 'other';

/**
 * Create link request interface
 */
export interface ICreateLinkRequest {
  blueprint_id: string;
  url: string;
  title?: string;
  description?: string;
  category?: ILinkCategory;
}

/**
 * Update link request interface
 */
export interface IUpdateLinkRequest {
  title?: string;
  description?: string;
  category?: ILinkCategory;
  sort_order?: number;
}

/**
 * Link preview data (from URL metadata)
 */
export interface ILinkPreview {
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  site_name: string | null;
  favicon_url: string | null;
}

/**
 * Query filters for link listing
 */
export interface ILinkFilters {
  category?: ILinkCategory[];
  is_valid?: boolean;
  search?: string;
}
