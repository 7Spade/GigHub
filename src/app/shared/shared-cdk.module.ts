/**
 * Angular CDK 模組配置
 *
 * 提供 Angular CDK 核心模組的統一管理和按需導入策略。
 *
 * @module SharedCdkModule
 * @description
 * 本模組遵循 GigHub 專案的架構原則，採用按需導入策略以優化 bundle size。
 * ng-zorro-antd 已內建大部分 CDK 功能，因此這些模組主要用於進階場景。
 *
 * @architecture
 * - 標準模組: SHARED_CDK_MODULES（目前為空，ng-zorro 已包含必要功能）
 * - 可選模組: OPTIONAL_CDK_MODULES（按需導入）
 * - 封裝服務: core/services/layout/（統一管理的服務）
 *
 * @see https://material.angular.io/cdk/categories
 */

import { A11yModule } from '@angular/cdk/a11y';
import { ObserversModule } from '@angular/cdk/observers';
import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';
import { ScrollingModule } from '@angular/cdk/scrolling';

/**
 * 可選 CDK 模組
 *
 * 這些模組不會預設載入，需要時才導入以優化效能。
 *
 * @example
 * ```typescript
 * import { SHARED_IMPORTS, OPTIONAL_CDK_MODULES } from '@shared';
 *
 * @Component({
 *   selector: 'app-large-list',
 *   standalone: true,
 *   imports: [
 *     SHARED_IMPORTS,
 *     OPTIONAL_CDK_MODULES.scrolling  // 按需導入虛擬滾動
 *   ],
 *   template: `
 *     <cdk-virtual-scroll-viewport itemSize="50">
 *       @for (item of items(); track item.id) {
 *         <div>{{ item.name }}</div>
 *       }
 *     </cdk-virtual-scroll-viewport>
 *   `
 * })
 * export class LargeListComponent {
 *   items = signal([...]);
 * }
 * ```
 */
export const OPTIONAL_CDK_MODULES = {
  /**
   * 可存取性模組 (A11y)
   *
   * 提供鍵盤導航、焦點管理、螢幕閱讀器支援等可存取性功能。
   *
   * @module A11yModule
   * @see https://material.angular.io/cdk/a11y/overview
   *
   * @features
   * - FocusTrap: 焦點陷阱，限制焦點在特定區域內
   * - LiveAnnouncer: 無障礙公告服務
   * - FocusMonitor: 焦點狀態監控
   * - InteractivityChecker: 互動性檢查
   *
   * @example
   * ```html
   * <div cdkTrapFocus [cdkTrapFocusAutoCapture]="true">
   *   <input type="text">
   *   <button>確認</button>
   * </div>
   * ```
   */
  a11y: A11yModule,

  /**
   * 虛擬滾動模組 (Scrolling)
   *
   * 提供虛擬滾動功能，優化大量資料列表的渲染效能。
   *
   * @module ScrollingModule
   * @see https://material.angular.io/cdk/scrolling/overview
   *
   * @features
   * - CdkVirtualScrollViewport: 虛擬滾動容器
   * - CdkVirtualForOf: 虛擬滾動指令
   * - ScrollingModule: 滾動策略
   *
   * @useCases
   * - 資料量 > 1000 筆的列表
   * - 無限滾動場景
   * - 需要優化渲染效能的長列表
   *
   * @note
   * ng-zorro-antd 的 nz-table 已支援虛擬滾動，大部分情況不需要直接使用此模組。
   *
   * @example
   * ```html
   * <cdk-virtual-scroll-viewport itemSize="50" class="viewport">
   *   @for (item of items(); track item.id) {
   *     <div class="item">{{ item.name }}</div>
   *   }
   * </cdk-virtual-scroll-viewport>
   * ```
   */
  scrolling: ScrollingModule,

  /**
   * DOM 監聽模組 (Observers)
   *
   * 提供各種 DOM 觀察器，監聽元素狀態變化。
   *
   * @module ObserversModule
   * @see https://material.angular.io/cdk/observers/overview
   *
   * @features
   * - CdkObserveContent: 內容變化監聽
   * - IntersectionObserver: 元素可見性監聽
   * - MutationObserver: DOM 變化監聽
   *
   * @useCases
   * - 懶加載圖片
   * - 無限滾動觸發
   * - 元素進入視窗時觸發動畫
   * - 監聽 DOM 內容變化
   *
   * @example
   * ```html
   * <div (cdkObserveContent)="onContentChange()">
   *   動態內容
   * </div>
   * ```
   */
  observers: ObserversModule,

  /**
   * 浮層模組 (Overlay)
   *
   * 提供浮層定位和管理服務，用於對話框、下拉選單等。
   *
   * @module OverlayModule
   * @see https://material.angular.io/cdk/overlay/overview
   *
   * @features
   * - Overlay: 浮層服務
   * - OverlayPositionBuilder: 定位構建器
   * - ScrollStrategy: 滾動策略
   *
   * @note
   * ⚠️ ng-zorro-antd 已內建此模組，大部分情況不需要直接使用。
   * 只有在需要自訂浮層行為時才導入。
   *
   * @example
   * ```typescript
   * import { Overlay } from '@angular/cdk/overlay';
   *
   * const overlayRef = this.overlay.create({
   *   positionStrategy: this.overlay.position()
   *     .global()
   *     .centerHorizontally()
   *     .centerVertically()
   * });
   * ```
   */
  overlay: OverlayModule,

  /**
   * 動態內容模組 (Portal)
   *
   * 提供動態內容渲染和元件投影功能。
   *
   * @module PortalModule
   * @see https://material.angular.io/cdk/portal/overview
   *
   * @features
   * - Portal: 可重用的內容片段
   * - ComponentPortal: 元件 Portal
   * - TemplatePortal: 模板 Portal
   * - DomPortal: DOM Portal
   *
   * @useCases
   * - 動態載入元件
   * - 內容投影到不同位置
   * - 模態對話框內容管理
   *
   * @note
   * ⚠️ ng-zorro-antd 已內建此模組，大部分情況不需要直接使用。
   *
   * @example
   * ```typescript
   * import { ComponentPortal } from '@angular/cdk/portal';
   *
   * const portal = new ComponentPortal(MyComponent);
   * portalOutlet.attach(portal);
   * ```
   */
  portal: PortalModule
} as const;

/**
 * 標準 CDK 導入
 *
 * 這些模組會預設加入 SHARED_IMPORTS，所有元件都可以直接使用。
 *
 * @note
 * 目前為空陣列，因為 ng-zorro-antd 已包含大部分必要的 CDK 功能。
 * 如果未來需要全局啟用特定 CDK 模組，可以在此添加。
 *
 * @example
 * ```typescript
 * // 如果需要全局啟用某個模組：
 * export const SHARED_CDK_MODULES = [
 *   A11yModule  // 全局啟用可存取性功能
 * ];
 * ```
 */
export const SHARED_CDK_MODULES: any[] = [
  // 目前為空
  // ng-zorro-antd 已包含必要的 CDK 模組
  // 如需全局啟用特定模組，請在此添加
];

/**
 * CDK 模組類型定義
 * 提供 TypeScript 類型檢查和 IDE 自動完成
 */
export type CdkModuleKey = keyof typeof OPTIONAL_CDK_MODULES;

/**
 * @deprecated 請使用 OPTIONAL_CDK_MODULES
 * 保留此別名以維持向後相容性
 */
export const CDK_MODULES = OPTIONAL_CDK_MODULES;
