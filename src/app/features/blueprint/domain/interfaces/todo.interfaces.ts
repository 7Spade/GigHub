/**
 * Todo Domain Interfaces
 *
 * Interfaces for personal todo/workbench view
 * Specification: docs/specs/setc/07-todo-module.setc.md
 *
 * @module features/blueprint/domain/interfaces/todo
 */

import { TaskStatusEnum, TaskPriorityEnum } from '../enums';

/**
 * Todo query filters interface
 */
export interface ITodoFilters {
  status?: TaskStatusEnum[];
  priority?: TaskPriorityEnum[];
  blueprint_id?: string;
  due_before?: string;
  due_after?: string;
}

/**
 * Todo statistics interface
 */
export interface ITodoStats {
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
  overdue: number;
  due_today: number;
  due_this_week: number;
}

/**
 * Todo sort options
 */
export type ITodoSortBy = 'priority' | 'due_date' | 'updated_at' | 'created_at';

/**
 * Sort direction
 */
export type ISortDirection = 'asc' | 'desc';

/**
 * Todo sort configuration interface
 */
export interface ITodoSortConfig {
  sortBy: ITodoSortBy;
  direction: ISortDirection;
}
