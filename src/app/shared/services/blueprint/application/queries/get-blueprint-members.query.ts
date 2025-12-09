/**
 * Get Blueprint Members Query
 * 取得藍圖成員查詢
 * 
 * Query for retrieving all members of a blueprint.
 * 用於檢索藍圖所有成員的查詢。
 */
export class GetBlueprintMembersQuery {
  constructor(public readonly blueprintId: string) {}
}
