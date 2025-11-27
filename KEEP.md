# 專案關鍵詞清單（中英對照）

> 本文件收錄專案開發過程中的核心概念、架構原則與開發規範的中英對照關鍵詞。

---

## 🛠️ 核心工具與概念

| 中文 | English |
|------|---------|
| 逐步執行的思考鏈 | Sequential Thinking / Thought Chain |
| 軟體規劃工具 | Software Planning Tool |
| Supabase MCP 系統化 | Supabase MCP Systemization |
| 遠端資料庫檢視 | Remote Database Inspection |
| RLS（行級安全） | Row Level Security (RLS) |
| SECURITY DEFINER | SECURITY DEFINER |
| supabase\migrations 不作為判斷準則 | migrations are not evaluation criteria |

---

## 🧱 企業級分層架構

| 中文 | English |
|------|---------|
| 單一職責原則 | Single Responsibility Principle (SRP) |
| 關注點分離 | Separation of Concerns |
| 分層結構 | Layered Architecture |
| 型別層 | Types Layer |
| 儲存庫層 | Repositories Layer |
| 模型層 | Models Layer |
| 服務層 | Services Layer |
| 門面層 | Facades Layer |
| 路由/元件層 | Routes / Components Layer |
| 資料轉換 | Data Transformation |
| 網域類型 / 傳輸物件 | Domain Types / DTO Types |
| DTO → Domain Model → View Model | DTO → Domain Model → View Model |

---

## 🧾 各層職責

| 中文 | English |
|------|---------|
| 型別層僅定義資料結構 | Types define data structures only |
| 儲存庫層純存取後端 | Repositories handle backend access only |
| 模型層負責資料映射 | Models handle data mapping |
| 服務層負責業務邏輯 | Services handle business logic only |
| 門面層是 UI 的唯一入口 | Facades are the single UI access point |
| 元件層僅負責呈現 | Components handle UI rendering only |
| 禁止跨層依賴 | No cross-layer dependencies |
| 禁止反向依賴 | No reverse dependencies |

---

## 🧭 模組邊界與規範

| 中文 | English |
|------|---------|
| 功能模組 | Feature Module |
| 基礎設施模組 | Infrastructure Module |
| 網域模組 | Domain Module |
| 共用模組 | Shared Module |
| 懶載入 | Lazy Load |
| 禁止 Feature 互相 import | Feature Modules must not import each other |
| Domain 不可依賴 Infrastructure | Domain must not depend on Infrastructure |
| Shared 不可包含商業邏輯 | Shared must not contain business logic |
| Supabase Client 只能在 Repository | Supabase Client allowed only in Repository |

---

## 🔄 狀態管理

| 中文 | English |
|------|---------|
| 狀態管理分層原則 | State Management Layering Principles |
| 門面暴露可觀察資料 | Facade exposes observable data |
| Store 操作必須由 Facade 執行 | Store operations must go through Facade |
| 元件不可直接操作 Store | Components must not directly operate Store |
| 事件驅動資料流 | Event-driven data flow |
| 狀態層 | Store Layer |
| 服務層處理業務流程 | Services handle workflow, not UI |

---

## ❌ 錯誤處理與映射

| 中文 | English |
|------|---------|
| 全域錯誤處理器 | Global Error Handler |
| HTTP 拦截器 | HTTP Interceptor |
| 錯誤映射流程 | Error Mapping Flow |
| Supabase Error → Domain Error → UI Error | Supabase Error → Domain Error → UI Error |
| RLS 被拒錯誤處理 | RLS Rejection Error Handling |

---

## 🔐 環境管理與密鑰安全

| 中文 | English |
|------|---------|
| 多環境設定 | Multi-environment configuration |
| Build 時注入金鑰 | Inject keys at build time |
| anon key 不可放在程式碼中 | anon key must not be stored in code |
| MCP schema / dto 版本管理 | MCP schema/dto versioning |
| 集中式 Config 管理 | Centralized configuration management |

---

## 📦 匯出規範

| 中文 | English |
|------|---------|
| Barrel File 匯出規範 | Barrel File Export Rules |
| 公開介面邊界 | Public API Boundary |
| Domain 只能匯出 index.ts | Domain must expose only index.ts |
| Feature 僅公開 Facade | Feature exposes only Facade |
| Infrastructure 不可匯出 Repository | Infrastructure must not expose Repository |

---

## 📘 相關文件

| 中文 | English |
|------|---------|
| 藍圖功能缺口分析 | Blueprint Gap Analysis |
| 共享上下文 | Shared Context |
| 企業級開發指南 | Angular Enterprise Development Guidelines |
| 日誌設計指南 | diary-design.md |
| 待辦設計指南 | todo-design.md |
| 當前任務文件 | TASK_NOW.md |

---

## 🧑‍💻 UI 與業務實作

| 中文 | English |
|------|---------|
| 藍圖建立按鈕缺失 | Missing "Create Blueprint" button |
| 任務 CRUD 實作 | Task CRUD implementation |
| 企業級 @delon/form modal | Enterprise-standard @delon/form modal |
| 依據專案命名規範開發 | Follow project naming conventions |
| 不做任何修改，先分析問題 | Analyze first, modify later |

---

## 🏗️ 系統架構層級

| 中文 | English |
|------|---------|
| 身份認證層 | Authentication Layer |
| 權限控制層 | Permission Control Layer |
| 專案藍圖層 | Project Blueprint Layer |
| 任務執行模組 | Task Execution Module |
| 異常處理模組 | Exception Handling Module |
| 協作溝通模組 | Collaboration & Communication Module |
| 資料分析模組 | Data Analysis Module |
| 系統管理模組 | System Management Module |
| Supabase 核心服務 | Supabase Core Services |

---

## 🎯 業務領域概念

| 中文 | English |
|------|---------|
| 工地施工進度追蹤管理系統 | Construction Site Management System |
| 工作區上下文切換 | Workspace Context Switching |
| 藍圖邏輯容器 | Blueprint Logic Container |
| 主分支 | Main Branch |
| 組織分支 | Organization Branch |
| Fork 機制 | Fork Mechanism |
| Pull Request | Pull Request (PR) |
| 承攬關係 | Contractor Relationship |
| 任務樹狀結構 | Task Tree Structure |
| 任務膠囊狀態 | Task Capsule Status |
| 暫存區 | Staging Area |
| 48 小時可撤回 | 48-hour Reversible Period |
| 每日施工日誌 | Daily Construction Diary |
| 品質驗收 | Quality Acceptance |
| 品質檢查清單 | Quality Checklist |
| 問題追蹤 | Issue Tracking |
| 跨分支同步 | Cross-branch Synchronization |
| 討論區 | Discussion Forum |
| 通知中心 | Notification Center |
| 待辦中心 | Todo Center |
| 五狀態分類 | Five Status Categories |
| 活動記錄 | Activity Log |
| 文件管理 | Document Management |
| 版本控制 | Version Control |
| 軟刪除 | Soft Delete |
| 圖片縮圖 | Image Thumbnail |

---

## 👥 角色與權限

| 中文 | English |
|------|---------|
| 平台層級角色 | Platform-level Roles |
| 藍圖層級角色 | Blueprint-level Roles |
| 超級管理員 | Super Admin |
| 組織擁有者 | Organization Owner |
| 組織管理員 | Organization Admin |
| 一般用戶 | User |
| 專案經理 | Project Manager |
| 工地主任 | Site Director |
| 施工人員 | Worker |
| 品管人員 | QA Staff |
| 觀察者 | Observer |
| 自訂角色 | Custom Role |
| 權限存取矩陣 | Permission Access Matrix |

---

## 🔧 技術架構組件

| 中文 | English |
|------|---------|
| Vertical Slice Architecture | Vertical Slice Architecture |
| 邏輯容器 | Logic Container |
| Shell Component | Shell Component |
| 資料隔離 | Data Isolation |
| 上下文共享 | Context Sharing |
| 多模組擴展 | Multi-module Extension |
| 工作區上下文切換器 | Workspace Context Switcher |
| 個人工作區 | Personal Workspace (USER) |
| 組織工作區 | Organization Workspace |
| 團隊工作區 | Team Workspace |
| 機器人工作區 | Bot Workspace |
| 藍圖 Shell | Blueprint Shell |
| 任務樹狀圖 | Task Tree View |
| 任務表格視圖 | Task Table View |
| 視圖切換 | View Switching |
| 日誌列表 | Diary List |
| 待辦列表 | Todo List |

---

## 📊 資料與狀態

| 中文 | English |
|------|---------|
| 任務狀態 | Task Status |
| 待處理 | Pending / TODO |
| 進行中 | In Progress |
| 暫存中 | Staging |
| 品管中 | In QA |
| 驗收中 | In Acceptance |
| 已完成 | Completed / Done |
| 已取消 | Cancelled |
| 任務優先級 | Task Priority |
| 最低/低/中/高/最高 | Lowest / Low / Medium / High / Highest |
| 任務類型 | Task Type |
| 任務/里程碑/錯誤/功能/改進 | Task / Milestone / Bug / Feature / Improvement |
| 進度百分比 | Progress Percentage |
| 完工圖片 | Completion Photos |
| 任務指派 | Task Assignment |
| 負責人 | Assignee |
| 協作人員 | Collaborators |

---

## 🔄 工作流程

| 中文 | English |
|------|---------|
| 任務建立 | Task Creation |
| 任務更新 | Task Update |
| 任務刪除 | Task Deletion |
| 任務拖拉排序 | Task Drag & Drop Sorting |
| 進度更新 | Progress Update |
| 進度自動彙總 | Automatic Progress Aggregation |
| 進度儀表板 | Progress Dashboard |
| 計劃 vs 實際進度 | Planned vs Actual Progress |
| 里程碑追蹤 | Milestone Tracking |
| 進度風險預警 | Progress Risk Alert |
| 驗收流程 | Acceptance Process |
| 驗收申請 | Acceptance Request |
| 驗收判定 | Acceptance Judgment |
| 通過/不通過/有條件通過 | Passed / Failed / Conditional Pass |
| 串驗收 | Chain Acceptance |
| 問題開立 | Issue Creation |
| 問題指派 | Issue Assignment |
| 問題處理 | Issue Handling |
| 問題關閉 | Issue Closure |

---

## 📁 檔案與儲存

| 中文 | English |
|------|---------|
| Supabase Storage | Supabase Storage |
| Storage Buckets | Storage Buckets |
| 檔案上傳 | File Upload |
| 批次上傳 | Batch Upload |
| 檔案分類 | File Classification |
| 檔案標籤 | File Tags |
| 資料夾結構 | Folder Structure |
| 檔案版本控制 | File Version Control |
| 檔案預覽 | File Preview |
| 存取權限控制 | Access Permission Control |
| 下載記錄追蹤 | Download Record Tracking |
| CDN 加速 | CDN Acceleration |
| 自動縮圖生成 | Automatic Thumbnail Generation |
| 大檔案分片上傳 | Large File Chunk Upload |
| EXIF 資訊 | EXIF Information |
| 照片壓縮 | Image Compression |
| 離線暫存 | Offline Cache |

---

## 🔔 通知與協作

| 中文 | English |
|------|---------|
| 即時通知 | Real-time Notification |
| 站內通知 | In-app Notification |
| Email 通知 | Email Notification |
| 推播通知 | Push Notification |
| 通知規則 | Notification Rules |
| 通知訂閱 | Notification Subscription |
| 已讀管理 | Read Status Management |
| 留言功能 | Comment Function |
| 巢狀回覆 | Nested Reply |
| @提及功能 | @Mention Function |
| 即時訊息 | Real-time Message |
| Realtime 廣播 | Realtime Broadcast |
| 已讀狀態 | Read Status |

---

## 📈 報表與分析

| 中文 | English |
|------|---------|
| 進度報表 | Progress Report |
| 品質報表 | Quality Report |
| 工時報表 | Work Hours Report |
| 統計報表 | Statistical Report |
| 報表匯出 | Report Export |
| PDF 格式 | PDF Format |
| Excel 格式 | Excel Format |
| 報表排程 | Report Scheduling |
| 報表訂閱 | Report Subscription |
| 數據分析 | Data Analysis |
| 圖表視覺化 | Chart Visualization |
| 分析快取 | Analytics Cache |
| 預計算報表 | Pre-computed Report |
| 多層級聚合 | Multi-level Aggregation |

---

## ⚙️ 系統管理

| 中文 | English |
|------|---------|
| 系統設定 | System Settings |
| 全域設定 | Global Settings |
| 專案設定 | Project Settings |
| 個人偏好 | Personal Preferences |
| 功能開關 | Feature Flags |
| 灰度發布 | Gray Release |
| A/B 測試 | A/B Testing |
| 天氣整合 | Weather Integration |
| 機器人系統 | Bot System |
| 定期報表機器人 | Scheduled Report Bot |
| 通知機器人 | Notification Bot |
| 備份機器人 | Backup Bot |
| 任務佇列 | Task Queue |
| 執行日誌 | Execution Log |
| 備份還原 | Backup & Restore |
| 自動化備份 | Automated Backup |

---

## 🌐 Supabase 服務

| 中文 | English |
|------|---------|
| PostgreSQL Database | PostgreSQL Database |
| 關聯式資料庫 | Relational Database |
| ACID 保證 | ACID Guarantee |
| 索引優化 | Index Optimization |
| Foreign Keys | Foreign Keys |
| Database Triggers | Database Triggers |
| Materialized Views | Materialized Views |
| Supabase Storage | Supabase Storage |
| 物件儲存 | Object Storage |
| Bucket 管理 | Bucket Management |
| 存取控制 | Access Control |
| Realtime | Realtime |
| WebSocket 連接 | WebSocket Connection |
| Database 變更訂閱 | Database Change Subscription |
| Broadcast 廣播 | Broadcast |
| Presence 狀態 | Presence Status |
| Edge Functions | Edge Functions |
| Deno Runtime | Deno Runtime |
| 無伺服器運算 | Serverless Computing |
| 第三方 API 整合 | Third-party API Integration |
| 背景任務 | Background Task |

---

## 🎨 開發理念與原則

| 中文 | English |
|------|---------|
| 奧卡姆剃刀原則 | Occam's Razor Principle |
| 功能最小化 | Feature Minimization |
| 企業標準 | Enterprise Standard |
| 易於擴展 | Easy to Extend |
| 避免冗餘 | Avoid Redundancy |
| 藍圖是邏輯容器 | Blueprint is Logic Container |
| 任務是主核心模組 | Task is Core Module |
| 其他模組依附任務 | Other Modules Depend on Tasks |
| 上下文層層傳遞 | Context Passed Layer by Layer |
| 零認知開發 | Zero Cognitive Development |
| 企業標準+生產水平 | Enterprise Standard + Production Level |

---

**最後更新**：2025-01-20
