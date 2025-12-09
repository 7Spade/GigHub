import { Observable } from 'rxjs';
import { Blueprint, BlueprintQueryOptions, BlueprintStatus, OwnerType } from '@core';

/**
 * Blueprint Repository Interface
 * 藍圖倉儲介面
 * 
 * Defines the contract for blueprint data persistence operations.
 * Implementations can use Firestore, Supabase, or other backends.
 * 
 * 定義藍圖資料持久化操作的契約。
 * 實作可以使用 Firestore、Supabase 或其他後端。
 */
export interface IBlueprintRepository {
  /**
   * Find blueprint by ID
   * 根據 ID 查找藍圖
   */
  findById(id: string): Observable<Blueprint | null>;

  /**
   * Find blueprints by owner
   * 根據擁有者查找藍圖
   */
  findByOwner(
    ownerType: OwnerType,
    ownerId: string,
    options?: { limit?: number }
  ): Observable<Blueprint[]>;

  /**
   * Query blueprints with advanced filters
   * 使用進階篩選查詢藍圖
   */
  query(options: BlueprintQueryOptions): Observable<Blueprint[]>;

  /**
   * Create new blueprint
   * 建立新藍圖
   */
  create(blueprint: Omit<Blueprint, 'id'>): Promise<Blueprint>;

  /**
   * Update blueprint
   * 更新藍圖
   */
  update(id: string, data: Partial<Blueprint>): Promise<void>;

  /**
   * Delete blueprint (soft delete)
   * 刪除藍圖（軟刪除）
   */
  delete(id: string): Promise<void>;

  /**
   * Check if blueprint exists
   * 檢查藍圖是否存在
   */
  exists(id: string): Promise<boolean>;

  /**
   * Get blueprint count by owner
   * 取得擁有者的藍圖數量
   */
  countByOwner(ownerType: OwnerType, ownerId: string): Promise<number>;
}
