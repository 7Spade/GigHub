import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Blueprint,
  BlueprintQueryOptions,
  CreateBlueprintRequest,
  OwnerType,
  UpdateBlueprintRequest
} from '@core';
import { BlueprintService } from '../blueprint.service';
import { EventBusService } from '@core';
import {
  BlueprintCreatedEvent,
  BlueprintUpdatedEvent,
  BlueprintDeletedEvent,
  BlueprintMemberAddedEvent
} from '../domain/events';

/**
 * Blueprint Facade Service
 * 藍圖門面服務
 * 
 * Provides a simplified, Signal-based interface for UI components.
 * Delegates to BlueprintService and publishes domain events.
 * 
 * 為 UI 元件提供簡化的、基於 Signal 的介面。
 * 委派給 BlueprintService 並發布領域事件。
 */
@Injectable({
  providedIn: 'root'
})
export class BlueprintFacade {
  private readonly blueprintService = inject(BlueprintService);
  private readonly eventBus = inject(EventBusService);

  // State signals (private writable, public readonly)
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _currentBlueprint = signal<Blueprint | null>(null);
  private readonly _blueprints = signal<Blueprint[]>([]);

  // Public computed signals (readonly)
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());
  readonly currentBlueprint = computed(() => this._currentBlueprint());
  readonly blueprints = computed(() => this._blueprints());
  readonly hasBlueprints = computed(() => this._blueprints().length > 0);

  /**
   * Get blueprint by ID
   * 根據 ID 取得藍圖
   */
  getById(id: string): Observable<Blueprint | null> {
    this._loading.set(true);
    this._error.set(null);
    
    const result$ = this.blueprintService.getById(id);
    
    result$.subscribe({
      next: (blueprint) => {
        this._currentBlueprint.set(blueprint);
        this._loading.set(false);
      },
      error: (error) => {
        this._error.set(error.message);
        this._loading.set(false);
      }
    });
    
    return result$;
  }

  /**
   * Get blueprints by owner
   * 根據擁有者取得藍圖
   */
  getByOwner(ownerType: OwnerType, ownerId: string): Observable<Blueprint[]> {
    this._loading.set(true);
    this._error.set(null);
    
    const result$ = this.blueprintService.getByOwner(ownerType, ownerId);
    
    result$.subscribe({
      next: (blueprints) => {
        this._blueprints.set(blueprints);
        this._loading.set(false);
      },
      error: (error) => {
        this._error.set(error.message);
        this._loading.set(false);
      }
    });
    
    return result$;
  }

  /**
   * Query blueprints with options
   * 使用選項查詢藍圖
   */
  query(options: BlueprintQueryOptions): Observable<Blueprint[]> {
    this._loading.set(true);
    this._error.set(null);
    
    const result$ = this.blueprintService.query(options);
    
    result$.subscribe({
      next: (blueprints) => {
        this._blueprints.set(blueprints);
        this._loading.set(false);
      },
      error: (error) => {
        this._error.set(error.message);
        this._loading.set(false);
      }
    });
    
    return result$;
  }

  /**
   * Create new blueprint
   * 建立新藍圖
   */
  async createBlueprint(request: CreateBlueprintRequest): Promise<Blueprint> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const blueprint = await this.blueprintService.create(request);
      this._currentBlueprint.set(blueprint);

      // Publish domain event
      const event: BlueprintCreatedEvent = {
        type: 'blueprint.created',
        aggregateId: blueprint.id,
        blueprintId: blueprint.id,
        name: blueprint.name,
        slug: blueprint.slug,
        ownerId: blueprint.ownerId,
        ownerType: blueprint.ownerType,
        occurredAt: new Date(),
        userId: blueprint.createdBy
      };
      this.eventBus.publish(event);

      return blueprint;
    } catch (err) {
      const error = err as Error;
      this._error.set(error.message);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Update blueprint
   * 更新藍圖
   */
  async updateBlueprint(id: string, updates: UpdateBlueprintRequest): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      await this.blueprintService.update(id, updates);

      // Update current blueprint if it's the one being updated
      const current = this._currentBlueprint();
      if (current?.id === id) {
        this._currentBlueprint.set({ ...current, ...updates });
      }

      // Publish domain event
      const event: BlueprintUpdatedEvent = {
        type: 'blueprint.updated',
        aggregateId: id,
        blueprintId: id,
        changes: updates,
        occurredAt: new Date()
      };
      this.eventBus.publish(event);
    } catch (err) {
      const error = err as Error;
      this._error.set(error.message);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Delete blueprint
   * 刪除藍圖
   */
  async deleteBlueprint(id: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      await this.blueprintService.delete(id);

      // Clear current blueprint if it's the one being deleted
      const current = this._currentBlueprint();
      if (current?.id === id) {
        this._currentBlueprint.set(null);
      }

      // Remove from blueprints list
      const blueprints = this._blueprints();
      this._blueprints.set(blueprints.filter(b => b.id !== id));

      // Publish domain event
      const event: BlueprintDeletedEvent = {
        type: 'blueprint.deleted',
        aggregateId: id,
        blueprintId: id,
        occurredAt: new Date()
      };
      this.eventBus.publish(event);
    } catch (err) {
      const error = err as Error;
      this._error.set(error.message);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Add member to blueprint
   * 將成員新增至藍圖
   */
  async addMember(
    blueprintId: string,
    member: Parameters<BlueprintService['addMember']>[1]
  ): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      await this.blueprintService.addMember(blueprintId, member);

      // Publish domain event
      const event: BlueprintMemberAddedEvent = {
        type: 'blueprint.member.added',
        aggregateId: blueprintId,
        blueprintId,
        memberId: '', // Will be set by repository
        accountId: member.accountId,
        role: member.role,
        occurredAt: new Date()
      };
      this.eventBus.publish(event);
    } catch (err) {
      const error = err as Error;
      this._error.set(error.message);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Clear error state
   * 清除錯誤狀態
   */
  clearError(): void {
    this._error.set(null);
  }

  /**
   * Clear current blueprint
   * 清除當前藍圖
   */
  clearCurrent(): void {
    this._currentBlueprint.set(null);
  }

  /**
   * Clear all state
   * 清除所有狀態
   */
  clearAll(): void {
    this._loading.set(false);
    this._error.set(null);
    this._currentBlueprint.set(null);
    this._blueprints.set([]);
  }
}
