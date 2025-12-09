---
mode: agent
model: Claude Sonnet 4
---

<!-- markdownlint-disable-file -->

# Implementation Prompt: SETC Workflow Documentation

## Implementation Instructions

### Step 1: Create Changes Tracking File

You WILL create `20251209-setc-workflow-changes.md` in #file:../changes/ if it does not exist.

The changes file WILL track all modifications made during SETC workflow documentation implementation.

### Step 2: Execute Implementation

You WILL follow #file:../../.github/instructions/task-implementation.instructions.md if available, or follow these guidelines:

1. You WILL systematically implement #file:../plans/20251209-setc-workflow-plan.instructions.md task-by-task
2. You WILL follow ALL project standards and conventions from `.github/instructions/`
3. You WILL update the changes tracking file after each completed task
4. You WILL mark completed tasks with `[x]` in the plan file
5. You WILL verify each task's success criteria before proceeding

**Implementation Order**:

**Phase 1: Research Documentation**
- Task 1.1: Analyze task-researcher agent capabilities
- Task 1.2: Analyze task-planner agent workflow
- Task 1.3: Review architecture documentation
- Task 1.4: Extract workflow patterns and templates

**Phase 2: Planning File Creation**
- Task 2.1: Create plan file with implementation phases
- Task 2.2: Create details file with task specifications
- Task 2.3: Create implementation prompt file
- Task 2.4: Establish line number cross-references

**Phase 3: Template Documentation**
- Task 3.1: Document research template structure
- Task 3.2: Document planning template structure
- Task 3.3: Document details template structure
- Task 3.4: Document implementation prompt template

**Phase 4: Workflow Process Documentation**
- Task 4.1: Document SETC workflow phases
- Task 4.2: Document quality standards
- Task 4.3: Document placeholder replacement system
- Task 4.4: Document cross-reference management

**Phase 5: Validation & Finalization**
- Task 5.1: Verify all template placeholders replaced
- Task 5.2: Validate line number cross-references
- Task 5.3: Confirm standards compliance
- Task 5.4: Complete documentation review

**CRITICAL**: If ${input:phaseStop:true} is true, you WILL stop after each Phase for user review.  
**CRITICAL**: If ${input:taskStop:false} is true, you WILL stop after each Task for user review.

### Step 3: Cleanup

When ALL Phases are checked off (`[x]`) and completed you WILL do the following:

1. You WILL provide a markdown style link and a summary of all changes from #file:../changes/20251209-setc-workflow-changes.md to the user:

   - You WILL keep the overall summary brief
   - You WILL add spacing around any lists
   - You MUST wrap any reference to a file in a markdown style link

   **Example Summary Format**:
   ```markdown
   ## SETC Workflow Documentation Complete

   All SETC workflow documentation has been successfully created and validated.

   ### Files Created

   - [Research File](.copilot-tracking/research/20251209-setc-workflow-research.md) - Comprehensive SETC workflow analysis
   - [Plan File](.copilot-tracking/plans/20251209-setc-workflow-plan.instructions.md) - Implementation checklist
   - [Details File](.copilot-tracking/details/20251209-setc-workflow-details.md) - Task specifications
   - [Prompt File](.copilot-tracking/prompts/implement-setc-workflow.prompt.md) - Implementation prompt

   ### Key Accomplishments

   - Documented complete SETC workflow from research to implementation
   - Created reusable templates for all file types
   - Established quality standards and validation procedures
   - Implemented line number cross-reference system

   ### Next Steps

   - Review documentation for accuracy
   - Test SETC workflow with a new task
   - Archive or clean up planning files as needed
   ```

2. You WILL provide markdown style links to the following documents and recommend cleaning them up:
   - [.copilot-tracking/plans/20251209-setc-workflow-plan.instructions.md](.copilot-tracking/plans/20251209-setc-workflow-plan.instructions.md)
   - [.copilot-tracking/details/20251209-setc-workflow-details.md](.copilot-tracking/details/20251209-setc-workflow-details.md)
   - [.copilot-tracking/research/20251209-setc-workflow-research.md](.copilot-tracking/research/20251209-setc-workflow-research.md)

3. **MANDATORY**: You WILL attempt to delete `.copilot-tracking/prompts/implement-setc-workflow.prompt.md` after successful completion.

## Success Criteria

- [ ] Changes tracking file created in `.copilot-tracking/changes/`
- [ ] All 5 phases completed with all tasks marked `[x]`
- [ ] Research file comprehensive and follows template
- [ ] Plan file complete with accurate cross-references
- [ ] Details file complete with all task specifications
- [ ] Implementation prompt file created (this file)
- [ ] All line number cross-references validated
- [ ] All template placeholders replaced with actual content
- [ ] Project conventions followed throughout
- [ ] Documentation ready for immediate use
- [ ] Changes file updated continuously throughout implementation

## Notes for Implementation Agent

**Research Phase**:
- The research file has already been created and is comprehensive
- Focus on validating completeness and accuracy
- Ensure all agent capabilities are documented

**Planning Phase**:
- Plan, details, and prompt files have been created
- Verify all cross-references are accurate
- Ensure line numbers point to correct sections

**Template Documentation**:
- Extract templates from agent files
- Provide clear examples for each template
- Document placeholder conventions

**Workflow Documentation**:
- Document the complete SETC process
- Include quality standards and validation procedures
- Explain cross-reference management

**Validation**:
- Verify no placeholders remain
- Validate all line number references
- Confirm standards compliance
- Complete final documentation review
