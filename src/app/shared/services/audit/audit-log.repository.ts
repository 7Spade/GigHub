import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  where,
  Timestamp,
  QueryConstraint
} from '@angular/fire/firestore';
import { Observable, from, map } from 'rxjs';
import { AuditLog, AuditQueryOptions } from '@core';

@Injectable({
  providedIn: 'root'
})
export class AuditLogRepository {
  private readonly firestore = inject(Firestore);

  private getAuditCollection(blueprintId: string) {
    return collection(this.firestore, 'blueprints', blueprintId, 'auditLogs');
  }

  private toAuditLog(data: any, id: string): AuditLog {
    return {
      id,
      ...data,
      timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : data.timestamp
    };
  }

  async createLog(blueprintId: string, log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    await addDoc(this.getAuditCollection(blueprintId), {
      ...log,
      timestamp: Timestamp.now()
    });
  }

  queryLogs(blueprintId: string, options: AuditQueryOptions): Observable<AuditLog[]> {
    const constraints: QueryConstraint[] = [orderBy('timestamp', 'desc')];

    if (options.entityType) constraints.push(where('entityType', '==', options.entityType));
    if (options.operation) constraints.push(where('operation', '==', options.operation));
    if (options.userId) constraints.push(where('userId', '==', options.userId));
    if (options.from) constraints.push(where('timestamp', '>=', options.from));
    if (options.to) constraints.push(where('timestamp', '<=', options.to));

    const q = query(this.getAuditCollection(blueprintId), ...constraints);

    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(docSnap => this.toAuditLog(docSnap.data(), docSnap.id)))
    );
  }
}
