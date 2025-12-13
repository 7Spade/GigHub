/**
 * Audit Log Repository
 *
 * Manages CRUD operations for audit log subcollection in Firestore.
 * Collection path: blueprints/{blueprintId}/audit-logs/{logId}
 *
 * @author GigHub Development Team
 * @date 2025-12-13
 */

import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  CollectionReference,
  QueryConstraint,
  QueryDocumentSnapshot
} from '@angular/fire/firestore';
import { LoggerService } from '@core';
import {
  AuditLogDocument,
  CreateAuditLogData,
  AuditLogQueryOptions,
  AuditLogSummary,
  AuditEventType,
  AuditCategory,
  AuditSeverity,
  AuditStatus
} from '../models/audit-log.model';
import { Observable, from, map, catchError, of } from 'rxjs';

/**
 * Pagination result for audit logs
 */
export interface AuditLogPage {
  logs: AuditLogDocument[];
  hasMore: boolean;
  lastDoc?: QueryDocumentSnapshot;
}

/**
 * Audit Log Repository Service
 *
 * Handles all Firestore operations for audit logs.
 * Implements efficient querying and pagination for large audit trails.
 */
@Injectable({
  providedIn: 'root'
})
export class AuditLogRepository {
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);
  private readonly parentCollection = 'blueprints';
  private readonly subcollectionName = 'audit-logs';

  /**
   * Get audit-logs subcollection reference
   */
  private getAuditLogsCollection(blueprintId: string): CollectionReference {
    return collection(this.firestore, this.parentCollection, blueprintId, this.subcollectionName);
  }

  /**
   * Convert Firestore data to AuditLogDocument
   */
  private toAuditLogDocument(data: any, id: string, blueprintId: string): AuditLogDocument {
    return {
      id,
      blueprintId,
      eventType: data.eventType,
      category: data.category,
      severity: data.severity,
      actorId: data.actorId,
      actorType: data.actorType,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      action: data.action,
      message: data.message,
      changes: data.changes || [],
      context: data.context || {},
      metadata: data.metadata || {},
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      requestId: data.requestId,
      timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : data.timestamp,
      status: data.status,
      error: data.error
    };
  }

  /**
   * Create a new audit log entry
   */
  async create(data: CreateAuditLogData): Promise<AuditLogDocument> {
    const docData = {
      ...data,
      timestamp: Timestamp.now(),
      metadata: data.metadata || {},
      context: data.context || {}
    };

    try {
      const docRef = await addDoc(this.getAuditLogsCollection(data.blueprintId), docData);

      // For audit logs, we don't read back - it's write-heavy
      return this.toAuditLogDocument(docData, docRef.id, data.blueprintId);
    } catch (error: any) {
      this.logger.error('[AuditLogRepository]', 'create failed', error as Error);
      throw error;
    }
  }

  /**
   * Batch create multiple audit log entries
   */
  async createBatch(logs: CreateAuditLogData[]): Promise<void> {
    try {
      const promises = logs.map(log => this.create(log));
      await Promise.all(promises);

      this.logger.info('[AuditLogRepository]', `Batch created ${logs.length} audit logs`);
    } catch (error: any) {
      this.logger.error('[AuditLogRepository]', 'createBatch failed', error as Error);
      throw error;
    }
  }

  /**
   * Find audit logs by blueprint ID with pagination
   */
  async findByBlueprintId(blueprintId: string, pageSize = 50, lastDoc?: QueryDocumentSnapshot): Promise<AuditLogPage> {
    const constraints: QueryConstraint[] = [
      orderBy('timestamp', 'desc'),
      limit(pageSize + 1) // Fetch one extra to check if there's more
    ];

    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    const q = query(this.getAuditLogsCollection(blueprintId), ...constraints);

    try {
      const snapshot = await getDocs(q);
      const logs = snapshot.docs.slice(0, pageSize).map(doc => this.toAuditLogDocument(doc.data(), doc.id, blueprintId));

      return {
        logs,
        hasMore: snapshot.docs.length > pageSize,
        lastDoc: snapshot.docs.length > 0 ? snapshot.docs[pageSize - 1] : undefined
      };
    } catch (error: any) {
      this.logger.error('[AuditLogRepository]', 'findByBlueprintId failed', error as Error);
      throw error;
    }
  }

  /**
   * Query audit logs with filters
   */
  async queryLogs(blueprintId: string, options: AuditLogQueryOptions): Promise<AuditLogDocument[]> {
    const constraints: QueryConstraint[] = [];

    // Apply filters
    if (options.eventType) {
      if (Array.isArray(options.eventType)) {
        // Note: Firestore doesn't support 'in' with arrays > 10 items
        // For simplicity, we'll filter the first event type
        constraints.push(where('eventType', '==', options.eventType[0]));
      } else {
        constraints.push(where('eventType', '==', options.eventType));
      }
    }

    if (options.category) {
      constraints.push(where('category', '==', options.category));
    }

    if (options.severity) {
      constraints.push(where('severity', '==', options.severity));
    }

    if (options.actorId) {
      constraints.push(where('actorId', '==', options.actorId));
    }

    if (options.resourceType) {
      constraints.push(where('resourceType', '==', options.resourceType));
    }

    if (options.resourceId) {
      constraints.push(where('resourceId', '==', options.resourceId));
    }

    if (options.status) {
      constraints.push(where('status', '==', options.status));
    }

    // Date range filter (requires composite index)
    if (options.startDate) {
      constraints.push(where('timestamp', '>=', Timestamp.fromDate(options.startDate)));
    }

    if (options.endDate) {
      constraints.push(where('timestamp', '<=', Timestamp.fromDate(options.endDate)));
    }

    // Order and limit
    constraints.push(orderBy('timestamp', options.sortOrder || 'desc'));

    if (options.limit) {
      constraints.push(limit(options.limit));
    }

    const q = query(this.getAuditLogsCollection(blueprintId), ...constraints);

    try {
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => this.toAuditLogDocument(doc.data(), doc.id, blueprintId));
    } catch (error: any) {
      this.logger.error('[AuditLogRepository]', 'queryLogs failed', error as Error);
      throw error;
    }
  }

  /**
   * Find logs by event type
   */
  findByEventType(blueprintId: string, eventType: AuditEventType, limitCount = 100): Observable<AuditLogDocument[]> {
    const q = query(
      this.getAuditLogsCollection(blueprintId),
      where('eventType', '==', eventType),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(doc => this.toAuditLogDocument(doc.data(), doc.id, blueprintId))),
      catchError(error => {
        this.logger.error('[AuditLogRepository]', 'findByEventType failed', error as Error);
        return of([]);
      })
    );
  }

  /**
   * Find logs by category
   */
  findByCategory(blueprintId: string, category: AuditCategory, limitCount = 100): Observable<AuditLogDocument[]> {
    const q = query(
      this.getAuditLogsCollection(blueprintId),
      where('category', '==', category),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(doc => this.toAuditLogDocument(doc.data(), doc.id, blueprintId))),
      catchError(error => {
        this.logger.error('[AuditLogRepository]', 'findByCategory failed', error as Error);
        return of([]);
      })
    );
  }

  /**
   * Find recent error logs
   */
  findRecentErrors(blueprintId: string, limitCount = 20): Observable<AuditLogDocument[]> {
    const q = query(
      this.getAuditLogsCollection(blueprintId),
      where('status', '==', AuditStatus.FAILED),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(doc => this.toAuditLogDocument(doc.data(), doc.id, blueprintId))),
      catchError(error => {
        this.logger.error('[AuditLogRepository]', 'findRecentErrors failed', error as Error);
        return of([]);
      })
    );
  }

  /**
   * Get audit log summary statistics
   */
  async getSummary(blueprintId: string, startDate?: Date, endDate?: Date): Promise<AuditLogSummary> {
    const constraints: QueryConstraint[] = [];

    if (startDate) {
      constraints.push(where('timestamp', '>=', Timestamp.fromDate(startDate)));
    }

    if (endDate) {
      constraints.push(where('timestamp', '<=', Timestamp.fromDate(endDate)));
    }

    const q = query(this.getAuditLogsCollection(blueprintId), ...constraints);

    try {
      const snapshot = await getDocs(q);

      const summary: AuditLogSummary = {
        total: snapshot.size,
        byCategory: {} as Record<AuditCategory, number>,
        bySeverity: {} as Record<AuditSeverity, number>,
        byStatus: {} as Record<AuditStatus, number>,
        recentErrors: 0,
        timeRange: {
          start: startDate || new Date(0),
          end: endDate || new Date()
        }
      };

      // Initialize counts
      Object.values(AuditCategory).forEach(cat => {
        summary.byCategory[cat] = 0;
      });
      Object.values(AuditSeverity).forEach(sev => {
        summary.bySeverity[sev] = 0;
      });
      Object.values(AuditStatus).forEach(status => {
        summary.byStatus[status] = 0;
      });

      // Count by category, severity, and status
      snapshot.docs.forEach(doc => {
        const data = doc.data();

        if (data['category']) {
          summary.byCategory[data['category'] as AuditCategory]++;
        }

        if (data['severity']) {
          summary.bySeverity[data['severity'] as AuditSeverity]++;
        }

        if (data['status']) {
          summary.byStatus[data['status'] as AuditStatus]++;
        }

        // Count recent errors (last 24 hours)
        if (data['status'] === AuditStatus.FAILED) {
          const timestamp = data['timestamp'];
          const logDate = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
          const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

          if (logDate >= dayAgo) {
            summary.recentErrors++;
          }
        }
      });

      return summary;
    } catch (error: any) {
      this.logger.error('[AuditLogRepository]', 'getSummary failed', error as Error);
      throw error;
    }
  }

  /**
   * Find log by ID
   */
  findById(blueprintId: string, logId: string): Observable<AuditLogDocument | null> {
    return from(getDoc(doc(this.firestore, this.parentCollection, blueprintId, this.subcollectionName, logId))).pipe(
      map(snapshot => (snapshot.exists() ? this.toAuditLogDocument(snapshot.data(), snapshot.id, blueprintId) : null)),
      catchError(error => {
        this.logger.error('[AuditLogRepository]', 'findById failed', error as Error);
        return of(null);
      })
    );
  }
}
