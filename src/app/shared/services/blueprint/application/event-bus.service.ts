import { Injectable, inject, signal } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LoggerService } from '@core';
import { DomainEvent } from '../domain/events';

/**
 * Event Bus Service
 * 
 * Central message bus for domain events using RxJS + Signals.
 * Follows pub/sub pattern for decoupled inter-module communication.
 * 
 * @example
 * ```typescript
 * // Publishing an event
 * eventBus.publish({
 *   eventType: 'BlueprintCreated',
 *   occurredOn: new Date(),
 *   aggregateId: blueprint.id,
 *   data: { ...blueprint }
 * });
 * 
 * // Subscribing to events
 * eventBus.on('BlueprintCreated').subscribe(event => {
 *   console.log('Blueprint created:', event.data);
 * });
 * ```
 */
@Injectable({ providedIn: 'root' })
export class EventBus {
  private readonly logger = inject(LoggerService);
  private readonly eventStream$ = new Subject<DomainEvent>();
  
  // Track event history with Signals
  private readonly _eventHistory = signal<DomainEvent[]>([]);
  private readonly _eventCount = signal(0);
  
  /**
   * Get read-only event history (last 100 events)
   */
  get eventHistory() {
    return this._eventHistory.asReadonly();
  }
  
  /**
   * Get total event count
   */
  get eventCount() {
    return this._eventCount.asReadonly();
  }

  /**
   * Publish a domain event
   */
  publish(event: DomainEvent): void {
    try {
      this.logger.debug('[EventBus]', `Publishing event: ${event.eventType}`, event);
      
      // Emit to stream
      this.eventStream$.next(event);
      
      // Update history (keep last 100 events)
      this._eventHistory.update(history => {
        const newHistory = [...history, event];
        return newHistory.slice(-100);
      });
      
      // Update count
      this._eventCount.update(count => count + 1);
      
      this.logger.info('[EventBus]', `Event published: ${event.eventType}`, {
        aggregateId: event.aggregateId,
        eventType: event.eventType
      });
    } catch (error) {
      this.logger.error('[EventBus]', `Failed to publish event: ${event.eventType}`, error as Error);
      throw error;
    }
  }

  /**
   * Subscribe to specific event type
   */
  on<T extends DomainEvent>(eventType: string): Observable<T> {
    return this.eventStream$.pipe(
      filter(event => event.eventType === eventType)
    ) as Observable<T>;
  }

  /**
   * Subscribe to all events
   */
  onAll(): Observable<DomainEvent> {
    return this.eventStream$.asObservable();
  }

  /**
   * Clear event history (for testing/debugging)
   */
  clearHistory(): void {
    this._eventHistory.set([]);
    this._eventCount.set(0);
    this.logger.debug('[EventBus]', 'Event history cleared');
  }
}
