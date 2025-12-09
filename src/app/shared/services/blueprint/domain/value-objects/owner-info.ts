import { OwnerType } from '@core';

/**
 * OwnerInfo Value Object
 * 擁有者資訊值對象
 * 
 * Encapsulates blueprint ownership information.
 * 封裝藍圖擁有者資訊
 */
export class OwnerInfo {
  private constructor(
    private readonly ownerId: string,
    private readonly ownerType: OwnerType
  ) {
    if (!ownerId || ownerId.trim().length === 0) {
      throw new Error('Owner ID cannot be empty');
    }
    if (!Object.values(OwnerType).includes(ownerType)) {
      throw new Error(`Invalid owner type: ${ownerType}`);
    }
  }

  /**
   * Create OwnerInfo from components
   * 從組件建立擁有者資訊
   */
  static create(ownerId: string, ownerType: OwnerType): OwnerInfo {
    return new OwnerInfo(ownerId, ownerType);
  }

  /**
   * Get owner ID
   * 取得擁有者 ID
   */
  getOwnerId(): string {
    return this.ownerId;
  }

  /**
   * Get owner type
   * 取得擁有者類型
   */
  getOwnerType(): OwnerType {
    return this.ownerType;
  }

  /**
   * Check if owner is user
   * 檢查擁有者是否為使用者
   */
  isUser(): boolean {
    return this.ownerType === OwnerType.USER;
  }

  /**
   * Check if owner is organization
   * 檢查擁有者是否為組織
   */
  isOrganization(): boolean {
    return this.ownerType === OwnerType.ORGANIZATION;
  }

  /**
   * Check if owner is team
   * 檢查擁有者是否為團隊
   */
  isTeam(): boolean {
    return this.ownerType === OwnerType.TEAM;
  }

  /**
   * Check equality
   * 檢查相等性
   */
  equals(other: OwnerInfo): boolean {
    return (
      this.ownerId === other.ownerId &&
      this.ownerType === other.ownerType
    );
  }

  /**
   * Convert to plain object
   * 轉換為純物件
   */
  toObject(): { ownerId: string; ownerType: OwnerType } {
    return {
      ownerId: this.ownerId,
      ownerType: this.ownerType
    };
  }
}
