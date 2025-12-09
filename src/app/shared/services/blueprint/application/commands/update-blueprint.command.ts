import { BlueprintStatus, ModuleType } from '@core';

/**
 * Update Blueprint Command
 * 更新藍圖命令
 * 
 * Command for updating an existing blueprint.
 * 用於更新現有藍圖的命令。
 */
export class UpdateBlueprintCommand {
  constructor(
    public readonly blueprintId: string,
    public readonly updatedBy: string,
    public readonly name?: string,
    public readonly description?: string,
    public readonly coverUrl?: string,
    public readonly isPublic?: boolean,
    public readonly status?: BlueprintStatus,
    public readonly enabledModules?: ModuleType[]
  ) {}
}
