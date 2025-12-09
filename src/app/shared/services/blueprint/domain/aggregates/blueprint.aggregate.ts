import { Blueprint, BlueprintStatus, OwnerType, ModuleType } from '@core';
import { AggregateRoot } from './aggregate-root.base';
import {
  BlueprintCreatedEvent,
  BlueprintUpdatedEvent,
  BlueprintDeletedEvent,
  BlueprintMemberAddedEvent,
  BlueprintModuleEnabledEvent,
  BlueprintModuleDisabledEvent
} from '../events';
import { BlueprintId, OwnerInfo, Slug } from '../value-objects';

/**
 * Blueprint Aggregate
 * 藍圖聚合
 * 
 * Domain aggregate for Blueprint entity.
 * Encapsulates business rules and generates domain events.
 * 
 * 藍圖實體的領域聚合。
 * 封裝業務規則並產生領域事件。
 */
export class BlueprintAggregate extends AggregateRoot {
  private constructor(
    private readonly _id: BlueprintId,
    private _name: string,
    private readonly _slug: Slug,
    private readonly _owner: OwnerInfo,
    private _description: string | undefined,
    private _coverUrl: string | undefined,
    private _isPublic: boolean,
    private _status: BlueprintStatus,
    private _enabledModules: ModuleType[],
    private readonly _createdBy: string,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
    private _deletedAt: Date | null = null
  ) {
    super();
  }

  /**
   * Create new Blueprint aggregate
   * 建立新的藍圖聚合
   */
  static create(params: {
    name: string;
    slug: string;
    ownerId: string;
    ownerType: OwnerType;
    createdBy: string;
    description?: string;
    coverUrl?: string;
    isPublic?: boolean;
    enabledModules?: ModuleType[];
  }): BlueprintAggregate {
    // Validate business rules
    if (!params.name || params.name.trim().length === 0) {
      throw new Error('Blueprint name cannot be empty');
    }

    if (params.name.length > 100) {
      throw new Error('Blueprint name cannot exceed 100 characters');
    }

    // Create value objects
    const id = BlueprintId.create();
    const slug = Slug.fromString(params.slug);
    const owner = OwnerInfo.create(params.ownerId, params.ownerType);

    const now = new Date();
    const aggregate = new BlueprintAggregate(
      id,
      params.name,
      slug,
      owner,
      params.description,
      params.coverUrl,
      params.isPublic ?? false,
      BlueprintStatus.ACTIVE,
      params.enabledModules ?? [],
      params.createdBy,
      now,
      now
    );

    // Generate domain event
    aggregate.addEvent({
      type: 'blueprint.created',
      aggregateId: id.toString(),
      blueprintId: id.toString(),
      name: params.name,
      slug: slug.toString(),
      ownerId: owner.getOwnerId(),
      ownerType: owner.getOwnerType(),
      occurredAt: now,
      userId: params.createdBy
    } as BlueprintCreatedEvent);

    return aggregate;
  }

  /**
   * Reconstitute aggregate from data
   * 從資料重建聚合
   */
  static fromData(data: Blueprint): BlueprintAggregate {
    const id = BlueprintId.fromString(data.id);
    const slug = Slug.fromString(data.slug);
    const owner = OwnerInfo.create(data.ownerId, data.ownerType);

    return new BlueprintAggregate(
      id,
      data.name,
      slug,
      owner,
      data.description,
      data.coverUrl,
      data.isPublic,
      data.status,
      data.enabledModules || [],
      data.createdBy,
      typeof data.createdAt === 'string' ? new Date(data.createdAt) : data.createdAt,
      typeof data.updatedAt === 'string' ? new Date(data.updatedAt) : data.updatedAt,
      data.deletedAt ? (typeof data.deletedAt === 'string' ? new Date(data.deletedAt) : data.deletedAt) : null
    );
  }

  /**
   * Update blueprint information
   * 更新藍圖資訊
   */
  update(params: {
    name?: string;
    description?: string;
    coverUrl?: string;
    isPublic?: boolean;
    status?: BlueprintStatus;
    enabledModules?: ModuleType[];
    updatedBy: string;
  }): void {
    const changes: Record<string, unknown> = {};

    if (params.name !== undefined) {
      if (!params.name || params.name.trim().length === 0) {
        throw new Error('Blueprint name cannot be empty');
      }
      if (params.name.length > 100) {
        throw new Error('Blueprint name cannot exceed 100 characters');
      }
      this._name = params.name;
      changes['name'] = params.name;
    }

    if (params.description !== undefined) {
      this._description = params.description;
      changes['description'] = params.description;
    }

    if (params.coverUrl !== undefined) {
      this._coverUrl = params.coverUrl;
      changes['coverUrl'] = params.coverUrl;
    }

    if (params.isPublic !== undefined) {
      this._isPublic = params.isPublic;
      changes['isPublic'] = params.isPublic;
    }

    if (params.status !== undefined) {
      this._status = params.status;
      changes['status'] = params.status;
    }

    if (params.enabledModules !== undefined) {
      this._enabledModules = params.enabledModules;
      changes['enabledModules'] = params.enabledModules;
    }

    this._updatedAt = new Date();
    changes['updatedAt'] = this._updatedAt;

    // Generate domain event
    this.addEvent({
      type: 'blueprint.updated',
      aggregateId: this._id.toString(),
      blueprintId: this._id.toString(),
      changes,
      occurredAt: this._updatedAt,
      userId: params.updatedBy
    } as BlueprintUpdatedEvent);
  }

  /**
   * Delete blueprint (soft delete)
   * 刪除藍圖（軟刪除）
   */
  delete(deletedBy: string): void {
    if (this._deletedAt) {
      throw new Error('Blueprint is already deleted');
    }

    this._deletedAt = new Date();
    this._status = BlueprintStatus.ARCHIVED;

    // Generate domain event
    this.addEvent({
      type: 'blueprint.deleted',
      aggregateId: this._id.toString(),
      blueprintId: this._id.toString(),
      occurredAt: this._deletedAt,
      userId: deletedBy
    } as BlueprintDeletedEvent);
  }

  /**
   * Enable a module
   * 啟用模組
   */
  enableModule(moduleType: ModuleType, userId: string): void {
    if (this._enabledModules.includes(moduleType)) {
      return; // Already enabled
    }

    this._enabledModules.push(moduleType);
    this._updatedAt = new Date();

    this.addEvent({
      type: 'blueprint.module.enabled',
      aggregateId: this._id.toString(),
      blueprintId: this._id.toString(),
      moduleType,
      occurredAt: this._updatedAt,
      userId
    } as BlueprintModuleEnabledEvent);
  }

  /**
   * Disable a module
   * 停用模組
   */
  disableModule(moduleType: ModuleType, userId: string): void {
    const index = this._enabledModules.indexOf(moduleType);
    if (index === -1) {
      return; // Already disabled
    }

    this._enabledModules.splice(index, 1);
    this._updatedAt = new Date();

    this.addEvent({
      type: 'blueprint.module.disabled',
      aggregateId: this._id.toString(),
      blueprintId: this._id.toString(),
      moduleType,
      occurredAt: this._updatedAt,
      userId
    } as BlueprintModuleDisabledEvent);
  }

  /**
   * Convert to plain data object
   * 轉換為純資料物件
   */
  toData(): Blueprint {
    return {
      id: this._id.toString(),
      name: this._name,
      slug: this._slug.toString(),
      ownerId: this._owner.getOwnerId(),
      ownerType: this._owner.getOwnerType(),
      description: this._description,
      coverUrl: this._coverUrl,
      isPublic: this._isPublic,
      status: this._status,
      enabledModules: [...this._enabledModules],
      createdBy: this._createdBy,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt
    };
  }

  // Getters
  get id(): string {
    return this._id.toString();
  }

  get name(): string {
    return this._name;
  }

  get slug(): string {
    return this._slug.toString();
  }

  get isDeleted(): boolean {
    return this._deletedAt !== null;
  }

  get status(): BlueprintStatus {
    return this._status;
  }
}
