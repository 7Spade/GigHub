import { Injectable, inject } from '@angular/core';
import { Blueprint } from '@core';
import { GetBlueprintByIdQuery } from './get-blueprint-by-id.query';
import { IBlueprintRepository } from '../../domain/repositories';
import { BLUEPRINT_REPOSITORY_TOKEN } from '../../infrastructure';
import { LoggerService } from '@core';

/**
 * Get Blueprint By ID Query Handler
 * 根據 ID 取得藍圖查詢處理器
 * 
 * Handles retrieving a single blueprint by ID.
 * 處理根據 ID 檢索單個藍圖。
 */
@Injectable({ providedIn: 'root' })
export class GetBlueprintByIdHandler {
  private readonly repository = inject<IBlueprintRepository>(BLUEPRINT_REPOSITORY_TOKEN);
  private readonly logger = inject(LoggerService);

  /**
   * Execute query
   * 執行查詢
   */
  async execute(query: GetBlueprintByIdQuery): Promise<Blueprint | null> {
    try {
      this.logger.debug('[GetBlueprintByIdHandler]', 'Getting blueprint by ID', {
        id: query.blueprintId
      });

      const blueprint = await this.repository.findById(query.blueprintId).toPromise();

      return blueprint;
    } catch (error) {
      this.logger.error('[GetBlueprintByIdHandler]', 'Failed to get blueprint', error as Error);
      throw error;
    }
  }
}
