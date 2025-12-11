import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  CollectionReference,
  DocumentReference,
  Timestamp
} from '@angular/fire/firestore';
import { Account, LoggerService } from '@core';
import { Observable, from, map, catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AccountRepository {
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);
  private readonly collectionName = 'accounts';

  private getCollectionRef(): CollectionReference {
    return collection(this.firestore, this.collectionName);
  }

  private getDocRef(accountId: string): DocumentReference {
    return doc(this.firestore, this.collectionName, accountId);
  }

  private toAccount(data: any, id: string): Account {
    return {
      id,
      uid: data.uid,
      name: data.name,
      email: data.email,
      avatar_url: data.avatar_url || null,
      created_at: data.created_at instanceof Timestamp ? data.created_at.toDate().toISOString() : data.created_at
    };
  }

  findById(accountId: string): Observable<Account | null> {
    return from(getDoc(this.getDocRef(accountId))).pipe(
      map(snapshot => (snapshot.exists() ? this.toAccount(snapshot.data(), snapshot.id) : null)),
      catchError(error => {
        this.logger.error('[AccountRepository]', 'findById failed', error as Error);
        return of(null);
      })
    );
  }

  async create(account: Omit<Account, 'id' | 'created_at'>): Promise<Account> {
    const now = Timestamp.now();
    const docData = {
      ...account,
      created_at: now
    };

    try {
      // Use setDoc with uid as document ID
      await setDoc(this.getDocRef(account.uid), docData);
      return this.toAccount(docData, account.uid);
    } catch (error: any) {
      this.logger.error('[AccountRepository]', 'create failed', error as Error);
      throw error;
    }
  }

  async update(accountId: string, data: Partial<Account>): Promise<void> {
    const docData = { ...data };
    delete (docData as any).id;
    delete (docData as any).uid;
    delete (docData as any).created_at;

    try {
      await updateDoc(this.getDocRef(accountId), docData);
    } catch (error: any) {
      this.logger.error('[AccountRepository]', 'update failed', error as Error);
      throw error;
    }
  }
}
