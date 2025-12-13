---
applyTo: ".copilot-tracking/changes/20251213-audit-logs-import-migration-changes.md"
---

<!-- markdownlint-disable-file -->

# Task Checklist: Audit Logs Import Migration

## Overview

Migrate all audit logs imports from scattered old locations to the new modular implementation at `src/app/core/blueprint/modules/implementations/audit-logs/`.

## Objectives

- Update all import statements in 4 files to use new modular location
- Remove 5 redundant old files after successful migration
- Maintain 100% functionality with zero breaking changes
- Ensure TypeScript compilation and tests pass

## Research Summary

### Project Files

- `src/app/core/stores/task.store.ts` - Uses audit logging for task operations
- `src/app/core/blueprint/modules/implementations/tasks/tasks.service.ts` - Deprecated service with audit logging
- `src/app/features/module-manager/module-manager.service.ts` - Module lifecycle audit logging
- `src/app/routes/blueprint/blueprint-detail.component.ts` - Displays audit logs component
- `src/app/core/blueprint/modules/implementations/audit-logs/` - New modular implementation

### External References

- #file:../research/20251213-audit-logs-import-migration-research.md - Complete migration analysis
- #file:../../.github/instructions/angular.instructions.md - Angular 20 coding standards
- #file:../../.github/instructions/typescript-5-es2022.instructions.md - TypeScript conventions

### Standards References

- #file:../../.github/instructions/quick-reference.instructions.md - Import patterns and best practices
- #file:../../.github/copilot-instructions.md - Project architecture principles

## Implementation Checklist

### [ ] Phase 1: Update Import Statements

- [ ] Task 1.1: Update task.store.ts imports
  - Details: .copilot-tracking/details/20251213-audit-logs-import-migration-details.md (Lines 15-45)

- [ ] Task 1.2: Update tasks.service.ts imports
  - Details: .copilot-tracking/details/20251213-audit-logs-import-migration-details.md (Lines 47-75)

- [ ] Task 1.3: Update module-manager.service.ts imports
  - Details: .copilot-tracking/details/20251213-audit-logs-import-migration-details.md (Lines 77-110)

- [ ] Task 1.4: Update blueprint-detail.component.ts imports
  - Details: .copilot-tracking/details/20251213-audit-logs-import-migration-details.md (Lines 112-135)

### [ ] Phase 2: Verify Build & Compilation

- [ ] Task 2.1: Run TypeScript compilation
  - Details: .copilot-tracking/details/20251213-audit-logs-import-migration-details.md (Lines 137-160)

- [ ] Task 2.2: Verify application starts successfully
  - Details: .copilot-tracking/details/20251213-audit-logs-import-migration-details.md (Lines 162-180)

### [ ] Phase 3: Remove Old Files

- [ ] Task 3.1: Search for remaining references to old paths
  - Details: .copilot-tracking/details/20251213-audit-logs-import-migration-details.md (Lines 182-210)

- [ ] Task 3.2: Delete redundant old files
  - Details: .copilot-tracking/details/20251213-audit-logs-import-migration-details.md (Lines 212-240)

- [ ] Task 3.3: Final verification and cleanup
  - Details: .copilot-tracking/details/20251213-audit-logs-import-migration-details.md (Lines 242-265)

## Dependencies

- Angular 20.3.0 with Standalone Components
- TypeScript 5.9 with strict mode enabled
- New audit logs modular implementation complete
- Yarn 4.9.2 for package management

## Success Criteria

- All 4 files successfully migrated to new import paths
- Zero TypeScript compilation errors
- Application builds and starts without errors
- All 5 old files safely removed
- No remaining references to old paths in codebase
- Tests pass (if applicable)
