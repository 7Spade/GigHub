# Construction Log Module (工地施工日誌模組)

## Overview

The Construction Log module provides a comprehensive solution for managing daily construction site logs with photo attachments. It follows modern Angular 20 patterns with Signals and integrates seamlessly with Supabase backend.

## Features

- ✅ **Daily Log Management**: Create, view, edit, and delete construction logs
- ✅ **Photo Upload**: Upload and manage multiple photos per log with Supabase Storage
- ✅ **Weather Tracking**: Record weather conditions and temperature
- ✅ **Work Details**: Track work hours, worker count, and equipment used
- ✅ **Real-time Updates**: Automatic sync with Supabase Realtime (ready for future implementation)
- ✅ **Row Level Security**: Secure data access with Supabase RLS policies
- ✅ **Statistics**: View total logs, monthly logs, daily logs, and photo counts
- ✅ **Responsive UI**: Built with ng-zorro-antd components

## Architecture

This module follows the project's three-layer architecture:

```
Construction Log Module
├── construction-log.component.ts      # Presentation Layer (UI)
├── construction-log-modal.component.ts # Modal for create/edit/view
├── construction-log.store.ts          # Business Logic Layer (Signals Store)
└── construction-log.repository.ts     # Data Access Layer (Supabase)
```

### Layer Responsibilities

1. **Presentation Layer** (`*.component.ts`)
   - Display data using ng-alain ST table
   - Handle user interactions
   - Manage modal dialogs
   - Use Angular Signals for reactive updates

2. **Business Logic Layer** (`*.store.ts`)
   - Manage application state with Angular Signals
   - Provide computed statistics
   - Coordinate data operations
   - Handle error states

3. **Data Access Layer** (`*.repository.ts`)
   - Interact with Supabase database
   - Handle file uploads to Supabase Storage
   - Map database models to domain entities
   - Implement query filtering

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

## Database Setup

### Required Tables

Execute the SQL script located at `docs/database/construction_logs.sql` to create:
- `construction_logs` table with all required fields and indexes
- RLS policies for secure access
- Triggers for automatic timestamp updates

### Required Storage Bucket

Create a Supabase Storage bucket named `construction-photos`:
1. Navigate to Supabase Dashboard → Storage
2. Create new bucket: `construction-photos`
3. Set to **private** (not public)
4. Apply RLS policies (included in SQL script comments)

## Development Guidelines

### Adding New Fields

To add new fields to logs:

1. Update type definition in `@core/types/log/log.types.ts`
2. Add database column in `construction_logs.sql`
3. Update repository mapping in `construction-log.repository.ts`
4. Add form field in `construction-log-modal.component.ts`
5. Update ST column in `construction-log.component.ts`

### Extending Functionality

The module is designed for easy extension:

- **Voice Records**: Reserved fields and interfaces already defined
- **Documents**: Ready for implementation with Supabase Storage
- **Realtime Updates**: Repository structure supports Supabase Realtime subscriptions
- **Export**: Can easily add PDF/Excel export functionality

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
- Check Supabase Storage bucket exists: `construction-photos`
- Verify RLS policies are applied correctly
- Ensure file size is under 5MB
- Check browser console for errors

### Logs not appearing
- Verify blueprint ID is correct
- Check RLS policies allow user access
- Ensure user has required permissions in blueprint_members
- Check network tab for API errors

### Permission denied errors
- User must be blueprint owner or member with appropriate role
- Check `blueprint_members` table for user's role
- Verify RLS policies in `construction_logs` table

## Support

For issues or questions:
1. Check this README first
2. Review code comments in source files
3. Refer to project architecture documentation
4. Contact GigHub development team

## License

Part of GigHub Construction Management System
© 2025 GigHub Development Team
