import { Injectable, inject, signal, computed } from '@angular/core';
import { Blueprint, BlueprintMember, BlueprintRole, BlueprintStatus, OwnerType, ModuleType } from '@core';
import {
  CreateBlueprintHandler,
  UpdateBlueprintHandler,
  DeleteBlueprintHandler,
  AddMemberHandler,
  CreateBlueprintCommand,
  UpdateBlueprintCommand,
  DeleteBlueprintCommand,
  AddMemberCommand
} from './commands';
import {
  GetBlueprintByIdHandler,
  ListBlueprintsHandler,
  GetBlueprintMembersHandler,
  GetBlueprintByIdQuery,
  ListBlueprintsQuery,
  GetBlueprintMembersQuery
} from './queries';

/**
 * Blueprint Facade Service
 * 藍圖門面服務
 * 
 * Provides a simplified, Signal-based interface for UI components.
 * Routes operations to CQRS command and query handlers.
 * 
 * 為 UI 元件提供簡化的、基於 Signal 的介面。
 * 將操作路由到 CQRS 命令和查詢處理器。
 */
@Injectable({
  providedIn: 'root'
})
export class BlueprintFacade {
  // Command handlers
  private readonly createHandler = inject(CreateBlueprintHandler);
  private readonly updateHandler = inject(UpdateBlueprintHandler);
  private readonly deleteHandler = inject(DeleteBlueprintHandler);
  private readonly addMemberHandler = inject(AddMemberHandler);

  // Query handlers
  private readonly getByIdHandler = inject(GetBlueprintByIdHandler);
  private readonly listHandler = inject(ListBlueprintsHandler);
  private readonly getMembersHandler = inject(GetBlueprintMembersHandler);

  // State signals (private writable, public readonly)
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _currentBlueprint = signal<Blueprint | null>(null);
  private readonly _blueprints = signal<Blueprint[]>([]);
  private readonly _members = signal<BlueprintMember[]>([]);

  // Public computed signals (readonly)
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());
  readonly currentBlueprint = computed(() => this._currentBlueprint());
  readonly blueprints = computed(() => this._blueprints());
  readonly members = computed(() => this._members());
  readonly hasBlueprints = computed(() => this._blueprints().length > 0);

  /**
   * Get blueprint by ID
   * 根據 ID 取得藍圖
   */
  async getById(id: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const query = new GetBlueprintByIdQuery(id);
      const blueprint = await this.getByIdHandler.execute(query);
      this._currentBlueprint.set(blueprint);
    } catch (err) {
      const error = err as Error;
      this._error.set(error.message);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Get blueprints by owner
   * 根據擁有者取得藍圖
   */
  async getByOwner(ownerType: OwnerType, ownerId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const query = new ListBlueprintsQuery(ownerId, ownerType);
      const blueprints = await this.listHandler.execute(query);
      this._blueprints.set(blueprints);
    } catch (err) {
      const error = err as Error;
      this._error.set(error.message);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * List blueprints with optional filters
   * 使用可選篩選器列出藍圖
   */
  async listBlueprints(params?: {
    ownerId?: string;
    ownerType?: OwnerType;
    status?: BlueprintStatus;
    isPublic?: boolean;
    includeDeleted?: boolean;
  }): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const query = new ListBlueprintsQuery(
        params?.ownerId,
        params?.ownerType,
        params?.status,
        params?.isPublic,
        params?.includeDeleted ?? false
      );
      const blueprints = await this.listHandler.execute(query);
      this._blueprints.set(blueprints);
    } catch (err) {
      const error = err as Error;
      this._error.set(error.message);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Get blueprint members
   * 取得藍圖成員
   */
  async getMembers(blueprintId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const query = new GetBlueprintMembersQuery(blueprintId);
      const members = await this.getMembersHandler.execute(query);
      this._members.set(members);
    } catch (err) {
      const error = err as Error;
      this._error.set(error.message);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Create new blueprint
   * 建立新藍圖
   */
  async createBlueprint(params: {
    name: string;
    slug: string;
    ownerId: string;
    ownerType: OwnerType;
    createdBy: string;
    description?: string;
    coverUrl?: string;
    isPublic?: boolean;
    enabledModules?: ModuleType[];
  }): Promise<Blueprint> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const command = new CreateBlueprintCommand(
        params.name,
        params.slug,
        params.ownerId,
        params.ownerType,
        params.createdBy,
        params.description,
        params.coverUrl,
        params.isPublic ?? false,
        params.enabledModules ?? []
      );

      const blueprint = await this.createHandler.execute(command);
      this._currentBlueprint.set(blueprint);

      // Add to blueprints list if it matches current filter
      const blueprints = this._blueprints();
      this._blueprints.set([...blueprints, blueprint]);

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
  async updateBlueprint(params: {
    blueprintId: string;
    updatedBy: string;
    name?: string;
    description?: string;
    coverUrl?: string;
    isPublic?: boolean;
    status?: BlueprintStatus;
    enabledModules?: ModuleType[];
  }): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const command = new UpdateBlueprintCommand(
        params.blueprintId,
        params.updatedBy,
        params.name,
        params.description,
        params.coverUrl,
        params.isPublic,
        params.status,
        params.enabledModules
      );

      await this.updateHandler.execute(command);

      // Update current blueprint if it's the one being updated
      const current = this._currentBlueprint();
      if (current?.id === params.blueprintId) {
        // Reload the blueprint to get updated data
        await this.getById(params.blueprintId);
      }

      // Update in blueprints list
      const blueprints = this._blueprints();
      const index = blueprints.findIndex(b => b.id === params.blueprintId);
      if (index !== -1 && current) {
        const updated = [...blueprints];
        updated[index] = { ...updated[index], ...params };
        this._blueprints.set(updated);
      }
    } catch (err) {
      const error = err as Error;
      this._error.set(error.message);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Delete blueprint (soft delete)
   * 刪除藍圖（軟刪除）
   */
  async deleteBlueprint(blueprintId: string, deletedBy: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const command = new DeleteBlueprintCommand(blueprintId, deletedBy);
      await this.deleteHandler.execute(command);

      // Clear current blueprint if it's the one being deleted
      const current = this._currentBlueprint();
      if (current?.id === blueprintId) {
        this._currentBlueprint.set(null);
      }

      // Remove from blueprints list
      const blueprints = this._blueprints();
      this._blueprints.set(blueprints.filter(b => b.id !== blueprintId));
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
  async addMember(params: {
    blueprintId: string;
    accountId: string;
    role: BlueprintRole;
    grantedBy: string;
    isExternal?: boolean;
  }): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const command = new AddMemberCommand(
        params.blueprintId,
        params.accountId,
        params.role,
        params.grantedBy,
        params.isExternal ?? false
      );

      await this.addMemberHandler.execute(command);

      // Reload members if we're viewing this blueprint
      const current = this._currentBlueprint();
      if (current?.id === params.blueprintId) {
        await this.getMembers(params.blueprintId);
      }
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
    this._members.set([]);
  }
}
