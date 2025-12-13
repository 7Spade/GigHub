---
mode: agent
model: Claude Sonnet 4
---

<!-- markdownlint-disable-file -->

# Implementation Prompt: Blueprint Domain Module Prototypes

## Implementation Instructions

### Step 1: Create Changes Tracking File

You WILL create `20251213-blueprint-domain-modules-implementation-changes.md` in #file:../changes/ if it does not exist.

### Step 2: Execute Implementation

You WILL follow #file:../../.github/instructions/task-implementation.instructions.md
You WILL systematically implement #file:../plans/20251213-blueprint-domain-modules-implementation-plan.instructions.md task-by-task
You WILL follow ALL project standards and conventions from:
- #file:../../.github/instructions/angular.instructions.md
- #file:../../.github/instructions/typescript-5-es2022.instructions.md
- #file:../../.github/instructions/enterprise-angular-architecture.instructions.md
- #file:../../.github/instructions/angular-modern-features.instructions.md

**Implementation Order**:
1. Phase 1: P1 Critical Domains (log, workflow)
2. Phase 2: P2 Important Domains (qa, acceptance, finance)
3. Phase 3: P3 Recommended Domain (material)
4. Phase 4: P4 Optional Domains (safety, communication)
5. Phase 5: Integration and Verification

**Reference Implementations**:
- Use `src/app/core/blueprint/modules/implementations/audit-logs/` as primary pattern reference
- Use `src/app/core/blueprint/modules/implementations/climate/` for API export patterns
- Refer to README files in each domain folder for data models and API specifications

**Key Implementation Patterns**:
- All modules MUST implement IBlueprintModule interface
- Use Signal-based state management (signal, computed, inject)
- Implement full lifecycle: init → start → ready → stop → dispose
- Event Bus subscription/unsubscription in init/dispose
- JSDoc comments for all public APIs
- Follow kebab-case file naming convention
- Use @Injectable({ providedIn: 'root' }) for services

**CRITICAL**: If ${input:phaseStop:true} is true, you WILL stop after each Phase for user review.
**CRITICAL**: If ${input:taskStop:false} is true, you WILL stop after each Task for user review.

### Step 3: Cleanup

When ALL Phases are checked off (`[x]`) and completed you WILL do the following:

1. You WILL provide a markdown style link and a summary of all changes from #file:../changes/20251213-blueprint-domain-modules-implementation-changes.md to the user:

   - You WILL keep the overall summary brief
   - You WILL add spacing around any lists
   - You MUST wrap any reference to a file in a markdown style link

2. You WILL provide markdown style links to:
   - [Plan File](.copilot-tracking/plans/20251213-blueprint-domain-modules-implementation-plan.instructions.md)
   - [Details File](.copilot-tracking/details/20251213-blueprint-domain-modules-implementation-details.md)
   - [Research File](.copilot-tracking/research/20251213-blueprint-domain-modules-implementation-research.md)
   
   You WILL recommend cleaning these files up as well.

3. **MANDATORY**: You WILL attempt to delete .copilot-tracking/prompts/implement-blueprint-domain-modules.prompt.md

## Success Criteria

- [ ] Changes tracking file created
- [ ] Phase 1 (log, workflow) implemented with all files
- [ ] Phase 2 (qa, acceptance, finance) implemented
- [ ] Phase 3 (material) implemented
- [ ] Phase 4 (safety, communication) implemented
- [ ] Phase 5 (integration, verification) completed
- [ ] All 8 domains compile without TypeScript errors
- [ ] All 8 domains pass ESLint
- [ ] Module index updated with all exports
- [ ] Changes file updated continuously
- [ ] Total ~11,500 lines of production code created
- [ ] All modules follow IBlueprintModule interface
- [ ] Event Bus integration implemented for all modules
- [ ] Signal-based state management used throughout
- [ ] JSDoc documentation present for all public APIs
