import { OwnerType } from '@core';
import { ModuleType } from '@core';

/**
 * Create Blueprint Command
 * 建立藍圖命令
 * 
 * Command for creating a new blueprint.
 * 用於建立新藍圖的命令。
 */
export class CreateBlueprintCommand {
  constructor(
    public readonly name: string,
    public readonly slug: string,
    public readonly ownerId: string,
    public readonly ownerType: OwnerType,
    public readonly createdBy: string,
    public readonly description?: string,
    public readonly coverUrl?: string,
    public readonly isPublic: boolean = false,
    public readonly enabledModules: ModuleType[] = []
  ) {}
}
