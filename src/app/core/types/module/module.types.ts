import { ModuleState } from './module-state.enum';

/**
 * Module type enumeration
 * 模組類型列舉
 */
export enum ModuleType {
  TASKS = 'tasks',
  LOGS = 'logs',
  QUALITY = 'quality',
  DIARY = 'diary',
  DASHBOARD = 'dashboard',
  FILES = 'files',
  TODOS = 'todos',
  CHECKLISTS = 'checklists',
  ISSUES = 'issues',
  BOT_WORKFLOW = 'bot_workflow'
}

/**
 * Module dependency definition
 * 模組相依定義
 */
export interface ModuleDependency {
  moduleId: ModuleType | string;
  version: string;
  optional?: boolean;
}

/**
 * Module export definition
 * 模組匯出定義
 */
export interface ModuleExport {
  name: string;
  type: 'service' | 'component' | 'directive' | 'pipe';
  public: boolean;
}

/**
 * Module metadata definition
 * 模組中繼資料定義
 */
export interface ModuleMetadata {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  requires?: ModuleDependency[];
  conflicts?: string[];
  provides?: string[];
  exports?: ModuleExport[];
}

/**
 * Module lifecycle state snapshot
 * 模組生命週期狀態
 */
export interface ModuleLifecycle {
  moduleId: string;
  moduleName: string;
  state: ModuleState;
  version: string;
  initializedAt?: Date | string;
  startedAt?: Date | string;
  stoppedAt?: Date | string;
  health?: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    lastCheck?: Date | string;
    metrics?: Record<string, unknown>;
  };
  dependencies?: string[];
  dependents?: string[];
}

/**
 * Module contract interface
 * 模組契約介面
 */
export interface IModule {
  initialize(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  cleanup(): Promise<void>;
  healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; reason?: string }>;
  getState(): ModuleState;
}
