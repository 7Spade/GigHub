import { OwnerType } from '@core';

/**
 * Owner Information Value Object
 * 
 * Immutable owner reference for Blueprint aggregates.
 * Ensures type safety for owner relationships.
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
   * Create OwnerInfo for a user
   */
  static forUser(userId: string): OwnerInfo {
    return new OwnerInfo(userId, OwnerType.USER);
  }

  /**
   * Create OwnerInfo for an organization
   */
  static forOrganization(orgId: string): OwnerInfo {
    return new OwnerInfo(orgId, OwnerType.ORGANIZATION);
  }

  /**
   * Create OwnerInfo for a team
   */
  static forTeam(teamId: string): OwnerInfo {
    return new OwnerInfo(teamId, OwnerType.TEAM);
  }

  /**
   * Get owner ID
   */
  getId(): string {
    return this.ownerId;
  }

  /**
   * Get owner type
   */
  getType(): OwnerType {
    return this.ownerType;
  }

  /**
   * Check if owner is a user
   */
  isUser(): boolean {
    return this.ownerType === OwnerType.USER;
  }

  /**
   * Check if owner is an organization
   */
  isOrganization(): boolean {
    return this.ownerType === OwnerType.ORGANIZATION;
  }

  /**
   * Check if owner is a team
   */
  isTeam(): boolean {
    return this.ownerType === OwnerType.TEAM;
  }

  /**
   * Check equality with another OwnerInfo
   */
  equals(other: OwnerInfo): boolean {
    return this.ownerId === other.ownerId && this.ownerType === other.ownerType;
  }

  /**
   * Convert to plain object
   */
  toObject(): { ownerId: string; ownerType: OwnerType } {
    return {
      ownerId: this.ownerId,
      ownerType: this.ownerType
    };
  }
}
