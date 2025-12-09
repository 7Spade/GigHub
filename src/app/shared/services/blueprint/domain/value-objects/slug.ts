/**
 * Slug Value Object
 * URL Slug 值對象
 * 
 * Ensures slug validity for URL usage.
 * 確保 Slug 對 URL 使用有效
 */
export class Slug {
  private constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error(
        `Invalid slug: ${value}. Slug must be lowercase alphanumeric with hyphens, 3-50 characters.`
      );
    }
  }

  /**
   * Create from string
   * 從字串建立
   */
  static fromString(value: string): Slug {
    return new Slug(value);
  }

  /**
   * Create from blueprint name (auto-generate slug)
   * 從藍圖名稱建立（自動產生 slug）
   */
  static fromName(name: string): Slug {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/[^a-z0-9-]/g, '') // Remove non-alphanumeric except hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    
    return new Slug(slug);
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
  equals(other: Slug): boolean {
    return this.value === other.value;
  }

  /**
   * Validate slug format
   * 驗證 slug 格式
   * 
   * Rules:
   * - Lowercase letters, numbers, hyphens only
   * - 3-50 characters
   * - Cannot start or end with hyphen
   */
  private isValid(value: string): boolean {
    if (!value || value.length < 3 || value.length > 50) {
      return false;
    }
    
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return slugRegex.test(value);
  }
}
