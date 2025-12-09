import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  Timestamp,
  CollectionReference,
  DocumentReference,
  getCountFromServer
} from '@angular/fire/firestore';
import { Observable, from, map, catchError, of } from 'rxjs';
import { BlueprintMember, LoggerService } from '@core';
import { IBlueprintMemberRepository } from '../../domain/repositories';

/**
 * Firestore Blueprint Member Repository Implementation
 * Firestore 藍圖成員倉儲實作
 * 
 * Implements IBlueprintMemberRepository using Firestore subcollections.
 * 使用 Firestore 子集合實作 IBlueprintMemberRepository。
 */
@Injectable({
  providedIn: 'root'
})
export class FirestoreBlueprintMemberRepository implements IBlueprintMemberRepository {
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);

  private getMembersCollectionRef(blueprintId: string): CollectionReference {
    return collection(this.firestore, 'blueprints', blueprintId, 'members');
  }

  private getMemberDocRef(blueprintId: string, memberId: string): DocumentReference {
    return doc(this.firestore, 'blueprints', blueprintId, 'members', memberId);
  }

  private toMember(data: any, id: string): BlueprintMember {
    return {
      id,
      ...data,
      grantedAt: data.grantedAt instanceof Timestamp ? data.grantedAt.toDate() : data.grantedAt
    };
  }

  findByBlueprint(blueprintId: string): Observable<BlueprintMember[]> {
    return from(getDocs(this.getMembersCollectionRef(blueprintId))).pipe(
      map(snapshot => snapshot.docs.map(docSnap => this.toMember(docSnap.data(), docSnap.id))),
      catchError(error => {
        this.logger.error('[FirestoreBlueprintMemberRepository]', 'findByBlueprint failed', error as Error);
        return of([]);
      })
    );
  }

  async findById(blueprintId: string, memberId: string): Promise<BlueprintMember | null> {
    try {
      const snapshot = await getDoc(this.getMemberDocRef(blueprintId, memberId));
      return snapshot.exists() ? this.toMember(snapshot.data(), snapshot.id) : null;
    } catch (error: any) {
      this.logger.error('[FirestoreBlueprintMemberRepository]', 'findById failed', error as Error);
      return null;
    }
  }

  async addMember(
    blueprintId: string,
    member: Omit<BlueprintMember, 'id' | 'grantedAt'>
  ): Promise<BlueprintMember> {
    try {
      const docRef = await addDoc(this.getMembersCollectionRef(blueprintId), {
        ...member,
        grantedAt: Timestamp.now()
      });
      
      const docSnap = await getDoc(docRef);
      return this.toMember(docSnap.data(), docRef.id);
    } catch (error: any) {
      this.logger.error('[FirestoreBlueprintMemberRepository]', 'addMember failed', error as Error);
      throw error;
    }
  }

  async updateMember(
    blueprintId: string,
    memberId: string,
    data: Partial<BlueprintMember>
  ): Promise<void> {
    try {
      await updateDoc(this.getMemberDocRef(blueprintId, memberId), data);
    } catch (error: any) {
      this.logger.error('[FirestoreBlueprintMemberRepository]', 'updateMember failed', error as Error);
      throw error;
    }
  }

  async removeMember(blueprintId: string, memberId: string): Promise<void> {
    try {
      await deleteDoc(this.getMemberDocRef(blueprintId, memberId));
    } catch (error: any) {
      this.logger.error('[FirestoreBlueprintMemberRepository]', 'removeMember failed', error as Error);
      throw error;
    }
  }

  async isMember(blueprintId: string, accountId: string): Promise<boolean> {
    try {
      const q = query(
        this.getMembersCollectionRef(blueprintId),
        where('accountId', '==', accountId)
      );
      
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error: any) {
      this.logger.error('[FirestoreBlueprintMemberRepository]', 'isMember check failed', error as Error);
      return false;
    }
  }

  async countMembers(blueprintId: string): Promise<number> {
    try {
      const snapshot = await getCountFromServer(this.getMembersCollectionRef(blueprintId));
      return snapshot.data().count;
    } catch (error: any) {
      this.logger.error('[FirestoreBlueprintMemberRepository]', 'countMembers failed', error as Error);
      return 0;
    }
  }
}
