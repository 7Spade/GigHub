# SaaS 多租戶實作摘要 (SaaS Multi-Tenancy Implementation Summary)

## 概述 (Overview)
本實作為 GigHub 專案添加基於 Firebase 的 SaaS 多租戶支援，允許用戶在不同工作區上下文之間切換：使用者 (User)、組織 (Organization)、團隊 (Team) 和機器人 (Bot)。

## 核心元件 (Key Components)

### 1. 核心型別 (Core Types) (`src/app/core/types/account.types.ts`)
定義所有 SaaS 相關的型別定義：
- **ContextType**: 工作區上下文類型的列舉 (USER, ORGANIZATION, TEAM, BOT)
- **Account, Organization, Team, Bot**: 核心實體介面
- **OrganizationRole, TeamRole**: 存取控制的角色列舉
- **ContextState**: 當前工作區上下文狀態的介面

### 2. WorkspaceContextService (`src/app/shared/services/workspace-context.service.ts`)
管理工作區上下文的集中式服務：
- **反應式狀態管理 (Reactive State Management)**: 使用 Angular Signals 實現細粒度反應性
- **Firebase 整合 (Firebase Integration)**: 與 FirebaseAuthService 整合以同步認證狀態
- **模擬資料 (Mock Data)**: 提供示範組織和團隊用於展示目的
- **LocalStorage 持久化 (LocalStorage Persistence)**: 跨會話保存和恢復上下文
- **上下文切換方法 (Context Switching Methods)**: 
  - `switchToUser(userId)`
  - `switchToOrganization(organizationId)`
  - `switchToTeam(teamId)`
  - `switchToBot(botId)`

#### 當前模擬資料結構 (Current Mock Data Structure)
```
User Account (from Firebase Auth)
  ├─ Organization: 示範組織 A
  │  ├─ Team: 開發團隊
  │  └─ Team: 設計團隊
  ├─ Organization: 示範組織 B
  │  └─ Team: 營運團隊
  └─ Bot: 自動化機器人
```

### 3. HeaderContextSwitcherComponent (`src/app/layout/basic/widgets/context-switcher.component.ts`)
用於上下文切換的 UI 元件：
- **階層顯示 (Hierarchical Display)**: 顯示使用者帳戶、帶有巢狀團隊的組織和機器人
- **視覺反饋 (Visual Feedback)**: 高亮顯示當前選定的上下文
- **最小模板 (Minimal Template)**: 僅渲染選單項目以便嵌入到父容器中
- **圖標 (Icons)**: 使用 ng-zorro-antd 圖標進行視覺呈現

### 4. 布局整合 (Layout Integration) (`src/app/layout/basic/basic.component.ts`)
上下文切換器整合到側邊欄的使用者選單下拉列表中：
```
User Avatar Menu
  ├─ [切換工作區 Section]
  │  ├─ 個人帳戶 (User)
  │  ├─ 示範組織 A (with submenu)
  │  │  ├─ 示範組織 A
  │  │  ├─ 開發團隊
  │  │  └─ 設計團隊
  │  ├─ 示範組織 B (with submenu)
  │  │  ├─ 示範組織 B
  │  │  └─ 營運團隊
  │  └─ 自動化機器人 (Bot)
  ├─ [Divider]
  ├─ 個人中心
  └─ 個人設置
```

## 架構模式 (Architecture Patterns)

### 1. 基於 Signal 的反應性 (Signal-Based Reactivity)
實作全程使用 Angular Signals 以獲得最佳性能：
- 所有狀態都存儲在 signals 中
- 用於衍生資料的計算 signals（例如 `contextLabel`、`contextIcon`）
- 當上下文變更時自動更新 UI

### 2. 服務注入 (Service Injection)
- 使用 Angular 的 `inject()` 函式進行依賴注入
- 服務在根層級提供（`providedIn: 'root'`）
- 在整個應用程式中共享

### 3. 型別安全 (Type Safety)
- 所有型別都明確定義
- 用於上下文類型和角色的 TypeScript 列舉
- 所有實體形狀的介面

### 4. 持久層 (Persistence Layer)
- 上下文狀態使用鍵 `'workspace_context'` 持久化到 localStorage
- 在頁面重新載入時自動恢復
- 如果沒有保存的狀態則回退到使用者上下文

## 實作方法：最少程式碼 (Implementation Approach: Minimal Code)

遵循「最少代碼」的要求，本實作：

1. **重用現有模式 (Reuses Existing Patterns)**: 改編自示範模式但經過簡化
2. **模擬資料而非 API 呼叫 (Mock Data Instead of API Calls)**: 使用記憶體模擬資料來展示功能
3. **無需資料庫遷移 (No Database Migrations)**: 無需後端變更即可運作
4. **Firebase 相容 (Firebase Compatible)**: 與現有 FirebaseAuthService 整合
5. **獨立元件 (Standalone Components)**: 使用 Angular 20 的獨立元件模式

## 未來增強 (Future Enhancements)

要連接真實後端，您需要：

1. **替換模擬資料載入 (Replace Mock Data Loading)**: 
   ```typescript
   // 在 WorkspaceContextService 中，將 loadMockData() 替換為：
   async loadRealData(userId: string): Promise<void> {
     const orgs = await this.firestoreService.getUserOrganizations(userId);
     const teams = await this.firestoreService.getUserTeams(userId);
     const bots = await this.firestoreService.getUserBots(userId);
     
     this.organizationsState.set(orgs);
     this.teamsState.set(teams);
     this.botsState.set(bots);
   }
   ```

2. **添加 Firestore 集合 (Add Firestore Collections)**:
   - `organizations` 集合
   - `teams` 集合  
   - `bots` 集合
   - `organization_members` 集合
   - `team_members` 集合

3. **實作 RLS (Row Level Security)**:
   - 使用 Firebase 安全規則強制執行存取控制
   - 根據當前使用者的成員資格過濾資料

4. **添加上下文感知的資料過濾 (Add Context-Aware Data Filtering)**:
   ```typescript
   // 使用 contextAccountId 過濾資料
   const contextId = this.workspaceContext.contextId();
   const blueprints = await this.firestoreService
     .getBlueprints({ organizationId: contextId });
   ```

## 測試 (Testing)

測試本實作：

1. **登入 (Login)**: 使用 Firebase 認證登入
2. **開啟使用者選單 (Open User Menu)**: 點擊側邊欄中的使用者頭像
3. **查看上下文切換器 (View Context Switcher)**: 查看「切換工作區」部分
4. **切換上下文 (Switch Context)**: 點擊不同的組織、團隊或機器人
5. **驗證持久化 (Verify Persistence)**: 重新載入頁面並驗證上下文已恢復

## 技術決策 (Technical Decisions)

### 為什麼選擇 Signals 而非 RxJS？(Why Signals over RxJS?)
- 透過細粒度反應性獲得更好的性能
- 更簡單的狀態管理心智模型
- Angular 20 原生功能，無需外部依賴

### 為什麼使用模擬資料？(Why Mock Data?)
- 無需後端設置即可展示功能
- 允許前端開發獨立進行
- 後續輕鬆替換為真實 API 呼叫

### 為什麼選擇 Firebase 而非 Supabase？(Why Firebase Instead of Supabase?)
- 專案已使用 Firebase (@angular/fire)
- 更簡單的整合路徑
- 與現有認證服務保持一致性

## 檔案結構 (File Structure)

```
src/app/
├── core/
│   ├── types/
│   │   ├── account.types.ts     (NEW: SaaS 型別定義)
│   │   └── index.ts              (NEW)
│   └── index.ts                  (UPDATED: 匯出型別)
│
├── shared/
│   ├── services/
│   │   ├── workspace-context.service.ts  (NEW: 上下文管理)
│   │   └── index.ts                       (NEW)
│   └── index.ts                           (UPDATED: 匯出服務)
│
└── layout/
    └── basic/
        ├── widgets/
        │   └── context-switcher.component.ts  (NEW: UI 元件)
        └── basic.component.ts                 (UPDATED: 整合)
```

## 摘要 (Summary)

本實作提供完整的 SaaS 多租戶基礎，具備：
- ✅ 乾淨的型別定義
- ✅ 反應式狀態管理
- ✅ 上下文持久化
- ✅ 使用者友善的 UI
- ✅ 可擴展的架構
- ✅ 最小的程式碼足跡

系統已準備好進行示範，並可在需要時擴展以連接真實的 Firebase 後端。
