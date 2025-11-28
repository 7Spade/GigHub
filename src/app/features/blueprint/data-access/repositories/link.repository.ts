/**
 * Link Repository
 *
 * Repository for Link data access layer
 * Following vertical slice architecture
 *
 * @module features/blueprint/data-access/repositories/link.repository
 */

import { Injectable } from '@angular/core';
import { BaseRepository, QueryOptions } from '@core';
import { Observable, map } from 'rxjs';

import { Link, LinkInsert, LinkUpdate } from '../../domain';

/**
 * Link Repository
 *
 * Handles data access for external links
 */
@Injectable({ providedIn: 'root' })
export class LinkRepository extends BaseRepository<Link, LinkInsert, LinkUpdate> {
  protected tableName = 'links';

  /**
   * Find links by blueprint
   *
   * @param {string} blueprintId - Blueprint ID
   * @param {QueryOptions} [options] - Query options
   * @returns {Observable<Link[]>} Array of links
   */
  findByBlueprint(blueprintId: string, options?: QueryOptions): Observable<Link[]> {
    return this.findAll({
      ...options,
      filters: {
        ...options?.filters,
        blueprintId
      },
      order: { column: 'sortOrder', ascending: true }
    });
  }

  /**
   * Find links by category
   *
   * @param {string} blueprintId - Blueprint ID
   * @param {string} category - Link category
   * @returns {Observable<Link[]>} Array of links
   */
  findByCategory(blueprintId: string, category: string): Observable<Link[]> {
    return this.findAll({
      filters: {
        blueprintId,
        category
      },
      order: { column: 'sortOrder', ascending: true }
    });
  }

  /**
   * Search links by title or URL
   *
   * @param {string} blueprintId - Blueprint ID
   * @param {string} searchTerm - Search term
   * @returns {Observable<Link[]>} Array of matching links
   */
  searchLinks(blueprintId: string, searchTerm: string): Observable<Link[]> {
    return this.findByBlueprint(blueprintId).pipe(
      map(links => links.filter(link =>
        link.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        link.url.toLowerCase().includes(searchTerm.toLowerCase())
      ))
    );
  }

  /**
   * Find invalid links
   *
   * @param {string} blueprintId - Blueprint ID
   * @returns {Observable<Link[]>} Array of invalid links
   */
  findInvalidLinks(blueprintId: string): Observable<Link[]> {
    return this.findAll({
      filters: {
        blueprintId,
        isValid: false
      }
    });
  }
}
