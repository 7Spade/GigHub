---
applyTo: '.copilot-tracking/changes/20251209-blueprint-architecture-changes.md'
---

<!-- markdownlint-disable-file -->

# 任務檢查清單：GigHub Blueprint 架構重構 (Task Checklist: GigHub Blueprint Architecture Refactoring)

## 概述 (Overview)

使用六邊形架構、DDD、CQRS 和事件驅動模式重構 Blueprint 模組，以實現關注點的清晰分離、可測試性和可擴展性。

## 目標 (Objectives)

- 將業務邏輯與基礎設施相依性解耦
- 實作清晰的架構邊界（領域層、應用層、基礎設施層）
- 支援資料庫彈性（Firestore/Supabase）
- 支援事件驅動的模組間通訊
- 達成 80%+ 的測試覆蓋率
- 在遷移過程中維持向後相容性

## 研究摘要 (Research Summary)

**來源研究 (Source Research)**: `.copilot-tracking/research/20251209-blueprint-architecture-analysis-research.md`

**關鍵架構決策 (Key Architectural Decisions)**:
- 帶埠與適配器的六邊形架構
- 領域驅動設計，包含聚合和值物件
- CQRS 用於讀寫分離
- 事件驅動架構用於模組通訊
- Facade 模式用於簡化 UI

**來源文檔 (Source Documentation)**: `docs/GigHub_Blueprint_Architecture.md` (1910 行)

## 實作檢查清單 (Implementation Checklist)

### [ ] 階段 1：基礎重構 (Phase 1: Foundation Refactoring) (第 1-2 週)

#### [ ] 1.1: 建立領域層結構 (Create Domain Layer Structure)
- [ ] 定義儲存庫介面
  - 詳細資訊 (Details): .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 20-45)
- [ ] 建立值物件
  - 詳細資訊 (Details): .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 47-68)
- [ ] 定義領域事件
  - 詳細資訊 (Details): .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 70-92)
- [ ] 實作聚合基底類別
  - 詳細資訊 (Details): .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 94-110)

#### [ ] 1.2: 引入 Facade 模式 (Introduce Facade Pattern)
- [ ] 建立 BlueprintFacade 服務
  - 詳細資訊 (Details): .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 112-145)
- [ ] 委派給現有的 BlueprintService
  - 詳細資訊 (Details): .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 147-160)
- [ ] 更新 UI 元件以使用 Facade
  - 詳細資訊 (Details): .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 162-180)

#### [ ] 1.3: 設定 Event Bus 基礎設施 (Setup Event Bus Infrastructure)
- [ ] 使用 RxJS 建立 EventBus 服務
  - 詳細資訊 (Details): .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 182-215)
- [ ] 定義事件介面
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 217-235)
- [ ] Add logging for debugging
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 237-250)

#### [ ] 1.4: Validation & Testing
- [ ] Unit tests for value objects
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 252-270)
- [ ] Integration tests for Facade
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 272-290)
- [ ] Regression tests
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 292-305)

---

### [ ] Phase 2: Command/Query Separation (Weeks 3-4)

#### [ ] 2.1: Create Command Handlers
- [ ] Implement CreateBlueprintHandler
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 307-340)
- [ ] Implement UpdateBlueprintHandler
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 342-370)
- [ ] Implement DeleteBlueprintHandler
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 372-395)
- [ ] Implement AddMemberHandler
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 397-420)

#### [ ] 2.2: Create Query Handlers
- [ ] Implement GetBlueprintByIdQuery
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 422-445)
- [ ] Implement ListBlueprintsQuery
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 447-475)
- [ ] Implement GetBlueprintMembersQuery
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 477-495)

#### [ ] 2.3: Implement Blueprint Aggregate
- [ ] Create Blueprint Aggregate with business logic
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 497-560)
- [ ] Add event generation methods
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 562-585)
- [ ] Implement invariant checks
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 587-605)

#### [ ] 2.4: Update Facade to Use Handlers
- [ ] Route commands to handlers
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 607-630)
- [ ] Route queries to handlers
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 632-650)
- [ ] Maintain backward compatibility
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 652-665)

#### [ ] 2.5: Comprehensive Testing
- [ ] Unit tests for handlers
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 667-690)
- [ ] Aggregate behavior tests
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 692-715)
- [ ] End-to-end workflow tests
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 717-735)

---

### [ ] Phase 3: Repository Abstraction (Weeks 5-6)

#### [ ] 3.1: Implement Repository Interfaces
- [ ] Create FirestoreBlueprintRepository
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 737-780)
- [ ] Create FirestoreMemberRepository
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 782-820)
- [ ] Move Firestore-specific code
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 822-845)

#### [ ] 3.2: Dependency Injection Configuration
- [ ] Configure DI for interfaces
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 847-875)
- [ ] Use InjectionToken
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 877-895)
- [ ] Update handlers to inject interfaces
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 897-915)

#### [ ] 3.3: Create Supabase Repository Skeleton
- [ ] Implement basic CRUD for Supabase
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 917-955)
- [ ] Add feature flag for switching
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 957-975)

#### [ ] 3.4: Testing
- [ ] Repository integration tests
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 977-1000)
- [ ] Database switching tests
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 1002-1020)

---

### [ ] Phase 4: Event-Driven Integration (Weeks 7-8)

#### [ ] 4.1: Implement Event Publishing
- [ ] Update aggregates to generate events
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 1022-1050)
- [ ] Publish events from handlers
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 1052-1070)
- [ ] Add event metadata
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 1072-1090)

#### [ ] 4.2: Create Event Subscribers
- [ ] Implement AuditLogEventHandler
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 1092-1125)
- [ ] Implement PermissionCacheHandler
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 1127-1150)
- [ ] Implement NotificationHandler
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 1152-1175)

#### [ ] 4.3: Implement Audit Trail
- [ ] Create audit log repository
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 1177-1205)
- [ ] Subscribe to all blueprint events
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 1207-1225)

#### [ ] 4.4: Event Replay Capability
- [ ] Implement event store
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 1227-1255)
- [ ] Add event replay service
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 1257-1280)

#### [ ] 4.5: Testing
- [ ] Event publishing tests
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 1282-1305)
- [ ] End-to-end event flow tests
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 1307-1330)

---

### [ ] Phase 5: Module System & Final Polish (Weeks 9-10)

#### [ ] 5.1: Create Module Registry
- [ ] Define module interface
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 1332-1360)
- [ ] Implement module discovery
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 1362-1385)
- [ ] Add lifecycle hooks
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 1387-1410)

#### [ ] 5.2: Refactor Existing Modules
- [ ] Wrap Task module
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 1412-1435)
- [ ] Wrap Log module
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 1437-1460)
- [ ] Wrap Quality Check module
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 1462-1485)

#### [ ] 5.3: Module Communication
- [ ] Modules subscribe to events
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 1487-1510)
- [ ] Cross-module workflows
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 1512-1535)

#### [ ] 5.4: Performance Optimization
- [ ] Add query result caching
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 1537-1560)
- [ ] Optimize Firestore indexes
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 1562-1580)
- [ ] Add loading states
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 1582-1600)

#### [ ] 5.5: Documentation & Training
- [ ] Update architecture docs
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 1602-1625)
- [ ] Create developer guide
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 1627-1650)
- [ ] Conduct team training
  - Details: .copilot-tracking/details/20251209-blueprint-architecture-details.md (Lines 1652-1670)

---

## Dependencies

### Required Tools
- Angular CLI 20.3.x
- Firebase CLI with Emulator
- TypeScript 5.9+
- Jest for unit testing
- Cypress for E2E testing

### Required Knowledge
- Angular 20 Signals and Standalone Components
- Domain-Driven Design principles
- Hexagonal Architecture pattern
- CQRS pattern
- Event-Driven Architecture
- TypeScript strict mode
- Firestore API and security rules

### External Dependencies
- @angular/fire for Firebase integration
- RxJS 7.8+ for reactive programming
- ng-alain & ng-zorro-antd for UI components
- Firestore Emulator for local development

## Success Criteria

### Phase Completion Criteria

**Phase 1 Complete**:
- [ ] Domain layer structure in place
- [ ] Facade service operational
- [ ] Event Bus infrastructure ready
- [ ] All UI components use Facade
- [ ] No regression in functionality

**Phase 2 Complete**:
- [ ] All CRUD operations use handlers
- [ ] Blueprint Aggregate enforces business rules
- [ ] Queries bypass domain logic
- [ ] Test coverage > 80%

**Phase 3 Complete**:
- [ ] No direct Firestore dependencies in handlers
- [ ] Repository interfaces fully abstracted
- [ ] Supabase repositories implemented
- [ ] Database switching via feature flag works

**Phase 4 Complete**:
- [ ] All state changes publish events
- [ ] Audit trail captures all operations
- [ ] Event handlers process asynchronously
- [ ] Event replay functional

**Phase 5 Complete**:
- [ ] Module system operational
- [ ] All features converted to modules
- [ ] Performance targets met (TTI < 3s, FCP < 1.5s)
- [ ] Team trained on architecture

### Overall Success
- [ ] All 5 phases completed
- [ ] 80%+ test coverage achieved
- [ ] Performance targets met
- [ ] No regressions in functionality
- [ ] Documentation complete
- [ ] Team trained and confident

---

**Plan Version**: 1.0.0  
**Created**: 2025-12-09  
**Source Research**: 20251209-blueprint-architecture-analysis-research.md  
**Implementation Duration**: 10 weeks (5 phases × 2 weeks)  
**Estimated Effort**: 400-500 hours total
