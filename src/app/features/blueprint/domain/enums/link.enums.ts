/**
 * Link Domain Enums
 *
 * Enum definitions for link module
 *
 * @module features/blueprint/domain/enums/link
 */

/**
 * Link category enum
 */
export enum LinkCategoryEnum {
  DOCUMENT = 'document',
  DESIGN = 'design',
  REFERENCE = 'reference',
  TOOL = 'tool',
  OTHER = 'other'
}

/**
 * Link category display labels
 */
export const LINK_CATEGORY_LABELS: Record<LinkCategoryEnum, string> = {
  [LinkCategoryEnum.DOCUMENT]: '文件',
  [LinkCategoryEnum.DESIGN]: '設計',
  [LinkCategoryEnum.REFERENCE]: '參考資料',
  [LinkCategoryEnum.TOOL]: '工具',
  [LinkCategoryEnum.OTHER]: '其他'
};

/**
 * Link category colors
 */
export const LINK_CATEGORY_COLORS: Record<LinkCategoryEnum, string> = {
  [LinkCategoryEnum.DOCUMENT]: 'blue',
  [LinkCategoryEnum.DESIGN]: 'purple',
  [LinkCategoryEnum.REFERENCE]: 'green',
  [LinkCategoryEnum.TOOL]: 'orange',
  [LinkCategoryEnum.OTHER]: 'default'
};
