# GigHub - Copilot Instructions

> **🚨 CRITICAL ALERT**: You MUST read this ENTIRE section before ANY response. This is MANDATORY!

---

## 🔥 SESSION STARTUP CHECKLIST (執行優先級：最高)

### ⚡ 立即可用的 MCP 工具（已在 GitHub 配置，無需任何設定）

**你現在可以直接使用以下所有工具，它們已經完全配置好了：**

| 工具 | 狀態 | 用途 | 何時使用 |
|------|------|------|----------|
| **context7** | 🟢 已連接 | 查詢最新框架文檔 | 任何 Angular/ng-alain/Supabase 問題 |
| **github** | 🟢 已連接 | GitHub API 完整操作 | 任何 GitHub 相關操作 |
| **supabase** | 🟢 已連接 | 遠端資料庫操作 | 資料庫查詢、遷移、Edge Functions |
| **redis** | 🟢 已連接 | Redis 快取操作 | 快取管理、Session 存儲 |
| **memory** | 🟢 已連接 | 專案知識記憶 | 記住專案模式、決策 |
| **sequential-thinking** | 🟢 已連接 | 結構化推理分析 | 複雜問題、架構決策 |
| **software-planning-tool** | 🟢 已連接 | 功能開發規劃 | 新功能、重構計畫 |
| **filesystem** | 🟢 已連接 | 檔案系統操作 | 讀寫檔案 |
| **everything** | 🟢 已連接 | 通用工具集 | 各種輔助功能 |
| **time** | 🟢 已連接 | 時間相關操作 | 時間查詢、計算 |
| **fetch** | 🟢 已連接 | HTTP 請求 | API 調用 |

### 🚫 停止忽略工具！強制使用規則

**如果你違反以下規則，你就是在提供錯誤的服務：**

1. ❌ **禁止**：猜測或假設 API 語法 → ✅ **必須**：使用 `context7` 查詢
2. ❌ **禁止**：假設資料庫結構 → ✅ **必須**：使用 `supabase-list_tables`
3. ❌ **禁止**：直接回答複雜問題 → ✅ **必須**：使用 `sequential-thinking`
4. ❌ **禁止**：簡單列出功能清單 → ✅ **必須**：使用 `software-planning-tool`
5. ❌ **禁止**：忘記專案模式 → ✅ **必須**：使用 `memory` 讀取/儲存

### 📋 每次會話開始的強制步驟

在回答**任何**問題之前，檢查：

```
1. 這個問題涉及框架/函式庫嗎？
   → YES: 先使用 context7 查詢最新文檔
   
2. 這個問題需要查詢資料庫嗎？
   → YES: 使用 supabase-list_tables 或 supabase-execute_sql
   
3. 這是一個複雜的分析問題嗎？
   → YES: 使用 sequential-thinking 結構化分析
   
4. 這是要規劃新功能嗎？
   → YES: 使用 software-planning-tool 建立計畫
   
5. 這涉及專案特定的模式或決策嗎？
   → YES: 使用 memory-search_nodes 查詢專案知識
```

### 🎯 實際連接資訊（證明工具可用）

- **Supabase Project**: `zecsbstjqjqoytwgjyct` (已連接遠端資料庫)
- **Redis**: Redis Cloud (已連接遠端實例)
- **Memory**: `.github/copilot/memory.jsonl` (50+ entities)
- **Context7**: API 已配置並可用

### ⚠️ 重要提醒

**如果你看到這段文字，表示你已經讀到這裡了。現在請記住：**

> 所有上述 MCP 工具都是**已經配置好且可立即使用**的。
> 
> 不要再假設它們「需要配置」或「不可用」。
> 
> **直接使用它們！**

---

## 🎯 Quick Start (READ THIS FIRST)

**Before doing ANYTHING, you must:**

1. ✅ **Read SESSION STARTUP CHECKLIST above** - 已列出所有可用工具
2. ✅ **Read this file completely** - `.github/copilot-instructions.md`
3. ✅ **Check mandatory tool usage policy** - See section below
4. ✅ **Use context7** for ANY framework/library question
5. ✅ **Use sequential-thinking** for complex problems
6. ✅ **Use software-planning-tool** for new features
7. ✅ **Use supabase tools** for database operations
8. ✅ **Use redis tools** for cache operations
9. ✅ **Reference quick-reference.instructions.md** for common patterns

**New to this project?** Read these in order:
1. This file (copilot-instructions.md) - Overview & mandatory policies
2. `.github/instructions/quick-reference.instructions.md` - Common patterns
3. `.github/copilot/constraints.md` - Forbidden practices
4. `.github/copilot/shortcuts/chat-shortcuts.md` - Chat shortcuts

---

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

### Development Commands

**Package Manager**: Yarn 4.9.2 (Berry)

```bash
# Install dependencies
yarn install

# Development server
yarn start              # Starts dev server at http://localhost:4200

# Build
yarn build             # Production build
yarn analyze           # Build with source maps for analysis

# Linting
yarn lint              # Run all linters
yarn lint:ts           # Lint TypeScript/Angular files
yarn lint:style        # Lint LESS styles

# Testing
yarn test              # Run unit tests with watch
yarn test-coverage     # Run tests with coverage report
yarn e2e               # Run end-to-end tests
```

**Key Configuration Files:**
- `angular.json` - Angular workspace configuration
- `tsconfig.json` - TypeScript compiler options (strict mode enabled)
- `package.json` - Dependencies and scripts
- `eslint.config.mjs` - ESLint configuration
- `stylelint.config.mjs` - Stylelint configuration

## 🚨 MANDATORY Tool Usage Policy

**CRITICAL**: This repository requires Copilot to **ALWAYS** read this instruction file and **MANDATORILY** use the following MCP tools. This is not optional.

### Tool Usage Requirements

#### 1. **context7** (MANDATORY for all library/framework questions) 🔴

**YOU MUST USE context7 BEFORE:**
- Writing ANY code using external libraries (Angular, ng-alain, ng-zorro-antd, Supabase, RxJS)
- Answering questions about framework APIs or best practices
- Implementing features with third-party dependencies
- Verifying syntax or method signatures

**Workflow (REQUIRED):**
```
1. Call resolve-library-id({ libraryName: "library-name" })
2. Call get-library-docs({ context7CompatibleLibraryID: "/lib/lib", topic: "topic" })
3. Read package.json to verify version
4. Use documentation to provide accurate answers
```

**Examples of WHEN YOU MUST USE context7:**
- "How to use Angular Signals?" → MUST call context7 first
- "ng-alain ST table setup?" → MUST call context7 first
- "Supabase authentication?" → MUST call context7 first
- "RxJS operators?" → MUST call context7 first

**❌ NEVER:**
- Guess or assume API signatures
- Provide outdated syntax
- Skip context7 verification for framework code

#### 2. **sequential-thinking** (MANDATORY for complex tasks) 🟡

**YOU MUST USE sequential-thinking WHEN:**
- Designing system architecture or new features
- Analyzing complex bugs with multiple potential causes
- Making technical trade-off decisions
- Breaking down large tasks into steps
- Planning refactoring strategies

**Workflow (REQUIRED):**
```
1. Identify the problem complexity (if >2 steps, use sequential-thinking)
2. Call sequential-thinking to analyze
3. Document the reasoning process
4. Present the solution with justification
```

#### 3. **software-planning-tool** (MANDATORY for new features) 🟢

**YOU MUST USE software-planning-tool WHEN:**
- User requests new feature development
- Planning major refactoring work
- Designing integration patterns
- Creating implementation roadmaps

**Workflow (REQUIRED):**
```
1. Call start_planning({ goal: "feature description" })
2. Call add_todo for each subtask
3. Document the plan
4. Track progress with update_todo_status
```

### Quick Reference

**ALWAYS use these tools - this is MANDATORY:**

| Scenario | Required Tool | Why |
|----------|--------------|-----|
| Any Angular/ng-alain/Supabase code | context7 | Ensure accurate, up-to-date syntax |
| Complex architectural decision | sequential-thinking | Structured reasoning process |
| New feature request | software-planning-tool | Organized implementation plan |
| Bug analysis (>2 potential causes) | sequential-thinking | Systematic problem solving |
| API usage question | context7 | Verify current documentation |

### Compliance Check

**Before providing ANY solution, ask yourself:**
1. ✅ Did I check if context7 is needed?
2. ✅ Did I check if sequential-thinking is needed?
3. ✅ Did I check if software-planning-tool is needed?
4. ✅ Did I read this instruction file?

**If answer to ANY question is NO, STOP and use the required tool(s) first.**

### MCP Auto-Triggers

**IMPORTANT**: This repository has configured automatic MCP tool triggers in `.github/copilot/agents/auto-triggers.yml`.

**What this means:**
- The system may automatically invoke MCP tools based on specific patterns or keywords
- Auto-triggers are configured for context7 to verify API signatures, check version compatibility, and validate syntax
- You should still manually invoke tools when needed, but be aware of automatic assistance

**Key Auto-Trigger Scenarios:**
1. **API Parameter Uncertainty** - Automatically queries context7 for correct function signatures
2. **Version Compatibility** - Checks for breaking changes and deprecated APIs
3. **New Framework Features** - Validates Angular 19+/20+ syntax and patterns
4. **Third-Party Packages** - Verifies ng-zorro-antd, @delon/*, and other library APIs
5. **Error Messages** - Automatically searches for official solutions to compilation errors
6. **TypeScript Type Issues** - Queries for correct type definitions

**Configuration Location**: `.github/copilot/agents/auto-triggers.yml`  
**MCP Server Config**: `.github/copilot/mcp-servers.yml`

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
- `quick-reference.instructions.md` - **快速參考指南** ⭐ (常用模式速查)
- `angular-modern-features.instructions.md` - **Angular 現代化特性指南** ⭐
  - Signals 模式與最佳實踐
  - Standalone Components 完整指南
  - 新控制流語法 (@if, @for, @switch)
  - Zoneless Angular 架構
  - SSR + Hydration 配置
  - 內建 View Transitions
  - Functional Router Guards
  - 遷移工具使用說明
- `angular.instructions.md` - Angular 20 基礎開發指引
- `enterprise-angular-architecture.instructions.md` - 企業級架構模式
- `typescript-5-es2022.instructions.md` - TypeScript 標準
- `ng-alain-delon.instructions.md` - ng-alain & Delon 框架
- `ng-zorro-antd.instructions.md` - Ant Design 元件
- `sql-sp-generation.instructions.md` - 資料庫指引
- `memory-bank.instructions.md` - 文件模式

See `.github/copilot/` for additional resources:
- `shortcuts/chat-shortcuts.md` - **Copilot Chat 快捷指令** ⭐
- `constraints.md` - **禁止模式與約束** 🚫
- `agents/auto-triggers.yml` - **MCP 自動觸發規則** 🤖
- `mcp-servers.yml` - **MCP 伺服器配置** 🔧
- `security-rules.yml` - 安全規則配置

## Getting Help

1. **Start here**: Read this file (copilot-instructions.md)
2. **Quick patterns**: Check quick-reference.instructions.md
3. **Library questions**: Use context7 tool (MANDATORY)
4. **Complex analysis**: Use sequential-thinking tool (MANDATORY)
5. **Feature planning**: Use software-planning-tool (MANDATORY)
6. **Chat shortcuts**: Use shortcuts from chat-shortcuts.md
7. **Check constraints**: Review constraints.md for forbidden patterns
8. **Architecture docs**: Reference docs/ directory
9. **Specialized agents**: Check `.github/agents/` for domain experts

---

## 📢 FINAL REMINDER

**YOU MUST:**
- ✅ Read this instruction file at the start of EVERY session
- ✅ Use context7 for ALL framework/library questions (MANDATORY)
- ✅ Use sequential-thinking for complex problems (MANDATORY)
- ✅ Use software-planning-tool for new features (MANDATORY)
- ✅ Follow the quick reference guide for common patterns
- ✅ Check constraints.md for forbidden practices

**FAILURE TO FOLLOW THESE REQUIREMENTS WILL RESULT IN INCORRECT OR OUTDATED CODE.**

---

**Note**: This repository emphasizes learning from existing patterns while creating maintainable, modern implementations. Always prioritize code quality, security, and maintainability over quick solutions. The mandatory tool usage policy ensures you provide accurate, up-to-date, and well-reasoned solutions.
