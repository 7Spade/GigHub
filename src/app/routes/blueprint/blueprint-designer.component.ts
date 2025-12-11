import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzFormModule } from 'ng-zorro-antd/form';
import { FormsModule } from '@angular/forms';
import { SHARED_IMPORTS } from '@shared';
import { Blueprint, LoggerService, ModuleType } from '@core';
import { BlueprintService } from '@shared';
import { ModuleConnection, CreateConnectionDto } from './models';

/**
 * Canvas Module Interface
 * 畫布模組資料結構
 */
interface CanvasModule {
  id: string;
  type: string;
  name: string;
  position: { x: number; y: number };
  enabled: boolean;
  config: Record<string, any>;
  dependencies: string[];
}

/**
 * Module Category Interface
 * 模組分類資料結構
 */
interface ModuleCategory {
  name: string;
  modules: Array<{
    type: string;
    name: string;
    icon: string;
  }>;
}

/**
 * Connection Creation State
 * 連接建立狀態
 */
interface ConnectionCreationState {
  /** 是否正在建立連接 */
  active: boolean;
  /** 來源模組 ID */
  sourceModuleId: string | null;
  /** 來源端點位置 */
  sourcePosition: { x: number; y: number } | null;
  /** 當前滑鼠位置 */
  currentPosition: { x: number; y: number } | null;
}

/**
 * Blueprint Designer Component
 * 藍圖設計器 - 視覺化拖放式模組配置介面
 * 
 * Features:
 * - Drag-and-drop module configuration
 * - Visual module dependencies (NEW: Task 1)
 * - Module connection visualization (NEW: Task 1)
 * - Dependency validation (NEW: Task 2)
 * - Real-time property editing
 * - Canvas-based layout
 * 
 * ✅ Modern Angular 20 with Signals and new control flow
 * ✅ Task 1.1: Connection data structures implemented
 */
@Component({
  selector: 'app-blueprint-designer',
  standalone: true,
  imports: [SHARED_IMPORTS, DragDropModule, NzDrawerModule, NzEmptyModule, NzFormModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <page-header
      [title]="'藍圖設計器: ' + (blueprint()?.name || '')"
      [action]="headerActions"
    >
      <ng-template #headerActions>
        <button nz-button (click)="preview()">
          <span nz-icon nzType="eye"></span>
          預覽
        </button>
        <button nz-button nzType="primary" (click)="save()" [nzLoading]="saving()">
          <span nz-icon nzType="save"></span>
          儲存
        </button>
        <button nz-button (click)="close()">
          <span nz-icon nzType="close"></span>
          關閉
        </button>
      </ng-template>
    </page-header>

    <div class="designer-container">
      <!-- Module Palette (Left Panel) -->
      <div class="module-palette">
        <nz-card nzTitle="模組選擇器" [nzBordered]="false">
          <div class="module-categories">
            <!-- 📌 使用 @for 新語法 -->
            @for (category of moduleCategories(); track category.name) {
              <div class="category">
                <h4>{{ category.name }}</h4>
                
                <!-- 📌 巢狀 @for -->
                @for (module of category.modules; track module.type) {
                  <div
                    class="module-card"
                    cdkDrag
                    [cdkDragData]="module"
                    (cdkDragStarted)="onDragStart(module)"
                  >
                    <span nz-icon [nzType]="module.icon"></span>
                    <span>{{ module.name }}</span>
                  </div>
                }
              </div>
            }
          </div>
        </nz-card>
      </div>

      <!-- Canvas Area (Center) -->
      <div class="canvas-area">
        <nz-card nzTitle="畫布區域" [nzBordered]="false" class="canvas-card">
          <div 
            class="canvas" 
            #canvas
            cdkDropList
            id="canvas-drop-list"
            [cdkDropListData]="canvasModules()"
            (cdkDropListDropped)="onDrop($event)"
          >
            <!-- Render modules on canvas -->
            @for (module of canvasModules(); track module.id) {
              <div
                class="canvas-module"
                [class.selected]="selectedModule()?.id === module.id"
                [style.left.px]="module.position.x"
                [style.top.px]="module.position.y"
                (click)="selectModule(module)"
                cdkDrag
              >
                <div class="module-header">
                  <span nz-icon [nzType]="getModuleIcon(module.type)"></span>
                  <span>{{ module.name }}</span>
                  <button
                    nz-button
                    nzType="text"
                    nzSize="small"
                    (click)="removeModule(module.id); $event.stopPropagation()"
                  >
                    <span nz-icon nzType="close"></span>
                  </button>
                </div>
                
                <!-- 📌 使用 @if 顯示依賴關係 -->
                @if (module.dependencies.length > 0) {
                  <div class="module-dependencies">
                    依賴: {{ module.dependencies.join(', ') }}
                  </div>
                }
              </div>
            }

            <!-- Empty state -->
            @if (canvasModules().length === 0) {
              <nz-empty
                [nzNotFoundContent]="'拖放模組到此處開始設計'"
                class="canvas-empty"
              ></nz-empty>
            }
          </div>
        </nz-card>
      </div>

      <!-- Property Panel (Right Drawer) -->
      <nz-drawer
        [nzVisible]="selectedModule() !== null"
        nzPlacement="right"
        [nzTitle]="'模組設定'"
        [nzWidth]="400"
        (nzOnClose)="closePropertyPanel()"
      >
        @if (selectedModule(); as module) {
          <div class="property-panel">
            <form nz-form nzLayout="vertical">
              <nz-form-item>
                <nz-form-label nzRequired>模組名稱</nz-form-label>
                <nz-form-control>
                  <input
                    nz-input
                    [(ngModel)]="module.name"
                    name="moduleName"
                    placeholder="輸入模組名稱"
                  />
                </nz-form-control>
              </nz-form-item>

              <nz-form-item>
                <nz-form-label>啟用狀態</nz-form-label>
                <nz-form-control>
                  <nz-switch [(ngModel)]="module.enabled" name="moduleEnabled"></nz-switch>
                </nz-form-control>
              </nz-form-item>

              <nz-form-item>
                <nz-form-label>模組設定</nz-form-label>
                <nz-form-control>
                  <textarea
                    nz-input
                    [nzAutosize]="{ minRows: 5, maxRows: 10 }"
                    [(ngModel)]="moduleConfigJson"
                    name="moduleConfig"
                    placeholder="JSON 格式"
                  ></textarea>
                </nz-form-control>
              </nz-form-item>

              <button
                nz-button
                nzType="primary"
                nzBlock
                type="button"
                (click)="updateModuleConfig()"
              >
                更新設定
              </button>
            </form>
          </div>
        }
      </nz-drawer>
    </div>
  `,
  styles: [`
    .designer-container {
      display: flex;
      height: calc(100vh - 180px);
      gap: 16px;
    }

    .module-palette {
      width: 250px;
      flex-shrink: 0;
      overflow-y: auto;
    }

    .category {
      margin-bottom: 16px;
    }

    .category h4 {
      margin: 0 0 8px 0;
      font-size: 14px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.85);
    }

    .module-card {
      padding: 12px;
      margin-bottom: 8px;
      background: #fafafa;
      border: 1px solid #d9d9d9;
      border-radius: 4px;
      cursor: move;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s;
    }

    .module-card:hover {
      background: #e6f4ff;
      border-color: #1890ff;
    }

    .canvas-area {
      flex: 1;
      overflow: auto;
    }

    .canvas-card {
      height: 100%;
    }

    .canvas {
      position: relative;
      min-height: 600px;
      background: #fafafa;
      border: 2px dashed #d9d9d9;
      border-radius: 4px;
      padding: 16px;
    }

    .canvas-module {
      position: absolute;
      width: 200px;
      padding: 16px;
      background: white;
      border: 2px solid #d9d9d9;
      border-radius: 8px;
      cursor: move;
      transition: all 0.3s;
    }

    .canvas-module:hover,
    .canvas-module.selected {
      border-color: #1890ff;
      box-shadow: 0 4px 12px rgba(24, 144, 255, 0.2);
    }

    .module-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
    }

    .module-header button {
      margin-left: auto;
    }

    .module-dependencies {
      margin-top: 8px;
      font-size: 12px;
      color: #8c8c8c;
    }

    .canvas-empty {
      margin-top: 200px;
    }

    .property-panel {
      padding: 16px;
    }
  `]
})
export class BlueprintDesignerComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly message = inject(NzMessageService);
  private readonly logger = inject(LoggerService);
  private readonly blueprintService = inject(BlueprintService);

  // ✅ Signals for reactive state management
  readonly blueprint = signal<Blueprint | null>(null);
  readonly canvasModules = signal<CanvasModule[]>([]);
  readonly selectedModule = signal<CanvasModule | null>(null);
  readonly saving = signal(false);
  readonly moduleConfigJson = signal('{}');

  // ✅ NEW: Task 1.1 - Connection management signals
  readonly connections = signal<ModuleConnection[]>([]);
  readonly selectedConnectionId = signal<string | null>(null);
  readonly connectionCreationState = signal<ConnectionCreationState>({
    active: false,
    sourceModuleId: null,
    sourcePosition: null,
    currentPosition: null
  });

  // ✅ Computed signal for module categories
  readonly moduleCategories = computed<ModuleCategory[]>(() => [
    {
      name: '基礎模組',
      modules: [
        { type: 'tasks', name: '任務管理', icon: 'check-square' },
        { type: 'logs', name: '日誌管理', icon: 'file-text' },
        { type: 'documents', name: '文件管理', icon: 'folder' }
      ]
    },
    {
      name: '進階模組',
      modules: [
        { type: 'quality', name: '品質驗收', icon: 'safety' },
        { type: 'inspection', name: '檢查管理', icon: 'eye' }
      ]
    }
  ]);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadBlueprint(id);
    }
  }

  /**
   * Load blueprint data
   * 載入藍圖資料
   */
  loadBlueprint(id: string): void {
    this.blueprintService.getById(id).subscribe({
      next: (blueprint) => {
        if (!blueprint) {
          this.message.error('藍圖不存在');
          return;
        }
        
        this.blueprint.set(blueprint);
        
        // Convert enabled modules to canvas modules with initial positions
        const modules: CanvasModule[] = blueprint.enabledModules.map((type: ModuleType, index: number) => ({
          id: `module-${Date.now()}-${index}`,
          type,
          name: this.getModuleName(type),
          position: { x: 50 + (index % 3) * 220, y: 50 + Math.floor(index / 3) * 150 },
          enabled: true,
          config: {},
          dependencies: []
        }));
        
        this.canvasModules.set(modules);
        this.logger.info('[BlueprintDesigner]', 'Loaded blueprint', { id, modulesCount: modules.length });
      },
      error: (error) => {
        this.logger.error('[BlueprintDesigner]', 'Failed to load blueprint', error instanceof Error ? error : new Error(String(error)));
        this.message.error('載入藍圖失敗');
      }
    });
  }

  /**
   * Handle drag start event
   * 處理拖曳開始事件
   */
  onDragStart(module: any): void {
    this.logger.debug('[BlueprintDesigner]', 'Drag started', { module });
  }

  /**
   * Handle drop event on canvas
   * 處理放置事件
   */
  onDrop(event: CdkDragDrop<CanvasModule[]>): void {
    if (event.previousContainer === event.container) {
      // Reorder within canvas
      const modules = [...this.canvasModules()];
      moveItemInArray(modules, event.previousIndex, event.currentIndex);
      this.canvasModules.set(modules);
    } else {
      // Add new module from palette
      const moduleData = event.item.data;
      const newModule: CanvasModule = {
        id: `module-${Date.now()}`,
        type: moduleData.type,
        name: moduleData.name,
        position: {
          x: event.dropPoint.x - event.distance.x,
          y: event.dropPoint.y - event.distance.y
        },
        enabled: true,
        config: {},
        dependencies: []
      };
      
      this.canvasModules.update(modules => [...modules, newModule]);
      this.message.success(`已新增 ${newModule.name}`);
      this.logger.info('[BlueprintDesigner]', 'Module added', { module: newModule });
    }
  }

  /**
   * Select a module for editing
   * 選擇模組進行編輯
   */
  selectModule(module: CanvasModule): void {
    this.selectedModule.set(module);
    this.moduleConfigJson.set(JSON.stringify(module.config, null, 2));
    this.logger.debug('[BlueprintDesigner]', 'Module selected', { module });
  }

  /**
   * Remove a module from canvas
   * 從畫布移除模組
   */
  removeModule(id: string): void {
    this.canvasModules.update(modules => modules.filter(m => m.id !== id));
    if (this.selectedModule()?.id === id) {
      this.selectedModule.set(null);
    }
    this.message.success('已移除模組');
    this.logger.info('[BlueprintDesigner]', 'Module removed', { id });
  }

  /**
   * Close property panel
   * 關閉屬性面板
   */
  closePropertyPanel(): void {
    this.selectedModule.set(null);
  }

  /**
   * Update module configuration
   * 更新模組設定
   */
  updateModuleConfig(): void {
    try {
      const config = JSON.parse(this.moduleConfigJson());
      const module = this.selectedModule();
      if (module) {
        module.config = config;
        this.message.success('設定已更新');
        this.logger.info('[BlueprintDesigner]', 'Module config updated', { module });
      }
    } catch (error) {
      this.logger.error('[BlueprintDesigner]', 'Invalid JSON config', error instanceof Error ? error : new Error(String(error)));
      this.message.error('JSON 格式錯誤');
    }
  }

  /**
   * Save blueprint configuration
   * 儲存藍圖配置
   */
  async save(): Promise<void> {
    this.saving.set(true);
    try {
      const blueprint = this.blueprint();
      if (!blueprint) return;

      // Convert canvas modules to enabled modules
      const enabledModules: ModuleType[] = this.canvasModules()
        .filter(m => m.enabled)
        .map(m => m.type as ModuleType);

      await this.blueprintService.update(blueprint.id, {
        enabledModules
      });

      this.message.success('儲存成功');
      this.logger.info('[BlueprintDesigner]', 'Blueprint saved', { 
        blueprintId: blueprint.id, 
        modulesCount: enabledModules.length 
      });
    } catch (error) {
      this.logger.error('[BlueprintDesigner]', 'Failed to save', error instanceof Error ? error : new Error(String(error)));
      this.message.error('儲存失敗');
    } finally {
      this.saving.set(false);
    }
  }

  /**
   * Preview blueprint
   * 預覽藍圖
   */
  preview(): void {
    const blueprint = this.blueprint();
    if (blueprint) {
      this.router.navigate(['/blueprint', blueprint.id]);
    }
  }

  /**
   * Close designer and return to list
   * 關閉設計器返回列表
   */
  close(): void {
    this.router.navigate(['/blueprint']);
  }

  /**
   * Get module display name
   * 取得模組顯示名稱
   */
  private getModuleName(type: string): string {
    const names: Record<string, string> = {
      tasks: '任務管理',
      logs: '日誌管理',
      quality: '品質驗收',
      documents: '文件管理',
      inspection: '檢查管理'
    };
    return names[type] || type;
  }

  /**
   * Get module icon
   * 取得模組圖示
   */
  getModuleIcon(type: string): string {
    const icons: Record<string, string> = {
      tasks: 'check-square',
      logs: 'file-text',
      quality: 'safety',
      documents: 'folder',
      inspection: 'eye'
    };
    return icons[type] || 'question';
  }
}
