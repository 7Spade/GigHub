# Cloud Storage Module (雲端儲存模組)

## Overview

The Cloud Storage Module provides comprehensive file management, cloud synchronization, and backup capabilities for the GigHub Blueprint system. It integrates with Firebase Storage and Firestore, and communicates with other modules via the Blueprint EventBus.

## Features

- **File Management**: Upload, download, and delete files
- **Cloud Sync**: Automatic synchronization with Firebase Storage
- **Backup & Restore**: Create and restore backups of blueprint files
- **Event-Driven**: Publishes events through the Blueprint EventBus
- **Storage Statistics**: Real-time storage usage tracking

## Architecture

```
CloudModule (IBlueprintModule)
├─ CloudStorageService (Business Logic)
├─ CloudRepository (Data Access)
│   ├─ FirebaseStorageRepository (File Storage)
│   └─ Firestore (Metadata Storage)
└─ Models (Data Structures)
```

### Integration Points

1. **Blueprint Container**: Manages module lifecycle
2. **Event Bus**: Publishes/subscribes to events
3. **Execution Context**: Provides shared resources
4. **Firebase Storage**: Cloud storage backend for files
5. **Firestore**: Database for file metadata

## Module Lifecycle

```
UNINITIALIZED → INITIALIZING → INITIALIZED → STARTING → STARTED → READY → RUNNING
                                                                              ↓
                                                                           STOPPING → STOPPED → DISPOSED
```

## Events

### Published Events

- `cloud.file_uploaded` - File successfully uploaded
- `cloud.file_downloaded` - File successfully downloaded
- `cloud.file_deleted` - File deleted
- `cloud.backup_created` - Backup created
- `cloud.backup_restored` - Backup restored
- `cloud.sync_started` - Sync operation started
- `cloud.sync_completed` - Sync completed
- `cloud.error_occurred` - Error occurred

### Subscribed Events

The module subscribes to its own events for logging and auditing purposes.

## Usage

### Loading the Module

```typescript
// In Blueprint Container
const cloudModule = new CloudModule();
await container.loadModule(cloudModule);
```

### Using the Service

```typescript
// Get module instance via execution context
const cloudModule = context.getModule('cloud');
const cloudService = cloudModule.exports.service();

// Upload file
await cloudService.uploadFile(blueprintId, {
  file: fileObject,
  metadata: {
    description: 'Blueprint CAD file',
    tags: ['design', 'floor-plan']
  },
  isPublic: false
});

// Create backup
await cloudService.createBackup(blueprintId, {
  name: 'Weekly Backup',
  description: 'Automated weekly backup',
  options: {
    compress: true,
    encrypt: true
  }
});
```

### Event Subscription

```typescript
// Subscribe to file upload events
context.eventBus.on('cloud.file_uploaded', (event) => {
  console.log('File uploaded:', event.payload);
});
```

## Configuration

Default configuration is defined in `module.metadata.ts`:

```typescript
{
  features: {
    maxFileSize: 104857600, // 100MB
    allowedFileTypes: ['image/*', 'application/pdf', '.dwg', '.dxf', '.rvt']
  },
  settings: {
    autoSync: false,
    syncInterval: 3600000, // 1 hour
    retentionDays: 90
  },
  limits: {
    maxItems: 50000,
    maxStorage: 10737418240, // 10GB
    maxRequests: 10000
  }
}
```

## Firebase Integration

### Storage Structure

Files are stored in Firebase Storage with the following structure:
```
blueprint-{blueprintId}/
  ├─ files/
  │   ├─ {timestamp}-{filename}
  │   └─ ...
  └─ backups/
      ├─ {timestamp}-{backupname}.zip
      └─ ...
```

### Firestore Collections

#### `cloud_files` Collection
- Document ID: Auto-generated
- Fields:
  - `blueprint_id` (string)
  - `name` (string)
  - `path` (string)
  - `size` (number)
  - `mime_type` (string)
  - `extension` (string)
  - `url` (string)
  - `public_url` (string, optional)
  - `status` (string)
  - `uploaded_by` (string)
  - `uploaded_at` (Timestamp)
  - `updated_at` (Timestamp)
  - `metadata` (map, optional)
  - `bucket` (string)
  - `is_public` (boolean)

#### `cloud_backups` Collection
- Document ID: Auto-generated
- Fields:
  - `blueprint_id` (string)
  - `name` (string)
  - `description` (string, optional)
  - `type` (string)
  - `status` (string)
  - `size` (number)
  - `file_count` (number)
  - `path` (string)
  - `created_at` (Timestamp)
  - `created_by` (string)
  - `is_encrypted` (boolean)
  - `metadata` (map, optional)

### Security Rules

```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Cloud Files Rules
    match /cloud_files/{fileId} {
      allow read: if request.auth != null &&
        (resource.data.uploaded_by == request.auth.uid ||
         resource.data.is_public == true);
      
      allow create: if request.auth != null &&
        request.resource.data.uploaded_by == request.auth.uid;
      
      allow update, delete: if request.auth != null &&
        resource.data.uploaded_by == request.auth.uid;
    }
    
    // Cloud Backups Rules
    match /cloud_backups/{backupId} {
      allow read, write: if request.auth != null &&
        resource.data.created_by == request.auth.uid;
    }
  }
}

// Firebase Storage Security Rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /blueprint-{blueprintId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

## Testing

```bash
# Run unit tests
yarn test src/app/core/blueprint/modules/implementations/cloud

# Run integration tests
yarn test:integration cloud
```

## Future Enhancements

- [ ] File versioning
- [ ] Automatic sync scheduling
- [ ] File compression
- [ ] Image thumbnail generation
- [ ] CDN integration
- [ ] File sharing with expiry links
- [ ] Incremental backups
- [ ] Backup encryption

## Dependencies

- `@angular/core`: ^20.3.0
- `@angular/fire`: ^20.0.1

## License

Proprietary - GigHub Development Team
