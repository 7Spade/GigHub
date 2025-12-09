import { Injectable, inject } from '@angular/core';
import { Blueprint } from '@core';
import { CreateBlueprintCommand } from './create-blueprint.command';
import { IBlueprintRepository } from '../../domain/repositories';
import { BLUEPRINT_REPOSITORY_TOKEN } from '../../infrastructure';
import { EventBusService } from '@core';
import { BlueprintAggregate } from '../../domain/aggregates';
import { LoggerService } from '@core';

/**
 * Create Blueprint Command Handler
 * 建立藍圖命令處理器
 * 
 * Handles the creation of new blueprints.
 * 處理新藍圖的建立。
 */
@Injectable({ providedIn: 'root' })
export class CreateBlueprintHandler {
  private readonly repository = inject<IBlueprintRepository>(BLUEPRINT_REPOSITORY_TOKEN);
  private readonly eventBus = inject(EventBusService);
  private readonly logger = inject(LoggerService);

  /**
   * Execute command
   * 執行命令
   */
  async execute(command: CreateBlueprintCommand): Promise<Blueprint> {
    try {
      this.logger.info('[CreateBlueprintHandler]', 'Creating blueprint', {
        name: command.name,
        slug: command.slug
      });

      // Create aggregate (business rules validated here)
      const aggregate = BlueprintAggregate.create({
        name: command.name,
        slug: command.slug,
        ownerId: command.ownerId,
        ownerType: command.ownerType,
        createdBy: command.createdBy,
        description: command.description,
        coverUrl: command.coverUrl,
        isPublic: command.isPublic,
        enabledModules: command.enabledModules
      });

      // Convert to plain data and persist
      const blueprintData = aggregate.toData();
      const created = await this.repository.create({
        name: blueprintData.name,
        slug: blueprintData.slug,
        ownerId: blueprintData.ownerId,
        ownerType: blueprintData.ownerType,
        description: blueprintData.description,
        coverUrl: blueprintData.coverUrl,
        isPublic: blueprintData.isPublic,
        enabledModules: blueprintData.enabledModules
      });

      // Publish domain events
      const events = aggregate.getEvents();
      events.forEach(event => this.eventBus.publish(event));
      aggregate.clearEvents();

      this.logger.info('[CreateBlueprintHandler]', 'Blueprint created', {
        id: created.id
      });

      return created;
    } catch (error) {
      this.logger.error('[CreateBlueprintHandler]', 'Failed to create blueprint', error as Error);
      throw error;
    }
  }
}
