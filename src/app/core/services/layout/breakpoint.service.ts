/**
 * 斷點服務 (Breakpoint Service)
 *
 * 提供響應式設計斷點偵測功能，基於 Angular CDK Layout 模組。
 *
 * @module BreakpointService
 * @description
 * 使用 Angular Signals 管理斷點狀態，提供響應式的斷點偵測和查詢功能。
 * 支援標準的 Material Design 斷點規範。
 *
 * @architecture
 * - 使用 BreakpointObserver (CDK) 監聽斷點變化
 * - 使用 Signals 管理狀態
 * - 使用 computed signals 提供便捷查詢
 * - 使用 takeUntilDestroyed 自動清理訂閱
 *
 * @example
 * ```typescript
 * import { BreakpointService } from '@core/services/layout/breakpoint.service';
 *
 * @Component({
 *   template: `
 *     @if (breakpoint.isMobile()) {
 *       <app-mobile-view />
 *     } @else if (breakpoint.isTablet()) {
 *       <app-tablet-view />
 *     } @else {
 *       <app-desktop-view />
 *     }
 *   `
 * })
 * export class ResponsiveLayoutComponent {
 *   breakpoint = inject(BreakpointService);
 * }
 * ```
 *
 * @see https://material.angular.io/cdk/layout/overview
 */

import { BreakpointObserver, Breakpoints, BreakpointState } from '@angular/cdk/layout';
import { Injectable, signal, computed, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * 斷點名稱枚舉
 */
export type BreakpointName = 'XSmall' | 'Small' | 'Medium' | 'Large' | 'XLarge' | 'Unknown';

/**
 * 自訂斷點配置介面
 */
export interface CustomBreakpoint {
  name: string;
  mediaQuery: string;
}

/**
 * 斷點資訊介面
 */
export interface BreakpointInfo {
  name: BreakpointName;
  matches: boolean;
  mediaQuery: string;
}

@Injectable({
  providedIn: 'root'
})
export class BreakpointService {
  private breakpointObserver = inject(BreakpointObserver);
  private destroyRef = inject(DestroyRef);

  /**
   * 當前斷點名稱 (私有，可寫)
   *
   * @private
   */
  private _currentBreakpoint = signal<BreakpointName>('Unknown');

  /**
   * 當前斷點狀態 (私有，可寫)
   *
   * @private
   */
  private _breakpointState = signal<BreakpointState | null>(null);

  /**
   * 當前斷點名稱 (公開，只讀)
   *
   * @readonly
   * @returns {Signal<BreakpointName>} 當前斷點名稱
   */
  readonly currentBreakpoint = this._currentBreakpoint.asReadonly();

  /**
   * 當前斷點狀態 (公開，只讀)
   *
   * @readonly
   * @returns {Signal<BreakpointState | null>} 當前斷點狀態
   */
  readonly breakpointState = this._breakpointState.asReadonly();

  /**
   * 是否為行動裝置 (XSmall 或 Small)
   *
   * @readonly
   * @returns {Signal<boolean>} true 表示行動裝置
   */
  readonly isMobile = computed(() => {
    const bp = this._currentBreakpoint();
    return bp === 'XSmall' || bp === 'Small';
  });

  /**
   * 是否為平板裝置 (Medium)
   *
   * @readonly
   * @returns {Signal<boolean>} true 表示平板裝置
   */
  readonly isTablet = computed(() => this._currentBreakpoint() === 'Medium');

  /**
   * 是否為桌面裝置 (Large 或 XLarge)
   *
   * @readonly
   * @returns {Signal<boolean>} true 表示桌面裝置
   */
  readonly isDesktop = computed(() => {
    const bp = this._currentBreakpoint();
    return bp === 'Large' || bp === 'XLarge';
  });

  /**
   * 是否為超小螢幕 (< 600px)
   *
   * @readonly
   * @returns {Signal<boolean>} true 表示超小螢幕
   */
  readonly isXSmall = computed(() => this._currentBreakpoint() === 'XSmall');

  /**
   * 是否為小螢幕 (600px - 960px)
   *
   * @readonly
   * @returns {Signal<boolean>} true 表示小螢幕
   */
  readonly isSmall = computed(() => this._currentBreakpoint() === 'Small');

  /**
   * 是否為中等螢幕 (960px - 1280px)
   *
   * @readonly
   * @returns {Signal<boolean>} true 表示中等螢幕
   */
  readonly isMedium = computed(() => this._currentBreakpoint() === 'Medium');

  /**
   * 是否為大螢幕 (1280px - 1920px)
   *
   * @readonly
   * @returns {Signal<boolean>} true 表示大螢幕
   */
  readonly isLarge = computed(() => this._currentBreakpoint() === 'Large');

  /**
   * 是否為超大螢幕 (> 1920px)
   *
   * @readonly
   * @returns {Signal<boolean>} true 表示超大螢幕
   */
  readonly isXLarge = computed(() => this._currentBreakpoint() === 'XLarge');

  /**
   * 是否為直向模式
   *
   * @readonly
   * @returns {Signal<boolean>} true 表示直向
   */
  readonly isPortrait = computed(() => {
    const state = this._breakpointState();
    return state?.breakpoints[Breakpoints.HandsetPortrait] ?? false;
  });

  /**
   * 是否為橫向模式
   *
   * @readonly
   * @returns {Signal<boolean>} true 表示橫向
   */
  readonly isLandscape = computed(() => {
    const state = this._breakpointState();
    return state?.breakpoints[Breakpoints.HandsetLandscape] ?? false;
  });

  /**
   * 當前斷點資訊
   *
   * @readonly
   * @returns {Signal<BreakpointInfo>} 斷點資訊物件
   */
  readonly breakpointInfo = computed<BreakpointInfo>(() => {
    const name = this._currentBreakpoint();
    const state = this._breakpointState();
    return {
      name,
      matches: state?.matches ?? false,
      mediaQuery: this.getMediaQuery(name)
    };
  });

  constructor() {
    this.initBreakpointObserver();
  }

  /**
   * 初始化斷點觀察器
   *
   * @private
   */
  private initBreakpointObserver(): void {
    this.breakpointObserver
      .observe([
        Breakpoints.XSmall, // < 600px
        Breakpoints.Small, // 600px - 960px
        Breakpoints.Medium, // 960px - 1280px
        Breakpoints.Large, // 1280px - 1920px
        Breakpoints.XLarge, // > 1920px
        Breakpoints.HandsetPortrait,
        Breakpoints.HandsetLandscape
      ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        this._breakpointState.set(result);
        this.updateCurrentBreakpoint(result);
      });
  }

  /**
   * 更新當前斷點
   *
   * @private
   * @param {BreakpointState} result - 斷點狀態
   */
  private updateCurrentBreakpoint(result: BreakpointState): void {
    if (result.breakpoints[Breakpoints.XSmall]) {
      this._currentBreakpoint.set('XSmall');
    } else if (result.breakpoints[Breakpoints.Small]) {
      this._currentBreakpoint.set('Small');
    } else if (result.breakpoints[Breakpoints.Medium]) {
      this._currentBreakpoint.set('Medium');
    } else if (result.breakpoints[Breakpoints.Large]) {
      this._currentBreakpoint.set('Large');
    } else if (result.breakpoints[Breakpoints.XLarge]) {
      this._currentBreakpoint.set('XLarge');
    } else {
      this._currentBreakpoint.set('Unknown');
    }
  }

  /**
   * 獲取斷點的媒體查詢字串
   *
   * @param {BreakpointName} breakpoint - 斷點名稱
   * @returns {string} 媒體查詢字串
   */
  private getMediaQuery(breakpoint: BreakpointName): string {
    const queries: Record<BreakpointName, string> = {
      XSmall: '(max-width: 599.98px)',
      Small: '(min-width: 600px) and (max-width: 959.98px)',
      Medium: '(min-width: 960px) and (max-width: 1279.98px)',
      Large: '(min-width: 1280px) and (max-width: 1919.98px)',
      XLarge: '(min-width: 1920px)',
      Unknown: ''
    };
    return queries[breakpoint];
  }

  /**
   * 檢查是否匹配指定的媒體查詢
   *
   * @param {string} mediaQuery - 媒體查詢字串
   * @returns {boolean} true 表示匹配
   *
   * @example
   * ```typescript
   * if (breakpointService.matchMedia('(min-width: 768px)')) {
   *   // 執行平板以上的邏輯
   * }
   * ```
   */
  matchMedia(mediaQuery: string): boolean {
    return this.breakpointObserver.isMatched(mediaQuery);
  }

  /**
   * 檢查是否匹配指定的斷點
   *
   * @param {BreakpointName} breakpoint - 斷點名稱
   * @returns {boolean} true 表示匹配
   *
   * @example
   * ```typescript
   * if (breakpointService.matchBreakpoint('Large')) {
   *   // 執行大螢幕邏輯
   * }
   * ```
   */
  matchBreakpoint(breakpoint: BreakpointName): boolean {
    return this._currentBreakpoint() === breakpoint;
  }

  /**
   * 檢查是否匹配任一指定的斷點
   *
   * @param {BreakpointName[]} breakpoints - 斷點名稱陣列
   * @returns {boolean} true 表示匹配任一斷點
   *
   * @example
   * ```typescript
   * if (breakpointService.matchAnyBreakpoint(['Small', 'Medium'])) {
   *   // 執行中小螢幕邏輯
   * }
   * ```
   */
  matchAnyBreakpoint(breakpoints: BreakpointName[]): boolean {
    const current = this._currentBreakpoint();
    return breakpoints.includes(current);
  }

  /**
   * 獲取當前螢幕寬度類別描述
   *
   * @returns {string} 螢幕寬度類別
   *
   * @example
   * ```typescript
   * console.log(breakpointService.getScreenSizeLabel());
   * // 輸出: "行動裝置" 或 "平板" 或 "桌面"
   * ```
   */
  getScreenSizeLabel(): string {
    if (this.isMobile()) return '行動裝置';
    if (this.isTablet()) return '平板';
    if (this.isDesktop()) return '桌面';
    return '未知';
  }

  /**
   * 獲取當前斷點的像素範圍描述
   *
   * @returns {string} 像素範圍描述
   *
   * @example
   * ```typescript
   * console.log(breakpointService.getPixelRangeLabel());
   * // 輸出: "< 600px" 或 "600px - 960px" 等
   * ```
   */
  getPixelRangeLabel(): string {
    const ranges: Record<BreakpointName, string> = {
      XSmall: '< 600px',
      Small: '600px - 960px',
      Medium: '960px - 1280px',
      Large: '1280px - 1920px',
      XLarge: '> 1920px',
      Unknown: '未知'
    };
    return ranges[this._currentBreakpoint()];
  }
}
