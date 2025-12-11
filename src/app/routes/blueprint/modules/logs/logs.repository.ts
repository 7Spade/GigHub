/**
 * Logs Repository
 * 
 * Data access layer for log management with Firestore.
 * Collection path: blueprints/{blueprintId}/logs/{logId}
 * 
 * @author GigHub Development Team
 * @date 2025-12-11
 */

import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  CollectionReference,
  QueryConstraint
} from '@angular/fire/firestore';
import { Observable, from, map, catchError, of } from 'rxjs';
import { LoggerService } from '@core/services/logger.service';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL'
}

export enum LogCategory {
  SYSTEM = 'system',
  USER = 'user',
  API = 'api',
  DATABASE = 'database',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  ERROR_HANDLING = 'error'
}

export interface LogDocument {
  readonly id?: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  source?: string;
  userId?: string;
  userName?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date | Timestamp;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export interface CreateLogData {
  level: LogLevel;
  category: LogCategory;
  message: string;
  source?: string;
  userId?: string;
  userName?: string;
  metadata?: Record<string, unknown>;
}

export type UpdateLogData = Partial<Omit<LogDocument, 'id' | 'createdAt'>>;

export interface LogQueryOptions {
  level?: LogLevel;
  category?: LogCategory;
  source?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  searchText?: string;
  limit?: number;
}

@Injectable({
  providedIn: 'root'
})
export class LogsRepository {
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);

  private getCollection(blueprintId: string): CollectionReference {
    return collection(this.firestore, `blueprints/${blueprintId}/logs`) as CollectionReference;
  }

  findByBlueprintId(blueprintId: string): Observable<LogDocument[]> {
    try {
      const logsCollection = this.getCollection(blueprintId);
      const q = query(logsCollection, orderBy('createdAt', 'desc'), limit(1000));

      return from(getDocs(q)).pipe(
        map(snapshot => 
          snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data()['timestamp']?.toDate() || new Date(),
            createdAt: doc.data()['createdAt']?.toDate() || new Date(),
            updatedAt: doc.data()['updatedAt']?.toDate() || new Date()
          } as LogDocument))
        ),
        catchError(err => {
          this.logger.error('Failed to fetch logs', err);
          return of([]);
        })
      );
    } catch (err) {
      this.logger.error('Error setting up logs query', err);
      return of([]);
    }
  }

  async create(blueprintId: string, data: CreateLogData): Promise<LogDocument> {
    try {
      const now = Timestamp.now();
      const logData = {
        ...data,
        timestamp: now,
        createdAt: now,
        updatedAt: now
      };

      const logsCollection = this.getCollection(blueprintId);
      const docRef = await addDoc(logsCollection, logData);

      return {
        id: docRef.id,
        ...logData,
        timestamp: now.toDate(),
        createdAt: now.toDate(),
        updatedAt: now.toDate()
      } as LogDocument;
    } catch (err) {
      this.logger.error('Failed to create log', err);
      throw err;
    }
  }

  async delete(blueprintId: string, logId: string): Promise<void> {
    try {
      const logDoc = doc(this.getCollection(blueprintId), logId);
      await deleteDoc(logDoc);
    } catch (err) {
      this.logger.error(`Failed to delete log ${logId}`, err);
      throw err;
    }
  }

  async queryLogs(blueprintId: string, options: LogQueryOptions): Promise<LogDocument[]> {
    try {
      const constraints: QueryConstraint[] = [];

      if (options.level) constraints.push(where('level', '==', options.level));
      if (options.category) constraints.push(where('category', '==', options.category));
      if (options.source) constraints.push(where('source', '==', options.source));
      if (options.userId) constraints.push(where('userId', '==', options.userId));
      if (options.startDate) constraints.push(where('timestamp', '>=', Timestamp.fromDate(options.startDate)));
      if (options.endDate) constraints.push(where('timestamp', '<=', Timestamp.fromDate(options.endDate)));

      constraints.push(orderBy('timestamp', 'desc'));
      if (options.limit) constraints.push(limit(options.limit));

      const logsCollection = this.getCollection(blueprintId);
      const q = query(logsCollection, ...constraints);
      const snapshot = await getDocs(q);

      let results = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data()['timestamp']?.toDate() || new Date(),
        createdAt: doc.data()['createdAt']?.toDate() || new Date(),
        updatedAt: doc.data()['updatedAt']?.toDate() || new Date()
      } as LogDocument));

      if (options.searchText) {
        const searchLower = options.searchText.toLowerCase();
        results = results.filter(log => log.message.toLowerCase().includes(searchLower));
      }

      return results;
    } catch (err) {
      this.logger.error('Failed to query logs', err);
      throw err;
    }
  }
}
