/**
 * Activity Store
 *
 * Signal-based state management for activity tracking
 *
 * @module features/blueprint/data-access/stores/activity.store
 */

import { Injectable, computed, signal } from '@angular/core';

import { Activity, EntityType, EventType } from '../../domain/models/activity.models';

/**
 * Activity filters interface
 */
export interface ActivityFilters {
  entityTypes?: EntityType[];
  eventTypes?: EventType[];
  actorId?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Activity Store
 *
 * Manages activity timeline state
 */
@Injectable({ providedIn: 'root' })
export class ActivityStore {
  // Private state signals
  private readonly _activities = signal<Activity[]>([]);
  private readonly _filters = signal<ActivityFilters>({});
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // Public readonly state
  readonly activities = this._activities.asReadonly();
  readonly filters = this._filters.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed signals
  readonly filteredActivities = computed(() => {
    const activities = this._activities();
    const filters = this._filters();

    return activities.filter(activity => {
      if (filters.entityTypes?.length) {
        if (!filters.entityTypes.includes(activity.entity_type)) return false;
      }
      if (filters.eventTypes?.length) {
        if (!filters.eventTypes.includes(activity.event_type)) return false;
      }
      if (filters.actorId) {
        if (activity.actor_id !== filters.actorId) return false;
      }
      if (filters.startDate) {
        if (activity.created_at < filters.startDate) return false;
      }
      if (filters.endDate) {
        if (activity.created_at > filters.endDate) return false;
      }
      return true;
    });
  });

  readonly activitiesByDate = computed(() => {
    const activities = this.filteredActivities();
    const grouped = new Map<string, Activity[]>();

    for (const activity of activities) {
      const date = activity.created_at.split('T')[0];
      const existing = grouped.get(date) || [];
      grouped.set(date, [...existing, activity]);
    }

    return Array.from(grouped.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, items]) => ({ date, activities: items }));
  });

  readonly statistics = computed(() => {
    const activities = this._activities();
    return {
      total: activities.length,
      byEntityType: activities.reduce((acc, a) => {
        acc[a.entity_type] = (acc[a.entity_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byEventType: activities.reduce((acc, a) => {
        acc[a.event_type] = (acc[a.event_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  });

  /**
   * Set activities (loaded from repository)
   */
  setActivities(activities: Activity[]): void {
    this._activities.set(activities);
  }

  /**
   * Add a new activity
   */
  addActivity(activity: Activity): void {
    this._activities.update(activities => [activity, ...activities]);
  }

  /**
   * Set filters
   */
  setFilters(filters: ActivityFilters): void {
    this._filters.set(filters);
  }

  /**
   * Clear filters
   */
  clearFilters(): void {
    this._filters.set({});
  }

  /**
   * Set loading state
   */
  setLoading(loading: boolean): void {
    this._loading.set(loading);
  }

  /**
   * Set error state
   */
  setError(error: string | null): void {
    this._error.set(error);
  }

  /**
   * Reset store state
   */
  reset(): void {
    this._activities.set([]);
    this._filters.set({});
    this._loading.set(false);
    this._error.set(null);
  }
}
