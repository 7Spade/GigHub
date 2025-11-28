/**
 * Activity Domain Models
 *
 * Model definitions for activities and entity links
 *
 * @module features/blueprint/domain/models/activity
 */

/**
 * Entity types
 */
export type EntityType = 'task' | 'diary' | 'file' | 'link';

/**
 * Event types for activities
 */
export type EventType =
  | 'task.created' | 'task.updated' | 'task.deleted' | 'task.status_changed'
  | 'task.acceptance.submitted' | 'task.acceptance.approved' | 'task.acceptance.rejected'
  | 'diary.created' | 'diary.submitted' | 'diary.approved' | 'diary.rejected'
  | 'file.uploaded' | 'file.deleted' | 'file.shared'
  | 'link.created' | 'link.deleted';

/**
 * Activity entity model
 */
export interface Activity {
  id: string;
  blueprint_id: string;
  event_type: EventType;
  entity_type: EntityType;
  entity_id: string;
  entity_name: string | null;
  actor_id: string;
  changes: Record<string, unknown> | null;
  created_at: string;
}

/**
 * Activity insert model
 */
export interface ActivityInsert {
  blueprint_id: string;
  event_type: EventType;
  entity_type: EntityType;
  entity_id: string;
  entity_name?: string | null;
  actor_id?: string;
  changes?: Record<string, unknown> | null;
}

/**
 * Entity link model
 */
export interface EntityLink {
  id: string;
  blueprint_id: string;
  source_type: EntityType;
  source_id: string;
  target_type: EntityType;
  target_id: string;
  link_type: string;
  created_by: string;
  created_at: string;
}

/**
 * Entity link insert model
 */
export interface EntityLinkInsert {
  blueprint_id: string;
  source_type: EntityType;
  source_id: string;
  target_type: EntityType;
  target_id: string;
  link_type?: string;
}
