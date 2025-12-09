import { BlueprintRole } from '@core';

/**
 * Add Member Command
 * 新增成員命令
 * 
 * Command for adding a member to a blueprint.
 * 用於將成員新增至藍圖的命令。
 */
export class AddMemberCommand {
  constructor(
    public readonly blueprintId: string,
    public readonly accountId: string,
    public readonly role: BlueprintRole,
    public readonly grantedBy: string,
    public readonly isExternal: boolean = false
  ) {}
}
