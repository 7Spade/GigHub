# Cloud Storage Module (雲端儲存模組)

## Overview

The Cloud Storage Module provides comprehensive file management, cloud synchronization, and backup capabilities for the GigHub Blueprint system. It integrates with Supabase Storage and communicates with other modules via the Blueprint EventBus.

## Features

- **File Management**: Upload, download, and delete files
- **Cloud Sync**: Automatic synchronization with cloud storage
- **Backup & Restore**: Create and restore backups of blueprint files
- **Event-Driven**: Publishes events through the Blueprint EventBus
- **Storage Statistics**: Real-time storage usage tracking

## Architecture

```
CloudModule (IBlueprintModule)
├─ CloudStorageService (Business Logic)
├─ CloudRepository (Data Access)
└─ Models (Data Structures)
```

### Integration Points

1. **Blueprint Container**: Manages module lifecycle
2. **Event Bus**: Publishes/subscribes to events
3. **Execution Context**: Provides shared resources
4. **Supabase Storage**: Cloud storage backend

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

## Database Schema

### Tables Required

#### `cloud_files`
- `id` (UUID, PK)
- `blueprint_id` (UUID, FK)
- `name` (TEXT)
- `path` (TEXT)
- `size` (BIGINT)
- `mime_type` (TEXT)
- `extension` (TEXT)
- `url` (TEXT)
- `public_url` (TEXT, nullable)
- `status` (TEXT)
- `uploaded_by` (UUID, FK to users)
- `uploaded_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)
- `metadata` (JSONB, nullable)
- `bucket` (TEXT)
- `is_public` (BOOLEAN)
- `checksum` (TEXT, nullable)
- `expires_at` (TIMESTAMPTZ, nullable)

#### `cloud_backups`
- `id` (UUID, PK)
- `blueprint_id` (UUID, FK)
- `name` (TEXT)
- `description` (TEXT, nullable)
- `type` (TEXT)
- `status` (TEXT)
- `size` (BIGINT)
- `file_count` (INTEGER)
- `path` (TEXT)
- `created_at` (TIMESTAMPTZ)
- `created_by` (UUID, FK to users)
- `last_accessed_at` (TIMESTAMPTZ, nullable)
- `expires_at` (TIMESTAMPTZ, nullable)
- `metadata` (JSONB, nullable)
- `checksum` (TEXT, nullable)
- `is_encrypted` (BOOLEAN)

### RLS Policies

```sql
-- Cloud Files RLS
CREATE POLICY "Users can view their blueprint files"
  ON cloud_files FOR SELECT
  USING (blueprint_id IN (
    SELECT id FROM blueprints WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Users can upload files to their blueprints"
  ON cloud_files FOR INSERT
  WITH CHECK (blueprint_id IN (
    SELECT id FROM blueprints WHERE owner_id = auth.uid()
  ));

-- Cloud Backups RLS
CREATE POLICY "Users can view their blueprint backups"
  ON cloud_backups FOR SELECT
  USING (blueprint_id IN (
    SELECT id FROM blueprints WHERE owner_id = auth.uid()
  ));
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
- `@supabase/supabase-js`: ^2.86.0

## License

Proprietary - GigHub Development Team
