/**
 * Integration Domain Interfaces
 *
 * Interfaces for module integration (events, search, activities)
 * Specification: docs/specs/setc/11-module-integration.setc.md
 *
 * @module features/blueprint/domain/interfaces/integration
 */

/**
 * Domain event types
 */
export type IEventType =
  | 'task.created' | 'task.updated' | 'task.deleted' | 'task.status_changed'
  | 'task.acceptance.submitted' | 'task.acceptance.approved' | 'task.acceptance.rejected'
  | 'diary.created' | 'diary.submitted' | 'diary.approved' | 'diary.rejected'
  | 'file.uploaded' | 'file.deleted' | 'file.shared'
  | 'link.created' | 'link.deleted';

/**
 * Entity types for activities and links
 */
export type IEntityType = 'task' | 'diary' | 'file' | 'link';

/**
 * Domain event interface
 */
export interface IDomainEvent {
  event_type: IEventType;
  blueprint_id: string;
  entity_type: IEntityType;
  entity_id: string;
  actor_id: string;
  payload: Record<string, unknown>;
  occurred_at: string;
}

/**
 * Activity record interface
 */
export interface IActivity {
  id: string;
  blueprint_id: string;
  event_type: IEventType;
  entity_type: IEntityType;
  entity_id: string;
  entity_name: string | null;
  actor_id: string;
  changes: Record<string, unknown> | null;
  created_at: string;
}

/**
 * Entity link interface
 */
export interface IEntityLink {
  id: string;
  blueprint_id: string;
  source_type: IEntityType;
  source_id: string;
  target_type: IEntityType;
  target_id: string;
  link_type: string;
  created_by: string;
  created_at: string;
}

/**
 * Search result interface
 */
export interface IIntegrationSearchResult {
  type: IEntityType;
  id: string;
  title: string;
  snippet: string;
  score: number;
  metadata: Record<string, unknown>;
}

/**
 * Search response
 */
export interface ISearchResponse {
  results: IIntegrationSearchResult[];
  total: number;
  facets: ISearchFacet[];
}

/**
 * Search facet for filtering
 */
export interface ISearchFacet {
  type: IEntityType;
  count: number;
}

/**
 * Activity filters
 */
export interface IActivityFilters {
  event_types?: IEventType[];
  entity_types?: IEntityType[];
  actor_id?: string;
  start_date?: string;
  end_date?: string;
}

/**
 * Create entity link request interface
 */
export interface ICreateEntityLinkRequest {
  blueprint_id: string;
  source_type: IEntityType;
  source_id: string;
  target_type: IEntityType;
  target_id: string;
  link_type?: string;
}
