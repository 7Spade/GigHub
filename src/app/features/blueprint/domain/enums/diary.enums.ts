/**
 * Diary Domain Enums
 *
 * Enum definitions for diary module
 *
 * @module features/blueprint/domain/enums/diary
 */

/**
 * Weather condition enum
 */
export enum DiaryWeatherEnum {
  SUNNY = 'sunny',
  CLOUDY = 'cloudy',
  RAINY = 'rainy',
  STORMY = 'stormy',
  SNOWY = 'snowy',
  FOGGY = 'foggy'
}

/**
 * Diary status enum
 */
export enum DiaryStatusEnum {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

/**
 * Weather display labels (繁體中文)
 */
export const DIARY_WEATHER_LABELS: Record<DiaryWeatherEnum, string> = {
  [DiaryWeatherEnum.SUNNY]: '晴天',
  [DiaryWeatherEnum.CLOUDY]: '多雲',
  [DiaryWeatherEnum.RAINY]: '雨天',
  [DiaryWeatherEnum.STORMY]: '暴風',
  [DiaryWeatherEnum.SNOWY]: '雪天',
  [DiaryWeatherEnum.FOGGY]: '霧天'
};

/**
 * Weather icons
 */
export const DIARY_WEATHER_ICONS: Record<DiaryWeatherEnum, string> = {
  [DiaryWeatherEnum.SUNNY]: '☀️',
  [DiaryWeatherEnum.CLOUDY]: '⛅',
  [DiaryWeatherEnum.RAINY]: '🌧️',
  [DiaryWeatherEnum.STORMY]: '⛈️',
  [DiaryWeatherEnum.SNOWY]: '❄️',
  [DiaryWeatherEnum.FOGGY]: '🌫️'
};

/**
 * Diary status display labels
 */
export const DIARY_STATUS_LABELS: Record<DiaryStatusEnum, string> = {
  [DiaryStatusEnum.DRAFT]: '草稿',
  [DiaryStatusEnum.SUBMITTED]: '已提交',
  [DiaryStatusEnum.APPROVED]: '已核准',
  [DiaryStatusEnum.REJECTED]: '已退回'
};

/**
 * Diary status colors
 */
export const DIARY_STATUS_COLORS: Record<DiaryStatusEnum, string> = {
  [DiaryStatusEnum.DRAFT]: 'default',
  [DiaryStatusEnum.SUBMITTED]: 'processing',
  [DiaryStatusEnum.APPROVED]: 'success',
  [DiaryStatusEnum.REJECTED]: 'error'
};
