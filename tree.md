│  AGENTS.md  — Project agent guidelines and contributor instructions
│  index.html  — Application HTML shell / entry page
│  main.ts  — Angular bootstrap / app entrypoint
│  style-icons-auto.ts  — Generated icon registrations (auto)
│  style-icons.ts  — Icon list and manual icon utilities
│  styles.less  — Global Less styles for the app
│  typings.d.ts  — TypeScript global type declarations

├─app  — Main Angular application sources
│  │  AGENTS.md  — App-level agent guide and notes
│  │  app.component.ts  — Root Angular component
│  │  app.config.ts  — Application configuration constants
│  ├─core  — Core services, repositories, and shared logic
│  │  │  AGENTS.md  — Core module agent notes
│  │  │  index.ts  — Core public exports
│  │  │  README.md  — Core module overview
│  │  │  start-page.guard.ts  — Routing guard for start page
│  │  ├─blueprint  — Blueprint container framework and modules
│  │  │  │  AGENTS.md  — Blueprint design notes
│  │  │  │  index.ts  — Blueprint public exports
│  │  │  ├─config  — Blueprint configuration interfaces and helpers
│  │  │  │      blueprint-config.interface.ts  — Blueprint config type
│  │  │  │      index.ts  — Config exports
│  │  │  ├─container  — Container runtime, lifecycle and registry
│  │  │  │      blueprint-container.interface.ts  — Container types
│  │  │  │      blueprint-container.spec.ts  — Container tests
│  │  │  │      blueprint-container.ts  — Container implementation
│  │  │  │      index.ts  — Container exports
│  │  │  │      lifecycle-manager.interface.ts  — Lifecycle API types
│  │  │  │      lifecycle-manager.spec.ts  — Lifecycle tests
│  │  │  │      lifecycle-manager.ts  — Lifecycle manager impl
│  │  │  │      module-registry.interface.ts  — Module registry types
│  │  │  │      module-registry.spec.ts  — Registry tests
│  │  │  │      module-registry.ts  — Module registry implementation
│  │  │  │      resource-provider.interface.ts  — Resource provider types
│  │  │  │      resource-provider.spec.ts  — Provider tests
│  │  │  │      resource-provider.ts  — Resource provider impl
│  │  │  ├─context  — Execution and shared blueprint context utilities
│  │  │  │      execution-context.interface.ts  — Execution context types
│  │  │  │      index.ts  — Context exports
│  │  │  │      shared-context.spec.ts  — Tests for shared context
│  │  │  │      shared-context.ts  — Shared context implementation
│  │  │  │      tenant-info.interface.ts  — Tenant metadata types
│  │  │  ├─events  — Event bus and event type definitions
│  │  │  │      event-bus.interface.ts  — Event bus API
│  │  │  │      event-bus.spec.ts  — Event bus tests
│  │  │  │      event-bus.ts  — Event bus implementation
│  │  │  │      event-types.ts  — Event type constants
│  │  │  │      index.ts  — Events exports
│  │  │  ├─integration  — Integration tests for blueprint subsystems
│  │  │  │      container-lifecycle.integration.spec.ts  — Lifecycle tests
│  │  │  │      event-bus.integration.spec.ts  — Event bus integration tests
│  │  │  │      module-communication.integration.spec.ts  — Module comms tests
│  │  │  ├─models  — Shared model interfaces for blueprints
│  │  │  │      index.ts  — Model exports
│  │  │  │      module-connection.interface.ts  — Module connection types
│  │  │  ├─modules  — Blueprint modules definitions and implementations
│  │  │  │  │  index.ts  — Modules entry
│  │  │  │  │  module-status.enum.ts  — Status enum for modules
│  │  │  │  │  module.interface.ts  — Module interface
│  │  │  │  │  └─implementations  — Concrete module implementations
│  │  │  │      │  index.ts  — Implementations index
│  │  │  │      ├─acceptance  — Acceptance module (QA/inspection workflows)
│  │  │  │      │  │  acceptance.module.ts  — Module entry
│  │  │  │      │  │  index.ts  — Exports
│  │  │  │      │  │  module.metadata.ts  — Metadata for module registry
│  │  │  │      │  │  README.md  — Module documentation
│  │  │  │      │  ├─models  — Acceptance models
│  │  │  │      │  │      acceptance.model.ts  — Acceptance data model
│  │  │  │      │  │      index.ts  — Models export
│  │  │  │      │  ├─repositories  — Data access for acceptance
│  │  │  │      │  │      acceptance.repository.ts  — Acceptance repo
│  │  │  │      │  └─services  — Acceptance domain services
│  │  │  │      │          conclusion.service.ts  — Finalization logic
│  │  │  │      │          preliminary.service.ts  — Preliminary checks
│  │  │  │      │          re-inspection.service.ts  — Re-inspection flows
│  │  │  │      │          request.service.ts  — Acceptance requests
│  │  │  │      │          review.service.ts  — Review workflows
│  │  │  │      ├─audit-logs  — Audit logging module for actions and changes
│  │  │  │      │  │  audit-logs.module.ts  — Module entry
│  │  │  │      │  │  index.ts  — Exports
│  │  │  │      │  │  module.metadata.ts  — Registry metadata
│  │  │  │      │  │  README.md  — Module documentation
│  │  │  │      │  ├─components  — UI components for audit logs
│  │  │  │      │  │      audit-logs.component.ts  — Audit logs UI
│  │  │  │      │  ├─config  — Audit logs configuration
│  │  │  │      │  │      audit-logs.config.ts  — Config constants
│  │  │  │      │  ├─exports  — Module export adapters/APIs
│  │  │  │      │  │      audit-logs-api.exports.ts  — External API exports
│  │  │  │      │  ├─models  — Audit log data types
│  │  │  │      │  │      audit-log.model.ts  — Audit log model
│  │  │  │      │  │      audit-log.types.ts  — Type definitions
│  │  │  │      │  ├─repositories  — Data layer for audit logs
│  │  │  │      │  │      audit-log.repository.ts  — Repo implementation
│  │  │  │      │  └─services  — Audit logging services
│  │  │  │      │          audit-logs.service.ts  — High-level audit API
│  │  │  │      ├─climate  — Weather/climate integration module
│  │  │  │      │  │  climate.module.ts  — Module entry
│  │  │  │      │  │  index.ts  — Exports
│  │  │  │      │  │  README.md  — Module docs and usage
│  │  │  │      │  ├─config  — Climate API config and constants
│  │  │  │      │  │      climate.config.ts  — Config values
│  │  │  │      │  │      cwb-api.constants.ts  — CWB API constants
│  │  │  │      │  ├─examples  — Usage examples for climate module
│  │  │  │      │  │      usage-example.ts  — Example usage snippet
│  │  │  │      │  ├─exports  — External API adapters for climate
│  │  │  │      │  │      climate-api.exports.ts  — Exports for API
│  │  │  │      │  ├─models  — Climate-related models
│  │  │  │      │  │      cwb-api-response.model.ts  — Raw API response model
│  │  │  │      │  │      weather-forecast.model.ts  — Forecast model
│  │  │  │      │  ├─repositories  — Data access for climate data
│  │  │  │      │  │      climate.repository.ts  — Repo impl
│  │  │  │      │  └─services  — Climate domain services
│  │  │  │      │          climate-cache.service.ts  — Caching service
│  │  │  │      │          cwb-weather.service.ts  — CWB API integration
│  │  │  │      ├─communication  — Messaging and notifications module
│  │  │  │      │  │  communication.module.ts  — Module entry
│  │  │  │      │  │  index.ts  — Exports
│  │  │  │      │  │  module.metadata.ts  — Registry metadata
│  │  │  │      │  │  README.md  — Module docs
│  │  │  │      │  ├─models  — Communication models
│  │  │  │      │  │      communication.model.ts  — Message model
│  │  │  │      │  │      index.ts  — Model exports
│  │  │  │      │  ├─repositories  — Messaging repositories
│  │  │  │      │  │      communication.repository.ts  — Repo impl
│  │  │  │      │  └─services  — Communication services (push, reminders)
│  │  │  │      │          group-message.service.ts  — Group messaging logic
│  │  │  │      │          push-notification.service.ts  — Push service
│  │  │  │      │          system-notification.service.ts  — System notifications
│  │  │  │      │          task-reminder.service.ts  — Task reminders
│  │  │  │      ├─finance  — Financial features (budget, invoices)
│  │  │  │      │  │  finance.module.ts  — Module entry
│  │  │  │      │  │  index.ts  — Exports
│  │  │  │      │  │  module.metadata.ts  — Registry metadata
│  │  │  │      │  │  README.md  — Module docs
│  │  │  │      │  ├─models  — Finance data models
│  │  │  │      │  │      finance.model.ts  — Finance model
│  │  │  │      │  │      index.ts  — Model exports
│  │  │  │      │  ├─repositories  — Finance data access
│  │  │  │      │  │      finance.repository.ts  — Repo implementation
│  │  │  │      │  └─services  — Finance business services
│  │  │  │      │          budget.service.ts  — Budget management
│  │  │  │      │          cost-management.service.ts  — Cost tracking
│  │  │  │      │          financial-report.service.ts  — Reports
│  │  │  │      │          invoice.service.ts  — Invoice flows
│  │  │  │      │          ledger.service.ts  — Ledger operations
│  │  │  │      │          payment.service.ts  — Payments handling
│  │  │  │      ├─log  — Logging module for domain events and activity
│  │  │  │      │  │  index.ts  — Exports
│  │  │  │      │  │  log.module.ts  — Module entry
│  │  │  │      │  │  module.metadata.ts  — Registry metadata
│  │  │  │      │  │  README.md  — Module docs
│  │  │  │      │  ├─models  — Log-related models
│  │  │  │      │  │      activity-log.model.ts  — Activity log model
│  │  │  │      │  ├─repositories  — Log data access
│  │  │  │      │  │      log.repository.ts  — Log repo impl
│  │  │  │      │  └─services  — Log and attachment services
│  │  │  │      │          activity-log.service.ts  — Activity logging
│  │  │  │      │          attachment.service.ts  — Attachments handling
│  │  │  │      │          change-history.service.ts  — Change history
│  │  │  │      │          comment.service.ts  — Commenting features
│  │  │  │      │          system-event.service.ts  — System events
│  │  │  │      ├─material  — Material and inventory module
│  │  │  │      │  │  index.ts  — Exports
│  │  │  │      │  │  material.module.ts  — Module entry
│  │  │  │      │  │  module.metadata.ts  — Registry metadata
│  │  │  │      │  │  README.md  — Module docs
│  │  │  │      │  ├─models  — Inventory models
│  │  │  │      │  │      index.ts  — Model exports
│  │  │  │      │  │      material.model.ts  — Material model
│  │  │  │      │  ├─repositories  — Inventory data access
│  │  │  │      │  │      material.repository.ts  — Repo impl
│  │  │  │      │  └─services  — Material management services
│  │  │  │      │          consumption.service.ts  — Consumption tracking
│  │  │  │      │          equipment.service.ts  — Equipment registry
│  │  │  │      │          inventory.service.ts  — Inventory operations
│  │  │  │      │          material-issue.service.ts  — Issue handling
│  │  │  │      │          material-management.service.ts  — Admin tools
│  │  │  │      ├─qa  — Quality assurance module
│  │  │  │      │  │  index.ts  — Exports
│  │  │  │      │  │  module.metadata.ts  — Registry metadata
│  │  │  │      │  │  qa.module.ts  — Module entry
│  │  │  │      │  │  README.md  — Module docs
│  │  │  │      │  ├─models  — QA models
│  │  │  │      │  │      index.ts  — Model exports
│  │  │  │      │  │      qa.model.ts  — QA domain model
│  │  │  │      │  ├─repositories  — QA repositories
│  │  │  │      │  │      qa.repository.ts  — Repo impl
│  │  │  │      │  └─services  — QA services (checklists, defects)
│  │  │  │      │          checklist.service.ts  — Checklists
│  │  │  │      │          defect.service.ts  — Defect tracking
│  │  │  │      │          inspection.service.ts  — Inspections
│  │  │  │      │          report.service.ts  — QA reports
│  │  │  │      ├─safety  — Safety and incident management module
│  │  │  │      │  │  index.ts  — Exports
│  │  │  │      │  │  module.metadata.ts  — Registry metadata
│  │  │  │      │  │  README.md  — Module docs
│  │  │  │      │  │  safety.module.ts  — Module entry
│  │  │  │      │  ├─models  — Safety models
│  │  │  │      │  │      index.ts  — Model exports
│  │  │  │      │  │      safety-inspection.model.ts  — Safety inspection model
│  │  │  │      │  ├─repositories  — Safety data access
│  │  │  │      │  │      safety.repository.ts  — Repo impl
│  │  │  │      │  └─services  — Safety services (reports, assessments)
│  │  │  │      │          incident-report.service.ts  — Incident reporting
│  │  │  │      │          risk-assessment.service.ts  — Risk tools
│  │  │  │      │          safety-inspection.service.ts  — Inspections
│  │  │  │      │          safety-training.service.ts  — Training flows
│  │  │  │      ├─tasks  — Task management module (kanban/gantt/list views)
│  │  │  │      │  │  index.ts  — Exports
│  │  │  │      │  │  module.metadata.ts  — Metadata
│  │  │  │      │  │  README.md  — Module docs
│  │  │  │      │  │  task-modal.component.ts  — Task edit modal
│  │  │  │      │  │  tasks.component.ts  — Tasks list component
│  │  │  │      │  │  tasks.module.spec.ts  — Tests
│  │  │  │      │  │  tasks.module.ts  — Module entry
│  │  │  │      │  │  tasks.repository.ts  — Tasks data access
│  │  │  │      │  │  tasks.routes.ts  — Task routes
│  │  │  │      │  │  tasks.service.ts  — Tasks business logic
│  │  │  │      │  └─views  — Different task UI views (Gantt, Kanban, etc.)
│  │  │  │      │          task-gantt-view.component.ts  — Gantt view
│  │  │  │      │          task-kanban-view.component.ts  — Kanban view
│  │  │  │      │          task-list-view.component.ts  — List view
│  │  │  │      │          task-timeline-view.component.ts  — Timeline view
│  │  │  │      │          task-tree-view.component.ts  — Tree view
│  │  │  │      └─workflow  — Workflow engine and approval flows
│  │  │  │          │  index.ts  — Exports
│  │  │  │          │  module.metadata.ts  — Registry metadata
│  │  │  │          │  README.md  — Workflow docs
│  │  │  │          │  workflow.module.ts  — Module entry
│  │  │  │          ├─models  — Workflow models
│  │  │  │          │      index.ts  — Model exports
│  │  │  │          │      workflow.model.ts  — Workflow model
│  │  │  │          ├─repositories  — Workflow data access
│  │  │  │          │      workflow.repository.ts  — Repo impl
│  │  │  │          └─services  — Workflow services (approval, state)
│  │  │  │                  approval.service.ts  — Approval logic
│  │  │  │                  automation.service.ts  — Automation tasks
│  │  │  │                  custom-workflow.service.ts  — Custom workflows
│  │  │  │                  state-machine.service.ts  — State machine
│  │  │  │                  template.service.ts  — Workflow templates
│  │  │  ├─repositories  — Blueprint repositories (data access layer)
│  │  │  │      blueprint-member.repository.ts  — Members repo
│  │  │  │      blueprint-module.repository.ts  — Module repo
│  │  │  │      blueprint.repository.ts  — Blueprint repo
│  │  │  │      index.ts  — Repositories exports
│  │  │  └─services  — Blueprint services (validation, DI)
│  │  │          blueprint-validation-schemas.ts  — JSON schemas
│  │  │          blueprint.service.ts  — Blueprint orchestration
│  │  │          dependency-validator.service.ts  — Dependency checks
│  │  │          index.ts  — Service exports
│  │  │          validation.service.ts  — Validation helpers
│  │  ├─errors  — Typed error classes and helpers
│  │  │      AGENTS.md  — Error module notes
│  │  │      blueprint-error.ts  — Base blueprint error class
│  │  │      index.ts  — Error exports
│  │  │      module-not-found-error.ts  — Module not found error
│  │  │      permission-denied-error.ts  — Permission error
│  │  │      validation-error.ts  — Validation error types
│  │  ├─i18n  — Internationalization services
│  │  │      i18n.service.spec.ts  — Tests for i18n service
│  │  │      i18n.service.ts  — I18n implementation
│  │  ├─models  — Core data models for the app
│  │  │      AGENTS.md  — Models guidance
│  │  │      blueprint-config.model.ts  — Blueprint config model
│  │  │      blueprint-module.model.ts  — Module model
│  │  │      blueprint.model.ts  — Blueprint model
│  │  │      index.ts  — Model exports
│  │  │      notification.model.ts  — Notification model
│  │  ├─net  — Networking helpers and HTTP interceptors
│  │  │      AGENTS.md  — Networking notes
│  │  │      default.interceptor.ts  — HTTP interceptor
│  │  │      helper.ts  — Network utilities
│  │  │      index.ts  — Net exports
│  │  │      refresh-token.ts  — Token refresh logic
│  │  ├─repositories  — Shared repositories for common entities
│  │  │  │  account.repository.ts  — Account data access
│  │  │  │  AGENTS.md  — Repositories notes
│  │  │  │  firebase-storage.repository.ts  — Firebase storage wrapper
│  │  │  │  index.ts  — Repos exports
│  │  │  │  log-firestore.repository.ts  — Firestore log repo
│  │  │  │  log.repository.ts  — Log repo abstraction
│  │  │  │  notification.repository.ts  — Notification repo
│  │  │  │  organization-member.repository.ts  — Org member repo
│  │  │  │  organization.repository.ts  — Organization repo
│  │  │  │  storage.repository.ts  — Generic storage repo
│  │  │  │  task-firestore.repository.ts  — Firestore task repo
│  │  │  │  task.repository.ts  — Task repo abstraction
│  │  │  │  team-member.repository.ts  — Team member repo
│  │  │  │  team.repository.ts  — Team repo
│  │  │  └─base  — Base repository implementations
│  │  │          firestore-base.repository.ts  — Firestore base repo
│  │  ├─services  — Core application services (firebase, monitoring)
│  │  │  │  AGENTS.md  — Services notes
│  │  │  │  error-tracking.service.ts  — Error tracking integration
│  │  │  │  firebase-analytics.service.ts  — Analytics wrapper
│  │  │  │  firebase-auth.service.ts  — Auth wrapper/service
│  │  │  │  firebase.service.ts  — Firebase client helpers
│  │  │  │  performance-monitoring.service.ts  — Perf monitoring
│  │  │  ├─layout  — Layout-related services and helpers
│  │  │  │      index.ts  — Layout exports
│  │  │  └─logger  — Logging infrastructure and transports
│  │  │          console-transport.ts  — Console transport impl
│  │  │          index.ts  — Logger exports
│  │  │          log-transport.interface.ts  — Transport interface
│  │  │          logger.service.spec.ts  — Logger tests
│  │  │          logger.service.ts  — Logger service
│  │  ├─startup  — App startup initialization tasks
│  │  │      startup.service.ts  — Runs app initialization sequences
│  │  ├─stores  — Signal-based stores for app state
│  │  │      AGENTS.md  — Stores notes
│  │  │      index.ts  — Store exports
│  │  │      log.store.ts  — Log store (signals)
│  │  │      notification.store.ts  — Notifications store
│  │  │      task.store.ts  — Tasks store
│  │  │      team.store.ts  — Team store
│  │  ├─types  — Shared TypeScript type definitions
│  │  │  │  account.types.ts  — Account-related types
│  │  │  │  AGENTS.md  — Types guidance
│  │  │  │  index.ts  — Types exports
│  │  │  ├─blueprint  — Blueprint specific types and enums
│  │  │  │      blueprint-status.enum.ts  — Blueprint status enum
│  │  │  │      blueprint.types.ts  — Blueprint types
│  │  │  │      owner-type.enum.ts  — Owner type enum
│  │  │  ├─configuration  — Configuration-related types
│  │  │  │      configuration.types.ts  — Config types
│  │  │  ├─events  — Event enums and types
│  │  │  │      event-type.enum.ts  — Event type enum
│  │  │  │      event.types.ts  — Event payload types
│  │  │  ├─log  — Log-related types
│  │  │  │      index.ts  — Log type exports
│  │  │  │      log-task.types.ts  — Task log types
│  │  │  │      log.types.ts  — General log types
│  │  │  ├─module  — Module type definitions
│  │  │  │      module-state.enum.ts  — Module state enum
│  │  │  │      module.types.ts  — Module-related types
│  │  │  ├─permission  — Permission and role types
│  │  │  │      permission-level.enum.ts  — Permission level enum
│  │  │  │      permission.types.ts  — Permission types
│  │  │  │      role.enum.ts  — Role enum
│  │  │  ├─quality-control  — Quality control types
│  │  │  │      index.ts  — Exports
│  │  │  │      quality-control.types.ts  — Types
│  │  │  ├─storage  — Storage-related types
│  │  │  │      index.ts  — Exports
│  │  │  │      storage.types.ts  — Storage type definitions
│  │  │  ├─task  — Task-related types and enums
│  │  │  │      index.ts  — Exports
│  │  │  │      task-quantity.types.ts  — Quantity types
│  │  │  │      task-view.types.ts  — View types (kanban/gantt)
│  │  │  │      task.types.ts  — Task model types
│  │  │  └─workflow  — Workflow types and helpers
│  │  │          index.ts  — Exports
│  │  │          workflow.types.ts  — Workflow type defs
│  │  └─utils  — Utility functions used across core
│  │          task-hierarchy.util.ts  — Task hierarchy helpers
│  ├─features  — Reusable feature modules
│  │  │  AGENTS.md  — Features notes
│  │  └─module-manager  — Module manager UI and services
│  │      │  index.ts  — Exports
│  │      │  module-manager.component.ts  — Manager UI
│  │      │  module-manager.routes.ts  — Routes for manager
│  │      │  module-manager.service.ts  — Manager service
│  │      └─components  — Smaller UI parts for module manager
│  │              module-card.component.ts  — Module card UI
│  │              module-config-form.component.ts  — Config form
│  │              module-dependency-graph.component.ts  — Dependency graph
│  │              module-status-badge.component.ts  — Status badge
│  ├─layout  — Application layout components and widgets
│  │  │  AGENTS.md  — Layout notes
│  │  │  index.ts  — Layout exports
│  │  ├─basic  — Basic layout components
│  │  │  │  basic.component.ts  — Basic layout component
│  │  │  │  README.md  — Basic layout docs
│  │  │  └─widgets  — Reusable layout widgets (user, search, notifications)
│  │  │          clear-storage.component.ts  — Clear cache UI
│  │  │          context-switcher.component.ts  — Switch context UI
│  │  │          fullscreen.component.ts  — Fullscreen toggle
│  │  │          i18n.component.ts  — Language selector
│  │  │          icon.component.ts  — Icon helper component
│  │  │          notify.component.ts  — Notifications UI
│  │  │          rtl.component.ts  — RTL toggle
│  │  │          search.component.ts  — Global search UI
│  │  │          task.component.ts  — Task quick widget
│  │  │          user.component.ts  — User profile widget
│  │  ├─blank  — Minimal blank layout (for special pages)
│  │  │      blank.component.ts  — Blank layout component
│  │  │      README.md  — Docs
│  │  └─passport  — Passport (auth) page layout styles and component
│  │          passport.component.less  — Styles for passport layout
│  │          passport.component.ts  — Passport component
│  ├─routes  — Application route definitions and pages
│  │  │  AGENTS.md  — Routes notes
│  │  │  routes.ts  — Central routes registry
│  │  ├─blueprint  — Pages related to blueprint designer and detail views
│  │  │  │  AGENTS.md  — Blueprint routes notes
│  │  │  │  blueprint-designer.component.ts  — Designer UI
│  │  │  │  blueprint-detail.component.ts  — Detail page
│  │  │  │  blueprint-list.component.ts  — List page
│  │  │  │  blueprint-modal.component.ts  — Modal dialogs
│  │  │  │  routes.ts  — Blueprint subroutes
│  │  │  ├─components  — Reusable components for blueprint pages
│  │  │  │      .gitkeep  — placeholder
│  │  │  │      connection-layer.component.ts  — Connection layer UI
│  │  │  │      index.ts  — Components exports
│  │  │  │      validation-alerts.component.ts  — Validation alerts UI
│  │  │  ├─construction-log  — Construction log pages and store
│  │  │  │      construction-log-modal.component.ts  — Log modal
│  │  │  │      construction-log.component.ts  — Log page
│  │  │  │      construction-log.store.ts  — Store for logs
│  │  │  │      index.ts  — Exports
│  │  │  │      README.md  — Docs
│  │  │  ├─container  — Container dashboard and monitoring pages
│  │  │  │      container-dashboard.component.ts  — Container dashboard UI
│  │  │  │      event-bus-monitor.component.ts  — Event bus monitor UI
│  │  │  ├─members  — Blueprint membership pages and modals
│  │  │  │      blueprint-members.component.ts  — Members list page
│  │  │  │      member-modal.component.ts  — Member edit modal
│  │  │  └─modules  — Module-specific views for blueprints
│  │  │          acceptance-module-view.component.ts  — Acceptance view
│  │  │          communication-module-view.component.ts  — Communication view
│  │  │          finance-module-view.component.ts  — Finance view
│  │  │          log-module-view.component.ts  — Log view
│  │  │          material-module-view.component.ts  — Material view
│  │  │          qa-module-view.component.ts  — QA view
│  │  │          safety-module-view.component.ts  — Safety view
│  │  │          workflow-module-view.component.ts  — Workflow view
│  │  ├─dashboard  — Dashboard pages and widgets
│  │  │      AGENTS.md  — Dashboard notes
│  │  ├─exception  — Error/exception pages and test triggers
│  │  │      AGENTS.md  — Exception notes
│  │  │      exception.component.ts  — Exception UI
│  │  │      routes.ts  — Exception routes
│  │  │      trigger.component.ts  — Component to trigger errors for testing
│  │  ├─explore  — Explore/search pages and components
│  │  │  │  explore-page.component.ts  — Explore main page
│  │  │  │  routes.ts  — Explore routes
│  │  │  ├─components  — Explore page UI components
│  │  │  │      filter-panel.component.ts  — Filter panel UI
│  │  │  │      index.ts  — Components exports
│  │  │  │      result-grid.component.ts  — Results grid UI
│  │  │  │      search-bar.component.ts  — Search input UI
│  │  │  ├─models  — Explore models (search result types)
│  │  │  │      index.ts  — Exports
│  │  │  │      search-result.model.ts  — Search result model
│  │  │  └─services  — Explore search services and caching
│  │  │          explore-search.facade.ts  — Facade for search features
│  │  │          index.ts  — Services exports
│  │  │          search-cache.service.spec.ts  — Tests
│  │  │          search-cache.service.ts  — Search cache impl
│  │  ├─monitoring  — Monitoring dashboard and routes
│  │  │      monitoring-dashboard.component.ts  — Monitoring UI
│  │  │      routes.ts  — Monitoring routes
│  │  ├─organization  — Organization pages and management
│  │  │  │  AGENTS.md  — Org notes
│  │  │  │  routes.ts  — Org routes
│  │  │  ├─members  — Organization member pages
│  │  │  │      organization-members.component.ts  — Members list
│  │  │  ├─settings  — Organization settings page
│  │  │  │      organization-settings.component.ts  — Settings UI
│  │  │  └─teams  — Organization team management pages
│  │  │          organization-teams.component.ts  — Teams list
│  │  │          team-modal.component.ts  — Team modal
│  │  ├─passport  — Authentication routes and callbacks
│  │  │  │  AGENTS.md  — Passport notes
│  │  │  │  callback.component.ts  — OAuth callback handler
│  │  │  │  routes.ts  — Passport routes
│  │  │  ├─lock  — Lock screen components (UI + styles)
│  │  │  │      lock.component.html  — Lock screen template
│  │  │  │      lock.component.less  — Styles
│  │  │  │      lock.component.ts  — Component logic
│  │  │  ├─login  — Login page templates and logic
│  │  │  │      login.component.html  — Template
│  │  │  │      login.component.less  — Styles
│  │  │  │      login.component.ts  — Component
│  │  │  ├─register  — Registration page resources
│  │  │  │      register.component.html  — Template
│  │  │  │      register.component.less  — Styles
│  │  │  │      register.component.ts  — Component logic
│  │  │  └─register-result  — Registration result page
│  │  │          register-result.component.html  — Template
│  │  │          register-result.component.ts  — Component
│  │  ├─team  — Team routes and pages
│  │  │  │  AGENTS.md  — Team notes
│  │  │  │  routes.ts  — Team routes
│  │  │  └─members  — Team members UI components
│  │  │          team-member-modal.component.ts  — Member modal
│  │  │          team-members.component.ts  — Members list
│  │  └─user  — User-related routes and settings
│  │      │  AGENTS.md  — User notes
│  │      │  routes.ts  — User routes
│  │      └─settings  — User settings page
│  │              settings.component.ts  — Settings component
│  └─shared  — Shared UI modules, components, and helpers
│      │  AGENTS.md  — Shared module notes
│      │  index.ts  — Shared exports
│      │  README.md  — Shared module docs
│      │  shared-delon.module.ts  — Delon integration module
│      │  shared-imports.ts  — Common imports bundle (SHARED_IMPORTS)
│      │  shared-zorro.module.ts  — Zorro UI wrappers
│      ├─cdk  — CDK utilities and wrappers
│      │      index.ts  — CDK exports
│      │      README.md  — CDK docs
│      │      shared-cdk.module.ts  — CDK module
│      ├─cell-widget  — Table cell widget helpers
│      │      index.ts  — Exports
│      ├─components  — Shared UI components (breadcrumb, modals)
│      │  ├─breadcrumb  — Breadcrumb component
│      │  │      breadcrumb.component.ts  — Breadcrumb UI
│      │  ├─create-organization  — Create organization modal component
│      │  │      create-organization.component.ts  — Component
│      │  ├─create-team-modal  — Team creation modal
│      │  │      create-team-modal.component.ts  — Component
│      │  ├─edit-team-modal  — Edit team modal
│      │  │      edit-team-modal.component.ts  — Component
│      │  └─team-detail-drawer  — Team details drawer UI
│      │          team-detail-drawer.component.html  — Template
│      │          team-detail-drawer.component.ts  — Component
│      ├─json-schema  — JSON schema helpers and validators
│      │  │  index.ts  — Exports
│      │  │  README.md  — Docs
│      │  └─test  — Test widgets for json-schema
│      │          test.widget.ts  — Test widget file
│      ├─services  — Shared UI services (breadcrumb, menu, permissions)
│      │  │  AGENTS.md  — Services notes
│      │  │  breadcrumb.service.ts  — Breadcrumb helper
│      │  │  index.ts  — Exports
│      │  │  menu-management.service.ts  — Menu management
│      │  │  workspace-context.service.ts  — Workspace context provider
│      │  └─permission  — Permission helpers and checks
│      │          permission.service.ts  — Permission service
│      ├─st-widget  — Table widgets (ST from Delon) and helpers
│      │      index.ts  — Exports
│      │      README.md  — Docs
│      └─utils  — Shared utility functions for UI layer
│              async-state.ts  — Async state helper (signals)
│              index.ts  — Utils exports

├─assets  — Static assets (images, styles, temporary files)
│  │  .gitkeep  — Placeholder to keep folder in VCS
│  │  color.less  — Color variables
│  │  logo-color.svg  — Logo (color)
│  │  logo-full.svg  — Full logo
│  │  logo.svg  — Main logo (icon)
│  │  style.compact.css  — Compact style CSS
│  │  style.dark.css  — Dark theme CSS
│  │  zorro.svg  — Ant Design logo asset
│  └─tmp  — Temporary/demo assets used by examples and mock data
│      │  app-data.json  — Demo app data
│      │  demo.docx  — Demo document
│      │  demo.pdf  — Demo PDF
│      │  demo.pptx  — Demo presentation
│      │  demo.xlsx  — Demo spreadsheet
│      │  demo.zip  — Demo archive
│      │  on-boarding.json  — Onboarding content
│      ├─i18n  — Localization JSON files
│      │      en-US.json  — English translations
│      │      zh-CN.json  — Simplified Chinese translations
│      │      zh-TW.json  — Traditional Chinese translations
│      └─img  — Image assets used across the app (icons, backgrounds)
│              1.png  — Sample image 1
│              2.png  — Sample image 2
│              3.png  — Sample image 3
│              4.png  — Sample image 4
│              5.png  — Sample image 5
│              6.png  — Sample image 6
│              avatar.jpg  — Default avatar image
│              bg1.jpg  — Background image 1
│              bg10.jpg  — Background image 10
│              bg2.jpg  — Background image 2
│              bg3.jpg  — Background image 3
│              bg4.jpg  — Background image 4
│              bg5.jpg  — Background image 5
│              bg6.jpg  — Background image 6
│              bg7.jpg  — Background image 7
│              bg8.jpg  — Background image 8
│              bg9.jpg  — Background image 9
│              half-float-bg-1.jpg  — Decorative background

├─environments  — Build-time environment configurations
│      AGENTS.md  — Environments notes
│      environment.prod.ts  — Production environment settings
│      environment.ts  — Development environment settings

├─styles  — Project-wide style entrypoints and themes
│      AGENTS.md  — Styles notes
│      index.less  — Main style index
│      theme.less  — Theme variables and mixins

└─types  — Type declaration files for build tooling and imports
        import-meta.d.ts  — `import.meta` type defs
│  AGENTS.md
│  index.html
│  main.ts
│  style-icons-auto.ts
│  style-icons.ts
│  styles.less
│  typings.d.ts
│
├─app
│  │  AGENTS.md
│  │  app.component.ts
│  │  app.config.ts
│  │
│  ├─core
│  │  │  AGENTS.md
│  │  │  index.ts
│  │  │  README.md
│  │  │  start-page.guard.ts
│  │  │
│  │  ├─blueprint
│  │  │  │  AGENTS.md
│  │  │  │  index.ts
│  │  │  │
│  │  │  ├─config
│  │  │  │      blueprint-config.interface.ts
│  │  │  │      index.ts
│  │  │  │
│  │  │  ├─container
│  │  │  │      blueprint-container.interface.ts
│  │  │  │      blueprint-container.spec.ts
│  │  │  │      blueprint-container.ts
│  │  │  │      index.ts
│  │  │  │      lifecycle-manager.interface.ts
│  │  │  │      lifecycle-manager.spec.ts
│  │  │  │      lifecycle-manager.ts
│  │  │  │      module-registry.interface.ts
│  │  │  │      module-registry.spec.ts
│  │  │  │      module-registry.ts
│  │  │  │      resource-provider.interface.ts
│  │  │  │      resource-provider.spec.ts
│  │  │  │      resource-provider.ts
│  │  │  │
│  │  │  ├─context
│  │  │  │      execution-context.interface.ts
│  │  │  │      index.ts
│  │  │  │      shared-context.spec.ts
│  │  │  │      shared-context.ts
│  │  │  │      tenant-info.interface.ts
│  │  │  │
│  │  │  ├─events
│  │  │  │      event-bus.interface.ts
│  │  │  │      event-bus.spec.ts
│  │  │  │      event-bus.ts
│  │  │  │      event-types.ts
│  │  │  │      index.ts
│  │  │  │
│  │  │  ├─integration
│  │  │  │      container-lifecycle.integration.spec.ts
│  │  │  │      event-bus.integration.spec.ts
│  │  │  │      module-communication.integration.spec.ts
│  │  │  │
│  │  │  ├─models
│  │  │  │      index.ts
│  │  │  │      module-connection.interface.ts
│  │  │  │
│  │  │  ├─modules
│  │  │  │  │  index.ts
│  │  │  │  │  module-status.enum.ts
│  │  │  │  │  module.interface.ts
│  │  │  │  │
│  │  │  │  └─implementations
│  │  │  │      │  index.ts
│  │  │  │      │
│  │  │  │      ├─acceptance
│  │  │  │      │  │  acceptance.module.ts
│  │  │  │      │  │  index.ts
│  │  │  │      │  │  module.metadata.ts
│  │  │  │      │  │  README.md
│  │  │  │      │  │
│  │  │  │      │  ├─models
│  │  │  │      │  │      acceptance.model.ts
│  │  │  │      │  │      index.ts
│  │  │  │      │  │
│  │  │  │      │  ├─repositories
│  │  │  │      │  │      acceptance.repository.ts
│  │  │  │      │  │
│  │  │  │      │  └─services
│  │  │  │      │          conclusion.service.ts
│  │  │  │      │          preliminary.service.ts
│  │  │  │      │          re-inspection.service.ts
│  │  │  │      │          request.service.ts
│  │  │  │      │          review.service.ts
│  │  │  │      │
│  │  │  │      ├─audit-logs
│  │  │  │      │  │  audit-logs.module.ts
│  │  │  │      │  │  index.ts
│  │  │  │      │  │  module.metadata.ts
│  │  │  │      │  │  README.md
│  │  │  │      │  │
│  │  │  │      │  ├─components
│  │  │  │      │  │      audit-logs.component.ts
│  │  │  │      │  │
│  │  │  │      │  ├─config
│  │  │  │      │  │      audit-logs.config.ts
│  │  │  │      │  │
│  │  │  │      │  ├─exports
│  │  │  │      │  │      audit-logs-api.exports.ts
│  │  │  │      │  │
│  │  │  │      │  ├─models
│  │  │  │      │  │      audit-log.model.ts
│  │  │  │      │  │      audit-log.types.ts
│  │  │  │      │  │
│  │  │  │      │  ├─repositories
│  │  │  │      │  │      audit-log.repository.ts
│  │  │  │      │  │
│  │  │  │      │  └─services
│  │  │  │      │          audit-logs.service.ts
│  │  │  │      │
│  │  │  │      ├─climate
│  │  │  │      │  │  climate.module.ts
│  │  │  │      │  │  index.ts
│  │  │  │      │  │  README.md
│  │  │  │      │  │
│  │  │  │      │  ├─config
│  │  │  │      │  │      climate.config.ts
│  │  │  │      │  │      cwb-api.constants.ts
│  │  │  │      │  │
│  │  │  │      │  ├─examples
│  │  │  │      │  │      usage-example.ts
│  │  │  │      │  │
│  │  │  │      │  ├─exports
│  │  │  │      │  │      climate-api.exports.ts
│  │  │  │      │  │
│  │  │  │      │  ├─models
│  │  │  │      │  │      cwb-api-response.model.ts
│  │  │  │      │  │      weather-forecast.model.ts
│  │  │  │      │  │
│  │  │  │      │  ├─repositories
│  │  │  │      │  │      climate.repository.ts
│  │  │  │      │  │
│  │  │  │      │  └─services
│  │  │  │      │          climate-cache.service.ts
│  │  │  │      │          cwb-weather.service.ts
│  │  │  │      │
│  │  │  │      ├─communication
│  │  │  │      │  │  communication.module.ts
│  │  │  │      │  │  index.ts
│  │  │  │      │  │  module.metadata.ts
│  │  │  │      │  │  README.md
│  │  │  │      │  │
│  │  │  │      │  ├─models
│  │  │  │      │  │      communication.model.ts
│  │  │  │      │  │      index.ts
│  │  │  │      │  │
│  │  │  │      │  ├─repositories
│  │  │  │      │  │      communication.repository.ts
│  │  │  │      │  │
│  │  │  │      │  └─services
│  │  │  │      │          group-message.service.ts
│  │  │  │      │          push-notification.service.ts
│  │  │  │      │          system-notification.service.ts
│  │  │  │      │          task-reminder.service.ts
│  │  │  │      │
│  │  │  │      ├─finance
│  │  │  │      │  │  finance.module.ts
│  │  │  │      │  │  index.ts
│  │  │  │      │  │  module.metadata.ts
│  │  │  │      │  │  README.md
│  │  │  │      │  │
│  │  │  │      │  ├─models
│  │  │  │      │  │      finance.model.ts
│  │  │  │      │  │      index.ts
│  │  │  │      │  │
│  │  │  │      │  ├─repositories
│  │  │  │      │  │      finance.repository.ts
│  │  │  │      │  │
│  │  │  │      │  └─services
│  │  │  │      │          budget.service.ts
│  │  │  │      │          cost-management.service.ts
│  │  │  │      │          financial-report.service.ts
│  │  │  │      │          invoice.service.ts
│  │  │  │      │          ledger.service.ts
│  │  │  │      │          payment.service.ts
│  │  │  │      │
│  │  │  │      ├─log
│  │  │  │      │  │  index.ts
│  │  │  │      │  │  log.module.ts
│  │  │  │      │  │  module.metadata.ts
│  │  │  │      │  │  README.md
│  │  │  │      │  │
│  │  │  │      │  ├─models
│  │  │  │      │  │      activity-log.model.ts
│  │  │  │      │  │
│  │  │  │      │  ├─repositories
│  │  │  │      │  │      log.repository.ts
│  │  │  │      │  │
│  │  │  │      │  └─services
│  │  │  │      │          activity-log.service.ts
│  │  │  │      │          attachment.service.ts
│  │  │  │      │          change-history.service.ts
│  │  │  │      │          comment.service.ts
│  │  │  │      │          system-event.service.ts
│  │  │  │      │
│  │  │  │      ├─material
│  │  │  │      │  │  index.ts
│  │  │  │      │  │  material.module.ts
│  │  │  │      │  │  module.metadata.ts
│  │  │  │      │  │  README.md
│  │  │  │      │  │
│  │  │  │      │  ├─models
│  │  │  │      │  │      index.ts
│  │  │  │      │  │      material.model.ts
│  │  │  │      │  │
│  │  │  │      │  ├─repositories
│  │  │  │      │  │      material.repository.ts
│  │  │  │      │  │
│  │  │  │      │  └─services
│  │  │  │      │          consumption.service.ts
│  │  │  │      │          equipment.service.ts
│  │  │  │      │          inventory.service.ts
│  │  │  │      │          material-issue.service.ts
│  │  │  │      │          material-management.service.ts
│  │  │  │      │
│  │  │  │      ├─qa
│  │  │  │      │  │  index.ts
│  │  │  │      │  │  module.metadata.ts
│  │  │  │      │  │  qa.module.ts
│  │  │  │      │  │  README.md
│  │  │  │      │  │
│  │  │  │      │  ├─models
│  │  │  │      │  │      index.ts
│  │  │  │      │  │      qa.model.ts
│  │  │  │      │  │
│  │  │  │      │  ├─repositories
│  │  │  │      │  │      qa.repository.ts
│  │  │  │      │  │
│  │  │  │      │  └─services
│  │  │  │      │          checklist.service.ts
│  │  │  │      │          defect.service.ts
│  │  │  │      │          inspection.service.ts
│  │  │  │      │          report.service.ts
│  │  │  │      │
│  │  │  │      ├─safety
│  │  │  │      │  │  index.ts
│  │  │  │      │  │  module.metadata.ts
│  │  │  │      │  │  README.md
│  │  │  │      │  │  safety.module.ts
│  │  │  │      │  │
│  │  │  │      │  ├─models
│  │  │  │      │  │      index.ts
│  │  │  │      │  │      safety-inspection.model.ts
│  │  │  │      │  │
│  │  │  │      │  ├─repositories
│  │  │  │      │  │      safety.repository.ts
│  │  │  │      │  │
│  │  │  │      │  └─services
│  │  │  │      │          incident-report.service.ts
│  │  │  │      │          risk-assessment.service.ts
│  │  │  │      │          safety-inspection.service.ts
│  │  │  │      │          safety-training.service.ts
│  │  │  │      │
│  │  │  │      ├─tasks
│  │  │  │      │  │  index.ts
│  │  │  │      │  │  module.metadata.ts
│  │  │  │      │  │  README.md
│  │  │  │      │  │  task-modal.component.ts
│  │  │  │      │  │  tasks.component.ts
│  │  │  │      │  │  tasks.module.spec.ts
│  │  │  │      │  │  tasks.module.ts
│  │  │  │      │  │  tasks.repository.ts
│  │  │  │      │  │  tasks.routes.ts
│  │  │  │      │  │  tasks.service.ts
│  │  │  │      │  │
│  │  │  │      │  └─views
│  │  │  │      │          task-gantt-view.component.ts
│  │  │  │      │          task-kanban-view.component.ts
│  │  │  │      │          task-list-view.component.ts
│  │  │  │      │          task-timeline-view.component.ts
│  │  │  │      │          task-tree-view.component.ts
│  │  │  │      │
│  │  │  │      └─workflow
│  │  │  │          │  index.ts
│  │  │  │          │  module.metadata.ts
│  │  │  │          │  README.md
│  │  │  │          │  workflow.module.ts
│  │  │  │          │
│  │  │  │          ├─models
│  │  │  │          │      index.ts
│  │  │  │          │      workflow.model.ts
│  │  │  │          │
│  │  │  │          ├─repositories
│  │  │  │          │      workflow.repository.ts
│  │  │  │          │
│  │  │  │          └─services
│  │  │  │                  approval.service.ts
│  │  │  │                  automation.service.ts
│  │  │  │                  custom-workflow.service.ts
│  │  │  │                  state-machine.service.ts
│  │  │  │                  template.service.ts
│  │  │  │
│  │  │  ├─repositories
│  │  │  │      blueprint-member.repository.ts
│  │  │  │      blueprint-module.repository.ts
│  │  │  │      blueprint.repository.ts
│  │  │  │      index.ts
│  │  │  │
│  │  │  └─services
│  │  │          blueprint-validation-schemas.ts
│  │  │          blueprint.service.ts
│  │  │          dependency-validator.service.ts
│  │  │          index.ts
│  │  │          validation.service.ts
│  │  │
│  │  ├─errors
│  │  │      AGENTS.md
│  │  │      blueprint-error.ts
│  │  │      index.ts
│  │  │      module-not-found-error.ts
│  │  │      permission-denied-error.ts
│  │  │      validation-error.ts
│  │  │
│  │  ├─i18n
│  │  │      i18n.service.spec.ts
│  │  │      i18n.service.ts
│  │  │
│  │  ├─models
│  │  │      AGENTS.md
│  │  │      blueprint-config.model.ts
│  │  │      blueprint-module.model.ts
│  │  │      blueprint.model.ts
│  │  │      index.ts
│  │  │      notification.model.ts
│  │  │
│  │  ├─net
│  │  │      AGENTS.md
│  │  │      default.interceptor.ts
│  │  │      helper.ts
│  │  │      index.ts
│  │  │      refresh-token.ts
│  │  │
│  │  ├─repositories
│  │  │  │  account.repository.ts
│  │  │  │  AGENTS.md
│  │  │  │  firebase-storage.repository.ts
│  │  │  │  index.ts
│  │  │  │  log-firestore.repository.ts
│  │  │  │  log.repository.ts
│  │  │  │  notification.repository.ts
│  │  │  │  organization-member.repository.ts
│  │  │  │  organization.repository.ts
│  │  │  │  storage.repository.ts
│  │  │  │  task-firestore.repository.ts
│  │  │  │  task.repository.ts
│  │  │  │  team-member.repository.ts
│  │  │  │  team.repository.ts
│  │  │  │
│  │  │  └─base
│  │  │          firestore-base.repository.ts
│  │  │
│  │  ├─services
│  │  │  │  AGENTS.md
│  │  │  │  error-tracking.service.ts
│  │  │  │  firebase-analytics.service.ts
│  │  │  │  firebase-auth.service.ts
│  │  │  │  firebase.service.ts
│  │  │  │  performance-monitoring.service.ts
│  │  │  │
│  │  │  ├─layout
│  │  │  │      index.ts
│  │  │  │
│  │  │  └─logger
│  │  │          console-transport.ts
│  │  │          index.ts
│  │  │          log-transport.interface.ts
│  │  │          logger.service.spec.ts
│  │  │          logger.service.ts
│  │  │
│  │  ├─startup
│  │  │      startup.service.ts
│  │  │
│  │  ├─stores
│  │  │      AGENTS.md
│  │  │      index.ts
│  │  │      log.store.ts
│  │  │      notification.store.ts
│  │  │      task.store.ts
│  │  │      team.store.ts
│  │  │
│  │  ├─types
│  │  │  │  account.types.ts
│  │  │  │  AGENTS.md
│  │  │  │  index.ts
│  │  │  │
│  │  │  ├─blueprint
│  │  │  │      blueprint-status.enum.ts
│  │  │  │      blueprint.types.ts
│  │  │  │      owner-type.enum.ts
│  │  │  │
│  │  │  ├─configuration
│  │  │  │      configuration.types.ts
│  │  │  │
│  │  │  ├─events
│  │  │  │      event-type.enum.ts
│  │  │  │      event.types.ts
│  │  │  │
│  │  │  ├─log
│  │  │  │      index.ts
│  │  │  │      log-task.types.ts
│  │  │  │      log.types.ts
│  │  │  │
│  │  │  ├─module
│  │  │  │      module-state.enum.ts
│  │  │  │      module.types.ts
│  │  │  │
│  │  │  ├─permission
│  │  │  │      permission-level.enum.ts
│  │  │  │      permission.types.ts
│  │  │  │      role.enum.ts
│  │  │  │
│  │  │  ├─quality-control
│  │  │  │      index.ts
│  │  │  │      quality-control.types.ts
│  │  │  │
│  │  │  ├─storage
│  │  │  │      index.ts
│  │  │  │      storage.types.ts
│  │  │  │
│  │  │  ├─task
│  │  │  │      index.ts
│  │  │  │      task-quantity.types.ts
│  │  │  │      task-view.types.ts
│  │  │  │      task.types.ts
│  │  │  │
│  │  │  └─workflow
│  │  │          index.ts
│  │  │          workflow.types.ts
│  │  │
│  │  └─utils
│  │          task-hierarchy.util.ts
│  │
│  ├─features
│  │  │  AGENTS.md
│  │  │
│  │  └─module-manager
│  │      │  index.ts
│  │      │  module-manager.component.ts
│  │      │  module-manager.routes.ts
│  │      │  module-manager.service.ts
│  │      │
│  │      └─components
│  │              module-card.component.ts
│  │              module-config-form.component.ts
│  │              module-dependency-graph.component.ts
│  │              module-status-badge.component.ts
│  │
│  ├─layout
│  │  │  AGENTS.md
│  │  │  index.ts
│  │  │
│  │  ├─basic
│  │  │  │  basic.component.ts
│  │  │  │  README.md
│  │  │  │
│  │  │  └─widgets
│  │  │          clear-storage.component.ts
│  │  │          context-switcher.component.ts
│  │  │          fullscreen.component.ts
│  │  │          i18n.component.ts
│  │  │          icon.component.ts
│  │  │          notify.component.ts
│  │  │          rtl.component.ts
│  │  │          search.component.ts
│  │  │          task.component.ts
│  │  │          user.component.ts
│  │  │
│  │  ├─blank
│  │  │      blank.component.ts
│  │  │      README.md
│  │  │
│  │  └─passport
│  │          passport.component.less
│  │          passport.component.ts
│  │
│  ├─routes
│  │  │  AGENTS.md
│  │  │  routes.ts
│  │  │
│  │  ├─blueprint
│  │  │  │  AGENTS.md
│  │  │  │  blueprint-designer.component.ts
│  │  │  │  blueprint-detail.component.ts
│  │  │  │  blueprint-list.component.ts
│  │  │  │  blueprint-modal.component.ts
│  │  │  │  routes.ts
│  │  │  │
│  │  │  ├─components
│  │  │  │      .gitkeep
│  │  │  │      connection-layer.component.ts
│  │  │  │      index.ts
│  │  │  │      validation-alerts.component.ts
│  │  │  │
│  │  │  ├─construction-log
│  │  │  │      construction-log-modal.component.ts
│  │  │  │      construction-log.component.ts
│  │  │  │      construction-log.store.ts
│  │  │  │      index.ts
│  │  │  │      README.md
│  │  │  │
│  │  │  ├─container
│  │  │  │      container-dashboard.component.ts
│  │  │  │      event-bus-monitor.component.ts
│  │  │  │
│  │  │  ├─members
│  │  │  │      blueprint-members.component.ts
│  │  │  │      member-modal.component.ts
│  │  │  │
│  │  │  └─modules
│  │  │          acceptance-module-view.component.ts
│  │  │          communication-module-view.component.ts
│  │  │          finance-module-view.component.ts
│  │  │          log-module-view.component.ts
│  │  │          material-module-view.component.ts
│  │  │          qa-module-view.component.ts
│  │  │          safety-module-view.component.ts
│  │  │          workflow-module-view.component.ts
│  │  │
│  │  ├─dashboard
│  │  │      AGENTS.md
│  │  │
│  │  ├─exception
│  │  │      AGENTS.md
│  │  │      exception.component.ts
│  │  │      routes.ts
│  │  │      trigger.component.ts
│  │  │
│  │  ├─explore
│  │  │  │  explore-page.component.ts
│  │  │  │  routes.ts
│  │  │  │
│  │  │  ├─components
│  │  │  │      filter-panel.component.ts
│  │  │  │      index.ts
│  │  │  │      result-grid.component.ts
│  │  │  │      search-bar.component.ts
│  │  │  │
│  │  │  ├─models
│  │  │  │      index.ts
│  │  │  │      search-result.model.ts
│  │  │  │
│  │  │  └─services
│  │  │          explore-search.facade.ts
│  │  │          index.ts
│  │  │          search-cache.service.spec.ts
│  │  │          search-cache.service.ts
│  │  │
│  │  ├─monitoring
│  │  │      monitoring-dashboard.component.ts
│  │  │      routes.ts
│  │  │
│  │  ├─organization
│  │  │  │  AGENTS.md
│  │  │  │  routes.ts
│  │  │  │
│  │  │  ├─members
│  │  │  │      organization-members.component.ts
│  │  │  │
│  │  │  ├─settings
│  │  │  │      organization-settings.component.ts
│  │  │  │
│  │  │  └─teams
│  │  │          organization-teams.component.ts
│  │  │          team-modal.component.ts
│  │  │
│  │  ├─passport
│  │  │  │  AGENTS.md
│  │  │  │  callback.component.ts
│  │  │  │  routes.ts
│  │  │  │
│  │  │  ├─lock
│  │  │  │      lock.component.html
│  │  │  │      lock.component.less
│  │  │  │      lock.component.ts
│  │  │  │
│  │  │  ├─login
│  │  │  │      login.component.html
│  │  │  │      login.component.less
│  │  │  │      login.component.ts
│  │  │  │
│  │  │  ├─register
│  │  │  │      register.component.html
│  │  │  │      register.component.less
│  │  │  │      register.component.ts
│  │  │  │
│  │  │  └─register-result
│  │  │          register-result.component.html
│  │  │          register-result.component.ts
│  │  │
│  │  ├─team
│  │  │  │  AGENTS.md
│  │  │  │  routes.ts
│  │  │  │
│  │  │  └─members
│  │  │          team-member-modal.component.ts
│  │  │          team-members.component.ts
│  │  │
│  │  └─user
│  │      │  AGENTS.md
│  │      │  routes.ts
│  │      │
│  │      └─settings
│  │              settings.component.ts
│  │
│  └─shared
│      │  AGENTS.md
│      │  index.ts
│      │  README.md
│      │  shared-delon.module.ts
│      │  shared-imports.ts
│      │  shared-zorro.module.ts
│      │
│      ├─cdk
│      │      index.ts
│      │      README.md
│      │      shared-cdk.module.ts
│      │
│      ├─cell-widget
│      │      index.ts
│      │
│      ├─components
│      │  ├─breadcrumb
│      │  │      breadcrumb.component.ts
│      │  │
│      │  ├─create-organization
│      │  │      create-organization.component.ts
│      │  │
│      │  ├─create-team-modal
│      │  │      create-team-modal.component.ts
│      │  │
│      │  ├─edit-team-modal
│      │  │      edit-team-modal.component.ts
│      │  │
│      │  └─team-detail-drawer
│      │          team-detail-drawer.component.html
│      │          team-detail-drawer.component.ts
│      │
│      ├─json-schema
│      │  │  index.ts
│      │  │  README.md
│      │  │
│      │  └─test
│      │          test.widget.ts
│      │
│      ├─services
│      │  │  AGENTS.md
│      │  │  breadcrumb.service.ts
│      │  │  index.ts
│      │  │  menu-management.service.ts
│      │  │  workspace-context.service.ts
│      │  │
│      │  └─permission
│      │          permission.service.ts
│      │
│      ├─st-widget
│      │      index.ts
│      │      README.md
│      │
│      └─utils
│              async-state.ts
│              index.ts
│
├─assets
│  │  .gitkeep
│  │  color.less
│  │  logo-color.svg
│  │  logo-full.svg
│  │  logo.svg
│  │  style.compact.css
│  │  style.dark.css
│  │  zorro.svg
│  │
│  └─tmp
│      │  app-data.json
│      │  demo.docx
│      │  demo.pdf
│      │  demo.pptx
│      │  demo.xlsx
│      │  demo.zip
│      │  on-boarding.json
│      │
│      ├─i18n
│      │      en-US.json
│      │      zh-CN.json
│      │      zh-TW.json
│      │
│      └─img
│              1.png
│              2.png
│              3.png
│              4.png
│              5.png
│              6.png
│              avatar.jpg
│              bg1.jpg
│              bg10.jpg
│              bg2.jpg
│              bg3.jpg
│              bg4.jpg
│              bg5.jpg
│              bg6.jpg
│              bg7.jpg
│              bg8.jpg
│              bg9.jpg
│              half-float-bg-1.jpg
│
├─environments
│      AGENTS.md
│      environment.prod.ts
│      environment.ts
│
├─styles
│      AGENTS.md
│      index.less
│      theme.less
│
└─types
        import-meta.d.ts