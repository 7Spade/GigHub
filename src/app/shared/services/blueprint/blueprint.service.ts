import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Blueprint,
  BlueprintQueryOptions,
  CreateBlueprintRequest,
  OwnerType,
  UpdateBlueprintRequest,
  LoggerService
} from '@core';
import { BlueprintRepository } from './blueprint.repository';
import { BlueprintMemberRepository } from './blueprint-member.repository';
import { ValidationService } from '../validation/validation.service';
import { BlueprintCreateSchema, BlueprintUpdateSchema } from '../validation/blueprint-validation-schemas';

@Injectable({
  providedIn: 'root'
})
export class BlueprintService {
  private readonly repository = inject(BlueprintRepository);
  private readonly memberRepository = inject(BlueprintMemberRepository);
  private readonly logger = inject(LoggerService);
  private readonly validator = inject(ValidationService);

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

  async addMember(
    blueprintId: string,
    member: Parameters<BlueprintMemberRepository['addMember']>[1]
  ): Promise<void> {
    try {
      await this.memberRepository.addMember(blueprintId, member);
      this.logger.info('[BlueprintService]', `Member added to ${blueprintId}`);
    } catch (error) {
      this.logger.error('[BlueprintService]', 'Failed to add member', error as Error);
      throw error;
    }
  }
}

