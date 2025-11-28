/**
 * Dashboard Domain Interfaces
 *
 * Interfaces for dashboard data visualization
 * Specification: docs/specs/setc/10-dashboard-module.setc.md
 *
 * @module features/blueprint/domain/interfaces/dashboard
 */

/**
 * Dashboard overview statistics
 */
export interface IDashboardOverview {
  task_completion_rate: number;
  tasks_in_progress: number;
  tasks_overdue: number;
  diaries_this_week: number;
  open_issues: number;
}

/**
 * Progress curve data point
 */
export interface IProgressDataPoint {
  date: string;
  progress: number;
}

/**
 * Milestone data point
 */
export interface IMilestonePoint {
  date: string;
  name: string;
}

/**
 * Progress data for S-curve visualization
 */
export interface IProgressData {
  planned: IProgressDataPoint[];
  actual: IProgressDataPoint[];
  milestones: IMilestonePoint[];
}

/**
 * Task distribution by dimension
 */
export interface ITaskDistributionItem {
  label: string;
  value: string;
  count: number;
}

/**
 * Task distribution data
 */
export interface ITaskDistribution {
  by_status: ITaskDistributionItem[];
  by_priority: ITaskDistributionItem[];
  by_assignee: ITaskDistributionItem[];
}

/**
 * Work hours data point
 */
export interface IWorkHoursDataPoint {
  date: string;
  hours: number;
}

/**
 * Work hours by entity
 */
export interface IWorkHoursByEntity {
  id: string;
  name: string;
  hours: number;
}

/**
 * Work hours statistics
 */
export interface IWorkHoursData {
  total_hours: number;
  by_date: IWorkHoursDataPoint[];
  by_task: IWorkHoursByEntity[];
  by_worker: IWorkHoursByEntity[];
}

/**
 * Date range for queries
 */
export interface IDashboardDateRange {
  start: string;
  end: string;
}

/**
 * Report generation options
 */
export interface IReportOptions {
  type: 'progress' | 'summary' | 'detailed';
  format: 'pdf' | 'excel';
  date_range: IDashboardDateRange;
}
