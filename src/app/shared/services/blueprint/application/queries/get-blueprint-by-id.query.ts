/**
 * Get Blueprint By ID Query
 * 根據 ID 取得藍圖查詢
 * 
 * Query for retrieving a blueprint by its ID.
 * 用於根據 ID 檢索藍圖的查詢。
 */
export class GetBlueprintByIdQuery {
  constructor(public readonly blueprintId: string) {}
}
