import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  updateDoc,
  where,
  Timestamp,
  CollectionReference,
  DocumentReference,
  QueryConstraint,
  getCountFromServer
} from '@angular/fire/firestore';
import { Observable, catchError, from, map, of } from 'rxjs';
import { Blueprint, BlueprintQueryOptions, BlueprintStatus, OwnerType, LoggerService } from '@core';
import { IBlueprintRepository } from '../../domain/repositories';

/**
 * Firestore Blueprint Repository Implementation
 * Firestore 藍圖倉儲實作
 * 
 * Implements IBlueprintRepository using Firestore as the backend.
 * 使用 Firestore 作為後端實作 IBlueprintRepository。
 */
@Injectable({
  providedIn: 'root'
})
export class FirestoreBlueprintRepository implements IBlueprintRepository {
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);
  private readonly collectionName = 'blueprints';

  private getCollectionRef(): CollectionReference {
    return collection(this.firestore, this.collectionName);
  }

  private getDocRef(id: string): DocumentReference {
    return doc(this.firestore, this.collectionName, id);
  }

  private toBlueprint(data: any, id: string): Blueprint {
    return {
      id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      coverUrl: data.coverUrl,
      ownerId: data.ownerId,
      ownerType: data.ownerType,
      isPublic: data.isPublic,
      status: data.status,
      enabledModules: data.enabledModules || [],
      metadata: data.metadata || {},
      createdBy: data.createdBy,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
      deletedAt: data.deletedAt
        ? data.deletedAt instanceof Timestamp
          ? data.deletedAt.toDate()
          : data.deletedAt
        : null
    };
  }

  findById(id: string): Observable<Blueprint | null> {
    return from(getDoc(this.getDocRef(id))).pipe(
      map(snapshot => (snapshot.exists() ? this.toBlueprint(snapshot.data(), snapshot.id) : null)),
      catchError(error => {
        this.logger.error('[FirestoreBlueprintRepository]', 'findById failed', error as Error);
        return of(null);
      })
    );
  }

  findByOwner(ownerType: OwnerType, ownerId: string, options?: { limit?: number }): Observable<Blueprint[]> {
    const constraints: QueryConstraint[] = [
      where('ownerType', '==', ownerType),
      where('ownerId', '==', ownerId),
      where('deletedAt', '==', null)
    ];

    if (options?.limit) {
      constraints.push(limit(options.limit));
    }

    const q = query(this.getCollectionRef(), ...constraints);

    return from(getDocs(q)).pipe(
      map(snapshot => {
        const blueprints = snapshot.docs.map(docSnap => this.toBlueprint(docSnap.data(), docSnap.id));
        // Sort in-memory by createdAt descending
        return blueprints.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA;
        });
      }),
      catchError(error => {
        this.logger.error('[FirestoreBlueprintRepository]', 'findByOwner failed', error as Error);
        return of([]);
      })
    );
  }

  query(options: BlueprintQueryOptions): Observable<Blueprint[]> {
    const constraints: QueryConstraint[] = [];

    if (options.ownerId) constraints.push(where('ownerId', '==', options.ownerId));
    if (options.ownerType) constraints.push(where('ownerType', '==', options.ownerType));
    if (options.status) constraints.push(where('status', '==', options.status));
    if (options.isPublic !== undefined) constraints.push(where('isPublic', '==', options.isPublic));
    if (!options.includeDeleted) constraints.push(where('deletedAt', '==', null));

    const q = query(this.getCollectionRef(), ...constraints);

    return from(getDocs(q)).pipe(
      map(snapshot => {
        const blueprints = snapshot.docs.map(docSnap => this.toBlueprint(docSnap.data(), docSnap.id));
        // Sort in-memory by createdAt descending
        return blueprints.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA;
        });
      }),
      catchError(error => {
        this.logger.error('[FirestoreBlueprintRepository]', 'query failed', error as Error);
        return of([]);
      })
    );
  }

  async create(blueprint: Omit<Blueprint, 'id'>): Promise<Blueprint> {
    const now = Timestamp.now();
    const docData = {
      ...blueprint,
      createdAt: now,
      updatedAt: now,
      deletedAt: null
    };

    try {
      const docRef = await addDoc(this.getCollectionRef(), docData);
      const snapshot = await getDoc(docRef);
      
      if (snapshot.exists()) {
        return this.toBlueprint(snapshot.data(), snapshot.id);
      } else {
        // Fallback: return locally created data
        return this.toBlueprint(docData, docRef.id);
      }
    } catch (error: any) {
      this.logger.error('[FirestoreBlueprintRepository]', 'create failed', error as Error);
      throw error;
    }
  }

  async update(id: string, data: Partial<Blueprint>): Promise<void> {
    const docData = {
      ...data,
      updatedAt: Timestamp.now()
    };

    // Remove id field if present
    delete (docData as any).id;

    try {
      await updateDoc(this.getDocRef(id), docData);
    } catch (error: any) {
      this.logger.error('[FirestoreBlueprintRepository]', 'update failed', error as Error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await updateDoc(this.getDocRef(id), {
        deletedAt: Timestamp.now(),
        status: BlueprintStatus.ARCHIVED,
        updatedAt: Timestamp.now()
      });
    } catch (error: any) {
      this.logger.error('[FirestoreBlueprintRepository]', 'soft delete failed', error as Error);
      throw error;
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const snapshot = await getDoc(this.getDocRef(id));
      return snapshot.exists();
    } catch (error: any) {
      this.logger.error('[FirestoreBlueprintRepository]', 'exists check failed', error as Error);
      return false;
    }
  }

  async countByOwner(ownerType: OwnerType, ownerId: string): Promise<number> {
    try {
      const q = query(
        this.getCollectionRef(),
        where('ownerType', '==', ownerType),
        where('ownerId', '==', ownerId),
        where('deletedAt', '==', null)
      );
      
      const snapshot = await getCountFromServer(q);
      return snapshot.data().count;
    } catch (error: any) {
      this.logger.error('[FirestoreBlueprintRepository]', 'countByOwner failed', error as Error);
      return 0;
    }
  }
}
