# GigHub - Copilot Instructions

## Project Overview

**GigHub** is an enterprise-level construction site progress tracking management system built with:
- **Angular 20** with Standalone Components and Signals
- **ng-alain 20** admin framework
- **ng-zorro-antd 20** (Ant Design for Angular)
- **Supabase** for backend services
- **TypeScript 5.9** with strict mode
- **RxJS 7.8** for reactive programming

### Modern Angular Features (v19+)
- ✅ **Signals**: Reactive state management with `signal()`, `computed()`, `effect()`
- ✅ **New Control Flow**: `@if`, `@for`, `@switch` syntax (replaces `*ngIf`, `*ngFor`)
- ✅ **Modern Inputs/Outputs**: `input()`, `output()`, `model()` functions
- ✅ **Functional Router Guards**: Function-based guards with `inject()`
- ⚠️ **Zoneless** (optional): Remove Zone.js dependency for better performance
- ⚠️ **SSR + Hydration** (optional): Server-side rendering with client hydration
- ⚠️ **View Transitions** (optional): Built-in page transition animations

## Autonomous Tool Usage

This repository is configured with MCP (Model Context Protocol) tools for enhanced AI assistance:

### Available MCP Tools

1. **context7**: Access up-to-date documentation for external libraries
   - Use when working with Angular, ng-alain, ng-zorro-antd, Supabase, or other frameworks
   - Ensures accurate API usage and best practices
   - Automatically queries the latest documentation

2. **sequential-thinking**: Multi-step reasoning for complex problems
   - Use for architectural decisions
   - Problem analysis and solution design
   - Complex debugging scenarios

3. **software-planning-tool**: Structured planning for features
   - Use for new feature development
   - Architecture refactoring
   - Complex technical decisions
   - Generate step-by-step implementation plans

### When to Use Tools

**Use context7 when:**
- Implementing features with external libraries
- Unsure about API signatures or best practices
- Need to verify framework-specific patterns
- Working with version-specific features
- **Querying modern Angular features** (Signals, new control flow, Zoneless, etc.)

**Use sequential-thinking when:**
- Analyzing complex bugs
- Designing system architecture
- Making technical trade-off decisions
- Multi-step problem solving

**Use software-planning-tool when:**
- Planning new features
- Refactoring large modules
- Designing integration patterns
- Creating implementation roadmaps

## Repository Guidelines

### Reference Materials (Read-Only)

- **Reference Paths**: `src` (Read only), `backup-db` (Read only)
- **Purpose**: These directories contain reference implementations and legacy schemas

**Usage Principles**:
- ✅ **Read**: Study architecture, interfaces, and data models
- ✅ **Reference**: Extract design patterns and structure
- ✅ **Summarize**: Document key concepts and approaches
- ❌ **DO NOT**: Copy-paste code directly
- ❌ **DO NOT**: Replicate complex legacy code

**Workflow**:
1. Read relevant files in `src` or `backup-db`
2. Write a 3-6 line summary of design intent
3. Reimplement in new files following project conventions
4. Document referenced files in PR description

### Code Standards

**Architecture**: Three-layer architecture
- Foundation Layer: Account, Auth, Organization
- Container Layer: Blueprint, Permissions, Events
- Business Layer: Tasks, Logs, Quality

**Component Standards**:
- Use Standalone Components (no NgModules)
- Use Signals for state management (`signal()`, `computed()`, `effect()`)
- Use `inject()` for dependency injection
- Use `input()`, `output()`, `model()` instead of decorators (Angular ≥19)
- Use new control flow syntax (`@if`, `@for`, `@switch`) instead of structural directives
- Import from `SHARED_IMPORTS` for common modules

**Naming Conventions**:
- Components: `feature-name.component.ts`
- Services: `feature-name.service.ts`
- Guards: `feature-name.guard.ts`
- Use kebab-case for file names

**State Management**:
- Use Signals for component state
- Use services for shared state
- Use `@delon/cache` for persistent data
- Use RxJS with `takeUntilDestroyed()` for subscriptions

### Integration Patterns

**Angular + ng-alain**:
```typescript
import { Component, signal } from '@angular/core';
import { STColumn } from '@delon/abc/st';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    @if (loading()) {
      <nz-spin nzSimple />
    } @else {
      <st [data]="data()" [columns]="columns" />
    }
  `
})
export class ExampleComponent {
  loading = signal(false);
  data = signal<any[]>([]);
  columns: STColumn[] = [...];
}
```

**Angular + Supabase**:
```typescript
import { inject, signal } from '@angular/core';
import { SupabaseService } from '@core/services/supabase.service';

export class DataService {
  private supabase = inject(SupabaseService);
  data = signal<any[]>([]);
  
  async load(): Promise<void> {
    const { data, error } = await this.supabase.client
      .from('table')
      .select('*');
    if (!error) this.data.set(data || []);
  }
}
```

### Quality Standards

**Code Quality**:
- TypeScript strict mode enabled
- No `any` types (use `unknown` with guards)
- Comprehensive JSDoc comments
- Unit tests for services (80%+ coverage)
- Component tests (60%+ coverage)

**Performance**:
- Use `OnPush` change detection
- Implement virtual scrolling for large lists
- Lazy load feature modules
- Optimize bundle size

**Security**:
- Use `@delon/auth` for authentication
- Implement `@delon/acl` for authorization
- Sanitize user inputs
- Follow Angular security best practices
- Implement RLS policies in Supabase

### Review Checklist

**Before PR**:
- [ ] Referenced files documented in PR description
- [ ] Legacy code rewritten, not copied
- [ ] Tests added/updated
- [ ] No TypeScript errors
- [ ] Lint passes
- [ ] Follows project architecture
- [ ] Uses SHARED_IMPORTS
- [ ] Signals for state management
- [ ] **Uses new control flow syntax** (`@if`, `@for`, `@switch`)
- [ ] **Uses modern input/output functions** (`input()`, `output()`, `model()`)
- [ ] **Uses `inject()` for dependency injection**
- [ ] Proper error handling

## Additional Documentation

See `.github/instructions/` for detailed guidelines:
- `angular.instructions.md` - Angular 20 基礎開發指引
- `angular-modern-features.instructions.md` - **Angular 現代化特性指南** ⭐
  - Signals 模式與最佳實踐
  - Standalone Components 完整指南
  - 新控制流語法 (@if, @for, @switch)
  - Zoneless Angular 架構
  - SSR + Hydration 配置
  - 內建 View Transitions
  - Functional Router Guards
  - 遷移工具使用說明
- `enterprise-angular-architecture.instructions.md` - 企業級架構模式
- `typescript-5-es2022.instructions.md` - TypeScript 標準
- `ng-alain-delon.instructions.md` - ng-alain & Delon 框架
- `ng-zorro-antd.instructions.md` - Ant Design 元件
- `angular-fire.instructions.md` - AngularFire 整合
- `sql-sp-generation.instructions.md` - 資料庫指引
- `memory-bank.instructions.md` - 文件模式

## Getting Help

1. **Use context7** for library-specific questions
2. **Use sequential-thinking** for complex analysis
3. **Use software-planning-tool** for feature planning
4. **Reference docs/** for architecture documentation
5. **Check `.github/agents/`** for specialized assistance

---

**Note**: This repository emphasizes learning from existing patterns while creating maintainable, modern implementations. Always prioritize code quality, security, and maintainability over quick solutions.
