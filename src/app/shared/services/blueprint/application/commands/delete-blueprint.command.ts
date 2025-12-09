/**
 * Delete Blueprint Command
 * 刪除藍圖命令
 * 
 * Command for deleting a blueprint (soft delete).
 * 用於刪除藍圖的命令（軟刪除）。
 */
export class DeleteBlueprintCommand {
  constructor(
    public readonly blueprintId: string,
    public readonly deletedBy: string
  ) {}
}
