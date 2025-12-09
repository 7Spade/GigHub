import { OwnerType, BlueprintStatus } from '@core';

/**
 * List Blueprints Query
 * 列出藍圖查詢
 * 
 * Query for listing blueprints with optional filters.
 * 用於列出藍圖的查詢，支援可選篩選器。
 */
export class ListBlueprintsQuery {
  constructor(
    public readonly ownerId?: string,
    public readonly ownerType?: OwnerType,
    public readonly status?: BlueprintStatus,
    public readonly isPublic?: boolean,
    public readonly includeDeleted: boolean = false
  ) {}
}
