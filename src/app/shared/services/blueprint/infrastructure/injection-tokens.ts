import { InjectionToken } from '@angular/core';
import { IBlueprintRepository, IBlueprintMemberRepository } from '../domain/repositories';

/**
 * Injection Tokens for Repository Interfaces
 * 倉儲介面的注入標記
 * 
 * Defines DI tokens for repository abstractions.
 * Allows swapping implementations without changing consumer code.
 * 
 * 定義倉儲抽象的 DI 標記。
 * 允許在不變更消費者程式碼的情況下替換實作。
 * 
 * @example
 * ```typescript
 * // In handler:
 * constructor(@Inject(BLUEPRINT_REPOSITORY_TOKEN) private repo: IBlueprintRepository) {}
 * 
 * // In providers:
 * {
 *   provide: BLUEPRINT_REPOSITORY_TOKEN,
 *   useClass: FirestoreBlueprintRepository
 * }
 * ```
 */

/**
 * Injection token for Blueprint Repository
 * 藍圖倉儲的注入標記
 */
export const BLUEPRINT_REPOSITORY_TOKEN = new InjectionToken<IBlueprintRepository>(
  'IBlueprintRepository',
  {
    providedIn: 'root',
    factory: () => {
      throw new Error(
        'BLUEPRINT_REPOSITORY_TOKEN must be provided in app config. ' +
        'Add { provide: BLUEPRINT_REPOSITORY_TOKEN, useClass: FirestoreBlueprintRepository } to providers.'
      );
    }
  }
);

/**
 * Injection token for Blueprint Member Repository
 * 藍圖成員倉儲的注入標記
 */
export const BLUEPRINT_MEMBER_REPOSITORY_TOKEN = new InjectionToken<IBlueprintMemberRepository>(
  'IBlueprintMemberRepository',
  {
    providedIn: 'root',
    factory: () => {
      throw new Error(
        'BLUEPRINT_MEMBER_REPOSITORY_TOKEN must be provided in app config. ' +
        'Add { provide: BLUEPRINT_MEMBER_REPOSITORY_TOKEN, useClass: FirestoreBlueprintMemberRepository } to providers.'
      );
    }
  }
);
