/**
 * BlueprintId Value Object
 * 藍圖 ID 值對象
 * 
 * Immutable identifier for Blueprint aggregate.
 * Ensures ID validity and provides type safety.
 */
export class BlueprintId {
  private constructor(private readonly value: string) {
    if (!value || !this.isValidUUID(value)) {
      throw new Error(`Invalid Blueprint ID: ${value}`);
    }
  }

  /**
   * Create a new random Blueprint ID
   * 建立新的隨機藍圖 ID
   */
  static create(): BlueprintId {
    return new BlueprintId(crypto.randomUUID());
  }

  /**
   * Create from existing string
   * 從現有字串建立
   */
  static fromString(value: string): BlueprintId {
    return new BlueprintId(value);
  }

  /**
   * Get string representation
   * 取得字串表示
   */
  toString(): string {
    return this.value;
  }

  /**
   * Check equality
   * 檢查相等性
   */
  equals(other: BlueprintId): boolean {
    return this.value === other.value;
  }

  /**
   * Validate UUID format
   * 驗證 UUID 格式
   */
  private isValidUUID(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }
}
