│  AGENTS.md                                                      # AI 代理開發指南
│  index.html                                                     # 應用程式入口 HTML
│  main.ts                                                        # Angular 應用程式啟動點
│  style-icons-auto.ts                                            # 自動生成的圖示樣式
│  style-icons.ts                                                 # 圖示樣式定義
│  styles.less                                                    # 全域樣式
│  typings.d.ts                                                   # TypeScript 類型定義
│
├─app
│  │  AGENTS.md                                                   # App 模組 AI 代理指南
│  │  app.component.ts                                            # 根元件
│  │  app.config.ts                                               # Angular 應用程式配置
│  │
│  ├─core
│  │  │  AGENTS.md                                                # Core 模組 AI 代理指南
│  │  │  index.ts                                                 # Core 模組匯出
│  │  │  README.md                                                # Core 模組說明文件
│  │  │  start-page.guard.ts                                      # 起始頁面路由守衛
│  │  │
│  │  ├─blueprint
│  │  │  │  AGENTS.md                                             # Blueprint 系統 AI 代理指南
│  │  │  │  index.ts                                              # Blueprint 模組匯出
│  │  │  │
│  │  │  ├─config
│  │  │  │      blueprint-config.interface.ts                     # Blueprint 配置介面
│  │  │  │      index.ts                                          # Config 模組匯出
│  │  │  │
│  │  │  ├─container
│  │  │  │      blueprint-container.interface.ts                  # Blueprint 容器介面
│  │  │  │      blueprint-container.spec.ts                       # Blueprint 容器測試
│  │  │  │      blueprint-container.ts                            # Blueprint 容器實作
│  │  │  │      index.ts                                          # Container 模組匯出
│  │  │  │      lifecycle-manager.interface.ts                    # 生命週期管理器介面
│  │  │  │      lifecycle-manager.spec.ts                         # 生命週期管理器測試
│  │  │  │      lifecycle-manager.ts                              # 生命週期管理器實作
│  │  │  │      module-registry.interface.ts                      # 模組註冊表介面
│  │  │  │      module-registry.spec.ts                           # 模組註冊表測試
│  │  │  │      module-registry.ts                                # 模組註冊表實作
│  │  │  │      resource-provider.interface.ts                    # 資源提供者介面
│  │  │  │      resource-provider.spec.ts                         # 資源提供者測試
│  │  │  │      resource-provider.ts                              # 資源提供者實作
│  │  │  │
│  │  │  ├─context
│  │  │  │      execution-context.interface.ts                    # 執行上下文介面
│  │  │  │      index.ts                                          # Context 模組匯出
│  │  │  │      shared-context.spec.ts                            # 共享上下文測試
│  │  │  │      shared-context.ts                                 # 共享上下文實作
│  │  │  │      tenant-info.interface.ts                          # 租戶資訊介面
│  │  │  │
│  │  │  ├─events
│  │  │  │      event-bus.interface.ts                            # 事件匯流排介面
│  │  │  │      event-bus.spec.ts                                 # 事件匯流排測試
│  │  │  │      event-bus.ts                                      # 事件匯流排實作
│  │  │  │      event-types.ts                                    # 事件類型定義
│  │  │  │      index.ts                                          # Events 模組匯出
│  │  │  │
│  │  │  ├─integration
│  │  │  │      container-lifecycle.integration.spec.ts           # 容器生命週期整合測試
│  │  │  │      event-bus.integration.spec.ts                     # 事件匯流排整合測試
│  │  │  │      module-communication.integration.spec.ts          # 模組通訊整合測試
│  │  │  │
│  │  │  ├─models
│  │  │  │      index.ts                                          # Models 模組匯出
│  │  │  │      module-connection.interface.ts                    # 模組連接介面
│  │  │  │
│  │  │  ├─modules
│  │  │  │  │  index.ts                                           # Modules 模組匯出
│  │  │  │  │  module-status.enum.ts                              # 模組狀態枚舉
│  │  │  │  │  module.interface.ts                                # 模組介面
│  │  │  │  │
│  │  │  │  └─implementations
│  │  │  │      │  index.ts                                       # Implementations 模組匯出
│  │  │  │      │
│  │  │  │      ├─acceptance
│  │  │  │      │  │  acceptance.module.ts                        # 驗收模組定義
│  │  │  │      │  │  index.ts                                    # Acceptance 模組匯出
│  │  │  │      │  │  module.metadata.ts                          # 模組元資料
│  │  │  │      │  │  README.md                                   # 驗收模組說明文件
│  │  │  │      │  │
│  │  │  │      │  ├─models
│  │  │  │      │  │      acceptance.model.ts                     # 驗收資料模型
│  │  │  │      │  │      index.ts                                # Models 匯出
│  │  │  │      │  │
│  │  │  │      │  ├─repositories
│  │  │  │      │  │      acceptance.repository.ts                # 驗收資料存取層
│  │  │  │      │  │
│  │  │  │      │  └─services
│  │  │  │      │          conclusion.service.ts                  # 驗收結論服務
│  │  │  │      │          preliminary.service.ts                 # 初驗服務
│  │  │  │      │          re-inspection.service.ts               # 複驗服務
│  │  │  │      │          request.service.ts                     # 驗收申請服務
│  │  │  │      │          review.service.ts                      # 驗收審查服務
│  │  │  │      │
│  │  │  │      ├─audit-logs
│  │  │  │      │  │  audit-logs.module.ts                        # 審計日誌模組定義
│  │  │  │      │  │  index.ts                                    # Audit-logs 模組匯出
│  │  │  │      │  │  module.metadata.ts                          # 模組元資料
│  │  │  │      │  │  README.md                                   # 審計日誌模組說明文件
│  │  │  │      │  │
│  │  │  │      │  ├─components
│  │  │  │      │  │      audit-logs.component.ts                 # 審計日誌元件
│  │  │  │      │  │
│  │  │  │      │  ├─config
│  │  │  │      │  │      audit-logs.config.ts                    # 審計日誌配置
│  │  │  │      │  │
│  │  │  │      │  ├─exports
│  │  │  │      │  │      audit-logs-api.exports.ts               # 審計日誌 API 匯出
│  │  │  │      │  │
│  │  │  │      │  ├─models
│  │  │  │      │  │      audit-log.model.ts                      # 審計日誌資料模型
│  │  │  │      │  │      audit-log.types.ts                      # 審計日誌類型定義
│  │  │  │      │  │
│  │  │  │      │  ├─repositories
│  │  │  │      │  │      audit-log.repository.ts                 # 審計日誌資料存取層
│  │  │  │      │  │
│  │  │  │      │  └─services
│  │  │  │      │          audit-logs.service.ts                  # 審計日誌服務
│  │  │  │      │
│  │  │  │      ├─climate
│  │  │  │      │  │  climate.module.ts                           # 氣候模組定義
│  │  │  │      │  │  index.ts                                    # Climate 模組匯出
│  │  │  │      │  │  README.md                                   # 氣候模組說明文件
│  │  │  │      │  │
│  │  │  │      │  ├─config
│  │  │  │      │  │      climate.config.ts                       # 氣候模組配置
│  │  │  │      │  │      cwb-api.constants.ts                    # 中央氣象局 API 常數
│  │  │  │      │  │
│  │  │  │      │  ├─examples
│  │  │  │      │  │      usage-example.ts                        # 使用範例
│  │  │  │      │  │
│  │  │  │      │  ├─exports
│  │  │  │      │  │      climate-api.exports.ts                  # 氣候 API 匯出
│  │  │  │      │  │
│  │  │  │      │  ├─models
│  │  │  │      │  │      cwb-api-response.model.ts               # 中央氣象局 API 回應模型
│  │  │  │      │  │      weather-forecast.model.ts               # 天氣預報模型
│  │  │  │      │  │
│  │  │  │      │  ├─repositories
│  │  │  │      │  │      climate.repository.ts                   # 氣候資料存取層
│  │  │  │      │  │
│  │  │  │      │  └─services
│  │  │  │      │          climate-cache.service.ts               # 氣候快取服務
│  │  │  │      │          cwb-weather.service.ts                 # 中央氣象局天氣服務
│  │  │  │      │
│  │  │  │      ├─communication
│  │  │  │      │  │  communication.module.ts                     # 通訊模組定義
│  │  │  │      │  │  index.ts                                    # Communication 模組匯出
│  │  │  │      │  │  module.metadata.ts                          # 模組元資料
│  │  │  │      │  │  README.md                                   # 通訊模組說明文件
│  │  │  │      │  │
│  │  │  │      │  ├─models
│  │  │  │      │  │      communication.model.ts                  # 通訊資料模型
│  │  │  │      │  │      index.ts                                # Models 匯出
│  │  │  │      │  │
│  │  │  │      │  ├─repositories
│  │  │  │      │  │      communication.repository.ts             # 通訊資料存取層
│  │  │  │      │  │
│  │  │  │      │  └─services
│  │  │  │      │          group-message.service.ts               # 群組訊息服務
│  │  │  │      │          push-notification.service.ts           # 推播通知服務
│  │  │  │      │          system-notification.service.ts         # 系統通知服務
│  │  │  │      │          task-reminder.service.ts               # 任務提醒服務
│  │  │  │      │
│  │  │  │      ├─finance
│  │  │  │      │  │  finance.module.ts                           # 財務模組定義
│  │  │  │      │  │  index.ts                                    # Finance 模組匯出
│  │  │  │      │  │  module.metadata.ts                          # 模組元資料
│  │  │  │      │  │  README.md                                   # 財務模組說明文件
│  │  │  │      │  │
│  │  │  │      │  ├─models
│  │  │  │      │  │      finance.model.ts                        # 財務資料模型
│  │  │  │      │  │      index.ts                                # Models 匯出
│  │  │  │      │  │
│  │  │  │      │  ├─repositories
│  │  │  │      │  │      finance.repository.ts                   # 財務資料存取層
│  │  │  │      │  │
│  │  │  │      │  └─services
│  │  │  │      │          budget.service.ts                      # 預算服務
│  │  │  │      │          cost-management.service.ts             # 成本管理服務
│  │  │  │      │          financial-report.service.ts            # 財務報表服務
│  │  │  │      │          invoice.service.ts                     # 發票服務
│  │  │  │      │          ledger.service.ts                      # 帳簿服務
│  │  │  │      │          payment.service.ts                     # 付款服務
│  │  │  │      │
│  │  │  │      ├─log
│  │  │  │      │  │  index.ts                                    # Log 模組匯出
│  │  │  │      │  │  log.module.ts                               # 日誌模組定義
│  │  │  │      │  │  module.metadata.ts                          # 模組元資料
│  │  │  │      │  │  README.md                                   # 日誌模組說明文件
│  │  │  │      │  │
│  │  │  │      │  ├─models
│  │  │  │      │  │      activity-log.model.ts                   # 活動日誌資料模型
│  │  │  │      │  │
│  │  │  │      │  ├─repositories
│  │  │  │      │  │      log.repository.ts                       # 日誌資料存取層
│  │  │  │      │  │
│  │  │  │      │  └─services
│  │  │  │      │          activity-log.service.ts                # 活動日誌服務
│  │  │  │      │          attachment.service.ts                  # 附件服務
│  │  │  │      │          change-history.service.ts              # 變更歷史服務
│  │  │  │      │          comment.service.ts                     # 評論服務
│  │  │  │      │          system-event.service.ts                # 系統事件服務
│  │  │  │      │
│  │  │  │      ├─material
│  │  │  │      │  │  index.ts                                    # Material 模組匯出
│  │  │  │      │  │  material.module.ts                          # 物料模組定義
│  │  │  │      │  │  module.metadata.ts                          # 模組元資料
│  │  │  │      │  │  README.md                                   # 物料模組說明文件
│  │  │  │      │  │
│  │  │  │      │  ├─models
│  │  │  │      │  │      index.ts                                # Models 匯出
│  │  │  │      │  │      material.model.ts                       # 物料資料模型
│  │  │  │      │  │
│  │  │  │      │  ├─repositories
│  │  │  │      │  │      material.repository.ts                  # 物料資料存取層
│  │  │  │      │  │
│  │  │  │      │  └─services
│  │  │  │      │          consumption.service.ts                 # 消耗服務
│  │  │  │      │          equipment.service.ts                   # 設備服務
│  │  │  │      │          inventory.service.ts                   # 庫存服務
│  │  │  │      │          material-issue.service.ts              # 物料發放服務
│  │  │  │      │          material-management.service.ts         # 物料管理服務
│  │  │  │      │
│  │  │  │      ├─qa
│  │  │  │      │  │  index.ts                                    # QA 模組匯出
│  │  │  │      │  │  module.metadata.ts                          # 模組元資料
│  │  │  │      │  │  qa.module.ts                                # 品質保證模組定義
│  │  │  │      │  │  README.md                                   # 品質保證模組說明文件
│  │  │  │      │  │
│  │  │  │      │  ├─models
│  │  │  │      │  │      index.ts                                # Models 匯出
│  │  │  │      │  │      qa.model.ts                             # 品質保證資料模型
│  │  │  │      │  │
│  │  │  │      │  ├─repositories
│  │  │  │      │  │      qa.repository.ts                        # 品質保證資料存取層
│  │  │  │      │  │
│  │  │  │      │  └─services
│  │  │  │      │          checklist.service.ts                   # 檢查清單服務
│  │  │  │      │          defect.service.ts                      # 缺陷服務
│  │  │  │      │          inspection.service.ts                  # 檢驗服務
│  │  │  │      │          report.service.ts                      # 報告服務
│  │  │  │      │
│  │  │  │      ├─safety
│  │  │  │      │  │  index.ts                                    # Safety 模組匯出
│  │  │  │      │  │  module.metadata.ts                          # 模組元資料
│  │  │  │      │  │  README.md                                   # 安全模組說明文件
│  │  │  │      │  │  safety.module.ts                            # 安全模組定義
│  │  │  │      │  │
│  │  │  │      │  ├─models
│  │  │  │      │  │      index.ts                                # Models 匯出
│  │  │  │      │  │      safety-inspection.model.ts              # 安全檢查資料模型
│  │  │  │      │  │
│  │  │  │      │  ├─repositories
│  │  │  │      │  │      safety.repository.ts                    # 安全資料存取層
│  │  │  │      │  │
│  │  │  │      │  └─services
│  │  │  │      │          incident-report.service.ts             # 事故報告服務
│  │  │  │      │          risk-assessment.service.ts             # 風險評估服務
│  │  │  │      │          safety-inspection.service.ts           # 安全檢查服務
│  │  │  │      │          safety-training.service.ts             # 安全訓練服務
│  │  │  │      │
│  │  │  │      ├─tasks
│  │  │  │      │  │  index.ts                                    # Tasks 模組匯出
│  │  │  │      │  │  module.metadata.ts                          # 模組元資料
│  │  │  │      │  │  README.md                                   # 任務模組說明文件
│  │  │  │      │  │  task-modal.component.ts                     # 任務模態框元件
│  │  │  │      │  │  tasks.component.ts                          # 任務元件
│  │  │  │      │  │  tasks.module.spec.ts                        # 任務模組測試
│  │  │  │      │  │  tasks.module.ts                             # 任務模組定義
│  │  │  │      │  │  tasks.repository.ts                         # 任務資料存取層
│  │  │  │      │  │  tasks.routes.ts                             # 任務路由定義
│  │  │  │      │  │  tasks.service.ts                            # 任務服務
│  │  │  │      │  │
│  │  │  │      │  └─views
│  │  │  │      │          task-gantt-view.component.ts           # 任務甘特圖檢視元件
│  │  │  │      │          task-kanban-view.component.ts          # 任務看板檢視元件
│  │  │  │      │          task-list-view.component.ts            # 任務列表檢視元件
│  │  │  │      │          task-timeline-view.component.ts        # 任務時間軸檢視元件
│  │  │  │      │          task-tree-view.component.ts            # 任務樹狀檢視元件
│  │  │  │      │
│  │  │  │      └─workflow
│  │  │  │          │  index.ts                                   # Workflow 模組匯出
│  │  │  │          │  module.metadata.ts                         # 模組元資料
│  │  │  │          │  README.md                                  # 工作流程模組說明文件
│  │  │  │          │  workflow.module.ts                         # 工作流程模組定義
│  │  │  │          │
│  │  │  │          ├─models
│  │  │  │          │      index.ts                               # Models 匯出
│  │  │  │          │      workflow.model.ts                      # 工作流程資料模型
│  │  │  │          │
│  │  │  │          ├─repositories
│  │  │  │          │      workflow.repository.ts                 # 工作流程資料存取層
│  │  │  │          │
│  │  │  │          └─services
│  │  │  │                  approval.service.ts                   # 審批服務
│  │  │  │                  automation.service.ts                 # 自動化服務
│  │  │  │                  custom-workflow.service.ts            # 自訂工作流程服務
│  │  │  │                  state-machine.service.ts              # 狀態機服務
│  │  │  │                  template.service.ts                   # 範本服務
│  │  │  │
│  │  │  ├─repositories
│  │  │  │      blueprint-member.repository.ts                    # Blueprint 成員資料存取層
│  │  │  │      blueprint-module.repository.ts                    # Blueprint 模組資料存取層
│  │  │  │      blueprint.repository.ts                           # Blueprint 資料存取層
│  │  │  │      index.ts                                          # Repositories 匯出
│  │  │  │
│  │  │  └─services
│  │  │          blueprint-validation-schemas.ts                  # Blueprint 驗證架構
│  │  │          blueprint.service.ts                             # Blueprint 服務
│  │  │          dependency-validator.service.ts                  # 依賴驗證服務
│  │  │          index.ts                                         # Services 匯出
│  │  │          validation.service.ts                            # 驗證服務
│  │  │
│  │  ├─errors
│  │  │      AGENTS.md                                            # Errors 模組 AI 代理指南
│  │  │      blueprint-error.ts                                   # Blueprint 錯誤類別
│  │  │      index.ts                                             # Errors 模組匯出
│  │  │      module-not-found-error.ts                            # 模組未找到錯誤
│  │  │      permission-denied-error.ts                           # 權限拒絕錯誤
│  │  │      validation-error.ts                                  # 驗證錯誤
│  │  │
│  │  ├─i18n
│  │  │      i18n.service.spec.ts                                 # 國際化服務測試
│  │  │      i18n.service.ts                                      # 國際化服務
│  │  │
│  │  ├─models
│  │  │      AGENTS.md                                            # Models 模組 AI 代理指南
│  │  │      blueprint-config.model.ts                            # Blueprint 配置模型
│  │  │      blueprint-module.model.ts                            # Blueprint 模組模型
│  │  │      blueprint.model.ts                                   # Blueprint 模型
│  │  │      index.ts                                             # Models 模組匯出
│  │  │      notification.model.ts                                # 通知模型
│  │  │
│  │  ├─net
│  │  │      AGENTS.md                                            # Net 模組 AI 代理指南
│  │  │      default.interceptor.ts                               # 預設 HTTP 攔截器
│  │  │      helper.ts                                            # 網路輔助函數
│  │  │      index.ts                                             # Net 模組匯出
│  │  │      refresh-token.ts                                     # Token 刷新攔截器
│  │  │
│  │  ├─repositories
│  │  │  │  account.repository.ts                                 # 帳號資料存取層
│  │  │  │  AGENTS.md                                             # Repositories 模組 AI 代理指南
│  │  │  │  firebase-storage.repository.ts                        # Firebase 儲存資料存取層
│  │  │  │  index.ts                                              # Repositories 模組匯出
│  │  │  │  log-firestore.repository.ts                           # 日誌 Firestore 資料存取層
│  │  │  │  log.repository.ts                                     # 日誌資料存取層
│  │  │  │  notification.repository.ts                            # 通知資料存取層
│  │  │  │  organization-invitation.repository.ts                 # 組織邀請資料存取層
│  │  │  │  organization-member.repository.ts                     # 組織成員資料存取層
│  │  │  │  organization.repository.ts                            # 組織資料存取層
│  │  │  │  storage.repository.ts                                 # 儲存資料存取層
│  │  │  │  task-firestore.repository.ts                          # 任務 Firestore 資料存取層
│  │  │  │  task.repository.ts                                    # 任務資料存取層
│  │  │  │  team-member.repository.ts                             # 團隊成員資料存取層
│  │  │  │  team.repository.ts                                    # 團隊資料存取層
│  │  │  │
│  │  │  └─base
│  │  │          firestore-base.repository.ts                     # Firestore 基礎資料存取層
│  │  │
│  │  ├─services
│  │  │  │  AGENTS.md                                             # Services 模組 AI 代理指南
│  │  │  │  error-tracking.service.ts                             # 錯誤追蹤服務
│  │  │  │  firebase-analytics.service.ts                         # Firebase 分析服務
│  │  │  │  firebase-auth.service.ts                              # Firebase 認證服務
│  │  │  │  firebase.service.ts                                   # Firebase 核心服務
│  │  │  │  performance-monitoring.service.ts                     # 效能監控服務
│  │  │  │  push-messaging.service.ts                             # 推播訊息服務
│  │  │  │
│  │  │  ├─layout
│  │  │  │      index.ts                                          # Layout 服務匯出
│  │  │  │
│  │  │  └─logger
│  │  │          console-transport.ts                             # 控制台日誌傳輸
│  │  │          index.ts                                         # Logger 服務匯出
│  │  │          log-transport.interface.ts                       # 日誌傳輸介面
│  │  │          logger.service.spec.ts                           # 日誌服務測試
│  │  │          logger.service.ts                                # 日誌服務
│  │  │
│  │  ├─startup
│  │  │      startup.service.ts                                   # 啟動服務
│  │  │
│  │  ├─stores
│  │  │      AGENTS.md                                            # Stores 模組 AI 代理指南
│  │  │      index.ts                                             # Stores 模組匯出
│  │  │      log.store.ts                                         # 日誌狀態管理
│  │  │      notification.store.ts                                # 通知狀態管理
│  │  │      task.store.ts                                        # 任務狀態管理
│  │  │      team.store.ts                                        # 團隊狀態管理
│  │  │
│  │  ├─types
│  │  │  │  account.types.ts                                      # 帳號類型定義
│  │  │  │  AGENTS.md                                             # Types 模組 AI 代理指南
│  │  │  │  index.ts                                              # Types 模組匯出
│  │  │  │
│  │  │  ├─blueprint
│  │  │  │      blueprint-status.enum.ts                          # Blueprint 狀態枚舉
│  │  │  │      blueprint.types.ts                                # Blueprint 類型定義
│  │  │  │      owner-type.enum.ts                                # 擁有者類型枚舉
│  │  │  │
│  │  │  ├─configuration
│  │  │  │      configuration.types.ts                            # 配置類型定義
│  │  │  │
│  │  │  ├─events
│  │  │  │      event-type.enum.ts                                # 事件類型枚舉
│  │  │  │      event.types.ts                                    # 事件類型定義
│  │  │  │
│  │  │  ├─log
│  │  │  │      index.ts                                          # Log 類型匯出
│  │  │  │      log-task.types.ts                                 # 日誌任務類型定義
│  │  │  │      log.types.ts                                      # 日誌類型定義
│  │  │  │
│  │  │  ├─module
│  │  │  │      module-state.enum.ts                              # 模組狀態枚舉
│  │  │  │      module.types.ts                                   # 模組類型定義
│  │  │  │
│  │  │  ├─permission
│  │  │  │      permission-level.enum.ts                          # 權限等級枚舉
│  │  │  │      permission.types.ts                               # 權限類型定義
│  │  │  │      role.enum.ts                                      # 角色枚舉
│  │  │  │
│  │  │  ├─quality-control
│  │  │  │      index.ts                                          # Quality-control 類型匯出
│  │  │  │      quality-control.types.ts                          # 品質控制類型定義
│  │  │  │
│  │  │  ├─storage
│  │  │  │      index.ts                                          # Storage 類型匯出
│  │  │  │      storage.types.ts                                  # 儲存類型定義
│  │  │  │
│  │  │  ├─task
│  │  │  │      index.ts                                          # Task 類型匯出
│  │  │  │      task-quantity.types.ts                            # 任務數量類型定義
│  │  │  │      task-view.types.ts                                # 任務檢視類型定義
│  │  │  │      task.types.ts                                     # 任務類型定義
│  │  │  │
│  │  │  └─workflow
│  │  │          index.ts                                         # Workflow 類型匯出
│  │  │          workflow.types.ts                                # 工作流程類型定義
│  │  │
│  │  └─utils
│  │          task-hierarchy.util.ts                              # 任務階層工具函數
│  │
│  ├─features
│  │  │  AGENTS.md                                                # Features 模組 AI 代理指南
│  │  │
│  │  └─module-manager
│  │      │  index.ts                                             # Module-manager 模組匯出
│  │      │  module-manager.component.ts                          # 模組管理器元件
│  │      │  module-manager.routes.ts                             # 模組管理器路由
│  │      │  module-manager.service.ts                            # 模組管理器服務
│  │      │
│  │      └─components
│  │              module-card.component.ts                        # 模組卡片元件
│  │              module-config-form.component.ts                 # 模組配置表單元件
│  │              module-dependency-graph.component.ts            # 模組依賴圖元件
│  │              module-status-badge.component.ts                # 模組狀態徽章元件
│  │
│  ├─layout
│  │  │  AGENTS.md                                                # Layout 模組 AI 代理指南
│  │  │  index.ts                                                 # Layout 模組匯出
│  │  │
│  │  ├─basic
│  │  │  │  basic.component.ts                                    # 基本佈局元件
│  │  │  │  README.md                                             # 基本佈局說明文件
│  │  │  │
│  │  │  └─widgets
│  │  │          clear-storage.component.ts                       # 清除儲存元件
│  │  │          context-switcher.component.ts                    # 上下文切換器元件
│  │  │          fullscreen.component.ts                          # 全螢幕元件
│  │  │          i18n.component.ts                                # 國際化元件
│  │  │          icon.component.ts                                # 圖示元件
│  │  │          notify.component.ts                              # 通知元件
│  │  │          rtl.component.ts                                 # 右到左文字元件
│  │  │          search.component.ts                              # 搜尋元件
│  │  │          task.component.ts                                # 任務元件
│  │  │          user.component.ts                                # 使用者元件
│  │  │
│  │  ├─blank
│  │  │      blank.component.ts                                   # 空白佈局元件
│  │  │      README.md                                            # 空白佈局說明文件
│  │  │
│  │  └─passport
│  │          passport.component.less                             # 護照佈局樣式
│  │          passport.component.ts                               # 護照佈局元件
│  │
│  ├─routes
│  │  │  AGENTS.md                                                # Routes 模組 AI 代理指南
│  │  │  routes.ts                                                # 路由配置
│  │  │
│  │  ├─blueprint
│  │  │  │  AGENTS.md                                             # Blueprint 路由 AI 代理指南
│  │  │  │  blueprint-designer.component.ts                       # Blueprint 設計器元件
│  │  │  │  blueprint-detail.component.ts                         # Blueprint 詳情元件
│  │  │  │  blueprint-list.component.ts                           # Blueprint 列表元件
│  │  │  │  blueprint-modal.component.ts                          # Blueprint 模態框元件
│  │  │  │  routes.ts                                             # Blueprint 路由定義
│  │  │  │
│  │  │  ├─components
│  │  │  │      .gitkeep                                          # Git 保留檔案
│  │  │  │      connection-layer.component.ts                     # 連接層元件
│  │  │  │      index.ts                                          # Components 匯出
│  │  │  │      validation-alerts.component.ts                    # 驗證警示元件
│  │  │  │
│  │  │  ├─construction-log
│  │  │  │      construction-log-modal.component.ts               # 施工日誌模態框元件
│  │  │  │      construction-log.component.ts                     # 施工日誌元件
│  │  │  │      construction-log.store.ts                         # 施工日誌狀態管理
│  │  │  │      index.ts                                          # Construction-log 匯出
│  │  │  │      README.md                                         # 施工日誌說明文件
│  │  │  │
│  │  │  ├─container
│  │  │  │      container-dashboard.component.ts                  # 容器儀表板元件
│  │  │  │      event-bus-monitor.component.ts                    # 事件匯流排監控元件
│  │  │  │
│  │  │  ├─members
│  │  │  │      blueprint-members.component.ts                    # Blueprint 成員元件
│  │  │  │      member-modal.component.ts                         # 成員模態框元件
│  │  │  │
│  │  │  └─modules
│  │  │          acceptance-module-view.component.ts              # 驗收模組檢視元件
│  │  │          communication-module-view.component.ts           # 通訊模組檢視元件
│  │  │          finance-module-view.component.ts                 # 財務模組檢視元件
│  │  │          log-module-view.component.ts                     # 日誌模組檢視元件
│  │  │          material-module-view.component.ts                # 物料模組檢視元件
│  │  │          qa-module-view.component.ts                      # 品質保證模組檢視元件
│  │  │          safety-module-view.component.ts                  # 安全模組檢視元件
│  │  │          workflow-module-view.component.ts                # 工作流程模組檢視元件
│  │  │
│  │  ├─dashboard
│  │  │      AGENTS.md                                            # Dashboard 路由 AI 代理指南
│  │  │
│  │  ├─exception
│  │  │      AGENTS.md                                            # Exception 路由 AI 代理指南
│  │  │      exception.component.ts                               # 異常頁面元件
│  │  │      routes.ts                                            # 異常路由定義
│  │  │      trigger.component.ts                                 # 異常觸發元件
│  │  │
│  │  ├─explore
│  │  │  │  explore-page.component.ts                             # 探索頁面元件
│  │  │  │  routes.ts                                             # 探索路由定義
│  │  │  │
│  │  │  ├─components
│  │  │  │      filter-panel.component.ts                         # 篩選面板元件
│  │  │  │      index.ts                                          # Components 匯出
│  │  │  │      result-grid.component.ts                          # 結果網格元件
│  │  │  │      search-bar.component.ts                           # 搜尋列元件
│  │  │  │
│  │  │  ├─models
│  │  │  │      index.ts                                          # Models 匯出
│  │  │  │      search-result.model.ts                            # 搜尋結果模型
│  │  │  │
│  │  │  └─services
│  │  │          explore-search.facade.ts                         # 探索搜尋外觀服務
│  │  │          index.ts                                         # Services 匯出
│  │  │          search-cache.service.spec.ts                     # 搜尋快取服務測試
│  │  │          search-cache.service.ts                          # 搜尋快取服務
│  │  │
│  │  ├─monitoring
│  │  │      monitoring-dashboard.component.ts                    # 監控儀表板元件
│  │  │      routes.ts                                            # 監控路由定義
│  │  │
│  │  ├─organization
│  │  │  │  AGENTS.md                                             # Organization 路由 AI 代理指南
│  │  │  │  routes.ts                                             # 組織路由定義
│  │  │  │
│  │  │  ├─members
│  │  │  │      organization-members.component.ts                 # 組織成員元件
│  │  │  │
│  │  │  ├─settings
│  │  │  │      organization-settings.component.ts                # 組織設定元件
│  │  │  │
│  │  │  └─teams
│  │  │          organization-teams.component.ts                  # 組織團隊元件
│  │  │          team-modal.component.ts                          # 團隊模態框元件
│  │  │
│  │  ├─passport
│  │  │  │  AGENTS.md                                             # Passport 路由 AI 代理指南
│  │  │  │  callback.component.ts                                 # 認證回調元件
│  │  │  │  routes.ts                                             # 認證路由定義
│  │  │  │
│  │  │  ├─lock
│  │  │  │      lock.component.html                               # 鎖定頁面模板
│  │  │  │      lock.component.less                               # 鎖定頁面樣式
│  │  │  │      lock.component.ts                                 # 鎖定頁面元件
│  │  │  │
│  │  │  ├─login
│  │  │  │      login.component.html                              # 登入頁面模板
│  │  │  │      login.component.less                              # 登入頁面樣式
│  │  │  │      login.component.ts                                # 登入頁面元件
│  │  │  │
│  │  │  ├─register
│  │  │  │      register.component.html                           # 註冊頁面模板
│  │  │  │      register.component.less                           # 註冊頁面樣式
│  │  │  │      register.component.ts                             # 註冊頁面元件
│  │  │  │
│  │  │  └─register-result
│  │  │          register-result.component.html                   # 註冊結果頁面模板
│  │  │          register-result.component.ts                     # 註冊結果頁面元件
│  │  │
│  │  ├─team
│  │  │  │  AGENTS.md                                             # Team 路由 AI 代理指南
│  │  │  │  routes.ts                                             # 團隊路由定義
│  │  │  │
│  │  │  └─members
│  │  │          team-member-modal.component.ts                   # 團隊成員模態框元件
│  │  │          team-members.component.ts                        # 團隊成員元件
│  │  │
│  │  └─user
│  │      │  AGENTS.md                                            # User 路由 AI 代理指南
│  │      │  routes.ts                                            # 使用者路由定義
│  │      │
│  │      └─settings
│  │              settings.component.ts                           # 使用者設定元件
│  │
│  └─shared
│      │  AGENTS.md                                               # Shared 模組 AI 代理指南
│      │  index.ts                                                # Shared 模組匯出
│      │  README.md                                               # Shared 模組說明文件
│      │  shared-delon.module.ts                                  # ng-alain 共享模組
│      │  shared-imports.ts                                       # 共享匯入定義
│      │  shared-zorro.module.ts                                  # ng-zorro 共享模組
│      │
│      ├─cdk
│      │      index.ts                                            # CDK 模組匯出
│      │      README.md                                           # CDK 模組說明文件
│      │      shared-cdk.module.ts                                # Angular CDK 共享模組
│      │
│      ├─cell-widget
│      │      index.ts                                            # Cell-widget 模組匯出
│      │
│      ├─components
│      │  ├─breadcrumb
│      │  │      breadcrumb.component.ts                          # 麵包屑元件
│      │  │
│      │  ├─create-organization
│      │  │      create-organization.component.ts                 # 建立組織元件
│      │  │
│      │  ├─create-team-modal
│      │  │      create-team-modal.component.ts                   # 建立團隊模態框元件
│      │  │
│      │  ├─edit-team-modal
│      │  │      edit-team-modal.component.ts                     # 編輯團隊模態框元件
│      │  │
│      │  └─team-detail-drawer
│      │          team-detail-drawer.component.html               # 團隊詳情抽屜模板
│      │          team-detail-drawer.component.ts                 # 團隊詳情抽屜元件
│      │
│      ├─json-schema
│      │  │  index.ts                                             # JSON-schema 模組匯出
│      │  │  README.md                                            # JSON-schema 模組說明文件
│      │  │
│      │  └─test
│      │          test.widget.ts                                  # 測試小工具
│      │
│      ├─services
│      │  │  AGENTS.md                                            # Shared Services AI 代理指南
│      │  │  breadcrumb.service.ts                                # 麵包屑服務
│      │  │  index.ts                                             # Services 匯出
│      │  │  menu-management.service.ts                           # 選單管理服務
│      │  │  workspace-context.service.ts                         # 工作區上下文服務
│      │  │
│      │  └─permission
│      │          permission.service.ts                           # 權限服務
│      │
│      ├─st-widget
│      │      index.ts                                            # ST-widget 模組匯出
│      │      README.md                                           # ST-widget 模組說明文件
│      │
│      └─utils
│              async-state.ts                                     # 非同步狀態工具
│              index.ts                                           # Utils 匯出
│
├─assets
│  │  .gitkeep                                                    # Git 保留檔案
│  │  color.less                                                  # 顏色樣式
│  │  logo-color.svg                                              # 彩色 Logo
│  │  logo-full.svg                                               # 完整 Logo
│  │  logo.svg                                                    # Logo
│  │  style.compact.css                                           # 緊湊樣式
│  │  style.dark.css                                              # 深色主題樣式
│  │  zorro.svg                                                   # Zorro Logo
│  │
│  └─tmp
│      │  app-data.json                                           # 應用程式資料
│      │  demo.docx                                               # 示範 Word 文件
│      │  demo.pdf                                                # 示範 PDF 文件
│      │  demo.pptx                                               # 示範 PowerPoint 文件
│      │  demo.xlsx                                               # 示範 Excel 文件
│      │  demo.zip                                                # 示範壓縮檔
│      │  on-boarding.json                                        # 入門資料
│      │
│      ├─i18n
│      │      en-US.json                                          # 英文語言檔
│      │      zh-CN.json                                          # 簡體中文語言檔
│      │      zh-TW.json                                          # 繁體中文語言檔
│      │
│      └─img
│              1.png                                               # 圖片 1
│              2.png                                               # 圖片 2
│              3.png                                               # 圖片 3
│              4.png                                               # 圖片 4
│              5.png                                               # 圖片 5
│              6.png                                               # 圖片 6
│              avatar.jpg                                          # 頭像圖片
│
├─environments
│      AGENTS.md                                                  # Environments AI 代理指南
│      environment.prod.ts                                        # 生產環境配置
│      environment.ts                                             # 開發環境配置
│
├─styles
│      AGENTS.md                                                  # Styles AI 代理指南
│      index.less                                                 # 樣式入口
│      theme.less                                                 # 主題樣式
│
└─types
        import-meta.d.ts                                          # Import Meta 類型定義
