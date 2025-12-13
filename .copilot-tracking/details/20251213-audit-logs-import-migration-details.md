<!-- markdownlint-disable-file -->

# Task Details: Audit Logs Import Migration

## Research Reference

**Source Research**: #file:../research/20251213-audit-logs-import-migration-research.md

## Phase 1: Update Import Statements

### Task 1.1: Update task.store.ts imports

Update import statements in task.store.ts to use new modular location.

- **Files**:
  - `src/app/core/stores/task.store.ts` - Task store with audit logging integration
- **Success**:
  - Imports changed from old paths to `@core/blueprint/modules/implementations/audit-logs`
  - File compiles without TypeScript errors
  - No functional changes to logic
- **Research References**:
  - #file:../research/20251213-audit-logs-import-migration-research.md (Lines 89-124) - task.store.ts migration details
  - #file:../research/20251213-audit-logs-import-migration-research.md (Lines 226-259) - Type compatibility analysis
- **Dependencies**:
  - New modular implementation must be complete
  - Public API exports must include all required types

**Current Imports** (Lines 6-7):
```typescript
import { AuditLogRepository, CreateAuditLogData } from '@core/blueprint/repositories/audit-log.repository';
import { AuditEventType, AuditCategory, AuditSeverity, ActorType, AuditStatus } from '@core/models/audit-log.model';
```

**New Imports**:
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

### Task 1.2: Update tasks.service.ts imports

Update import statements in deprecated tasks.service.ts to use new modular location.

- **Files**:
  - `src/app/core/blueprint/modules/implementations/tasks/tasks.service.ts` - Deprecated tasks service
- **Success**:
  - Imports changed to new modular path
  - File compiles successfully
  - Maintains backward compatibility until removal
- **Research References**:
  - #file:../research/20251213-audit-logs-import-migration-research.md (Lines 126-154) - tasks.service.ts migration details
  - #file:../research/20251213-audit-logs-import-migration-research.md (Lines 226-259) - Type compatibility
- **Dependencies**:
  - Task 1.1 completion (validates new import path works)

**Current Imports** (Lines 25-26):
```typescript
import { AuditLogRepository, CreateAuditLogData } from '@core/blueprint/repositories/audit-log.repository';
import { AuditEventType, AuditCategory, AuditSeverity, ActorType, AuditStatus } from '@core/models/audit-log.model';
```

**New Imports**: Same pattern as Task 1.1

**Note**: This file is marked @deprecated but still requires migration for backward compatibility during transition period.

### Task 1.3: Update module-manager.service.ts imports

Update import statements in module-manager.service.ts, handling naming convention differences.

- **Files**:
  - `src/app/features/module-manager/module-manager.service.ts` - Module lifecycle management
- **Success**:
  - Imports migrated to new modular path
  - Naming convention aligned (AuditLogEventType → AuditEventType)
  - File compiles without errors
  - All audit logging calls work correctly
- **Research References**:
  - #file:../research/20251213-audit-logs-import-migration-research.md (Lines 156-186) - module-manager.service.ts migration
  - #file:../research/20251213-audit-logs-import-migration-research.md (Lines 300-327) - Naming convention changes
- **Dependencies**:
  - Tasks 1.1 and 1.2 completion

**Current Imports** (Lines 12-14):
```typescript
import { AuditLogRepository } from '@core/blueprint/repositories/audit-log.repository';
import { AuditLogEventType, AuditLogCategory } from '@core/models/audit-log.model';
```

**New Imports (Option 1 - with aliases)**:
```typescript
import { 
  AuditLogRepository, 
  AuditEventType as AuditLogEventType,
  AuditCategory as AuditLogCategory 
} from '@core/blueprint/modules/implementations/audit-logs';
```

**New Imports (Option 2 - rename usages)**:
```typescript
import { 
  AuditLogRepository, 
  AuditEventType, 
  AuditCategory 
} from '@core/blueprint/modules/implementations/audit-logs';
```

If Option 2 is chosen, update all usages in file:
- `AuditLogEventType` → `AuditEventType`
- `AuditLogCategory` → `AuditCategory`

**Recommended**: Option 1 (aliases) for minimal code changes and backward compatibility.

### Task 1.4: Update blueprint-detail.component.ts imports

Update component import to use new modular location for AuditLogsComponent.

- **Files**:
  - `src/app/routes/blueprint/blueprint-detail.component.ts` - Blueprint detail page with audit logs display
- **Success**:
  - Component import migrated to new path
  - Component template still works
  - File compiles successfully
  - UI displays audit logs correctly
- **Research References**:
  - #file:../research/20251213-audit-logs-import-migration-research.md (Lines 188-202) - blueprint-detail.component.ts migration
  - #file:../research/20251213-audit-logs-import-migration-research.md (Lines 329-346) - Component import changes
- **Dependencies**:
  - All Phase 1 tasks (validates full migration path)

**Current Import** (Line 18):
```typescript
import { AuditLogsComponent } from './audit/audit-logs.component';
```

**New Import**:
```typescript
import { AuditLogsComponent } from '@core/blueprint/modules/implementations/audit-logs';
```

**Verification**: Ensure component selector `<app-audit-logs>` still works in template.

## Phase 2: Verify Build & Compilation

### Task 2.1: Run TypeScript compilation

Verify all changes compile successfully without errors.

- **Files**:
  - All 4 files from Phase 1
- **Success**:
  - `yarn lint:ts` completes with zero errors
  - No TypeScript compilation errors
  - All imports resolve correctly
  - Type checking passes
- **Research References**:
  - #file:../research/20251213-audit-logs-import-migration-research.md (Lines 204-224) - Migration strategy and verification
  - #file:../research/20251213-audit-logs-import-migration-research.md (Lines 380-400) - Verification checklist
- **Dependencies**:
  - Phase 1 completion (all imports updated)

**Commands to Run**:
```bash
# TypeScript compilation check
yarn lint:ts

# Or full lint if needed
yarn lint
```

**Expected Output**: Zero errors, all files type-check successfully.

### Task 2.2: Verify application starts successfully

Ensure application builds and runs without runtime errors.

- **Files**:
  - Entire application
- **Success**:
  - `yarn start` completes successfully
  - Development server starts
  - No console errors on application load
  - Audit logs functionality works correctly
- **Research References**:
  - #file:../research/20251213-audit-logs-import-migration-research.md (Lines 204-224) - Verification strategy
- **Dependencies**:
  - Task 2.1 completion (TypeScript compilation passes)

**Commands to Run**:
```bash
# Start development server
yarn start
```

**Manual Verification**:
1. Navigate to blueprint detail page
2. Verify audit logs component displays
3. Create/update a task (triggers audit logging)
4. Verify no console errors

## Phase 3: Remove Old Files

### Task 3.1: Search for remaining references to old paths

Verify no other files reference old import paths before deletion.

- **Files**:
  - Entire codebase search
- **Success**:
  - Zero references to old audit log paths found
  - All imports now use new modular location
  - Safe to proceed with file deletion
- **Research References**:
  - #file:../research/20251213-audit-logs-import-migration-research.md (Lines 402-418) - Search patterns for verification
  - #file:../research/20251213-audit-logs-import-migration-research.md (Lines 420-439) - Edge cases
- **Dependencies**:
  - Phase 2 completion (build and runtime verification)

**Search Commands**:
```bash
# Search for old model imports
grep -r "from '@core/models/audit-log" src/

# Search for old types imports
grep -r "from '@core/types/audit" src/

# Search for old repository imports
grep -r "from '@core/repositories/audit-log" src/
grep -r "from '@core/blueprint/repositories/audit-log" src/

# Search for old component imports
grep -r "from './audit/audit-logs.component" src/

# Verify only new imports exist
grep -r "from '@core/blueprint/modules/implementations/audit-logs" src/
```

**Expected Output**: No matches for old paths, only new modular paths found.

### Task 3.2: Delete redundant old files

Remove old files that are no longer referenced.

- **Files**:
  - `src/app/core/models/audit-log.model.ts` - Old model definitions
  - `src/app/core/types/audit/audit-log.types.ts` - Old type definitions
  - `src/app/core/repositories/audit-log.repository.ts` - Old repository (core)
  - `src/app/core/blueprint/repositories/audit-log.repository.ts` - Old repository (blueprint)
  - `src/app/routes/blueprint/audit/audit-logs.component.ts` - Old component
  - `src/app/routes/blueprint/audit/` directory (if empty after component removal)
- **Success**:
  - All 5+ files successfully deleted
  - No orphaned directories remain
  - Application still compiles after deletion
  - Git shows clean deletion
- **Research References**:
  - #file:../research/20251213-audit-logs-import-migration-research.md (Lines 43-65) - Old files to remove
- **Dependencies**:
  - Task 3.1 completion (verified no remaining references)

**Deletion Commands**:
```bash
# Delete old files
rm src/app/core/models/audit-log.model.ts
rm src/app/core/types/audit/audit-log.types.ts
rm src/app/core/repositories/audit-log.repository.ts
rm src/app/core/blueprint/repositories/audit-log.repository.ts
rm src/app/routes/blueprint/audit/audit-logs.component.ts

# Check if audit directory is empty and remove if so
rmdir src/app/routes/blueprint/audit/ 2>/dev/null || true

# Verify files are deleted
git status
```

### Task 3.3: Final verification and cleanup

Run complete build and test suite to ensure migration success.

- **Files**:
  - Entire application
- **Success**:
  - `yarn build` completes successfully
  - `yarn lint` passes with zero errors
  - All tests pass (if applicable)
  - Application runs without errors
  - Migration fully complete
- **Research References**:
  - #file:../research/20251213-audit-logs-import-migration-research.md (Lines 441-458) - Success criteria
- **Dependencies**:
  - Task 3.2 completion (old files removed)

**Final Verification Commands**:
```bash
# Full build
yarn build

# Full lint check
yarn lint

# Run tests (if applicable)
yarn test

# Verify clean git state
git status
git diff
```

**Documentation Updates** (if applicable):
- Update any architecture diagrams showing old paths
- Update code comments referencing old locations
- Update README if it mentions old file structure

## Dependencies

- Angular 20.3.0 with Standalone Components
- TypeScript 5.9 strict mode
- Yarn 4.9.2 package manager
- New audit logs modular implementation at `src/app/core/blueprint/modules/implementations/audit-logs/`

## Success Criteria

- All 4 files migrated to new import paths
- Zero TypeScript compilation errors
- Application builds and runs successfully
- All 5 old files safely removed
- No remaining references to old paths
- Tests pass (if applicable)
- Clean git diff showing only expected changes
