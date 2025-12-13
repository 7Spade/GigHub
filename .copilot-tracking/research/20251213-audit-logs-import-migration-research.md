<!-- markdownlint-disable-file -->

# Research: Audit Logs Import Migration

**Date**: 2025-12-13
**Task**: Migrate audit logs imports from scattered old locations to new modular implementation

## Project Context

### Current Architecture

The project has completed migration to a new modular architecture for audit logs:

**New Modular Location**: `src/app/core/blueprint/modules/implementations/audit-logs/`

This module follows the Blueprint Module pattern with:
- Models in `/models/`
- Repository in `/repositories/`
- Services in `/services/`
- Components in `/components/`
- Public API exports through `/exports/audit-logs-api.exports.ts`
- Main barrel export at `/index.ts`

### Old Files (To Be Removed)

1. **`src/app/core/models/audit-log.model.ts`** (Lines 1-300+)
   - Contains: AuditLogDocument, AuditEventType, AuditCategory, AuditSeverity, ActorType, AuditStatus, etc.
   - Purpose: Legacy model definitions

2. **`src/app/core/types/audit/audit-log.types.ts`** (Lines 1-49)
   - Contains: Simplified AuditLog interface, AuditEntityType, AuditOperation types
   - Purpose: Legacy type definitions (simpler, less comprehensive)

3. **`src/app/core/repositories/audit-log.repository.ts`** (Lines 1-400+)
   - Contains: AuditLogRepository service with Firestore operations
   - Purpose: Legacy repository implementation

4. **`src/app/core/blueprint/repositories/audit-log.repository.ts`** (Lines 1-400+)
   - Contains: Duplicate AuditLogRepository (blueprint-scoped)
   - Purpose: Intermediate migration step, now redundant

5. **`src/app/routes/blueprint/audit/audit-logs.component.ts`** (Lines 1-300+)
   - Contains: Legacy audit logs UI component
   - Purpose: Old standalone component (replaced by modular version)

### New Modular Implementation

**Public API**: `src/app/core/blueprint/modules/implementations/audit-logs/exports/audit-logs-api.exports.ts` (Lines 1-39)

Exports:
```typescript
// Models
export * from '../models/audit-log.model';
export * from '../models/audit-log.types';

// Repository
export { AuditLogRepository } from '../repositories/audit-log.repository';
export type { AuditLogPage } from '../repositories/audit-log.repository';

// Service
export { AuditLogsService } from '../services/audit-logs.service';

// Component
export { AuditLogsComponent } from '../components/audit-logs.component';

// Metadata
export {
  AUDIT_LOGS_MODULE_METADATA,
  AUDIT_LOGS_MODULE_DEFAULT_CONFIG,
  AUDIT_LOGS_MODULE_PERMISSIONS,
  AUDIT_LOGS_MODULE_EVENTS
} from '../module.metadata';

// Config
export type { AuditLogsConfig } from '../config/audit-logs.config';
export { DEFAULT_AUDIT_LOGS_CONFIG } from '../config/audit-logs.config';

// Module
export { AuditLogsModule } from '../audit-logs.module';
```

**Barrel Export**: `src/app/core/blueprint/modules/implementations/audit-logs/index.ts` (Lines 1-12)
```typescript
export * from './exports/audit-logs-api.exports';
```

**New Repository**: `src/app/core/blueprint/modules/implementations/audit-logs/repositories/audit-log.repository.ts` (Lines 1-400+)
- Same interface as old repository
- Enhanced with better typing
- Located in modular structure

**New Models**: `src/app/core/blueprint/modules/implementations/audit-logs/models/audit-log.model.ts` (Lines 1-300+)
- Contains all model definitions from old location
- Enhanced with additional types
- Better organized

## Files Requiring Migration

### 1. task.store.ts

**File**: `src/app/core/stores/task.store.ts`

**Current Imports** (Lines 6-7):
```typescript
import { AuditLogRepository, CreateAuditLogData } from '@core/blueprint/repositories/audit-log.repository';
import { AuditEventType, AuditCategory, AuditSeverity, ActorType, AuditStatus } from '@core/models/audit-log.model';
```

**Required Change**:
```typescript
import { 
  AuditLogRepository, 
  AuditEventType, 
  AuditCategory, 
  AuditSeverity, 
  ActorType, 
  AuditStatus 
} from '@core/blueprint/modules/implementations/audit-logs';
import type { CreateAuditLogData } from '@core/blueprint/modules/implementations/audit-logs';
```

**Usage Context**:
- Line 29: `private readonly auditLogRepository = inject(AuditLogRepository);`
- Lines 100+: Multiple audit log creation calls throughout the file

### 2. tasks.service.ts

**File**: `src/app/core/blueprint/modules/implementations/tasks/tasks.service.ts`

**Current Imports** (Lines 25-26):
```typescript
import { AuditLogRepository, CreateAuditLogData } from '@core/blueprint/repositories/audit-log.repository';
import { AuditEventType, AuditCategory, AuditSeverity, ActorType, AuditStatus } from '@core/models/audit-log.model';
```

**Status**: File is marked as @deprecated (Lines 1-20)
- Functionality consolidated into TaskStore
- Will be removed in future version
- Still requires migration for backward compatibility

**Required Change**: Same as task.store.ts

### 3. module-manager.service.ts

**File**: `src/app/features/module-manager/module-manager.service.ts`

**Current Imports** (Lines 12-14):
```typescript
import { AuditLogRepository } from '@core/blueprint/repositories/audit-log.repository';
import { AuditLogEventType, AuditLogCategory } from '@core/models/audit-log.model';
```

**Note**: Uses `AuditLogEventType` and `AuditLogCategory` (slightly different naming)

**Required Change**:
```typescript
import { 
  AuditLogRepository, 
  AuditEventType as AuditLogEventType,
  AuditCategory as AuditLogCategory 
} from '@core/blueprint/modules/implementations/audit-logs';
```

**Alternative** (if renaming aliases are acceptable):
```typescript
import { 
  AuditLogRepository, 
  AuditEventType, 
  AuditCategory 
} from '@core/blueprint/modules/implementations/audit-logs';
```
Then update all usages from `AuditLogEventType` → `AuditEventType` and `AuditLogCategory` → `AuditCategory`

### 4. blueprint-detail.component.ts

**File**: `src/app/routes/blueprint/blueprint-detail.component.ts`

**Current Import** (Line 18):
```typescript
import { AuditLogsComponent } from './audit/audit-logs.component';
```

**Required Change**:
```typescript
import { AuditLogsComponent } from '@core/blueprint/modules/implementations/audit-logs';
```

**Usage Context**:
- Line 52: Listed in imports array for the component
- Component template uses `<app-audit-logs>` tag (needs verification)

## Migration Strategy

### Phase 1: Update Imports

**Objective**: Update all import statements to use new modular location

**Approach**:
1. Update imports one file at a time
2. Maintain exact same API surface
3. No logic changes, only import path updates

**Risk Level**: LOW
- API is identical
- Type definitions are compatible
- No breaking changes expected

### Phase 2: Verify Build & Tests

**Objective**: Ensure no compilation errors or test failures

**Tasks**:
1. Run TypeScript compilation: `yarn build` or `yarn lint:ts`
2. Run unit tests: `yarn test` (if applicable)
3. Check for any runtime errors in development: `yarn start`

**Success Criteria**:
- Zero TypeScript errors
- All tests pass
- Application starts successfully

### Phase 3: Remove Old Files

**Objective**: Clean up legacy files after successful migration

**Files to Remove**:
1. `src/app/core/models/audit-log.model.ts`
2. `src/app/core/types/audit/audit-log.types.ts`
3. `src/app/core/repositories/audit-log.repository.ts`
4. `src/app/core/blueprint/repositories/audit-log.repository.ts`
5. `src/app/routes/blueprint/audit/audit-logs.component.ts`

**Verification Steps**:
1. Search codebase for any remaining references to old paths
2. Verify no orphaned imports exist
3. Run full build and test suite
4. Check that old directories can be safely removed

**Risk Level**: MEDIUM
- Must verify no other files import old locations
- May need to update barrel exports if they re-export old files

## Type Compatibility Analysis

### Old vs New Type Definitions

**Old Model** (`@core/models/audit-log.model`):
- AuditLogDocument interface
- AuditEventType enum
- AuditCategory enum
- AuditSeverity enum
- ActorType enum
- AuditStatus enum
- CreateAuditLogData type
- AuditLogQueryOptions interface

**New Model** (`audit-logs/models/audit-log.model`):
- ✅ Same: AuditLogDocument interface
- ✅ Same: AuditEventType enum (with additional values)
- ✅ Same: AuditCategory enum
- ✅ Same: AuditSeverity enum
- ✅ Same: ActorType enum
- ✅ Same: AuditStatus enum
- ✅ Same: CreateAuditLogData type
- ✅ Same: AuditLogQueryOptions interface

**Compatibility**: 100% COMPATIBLE
- New model is superset of old model
- All existing types preserved
- Additional types added (backward compatible)

### Repository Interface Compatibility

**Old Repository** (`@core/blueprint/repositories/audit-log.repository`):
- Methods: create, findById, findByBlueprint, query, etc.
- Export: `CreateAuditLogData` type

**New Repository** (`audit-logs/repositories/audit-log.repository`):
- ✅ Same methods with identical signatures
- ✅ Exports `AuditLogPage` type (new)
- ✅ Does NOT re-export `CreateAuditLogData` directly

**Note**: `CreateAuditLogData` is available through the public API exports, but not from repository file directly.

**Migration Impact**: 
- Import path change from repository to main module index
- Type imports may need adjustment

## External Dependencies

### Framework Dependencies
- Angular 20.3.0
- @angular/fire for Firestore operations
- RxJS 7.8 for reactive patterns

### Project Standards
- TypeScript 5.9 with strict mode
- Standalone components pattern
- Signal-based state management

### Related Modules
- Tasks module (depends on audit logs)
- Module manager (depends on audit logs)
- Blueprint detail component (displays audit logs)

## Implementation Notes

### Naming Convention Changes

The new implementation uses more consistent naming:
- Old: `AuditLogEventType` (in some places)
- New: `AuditEventType` (consistent)

Files using old naming will need updates or type aliases.

### Component Import Changes

The old `AuditLogsComponent` was standalone at:
- `src/app/routes/blueprint/audit/audit-logs.component.ts`

New component is at:
- `src/app/core/blueprint/modules/implementations/audit-logs/components/audit-logs.component.ts`

Both are exported through their respective public APIs, ensuring no breaking changes.

### Barrel Export Strategy

The new module uses a layered export strategy:
1. Internal exports from `exports/audit-logs-api.exports.ts`
2. Main barrel export from `index.ts`
3. Consumers import from module root

This follows Angular best practices for library distribution.

## Verification Checklist

### Pre-Migration
- [x] New modular implementation exists and is complete
- [x] Public API exports all required types and services
- [x] Type compatibility verified
- [x] All consuming files identified

### During Migration
- [ ] Update task.store.ts imports
- [ ] Update tasks.service.ts imports
- [ ] Update module-manager.service.ts imports
- [ ] Update blueprint-detail.component.ts imports
- [ ] Run TypeScript compilation
- [ ] Fix any compilation errors

### Post-Migration
- [ ] All files compile successfully
- [ ] No remaining references to old paths
- [ ] Application starts without errors
- [ ] Tests pass (if applicable)
- [ ] Safe to remove old files

## Search Patterns for Verification

Use these patterns to verify complete migration:

```bash
# Find all imports from old locations
grep -r "from '@core/models/audit-log" src/
grep -r "from '@core/types/audit" src/
grep -r "from '@core/repositories/audit-log" src/
grep -r "from '@core/blueprint/repositories/audit-log" src/
grep -r "from './audit/audit-logs.component" src/

# Find all remaining references to old component
grep -r "AuditLogsComponent" src/ --include="*.ts"

# Verify new imports are used
grep -r "from '@core/blueprint/modules/implementations/audit-logs" src/
```

## Edge Cases & Considerations

### 1. Type Re-exports

Some files may import types indirectly through barrel exports. Verify that all barrel exports are updated.

### 2. Lazy Loading

If audit logs module is lazy loaded anywhere, verify the module path is updated.

### 3. Testing Mocks

Test files may mock old repositories. Update test imports as well.

### 4. Documentation

Update any documentation referencing old paths:
- README files
- Code comments
- Architecture diagrams

## Success Criteria

✅ **Migration Successful When**:
1. All 4 files use new import paths
2. TypeScript compilation passes without errors
3. Application builds successfully
4. No runtime errors during manual testing
5. Old files can be safely deleted
6. No remaining references to old paths in codebase

## References

- New Module: `src/app/core/blueprint/modules/implementations/audit-logs/`
- Public API: `src/app/core/blueprint/modules/implementations/audit-logs/exports/audit-logs-api.exports.ts`
- Task Store: `src/app/core/stores/task.store.ts`
- Tasks Service: `src/app/core/blueprint/modules/implementations/tasks/tasks.service.ts`
- Module Manager: `src/app/features/module-manager/module-manager.service.ts`
- Blueprint Detail: `src/app/routes/blueprint/blueprint-detail.component.ts`
