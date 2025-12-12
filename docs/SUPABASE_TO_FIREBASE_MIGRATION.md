# Supabase to @angular/fire Migration Guide

## 📋 Overview

This document provides a comprehensive guide for migrating from Supabase to @angular/fire in the GigHub project.

**Status**: Core infrastructure completed, repository migration in progress

**Migration Philosophy**: Following Occam's Razor (奧卡姆剃刀) - make minimal, focused changes that preserve existing functionality while replacing the underlying implementation.

---

## ✅ Completed Work

### Phase 1: Core Infrastructure
- [x] **FirebaseService** - Unified Firebase access service (replaces SupabaseService)
- [x] **FirestoreBaseRepository** - Base class for all Firestore repositories (replaces SupabaseBaseRepository)
- [x] **FirebaseStorageRepository** - File storage operations (replaces StorageRepository)
- [x] **ErrorTrackingService** - Extended with Firestore error tracking

### Files Created
1. `src/app/core/services/firebase.service.ts` - Core Firebase service
2. `src/app/core/repositories/base/firestore-base.repository.ts` - Base repository pattern
3. `src/app/core/repositories/firebase-storage.repository.ts` - Storage operations
4. Updates to `src/app/core/services/error-tracking.service.ts` - Firestore error support

---

## 🔄 Remaining Work

### Phase 2: Repository Migration

The following repositories need to be migrated from Supabase to Firestore:

#### Priority 1 - Critical Business Logic
1. **TaskSupabaseRepository** → **TaskFirestoreRepository**
   - Location: `src/app/core/repositories/task-supabase.repository.ts`
   - Operations: CRUD, status updates, soft delete, count by status
   - Complexity: **Medium**

2. **LogSupabaseRepository** → **LogFirestoreRepository**
   - Location: `src/app/core/repositories/log-supabase.repository.ts`
   - Operations: CRUD, photo uploads, statistics
   - Complexity: **High** (includes storage integration)

#### Priority 2 - Supporting Services
3. **NotificationRepository**
   - Location: `src/app/core/repositories/notification.repository.ts`
   - Operations: Realtime notifications, CRUD
   - Complexity: **Medium** (uses Realtime subscriptions)

4. **ConstructionLogRepository**
   - Location: `src/app/routes/blueprint/construction-log/construction-log.repository.ts`
   - Operations: Construction log specific operations
   - Complexity: **Low**

#### Priority 3 - UI Components
5. **Layout Widgets**
   - `src/app/layout/basic/widgets/notify.component.ts` - Update imports
   - `src/app/layout/basic/widgets/task.component.ts` - Update imports
   - Complexity: **Low** (import updates only)

### Phase 3: Configuration & Cleanup

#### Remove Supabase Dependencies
- [ ] Remove `SupabaseAuthSyncService` from `src/app/core/services/`
- [ ] Remove `SupabaseHealthCheckService` from `src/app/core/services/`
- [ ] Remove Supabase providers from `src/app/app.config.ts`
- [ ] Remove `@supabase/supabase-js` from `package.json`
- [ ] Remove `supabase` dev dependency from `package.json`

#### Update Configuration
- [ ] Update `src/environments/environment.ts` - Remove Supabase config
- [ ] Update `src/environments/environment.prod.ts` - Remove Supabase config

---

## 📚 Migration Patterns

### Pattern 1: Basic CRUD Repository

**Before (Supabase)**:
```typescript
export class TaskSupabaseRepository extends SupabaseBaseRepository<Task> {
  protected tableName = 'tasks';
  
  async findById(id: string): Promise<Task | null> {
    return this.executeWithRetry(async () => {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single();
      
      if (error) throw error;
      return data ? this.toEntity(data) : null;
    });
  }
}
```

**After (Firestore)**:
```typescript
export class TaskFirestoreRepository extends FirestoreBaseRepository<Task> {
  protected collectionName = 'tasks';
  
  async findById(id: string): Promise<Task | null> {
    return this.executeWithRetry(async () => {
      return this.getDocument(id);
    });
  }
}
```

### Pattern 2: Query with Filters

**Before (Supabase)**:
```typescript
async findByBlueprint(blueprintId: string, options?: TaskQueryOptions): Promise<Task[]> {
  return this.executeWithRetry(async () => {
    let query = this.client
      .from(this.tableName)
      .select('*')
      .eq('blueprint_id', blueprintId);
    
    if (options?.status) {
      query = query.eq('status', options.status.toUpperCase());
    }
    
    if (!options?.includeDeleted) {
      query = query.is('deleted_at', null);
    }
    
    query = query.order('created_at', { ascending: false });
    
    const { data, error } = await query;
    if (error) throw error;
    
    return (data || []).map(item => this.toEntity(item));
  });
}
```

**After (Firestore)**:
```typescript
import { query, where, orderBy, limit as firestoreLimit } from '@angular/fire/firestore';

async findByBlueprint(blueprintId: string, options?: TaskQueryOptions): Promise<Task[]> {
  return this.executeWithRetry(async () => {
    const constraints = [
      where('blueprint_id', '==', blueprintId)
    ];
    
    if (options?.status) {
      constraints.push(where('status', '==', options.status.toUpperCase()));
    }
    
    if (!options?.includeDeleted) {
      constraints.push(where('deleted_at', '==', null));
    }
    
    constraints.push(orderBy('created_at', 'desc'));
    
    if (options?.limit) {
      constraints.push(firestoreLimit(options.limit));
    }
    
    const q = query(this.collectionRef, ...constraints);
    return this.queryDocuments(q);
  });
}
```

### Pattern 3: File Upload

**Before (Supabase Storage)**:
```typescript
async uploadPhoto(logId: string, file: File, caption?: string): Promise<LogPhoto> {
  const fileName = `${logId}/${Date.now()}_${file.name}`;
  
  const { data, error } = await this.client.storage
    .from(this.photosBucket)
    .upload(fileName, file);
  
  if (error) throw error;
  
  const { data: urlData } = this.client.storage
    .from(this.photosBucket)
    .getPublicUrl(fileName);
  
  return {
    id: Date.now().toString(),
    url: fileName,
    publicUrl: urlData.publicUrl,
    caption,
    uploadedAt: new Date(),
    size: file.size,
    fileName: file.name
  };
}
```

**After (Firebase Storage)**:
```typescript
import { FirebaseStorageRepository } from '@core/repositories/firebase-storage.repository';

export class LogFirestoreRepository extends FirestoreBaseRepository<Log> {
  private readonly storageRepo = inject(FirebaseStorageRepository);
  
  async uploadPhoto(logId: string, file: File, caption?: string): Promise<LogPhoto> {
    const bucket = 'log-photos';
    const path = `${logId}/${Date.now()}_${file.name}`;
    
    const result = await this.storageRepo.uploadFile(bucket, path, file);
    
    return {
      id: Date.now().toString(),
      url: result.path,
      publicUrl: result.publicUrl,
      caption,
      uploadedAt: new Date(),
      size: file.size,
      fileName: file.name
    };
  }
}
```

### Pattern 4: Realtime Subscriptions

**Before (Supabase Realtime)**:
```typescript
subscribeToTasks(blueprintId: string, callback: (task: Task) => void) {
  return this.client
    .channel('tasks')
    .on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: 'tasks',
        filter: `blueprint_id=eq.${blueprintId}`
      },
      (payload) => callback(this.toEntity(payload.new))
    )
    .subscribe();
}
```

**After (Firestore Realtime)**:
```typescript
import { collectionData, query, where } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

subscribeToTasks(blueprintId: string): Observable<Task[]> {
  const q = query(
    this.collectionRef,
    where('blueprint_id', '==', blueprintId),
    where('deleted_at', '==', null)
  );
  
  return collectionData(q, { idField: 'id' }).pipe(
    map(docs => docs.map(doc => this.toEntity(doc, doc.id)))
  );
}
```

---

## 🗃️ Data Model Mapping

### Supabase (PostgreSQL) → Firestore (NoSQL)

| Supabase Concept | Firestore Concept | Notes |
|------------------|-------------------|-------|
| Table | Collection | No schema enforcement in Firestore |
| Row | Document | Max 1MB per document |
| Column | Field | No column types, flexible schema |
| Foreign Key | Reference / Sub-collection | Denormalization often preferred |
| RLS Policy | Security Rules | Different syntax, similar concept |
| `created_at` (timestamp) | `created_at` (Timestamp) | Use `Timestamp.now()` |
| `updated_at` (trigger) | `updated_at` (manual) | Must update manually |
| `deleted_at` (nullable) | `deleted_at` (null/Timestamp) | Same soft delete pattern |

### Key Differences

1. **No Joins**: Firestore doesn't support SQL joins. Use:
   - Denormalization (duplicate data)
   - Sub-collections (nested data)
   - Multiple queries (fetch separately)

2. **No Transactions Across Collections**: 
   - Supabase: Multi-table transactions
   - Firestore: Limited to 500 documents per transaction

3. **No Complex Queries**:
   - Supabase: Full SQL support
   - Firestore: Limited query operators (`==`, `<`, `>`, `<=`, `>=`, `!=`, `in`, `array-contains`)

4. **Pricing Model**:
   - Supabase: Based on database size + egress
   - Firestore: Based on read/write/delete operations

---

## 🔐 Security Rules

### Supabase RLS → Firestore Security Rules

**Supabase RLS Example**:
```sql
-- Only allow users to read/write their organization's tasks
CREATE POLICY "Users can access their organization's tasks"
ON tasks
FOR ALL
USING (
  auth.jwt() ->> 'organization_id' = organization_id::text
);
```

**Firestore Security Rules Example**:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to get custom claim
    function getOrganizationId() {
      return request.auth.token.organization_id;
    }
    
    // Tasks collection rules
    match /tasks/{taskId} {
      allow read, write: if request.auth != null 
        && resource.data.organization_id == getOrganizationId();
    }
  }
}
```

**Key Points**:
- Firebase Auth custom claims replace Supabase JWT claims
- Security rules are JavaScript-like, not SQL
- Test rules with Firebase Emulator before deployment

---

## 🧪 Testing Strategy

### 1. Unit Tests
- Test individual repository methods
- Mock Firebase services
- Verify data transformation (toEntity/toDocument)

### 2. Integration Tests
- Test with Firebase Emulator
- Verify security rules
- Test realtime subscriptions

### 3. Migration Testing
- **Parallel Running**: Run both Supabase and Firebase in parallel temporarily
- **Feature Flags**: Use flags to switch between implementations
- **Data Validation**: Verify data integrity after migration
- **Rollback Plan**: Keep Supabase code until Firebase is fully validated

---

## 📊 Migration Checklist

### Pre-Migration
- [ ] Set up Firebase project (already done)
- [ ] Configure Firestore Security Rules
- [ ] Set up Firebase Storage buckets
- [ ] Create data migration scripts (if needed)
- [ ] Backup Supabase data

### Migration
- [ ] Implement Firestore repositories
- [ ] Update service layer to use new repositories
- [ ] Migrate file storage to Firebase Storage
- [ ] Update authentication flow (remove SupabaseAuthSyncService)
- [ ] Test with Firebase Emulator

### Post-Migration
- [ ] Deploy to staging environment
- [ ] Run integration tests
- [ ] Monitor error rates
- [ ] Validate data integrity
- [ ] Remove Supabase dependencies
- [ ] Update documentation

### Rollback Plan
- [ ] Keep Supabase code in separate branch
- [ ] Document rollback procedures
- [ ] Keep database backups for 30 days

---

## 🚀 Next Steps

1. **Create Firestore Security Rules**
   - Define rules in `firestore.rules`
   - Match existing RLS policies
   - Test with emulator

2. **Implement Repository Migrations**
   - Start with TaskFirestoreRepository (high priority)
   - Follow with LogFirestoreRepository
   - Update dependent services

3. **Update App Configuration**
   - Remove Supabase providers
   - Update environment files
   - Clean up unused services

4. **Testing & Validation**
   - Run lint checks
   - Run unit tests
   - Run E2E tests
   - Manual QA testing

---

## 📞 Support & Resources

### Documentation
- [Firebase Firestore Docs](https://firebase.google.com/docs/firestore)
- [Firebase Storage Docs](https://firebase.google.com/docs/storage)
- [@angular/fire Docs](https://github.com/angular/angularfire)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

### Tools
- [Firebase Emulator](https://firebase.google.com/docs/emulator-suite)
- [Firestore Data Viewer](https://console.firebase.google.com)
- [Firebase CLI](https://firebase.google.com/docs/cli)

### Migration Help
- Project-specific questions: Check `.github/instructions/`
- Firebase best practices: See `docs/firebase-best-practices.md` (to be created)

---

**Last Updated**: 2025-12-12  
**Author**: GitHub Copilot Agent  
**Status**: Phase 1 Complete - Core Infrastructure Ready
