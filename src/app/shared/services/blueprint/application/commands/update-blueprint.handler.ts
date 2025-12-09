import { Injectable, inject } from '@angular/core';
import { UpdateBlueprintCommand } from './update-blueprint.command';
import { IBlueprintRepository } from '../../domain/repositories';
import { BLUEPRINT_REPOSITORY_TOKEN } from '../../infrastructure';
import { EventBusService } from '@core';
import { BlueprintAggregate } from '../../domain/aggregates';
import { LoggerService } from '@core';

/**
 * Update Blueprint Command Handler
 * 更新藍圖命令處理器
 * 
 * Handles updating of existing blueprints.
 * 處理現有藍圖的更新。
 */
@Injectable({ providedIn: 'root' })
export class UpdateBlueprintHandler {
  private readonly repository = inject<IBlueprintRepository>(BLUEPRINT_REPOSITORY_TOKEN);
  private readonly eventBus = inject(EventBusService);
  private readonly logger = inject(LoggerService);

  /**
   * Execute command
   * 執行命令
   */
  async execute(command: UpdateBlueprintCommand): Promise<void> {
    try {
      this.logger.info('[UpdateBlueprintHandler]', 'Updating blueprint', {
        id: command.blueprintId
      });

      // Load existing blueprint
      const existing = await this.repository.findById(command.blueprintId).toPromise();
      if (!existing) {
        throw new Error(`Blueprint not found: ${command.blueprintId}`);
      }

      // Reconstitute aggregate
      const aggregate = BlueprintAggregate.fromData(existing);

      // Apply updates (business rules validated here)
      aggregate.update({
        name: command.name,
        description: command.description,
        coverUrl: command.coverUrl,
        isPublic: command.isPublic,
        status: command.status,
        enabledModules: command.enabledModules,
        updatedBy: command.updatedBy
      });

      // Persist changes
      const updates = aggregate.toData();
      await this.repository.update(command.blueprintId, {
        name: updates.name,
        description: updates.description,
        coverUrl: updates.coverUrl,
        isPublic: updates.isPublic,
        status: updates.status,
        enabledModules: updates.enabledModules,
        updatedAt: updates.updatedAt
      });

      // Publish domain events
      const events = aggregate.getEvents();
      events.forEach(event => this.eventBus.publish(event));
      aggregate.clearEvents();

      this.logger.info('[UpdateBlueprintHandler]', 'Blueprint updated', {
        id: command.blueprintId
      });
    } catch (error) {
      this.logger.error('[UpdateBlueprintHandler]', 'Failed to update blueprint', error as Error);
      throw error;
    }
  }
}
