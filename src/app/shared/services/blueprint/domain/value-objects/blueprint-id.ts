/**
 * Blueprint ID Value Object
 * 
 * Immutable identifier for Blueprint aggregates.
 * Ensures type safety and validation for blueprint IDs.
 */
export class BlueprintId {
  private constructor(private readonly value: string) {
    if (!value || !this.isValidUUID(value)) {
      throw new Error('Invalid Blueprint ID format. Must be a valid UUID.');
    }
  }

  /**
   * Create a new Blueprint ID with auto-generated UUID
   */
  static create(): BlueprintId {
    return new BlueprintId(crypto.randomUUID());
  }

  /**
   * Create Blueprint ID from existing string
   */
  static fromString(value: string): BlueprintId {
    return new BlueprintId(value);
  }

  /**
   * Get the string representation
   */
  toString(): string {
    return this.value;
  }

  /**
   * Check equality with another BlueprintId
   */
  equals(other: BlueprintId): boolean {
    return this.value === other.value;
  }

  private isValidUUID(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }
}
