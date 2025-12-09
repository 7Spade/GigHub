import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  CollectionReference,
  DocumentReference,
  Timestamp
} from '@angular/fire/firestore';
import { Observable, from, map, catchError, of } from 'rxjs';
import { Team, LoggerService } from '@core';

@Injectable({
  providedIn: 'root'
})
export class TeamRepository {
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);
  private readonly collectionName = 'teams';

  private getCollectionRef(): CollectionReference {
    return collection(this.firestore, this.collectionName);
  }

  private getDocRef(teamId: string): DocumentReference {
    return doc(this.firestore, this.collectionName, teamId);
  }

  private toTeam(data: any, id: string): Team {
    return {
      id,
      organization_id: data.organization_id,
      name: data.name,
      description: data.description || null,
      created_at: data.created_at instanceof Timestamp ? data.created_at.toDate().toISOString() : data.created_at
    };
  }

  findById(teamId: string): Observable<Team | null> {
    return from(getDoc(this.getDocRef(teamId))).pipe(
      map(snapshot => (snapshot.exists() ? this.toTeam(snapshot.data(), snapshot.id) : null)),
      catchError(error => {
        this.logger.error('[TeamRepository]', 'findById failed', error as Error);
        return of(null);
      })
    );
  }

  findByOrganization(organizationId: string): Observable<Team[]> {
    const q = query(
      this.getCollectionRef(),
      where('organization_id', '==', organizationId),
      orderBy('created_at', 'desc')
    );

    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(docSnap => this.toTeam(docSnap.data(), docSnap.id))),
      catchError(error => {
        this.logger.error('[TeamRepository]', 'findByOrganization failed', error as Error);
        return of([]);
      })
    );
  }

  async create(team: Omit<Team, 'id' | 'created_at'>): Promise<Team> {
    const now = Timestamp.now();
    const docData = {
      ...team,
      created_at: now
    };

    try {
      const docRef = await addDoc(this.getCollectionRef(), docData);
      return this.toTeam(docData, docRef.id);
    } catch (error: any) {
      this.logger.error('[TeamRepository]', 'create failed', error as Error);
      throw error;
    }
  }

  async update(teamId: string, data: Partial<Team>): Promise<void> {
    const docData = { ...data };
    delete (docData as any).id;
    delete (docData as any).organization_id;
    delete (docData as any).created_at;

    try {
      await updateDoc(this.getDocRef(teamId), docData);
    } catch (error: any) {
      this.logger.error('[TeamRepository]', 'update failed', error as Error);
      throw error;
    }
  }

  async delete(teamId: string): Promise<void> {
    try {
      await deleteDoc(this.getDocRef(teamId));
    } catch (error: any) {
      this.logger.error('[TeamRepository]', 'delete failed', error as Error);
      throw error;
    }
  }
}
