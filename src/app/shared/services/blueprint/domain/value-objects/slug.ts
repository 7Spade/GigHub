/**
 * Slug Value Object
 * 
 * Immutable URL-friendly identifier.
 * Ensures slugs are properly formatted and valid.
 */
export class Slug {
  private constructor(private readonly value: string) {
    if (!value || !this.isValidSlug(value)) {
      throw new Error('Invalid slug format. Must be lowercase, alphanumeric with hyphens.');
    }
  }

  /**
   * Create slug from string
   */
  static fromString(value: string): Slug {
    return new Slug(value.toLowerCase().trim());
  }

  /**
   * Create slug from text (auto-generate)
   */
  static fromText(text: string): Slug {
    const slug = text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    return new Slug(slug);
  }

  /**
   * Get the string representation
   */
  toString(): string {
    return this.value;
  }

  /**
   * Check equality with another Slug
   */
  equals(other: Slug): boolean {
    return this.value === other.value;
  }

  private isValidSlug(value: string): boolean {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return slugRegex.test(value) && value.length >= 3 && value.length <= 100;
  }
}
