import { Injectable, inject } from '@angular/core';
import { Blueprint, BlueprintQueryOptions, CreateBlueprintRequest, OwnerType, UpdateBlueprintRequest, LoggerService } from '@core';
import { BlueprintMemberRepository, BlueprintRepository } from '@core/blueprint/repositories';
import { Observable } from 'rxjs';
import {
  AuditLogsService,
  AuditEventType,
  AuditCategory,
  AuditSeverity,
  ActorType,
  AuditStatus
} from '@core/blueprint/modules/implementations/audit-logs';

import { BlueprintCreateSchema, BlueprintUpdateSchema } from './blueprint-validation-schemas';
import { ValidationService } from './validation.service';

@Injectable({
  providedIn: 'root'
})
export class BlueprintService {
  private readonly repository = inject(BlueprintRepository);
  private readonly memberRepository = inject(BlueprintMemberRepository);
  private readonly logger = inject(LoggerService);
  private readonly validator = inject(ValidationService);
  private readonly auditService = inject(AuditLogsService);

  getById(id: string): Observable<Blueprint | null> {
    return this.repository.findById(id);
  }

  getByOwner(ownerType: OwnerType, ownerId: string): Observable<Blueprint[]> {
    return this.repository.findByOwner(ownerType, ownerId);
  }

  query(options: BlueprintQueryOptions): Observable<Blueprint[]> {
    return this.repository.findWithOptions(options);
  }

  async create(request: CreateBlueprintRequest): Promise<Blueprint> {
    // Validate request
    this.validator.validateOrThrow(request, BlueprintCreateSchema, 'blueprint');

    try {
      const blueprint = await this.repository.create(request);
      this.logger.info('[BlueprintService]', `Blueprint created ${blueprint.id}`);
      
      // Record audit log
      try {
        await this.auditService.recordLog({
          blueprintId: blueprint.id,
          eventType: AuditEventType.BLUEPRINT_CREATED,
          category: AuditCategory.BLUEPRINT,
          severity: AuditSeverity.INFO,
          actorId: request.ownerId,
          actorType: ActorType.USER,
          resourceType: 'blueprint',
          resourceId: blueprint.id,
          action: '建立藍圖',
          message: `藍圖 "${blueprint.name}" 已建立`,
          status: AuditStatus.SUCCESS
        });
      } catch (auditError) {
        this.logger.error('[BlueprintService]', 'Failed to record audit log for blueprint creation', auditError as Error);
        // Don't fail the operation if audit logging fails
      }
      
      return blueprint;
    } catch (error) {
      this.logger.error('[BlueprintService]', 'Failed to create blueprint', error as Error);
      throw error;
    }
  }

  async update(id: string, updates: UpdateBlueprintRequest): Promise<void> {
    // Validate updates
    this.validator.validateOrThrow(updates, BlueprintUpdateSchema, 'blueprint');

    try {
      await this.repository.update(id, updates);
      this.logger.info('[BlueprintService]', `Blueprint updated ${id}`);
      
      // Record audit log
      try {
        await this.auditService.recordLog({
          blueprintId: id,
          eventType: AuditEventType.BLUEPRINT_UPDATED,
          category: AuditCategory.BLUEPRINT,
          severity: AuditSeverity.INFO,
          actorId: 'system', // TODO: Get from auth service
          actorType: ActorType.USER,
          resourceType: 'blueprint',
          resourceId: id,
          action: '更新藍圖',
          message: `藍圖已更新`,
          status: AuditStatus.SUCCESS
        });
      } catch (auditError) {
        this.logger.error('[BlueprintService]', 'Failed to record audit log for blueprint update', auditError as Error);
      }
    } catch (error) {
      this.logger.error('[BlueprintService]', 'Failed to update blueprint', error as Error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.repository.delete(id);
      this.logger.info('[BlueprintService]', `Blueprint deleted ${id}`);
    } catch (error) {
      this.logger.error('[BlueprintService]', 'Failed to delete blueprint', error as Error);
      throw error;
    }
  }

  async addMember(blueprintId: string, member: Parameters<BlueprintMemberRepository['addMember']>[1]): Promise<void> {
    try {
      await this.memberRepository.addMember(blueprintId, member);
      this.logger.info('[BlueprintService]', `Member added to ${blueprintId}`);
    } catch (error) {
      this.logger.error('[BlueprintService]', 'Failed to add member', error as Error);
      throw error;
    }
  }
}
