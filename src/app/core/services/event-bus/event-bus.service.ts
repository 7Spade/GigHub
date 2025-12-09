import { Injectable, inject } from '@angular/core';
import { Subject, Observable, filter } from 'rxjs';
import { LoggerService } from '../logger/logger.service';

/**
 * Base Domain Event
 * 基礎領域事件
 */
export interface DomainEvent {
  readonly type: string;
  readonly aggregateId: string;
  readonly occurredAt: Date;
  readonly userId?: string;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Event Bus Service
 * 事件匯流排服務
 * 
 * Centralized event management for domain events.
 * Enables loose coupling between modules through event-driven architecture.
 * 
 * 集中式事件管理服務，用於領域事件。
 * 透過事件驅動架構實現模組間的鬆耦合。
 */
@Injectable({
  providedIn: 'root'
})
export class EventBusService {
  private readonly logger = inject(LoggerService);
  private readonly eventSubject = new Subject<DomainEvent>();

  /**
   * Publish a domain event
   * 發布領域事件
   * 
   * @param event The domain event to publish
   */
  publish(event: DomainEvent): void {
    try {
      this.logger.debug('[EventBus]', `Publishing event: ${event.type}`, {
        aggregateId: event.aggregateId,
        occurredAt: event.occurredAt
      });
      
      this.eventSubject.next(event);
    } catch (error) {
      this.logger.error('[EventBus]', 'Failed to publish event', error as Error);
      throw error;
    }
  }

  /**
   * Subscribe to all events
   * 訂閱所有事件
   * 
   * @returns Observable of all domain events
   */
  events$(): Observable<DomainEvent> {
    return this.eventSubject.asObservable();
  }

  /**
   * Subscribe to specific event type
   * 訂閱特定類型事件
   * 
   * @param eventType The event type to filter
   * @returns Observable of filtered events
   */
  ofType<T extends DomainEvent>(eventType: string): Observable<T> {
    return this.eventSubject.asObservable().pipe(
      filter((event): event is T => event.type === eventType)
    );
  }

  /**
   * Subscribe to events from specific aggregate
   * 訂閱特定聚合的事件
   * 
   * @param aggregateId The aggregate ID to filter
   * @returns Observable of filtered events
   */
  fromAggregate(aggregateId: string): Observable<DomainEvent> {
    return this.eventSubject.asObservable().pipe(
      filter(event => event.aggregateId === aggregateId)
    );
  }

  /**
   * Subscribe to multiple event types
   * 訂閱多個事件類型
   * 
   * @param eventTypes Array of event types to filter
   * @returns Observable of filtered events
   */
  ofTypes(eventTypes: string[]): Observable<DomainEvent> {
    return this.eventSubject.asObservable().pipe(
      filter(event => eventTypes.includes(event.type))
    );
  }
}
