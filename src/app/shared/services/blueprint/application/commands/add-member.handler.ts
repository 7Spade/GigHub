import { Injectable, inject } from '@angular/core';
import { AddMemberCommand } from './add-member.command';
import { BlueprintMemberRepository } from '../../blueprint-member.repository';
import { EventBusService } from '@core';
import { LoggerService } from '@core';
import { BlueprintMemberAddedEvent } from '../../domain/events';

/**
 * Add Member Command Handler
 * 新增成員命令處理器
 * 
 * Handles adding members to blueprints.
 * 處理將成員新增至藍圖。
 */
@Injectable({ providedIn: 'root' })
export class AddMemberHandler {
  private readonly memberRepository = inject(BlueprintMemberRepository);
  private readonly eventBus = inject(EventBusService);
  private readonly logger = inject(LoggerService);

  /**
   * Execute command
   * 執行命令
   */
  async execute(command: AddMemberCommand): Promise<void> {
    try {
      this.logger.info('[AddMemberHandler]', 'Adding member to blueprint', {
        blueprintId: command.blueprintId,
        accountId: command.accountId
      });

      // Add member (repository validates uniqueness)
      const member = await this.memberRepository.addMember(command.blueprintId, {
        accountId: command.accountId,
        blueprintId: command.blueprintId,
        role: command.role,
        isExternal: command.isExternal,
        grantedBy: command.grantedBy
      });

      // Publish domain event
      const event: BlueprintMemberAddedEvent = {
        type: 'blueprint.member.added',
        aggregateId: command.blueprintId,
        blueprintId: command.blueprintId,
        memberId: member.id,
        accountId: command.accountId,
        role: command.role,
        occurredAt: new Date(),
        userId: command.grantedBy
      };
      this.eventBus.publish(event);

      this.logger.info('[AddMemberHandler]', 'Member added to blueprint', {
        blueprintId: command.blueprintId,
        memberId: member.id
      });
    } catch (error) {
      this.logger.error('[AddMemberHandler]', 'Failed to add member', error as Error);
      throw error;
    }
  }
}
