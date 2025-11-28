/**
 * File Domain Enums
 *
 * Enum definitions for file module
 *
 * @module features/blueprint/domain/enums/file
 */

/**
 * File type classification enum
 */
export enum FileTypeEnum {
  FOLDER = 'folder',
  IMAGE = 'image',
  DOCUMENT = 'document',
  SPREADSHEET = 'spreadsheet',
  CAD = 'cad',
  VIDEO = 'video',
  AUDIO = 'audio',
  OTHER = 'other'
}

/**
 * File type display labels
 */
export const FILE_TYPE_LABELS: Record<FileTypeEnum, string> = {
  [FileTypeEnum.FOLDER]: '資料夾',
  [FileTypeEnum.IMAGE]: '圖片',
  [FileTypeEnum.DOCUMENT]: '文件',
  [FileTypeEnum.SPREADSHEET]: '試算表',
  [FileTypeEnum.CAD]: '工程圖',
  [FileTypeEnum.VIDEO]: '影片',
  [FileTypeEnum.AUDIO]: '音訊',
  [FileTypeEnum.OTHER]: '其他'
};

/**
 * File type icons (Ant Design icons)
 */
export const FILE_TYPE_ICONS: Record<FileTypeEnum, string> = {
  [FileTypeEnum.FOLDER]: 'folder',
  [FileTypeEnum.IMAGE]: 'file-image',
  [FileTypeEnum.DOCUMENT]: 'file-text',
  [FileTypeEnum.SPREADSHEET]: 'file-excel',
  [FileTypeEnum.CAD]: 'file',
  [FileTypeEnum.VIDEO]: 'video-camera',
  [FileTypeEnum.AUDIO]: 'audio',
  [FileTypeEnum.OTHER]: 'file-unknown'
};

/**
 * Allowed extensions for each file type
 */
export const FILE_TYPE_EXTENSIONS: Record<FileTypeEnum, string[]> = {
  [FileTypeEnum.FOLDER]: [],
  [FileTypeEnum.IMAGE]: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'],
  [FileTypeEnum.DOCUMENT]: ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt'],
  [FileTypeEnum.SPREADSHEET]: ['.xls', '.xlsx', '.csv', '.ods'],
  [FileTypeEnum.CAD]: ['.dwg', '.dxf', '.dwf'],
  [FileTypeEnum.VIDEO]: ['.mp4', '.mov', '.avi', '.mkv', '.webm'],
  [FileTypeEnum.AUDIO]: ['.mp3', '.wav', '.m4a', '.ogg', '.flac'],
  [FileTypeEnum.OTHER]: []
};

/**
 * File size limits (in bytes)
 */
export const FILE_SIZE_LIMITS: Record<string, number> = {
  IMAGE: 10 * 1024 * 1024,      // 10 MB
  DOCUMENT: 50 * 1024 * 1024,   // 50 MB
  CAD: 100 * 1024 * 1024,       // 100 MB
  DEFAULT: 50 * 1024 * 1024     // 50 MB
};

/**
 * Get file type from extension
 */
export function getFileTypeFromExtension(filename: string): FileTypeEnum {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  
  for (const [type, extensions] of Object.entries(FILE_TYPE_EXTENSIONS)) {
    if (extensions.includes(ext)) {
      return type as FileTypeEnum;
    }
  }
  
  return FileTypeEnum.OTHER;
}
