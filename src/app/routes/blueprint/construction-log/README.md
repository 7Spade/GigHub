# Construction Log Module (工地施工日誌模組)

## Overview

The Construction Log module provides a comprehensive solution for managing daily construction site logs with photo attachments. It follows modern Angular 20 patterns with Signals and integrates seamlessly with **Firebase Firestore** backend.

**Status**: ✅ **Fully Functional** - Migrated from Supabase to Firebase (2025-12-12)

## Features

- ✅ **Daily Log Management**: Create, view, edit, and delete construction logs
- ✅ **Photo Upload**: Upload and manage multiple photos per log with Firebase Storage
- ✅ **Weather Tracking**: Record weather conditions and temperature
- ✅ **Work Details**: Track work hours, worker count, and equipment used
- ✅ **Real-time Updates**: Ready for Firestore Realtime listeners (future implementation)
- ✅ **Security Rules**: Secure data access with Firestore Security Rules
- ✅ **Statistics**: View total logs, monthly logs, daily logs, and photo counts
- ✅ **Responsive UI**: Built with ng-zorro-antd components
- ✅ **Authentication**: Automatic user tracking via Firebase Auth

## Architecture

This module follows the project's three-layer architecture:

```
Construction Log Module
├── construction-log.component.ts      # Presentation Layer (UI)
├── construction-log-modal.component.ts # Modal for create/edit/view
├── construction-log.store.ts          # Business Logic Layer (Signals Store)
└── @core/repositories/               # Data Access Layer
    └── log-firestore.repository.ts    # Firebase Firestore Repository
```

### Layer Responsibilities

1. **Presentation Layer** (`*.component.ts`)
   - Display data using ng-alain ST table
   - Handle user interactions
   - Manage modal dialogs
   - Use Angular Signals for reactive updates

2. **Business Logic Layer** (`construction-log.store.ts`)
   - Manage application state with Angular Signals
   - Provide computed statistics
   - Coordinate data operations with LogFirestoreRepository
   - Handle error states and logging
   - Automatic user authentication via FirebaseService

3. **Data Access Layer** (`log-firestore.repository.ts`)
   - Interact with Firebase Firestore database
   - Handle file uploads to Firebase Storage
   - Map Firestore documents to domain entities
   - Implement query filtering and indexing
   - Automatic retry on failures

## Usage

### Integration in Blueprint Detail

The module is integrated as a tab in the Blueprint Detail page:

```typescript
// blueprint-detail.component.ts
import { ConstructionLogComponent } from './construction-log/construction-log.component';

@Component({
  // ...
  imports: [
    // ...
    ConstructionLogComponent
  ],
  template: `
    <nz-tab nzTitle="工地日誌">
      <ng-template nz-tab>
        @if (blueprint()?.id) {
          <app-construction-log [blueprintId]="blueprint()!.id" />
        }
      </ng-template>
    </nz-tab>
  `
})
```

### Standalone Usage

You can also use the component standalone:

```typescript
import { ConstructionLogComponent } from '@routes/blueprint/construction-log';

@Component({
  template: `
    <app-construction-log [blueprintId]="blueprintId" />
  `
})
export class MyComponent {
  blueprintId = 'your-blueprint-id';
}
```

## API Reference

### ConstructionLogComponent

**Inputs:**
- `blueprintId: string` (required) - The blueprint ID to load logs for

**Features:**
- ST table with sorting, pagination, and filtering
- Create/Edit/View/Delete operations
- Photo upload and preview
- Statistics display

### ConstructionLogStore

**State Signals:**
- `logs: Signal<Log[]>` - List of logs (readonly)
- `loading: Signal<boolean>` - Loading state (readonly)
- `error: Signal<string | null>` - Error message (readonly)

**Computed Signals:**
- `totalCount: Signal<number>` - Total number of logs
- `thisMonthCount: Signal<number>` - Logs created this month
- `todayCount: Signal<number>` - Logs created today
- `totalPhotos: Signal<number>` - Total number of photos across all logs

**Actions:**
- `loadLogs(blueprintId: string, options?: LogQueryOptions): Promise<void>`
- `createLog(request: CreateLogRequest): Promise<Log | null>`
- `updateLog(blueprintId: string, logId: string, request: UpdateLogRequest): Promise<Log | null>`
- `deleteLog(blueprintId: string, logId: string): Promise<void>`
- `uploadPhoto(blueprintId: string, logId: string, file: File): Promise<string | null>`
- `deletePhoto(blueprintId: string, logId: string, photoId: string): Promise<void>`

### ConstructionLogRepository

**Methods:**
- `findAll(options?: LogQueryOptions): Promise<Log[]>`
- `findById(blueprintId: string, logId: string): Promise<Log | null>`
- `create(request: CreateLogRequest): Promise<Log>`
- `update(blueprintId: string, logId: string, request: UpdateLogRequest): Promise<Log>`
- `delete(blueprintId: string, logId: string): Promise<void>`
- `uploadPhoto(blueprintId: string, logId: string, file: File): Promise<string>`
- `deletePhoto(blueprintId: string, logId: string, photoId: string): Promise<void>`

## Data Model

### Log Interface

```typescript
interface Log {
  id: string;
  blueprintId: string;
  date: Date;
  title: string;
  description?: string;
  workHours?: number;
  workers?: number;
  equipment?: string;
  weather?: string;
  temperature?: number;
  photos: LogPhoto[];
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}
```

### LogPhoto Interface

```typescript
interface LogPhoto {
  id: string;
  url: string;
  publicUrl?: string;
  caption?: string;
  uploadedAt: Date;
  size?: number;
  fileName?: string;
}
```

## Firebase Setup

### Required Firestore Collection

The `logs` collection is automatically created by `LogFirestoreRepository`. Ensure Firestore Security Rules are configured:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /logs/{logId} {
      // Allow authenticated users to read logs they have access to
      allow read: if request.auth != null;
      
      // Allow authenticated users to create logs
      allow create: if request.auth != null 
                    && request.resource.data.creator_id == request.auth.uid;
      
      // Allow creators to update their own logs
      allow update: if request.auth != null 
                    && resource.data.creator_id == request.auth.uid;
      
      // Allow creators to delete their own logs
      allow delete: if request.auth != null 
                    && resource.data.creator_id == request.auth.uid;
    }
  }
}
```

### Required Storage Bucket

Create a Firebase Storage bucket for log photos:
1. Navigate to Firebase Console → Storage
2. Bucket `log-photos` is automatically created by FirebaseStorageRepository
3. Configure Storage Security Rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /log-photos/{logId}/{fileName} {
      // Allow authenticated users to read
      allow read: if request.auth != null;
      
      // Allow authenticated users to upload (max 5MB)
      allow write: if request.auth != null
                   && request.resource.size < 5 * 1024 * 1024;
    }
  }
}
```

### Firestore Indexes

Add these composite indexes in Firebase Console → Firestore → Indexes:

1. **logs** collection:
   - `blueprint_id` (Ascending) + `date` (Descending)
   - `blueprint_id` (Ascending) + `deleted_at` (Ascending) + `date` (Descending)
   - `creator_id` (Ascending) + `date` (Descending)

## Development Guidelines

### Adding New Fields

To add new fields to logs:

1. Update type definition in `@core/types/log/log.types.ts`
2. Update Firestore document mapping in `@core/repositories/log-firestore.repository.ts` (both `toEntity` and `toDocument`)
3. Add form field in `construction-log-modal.component.ts`
4. Update ST column in `construction-log.component.ts`
5. Update Firestore indexes if filtering/sorting on new field

### Extending Functionality

The module is designed for easy extension:

- **Voice Records**: Reserved fields and interfaces already defined
- **Documents**: Ready for implementation with Firebase Storage
- **Realtime Updates**: Use Firestore's `onSnapshot()` for live updates
- **Export**: Can easily add PDF/Excel export functionality
- **Offline Support**: Firestore provides built-in offline persistence

## Best Practices

1. **Always use Signals** for state management
2. **Use input() function** instead of @Input() decorator (Angular 19+)
3. **Use new control flow** syntax (@if, @for) instead of *ngIf, *ngFor
4. **Keep components thin** - delegate logic to Store
5. **Type everything** - use strict TypeScript
6. **Test with RLS enabled** - ensure security policies work correctly

## Future Enhancements

- [ ] Realtime updates when other users add logs
- [ ] Voice recording support
- [ ] Document attachment support
- [ ] Export to PDF/Excel
- [ ] Advanced filtering and search
- [ ] Log templates
- [ ] Batch operations
- [ ] Activity timeline view
- [ ] Integration with task management
- [ ] Weather API integration for auto-fill

## Troubleshooting

### Photos not uploading
- Check Firebase Storage bucket `log-photos` exists (auto-created by FirebaseStorageRepository)
- Verify Storage Security Rules are configured correctly
- Ensure file size is under 5MB
- Check browser console for errors
- Verify user is authenticated (check FirebaseService.currentUser)

### Logs not appearing
- Verify blueprint ID is correct
- Check Firestore Security Rules allow user access
- Ensure user is authenticated (FirebaseService.getCurrentUserId() returns valid UID)
- Check browser console and network tab for errors
- Verify Firestore indexes are created for complex queries

### Permission denied errors
- User must be authenticated via Firebase Auth
- Check Firestore Security Rules configuration
- Verify `creator_id` matches authenticated user UID
- Check Firebase Console → Authentication for user status

### "User not authenticated" error
- Ensure user is logged in via FirebaseAuthService
- Check FirebaseService.currentUser signal
- Verify Firebase Auth is properly initialized
- Check browser console for authentication errors

## Support

For issues or questions:
1. Check this README first
2. Review code comments in source files
3. Refer to project architecture documentation
4. Contact GigHub development team

## License

Part of GigHub Construction Management System
© 2025 GigHub Development Team
