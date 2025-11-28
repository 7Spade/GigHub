/**
 * Link Store
 *
 * Signal-based state management for link module
 *
 * @module features/blueprint/data-access/stores/link.store
 */

import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { Link, LinkInsert, LinkUpdate } from '../../domain';
import { LinkCategoryEnum } from '../../domain/enums';
import { LinkRepository } from '../repositories';

/**
 * Link Store
 *
 * Manages external link state
 */
@Injectable({ providedIn: 'root' })
export class LinkStore {
  private readonly repository = inject(LinkRepository);

  // Private state signals
  private readonly _links = signal<Link[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // Public readonly state
  readonly links = this._links.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed signals
  readonly linksByCategory = computed(() => {
    const links = this._links();
    return Object.values(LinkCategoryEnum).reduce((acc, category) => {
      acc[category] = links.filter(l => l.category === category);
      return acc;
    }, {} as Record<LinkCategoryEnum, Link[]>);
  });

  readonly invalidLinks = computed(() =>
    this._links().filter(l => !l.is_valid)
  );

  readonly statistics = computed(() => {
    const links = this._links();
    return {
      total: links.length,
      valid: links.filter(l => l.is_valid).length,
      invalid: links.filter(l => !l.is_valid).length,
      byCategory: Object.values(LinkCategoryEnum).reduce((acc, category) => {
        acc[category] = links.filter(l => l.category === category).length;
        return acc;
      }, {} as Record<LinkCategoryEnum, number>)
    };
  });

  /**
   * Load links for a blueprint
   */
  async loadLinks(blueprintId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const links = await firstValueFrom(
        this.repository.findByBlueprint(blueprintId)
      );
      this._links.set(links);
    } catch (err) {
      this._error.set('載入連結失敗');
      console.error('[LinkStore] loadLinks error:', err);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Create a link
   */
  async createLink(data: LinkInsert): Promise<Link | null> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const link = await firstValueFrom(this.repository.create(data));
      this._links.update(links => [...links, link]);
      return link;
    } catch (err) {
      this._error.set('建立連結失敗');
      console.error('[LinkStore] createLink error:', err);
      return null;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Update a link
   */
  async updateLink(id: string, data: LinkUpdate): Promise<Link | null> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const link = await firstValueFrom(this.repository.update(id, data));
      this._links.update(links =>
        links.map(l => l.id === id ? link : l)
      );
      return link;
    } catch (err) {
      this._error.set('更新連結失敗');
      console.error('[LinkStore] updateLink error:', err);
      return null;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Delete a link
   */
  async deleteLink(id: string): Promise<boolean> {
    this._loading.set(true);
    this._error.set(null);

    try {
      await firstValueFrom(this.repository.delete(id));
      this._links.update(links => links.filter(l => l.id !== id));
      return true;
    } catch (err) {
      this._error.set('刪除連結失敗');
      console.error('[LinkStore] deleteLink error:', err);
      return false;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Reorder links
   */
  async reorderLinks(linkIds: string[]): Promise<void> {
    const updates = linkIds.map((id, index) => ({
      id,
      sort_order: index
    }));

    for (const { id, sort_order } of updates) {
      await this.updateLink(id, { sort_order });
    }
  }

  /**
   * Search links
   */
  async searchLinks(blueprintId: string, term: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const links = await firstValueFrom(
        this.repository.searchLinks(blueprintId, term)
      );
      this._links.set(links);
    } catch (err) {
      this._error.set('搜尋失敗');
      console.error('[LinkStore] searchLinks error:', err);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Reset store state
   */
  reset(): void {
    this._links.set([]);
    this._loading.set(false);
    this._error.set(null);
  }
}
