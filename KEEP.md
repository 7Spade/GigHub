# 專案關鍵詞清單（中英對照）

> 本文件收錄專案開發過程中的核心概念、架構原則與開發規範的中英對照關鍵詞。

---

## 🛠️ 核心工具與概念

| 中文 | English | 說明 |
|------|---------|------|
| 逐步執行的思考鏈 | Sequential Thinking / Thought Chain | 使用逐步推理方式分析問題，確保邏輯清晰 |
| 軟體規劃工具 | Software Planning Tool | 用於生成和驗證開發計劃的工具 |
| Supabase MCP 系統化 | Supabase MCP Systemization | 將 Supabase 操作透過 MCP 工具標準化 |
| 遠端資料庫檢視 | Remote Database Inspection | 透過 MCP 工具檢視遠端資料庫結構與資料 |
| RLS（行級安全） | Row Level Security (RLS) | PostgreSQL 行級安全機制，控制資料存取權限 |
| SECURITY DEFINER | SECURITY DEFINER | 函數以定義者權限執行，用於權限提升場景 |
| supabase\migrations 不作為判斷準則 | migrations are not evaluation criteria | 遷移檔案不應作為功能判斷的唯一依據 |

---

## 🧱 企業級分層架構

| 中文 | English | 說明 |
|------|---------|------|
| 單一職責原則 | Single Responsibility Principle (SRP) | 每個模組只負責一個明確的職責 |
| 關注點分離 | Separation of Concerns | 將不同關注點分離到不同層級 |
| 分層結構 | Layered Architecture | 系統按職責分層，層級間依賴單向 |
| 型別層 | Types Layer | 定義資料結構與型別定義 |
| 儲存庫層 | Repositories Layer | 負責後端資料存取抽象 |
| 模型層 | Models Layer | 負責資料映射與轉換 |
| 服務層 | Services Layer | 處理業務邏輯與工作流程 |
| 門面層 | Facades Layer | UI 的唯一入口，統一對外介面 |
| 路由/元件層 | Routes / Components Layer | 負責 UI 呈現與使用者互動 |
| 資料轉換 | Data Transformation | 在不同層級間轉換資料格式 |
| 網域類型 / 傳輸物件 | Domain Types / DTO Types | 網域模型與資料傳輸物件的型別定義 |
| DTO → Domain Model → View Model | DTO → Domain Model → View Model | 資料從後端到前端的轉換流程 |

---

## 🧾 各層職責

| 中文 | English | 說明 |
|------|---------|------|
| 型別層僅定義資料結構 | Types define data structures only | 型別層只定義結構，不包含邏輯 |
| 儲存庫層純存取後端 | Repositories handle backend access only | 儲存庫層專注於資料存取，不處理業務邏輯 |
| 模型層負責資料映射 | Models handle data mapping | 模型層負責不同格式間的資料轉換 |
| 服務層負責業務邏輯 | Services handle business logic only | 服務層處理業務規則與工作流程 |
| 門面層是 UI 的唯一入口 | Facades are the single UI access point | UI 元件只能透過門面層存取資料與操作 |
| 元件層僅負責呈現 | Components handle UI rendering only | 元件層專注於 UI 呈現，不包含業務邏輯 |
| 禁止跨層依賴 | No cross-layer dependencies | 層級間只能依賴相鄰層級，不可跨層 |
| 禁止反向依賴 | No reverse dependencies | 下層不可依賴上層，保持單向依賴 |

---

## 🧭 模組邊界與規範

| 中文 | English | 說明 |
|------|---------|------|
| 功能模組 | Feature Module | 完整業務功能模組，採用垂直切片架構 |
| 基礎設施模組 | Infrastructure Module | 提供基礎設施服務的模組 |
| 網域模組 | Domain Module | 定義業務領域模型與規則 |
| 共用模組 | Shared Module | 跨模組共用的元件與工具 |
| 懶載入 | Lazy Load | 按需載入模組以提升效能 |
| 禁止 Feature 互相 import | Feature Modules must not import each other | 功能模組間保持獨立，避免循環依賴 |
| Domain 不可依賴 Infrastructure | Domain must not depend on Infrastructure | 網域層保持純淨，不依賴基礎設施 |
| Shared 不可包含商業邏輯 | Shared must not contain business logic | 共用模組只包含通用功能，不含業務邏輯 |
| Supabase Client 只能在 Repository | Supabase Client allowed only in Repository | Supabase 客戶端僅在儲存庫層使用 |

---

## 🔄 狀態管理

| 中文 | English | 說明 |
|------|---------|------|
| 狀態管理分層原則 | State Management Layering Principles | 狀態管理遵循分層架構原則 |
| 門面暴露可觀察資料 | Facade exposes observable data | 門面層提供可觀察的資料流給 UI |
| Store 操作必須由 Facade 執行 | Store operations must go through Facade | 所有 Store 操作需透過門面層進行 |
| 元件不可直接操作 Store | Components must not directly operate Store | UI 元件不能直接存取或修改 Store |
| 事件驅動資料流 | Event-driven data flow | 使用事件驅動方式管理資料流動 |
| 狀態層 | Store Layer | 使用 Angular Signals 管理狀態的層級 |
| 服務層處理業務流程 | Services handle workflow, not UI | 服務層專注業務流程，不處理 UI 邏輯 |

---

## ❌ 錯誤處理與映射

| 中文 | English | 說明 |
|------|---------|------|
| 全域錯誤處理器 | Global Error Handler | 統一處理應用程式層級的錯誤 |
| HTTP 拦截器 | HTTP Interceptor | 攔截 HTTP 請求與回應，統一處理錯誤 |
| 錯誤映射流程 | Error Mapping Flow | 將不同層級的錯誤轉換為適當格式 |
| Supabase Error → Domain Error → UI Error | Supabase Error → Domain Error → UI Error | 錯誤從後端到前端的轉換流程 |
| RLS 被拒錯誤處理 | RLS Rejection Error Handling | 處理行級安全拒絕存取的特殊錯誤情況 |

---

## 🔐 環境管理與密鑰安全

| 中文 | English | 說明 |
|------|---------|------|
| 多環境設定 | Multi-environment configuration | 支援開發、測試、生產等多環境配置 |
| Build 時注入金鑰 | Inject keys at build time | 敏感資訊在建置時注入，不寫入程式碼 |
| anon key 不可放在程式碼中 | anon key must not be stored in code | 匿名金鑰需透過環境變數管理，避免洩漏 |
| MCP schema / dto 版本管理 | MCP schema/dto versioning | MCP 相關的 schema 與 DTO 需進行版本控制 |
| 集中式 Config 管理 | Centralized configuration management | 統一管理所有配置資訊，便於維護 |

---

## 📦 匯出規範

| 中文 | English | 說明 |
|------|---------|------|
| Barrel File 匯出規範 | Barrel File Export Rules | 使用 index.ts 統一管理模組匯出 |
| 公開介面邊界 | Public API Boundary | 明確定義模組對外公開的介面 |
| Domain 只能匯出 index.ts | Domain must expose only index.ts | 網域模組僅透過 index.ts 對外暴露 |
| Feature 僅公開 Facade | Feature exposes only Facade | 功能模組只公開門面層，隱藏內部實作 |
| Infrastructure 不可匯出 Repository | Infrastructure must not expose Repository | 基礎設施層不直接暴露儲存庫實作 |

---

## 📘 相關文件

| 中文 | English | 說明 |
|------|---------|------|
| 藍圖功能缺口分析 | Blueprint Gap Analysis | 分析藍圖功能實作缺口與待辦事項 |
| 共享上下文 | Shared Context | 專案共享的上下文資訊與知識庫 |
| 企業級開發指南 | Angular Enterprise Development Guidelines | Angular 企業級開發規範與最佳實務 |
| 日誌設計指南 | diary-design.md | 施工日誌功能的設計文件 |
| 待辦設計指南 | todo-design.md | 待辦功能模組的設計文件 |
| 當前任務文件 | TASK_NOW.md | 記錄當前進行中的任務與狀態 |

---

## 🧑‍💻 UI 與業務實作

| 中文 | English | 說明 |
|------|---------|------|
| 藍圖建立按鈕缺失 | Missing "Create Blueprint" button | 藍圖列表頁面缺少建立新藍圖的按鈕 |
| 任務 CRUD 實作 | Task CRUD implementation | 任務的建立、讀取、更新、刪除功能實作 |
| 企業級 @delon/form modal | Enterprise-standard @delon/form modal | 使用 @delon/form 建立符合企業標準的表單彈窗 |
| 依據專案命名規範開發 | Follow project naming conventions | 開發時需遵循專案既定的命名規範 |
| 不做任何修改，先分析問題 | Analyze first, modify later | 遇到問題時先分析，確認後再進行修改 |

---

## 🏗️ 系統架構層級

| 中文 | English | 說明 |
|------|---------|------|
| 身份認證層 | Authentication Layer | 處理使用者身份驗證的系統層級 |
| 權限控制層 | Permission Control Layer | 管理使用者權限與存取控制的層級 |
| 專案藍圖層 | Project Blueprint Layer | 管理專案藍圖的業務邏輯層 |
| 任務執行模組 | Task Execution Module | 處理任務建立、更新、執行等核心功能 |
| 異常處理模組 | Exception Handling Module | 統一處理系統異常與錯誤的模組 |
| 協作溝通模組 | Collaboration & Communication Module | 提供協作與溝通功能的模組 |
| 資料分析模組 | Data Analysis Module | 提供資料分析與報表功能的模組 |
| 系統管理模組 | System Management Module | 系統設定與管理功能的模組 |
| Supabase 核心服務 | Supabase Core Services | 封裝 Supabase 核心功能的服務層 |

---

## 🎯 業務領域概念

| 中文 | English | 說明 |
|------|---------|------|
| 工地施工進度追蹤管理系統 | Construction Site Management System | 本系統的核心業務領域 |
| 工作區上下文切換 | Workspace Context Switching | 在不同工作區（個人/組織）間切換上下文 |
| 藍圖邏輯容器 | Blueprint Logic Container | 藍圖作為業務邏輯的邊界容器 |
| 主分支 | Main Branch | 專案的主要分支，類似 Git 主分支概念 |
| 組織分支 | Organization Branch | 組織層級的分支，可包含多個專案 |
| Fork 機制 | Fork Mechanism | 分支複製機制，用於專案衍生 |
| Pull Request | Pull Request (PR) | 分支合併請求，用於審查與整合 |
| 承攬關係 | Contractor Relationship | 承包商與發包方的業務關係 |
| 任務樹狀結構 | Task Tree Structure | 任務以樹狀結構組織，支援父子關係 |
| 任務膠囊狀態 | Task Capsule Status | 任務的封裝狀態，包含完整資訊 |
| 暫存區 | Staging Area | 任務完成後暫存，等待驗收的區域 |
| 48 小時可撤回 | 48-hour Reversible Period | 任務完成後 48 小時內可撤回 |
| 每日施工日誌 | Daily Construction Diary | 記錄每日施工狀況的日誌功能 |
| 品質驗收 | Quality Acceptance | 任務完成後的品質驗收流程 |
| 品質檢查清單 | Quality Checklist | 驗收時使用的檢查項目清單 |
| 問題追蹤 | Issue Tracking | 追蹤與管理施工過程中的問題 |
| 跨分支同步 | Cross-branch Synchronization | 不同分支間的資料同步機制 |
| 討論區 | Discussion Forum | 提供專案討論與協作的論壇功能 |
| 通知中心 | Notification Center | 集中管理所有通知訊息的中心 |
| 待辦中心 | Todo Center | 管理待辦事項的中心 |
| 五狀態分類 | Five Status Categories | 任務的五種狀態分類系統 |
| 活動記錄 | Activity Log | 記錄系統中所有活動的日誌 |
| 文件管理 | Document Management | 管理專案相關文件的系統 |
| 版本控制 | Version Control | 文件與資料的版本管理機制 |
| 軟刪除 | Soft Delete | 標記刪除而非實際刪除資料 |
| 圖片縮圖 | Image Thumbnail | 為上傳圖片自動生成縮圖 |

---

## 👥 角色與權限

| 中文 | English | 說明 |
|------|---------|------|
| 平台層級角色 | Platform-level Roles | 系統平台層級的角色定義 |
| 藍圖層級角色 | Blueprint-level Roles | 專案藍圖層級的角色定義 |
| 超級管理員 | Super Admin | 擁有系統最高權限的管理員 |
| 組織擁有者 | Organization Owner | 組織的擁有者，擁有組織最高權限 |
| 組織管理員 | Organization Admin | 組織的管理員，可管理組織設定 |
| 一般用戶 | User | 系統的一般使用者 |
| 專案經理 | Project Manager | 負責專案管理的角色 |
| 工地主任 | Site Director | 負責工地現場管理的角色 |
| 施工人員 | Worker | 執行施工任務的人員 |
| 品管人員 | QA Staff | 負責品質檢查與驗收的人員 |
| 觀察者 | Observer | 僅能查看，無法修改的觀察者角色 |
| 自訂角色 | Custom Role | 可自訂權限的彈性角色 |
| 權限存取矩陣 | Permission Access Matrix | 定義角色與權限對應關係的矩陣 |

---

## 🔧 技術架構組件

| 中文 | English | 說明 |
|------|---------|------|
| Vertical Slice Architecture | Vertical Slice Architecture | 垂直切片架構，適用於功能模組 |
| 邏輯容器 | Logic Container | 封裝業務邏輯的容器元件 |
| Shell Component | Shell Component | 智慧型元件，負責資料與邏輯處理 |
| 資料隔離 | Data Isolation | 不同模組間的資料隔離機制 |
| 上下文共享 | Context Sharing | 在模組間共享上下文資訊 |
| 多模組擴展 | Multi-module Extension | 支援多個模組擴展的架構設計 |
| 工作區上下文切換器 | Workspace Context Switcher | 切換不同工作區上下文的元件 |
| 個人工作區 | Personal Workspace (USER) | 使用者個人的工作區 |
| 組織工作區 | Organization Workspace | 組織層級的工作區 |
| 團隊工作區 | Team Workspace | 團隊專屬的工作區 |
| 機器人工作區 | Bot Workspace | 機器人自動化任務的工作區 |
| 藍圖 Shell | Blueprint Shell | 藍圖功能的 Shell 元件 |
| 任務樹狀圖 | Task Tree View | 以樹狀結構顯示任務的視圖 |
| 任務表格視圖 | Task Table View | 以表格形式顯示任務的視圖 |
| 視圖切換 | View Switching | 在不同視圖間切換的功能 |
| 日誌列表 | Diary List | 顯示施工日誌的列表元件 |
| 待辦列表 | Todo List | 顯示待辦事項的列表元件 |

---

## 📊 資料與狀態

| 中文 | English | 說明 |
|------|---------|------|
| 任務狀態 | Task Status | 任務當前的狀態標記 |
| 待處理 | Pending / TODO | 任務已建立但尚未開始 |
| 進行中 | In Progress | 任務正在執行中 |
| 暫存中 | Staging | 任務完成，暫存等待驗收 |
| 品管中 | In QA | 任務進入品質檢查階段 |
| 驗收中 | In Acceptance | 任務正在進行驗收流程 |
| 已完成 | Completed / Done | 任務已完成並通過驗收 |
| 已取消 | Cancelled | 任務已被取消 |
| 任務優先級 | Task Priority | 任務的重要程度等級 |
| 最低/低/中/高/最高 | Lowest / Low / Medium / High / Highest | 優先級的五個等級 |
| 任務類型 | Task Type | 任務的分類類型 |
| 任務/里程碑/錯誤/功能/改進 | Task / Milestone / Bug / Feature / Improvement | 任務類型的具體分類 |
| 進度百分比 | Progress Percentage | 任務完成的百分比進度 |
| 完工圖片 | Completion Photos | 任務完成時上傳的圖片 |
| 任務指派 | Task Assignment | 將任務指派給特定人員 |
| 負責人 | Assignee | 任務的主要負責人 |
| 協作人員 | Collaborators | 參與任務協作的人員 |

---

## 🔄 工作流程

| 中文 | English | 說明 |
|------|---------|------|
| 任務建立 | Task Creation | 建立新任務的流程 |
| 任務更新 | Task Update | 更新任務資訊的流程 |
| 任務刪除 | Task Deletion | 刪除任務的流程（通常為軟刪除） |
| 任務拖拉排序 | Task Drag & Drop Sorting | 透過拖拉方式調整任務順序 |
| 進度更新 | Progress Update | 更新任務進度的操作 |
| 進度自動彙總 | Automatic Progress Aggregation | 子任務進度自動彙總到父任務 |
| 進度儀表板 | Progress Dashboard | 顯示整體進度的儀表板 |
| 計劃 vs 實際進度 | Planned vs Actual Progress | 比較計劃與實際進度的功能 |
| 里程碑追蹤 | Milestone Tracking | 追蹤專案里程碑的達成狀況 |
| 進度風險預警 | Progress Risk Alert | 當進度落後時發出預警 |
| 驗收流程 | Acceptance Process | 任務完成後的驗收流程 |
| 驗收申請 | Acceptance Request | 申請進行驗收的操作 |
| 驗收判定 | Acceptance Judgment | 驗收人員判定驗收結果 |
| 通過/不通過/有條件通過 | Passed / Failed / Conditional Pass | 驗收結果的三種狀態 |
| 串驗收 | Chain Acceptance | 多個任務串聯的驗收流程 |
| 問題開立 | Issue Creation | 建立問題追蹤單 |
| 問題指派 | Issue Assignment | 將問題指派給處理人員 |
| 問題處理 | Issue Handling | 處理問題的流程 |
| 問題關閉 | Issue Closure | 關閉已解決的問題 |

---

## 📁 檔案與儲存

| 中文 | English | 說明 |
|------|---------|------|
| Supabase Storage | Supabase Storage | Supabase 提供的物件儲存服務 |
| Storage Buckets | Storage Buckets | 儲存桶，用於組織檔案 |
| 檔案上傳 | File Upload | 上傳檔案到儲存系統 |
| 批次上傳 | Batch Upload | 一次上傳多個檔案 |
| 檔案分類 | File Classification | 對檔案進行分類管理 |
| 檔案標籤 | File Tags | 為檔案添加標籤以便搜尋 |
| 資料夾結構 | Folder Structure | 檔案的資料夾組織結構 |
| 檔案版本控制 | File Version Control | 管理檔案的不同版本 |
| 檔案預覽 | File Preview | 在瀏覽器中預覽檔案內容 |
| 存取權限控制 | Access Permission Control | 控制檔案的存取權限 |
| 下載記錄追蹤 | Download Record Tracking | 記錄檔案的下載歷史 |
| CDN 加速 | CDN Acceleration | 使用 CDN 加速檔案存取 |
| 自動縮圖生成 | Automatic Thumbnail Generation | 上傳圖片時自動生成縮圖 |
| 大檔案分片上傳 | Large File Chunk Upload | 將大檔案分片後上傳 |
| EXIF 資訊 | EXIF Information | 圖片檔案的 EXIF 元資料 |
| 照片壓縮 | Image Compression | 上傳前壓縮照片以節省空間 |
| 離線暫存 | Offline Cache | 離線時暫存檔案資料 |

---

## 🔔 通知與協作

| 中文 | English | 說明 |
|------|---------|------|
| 即時通知 | Real-time Notification | 使用 WebSocket 即時推送通知 |
| 站內通知 | In-app Notification | 應用程式內的通知訊息 |
| Email 通知 | Email Notification | 透過電子郵件發送通知 |
| 推播通知 | Push Notification | 瀏覽器推播通知 |
| 通知規則 | Notification Rules | 定義通知觸發的規則 |
| 通知訂閱 | Notification Subscription | 使用者訂閱特定通知類型 |
| 已讀管理 | Read Status Management | 管理通知的已讀/未讀狀態 |
| 留言功能 | Comment Function | 在任務或討論中留言 |
| 巢狀回覆 | Nested Reply | 支援多層級的留言回覆 |
| @提及功能 | @Mention Function | 使用 @ 提及特定使用者 |
| 即時訊息 | Real-time Message | 即時通訊功能 |
| Realtime 廣播 | Realtime Broadcast | 使用 Supabase Realtime 廣播訊息 |
| 已讀狀態 | Read Status | 訊息的已讀狀態標記 |

---

## 📈 報表與分析

| 中文 | English | 說明 |
|------|---------|------|
| 進度報表 | Progress Report | 顯示專案進度狀況的報表 |
| 品質報表 | Quality Report | 顯示品質檢查結果的報表 |
| 工時報表 | Work Hours Report | 統計工作時數的報表 |
| 統計報表 | Statistical Report | 各種統計數據的報表 |
| 報表匯出 | Report Export | 將報表匯出為檔案 |
| PDF 格式 | PDF Format | 以 PDF 格式匯出報表 |
| Excel 格式 | Excel Format | 以 Excel 格式匯出報表 |
| 報表排程 | Report Scheduling | 定期自動產生報表 |
| 報表訂閱 | Report Subscription | 訂閱特定報表定期接收 |
| 數據分析 | Data Analysis | 對專案數據進行分析 |
| 圖表視覺化 | Chart Visualization | 以圖表方式呈現數據 |
| 分析快取 | Analytics Cache | 快取分析結果以提升效能 |
| 預計算報表 | Pre-computed Report | 預先計算報表數據 |
| 多層級聚合 | Multi-level Aggregation | 多層級的數據聚合計算 |

---

## ⚙️ 系統管理

| 中文 | English | 說明 |
|------|---------|------|
| 系統設定 | System Settings | 系統層級的設定選項 |
| 全域設定 | Global Settings | 應用程式全域的設定 |
| 專案設定 | Project Settings | 專案層級的設定 |
| 個人偏好 | Personal Preferences | 使用者的個人偏好設定 |
| 功能開關 | Feature Flags | 控制功能啟用/停用的開關 |
| 灰度發布 | Gray Release | 逐步釋出新功能給部分使用者 |
| A/B 測試 | A/B Testing | 同時測試不同版本的功能 |
| 天氣整合 | Weather Integration | 整合天氣資訊到日誌系統 |
| 機器人系統 | Bot System | 自動化機器人系統 |
| 定期報表機器人 | Scheduled Report Bot | 定期產生報表的機器人 |
| 通知機器人 | Notification Bot | 自動發送通知的機器人 |
| 備份機器人 | Backup Bot | 自動執行備份的機器人 |
| 任務佇列 | Task Queue | 管理背景任務的佇列 |
| 執行日誌 | Execution Log | 記錄系統執行的日誌 |
| 備份還原 | Backup & Restore | 資料備份與還原功能 |
| 自動化備份 | Automated Backup | 自動執行備份的機制 |

---

## 🌐 Supabase 服務

| 中文 | English | 說明 |
|------|---------|------|
| PostgreSQL Database | PostgreSQL Database | Supabase 基於 PostgreSQL 資料庫 |
| 關聯式資料庫 | Relational Database | 使用關聯式資料庫模型 |
| ACID 保證 | ACID Guarantee | 保證資料交易的 ACID 特性 |
| 索引優化 | Index Optimization | 透過索引優化查詢效能 |
| Foreign Keys | Foreign Keys | 外鍵約束確保資料完整性 |
| Database Triggers | Database Triggers | 資料庫觸發器自動執行邏輯 |
| Materialized Views | Materialized Views | 物化視圖提升查詢效能 |
| Supabase Storage | Supabase Storage | Supabase 提供的物件儲存服務 |
| 物件儲存 | Object Storage | 用於儲存檔案與媒體 |
| Bucket 管理 | Bucket Management | 管理儲存桶的設定與權限 |
| 存取控制 | Access Control | 控制儲存桶的存取權限 |
| Realtime | Realtime | Supabase 即時資料同步服務 |
| WebSocket 連接 | WebSocket Connection | 透過 WebSocket 建立即時連接 |
| Database 變更訂閱 | Database Change Subscription | 訂閱資料庫變更事件 |
| Broadcast 廣播 | Broadcast | 廣播訊息給所有連線用戶 |
| Presence 狀態 | Presence Status | 追蹤使用者的在線狀態 |
| Edge Functions | Edge Functions | Supabase 邊緣函數服務 |
| Deno Runtime | Deno Runtime | 使用 Deno 執行環境 |
| 無伺服器運算 | Serverless Computing | 無需管理伺服器的運算模式 |
| 第三方 API 整合 | Third-party API Integration | 整合第三方 API 服務 |
| 背景任務 | Background Task | 執行背景處理任務 |

---

## 🎨 開發理念與原則

| 中文 | English | 說明 |
|------|---------|------|
| 奧卡姆剃刀原則 | Occam's Razor Principle | 保持簡單，避免不必要複雜 |
| 功能最小化 | Feature Minimization | 只做必要功能，避免膨脹 |
| 企業標準 | Enterprise Standard | 遵循企業級規範和最佳實務 |
| 易於擴展 | Easy to Extend | 模組可靈活擴展與延伸 |
| 避免冗餘 | Avoid Redundancy | 消除重複功能與資料以降低維護成本 |
| 藍圖是邏輯容器 | Blueprint is Logic Container | 藍圖負責承載業務邏輯與邊界 |
| 任務是主核心模組 | Task is Core Module | 任務模組為系統主要功能單元 |
| 其他模組依附任務 | Other Modules Depend on Tasks | 周邊模組應以任務為依賴中心 |
| 上下文層層傳遞 | Context Passed Layer by Layer | 上下文訊息以明確界面逐層傳遞 |
| 零認知開發 | Zero Cognitive Development | 降低開發者認知負擔，簡化使用介面與 API |
| 高內聚低耦合 | High Cohesion, Low Coupling | 模組內部功能緊密，高內聚；模組間依賴小 |
| 單一責任原則 | Single Responsibility Principle | 每個模組/物件只負責單一職責，便於測試與維護 |
| 可觀察性 | Observability | 系統狀態可追蹤、日誌與度量清楚，便於診斷 |
| 安全優先 | Security First | 認證、授權與資料保護為設計核心考量 |
| 企業標準+生產水平 | Enterprise Standard + Production Level | 適合生產環境的企業級標準與可運維性 |

---

**最後更新**：2025-01-20
