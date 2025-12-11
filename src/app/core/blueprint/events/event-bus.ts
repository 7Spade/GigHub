import { Injectable, signal, WritableSignal } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

import type { IBlueprintEvent, IEventBus, EventHandler } from './event-bus.interface';

/**
 * Event Bus Implementation
 *
 * Provides a centralized publish-subscribe mechanism for zero-coupling module communication.
 * Uses RxJS Subject for event streaming and Angular Signals for reactive state management.
 *
 * Features:
 * - Type-safe event emission and subscription
 * - Complete event history for auditing
 * - Once-only subscriptions
 * - Automatic cleanup
 * - Performance monitoring
 *
 * @example
 * ```typescript
 * // Inject the event bus
 * private eventBus = inject(EventBus);
 *
 * // Emit an event
 * this.eventBus.emit('TASK_CREATED', { taskId: '123' }, 'tasks-module');
 *
 * // Subscribe to events
 * const unsubscribe = this.eventBus.on('TASK_CREATED', (event) => {
 *   console.log('Task created:', event.payload);
 * });
 *
 * // Cleanup
 * unsubscribe();
 * ```
 */
@Injectable({ providedIn: 'root' })
export class EventBus implements IEventBus {
  /**
   * Internal RxJS Subject for event streaming
   * All events flow through this central Subject
   */
  private readonly eventSubject = new Subject<IBlueprintEvent>();

  /**
   * Event history store
   * Maintains a complete audit trail of all events
   */
  private readonly history: IBlueprintEvent[] = [];

  /**
   * Maximum number of events to keep in history
   * Prevents memory issues with long-running applications
   */
  private readonly maxHistorySize = 1000;

  /**
   * Event counter for generating unique IDs
   */
  private eventCounter = 0;

  /**
   * Execution context for events
   * Set by the Blueprint Container during initialization
   */
  private blueprintId = '';
  private userId = '';

  /**
   * Active subscriptions tracking
   * Useful for debugging and monitoring
   */
  private readonly subscriptions = new Map<string, Set<Subscription>>();

  /**
   * Handler to Subscription mapping
   * Enables precise handler removal via off() method
   * Maps: event type -> (handler -> subscription)
   */
  private readonly handlerMap = new Map<string, Map<EventHandler<any>, Subscription>>();

  /**
   * Event emission count signal
   * Reactive counter for monitoring event activity
   */
  public readonly eventCount: WritableSignal<number> = signal(0);

  /**
   * Initialize the event bus with context
   * Called by Blueprint Container during setup
   *
   * @param blueprintId - ID of the blueprint instance
   * @param userId - ID of the current user
   */
  initialize(blueprintId: string, userId: string): void {
    this.blueprintId = blueprintId;
    this.userId = userId;
  }

  /**
   * Emit an event
   *
   * Publishes an event to all subscribed listeners.
   * Automatically adds metadata and stores in history.
   *
   * @param type - Event type identifier
   * @param payload - Event data
   * @param source - ID of the module emitting the event
   */
  emit<T>(type: string, payload: T, source: string): void {
    const event: IBlueprintEvent<T> = {
      type,
      payload,
      timestamp: Date.now(),
      source,
      context: {
        blueprintId: this.blueprintId,
        userId: this.userId
      },
      id: this.generateEventId()
    };

    // Add to history
    this.addToHistory(event);

    // Emit through Subject
    this.eventSubject.next(event);

    // Update counter
    this.eventCount.update(count => count + 1);
  }

  /**
   * Subscribe to an event
   *
   * Registers a handler to be called when events of the specified type are emitted.
   * Returns an unsubscribe function for cleanup.
   *
   * @param type - Event type to subscribe to
   * @param handler - Function to call when event occurs
   * @returns Unsubscribe function
   */
  on<T>(type: string, handler: EventHandler<T>): () => void {
    const subscription = this.eventSubject.pipe(filter(event => event.type === type)).subscribe(async event => {
      try {
        await handler(event as IBlueprintEvent<T>);
      } catch (error) {
        console.error(`[EventBus] Error in handler for event "${type}":`, error);
      }
    });

    // Track subscription (legacy tracking)
    this.trackSubscription(type, subscription);

    // Store handler-to-subscription mapping for precise removal
    if (!this.handlerMap.has(type)) {
      this.handlerMap.set(type, new Map());
    }
    this.handlerMap.get(type)!.set(handler, subscription);

    // Return unsubscribe function
    return () => {
      subscription.unsubscribe();
      this.untrackSubscription(type, subscription);
      // Remove from handler map
      this.handlerMap.get(type)?.delete(handler);
      if (this.handlerMap.get(type)?.size === 0) {
        this.handlerMap.delete(type);
      }
    };
  }

  /**
   * Unsubscribe from an event
   *
   * Removes a previously registered event handler.
   * This method now uses the handler map for precise subscription removal.
   *
   * @param type - Event type
   * @param handler - Handler function to remove
   */
  off<T>(type: string, handler: EventHandler<T>): void {
    const handlers = this.handlerMap.get(type);
    if (!handlers) return;

    const subscription = handlers.get(handler);
    if (subscription) {
      // Unsubscribe the specific handler
      subscription.unsubscribe();
      
      // Remove from handler map
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlerMap.delete(type);
      }

      // Also remove from legacy subscription tracking
      this.untrackSubscription(type, subscription);
    }
  }

  /**
   * Subscribe to an event once
   *
   * Handler will be called only for the first occurrence of the event,
   * then automatically unsubscribed.
   *
   * @param type - Event type to subscribe to
   * @param handler - Function to call when event occurs
   * @returns Unsubscribe function (in case you want to cancel before it fires)
   */
  once<T>(type: string, handler: EventHandler<T>): () => void {
    let unsubscribe: (() => void) | null = null;
    let called = false;

    const wrappedHandler: EventHandler<T> = async event => {
      // Guard against multiple calls
      if (called) return;
      called = true;

      // Unsubscribe immediately to prevent queued events
      if (unsubscribe) {
        unsubscribe();
      }

      // Call the original handler
      await handler(event);
    };

    unsubscribe = this.on(type, wrappedHandler);
    return unsubscribe;
  }

  /**
   * Get event history
   *
   * Retrieves past events for auditing or replay.
   *
   * @param type - Optional: Filter by event type
   * @param limit - Maximum number of events to return (default: 100)
   * @returns Array of historical events
   */
  getHistory(type?: string, limit = 100): IBlueprintEvent[] {
    let events = this.history;

    // Filter by type if specified
    if (type) {
      events = events.filter(event => event.type === type);
    }

    // Return most recent events up to limit
    return events.slice(-limit);
  }

  /**
   * Clear event history
   *
   * Removes all events from history.
   * Useful for testing or memory management.
   */
  clearHistory(): void {
    this.history.length = 0;
  }

  /**
   * Get subscription count for an event type
   *
   * @param type - Event type
   * @returns Number of active subscriptions
   */
  getSubscriptionCount(type: string): number {
    return this.subscriptions.get(type)?.size ?? 0;
  }

  /**
   * Get all active event types
   *
   * @returns Array of event types that have active subscriptions
   */
  getActiveEventTypes(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  /**
   * Dispose of the event bus
   *
   * Unsubscribes all handlers and clears history.
   * Should be called when the blueprint is being destroyed.
   */
  dispose(): void {
    // Unsubscribe all via handler map (more reliable)
    this.handlerMap.forEach(handlers => {
      handlers.forEach(subscription => subscription.unsubscribe());
    });
    this.handlerMap.clear();

    // Unsubscribe all via legacy tracking (backup)
    this.subscriptions.forEach(subs => {
      subs.forEach(sub => sub.unsubscribe());
    });
    this.subscriptions.clear();

    // Clear history
    this.clearHistory();

    // Complete the Subject
    this.eventSubject.complete();

    // Reset counter
    this.eventCount.set(0);
  }

  /**
   * Generate a unique event ID
   *
   * @returns Unique event identifier
   */
  private generateEventId(): string {
    return `${Date.now()}-${++this.eventCounter}`;
  }

  /**
   * Add event to history
   *
   * Maintains a circular buffer of events with max size limit.
   *
   * @param event - Event to add to history
   */
  private addToHistory(event: IBlueprintEvent): void {
    this.history.push(event);

    // Maintain max size by removing oldest events
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  /**
   * Track a subscription
   *
   * @param type - Event type
   * @param subscription - RxJS subscription to track
   */
  private trackSubscription(type: string, subscription: Subscription): void {
    if (!this.subscriptions.has(type)) {
      this.subscriptions.set(type, new Set());
    }
    this.subscriptions.get(type)!.add(subscription);
  }

  /**
   * Untrack a subscription
   *
   * @param type - Event type
   * @param subscription - RxJS subscription to untrack
   */
  private untrackSubscription(type: string, subscription: Subscription): void {
    const subs = this.subscriptions.get(type);
    if (subs) {
      subs.delete(subscription);
      if (subs.size === 0) {
        this.subscriptions.delete(type);
      }
    }
  }
}
