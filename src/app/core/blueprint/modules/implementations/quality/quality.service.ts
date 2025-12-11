/**
 * Quality Service
 *
 * Basic prototype service for quality inspection management.
 * Provides state management using Angular Signals.
 *
 * @author GigHub Development Team
 * @date 2025-12-11
 */

import { Injectable, signal, computed } from '@angular/core';
import { QualityInspection, InspectionStatus } from './module.metadata';

@Injectable({ providedIn: 'root' })
export class QualityService {
  // State signals
  private readonly _inspections = signal<QualityInspection[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // Public readonly state
  readonly inspections = this._inspections.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed signals
  readonly pendingInspections = computed(() =>
    this._inspections().filter(i => i.status === InspectionStatus.PENDING)
  );

  readonly failedInspections = computed(() =>
    this._inspections().filter(i => i.status === InspectionStatus.FAILED)
  );

  readonly passedInspections = computed(() =>
    this._inspections().filter(i => i.status === InspectionStatus.PASSED)
  );

  readonly stats = computed(() => ({
    total: this._inspections().length,
    pending: this.pendingInspections().length,
    failed: this.failedInspections().length,
    passed: this.passedInspections().length
  }));

  /**
   * Load inspections for a blueprint
   * Note: This is a prototype - real implementation would use repository
   */
  async loadInspections(blueprintId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      // TODO: Replace with actual repository call
      // Simulate async loading
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock data for prototype
      const mockInspections: QualityInspection[] = [
        {
          id: '1',
          blueprint_id: blueprintId,
          title: '地基檢查',
          status: InspectionStatus.PASSED,
          inspector_id: 'user1',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: '2',
          blueprint_id: blueprintId,
          title: '鋼筋綁紮檢查',
          status: InspectionStatus.PENDING,
          inspector_id: 'user1',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      this._inspections.set(mockInspections);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this._error.set(message);
      throw err;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Create a new inspection
   * Note: This is a prototype - real implementation would use repository
   */
  async createInspection(inspection: Omit<QualityInspection, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    try {
      // TODO: Replace with actual repository call
      const newInspection: QualityInspection = {
        ...inspection,
        id: `inspection-${Date.now()}`,
        created_at: new Date(),
        updated_at: new Date()
      };

      this._inspections.update(inspections => [...inspections, newInspection]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this._error.set(message);
      throw err;
    }
  }

  /**
   * Clear all state
   */
  clearState(): void {
    this._inspections.set([]);
    this._loading.set(false);
    this._error.set(null);
  }
}
