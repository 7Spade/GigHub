import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Blueprint,
  BlueprintQueryOptions,
  CreateBlueprintRequest,
  UpdateBlueprintRequest,
  OwnerType
} from '@core';
import { BlueprintService } from '../blueprint.service';

/**
 * Blueprint Facade Service
 * 
 * Simplifies UI interaction with Blueprint domain using Angular Signals.
 * Provides reactive state management and delegates to BlueprintService.
 * 
 * Follows Facade pattern to hide complexity and provide clean API.
 * 
 * @example
 * ```typescript
 * @Component({ ... })
 * export class BlueprintListComponent {
 *   private facade = inject(BlueprintFacade);
 *   
 *   loading = this.facade.loading;
 *   error = this.facade.error;
 *   currentBlueprint = this.facade.currentBlueprint;
 *   
 *   async createBlueprint() {
 *     await this.facade.createBlueprint({ name: '...' });
 *   }
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class BlueprintFacade {
  private readonly blueprintService = inject(BlueprintService);

  // State signals
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _currentBlueprint = signal<Blueprint | null>(null);
  private readonly _blueprints = signal<Blueprint[]>([]);

  // Public computed signals (read-only)
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());
  readonly currentBlueprint = computed(() => this._currentBlueprint());
  readonly blueprints = computed(() => this._blueprints());
  readonly hasBlueprints = computed(() => this._blueprints().length > 0);
  readonly blueprintCount = computed(() => this._blueprints().length);

  /**
   * Get blueprint by ID
   */
  async getById(id: string): Promise<Blueprint | null> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const blueprint = await new Promise<Blueprint | null>((resolve, reject) => {
        this.blueprintService.getById(id).subscribe({
          next: value => resolve(value),
          error: err => reject(err)
        });
      });

      if (blueprint) {
        this._currentBlueprint.set(blueprint);
      }
      return blueprint;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load blueprint';
      this._error.set(message);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Get blueprints by owner
   */
  async getByOwner(ownerType: OwnerType, ownerId: string): Promise<Blueprint[]> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const blueprints = await new Promise<Blueprint[]>((resolve, reject) => {
        this.blueprintService.getByOwner(ownerType, ownerId).subscribe({
          next: value => resolve(value),
          error: err => reject(err)
        });
      });

      this._blueprints.set(blueprints);
      return blueprints;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load blueprints';
      this._error.set(message);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Query blueprints with options
   */
  async query(options: BlueprintQueryOptions): Promise<Blueprint[]> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const blueprints = await new Promise<Blueprint[]>((resolve, reject) => {
        this.blueprintService.query(options).subscribe({
          next: value => resolve(value),
          error: err => reject(err)
        });
      });

      this._blueprints.set(blueprints);
      return blueprints;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to query blueprints';
      this._error.set(message);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Create a new blueprint
   */
  async createBlueprint(request: CreateBlueprintRequest): Promise<Blueprint> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const blueprint = await this.blueprintService.create(request);
      this._currentBlueprint.set(blueprint);
      
      // Add to list if exists
      this._blueprints.update(list => [...list, blueprint]);
      
      return blueprint;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create blueprint';
      this._error.set(message);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Update an existing blueprint
   */
  async updateBlueprint(id: string, request: UpdateBlueprintRequest): Promise<Blueprint> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const blueprint = await this.blueprintService.update(id, request);
      this._currentBlueprint.set(blueprint);
      
      // Update in list if exists
      this._blueprints.update(list =>
        list.map(b => (b.id === id ? blueprint : b))
      );
      
      return blueprint;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update blueprint';
      this._error.set(message);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Delete a blueprint
   */
  async deleteBlueprint(id: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      await this.blueprintService.delete(id);
      
      // Clear current if matches
      if (this._currentBlueprint()?.id === id) {
        this._currentBlueprint.set(null);
      }
      
      // Remove from list
      this._blueprints.update(list => list.filter(b => b.id !== id));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete blueprint';
      this._error.set(message);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Clear error
   */
  clearError(): void {
    this._error.set(null);
  }

  /**
   * Clear current blueprint
   */
  clearCurrent(): void {
    this._currentBlueprint.set(null);
  }

  /**
   * Reset all state
   */
  reset(): void {
    this._loading.set(false);
    this._error.set(null);
    this._currentBlueprint.set(null);
    this._blueprints.set([]);
  }
}
