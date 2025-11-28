/**
 * Diary Domain Interfaces
 *
 * Interfaces for construction diary (施工日誌) domain entities
 * Specification: docs/specs/setc/06-diary-module.setc.md
 *
 * @module features/blueprint/domain/interfaces/diary
 */

/**
 * Weather condition options for diary entries
 */
export type IDiaryWeatherType = 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy' | 'foggy';

/**
 * Diary status lifecycle
 */
export type IDiaryStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

/**
 * Diary filter options interface
 */
export interface IDiaryFilters {
  status?: IDiaryStatus[];
  weather?: IDiaryWeatherType[];
  start_date?: string;
  end_date?: string;
  created_by?: string;
}

/**
 * Diary statistics interface
 */
export interface IDiaryStats {
  total: number;
  by_status: Record<IDiaryStatus, number>;
  total_work_hours: number;
  total_worker_count: number;
}

/**
 * Diary task relationship filter
 */
export interface IDiaryTaskFilter {
  diary_id?: string;
  task_id?: string;
}

/**
 * Create diary request interface
 */
export interface ICreateDiaryRequest {
  blueprint_id: string;
  work_date: string;
  work_summary?: string;
  work_hours?: number;
  worker_count?: number;
  weather?: IDiaryWeatherType;
}

/**
 * Update diary request interface
 */
export interface IUpdateDiaryRequest {
  work_summary?: string;
  work_hours?: number;
  worker_count?: number;
  weather?: IDiaryWeatherType;
  status?: IDiaryStatus;
  rejection_reason?: string;
}
