/**
 * Link Domain Models
 *
 * Model definitions for external links
 *
 * @module features/blueprint/domain/models/link
 */

import { LinkCategoryEnum } from '../enums';

/**
 * Link entity model
 */
export interface Link {
  id: string;
  blueprint_id: string;
  url: string;
  title: string | null;
  description: string | null;
  category: LinkCategoryEnum;
  thumbnail_url: string | null;
  favicon_url: string | null;
  is_valid: boolean;
  sort_order: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/**
 * Link insert model
 */
export interface LinkInsert {
  blueprint_id: string;
  url: string;
  title?: string | null;
  description?: string | null;
  category?: LinkCategoryEnum | string;
  thumbnail_url?: string | null;
  favicon_url?: string | null;
  sort_order?: number;
}

/**
 * Link update model
 */
export interface LinkUpdate {
  url?: string;
  title?: string | null;
  description?: string | null;
  category?: LinkCategoryEnum | string;
  thumbnail_url?: string | null;
  favicon_url?: string | null;
  is_valid?: boolean;
  sort_order?: number;
}
