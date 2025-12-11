import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  Timestamp,
  CollectionReference,
  DocumentReference,
  QueryConstraint,
  arrayUnion,
  arrayRemove
} from '@angular/fire/firestore';
import { Observable, catchError, from, map, of } from 'rxjs';
import { LoggerService } from '@core';
import {
  Log,
  LogPhoto,
  CreateLogRequest,
  UpdateLogRequest,
  LogQueryOptions
} from '@core/types/log';

/**
 * Log Repository
 * 日誌 Repository
 * 
 * Following Occam's Razor: Simple, focused log operations
 * Integrates with Storage Repository for photo management
 */
@Injectable({
  providedIn: 'root'
})
export class LogRepository {
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);
  private readonly collectionName = 'logs';

  private getCollectionRef(): CollectionReference {
    return collection(this.firestore, this.collectionName);
  }

  private getDocRef(id: string): DocumentReference {
    return doc(this.firestore, this.collectionName, id);
  }

  private toLog(data: any, id: string): Log {
    return {
      id,
      blueprintId: data.blueprintId,
      date: data.date instanceof Timestamp ? data.date.toDate() : data.date,
      title: data.title,
      description: data.description,
      workHours: data.workHours,
      workers: data.workers,
      equipment: data.equipment,
      weather: data.weather,
      temperature: data.temperature,
      photos: (data.photos || []).map((photo: any) => ({
        ...photo,
        uploadedAt: photo.uploadedAt instanceof Timestamp ? photo.uploadedAt.toDate() : photo.uploadedAt
      })),
      creatorId: data.creatorId,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
      deletedAt: data.deletedAt
        ? data.deletedAt instanceof Timestamp
          ? data.deletedAt.toDate()
          : data.deletedAt
        : null,
      voiceRecords: data.voiceRecords || [],
      documents: data.documents || [],
      metadata: data.metadata || {}
    };
  }

  /**
   * Find log by ID
   * 根據 ID 查找日誌
   */
  findById(id: string): Observable<Log | null> {
    return from(getDoc(this.getDocRef(id))).pipe(
      map(snapshot => (snapshot.exists() ? this.toLog(snapshot.data(), snapshot.id) : null)),
      catchError(error => {
        this.logger.error('[LogRepository]', 'findById failed', error as Error);
        return of(null);
      })
    );
  }

  /**
   * Find logs by blueprint
   * 根據藍圖查找日誌
   */
  findByBlueprint(blueprintId: string, options?: LogQueryOptions): Observable<Log[]> {
    const constraints: QueryConstraint[] = [where('blueprintId', '==', blueprintId)];

    if (options?.startDate) {
      constraints.push(where('date', '>=', Timestamp.fromDate(options.startDate)));
    }

    if (options?.endDate) {
      constraints.push(where('date', '<=', Timestamp.fromDate(options.endDate)));
    }

    if (!options?.includeDeleted) {
      constraints.push(where('deletedAt', '==', null));
    }

    const q = query(this.getCollectionRef(), ...constraints);

    return from(getDocs(q)).pipe(
      map(snapshot => {
        const logs = snapshot.docs.map(docSnap => this.toLog(docSnap.data(), docSnap.id));
        // Sort in-memory by date descending
        return logs.sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateB - dateA;
        });
      }),
      catchError(error => {
        this.logger.error('[LogRepository]', 'findByBlueprint failed', error as Error);
        return of([]);
      })
    );
  }

  /**
   * Create a new log
   * 創建新日誌
   */
  async create(payload: CreateLogRequest): Promise<Log> {
    const now = Timestamp.now();
    const docData = {
      ...payload,
      date: Timestamp.fromDate(payload.date),
      photos: [],
      voiceRecords: [],
      documents: [],
      metadata: {},
      createdAt: now,
      updatedAt: now,
      deletedAt: null
    };

    try {
      const docRef = await addDoc(this.getCollectionRef(), docData);
      this.logger.info('[LogRepository]', `Log created with ID: ${docRef.id}`);

      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return this.toLog(snapshot.data(), snapshot.id);
      } else {
        return this.toLog(docData, docRef.id);
      }
    } catch (error: any) {
      this.logger.error('[LogRepository]', 'create failed', error as Error);
      throw error;
    }
  }

  /**
   * Update log
   * 更新日誌
   */
  async update(id: string, data: UpdateLogRequest): Promise<void> {
    const docData: any = {
      ...data,
      updatedAt: Timestamp.now()
    };

    if (data.date) {
      docData.date = Timestamp.fromDate(data.date);
    }

    try {
      await updateDoc(this.getDocRef(id), docData);
      this.logger.info('[LogRepository]', `Log updated: ${id}`);
    } catch (error: any) {
      this.logger.error('[LogRepository]', 'update failed', error as Error);
      throw error;
    }
  }

  /**
   * Add photo to log
   * 添加照片到日誌
   */
  async addPhoto(id: string, photo: LogPhoto): Promise<void> {
    try {
      await updateDoc(this.getDocRef(id), {
        photos: arrayUnion(photo),
        updatedAt: Timestamp.now()
      });
      this.logger.info('[LogRepository]', `Photo added to log: ${id}`);
    } catch (error: any) {
      this.logger.error('[LogRepository]', 'addPhoto failed', error as Error);
      throw error;
    }
  }

  /**
   * Remove photo from log
   * 從日誌移除照片
   */
  async removePhoto(id: string, photo: LogPhoto): Promise<void> {
    try {
      await updateDoc(this.getDocRef(id), {
        photos: arrayRemove(photo),
        updatedAt: Timestamp.now()
      });
      this.logger.info('[LogRepository]', `Photo removed from log: ${id}`);
    } catch (error: any) {
      this.logger.error('[LogRepository]', 'removePhoto failed', error as Error);
      throw error;
    }
  }

  /**
   * Soft delete log
   * 軟刪除日誌
   */
  async delete(id: string): Promise<void> {
    try {
      await updateDoc(this.getDocRef(id), {
        deletedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      this.logger.info('[LogRepository]', `Log soft deleted: ${id}`);
    } catch (error: any) {
      this.logger.error('[LogRepository]', 'soft delete failed', error as Error);
      throw error;
    }
  }

  /**
   * Hard delete log
   * 永久刪除日誌
   */
  async hardDelete(id: string): Promise<void> {
    try {
      await deleteDoc(this.getDocRef(id));
      this.logger.info('[LogRepository]', `Log hard deleted: ${id}`);
    } catch (error: any) {
      this.logger.error('[LogRepository]', 'hard delete failed', error as Error);
      throw error;
    }
  }
}
