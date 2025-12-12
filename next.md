🔷 Blueprint 架構只有兩層：
🟦 (A) Platform Layer（平台層）——非 Domain
這層含：
1. Context Module（上下文模組）
Blueprint 設定
執行時上下文
狀態機配置
Domain 啟用設定
共用記憶體 Shared Memory
跨模組資料代理
2. Event / Automation Engine
Domain 間事件交換
Workflow 驅動
這一層是 讓其他 Domain 能運作的「運行系統層」。
不能被算成 Domain。

✔ Blueprint 只有 6～8 個「業務域（Business Domains）」
這些是真正的業務邏輯領域，例如：
1. Task Domain
2. Log Domain
3. Workflow Domain
4. QA Domain
5. Acceptance Domain
6. Finance Domain
7. Material Domain（選）
8. Safety / Communication（選）
✔ Context Module「不是 Domain」，而是 Domain 之上的平台層（Platform Layer）

它就像：
Task Domain 是一個 App
Finance Domain 是一個 App
QA Domain 是一個 App
Material Domain 是一個 App
Context Module 是 OS，所有 App 都跑在它上面

🟥 (B) Business Domains（業務域）——6～8 個
它們才是 Domain：
1. Task Domain
2. Log Domain
3. Workflow Domain
4. QA Domain
5. Acceptance Domain
6. Finance Domain
7. Material Domain（選）
8. Safety / Communication（選）
Domain = 業務範圍
Context = 不屬於任何業務，扣在 Domain 之外

> Context 是 Blueprint 的基礎層，不屬於任何 Domain；
Blueprint 的 Domain 依然是 6～8 個，不包含 Context。
🔶 Blueprint Logical Domains（建議 7 類）

下面是你的藍圖邏輯容器「應該自然擁有」的領域（Domain）：


---

1️⃣ Task Domain（任務域）
核心：所有行為的中心
包含：
任務（Task）
指派（Assignment）
狀態機（State Machine）
進度（Progress）
排程（Schedule）
---
2️⃣ Log / Activity Domain（日誌域）
用來追蹤變更與行為
包含：
操作紀錄（Activity Log）
系統事件（Event）
評論（Comment）
附件（Attachment）
（非常多模組會依賴這個）
---
3️⃣ Workflow / Process Domain（流程域）
負責所有可組態的流程
包含：
自訂流程（流程模組）
自定義狀態圖（State Machine）
自動化事件（Automation Trigger）
（Task、Finance、QA 都會用到）
---
4️⃣ QA Domain（品質控管域）
包含：
例行檢查（Checklist）
缺失紀錄（Issue）
缺失修復流程
現場巡檢（Inspection Log）
---
5️⃣ Acceptance Domain（驗收域）
與 QA 分開，因為流程完全不同
包含：
驗收申請
驗收審核
初驗 / 複驗
驗收結論（通過／不通過）
---
6️⃣ Finance Domain（財務域）
底下可多個子模組：
成本（Cost）
請款（Invoice）
付款（Payment）
預算（Budget）
帳務（Ledger）
財務域應該是「一個域」，不是一個模組。
---
7️⃣ Material / Asset Domain（材料/資產域）
包含：
材料管理
材料領用
出入庫
器具資產
損耗記錄
---
🔥 額外但常見（可選）Domain
以下是成熟後會增加的，但初期可不放：
---
8️⃣ Safety Domain（安全域）（可選）
安全巡檢
風險評估
事故通報
---
9️⃣ Communication / Message Domain（訊息域）（可選）
系統通知
群組訊息
任務提醒
可拆出去效果會更乾淨。
---
0️⃣ Shared Domain（共享域）
不算一個獨立業務域，是 infra：
使用者
權限
組織 / 僱主
Team / Bot
Blueprint metadata
---
📌 最佳推薦組合（給你最穩的架構）
Blueprint Domain	是否必要	用途
Task Domain	必要	任務核心
Log Domain	必要	系統追蹤
Workflow Domain	必要	狀態、流程、事件
QA Domain	必要	品管
Acceptance Domain	必要	驗收
Finance Domain	必要	請款、成本、支付
Material Domain	推薦	材料與資產
Safety Domain	可選	安全巡檢
Communication Domain	可選	通知、訊息
---
🎯 Blueprint Domain 應該做成什麼形狀？
Blueprint 是「邏輯容器」
→ 它下面應該長這樣：
Blueprint
 ├── domains/
 │    ├── task/
 │    ├── workflow/
 │    ├── log/
 │    ├── qa/
 │    ├── acceptance/
 │    ├── finance/
 │    ├── material/
 │    ├── safety/ (optional)
 │    └── communication/ (optional)
 ├── config/
 │    ├── states.json
 │    ├── workflow.json
 │    └── permissions.json
 ├── context/
 └── events/
Task module（任務）
Log module（紀錄）
Workflow module（狀態機）
Context module（上下文）
Notification module（事件通知）
QA module（品管）
Acceptance module（驗收)
可擴展模組（Extension Modules）
Material Check module（材料檢驗）
Safety module（安全巡檢）

