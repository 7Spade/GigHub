import { Injectable, inject } from '@angular/core';
import { Blueprint } from '@core';
import { ListBlueprintsQuery } from './list-blueprints.query';
import { IBlueprintRepository } from '../../domain/repositories';
import { BLUEPRINT_REPOSITORY_TOKEN } from '../../infrastructure';
import { LoggerService } from '@core';

/**
 * List Blueprints Query Handler
 * 列出藍圖查詢處理器
 * 
 * Handles retrieving a list of blueprints with filters.
 * 處理使用篩選器檢索藍圖列表。
 */
@Injectable({ providedIn: 'root' })
export class ListBlueprintsHandler {
  private readonly repository = inject<IBlueprintRepository>(BLUEPRINT_REPOSITORY_TOKEN);
  private readonly logger = inject(LoggerService);

  /**
   * Execute query
   * 執行查詢
   */
  async execute(query: ListBlueprintsQuery): Promise<Blueprint[]> {
    try {
      this.logger.debug('[ListBlueprintsHandler]', 'Listing blueprints', {
        ownerId: query.ownerId,
        ownerType: query.ownerType
      });

      const blueprints = await this.repository.findWithOptions({
        ownerId: query.ownerId,
        ownerType: query.ownerType,
        status: query.status,
        isPublic: query.isPublic,
        includeDeleted: query.includeDeleted
      }).toPromise();

      return blueprints || [];
    } catch (error) {
      this.logger.error('[ListBlueprintsHandler]', 'Failed to list blueprints', error as Error);
      throw error;
    }
  }
}
