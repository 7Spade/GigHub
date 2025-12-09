import { Injectable, inject } from '@angular/core';
import { DeleteBlueprintCommand } from './delete-blueprint.command';
import { IBlueprintRepository } from '../../domain/repositories';
import { BLUEPRINT_REPOSITORY_TOKEN } from '../../infrastructure';
import { EventBusService } from '@core';
import { BlueprintAggregate } from '../../domain/aggregates';
import { LoggerService } from '@core';

/**
 * Delete Blueprint Command Handler
 * 刪除藍圖命令處理器
 * 
 * Handles soft deletion of blueprints.
 * 處理藍圖的軟刪除。
 */
@Injectable({ providedIn: 'root' })
export class DeleteBlueprintHandler {
  private readonly repository = inject<IBlueprintRepository>(BLUEPRINT_REPOSITORY_TOKEN);
  private readonly eventBus = inject(EventBusService);
  private readonly logger = inject(LoggerService);

  /**
   * Execute command
   * 執行命令
   */
  async execute(command: DeleteBlueprintCommand): Promise<void> {
    try {
      this.logger.info('[DeleteBlueprintHandler]', 'Deleting blueprint', {
        id: command.blueprintId
      });

      // Load existing blueprint
      const existing = await this.repository.findById(command.blueprintId).toPromise();
      if (!existing) {
        throw new Error(`Blueprint not found: ${command.blueprintId}`);
      }

      // Reconstitute aggregate
      const aggregate = BlueprintAggregate.fromData(existing);

      // Apply deletion (business rules validated here)
      aggregate.delete(command.deletedBy);

      // Persist changes (soft delete)
      await this.repository.delete(command.blueprintId);

      // Publish domain events
      const events = aggregate.getEvents();
      events.forEach(event => this.eventBus.publish(event));
      aggregate.clearEvents();

      this.logger.info('[DeleteBlueprintHandler]', 'Blueprint deleted', {
        id: command.blueprintId
      });
    } catch (error) {
      this.logger.error('[DeleteBlueprintHandler]', 'Failed to delete blueprint', error as Error);
      throw error;
    }
  }
}
