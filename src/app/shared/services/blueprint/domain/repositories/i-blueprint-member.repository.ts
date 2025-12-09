import { Observable } from 'rxjs';
import { BlueprintMember } from '@core';

/**
 * Blueprint Member Repository Interface
 * 藍圖成員倉儲介面
 * 
 * Defines the contract for blueprint member data persistence operations.
 * Implementations can use Firestore subcollections, relational tables, or other backends.
 * 
 * 定義藍圖成員資料持久化操作的契約。
 * 實作可以使用 Firestore 子集合、關聯表或其他後端。
 */
export interface IBlueprintMemberRepository {
  /**
   * Find all members of a blueprint
   * 查找藍圖的所有成員
   */
  findByBlueprint(blueprintId: string): Observable<BlueprintMember[]>;

  /**
   * Find member by ID
   * 根據 ID 查找成員
   */
  findById(blueprintId: string, memberId: string): Promise<BlueprintMember | null>;

  /**
   * Add new member to blueprint
   * 將新成員加入藍圖
   */
  addMember(
    blueprintId: string,
    member: Omit<BlueprintMember, 'id' | 'grantedAt'>
  ): Promise<BlueprintMember>;

  /**
   * Update member information
   * 更新成員資訊
   */
  updateMember(
    blueprintId: string,
    memberId: string,
    data: Partial<BlueprintMember>
  ): Promise<void>;

  /**
   * Remove member from blueprint
   * 從藍圖移除成員
   */
  removeMember(blueprintId: string, memberId: string): Promise<void>;

  /**
   * Check if account is member of blueprint
   * 檢查帳號是否為藍圖成員
   */
  isMember(blueprintId: string, accountId: string): Promise<boolean>;

  /**
   * Count members in blueprint
   * 計算藍圖中的成員數量
   */
  countMembers(blueprintId: string): Promise<number>;
}
