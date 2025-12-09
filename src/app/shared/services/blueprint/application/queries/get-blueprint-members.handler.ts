import { Injectable, inject } from '@angular/core';
import { BlueprintMember } from '@core';
import { GetBlueprintMembersQuery } from './get-blueprint-members.query';
import { IBlueprintMemberRepository } from '../../domain/repositories';
import { BLUEPRINT_MEMBER_REPOSITORY_TOKEN } from '../../infrastructure';
import { LoggerService } from '@core';

/**
 * Get Blueprint Members Query Handler
 * 取得藍圖成員查詢處理器
 * 
 * Handles retrieving all members of a blueprint.
 * 處理檢索藍圖的所有成員。
 */
@Injectable({ providedIn: 'root' })
export class GetBlueprintMembersHandler {
  private readonly memberRepository = inject<IBlueprintMemberRepository>(BLUEPRINT_MEMBER_REPOSITORY_TOKEN);
  private readonly logger = inject(LoggerService);

  /**
   * Execute query
   * 執行查詢
   */
  async execute(query: GetBlueprintMembersQuery): Promise<BlueprintMember[]> {
    try {
      this.logger.debug('[GetBlueprintMembersHandler]', 'Getting blueprint members', {
        blueprintId: query.blueprintId
      });

      const members = await this.memberRepository.findByBlueprint(query.blueprintId).toPromise();

      return members || [];
    } catch (error) {
      this.logger.error('[GetBlueprintMembersHandler]', 'Failed to get members', error as Error);
      throw error;
    }
  }
}
