import { DomainEvent } from '../events';

/**
 * Aggregate Root Base Class
 * 聚合根基礎類別
 * 
 * Base class for all aggregates in the domain.
 * Provides event management functionality.
 * 
 * 領域中所有聚合的基礎類別。
 * 提供事件管理功能。
 */
export abstract class AggregateRoot {
  private domainEvents: DomainEvent[] = [];

  /**
   * Get all pending domain events
   * 取得所有待處理的領域事件
   */
  getEvents(): ReadonlyArray<DomainEvent> {
    return [...this.domainEvents];
  }

  /**
   * Add a domain event
   * 新增領域事件
   */
  protected addEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  /**
   * Clear all pending events
   * 清除所有待處理事件
   */
  clearEvents(): void {
    this.domainEvents = [];
  }

  /**
   * Get the number of pending events
   * 取得待處理事件數量
   */
  get eventCount(): number {
    return this.domainEvents.length;
  }
}
